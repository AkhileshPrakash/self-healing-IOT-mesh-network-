class InteractionHandler {
    constructor(canvasId, simulation, renderer) {
        this.canvas = document.getElementById(canvasId);
        this.sim = simulation;
        this.renderer = renderer; // Need renderer for zoom/pan props
        this.draggedEntity = null;
        this.selectedEntity = null;

        // Pan State
        this.isPanning = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Listeners
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        // Touch Listeners
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
        this.canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e));

        // Touch State
        this.initialPinchDist = null;
        this.lastTouchX = 0;
        this.lastTouchY = 0;
    }

    getTouchPos(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = touch.clientX - rect.left;
        const screenY = touch.clientY - rect.top;
        return {
            x: (screenX - this.renderer.panX) / this.renderer.zoom,
            y: (screenY - this.renderer.panY) / this.renderer.zoom,
            screenX: screenX,
            screenY: screenY
        };
    }

    onTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            // Single touch: Drag or Select
            const touch = e.touches[0];
            const pos = this.getTouchPos(touch);

            // Re-use mouse logic for selection
            let clicked = null;
            for (let i = this.sim.entities.length - 1; i >= 0; i--) {
                const entity = this.sim.entities[i];
                const dist = Math.sqrt((pos.x - entity.x) ** 2 + (pos.y - entity.y) ** 2);
                if (dist < entity.radius / this.renderer.zoom + 15) { // Larger hit area for touch
                    if (dist < entity.radius + 10) {
                        clicked = entity;
                        break;
                    }
                }
            }

            if (clicked) {
                this.selectedEntity = clicked;
                if (clicked.active) {
                    this.draggedEntity = clicked;
                    clicked.isDragging = true;
                    clicked.vx = 0;
                    clicked.vy = 0;
                }
            } else {
                this.selectedEntity = null;
                // If background clicked, prepare for pan
                this.isPanning = true;
                this.lastTouchX = pos.screenX;
                this.lastTouchY = pos.screenY;
            }
        } else if (e.touches.length === 2) {
            // Pinch Zoom Start
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            this.initialPinchDist = Math.sqrt(dx * dx + dy * dy);
        }
    }

    onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const pos = this.getTouchPos(touch);

            if (this.draggedEntity) {
                // Dragging
                this.draggedEntity.x = Math.max(this.draggedEntity.radius, Math.min(this.sim.width - this.draggedEntity.radius, pos.x));
                this.draggedEntity.y = Math.max(this.draggedEntity.radius, Math.min(this.sim.height - this.draggedEntity.radius, pos.y));
            } else if (this.isPanning) {
                // Panning
                const dx = pos.screenX - this.lastTouchX;
                const dy = pos.screenY - this.lastTouchY;
                this.renderer.panX += dx;
                this.renderer.panY += dy;
                this.lastTouchX = pos.screenX;
                this.lastTouchY = pos.screenY;
            }
        } else if (e.touches.length === 2 && this.initialPinchDist) {
            // Pinch Zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const currentDist = Math.sqrt(dx * dx + dy * dy);

            if (currentDist > 0) {
                const scale = currentDist / this.initialPinchDist;
                const newZoom = this.renderer.zoom * scale;
                // Clamp zoom
                if (newZoom >= 0.1 && newZoom <= 5) {
                    // Center of pinch
                    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                    const rect = this.canvas.getBoundingClientRect();
                    const screenX = centerX - rect.left;
                    const screenY = centerY - rect.top;

                    // Compute world pos before zoom
                    const wx = (screenX - this.renderer.panX) / this.renderer.zoom;
                    const wy = (screenY - this.renderer.panY) / this.renderer.zoom;

                    this.renderer.zoom = newZoom;

                    // Adjust pan
                    this.renderer.panX = screenX - wx * newZoom;
                    this.renderer.panY = screenY - wy * newZoom;

                    this.initialPinchDist = currentDist; // Reset for smooth continuous zoom
                }
            }
        }
    }

    onTouchEnd(e) {
        e.preventDefault();
        if (this.draggedEntity) {
            this.draggedEntity.isDragging = false;
            this.draggedEntity = null;
        }
        this.isPanning = false;
        if (e.touches.length < 2) {
            this.initialPinchDist = null;
        }
    }

    // Renamed logic to support external trigger from UI
    triggerPacket(sourceEntity) {
        // Pathfinding: Entity -> ... -> Hub
        // If source is Hub, ignore (Hub is sink)
        if (sourceEntity.type === 'HUB') return;

        // BFS to find Hub
        const target = this.sim.hub;

        let queue = [];
        let visited = new Set();
        let parents = new Map();

        queue.push(sourceEntity);
        visited.add(sourceEntity);

        let found = false;

        while (queue.length > 0) {
            let current = queue.shift();

            if (current === target) {
                found = true;
                break;
            }

            current.connections.forEach(neighbor => {
                if (!visited.has(neighbor) && neighbor.active) { // Only route through active nodes
                    visited.add(neighbor);
                    parents.set(neighbor, current);
                    queue.push(neighbor);
                }
            });
        }

        if (found) {
            // Reconstruct path
            let path = [];
            let curr = target;
            while (curr !== sourceEntity) {
                path.push(curr);
                curr = parents.get(curr);
            }
            path.push(sourceEntity);
            path.reverse();

            this.sim.packets.push(new Packet(sourceEntity, target, path));
        } else {
            console.log("No path to Hub/Target!");
            // Optional: visual feedback for failure
        }
    }
}
