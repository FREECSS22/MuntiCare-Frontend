document.addEventListener("DOMContentLoaded", () => {
    setupSidebar();
    hydrateSelectedPatient();
    setupVaccineTabActions();
    setupHistoryTabActions();
    restoreClinicalSnapshots();
    setupSummaryAppointmentCard();
    setTimeout(() => {
        renderSummaryRecentVaccine();
        renderSummaryAppointment();
    }, 350);
    observeDashboardUpdates();
});

const HEALTHCARE_STAFF_BY_EMAIL = {
    "aiah@munticare.com": { id: "1", name: "Dr. Maraiah Queen Arceta", specialization: "Pediatrics" },
    "colet@munticare.com": { id: "2", name: "Dr. Nicolette Vergara", specialization: "Internal Medicine" },
    "maloi@munticare.com": { id: "3", name: "Dr. Mary Loi Yves Ricalde", specialization: "Family Medicine" },
    "gwen@munticare.com": { id: "4", name: "Dr. Gweneth Apuli", specialization: "Obstetrics and Gynecology" },
    "stacey@munticare.com": { id: "5", name: "Dr. Stacey Sevilleja", specialization: "Dermatology" },
    "mikha@munticare.com": { id: "9", name: "Dr. Mikhaela Lim", specialization: "Cardiology" },
    "jhoanna@munticare.com": { id: "10", name: "Dr. Jhoanna Robles", specialization: "Orthopedics" },
    "sheena@munticare.com": { id: "11", name: "Dr. Sheena Catacutan", specialization: "Pediatrics" }
};

const STAFF_NAME_BY_ID = {
    "1": "Dr. Maraiah Queen Arceta",
    "2": "Dr. Nicolette Vergara",
    "3": "Dr. Mary Loi Yves Ricalde",
    "4": "Dr. Gweneth Apuli",
    "5": "Dr. Stacey Sevilleja",
    "9": "Dr. Mikhaela Lim",
    "10": "Dr. Jhoanna Robles",
    "11": "Dr. Sheena Catacutan"
};

const LOCAL_BATCHES_BY_VACCINE = {
    "COVID-19 mRNA Vaccine (Pfizer-BioNTech)": [
        { id: "PFZ-1023", label: "PFZ-1023" },
        { id: "PFZ-1024", label: "PFZ-1024" }
    ],
    "Influenza (Flu) Vaccine": [
        { id: "FLU-2026-A", label: "FLU-2026-A" },
        { id: "FLU-2026-B", label: "FLU-2026-B" }
    ],
    "Hepatitis B Vaccine": [
        { id: "HEPB-88X", label: "HEPB-88X" }
    ],
    "Tetanus Vaccine": [
        { id: "TET-450", label: "TET-450" }
    ]
};

const APPOINTMENT_STORAGE_KEYS = [
    "munticare_demo_appointments_v1",
    "munticare_appointments_v1",
    "munticare_appointments",
    "appointments"
];

let selectedPatientIdForProfile = "1";
let selectedPatientEmailForProfile = "";

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

function hydrateSelectedPatient() {
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get("patient_id");

    let selected = null;
    try {
        const raw = localStorage.getItem("munticare_selected_patient_v1");
        selected = raw ? JSON.parse(raw) : null;
    } catch {
        selected = null;
    }

    const nameEl = document.querySelector(".patient-name");
    const idEl = document.querySelector(".patient-id");
    const hiddenPatientId = document.querySelector('input[name="patient_id"]');

    const selectedEmail = selected?.patientEmail || selected?.raw?.patient_email || selected?.raw?.patient?.user?.email || "";
    const resolvedId = patientId || selected?.patientId || selected?.raw?.patient_id || "1";
    const resolvedName =
        selected?.patientName ||
        selected?.raw?.patient_name ||
        selected?.raw?.patient?.user?.profile?.full_name ||
        selected?.raw?.patient?.given_name ||
        "Patient";

    if (nameEl) nameEl.textContent = resolvedName;
    if (idEl) idEl.textContent = `Patient ID: PAT-${String(resolvedId).padStart(3, "0")}`;
    if (hiddenPatientId) hiddenPatientId.value = resolvedId;
    selectedPatientIdForProfile = String(resolvedId);
    selectedPatientEmailForProfile = String(selectedEmail || "").toLowerCase();

    hydrateSelectedPatientProfile(resolvedId, selected);
}

