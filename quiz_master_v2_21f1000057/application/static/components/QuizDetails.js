export default {
    template: `
    <div class="container mt-5">
        <!-- Loading Spinner -->
        <div v-if="loading" class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>

        <!-- Error Message -->
        <div v-else-if="error" class="alert alert-danger text-center">
            <i class="bi bi-exclamation-triangle-fill"></i> {{ error }}
        </div>

        <!-- Quiz Details Card -->
        <div v-else class="card shadow-lg p-4 quiz-details-card animated fadeIn">
            <div class="card-body">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h3 class="fw-bold text-primary">
                        <i class="bi bi-journal-text me-2"></i> Quiz Details
                    </h3>
                    <button v-if="!isEditing" class="btn btn-gradient-warning btn-sm px-3" @click="toggleEdit">
                        <i class="bi bi-pencil-square"></i> Edit
                    </button>
                </div>

                <hr class="text-muted">

                <!-- Display Mode -->
                <div v-if="!isEditing" class="details-view">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <h6><i class="bi bi-hash text-secondary"></i> <strong>ID:</strong> {{ quiz.id }}</h6>
                        </div>
                        <div class="col-md-6">
                            <h6><i class="bi bi-book text-secondary"></i> <strong>Subject:</strong> {{ quiz.subject_name }}</h6>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <h6><i class="bi bi-journal text-secondary"></i> <strong>Chapter:</strong> {{ quiz.chapter_name }}</h6>
                        </div>
                        <div class="col-md-6">
                            <h6><i class="bi bi-calendar-event text-secondary"></i> <strong>Date:</strong> {{ quiz.date_of_quiz }}</h6>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <h6><i class="bi bi-clock text-secondary"></i> <strong>Duration:</strong> {{ quiz.time_duration }} mins</h6>
                        </div>
                        <div class="col-md-6">
                            <h6><i class="bi bi-chat-left-text text-secondary"></i> <strong>Remarks:</strong> {{ quiz.remarks || 'No remarks' }}</h6>
                        </div>
                    </div>
                </div>

                <!-- Edit Mode -->
                <div v-else class="edit-view">
                    <div class="mb-3">
                        <label class="form-label fw-semibold"><i class="bi bi-calendar text-primary"></i> Date of Quiz</label>
                        <input type="date" class="form-control" v-model="editForm.date_of_quiz">
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-semibold"><i class="bi bi-clock text-primary"></i> Duration (minutes)</label>
                        <input type="number" class="form-control" v-model="editForm.time_duration">
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-semibold"><i class="bi bi-pencil text-primary"></i> Remarks</label>
                        <textarea class="form-control" v-model="editForm.remarks" rows="3"></textarea>
                    </div>

                    <!-- Save / Cancel Buttons -->
                    <div class="d-flex justify-content-end">
                        <button class="btn btn-outline-danger me-2" @click="toggleEdit">
                            <i class="bi bi-x-circle"></i> Cancel
                        </button>
                        <button class="btn btn-success btn-gradient-success" @click="saveChanges">
                            <i class="bi bi-check-circle"></i> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Back Button -->
        <div class="text-center mt-4">
            <router-link to="/quiz-management" class="btn btn-gradient-secondary px-4">
                <i class="bi bi-arrow-left"></i> Back to Dashboard
            </router-link>
        </div>
    </div>
    `,

    data() {
        return {
            quiz: {
                id: null,
                subject_name: "",
                chapter_name: "",
                date_of_quiz: "",
                time_duration: "",
                remarks: ""
            },  
            isEditing: false,  
            editForm: {},  
            loading: true,
            error: null
        };
    },

    mounted() {
        this.fetchQuizDetails();
    },

    methods: {
        async fetchQuizDetails() {
            this.loading = true;
            this.error = null;
            const quizId = this.$route.params.quizId;
            try {
                const response = await fetch(`/api/quizzes/${quizId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch quiz details.");
                }
                this.quiz = await response.json();
                this.editForm = { ...this.quiz };
            } catch (error) {
                this.error = error.message;
            } finally {
                this.loading = false;
            }
        },

        toggleEdit() {
            this.isEditing = !this.isEditing;
            if (!this.isEditing) {
                this.editForm = { ...this.quiz };
            }
        },

        async saveChanges() {
            try {
                const response = await fetch(`/api/quizzes/${this.quiz.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify(this.editForm)
                });

                if (!response.ok) {
                    throw new Error("Failed to update quiz.");
                }

                alert("Quiz updated successfully!");
                this.quiz = { ...this.editForm };
                this.isEditing = false;
            } catch (error) {
                alert(error.message);
            }
        }
    }
};
