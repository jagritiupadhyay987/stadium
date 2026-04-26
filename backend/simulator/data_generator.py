import random
from typing import Dict, List, Optional

class StadiumSimulator:
    def __init__(self, stadium_data: Dict, stadium_id: Optional[str] = None):
        self.stadium_data = stadium_data
        self.stadium_id = stadium_id or stadium_data.get('id', 'unknown')
        self.capacity = stadium_data.get('capacity', 20000)
        self.name = stadium_data.get('name', 'Unknown Stadium')
        self.floodlights = stadium_data.get('floodlights', True)
        
    def generate_zone_data(self, match_type: str = "T20", time_of_day: str = "evening", stadium_id: Optional[str] = None) -> List[Dict]:
        """
        Generates simulated zone data based on stadium capacity and match type.
        Match types: Test, ODI, T20
        """
        # Scale factor based on match type (T20 usually higher density)
        selected_id = stadium_id or self.stadium_id
        match_factors = {
            "Test": 0.4,
            "ODI": 0.7,
            "T20": 0.95
        }
        base_density = match_factors.get(match_type, 0.8)

        # Scale demand curve by stadium tier (mega venues behave differently)
        if self.capacity >= 80000:
            base_density *= 0.88
        elif self.capacity >= 40000:
            base_density *= 0.96
        else:
            base_density *= 1.04
        
        # Adjust density for time of day (floodlights impact)
        if time_of_day == "evening" and not self.floodlights:
            base_density *= 0.5 # Less attendance if no floodlights at night
        elif time_of_day == "night" and self.floodlights:
            base_density *= 1.08
        elif time_of_day == "day":
            base_density *= 0.94
            
        zones = []
        
        # Simulate Gates
        num_gates = max(4, self.capacity // 10000)
        for i in range(1, num_gates + 1):
            gate_capacity = max(1000, self.capacity // (num_gates * 2))
            # Entry/Exit patterns: Gates are busier at start/end
            current = int(gate_capacity * base_density * random.uniform(0.4, 1.1))
            density = round(current / gate_capacity, 2)
            status = "GREEN" if density < 0.7 else "YELLOW" if density < 0.9 else "RED"
            
            zones.append({
                "id": f"gate_{i}",
                "name": f"Gate {i}",
                "type": "GATE",
                "capacity": gate_capacity,
                "currentAttendance": min(current, gate_capacity),
                "density": min(density, 1.0),
                "waitTimeMin": int(density * 15 * random.uniform(0.8, 1.2)),
                "status": status
            })
            
        # Simulate Stands
        num_stands = max(4, self.capacity // 8000)
        for i in range(1, num_stands + 1):
            stand_capacity = self.capacity // num_stands
            current = int(stand_capacity * base_density * random.uniform(0.75, 1.0))
            density = round(current / stand_capacity, 2)
            status = "GREEN" if density < 0.7 else "YELLOW" if density < 0.9 else "RED"
            
            zones.append({
                "id": f"stand_{chr(64+i)}",
                "name": f"Stand {chr(64+i)}",
                "type": "STAND",
                "capacity": stand_capacity,
                "currentAttendance": min(current, stand_capacity),
                "density": min(density, 1.0),
                "status": status
            })
            
        # Simulate F&B Courts
        num_fb = max(2, self.capacity // 15000)
        for i in range(1, num_fb + 1):
            fb_capacity = 500 + (self.capacity // 100)
            current = int(fb_capacity * base_density * random.uniform(0.3, 0.95))
            density = round(current / fb_capacity, 2)
            status = "GREEN" if density < 0.7 else "YELLOW" if density < 0.9 else "RED"
            
            zones.append({
                "id": f"fb_{i}",
                "name": f"Food Court {i}",
                "type": "FB_COURT",
                "capacity": fb_capacity,
                "currentAttendance": min(current, fb_capacity),
                "density": min(density, 1.0),
                "waitTimeMin": int(density * 12 * random.uniform(0.5, 1.5)),
                "status": status
            })
            
        # Ensure stable ordering and slight stadium-specific variation
        random.Random(hash(selected_id) % 97).shuffle(zones)
        return zones

    def get_match_schedule(self, stadium_id: Optional[str] = None) -> List[Dict]:
        """Returns a stadium-specific match schedule profile."""
        sid = stadium_id or self.stadium_id
        base_types = ["T20", "ODI", "Test"] if self.capacity > 35000 else ["ODI", "T20", "Test"]
        slots = [
            ("09:30", "day"),
            ("14:00", "day"),
            ("19:30", "night" if self.floodlights else "evening"),
        ]
        schedule: List[Dict] = []
        for index, (time_slot, phase) in enumerate(slots, start=1):
            match_type = base_types[(index - 1) % len(base_types)]
            schedule.append({
                "match_id": f"match_{sid}_{index}",
                "teams": "Home Giants vs Visiting Titans" if index == 1 else "State A vs State B",
                "type": match_type,
                "time": time_slot,
                "status": "LIVE" if index == 1 and random.random() > 0.4 else "SCHEDULED",
                "floodlights": self.floodlights,
                "time_of_day": phase,
            })
        return schedule
