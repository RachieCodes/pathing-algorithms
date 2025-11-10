# Pathfinding Algorithms Comprehensive Comparison

A complete implementation and analysis framework for pathfinding algorithms, featuring detailed comparisons, performance benchmarks, and practical guidance for algorithm selection.

## Overview

This project provides a comprehensive comparison of pathfinding algorithms across multiple categories:

- **Classical Algorithms**: A*, Dijkstra, Weighted A*
- **Any-Angle Algorithms**: Theta*, Incremental Phi*
- **Optimized Variants**: Jump Point Search, IDA*
- **Sampling-Based**: RRT, RRT*, RRT-Connect

Each algorithm is implemented with detailed documentation, performance metrics, and practical examples to help you choose the right approach for your specific use case.

## Quick Start

### Web Interface (Recommended)

The easiest way to explore and compare algorithms is through the interactive web interface:

```bash
# Start the web visualizer
python run_web_demo.py

# Open browser to: http://127.0.0.1:5000
```

Features:
- Interactive grid editor with maze generation
- Real-time algorithm visualization
- Performance comparison between algorithms
- Multiple maze patterns (random, corridors, spirals, rooms)

### Python API

```python
from src.algorithms.classical import AStar
from src.core import Grid

# Create a grid and algorithm
grid = Grid(20, 20)
algorithm = AStar()

# Find path
result = algorithm.find_path(grid, start=(0, 0), goal=(19, 19))

if result.found:
    print(f"Path found! Length: {result.path_length:.2f}")
    print(f"Execution time: {result.execution_time*1000:.2f} ms")
    print(f"Path: {result.path}")
```

## Algorithm Comparison Summary

| Algorithm | Category | Optimality | Memory | Speed | Best Use Case |
|-----------|----------|------------|---------|-------|---------------|
| **A*** | Classical | ✅ Optimal | Medium | Good | General purpose |
| **Dijkstra** | Classical | ✅ Optimal | Medium | Moderate | Multiple goals |
| **Weighted A*** | Classical | ❌ Suboptimal | Medium | Fast | Real-time systems |
| **Theta*** | Any-Angle | ✅ Optimal | Medium | Moderate | Smooth paths |
| **Jump Point Search** | Optimized | ✅ Optimal | Low | Very Fast | Large open grids |
| **IDA*** | Optimized | ✅ Optimal | Very Low | Variable | Memory-constrained |
| **RRT** | Sampling | ❌ Probabilistic | Low | Fast | Complex environments |


```

## Performance Characteristics

### Speed Comparison (Relative to A*)
- **Jump Point Search**: 5-20x faster on open grids
- **Weighted A***: 2-5x faster (with quality trade-off)
- **Dijkstra**: 0.8-1.2x (similar performance)
- **Theta***: 0.6-0.9x (line-of-sight overhead)
- **IDA***: 0.3-2x (highly variable)
- **RRT**: 0.1-10x (depends on convergence)

### Memory Usage (Relative to A*)
- **IDA***: ~0.01x (constant memory)
- **Jump Point Search**: ~0.3x (fewer nodes)
- **RRT**: ~0.1-0.5x (tree structure)
- **A*/Dijkstra/Theta***: 1x (baseline)

### Path Quality
- **Optimal**: A*, Dijkstra, Theta*, JPS, IDA*
- **Bounded Suboptimal**: Weighted A* (bounded by weight factor)
- **Probabilistic**: RRT family (converges to optimal over time)

## Algorithm Categories

### Classical Algorithms
Perfect for most grid-based pathfinding scenarios with well-understood performance characteristics.

- **A***: The gold standard - optimal, efficient, and reliable
- **Dijkstra**: Best for finding paths to multiple goals
- **Weighted A***: When you need speed over perfect optimality

### Any-Angle Algorithms  
For scenarios requiring natural, smooth movement not constrained to grid edges.

- **Theta***: Allows movement at any angle with optimal paths
- **Basic Theta***: Simplified version for educational purposes
- **Lazy Theta***: Deferred line-of-sight checking for better performance

### Optimized Variants
Specialized algorithms for specific performance requirements.

- **Jump Point Search**: Dramatically faster A* for uniform-cost grids
- **IDA***: Memory-efficient optimal pathfinding
- **Memory-Bounded A***: Controlled memory usage with quality guarantees

### Sampling-Based Algorithms
Best for complex, high-dimensional, or unknown environments.

- **RRT**: Fast exploration of complex spaces
- **RRT***: Asymptotically optimal sampling-based planning
- **RRT-Connect**: Bidirectional variant for faster convergence

## 🛠️ Usage Examples

### Basic Pathfinding
```python
from src.algorithms.classical import AStar
from src.core import Grid

