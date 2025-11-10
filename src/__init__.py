"""
Pathfinding Algorithms Package
Comprehensive implementation and comparison framework for pathfinding algorithms.
"""

# Core components
from .core import (
    Grid, AngleGrid, DynamicGrid, WeightedGrid,
    GridNode, AngleNode, DynamicNode, SamplingNode,
    PathfindingAlgorithm, PathfindingResult, AlgorithmCategory, HeuristicFunction
)

# Classical algorithms
from .algorithms.classical import (
    AStar, WeightedAStar, BidirectionalAStar,
    Dijkstra, UniformCostSearch, DijkstraAllPaths
)

# Any-angle algorithms  
from .algorithms.any_angle import (
    ThetaStar, BasicThetaStar, LazyThetaStar,
    IncrementalPhiStar
)

# Optimized algorithms
from .algorithms.optimized import (
    JumpPointSearch, JumpPointSearchPlus,
    IDAStar, MemoryBoundedAStar, RecursiveBestFirstSearch
)

# Sampling-based algorithms
from .algorithms.sampling import (
    RRT, RRTStar, RRTConnect
)

# Benchmarking and analysis
from .benchmarks.comparison import (
    AlgorithmBenchmark, BenchmarkConfig, TestScenario
)

__version__ = "1.0.0"
__author__ = "Pathfinding Algorithms Project"
__description__ = "Comprehensive pathfinding algorithms implementation and comparison framework"

__all__ = [
    # Core
    'Grid', 'AngleGrid', 'DynamicGrid', 'WeightedGrid',
    'GridNode', 'AngleNode', 'DynamicNode', 'SamplingNode', 
    'PathfindingAlgorithm', 'PathfindingResult', 'AlgorithmCategory', 'HeuristicFunction',
    
    # Classical
    'AStar', 'WeightedAStar', 'BidirectionalAStar',
    'Dijkstra', 'UniformCostSearch', 'DijkstraAllPaths',
    
    # Any-angle
    'ThetaStar', 'BasicThetaStar', 'LazyThetaStar', 'IncrementalPhiStar',
    
    # Optimized
    'JumpPointSearch', 'JumpPointSearchPlus',
    'IDAStar', 'MemoryBoundedAStar', 'RecursiveBestFirstSearch',
    
    # Sampling
    'RRT', 'RRTStar', 'RRTConnect',
    
    # Benchmarking
    'AlgorithmBenchmark', 'BenchmarkConfig', 'TestScenario'
]


def get_algorithm_by_name(name: str) -> PathfindingAlgorithm:
    """
    Get an algorithm instance by name.
    
    Args:
        name: Algorithm name (case-insensitive)
        
    Returns:
        Algorithm instance
        
    Raises:
        ValueError: If algorithm name not recognized
    """
    algorithms = {
        'a*': AStar,
        'astar': AStar, 
        'weighted_a*': WeightedAStar,
        'weighted_astar': WeightedAStar,
        'dijkstra': Dijkstra,
        'theta*': ThetaStar,
        'thetastar': ThetaStar,
        'theta_star': ThetaStar,
        'jps': JumpPointSearch,
        'jump_point_search': JumpPointSearch,
        'ida*': IDAStar,
        'idastar': IDAStar,
        'ida_star': IDAStar,
        'rrt': RRT,
        'rrt*': RRTStar,
        'rrtstar': RRTStar,
        'rrt_star': RRTStar
    }
    
    name_lower = name.lower().replace(' ', '_')
    
    if name_lower in algorithms:
        return algorithms[name_lower]()
    
    raise ValueError(f"Unknown algorithm: {name}. Available: {list(algorithms.keys())}")


def list_algorithms() -> dict:
    """
    Get a dictionary of all available algorithms organized by category.
    
    Returns:
        Dictionary mapping categories to algorithm lists
    """
    return {
        "Classical": [
            ("A*", "Optimal heuristic search"),
            ("Weighted A*", "Faster A* with bounded suboptimality"),
            ("Dijkstra", "Uniform-cost search, optimal")
        ],
        "Any-Angle": [
            ("Theta*", "Optimal any-angle pathfinding"),
            ("Basic Theta*", "Simplified any-angle algorithm"),
            ("Lazy Theta*", "Deferred line-of-sight checking")
        ],
        "Optimized": [
            ("Jump Point Search", "Optimized A* for uniform grids"),
            ("IDA*", "Memory-efficient iterative deepening"),
            ("Recursive Best-First Search", "Memory-bounded search")
        ],
        "Sampling": [
            ("RRT", "Rapidly exploring random trees"),
            ("RRT*", "Asymptotically optimal RRT"),
            ("RRT-Connect", "Bidirectional RRT variant")
        ]
    }


def create_quick_demo():
    """
    Create a quick demonstration of the pathfinding framework.
    
    Returns:
        Dictionary with demo results
    """
    print("🚀 Quick Pathfinding Demo")
    print("="*30)
    
    # Create test grid
    grid = Grid(15, 15)
    grid.add_random_obstacles(0.2)
    
    start = (2, 2)
    goal = (12, 12)
    
    print(f"Grid: {grid.width}x{grid.height} with obstacles")
    print(f"Path: {start} → {goal}")
    print()
    
    # Test different algorithms
    algorithms = [
        ("A*", AStar()),
        ("Weighted A*", WeightedAStar(heuristic_weight=1.5)),
        ("Dijkstra", Dijkstra()),
        ("Jump Point Search", JumpPointSearch())
    ]
    
    results = {}
    
    for name, algorithm in algorithms:
        try:
            result = algorithm.find_path(grid, start, goal)
            
            if result.found:
                print(f"✓ {name:20} | Length: {result.path_length:6.2f} | Time: {result.execution_time*1000:6.2f}ms | Expanded: {result.nodes_expanded:4d}")
                results[name] = {
                    'success': True,
                    'length': result.path_length,
                    'time': result.execution_time,
                    'nodes_expanded': result.nodes_expanded
                }
            else:
                print(f"✗ {name:20} | No path found")
                results[name] = {'success': False}
                
        except Exception as e:
            print(f"✗ {name:20} | Error: {str(e)}")
            results[name] = {'success': False, 'error': str(e)}
    
    return results


if __name__ == "__main__":
    print(f"Pathfinding Algorithms Package v{__version__}")
    print(__description__)
    print()
    
    # Show available algorithms
    algorithms = list_algorithms()
    print("Available Algorithm Categories:")
    for category, algs in algorithms.items():
        print(f"\\n📂 {category}:")
        for alg_name, description in algs:
            print(f"  • {alg_name}: {description}")
    
    print()
    
    # Run quick demo
    demo_results = create_quick_demo()
    
    print("\\n💡 Quick Start:")
    print("from src import AStar, Grid")
    print("grid = Grid(20, 20)")
    print("algorithm = AStar()")  
    print("result = algorithm.find_path(grid, (0,0), (19,19))")
    
    print("\\n📊 For comprehensive benchmarking:")
    print("python examples/demo.py")
    
    print("\\n📖 See README.md for detailed documentation and examples")