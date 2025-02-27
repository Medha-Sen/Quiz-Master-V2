export default {
    template: `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(to right, #FFDEE9, #B5FFFC); font-family: 'Poppins', sans-serif;">
        <div style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.1); width: 350px; text-align: center;">
            <div style="height: 6px; width: 100%; border-radius: 20px; background: linear-gradient(to right, #FF9A8B, #FF758F, #FF7EB3);"></div>
            <h2 style="color: #FF758F; margin-top: 20px; font-weight: 600;">Login</h2>

            <form @submit.prevent="login">
                <div style="margin-bottom: 15px; text-align: left;">
                    <label style="font-weight: 500; color: #6c757d;">Email</label>
                    <input type="email" v-model="email" 
                        style="width: 100%; padding: 10px; border: 1px solid #FF9A8B; border-radius: 8px; background: #FFF6F7; outline: none;" required>
                </div>
                
                <div style="margin-bottom: 15px; text-align: left;">
                    <label style="font-weight: 500; color: #6c757d;">Password</label>
                    <input type="password" v-model="password" 
                        style="width: 100%; padding: 10px; border: 1px solid #FF9A8B; border-radius: 8px; background: #FFF6F7; outline: none;" required>
                </div>
                
                <button type="submit" 
                    style="width: 100%; padding: 12px; background: linear-gradient(to right, #FF9A8B, #FF758F); color: white; 
                    border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s;"
                    onmouseover="this.style.background='linear-gradient(to right, #FF758F, #FF9A8B)'">
                    Login
                </button>
            </form>

            <p v-if="error" style="color: #D9534F; margin-top: 10px; font-weight: 500;">{{ error }}</p>
        </div>
    </div>
    `,
    data() {
        return {
            email: "",
            password: "",
            error: "",
        };
    },
    methods: {
        async login() {
            try {
                const response = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: this.email, password: this.password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem("user", JSON.stringify({ email: this.email, role: data.role }));
                    this.$router.push(data.redirect); // Redirect based on role
                } else {
                    this.error = data.error;
                }
            } catch (error) {
                this.error = "An error occurred. Please try again.";
            }
        }
        
    }
};
