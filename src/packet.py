import uuid
import time
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Optional

class PacketType(Enum):
    HELLO = 1
    DATA = 2
    ACK = 3
    SENSING = 4
    SOS = 5

@dataclass
class Packet:
    packet_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    type: PacketType = PacketType.DATA
    source_id: str = ""
    dest_id: str = "BROADCAST"  # "BROADCAST" or specific Node ID
    ttl: int = 10
    payload: str = ""
    timestamp: float = field(default_factory=time.time)
    path_trace: List[str] = field(default_factory=list)
    
    def __repr__(self):
        return f"<Packet {self.packet_id} ({self.type.name}) Src:{self.source_id} -> Dst:{self.dest_id} TTL:{self.ttl}>"
