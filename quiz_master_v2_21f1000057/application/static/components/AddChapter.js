export default {
    template: `
    <div class="container mt-5">
        <h2 class="text-center fw-bold text-primary">📖 {{ isEditing ? 'Edit Chapter' : 'Add New Chapter' }}</h2>
        <div class="card pastel-card shadow-lg p-4 rounded-4 border-0">
            <div class="mb-3">
                <label class="form-label fw-semibold">Chapter Name</label>
                <input type="text" v-model="chapter.name" class="form-control form-control-lg rounded-3"
                    placeholder="Enter chapter name" autofocus>
            </div>
            <div class="mb-3">
                <label class="form-label fw-semibold">Chapter Description</label>
                <textarea v-model="chapter.description" class="form-control form-control-lg rounded-3"
                    placeholder="Enter chapter description" rows="3"></textarea>
            </div>
            <small v-if="errorMessage" class="text-danger">{{ errorMessage }}</small>
            <div class="d-flex justify-content-end">
                <button class="btn btn-outline-secondary me-2 px-4 py-2 rounded-3" @click="cancel">Cancel</button>
                <button class="btn btn-primary px-4 py-2 rounded-3" 
                    :disabled="!chapter.name.trim()" 
                    @click="saveChapter">
                    {{ isEditing ? 'Update' : 'Save' }}
                </button>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            chapter: {
                id: null,
                name: "",
                description: "",
                subject_id: null
            },
            isEditing: false,
            errorMessage: ""
        };
    },

    created() {
        this.chapter.subject_id = this.$route.query.subject_id;
        if (this.$route.query.chapter_id) {
            this.isEditing = true;
            this.chapter.id = this.$route.query.chapter_id;
            this.chapter.name = this.$route.query.chapter_name;
            this.chapter.description = this.$route.query.chapter_description;
        }
    },

    methods: {
        async saveChapter() {
            const url = this.isEditing ? `/api/chapters/${this.chapter.id}` : "/api/chapters";
            const method = this.isEditing ? "PUT" : "POST";

            try {
                const response = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(this.chapter)
                });

                if (response.ok) {
                    alert(this.isEditing ? "Chapter updated successfully!" : "Chapter added successfully!");
                    this.$router.push("/admin");
                } else {
                    alert("Error saving chapter.");
                }
            } catch (error) {
                console.error("Error:", error);
            }
        },

        cancel() {
            this.$router.push("/admin");
        }
    }
};
