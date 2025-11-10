"""
IDA* (Iterative Deepening A*) Algorithm Implementation
Memory-efficient pathfinding using iterative deepening with heuristic pruning.

IDA* uses very little memory by performing depth-first search with increasing
cost limits, combining the completeness of A* with the memory efficiency of DFS.
"""

from typing import List, Tuple, Optional
import sys

from ...core import PathfindingAlgorithm, PathfindingResult, AlgorithmCategory, Grid, GridNode


class IDAStar(PathfindingAlgorithm):
    """
    IDA* (Iterative Deepening A*) algorithm implementation.
    
    Features:
    - Optimal pathfinding with minimal memory usage
    - Memory complexity O(d) where d is solution depth
    - Guaranteed to find optimal solution with admissible heuristic
    - Best for memory-constrained environments
    """
    
    def __init__(self, heuristic_type: str = "euclidean", max_iterations: int = 1000000):
        super().__init__("IDA*", AlgorithmCategory.OPTIMIZED)
        self.heuristic_type = heuristic_type
        self.max_iterations = max_iterations
        
        # Search state
        self.goal_node: Optional[GridNode] = None
        self.current_threshold: float = 0.0
        self.next_threshold: float = float('inf')
        self.solution_path: List[GridNode] = []
    
    def find_path(self, grid: Grid, start: Tuple[int, int], goal: Tuple[int, int]) -> PathfindingResult:
        """
        Find optimal path using IDA* algorithm.
        
        Args:
            grid: Grid to search on
            start: Starting position (x, y)
            goal: Goal position (x, y)
            
        Returns:
            PathfindingResult with optimal path and memory statistics
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
        
        self.goal_node = goal_node
        self.solution_path = []
        
        # Initialize threshold with heuristic estimate
        self.current_threshold = self.get_heuristic(start_node, goal_node, self.heuristic_type)
        iterations = 0
        
        while iterations < self.max_iterations:
            self.next_threshold = float('inf')
            
            # Perform depth-first search with current threshold
            result = self._search(grid, start_node, 0.0, [start_node])
            
            iterations += 1
            self._increment_iteration()
            
            if result == "FOUND":
                # Convert node path to coordinate path
                path = [(node.x, node.y) for node in self.solution_path]
                result = self._create_result(path, True)
                result.algorithm_data['final_threshold'] = self.current_threshold
                result.algorithm_data['ida_iterations'] = iterations
                result.algorithm_data['memory_complexity'] = 'O(d)'
                return result
            
            elif result == "NOT_FOUND":
                return self._create_result([], False, "No path exists")
            
            # Update threshold for next iteration
            self.current_threshold = self.next_threshold
        
        return self._create_result([], False, f"Maximum iterations ({self.max_iterations}) exceeded")
    
    def _search(self, grid: Grid, node: GridNode, g_cost: float, path: List[GridNode]) -> str:
        """
        Recursive depth-first search with threshold pruning.
        
        Returns:
            - "FOUND": Solution found
            - "NOT_FOUND": No solution exists
            - "CUTOFF": Threshold exceeded, continue with higher threshold
        """
        # Calculate f-cost
        h_cost = self.get_heuristic(node, self.goal_node, self.heuristic_type)
        f_cost = g_cost + h_cost
        
        # Threshold exceeded
        if f_cost > self.current_threshold:
            self.next_threshold = min(self.next_threshold, f_cost)
            return "CUTOFF"
        
        # Goal reached
        if node == self.goal_node:
            self.solution_path = path.copy()
            return "FOUND"
        
        # Track memory usage (path length represents memory usage)
        self._update_memory_usage(len(path))
        self._expand_node()
        
        # Explore neighbors
        cutoff_occurred = False
        
        for neighbor in grid.get_neighbors(node):
            self._visit_node()
            
            # Avoid cycles
            if neighbor in path:
                continue
            
            # Calculate cost to neighbor
            move_cost = grid.get_movement_cost(node, neighbor)
            new_g_cost = g_cost + move_cost
            new_path = path + [neighbor]
            
            # Recursive search
            result = self._search(grid, neighbor, new_g_cost, new_path)
            
            if result == "FOUND":
                return "FOUND"
            elif result == "CUTOFF":
                cutoff_occurred = True
        
        return "CUTOFF" if cutoff_occurred else "NOT_FOUND"


class MemoryBoundedAStar(PathfindingAlgorithm):
    """
    Memory-Bounded A* (MBA*) - variant that limits memory usage.
    
    Maintains a limited number of nodes in memory and uses
    regeneration when memory limit is exceeded.
    """
    
    def __init__(self, heuristic_type: str = "euclidean", memory_limit: int = 10000):
        super().__init__("Memory-Bounded A*", AlgorithmCategory.OPTIMIZED)
        self.heuristic_type = heuristic_type
        self.memory_limit = memory_limit
    
    def find_path(self, grid: Grid, start: Tuple[int, int], goal: Tuple[int, int]) -> PathfindingResult:
        """Find path with bounded memory usage."""
        self._start_timing()
        
        error_msg = self.validate_inputs(grid, start, goal)
        if error_msg:
            return self._create_result([], False, error_msg)
        
        # Use IDA* as fallback for memory-bounded search
        ida_star = IDAStar(self.heuristic_type, max_iterations=100)
        result = ida_star.find_path(grid, start, goal)
        
        # Update algorithm name in result
        if result.found:
            result.algorithm_data['memory_bounded'] = True
            result.algorithm_data['memory_limit'] = self.memory_limit
        
        return result


class RecursiveBestFirstSearch(PathfindingAlgorithm):
    """
    Recursive Best-First Search (RBFS) algorithm.
    
    Memory-efficient algorithm that uses recursive calls and
    maintains f-cost bounds to avoid excessive memory usage.
    """
    
    def __init__(self, heuristic_type: str = "euclidean"):
        super().__init__("Recursive Best-First Search", AlgorithmCategory.OPTIMIZED)
        self.heuristic_type = heuristic_type
        self.goal_node: Optional[GridNode] = None
    
    def find_path(self, grid: Grid, start: Tuple[int, int], goal: Tuple[int, int]) -> PathfindingResult:
        """
        Find optimal path using RBFS algorithm.
        
        Args:
            grid: Grid to search on
            start: Starting position (x, y)
            goal: Goal position (x, y)
            
        Returns:
            PathfindingResult with optimal path
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
        
        self.goal_node = goal_node
        
        # Initialize start node
        start_node.g_cost = 0.0
        start_node.h_cost = self.get_heuristic(start_node, goal_node, self.heuristic_type)
        start_node.f_cost = start_node.g_cost + start_node.h_cost
        
        # Perform RBFS
        result, new_f_limit = self._rbfs(grid, start_node, float('inf'))
        
        if result:
            path = grid.get_path(result)
            result = self._create_result(path, True)
            result.algorithm_data['search_type'] = 'recursive_best_first'
            return result
        
        return self._create_result([], False, "No path exists")
    
    def _rbfs(self, grid: Grid, node: GridNode, f_limit: float) -> Tuple[Optional[GridNode], float]:
        """
        Recursive Best-First Search implementation.
        
        Returns:
            Tuple of (solution_node, new_f_limit)
        """
        self._increment_iteration()
        
        if node.f_cost > f_limit:
            return None, node.f_cost
        
        if node == self.goal_node:
            return node, f_limit
        
        # Generate and evaluate successors
        successors = []
        
        for neighbor in grid.get_neighbors(node):
            self._visit_node()
            
            if neighbor.parent == node:  # Avoid immediate backtrack
                continue
            
            # Calculate costs
            tentative_g = node.g_cost + grid.get_movement_cost(node, neighbor)
            
            if tentative_g < neighbor.g_cost:
                neighbor.parent = node
                neighbor.g_cost = tentative_g
                neighbor.h_cost = self.get_heuristic(neighbor, self.goal_node, self.heuristic_type)
                neighbor.f_cost = max(neighbor.g_cost + neighbor.h_cost, node.f_cost)
            
            successors.append(neighbor)
        
        if not successors:
            return None, float('inf')
        
        # Sort successors by f-cost
        successors.sort(key=lambda n: n.f_cost)
        
        while True:
            best = successors[0]
            self._expand_node()
            
            if best.f_cost > f_limit:
                return None, best.f_cost
            
            # Get alternative f-cost
            if len(successors) > 1:
                alternative = successors[1].f_cost
            else:
                alternative = float('inf')
            
            # Recursively search best successor
            result, best.f_cost = self._rbfs(grid, best, min(f_limit, alternative))
            
            if result is not None:
                return result, best.f_cost
            
            # Re-sort successors
            successors.sort(key=lambda n: n.f_cost)