document.addEventListener('DOMContentLoaded', () => {
    initNetworkAnimation();
    initSmoothScroll();
});

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}

function initNetworkAnimation() {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let nodes = [];
    const NODE_COUNT = 50;
    const CONNECTION_DISTANCE = 150;
    const MOUSE_DISTANCE = 200;

    let mouse = { x: null, y: null };

    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight; // Full screen
        canvas.width = width;
        canvas.height = height;
        initNodes();
    }

    class Node {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 1;
            this.vy = (Math.random() - 0.5) * 1;
            this.size = Math.random() * 2 + 1;
            this.color = '#38bdf8'; // Cyan
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;

            // Mouse interaction
            if (mouse.x != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < MOUSE_DISTANCE) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (MOUSE_DISTANCE - distance) / MOUSE_DISTANCE;
                    // Gentle push away or pull towards - let's pull towards slightly
                    // this.vx += forceDirectionX * force * 0.05;
                    // this.vy += forceDirectionY * force * 0.05;

                    // Actually, let's just make them glow/connect to mouse
                }
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    function initNodes() {
        nodes = [];
        for (let i = 0; i < NODE_COUNT; i++) {
            nodes.push(new Node());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < nodes.length; i++) {
            nodes[i].update();
            nodes[i].draw();

            // Connect to nearby nodes
            for (let j = i; j < nodes.length; j++) {
                let dx = nodes[i].x - nodes[j].x;
                let dy = nodes[i].y - nodes[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < CONNECTION_DISTANCE) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(56, 189, 248, ${1 - distance / CONNECTION_DISTANCE})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }

            // Connect to mouse
            if (mouse.x != null) {
                let dx = nodes[i].x - mouse.x;
                let dy = nodes[i].y - mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < MOUSE_DISTANCE) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(168, 85, 247, ${1 - distance / MOUSE_DISTANCE})`; // Purple
                    ctx.lineWidth = 1.5;
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    resizeCanvas();
    animate();
}
