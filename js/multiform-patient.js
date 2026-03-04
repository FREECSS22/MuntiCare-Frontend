document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("patientProfileForm");
    if (!form) return;

    const currentRaw = localStorage.getItem("munticare_current_user_v1");
    const current = currentRaw ? JSON.parse(currentRaw) : null;
    const role = String(current?.role || "").toLowerCase();
    const email = String(current?.email || "").trim().toLowerCase();

    // Patient-only guard for this multiform page.
    if (!current || role !== "patient") {
        if (current?.route) {
            window.location.href = current.route;
        } else {
            window.location.href = "auth.html";
        }
        return;
    }

    // If already completed, skip form and continue to dashboard.
    try {
        const profileStatusMap = JSON.parse(localStorage.getItem("munticare_patient_profile_status_v1") || "{}");
        if (profileStatusMap[email]?.completed) {
            window.location.href = "patients/dashboard.html";
            return;
        }
    } catch {
        // Keep user on form if status map is invalid.
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const key = "munticare_patient_profile_status_v1";
        let profileStatusMap = {};
        try {
            profileStatusMap = JSON.parse(localStorage.getItem(key) || "{}");
        } catch {
            profileStatusMap = {};
        }

        profileStatusMap[email] = {
            ...(profileStatusMap[email] || {}),
            completed: true,
            completed_at: new Date().toISOString()
        };
        localStorage.setItem(key, JSON.stringify(profileStatusMap));

        const formData = new FormData(form);
        const fullName = [
            formData.get("given_name"),
            formData.get("middle_name"),
            formData.get("surname")
        ]
            .map((part) => String(part || "").trim())
            .filter(Boolean)
            .join(" ");

        const photoFile = formData.get("profile_photo");
        const photoDataUrl = photoFile instanceof File && photoFile.size > 0
            ? await fileToDataUrl(photoFile)
            : "";

        const profileStorageKey = "munticare_patient_profiles_v1";
        let profileMap = {};
        try {
            profileMap = JSON.parse(localStorage.getItem(profileStorageKey) || "{}");
        } catch {
            profileMap = {};
        }

        profileMap[email] = {
            patient_id: current.patient_id || "",
            email,
            full_name: fullName,
            given_name: String(formData.get("given_name") || "").trim(),
            middle_name: String(formData.get("middle_name") || "").trim(),
            surname: String(formData.get("surname") || "").trim(),
            sex: String(formData.get("sex") || "").trim(),
            civil_status: String(formData.get("civil_status") || "").trim(),
            dob: String(formData.get("dob") || "").trim(),
            contact: String(formData.get("contact") || "").trim(),
            blood_type: String(formData.get("blood_type") || "").trim(),
            height: String(formData.get("height") || "").trim(),
            weight: String(formData.get("weight") || "").trim(),
            allergies: String(formData.get("allergies") || "").trim(),
            chronic_conditions: String(formData.get("chronic_conditions") || "").trim(),
            photo_data_url: photoDataUrl || profileMap[email]?.photo_data_url || "",
            profile_completed: true,
            is_new_patient: true,
            updated_at: new Date().toISOString()
        };
        localStorage.setItem(profileStorageKey, JSON.stringify(profileMap));

        const updatedCurrent = {
            ...current,
            full_name: fullName || current.full_name || "",
            profile_completed: true
        };
        localStorage.setItem("munticare_current_user_v1", JSON.stringify(updatedCurrent));

        window.location.href = "patients/dashboard.html";
    });
});

function fileToDataUrl(file) {
    return new Promise((resolve) => {
        if (!(file instanceof File)) {
            resolve("");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
    });
}
