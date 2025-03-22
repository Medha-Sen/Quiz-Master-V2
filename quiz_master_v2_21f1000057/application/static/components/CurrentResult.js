export default {
  template: `
  <div class="container result-container mt-5">
    <div v-if="loading" class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="text-muted mt-2">Fetching your latest score...</p>
    </div>

    <div v-else-if="latestScore" class="card shadow-lg p-4 animated-fade-in bg-light text-center">
      <h2 class="text-success fw-bold">📊 Your Latest Quiz Score</h2>
      <hr>

      <p class="fs-4"><strong>Quiz ID:</strong> {{ latestScore.quiz_id }}</p>
      <p class="fs-4"><strong>Score:</strong> <span class="text-primary">{{ latestScore.total_scored }}</span></p>
      <p class="fs-5 text-muted">Attempted on: {{ formattedDate }}</p>

      <button class="btn btn-lg btn-primary mt-3 shadow-sm rounded-pill" @click="goToDashboard">
        🏠 Back to Dashboard
      </button>
    </div>

    <div v-else class="text-center text-danger">
      <h4>No scores found for this quiz.</h4>
      <button class="btn btn-lg btn-primary mt-3 shadow-sm rounded-pill" @click="goToDashboard">
        🏠 Back to Dashboard
      </button>
    </div>
  </div>
  `,

  data() {
    return {
      latestScore: null,
      loading: true,
      quizId: this.$route.params.quizId // Ensure it's initialized
    };
  },

  computed: {
    formattedDate() {
      if (!this.latestScore) return "";
      const date = new Date(this.latestScore.timestamp);
      return date.toLocaleString();
    }
  },

  watch: {
    // Whenever quizId changes, fetch new data
    "$route.params.quizId": {
      immediate: true, // Run when the component is mounted
      handler(newQuizId) {
        console.log("Route changed, new quizId:", newQuizId);
        this.quizId = newQuizId; // Ensure reactivity
        this.latestScore = null; // Reset previous data
        this.fetchLatestScore();
      }
    }
  },

  methods: {
    async fetchLatestScore() {
      if (!this.quizId) {
        console.error("Quiz ID is missing!");
        this.loading = false;
        return;
      }

      try {
        this.loading = true;

        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.id) {
          console.error("User not found in localStorage.");
          this.loading = false;
          return;
        }

        console.log("Fetching latest score for user:", user.id, "and quiz:", this.quizId);

        const response = await fetch(`/api/scores/latest/${this.quizId}/${user.id}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch latest score. Error:", errorText);
          throw new Error("Failed to fetch latest score");
        }

        const data = await response.json();
        console.log("Fetched Latest Score Data:", data);

        this.latestScore = data;
      } catch (error) {
        console.error("Error fetching latest score:", error);
      } finally {
        this.loading = false;
      }
    },

    goToDashboard() {
      this.$router.push("/user");
    }
  },

  mounted() {
    this.fetchLatestScore();
  }
};
