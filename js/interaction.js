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
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Disable context menu
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Transform to World Coordinates
        // world = (screen - pan) / zoom
        return {
            x: (screenX - this.renderer.panX) / this.renderer.zoom,
            y: (screenY - this.renderer.panY) / this.renderer.zoom,
            screenX: screenX,
            screenY: screenY
        };
    }

    onWheel(e) {
        e.preventDefault();
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoomFactor = Math.exp(wheel * zoomIntensity);

        // Zoom towards mouse pointer
        const pos = this.getMousePos(e);
        const wx = pos.x; // World X before zoom
        const wy = pos.y; // World Y before zoom

        const newZoom = this.renderer.zoom * zoomFactor;

        // Clamping zoom
        if (newZoom < 0.1 || newZoom > 5) return;

        this.renderer.zoom = newZoom;

        // Adjust Pan to keep world point under mouse stable
        // screen = world * newZoom + newPan
        // newPan = screen - world * newZoom
        this.renderer.panX = pos.screenX - wx * newZoom;
        this.renderer.panY = pos.screenY - wy * newZoom;
    }

    onMouseDown(e) {
        e.preventDefault();
        const pos = this.getMousePos(e); // World pos

        // Right Click (button 2) -> Pan
        if (e.button === 2) {
            this.isPanning = true;
            this.lastMouseX = pos.screenX;
            this.lastMouseY = pos.screenY;
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        // Left Click -> Select/Drag Entity
        let clicked = null;

        // Find clicked entity (reverse order to find top-most)
        for (let i = this.sim.entities.length - 1; i >= 0; i--) {
            const entity = this.sim.entities[i];
            const dist = Math.sqrt((pos.x - entity.x) ** 2 + (pos.y - entity.y) ** 2);
            if (dist < entity.radius / this.renderer.zoom + 5) { // Hitbox check in world space
                // simple dist check is fine as pos.x/y are world coords
                if (dist < entity.radius) {
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
        }
    }

    onMouseMove(e) {
        // Panning
        if (this.isPanning) {
            const currentX = e.clientX; // We can use raw client or relative screen
            // actually getMousePos gives screenX relative to canvas
            const pos = this.getMousePos(e);
            const dx = pos.screenX - this.lastMouseX;
            const dy = pos.screenY - this.lastMouseY;

            this.renderer.panX += dx;
            this.renderer.panY += dy;

            this.lastMouseX = pos.screenX;
            this.lastMouseY = pos.screenY;
            return;
        }

        // Dragging Entity
        if (this.draggedEntity) {
            const pos = this.getMousePos(e); // World coords
            // No strict bounds check on drag needed, or check against sim width/height
            // Let's keep bounds logic but in world coords
            this.draggedEntity.x = Math.max(this.draggedEntity.radius, Math.min(this.sim.width - this.draggedEntity.radius, pos.x));
            this.draggedEntity.y = Math.max(this.draggedEntity.radius, Math.min(this.sim.height - this.draggedEntity.radius, pos.y));
        } else {
            // Hover
            const pos = this.getMousePos(e);
            let hovering = false;
            for (let entity of this.sim.entities) {
                const dist = Math.sqrt((pos.x - entity.x) ** 2 + (pos.y - entity.y) ** 2);
                if (dist < entity.radius) {
                    hovering = true;
                    break;
                }
            }
            this.canvas.style.cursor = hovering ? 'pointer' : 'default';
        }
    }

    onMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = 'default';
        }
        if (this.draggedEntity) {
            this.draggedEntity.isDragging = false;
            this.draggedEntity = null;
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

            // Neighbors
            // We need to use the computed connections from SIM core
            // But simulation updates connections every frame.

            // Note: SimulationCore.updateConnections() populates .connections array
            // We use that graph.

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
