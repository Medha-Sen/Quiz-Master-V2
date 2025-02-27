export default {
    template: `
    <div class="add-question">
        <!-- Navigation Bar -->
        <nav class="navbar navbar-expand-lg navbar-light lavender-navbar shadow-sm">
            <div class="container-fluid">
                <span class="navbar-brand fs-4 fw-bold text-purple">
                    <i class="bi bi-question-circle text-primary"></i> {{ isEditMode ? "Edit Question" : "Add a Question" }}
                </span>
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
                <i class="bi bi-question-circle text-primary"></i> {{ isEditMode ? "Edit Question" : "Add a Question" }}
            </h2>
            <p class="text-center text-muted">
                {{ isEditMode ? "Modify the question details below." : "Enter details for the new question." }}
            </p>
        </div>

        <!-- Question Form -->
        <div class="container mt-4">
            <div class="card shadow-sm p-4">
                <form @submit.prevent="submitQuestion">
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Question Title</label>
                        <input type="text" class="form-control" v-model="question_title" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-semibold">Question Statement</label>
                        <textarea class="form-control" v-model="question_statement" rows="3" required></textarea>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label fw-semibold">Option 1</label>
                            <input type="text" class="form-control" v-model="option1" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label fw-semibold">Option 2</label>
                            <input type="text" class="form-control" v-model="option2" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label fw-semibold">Option 3</label>
                            <input type="text" class="form-control" v-model="option3" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label fw-semibold">Option 4</label>
                            <input type="text" class="form-control" v-model="option4" required>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-semibold">Correct Option</label>
                        <select class="form-select" v-model="correct_option" required>
                            <option value="" disabled selected>Select the correct option</option>
                            <option value="1">Option 1</option>
                            <option value="2">Option 2</option>
                            <option value="3">Option 3</option>
                            <option value="4">Option 4</option>
                        </select>
                    </div>

                    <div class="text-center">
                        <button type="submit" class="btn btn-success px-4 fw-semibold">
                            <i class="bi bi-check-circle"></i> {{ isEditMode ? "Update Question" : "Submit Question" }}
                        </button>
                        <button type="button" class="btn btn-secondary ms-3 px-4 fw-semibold" @click="cancel">
                            <i class="bi bi-x-circle"></i> Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            quiz_id: this.$route.params.quizId, 
            question_id: this.$route.params.questionId || null, // Capture question ID
            question_title: "",
            question_statement: "",
            option1: "",
            option2: "",
            option3: "",
            option4: "",
            correct_option: "", 
            isEditMode: !!this.$route.params.questionId, // Check if editing
        };
    },

    async created() {
        if (this.isEditMode) {
            await this.fetchQuestionDetails();
        }
    },

    methods: {
        logout() {
            localStorage.removeItem("user");
            this.$router.push("/login");
        },

        cancel() {
            this.$router.push("/quiz-management");
        },

        async fetchQuestionDetails() {
            try {
                const response = await fetch(`/api/questions/${this.question_id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    this.question_title = data.question_title;
                    this.question_statement = data.question_statement;
                    this.option1 = data.option1;
                    this.option2 = data.option2;
                    this.option3 = data.option3;
                    this.option4 = data.option4;
                    this.correct_option = data.correct_option;
                } else {
                    alert("Failed to fetch question details.");
                }
            } catch (error) {
                console.error("Error fetching question details:", error);
            }
        },

        async submitQuestion() {
            if (!this.correct_option) {
                alert("Please select the correct option.");
                return;
            }

            const questionData = {
                quiz_id: this.quiz_id,
                question_title: this.question_title,
                question_statement: this.question_statement,
                option1: this.option1,
                option2: this.option2,
                option3: this.option3,
                option4: this.option4,
                correct_option: this.correct_option
            };

            try {
                let response;
                if (this.isEditMode) {
                    // Update existing question (PUT request)
                    response = await fetch(`/api/questions/${this.question_id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        },
                        body: JSON.stringify(questionData)
                    });
                } else {
                    // Create a new question (POST request)
                    response = await fetch("/api/questions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        },
                        body: JSON.stringify(questionData)
                    });
                }

                if (response.ok) {
                    alert(this.isEditMode ? "Question updated successfully!" : "Question added successfully!");
                    this.$router.push("/quiz-management");
                } else {
                    alert("Failed to save question.");
                }
            } catch (error) {
                console.error("Error saving question:", error);
            }
        }
    }
};
