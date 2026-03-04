const STORAGE_KEYS = [
    "munticare_demo_appointments_v1",
    "munticare_appointments_v1",
    "munticare_appointments",
    "appointments"
];
const DEMO_STORAGE_KEY = "munticare_demo_appointments_v1";
const LEGACY_PATIENT_LABELS = {
    "patient1@example.com": "Mark James",
    "patient2@example.com": "Sarah Williams",
    "patient3@example.com": "Robert Brown",
    "patient4@example.com": "John Doe",
    "patient5@example.com": "Jane Smith",
    "patient6@example.com": "Maria Santos",
    "patient7@example.com": "Jose Delacruz",
    "patient8@example.com": "Ana Reyes",
    "patient9@example.com": "Luis Garcia",
    "patient10@example.com": "Clara Mendoza"
};
const LEGACY_PATIENT_BY_ID = {
    "1": "Mark James",
    "2": "Sarah Williams",
    "3": "Robert Brown",
    "4": "John Doe",
    "5": "Jane Smith",
    "6": "Maria Santos",
    "7": "Jose Delacruz",
    "8": "Ana Reyes",
    "9": "Luis Garcia",
    "10": "Clara Mendoza"
};
const LEGACY_EMAIL_BY_ID = {
    "1": "mark.james@example.com",
    "2": "sarah.williams@example.com",
    "3": "robert.brown@example.com",
    "4": "john.doe@example.com",
    "5": "jane.smith@example.com",
    "6": "maria.santos@example.com",
    "7": "jose.delacruz@example.com",
    "8": "ana.reyes@example.com",
    "9": "luis.garcia@example.com",
    "10": "clara.mendoza@example.com"
};

let allRecords = [];
let filteredRecords = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

document.addEventListener("DOMContentLoaded", () => {
    setupSidebar();
    setupFilters();
    loadPatientRecords();
});

function setupSidebar() {
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    if (!menuToggle || !sidebar || !sidebarOverlay) return;

    const closeSidebar = () => {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("show");
        document.body.classList.remove("sidebar-open");
    };

    menuToggle.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("open");
        sidebarOverlay.classList.toggle("show", isOpen);
        document.body.classList.toggle("sidebar-open", isOpen);
    });

    sidebarOverlay.addEventListener("click", closeSidebar);

    window.addEventListener("resize", () => {
        if (window.innerWidth > 991) closeSidebar();
    });
}

function setupFilters() {
    const form = document.getElementById("patientFiltersForm");
    const clearBtn = document.getElementById("clearFiltersBtn");

    if (form) {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            applyFilters();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            const search = document.getElementById("searchPatient");
            const date = document.getElementById("appointmentDate");
            const time = document.getElementById("appointmentTime");

            if (search) search.value = "";
            if (date) date.value = "";
            if (time) time.value = "";

            applyFilters();
        });
    }
}

function loadPatientRecords() {
    const source = readFirstAvailableStorage();
    const cleaned = removeLegacySeededDummyAppointments(source.list);
    if (source.key && cleaned.length !== source.list.length) {
        localStorage.setItem(source.key, JSON.stringify(cleaned));
    }
    allRecords = cleaned.map(normalizeRecord).filter(Boolean);
    applyFilters();
}

function removeLegacySeededDummyAppointments(list) {
    const legacyIds = new Set([2001, 2002, 2003]);
    const legacyPatientIds = new Set([101, 102, 103]);
    return (Array.isArray(list) ? list : []).filter((item) => {
        const id = Number(item?.id);
        const patientId = Number(item?.patient_id ?? item?.patient?.id);
        const isLegacySeed = legacyIds.has(id) && legacyPatientIds.has(patientId);
        return !isLegacySeed;
    });
}

function readFirstAvailableStorage() {
    for (const key of STORAGE_KEYS) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return { key, list: parsed };
        } catch {
            // Try next key
        }
    }

    return { key: "", list: [] };
}

