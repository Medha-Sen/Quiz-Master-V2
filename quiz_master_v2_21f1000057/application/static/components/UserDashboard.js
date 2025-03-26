export default {
  template: `
    <div class="user-dashboard">
        <!-- Navigation Bar -->
        <nav class="navbar navbar-expand-lg navbar-light bg-gradient shadow-sm">
            <div class="container-fluid">
                <span class="navbar-brand fs-4 fw-bold text-success"><i class="bi bi-person-circle"></i> User Dashboard</span>
                <ul class="navbar-nav me-auto">
                    <li class="nav-item"><router-link class="nav-link fw-semibold" to="/"><i class="bi bi-house-door"></i> Home</router-link></li>
                    <li class="nav-item">
                      <router-link class="nav-link fw-semibold" to="/score-summary">
                        <i class="bi bi-bar-chart-line"></i> Scores
                      </router-link>
                    </li>
                </ul>
                <button class="btn btn-warning fw-semibold me-2" @click="editProfile">
                    <i class="bi bi-pencil-square"></i> Edit Profile
                </button>

                <button class="btn btn-danger fw-semibold" @click="logout">
                    <i class="bi bi-box-arrow-right"></i> Logout
                </button>
            </div>
        </nav>
        <!-- Welcome Message -->
        <div class="container mt-4 text-center">
            <h2 class="fw-bold">Welcome Back Buddy!! <i class="bi bi-mortarboard"></i></h2>
            <p class="text-muted">Stay updated with your upcoming quizzes!</p>
        </div>
        <!-- Download Button -->
       <button class="btn btn-success mt-3" @click="downloadQuizHistory()">
        <i class="bi bi-download"></i> Download Quiz Attempt History
        </button>
        <!-- Search Bar -->
        <div class="container mt-4">
            <div class="input-group mb-3">
                <input type="text" class="form-control" v-model="searchQuery" placeholder="Search quizzes by chapter, subject, or keywords..." @input="filterQuizzes">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
            </div>
        </div>

        <!-- Upcoming Quizzes Section -->
        <div class="container mt-4">
            <h3 class="fw-bold text-primary"><i class="bi bi-clock-history"></i> Upcoming Quizzes</h3>

            <!-- Loading Indicator -->
            <div v-if="loading" class="text-center mt-3">
                <p>Loading quizzes...</p>
            </div>

            <!-- No quizzes available -->
            <div v-else-if="filteredQuizzes.length === 0" class="text-center mt-3">
                <h4 class="text-danger fw-bold"><i class="bi bi-exclamation-triangle"></i> 404 Not Found</h4>
                <p class="fs-5 text-muted">No quizzes match your search.</p>
            </div>

            <!-- Quizzes Display -->
            <div v-else class="row">
                <div v-for="quiz in filteredQuizzes" :key="quiz.id" class="col-md-6 mb-4">
                    <div class="card quiz-card shadow-sm">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <span><i class="bi bi-file-earmark-text"></i> {{ quiz.chapter_name }}</span>
                            <span class="badge bg-info text-dark">{{ quiz.subject_name }}</span>
                        </div>
                        <div class="card-body">
                            <p><strong>Date:</strong> {{ formatDate(quiz.date_of_quiz) }}</p>
                            <p><strong>Duration:</strong> {{ quiz.time_duration }} mins</p>
                            <p><strong>No. of questions:</strong> {{ quiz.no_of_questions }}</p>
                            <p class="text-muted">{{ quiz.remarks }}</p>
                            <div class="d-flex justify-content-between">
                                <button v-if="!isQuizExpired(quiz.date_of_quiz, quiz.time_duration)" class="btn btn-success" @click="attemptQuiz(quiz.id)">
                                    <i class="bi bi-play-circle"></i> Start Quiz
                                </button>
                                <button v-else class="btn btn-secondary" disabled>
                                    <i class="bi bi-lock"></i> Quiz Expired
                                </button>
                                <button class="btn btn-primary" @click="viewQuiz(quiz.id)">
                                    <i class="bi bi-eye"></i> View Scores
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `,

  data() {
    return {
      quizzes: [],
      filteredQuizzes: [],
      searchQuery: "",
      loading: true
    };
  },

  methods: {
    async fetchQuizzes() {
      try {
        console.log("Fetching quizzes...");
        const response = await fetch("http://127.0.0.1:5000/api/quizzes");
        const data = await response.json();
        console.log("Received quizzes:", data);

        if (Array.isArray(data)) {
          this.quizzes = data;
          this.filteredQuizzes = data; // Initialize filtered quizzes with all quizzes
        } else {
          console.error("Unexpected data format:", data);
        }
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        this.loading = false;
      }
    },
    async downloadQuizHistory() {
      const user = JSON.parse(localStorage.getItem("user"));
    
      if (user && user.id) {
        const downloadUrl = `/download_quiz_history/${user.id}`;
        console.log("Downloading from:", downloadUrl);
        window.location.href = downloadUrl;
    
        // Show a confirmation popup after a short delay
        setTimeout(() => {
          alert("✅ Quiz history download complete!");
        }, 1500);
      } else {
        console.error("User ID not found in localStorage!");
      }
    },      
    filterQuizzes() {
      const query = this.searchQuery.toLowerCase();
      if (!query) {
        this.filteredQuizzes = this.quizzes;
        return;
      }

      this.filteredQuizzes = this.quizzes.filter(quiz => 
        quiz.chapter_name.toLowerCase().includes(query) ||
        quiz.subject_name.toLowerCase().includes(query) ||
        quiz.remarks.toLowerCase().includes(query)
      );
    },

    formatDate(date) {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString("en-US", { 
        year: "numeric", month: "long", day: "numeric" 
      });
    },

    isQuizExpired(quizDate, duration) {
      const quizStartTime = new Date(quizDate);
      const quizEndTime = new Date(quizStartTime.getTime() + duration * 60000);
      return new Date() > quizEndTime;
    },

    viewQuiz(quizId) {
      console.log("Viewing scores for quiz:", quizId);
      this.$router.push(`/results/${quizId}`);
    },

    attemptQuiz(quizId) {
      console.log("Attempting quiz:", quizId);
      this.$router.push(`/attempt-quiz/${quizId}`);
    },

    editProfile() {
      console.log("Editing profile...");
      this.$router.push("/edit-profile");
    },

    logout() {
      localStorage.removeItem("user");
      this.$router.push('/login');
    },
  },
  mounted() {
    this.fetchQuizzes();  // Call the function

}

};
