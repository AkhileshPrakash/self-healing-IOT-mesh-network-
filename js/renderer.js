class Renderer {
    constructor(canvasId, simulation) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.sim = simulation;

        window.addEventListener('resize', () => this.resize());
        this.resize();

        this.loop();

        // Viewport Transform
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
    }

    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.sim.width = this.canvas.width;
        this.sim.height = this.canvas.height;
    }

    loop() {
        this.sim.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();
        ctx.translate(this.panX, this.panY);
        ctx.scale(this.zoom, this.zoom);

        // Draw Links
        // We iterate entities to find connections. Using a Set to avoid double drawing lines?
        // Or just draw from each source.
        ctx.lineWidth = 1;
        this.sim.entities.forEach(entity => {
            entity.connections.forEach(target => {
                // Determine link color
                let color = 'rgba(56, 189, 248, 0.2)'; // Default cyan faint

                if (entity.type === 'MOBILE' || target.type === 'MOBILE') {
                    color = 'rgba(168, 85, 247, 0.3)'; // Purple for mobile
                } else if (entity.type === 'HUB' || target.type === 'HUB') {
                    color = 'rgba(34, 197, 94, 0.4)'; // Green for Hub backbone
                }

                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.moveTo(entity.x, entity.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
            });
        });

        // Draw Entities
        this.sim.entities.forEach(e => {
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.fillStyle = e.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = e.color;
            ctx.fill();
            ctx.shadowBlur = 0; // Reset

            // Draw Label
            ctx.fillStyle = '#fff';
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(e.type === 'HUB' ? 'HUB' : e.id, e.x, e.y + e.radius + 12);
        });

        // Draw Packets
        this.sim.packets.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#facc15'; // Yellow
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#facc15';
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        ctx.restore();
    }
}