function hydrateSelectedPatientProfile(resolvedId, selected) {
    const profiles = readPatientProfiles();
    const selectedEmail = selected?.patientEmail || selected?.raw?.patient_email || selected?.raw?.patient?.user?.email || "";

    const byEmail = selectedEmail ? profiles[String(selectedEmail).toLowerCase()] : null;
    const byId = Object.values(profiles).find((profile) => String(profile?.patient_id || "") === String(resolvedId));
    const profile = byEmail || byId || null;
    if (!profile) return;
    selectedPatientEmailForProfile = String(profile.email || selectedPatientEmailForProfile || "").toLowerCase();

    const photoEl = document.getElementById("profilePatientImg");
    if (photoEl && profile.photo_data_url) photoEl.src = profile.photo_data_url;

    const ageEl = document.getElementById("profilePatientAge");
    const dobText = formatDate(profile.dob);
    const age = calculateAge(profile.dob);
    if (ageEl) ageEl.textContent = `Age: ${age !== null ? age : "N/A"}`;

    setText("profilePatientDob", dobText || "N/A");
    setText("profilePatientGender", profile.sex || "N/A");
    setText("profilePatientBloodType", profile.blood_type || "N/A");
    setText("profilePatientCivilStatus", profile.civil_status || "N/A");

    setText("profileAllergiesValue", profile.allergies || "N/A");
    setText("profileChronicValue", profile.chronic_conditions || "N/A");
    setText("profileBloodTypeValue", profile.blood_type || "N/A");
    setText("profileHeightValue", profile.height ? `${profile.height} cm` : "N/A");
    setText("profileWeightValue", profile.weight ? `${profile.weight} kg` : "N/A");

    const bmi = calculateBmi(profile.height, profile.weight);
    setText("profileBmiValue", bmi !== null ? bmi.toFixed(1) : "N/A");

    if (profile.is_new_patient) {
        clearDummyClinicalSections();
    }
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

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function formatDate(dob) {
    if (!dob) return "";
    const date = new Date(`${dob}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function calculateAge(dob) {
    if (!dob) return null;
    const birth = new Date(`${dob}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
    return age >= 0 ? age : null;
}

function calculateBmi(heightCm, weightKg) {
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!h || !w) return null;
    const hm = h / 100;
    if (hm <= 0) return null;
    return w / (hm * hm);
}

function clearDummyClinicalSections() {
    const vaccineList = document.getElementById("vaccineRecordsList");
    if (vaccineList) {
        vaccineList.innerHTML = '<p class="text-muted mb-0">No vaccine records yet.</p>';
    }

    const diagnosisList = document.getElementById("diagnosisList");
    if (diagnosisList) {
        diagnosisList.innerHTML = '<p class="text-muted mb-0">No medical records available.</p>';
    }

    const prescriptionsList = document.getElementById("prescriptionsList");
    if (prescriptionsList) {
        prescriptionsList.innerHTML = '<p class="text-muted mb-0">No prescriptions available.</p>';
    }

    const historyFileList = document.getElementById("historyFileList");
    if (historyFileList) {
        historyFileList.innerHTML = '<p class="text-muted mb-0">No attachments available.</p>';
    }

    const auditTrailList = document.getElementById("auditTrailList");
    if (auditTrailList) {
        auditTrailList.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No audit trails available.</td></tr>';
    }

    persistClinicalSnapshots();
}

function getClinicalSnapshotKey() {
    if (selectedPatientEmailForProfile) return selectedPatientEmailForProfile;
    return `id:${selectedPatientIdForProfile}`;
}

function readClinicalSnapshotsStore() {
    try {
        const raw = localStorage.getItem("munticare_patient_clinical_snapshots_v1");
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function persistClinicalSnapshots() {
    const key = getClinicalSnapshotKey();
    if (!key) return;

    const store = readClinicalSnapshotsStore();
    store[key] = {
        vaccineHtml: document.getElementById("vaccineRecordsList")?.innerHTML || "",
        diagnosisHtml: document.getElementById("diagnosisList")?.innerHTML || "",
        prescriptionsHtml: document.getElementById("prescriptionsList")?.innerHTML || "",
        filesHtml: document.getElementById("historyFileList")?.innerHTML || "",
        auditHtml: document.getElementById("auditTrailList")?.innerHTML || "",
        updated_at: new Date().toISOString()
    };
    localStorage.setItem("munticare_patient_clinical_snapshots_v1", JSON.stringify(store));
}

function restoreClinicalSnapshots() {
    const key = getClinicalSnapshotKey();
    if (!key) return;
    const store = readClinicalSnapshotsStore();
    const snapshot = store[key];
    if (!snapshot) return;

    const vaccineList = document.getElementById("vaccineRecordsList");
    const diagnosisList = document.getElementById("diagnosisList");
    const prescriptionsList = document.getElementById("prescriptionsList");
    const historyFileList = document.getElementById("historyFileList");
    const auditTrailList = document.getElementById("auditTrailList");

    if (vaccineList && typeof snapshot.vaccineHtml === "string") vaccineList.innerHTML = snapshot.vaccineHtml;
    if (diagnosisList && typeof snapshot.diagnosisHtml === "string") diagnosisList.innerHTML = snapshot.diagnosisHtml;
    if (prescriptionsList && typeof snapshot.prescriptionsHtml === "string") prescriptionsList.innerHTML = snapshot.prescriptionsHtml;
    if (historyFileList && typeof snapshot.filesHtml === "string") historyFileList.innerHTML = snapshot.filesHtml;
    if (auditTrailList && typeof snapshot.auditHtml === "string") auditTrailList.innerHTML = snapshot.auditHtml;
}

function setupVaccineTabActions() {
    const list = document.getElementById("vaccineRecordsList");
    const form = document.getElementById("addVaccineForm");
    if (!list || !form) return;

    const vaccineSelect = document.getElementById("vaccineSelect");
    const batchSelect = document.getElementById("vaccineBatchSelect");
    const administrationDateInput = form.querySelector('input[name="administration_date"]');

    if (administrationDateInput) {
        administrationDateInput.value = new Date().toISOString().split("T")[0];
    }

    hydrateAdministeredBy();

    if (vaccineSelect && batchSelect) {
        vaccineSelect.addEventListener("change", async () => {
            const vaccineName = vaccineSelect.value;
            if (!vaccineName) {
                batchSelect.innerHTML = '<option value="">Select vaccine first</option>';
                batchSelect.disabled = true;
                return;
            }

            batchSelect.disabled = true;
            batchSelect.innerHTML = '<option value="">Loading batches...</option>';

            const batches = await fetchVaccineBatches(vaccineName);
            if (!batches.length) {
                batchSelect.innerHTML = '<option value="">No batches available</option>';
                batchSelect.disabled = true;
                return;
            }

            batchSelect.innerHTML = '<option value="">Select batch</option>';
            batches.forEach((batch) => {
                const option = document.createElement("option");
                option.value = batch.id || "";
                option.textContent = batch.label || batch.id || "Batch";
                batchSelect.appendChild(option);
            });
            batchSelect.disabled = false;
        });
    }

    list.addEventListener("click", (event) => {
        const btn = event.target.closest(".delete-vaccine-btn");
        if (!btn) return;

        const row = btn.closest(".list-group-item");
        if (!row) return;

        confirmWithModal("Delete vaccine record", "Are you sure you want to delete this vaccine record? This action cannot be undone.")
            .then((confirmed) => {
                if (!confirmed) return;

                row.remove();
                showToast("Vaccine record deleted.", "success");
                if (!list.children.length) {
                    list.innerHTML = '<p class="text-muted mb-0">No vaccine records yet.</p>';
                }
                persistClinicalSnapshots();
                renderSummaryRecentVaccine();
            });
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(form);

        const vaccineName = data.get("vaccine_name");
        const vaccineBatch = data.get("vaccine_batch");
        const administrationDate = data.get("administration_date");
        const nextDueDate = data.get("next_due_date");
        const doseNumber = data.get("dose_number");
        const notes = data.get("notes");

        if (!vaccineName || !vaccineBatch || !administrationDate || !doseNumber) {
            showToast("Please complete required fields.", "error");
            return;
        }

        const dateText = formatDate(administrationDate);
        const nextDueText = nextDueDate ? ` | Next due: ${formatDate(nextDueDate)}` : "";
        const notesHtml = notes ? `<br><small class="text-muted"><i class="bi bi-journal-text"></i> ${escapeHtml(notes)}</small>` : "";

        if (list.querySelector("p.text-muted")) {
            list.innerHTML = "";
        }

        list.insertAdjacentHTML("afterbegin", `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <div class="fw-bold">${escapeHtml(vaccineName)} (Dose ${escapeHtml(doseNumber)})</div>
                    <small class="text-muted">Given on ${escapeHtml(dateText)}${escapeHtml(nextDueText)}</small>
                    ${notesHtml}
                </div>
                <div class="d-flex gap-1">
                    <button type="button" class="btn btn-sm btn-link text-danger delete-vaccine-btn" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `);

        const modalEl = document.getElementById("addVaccineModal");
        const modal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
        modal?.hide();

        form.reset();
        if (administrationDateInput) administrationDateInput.value = new Date().toISOString().split("T")[0];
        if (batchSelect) {
            batchSelect.innerHTML = '<option value="">Select vaccine first</option>';
            batchSelect.disabled = true;
        }

        showToast("Vaccine record added successfully.", "success");
        persistClinicalSnapshots();
        renderSummaryRecentVaccine();
    });
}

function setupSummaryAppointmentCard() {
    const statusSelect = document.getElementById("summaryStatusSelect");
    if (!statusSelect) return;

    statusSelect.addEventListener("change", () => {
        const appointmentId = statusSelect.getAttribute("data-appointment-id");
        const nextStatus = normalizeStatus(statusSelect.value);
        if (!appointmentId || !nextStatus) return;

        const updated = updateAppointmentStatus(appointmentId, nextStatus);
        if (updated) {
            showToast("Appointment status updated.", "success");
            renderSummaryAppointment();
        } else {
            showToast("Unable to update appointment.", "error");
        }
    });
}

function setupHistoryTabActions() {
    const diagnosisForm = document.getElementById("addDiagnosisForm");
    const prescriptionForm = document.getElementById("addPrescriptionForm");
    const uploadFileForm = document.getElementById("uploadHistoryFileForm");
    const diagnosisList = document.getElementById("diagnosisList");
    const prescriptionsList = document.getElementById("prescriptionsList");
    const fileList = document.getElementById("historyFileList");

    document.addEventListener("click", (event) => {
        const previewBtn = event.target.closest(".history-preview-btn");
        if (!previewBtn) return;
        event.preventDefault();
        previewFile(previewBtn.dataset.filePath || "", previewBtn.dataset.fileName || "File Preview");
    });

    if (diagnosisForm && diagnosisList) {
        diagnosisForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const data = new FormData(diagnosisForm);
            const diagnosis = String(data.get("diagnosis") || "").trim();
            const treatment = String(data.get("treatment") || "").trim();
            const notes = String(data.get("notes") || "").trim();
            if (!diagnosis || !treatment) {
                showToast("Please complete required fields.", "error");
                return;
            }

            if (diagnosisList.querySelector("p.text-muted")) {
                diagnosisList.innerHTML = "";
            }

            diagnosisList.insertAdjacentHTML(
                "afterbegin",
                `
                <div class="mb-3">
                    <div class="fw-bold">${escapeHtml(diagnosis)}</div>
                    <small class="text-muted d-block">${escapeHtml(treatment)}</small>
                    ${notes ? `<small class="text-muted d-block"><i class="bi bi-journal-text"></i> ${escapeHtml(notes)}</small>` : ""}
                    <small class="text-secondary">${escapeHtml(getCurrentStaffDisplayName())}</small>
                </div>
            `
            );

            appendAuditTrail("Diagnosis Added");
            bootstrap.Modal.getInstance(document.getElementById("addDiagnosisModal"))?.hide();
            diagnosisForm.reset();
            showToast("Diagnosis record added.", "success");
            persistClinicalSnapshots();
        });
    }

    if (prescriptionForm && prescriptionsList) {
        prescriptionForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const data = new FormData(prescriptionForm);
            const medicine = String(data.get("medicine") || "").trim();
            const dosage = String(data.get("dosage") || "").trim();
            const duration = String(data.get("duration") || "").trim();
            const instructions = String(data.get("instructions") || "").trim();

            if (!medicine || !dosage) {
                showToast("Please complete required fields.", "error");
                return;
            }

            if (prescriptionsList.querySelector("p.text-muted")) {
                prescriptionsList.innerHTML = "";
            }

            const suffix = duration ? ` | ${duration}` : "";
            prescriptionsList.insertAdjacentHTML(
                "afterbegin",
                `
                <div class="mb-3">
                    <div class="fw-bold">${escapeHtml(medicine)} - ${escapeHtml(dosage)}</div>
                    ${instructions ? `<small class="text-muted d-block">${escapeHtml(instructions)}</small>` : ""}
                    <small class="text-secondary">Prescribed by ${escapeHtml(getCurrentStaffDisplayName())} • ${escapeHtml(formatDate(new Date().toISOString().split("T")[0]))}${escapeHtml(suffix)}</small>
                </div>
            `
            );

            appendAuditTrail("Prescription Added");
            bootstrap.Modal.getInstance(document.getElementById("addPrescriptionModal"))?.hide();
            prescriptionForm.reset();
            showToast("Prescription added.", "success");
            persistClinicalSnapshots();
        });
    }

    if (uploadFileForm && fileList) {
        uploadFileForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const data = new FormData(uploadFileForm);
            const file = data.get("file");
            if (!(file instanceof File) || !file.name) {
                showToast("Please choose a file.", "error");
                return;
            }

            if (fileList.querySelector("p.text-muted")) {
                fileList.innerHTML = "";
            }

            const description = String(data.get("description") || "").trim();
            const fileType = String(data.get("file_type") || "Other").trim();
            const fileUrl = URL.createObjectURL(file);
            const now = new Date();
            const stamp = now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) +
                " " +
                now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

            fileList.insertAdjacentHTML(
                "afterbegin",
                `
                <div class="file-attachment">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="d-flex gap-3 flex-grow-1">
                            <div class="file-icon text-secondary">
                                <i class="bi bi-file-earmark-text"></i>
                            </div>
                            <div class="flex-grow-1">
                                <div class="fw-bold">${escapeHtml(file.name)}</div>
                                <small class="text-muted d-block">${escapeHtml(fileType)}</small>
                                ${description ? `<small class="d-block text-muted">${escapeHtml(description)}</small>` : ""}
                                <small class="text-muted">Uploaded on ${escapeHtml(stamp)}</small>
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-primary me-1 history-preview-btn" data-file-path="${escapeHtml(fileUrl)}" data-file-name="${escapeHtml(file.name)}">
                                <i class="bi bi-eye"></i> Preview
                            </button>
                            <a href="${escapeHtml(fileUrl)}" download="${escapeHtml(file.name)}" class="btn btn-sm btn-outline-success">
                                <i class="bi bi-download"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `
            );

            appendAuditTrail("File Uploaded");
            bootstrap.Modal.getInstance(document.getElementById("uploadFileModal"))?.hide();
            uploadFileForm.reset();
            showToast("File uploaded successfully.", "success");
            persistClinicalSnapshots();
        });
    }
}

