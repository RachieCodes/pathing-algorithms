"""
RRT (Rapidly Exploring Random Trees) Algorithm Implementation
Sampling-based path planning for continuous spaces and complex environments.

RRT builds a tree of random samples to explore the space efficiently,
particularly useful for high-dimensional spaces and complex obstacles.
"""

import random
import math
from typing import List, Tuple, Optional, Set

from ...core import PathfindingAlgorithm, PathfindingResult, AlgorithmCategory, Grid, SamplingNode


class RRT(PathfindingAlgorithm):
    """
    RRT (Rapidly Exploring Random Trees) algorithm implementation.
    
    Features:
    - Probabilistically complete pathfinding
    - Excellent for high-dimensional spaces
    - Handles complex obstacle geometries
    - Fast exploration of unknown spaces
    """
    
    def __init__(self, step_size: float = 1.0, max_iterations: int = 10000, 
                 goal_bias: float = 0.1, seed: Optional[int] = None):
        super().__init__("RRT", AlgorithmCategory.SAMPLING)
        
        self.step_size = step_size
        self.max_iterations = max_iterations
        self.goal_bias = goal_bias  # Probability of sampling toward goal
        
        if seed is not None:
            random.seed(seed)
        
        # Tree structures
        self.nodes: List[SamplingNode] = []
        self.root: Optional[SamplingNode] = None
    
    def find_path(self, grid: Grid, start: Tuple[int, int], goal: Tuple[int, int]) -> PathfindingResult:
        """
        Find path using RRT algorithm.
        
        Args:
            grid: Grid defining the search space and obstacles
            start: Starting position (x, y)
            goal: Goal position (x, y)
            
        Returns:
            PathfindingResult with sampled path
        """
        self._start_timing()
        
        error_msg = self.validate_inputs(grid, start, goal)
        if error_msg:
            return self._create_result([], False, error_msg)
        
        # Initialize tree
        self.nodes = []
        self.root = SamplingNode(float(start[0]), float(start[1]))
        self.nodes.append(self.root)
        
        goal_node = SamplingNode(float(goal[0]), float(goal[1]))
        goal_threshold = 0.5  # Distance threshold for reaching goal
        
        for iteration in range(self.max_iterations):
            self._increment_iteration()
            self._update_memory_usage(len(self.nodes))
            
            # Sample random point (with goal bias)
            if random.random() < self.goal_bias:
                sample = goal_node
            else:
                sample = self._sample_random_point(grid)
            
            # Find nearest node in tree
            nearest_node = self._find_nearest_node(sample)
            if not nearest_node:
                continue
            
            # Extend tree toward sample
            new_node = self._extend_tree(grid, nearest_node, sample)
            
            if new_node:
                self.nodes.append(new_node)
                self._expand_node()
                
                # Check if goal is reached
                if new_node.distance_to(goal_node) <= goal_threshold:
                    # Connect to goal if possible
                    if self._is_collision_free(grid, new_node, goal_node):
                        goal_node.parent = new_node
                        goal_node.cost = new_node.cost + new_node.distance_to(goal_node)
                        
                        # Construct path
                        path = self._construct_path(goal_node)
                        result = self._create_result(path, True)
                        result.algorithm_data['iterations_used'] = iteration + 1
                        result.algorithm_data['tree_size'] = len(self.nodes)
                        result.algorithm_data['sampling_efficiency'] = (iteration + 1) / self.max_iterations
                        return result
        
        # No path found within iteration limit
        return self._create_result([], False, f"No path found within {self.max_iterations} iterations")
    
    def _sample_random_point(self, grid: Grid) -> SamplingNode:
        """Sample a random point in the grid space."""
        x = random.uniform(0, grid.width - 1)
        y = random.uniform(0, grid.height - 1)
        return SamplingNode(x, y)
    
    def _find_nearest_node(self, sample: SamplingNode) -> Optional[SamplingNode]:
        """Find the nearest node in the tree to the sample."""
        if not self.nodes:
            return None
        
        nearest = self.nodes[0]
        min_distance = nearest.distance_to(sample)
        
        for node in self.nodes[1:]:
            distance = node.distance_to(sample)
            if distance < min_distance:
                min_distance = distance
                nearest = node
        
        return nearest
    
    def _extend_tree(self, grid: Grid, from_node: SamplingNode, toward_sample: SamplingNode) -> Optional[SamplingNode]:
        """
        Extend the tree from a node toward a sample.
        
        Returns the new node if extension is successful, None otherwise.
        """
        # Calculate direction and distance
        dx = toward_sample.x - from_node.x
        dy = toward_sample.y - from_node.y
        distance = math.sqrt(dx * dx + dy * dy)
        
        if distance == 0:
            return None
        
        # Normalize direction and apply step size
        step_x = (dx / distance) * self.step_size
        step_y = (dy / distance) * self.step_size
        
        # Create new node
        new_x = from_node.x + step_x
        new_y = from_node.y + step_y
        new_node = SamplingNode(new_x, new_y)
        
        # Check if path is collision-free
        if self._is_collision_free(grid, from_node, new_node):
            new_node.parent = from_node
            new_node.cost = from_node.cost + from_node.distance_to(new_node)
            from_node.add_child(new_node)
            return new_node
        
        return None
    
    def _is_collision_free(self, grid: Grid, from_node: SamplingNode, to_node: SamplingNode) -> bool:
        """
        Check if the path between two nodes is collision-free.
        
        Uses line sampling to check for obstacles along the path.
        """
        # Sample points along the line
        num_samples = max(10, int(from_node.distance_to(to_node) * 2))
        
        for i in range(num_samples + 1):
            t = i / num_samples
            x = from_node.x + t * (to_node.x - from_node.x)
            y = from_node.y + t * (to_node.y - from_node.y)
            
            # Check if point is in obstacle
            grid_x = int(round(x))
            grid_y = int(round(y))
            
            if not grid.is_valid_position(grid_x, grid_y) or not grid.is_walkable(grid_x, grid_y):
                return False
        
        return True
    
    def _construct_path(self, goal_node: SamplingNode) -> List[Tuple[float, float]]:
        """Construct path from goal back to root."""
        path = []
        current = goal_node
        
        while current is not None:
            path.append(current.position)
            current = current.parent
        
        return list(reversed(path))


