export default {
    template: `
      <div class="user-summary">
        <!-- Navigation Panel -->
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-lg p-3">
          <div class="container-fluid d-flex justify-content-between">
            <span class="navbar-brand fs-4 fw-bold text-light">
              <i class="bi bi-person-fill"></i> {{ fullName }}'s Performance
            </span>
            <div>
              <router-link class="btn btn-outline-light me-2 px-4 py-2 fw-bold" to="/summary">
                <i class="bi bi-arrow-left-circle-fill"></i> Leaderboard
              </router-link>
              <button class="btn btn-danger px-4 py-2 fw-bold" @click="logout">
                <i class="bi bi-box-arrow-right"></i> Logout
              </button>
            </div>
          </div>
        </nav>
  
        <!-- Summary Section -->
        <div class="container mt-5">
          <h2 class="fw-bold text-primary text-center mb-3">
            {{ fullName }}'s Quiz Performance <i class="bi bi-bar-chart-line-fill"></i>
          </h2>
  
          <div v-if="loading" class="text-center mt-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 fs-5">Loading scores...</p>
          </div>
  
          <div v-else-if="quizSummary.length === 0" class="text-center mt-4">
            <p class="fs-4 text-muted">No quiz attempts yet.</p>
          </div>
  
          <div v-else>
            <!-- Export Button -->
            <div class="d-flex justify-content-end mb-3">
              <button class="btn btn-success fw-bold px-4 py-2" @click="exportToCSV">
                <i class="bi bi-file-earmark-arrow-down-fill"></i> Export to CSV
              </button>
            </div>
  
            <!-- Summary Table -->
            <div class="table-responsive">
              <table class="table table-hover table-striped table-bordered shadow-lg text-center">
                <thead class="table-dark text-light">
                  <tr>
                    <th>Quiz ID</th>
                    <th>Subject</th>
                    <th>Chapter</th>
                    <th>Total Attempts</th>
                    <th>Highest Score</th>
                    <th>Average Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="quiz in quizSummary" :key="quiz.quiz_id">
                    <td class="fw-bold text-primary">{{ quiz.quiz_id }}</td>
                    <td>{{ quiz.subject_name }}</td>
                    <td>{{ quiz.chapter_name }}</td>
                    <td class="fw-bold">{{ quiz.total_attempts }}</td>
                    <td class="text-success fw-bold">{{ quiz.highest_score }}</td>
                    <td class="text-info fw-bold">{{ quiz.average_score.toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
  
          <!-- Performance Overview Section -->
          <div class="container mt-5 text-center">
            <h3 class="fw-bold text-success">
              <i class="bi bi-pie-chart-fill"></i> Performance Overview
            </h3>
  
            <div v-if="subjectChartData && trendChartData" class="row mt-4">
              <div class="col-md-6">
                <canvas ref="subjectChart"></canvas>
              </div>
              <div class="col-md-6">
                <canvas ref="trendChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  
    data() {
      return {
        userId: this.$route.params.user_id,
        fullName: "",
        quizSummary: [],
        subjectChartData: null,
        trendChartData: null,
        loading: true
      };
    },
  
    methods: {
      async fetchScores() {
        try {
          console.log(`Fetching scores for user ID ${this.userId}...`);
          const response = await fetch(`http://127.0.0.1:5000/api/scores/${this.userId}`);
          if (!response.ok) throw new Error(`Error: ${response.statusText}`);
  
          const scoresData = await response.json();
          this.processQuizSummary(scoresData);
        } catch (error) {
          console.error("Error fetching scores:", error);
        }
      },
  
      async fetchCharts(userId) {
        try {
          console.log(`Fetching charts for user ID ${userId}...`);
          const response = await fetch(`http://127.0.0.1:5000/api/scores/charts/${userId}`);
          if (!response.ok) throw new Error(`Error fetching chart data: ${response.statusText}`);
  
          const data = await response.json();
  
          if (data.subject_chart && data.trend_chart) {
            this.subjectChartData = data.subject_chart;
            this.trendChartData = data.trend_chart;
            this.renderCharts();
          } else {
            console.error("Chart data is missing or incorrect:", data);
          }
        } catch (error) {
          console.error("Error fetching charts:", error);
        }
      },
  
      renderCharts() {
        this.$nextTick(() => {
          if (!this.$refs.subjectChart || !this.$refs.trendChart) {
            console.error("Chart canvas elements not found!");
            return;
          }
  
          const subjectCtx = this.$refs.subjectChart.getContext("2d");
          const trendCtx = this.$refs.trendChart.getContext("2d");
  
          if (this.subjectChartInstance) this.subjectChartInstance.destroy();
          if (this.trendChartInstance) this.trendChartInstance.destroy();
  
          this.subjectChartInstance = new Chart(subjectCtx, {
            type: "bar",
            data: this.subjectChartData,
            options: {
              responsive: true,
              scales: {
                x: { beginAtZero: true, title: { display: true, text: "Subjects" } },
                y: { beginAtZero: true, title: { display: true, text: "Scores" } }
              },
              plugins: { legend: { position: "top" } }
            }
          });
  
          this.trendChartInstance = new Chart(trendCtx, {
            type: "pie",
            data: this.trendChartData,
            options: {
              responsive: true,
              plugins: { legend: { position: "top" } }
            }
          });
        });
      },
  
      processQuizSummary(scores) {
        if (!scores || scores.length === 0) {
          this.loading = false;
          return;
        }
  
        this.fullName = scores[0]?.full_name || "User";
        const quizMap = new Map();
  
        scores.forEach(score => {
          const key = `${score.quiz_id}-${score.subject_name}-${score.chapter_name}`;
          if (!quizMap.has(key)) {
            quizMap.set(key, {
              quiz_id: score.quiz_id,
              subject_name: score.subject_name || "Unknown",
              chapter_name: score.chapter_name || "Unknown",
              total_attempts: 0,
              highest_score: 0,
              total_score: 0
            });
          }
  
          const quizData = quizMap.get(key);
          quizData.total_attempts++;
          quizData.total_score += score.total_scored || 0;
          quizData.highest_score = Math.max(quizData.highest_score, score.total_scored || 0);
        });
  
        this.quizSummary = Array.from(quizMap.values()).map(quiz => ({
          ...quiz,
          average_score: quiz.total_attempts > 0 ? quiz.total_score / quiz.total_attempts : 0
        }));
  
        this.loading = false;
      },
  
      exportToCSV() {
        const csvContent = "data:text/csv;charset=utf-8,"
          + ["Quiz ID,Subject,Chapter,Total Attempts,Highest Score,Average Score"]
          .concat(this.quizSummary.map(quiz => 
            `${quiz.quiz_id},${quiz.subject_name},${quiz.chapter_name},${quiz.total_attempts},${quiz.highest_score},${quiz.average_score.toFixed(2)}`
          )).join("\n");
  
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${this.fullName}_quiz_summary.csv`);
        document.body.appendChild(link);
        link.click();
      },
  
      logout() {
        this.$router.push("/login");
      }
    },
  
    async mounted() {
      await this.fetchScores();
      await this.fetchCharts(this.userId);
    }
  };
  