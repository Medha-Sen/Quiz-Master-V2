export default {
    template: `
    <div class="quiz-container d-flex flex-column align-items-center justify-content-center vh-100" 
         style="background: linear-gradient(to right, #FFDEE9, #B5FFFC); font-family: 'Poppins', sans-serif;">
        
        <div class="card shadow-lg p-4" style="max-width: 600px; width: 90%; border-radius: 15px; background: white;">
            <div class="d-flex justify-content-between align-items-center">
                <h5 class="text-primary fw-bold">Quiz</h5>
                <div class="timer badge bg-danger fs-6 p-2">{{ formattedTime }}</div>
            </div>

            <hr>

            <div v-if="currentQuestion">
                <h6 class="fw-bold">{{ currentQuestionIndex + 1 }}. {{ currentQuestion.text }}</h6>
                
                <div class="options mt-3">
                    <div v-for="(option, index) in currentQuestion.options" :key="index" 
                         class="option p-2 rounded text-dark fw-medium" 
                         :class="{'selected': userAnswers[currentQuestionIndex] === option}" 
                         @click="selectAnswer(option)"
                         style="cursor: pointer; border: 1px solid #ddd; background: #f9f9f9; transition: 0.3s;">
                        {{ option }}
                    </div>
                </div>
            </div>

            <div class="d-flex justify-content-between mt-4">
                <button @click="prevQuestion" class="btn btn-outline-primary" :disabled="currentQuestionIndex === 0">
                    <i class="bi bi-arrow-left"></i> Previous
                </button>
                
                <button v-if="currentQuestionIndex < questions.length - 1" 
                        @click="nextQuestion" 
                        class="btn btn-primary">
                    Next <i class="bi bi-arrow-right"></i>
                </button>
                
                <button v-else @click="submitQuiz" class="btn btn-success">
                    Submit <i class="bi bi-check2-circle"></i>
                </button>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            questions: [],
            currentQuestionIndex: 0,
            userAnswers: [],
            timeLeft: 600, // 10 minutes
            timer: null
        };
    },

    computed: {
        currentQuestion() {
            return this.questions[this.currentQuestionIndex];
        },
        formattedTime() {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    },

    async mounted() {
        // Fetch questions from API
        try {
            const response = await fetch("/api/get-quiz-questions");
            this.questions = await response.json();
            
            if (!this.questions.length) {
                alert("No questions found!");
                this.$router.push("/user");
            }
        } catch (error) {
            console.error("Failed to load quiz:", error);
        }

        // Start countdown timer
        this.timer = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
            } else {
                clearInterval(this.timer);
                this.submitQuiz();
            }
        }, 1000);
    },

    methods: {
        selectAnswer(option) {
            this.userAnswers[this.currentQuestionIndex] = option;
        },

        prevQuestion() {
            if (this.currentQuestionIndex > 0) {
                this.currentQuestionIndex--;
            }
        },

        nextQuestion() {
            if (this.currentQuestionIndex < this.questions.length - 1) {
                this.currentQuestionIndex++;
            }
        },

        async submitQuiz() {
            clearInterval(this.timer);

            try {
                const response = await fetch("/api/submit-quiz", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ answers: this.userAnswers })
                });

                const result = await response.json();
                localStorage.setItem("quizResults", JSON.stringify(result));
                this.$router.push("/current-result");
            } catch (error) {
                console.error("Error submitting quiz:", error);
            }
        }
    }
};
