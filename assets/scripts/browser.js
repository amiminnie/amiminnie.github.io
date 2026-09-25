document.addEventListener("DOMContentLoaded", () => {
    let zIndexCounter = 1000;

    // --- Taskbar Setup ---
    let taskbar = document.getElementById("web-window-taskbar");
    if (!taskbar) {
        taskbar = document.createElement("div");
        taskbar.id = "web-window-taskbar";
        taskbar.className = "web-window-taskbar";
        document.body.appendChild(taskbar);
    }

    // Remove hash without adding history entries
    function clearHash() {
        if (window.location.hash) {
            history.replaceState(null, document.title, window.location.pathname + window.location.search);
        }
    }

    function createWindow(targetUrl, titleText) {
        const win = document.createElement("div");
        win.className = "web-window active";
        win.style.zIndex = ++zIndexCounter;

        // Check if device/viewport is mobile-sized (<= 768px width)
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // Mobile full screen positioning
            win.classList.add("mobile-fullscreen");
            win.style.top = "0px";
            win.style.left = "0px";
            win.style.width = "100vw";
            win.style.height = "100vh";
        } else {
            // Default window positioning offset for desktop
            const existingWindows = document.querySelectorAll(".web-window").length;
            const offset = (existingWindows % 10) * 30;
            win.style.top = `${100 + offset}px`;
            win.style.left = `${100 + offset}px`;
            win.style.width = "50vw";
            win.style.height = "80vh";
        }

        win.innerHTML = `
            <div class="web-window-header">
                <div class="web-window-title">${titleText}</div>
                <div class="web-window-controls">
                    <button class="btn iframe-minimize" title="Minimize">
                        <i class='bi bi-dash-lg'></i>
                    </button>
                    <button class="btn iframe-open-tab" title="Open in new tab">
                        <i class='bi bi-square'></i>
                    </button>
                    <button class="btn close-btn iframe-close" title="Close window">
                        <i class='bi bi-x-lg'></i>
                    </button>
                </div>
            </div>
            <div class="web-window-body">
                <iframe src="${targetUrl}" allow="fullscreen"></iframe>
            </div>
            <!-- Resize Handles -->
            <div class="resizer n"></div>
            <div class="resizer e"></div>
            <div class="resizer s"></div>
            <div class="resizer w"></div>
            <div class="resizer nw"></div>
            <div class="resizer ne"></div>
            <div class="resizer sw"></div>
            <div class="resizer se"></div>
        `;

        document.body.appendChild(win);

        // --- Taskbar Item Creation ---
        const taskbarItem = document.createElement("button");
        taskbarItem.className = "taskbar-item";
        taskbarItem.innerHTML = `<i class="bi bi-window"></i> <span>${titleText}</span>`;
        taskbar.appendChild(taskbarItem);

        // Focus window on click
        win.addEventListener("mousedown", () => {
            win.style.zIndex = ++zIndexCounter;
        });

        // Close button logic
        const closeBtn = win.querySelector(".iframe-close");
        closeBtn.addEventListener("click", () => {
            win.remove();
            taskbarItem.remove();
        });

        // Open in new tab button
        const openTabBtn = win.querySelector(".iframe-open-tab");
        openTabBtn.addEventListener("click", () => {
            window.open(targetUrl, "_blank", "noopener,noreferrer");
        });

        // --- Minimize / Restore Logic ---
        const minimizeBtn = win.querySelector(".iframe-minimize");
        
        function minimizeWindow() {
            win.classList.add("minimized");
            taskbarItem.classList.add("active");
        }

        function restoreWindow() {
            win.classList.remove("minimized");
            win.style.zIndex = ++zIndexCounter;
            taskbarItem.classList.remove("active");
        }

        minimizeBtn.addEventListener("click", minimizeWindow);

        taskbarItem.addEventListener("click", () => {
            if (win.classList.contains("minimized")) {
                restoreWindow();
            } else {
                // On mobile, clicking active window taskbar item minimizes it, otherwise brings it to front
                if (win.style.zIndex == zIndexCounter && !win.classList.contains("minimized")) {
                    minimizeWindow();
                } else {
                    restoreWindow();
                }
            }
        });

        // --- Dragging Logic (Disabled on mobile) ---
        const header = win.querySelector(".web-window-header");
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        header.addEventListener("mousedown", (e) => {
            if (isMobile) return; // Disable dragging on mobile screens
            if (e.target.closest("button")) return;
            isDragging = true;
            
            const rect = win.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;

            win.style.zIndex = ++zIndexCounter;
            document.body.style.userSelect = "none";
            win.querySelector("iframe").style.pointerEvents = "none";
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging || isMobile) return;
            win.style.left = `${e.clientX - dragOffsetX}px`;
            win.style.top = `${e.clientY - dragOffsetY}px`;
        });

        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = "";
                win.querySelector("iframe").style.pointerEvents = "auto";
            }
        });

        // --- Resizing Logic (Disabled on mobile) ---
        const resizers = win.querySelectorAll(".resizer");
        let isResizing = false;
        let currentResizer = null;
        let originalWidth = 0;
        let originalHeight = 0;
        let originalX = 0;
        let originalY = 0;
        let originalMouseX = 0;
        let originalMouseY = 0;

        const minWidth = 250;
        const minHeight = 150;

        resizers.forEach((resizer) => {
            resizer.addEventListener("mousedown", (e) => {
                if (isMobile) return; // Disable resizing on mobile screens
                isResizing = true;
                currentResizer = resizer;
                originalWidth = win.offsetWidth;
                originalHeight = win.offsetHeight;
                originalX = win.offsetLeft;
                originalY = win.offsetTop;
                originalMouseX = e.clientX;
                originalMouseY = e.clientY;

                document.body.style.userSelect = "none";
                win.querySelector("iframe").style.pointerEvents = "none";
                e.stopPropagation();
            });
        });

        document.addEventListener("mousemove", (e) => {
            if (!isResizing || isMobile) return;

            const dx = e.clientX - originalMouseX;
            const dy = e.clientY - originalMouseY;

            if (currentResizer.classList.contains("e")) {
                const width = originalWidth + dx;
                if (width > minWidth) win.style.width = `${width}px`;
            } else if (currentResizer.classList.contains("s")) {
                const height = originalHeight + dy;
                if (height > minHeight) win.style.height = `${height}px`;
            } else if (currentResizer.classList.contains("w")) {
                const width = originalWidth - dx;
                if (width > minWidth) {
                    win.style.width = `${width}px`;
                    win.style.left = `${originalX + dx}px`;
                }
            } else if (currentResizer.classList.contains("n")) {
                const height = originalHeight - dy;
                if (height > minHeight) {
                    win.style.height = `${height}px`;
                    win.style.top = `${originalY + dy}px`;
                }
            } else if (currentResizer.classList.contains("se")) {
                const width = originalWidth + dx;
                const height = originalHeight + dy;
                if (width > minWidth) win.style.width = `${width}px`;
                if (height > minHeight) win.style.height = `${height}px`;
            } else if (currentResizer.classList.contains("sw")) {
                const width = originalWidth - dx;
                const height = originalHeight + dy;
                if (width > minWidth) {
                    win.style.width = `${width}px`;
                    win.style.left = `${originalX + dx}px`;
                }
                if (height > minHeight) win.style.height = `${height}px`;
            } else if (currentResizer.classList.contains("nw")) {
                const width = originalWidth - dx;
                const height = originalHeight - dy;
                if (width > minWidth) {
                    win.style.width = `${width}px`;
                    win.style.left = `${originalX + dx}px`;
                }
                if (height > minHeight) {
                    win.style.height = `${height}px`;
                    win.style.top = `${originalY + dy}px`;
                }
            } else if (currentResizer.classList.contains("ne")) {
                const width = originalWidth + dx;
                const height = originalHeight - dy;
                if (width > minWidth) win.style.width = `${width}px`;
                if (height > minHeight) {
                    win.style.height = `${height}px`;
                    win.style.top = `${originalY + dy}px`;
                }
            }
        });

        document.addEventListener("mouseup", () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.userSelect = "";
                win.querySelector("iframe").style.pointerEvents = "auto";
            }
        });
    }

    function handleHashChange() {
        const rawHash = window.location.hash.substring(1);
        if (!rawHash) return;

        const hash = decodeURIComponent(rawHash);
        let url = null;

        if (hash.startsWith("http://") || hash.startsWith("https://")) {
            url = hash;
        } else if (hash.startsWith("self://")) {
            const file = hash.slice(7);
            url = "/" + file.replace(/^\/+/, "");
        }

        clearHash();

        if (url) {
            createWindow(url, hash);
        }
    }

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
});