import random
from typing import Dict

class IndoorPositioningService:
    def __init__(self):
        # Mock beacons: {id: {pos: (x, y), level: int}}
        self.beacons = {
            'b1': {'pos': (100, 100), 'level': 0},
            'b2': {'pos': (400, 100), 'level': 0},
            'b3': {'pos': (700, 100), 'level': 0},
            'b4': {'pos': (400, 300), 'level': 1},
        }

    def get_current_position(self, user_id: str) -> Dict:
        """
        Simulate indoor positioning using mock triangulation/beacons
        """
        # Simulated hybrid positioning: WiFi + BLE + dead reckoning
        level = random.choice([0, 1])
        x = random.randint(100, 700)
        y = random.randint(100, 500)
        wifi_error = random.uniform(1.5, 6.0)
        ble_error = random.uniform(0.8, 2.5)
        dead_reckoning_drift = random.uniform(0.4, 1.8)
        accuracy = round((wifi_error * 0.4) + (ble_error * 0.4) + (dead_reckoning_drift * 0.2), 2)
        
        return {
            'user_id': user_id,
            'pos': {'x': x, 'y': y},
            'level': level,
            'accuracy': accuracy,
            'accuracy_radius_m': round(accuracy * 3.5, 1),
            'sources': {
                'wifi_triangulation': {'confidence': 0.76, 'error_m': wifi_error},
                'ble_beacons': {'confidence': 0.88, 'error_m': ble_error},
                'dead_reckoning': {'confidence': 0.69, 'drift_m': dead_reckoning_drift},
            },
            'timestamp': '2026-04-26T12:00:00Z'
        }

    def get_friends_locations(self, user_id: str) -> Dict:
        """
        Mock friend locations
        """
        return [
            {'name': 'Rahul', 'pos': {'x': 200, 'y': 150}, 'level': 0},
            {'name': 'Anjali', 'pos': {'x': 450, 'y': 280}, 'level': 1},
            {'name': 'Vikram', 'pos': {'x': 380, 'y': 120}, 'level': 0},
        ]

positioning_service = IndoorPositioningService()
