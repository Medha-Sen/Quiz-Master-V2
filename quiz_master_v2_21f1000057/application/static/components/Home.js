export default {
    template: `
    <div style="font-family: 'Poppins', sans-serif; background: #fef8f5; min-height: 100vh;">

        <!-- Navbar -->
        <nav style="background: linear-gradient(to right, #ffdde1, #b8e0d2); padding: 15px; 
                    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); display: flex; justify-content: center; align-items: center;">
            <div style="display: flex; gap: 15px;">
                <div style="width: 12px; height: 12px; background: #ff758f; border-radius: 50%;"></div>
                <div style="width: 12px; height: 12px; background: #90be6d; border-radius: 50%;"></div>
                <div style="width: 12px; height: 12px; background: #277da1; border-radius: 50%;"></div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="container text-center mt-5">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <h1 style="color: #ff758f; font-weight: bold; font-size: 3rem;">Welcome to Quiz Master!</h1>
                    <p style="color:#4a4a4a; font-size: 1.2rem;">Challenge yourself with interactive quizzes and improve your knowledge.</p>
                </div>
            </div>

            <!-- Hero Section -->
            <div class="row justify-content-center mt-4">
                <div class="col-md-6">
                    <img src="../static/images/quiz_hero.png" alt="Quiz Illustration" 
                        style="max-width: 100%; border-radius: 20px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
                </div>
            </div>

            <!-- Call to Action (Login & Register) -->
            <div class="row justify-content-center mt-4">
                <div class="col-md-6">
                    <router-link to="/register" 
                        style="background: #ff9a8b; border: none; color: white; font-weight: bold; 
                        padding: 12px 20px; border-radius: 20px; text-decoration: none; 
                        display: inline-block; font-size: 1.2rem; margin: 10px; transition: 0.3s ease-in-out;"
                        onmouseover="this.style.background='#ff758f'" 
                        onmouseout="this.style.background='#ff9a8b'">Get Started</router-link>

                    <router-link to="/login" 
                        style="background: #6a9ac4; border: none; color: white; font-weight: bold; 
                        padding: 12px 20px; border-radius: 20px; text-decoration: none; 
                        display: inline-block; font-size: 1.2rem; margin: 10px; transition: 0.3s ease-in-out;"
                        onmouseover="this.style.background='#547aa5'" 
                        onmouseout="this.style.background='#6a9ac4'">Login</router-link>
                </div>
            </div>

            <!-- Features -->
            <div class="row mt-5">
                <div class="col-md-4">
                    <div style="background: #fcefee; border-radius: 15px; padding: 20px; 
                        box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.1); text-align: center; transition: 0.3s ease-in-out;"
                        onmouseover="this.style.transform='scale(1.05)'" 
                        onmouseout="this.style.transform='scale(1)'">
                        <i class="bi bi-lightbulb" style="font-size: 50px; color: #ffb703;"></i>
                        <h4 style="margin-top: 15px;">Engaging Quizzes</h4>
                        <p style="color: #6c757d;">A variety of quizzes to test and expand your knowledge.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div style="background: #f0f7f4; border-radius: 15px; padding: 20px; 
                        box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.1); text-align: center; transition: 0.3s ease-in-out;"
                        onmouseover="this.style.transform='scale(1.05)'" 
                        onmouseout="this.style.transform='scale(1)'">
                        <i class="bi bi-bar-chart" style="font-size: 50px; color: #90be6d;"></i>
                        <h4 style="margin-top: 15px;">Track Progress</h4>
                        <p style="color: #6c757d;">See your improvements over time with detailed statistics.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div style="background: #eaf4fc; border-radius: 15px; padding: 20px; 
                        box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.1); text-align: center; transition: 0.3s ease-in-out;"
                        onmouseover="this.style.transform='scale(1.05)'" 
                        onmouseout="this.style.transform='scale(1)'">
                        <i class="bi bi-people" style="font-size: 50px; color: #277da1;"></i>
                        <h4 style="margin-top: 15px;">Compete with Friends</h4>
                        <p style="color: #6c757d;">Challenge your friends and see who scores the highest!</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer style="background: #ffdde1; text-align: center; padding: 15px; margin-top: 50px; font-weight: bold; color:rgb(4, 15, 25);">
            <p>&copy; 2025 Quiz Master. All rights reserved.</p>
        </footer>
    </div>
    `,
};
