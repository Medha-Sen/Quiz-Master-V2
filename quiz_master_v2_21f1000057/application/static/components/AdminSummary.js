export default {
    template: `
    <div class="score-summary">
      <!-- Navigation Panel -->
      <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-lg p-3">
        <div class="container-fluid d-flex justify-content-between">
          <span class="navbar-brand fs-4 fw-bold text-light">
            <i class="bi bi-trophy-fill"></i> Score Summary
          </span>
          <div>
            <router-link class="btn btn-outline-light me-2 px-4 py-2 fw-bold" to="/admin">
              <i class="bi bi-arrow-left-circle-fill"></i> Dashboard
            </router-link>
            <button class="btn btn-danger px-4 py-2 fw-bold" @click="logout">
              <i class="bi bi-box-arrow-right"></i> Logout
            </button>
          </div>
        </div>
      </nav>
      <!-- User Search Bar -->
      <div class="container mt-3 text-center">
        <input type="number" v-model="searchId" class="form-control w-50 d-inline-block" placeholder="Enter User ID">
        <button class="btn btn-primary ms-2" @click="searchUserById">
          Search
        </button>
        <p v-if="searchError" class="text-danger mt-2">{{ searchError }}</p>
      </div>
      <!-- Leaderboard Section -->
      <div class="container mt-5 text-center">
        <h3 class="fw-bold text-primary">
          <i class="bi bi-trophy-fill"></i> Quiz Leaderboard
        </h3>

        <div v-if="leaderboard.length > 0" class="leaderboard-container">
          <div 
            v-for="(user, index) in leaderboard" 
            :key="user.user_id" 
            class="leaderboard-card shadow-sm"
            :class="getRankClass(index)"
            @click="viewUserSummary(user.user_id)"
            style="cursor: pointer; background-color: white;"
          >
            <div class="rank-badge">{{ getRankIcon(index) }}</div>
            <div class="leaderboard-content">
              <h5 class="username fw-bold">{{ user.username }}</h5>
              <p class="score text-success fw-bold">Avg Score: {{ user.avg_score.toFixed(2) }}</p>
              <p class="attempts text-muted">Attempts: {{ user.num_attempts }}</p>
            </div>
          </div>
        </div>

        <div v-else class="mt-3">
          <p class="text-muted">Leaderboard is empty. Take a quiz to get ranked! 🎯</p>
        </div>
      </div>

      <!-- Charts Section -->
    <div class="container mt-5 chart-container">
    <h3 class="fw-bold text-primary">Quiz Statistics</h3>
    
    <div class="row">
        <div class="col-md-6">
        <h5 class="text-center text-secondary">Most Attempted Quizzes</h5>
        <canvas ref="quizChart"></canvas>
        </div>

        <div class="col-md-6">
        <h5 class="text-center text-secondary">Subject-wise Attempts</h5>
        <canvas ref="subjectChart"></canvas>
        </div>
    </div>
    </div>
    <!-- User Summary Section -->
    <div class="card mt-4">
      <div class="card-header bg-info text-white">User Summary</div>
      <div class="card-body">
        <table class="table table-bordered">
          <thead class="thead-dark">
            <tr>
              <th>User ID</th>
              <th>Email</th>
              <th>Full Name</th>
              <th>Qualification</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.full_name }}</td>
              <td>{{ user.qualification }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Quiz Summary Section -->
    <div class="card mt-4">
      <div class="card-header bg-warning text-white">Quiz Summary</div>
      <div class="card-body">
        <table class="table table-hover">
          <thead class="thead-light">
            <tr>
              <th>Quiz ID</th>
              <th>Subject</th>
              <th>Chapter</th>
              <th>Date</th>
              <th>Questions</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="quiz in quizzes" :key="quiz.id">
              <td>{{ quiz.id }}</td>
              <td>{{ quiz.subject_name }}</td>
              <td>{{ quiz.chapter_name }}</td>
              <td>{{ quiz.date_of_quiz }}</td>
              <td>{{ quiz.no_of_questions }}</td>
              <td>{{ quiz.time_duration }} mins</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
    `,

    data() {
      return {
        leaderboard: [],
        users: [],         // Initialize users array
        quizzes: [],  
        searchId: '',
        searchError: '', 
        quizAttempts: [],
        subjectAttempts: [],
        quizChartInstance: null,
        subjectChartInstance: null
      };
    },

    methods: {
      async fetchLeaderboard() {
        try {
          console.log("Fetching leaderboard...");
          const response = await fetch(`http://127.0.0.1:5000/api/leaderboard`);
          if (!response.ok) throw new Error(`Error: ${response.statusText}`);
          const data = await response.json();
          this.leaderboard = data.leaderboard || [];
        } catch (error) {
          console.error("Error fetching leaderboard:", error);
        }
      },
      searchUserById() {
        const userId = parseInt(this.searchId);
        const userExists = this.users.find(user => user.id === userId);

        if (userExists) {
          this.searchError = ''; 
          this.$router.push(`/user-summary/${userId}`);
        } else {
          this.searchError = 'User ID not found';
        }
      },
      viewUserSummary(user_id) {
        this.$router.push(`/user-summary/${user_id}`);
      },
      async fetchQuizStatistics() {
        try {
          const quizResponse = await fetch(`http://127.0.0.1:5000/api/stats/quiz-attempts`);
          const subjectResponse = await fetch(`http://127.0.0.1:5000/api/stats/subject-attempts`);
          
          if (!quizResponse.ok || !subjectResponse.ok) {
            throw new Error("Failed to fetch chart data.");
          }

          this.quizAttempts = await quizResponse.json();
          this.subjectAttempts = await subjectResponse.json();

          this.renderCharts();
        } catch (error) {
          console.error("Error fetching statistics:", error);
        }
      },

      renderCharts() {
        this.$nextTick(() => {
          if (!this.$refs.quizChart || !this.$refs.subjectChart) {
            console.error("Chart canvas elements not found!");
            return;
          }

          const quizCtx = this.$refs.quizChart.getContext("2d");
          const subjectCtx = this.$refs.subjectChart.getContext("2d");

          // Destroy previous chart instances if they exist
          if (this.quizChartInstance) this.quizChartInstance.destroy();
          if (this.subjectChartInstance) this.subjectChartInstance.destroy();

          // Render Most Attempted Quizzes Chart (Bar Chart)
          this.quizChartInstance = new Chart(quizCtx, {
            type: "bar",
            data: {
              labels: this.quizAttempts.map(q => q.quiz_name),
              datasets: [{
                label: "Number of Attempts",
                data: this.quizAttempts.map(q => q.attempts),
                backgroundColor: "rgba(54, 162, 235, 0.5)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              scales: {
                y: { beginAtZero: true }
              }
            }
          });

          // Render Subject-wise Attempts Chart (Pie Chart)
          this.subjectChartInstance = new Chart(subjectCtx, {
            type: "pie",
            data: {
              labels: this.subjectAttempts.map(s => s.subject_name),
              datasets: [{
                data: this.subjectAttempts.map(s => s.attempts),
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"]
              }]
            },
            options: {
              responsive: true
            }
          });
        });
      },
      async fetchUsers() {
        try {
          const response = await fetch('http://127.0.0.1:5000/api/users');
          if (!response.ok) throw new Error(`Error: ${response.statusText}`);
          this.users = await response.json();
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      },
      async fetchQuizzes() {
        try {
          const response = await fetch('http://127.0.0.1:5000/api/quizzes');
          if (!response.ok) throw new Error(`Error: ${response.statusText}`);
          this.quizzes = await response.json();
        } catch (error) {
          console.error('Error fetching quizzes:', error);
        }
      },  
      logout() {
        console.log("Logging out...");
        this.$router.push("/login");
      },

      viewUserSummary(user_id) {
        this.$router.push(`/user-summary/${user_id}`);
      },

      getRankClass(index) {
        return ["gold", "silver", "bronze"][index] || "normal";
      },

      getRankIcon(index) {
        return ["🥇", "🥈", "🥉"][index] || `#${index + 1}`;
      }
    },

    mounted() {
      this.fetchLeaderboard();
      this.fetchQuizStatistics();
      this.fetchUsers();
      this.fetchQuizzes();
    },

    beforeUnmount() {
      if (this.quizChartInstance) this.quizChartInstance.destroy();
      if (this.subjectChartInstance) this.subjectChartInstance.destroy();
    }
};
