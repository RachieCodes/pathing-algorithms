"""
A* Algorithm Implementation
Best-first search using heuristics for optimal pathfinding.

A* is guaranteed to find the shortest path if the heuristic is admissible
(never overestimates the true cost). It uses f(n) = g(n) + h(n) where:
- g(n): cost from start to current node
- h(n): heuristic estimate from current node to goal
"""

import heapq
from typing import List, Tuple, Optional

from ...core import PathfindingAlgorithm, PathfindingResult, AlgorithmCategory, Grid, GridNode


class AStar(PathfindingAlgorithm):
    """
    A* pathfinding algorithm implementation.
    
    Features:
    - Optimal pathfinding with admissible heuristic
    - Configurable heuristic functions
    - Performance tracking and metrics
    """
    
    def __init__(self, heuristic_type: str = "euclidean", heuristic_weight: float = 1.0):
        super().__init__("A*", AlgorithmCategory.CLASSICAL)
        self.heuristic_type = heuristic_type
        self.heuristic_weight = heuristic_weight
    
    def find_path(self, grid: Grid, start: Tuple[int, int], goal: Tuple[int, int]) -> PathfindingResult:
        """
        Find optimal path using A* algorithm.
        
        Args:
            grid: Grid to search on
            start: Starting position (x, y)
            goal: Goal position (x, y)
            
        Returns:
            PathfindingResult with path and performance metrics
        """
        # Start timing and validation
        self._start_timing()
        
        error_msg = self.validate_inputs(grid, start, goal)
        if error_msg:
            return self._create_result([], False, error_msg)
        
        # Reset grid pathfinding data
        grid.reset_pathfinding_data()
        
        # Get start and goal nodes
        start_node = grid.get_node(start[0], start[1])
        goal_node = grid.get_node(goal[0], goal[1])
        
        if not start_node or not goal_node:
            return self._create_result([], False, "Invalid start or goal node")
        
        # Check if start equals goal
        if start_node == goal_node:
            return self._create_result([start], True)
        
        # Initialize pathfinding
        open_set = []
        closed_set = set()
        
        # Set up start node
        start_node.g_cost = 0.0
        start_node.h_cost = self.get_heuristic(start_node, goal_node, self.heuristic_type)
        start_node.f_cost = start_node.g_cost + self.heuristic_weight * start_node.h_cost
        start_node.in_open_set = True
        
        heapq.heappush(open_set, (start_node.f_cost, id(start_node), start_node))
        
        # Main A* loop
        while open_set:
            self._increment_iteration()
            self._update_memory_usage(len(open_set) + len(closed_set))
            
            # Get node with lowest f_cost
            _, _, current_node = heapq.heappop(open_set)
            current_node.in_open_set = False
            
            # Check if we reached the goal
            if current_node == goal_node:
                path = grid.get_path(current_node)
                return self._create_result(path, True)
            
            # Move current node to closed set
            closed_set.add(current_node)
            self._expand_node()
            
            # Examine neighbors
            for neighbor in grid.get_neighbors(current_node):
                self._visit_node()
                
                # Skip if already evaluated
                if neighbor in closed_set:
                    continue
                
                # Calculate tentative g_cost
                tentative_g = current_node.g_cost + grid.get_movement_cost(current_node, neighbor)
                
                # Check if this path is better
                is_better_path = False
                
                if not neighbor.in_open_set:
                    # New node
                    neighbor.h_cost = self.get_heuristic(neighbor, goal_node, self.heuristic_type)
                    neighbor.in_open_set = True
                    is_better_path = True
                elif tentative_g < neighbor.g_cost:
                    # Better path to existing node
                    is_better_path = True
                
                if is_better_path:
                    neighbor.parent = current_node
                    neighbor.g_cost = tentative_g
                    neighbor.f_cost = neighbor.g_cost + self.heuristic_weight * neighbor.h_cost
                    
                    # Add to open set
                    heapq.heappush(open_set, (neighbor.f_cost, id(neighbor), neighbor))
        
        # No path found
        return self._create_result([], False, "No path exists")


class WeightedAStar(AStar):
    """
    Weighted A* algorithm - faster but suboptimal variant of A*.
    
    Uses inflated heuristic (weight > 1) to find paths faster at the cost
    of optimality. The solution is bounded by the weight factor.
    """
    
    def __init__(self, heuristic_type: str = "euclidean", heuristic_weight: float = 1.5):
        super().__init__(heuristic_type, heuristic_weight)
        self.name = f"Weighted A* (w={heuristic_weight})"
        
        if heuristic_weight < 1.0:
            self.heuristic_weight = 1.0  # Ensure weight is at least 1
    
    def find_path(self, grid: Grid, start: Tuple[int, int], goal: Tuple[int, int]) -> PathfindingResult:
        """Find path using Weighted A* with inflated heuristic."""
        result = super().find_path(grid, start, goal)
        
        # Add algorithm-specific data
        result.algorithm_data['heuristic_weight'] = self.heuristic_weight
        result.algorithm_data['optimality_bound'] = self.heuristic_weight
        
        return result


