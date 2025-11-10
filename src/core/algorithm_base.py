"""
Base classes and interfaces for pathfinding algorithms.
Defines common structure and contracts for all pathfinding implementations.
"""

from abc import ABC, abstractmethod
from typing import List, Tuple, Optional, Dict, Any
import time
from enum import Enum

from .grid import Grid
from .node import GridNode


class AlgorithmCategory(Enum):
    """Categories of pathfinding algorithms."""
    CLASSICAL = "Classical"
    ANY_ANGLE = "Any-Angle"
    OPTIMIZED = "Optimized"
    DYNAMIC = "Dynamic/Incremental"
    SAMPLING = "Sampling-Based"


class PathfindingResult:
    """
    Result container for pathfinding operations.
    Contains path, performance metrics, and algorithm-specific data.
    """
    
    def __init__(self):
        # Path information
        self.path: List[Tuple[float, float]] = []
        self.path_length: float = 0.0
        self.path_cost: float = 0.0
        
        # Performance metrics
        self.execution_time: float = 0.0
        self.nodes_expanded: int = 0
        self.nodes_visited: int = 0
        self.memory_usage: int = 0  # Peak number of nodes in memory
        
        # Search information
        self.found: bool = False
        self.iterations: int = 0
        self.max_open_set_size: int = 0
        
        # Algorithm-specific data
        self.algorithm_data: Dict[str, Any] = {}
        
        # Error information
        self.error_message: Optional[str] = None
    
    def calculate_path_length(self):
        """Calculate the total length of the path."""
        if len(self.path) < 2:
            self.path_length = 0.0
            return
        
        total_length = 0.0
        for i in range(1, len(self.path)):
            x1, y1 = self.path[i-1]
            x2, y2 = self.path[i]
            dx, dy = x2 - x1, y2 - y1
            total_length += (dx * dx + dy * dy) ** 0.5
        
        self.path_length = total_length
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary for serialization."""
        return {
            'path': self.path,
            'path_length': self.path_length,
            'path_cost': self.path_cost,
            'execution_time': self.execution_time,
            'nodes_expanded': self.nodes_expanded,
            'nodes_visited': self.nodes_visited,
            'memory_usage': self.memory_usage,
            'found': self.found,
            'iterations': self.iterations,
            'max_open_set_size': self.max_open_set_size,
            'algorithm_data': self.algorithm_data,
            'error_message': self.error_message
        }


class PathfindingAlgorithm(ABC):
    """
    Abstract base class for all pathfinding algorithms.
    Defines the interface and common functionality.
    """
    
    def __init__(self, name: str, category: AlgorithmCategory):
        self.name = name
        self.category = category
        
        # Performance tracking
        self._start_time: float = 0.0
        self._nodes_expanded: int = 0
        self._nodes_visited: int = 0
        self._max_memory: int = 0
        self._iterations: int = 0
    
    @abstractmethod
    def find_path(self, grid: Grid, start: Tuple[int, int], goal: Tuple[int, int]) -> PathfindingResult:
        """
        Find a path from start to goal using this algorithm.
        
        Args:
            grid: The grid to search on
            start: Starting position (x, y)
            goal: Goal position (x, y)
        
        Returns:
            PathfindingResult containing path and performance metrics
        """
        pass
    
    def _start_timing(self):
        """Start performance timing."""
        self._start_time = time.perf_counter()
        self._nodes_expanded = 0
        self._nodes_visited = 0
        self._max_memory = 0
        self._iterations = 0
    
    def _create_result(self, path: List[Tuple[float, float]], found: bool, 
                      error_message: Optional[str] = None) -> PathfindingResult:
        """Create a PathfindingResult with current metrics."""
        result = PathfindingResult()
        
        # Set path information
        result.path = path
        result.found = found
        result.error_message = error_message
        
        if path:
            result.calculate_path_length()
        
        # Set performance metrics
        result.execution_time = time.perf_counter() - self._start_time
        result.nodes_expanded = self._nodes_expanded
        result.nodes_visited = self._nodes_visited
        result.memory_usage = self._max_memory
        result.iterations = self._iterations
        
        return result
    
    def _expand_node(self):
        """Increment expanded node counter."""
        self._nodes_expanded += 1
    
    def _visit_node(self):
        """Increment visited node counter."""
        self._nodes_visited += 1
    
    def _update_memory_usage(self, current_size: int):
        """Update maximum memory usage."""
        self._max_memory = max(self._max_memory, current_size)
    
    def _increment_iteration(self):
        """Increment iteration counter."""
        self._iterations += 1
    
    def get_heuristic(self, node: GridNode, goal_node: GridNode, heuristic_type: str = "euclidean") -> float:
        """
        Calculate heuristic distance between nodes.
        
        Args:
            node: Current node
            goal_node: Goal node
            heuristic_type: Type of heuristic ("manhattan", "euclidean", "diagonal")
        
        Returns:
            Heuristic distance
        """
        if heuristic_type == "manhattan":
            return node.manhattan_distance(goal_node)
        elif heuristic_type == "euclidean":
            return node.euclidean_distance(goal_node)
        elif heuristic_type == "diagonal":
            return node.diagonal_distance(goal_node)
        else:
            return node.euclidean_distance(goal_node)
    
    def validate_inputs(self, grid: Grid, start: Tuple[int, int], goal: Tuple[int, int]) -> Optional[str]:
        """
        Validate input parameters.
        
        Returns:
            Error message if validation fails, None otherwise
        """
        # Check if positions are valid
        if not grid.is_valid_position(start[0], start[1]):
            return f"Start position {start} is outside grid bounds"
        
        if not grid.is_valid_position(goal[0], goal[1]):
            return f"Goal position {goal} is outside grid bounds"
        
        # Check if positions are walkable
        if not grid.is_walkable(start[0], start[1]):
            return f"Start position {start} is not walkable"
        
        if not grid.is_walkable(goal[0], goal[1]):
            return f"Goal position {goal} is not walkable"
        
        return None
    
    def __str__(self):
        return f"{self.name} ({self.category.value})"
    
    def __repr__(self):
        return f"PathfindingAlgorithm(name='{self.name}', category={self.category})"


class HeuristicFunction:
    """Helper class for heuristic functions."""
    
    @staticmethod
    def manhattan(x1: float, y1: float, x2: float, y2: float) -> float:
        """Manhattan distance heuristic."""
        return abs(x1 - x2) + abs(y1 - y2)
    
    @staticmethod
    def euclidean(x1: float, y1: float, x2: float, y2: float) -> float:
        """Euclidean distance heuristic."""
        dx = x1 - x2
        dy = y1 - y2
        return (dx * dx + dy * dy) ** 0.5
    
    @staticmethod
    def diagonal(x1: float, y1: float, x2: float, y2: float) -> float:
        """Diagonal (Chebyshev) distance heuristic."""
        return max(abs(x1 - x2), abs(y1 - y2))
    
    @staticmethod
    def octile(x1: float, y1: float, x2: float, y2: float) -> float:
        """Octile distance heuristic (combination of diagonal and straight)."""
        dx = abs(x1 - x2)
        dy = abs(y1 - y2)
        return (dx + dy) + ((2 ** 0.5) - 2) * min(dx, dy)