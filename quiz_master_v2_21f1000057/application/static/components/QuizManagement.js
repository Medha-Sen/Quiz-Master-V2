export default {
    template: `
    <div class="quiz-management">
        <!-- Navigation Bar -->
        <nav class="navbar navbar-expand-lg navbar-light lavender-navbar shadow-sm">
            <div class="container-fluid">
                <span class="navbar-brand fs-4 fw-bold text-purple"><i class="bi bi-clipboard-check"></i> Quiz Management</span>
                <ul class="navbar-nav me-auto">
                    <li class="nav-item"><router-link class="nav-link fw-semibold" to="/admin"><i class="bi bi-house-door"></i> Home</router-link></li>
                    <li class="nav-item"><router-link class="nav-link fw-semibold" to="/quiz-management"><i class="bi bi-file-earmark-text"></i> Quiz</router-link></li>
                    <li class="nav-item"><router-link class="nav-link fw-semibold" to="/summary"><i class="bi bi-bar-chart"></i> Summary</router-link></li>
                </ul>
                <button class="btn btn-danger ms-3 fw-semibold" @click="logout"><i class="bi bi-box-arrow-right"></i> Logout</button>
            </div>
        </nav>

        <!-- Page Title -->
        <div class="container mt-4">
            <h2 class="text-center fw-bold text-purple">
                <i class="bi bi-clipboard-check text-primary"></i> Quiz Dashboard  
            </h2>
            <p class="text-center text-muted">Create, edit, and manage your quizzes effortlessly.</p>
        </div>


        <!-- Quiz Cards -->
        <div class="container mt-4">
            <div class="row">
                <div v-for="quiz in quizzes" :key="quiz.id" class="col-md-6 col-lg-4 mb-4">
                    <div class="card shadow-sm quiz-card p-3">
                        <div class="card-body">
                            <!-- Quiz Header with Actions -->
                            <div class="d-flex justify-content-between align-items-center quiz-header p-2 rounded" style="background-color: #A8E6CF; border-bottom: 2px solid #e0e0e0;">
                                <!-- Quiz Title -->
                                <h5 class="card-title fw-bold mb-0 text-success">
                                    <router-link :to="'/quiz-details/' + quiz.id" class="text-decoration-none text-purple">
                                        {{ quiz.subject_name }} <span class="text-muted">| {{ quiz.chapter_name }}</span>
                                    </router-link>
                                </h5>
                                <!-- Action Buttons -->
                                <div class="action-icons d-flex">
                                    <i class="bi bi-trash text-danger action-icon" @click="deleteQuiz(quiz.id)" role="button" title="Delete"></i>
                                </div>
                            </div>
                            <!-- Quiz Info Table -->
                            <div class="quiz-info mt-2 px-2 py-1 rounded text-muted small" 
                                style="background-color:#F8C8DC; border: 1px solid #e0e0e0;">
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
                                                <i class="bi bi-pencil-square text-primary me-2 action-icon" 
                                                @click="editQuestion(quiz.id, question.id)" role="button" title="Edit"></i>
                                                <i class="bi bi-trash text-danger action-icon" 
                                                @click="deleteQuestion(question.id)" role="button" title="Delete"></i>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <!-- Add Questions Button -->
                            <div class="mt-3 text-center">
                                <router-link :to="'/add-questions/' + quiz.id" class="btn btn-sm lavender-btn">
                                    <i class="bi bi-plus-circle"></i> Add Question
                                </router-link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- No quizzes message -->
            <div v-if="quizzes.length === 0" class="text-center mt-4">
                <p class="fs-5 text-muted">No quizzes available.</p>
            </div>

            <!-- Add Quiz Button -->
            <div class="text-center mt-3">
                <router-link to="/add-quiz" class="btn lavender-btn-lg">
                    <i class="bi bi-folder-plus"></i> Add New Quiz
                </router-link>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            quizzes: []
        };
    },

    mounted() {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || user.role !== "Admin") {
            this.$router.push('/login'); // Redirect if not an admin
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
        
                    // Fetch questions for each quiz
                    for (let quiz of quizzes) {
                        const questionResponse = await fetch(`/api/questions?quiz_id=${quiz.id}`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                        });
        
                        if (questionResponse.ok) {
                            quiz.questions = await questionResponse.json();
                        } else {
                            quiz.questions = [];
                        }
                    }
        
                    this.quizzes = quizzes;
                } else {
                    console.error("Failed to fetch quizzes");
                }
            } catch (error) {
                console.error("Error fetching quizzes:", error);
            }
        },
        

        editQuiz(quiz) {
            this.$router.push({
                path: `/edit-quiz/${quiz.id}`,
                query: {
                    quiz_id: quiz.id,
                    name: quiz.name,
                    chapter_id: quiz.chapter_id,
                    date: quiz.date_of_quiz,
                    duration: quiz.time_duration,
                    remarks: quiz.remarks
                }
            });
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
                    this.fetchQuizzes();
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
