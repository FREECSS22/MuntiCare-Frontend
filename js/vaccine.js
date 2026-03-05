// Dummy vaccine data
let vaccineData = [
    { id: 1, name: 'BCG (Bacillus Calmette-Guerin)', description: 'Protects against severe forms of tuberculosis (TB)' },
    { id: 2, name: 'COVID-19 mRNA Vaccine (Pfizer-BioNTech)', description: 'Prevents COVID-19 infection' },
    { id: 3, name: 'DPT (Diphtheria, Pertussis, Tetanus)', description: 'Protects against diphtheria, whooping cough, and tetanus' },
    { id: 4, name: 'Hepatitis B Vaccine', description: 'Prevents Hepatitis B virus infection' },
    { id: 5, name: 'Inactivated Polio Vaccine (IPV)', description: 'Prevents polio (injectable form)' },
    { id: 6, name: 'Influenza (Flu) Vaccine', description: 'Prevents seasonal influenza' },
    { id: 7, name: 'MMR Vaccine', description: 'Protects against measles, mumps, and rubella' },
    { id: 8, name: 'Oral Polio Vaccine (OPV)', description: 'Prevents poliomyelitis' },
    { id: 9, name: 'Rabies Vaccine', description: 'Prevents rabies infection after exposure' },
    { id: 10, name: 'Varicella (Chickenpox) Vaccine', description: 'Prevents chickenpox' }
];
let currentPage = 1;
const rowsPerPage = 5;

// Sidebar toggle functionality
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('show');
    sidebarOverlay.classList.toggle('show');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('show');
    sidebarOverlay.classList.remove('show');
});

// Close sidebar when clicking a link on mobile
const navLinks = document.querySelectorAll('.sidebar .nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        }
    });
});

// Load vaccines
function loadVaccines() {
    const tbody = document.getElementById('vaccineTableBody');
    const paginationWrap = document.getElementById('paginationWrap');
    const totalItems = vaccineData.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = vaccineData.slice(startIndex, endIndex);
    
    if (totalItems === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No vaccines found</td></tr>';
        paginationWrap.innerHTML = 'Showing <strong>0-0</strong> of <strong>0</strong> results';
        return;
    }
    
    tbody.innerHTML = paginatedData.map(v => `
        <tr>
            <td>${v.name}</td>
            <td>${v.description || 'â€”'}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-primary" onclick="editVaccine(${v.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="confirmDeleteVaccine(${v.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    const showingFrom = startIndex + 1;
    const showingTo = Math.min(endIndex, totalItems);
    paginationWrap.innerHTML = renderPagination(totalPages, showingFrom, showingTo, totalItems);
}

function renderPagination(totalPages, showingFrom, showingTo, totalItems) {
    let buttons = `
        <button class="pg-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="bi bi-chevron-left"></i>
        </button>
    `;

    for (let page = 1; page <= totalPages; page++) {
        buttons += `<button class="pg-btn ${page === currentPage ? 'active' : ''}" onclick="goToPage(${page})">${page}</button>`;
    }

    buttons += `
        <button class="pg-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="bi bi-chevron-right"></i>
        </button>
    `;

    return `
        <span>Showing <strong>${showingFrom}-${showingTo}</strong> of <strong>${totalItems}</strong> results</span>
        <div class="pagination-btns">${buttons}</div>
    `;
}

function goToPage(page) {
    const totalPages = Math.max(1, Math.ceil(vaccineData.length / rowsPerPage));
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadVaccines();
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

// Add vaccine
document.getElementById('addVaccineForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newVaccine = {
        id: vaccineData.length > 0 ? Math.max(...vaccineData.map(v => v.id)) + 1 : 1,
        name: document.getElementById('vaccineName').value,
        description: document.getElementById('vaccineDescription').value
    };
    
    vaccineData.push(newVaccine);
    currentPage = Math.ceil(vaccineData.length / rowsPerPage);
    loadVaccines();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addVaccineModal'));
    modal.hide();
    this.reset();
    showToast('Vaccine added successfully!');
});

// Edit vaccine
function editVaccine(id) {
    const vaccine = vaccineData.find(v => v.id === id);
    if (!vaccine) return;
    
    document.getElementById('edit_vaccine_id').value = vaccine.id;
    document.getElementById('edit_name').value = vaccine.name;
    document.getElementById('edit_description').value = vaccine.description || '';
    
    const modal = new bootstrap.Modal(document.getElementById('editVaccineModal'));
    modal.show();
}

// Update vaccine
document.getElementById('editVaccineForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit_vaccine_id').value);
    const vaccineIndex = vaccineData.findIndex(v => v.id === id);
    
    if (vaccineIndex !== -1) {
        vaccineData[vaccineIndex].name = document.getElementById('edit_name').value;
        vaccineData[vaccineIndex].description = document.getElementById('edit_description').value;
    }
    
    loadVaccines();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('editVaccineModal'));
    modal.hide();
    showToast('Vaccine updated successfully!');
});

// Confirm delete vaccine
function confirmDeleteVaccine(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteVaccine(id);
        }
    });
}

// Delete vaccine
function deleteVaccine(id) {
    vaccineData = vaccineData.filter(v => v.id !== id);
    const totalPages = Math.max(1, Math.ceil(vaccineData.length / rowsPerPage));
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    loadVaccines();
    showToast('Vaccine has been deleted.', 'warn');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadVaccines();
});