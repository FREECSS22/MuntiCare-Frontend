let users = [
    { id: 1, name: "Maraiah Queen Arceta",  role: "Doctor", email: "aiah@munticare.com",   is_enabled: true, created_at: "Feb 06, 2026" },
    { id: 2, name: "Nicolette Vergara",      role: "Doctor", email: "colet@munticare.com",  is_enabled: true, created_at: "Feb 06, 2026" },
    { id: 3, name: "Mary Loi Yves Ricalde",  role: "Doctor", email: "maloi@munticare.com",  is_enabled: true, created_at: "Feb 06, 2026" },
    { id: 4, name: "Gweneth Apuli",          role: "Doctor", email: "gwen@munticare.com",   is_enabled: true, created_at: "Feb 06, 2026" },
    { id: 5, name: "Stacey Sevilleja",       role: "Doctor", email: "stacey@munticare.com", is_enabled: true, created_at: "Feb 06, 2026" },
    { id: 6, name: "Admin",   role: "Admin",  email: "admin@munticare.com",   is_enabled: true,  created_at: "Feb 06, 2026" },
    { id: 9, name: "Mikhaela Lim",           role: "Doctor", email: "mikha@munticare.com",  is_enabled: true, created_at: "Feb 06, 2026" },
    { id: 10, name: "Jhoanna Robles",        role: "Doctor", email: "jhoanna@munticare.com", is_enabled: true, created_at: "Feb 06, 2026" },
    { id: 11, name: "Sheena Catacutan",      role: "Doctor", email: "sheena@munticare.com", is_enabled: true, created_at: "Feb 06, 2026" },
];

let nextId = 12;
const PAGE_SIZE = 5;
let currentPage = 1;
let filteredUsers = [...users];
let modalInstance;

function render() {
    const tbody = document.getElementById('tableBody');
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageUsers = filteredUsers.slice(start, start + PAGE_SIZE);

    if (pageUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4" style="color:#adb5bd">No users found.</td></tr>`;
    } else {
        tbody.innerHTML = pageUsers.map(u => `
            <tr>
                <td><i class="bi bi-person-circle me-2" style="font-size:1.1rem;color:#495057;vertical-align:middle"></i>${u.name}</td>
                <td>${u.role}</td>
                <td>${u.email}</td>
                <td>${u.is_enabled ? '<span class="badge-active">Active</span>' : '<span class="badge-inactive">Inactive</span>'}</td>
                <td>${u.created_at}</td>
                <td class="text-center">
                    <button class="${u.is_enabled ? 'btn-disable-user' : 'btn-enable-user'}" onclick="toggleStatus(${u.id})">
                        ${u.is_enabled ? 'Disable' : 'Enable'}
                    </button>
                </td>
            </tr>`).join('');
    }
    renderPagination();
}

function renderPagination() {
    const wrap = document.getElementById('paginationWrap');
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
    const start = filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, filteredUsers.length);
    let btns = '';
    for (let i = 1; i <= totalPages; i++) {
        btns += `<button class="pg-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
    }
    wrap.innerHTML = `
        <span>Showing <strong>${start}–${end}</strong> of <strong>${filteredUsers.length}</strong> users</span>
        <div class="pagination-btns">
            <button class="pg-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="bi bi-chevron-left"></i></button>
            ${btns}
            <button class="pg-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}><i class="bi bi-chevron-right"></i></button>
        </div>`;
}

function goPage(p) {
    const total = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
    if (p < 1 || p > total) return;
    currentPage = p; render();
}

function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const role   = document.getElementById('filterRole').value;
    const status = document.getElementById('filterStatus').value;
    filteredUsers = users.filter(u =>
        (!search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)) &&
        (!role   || u.role === role) &&
        (!status || (status === 'active' ? u.is_enabled : !u.is_enabled))
    );
    currentPage = 1; render();
}

function toggleStatus(id) {
    const u = users.find(x => x.id === id);
    if (!u) return;
    u.is_enabled = !u.is_enabled;
    showToast(u.is_enabled ? `${u.name} has been enabled.` : `${u.name} has been disabled.`, u.is_enabled ? 'ok' : 'warn');
    applyFilters();
}

function openAddModal() {
    ['newName','newEmail','newPassword','newPasswordConfirm'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('newRole').value = 'Doctor';
    document.getElementById('formError').style.display = 'none';
    if (!modalInstance) modalInstance = new bootstrap.Modal(document.getElementById('addUserModal'));
    modalInstance.show();
}

function saveUser() {
    const name  = document.getElementById('newName').value.trim();
    const email = document.getElementById('newEmail').value.trim().toLowerCase();
    const pw    = document.getElementById('newPassword').value;
    const pwc   = document.getElementById('newPasswordConfirm').value;
    const role  = document.getElementById('newRole').value;
    if (!name || !email || !pw || !pwc) { showErr('All fields are required.'); return; }
    if (pw !== pwc)    { showErr('Passwords do not match.'); return; }
    if (pw.length < 6) { showErr('Password must be at least 6 characters.'); return; }
    if (users.find(u => u.email.toLowerCase() === email)) { showErr('Email already exists.'); return; }
    const now = new Date();
    users.push({ id: nextId++, name, role, email, is_enabled: false,
    created_at: now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) });
    modalInstance.hide();
    showToast(`${name} added successfully!`);
    applyFilters();
}

function showErr(msg) {
    const e = document.getElementById('formError');
    e.textContent = msg; e.style.display = 'block';
}

function showToast(msg, type = 'ok') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast-item ${type === 'warn' ? 'warn' : ''}`;
    t.innerHTML = `<i class="bi ${type === 'warn' ? 'bi-slash-circle' : 'bi-check-circle-fill'}"></i> ${msg}`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

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

applyFilters();