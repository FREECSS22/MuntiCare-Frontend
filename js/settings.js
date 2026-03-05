document.addEventListener("DOMContentLoaded", () => {
    applyRoleTemplate();
    setupSidebar();
    setupPasswordToggle();
    setupAvatarUpload();
    setupBackButton();
    setupActions();
});

const AVATAR_STORAGE_KEY = "munticare_user_avatars_v1";
let settingsBackHref = "index.html";

function getCurrentUser() {
    try {
        const raw = localStorage.getItem("munticare_current_user_v1");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function getUserAvatarMap() {
    try {
        const raw = localStorage.getItem(AVATAR_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function saveUserAvatarMap(map) {
    localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(map));
}

function humanizeEmailName(email) {
    const local = String(email || "").split("@")[0] || "";
    if (!local) return "User";
    return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRoleConfig(role) {
    const normalizedRole = String(role || "").toLowerCase();
    const configs = {
        admin: {
            dashboardLabel: "Overview",
            dashboardHref: "admin/overview.html",
            roleLabel: "Admin",
            sections: [
                {
                    label: "Main Menu",
                    links: [
                        { href: "admin/overview.html", icon: "bi-house-door", text: "Overview" },
                        { href: "admin/inventory.html", icon: "bi-box", text: "Inventory" }
                    ]
                },
                {
                    label: "Administration",
                    links: [
                        { href: "admin/usermanagement.html", icon: "bi-people", text: "User Management" },
                        { href: "admin/feedbacks.html", icon: "bi-chat-left-text", text: "Feedbacks" }
                    ]
                }
            ]
        },
        healthcare: {
            dashboardLabel: "Appointments",
            dashboardHref: "healthcare/appointments.html",
            roleLabel: "Healthcare Staff",
            sections: [
                {
                    label: "Main Menu",
                    links: [
                        { href: "healthcare/appointments.html", icon: "bi-calendar-check", text: "Appointments" },
                        { href: "healthcare/patientmanagement.html", icon: "bi-file-text", text: "Patient Records" }
                    ]
                }
            ]
        },
        patient: {
            dashboardLabel: "Dashboard",
            dashboardHref: "patients/dashboard.html",
            roleLabel: "Patient",
            sections: [
                {
                    label: "Main Menu",
                    links: [
                        { href: "patients/dashboard.html", icon: "bi-speedometer2", text: "Dashboard" }
                    ]
                }
            ]
        }
    };

    return configs[normalizedRole] || configs.admin;
}

function renderSidebar(sections) {
    const sidebarNav = document.getElementById("settingsSidebarNav");
    if (!sidebarNav) return;

    sidebarNav.innerHTML = sections
        .map((section) => `
            <div class="menu-section">
                <p class="menu-label">${section.label}</p>
                <ul class="nav flex-column">
                    ${section.links
                        .map((link) => `
                            <li>
                                <a href="${link.href}" class="nav-link ${link.active ? "active" : ""}">
                                    <i class="bi ${link.icon}"></i>${link.text}
                                </a>
                            </li>
                        `)
                        .join("")}
                </ul>
            </div>
        `)
        .join("");
}

function applyRoleTemplate() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const normalizedRole = String(currentUser.role || "").toLowerCase();
    document.body.classList.toggle("settings-role-patient", normalizedRole === "patient");
    document.body.classList.toggle("settings-role-non-patient", normalizedRole !== "patient");

    const config = getRoleConfig(normalizedRole);
    settingsBackHref = config.dashboardHref;
    renderSidebar(config.sections);

    const userName = document.getElementById("settingsUserName");
    const userEmail = document.getElementById("settingsUserEmail");
    const userRole = document.getElementById("settingsUserRole");
    const avatarInitials = document.getElementById("settingsAvatarInitials");
    const avatarImage = document.getElementById("settingsAvatarImage");
    const fullNameInput = document.getElementById("settingsFormFullName");
    const emailInput = document.getElementById("settingsFormEmail");

    const fullName = String(currentUser.full_name || "").trim() || humanizeEmailName(currentUser.email);
    if (userName) userName.textContent = fullName;
    if (userEmail) userEmail.textContent = currentUser.email || "";
    if (userRole) userRole.textContent = config.roleLabel;
    if (fullNameInput) fullNameInput.value = fullName;
    if (emailInput) emailInput.value = currentUser.email || "";
    if (avatarInitials) {
        const initials = fullName
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() || "")
            .join("") || "U";
        avatarInitials.textContent = initials;
    }

    const emailKey = String(currentUser.email || "").trim().toLowerCase();
    if (avatarImage && avatarInitials && emailKey) {
        const avatars = getUserAvatarMap();
        const avatarData = avatars[emailKey] || "";
        if (avatarData) {
            avatarImage.src = avatarData;
            avatarImage.hidden = false;
            avatarInitials.hidden = true;
        } else {
            avatarImage.removeAttribute("src");
            avatarImage.hidden = true;
            avatarInitials.hidden = false;
        }
    }
}

function setupBackButton() {
    const backBtn = document.getElementById("settingsBackBtn");
    if (!backBtn) return;

    const currentUser = getCurrentUser();
    const isPatient = String(currentUser?.role || "").toLowerCase() === "patient";
    backBtn.hidden = !isPatient;

    backBtn.addEventListener("click", () => {
        window.location.href = settingsBackHref;
    });
}

function setupAvatarUpload() {
    const trigger = document.getElementById("settingsAvatarTrigger");
    const input = document.getElementById("settingsAvatarInput");
    const avatarImage = document.getElementById("settingsAvatarImage");
    const avatarInitials = document.getElementById("settingsAvatarInitials");
    const currentUser = getCurrentUser();
    const emailKey = String(currentUser?.email || "").trim().toLowerCase();

    if (!trigger || !input || !avatarImage || !avatarInitials || !emailKey) return;

    trigger.addEventListener("click", () => {
        input.click();
    });

    input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) return;

        if (!String(file.type || "").startsWith("image/")) {
            Swal.fire({
                icon: "warning",
                title: "Invalid File",
                text: "Please select an image file."
            });
            input.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result;
            if (typeof dataUrl !== "string" || !dataUrl) return;

            avatarImage.src = dataUrl;
            avatarImage.hidden = false;
            avatarInitials.hidden = true;

            const map = getUserAvatarMap();
            map[emailKey] = dataUrl;
            saveUserAvatarMap(map);
        };
        reader.readAsDataURL(file);
    });
}

