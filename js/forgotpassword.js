document.getElementById("passwordResetForm")?.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("emailInput")?.value?.trim();
    if (!email) return;

    const submitBtn = this.querySelector(".btn-reset");
    const originalText = submitBtn ? submitBtn.textContent : "Send Reset Link";
    if (submitBtn) {
        submitBtn.textContent = "Sending...";
        submitBtn.disabled = true;
    }

    setTimeout(() => {
        const formWrap = document.getElementById("forgotForm");
        const successWrap = document.getElementById("successMessage");
        const sentEmail = document.getElementById("sentEmail");

        if (formWrap) formWrap.classList.add("d-none");
        if (successWrap) successWrap.classList.remove("d-none");
        if (sentEmail) sentEmail.textContent = email;

        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }, 1200);
});

function resendEmail(e) {
    e.preventDefault();

    Swal.fire({
        icon: "success",
        title: "Email Resent!",
        text: "We sent another password reset link.",
        confirmButtonColor: "#1CDB88",
        timer: 2200,
        showConfirmButton: false
    });
}
