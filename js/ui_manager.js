class UIManager {
    constructor(simulation, renderer, interactionHandler) {
        this.sim = simulation;
        this.renderer = renderer;
        this.interaction = interactionHandler;
        this.selectedEntity = null;

        // Elements from DOM
        this.panel = document.getElementById('controls-panel');
        // We will inject controls if they don't exist, or expect HTML to have them

        // Initialize Interaction Listener
        // We need a way to know when selection changes. 
        // Simplest: Polling in update loop or Callback.

        this.initUI();
    }



    initUI() {
        // Selection Controls
        this.nameEl = document.getElementById('sel-name');
        this.typeEl = document.getElementById('sel-type');
        this.statusEl = document.getElementById('sel-status');
        this.toggleBtn = document.getElementById('btn-toggle');
        this.sendBtn = document.getElementById('btn-send');

        // Global Controls
        this.pauseBtn = document.getElementById('btn-pause');
        this.resetBtn = document.getElementById('btn-reset');

        // Parameters - Sliders & Inputs
        this.paramNodes = document.getElementById('param-nodes');
        this.inputNodes = document.getElementById('input-nodes');

        this.paramMobiles = document.getElementById('param-mobiles');
        this.inputMobiles = document.getElementById('input-mobiles');

        this.paramRange = document.getElementById('param-range');
        this.valRangeKm = document.getElementById('val-range-km');

        // --- Event Listeners ---

        // Pause
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => {
                const isPaused = this.sim.togglePause();
                this.pauseBtn.textContent = isPaused ? "Resume" : "Pause";
                this.pauseBtn.classList.toggle('btn-outline', !isPaused);
                this.pauseBtn.classList.toggle('btn-warning', isPaused);
            });
        }

        // Reset
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                const nodes = parseInt(this.inputNodes.value); // Use Input value
                const mobiles = parseInt(this.inputMobiles.value); // Use Input value
                this.sim.reset(nodes, mobiles);

                // Clear selection
                this.selectedEntity = null;
                this.interaction.selectedEntity = null;
                this.updateInfo();
            });
        }

        // Sync Nodes Input <-> Slider
        this.syncInputs(this.paramNodes, this.inputNodes);

        // Sync Mobiles Input <-> Slider
        this.syncInputs(this.paramMobiles, this.inputMobiles);

        // Range Slider
        if (this.paramRange) {
            this.paramRange.addEventListener('input', (e) => {
                const px = parseInt(e.target.value);
                const km = (px / 20).toFixed(1); // 20px = 1km
                this.valRangeKm.textContent = `${km} km`;
                this.sim.setRange(px);
            });
            // Init Label
            const initialPx = parseInt(this.paramRange.value);
            this.valRangeKm.textContent = `${(initialPx / 20).toFixed(1)} km`;
        }

        // Manual Add
        this.btnAddNode = document.getElementById('btn-add-node');
        this.btnAddMobile = document.getElementById('btn-add-mobile');

        if (this.btnAddNode) {
            this.btnAddNode.addEventListener('click', () => {
                const n = this.sim.addEntity('NODE');
                // Update input count visual
                if (n && this.inputNodes) {
                    this.inputNodes.value = parseInt(this.inputNodes.value) + 1;
                    this.paramNodes.value = this.inputNodes.value;
                }
            });
        }

        if (this.btnAddMobile) {
            this.btnAddMobile.addEventListener('click', () => {
                const m = this.sim.addEntity('MOBILE');
                if (m && this.inputMobiles) {
                    this.inputMobiles.value = parseInt(this.inputMobiles.value) + 1;
                    this.paramMobiles.value = this.inputMobiles.value;
                }
            });
        }

        if (this.btnAddMobile) {
            this.btnAddMobile.addEventListener('click', () => {
                const m = this.sim.addEntity('MOBILE');
                if (m && this.inputMobiles) {
                    this.inputMobiles.value = parseInt(this.inputMobiles.value) + 1;
                    this.paramMobiles.value = this.inputMobiles.value;
                }
            });
        }

        // View Controls
        this.btnResetView = document.getElementById('btn-reset-view');
        if (this.btnResetView) {
            this.btnResetView.addEventListener('click', () => {
                if (this.renderer) {
                    this.renderer.zoom = 1;
                    this.renderer.panX = 0;
                    this.renderer.panY = 0;
                }
            });
        }

        // Selection Actions
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => {
                if (this.selectedEntity) {
                    this.selectedEntity.active = !this.selectedEntity.active;
                    this.updateInfo();
                }
            });
        }

        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => {
                if (this.selectedEntity && this.selectedEntity.active) {
                    this.interaction.triggerPacket(this.selectedEntity);
                }
            });
        }
    }

    syncInputs(slider, numberInput) {
        if (!slider || !numberInput) return;

        slider.addEventListener('input', () => {
            numberInput.value = slider.value;
        });

        numberInput.addEventListener('input', () => {
            slider.value = numberInput.value;
        });
    }

    update() {
        // Poll for selection change from interaction handler
        if (this.interaction.selectedEntity !== this.selectedEntity) {
            this.selectedEntity = this.interaction.selectedEntity;
            this.updateInfo();
        }
    }

    updateInfo() {
        if (!this.selectedEntity) {
            // Hide specific controls or show "Select an object"
            this.nameEl.textContent = "-";
            this.typeEl.textContent = "-";
            this.statusEl.textContent = "-";
            return;
        }

        this.nameEl.textContent = this.selectedEntity.id;
        this.typeEl.textContent = this.selectedEntity.type;
        this.statusEl.textContent = this.selectedEntity.active ? "ACTIVE" : "OFFLINE";
        this.statusEl.style.color = this.selectedEntity.active ? "#4ade80" : "#f87171";

        this.toggleBtn.textContent = this.selectedEntity.active ? "Turn OFF" : "Turn ON";
    }
}
