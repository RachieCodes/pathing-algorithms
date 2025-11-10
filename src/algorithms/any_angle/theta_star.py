"""
Theta* Algorithm Implementation
Any-angle pathfinding that allows paths at any angle, not just grid-aligned.

Theta* is an extension of A* that performs line-of-sight checks to create
more natural, shorter paths by allowing movement at any angle rather than
being restricted to grid connections.
"""

import heapq
import math
from typing import List, Tuple, Optional

from ...core import PathfindingAlgorithm, PathfindingResult, AlgorithmCategory, AngleGrid, AngleNode


class ThetaStar(PathfindingAlgorithm):
    """
    Theta* algorithm implementation.
    
    Features:
    - Any-angle pathfinding
    - Line-of-sight optimization
    - Shorter, more natural paths than grid-based A*
    - Maintains optimality with admissible heuristics
    """
    
    def __init__(self, heuristic_type: str = "euclidean"):
        super().__init__("Theta*", AlgorithmCategory.ANY_ANGLE)
        self.heuristic_type = heuristic_type
    
    def find_path(self, grid: AngleGrid, start: Tuple[int, int], goal: Tuple[int, int]) -> PathfindingResult:
        """
        Find any-angle path using Theta* algorithm.
        
        Args:
            grid: AngleGrid to search on (must support line-of-sight)
            start: Starting position (x, y)
            goal: Goal position (x, y)
            
        Returns:
            PathfindingResult with any-angle path
        """
        self._start_timing()
        
        error_msg = self.validate_inputs(grid, start, goal)
        if error_msg:
            return self._create_result([], False, error_msg)
        
        if not isinstance(grid, AngleGrid):
            return self._create_result([], False, "Theta* requires AngleGrid for line-of-sight checks")
        
        grid.reset_pathfinding_data()
        
        start_node = grid.get_node(start[0], start[1])
        goal_node = grid.get_node(goal[0], goal[1])
        
        if not start_node or not goal_node:
            return self._create_result([], False, "Invalid start or goal node")
        
        if start_node == goal_node:
            return self._create_result([start], True)
        
        # Initialize Theta*
        open_set = []
        closed_set = set()
        
        # Set up start node
        start_node.g_cost = 0.0
        start_node.h_cost = self.get_heuristic(start_node, goal_node, self.heuristic_type)
        start_node.f_cost = start_node.g_cost + start_node.h_cost
        start_node.parent = None
        start_node.set_parent_coordinates(float(start_node.x), float(start_node.y))
        
        heapq.heappush(open_set, (start_node.f_cost, id(start_node), start_node))
        open_set_dict = {start_node: start_node.f_cost}
        
        while open_set:
            self._increment_iteration()
            self._update_memory_usage(len(open_set) + len(closed_set))
            
            # Get node with lowest f_cost
            _, _, current_node = heapq.heappop(open_set)
            
            # Remove from open set tracking
            if current_node in open_set_dict:
                del open_set_dict[current_node]
            
            # Check if we reached the goal
            if current_node == goal_node:
                path = self._reconstruct_theta_path(current_node)
                result = self._create_result(path, True)
                result.algorithm_data['path_type'] = 'any_angle'
                return result
            
            # Move to closed set
            closed_set.add(current_node)
            self._expand_node()
            
            # Examine neighbors
            for neighbor in grid.get_neighbors(current_node):
                self._visit_node()
                
                if neighbor in closed_set:
                    continue
                
                # Theta* specific: try to connect directly to parent's parent
                if current_node.parent is not None:
                    parent_coords = current_node.get_parent_coordinates()
                    if parent_coords and self._line_of_sight_check(grid, parent_coords, neighbor):
                        # Path 2: Connect directly from grandparent to neighbor
                        grandparent_x, grandparent_y = parent_coords
                        distance = math.sqrt((neighbor.x - grandparent_x)**2 + (neighbor.y - grandparent_y)**2)
                        tentative_g = current_node.parent.g_cost + distance
                        
                        if neighbor not in open_set_dict or tentative_g < neighbor.g_cost:
                            neighbor.parent = current_node.parent
                            neighbor.set_parent_coordinates(grandparent_x, grandparent_y)
                            neighbor.g_cost = tentative_g
                            neighbor.h_cost = self.get_heuristic(neighbor, goal_node, self.heuristic_type)
                            neighbor.f_cost = neighbor.g_cost + neighbor.h_cost
                            
                            if neighbor not in open_set_dict:
                                heapq.heappush(open_set, (neighbor.f_cost, id(neighbor), neighbor))
                            open_set_dict[neighbor] = neighbor.f_cost
                        
                        continue
                
                # Path 1: Standard A* connection through current node
                tentative_g = current_node.g_cost + grid.get_movement_cost(current_node, neighbor)
                
                if neighbor not in open_set_dict or tentative_g < neighbor.g_cost:
                    neighbor.parent = current_node
                    neighbor.set_parent_coordinates(float(current_node.x), float(current_node.y))
                    neighbor.g_cost = tentative_g
                    neighbor.h_cost = self.get_heuristic(neighbor, goal_node, self.heuristic_type)
                    neighbor.f_cost = neighbor.g_cost + neighbor.h_cost
                    
                    if neighbor not in open_set_dict:
                        heapq.heappush(open_set, (neighbor.f_cost, id(neighbor), neighbor))
                    open_set_dict[neighbor] = neighbor.f_cost
        
        return self._create_result([], False, "No path exists")
    
    def _line_of_sight_check(self, grid: AngleGrid, start_coords: Tuple[float, float], 
                           end_node: AngleNode) -> bool:
        """Check if there's line of sight between coordinates and a node."""
        return grid.has_line_of_sight(start_coords[0], start_coords[1], 
                                    float(end_node.x), float(end_node.y))
    
    def _reconstruct_theta_path(self, goal_node: AngleNode) -> List[Tuple[float, float]]:
        """Reconstruct the any-angle path using parent coordinates."""
        path = []
        current = goal_node
        
        while current is not None:
            parent_coords = current.get_parent_coordinates()
            if parent_coords:
                path.append(parent_coords)
            else:
                path.append((float(current.x), float(current.y)))
            
            current = current.parent
        
        return list(reversed(path))


