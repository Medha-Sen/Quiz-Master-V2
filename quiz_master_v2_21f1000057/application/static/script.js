import Home from "./components/Home.js";
import Login from "./components/Login.js";
import Register from "./components/Register.js";
import AdminDashboard from "./components/AdminDashboard.js";
import AddSubject from "./components/AddSubject.js";
import AddChapter from "./components/AddChapter.js";
import QuizManagement from "./components/QuizManagement.js";
import AddQuiz from "./components/AddQuiz.js";
import QuizDetails from "./components/QuizDetails.js";
import AddQuestion from "./components/AddQuestion.js"; // Import AddQuestion component

const routes = [
  { path: "/", component: Home },
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { 
    path: "/admin", 
    component: AdminDashboard,
    meta: { requiresAuth: true, role: "Admin" } 
  },
  { 
    path: "/add-subject", 
    component: AddSubject, 
    meta: { requiresAuth: true, role: "Admin" }
  },
  { 
    path: "/add-chapter/:subjectId",
    component: AddChapter,
    meta: { requiresAuth: true, role: "Admin" }
  },
  { 
    path: "/quiz-management",
    component: QuizManagement,
    meta: { requiresAuth: true, role: "Admin" }
  },
  { 
    path: "/add-quiz",
    component: AddQuiz,
    meta: { requiresAuth: true, role: "Admin" }
  },
  { 
    path: "/quiz-details/:quizId", 
    component: QuizDetails, 
    meta: { requiresAuth: true, role: "Admin" }
  },
  { 
    path: "/add-questions/:quizId", 
    component: AddQuestion, 
    meta: { requiresAuth: true, role: "Admin" }
  },
  {
    path: "/edit-question/:quizId/:questionId",
    component: AddQuestion
   }
];

const router = new VueRouter({ routes });

// Authentication Helper
function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

// Route Guard
router.beforeEach((to, from, next) => {
  const user = getUser();

  if (to.meta.requiresAuth) {
    if (!user) {
      next("/login");
    } else if (to.meta.role && user.role !== to.meta.role) {
      next("/");
    } else {
      next();
    }
  } else {
    next();
  }
});

const app = new Vue({
  el: "#app",
  router,
  template: "<router-view></router-view>"
});
