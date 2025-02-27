export default {
    template: `
    <div class="container mt-5">
        <h2 class="text-center fw-bold text-primary">
            📝 {{ isEditing ? "Edit Quiz" : "Add New Quiz" }}
        </h2>
        <div class="card pastel-card shadow-lg p-4 rounded-4 border-0">
            <div class="mb-3">
                <label class="form-label fw-semibold">Chapter</label>
                <select v-model="quiz.chapter_id" class="form-select form-select-lg rounded-3">
                    <option value="" disabled>Select a chapter</option>
                    <option v-for="chapter in chapters" :key="chapter.id" :value="chapter.id">
                        {{ chapter.name }}
                    </option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label fw-semibold">Quiz Date</label>
                <input type="date" v-model="quiz.date_of_quiz" class="form-control form-control-lg rounded-3">
            </div>
            <div class="mb-3">
                <label class="form-label fw-semibold">Time Duration (minutes)</label>
                <input type="number" v-model="quiz.time_duration" class="form-control form-control-lg rounded-3"
                    placeholder="Enter duration in minutes">
            </div>
            <div class="mb-3">
                <label class="form-label fw-semibold">Remarks</label>
                <textarea v-model="quiz.remarks" class="form-control rounded-3"
                    placeholder="Enter remarks (optional)" rows="3"></textarea>
            </div>
            <div class="d-flex justify-content-end">
                <button class="btn btn-outline-secondary me-2 px-4 py-2 rounded-3" @click="cancel">Cancel</button>
                <button class="btn btn-primary px-4 py-2 rounded-3" :disabled="!quiz.chapter_id || !quiz.date_of_quiz || !quiz.time_duration"
                    @click="saveQuiz">
                    {{ isEditing ? "Update" : "Save" }}
                </button>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            quiz: {
                chapter_id: "",
                date_of_quiz: "",
                time_duration: "",
                remarks: ""
            },
            isEditing: false,
            quizId: null,
            chapters: [] // Store chapters for dropdown
        };
    },

    async mounted() {
        await this.fetchChapters(); // Load chapters on mount

        // Check if editing
        if (this.$route.query.id) {
            this.isEditing = true;
            this.quizId = this.$route.query.id;
            this.quiz.chapter_id = this.$route.query.chapter_id;
            this.quiz.date_of_quiz = this.$route.query.date_of_quiz;
            this.quiz.time_duration = this.$route.query.time_duration;
            this.quiz.remarks = this.$route.query.remarks;
        }
    },

    methods: {
        async fetchChapters() {
            try {
                const response = await fetch("/api/chapters");
                if (response.ok) {
                    this.chapters = await response.json();
                } else {
                    console.error("Failed to fetch chapters.");
                }
            } catch (error) {
                console.error("Error fetching chapters:", error);
            }
        },

        async saveQuiz() {
            if (!this.quiz.chapter_id || !this.quiz.date_of_quiz || !this.quiz.time_duration) {
                alert("All fields except remarks are required.");
                return;
            }

            try {
                const method = this.isEditing ? "PUT" : "POST";
                const url = this.isEditing ? `/api/quizzes/${this.quizId}` : "/api/quizzes";

                const response = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(this.quiz)
                });

                if (response.ok) {
                    alert(`Quiz ${this.isEditing ? "updated" : "added"} successfully!`);
                    this.$router.push("/quiz-management");
                } else {
                    const errorData = await response.json();
                    alert("Failed to save quiz: " + (errorData.error || "Unknown error"));
                    console.error("Failed to save quiz:", errorData);
                }
            } catch (error) {
                console.error("Error saving quiz:", error);
                alert("An error occurred. Please try again.");
            }
        },

        cancel() {
            this.$router.push("/quiz-management"); // Redirect back to Admin Dashboard
        }
    }
};
