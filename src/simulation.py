import random
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from .node import Node
from .packet import Packet
from collections import deque

class NetworkEnvironment:
    def __init__(self, width=1000, height=1000, num_nodes=20):
        self.width = width
        self.height = height
        self.nodes = []
        self.packet_queue = deque()  # (packet, current_node_index_or_object)
        self.time = 0.0
        self.time_step = 0.1  # seconds
        
        # Initialize nodes
        for i in range(num_nodes):
            x = random.uniform(0, width)
            y = random.uniform(0, height)
            node = Node(node_id=str(i), x=x, y=y)
            self.nodes.append(node)
            
    def get_neighbors(self, node):
        """Returns list of nodes within communication range"""
        neighbors = []
        for other in self.nodes:
            if node.id != other.id and other.active:
                if node.distance_to(other) <= node.comm_range:
                    neighbors.append(other)
        return neighbors

    def step(self):
        """Advance simulation by one time step"""
        self.time += self.time_step
        
        # 1. Nodes generate packets (HELLO, etc.)
        for node in self.nodes:
            if node.active:
                new_packets = node.step(self.time) # Returns list of Packets
                for pkt in new_packets:
                    self.broadcast_packet(pkt, node)
                        
        # 2. Process the packet queue
        # For simplicity in this time-step model, we process the current queue fully
        # representing "packets arriving during this step"
        
        current_queue = self.packet_queue
        self.packet_queue = deque() # Clear for next steps
        
        while current_queue:
            pkt, target_node = current_queue.popleft()
            
            if target_node.active:
                response_packets = target_node.receive(pkt, self.time)
                for resp_pkt in response_packets:
                    self.broadcast_packet(resp_pkt, target_node)

    def broadcast_packet(self, packet, source_node):
        neighbors = self.get_neighbors(source_node)
        for neighbor in neighbors:
            self.packet_queue.append((packet, neighbor))
            
    def run_visual(self):
         # Setup Matplotlib
        fig, ax = plt.subplots(figsize=(10, 10))
        ax.set_xlim(0, self.width)
        ax.set_ylim(0, self.height)
        
        # Elements to draw
        link_lines = []
        node_scat = ax.scatter([], [], s=100)
        
        def init():
            return node_scat,
            
        def update(frame):
            self.step()
            
            # Clear previous lines
            # In efficient animation, we'd update line data, but potential links change every frame
            # if nodes move or fail. For N=20, clear/redraw is fine.
            ax.lines.clear()
            
            # Draw Links
            for node in self.nodes:
                if not node.active: continue
                neighbors = self.get_neighbors(node)
                for n in neighbors:
                    # Draw line. To avoid double drawing, checking id might be needed, but minimal overhead here.
                    ax.plot([node.x, n.x], [node.y, n.y], 'g-', alpha=0.1)
            
            # Draw Nodes
            x_data = [n.x for n in self.nodes]
            y_data = [n.y for n in self.nodes]
            colors = ['#00ff00' if n.active else '#ff0000' for n in self.nodes]
            
            node_scat.set_offsets(list(zip(x_data, y_data)))
            node_scat.set_color(colors)
            
            ax.set_title(f"Time: {self.time:.1f}s | Packets in Air: {len(self.packet_queue)}")
            return node_scat,
            
        ani = animation.FuncAnimation(fig, update, init_func=init, frames=500, interval=50, blit=False)
        plt.show()

if __name__ == "__main__":
    sim = NetworkEnvironment()
    sim.run_visual()
