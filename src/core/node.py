"""
Core node classes for pathfinding algorithms.
Provides different node types for various pathfinding scenarios.
"""

from typing import Optional, Tuple, Set
import math


class GridNode:
    """
    Basic grid node for standard pathfinding algorithms.
    Represents a position in a discrete grid.
    """
    
    def __init__(self, x: int, y: int, walkable: bool = True):
        self.x = x
        self.y = y
        self.walkable = walkable
        
        # Pathfinding properties
        self.g_cost = float('inf')  # Cost from start
        self.h_cost = 0.0          # Heuristic cost to goal
        self.f_cost = float('inf')  # Total cost (g + h)
        self.parent: Optional['GridNode'] = None
        
        # Algorithm-specific properties
        self.visited = False
        self.in_open_set = False
        
    @property
    def position(self) -> Tuple[int, int]:
        """Get the position as a tuple."""
        return (self.x, self.y)
    
    def reset(self):
        """Reset node for new pathfinding operation."""
        self.g_cost = float('inf')
        self.h_cost = 0.0
        self.f_cost = float('inf')
        self.parent = None
        self.visited = False
        self.in_open_set = False
    
    def manhattan_distance(self, other: 'GridNode') -> float:
        """Calculate Manhattan distance to another node."""
        return abs(self.x - other.x) + abs(self.y - other.y)
    
    def euclidean_distance(self, other: 'GridNode') -> float:
        """Calculate Euclidean distance to another node."""
        dx = self.x - other.x
        dy = self.y - other.y
        return math.sqrt(dx * dx + dy * dy)
    
    def diagonal_distance(self, other: 'GridNode') -> float:
        """Calculate diagonal distance (Chebyshev) to another node."""
        dx = abs(self.x - other.x)
        dy = abs(self.y - other.y)
        return max(dx, dy)
    
    def __lt__(self, other):
        """For priority queue comparison."""
        return self.f_cost < other.f_cost
    
    def __eq__(self, other):
        """Node equality based on position."""
        return isinstance(other, GridNode) and self.x == other.x and self.y == other.y
    
    def __hash__(self):
        """Hash based on position for use in sets/dicts."""
        return hash((self.x, self.y))
    
    def __repr__(self):
        return f"GridNode({self.x}, {self.y}, walkable={self.walkable})"


class AngleNode(GridNode):
    """
    Extended node for any-angle pathfinding algorithms like Theta*.
    Supports line-of-sight checks and parent coordinates.
    """
    
    def __init__(self, x: int, y: int, walkable: bool = True):
        super().__init__(x, y, walkable)
        self.parent_x: Optional[float] = None
        self.parent_y: Optional[float] = None
    
    def set_parent_coordinates(self, parent_x: float, parent_y: float):
        """Set parent coordinates for any-angle pathfinding."""
        self.parent_x = parent_x
        self.parent_y = parent_y
    
    def get_parent_coordinates(self) -> Optional[Tuple[float, float]]:
        """Get parent coordinates if set."""
        if self.parent_x is not None and self.parent_y is not None:
            return (self.parent_x, self.parent_y)
        return None
    
    def reset(self):
        """Reset node including any-angle specific properties."""
        super().reset()
        self.parent_x = None
        self.parent_y = None


class DynamicNode(GridNode):
    """
    Node for dynamic pathfinding algorithms like D* and LPA*.
    Includes additional properties for incremental search.
    """
    
    def __init__(self, x: int, y: int, walkable: bool = True):
        super().__init__(x, y, walkable)
        
        # D* and LPA* specific properties
        self.rhs = float('inf')  # Right-hand side value
        self.key = (float('inf'), float('inf'))  # Priority key
        self.in_queue = False
        
        # Change detection
        self.cost_changed = False
        self.last_updated = 0
    
    def calculate_key(self, start_node: 'DynamicNode', heuristic_weight: float = 1.0):
        """Calculate priority key for D* algorithms."""
        min_g_rhs = min(self.g_cost, self.rhs)
        k1 = min_g_rhs + heuristic_weight * self.euclidean_distance(start_node)
        k2 = min_g_rhs
        self.key = (k1, k2)
        return self.key
    
    def is_consistent(self) -> bool:
        """Check if node is locally consistent."""
        return abs(self.g_cost - self.rhs) < 1e-6
    
    def reset(self):
        """Reset node including dynamic algorithm properties."""
        super().reset()
        self.rhs = float('inf')
        self.key = (float('inf'), float('inf'))
        self.in_queue = False
        self.cost_changed = False


class SamplingNode:
    """
    Node for sampling-based algorithms like RRT.
    Represents a point in continuous space.
    """
    
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y
        self.parent: Optional['SamplingNode'] = None
        self.children: Set['SamplingNode'] = set()
        self.cost = 0.0
    
    @property
    def position(self) -> Tuple[float, float]:
        """Get the position as a tuple."""
        return (self.x, self.y)
    
    def distance_to(self, other: 'SamplingNode') -> float:
        """Calculate Euclidean distance to another node."""
        dx = self.x - other.x
        dy = self.y - other.y
        return math.sqrt(dx * dx + dy * dy)
    
    def add_child(self, child: 'SamplingNode'):
        """Add a child node."""
        self.children.add(child)
        child.parent = self
    
    def remove_child(self, child: 'SamplingNode'):
        """Remove a child node."""
        if child in self.children:
            self.children.remove(child)
            child.parent = None
    
    def get_path_to_root(self) -> list['SamplingNode']:
        """Get path from this node to root."""
        path = []
        current = self
        while current is not None:
            path.append(current)
            current = current.parent
        return list(reversed(path))
    
    def __eq__(self, other):
        """Node equality based on position with tolerance."""
        if not isinstance(other, SamplingNode):
            return False
        return abs(self.x - other.x) < 1e-6 and abs(self.y - other.y) < 1e-6
    
    def __hash__(self):
        """Hash based on rounded position."""
        return hash((round(self.x, 6), round(self.y, 6)))
    
    def __repr__(self):
        return f"SamplingNode({self.x:.2f}, {self.y:.2f})"