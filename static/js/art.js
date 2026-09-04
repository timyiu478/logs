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
            // Original size parameters[cite: 1]
            this.baseRadius = Math.random() * 200 + 150; 
            this.radius = this.baseRadius;
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            
            // Vector movement instead of rigid dx/dy
            this.angle = Math.random() * Math.PI * 2;
            this.baseSpeed = Math.random() * 0.5 + 0.2;
            this.speed = this.baseSpeed;
            
            this.color = colors[Math.floor(Math.random() * colors.length)];
            
            // Jellyfish biolocomotion (Pulse timing)
            this.pulseCycle = Math.random() * Math.PI * 2;
            this.pulseRate = Math.random() * 0.02 + 0.01;
        }

        update() {
            // 1. Advance the breathing cycle
            this.pulseCycle += this.pulseRate;
            
            // Sine wave normalized to 0-1 for rhythmic breathing
            const pulse = (Math.sin(this.pulseCycle) + 1) / 2;
            
            // 2. Pulse and Glide: Burst of speed during the "contraction" phase
            this.speed = this.baseSpeed + (Math.pow(pulse, 4) * 2.5);
            
            // 3. Flex the radius slightly to visualize the propulsion
            this.radius = this.baseRadius * (1 - pulse * 0.12);

            // 4. Add a slight organic wobble to the steering
            this.angle += (Math.random() - 0.5) * 0.04;

            // Apply movement
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;

            // 5. Soft boundary reflection (steering away from edges instead of hard bounces)
            const margin = 150;
            if (this.x < -margin) this.angle = Math.PI - this.angle; 
            if (this.x > width + margin) this.angle = Math.PI - this.angle; 
            if (this.y < -margin) this.angle = -this.angle; 
            if (this.y > height + margin) this.angle = -this.angle; 
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
        // This creates the jellyfish "motion trail" without drawing extra shapes.
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
