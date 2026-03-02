document.addEventListener("DOMContentLoaded", function() {
// Dummy Users Database
const users = [
    // 1 Admin
    { email: "admin@munticare.com", password: "password", role: "admin", route: "admin/overview.html" },

    //8 Healthcare Workers
    { email: "healthcare1@munticare.com", password: "healthcare123", role: "healthcare", route: "healthcare/dashboard.html" },
    { email: "healthcare2@munticare.com", password: "healthcare123", role: "healthcare", route: "healthcare/dashboard.html" },
    { email: "healthcare3@munticare.com", password: "healthcare123", role: "healthcare", route: "healthcare/dashboard.html" },
    { email: "healthcare4@munticare.com", password: "healthcare123", role: "healthcare", route: "healthcare/dashboard.html" },
    { email: "healthcare5@munticare.com", password: "healthcare123", role: "healthcare", route: "healthcare/dashboard.html" },
    { email: "healthcare6@munticare.com", password: "healthcare123", role: "healthcare", route: "healthcare/dashboard.html" },
    { email: "healthcare7@munticare.com", password: "healthcare123", role: "healthcare", route: "healthcare/dashboard.html" },
    { email: "healthcare8@munticare.com", password: "healthcare123", role: "healthcare", route: "healthcare/dashboard.html" },

    // 10 Patients
    { email: "patient1@munticare.com", password: "patient123", role: "patient", route: "patient/dashboard.html" },
    { email: "patient2@munticare.com", password: "patient123", role: "patient", route: "patient/dashboard.html" },
    { email: "patient3@munticare.com", password: "patient123", role: "patient", route: "patient/dashboard.html" },
    { email: "patient4@munticare.com", password: "patient123", role: "patient", route: "patient/dashboard.html" },
    { email: "patient5@munticare.com", password: "patient123", role: "patient", route: "patient/dashboard.html" },
    { email: "patient6@munticare.com", password: "patient123", role: "patient", route: "patient/dashboard.html" },
    { email: "patient7@munticare.com", password: "patient123", role: "patient", route: "patient/dashboard.html" },
    { email: "patient8@munticare.com", password: "patient123", role: "patient", route: "patient/dashboard.html" },
    { email: "patient9@munticare.com", password: "patient123", role: "patient", route: "patient/dashboard.html" },
    { email: "patient10@munticare.com", password: "patient123", role: "patient", route: "patient/dashboard.html" }
];

// DOM Elements
const wrapper = document.getElementById("authWrapper");
const toggleBtn = document.getElementById("toggleBtn");
const toggleIcon = document.getElementById("toggleIcon");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const panelTitle = document.getElementById("panelTitle");
const btnRegister = document.getElementById("btnRegister");

// State Variables
let isLogin = true;
let isAnimating = false;

/**
*Toggle between Login and Register forms
*/
toggleBtn.addEventListener("click", function() {
    if (isAnimating) return;
    isAnimating = true;

    wrapper.classList.toggle("slide-active");

    // Update button position
    if (isLogin) {
            toggleBtn.classList.remove("toggle-btn-left");
            toggleBtn.classList.add("toggle-btn-right");
        } else {
            toggleBtn.classList.remove("toggle-btn-right");
            toggleBtn.classList.add("toggle-btn-left");
        }

        // Fade out current form
        const currentForm = isLogin ? loginForm : registerForm;
        currentForm.classList.add("fade-out", "form-loading");

        setTimeout(() => {
            currentForm.classList.add("d-none");
            currentForm.classList.remove("fade-out", "form-loading");

            const nextForm = isLogin ? registerForm : loginForm;
            nextForm.classList.remove("d-none");
            nextForm.classList.add("fade-out");

            setTimeout(() => {
            nextForm.classList.remove("fade-out");
                nextForm.classList.add("fade-in");
            }, 50);

            // Update panel title and icon
            panelTitle.textContent = isLogin ? "Sign Up" : "Sign In";
            toggleIcon.classList.replace(
                isLogin ? "bi-arrow-left" : "bi-arrow-right",
                isLogin ? "bi-arrow-right" : "bi-arrow-left"
            );

            isLogin = !isLogin;
            setTimeout(() => {
                isAnimating = false;
            }, 300);
        }, 300);
    });

    /**
    * Handle Login Form Submission
    */
    loginForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // Find user in dummy database
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Successful login
            Swal.fire({
            icon: 'success',
                title: 'Login Successful',
                text: `Welcome ${user.role}!`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Redirect to role-specific route
                window.location.href = user.route;
            });
        } else {
            // Failed login
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: 'Invalid email or password'
            });
        }
    });

    /**
     * Handle Registration Form Submission
     */
    registerForm.addEventListener("submit", function(e) {
        e.preventDefault();

        btnRegister.disabled = true;
        btnRegister.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Registering...';
        
        // Simulate registration
        setTimeout(() => {
            Swal.fire({
                icon: 'success',
                title: 'Registration Successful',
                text: 'Please login to continue',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Switch back to login form
                toggleBtn.click();
                btnRegister.disabled = false;
                btnRegister.innerHTML = 'Register';
                registerForm.reset();
            });
        }, 1500);
    });
});