document.addEventListener("DOMContentLoaded", function () {
    const STORAGE_USERS_KEY = "munticare_users_v1";
    const STORAGE_PROFILE_STATUS_KEY = "munticare_patient_profile_status_v1";
    const STORAGE_STAFF_PROFILE_STATUS_KEY = "munticare_staff_profile_status_v1";

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

    const defaultUsers = [
        { email: "admin@munticare.com", password: "password", role: "admin", route: "admin/overview.html" },

        { email: "aiah@munticare.com", password: "password", role: "healthcare", route: "healthcare/appointments.html" },
        { email: "colet@munticare.com", password: "password", role: "healthcare", route: "healthcare/appointments.html" },
        { email: "maloi@munticare.com", password: "password", role: "healthcare", route: "healthcare/appointments.html" },
        { email: "gwen@munticare.com", password: "password", role: "healthcare", route: "healthcare/appointments.html" },
        { email: "stacey@munticare.com", password: "password", role: "healthcare", route: "healthcare/appointments.html" },
        { email: "mikha@munticare.com", password: "password", role: "healthcare", route: "healthcare/appointments.html" },
        { email: "jhoanna@munticare.com", password: "password", role: "healthcare", route: "healthcare/appointments.html" },
        { email: "sheena@munticare.com", password: "password", role: "healthcare", route: "healthcare/appointments.html" },

        { email: "mark.james@example.com", password: "password", role: "patient", route: "patients/dashboard.html", patient_id: 1, is_new_patient: false }
    ];

    const wrapper = document.getElementById("authWrapper");
    const toggleBtn = document.getElementById("toggleBtn");
    const toggleIcon = document.getElementById("toggleIcon");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const panelTitle = document.getElementById("panelTitle");
    const btnRegister = document.getElementById("btnRegister");
    const mobileShowRegister = document.getElementById("mobileShowRegister");
    const mobileShowLogin = document.getElementById("mobileShowLogin");
    const passwordToggleButtons = document.querySelectorAll(".password-toggle-btn");

    let isLogin = true;
    let isAnimating = false;

    function normalizeEmail(email) {
        return String(email || "").trim().toLowerCase();
    }

    function getUsers() {
        try {
            const raw = localStorage.getItem(STORAGE_USERS_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) {
                    return parsed;
                }
            }
        } catch {
            // ignored
        }
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(defaultUsers));
        return [...defaultUsers];
    }

    function saveUsers(users) {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    }

    function getNextPatientId(users) {
        const usedIds = new Set(
            users
            .filter((u) => u.role === "patient")
            .map((u) => Number(u.patient_id))
            .filter((id) => Number.isFinite(id) && id > 0)
        );

        // Reserve PAT-001 for the built-in dummy patient.
        let nextId = 2;
        while (usedIds.has(nextId)) {
            nextId += 1;
        }
        return nextId;
    }

    function getProfileStatusMap() {
        try {
            const raw = localStorage.getItem(STORAGE_PROFILE_STATUS_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch {
            return {};
        }
    }

    function saveProfileStatusMap(map) {
        localStorage.setItem(STORAGE_PROFILE_STATUS_KEY, JSON.stringify(map));
    }

    function getStaffProfileStatusMap() {
        try {
            const raw = localStorage.getItem(STORAGE_STAFF_PROFILE_STATUS_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch {
            return {};
        }
    }

    function saveStaffProfileStatusMap(map) {
        localStorage.setItem(STORAGE_STAFF_PROFILE_STATUS_KEY, JSON.stringify(map));
    }

    function seedDefaultPatientProfileStatus(users) {
        const map = getProfileStatusMap();
        let changed = false;
        users.forEach((user) => {
            if (user.role !== "patient") return;
            const key = normalizeEmail(user.email);
            if (!map[key]) {
                map[key] = {
                    completed: true,
                    seeded: true,
                    updated_at: new Date().toISOString()
                };
                changed = true;
            }
        });
        if (changed) saveProfileStatusMap(map);
    }

    function seedDefaultHealthcareProfileStatus(users) {
        const map = getStaffProfileStatusMap();
        let changed = false;
        users.forEach((user) => {
            if (String(user.role || "").toLowerCase() !== "healthcare") return;
            const key = normalizeEmail(user.email);
            // Only seed built-in healthcare accounts as completed.
            if (!healthcareProfileByEmail[key]) return;
            if (!map[key]) {
                map[key] = {
                    completed: true,
                    seeded: true,
                    updated_at: new Date().toISOString()
                };
                changed = true;
            }
        });
        if (changed) saveStaffProfileStatusMap(map);
    }

    function isPatientProfileComplete(email) {
        const map = getProfileStatusMap();
        return Boolean(map[normalizeEmail(email)]?.completed);
    }

    function isStaffProfileComplete(email) {
        const map = getStaffProfileStatusMap();
        return Boolean(map[normalizeEmail(email)]?.completed);
    }

    function markPatientProfileIncomplete(email, fullName) {
        const map = getProfileStatusMap();
        const key = normalizeEmail(email);
        map[key] = {
            completed: false,
            full_name: fullName || "",
            updated_at: new Date().toISOString()
        };
        saveProfileStatusMap(map);
    }

    seedDefaultPatientProfileStatus(getUsers());
    seedDefaultHealthcareProfileStatus(getUsers());

    function toggleAuthPanel() {
        if (isAnimating) return;
        isAnimating = true;

        wrapper.classList.toggle("slide-active");

        if (isLogin) {
            toggleBtn.classList.remove("toggle-btn-left");
            toggleBtn.classList.add("toggle-btn-right");
        } else {
            toggleBtn.classList.remove("toggle-btn-right");
            toggleBtn.classList.add("toggle-btn-left");
        }

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
    }

    if (toggleBtn) {
        toggleBtn.addEventListener("click", toggleAuthPanel);
    }
    if (mobileShowRegister) {
        mobileShowRegister.addEventListener("click", () => {
            if (isLogin) toggleAuthPanel();
        });
    }
    if (mobileShowLogin) {
        mobileShowLogin.addEventListener("click", () => {
            if (!isLogin) toggleAuthPanel();
        });
    }

    if (passwordToggleButtons.length) {
        passwordToggleButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const targetId = btn.getAttribute("data-target");
                const targetInput = targetId ? document.getElementById(targetId) : null;
                if (!targetInput) return;

                const nextType = targetInput.type === "password" ? "text" : "password";
                targetInput.type = nextType;
                btn.setAttribute("aria-label", nextType === "text" ? "Hide password" : "Show password");

                const icon = btn.querySelector("i");
                if (icon) {
                    icon.classList.toggle("bi-eye", nextType === "password");
                    icon.classList.toggle("bi-eye-slash", nextType === "text");
                }
            });
        });
    }

    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = normalizeEmail(document.getElementById("email").value);
        const password = document.getElementById("password").value;
        const users = getUsers();
        const user = users.find((u) => normalizeEmail(u.email) === email && u.password === password);

        if (!user) {
            Swal.fire({
                icon: "error",
                title: "Login Failed",
                text: "Invalid email or password"
            });
            return;
        }

        const staffProfile = healthcareProfileByEmail[user.email] || null;
        const needsPatientProfile = user.role === "patient" && !isPatientProfileComplete(user.email);
        const needsStaffProfile = user.role === "healthcare" && !isStaffProfileComplete(user.email);
        const redirectRoute = needsPatientProfile
            ? "multiform-patient.html"
            : needsStaffProfile
                ? "multiform-healthcare.html"
                : user.route;

        Swal.fire({
            icon: "success",
            title: "Login Successful",
            text: (needsPatientProfile || needsStaffProfile)
                ? "Please complete your profile first."
                : `Welcome ${user.role}!`,
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            try {
                sessionStorage.setItem("munticare_show_login_skeleton_v1", "1");
            } catch {
                // ignore storage issues
            }
            localStorage.setItem(
                "munticare_current_user_v1",
                JSON.stringify({
                    email: user.email,
                    role: user.role,
                    route: user.route,
                    staff_id: staffProfile?.staff_id || "",
                    full_name: staffProfile?.full_name || "",
                    specialization: staffProfile?.specialization || "",
                    profile_completed: !(needsPatientProfile || needsStaffProfile),
                    patient_id: user.patient_id || "",
                    is_new_patient: Boolean(user.is_new_patient)
                })
            );
            window.location.href = redirectRoute;
        });
    });

    registerForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const fullName = document.getElementById("registerName")?.value?.trim() || "";
        const email = normalizeEmail(document.getElementById("registerEmail")?.value);
        const password = document.getElementById("registerPassword")?.value || "";
        const confirmPassword = document.getElementById("registerConfirmPassword")?.value || "";

        if (!fullName || !email || !password || !confirmPassword) {
            Swal.fire({ icon: "warning", title: "Missing fields", text: "Please complete all registration fields." });
            return;
        }

        if (password !== confirmPassword) {
            Swal.fire({ icon: "error", title: "Password mismatch", text: "Password and confirm password must match." });
            return;
        }

        const users = getUsers();
        const exists = users.some((u) => normalizeEmail(u.email) === email);
        if (exists) {
            Swal.fire({ icon: "error", title: "Email already used", text: "Please use another email address." });
            return;
        }

        btnRegister.disabled = true;
        btnRegister.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Registering...';

        const newUser = {
            email,
            password,
            role: "patient",
            route: "patients/dashboard.html",
            patient_id: getNextPatientId(users),
            is_new_patient: true
        };
        users.push(newUser);
        saveUsers(users);
        markPatientProfileIncomplete(email, fullName);

        setTimeout(() => {
            Swal.fire({
                icon: "success",
                title: "Registration Successful",
                text: "Please complete your patient profile.",
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                localStorage.setItem(
                    "munticare_current_user_v1",
                    JSON.stringify({
                        email: newUser.email,
                        role: newUser.role,
                        route: newUser.route,
                        staff_id: "",
                        full_name: fullName,
                        specialization: "",
                        profile_completed: false,
                        patient_id: newUser.patient_id,
                        is_new_patient: true
                    })
                );
                window.location.href = "multiform-patient.html";
            });
        }, 700);
    });
});
