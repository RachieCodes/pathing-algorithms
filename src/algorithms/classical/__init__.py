"""
Classical pathfinding algorithms module.
Contains fundamental algorithms like A*, Dijkstra, and their variants.
"""

from .astar import AStar, WeightedAStar, BidirectionalAStar
from .dijkstra import Dijkstra, UniformCostSearch, DijkstraAllPaths

__all__ = [
    'AStar', 'WeightedAStar', 'BidirectionalAStar',
    'Dijkstra', 'UniformCostSearch', 'DijkstraAllPaths'
]