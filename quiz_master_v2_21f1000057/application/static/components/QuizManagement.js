export default {
    template: `
    <div class="quiz-management">
        <!-- Navigation Bar -->
        <nav class="navbar navbar-expand-lg pastel-navbar shadow-sm">
            <div class="container-fluid">
                <span class="navbar-brand fs-4 fw-bold text-white"><i class="bi bi-clipboard-check"></i> Quiz Management</span>
                <ul class="navbar-nav me-auto">
                    <li class="nav-item"><router-link class="nav-link" to="/admin"><i class="bi bi-house-door"></i> Home</router-link></li>
                    <li class="nav-item"><router-link class="nav-link" to="/quiz-management"><i class="bi bi-file-earmark-text"></i> Quiz</router-link></li>
                    <li class="nav-item"><router-link class="nav-link" to="/summary"><i class="bi bi-bar-chart"></i> Summary</router-link></li>
                </ul>
                <button class="btn btn-danger fw-semibold" @click="logout"><i class="bi bi-box-arrow-right"></i> Logout</button>
            </div>
        </nav>

        <!-- Page Title -->
        <div class="container mt-4">
            <h2 class="text-center fw-bold">
                <i class="bi bi-clipboard-check text-danger"></i> Quiz Dashboard  
            </h2>
            <p class="text-center text-muted">Create, edit, and manage your quizzes effortlessly.</p>
        </div>
         <!-- Add Quiz Button -->
        <div class="container mt-4 text-center">
            <router-link to="/add-quiz" class="btn btn-success fw-bold">
                <i class="bi bi-plus-circle"></i> Add Quiz
            </router-link>
        </div>
        <!-- Search Bar -->
        <div class="container mt-4">
            <div class="search-container position-relative">
                <input v-model="searchQuery" class="form-control pastel-input search-bar pe-5" placeholder="Search quizzes by chapter, subject, or question title...">
                <i class="bi bi-search position-absolute top-50 translate-middle-y end-0 me-3 text-muted"></i>
            </div>
        </div>

        <!-- Quiz Cards -->
        <div class="container mt-4">
            <div v-if="filteredQuizzes.length === 0" class="text-center text-muted fw-bold">
                <i class="bi bi-exclamation-circle"></i> No quizzes found matching your search.
            </div>
            <div class="row row-cols-1 row-cols-md-1 row-cols-lg-2 g-4">  
                <div v-for="quiz in filteredQuizzes" :key="quiz.id" class="col">
                <div class="card shadow-lg quiz-card pastel-card" :style="{ minHeight: (quiz.questions.length * 50 + 200) + 'px' }">
                        <div class="card-body">
                            <!-- Quiz Header with Actions -->
                            <div class="d-flex justify-content-between align-items-center quiz-header p-3 rounded" style="background-color: #A8E6CF;">
                                <h5 class="card-title fw-bold mb-0 text-purple">
                                    <router-link :to="'/quiz-details/' + quiz.id" class="text-decoration-none text-purple">
                                        {{ quiz.subject_name }} <span class="text-muted">| {{ quiz.chapter_name }}</span>
                                    </router-link>
                                </h5>
                                <div class="action-icons d-flex">
                                    <i class="bi bi-trash text-danger action-icon" @click="deleteQuiz(quiz.id)" role="button" title="Delete"></i>
                                </div>
                            </div>

                            <!-- Quiz Info Table -->
                            <div class="quiz-info mt-3 px-3 py-2 rounded text-muted small" style="background-color:#F8C8DC;">
                                <table class="table table-sm text-center">
                                    <thead>
                                        <tr>
                                            <th class="text-purple"><i class="bi bi-hash"></i> ID</th>
                                            <th class="text-purple"><i class="bi bi-book"></i> Title</th>
                                            <th class="text-purple"><i class="bi bi-tools"></i> Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="question in quiz.questions" :key="question.id">
                                            <td>{{ question.id }}</td>
                                            <td>{{ question.question_title }}</td>
                                            <td>
                                                <i class="bi bi-pencil-square text-primary me-2 action-icon" @click="editQuestion(quiz.id, question.id)" role="button" title="Edit"></i>
                                                <i class="bi bi-trash text-danger action-icon" @click="deleteQuestion(question.id)" role="button" title="Delete"></i>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- Add Questions Button -->
                            <div class="mt-4 text-center">
                                <router-link :to="'/add-questions/' + quiz.id" class="btn pastel-btn">
                                    <i class="bi bi-plus-circle"></i> Add Question
                                </router-link>
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
            searchQuery: ""
        };
    },

    computed: {
        filteredQuizzes() {
            return this.quizzes.filter(quiz =>
                quiz.subject_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                quiz.chapter_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                quiz.questions.some(q => q.question_title.toLowerCase().includes(this.searchQuery.toLowerCase()))
            );
        }
    },

    mounted() {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || user.role !== "Admin") {
            this.$router.push('/login');
        }
        this.fetchQuizzes();
    },

    methods: {
        logout() {
            localStorage.removeItem("user");
            this.$router.push('/login');
        },

        async fetchQuizzes() {
            try {
                const response = await fetch("/api/quizzes", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });

                if (response.ok) {
                    const quizzes = await response.json();

                    for (let quiz of quizzes) {
                        const questionResponse = await fetch(`/api/questions?quiz_id=${quiz.id}`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                        });

                        quiz.questions = questionResponse.ok ? await questionResponse.json() : [];
                    }

                    this.quizzes = quizzes;
                } else {
                    console.error("Failed to fetch quizzes");
                }
            } catch (error) {
                console.error("Error fetching quizzes:", error);
            }
        },

        async deleteQuiz(quizId) {
            if (!confirm("Are you sure you want to delete this quiz?")) return;

            try {
                const response = await fetch(`/api/quizzes/${quizId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });

                if (response.ok) {
                    alert("Quiz deleted successfully!");
                    this.fetchQuizzes();
                } else {
                    alert("Failed to delete quiz.");
                }
            } catch (error) {
                console.error("Error deleting quiz:", error);
            }
        },
        async deleteQuestion(questionId) {
            if (!confirm("Are you sure you want to delete this question?")) return;
        
            try {
                const response = await fetch(`/api/questions/${questionId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
        
                if (response.ok) {
                    alert("Question deleted successfully!");
                    this.fetchQuizzes(); // Refresh the quiz list to reflect changes
                } else {
                    alert("Failed to delete question.");
                }
            } catch (error) {
                console.error("Error deleting question:", error);
            }
        },              
        editQuestion(quizId, questionId) {
            this.$router.push(`/edit-question/${quizId}/${questionId}`);
        }
    }
};
