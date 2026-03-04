document.addEventListener("DOMContentLoaded", function() {
const healthcareProfileByEmail = {
    "aiah@munticare.com": { staff_id: "1", full_name: "Dr. Maraiah Queen Arceta", specialization: "Pediatrics" },
    "colet@munticare.com": { staff_id: "2", full_name: "Dr. Nicolette Vergara", specialization: "Internal Medicine" },
    "maloi@munticare.com": { staff_id: "3", full_name: "Dr. Mary Loi Yves Ricalde", specialization: "Family Medicine" },
    "gwen@munticare.com": { staff_id: "4", full_name: "Dr. Gweneth Apuli", specialization: "Obstetrics and Gynecology" },
    "stacey@munticare.com": { staff_id: "5", full_name: "Dr. Stacey Sevilleja", specialization: "Dermatology" },
    "mikha@munticare.com": { staff_id: "9", full_name: "Dr. Mikhaela Lim", specialization: "Cardiology" },
    "jhoanna@munticare.com": { staff_id: "10", full_name: "Dr. Jhoanna Robles", specialization: "Orthopedics" },
    "sheena@munticare.com": { staff_id: "11", full_name: "Dr. Sheena Catacutan", specialization: "Pediatrics" }
};

// Dummy Users Database
const users = [
    // 1 Admin
    { email: "admin@munticare.com", password: "password", role: "admin", route: "admin/overview.html" },

    //8 Healthcare Workers
    { email: "aiah@munticare.com", password: "password", role: "healthcare", route: "healthcare/appointments.html" },
    { email: "colet@munticare.com", password: "password", role: "healthcare", route: "healthcare/appointments.html" },
    { email: "maloi@munticare.com", password: "password", role: "healthcare", route: "healthcare/appointments.html" },
    { email: "gwen@munticare.com", password: "password", role: "healthcare", route: "healthcare/appointments.html" },
    { email: "stacey@munticare.com", password: "password", role: "healthcare", route: "healthcare/appointments.html" },
    { email: "mikha@munticare.com", password: "password", role: "healthcare", route: "healthcare/appointments.html" },
    { email: "jhoanna@munticare.com", password: "password", role: "healthcare", route: "healthcare/appointments.html" },
    { email: "sheena@munticare.com", password: "password", role: "healthcare", route: "healthcare/appointments.html" },

    // 10 Patients
    { email: "mark.james@example.com", password: "password", role: "patient", route: "patients/dashboard.html" },
    { email: "sarah.williams@example.com", password: "password", role: "patient", route: "patients/dashboard.html" },
    { email: "robert.brown@example.com", password: "password", role: "patient", route: "patients/dashboard.html" },
    { email: "john.doe@example.com", password: "password", role: "patient", route: "patients/dashboard.html" },
    { email: "jane.smith@example.com", password: "password", role: "patient", route: "patients/dashboard.html" },
    { email: "maria.santos@example.com", password: "password", role: "patient", route: "patients/dashboard.html" },
    { email: "jose.delacruz@example.com", password: "password", role: "patient", route: "patients/dashboard.html" },
    { email: "ana.reyes@example.com", password: "password", role: "patient", route: "patients/dashboard.html" },
    { email: "luis.garcia@example.com", password: "password", role: "patient", route: "patients/dashboard.html" },
    { email: "clara.mendoza@example.com", password: "password", role: "patient", route: "patients/dashboard.html" }
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
                const staffProfile = healthcareProfileByEmail[user.email] || null;
                localStorage.setItem("munticare_current_user_v1", JSON.stringify({
                    email: user.email,
                    role: user.role,
                    route: user.route,
                    staff_id: staffProfile?.staff_id || "",
                    full_name: staffProfile?.full_name || "",
                    specialization: staffProfile?.specialization || ""
                }));
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
