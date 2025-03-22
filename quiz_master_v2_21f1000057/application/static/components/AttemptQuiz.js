export default {
  template: `
  <div class="container quiz-container mt-5">
    <div v-if="!quizFinished">
      <h2 class="quiz-title text-center mb-4 fw-bold text-primary">📝 Attempt Quiz</h2>
      <div class="text-center mb-3">
        <span class="timer badge fs-5 px-3 py-2 animated-timer">{{ formattedTime }}</span>
      </div>
      <div class="card shadow-lg p-4 animated-fade-in bg-light">
        <h3 class="question-title text-center text-dark fw-bold">{{ currentQuestion.question_title }}</h3>
        <hr>
        <p class="question-statement text-center text-muted fs-5">{{ currentQuestion.question_statement }}</p>
        <div class="options row mt-4">
          <div v-for="(option, index) in options" :key="index" class="col-md-6 d-flex justify-content-center mb-3">
            <button class="btn option-button w-75 py-3 shadow-sm fw-bold rounded-pill" 
              :class="{'btn-primary text-white': selectedOption === index+1, 'btn-outline-secondary': selectedOption !== index+1}"
              @click="selectOption(index+1)">
              {{ option }}
            </button>
          </div>
        </div>
      </div>
      <div class="navigation d-flex justify-content-between mt-4">
        <button class="btn btn-outline-secondary px-4 shadow-sm rounded-pill" @click="prevQuestion" :disabled="currentIndex === 0">⬅ Previous</button>
        <button class="btn btn-outline-primary px-4 shadow-sm rounded-pill" @click="nextQuestion" v-if="currentIndex < questions.length - 1">Next ➡</button>
        <button class="btn btn-success px-4 shadow-sm rounded-pill" @click="finishQuiz" v-if="currentIndex === questions.length - 1">✔ Submit</button>
      </div>
    </div>
    <div v-else class="result-container text-center animated-fade-in">
      <h2 class="text-success fw-bold">🎉 Quiz Completed!</h2>
      <p class="fs-4">Total Score: <strong class="text-dark">{{ totalScore }}</strong> / {{ questions.length }}</p>
      <p v-if="latestScore !== null" class="text-info fs-5">Your previous best score: <strong>{{ latestScore }}</strong></p>
      <div class="table-responsive mt-4">
        <table class="table table-hover table-bordered shadow-sm">
          <thead class="table-dark">
            <tr><th>Question</th><th>Your Answer</th><th>Correct Answer</th><th>Result</th></tr>
          </thead>
          <tbody>
            <tr v-for="(question, index) in questions" :key="index">
              <td>{{ question.question_statement }}</td>
              <td>{{ getOptionText(selectedAnswers[index]) }}</td>
              <td class="fw-bold text-success">{{ getOptionText(question.correct_option) }}</td>
              <td :class="{'text-success fw-bold': selectedAnswers[index] === question.correct_option, 'text-danger fw-bold': selectedAnswers[index] !== question.correct_option}">
                {{ selectedAnswers[index] === question.correct_option ? '✔ Correct' : '✘ Wrong' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button class="btn btn-lg btn-primary text-white mt-4 shadow-sm rounded-pill" @click="goToDashboard">🏠 Back to Dashboard</button>
    </div>
  </div>
  `,
  data() {
    return {
      quizId: this.$route.params.quizId,
      questions: [],
      currentIndex: 0,
      selectedAnswers: [],
      selectedOption: null,
      timer: 0,
      quizFinished: false,
      countdown: null,
      latestScore: null
    };
  },
  computed: {
    currentQuestion() { return this.questions[this.currentIndex] || {}; },
    options() { return this.currentQuestion ? [this.currentQuestion.option1, this.currentQuestion.option2, this.currentQuestion.option3, this.currentQuestion.option4].filter(Boolean) : []; },
    formattedTime() { return `${Math.floor(this.timer / 60)}:${String(this.timer % 60).padStart(2, '0')}`; },
    totalScore() { return this.questions.reduce((score, q, i) => score + (this.selectedAnswers[i] === q.correct_option ? 1 : 0), 0); }
  },
  methods: {
    async fetchQuizData() {
      try {
        if (!this.quizId) {
          console.error("Quiz ID not found in route parameters.");
          return;
        }
    
        console.log("Fetching data for quiz:", this.quizId);
    
        const quizResponse = await fetch(`/api/quizzes/${this.quizId}`);
        const quizData = await quizResponse.json();
        this.timer = parseInt(quizData.time_duration) * 60;
    
        const questionsResponse = await fetch(`/api/questions?quiz_id=${this.quizId}`);
        const questionsData = await questionsResponse.json();
    
        this.questions = questionsData.map(q => ({
          ...q,
          correct_option: parseInt(q.correct_option)
        }));
        this.selectedAnswers = new Array(this.questions.length).fill(null);
        this.fetchLatestScore();
      } catch (error) {
        console.error("Error fetching quiz data:", error);
      }
    },
    async fetchLatestScore() {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;
      try {
        const response = await fetch(`/api/scores/latest/${this.quizId}/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          this.latestScore = data.total_scored;
        }
      } catch (error) { console.error("Error fetching latest score:", error); }
    },
    selectOption(option) { this.selectedOption = option; this.selectedAnswers[this.currentIndex] = option; },
    prevQuestion() { if (this.currentIndex > 0) { this.currentIndex--; this.selectedOption = this.selectedAnswers[this.currentIndex]; } },
    nextQuestion() { if (this.currentIndex < this.questions.length - 1) { this.currentIndex++; this.selectedOption = this.selectedAnswers[this.currentIndex]; } },
    async finishQuiz() { this.quizFinished = true; clearInterval(this.countdown); await this.submitScore(); },
    async submitScore() {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        console.error("User not found. Cannot submit scores.");
        return;
      }
    
      console.log("Submitting score for quiz:", this.quizId);
    
      try {
        const response = await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quiz_id: this.quizId, // Ensure this is dynamically set
            user_id: user.id,
            total_scored: this.totalScore
          })
        });
    
        if (!response.ok) {
          console.error("Failed to submit score");
          return;
        }
    
        this.fetchLatestScore();
      } catch (error) {
        console.error("Error submitting score:", error);
      }
    },    
    getOptionText(optionNumber) { return optionNumber ? this.options[optionNumber - 1] : "Not Answered"; },
    startTimer() { this.countdown = setInterval(() => { if (this.timer > 0) { this.timer--; } else { this.finishQuiz(); } }, 1000); },
    goToDashboard() { this.$router.push("/user"); }
  },
  mounted() { this.fetchQuizData(); this.startTimer(); },
  beforeUnmount() { clearInterval(this.countdown); }
};
