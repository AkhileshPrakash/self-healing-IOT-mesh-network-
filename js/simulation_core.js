class SimulationCore {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.entities = [];
        this.hub = null;
        this.packets = [];

        this.setupInitialState();
        this.paused = false;
    }

    togglePause() {
        this.paused = !this.paused;
        return this.paused;
    }

    setRange(val) {
        this.entities.forEach(e => {
            if (e.type !== 'HUB') {
                e.RANGE = val;
            }
        });
        // Also update prototype or default for new entities if needed, 
        // but for now we just update existing. 
        // Actually, let's store it to apply on reset too?
        this.currentRange = val;
    }

    addEntity(type) {
        // Constructive Placement for ADDED entities too
        let placed = false;
        let attempts = 0;
        let newEntity = null;

        let connectedNodes = this.entities.filter(e => e.type === 'HUB' || e.type === 'NODE');
        if (connectedNodes.length === 0 && this.hub) connectedNodes = [this.hub];

        while (!placed && attempts < 100) {
            attempts++;
            let x, y;

            if (type === 'MOBILE') {
                // Random position
                x = Math.random() * (this.width - 100) + 50;
                y = Math.random() * (this.height - 100) + 50;

                const count = this.entities.filter(e => e.type === 'MOBILE').length;
                newEntity = new Mobile(`M${count + 1 + Math.floor(Math.random() * 100)}`, x, y);
                if (this.currentRange) newEntity.RANGE = this.currentRange; // Apply range to new mobile too
                this.entities.push(newEntity);
                placed = true;
            } else { // type === 'NODE'
                // Node: Constructive Placement
                let valid = false;

                // Try 10 times to find a position with good separation
                for (let t = 0; t < 10; t++) {
                    const target = connectedNodes[Math.floor(Math.random() * connectedNodes.length)];
                    const range = this.currentRange || 180;

                    // User wants them spread out. 
                    // Place between 0.5 * Range and 1.0 * Range
                    const dist = (range * 0.5) + Math.random() * (range * 0.5);
                    const angle = Math.random() * Math.PI * 2;

                    x = target.x + Math.cos(angle) * dist;
                    y = target.y + Math.sin(angle) * dist;

                    // Bounds
                    if (x < 50 || x > this.width - 50 || y < 50 || y > this.height - 50) continue;

                    // Check distance to ALL other nodes
                    let tooClose = false;

                    // Relax separation as attempts increase to ensure placement
                    let separationFactor = 0.5;
                    if (attempts > 10) separationFactor = 0.3;
                    if (attempts > 30) separationFactor = 0.1;
                    if (attempts > 50) separationFactor = 0.0; // Just allow if valid bounds

                    const minSeparation = range * separationFactor;

                    for (let e of this.entities) {
                        // Only check against other Nodes/Hub for separation
                        if (e.type !== 'MOBILE') {
                            const d = Math.sqrt((e.x - x) ** 2 + (e.y - y) ** 2);
                            if (d < minSeparation) {
                                tooClose = true;
                                break;
                            }
                        }
                    }

                    if (!tooClose) {
                        valid = true;
                        break;
                    }
                }

                if (valid) {
                    // ID generation needs to be robust. 
                    // Let's count existing nodes
                    const count = this.entities.filter(e => e.type === 'NODE').length;
                    newEntity = new Node(`N${count + 1 + Math.floor(Math.random() * 100)}`, x, y); // Random suffix to avoid id collision on manual add
                    if (this.currentRange) newEntity.RANGE = this.currentRange;
                    this.entities.push(newEntity);
                    placed = true;
                }
            }
        }
        return newEntity;
    }

    reset(nodeCount, mobileCount) {
        // Clear existing
        this.entities = [];
        this.packets = [];
        this.hub = null;

        // Re-init with specific counts
        this.hub = new Hub(this.width / 2, this.height / 2);
        this.entities.push(this.hub);

        // Nodes
        for (let i = 0; i < nodeCount; i++) {
            this.addEntity('NODE');
            // Note: addEntity uses current entities to find helpers, so it works iteratively
        }

        // Mobiles
        for (let i = 0; i < mobileCount; i++) {
            this.addEntity('MOBILE');
        }
    }

    setupInitialState() {
        // 1 Hub
        this.hub = new Hub(this.width / 2, this.height / 2);
        this.entities.push(this.hub);

        // 8 Nodes logic
        for (let i = 0; i < 8; i++) {
            let x = Math.random() * (this.width - 100) + 50;
            let y = Math.random() * (this.height - 100) + 50;
            if (Math.abs(x - this.hub.x) < 50) x += 100; // avoid overlap
            this.entities.push(new Node(`N${i}`, x, y));
        }

        // 5 Mobiles
        for (let i = 0; i < 5; i++) {
            let x = Math.random() * (this.width - 100) + 50;
            let y = Math.random() * (this.height - 100) + 50;
            this.entities.push(new Mobile(`M${i}`, x, y));
        }
    }

    update() {
        // 1. Update Positions (only if not paused)
        if (!this.paused) {
            this.entities.forEach(e => e.update(this.width, this.height));
        }

        // 2. Update Connections
        this.updateConnections();

        // 3. Update Packets (always update? or pause too? Let's pause packets too)
        if (!this.paused) {
            this.packets = this.packets.filter(p => p.active);
            this.packets.forEach(p => p.update());
        }
    }

    updateConnections() {
        // Reset connections
        this.entities.forEach(e => e.connections = []);

        // Logic:
        // Hub checks Nodes.
        // Nodes check Hub + Nodes.
        // Mobiles check Nodes.

        const nodes = this.entities.filter(e => e.type === 'NODE');
        const mobiles = this.entities.filter(e => e.type === 'MOBILE');

        // 1. Connect Nodes <-> Hub
        nodes.forEach(node => {
            if (node.distanceTo(this.hub) <= node.RANGE) {
                node.connections.push(this.hub);
                this.hub.connections.push(node);
            }
        });

        // 2. Connect Nodes <-> Nodes
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                let n1 = nodes[i];
                let n2 = nodes[j];
                if (n1.distanceTo(n2) <= n1.RANGE) {
                    // Limit connections? Visual rule says 3-4, but let's allow range limit first
                    n1.connections.push(n2);
                    n2.connections.push(n1);
                }
            }
        }

        // 3. Connect Mobiles <-> Nodes
        mobiles.forEach(mob => {
            // Connect to nearest nodeS (plural) or just one? Prompt said "nearest Node".
            // Let's connect to all in range for visual effect, but route via best.
            nodes.forEach(n => {
                if (mob.distanceTo(n) <= mob.RANGE) {
                    mob.connections.push(n);
                    // Mobile is client, node doesn't necessarily track it as a peer link for routing
                }
            });
        });
    }

    sendPacketFromStats(mobileEntity) {
        if (!mobileEntity || mobileEntity.type !== 'MOBILE') return;

        // Pathfinding: Mobile -> Node -> ... -> Hub
        // 1. Find connected nodes
        let entryNodes = mobileEntity.connections.filter(c => c.type === 'NODE');
        if (entryNodes.length === 0) return; // No signal

        // 2. BFS to find Hub
        // Simple BFS for shortest path
        let queue = [];
        let visited = new Set();
        let parents = new Map(); // child -> parent

        // Add all entry nodes to queue
        entryNodes.forEach(n => {
            queue.push(n);
            visited.add(n);
            parents.set(n, mobileEntity);
        });

        let found = false;
        let finalNode = null;

        while (queue.length > 0) {
            let current = queue.shift();

            if (current.type === 'HUB') {
                found = true;
                finalNode = current;
                break;
            }

            // Neighbors
            current.connections.forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    // Start of BFS: Mobile -> Node. 
                    // Mobiles don't forward. Nodes only forward to Hub or other Nodes.
                    if (neighbor.type !== 'MOBILE') {
                        visited.add(neighbor);
                        parents.set(neighbor, current);
                        queue.push(neighbor);
                    }
                }
            });
        }

        if (found) {
            // Reconstruct path
            let path = [];
            let curr = finalNode;
            while (curr) {
                path.push(curr);
                curr = parents.get(curr);
            }
            path.reverse(); // Now: Mobile -> Node -> ... -> Hub

            // Create animation packet
            this.packets.push(new Packet(mobileEntity.hub, this.hub, path));
        }
    }
}
