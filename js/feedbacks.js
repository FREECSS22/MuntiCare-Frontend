/* ── Dummy Data ── */
let feedbacks = [
    { id: 1,  patient: "Maria Santos",      staff: "Maraiah Queen Arceta",  appointment_date: "Jan 15, 2026", rating: 5, comment: "Very attentive and professional doctor. Highly recommended!",         submitted: "2 hours ago", is_reviewed: false, is_flagged: false, flag_reason: "" },
    { id: 2,  patient: "Jose Dela Cruz",    staff: "Nicolette Vergara",     appointment_date: "Jan 18, 2026", rating: 1, comment: "Waited for 2 hours and the doctor barely explained anything to me.",  submitted: "5 hours ago", is_reviewed: false, is_flagged: false, flag_reason: "" },
    { id: 3,  patient: "Ana Reyes",         staff: "Mary Loi Yves Ricalde", appointment_date: "Jan 20, 2026", rating: 4, comment: "Good experience overall. The staff was friendly and helpful.",        submitted: "1 day ago",   is_reviewed: true,  is_flagged: false, flag_reason: "" },
    { id: 4,  patient: "Luis Garcia",       staff: "Gweneth Apuli",         appointment_date: "Jan 22, 2026", rating: 2, comment: "The clinic was dirty and the consultation was rushed.",               submitted: "1 day ago",   is_reviewed: false, is_flagged: true,  flag_reason: "Inappropriate language" },
    { id: 5,  patient: "Clara Mendoza",     staff: "Stacey Sevilleja",      appointment_date: "Jan 25, 2026", rating: 5, comment: "Excellent service! The doctor was very thorough and caring.",         submitted: "2 days ago",  is_reviewed: true,  is_flagged: false, flag_reason: "" },
    { id: 6,  patient: "Rico Villanueva",   staff: "Admin Juan Dela Cruz",  appointment_date: "Jan 27, 2026", rating: 3, comment: "Average experience. Nothing special but nothing bad either.",         submitted: "3 days ago",  is_reviewed: false, is_flagged: false, flag_reason: "" },
    { id: 7,  patient: "Elena Bautista",    staff: "Dr. Rico Mendoza",      appointment_date: "Jan 29, 2026", rating: 5, comment: "Very knowledgeable and patient.",                                  submitted: "4 days ago",  is_reviewed: true,  is_flagged: false, flag_reason: "" },
    { id: 8,  patient: "Marco Cruz",        staff: "Admin Clara Santos",    appointment_date: "Feb 01, 2026", rating: 1, comment: "Terrible service. The receptionist was rude and unhelpful.",         submitted: "5 days ago",  is_reviewed: false, is_flagged: true,  flag_reason: "Needs review" },
    { id: 9,  patient: "Stacey Sevilleja",  staff: "Mikhaela Lim",          appointment_date: "Feb 03, 2026", rating: 4, comment: "Pretty good visit. Doctor was professional and the clinic was clean.",submitted: "6 days ago",  is_reviewed: false, is_flagged: false, flag_reason: "" },
    { id: 10, patient: "Gweneth Apuli",     staff: "Jhoanna Robles",        appointment_date: "Feb 05, 2026", rating: 5, comment: "Outstanding! The best healthcare experience I have ever had.",       submitted: "1 week ago",  is_reviewed: true,  is_flagged: false, flag_reason: "" }
];

const PAGE_SIZE = 5;
let currentPage = 1;
let flagModalInstance;
let pendingFlagId = null;

