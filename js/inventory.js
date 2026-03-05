// Dummy vaccine batches
let vaccineData = [
    {
        id: 1,
        vaccine: 'BCG (Bacillus Calmette-Guerin)',
        batch: 'BCG-2024-001',
        manufacturer: 'Serum Institute of India',
        quantity: 500,
        expiryDate: '2026-03-31',
        receivedDate: '2024-04-10',
        supplier: 'Department of Health',
        storage_conditions: 'Store at 2C to 8C'
    },
    {
        id: 2,
        vaccine: 'COVID-19 mRNA Vaccine (Pfizer-BioNTech)',
        batch: 'COVID-PF-2024-001',
        manufacturer: 'Pfizer-BioNTech',
        quantity: 300,
        expiryDate: '2025-12-31',
        receivedDate: '2024-06-15',
        supplier: 'Pfizer Philippines',
        storage_conditions: 'Store at -70C'
    },
    {
        id: 3,
        vaccine: 'DPT (Diphtheria, Pertussis, Tetanus)',
        batch: 'DPT-2024-001',
        manufacturer: 'GlaxoSmithKline',
        quantity: 400,
        expiryDate: '2026-08-30',
        receivedDate: '2024-05-05',
        supplier: 'GSK Philippines',
        storage_conditions: 'Store at 2C to 8C'
    },
    {
        id: 4,
        vaccine: 'Hepatitis B Vaccine',
        batch: 'HEPB-2024-001',
        manufacturer: 'Sanofi Pasteur',
        quantity: 350,
        expiryDate: '2027-01-15',
        receivedDate: '2024-07-01',
        supplier: 'Sanofi Philippines',
        storage_conditions: 'Store at 2C to 8C'
    },
    {
        id: 5,
        vaccine: 'Inactivated Polio Vaccine (IPV)',
        batch: 'IPV-2024-001',
        manufacturer: 'Biological E',
        quantity: 280,
        expiryDate: '2026-11-20',
        receivedDate: '2024-06-01',
        supplier: 'DOH',
        storage_conditions: 'Store at 2C to 8C'
    },
    {
        id: 6,
        vaccine: 'Influenza (Flu) Vaccine',
        batch: 'FLU-2024-001',
        manufacturer: 'Sanofi Pasteur',
        quantity: 600,
        expiryDate: '2025-09-30',
        receivedDate: '2024-08-10',
        supplier: 'Sanofi Philippines',
        storage_conditions: 'Store at 2C to 8C'
    },
    {
        id: 7,
        vaccine: 'MMR Vaccine',
        batch: 'MMR-2024-001',
        manufacturer: 'Merck',
        quantity: 320,
        expiryDate: '2026-12-15',
        receivedDate: '2024-05-20',
        supplier: 'Merck Philippines',
        storage_conditions: 'Store at 2C to 8C'
    },
    {
        id: 8,
        vaccine: 'Oral Polio Vaccine (OPV)',
        batch: 'OPV-2024-001',
        manufacturer: 'Bio Farma',
        quantity: 450,
        expiryDate: '2025-10-10',
        receivedDate: '2024-04-25',
        supplier: 'DOH',
        storage_conditions: 'Store at 2C to 8C'
    },
    {
        id: 9,
        vaccine: 'Rabies Vaccine',
        batch: 'RABIES-2024-001',
        manufacturer: 'Sanofi Pasteur',
        quantity: 200,
        expiryDate: '2026-06-30',
        receivedDate: '2024-03-15',
        supplier: 'Sanofi Philippines',
        storage_conditions: 'Store at 2C to 8C'
    },
    {
        id: 10,
        vaccine: 'Varicella (Chickenpox) Vaccine',
        batch: 'VAR-2024-001',
        manufacturer: 'Merck',
        quantity: 250,
        expiryDate: '2026-09-25',
        receivedDate: '2024-07-18',
        supplier: 'Merck Philippines',
        storage_conditions: 'Store at 2C to 8C'
    }
];
let currentPage = 1;
const itemsPerPage = 5;

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

