// Tab functionality
document.addEventListener("DOMContentLoaded", function () {
    const tabs = document.querySelectorAll("#patientTabs .nav-link");
    const panes = document.querySelectorAll(".tab-pane");

    tabs.forEach(tab => {
        tab.addEventListener("click", function (e) {
            e.preventDefault();

            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove("active"));
            this.classList.add("active");

            // Hide all panes
            panes.forEach(pane => pane.style.display = "none");

            // Show selected pane
            const selected = this.getAttribute("data-tab");
            const targetPane = document.getElementById(selected + "-pane");
            if (targetPane) {
                targetPane.style.display = "block";
            }
        });
    });
});

const patientId = 1;
const patientIdDetails = 1;
const maxAppointmentsPerDoctor = 5;
const demoStorageKey = 'munticare_demo_appointments_v1';
const feedbackPromptedKey = 'munticare_feedback_prompted_v1';
const demoFeedbackKey = 'munticare_demo_feedbacks_v1';
const forceDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';
let useDemoMode = forceDemoMode;
let currentAppointmentId = null;
let feedbackQueue = [];
let feedbackContextById = {};

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    const appointmentDateInput = document.getElementById('appointmentDateInput');
    if (appointmentDateInput) {
        appointmentDateInput.min = today;
    }
    seedDemoAppointmentsIfEmpty();
    loadAppointments();
});

function seedDemoAppointmentsIfEmpty() {
    const current = getDemoAppointments();
    if (current.length > 0) return;
    const seeded = [
        {
            id: 1001,
            patient_id: patientIdDetails,
            staff_id: '1',
            appointment_date: '2026-03-10',
            start_time: '09:30',
            end_time: '10:00',
            status: 'confirmed',
            reason: 'Follow-up checkup',
            notes: 'Bring previous lab results',
            staff_name: 'Dr. Maraiah Queen Arceta'
        },
        {
            id: 1002,
            patient_id: patientIdDetails,
            staff_id: '2',
            appointment_date: '2026-02-15',
            start_time: '10:00',
            end_time: '10:30',
            status: 'done',
            reason: 'Routine consultation',
            notes: '',
            staff_name: 'Dr. Nicolette Vergara'
        }
    ];
    saveDemoAppointments(seeded);
}

