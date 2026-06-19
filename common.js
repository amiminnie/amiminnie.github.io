(() => {
    // -----------------------------
    // CONFIG (per page control)
    // -----------------------------
    const config = window.PETAL_SETTINGS || {};
    const ALLOW_3D = config.enable3D !== false;
    const container = document.getElementById("container");

    const get = (k, d) => localStorage.getItem(k) ?? d;
    const set = (k, v) => localStorage.setItem(k, v);

    // -----------------------------
    // POPUP UI
    // -----------------------------
    const popup = document.createElement("div");
    popup.className = "settings-popup hidden";

    popup.innerHTML = `
    <h3>Style</h3>

    <label>
      <span>Dark Mode</span>
      <input type="checkbox" id="set-dark">
    </label>

    <label>
      <span>
        Simplified Mode
        <p>Experimental</p>
      </span>
      <input type="checkbox" id="set-compat" disabled>
    </label>

    ${
        ALLOW_3D
            ? `<label>
            <span>Sunflower Petals</span>
            <input type="checkbox" id="set-3d">
          </label>`
            : ""
    }
  `;

    container.appendChild(popup);

    // -----------------------------
    // ELEMENTS
    // -----------------------------
    const btn = document.getElementById("theme-toggle");
    const icon = document.getElementById("theme-icon");
    const themeLink = document.getElementById("theme-style");

    const darkToggle = popup.querySelector("#set-dark");
    const compatToggle = popup.querySelector("#set-compat");
    const effectsToggle = popup.querySelector("#set-3d");

    // -----------------------------
    // DEFAULT STORAGE
    // -----------------------------
    if (!get("theme")) set("theme", "dark");
    if (get("compatibility") === null) set("compatibility", "false");

    if (ALLOW_3D && get("effects3d") === null) {
        set("effects3d", "true");
    }

    // -----------------------------
    // THEME
    // -----------------------------
    function setTheme(mode) {
        const compat = get("compatibility") === "true";

        if (themeLink) {
            themeLink.href = compat ? "style-old.css" : mode === "dark" ? "dark.css" : "light.css";
        }

        document.documentElement.style.colorScheme = mode;

        if (icon) {
            icon.src = mode === "dark" ? "images/sun-icon.png" : "images/moon-icon.png";
        }

        set("theme", mode);
        darkToggle.checked = mode === "dark";
    }

    // -----------------------------
    // COMPATIBILITY MODE (NEW CLEAN VERSION)
    // -----------------------------
    function setCompatibility(enabled) {
        const theme = get("theme") || "dark";

        if (themeLink) {
            themeLink.href = enabled ? "style-old.css" : theme === "dark" ? "dark.css" : "light.css";
        }

        set("compatibility", enabled);
        compatToggle.checked = enabled;
    }

    // -----------------------------
    // PETALS SYSTEM (FIXED RESTART SAFE)
    // -----------------------------
    let running = false;
    let canvas, ctx;
    let petals = [];
    let atlas;

    function createCanvas() {
        canvas = document.createElement("canvas");
        canvas.id = "petals-canvas";
        document.body.prepend(canvas);
        ctx = canvas.getContext("2d");

        const resize = () => {
            canvas.width = innerWidth;
            canvas.height = innerHeight;
        };

        addEventListener("resize", resize);
        resize();
    }

    function createPetals() {
        const SIZE = 128;
        const ROWS = 2;
        const COUNT = 45;

        petals = Array.from({ length: COUNT }, () => {
            const scale = 0.12 + Math.random() ** 3 * 0.48;

            return {
                x: Math.random() * innerWidth,
                y: Math.random() * innerHeight,
                sx: Math.floor(Math.random() * ROWS) * SIZE,
                sy: Math.floor(Math.random() * ROWS) * SIZE,
                scale,
                vx: 0.3 + scale * 1.2,
                vy: 0.1 + Math.random() * 0.3,
                rot: Math.random() * Math.PI * 2,
                rotV: (Math.random() - 0.5) * 0.01,
                phase: Math.random() * 1000,
                wobble: 0.005 + Math.random() * 0.01,
                flutter: Math.random() * Math.PI * 2,
                flutterV: 0.01 + Math.random() * 0.02,
                opacity: 0.2 + scale * 0.6,
                parallax: scale
            };
        });
    }

    function loop() {
        if (!running) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const t = performance.now() * 0.0005;
        const wind = 1 + Math.sin(t) * 0.4;

        for (const p of petals) {
            let y = (p.y - scrollY * p.parallax) % canvas.height;
            if (y < 0) y += canvas.height;

            const x = p.x + Math.sin(p.phase) * 10;

            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.translate(x, y);
            ctx.rotate(p.rot);
            ctx.scale(p.scale, Math.cos(p.flutter) * p.scale);

            ctx.drawImage(atlas, p.sx, p.sy, 128, 128, -64, -64, 128, 128);

            ctx.restore();

            p.x += p.vx * wind;
            p.y += p.vy;
            p.rot += p.rotV * wind;
            p.phase += p.wobble * wind;
            p.flutter += p.flutterV * wind;

            if (p.x > innerWidth + 100) p.x = -100;
            if (p.y > innerHeight) p.y = 0;
        }

        requestAnimationFrame(loop);
    }

    function startPetals() {
        if (!ALLOW_3D) return;
        if (get("effects3d") === "false") return;
        if (running) return;

        atlas = new Image();
        atlas.src = "images/effects/petals.png";

        atlas.onload = () => {
            createCanvas();
            createPetals();
            running = true;
            loop();
        };
    }

    function stopPetals() {
        running = false;
        document.getElementById("petals-canvas")?.remove();
        canvas = null;
        ctx = null;
        petals = [];
        atlas = null;
    }

    // -----------------------------
    // APPLY STATE
    // -----------------------------
    const compatEnabled = get("compatibility") === "true";
    setCompatibility(compatEnabled);

    const effectsEnabled = ALLOW_3D && get("effects3d") !== "false";

    if (effectsToggle) effectsToggle.checked = effectsEnabled;

    darkToggle.checked = get("theme") === "dark";

    setTheme(get("theme"));

    if (effectsEnabled) startPetals();

    // -----------------------------
    // EVENTS
    // -----------------------------
    darkToggle.addEventListener("change", () => {
        setTheme(darkToggle.checked ? "dark" : "light");
    });

    compatToggle.addEventListener("change", () => {
        setCompatibility(compatToggle.checked);
    });

    if (effectsToggle) {
        effectsToggle.addEventListener("change", () => {
            set("effects3d", effectsToggle.checked);

            if (effectsToggle.checked) startPetals();
            else stopPetals();
        });
    }

    // -----------------------------
    // POPUP CONTROL
    // -----------------------------
    btn?.addEventListener("click", (e) => {
        e.stopPropagation();
        popup.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
        if (!popup.contains(e.target) && !btn?.contains(e.target)) {
            popup.classList.add("hidden");
        }
    });
})();
