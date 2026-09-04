document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("dynamic-art-bg");
    const ctx = canvas.getContext("2d");

    let width, height;
    let orbs = [];

    const colors = [
        "rgba(25, 110, 160, 0.5)",  // Icy Blue
        "rgba(15, 20, 30, 0.6)",    // Deep Charcoal/Black
        "rgba(90, 0, 220, 0.4)",    // Vivid Purple
        "rgba(138, 43, 226, 0.3)"   // Lighter Violet
    ];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class Orb {
        constructor() {
            this.radius = Math.random() * 200 + 150;
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.dx = (Math.random() - 0.5) * 1.2;
            this.dy = (Math.random() - 0.5) * 1.2;
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
            if (this.x - this.radius < -100 || this.x + this.radius > width + 100) this.dx *= -1;
            if (this.y - this.radius < -100 || this.y + this.radius > height + 100) this.dy *= -1;

            this.x += this.dx;
            this.y += this.dy;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.closePath();
        }
    }

    function init() {
        resize();
        window.addEventListener("resize", resize);
        
        const numOrbs = window.innerWidth > 768 ? 10 : 5;
        for (let i = 0; i < numOrbs; i++) {
            orbs.push(new Orb());
        }
        animate();
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        orbs.forEach(orb => {
            orb.update();
            orb.draw();
        });
        
        requestAnimationFrame(animate);
    }

    init();
});
