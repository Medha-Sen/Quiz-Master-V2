export default {
    template: `
    <div class="admin-dashboard">
        <!-- Navigation Bar -->
        <nav class="navbar navbar-expand-lg navbar-light pastel-navbar shadow-sm">
            <div class="container-fluid">
                <span class="navbar-brand fs-4 fw-bold text-primary"><i class="bi bi-speedometer2"></i> Admin Dashboard</span>
                <ul class="navbar-nav me-auto">
                    <li class="nav-item"><router-link class="nav-link fw-semibold" to="/admin"><i class="bi bi-house-door"></i> Home</router-link></li>
                    <li class="nav-item"><router-link class="nav-link fw-semibold" to="/quiz-management"><i class="bi bi-file-earmark-text"></i> Quiz</router-link></li>
                    <li class="nav-item"><router-link class="nav-link fw-semibold" to="/summary"><i class="bi bi-bar-chart"></i> Summary</router-link></li>
                </ul>
                <button class="btn btn-danger ms-3 fw-semibold" @click="logout"><i class="bi bi-box-arrow-right"></i> Logout</button>
            </div>
        </nav>

        <!-- Welcome Message -->
        <div class="container mt-4">
            <h2 class="text-center fw-bold">Welcome, Admin <i class="bi bi-person-circle"></i></h2>
        </div>

        <!-- Smart Search Bar -->
        <div class="container mt-4">
            <div class="search-container">
                <input type="text" class="form-control search-bar shadow-sm" v-model="searchQuery" placeholder="Search subjects, chapters, or keywords..." />
                <i class="bi bi-search search-icon"></i>
            </div>
        </div>

        <!-- Subjects Section -->
        <div class="container mt-4">
            <div v-if="filteredSubjects.length > 0" class="row g-4">
                <div v-for="subject in filteredSubjects" :key="subject.id" class="col-md-6">
                    <div class="card pastel-card shadow-sm">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <span><i class="bi bi-book"></i> {{ subject.name }}</span>
                            <div>
                                <button class="btn btn-sm btn-warning me-2" @click="editSubject(subject)"><i class="bi bi-pencil"></i></button> 
                                <button class="btn btn-sm btn-danger" @click="deleteSubject(subject.id)"><i class="bi bi-trash"></i></button>
                            </div>
                        </div>
                        <div class="card-body">
                            <p>{{ subject.description }}</p>
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Chapter Name</th>
                                        <th>Questions</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="chapter in subject.chapters" :key="chapter.id">
                                        <td>{{ chapter.name }}</td>
                                        <td>{{ chapter.questions }}</td>
                                        <td>
                                            <button class="btn btn-sm btn-info me-2" @click="editChapter(subject.id, chapter)"><i class="bi bi-pencil"></i></button> 
                                            <button class="btn btn-sm btn-danger" @click="deleteChapter(chapter.id)"><i class="bi bi-trash"></i></button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <button class="btn pastel-btn mt-2" @click="addChapter(subject.id)">
                                <i class="bi bi-plus-circle"></i> Add Chapter
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 404 No Results Found Message -->
            <div v-else class="text-center mt-4">
                <p class="fs-5 text-muted"><i class="bi bi-emoji-frown"></i> No subjects, chapters, or keywords matched your search.</p>
            </div>

            <!-- Add New Subject Button -->
            <div class="text-center mt-4">
                <button class="btn pastel-btn-lg" @click="addSubject">
                    <i class="bi bi-folder-plus"></i> Add New Subject
                </button>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            subjects: [],
            searchQuery: ""
        };
    },

    computed: {
        filteredSubjects() {
            if (!this.searchQuery) return this.subjects;
            
            const query = this.searchQuery.toLowerCase();
            return this.subjects.filter(subject => 
                subject.name.toLowerCase().includes(query) ||
                subject.description.toLowerCase().includes(query) ||
                subject.chapters.some(chapter => chapter.name.toLowerCase().includes(query))
            );
        }
    },

    mounted() {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || user.role !== "Admin") {
            this.$router.push('/login');
        }
        this.fetchSubjects();
    },
    methods: {
        logout() {
            localStorage.removeItem("user");
            this.$router.push('/login');
        },
        async fetchSubjects() {
            try {
                // ✅ Force fresh data by adding a timestamp to prevent caching
                const response = await fetch(`/api/subjects?t=${Date.now()}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
        
                if (response.ok) {
                    this.subjects = await response.json();
                    this.$forceUpdate();
                } else {
                    console.error("Failed to fetch subjects");
                }
            } catch (error) {
                console.error("Error fetching subjects:", error);
            }
        },
        async addChapter(subjectId) {
            this.$router.push({ path: `/add-chapter/${subjectId}`, query: { subject_id: subjectId } });
        },        
        async editChapter(subjectId, chapter) {
            this.$router.push({
                path: `/add-chapter/${subjectId}`,
                query: { 
                    subject_id: subjectId, 
                    chapter_id: chapter.id,
                    chapter_name: chapter.name,
                    chapter_description: chapter.description
                }
            });
        
            // Fetch updated subjects after navigation to ensure UI updates
            setTimeout(() => {
                this.fetchSubjects();
            }, 500);
        },
        async deleteChapter(chapterId) {
            if (!confirm("Are you sure you want to delete this chapter?")) return;
        
            try {
                const response = await fetch(`/api/chapters/${chapterId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
        
                if (response.ok) {
                    alert("Chapter deleted successfully!");
                    await this.fetchSubjects();  // Force UI update
                } else {
                    alert("Failed to delete chapter.");
                }
            } catch (error) {
                console.error("Error deleting chapter:", error);
            }
        },                
        async addSubject() {
            this.$router.push("/add-subject");
        },
        async editSubject(subject) {
            this.$router.push({
                path: "/add-subject",
                query: { id: subject.id, name: subject.name, description: subject.description }
            });
        },
        async deleteSubject(subjectId) {
            if (!confirm("Are you sure you want to delete this subject?")) return;
        
            try {
                const response = await fetch(`/api/subjects/${subjectId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
        
                if (response.ok) {
                    alert("Subject deleted successfully!");
        
                    // ✅ Remove from Vue's local state
                    this.subjects = this.subjects.filter(subject => subject.id !== subjectId);
        
                    // ✅ Fetch fresh data from the API
                    await this.fetchSubjects();
                } else {
                    alert("Failed to delete subject.");
                }
            } catch (error) {
                console.error("Error deleting subject:", error);
            }
        }        
    }
};