/* ── Render ── */
function render() {
    const tbody = document.getElementById('tableBody');
    const start = (currentPage - 1) * PAGE_SIZE;
    const page  = feedbacks.slice(start, start + PAGE_SIZE);

    if (page.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4" style="color:#adb5bd">No feedback yet.</td></tr>`;
    } else {
        tbody.innerHTML = page.map(f => {
            const stars     = renderStars(f.rating);
            const starsCls  = f.rating <= 2 ? 'stars stars-low' : (f.rating <= 4 ? 'stars stars-mid' : 'stars stars-high');
            const reviewCls = f.is_reviewed ? 'btn-reviewed active' : 'btn-reviewed';
            const reviewTxt = f.is_reviewed ? 'Unmark Reviewed' : 'Mark Reviewed';
            const flagCls   = f.is_flagged ? 'btn-flag active' : 'btn-flag';
            const flagTxt   = f.is_flagged ? 'Unflag' : 'Flag';

            return `<tr id="fb-row-${f.id}">
                <td style="color:#adb5bd;font-weight:600">${f.id}</td>
                <td><i class="bi bi-person-circle me-2" style="color:#495057;font-size:1rem;vertical-align:middle"></i>${f.patient}</td>
                <td style="color:#495057">${f.staff}</td>
                <td style="color:#6c757d;white-space:nowrap">${f.appointment_date}</td>
                <td><span class="${starsCls}">${stars}</span></td>
                <td><span class="comment-cell d-block" title="${f.comment}">${truncate(f.comment, 80)}</span></td>
                <td style="color:#6c757d;white-space:nowrap">${f.submitted}</td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="${reviewCls}" onclick="toggleReviewed(${f.id})">${reviewTxt}</button>
                        <button class="${flagCls}" onclick="openFlagModal(${f.id})">${flagTxt}</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }
    renderPagination();
}

function renderStars(rating) {
    let s = '';
    for (let i = 1; i <= 5; i++) {
        s += i <= rating ? '★' : '☆';
    }
    return s;
}

function truncate(str, n) {
    return str.length > n ? str.slice(0, n) + '...' : str;
}

/* ── Pagination ── */
function renderPagination() {
    const wrap = document.getElementById('paginationWrap');
    const totalPages = Math.max(1, Math.ceil(feedbacks.length / PAGE_SIZE));
    const start = feedbacks.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, feedbacks.length);
    let btns = '';
    for (let i = 1; i <= totalPages; i++) {
        btns += `<button class="pg-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
    }
    wrap.innerHTML = `
        <span>Showing <strong>${start}-${end}</strong> of <strong>${feedbacks.length}</strong> feedbacks</span>
        <div class="pagination-btns">
            <button class="pg-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="bi bi-chevron-left"></i></button>
            ${btns}
            <button class="pg-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}><i class="bi bi-chevron-right"></i></button>
        </div>`;
}

function goPage(p) {
    const total = Math.max(1, Math.ceil(feedbacks.length / PAGE_SIZE));
    if (p < 1 || p > total) return;
    currentPage = p; render();
}

/* ── Toggle Reviewed ── */
function toggleReviewed(id) {
    const f = feedbacks.find(x => x.id === id);
    if (!f) return;
    f.is_reviewed = !f.is_reviewed;
    showToast(f.is_reviewed ? 'Marked as reviewed.' : 'Unmarked as reviewed.');
    render();
}

/* ── Flag Modal ── */
function openFlagModal(id) {
    const f = feedbacks.find(x => x.id === id);
    if (!f) return;

    // If already flagged, toggle directly (unflag)
    if (f.is_flagged) {
        f.is_flagged = false;
        f.flag_reason = '';
        showToast('Feedback has been unflagged.', 'warn');
        render();
        return;
    }

    pendingFlagId = id;
    document.getElementById('flagReason').value = '';
    if (!flagModalInstance) flagModalInstance = new bootstrap.Modal(document.getElementById('flagModal'));
    flagModalInstance.show();
}

document.getElementById('confirmFlagBtn').addEventListener('click', () => {
    const f = feedbacks.find(x => x.id === pendingFlagId);
    if (!f) return;
    f.is_flagged = true;
    f.flag_reason = document.getElementById('flagReason').value.trim();
    flagModalInstance.hide();
    showToast('Feedback has been flagged.', 'warn');
    render();
});

function showToast(msg, type = 'ok') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast-item ${type === 'warn' ? 'warn' : ''}`;
    t.innerHTML = `<i class="bi ${type === 'warn' ? 'bi-flag-fill' : 'bi-check-circle-fill'}"></i> ${msg}`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

/* ── Sidebar toggle ── */
const menuToggle     = document.getElementById('menuToggle');
const sidebar        = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('show');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
});

/* ── Init ── */
render();