function appendAuditTrail(action) {
    const body = document.getElementById("auditTrailList");
    if (!body) return;

    const emptyRow = body.querySelector("tr td[colspan='3']");
    if (emptyRow) {
        body.innerHTML = "";
    }

    const now = new Date();
    const stamp = now.toLocaleDateString("en-GB") + " " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    body.insertAdjacentHTML(
        "afterbegin",
        `
        <tr>
            <td>${escapeHtml(stamp)}</td>
            <td>${escapeHtml(action)}</td>
            <td>${escapeHtml(getCurrentStaffDisplayName())}</td>
        </tr>
    `
    );
    persistClinicalSnapshots();
}

function getCurrentStaffDisplayName() {
    const display = document.getElementById("administeredByDisplay");
    const displayValue = display?.value?.trim() || "";
    if (displayValue && !/^healthcare staff$/i.test(displayValue)) return displayValue;

    try {
        const rawSelected = localStorage.getItem("munticare_selected_patient_v1");
        const selected = rawSelected ? JSON.parse(rawSelected) : null;
        const selectedStaffId = String(selected?.raw?.staff_id || selected?.staff_id || "").trim();
        if (selectedStaffId && STAFF_NAME_BY_ID[selectedStaffId]) {
            return STAFF_NAME_BY_ID[selectedStaffId];
        }
    } catch {
        // ignored
    }

    const assigned = getLatestAssignedDoctorForPatient(selectedPatientIdForProfile);
    if (assigned?.name) return assigned.name;

    try {
        const raw = localStorage.getItem("munticare_current_user_v1");
        const current = raw ? JSON.parse(raw) : null;
        const normalizedEmail = String(current?.email || "").trim().toLowerCase();
        const matched = normalizedEmail ? HEALTHCARE_STAFF_BY_EMAIL[normalizedEmail] : null;
        if (matched?.name) return matched.name;
        if (current?.name) return current.name;
        if (current?.full_name) return current.full_name;
        if (current?.email) return current.email;
    } catch {
        // ignored
    }
    return "Healthcare Staff";
}