class BasicThetaStar(ThetaStar):
    """
    Simplified Theta* implementation for educational purposes.
    
    Uses a simpler line-of-sight check but may be less efficient
    than the full Theta* algorithm.
    """
    
    def __init__(self):
        super().__init__()
        self.name = "Basic Theta*"
    
    def find_path(self, grid: AngleGrid, start: Tuple[int, int], goal: Tuple[int, int]) -> PathfindingResult:
        """Find path using simplified Theta* algorithm."""
        result = super().find_path(grid, start, goal)
        result.algorithm_data['variant'] = 'basic'
        return result


class LazyThetaStar(PathfindingAlgorithm):
    """
    Lazy Theta* algorithm.
    
    Defers line-of-sight checks until nodes are expanded,
    potentially improving performance by avoiding unnecessary checks.
    """
    
    def __init__(self, heuristic_type: str = "euclidean"):
        super().__init__("Lazy Theta*", AlgorithmCategory.ANY_ANGLE)
        self.heuristic_type = heuristic_type
    
    def find_path(self, grid: AngleGrid, start: Tuple[int, int], goal: Tuple[int, int]) -> PathfindingResult:
        """
        Find path using Lazy Theta* algorithm.
        
        The lazy approach defers line-of-sight checks until node expansion,
        which can improve performance in dense environments.
        """
        self._start_timing()
        
        error_msg = self.validate_inputs(grid, start, goal)
        if error_msg:
            return self._create_result([], False, error_msg)
        
        if not isinstance(grid, AngleGrid):
            return self._create_result([], False, "Lazy Theta* requires AngleGrid")
        
        grid.reset_pathfinding_data()
        
        start_node = grid.get_node(start[0], start[1])
        goal_node = grid.get_node(goal[0], goal[1])
        
        if not start_node or not goal_node:
            return self._create_result([], False, "Invalid start or goal node")
        
        if start_node == goal_node:
            return self._create_result([start], True)
        
        # Initialize Lazy Theta*
        open_set = []
        closed_set = set()
        
        start_node.g_cost = 0.0
        start_node.h_cost = self.get_heuristic(start_node, goal_node, self.heuristic_type)
        start_node.f_cost = start_node.g_cost + start_node.h_cost
        start_node.set_parent_coordinates(float(start_node.x), float(start_node.y))
        
        heapq.heappush(open_set, (start_node.f_cost, id(start_node), start_node))
        open_set_dict = {start_node: start_node.f_cost}
        
        while open_set:
            self._increment_iteration()
            self._update_memory_usage(len(open_set) + len(closed_set))
            
            _, _, current_node = heapq.heappop(open_set)
            
            if current_node in open_set_dict:
                del open_set_dict[current_node]
            
            # Lazy evaluation: check line of sight when expanding
            if current_node.parent is not None:
                parent_coords = current_node.get_parent_coordinates()
                grandparent = current_node.parent.parent
                
                if (grandparent is not None and parent_coords and 
                    not grid.has_line_of_sight(parent_coords[0], parent_coords[1],
                                             float(current_node.x), float(current_node.y))):
                    # No line of sight - recompute path through grid neighbors
                    self._recompute_path(grid, current_node)
            
            if current_node == goal_node:
                path = self._reconstruct_theta_path(current_node)
                result = self._create_result(path, True)
                result.algorithm_data['algorithm_type'] = 'lazy'
                return result
            
            closed_set.add(current_node)
            self._expand_node()
            
            # Process neighbors
            for neighbor in grid.get_neighbors(current_node):
                self._visit_node()
                
                if neighbor in closed_set:
                    continue
                
                # Set parent to current node initially (lazy evaluation)
                tentative_g = current_node.g_cost + grid.get_movement_cost(current_node, neighbor)
                
                if neighbor not in open_set_dict or tentative_g < neighbor.g_cost:
                    neighbor.parent = current_node
                    neighbor.set_parent_coordinates(float(current_node.x), float(current_node.y))
                    neighbor.g_cost = tentative_g
                    neighbor.h_cost = self.get_heuristic(neighbor, goal_node, self.heuristic_type)
                    neighbor.f_cost = neighbor.g_cost + neighbor.h_cost
                    
                    if neighbor not in open_set_dict:
                        heapq.heappush(open_set, (neighbor.f_cost, id(neighbor), neighbor))
                    open_set_dict[neighbor] = neighbor.f_cost
        
        return self._create_result([], False, "No path exists")
    
    def _recompute_path(self, grid: AngleGrid, node: AngleNode):
        """Recompute path to node when line of sight fails."""
        # Find the best parent among grid neighbors of node's parent
        best_parent = None
        best_cost = float('inf')
        
        if node.parent:
            for neighbor in grid.get_neighbors(node.parent):
                if neighbor.parent is not None:  # Must be in closed set
                    cost = neighbor.g_cost + grid.get_movement_cost(neighbor, node)
                    if cost < best_cost:
                        best_cost = cost
                        best_parent = neighbor
        
        if best_parent:
            node.parent = best_parent
            node.g_cost = best_cost
            node.set_parent_coordinates(float(best_parent.x), float(best_parent.y))
    
    def _reconstruct_theta_path(self, goal_node: AngleNode) -> List[Tuple[float, float]]:
        """Reconstruct the any-angle path."""
        path = []
        current = goal_node
        
        while current is not None:
            parent_coords = current.get_parent_coordinates()
            if parent_coords:
                path.append(parent_coords)
            else:
                path.append((float(current.x), float(current.y)))
            
            current = current.parent
        
        return list(reversed(path))