// Helper functions
function getDaysUntilExpiry(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function getExpiryClass(days) {
    if (days <= 30) return 'text-danger';
    if (days <= 90) return 'text-warning';
    return 'text-success';
}

function getStatusBadge(quantity, daysUntilExpiry) {
    if (daysUntilExpiry <= 30) return '<span class="badge bg-danger">Critical</span>';
    if (quantity < 300) return '<span class="badge bg-warning text-dark">Low</span>';
    return '<span class="badge bg-success">Good</span>';
}

function displayVaccineBatches(page = 1) {
    currentPage = page;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedData = vaccineData.slice(start, end);
    
    const tbody = document.getElementById('vaccineBatchTableBody');
    
    if (vaccineData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No vaccine batches found</td></tr>';
        document.getElementById('paginationWrap').innerHTML = 'Showing <strong>0-0</strong> of <strong>0</strong> results';
        return;
    }

    tbody.innerHTML = paginatedData.map(batch => {
        const daysUntilExpiry = getDaysUntilExpiry(batch.expiryDate);
        const statusBadge = getStatusBadge(batch.quantity, daysUntilExpiry);
        const expiryClass = getExpiryClass(daysUntilExpiry);
        
        return `
            <tr>
                <td>${batch.vaccine}</td>
                <td>${batch.batch}</td>
                <td>${batch.quantity}</td>
                <td>
                    ${new Date(batch.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    <small class="${expiryClass}">(${daysUntilExpiry} days left)</small>
                </td>
                <td>${statusBadge}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" onclick="editBatch(${batch.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="confirmDelete(${batch.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    updatePagination();
    updateStats();
}

function updatePagination() {
    const totalPages = Math.ceil(vaccineData.length / itemsPerPage);
    const wrap = document.getElementById('paginationWrap');
    
    if (vaccineData.length === 0) {
        wrap.innerHTML = 'Showing <strong>0-0</strong> of <strong>0</strong> results';
        return;
    }
    
    const showingFrom = vaccineData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const showingTo = Math.min(currentPage * itemsPerPage, vaccineData.length);

    let btns = `
        <button class="pg-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="bi bi-chevron-left"></i>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        btns += `<button class="pg-btn ${currentPage === i ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }

    btns += `
        <button class="pg-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="bi bi-chevron-right"></i>
        </button>
    `;

    wrap.innerHTML = `
        <span>Showing <strong>${showingFrom}-${showingTo}</strong> of <strong>${vaccineData.length}</strong> results</span>
        <div class="pagination-btns">${btns}</div>
    `;
}

function changePage(page) {
    const totalPages = Math.ceil(vaccineData.length / itemsPerPage);
    if (page < 1 || page > totalPages || vaccineData.length === 0) return;
    displayVaccineBatches(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStats() {
    const totalStock = vaccineData.reduce((sum, batch) => sum + batch.quantity, 0);
    const lowStock = vaccineData.filter(batch => batch.quantity < 300).length;
    const expiringSoon = vaccineData.filter(batch => getDaysUntilExpiry(batch.expiryDate) <= 30).length;
    
    document.getElementById('totalStock').textContent = totalStock;
    document.getElementById('lowStock').textContent = lowStock;
    document.getElementById('expiringSoon').textContent = expiringSoon;
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

function editBatch(id) {
    const batch = vaccineData.find(b => b.id === id);
    if (!batch) return;
    
    document.getElementById('edit_batch_id').value = batch.id;
    document.getElementById('edit_vaccine').value = batch.vaccine;
    document.getElementById('edit_batch_number').value = batch.batch;
    document.getElementById('edit_quantity').value = batch.quantity;
    document.getElementById('edit_expiry_date').value = batch.expiryDate;
    
    const modal = new bootstrap.Modal(document.getElementById('editVaccineBatchModal'));
    modal.show();
}

// Edit vaccine batch form submission
document.getElementById('editVaccineBatchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit_batch_id').value);
    const quantity = parseInt(document.getElementById('edit_quantity').value);
    const expiryDate = document.getElementById('edit_expiry_date').value;
    
    const batchIndex = vaccineData.findIndex(b => b.id === id);
    if (batchIndex !== -1) {
        vaccineData[batchIndex].quantity = quantity;
        vaccineData[batchIndex].expiryDate = expiryDate;
    }
    
    displayVaccineBatches(currentPage);
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('editVaccineBatchModal'));
    modal.hide();
    showToast('Vaccine batch updated successfully!');
});

function confirmDelete(id) {
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
            deleteBatch(id);
        }
    });
}

