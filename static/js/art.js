document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("dynamic-art-bg");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width, height;
    let orbs = [];

    const colors = [
        "rgba(25, 110, 160, 0.5)",  
        "rgba(15, 20, 30, 0.6)",    
        "rgba(90, 0, 220, 0.4)",    
        "rgba(138, 43, 226, 0.3)"   
    ];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class Orb {
        constructor() {
            this.baseRadius = Math.random() * 200 + 150; 
            this.radius = this.baseRadius;
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            
            this.angle = Math.random() * Math.PI * 2;
            this.baseSpeed = Math.random() * 0.5 + 0.2;
            this.speed = this.baseSpeed;
            
            this.vx = 0;
            this.vy = 0;
            this.friction = 0.95; 
            
            this.color = colors[Math.floor(Math.random() * colors.length)];
            
            this.pulseCycle = Math.random() * Math.PI * 2;
            this.pulseRate = Math.random() * 0.02 + 0.01;
        }

        applyForce(fx, fy) {
            this.vx += fx;
            this.vy += fy;
        }

        update() {
            this.pulseCycle += this.pulseRate;
            const pulse = (Math.sin(this.pulseCycle) + 1) / 2;
            
            this.speed = this.baseSpeed + (Math.pow(pulse, 4) * 2.5);
            this.radius = this.baseRadius * (1 - pulse * 0.12);

            this.angle += (Math.random() - 0.5) * 0.04;

            const ambientX = Math.cos(this.angle) * this.speed;
            const ambientY = Math.sin(this.angle) * this.speed;

            this.x += ambientX + this.vx;
            this.y += ambientY + this.vy;

            this.vx *= this.friction;
            this.vy *= this.friction;

            const margin = 150;
            if (this.x < -margin) { this.angle = Math.PI - this.angle; this.vx *= -1; }
            if (this.x > width + margin) { this.angle = Math.PI - this.angle; this.vx *= -1; }
            if (this.y < -margin) { this.angle = -this.angle; this.vy *= -1; }
            if (this.y > height + margin) { this.angle = -this.angle; this.vy *= -1; }
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

    function handlePointerHit(clientX, clientY) {
        orbs.forEach(orb => {
            const dx = orb.x - clientX;
            const dy = orb.y - clientY;
            const distance = Math.hypot(dx, dy);

            const hitRange = orb.radius * 1.5;

            if (distance < hitRange) {
                const forceStrength = (1 - distance / hitRange) * 28;
                const angle = Math.atan2(dy, dx);

                const fx = Math.cos(angle) * forceStrength;
                const fy = Math.sin(angle) * forceStrength;

                orb.applyForce(fx, fy);
                orb.radius *= 0.85;
            }
        });
    }

    function init() {
        resize();
        window.addEventListener("resize", resize);

        window.addEventListener("pointerdown", (e) => {
            handlePointerHit(e.clientX, e.clientY);
        });
        
        const numOrbs = window.innerWidth > 768 ? 10 : 5;
        orbs = [];
        for (let i = 0; i < numOrbs; i++) {
            orbs.push(new Orb());
        }
        animate();
    }

    function animate() {
        ctx.fillStyle = "rgba(248, 250, 252, 0.4)";
        ctx.fillRect(0, 0, width, height);
        
        orbs.forEach(orb => {
            orb.update();
            orb.draw();
        });
        
        requestAnimationFrame(animate);
    }

    init();
});
