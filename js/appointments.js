let calendar;

// Dummy appointment data
const dummyAppointments = [
    {
        id: 1,
        patient: { user: { profile: { full_name: 'Mark James' } } },
        staff: { user: { profile: { full_name: 'Dr. Maraiah Queen' } }, specialization: 'General Practice' },
        appointment_date: '2026-03-04',
        start_time: '00:00',
        end_time: '00:30',
        reason: 'General Checkup',
        status: 'confirmed'
    },
    {
        id: 2,
        patient: { user: { profile: { full_name: 'Sarah Williams' } } },
        staff: { user: { profile: { full_name: 'Dr. Smith Johnson' } }, specialization: 'Pediatrics' },
        appointment_date: '2026-03-04',
        start_time: '10:00',
        end_time: '10:30',
        reason: 'Vaccination',
        status: 'pending'
    },
    {
        id: 3,
        patient: { user: { profile: { full_name: 'Robert Brown' } } },
        staff: { user: { profile: { full_name: 'Dr. Emily Davis' } }, specialization: 'Cardiology' },
        appointment_date: '2026-03-05',
        start_time: '14:00',
        end_time: '14:30',
        reason: 'Heart Checkup',
        status: 'confirmed'
    },
    {
        id: 4,
        patient: { user: { profile: { full_name: 'John Doe' } } },
        staff: { user: { profile: { full_name: 'Dr. Maraiah Queen' } }, specialization: 'General Practice' },
        appointment_date: '2026-03-06',
        start_time: '09:00',
        end_time: '09:30',
        reason: 'Follow-up',
        status: 'completed'
    },
    {
        id: 5,
        patient: { user: { profile: { full_name: 'Jane Smith' } } },
        staff: { user: { profile: { full_name: 'Dr. Smith Johnson' } }, specialization: 'Pediatrics' },
        appointment_date: '2026-03-08',
        start_time: '11:00',
        end_time: '11:30',
        reason: 'Consultation',
        status: 'cancelled'
    }
];

document.addEventListener("DOMContentLoaded", () => {
    setupSidebar();
    initializeCalendar();
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
        if (window.innerWidth > 991) {
            closeSidebar();
        }
    });
}

function initializeCalendar() {
    const calendarEl = document.getElementById("calendar");
    if (!calendarEl || !window.FullCalendar) return;
    const isMobile = window.innerWidth < 768;

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        height: isMobile ? 500 : 650,
        headerToolbar: {
            left: "today prev,next",
            center: "title",
            right: isMobile ? "dayGridMonth,dayGridWeek" : "dayGridDay,dayGridWeek,dayGridMonth"
        },
        titleFormat: isMobile ? { month: "short", year: "numeric" } : { month: "long", year: "numeric" },
        windowResize() {
            const mobile = window.innerWidth < 768;
            calendar.setOption("height", mobile ? 500 : 650);
            calendar.setOption("titleFormat", mobile ? { month: "short", year: "numeric" } : { month: "long", year: "numeric" });
            calendar.setOption(
                "headerToolbar",
                mobile
                    ? { left: "today prev,next", center: "title", right: "dayGridMonth,dayGridWeek" }
                    : { left: "today prev,next", center: "title", right: "dayGridDay,dayGridWeek,dayGridMonth" }
            );
        },
        eventClick(info) {
            viewAppointmentDetails(info.event.id);
        }
    });

    calendar.render();
    displayAppointmentsOnCalendar(dummyAppointments);

    // Initialize mini calendar
    if (window.flatpickr) {
        flatpickr("#mini-calendar", {
            inline: true,
            defaultDate: new Date(),
            showMonths: 1,
            onChange(selectedDates) {
                if (selectedDates.length > 0) {
                    calendar.gotoDate(selectedDates[0]);
                }
            }
        });
    }
}

function displayAppointmentsOnCalendar(appointments) {
    if (!calendar) return;

    const statusColors = {
        pending: "#ffc107",
        confirmed: "#0d6efd",
        completed: "#198754",
        cancelled: "#dc3545"
    };

    const events = appointments.map((apt) => ({
        id: apt.id,
        title: `${apt.patient?.user?.profile?.full_name || "Patient"} - ${apt.reason || "Appointment"}`,
        start: `${apt.appointment_date}T${apt.start_time}`,
        end: `${apt.appointment_date}T${apt.end_time}`,
        color: statusColors[apt.status] || "#6c757d",
        extendedProps: apt
    }));

    calendar.removeAllEvents();
    calendar.addEventSource(events);
}

function formatTime(time) {
    if (!time) return "N/A";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    if (Number.isNaN(hour)) return time;
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function viewAppointmentDetails(appointmentId) {
    const appointment = dummyAppointments.find((apt) => String(apt.id) === String(appointmentId));
    if (!appointment) return;

    const statusBadges = {
        pending: "bg-warning text-dark",
        confirmed: "bg-primary",
        completed: "bg-success",
        cancelled: "bg-danger"
    };

    const details = `
        <div class="mb-3">
            <span class="badge ${statusBadges[appointment.status] || "bg-secondary"}">${(appointment.status || "unknown").toUpperCase()}</span>
        </div>
        <div class="mb-2"><strong>Patient:</strong> ${appointment.patient?.user?.profile?.full_name || "N/A"}</div>
        <div class="mb-2"><strong>Staff:</strong> ${appointment.staff?.user?.profile?.full_name || "N/A"}</div>
        <div class="mb-2"><strong>Date:</strong> ${new Date(appointment.appointment_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
        <div class="mb-2"><strong>Time:</strong> ${formatTime(appointment.start_time)} - ${formatTime(appointment.end_time)}</div>
        <div class="mb-2"><strong>Reason:</strong> ${appointment.reason || "N/A"}</div>
    `;

    document.getElementById("appointmentDetails").innerHTML = details;
    new window.bootstrap.Modal(document.getElementById("viewAppointmentModal")).show();
}
