class Entity {
    constructor(id, x, y, type) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type; // 'HUB', 'NODE', 'MOBILE'
        this.radius = 20;
        this.radius = 20;
        this.baseColor = '#ffffff'; // Store base color
        this.color = this.baseColor;
        this.connections = []; // Array of connected Entities
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.isDragging = false;

        // New Properties
        this.active = true;
        this.isFixed = false; // By default movable

        // Limits
        this.MAX_CONNECTIONS = 4;
        this.RANGE = 180;
    }

    update(width, height) {
        // If inactive, maybe stop visuals? But physics might remain if mobile.
        // If fixed, no movement.
        if (this.isFixed || this.isDragging) {
            // Update Color based on Active State even if fixed
            this.color = this.active ? this.baseColor : '#ef4444';
            return;
        }

        // Gentle floating movement
        if (this.type !== 'HUB') {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off walls
            if (this.x < this.radius || this.x > width - this.radius) this.vx *= -1;
            if (this.y < this.radius || this.y > height - this.radius) this.vy *= -1;
        }

        // Update Color based on Active State
        this.color = this.active ? this.baseColor : '#ef4444';
    }

    distanceTo(other) {
        return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
    }
}

class Hub extends Entity {
    constructor(x, y) {
        super('HUB', x, y, 'HUB');
        this.radius = 35;
        this.radius = 35;
        this.baseColor = '#a855f7'; // Purple
        this.color = this.baseColor;
        this.RANGE = 0;
        this.isFixed = true; // Hub is Fixed
    }
}

class Node extends Entity {
    constructor(id, x, y) {
        super(id, x, y, 'NODE');
        this.radius = 15;
        this.radius = 15;
        this.baseColor = '#22c55e'; // Green
        this.color = this.baseColor;
        this.active = true;
        this.isFixed = true; // Nodes are Fixed
    }
}

class Mobile extends Entity {
    constructor(id, x, y) {
        super(id, x, y, 'MOBILE');
        this.radius = 10;
        this.radius = 10;
        this.baseColor = '#38bdf8'; // Cyan
        this.color = this.baseColor;
        this.RANGE = 120; // Shorter range
        this.isFixed = false; // Mobiles are Movable
    }
}

class Packet {
    constructor(startEntity, endEntity, path) {
        this.x = startEntity.x;
        this.y = startEntity.y;
        this.target = endEntity; // Final destination (usually Hub)
        this.path = path; // List of Entity objects
        this.currentStep = 0;
        this.progress = 0;
        this.speed = 0.05;
        this.active = true;
    }

    update() {
        if (!this.active) return;

        // Move between current node and next node in path
        if (this.currentStep >= this.path.length - 1) {
            this.active = false; // Delivered
            return;
        }

        const start = this.path[this.currentStep];
        const end = this.path[this.currentStep + 1];

        this.progress += this.speed;

        this.x = start.x + (end.x - start.x) * this.progress;
        this.y = start.y + (end.y - start.y) * this.progress;

        if (this.progress >= 1.0) {
            this.progress = 0;
            this.currentStep++;
            if (this.currentStep >= this.path.length - 1) {
                this.active = false;
            }
        }
    }
}