# Create and configure grid
grid = Grid(50, 50)
grid.add_random_obstacles(0.2)  # 20% obstacles

# Find path
algorithm = AStar(heuristic_type="euclidean")
result = algorithm.find_path(grid, start=(5, 5), goal=(45, 45))

if result.found:
    print(f"Success! Path length: {result.path_length}")
```

### Any-Angle Pathfinding
```python
from src.algorithms.any_angle import ThetaStar
from src.core import AngleGrid

# Any-angle pathfinding requires AngleGrid
grid = AngleGrid(30, 30)
grid.add_random_obstacles(0.15)

algorithm = ThetaStar()
result = algorithm.find_path(grid, start=(2, 2), goal=(27, 27))

# Theta* produces smoother paths with any-angle movement
```

### Performance Optimization
```python
from src.algorithms.optimized import JumpPointSearch

# JPS is excellent for large, sparsely populated grids
grid = Grid(200, 200)
grid.add_random_obstacles(0.1)  # Light obstacles

algorithm = JumpPointSearch()
result = algorithm.find_path(grid, start=(10, 10), goal=(190, 190))

# Expect 5-20x speedup compared to A* on suitable grids
```

### Complex Environment Navigation
```python
from src.algorithms.sampling import RRTStar

# RRT* handles complex obstacle configurations well
grid = Grid(40, 40)
# Add complex obstacle pattern
algorithm = RRTStar(max_iterations=2000, rewiring_radius=3.0)

result = algorithm.find_path(grid, start=(5, 5), goal=(35, 35))
```

## Running Benchmarks

Run comprehensive performance comparisons:

```python
from src.benchmarks.comparison import AlgorithmBenchmark, BenchmarkConfig

# Configure benchmark
config = BenchmarkConfig(
    grid_sizes=[(20, 20), (50, 50), (100, 100)],
    obstacle_densities=[0.1, 0.2, 0.3],
    num_trials=10
)

# Run benchmark
benchmark = AlgorithmBenchmark(config)
results = benchmark.run_comprehensive_benchmark()

# Print results
benchmark.print_summary()
benchmark.save_results("benchmark_results.json")
```

## Interactive Demo

Run the comprehensive demonstration:

```bash
python examples/demo.py
```

This will showcase all algorithms with:
- Performance comparisons
- Visual path representations  
- Algorithm selection guidance
- Interactive benchmarking options

## Algorithm Selection Guide

### Choose A* when:
- You need optimal paths
- Grid-based movement is acceptable
- Memory usage is not critical
- General-purpose pathfinding

### Choose Jump Point Search when:
- Large grids (100x100+)
- Uniform movement costs
- Sparse obstacles
- Speed is critical

### Choose Theta* when:
- Natural movement is important
- You can accept slight performance cost
- Path smoothness matters
- Robotics or game character movement

### Choose IDA* when:
- Memory is severely constrained
- Optimal paths are required
- You can accept variable execution time
- Embedded systems

### Choose RRT when:
- Complex obstacle environments
- High-dimensional spaces
- Unknown environments (exploration)
- Fast approximate solutions are acceptable

### Choose Weighted A* when:
- Real-time constraints
- Bounded suboptimality is acceptable
- You need tunable performance
- Speed over perfect optimality

## Technical Details

### Heuristic Functions
All algorithms support multiple heuristic types:
- **Euclidean**: Best for diagonal movement
- **Manhattan**: Best for 4-directional movement  
- **Diagonal**: Octile distance for 8-directional
- **Custom**: Implement your own heuristic

### Grid Types
- **Grid**: Standard discrete grid
- **AngleGrid**: Supports line-of-sight for any-angle algorithms
- **DynamicGrid**: Handles changing costs for dynamic algorithms
- **WeightedGrid**: Different terrain costs

### Performance Metrics
Each algorithm tracks:
- Execution time
- Memory usage (peak nodes in memory)
- Nodes expanded/visited
- Path length and cost
- Algorithm-specific metrics

## Research References

Key papers and resources for each algorithm:

- **A***: Hart, P. E.; Nilsson, N. J.; Raphael, B. (1968)
- **Theta***: Nash, A.; Daniel, K.; Koenig, S.; Felner, A. (2007)
- **Jump Point Search**: Harabor, D.; Grastien, A. (2011)
- **IDA***: Korf, R. E. (1985)
- **RRT**: LaValle, S. M. (1998)
- **D***: Stentz, A. (1994)


## License

This project is provided for educational and research purposes. See individual algorithm implementations for specific licensing considerations.

## Conclusion

This comprehensive comparison framework provides everything needed to understand, implement, and choose the right pathfinding algorithm for your specific requirements. Each algorithm has its strengths and ideal use cases - use the benchmarking tools and guidance provided to make informed decisions for your projects.
