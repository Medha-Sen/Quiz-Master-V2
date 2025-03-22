export default {
    template: `
 <div class="register-container">
        <div class="register-card">
            <h2 class="register-title">Create Account</h2>
            
            <form @submit.prevent="register">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" v-model="full_name" class="pastel-input" required>
                </div>

                <div class="form-group">
                    <label>Email</label>
                    <input type="email" v-model="email" class="pastel-input" required>
                </div>

                <div class="form-group">
                    <label>Qualification</label>
                    <input type="text" v-model="qualification" class="pastel-input" required>
                </div>

                <div class="form-group">
                    <label>Date of Birth</label>
                    <input type="date" v-model="dob" class="pastel-input" required>
                </div>

                <div class="form-group">
                    <label>Password</label>
                    <input type="password" v-model="password" class="pastel-input" required>
                </div>

                <button type="submit" class="pastel-btn">Sign Up</button>
            </form>

            <p v-if="error" class="error-message">{{ error }}</p>

            <p class="login-link">
                Already a user? <a @click.prevent="$router.push('/login')">Login <span>here</span></a>
            </p>
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
                    body: JSON.stringify({full_name: this.full_name,
                        email: this.email,
                        qualification: this.qualification,
                        dob: this.dob,
                        password: this.password})
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
            /* 🌸 Glassmorphic Container */
            .register-container {
                display: flex;
                justify-content: center;
                align-items: center;
                background: rgba(255, 255, 255, 0.5);
                font-family: 'Poppins', sans-serif;
                margin: 0;
                padding: 0;
            }

            /* ✨ Glassmorphic Register Card */
            .register-card {
            background: rgba(255, 255, 255, 0.5);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0px 8px 20px rgba(255, 105, 180, 0.3);
            backdrop-filter: blur(15px);
            width: 380px;
            text-align: center;
            transition: all 0.3s ease-in-out;
            position: relative;
            }

            .register-card::before {
            content: "";
            position: absolute;
            top: -10px;
            left: -10px;
            width: 100%;
            height: 100%;
            border-radius: 20px;
            background: linear-gradient(135deg, rgba(255, 173, 230, 0.3), rgba(120, 205, 255, 0.3));
            z-index: -1;
            filter: blur(20px);
            }

            .register-card:hover {
                transform: scale(1.02);
                box-shadow: 0px 10px 25px rgba(255, 105, 180, 0.5);
            }

            /* 🎀 Register Title */
            .register-title {
                color: #ff2f92;
                font-size: 24px;
                margin-bottom: 20px;
                font-weight: bold;
            }

            /* 📝 Input Fields */
            .form-group {
                margin-bottom: 15px;
                text-align: left;
            }

            .form-group label {
                font-weight: 500;
                color: #6c757d;
                display: block;
                margin-bottom: 5px;
            }

            .pastel-input {
                width: 100%;
                padding: 12px;
                border: 2px solid rgba(255, 171, 225, 0.6);
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.6);
                backdrop-filter: blur(10px);
                outline: none;
                transition: all 0.3s ease-in-out;
                font-size: 16px;
            }

            .pastel-input:focus {
                border-color: #ff2f92;
                box-shadow: 0px 0px 10px rgba(255, 105, 180, 0.5);
            }

            /* 🌈 Fancy Register Button */
            .pastel-btn {
                width: 100%;
                padding: 14px;
                background: linear-gradient(90deg, #ff9a9e, #ff2f92);
                color: white;
                border-radius: 12px;
                border: none;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease-in-out;
                box-shadow: 0px 4px 10px rgba(255, 105, 180, 0.3);
                font-size: 16px;
            }

            .pastel-btn:hover {
                background: linear-gradient(90deg, #ff2f92, #d136c1);
                transform: translateY(-3px);
                box-shadow: 0px 6px 15px rgba(255, 105, 180, 0.5);
            }

            /* ⚠️ Error Message */
            .error-message {
                color: #D9534F;
                margin-top: 10px;
                font-weight: 500;
            }

            /* 🔗 Login Link */
            .login-link {
                margin-top: 15px;
                font-size: 14px;
                color: #6c757d;
            }

            .login-link a {
                text-decoration: none;
                font-weight: bold;
                color: #ff2f92;
                transition: color 0.3s ease-in-out;
                cursor: pointer;
            }

            .login-link a span {
                text-decoration: underline;
            }

            .login-link a:hover {
                color: #d136c1;
            }
        `;
        document.head.appendChild(style);
    }
};
