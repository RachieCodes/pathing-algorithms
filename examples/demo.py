"""
Pathfinding Algorithms Demonstration
Comprehensive showcase and comparison of all implemented algorithms.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.core import Grid, AngleGrid, AlgorithmCategory
from src.algorithms.classical import AStar, WeightedAStar, Dijkstra
from src.algorithms.any_angle import ThetaStar, BasicThetaStar
from src.algorithms.optimized import JumpPointSearch, IDAStar
from src.algorithms.sampling import RRT, RRTStar
from src.benchmarks.comparison import AlgorithmBenchmark, BenchmarkConfig, TestScenario


def create_demo_grid(width: int = 20, height: int = 20) -> Grid:
    """Create a demonstration grid with interesting obstacles."""
    grid = Grid(width, height)
    
    # Add some strategic obstacles to make pathfinding interesting
    # Vertical wall with gap
    for y in range(5, 15):
        if y != 10:  # Leave a gap
            grid.set_walkable(8, y, False)
    
    # Horizontal wall with gap
    for x in range(5, 15):
        if x != 10:  # Leave a gap
            grid.set_walkable(x, 8, False)
    
    # Some random obstacles
    obstacles = [(3, 3), (16, 3), (3, 16), (16, 16), (12, 12), (6, 14)]
    for x, y in obstacles:
        if grid.is_valid_position(x, y):
            grid.set_walkable(x, y, False)
    
    return grid


def demonstrate_algorithm(algorithm, grid, start, goal, algorithm_name):
    """Demonstrate a single algorithm and print results."""
    print(f"\\n{'='*50}")
    print(f"Testing: {algorithm_name}")
    print(f"Category: {algorithm.category.value}")
    print('='*50)
    
    try:
        result = algorithm.find_path(grid, start, goal)
        
        if result.found:
            print(f"✓ Path found!")
            print(f"  Path length: {result.path_length:.2f}")
            print(f"  Execution time: {result.execution_time*1000:.2f} ms")
            print(f"  Nodes expanded: {result.nodes_expanded}")
            print(f"  Nodes visited: {result.nodes_visited}")
            print(f"  Memory usage: {result.memory_usage}")
            print(f"  Path steps: {len(result.path)}")
            
            if result.algorithm_data:
                print(f"  Algorithm-specific data: {result.algorithm_data}")
            
            # Print first few path steps
            if len(result.path) > 0:
                print(f"  Path preview: {result.path[:min(5, len(result.path))]}{'...' if len(result.path) > 5 else ''}")
        
        else:
            print(f"✗ No path found")
            if result.error_message:
                print(f"  Error: {result.error_message}")
            print(f"  Execution time: {result.execution_time*1000:.2f} ms")
            print(f"  Nodes expanded: {result.nodes_expanded}")
    
    except Exception as e:
        print(f"✗ Algorithm failed with error: {str(e)}")


def run_comprehensive_demo():
    """Run comprehensive demonstration of all algorithms."""
    print("🚀 PATHFINDING ALGORITHMS COMPREHENSIVE DEMONSTRATION")
    print("="*60)
    
    # Create test environment
    print("\\n📊 Setting up test environment...")
    grid = create_demo_grid(20, 20)
    angle_grid = AngleGrid(20, 20)
    
    # Copy obstacles to angle grid
    for y in range(grid.height):
        for x in range(grid.width):
            if not grid.is_walkable(x, y):
                angle_grid.set_walkable(x, y, False)
    
    start = (2, 2)
    goal = (17, 17)
    
    print(f"Grid size: {grid.width}x{grid.height}")
    print(f"Start position: {start}")
    print(f"Goal position: {goal}")
    
    # Test Classical Algorithms
    print("\\n\\n🎯 CLASSICAL ALGORITHMS")
    print("="*40)
    
    algorithms_classical = [
        (AStar(), "A* (Optimal with heuristic)"),
        (WeightedAStar(heuristic_weight=1.5), "Weighted A* (Faster, suboptimal)"),
        (Dijkstra(), "Dijkstra (Optimal, no heuristic)")
    ]
    
    for algorithm, name in algorithms_classical:
        demonstrate_algorithm(algorithm, grid, start, goal, name)
    
    # Test Any-Angle Algorithms
    print("\\n\\n🌟 ANY-ANGLE ALGORITHMS")
    print("="*40)
    
    algorithms_any_angle = [
        (ThetaStar(), "Theta* (Any-angle optimal)"),
        (BasicThetaStar(), "Basic Theta* (Simplified)")
    ]
    
    for algorithm, name in algorithms_any_angle:
        demonstrate_algorithm(algorithm, angle_grid, start, goal, name)
    
    # Test Optimized Algorithms
    print("\\n\\n⚡ OPTIMIZED ALGORITHMS")
    print("="*40)
    
    algorithms_optimized = [
        (JumpPointSearch(), "Jump Point Search (Fast A*)"),
        (IDAStar(max_iterations=1000), "IDA* (Memory efficient)")
    ]
    
    for algorithm, name in algorithms_optimized:
        demonstrate_algorithm(algorithm, grid, start, goal, name)
    
    # Test Sampling-Based Algorithms
    print("\\n\\n🎲 SAMPLING-BASED ALGORITHMS")
    print("="*40)
    
    algorithms_sampling = [
        (RRT(max_iterations=1000, seed=42), "RRT (Rapidly Exploring Random Trees)"),
        (RRTStar(max_iterations=1000, seed=42), "RRT* (Asymptotically optimal RRT)")
    ]
    
    for algorithm, name in algorithms_sampling:
        demonstrate_algorithm(algorithm, grid, start, goal, name)


def run_performance_comparison():
    """Run a quick performance comparison."""
    print("\\n\\n📈 PERFORMANCE COMPARISON")
    print("="*50)
    
    # Create benchmark configuration for quick test
    config = BenchmarkConfig(
        grid_sizes=[(20, 20), (30, 30)],
        obstacle_densities=[0.2],
        num_trials=3,
        scenarios=[TestScenario.RANDOM_OBSTACLES, TestScenario.MAZE_LIKE],
        algorithms=[AStar, WeightedAStar, Dijkstra, JumpPointSearch],
        timeout_seconds=5.0
    )
    
    benchmark = AlgorithmBenchmark(config)
    
    print("Running quick benchmark (this may take a moment)...")
    results = benchmark.run_comprehensive_benchmark()
    
    # Print summary
    benchmark.print_summary()
    
    return results


def print_algorithm_guide():
    """Print a guide for choosing algorithms."""
    print("\\n\\n📚 ALGORITHM SELECTION GUIDE")
    print("="*50)
    
    guide = {
        "🎯 General Purpose": {
            "algorithm": "A*",
            "description": "Best overall choice for most applications",
            "when_to_use": "Grid-based pathfinding with moderate performance requirements",
            "pros": ["Optimal paths", "Good performance", "Well-studied"],
            "cons": ["Memory usage can be high", "Limited to grid movement"]
        },
        
        "⚡ Speed Critical": {
            "algorithm": "Jump Point Search",
            "description": "Dramatically faster than A* on open grids",
            "when_to_use": "Large grids with uniform costs and few obstacles",
            "pros": ["Very fast", "Optimal paths", "Low memory overhead"],
            "cons": ["Requires uniform costs", "Less effective with many obstacles"]
        },
        
        "💾 Memory Constrained": {
            "algorithm": "IDA*",
            "description": "Minimal memory usage with optimal paths",
            "when_to_use": "Embedded systems or when memory is severely limited",
            "pros": ["Very low memory", "Optimal paths", "Complete"],
            "cons": ["Can be slower", "Revisits nodes", "Time complexity can be high"]
        },
        
        "🎨 Smooth Paths": {
            "algorithm": "Theta*",
            "description": "Any-angle pathfinding for natural movement",
            "when_to_use": "Robotics, games requiring smooth character movement",
            "pros": ["Natural-looking paths", "Any-angle movement", "Shorter paths"],
            "cons": ["More complex", "Requires line-of-sight checks", "Slightly slower"]
        },
        
        "🌐 Complex Environments": {
            "algorithm": "RRT/RRT*",
            "description": "Sampling-based planning for complex spaces",
            "when_to_use": "High-dimensional spaces, complex obstacles, unknown environments",
            "pros": ["Handles complex geometry", "Probabilistically complete", "Good for exploration"],
            "cons": ["Non-deterministic", "May not find optimal paths", "Can be slow to converge"]
        },
        
        "🔄 Dynamic Environments": {
            "algorithm": "D* Lite",
            "description": "Efficient replanning when environment changes",
            "when_to_use": "Changing obstacles, real-time navigation, robotics",
            "pros": ["Efficient replanning", "Handles dynamic changes", "Incremental updates"],
            "cons": ["More complex implementation", "Initial planning overhead"]
        },
        
        "🚀 Suboptimal but Fast": {
            "algorithm": "Weighted A*",
            "description": "Faster pathfinding with bounded suboptimality",
            "when_to_use": "Real-time systems where speed > optimality",
            "pros": ["Faster than A*", "Bounded suboptimality", "Tunable performance"],
            "cons": ["Suboptimal paths", "Quality depends on weight choice"]
        }
    }
    
    for category, info in guide.items():
        print(f"\\n{category}")
        print(f"Algorithm: {info['algorithm']}")
        print(f"Description: {info['description']}")
        print(f"When to use: {info['when_to_use']}")
        print(f"Pros: {', '.join(info['pros'])}")
        print(f"Cons: {', '.join(info['cons'])}")


def main():
    """Main demonstration function."""
    print("Welcome to the Pathfinding Algorithms Demonstration!")
    print("This script showcases various pathfinding algorithms and their characteristics.\\n")
    
    try:
        # Run comprehensive demonstration
        run_comprehensive_demo()
        
        # Print algorithm selection guide
        print_algorithm_guide()
        
        # Ask user if they want to run performance comparison
        print("\\n" + "="*60)
        user_input = input("\\nWould you like to run a performance comparison? (y/n): ").lower().strip()
        
        if user_input == 'y' or user_input == 'yes':
            results = run_performance_comparison()
            
            # Save results
            save_input = input("\\nWould you like to save the benchmark results? (y/n): ").lower().strip()
            if save_input == 'y' or save_input == 'yes':
                filename = input("Enter filename (default: benchmark_results.json): ").strip()
                if not filename:
                    filename = "benchmark_results.json"
                
                benchmark = AlgorithmBenchmark()
                benchmark.results = results['raw_results']
                benchmark.save_results(filename)
        
        print("\\n🎉 Demonstration completed successfully!")
        print("\\n📖 For more information, check the documentation and source code.")
        print("📊 Consider running more comprehensive benchmarks for your specific use case.")
        
    except KeyboardInterrupt:
        print("\\n\\nDemonstration interrupted by user.")
    except Exception as e:
        print(f"\\n\\nError during demonstration: {str(e)}")
        print("Please check the installation and try again.")


if __name__ == "__main__":
    main()