function getDemoAppointments() {
    try {
        const raw = localStorage.getItem(demoStorageKey);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveDemoAppointments(list) {
    localStorage.setItem(demoStorageKey, JSON.stringify(list));
}

function showAppointmentsMessage(text, level) {
    const box = document.getElementById('appointmentsError');
    box.className = `alert alert-${level}`;
    box.textContent = text;
    box.style.display = 'block';
}

function hideAppointmentsMessage() {
    const box = document.getElementById('appointmentsError');
    box.style.display = 'none';
}

function showAppToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const isWarn = type !== 'success';
    const toast = document.createElement('div');
    toast.className = `toast-item${isWarn ? ' warn' : ''}`;
    toast.innerHTML = `
        <i class="bi ${isWarn ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity .2s ease';
        setTimeout(() => toast.remove(), 200);
    }, 3000);
}

function openFilePreview(fileUrl, fileName) {
    const previewTitle = document.getElementById('previewFileName');
    const previewContent = document.getElementById('filePreviewContent');
    const downloadBtn = document.getElementById('downloadFileBtn');
    if (!previewTitle || !previewContent || !downloadBtn) return false;

    previewTitle.textContent = fileName || 'File Preview';
    downloadBtn.href = fileUrl;
    const lowerUrl = String(fileUrl).toLowerCase();
    const isImage = ['.png', '.jpg', '.jpeg', '.jfif', '.gif', '.webp'].some(ext => lowerUrl.endsWith(ext));
    if (isImage) {
        previewContent.innerHTML = `
            <img src="${fileUrl}" alt="${fileName || 'File Preview'}"
                 style="max-width: 100%; max-height: 70vh; border: 1px solid #e9ecef; border-radius: 6px;" />
        `;
    } else {
        previewContent.innerHTML = `
            <iframe src="${fileUrl}" title="${fileName || 'File Preview'}"
                    style="width: 100%; height: 70vh; border: 1px solid #e9ecef; border-radius: 6px;"></iframe>
        `;
    }
    new bootstrap.Modal(document.getElementById('filePreviewModal')).show();
    return false;
}

async function loadAppointments() {
    if (useDemoMode) {
        const demoAppointments = getDemoAppointments();
        await syncOverdueAppointments(demoAppointments);
        displayAppointments(demoAppointments);
        return;
    }

    fetch(`/api/appointments/patient/${patientId}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(result => {
            const appointments = (result.data || []).filter(apt => apt.patient_id === patientIdDetails);
            return syncOverdueAppointments(appointments).then(() => appointments);
        })
        .then(appointments => {
            displayAppointments(appointments);
            hideAppointmentsMessage();
        })
        .catch(() => {
            useDemoMode = true;
            const demoAppointments = getDemoAppointments();
            syncOverdueAppointments(demoAppointments).then(() => displayAppointments(demoAppointments));
        });
}

function isOverdueAppointment(apt) {
    const status = String(apt.status || '').toLowerCase();
    if (!['pending', 'confirmed'].includes(status)) return false;
    const endDateTime = new Date(`${apt.appointment_date}T${apt.end_time}`);
    return endDateTime < new Date();
}

async function syncOverdueAppointments(appointments) {
    const overdue = appointments.filter(isOverdueAppointment);
    if (overdue.length === 0) return;

    overdue.forEach(apt => {
        apt.status = 'done';
    });

    if (useDemoMode) {
        const demoList = getDemoAppointments().map(item => {
            const needsUpdate = overdue.some(apt => Number(apt.id) === Number(item.id));
            return needsUpdate ? { ...item, status: 'done' } : item;
        });
        saveDemoAppointments(demoList);
        queueFeedbackPrompts(overdue);
        return;
    }

    await Promise.all(overdue.map(apt =>
        fetch(`/api/appointments/${apt.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'done' })
        }).catch(() => null)
    ));
    queueFeedbackPrompts(overdue);
}

function getPromptedFeedbackIds() {
    try {
        const raw = localStorage.getItem(feedbackPromptedKey);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function savePromptedFeedbackIds(ids) {
    localStorage.setItem(feedbackPromptedKey, JSON.stringify(ids));
}

function markFeedbackPrompted(appointmentId) {
    const current = getPromptedFeedbackIds();
    if (!current.includes(String(appointmentId))) {
        current.push(String(appointmentId));
        savePromptedFeedbackIds(current);
    }
}

function wasFeedbackPrompted(appointmentId) {
    return getPromptedFeedbackIds().includes(String(appointmentId));
}

function queueFeedbackPrompts(doneAppointments) {
    doneAppointments.forEach(apt => {
        const id = String(apt.id);
        if (wasFeedbackPrompted(id)) return;
        feedbackContextById[id] = apt;
        if (!feedbackQueue.includes(id)) {
            feedbackQueue.push(id);
        }
    });
    showNextFeedbackModal();
}

function showNextFeedbackModal() {
    const modalEl = document.getElementById('feedbackModal');
    if (!modalEl || modalEl.classList.contains('show')) return;
    if (feedbackQueue.length === 0) return;

    const nextId = feedbackQueue.shift();
    const apt = feedbackContextById[nextId];
    if (!apt) {
        showNextFeedbackModal();
        return;
    }

    const appointmentIdEl = document.getElementById('feedbackAppointmentId');
    const staffNameEl = document.getElementById('feedbackStaffName');
    const appointmentDateEl = document.getElementById('feedbackAppointmentDate');
    const errorEl = document.getElementById('feedbackFormError');
    const formEl = document.getElementById('feedbackForm');
    if (!appointmentIdEl || !staffNameEl || !appointmentDateEl || !formEl) return;

    appointmentIdEl.value = String(apt.id);
    staffNameEl.textContent = getStaffName(apt);
    appointmentDateEl.textContent = new Date(apt.appointment_date).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    formEl.reset();
    appointmentIdEl.value = String(apt.id);
    if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
    }

    markFeedbackPrompted(nextId);
    new bootstrap.Modal(modalEl).show();
}

function persistDemoFeedback(data) {
    let current = [];
    try {
        const raw = localStorage.getItem(demoFeedbackKey);
        current = raw ? JSON.parse(raw) : [];
    } catch {
        current = [];
    }
    current.push({
        id: Date.now(),
        patient_id: patientIdDetails,
        appointment_id: data.appointment_id,
        rating: data.rating,
        comment: data.comment || '',
        created_at: new Date().toISOString()
    });
    localStorage.setItem(demoFeedbackKey, JSON.stringify(current));
}

function displayAppointments(appointments) {
    const now = new Date();
    const upcoming = appointments.filter(apt => {
        const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.end_time}`);
        return ['pending', 'confirmed'].includes(apt.status) && appointmentDateTime >= now;
    });
    const past = appointments.filter(apt => {
        const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.end_time}`);
        return apt.status === 'done' || apt.status === 'cancelled' || appointmentDateTime < now;
    });

    const upcomingContainer = document.getElementById('upcomingAppointments');
    upcomingContainer.innerHTML = upcoming.length === 0
        ? '<p class="text-muted">No upcoming appointments.</p>'
        : upcoming.map(apt => createAppointmentCard(apt, false)).join('');

    const pastContainer = document.getElementById('pastAppointments');
    pastContainer.innerHTML = past.length === 0
        ? '<p class="text-muted">No past appointments.</p>'
        : past.map(apt => createAppointmentCard(apt, true)).join('');

    updateSummaryUpcoming(upcoming);

    document.getElementById('appointmentsLoading').style.display = 'none';
    document.getElementById('appointmentsContainer').style.display = 'block';
}

function updateSummaryUpcoming(upcomingAppointments) {
    const labelEl = document.getElementById('summaryAppointmentLabel');
    const dateEl = document.getElementById('summaryAppointmentDate');
    const timeEl = document.getElementById('summaryAppointmentTime');
    const staffEl = document.getElementById('summaryAppointmentStaff');
    if (!labelEl || !dateEl || !timeEl || !staffEl) return;

    if (!upcomingAppointments || upcomingAppointments.length === 0) {
        labelEl.textContent = 'Next Appointment';
        dateEl.textContent = 'No upcoming appointment';
        timeEl.textContent = '-';
        staffEl.textContent = '-';
        return;
    }

    const sorted = [...upcomingAppointments].sort((a, b) => {
        const aTime = new Date(`${a.appointment_date}T${a.start_time}`).getTime();
        const bTime = new Date(`${b.appointment_date}T${b.start_time}`).getTime();
        return aTime - bTime;
    });
    const next = sorted[0];

    labelEl.textContent = 'Next Appointment';
    dateEl.textContent = new Date(next.appointment_date).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    timeEl.textContent = `${formatTime(next.start_time)} - ${formatTime(next.end_time)}`;
    staffEl.textContent = getStaffName(next);
}

function getStaffName(apt) {
    return apt.staff?.user?.name || apt.staff?.first_name || apt.staff_name || 'Staff TBA';
}

function createAppointmentCard(apt, isPast) {
    const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.end_time}`);
    const now = new Date();
    const computedStatus = appointmentDateTime < now ? 'done' : apt.status;
    const statusBadge = {
        pending: 'bg-warning text-dark',
        confirmed: 'bg-info text-dark',
        done: 'bg-success',
        cancelled: 'bg-danger'
    }[computedStatus] || 'bg-secondary';

    const formattedDate = new Date(apt.appointment_date).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    return `
        <div class="card mb-3 shadow-sm">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h6 class="mb-1">
                            <i class="bi bi-calendar-event text-primary"></i>
                            ${formattedDate}
                        </h6>
                        <span class="badge ${statusBadge}">${computedStatus.toUpperCase()}</span>
                    </div>
                </div>
                <p class="mb-2"><strong>Time:</strong> ${formatTime(apt.start_time)} - ${formatTime(apt.end_time)}</p>
                <p class="mb-2"><strong>Staff:</strong> ${getStaffName(apt)}</p>
                ${apt.reason ? `<p class="mb-2"><strong>Reason:</strong> ${apt.reason}</p>` : ''}
                ${apt.notes && !isPast ? `<p class="mb-0 text-muted small"><strong>Notes:</strong> ${apt.notes}</p>` : ''}
            </div>
        </div>
    `;
}

function formatTime(timeString) {
    const timeParts = String(timeString || '').split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = (timeParts[1] || '00').padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
}

function parseTimeToMinutes(timeString) {
    const parts = String(timeString || '').split(':');
    if (parts.length < 2) return NaN;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN;
    return (hours * 60) + minutes;
}

function isOverlap(startA, endA, startB, endB) {
    return startA < endB && endA > startB;
}

function isCancelled(apt) {
    return String(apt.status || '').toLowerCase() === 'cancelled';
}

async function getDoctorDayAppointments(staffId, appointmentDate) {
    if (useDemoMode) {
        return getDemoAppointments().filter(apt =>
            String(apt.staff_id || '') === String(staffId) &&
            String(apt.appointment_date || '') === String(appointmentDate)
        );
    }
    try {
        const url = `/api/appointments?staff_id=${encodeURIComponent(staffId)}&appointment_date=${encodeURIComponent(appointmentDate)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        const list = Array.isArray(result.data) ? result.data : [];
        return list.filter(apt =>
            String((apt.staff_id ?? apt.staff?.id ?? '')) === String(staffId) &&
            String(apt.appointment_date || '') === String(appointmentDate)
        );
    } catch {
        return [];
    }
}

async function validateAppointmentRules(formData) {
    const staffId = String(formData.staff_id || '').trim();
    const appointmentDate = String(formData.appointment_date || '').trim();
    const start = parseTimeToMinutes(formData.start_time);
    const end = parseTimeToMinutes(formData.end_time);
    if (!staffId) return { ok: false, message: 'Please select a staff member.' };
    if (!appointmentDate) return { ok: false, message: 'Please select an appointment date.' };
    if (!Number.isFinite(start) || !Number.isFinite(end)) return { ok: false, message: 'Please provide valid start and end times.' };
    if (end <= start) return { ok: false, message: 'End time must be later than start time.' };

    const doctorDayAppointments = await getDoctorDayAppointments(staffId, appointmentDate);
    const activeAppointments = doctorDayAppointments.filter(apt => !isCancelled(apt));
    if (activeAppointments.length >= maxAppointmentsPerDoctor) {
        return { ok: false, message: `This doctor already has ${maxAppointmentsPerDoctor} appointments on that date.` };
    }
    const hasConflict = activeAppointments.some(apt => {
        const existingStart = parseTimeToMinutes(apt.start_time);
        const existingEnd = parseTimeToMinutes(apt.end_time);
        if (!Number.isFinite(existingStart) || !Number.isFinite(existingEnd)) return false;
        return isOverlap(start, end, existingStart, existingEnd);
    });
    if (hasConflict) {
        return { ok: false, message: 'Selected time overlaps with another appointment for this doctor.' };
    }
    return { ok: true };
}

document.getElementById('appointmentForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('submitAppointmentBtn');
    const errorBox = document.getElementById('appointmentFormError');
    errorBox.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    const validation = await validateAppointmentRules(data);
    if (!validation.ok) {
        errorBox.style.display = 'block';
        errorBox.textContent = validation.message;
        showAppToast(validation.message, 'warn');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Confirm Appointment';
        return;
    }

    const persistDemoAppointment = () => {
        const staffSelect = this.querySelector('select[name="staff_id"]');
        const staffName = staffSelect?.options[staffSelect.selectedIndex]?.text || 'Staff TBA';
        const newItem = {
            id: Date.now(),
            patient_id: Number(data.patient_id) || patientIdDetails,
            staff_id: String(data.staff_id || ''),
            appointment_date: data.appointment_date,
            start_time: data.start_time,
            end_time: data.end_time,
            status: 'pending',
            reason: data.reason || '',
            notes: data.notes || '',
            staff_name: staffName
        };
        const list = getDemoAppointments();
        list.push(newItem);
        saveDemoAppointments(list);
    };

    if (useDemoMode) {
        persistDemoAppointment();
        bootstrap.Modal.getInstance(document.getElementById('appointmentModal')).hide();
        this.reset();
        loadAppointments();
        showAppToast('Appointment created successfully!');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Confirm Appointment';
        return;
    }

    fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(result => {
            if (!result.message || !result.message.includes('successfully')) {
                throw new Error(result.message || 'Failed to create appointment');
            }
            bootstrap.Modal.getInstance(document.getElementById('appointmentModal')).hide();
            this.reset();
            loadAppointments();
            showAppToast('Appointment created successfully!');
        })
        .catch(() => {
            useDemoMode = true;
            persistDemoAppointment();
            bootstrap.Modal.getInstance(document.getElementById('appointmentModal')).hide();
            this.reset();
            loadAppointments();
            showAppToast('Appointment saved in demo mode.', 'warn');
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Confirm Appointment';
        });
});

document.getElementById('feedbackForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submitFeedbackBtn');
    const errorEl = document.getElementById('feedbackFormError');
    const modalEl = document.getElementById('feedbackModal');
    const appointmentId = document.getElementById('feedbackAppointmentId')?.value;
    const ratingInput = this.querySelector('input[name="feedback_rating"]:checked');
    const rating = ratingInput ? ratingInput.value : '';
    const comment = document.getElementById('feedbackComment')?.value || '';

    if (!appointmentId || !rating) {
        if (errorEl) {
            errorEl.style.display = 'block';
            errorEl.textContent = 'Please provide a rating.';
        }
        return;
    }

    if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
    }
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }

    const payload = {
        patient_id: patientIdDetails,
        appointment_id: Number(appointmentId),
        rating: Number(rating),
        comment
    };

    let saved = false;
    if (!useDemoMode) {
        try {
            const res = await fetch('/api/feedbacks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                saved = true;
            }
        } catch {
            saved = false;
        }
    }

    if (!saved) {
        persistDemoFeedback(payload);
    }

    markFeedbackPrompted(appointmentId);
    feedbackQueue = feedbackQueue.filter(id => id !== String(appointmentId));
    if (modalEl) {
        const instance = bootstrap.Modal.getInstance(modalEl);
        instance?.hide();
    }
    showAppToast('Thank you for your feedback!');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Feedback';
    }
    showNextFeedbackModal();
});
