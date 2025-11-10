"""
Grid representation for pathfinding algorithms.
Provides various grid types and utilities for different pathfinding scenarios.
"""

from typing import List, Tuple, Optional, Set, Callable
import random
import math
from .node import GridNode, AngleNode, DynamicNode


class Grid:
    """
    Basic grid for pathfinding algorithms.
    Supports rectangular grids with obstacles.
    """
    
    def __init__(self, width: int, height: int, node_class=GridNode):
        self.width = width
        self.height = height
        self.node_class = node_class
        
        # Initialize grid
        self.nodes: List[List[GridNode]] = []
        self._initialize_grid()
        
        # Movement patterns
        self.diagonal_movement = True
        self.diagonal_cost = math.sqrt(2)
        self.straight_cost = 1.0
    
    def _initialize_grid(self):
        """Initialize the grid with nodes."""
        self.nodes = []
        for y in range(self.height):
            row = []
            for x in range(self.width):
                row.append(self.node_class(x, y, walkable=True))
            self.nodes.append(row)
    
    def get_node(self, x: int, y: int) -> Optional[GridNode]:
        """Get node at position (x, y)."""
        if self.is_valid_position(x, y):
            return self.nodes[y][x]
        return None
    
    def is_valid_position(self, x: int, y: int) -> bool:
        """Check if position is within grid bounds."""
        return 0 <= x < self.width and 0 <= y < self.height
    
    def is_walkable(self, x: int, y: int) -> bool:
        """Check if position is walkable."""
        node = self.get_node(x, y)
        return node is not None and node.walkable
    
    def set_walkable(self, x: int, y: int, walkable: bool):
        """Set walkable status of a position."""
        node = self.get_node(x, y)
        if node:
            node.walkable = walkable
    
    def get_neighbors(self, node: GridNode) -> List[GridNode]:
        """Get walkable neighbors of a node."""
        neighbors = []
        
        # Define movement directions
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]  # 4-directional
        
        if self.diagonal_movement:
            directions.extend([(1, 1), (1, -1), (-1, 1), (-1, -1)])  # 8-directional
        
        for dx, dy in directions:
            new_x, new_y = node.x + dx, node.y + dy
            
            if self.is_walkable(new_x, new_y):
                neighbor = self.get_node(new_x, new_y)
                if neighbor:
                    neighbors.append(neighbor)
        
        return neighbors
    
    def get_movement_cost(self, from_node: GridNode, to_node: GridNode) -> float:
        """Get movement cost between two adjacent nodes."""
        dx = abs(to_node.x - from_node.x)
        dy = abs(to_node.y - from_node.y)
        
        # Diagonal movement
        if dx == 1 and dy == 1:
            return self.diagonal_cost
        # Straight movement
        elif (dx == 1 and dy == 0) or (dx == 0 and dy == 1):
            return self.straight_cost
        
        # Invalid movement
        return float('inf')
    
    def reset_pathfinding_data(self):
        """Reset all pathfinding data for nodes."""
        for row in self.nodes:
            for node in row:
                node.reset()
    
    def add_random_obstacles(self, obstacle_percentage: float = 0.2, seed: Optional[int] = None):
        """Add random obstacles to the grid."""
        if seed is not None:
            random.seed(seed)
        
        total_nodes = self.width * self.height
        num_obstacles = int(total_nodes * obstacle_percentage)
        
        for _ in range(num_obstacles):
            x = random.randint(0, self.width - 1)
            y = random.randint(0, self.height - 1)
            self.set_walkable(x, y, False)
    
    def add_maze_pattern(self):
        """Add a maze-like pattern of obstacles."""
        # Create maze walls
        for y in range(self.height):
            for x in range(self.width):
                # Create maze pattern
                if x % 2 == 1 and y % 2 == 1:
                    continue  # Keep pathways
                if x % 4 == 0 or y % 4 == 0:
                    self.set_walkable(x, y, False)
    
    def clear_obstacles(self):
        """Remove all obstacles from the grid."""
        for row in self.nodes:
            for node in row:
                node.walkable = True
    
    def get_path(self, goal_node: GridNode) -> List[Tuple[int, int]]:
        """Reconstruct path from goal node to start."""
        path = []
        current = goal_node
        
        while current is not None:
            path.append((current.x, current.y))
            current = current.parent
        
        return list(reversed(path))
    
    def __repr__(self):
        return f"Grid({self.width}x{self.height}, diagonal={self.diagonal_movement})"