function previewFile(filePath, fileName) {
    const previewTitle = document.getElementById("previewFileName");
    const previewContent = document.getElementById("filePreviewContent");
    const downloadBtn = document.getElementById("downloadFileBtn");
    const modalEl = document.getElementById("filePreviewModal");
    if (!previewTitle || !previewContent || !downloadBtn || !modalEl || !filePath) return false;

    previewTitle.textContent = fileName || "File Preview";
    downloadBtn.href = filePath;
    downloadBtn.download = fileName || "download";

    const lower = String(filePath).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".jfif"].some((ext) => lower.endsWith(ext))) {
        previewContent.innerHTML = `<img src="${escapeHtml(filePath)}" class="img-fluid" alt="${escapeHtml(fileName || "Preview")}" />`;
    } else if (lower.endsWith(".pdf")) {
        previewContent.innerHTML = `<embed src="${escapeHtml(filePath)}" type="application/pdf" width="100%" height="600px">`;
    } else {
        previewContent.innerHTML = `
            <div class="alert alert-info mb-0">
                <i class="bi bi-file-earmark-text fs-1 d-block mb-2"></i>
                Preview not available for this file type. Use download.
            </div>
        `;
    }

    new bootstrap.Modal(modalEl).show();
    return false;
}

function confirmWithModal(title, message) {
    return new Promise((resolve) => {
        let modalEl = document.getElementById("genericConfirmModal");
        if (!modalEl) {
            modalEl = document.createElement("div");
            modalEl.className = "modal fade";
            modalEl.id = "genericConfirmModal";
            modalEl.tabIndex = -1;
            modalEl.setAttribute("aria-hidden", "true");
            modalEl.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header" style="background-color: #1CDB88; color: white;">
                            <h5 class="modal-title" id="genericConfirmModalTitle">Confirm</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="genericConfirmModalMessage"></div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-danger" id="genericConfirmModalOkBtn">Delete</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modalEl);
        }

        const titleEl = modalEl.querySelector("#genericConfirmModalTitle");
        const messageEl = modalEl.querySelector("#genericConfirmModalMessage");
        const okBtn = modalEl.querySelector("#genericConfirmModalOkBtn");
        if (!titleEl || !messageEl || !okBtn) {
            resolve(false);
            return;
        }

        titleEl.textContent = title || "Confirm";
        messageEl.textContent = message || "Are you sure?";

        const modal = new bootstrap.Modal(modalEl);
        let settled = false;

        const cleanup = () => {
            modalEl.removeEventListener("hidden.bs.modal", onHidden);
            okBtn.removeEventListener("click", onOk);
        };

        const onHidden = () => {
            if (!settled) {
                settled = true;
                cleanup();
                resolve(false);
            }
        };

        const onOk = () => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(true);
            modal.hide();
        };

        modalEl.addEventListener("hidden.bs.modal", onHidden);
        okBtn.addEventListener("click", onOk);
        modal.show();
    });
}

