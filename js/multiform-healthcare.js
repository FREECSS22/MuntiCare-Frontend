document.addEventListener("DOMContentLoaded", () => {
    try {
        sessionStorage.removeItem("munticare_show_login_skeleton_v1");
    } catch {
        // ignore storage issues
    }

    const form = document.getElementById("healthcareProfileForm");
    if (!form) return;

    const currentRaw = localStorage.getItem("munticare_current_user_v1");
    const current = currentRaw ? JSON.parse(currentRaw) : null;
    const role = String(current?.role || "").toLowerCase();
    const email = String(current?.email || "").trim().toLowerCase();

    if (!current || role !== "healthcare") {
        if (current?.route) {
            window.location.href = current.route;
        } else {
            window.location.href = "auth.html";
        }
        return;
    }

    try {
        const statusMap = JSON.parse(localStorage.getItem("munticare_staff_profile_status_v1") || "{}");
        if (statusMap[email]?.completed) {
            window.location.href = "healthcare/appointments.html";
            return;
        }
    } catch {
        // Keep user on form if status map is invalid.
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const firstName = String(formData.get("first_name") || "").trim();
        const middleName = String(formData.get("middle_name") || "").trim();
        const lastName = String(formData.get("last_name") || "").trim();
        const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
        const specialization = String(formData.get("specialization") || "").trim();
        const staffId = String(formData.get("staff_id") || "").trim();

        const details = {
            email,
            staff_id: staffId,
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            full_name: fullName,
            qualification: String(formData.get("qualification") || "").trim(),
            specialization,
            license_number: String(formData.get("license_number") || "").trim(),
            hire_date: String(formData.get("hire_date") || "").trim(),
            profile_completed: true,
            updated_at: new Date().toISOString()
        };

        persistStaffProfile(details);
        markStaffProfileCompleted(email);
        syncCurrentUser(current, details);
        syncUserRecord(email, details);

        window.location.href = "healthcare/appointments.html";
    });
});

function persistStaffProfile(details) {
    const key = "munticare_staff_profiles_v1";
    let map = {};
    try {
        map = JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
        map = {};
    }
    map[details.email] = {
        ...(map[details.email] || {}),
        ...details
    };
    localStorage.setItem(key, JSON.stringify(map));
}

function markStaffProfileCompleted(email) {
    const key = "munticare_staff_profile_status_v1";
    let map = {};
    try {
        map = JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
        map = {};
    }
    map[email] = {
        ...(map[email] || {}),
        completed: true,
        completed_at: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(map));
}

function syncCurrentUser(current, details) {
    const updated = {
        ...current,
        staff_id: details.staff_id || current?.staff_id || "",
        full_name: details.full_name || current?.full_name || "",
        specialization: details.specialization || current?.specialization || "",
        profile_completed: true
    };
    localStorage.setItem("munticare_current_user_v1", JSON.stringify(updated));
}

function syncUserRecord(email, details) {
    const key = "munticare_users_v1";
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem(key) || "[]");
        if (!Array.isArray(users)) users = [];
    } catch {
        users = [];
    }

    const idx = users.findIndex((u) => String(u?.email || "").trim().toLowerCase() === email);
    if (idx < 0) return;

    users[idx] = {
        ...users[idx],
        full_name: details.full_name || users[idx].full_name || "",
        staff_id: details.staff_id || users[idx].staff_id || "",
        specialization: details.specialization || users[idx].specialization || "",
        profile_completed: true
    };

    localStorage.setItem(key, JSON.stringify(users));
}
