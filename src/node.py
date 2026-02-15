from .packet import Packet, PacketType
import math
import time

class Node:
    def __init__(self, node_id, x, y, comm_range=150):
        self.id = node_id
        self.x = x
        self.y = y
        self.comm_range = comm_range
        self.active = True
        
        self.neighbors = {}  # {node_id: last_seen_time}
        self.routing_table = {} # {dest_id: next_hop_id} - Simplified
        self.msg_queue = [] # Store & Forward buffer
        self.seen_packets = set() # Dedup: (packet_id, source_id)
        
        self.HELLO_INTERVAL = 1.0 # seconds
        self.last_hello = 0
        self.NEIGHBOR_TIMEOUT = 3.0
    
    def distance_to(self, other_node):
        return math.sqrt((self.x - other_node.x)**2 + (self.y - other_node.y)**2)
    
    def step(self, current_time):
        """Called every simulation step"""
        if not self.active:
            return []
            
        outgoing_packets = []
        
        # 1. Neighbor Discovery (HELLO)
        if current_time - self.last_hello > self.HELLO_INTERVAL:
            self.last_hello = current_time
            hello_pkt = Packet(
                type=PacketType.HELLO,
                source_id=self.id,
                dest_id="BROADCAST",
                ttl=1
            )
            outgoing_packets.append(hello_pkt)
            
            # Prune old neighbors
            dead_neighbors = [nid for nid, last_seen in self.neighbors.items() 
                              if current_time - last_seen > self.NEIGHBOR_TIMEOUT]
            for dn in dead_neighbors:
                del self.neighbors[dn]
                
        # 2. Process Queue (Store & Forward retry)
        # Simplified: If we have packets and neighbors, try resending one
        if self.msg_queue and self.neighbors:
            # Simple strategy: Try sending oldest packet if we have any neighbor
            # In a real mesh, we'd check if we have a route or just flood
            pkt = self.msg_queue.pop(0) # FIFO
            if pkt.ttl > 0:
                 # Check if we should re-broadcast or unicast
                 outgoing_packets.append(pkt)
            
        return outgoing_packets

    def receive(self, packet: Packet, current_time):
        if not self.active:
            return []
            
        response_packets = []
        
        # 1. Deduplication
        pkt_signature = (packet.packet_id, packet.source_id)
        if pkt_signature in self.seen_packets:
            return []
        self.seen_packets.add(pkt_signature)
        
        # 2. Process HELLO
        if packet.type == PacketType.HELLO:
            self.neighbors[packet.source_id] = current_time
            return [] # Don't forward HELLOs
            
        # 3. Process SOS/DATA
        print(f"Node {self.id} received {packet.type.name} from {packet.source_id}")
        
        # Am I the destination?
        if packet.dest_id == self.id:
            print(f"✅ Node {self.id} DELIVERED packet {packet.packet_id}!")
            # Send ACK (optional, strictly speaking)
            return []
            
        # 4. Forwarding (The "Routing" logic)
        # Using Controlled Flooding/Epidemic for reliability in disaster
        if packet.ttl > 0:
            import copy
            new_pkt = copy.deepcopy(packet)
            new_pkt.ttl -= 1
            new_pkt.path_trace.append(self.id)
            
            response_packets.append(new_pkt)
            
        return response_packets