function observeDashboardUpdates() {
    const appointmentTargets = [
        document.getElementById("upcomingAppointments"),
        document.getElementById("pastAppointments")
    ].filter(Boolean);
    const vaccineTarget = document.getElementById("vaccineRecordsList");

    const appointmentObserver = new MutationObserver(() => renderSummaryAppointment());
    appointmentTargets.forEach((el) => appointmentObserver.observe(el, { childList: true, subtree: true }));

    if (vaccineTarget) {
        const vaccineObserver = new MutationObserver(() => renderSummaryRecentVaccine());
        vaccineObserver.observe(vaccineTarget, { childList: true, subtree: true });
    }
}

function renderSummaryRecentVaccine() {
    const container = document.getElementById("summaryRecentVaccine");
    const sourceList = document.getElementById("vaccineRecordsList");
    if (!container) return;

    const firstRecord = sourceList?.querySelector(".list-group-item");
    if (!firstRecord) {
        container.innerHTML = '<p class="text-muted mb-0 small">No vaccine records yet.</p>';
        return;
    }

    const title = firstRecord.querySelector(".fw-bold")?.textContent?.trim() || "Vaccine record";
    const meta = firstRecord.querySelector("small.text-muted")?.textContent?.trim() || "";

    container.innerHTML = `
        <div class="card mb-2 shadow-sm">
            <div class="card-body p-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="fw-semibold small">${escapeHtml(title)}</div>
                        <small class="text-muted">${escapeHtml(meta)}</small>
                    </div>
                    <small class="text-success"><i class="bi bi-check-circle"></i></small>
                </div>
            </div>
        </div>
    `;
}

