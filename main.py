import random
from src.simulation import NetworkEnvironment
from src.packet import Packet, PacketType
from src.node import Node
import matplotlib.pyplot as plt

class ScenarioEnvironment(NetworkEnvironment):
    def __init__(self, width=800, height=800, num_nodes=0):
        super().__init__(width, height, num_nodes)
        
        # Manually place nodes for specific "Disaster" scenario
        # Grid-like pattern to show paths clearly
        self.nodes = []
        rows = 4
        cols = 4
        spacing_x = width / (cols + 1)
        spacing_y = height / (rows + 1)
        
        for r in range(rows):
            for c in range(cols):
                nid = f"{r}-{c}"
                x = (c + 1) * spacing_x
                y = (r + 1) * spacing_y
                # Add some randomness to look "natural" but keep topology
                x += random.uniform(-20, 20)
                y += random.uniform(-20, 20)
                
                self.nodes.append(Node(nid, x, y, comm_range=250))
                
        # Define events: (timestamp, function)
        self.events = [
            (1.0, self.send_initial_sos),
            (5.0, self.trigger_failure),
            (8.0, self.send_rescue_msg)
        ]
        self.events.sort(key=lambda x: x[0])
        
    def step(self):
        super().step()
        
        # Check events
        if self.events:
            next_time, event_func = self.events[0]
            if self.time >= next_time:
                event_func()
                self.events.pop(0)
                
    def send_initial_sos(self):
        # Source: Bottom-Left (0-0), Dest: Top-Right (3-3)
        src = self.get_node("0-0")
        if src:
            print(f"\n[EVENT] Time {self.time:.1f}s: 🆘 Sending SOS from {src.id}!")
            pkt = Packet(
                type=PacketType.SOS,
                source_id=src.id,
                dest_id="3-3", # Top-right
                payload="HELP! FLOOD RISING",
                ttl=10
            )
            self.broadcast_packet(pkt, src)
            
    def trigger_failure(self):
        # Fail a critical central node
        failed_id = "1-1"
        print(f"\n[EVENT] Time {self.time:.1f}s: 💥 DISASTER! Node {failed_id} destroyed!")
        self.inject_failure(failed_id)
        
        # Also fail another one to make it harder
        failed_id_2 = "2-2"
        self.inject_failure(failed_id_2)

    def send_rescue_msg(self):
        src = self.get_node("0-0")
        if src:
            print(f"\n[EVENT] Time {self.time:.1f}s: 🔄 Retrying SOS (Self-Healing Check)...")
            pkt = Packet(
                type=PacketType.SOS,
                source_id=src.id,
                dest_id="3-3",
                payload="STILL HERE, NEED RESCUE",
                ttl=15
            )
            self.broadcast_packet(pkt, src)

    def get_node(self, node_id):
        for n in self.nodes:
            if n.id == node_id:
                return n
        return None

if __name__ == "__main__":
    print("Starting IoT Mesh Disaster Simulation...")
    print("Close the window to stop.")
    sim = ScenarioEnvironment()
    sim.run_visual()
