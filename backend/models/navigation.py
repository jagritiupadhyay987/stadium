import heapq
import math
import random
from typing import List, Dict, Tuple, Optional

class NavigationGraph:
    def __init__(self):
        # nodes: {node_id: {type: 'gate'|'stair'|'stand'|'food'|'restroom', name: str, level: int, pos: (x, y)}}
        self.nodes = {}
        # edges: {node_id: {neighbor_id: {weight: float, accessibility: bool}}}
        self.edges = {}

    def add_node(self, node_id: str, node_type: str, name: str, level: int, x: float, y: float):
        self.nodes[node_id] = {
            'type': node_type,
            'name': name,
            'level': level,
            'pos': (x, y)
        }
        if node_id not in self.edges:
            self.edges[node_id] = {}

    def add_edge(self, u: str, v: str, weight: float, accessibility: bool = True):
        if u not in self.edges: self.edges[u] = {}
        if v not in self.edges: self.edges[v] = {}
        self.edges[u][v] = {'weight': weight, 'accessibility': accessibility}
        self.edges[v][u] = {'weight': weight, 'accessibility': accessibility}

    def _heuristic(self, node_a: str, node_b: str) -> float:
        ax, ay = self.nodes[node_a]['pos']
        bx, by = self.nodes[node_b]['pos']
        return math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)

    def find_path(self, start_id: str, end_id: str, accessible_only: bool = False) -> Optional[List[str]]:
        if start_id not in self.nodes or end_id not in self.nodes:
            return None

        queue = [(0, 0, start_id, [])]
        visited = set()
        min_dist = {start_id: 0}

        while queue:
            (priority, dist, current, path) = heapq.heappop(queue)

            if current in visited:
                continue
            
            visited.add(current)
            path = path + [current]

            if current == end_id:
                return path

            for neighbor, info in self.edges.get(current, {}).items():
                if accessible_only and not info['accessibility']:
                    continue

                crowd_multiplier = info.get('crowd', 1.0)
                comfort_penalty = 1.2 if accessible_only and not info.get('accessibility', True) else 1.0
                new_dist = dist + (info['weight'] * crowd_multiplier * comfort_penalty)
                if neighbor not in min_dist or new_dist < min_dist[neighbor]:
                    min_dist[neighbor] = new_dist
                    heuristic = self._heuristic(neighbor, end_id)
                    heapq.heappush(queue, (new_dist + heuristic, new_dist, neighbor, path))

        return None

    def update_crowd_density(self):
        for source, neighbors in self.edges.items():
            for target in neighbors.keys():
                self.edges[source][target]['crowd'] = round(random.uniform(0.9, 1.6), 2)

    def path_details(self, start_id: str, end_id: str, accessible_only: bool = False) -> Optional[Dict]:
        self.update_crowd_density()
        node_path = self.find_path(start_id, end_id, accessible_only=accessible_only)
        if not node_path:
            return None
        points = [self.nodes[node_id] for node_id in node_path]
        total_weight = 0.0
        for index in range(len(node_path) - 1):
            edge = self.edges[node_path[index]][node_path[index + 1]]
            total_weight += edge['weight'] * edge.get('crowd', 1.0)
        return {
            "nodes": [
                {
                    "id": node_id,
                    "name": self.nodes[node_id]["name"],
                    "type": self.nodes[node_id]["type"],
                    "level": self.nodes[node_id]["level"],
                    "pos": {"x": self.nodes[node_id]["pos"][0], "y": self.nodes[node_id]["pos"][1]},
                }
                for node_id in node_path
            ],
            "distance_m": int(total_weight),
            "eta_min": max(1, int(total_weight / 70)),
            "accessible_route": accessible_only,
        }

# Pre-populate some nodes for ACA-VDCA Vizag (Default Stadium)
stadium_nav = NavigationGraph()

# Level 0 (Ground)
stadium_nav.add_node('gate1', 'gate', 'Gate 1', 0, 100, 100)
stadium_nav.add_node('gate2', 'gate', 'Gate 2', 0, 700, 100)
stadium_nav.add_node('stair_a_l0', 'stair', 'Stairs Block A (L0)', 0, 400, 200)
stadium_nav.add_node('food_l0', 'food', 'Food Court (L0)', 0, 400, 100)

# Level 1 (Concourse)
stadium_nav.add_node('stair_a_l1', 'stair', 'Stairs Block A (L1)', 1, 400, 200)
stadium_nav.add_node('stand_north_l1', 'stand', 'North Stand (L1)', 1, 400, 300)
stadium_nav.add_node('restroom_l1', 'restroom', 'Restroom (L1)', 1, 300, 250)

# Connect levels
stadium_nav.add_edge('stair_a_l0', 'stair_a_l1', 10, False) # Stairs are not accessible
stadium_nav.add_node('elevator_a_l0', 'stair', 'Elevator Block A (L0)', 0, 410, 200)
stadium_nav.add_node('elevator_a_l1', 'stair', 'Elevator Block A (L1)', 1, 410, 200)
stadium_nav.add_edge('elevator_a_l0', 'elevator_a_l1', 5, True) # Elevators are accessible

# Ground connections
stadium_nav.add_edge('gate1', 'food_l0', 50)
stadium_nav.add_edge('food_l0', 'stair_a_l0', 30)
stadium_nav.add_edge('food_l0', 'elevator_a_l0', 35)

# Concourse connections
stadium_nav.add_edge('stair_a_l1', 'stand_north_l1', 20)
stadium_nav.add_edge('elevator_a_l1', 'stand_north_l1', 15)
stadium_nav.add_edge('stand_north_l1', 'restroom_l1', 25)