function deleteBatch(id) {
    vaccineData = vaccineData.filter(batch => batch.id !== id);
    
    // Adjust current page if needed
    const totalPages = Math.ceil(vaccineData.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    } else if (vaccineData.length === 0) {
        currentPage = 1;
    }
    
    displayVaccineBatches(currentPage);
    showToast('Vaccine batch has been deleted.', 'warn');
}

// Add new vaccine batch
document.getElementById('addVaccineBatchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newBatch = {
        id: vaccineData.length > 0 ? Math.max(...vaccineData.map(b => b.id)) + 1 : 1,
        vaccine: document.getElementById('vaccineSelect').value,
        batch: document.getElementById('batchNumber').value,
        quantity: parseInt(document.getElementById('quantity').value),
        receivedDate: document.getElementById('receivedDate').value,
        expiryDate: document.getElementById('expiryDate').value,
        manufacturer: document.getElementById('manufacturer').value,
        storageLocation: document.getElementById('storageLocation').value,
        notes: document.getElementById('notes').value
    };
    
    vaccineData.push(newBatch);
    
    // Go to last page to see the new item
    const totalPages = Math.ceil(vaccineData.length / itemsPerPage);
    displayVaccineBatches(totalPages);
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addVaccineBatchModal'));
    modal.hide();
    this.reset();
    showToast('Vaccine batch added successfully!');
});

// Add new vaccine
document.getElementById('addVaccineForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const vaccineName = document.getElementById('vaccineName').value;
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addVaccineModal'));
    modal.hide();
    this.reset();
    showToast(`Vaccine "${vaccineName}" added successfully!`);
});

// Search functionality
document.getElementById('searchVaccine').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm === '') {
        displayVaccineBatches(1);
        return;
    }
    
    const filtered = vaccineData.filter(batch => 
        batch.vaccine.toLowerCase().includes(searchTerm) ||
        batch.batch.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('vaccineBatchTableBody');
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No results found</td></tr>';
        document.getElementById('paginationWrap').innerHTML = 'Showing <strong>0-0</strong> of <strong>0</strong> results';
        return;
    }
    
    tbody.innerHTML = filtered.map(batch => {
        const daysUntilExpiry = getDaysUntilExpiry(batch.expiryDate);
        const statusBadge = getStatusBadge(batch.quantity, daysUntilExpiry);
        const expiryClass = getExpiryClass(daysUntilExpiry);
        
        return `
            <tr>
                <td>${batch.vaccine}</td>
                <td>${batch.batch}</td>
                <td>${batch.quantity}</td>
                <td>
                    ${new Date(batch.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    <small class="${expiryClass}">(${daysUntilExpiry} days left)</small>
                </td>
                <td>${statusBadge}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" onclick="editBatch(${batch.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="confirmDelete(${batch.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Update showing text for search results
    document.getElementById('paginationWrap').innerHTML = `Showing <strong>1-${filtered.length}</strong> of <strong>${filtered.length}</strong> results`;
});

// Set date constraints on page load
document.addEventListener('DOMContentLoaded', () => {
    displayVaccineBatches(1);
    
    // Set max date for received date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('receivedDate').setAttribute('max', today);
    
    // Set min date for expiry date to today
    document.getElementById('expiryDate').setAttribute('min', today);
});