function renderSummaryAppointment() {
    const labelEl = document.getElementById("summaryAppointmentLabel");
    const dateEl = document.getElementById("summaryAppointmentDate");
    const timeEl = document.getElementById("summaryAppointmentTime");
    const staffEl = document.getElementById("summaryAppointmentStaff");
    const statusWrap = document.getElementById("summaryStatusWrap");
    const statusSelect = document.getElementById("summaryStatusSelect");
    if (!labelEl || !dateEl || !timeEl || !staffEl || !statusWrap || !statusSelect) return;

    labelEl.textContent = "Appointment";
    statusWrap.classList.add("d-none");
    statusSelect.removeAttribute("data-appointment-id");

    const appts = getPatientAppointments(selectedPatientIdForProfile);
    if (!appts.length) {
        dateEl.textContent = "No appointment yet";
        timeEl.textContent = "-";
        staffEl.textContent = "-";
        return;
    }

    const latest = appts.sort((a, b) => {
        const aId = Number(a.id || 0);
        const bId = Number(b.id || 0);
        if (aId !== bId) return bId - aId;
        const aDate = new Date(`${a.appointment_date || ""}T${a.start_time || "00:00"}`).getTime();
        const bDate = new Date(`${b.appointment_date || ""}T${b.start_time || "00:00"}`).getTime();
        if (Number.isFinite(aDate) && Number.isFinite(bDate)) return bDate - aDate;
        return 0;
    })[0];

    const normalizedStatus = normalizeStatus(latest.status);
    const staffName =
        STAFF_NAME_BY_ID[String(latest.staff_id || "")] ||
        latest.staff?.user?.profile?.full_name ||
        latest.staff_name ||
        "Staff TBA";

    dateEl.textContent = formatDate(latest.appointment_date || "");
    timeEl.textContent = `${formatTime(latest.start_time)} - ${formatTime(latest.end_time)}`;
    staffEl.textContent = `${staffName} - ${formatStatusLabel(normalizedStatus)}`;

    statusWrap.classList.remove("d-none");
    statusSelect.value = normalizedStatus;
    statusSelect.setAttribute("data-appointment-id", String(latest.id || ""));
}

