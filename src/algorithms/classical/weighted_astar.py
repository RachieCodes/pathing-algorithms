from ...core.algorithm_base import PathfindingAlgorithm
from ...core.grid import Grid
import heapq
import math

class WeightedAStar(PathfindingAlgorithm):
    """
    Weighted A* algorithm implementation.
    
    Weighted A* trades optimality for speed by inflating the heuristic function.
    This makes the algorithm more greedy and generally faster, but the resulting
    path may not be optimal.
    """
    
    def __init__(self, weight=1.5, heuristic='euclidean'):
        """
        Initialize Weighted A* algorithm.
        
        Args:
            weight (float): Heuristic inflation factor (>1.0 for faster, less optimal paths)
            heuristic (str): Heuristic function to use ('manhattan', 'euclidean', 'octile')
        """
        super().__init__()
        self.weight = weight
        self.heuristic_type = heuristic
        self.visited_nodes = []
        self.open_nodes = []
    
    def find_path(self, grid, start, goal):
        """
        Find path using Weighted A* algorithm.
        
        Args:
            grid (Grid): The grid to search on
            start (tuple): Starting position (x, y)
            goal (tuple): Goal position (x, y)
            
        Returns:
            list: Path as list of (x, y) tuples, or None if no path found
        """
        self.visited_nodes = []
        self.open_nodes = []
        
        # Initialize data structures
        open_set = []
        closed_set = set()
        came_from = {}
        
        # Cost from start to each node
        g_score = {start: 0}
        # Estimated total cost through each node (weighted)
        f_score = {start: self.weight * self._heuristic(start, goal)}
        
        # Add start node to open set
        heapq.heappush(open_set, (f_score[start], start))
        self.open_nodes.append(start)
        
        while open_set:
            # Get node with lowest f_score
            current_f, current = heapq.heappop(open_set)
            
            # Skip if we've already processed this node
            if current in closed_set:
                continue
            
            # Mark as visited
            closed_set.add(current)
            self.visited_nodes.append(current)
            
            # Check if we reached the goal
            if current == goal:
                return self._reconstruct_path(came_from, current)
            
            # Examine neighbors
            for neighbor in self._get_neighbors(grid, current):
                if neighbor in closed_set:
                    continue
                
                # Calculate tentative g_score
                tentative_g = g_score[current] + self._distance(current, neighbor)
                
                # If this path to neighbor is better than any previous one
                if neighbor not in g_score or tentative_g < g_score[neighbor]:
                    # Record this path
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    f_score[neighbor] = tentative_g + self.weight * self._heuristic(neighbor, goal)
                    
                    # Add to open set if not already there
                    if neighbor not in [item[1] for item in open_set]:
                        heapq.heappush(open_set, (f_score[neighbor], neighbor))
                        self.open_nodes.append(neighbor)
        
        # No path found
        return None
    
    def _get_neighbors(self, grid, pos):
        """Get valid neighboring positions."""
        x, y = pos
        neighbors = []
        
        # 8-directional movement
        directions = [
            (-1, -1), (-1, 0), (-1, 1),
            (0, -1),           (0, 1),
            (1, -1),  (1, 0),  (1, 1)
        ]
        
        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            
            # Check bounds
            if 0 <= nx < grid.width and 0 <= ny < grid.height:
                # Check if not an obstacle
                if not grid.is_obstacle(nx, ny):
                    neighbors.append((nx, ny))
        
        return neighbors
    
    def _distance(self, pos1, pos2):
        """Calculate actual distance between two positions."""
        x1, y1 = pos1
        x2, y2 = pos2
        
        # Euclidean distance for diagonal movement
        return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    
    def _heuristic(self, pos1, pos2):
        """Calculate heuristic distance between two positions."""
        x1, y1 = pos1
        x2, y2 = pos2
        
        if self.heuristic_type == 'manhattan':
            return abs(x2 - x1) + abs(y2 - y1)
        elif self.heuristic_type == 'euclidean':
            return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        elif self.heuristic_type == 'octile':
            dx = abs(x2 - x1)
            dy = abs(y2 - y1)
            return max(dx, dy) + (math.sqrt(2) - 1) * min(dx, dy)
        else:
            # Default to Manhattan
            return abs(x2 - x1) + abs(y2 - y1)
    
    def _reconstruct_path(self, came_from, current):
        """Reconstruct path from goal to start."""
        path = [current]
        
        while current in came_from:
            current = came_from[current]
            path.append(current)
        
        path.reverse()
        return path
    
    def get_algorithm_info(self):
        """Get information about this algorithm."""
        return {
            'name': 'Weighted A*',
            'description': f'A* with heuristic weight of {self.weight}',
            'time_complexity': 'O(b^d)',
            'space_complexity': 'O(b^d)',
            'optimal': self.weight == 1.0,
            'complete': True,
            'heuristic': self.heuristic_type,
            'weight': self.weight
        }