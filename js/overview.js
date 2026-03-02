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

// Charts
const createDummyChart = (ctx, type) => {
    new Chart(ctx, {
        type: type,
        data: {
            labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul'],
            datasets: [{
                label: 'Dataset',
                data: [10,20,15,30,25,35,20],
                backgroundColor: type==='bar'||type==='line' ? '#0d6efd' : ['#0d6efd','#198754','#ffc107','#dc3545','#6c757d'],
                borderColor:'#fff',
                borderWidth:1,
                fill: type==='line'
            }]
        },
        options: { 
            responsive:true, 
            maintainAspectRatio: true,
            plugins:{ legend:{display:true} } 
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    createDummyChart(document.getElementById('appointmentsTrendChart').getContext('2d'), 'line');
    createDummyChart(document.getElementById('vaccineDistributionChart').getContext('2d'), 'doughnut');
    createDummyChart(document.getElementById('demographicsChart').getContext('2d'), 'bar');
    createDummyChart(document.getElementById('statusChart').getContext('2d'), 'pie');
});