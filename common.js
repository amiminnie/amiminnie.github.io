(function () {
    const canvas = document.createElement("canvas");
    canvas.id = "petals-canvas";
    // Added a slight blur to the canvas itself to help with readability
    canvas.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:-1; filter: blur(0.5px);";
    document.body.prepend(canvas);

    const ctx = canvas.getContext("2d");
    let width, height;
    const resize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    const atlas = new Image();
    atlas.src = "images/effects/petals.png";

    const PETAL_SIZE = 128;
    const PETALS_PER_ROW = 2;
    const NUM_PETALS = 45;

    // Wind State - slowed down for calmness
    let globalWind = 1.0;
    let windTime = 0;

    const petals = Array.from({ length: NUM_PETALS }, () => {
        const rawScale = Math.random();
        const scale = 0.12 + (Math.pow(rawScale, 3) * 0.48);
        
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            sx: Math.floor(Math.random() * PETALS_PER_ROW) * PETAL_SIZE,
            sy: Math.floor(Math.random() * PETALS_PER_ROW) * PETAL_SIZE,
            scale,
            // Lowered base speeds
            baseSpeedX: 0.3 + (scale * 1.2),
            baseSpeedY: 0.1 + (Math.random() * 0.3),
            
            // Randomness per petal - reduced rotation speed
            rotSpeed: (Math.random() - 0.5) * (0.005 + scale * 0.01),
            rotation: Math.random() * Math.PI * 2,
            wobbleAmplitude: (8 + Math.random() * 15) * scale,
            wobbleFrequency: 0.005 + Math.random() * 0.01,
            phase: Math.random() * 1000,
            
            // CALM FLUTTER properties
            flutterPhase: Math.random() * Math.PI * 2,
            flutterSpeed: 0.01 + Math.random() * 0.02, // Slower oscillation
            
            parallax: scale * 0.6,
            opacity: 0.2 + (scale * 0.6)
        };
    });

    petals.sort((a, b) => a.scale - b.scale);

    function draw() {
        ctx.clearRect(0, 0, width, height);
        const scrollOffset = window.scrollY;

        // Slowed down the wind frequency (0.002 instead of 0.005)
        windTime += 0.002;
        globalWind = 1 + Math.sin(windTime) * 0.4;

        petals.forEach((p) => {
            let yPos = (p.y - (scrollOffset * p.parallax)) % height;
            if (yPos < 0) yPos += height;

            const xWobble = Math.sin(p.phase) * p.wobbleAmplitude;
            
            // Subtle 3D-flip effect
            // We use cos for the flutter to offset it from the xWobble sine
            const flutterScaleY = Math.cos(p.flutterPhase) * p.scale;

            ctx.save();
            ctx.globalAlpha = Math.min(p.opacity, 1);
            ctx.translate(p.x + xWobble, yPos);
            ctx.rotate(p.rotation);
        
            
            ctx.rotate(p.rotation - Math.PI / 4);
            ctx.scale(p.scale, flutterScaleY);
            
            ctx.drawImage(
                atlas,
                p.sx, p.sy, PETAL_SIZE, PETAL_SIZE,
                -PETAL_SIZE / 2, -PETAL_SIZE / 2, PETAL_SIZE, PETAL_SIZE
            );
            ctx.restore();

            // Movement updates
            p.x += p.baseSpeedX * globalWind;
            p.y += p.baseSpeedY;
            p.rotation += p.rotSpeed * globalWind;
            p.phase += p.wobbleFrequency * globalWind;
            p.flutterPhase += p.flutterSpeed * globalWind;

            if (p.x > width + (PETAL_SIZE * p.scale)) p.x = -PETAL_SIZE * p.scale;
            if (p.y > height) p.y = 0;
        });

        requestAnimationFrame(draw);
    }

    atlas.onload = () => draw();
})();