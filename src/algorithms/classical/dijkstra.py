"""
Dijkstra's Algorithm Implementation
Uniform-cost search guaranteeing shortest path.

Dijkstra's algorithm is a special case of A* where the heuristic is always 0.
It explores nodes in order of their distance from the start, guaranteeing
the shortest path in weighted graphs.
"""

import heapq
from typing import List, Tuple, Optional

from ...core import PathfindingAlgorithm, PathfindingResult, AlgorithmCategory, Grid, GridNode


class Dijkstra(PathfindingAlgorithm):
    """
    Dijkstra's algorithm implementation.
    
    Features:
    - Guaranteed shortest path
    - No heuristic required
    - Explores uniformly in all directions
    - Optimal for finding paths to multiple goals
    """
    
    def __init__(self):
        super().__init__("Dijkstra", AlgorithmCategory.CLASSICAL)
    
    def find_path(self, grid: Grid, start: Tuple[int, int], goal: Tuple[int, int]) -> PathfindingResult:
        """
        Find shortest path using Dijkstra's algorithm.
        
        Args:
            grid: Grid to search on
            start: Starting position (x, y)
            goal: Goal position (x, y)
            
        Returns:
            PathfindingResult with shortest path and metrics
        """
        self._start_timing()
        
        error_msg = self.validate_inputs(grid, start, goal)
        if error_msg:
            return self._create_result([], False, error_msg)
        
        grid.reset_pathfinding_data()
        
        start_node = grid.get_node(start[0], start[1])
        goal_node = grid.get_node(goal[0], goal[1])
        
        if not start_node or not goal_node:
            return self._create_result([], False, "Invalid start or goal node")
        
        if start_node == goal_node:
            return self._create_result([start], True)
        
        # Initialize Dijkstra's algorithm
        open_set = []
        visited = set()
        
        # Set up start node
        start_node.g_cost = 0.0
        start_node.f_cost = 0.0  # In Dijkstra, f_cost = g_cost (no heuristic)
        
        heapq.heappush(open_set, (start_node.g_cost, id(start_node), start_node))
        
        # Main Dijkstra loop
        while open_set:
            self._increment_iteration()
            self._update_memory_usage(len(open_set) + len(visited))
            
            # Get node with lowest distance
            current_distance, _, current_node = heapq.heappop(open_set)
            
            # Skip if already visited (can happen with duplicate entries)
            if current_node in visited:
                continue
            
            # Mark as visited
            visited.add(current_node)
            self._expand_node()
            
            # Check if we reached the goal
            if current_node == goal_node:
                path = grid.get_path(current_node)
                result = self._create_result(path, True)
                result.algorithm_data['shortest_distance'] = current_node.g_cost
                return result
            
            # Examine all neighbors
            for neighbor in grid.get_neighbors(current_node):
                self._visit_node()
                
                # Skip if already visited
                if neighbor in visited:
                    continue
                
                # Calculate distance through current node
                distance = current_node.g_cost + grid.get_movement_cost(current_node, neighbor)
                
                # If we found a shorter path to neighbor
                if distance < neighbor.g_cost:
                    neighbor.g_cost = distance
                    neighbor.f_cost = distance
                    neighbor.parent = current_node
                    
                    # Add to priority queue
                    heapq.heappush(open_set, (distance, id(neighbor), neighbor))
        
        # No path found
        return self._create_result([], False, "No path exists")


class UniformCostSearch(Dijkstra):
    """
    Uniform Cost Search - another name for Dijkstra's algorithm.
    
    Emphasizes that this algorithm finds optimal paths in weighted graphs
    by expanding nodes in order of their cost from the start.
    """
    
    def __init__(self):
        super().__init__()
        self.name = "Uniform Cost Search"
    
    def find_path(self, grid: Grid, start: Tuple[int, int], goal: Tuple[int, int]) -> PathfindingResult:
        """Find path using Uniform Cost Search (Dijkstra's algorithm)."""
        result = super().find_path(grid, start, goal)
        
        # Add algorithm-specific information
        result.algorithm_data['search_type'] = 'uniform_cost'
        result.algorithm_data['optimal'] = True
        
        return result


class DijkstraAllPaths(PathfindingAlgorithm):
    """
    Modified Dijkstra that finds shortest paths to all reachable nodes.
    
    Useful for:
    - Precomputing distances to multiple goals
    - Creating distance maps
    - Navigation mesh preprocessing
    """
    
    def __init__(self):
        super().__init__("Dijkstra All Paths", AlgorithmCategory.CLASSICAL)
    
    def find_all_paths(self, grid: Grid, start: Tuple[int, int]) -> dict:
        """
        Find shortest paths from start to all reachable nodes.
        
        Args:
            grid: Grid to search on
            start: Starting position (x, y)
            
        Returns:
            Dictionary mapping positions to (distance, parent) tuples
        """
        self._start_timing()
        
        if not grid.is_valid_position(start[0], start[1]) or not grid.is_walkable(start[0], start[1]):
            return {}
        
        grid.reset_pathfinding_data()
        
        start_node = grid.get_node(start[0], start[1])
        if not start_node:
            return {}
        
        open_set = []
        visited = set()
        distances = {}
        
        # Initialize start node
        start_node.g_cost = 0.0
        heapq.heappush(open_set, (0.0, id(start_node), start_node))
        
        while open_set:
            self._increment_iteration()
            current_distance, _, current_node = heapq.heappop(open_set)
            
            if current_node in visited:
                continue
            
            visited.add(current_node)
            self._expand_node()
            
            # Store the shortest distance to this node
            distances[current_node.position] = (current_node.g_cost, current_node.parent)
            
            # Examine neighbors
            for neighbor in grid.get_neighbors(current_node):
                self._visit_node()
                
                if neighbor in visited:
                    continue
                
                distance = current_node.g_cost + grid.get_movement_cost(current_node, neighbor)
                
                if distance < neighbor.g_cost:
                    neighbor.g_cost = distance
                    neighbor.parent = current_node
                    heapq.heappush(open_set, (distance, id(neighbor), neighbor))
        
        return distances
    
    def find_path(self, grid: Grid, start: Tuple[int, int], goal: Tuple[int, int]) -> PathfindingResult:
        """Find path by computing all paths and extracting the goal path."""
        all_distances = self.find_all_paths(grid, start)
        
        if goal not in all_distances:
            return self._create_result([], False, "Goal not reachable")
        
        # Reconstruct path to goal
        goal_node = grid.get_node(goal[0], goal[1])
        if goal_node:
            path = grid.get_path(goal_node)
            result = self._create_result(path, True)
            result.algorithm_data['total_nodes_reached'] = len(all_distances)
            result.algorithm_data['goal_distance'] = all_distances[goal][0]
            return result
        
        return self._create_result([], False, "Goal node not found")