class AngleGrid(Grid):
    """
    Grid for any-angle pathfinding algorithms.
    Supports line-of-sight checks and continuous movement.
    """
    
    def __init__(self, width: int, height: int):
        super().__init__(width, height, AngleNode)
    
    def has_line_of_sight(self, x1: float, y1: float, x2: float, y2: float) -> bool:
        """
        Check if there's a clear line of sight between two points.
        Uses Bresenham-like algorithm for grid traversal.
        """
        # Convert to integer grid coordinates
        ix1, iy1 = int(x1), int(y1)
        ix2, iy2 = int(x2), int(y2)
        
        # Use Bresenham's line algorithm
        dx = abs(ix2 - ix1)
        dy = abs(iy2 - iy1)
        
        x_step = 1 if ix1 < ix2 else -1
        y_step = 1 if iy1 < iy2 else -1
        
        x, y = ix1, iy1
        error = dx - dy
        
        while True:
            # Check current position
            if not self.is_walkable(x, y):
                return False
            
            if x == ix2 and y == iy2:
                break
            
            error2 = 2 * error
            
            if error2 > -dy:
                error -= dy
                x += x_step
            
            if error2 < dx:
                error += dx
                y += y_step
        
        return True
    
    def get_angle_path(self, goal_node: AngleNode) -> List[Tuple[float, float]]:
        """Reconstruct path using any-angle coordinates."""
        path = []
        current = goal_node
        
        while current is not None:
            # Use parent coordinates if available, otherwise node coordinates
            parent_coords = current.get_parent_coordinates()
            if parent_coords:
                path.append(parent_coords)
            else:
                path.append((float(current.x), float(current.y)))
            
            current = current.parent
        
        return list(reversed(path))


class DynamicGrid(Grid):
    """
    Grid for dynamic pathfinding algorithms.
    Supports cost changes and incremental updates.
    """
    
    def __init__(self, width: int, height: int):
        super().__init__(width, height, DynamicNode)
        self.update_counter = 0
    
    def update_node_cost(self, x: int, y: int, walkable: bool):
        """Update node cost and mark for replanning."""
        node = self.get_node(x, y)
        if node and isinstance(node, DynamicNode):
            if node.walkable != walkable:
                node.walkable = walkable
                node.cost_changed = True
                node.last_updated = self.update_counter
                self.update_counter += 1
    
    def get_changed_nodes(self) -> List[DynamicNode]:
        """Get list of nodes that have changed since last planning."""
        changed = []
        for row in self.nodes:
            for node in row:
                if isinstance(node, DynamicNode) and node.cost_changed:
                    changed.append(node)
        return changed
    
    def clear_change_flags(self):
        """Clear all change flags."""
        for row in self.nodes:
            for node in row:
                if isinstance(node, DynamicNode):
                    node.cost_changed = False


class WeightedGrid(Grid):
    """
    Grid with weighted terrain costs.
    Different terrain types have different movement costs.
    """
    
    TERRAIN_COSTS = {
        'grass': 1.0,
        'sand': 1.5,
        'mud': 2.0,
        'water': 3.0,
        'mountain': 4.0,
        'wall': float('inf')
    }
    
    def __init__(self, width: int, height: int):
        super().__init__(width, height)
        
        # Terrain type for each cell
        self.terrain: List[List[str]] = []
        self._initialize_terrain()
    
    def _initialize_terrain(self):
        """Initialize terrain types."""
        self.terrain = []
        for y in range(self.height):
            row = []
            for x in range(self.width):
                row.append('grass')  # Default terrain
            self.terrain.append(row)
    
    def set_terrain(self, x: int, y: int, terrain_type: str):
        """Set terrain type for a position."""
        if self.is_valid_position(x, y):
            self.terrain[y][x] = terrain_type
            
            # Update walkability
            cost = self.TERRAIN_COSTS.get(terrain_type, 1.0)
            walkable = cost != float('inf')
            self.set_walkable(x, y, walkable)
    
    def get_terrain_cost(self, x: int, y: int) -> float:
        """Get terrain cost for a position."""
        if self.is_valid_position(x, y):
            terrain_type = self.terrain[y][x]
            return self.TERRAIN_COSTS.get(terrain_type, 1.0)
        return float('inf')
    
    def get_movement_cost(self, from_node: GridNode, to_node: GridNode) -> float:
        """Get movement cost including terrain cost."""
        base_cost = super().get_movement_cost(from_node, to_node)
        
        if base_cost == float('inf'):
            return base_cost
        
        # Average terrain cost of both nodes
        from_terrain = self.get_terrain_cost(from_node.x, from_node.y)
        to_terrain = self.get_terrain_cost(to_node.x, to_node.y)
        terrain_cost = (from_terrain + to_terrain) / 2
        
        return base_cost * terrain_cost