function setupSidebar() {
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (!menuToggle || !sidebar || !overlay) return;

    const closeSidebar = () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
        document.body.classList.remove("sidebar-open");
    };

    menuToggle.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("open");
        overlay.classList.toggle("show", isOpen);
        document.body.classList.toggle("sidebar-open", isOpen);
    });

    overlay.addEventListener("click", closeSidebar);

    window.addEventListener("resize", () => {
        if (window.innerWidth > 991) closeSidebar();
    });
}

function setupPasswordToggle() {
    const buttons = document.querySelectorAll(".password-toggle-btn");
    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-target");
            const input = targetId ? document.getElementById(targetId) : null;
            if (!input) return;

            const nextType = input.type === "password" ? "text" : "password";
            input.type = nextType;

            const icon = btn.querySelector("i");
            if (icon) {
                icon.classList.toggle("bi-eye", nextType === "password");
                icon.classList.toggle("bi-eye-slash", nextType === "text");
            }
            btn.setAttribute("aria-label", nextType === "text" ? "Hide password" : "Show password");
        });
    });
}

function setupActions() {
    const cancelBtn = document.getElementById("cancelBtn");
    const saveBtn = document.getElementById("saveBtn");

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            window.history.back();
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            Swal.fire({
                icon: "success",
                title: "Saved",
                text: "Your settings have been saved successfully.",
                confirmButtonColor: "#1CDB88"
            });
        });
    }
}
