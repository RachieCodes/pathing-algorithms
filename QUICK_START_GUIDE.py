"""
PATHFINDING ALGORITHMS - QUICK START GUIDE
==========================================

This guide shows how to use the comprehensive pathfinding algorithms framework.

## Basic Usage Examples

### 1. Simple A* Pathfinding
```python
from src import AStar, Grid

# Create a 20x20 grid
grid = Grid(20, 20)
grid.add_random_obstacles(0.2)  # 20% obstacles

# Create A* algorithm
algorithm = AStar()

# Find path
result = algorithm.find_path(grid, start=(0, 0), goal=(19, 19))

if result.found:
    print(f"Path found! Length: {result.path_length:.2f}")
    print(f"Execution time: {result.execution_time*1000:.2f} ms")
    print(f"Nodes expanded: {result.nodes_expanded}")
else:
    print(f"No path found: {result.error_message}")
```

### 2. Algorithm Comparison
```python
from src import AStar, WeightedAStar, JumpPointSearch, Grid

grid = Grid(30, 30)
grid.add_random_obstacles(0.15)

algorithms = [
    ("A*", AStar()),
    ("Weighted A*", WeightedAStar(heuristic_weight=1.5)),
    ("Jump Point Search", JumpPointSearch())
]

start, goal = (2, 2), (27, 27)

print("Algorithm Performance Comparison:")
for name, algorithm in algorithms:
    result = algorithm.find_path(grid, start, goal)
    if result.found:
        print(f"{name:20} | {result.path_length:6.2f} | {result.execution_time*1000:6.2f}ms")
```

### 3. Any-Angle Pathfinding
```python
from src import ThetaStar, AngleGrid

# Use AngleGrid for any-angle algorithms
grid = AngleGrid(25, 25)
grid.add_random_obstacles(0.1)

algorithm = ThetaStar()
result = algorithm.find_path(grid, start=(2, 2), goal=(22, 22))

# Theta* produces smoother, more natural paths
```

### 4. Comprehensive Benchmarking
```python
from src.benchmarks.comparison import AlgorithmBenchmark, BenchmarkConfig, TestScenario

# Configure benchmark
config = BenchmarkConfig(
    grid_sizes=[(20, 20), (50, 50)],
    obstacle_densities=[0.1, 0.2, 0.3],
    num_trials=5,
    scenarios=[TestScenario.OPEN_SPACE, TestScenario.MAZE_LIKE]
)

# Run comprehensive benchmark
benchmark = AlgorithmBenchmark(config)
results = benchmark.run_comprehensive_benchmark()

# Print results and save to file
benchmark.print_summary()
benchmark.save_results("my_benchmark_results.json")
```

### 5. Interactive Demo
```python
# Run the interactive demonstration
exec(open("examples/demo.py").read())
```

## Algorithm Selection Guide

### Choose A* when:
- General-purpose pathfinding
- Need optimal paths
- Grid-based movement is fine
- Memory usage is not critical

### Choose Jump Point Search when:
- Large grids (50x50+)
- Uniform movement costs
- Sparse obstacles
- Speed is critical

### Choose Theta* when:
- Smooth, natural movement needed
- Robotics applications
- Path aesthetics matter
- Can accept slight performance cost

### Choose Weighted A* when:
- Real-time constraints
- Bounded suboptimality acceptable
- Need tunable performance
- Speed over perfect optimality

### Choose IDA* when:
- Memory severely constrained
- Optimal paths required
- Can accept variable execution time
- Embedded systems

### Choose RRT when:
- Complex obstacle environments
- High-dimensional spaces
- Fast approximate solutions
- Exploration scenarios

## Performance Characteristics

Based on typical performance on a 50x50 grid with 20% obstacles:

| Algorithm | Speed | Memory | Path Quality | Best Use Case |
|-----------|-------|--------|--------------|---------------|
| A* | Good | Medium | Optimal | General purpose |
| Weighted A* | Fast | Medium | Good | Real-time |
| Dijkstra | Moderate | High | Optimal | Multiple goals |
| Jump Point Search | Very Fast | Low | Optimal | Large sparse grids |
| Theta* | Moderate | Medium | Optimal | Smooth paths |
| IDA* | Variable | Very Low | Optimal | Memory constrained |
| RRT | Fast | Low | Good | Complex environments |

## Advanced Usage

### Custom Heuristics
```python
algorithm = AStar(heuristic_type="manhattan")  # or "euclidean", "diagonal"
```

### Weighted Grids
```python
from src import WeightedGrid

grid = WeightedGrid(30, 30)
grid.set_terrain(10, 10, 'water')  # Higher movement cost
grid.set_terrain(15, 15, 'mud')    # Even higher cost
```

### Algorithm Parameters
```python
# Weighted A* with custom weight
weighted_astar = WeightedAStar(heuristic_weight=2.0)

# RRT with custom parameters
rrt = RRT(step_size=2.0, max_iterations=5000, goal_bias=0.2)

# Jump Point Search with custom heuristic
jps = JumpPointSearch(heuristic_type="diagonal")
```

### Error Handling
```python
result = algorithm.find_path(grid, start, goal)

if result.found:
    print(f"Success: {len(result.path)} steps")
else:
    print(f"Failed: {result.error_message}")
    
# Check performance metrics
print(f"Nodes expanded: {result.nodes_expanded}")
print(f"Memory usage: {result.memory_usage}")
print(f"Algorithm data: {result.algorithm_data}")
```

## Common Patterns

### Path Post-Processing
```python
# Get path coordinates
path_coords = result.path

# Calculate total distance
total_distance = result.path_length

# Get waypoints (every Nth point)
waypoints = path_coords[::5]  # Every 5th point
```

### Grid Setup Patterns
```python
# Open terrain with few obstacles
grid = Grid(100, 100)
grid.add_random_obstacles(0.05, seed=42)

# Maze-like environment  
grid = Grid(50, 50)
grid.add_maze_pattern()

# Custom obstacle placement
grid = Grid(30, 30)
for x in range(10, 20):
    grid.set_walkable(x, 15, False)  # Wall
```

### Performance Optimization
```python
# For repeated pathfinding on same grid
grid.reset_pathfinding_data()  # Clear previous search data

# Use appropriate grid type
grid = Grid(50, 50)          # Standard grid-based
angle_grid = AngleGrid(50, 50)  # Any-angle algorithms
dynamic_grid = DynamicGrid(50, 50)  # Changing environments
```

## Troubleshooting

### Common Issues:

1. **"No path exists"**
   - Check start/goal are walkable
   - Verify obstacles don't block all paths
   - Try different start/goal positions

2. **Poor performance**
   - Consider Jump Point Search for large sparse grids
   - Use Weighted A* for real-time requirements
   - Check obstacle density (>30% can slow algorithms)

3. **Memory issues**
   - Use IDA* for memory-constrained environments
   - Reduce grid size for testing
   - Check for memory leaks in custom code

4. **Suboptimal paths**
   - Ensure using optimal algorithm (A*, Dijkstra, Theta*)
   - Check heuristic admissibility
   - Verify grid setup is correct

### Getting Help:

- Check the comprehensive README.md
- Run examples/demo.py for interactive demonstration  
- Review algorithm-specific documentation in source files
- Use benchmarking tools to compare performance

## Next Steps

1. **Try the interactive demo**: `python examples/demo.py`
2. **Run benchmarks** on your specific scenarios
3. **Experiment with different algorithms** and parameters
4. **Integrate into your project** using the patterns above
5. **Extend with custom algorithms** using the base classes

The framework is designed to be both educational and production-ready.
Choose algorithms based on your specific requirements and use the
benchmarking tools to validate performance in your use cases.
"""

if __name__ == "__main__":
    print("PATHFINDING ALGORITHMS - QUICK START GUIDE")
    print("=" * 50)
    print()
    print("This comprehensive framework includes:")
    print("- 17+ pathfinding algorithms across multiple categories")
    print("- Performance benchmarking and comparison tools")
    print("- Detailed analysis and selection guidance")
    print("- Production-ready, extensible implementations")
    print()
    print("Run 'python examples/demo.py' for an interactive demonstration!")
    print("See the full guide above for detailed usage examples.")