function normalizeRecord(item) {
    if (!item || typeof item !== "object") return null;

    const patientId = item.patient_id ?? item.patient?.id ?? item.patient?.user_id ?? item.patient?.user?.id ?? item.id ?? "";
    const patientProfiles = readPatientProfiles();
    const profileByEmail = findProfileByEmail(patientProfiles, item.patient_email || item.patient?.email || item.patient?.user?.email || "");
    const profileById = findProfileByPatientId(patientProfiles, patientId);
    const resolvedProfile = profileByEmail || profileById || null;
    const patientName =
        resolvedProfile?.full_name ||
        [resolvedProfile?.given_name, resolvedProfile?.surname].filter(Boolean).join(" ") ||
        item.patient_name ||
        item.patient?.full_name ||
        item.patient?.given_name ||
        item.patient?.user?.profile?.full_name ||
        item.patient?.user?.name ||
        LEGACY_PATIENT_LABELS[item.patient?.user?.email] ||
        LEGACY_PATIENT_LABELS[item.patient_email] ||
        LEGACY_PATIENT_BY_ID[String(patientId)] ||
        item.patient?.name ||
        (patientId ? `Patient #${patientId}` : "N/A");
    let patientEmail = resolvedProfile?.email || item.patient_email || item.patient?.email || item.patient?.user?.email || "";
    if (!patientEmail && LEGACY_EMAIL_BY_ID[String(patientId)]) {
        patientEmail = LEGACY_EMAIL_BY_ID[String(patientId)];
    }
    if (!patientEmail && patientName && patientName !== "N/A" && !patientName.startsWith("Patient #")) {
        patientEmail = toExampleEmail(patientName);
    }

    const bloodType = resolvedProfile?.blood_type || item.blood_type || item.patient?.blood_type || item.patient_blood_type || "N/A";
    const appointmentDate = item.appointment_date || item.date || "";
    const startTime = item.start_time || item.time || "";

    return {
        raw: item,
        patientId: String(patientId || ""),
        patientName,
        patientEmail,
        bloodType,
        appointmentDate,
        startTime
    };
}

