"""
Incremental Phi* Algorithm Implementation
Incremental version of any-angle pathfinding for dynamic environments.

Incremental Phi* extends the any-angle pathfinding concept to handle
changes in the environment efficiently by reusing previous search results.
"""

import heapq
import math
from typing import List, Tuple, Optional, Set, Dict

from ...core import PathfindingAlgorithm, PathfindingResult, AlgorithmCategory, DynamicGrid, DynamicNode


class IncrementalPhiStar(PathfindingAlgorithm):
    """
    Incremental Phi* algorithm implementation.
    
    Features:
    - Any-angle pathfinding in dynamic environments
    - Incremental replanning when obstacles change
    - Reuses previous search information
    - Maintains optimality while handling updates efficiently
    """
    
    def __init__(self, heuristic_type: str = "euclidean"):
        super().__init__("Incremental Phi*", AlgorithmCategory.ANY_ANGLE)
        self.heuristic_type = heuristic_type
        
        # Persistent data structures for incremental updates
        self.goal_node: Optional[DynamicNode] = None
        self.open_set: List = []
        self.open_set_dict: Dict[DynamicNode, float] = {}
        self.closed_set: Set[DynamicNode] = set()
        self.inconsistent_nodes: Set[DynamicNode] = set()
        
        # Configuration
        self.epsilon = 2.5  # Suboptimality bound for faster replanning
        
    def find_path(self, grid: DynamicGrid, start: Tuple[int, int], goal: Tuple[int, int]) -> PathfindingResult:
        """
        Find any-angle path using Incremental Phi* algorithm.
        
        Args:
            grid: DynamicGrid supporting cost changes
            start: Starting position (x, y)
            goal: Goal position (x, y)
            
        Returns:
            PathfindingResult with any-angle path
        """
        self._start_timing()
        
        error_msg = self.validate_inputs(grid, start, goal)
        if error_msg:
            return self._create_result([], False, error_msg)
        
        if not isinstance(grid, DynamicGrid):
            return self._create_result([], False, "Incremental Phi* requires DynamicGrid")
        
        start_node = grid.get_node(start[0], start[1])
        goal_node = grid.get_node(goal[0], goal[1])
        
        if not start_node or not goal_node:
            return self._create_result([], False, "Invalid start or goal node")
        
        if start_node == goal_node:
            return self._create_result([start], True)
        
        # Check if this is a replanning scenario
        if self.goal_node != goal_node or not self._has_valid_search_data():
            # Initialize new search
            self._initialize_search(grid, start_node, goal_node)
        else:
            # Handle incremental updates
            changed_nodes = grid.get_changed_nodes()
            if changed_nodes:
                self._handle_updates(grid, changed_nodes, start_node)
        
        # Run the main search
        result = self._search(grid, start_node, goal_node)
        
        if result.found:
            result.algorithm_data['incremental'] = True
            result.algorithm_data['epsilon'] = self.epsilon
        
        return result
    
    def _initialize_search(self, grid: DynamicGrid, start_node: DynamicNode, goal_node: DynamicNode):
        """Initialize search data structures."""
        grid.reset_pathfinding_data()
        
        self.goal_node = goal_node
        self.open_set = []
        self.open_set_dict = {}
        self.closed_set = set()
        self.inconsistent_nodes = set()
        
        # Initialize goal node
        goal_node.rhs = 0.0
        goal_node.g_cost = float('inf')
        self._update_vertex(grid, goal_node, start_node)
    
    def _has_valid_search_data(self) -> bool:
        """Check if we have valid previous search data."""
        return (self.goal_node is not None and 
                len(self.open_set) > 0 or len(self.closed_set) > 0)
    
    def _handle_updates(self, grid: DynamicGrid, changed_nodes: List[DynamicNode], start_node: DynamicNode):
        """Handle environment updates incrementally."""
        # Update affected nodes
        for node in changed_nodes:
            old_neighbors = self._get_predecessors(grid, node)
            
            # Update rhs value
            if node != self.goal_node:
                min_rhs = float('inf')
                for pred in old_neighbors:
                    if pred.g_cost != float('inf'):
                        cost = pred.g_cost + self._get_any_angle_cost(grid, pred, node)
                        min_rhs = min(min_rhs, cost)
                node.rhs = min_rhs
            
            # Update vertex in open set
            self._update_vertex(grid, node, start_node)
            
            # Mark neighbors for update
            for neighbor in grid.get_neighbors(node):
                if neighbor != self.goal_node:
                    self.inconsistent_nodes.add(neighbor)
        
        # Update all inconsistent nodes
        for node in self.inconsistent_nodes:
            self._update_vertex(grid, node, start_node)
        
        self.inconsistent_nodes.clear()
        grid.clear_change_flags()
    
    def _search(self, grid: DynamicGrid, start_node: DynamicNode, goal_node: DynamicNode) -> PathfindingResult:
        """Main incremental search loop."""
        while (self.open_set and 
               (self._top_key() < self._calculate_key(start_node, start_node) or 
                not start_node.is_consistent())):
            
            self._increment_iteration()
            self._update_memory_usage(len(self.open_set) + len(self.closed_set))
            
            # Get node with smallest key
            current_key, _, current_node = heapq.heappop(self.open_set)
            
            if current_node in self.open_set_dict:
                del self.open_set_dict[current_node]
            
            self._expand_node()
            
            if current_key < self._calculate_key(current_node, start_node):
                # Key has been updated, re-insert
                heapq.heappush(self.open_set, 
                             (*self._calculate_key(current_node, start_node), id(current_node), current_node))
                self.open_set_dict[current_node] = current_key[0]
                
            elif current_node.g_cost > current_node.rhs:
                # Overconsistent - make consistent
                current_node.g_cost = current_node.rhs
                self.closed_set.add(current_node)
                
                # Update successors
                for successor in grid.get_neighbors(current_node):
                    self._update_successor(grid, current_node, successor, start_node)
                    
            else:
                # Underconsistent - make overconsistent
                current_node.g_cost = float('inf')
                
                # Update current node and successors
                self._update_vertex(grid, current_node, start_node)
                for successor in grid.get_neighbors(current_node):
                    self._update_successor(grid, current_node, successor, start_node)
        
        # Check if path was found
        if start_node.g_cost == float('inf'):
            return self._create_result([], False, "No path exists")
        
        # Reconstruct path
        path = self._reconstruct_any_angle_path(grid, start_node, goal_node)
        return self._create_result(path, True)
    
    def _update_successor(self, grid: DynamicGrid, current: DynamicNode, successor: DynamicNode, 
                         start_node: DynamicNode):
        """Update successor node after current node changes."""
        if successor != self.goal_node:
            # Try direct connection from current's parent (any-angle)
            min_rhs = successor.rhs
            
            # Standard grid connection
            if current.g_cost != float('inf'):
                cost = current.g_cost + self._get_any_angle_cost(grid, current, successor)
                min_rhs = min(min_rhs, cost)
            
            # Any-angle connection through current's parent
            if hasattr(current, 'parent') and current.parent and current.parent.g_cost != float('inf'):
                if self._has_line_of_sight(grid, current.parent, successor):
                    cost = current.parent.g_cost + self._get_any_angle_cost(grid, current.parent, successor)
                    min_rhs = min(min_rhs, cost)
            
            successor.rhs = min_rhs
        
        self._update_vertex(grid, successor, start_node)
    
    def _update_vertex(self, grid: DynamicGrid, node: DynamicNode, start_node: DynamicNode):
        """Update vertex in the open set."""
        if node in self.open_set_dict:
            # Remove old entry
            del self.open_set_dict[node]
        
        if not node.is_consistent():
            key = self._calculate_key(node, start_node)
            heapq.heappush(self.open_set, (*key, id(node), node))
            self.open_set_dict[node] = key[0]
    
    def _calculate_key(self, node: DynamicNode, start_node: DynamicNode) -> Tuple[float, float]:
        """Calculate priority key for D*-like algorithms."""
        min_g_rhs = min(node.g_cost, node.rhs)
        h = self.get_heuristic(node, start_node, self.heuristic_type)
        
        k1 = min_g_rhs + self.epsilon * h
        k2 = min_g_rhs
        
        return (k1, k2)
    
    def _top_key(self) -> Tuple[float, float]:
        """Get the top key from the open set."""
        if self.open_set:
            key, _, _ = self.open_set[0]
            return key
        return (float('inf'), float('inf'))
    
    def _get_predecessors(self, grid: DynamicGrid, node: DynamicNode) -> List[DynamicNode]:
        """Get all predecessors (neighbors) of a node."""
        return grid.get_neighbors(node)
    
    def _get_any_angle_cost(self, grid: DynamicGrid, from_node: DynamicNode, to_node: DynamicNode) -> float:
        """Get any-angle movement cost between nodes."""
        if self._has_line_of_sight(grid, from_node, to_node):
            # Direct line cost
            dx = to_node.x - from_node.x
            dy = to_node.y - from_node.y
            return math.sqrt(dx * dx + dy * dy)
        else:
            # Standard grid movement cost
            return grid.get_movement_cost(from_node, to_node)
    
    def _has_line_of_sight(self, grid: DynamicGrid, from_node: DynamicNode, to_node: DynamicNode) -> bool:
        """Check line of sight between two nodes."""
        # Simplified line of sight check
        # In a full implementation, this would use grid.has_line_of_sight()
        return True  # Placeholder - implement proper LOS check
    
    def _reconstruct_any_angle_path(self, grid: DynamicGrid, start_node: DynamicNode, 
                                  goal_node: DynamicNode) -> List[Tuple[float, float]]:
        """Reconstruct any-angle path from start to goal."""
        path = []
        current = start_node
        
        # Simple path reconstruction - in practice would trace back through parents
        # with any-angle connections
        while current != goal_node:
            path.append((float(current.x), float(current.y)))
            
            # Find best next node
            best_next = None
            best_cost = float('inf')
            
            for neighbor in grid.get_neighbors(current):
                if neighbor.g_cost < best_cost:
                    best_cost = neighbor.g_cost
                    best_next = neighbor
            
            if best_next is None:
                break
            
            current = best_next
        
        path.append((float(goal_node.x), float(goal_node.y)))
        return path
    
    def replan_after_changes(self, grid: DynamicGrid, start: Tuple[int, int]) -> PathfindingResult:
        """Replan path after environment changes."""
        if not self.goal_node:
            return self._create_result([], False, "No initial plan exists")
        
        start_node = grid.get_node(start[0], start[1])
        if not start_node:
            return self._create_result([], False, "Invalid start position")
        
        # Handle any changes that occurred
        changed_nodes = grid.get_changed_nodes()
        if changed_nodes:
            self._handle_updates(grid, changed_nodes, start_node)
        
        # Run incremental search
        return self._search(grid, start_node, self.goal_node)