class BidirectionalAStar(PathfindingAlgorithm):
    """
    Bidirectional A* algorithm.
    
    Runs two simultaneous A* searches from start and goal,
    potentially reducing the search space significantly.
    """
    
    def __init__(self, heuristic_type: str = "euclidean"):
        super().__init__("Bidirectional A*", AlgorithmCategory.CLASSICAL)
        self.heuristic_type = heuristic_type
    
    def find_path(self, grid: Grid, start: Tuple[int, int], goal: Tuple[int, int]) -> PathfindingResult:
        """Find path using bidirectional A* search."""
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
        
        # Initialize both searches
        forward_open = []
        forward_closed = set()
        backward_open = []
        backward_closed = set()
        
        # Track nodes visited by each search
        forward_nodes = {start_node}
        backward_nodes = {goal_node}
        
        # Initialize start node for forward search
        start_node.g_cost = 0.0
        start_node.h_cost = self.get_heuristic(start_node, goal_node, self.heuristic_type)
        start_node.f_cost = start_node.g_cost + start_node.h_cost
        heapq.heappush(forward_open, (start_node.f_cost, 'forward', id(start_node), start_node))
        
        # Initialize goal node for backward search
        goal_node.g_cost = 0.0
        goal_node.h_cost = self.get_heuristic(goal_node, start_node, self.heuristic_type)
        goal_node.f_cost = goal_node.g_cost + goal_node.h_cost
        heapq.heappush(backward_open, (goal_node.f_cost, 'backward', id(goal_node), goal_node))
        
        meeting_point = None
        best_cost = float('inf')
        
        while forward_open or backward_open:
            self._increment_iteration()
            self._update_memory_usage(len(forward_open) + len(backward_open) + 
                                    len(forward_closed) + len(backward_closed))
            
            # Alternate between forward and backward search
            if forward_open and (not backward_open or len(forward_open) <= len(backward_open)):
                # Forward search step
                _, direction, _, current = heapq.heappop(forward_open)
                forward_closed.add(current)
                self._expand_node()
                
                # Check for meeting point
                if current in backward_nodes:
                    meeting_point = current
                    break
                
                # Expand neighbors
                for neighbor in grid.get_neighbors(current):
                    self._visit_node()
                    
                    if neighbor in forward_closed:
                        continue
                    
                    tentative_g = current.g_cost + grid.get_movement_cost(current, neighbor)
                    
                    if neighbor not in forward_nodes or tentative_g < neighbor.g_cost:
                        neighbor.parent = current
                        neighbor.g_cost = tentative_g
                        neighbor.h_cost = self.get_heuristic(neighbor, goal_node, self.heuristic_type)
                        neighbor.f_cost = neighbor.g_cost + neighbor.h_cost
                        
                        forward_nodes.add(neighbor)
                        heapq.heappush(forward_open, (neighbor.f_cost, 'forward', id(neighbor), neighbor))
            
            elif backward_open:
                # Backward search step
                _, direction, _, current = heapq.heappop(backward_open)
                backward_closed.add(current)
                self._expand_node()
                
                # Check for meeting point
                if current in forward_nodes:
                    meeting_point = current
                    break
                
                # Expand neighbors (parents in backward search)
                for neighbor in grid.get_neighbors(current):
                    self._visit_node()
                    
                    if neighbor in backward_closed:
                        continue
                    
                    tentative_g = current.g_cost + grid.get_movement_cost(current, neighbor)
                    
                    if neighbor not in backward_nodes or tentative_g < neighbor.g_cost:
                        # In backward search, the "parent" relationship is reversed
                        # We'll handle path reconstruction differently
                        neighbor.g_cost = tentative_g
                        neighbor.h_cost = self.get_heuristic(neighbor, start_node, self.heuristic_type)
                        neighbor.f_cost = neighbor.g_cost + neighbor.h_cost
                        
                        backward_nodes.add(neighbor)
                        heapq.heappush(backward_open, (neighbor.f_cost, 'backward', id(neighbor), neighbor))
        
        if meeting_point:
            # Reconstruct bidirectional path
            # This is simplified - in practice, you'd need to properly handle
            # the bidirectional path reconstruction
            path = grid.get_path(meeting_point)
            return self._create_result(path, True)
        
        return self._create_result([], False, "No path exists")