function getPatientAppointments(patientId) {
    const source = readFirstAppointmentStore();
    return source.list.filter((item) => String(item.patient_id) === String(patientId));
}

function readFirstAppointmentStore() {
    for (const key of APPOINTMENT_STORAGE_KEYS) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return { key, list: parsed };
        } catch {
            // continue
        }
    }
    return { key: APPOINTMENT_STORAGE_KEYS[0], list: [] };
}

function updateAppointmentStatus(appointmentId, nextStatus) {
    const source = readFirstAppointmentStore();
    const updated = source.list.map((item) =>
        String(item.id) === String(appointmentId) ? { ...item, status: nextStatus } : item
    );
    const changed = updated.some(
        (item) => String(item.id) === String(appointmentId) && normalizeStatus(item.status) === normalizeStatus(nextStatus)
    );
    if (!changed) return false;
    localStorage.setItem(source.key, JSON.stringify(updated));
    return true;
}

function hydrateAdministeredBy() {
    const display = document.getElementById("administeredByDisplay");
    const hidden = document.getElementById("staffIdInput");
    if (!display) return;

    let value = "Healthcare Staff";
    let staffId = "";
    let selected = null;

    try {
        const rawSelected = localStorage.getItem("munticare_selected_patient_v1");
        selected = rawSelected ? JSON.parse(rawSelected) : null;
    } catch {
        selected = null;
    }

    try {
        const raw = localStorage.getItem("munticare_current_user_v1");
        const current = raw ? JSON.parse(raw) : null;
        const normalizedEmail = String(current?.email || "").trim().toLowerCase();
        const matched = normalizedEmail ? HEALTHCARE_STAFF_BY_EMAIL[normalizedEmail] : null;
        if (matched) {
            value = `${matched.name}${matched.specialization ? ` - ${matched.specialization}` : ""}`;
            staffId = matched.id || "";
        } else if (current?.name) {
            value = `${current.name}${current.specialization ? ` - ${current.specialization}` : ""}`;
            staffId = current.staff_id || "";
        } else if (current?.full_name) {
            value = `${current.full_name}${current.specialization ? ` - ${current.specialization}` : ""}`;
            staffId = current.staff_id || "";
        } else if (selected?.raw?.staff_name) {
            value = selected.raw.staff_name;
            staffId = selected?.raw?.staff_id ? String(selected.raw.staff_id) : "";
        } else if (current?.email) {
            value = current.email;
        }
    } catch {
        if (selected?.raw?.staff_name) {
            value = selected.raw.staff_name;
            staffId = selected?.raw?.staff_id ? String(selected.raw.staff_id) : "";
        }
    }

    // Fallback: use latest assigned doctor from patient's appointments.
    if (value === "Healthcare Staff") {
        const mappedBySelectedStaffId =
            STAFF_NAME_BY_ID[String(selected?.raw?.staff_id || selected?.staff_id || "")] || "";
        if (mappedBySelectedStaffId) {
            value = mappedBySelectedStaffId;
            staffId = String(selected?.raw?.staff_id || selected?.staff_id || staffId || "");
        }
    }

    // Fallback: use latest assigned doctor from patient's appointments.
    if (value === "Healthcare Staff") {
        const assigned = getLatestAssignedDoctorForPatient(selectedPatientIdForProfile);
        if (assigned?.name) {
            value = assigned.name;
            if (assigned.id) staffId = String(assigned.id);
        }
    }

    display.value = value;
    if (hidden) hidden.value = staffId;
}

