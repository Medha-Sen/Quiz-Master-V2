export default {
    template: `
    <div :style="body_login">
        <div class="login-container">
            <div class="login-card">
                <div class="progress-bar"></div>
                <h2>Welcome Back</h2>

                <form @submit.prevent="login">
                    <div class="input-group">
                        <label>Email</label>
                        <input type="email" v-model="email" class="pastel-input" required>
                    </div>

                    <div class="input-group">
                        <label>Password</label>
                        <input type="password" v-model="password" class="pastel-input" required>
                    </div>

                    <button type="submit" class="pastel-btn">Login</button>
                </form>

                <p v-if="error" class="error-message">{{ error }}</p>
                <p class="register-link">
                    New user? <a @click.prevent="$router.push('/register')">Register <span>here</span></a>
                </p>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            email: "",
            password: "",
            error: "",
            body: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                background: "linear-gradient(135deg, #ffebf8, #c9f7ff, #d8b6ff)",
                fontFamily: "'Poppins', sans-serif",
                margin: "0",
                padding: "0",
            },
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
                    localStorage.setItem("user", JSON.stringify({ id: data.user.id, email: this.email, role: data.role }));
                    this.$router.push(data.redirect); // Redirect based on role
                } else {
                    this.error = data.error;
                }
            } catch (error) {
                this.error = "An error occurred. Please try again.";
            }
        }
    },
    mounted() {
        // Dynamically add styles to head
        const style = document.createElement("style");
        style.innerHTML = `
        /* ✨ Glassmorphic Login Card */
        .login-card {
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

        .login-card::before {
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

        .login-card:hover {
            transform: scale(1.02);
            box-shadow: 0px 10px 25px rgba(255, 105, 180, 0.5);
        }

        /* 💡 Progress Bar */
        .progress-bar {
            height: 6px;
            width: 100%;
            border-radius: 20px;
            background: linear-gradient(to right, #FF9A8B, #FF758F, #FF7EB3);
        }

        /* 🎨 Input Fields */
        .input-group {
            margin-bottom: 15px;
            text-align: left;
        }

        .input-group label {
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

        /* 🎀 Modern Pastel Button */
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
        /* 🔗 Register Link */
        .register-link {
            margin-top: 15px;
            font-size: 14px;
            color: #6c757d;
        }

        .register-link a {
            text-decoration: none;
            font-weight: bold;
            color: #ff2f92;
            transition: color 0.3s ease-in-out;
            cursor: pointer;
        }

        .register-link a span {
            text-decoration: underline;
        }

        .register-link a:hover {
            color: #d136c1;
        }
        `;
        document.head.appendChild(style);
    }
};
