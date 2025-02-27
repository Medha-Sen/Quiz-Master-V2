export default {
    template: `
    <div class="container mt-5">
        <h2 class="text-center fw-bold text-primary">
            📚 {{ isEditing ? "Edit Subject" : "Add New Subject" }}
        </h2>
        <div class="card pastel-card shadow-lg p-4 rounded-4 border-0">
            <div class="mb-3">
                <label class="form-label fw-semibold">Subject Name</label>
                <input type="text" v-model="subject.name" class="form-control form-control-lg rounded-3"
                    placeholder="Enter subject name" @input="validateInput" autofocus>
                <small v-if="errorMessage" class="text-danger">{{ errorMessage }}</small>
            </div>
            <div class="mb-3">
                <label class="form-label fw-semibold">Description</label>
                <textarea v-model="subject.description" class="form-control rounded-3"
                    placeholder="Enter description (optional)" rows="3"></textarea>
                <small class="text-muted">{{ subject.description.length }}/200 characters</small>
            </div>
            <div class="d-flex justify-content-end">
                <button class="btn btn-outline-secondary me-2 px-4 py-2 rounded-3" @click="cancel">Cancel</button>
                <button class="btn btn-primary px-4 py-2 rounded-3" :disabled="!subject.name.trim()" 
                    @click="saveSubject">
                    {{ isEditing ? "Update" : "Save" }}
                </button>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            subject: { name: "", description: "" },
            isEditing: false,
            subjectId: null,
            errorMessage: ""
        };
    },

    mounted() {
        // Check if editing
        if (this.$route.query.id) {
            this.isEditing = true;
            this.subjectId = this.$route.query.id;
            this.subject.name = this.$route.query.name;
            this.subject.description = this.$route.query.description;
        }
    },

    methods: {
        async saveSubject() {
            if (!this.subject.name.trim()) {
                alert("Subject name is required.");
                return;
            }

            try {
                const method = this.isEditing ? "PUT" : "POST";
                const url = this.isEditing ? `/api/subjects/${this.subjectId}` : "/api/subjects";

                const response = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(this.subject)
                });

                if (response.ok) {
                    alert(`Subject ${this.isEditing ? "updated" : "added"} successfully!`);
                    this.$router.push("/admin");
                } else {
                    const errorData = await response.json();
                    alert("Failed to save subject: " + (errorData.error || "Unknown error"));
                    console.error("Failed to save subject:", errorData);
                }
            } catch (error) {
                console.error("Error saving subject:", error);
                alert("An error occurred. Please try again.");
            }
        },

        cancel() {
            this.$router.push("/admin"); // Redirect back to Admin Dashboard
        }
    }
};
