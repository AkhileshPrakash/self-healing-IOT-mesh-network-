# Self-Healing IoT Mesh Network Simulation

![Network Simulation](website/images/preview.png)

A comprehensive simulation of a decentralized, self-healing IoT mesh network. This project visualizes how independent nodes can communicate, discover routes, and maintain connectivity even when individual nodes fail or move.

## 🚀 Features

### Core Simulation
- **Self-Healing Connectivity**: Nodes automatically reroute messages when a path is broken.
- **Dynamic Topology**: Simulates mobile nodes moving through a field of static sensor nodes.
- **Packet "Store & Forward"**: Messages are buffered if no immediate route is available and forwarded when a connection is established.
- **Visual Feedback**: Real-time visualization of packet transmission, signal range, and node states.

### Interactive Web Interface
- **Real-Time Control**: Pause, resume, and reset the simulation.
- **Drag & Drop**: Manually move nodes to test network resilience.
- **Zoom & Pan**: Inspect large networks with intuitive mouse controls.
- **Customizable Parameters**: Adjust communication range and speed on the fly.

## 🛠️ Technology Stack

- **Frontend**: HTML5 Canvas, Vanilla JavaScript (ES6+), CSS3
- **Backend Simulation**: Python (NetworkX, Matplotlib for optional backend analysis)

## 📦 Installation & Usage

### Web Simulation (Recommended)
1.  **Online Demo**: [View Live Simulation](https://akhileshprakash.github.io/self-healing-IOT-mesh-network-/)
2.  **Local**:
    -   Open `docs/index.html` in your web browser.

### Python Simulation
1.  Ensure you have Python 3.8+ installed.
2.  Install dependencies:
    ```bash
    pip install networkx matplotlib
    ```
3.  Run the main script:
    ```bash
    python main.py
    ```

## 🌐 Hosting

This project is configured for **GitHub Pages**.

1.  Go to your repository **Settings**.
2.  Navigate to **Pages** (sidebar).
3.  Under **Build and deployment** > **Source**, select **Deploy from a branch**.
4.  Under **Branch**, select `main` and folder `/docs`.
5.  Click **Save**.

Your site will be live at `https://<username>.github.io/self-healing-IOT-mesh-network-/`.

## 🎮 How to Use

1.  **Launch**: Open the web interface.
2.  **Interact**:
    -   **Drag**: Click and drag any node to move it.
    -   **Zoom/Pan**: Use the mouse wheel to zoom, right-click and drag to pan.
    -   **Add Nodes**: Use the "Add Node" buttons to expand the network.
3.  **Observe**: Watch as "Mobile" nodes (blue) traverse the map, connecting to static "Sensor" nodes (cyan) to relay data back to the central "Hub" (purple).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

Akhilesh Prakash - [GitHub](https://github.com/AkhileshPrakash)