class RRTStar(RRT):
    """
    RRT* (RRT Star) algorithm - asymptotically optimal version of RRT.
    
    Improves upon RRT by rewiring the tree to find better paths,
    providing asymptotic optimality guarantees.
    """
    
    def __init__(self, step_size: float = 1.0, max_iterations: int = 10000,
                 goal_bias: float = 0.1, rewiring_radius: float = 2.0, seed: Optional[int] = None):
        super().__init__(step_size, max_iterations, goal_bias, seed)
        self.name = "RRT*"
        self.rewiring_radius = rewiring_radius
    
    def _extend_tree(self, grid: Grid, from_node: SamplingNode, toward_sample: SamplingNode) -> Optional[SamplingNode]:
        """
        Extend tree with RRT* improvements (rewiring).
        """
        # Standard RRT extension
        new_node = super()._extend_tree(grid, from_node, toward_sample)
        
        if new_node:
            # Find nearby nodes for potential rewiring
            nearby_nodes = self._find_nearby_nodes(new_node, self.rewiring_radius)
            
            # Choose parent that minimizes cost
            best_parent = from_node
            best_cost = new_node.cost
            
            for nearby_node in nearby_nodes:
                if self._is_collision_free(grid, nearby_node, new_node):
                    potential_cost = nearby_node.cost + nearby_node.distance_to(new_node)
                    if potential_cost < best_cost:
                        best_parent = nearby_node
                        best_cost = potential_cost
            
            # Update parent if better one found
            if best_parent != from_node:
                from_node.remove_child(new_node)
                best_parent.add_child(new_node)
                new_node.cost = best_cost
            
            # Rewire nearby nodes through new node
            self._rewire_tree(grid, new_node, nearby_nodes)
        
        return new_node
    
    def _find_nearby_nodes(self, node: SamplingNode, radius: float) -> List[SamplingNode]:
        """Find all nodes within rewiring radius."""
        nearby = []
        
        for existing_node in self.nodes:
            if existing_node != node and existing_node.distance_to(node) <= radius:
                nearby.append(existing_node)
        
        return nearby
    
    def _rewire_tree(self, grid: Grid, new_node: SamplingNode, nearby_nodes: List[SamplingNode]):
        """
        Rewire nearby nodes to go through new_node if it provides better cost.
        """
        for nearby_node in nearby_nodes:
            if nearby_node.parent and self._is_collision_free(grid, new_node, nearby_node):
                potential_cost = new_node.cost + new_node.distance_to(nearby_node)
                
                if potential_cost < nearby_node.cost:
                    # Rewire - change parent
                    old_parent = nearby_node.parent
                    old_parent.remove_child(nearby_node)
                    new_node.add_child(nearby_node)
                    nearby_node.cost = potential_cost
                    
                    # Update costs of all descendants
                    self._update_descendant_costs(nearby_node)
    
    def _update_descendant_costs(self, node: SamplingNode):
        """Recursively update costs of all descendants."""
        for child in node.children:
            child.cost = node.cost + node.distance_to(child)
            self._update_descendant_costs(child)


