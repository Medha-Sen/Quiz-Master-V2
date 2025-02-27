export default {
    template: `
    <div class="register-container">
        <div class="register-card">
            <h2 class="register-title">Create Account</h2>
            <form @submit.prevent="register">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" v-model="full_name" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" v-model="email" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" v-model="password" required>
                </div>
                <button type="submit" class="register-btn">Sign Up</button>
            </form>
            <p class="error-message">{{ error }}</p>
        </div>
    </div>
    `,
    data() {
        return {
            full_name: "",
            email: "",
            password: "",
            error: "",
        };
    },
    methods: {
        async register() {
            try {
                let response = await fetch("http://127.0.0.1:5000/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ full_name: this.full_name, email: this.email, password: this.password })
                });
                let data = await response.json();
                if (response.ok) {
                    alert("Registration Successful!");
                    this.$router.push("/login");
                } else {
                    this.error = data.message;
                }
            } catch (err) {
                this.error = "Server error, try again later.";
            }
        }
    },
    mounted() {
        // Inject CSS Styles into <head>
        const style = document.createElement("style");
        style.innerHTML = `
            body {
                background: linear-gradient(135deg, #FFDEE9, #B5FFFC);
                font-family: 'Poppins', sans-serif;
            }
            .register-container {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }
            .register-card {
                background: white;
                padding: 2rem;
                border-radius: 15px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                max-width: 400px;
                width: 100%;
                text-align: center;
            }
            .register-title {
                color: #FF6B6B;
                font-size: 24px;
                margin-bottom: 1rem;
            }
            .form-group {
                display: flex;
                flex-direction: column;
                text-align: left;
                margin-bottom: 1rem;
            }
            .form-group label {
                font-weight: 600;
                color: #555;
                margin-bottom: 0.3rem;
            }
            .form-group input {
                padding: 10px;
                border: 2px solid #FFB6C1;
                border-radius: 8px;
                font-size: 16px;
                transition: 0.3s;
            }
            .form-group input:focus {
                border-color: #FF6B6B;
                outline: none;
            }
            .register-btn {
                background: #FF6B6B;
                color: white;
                padding: 10px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 18px;
                transition: 0.3s;
                width: 100%;
            }
            .register-btn:hover {
                background: #FF3B3B;
            }
            .error-message {
                color: red;
                margin-top: 10px;
            }
        `;
        document.head.appendChild(style);
    }
};
