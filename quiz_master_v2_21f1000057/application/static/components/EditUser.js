export default {
    template: `
    <div class="edit-profile container mt-5">
        <h2 class="fw-bold text-center text-primary"><i class="bi bi-pencil-square"></i> Edit Profile</h2>
        <div class="card p-4 shadow-sm mx-auto" style="max-width: 500px;">
            <form @submit.prevent="updateProfile">
                <div class="mb-3">
                    <label class="form-label">Full Name</label>
                    <input type="text" v-model="user.full_name" class="form-control" required>
                </div>

                <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" v-model="user.email" class="form-control">
                </div>

                <div class="mb-3">
                    <label class="form-label">Qualification</label>
                    <input type="text" v-model="user.qualification" class="form-control">
                </div>

                <div class="mb-3">
                    <label class="form-label">Date of Birth</label>
                    <input type="date" v-model="user.dob" class="form-control">
                </div>

                <button type="submit" class="btn btn-primary w-100">
                    <i class="bi bi-save"></i> Save Changes
                </button>
            </form>

            <p v-if="message" class="text-success mt-3 text-center">{{ message }}</p>
            <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
        </div>
    </div>
    `,

    data() {
        return {
            user: {
                full_name: "",
                email: "",
                qualification: "",
                dob: ""
            },
            message: "",
            error: ""
        };
    },

    async mounted() {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        
        if (!storedUser || !storedUser.email) {
            this.$router.push('/login'); // Redirect to login if no user info is found
            return;
        }

        try {
            const response = await fetch(`/api/get-profile?email=${storedUser.email}`);
            const result = await response.json();

            if (response.ok) {
                this.user = { ...result };
            } else {
                this.error = result.error;
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            this.error = "Failed to load profile!";
        }
    },

    methods: {  
        async updateProfile() {
            try {
                console.log("Submitting update:", this.user); // Debugging log
                
                const storedUser = JSON.parse(localStorage.getItem("user"));
                if (!storedUser) {
                    this.error = "User not logged in!";
                    return;
                }
    
                const payload = {
                    current_email: storedUser.email,  // Send current email
                    email: this.user.email,  // Send updated email
                    full_name: this.user.full_name,
                    qualification: this.user.qualification,
                    dob: this.user.dob
                };
    
                const response = await fetch("/api/update-profile", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });
    
                const result = await response.json();
                console.log("Update response:", result); // Debugging log
    
                if (response.ok) {
                    this.message = "Profile updated successfully!";
    
                    // If the email was changed, update local storage
                    if (this.user.email !== storedUser.email) {
                        localStorage.setItem("user", JSON.stringify({
                            ...storedUser,
                            email: this.user.email
                        }));
                    }
    
                    this.$router.push("/user"); // Redirect to profile page
                } else {
                    this.error = result.error;
                }
            } catch (error) {
                console.error("Error updating profile:", error);
                this.error = "Failed to update profile!";
            }
        }
    }
    
};
