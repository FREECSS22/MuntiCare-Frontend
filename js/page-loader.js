(function () {
    const KEY = "munticare_show_login_skeleton_v1";

    let shouldShow = false;
    try {
        shouldShow = sessionStorage.getItem(KEY) === "1";
        if (shouldShow) sessionStorage.removeItem(KEY);
    } catch {
        shouldShow = false;
    }

    if (!shouldShow) return;

    const hasSidebar = Boolean(document.querySelector(".sidebar"));
    const overlay = document.createElement("div");
    overlay.className = `munti-skeleton-overlay ${hasSidebar ? "with-sidebar" : "no-sidebar"}`;
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
        <div class="munti-skeleton-shell">
            <div class="munti-skeleton-nav munti-skel"></div>
            <div class="munti-skeleton-main">
                <div class="munti-skeleton-sidebar">
                    <div class="munti-skeleton-logo munti-skel"></div>
                    <div class="munti-skeleton-menu munti-skel"></div>
                    <div class="munti-skeleton-menu munti-skel"></div>
                    <div class="munti-skeleton-menu munti-skel"></div>
                </div>
                <div class="munti-skeleton-content">
                    <div class="munti-skeleton-head munti-skel"></div>
                    <div class="munti-skeleton-cards">
                        <div class="munti-skeleton-card munti-skel"></div>
                        <div class="munti-skeleton-card munti-skel"></div>
                        <div class="munti-skeleton-card munti-skel"></div>
                        <div class="munti-skeleton-card munti-skel"></div>
                    </div>
                    <div class="munti-skeleton-table munti-skel"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const dismiss = () => {
        overlay.classList.add("hide");
        setTimeout(() => overlay.remove(), 260);
    };

    setTimeout(dismiss, 850);
})();