function getLatestAssignedDoctorForPatient(patientId) {
    const appts = getPatientAppointments(patientId);
    if (!appts.length) return null;

    const latest = [...appts].sort((a, b) => {
        const aId = Number(a.id || 0);
        const bId = Number(b.id || 0);
        if (aId !== bId) return bId - aId;
        const aDate = new Date(`${a.appointment_date || ""}T${a.start_time || "00:00"}`).getTime();
        const bDate = new Date(`${b.appointment_date || ""}T${b.start_time || "00:00"}`).getTime();
        return (Number.isFinite(bDate) ? bDate : 0) - (Number.isFinite(aDate) ? aDate : 0);
    })[0];

    const id = String(latest?.staff_id || "");
    const name =
        STAFF_NAME_BY_ID[id] ||
        latest?.staff?.user?.profile?.full_name ||
        latest?.staff_name ||
        "";

    if (!name) return null;
    return { id, name };
}

async function fetchVaccineBatches(vaccineName) {
    try {
        const response = await fetch(`/api/vaccine-batches?vaccine_name=${encodeURIComponent(vaccineName)}`);
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                return data.map((batch) => ({
                    id: batch.id || batch.batch_number || "",
                    label: `${batch.batch_number || batch.id || "Batch"}`
                }));
            }
        }
    } catch {
        // fall through to local fallback
    }

    return LOCAL_BATCHES_BY_VACCINE[vaccineName] || [];
}

function showToast(message, type = "success") {
    const toastContainer = document.getElementById("toast-container");
    if (!toastContainer) return;

    const isWarn = type !== "success";
    const icon = isWarn ? "bi-exclamation-circle-fill" : "bi-check-circle-fill";

    const toast = document.createElement("div");
    toast.className = `toast-item${isWarn ? " warn" : ""}`;
    toast.setAttribute("role", "alert");
    toast.innerHTML = `
        <i class="bi ${icon}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity .2s ease";
        setTimeout(() => toast.remove(), 220);
    }, 3000);
}

function formatDate(isoDate) {
    const date = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function formatTime(timeValue) {
    if (!timeValue) return "N/A";
    const [hours, minutes] = String(timeValue).split(":");
    const hour = parseInt(hours, 10);
    if (Number.isNaN(hour)) return timeValue;
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes || "00"} ${ampm}`;
}

function normalizeStatus(status) {
    const s = String(status || "").toLowerCase();
    if (s === "confirm" || s === "confirmed") return "confirmed";
    if (s === "cancel" || s === "cancelled") return "cancelled";
    if (s === "no show" || s === "noshow" || s === "no_show") return "no_show";
    if (s === "pending") return "pending";
    return "pending";
}

function formatStatusLabel(status) {
    return status === "no_show" ? "NO SHOW" : String(status || "").toUpperCase();
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