class RRTConnect(PathfindingAlgorithm):
    """
    RRT-Connect algorithm - bidirectional RRT variant.
    
    Grows two trees simultaneously from start and goal,
    attempting to connect them for faster pathfinding.
    """
    
    def __init__(self, step_size: float = 1.0, max_iterations: int = 10000, seed: Optional[int] = None):
        super().__init__("RRT-Connect", AlgorithmCategory.SAMPLING)
        
        self.step_size = step_size
        self.max_iterations = max_iterations
        
        if seed is not None:
            random.seed(seed)
    
    def find_path(self, grid: Grid, start: Tuple[int, int], goal: Tuple[int, int]) -> PathfindingResult:
        """
        Find path using bidirectional RRT-Connect algorithm.
        """
        self._start_timing()
        
        error_msg = self.validate_inputs(grid, start, goal)
        if error_msg:
            return self._create_result([], False, error_msg)
        
        # Initialize both trees
        start_tree = [SamplingNode(float(start[0]), float(start[1]))]
        goal_tree = [SamplingNode(float(goal[0]), float(goal[1]))]
        
        for iteration in range(self.max_iterations):
            self._increment_iteration()
            self._update_memory_usage(len(start_tree) + len(goal_tree))
            
            # Alternate between extending start and goal trees
            if iteration % 2 == 0:
                # Extend start tree toward random sample
                sample = self._sample_random_point(grid)
                new_node = self._extend_toward_sample(grid, start_tree, sample)
                
                if new_node:
                    # Try to connect to goal tree
                    connection = self._connect_trees(grid, goal_tree, new_node)
                    if connection:
                        path = self._construct_bidirectional_path(new_node, connection)
                        result = self._create_result(path, True)
                        result.algorithm_data['bidirectional'] = True
                        result.algorithm_data['start_tree_size'] = len(start_tree)
                        result.algorithm_data['goal_tree_size'] = len(goal_tree)
                        return result
            else:
                # Extend goal tree toward random sample
                sample = self._sample_random_point(grid)
                new_node = self._extend_toward_sample(grid, goal_tree, sample)
                
                if new_node:
                    # Try to connect to start tree
                    connection = self._connect_trees(grid, start_tree, new_node)
                    if connection:
                        path = self._construct_bidirectional_path(connection, new_node)
                        result = self._create_result(path, True)
                        result.algorithm_data['bidirectional'] = True
                        result.algorithm_data['start_tree_size'] = len(start_tree)
                        result.algorithm_data['goal_tree_size'] = len(goal_tree)
                        return result
        
        return self._create_result([], False, f"No connection found within {self.max_iterations} iterations")
    
    def _sample_random_point(self, grid: Grid) -> SamplingNode:
        """Sample a random point in the grid space."""
        x = random.uniform(0, grid.width - 1)
        y = random.uniform(0, grid.height - 1)
        return SamplingNode(x, y)
    
    def _extend_toward_sample(self, grid: Grid, tree: List[SamplingNode], 
                             sample: SamplingNode) -> Optional[SamplingNode]:
        """Extend a tree toward a sample point."""
        # Find nearest node in tree
        nearest = min(tree, key=lambda node: node.distance_to(sample))
        
        # Calculate extension direction
        dx = sample.x - nearest.x
        dy = sample.y - nearest.y
        distance = math.sqrt(dx * dx + dy * dy)
        
        if distance == 0:
            return None
        
        # Create new node at step_size distance
        step_x = (dx / distance) * self.step_size
        step_y = (dy / distance) * self.step_size
        
        new_node = SamplingNode(nearest.x + step_x, nearest.y + step_y)
        
        # Check collision
        if self._is_collision_free(grid, nearest, new_node):
            new_node.parent = nearest
            nearest.add_child(new_node)
            tree.append(new_node)
            self._expand_node()
            return new_node
        
        return None
    
    def _connect_trees(self, grid: Grid, target_tree: List[SamplingNode], 
                      source_node: SamplingNode) -> Optional[SamplingNode]:
        """Try to connect source node to target tree."""
        # Find nearest node in target tree
        nearest = min(target_tree, key=lambda node: node.distance_to(source_node))
        
        # Check if direct connection is possible
        if self._is_collision_free(grid, source_node, nearest):
            return nearest
        
        return None
    
    def _is_collision_free(self, grid: Grid, from_node: SamplingNode, to_node: SamplingNode) -> bool:
        """Check if path between nodes is collision-free."""
        num_samples = max(10, int(from_node.distance_to(to_node) * 2))
        
        for i in range(num_samples + 1):
            t = i / num_samples
            x = from_node.x + t * (to_node.x - from_node.x)
            y = from_node.y + t * (to_node.y - from_node.y)
            
            grid_x = int(round(x))
            grid_y = int(round(y))
            
            if not grid.is_valid_position(grid_x, grid_y) or not grid.is_walkable(grid_x, grid_y):
                return False
        
        return True
    
    def _construct_bidirectional_path(self, start_connection: SamplingNode, 
                                    goal_connection: SamplingNode) -> List[Tuple[float, float]]:
        """Construct path from bidirectional connection."""
        # Path from start to connection point
        start_path = []
        current = start_connection
        while current is not None:
            start_path.append(current.position)
            current = current.parent
        start_path.reverse()
        
        # Path from connection point to goal
        goal_path = []
        current = goal_connection
        while current is not None:
            goal_path.append(current.position)
            current = current.parent
        
        # Combine paths
        return start_path + goal_path