function readPatientProfiles() {
    try {
        const raw = localStorage.getItem("munticare_patient_profiles_v1");
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function findProfileByEmail(profileMap, email) {
    const key = String(email || "").trim().toLowerCase();
    if (!key) return null;
    return profileMap[key] || null;
}

function findProfileByPatientId(profileMap, patientId) {
    const id = String(patientId || "");
    if (!id) return null;
    return Object.values(profileMap).find((profile) => String(profile?.patient_id || "") === id) || null;
}

function applyFilters() {
    const searchValue = (document.getElementById("searchPatient")?.value || "").trim().toLowerCase();
    const appointmentDate = document.getElementById("appointmentDate")?.value || "";
    const appointmentTime = document.getElementById("appointmentTime")?.value || "";

    const filtered = allRecords.filter((record) => {
        const matchSearch =
            !searchValue ||
            record.patientName.toLowerCase().includes(searchValue) ||
            record.patientEmail.toLowerCase().includes(searchValue) ||
            record.patientId.toLowerCase().includes(searchValue);

        const matchDate = !appointmentDate || record.appointmentDate === appointmentDate;
        const matchTime = !appointmentTime || record.startTime === appointmentTime;

        return matchSearch && matchDate && matchTime;
    });

    filteredRecords = filtered;
    currentPage = 1;
    renderPaginatedResults();
    renderEmptyState(filtered.length === 0, {
        hasFilters: Boolean(searchValue || appointmentDate || appointmentTime)
    });
}

function renderPaginatedResults() {
    const totalItems = filteredRecords.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageItems = filteredRecords.slice(startIndex, endIndex);

    renderTable(pageItems);
    renderPagination(totalItems, totalPages, startIndex, Math.min(endIndex, totalItems));
}

function renderTable(records) {
    const tbody = document.getElementById("patientTableBody");
    if (!tbody) return;

    tbody.innerHTML = records
        .map(
            (record) => `
            <tr>
                <td>
                    <i class="bi bi-person-circle me-2 text-secondary"></i>
                    <span>${escapeHtml(record.patientName)}</span>
                    <div class="text-muted small">${escapeHtml(record.patientEmail || "no-email@example.com")}</div>
                </td>
                <td>
                    ${formatDateTime(record.appointmentDate, record.startTime)}
                </td>
                <td class="text-center">
                    <button type="button" class="btn btn-sm btn-outline-primary" data-patient-id="${escapeHtml(record.patientId)}">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                </td>
            </tr>
        `
        )
        .join("");

	    tbody.querySelectorAll("button[data-patient-id]").forEach((button) => {
	        button.addEventListener("click", () => {
	            const id = button.getAttribute("data-patient-id") || "";
	            const selected = records.find((record) => String(record.patientId) === String(id));
	            if (selected) {
	                localStorage.setItem("munticare_selected_patient_v1", JSON.stringify(selected));
	            }
	            window.location.href = `patientprofile.html?patient_id=${encodeURIComponent(id)}`;
	        });
	    });
}

function renderEmptyState(isEmpty, options) {
    const emptyState = document.getElementById("emptyState");
    const tableWrap = document.getElementById("tableWrap");
    const emptyText = document.getElementById("emptyStateText");
    if (!emptyState || !tableWrap || !emptyText) return;

    if (isEmpty) {
        emptyState.classList.remove("d-none");
        tableWrap.classList.add("d-none");
        const paginationWrap = document.getElementById("paginationWrap");
        if (paginationWrap) paginationWrap.innerHTML = "";
        emptyText.textContent = options.hasFilters
            ? "No patients found matching your search criteria."
            : "You don't have any assigned patients yet.";
    } else {
        emptyState.classList.add("d-none");
        tableWrap.classList.remove("d-none");
    }
}

function renderPagination(totalItems, totalPages, start, end) {
    const paginationWrap = document.getElementById("paginationWrap");
    if (!paginationWrap) return;

    if (totalItems === 0) {
        paginationWrap.innerHTML = "";
        return;
    }

    let pageButtons = "";
    for (let page = 1; page <= totalPages; page++) {
        pageButtons += `
            <button class="pg-btn ${page === currentPage ? "active" : ""}" data-page="${page}">
                ${page}
            </button>
        `;
    }

    paginationWrap.innerHTML = `
        <span>Showing ${start + 1} to ${end} of ${totalItems} entries</span>
        <div class="pagination-btns">
            <button class="pg-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>
                <i class="bi bi-chevron-left"></i>
            </button>
            ${pageButtons}
            <button class="pg-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>
                <i class="bi bi-chevron-right"></i>
            </button>
        </div>
    `;

    paginationWrap.querySelectorAll(".pg-btn[data-page]").forEach((button) => {
        button.addEventListener("click", () => {
            const nextPage = parseInt(button.getAttribute("data-page"), 10);
            if (Number.isNaN(nextPage) || nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
                return;
            }
            currentPage = nextPage;
            renderPaginatedResults();
        });
    });
}

function formatDateTime(dateValue, timeValue) {
    const hasDate = Boolean(dateValue);
    const hasTime = Boolean(timeValue);

    if (!hasDate && !hasTime) return "N/A";

    const dateText = hasDate ? formatDate(dateValue) : "";
    const timeText = hasTime ? formatTime(timeValue) : "";

    return `
        <div>${escapeHtml(dateText)}</div>
        <div class="text-muted">${escapeHtml(timeText)}</div>
    `;
}

function formatDate(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateValue;

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit"
    });
}

function formatTime(timeValue) {
    const [hours, minutes] = String(timeValue).split(":");
    const hour = parseInt(hours, 10);
    if (Number.isNaN(hour)) return timeValue;

    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes || "00"} ${ampm}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function toExampleEmail(fullName) {
    const slug = String(fullName)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, ".");
    return slug ? `${slug}@example.com` : "";
}
