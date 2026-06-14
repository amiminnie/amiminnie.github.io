document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.createElement("div");
    overlay.className = "web-window-overlay";
    overlay.id = "iframe-window-overlay";

    overlay.innerHTML = `
    <div class="web-window">
      <div class="web-window-header">
        <div class="web-window-title" id="iframe-window-title">Loading...</div>
        <div class="web-window-controls">
          <button class="web-window-btn" id="iframe-open-tab" title="Open in new tab">
            <span class="material-symbols-outlined">open_in_new</span>
          </button>
          <button class="web-window-btn close-btn" id="iframe-close" title="Close window">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <div class="web-window-body">
        <iframe id="iframe-window-target" src="" allow="fullscreen"></iframe>
      </div>
    </div>
  `;

    document.body.appendChild(overlay);

    const iframe = document.getElementById("iframe-window-target");
    const title = document.getElementById("iframe-window-title");
    const openTabBtn = document.getElementById("iframe-open-tab");
    const closeBtn = document.getElementById("iframe-close");

    const win = overlay.querySelector(".web-window");
    const header = overlay.querySelector(".web-window-header");
    let currentUrl = "";
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;
    let canDrag = false;
    win.addEventListener("transitionend", (e) => {
        if (e.propertyName === "transform") {
            canDrag = true;
        }
    });

    function handleHashChange() {
        const hash = window.location.hash.substring(1);
        if (hash && (hash.startsWith("http://") || hash.startsWith("https://"))) {
            currentUrl = hash;
            title.textContent = hash;
            iframe.src = hash;
            overlay.classList.add("active");
            canDrag = false;
            dragging = false;
            win.classList.remove("dragging");
            win.style.left = "";
            win.style.top = "";
            win.style.transform = "";
        } else {
            closeWindow();
        }
    }

    function closeWindow() {
        overlay.classList.remove("active");
        iframe.src = "";
        canDrag = false;
        dragging = false;
        win.classList.remove("dragging");
        win.style.left = "";
        win.style.top = "";
        win.style.transform = "";
        if (window.location.hash) {
            history.replaceState(null, null, " ");
        }
    }
    closeBtn.addEventListener("click", closeWindow);
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeWindow();
    });
    openTabBtn.addEventListener("click", () => {
        if (currentUrl) {
            window.open(currentUrl, "_blank", "noopener,noreferrer");
            closeWindow();
        }
    });

    header.addEventListener("mousedown", (e) => {
        if (!canDrag) return;
        dragging = true;
        const rect = win.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        win.classList.add("dragging");
        win.style.left = `${rect.left}px`;
        win.style.top = `${rect.top}px`;
        win.style.transform = "none";
        document.body.style.userSelect = "none";
    });
    document.addEventListener("mousemove", (e) => {
        if (!dragging) return;
        win.style.left = `${e.clientX - offsetX}px`;
        win.style.top = `${e.clientY - offsetY}px`;
    });
    document.addEventListener("mouseup", () => {
        dragging = false;
        document.body.style.userSelect = "";
    });
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
});
