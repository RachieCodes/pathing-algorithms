from flask import Flask, render_template, jsonify, request
import sys
import os
import importlib

# Add the parent directory to the Python path to import our algorithms
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Dynamic imports to handle missing modules gracefully
def try_import(module_path, class_name):
    """Try to import a class, return None if import fails."""
    try:
        module = importlib.import_module(module_path)
        return getattr(module, class_name)
    except (ImportError, AttributeError) as e:
        print(f"Warning: Could not import {class_name} from {module_path}: {e}")
        return None

app = Flask(__name__)

# Try to import all algorithm classes
AStar = try_import('src.algorithms.classical.astar', 'AStar')
WeightedAStar = try_import('src.algorithms.classical.weighted_astar', 'WeightedAStar')
Dijkstra = try_import('src.algorithms.classical.dijkstra', 'Dijkstra')
ThetaStar = try_import('src.algorithms.any_angle.theta_star', 'ThetaStar')
JumpPointSearch = try_import('src.algorithms.optimized.jump_point_search', 'JumpPointSearch')
IDAStar = try_import('src.algorithms.optimized.ida_star', 'IDAStar')
RRT = try_import('src.algorithms.sampling.rrt', 'RRT')

# Algorithm mapping - only include successfully imported algorithms
ALGORITHMS = {}
if AStar:
    ALGORITHMS['astar'] = AStar
if WeightedAStar:
    ALGORITHMS['weighted_astar'] = WeightedAStar
if Dijkstra:
    ALGORITHMS['dijkstra'] = Dijkstra
if ThetaStar:
    ALGORITHMS['theta_star'] = ThetaStar
if JumpPointSearch:
    ALGORITHMS['jps'] = JumpPointSearch
if IDAStar:
    ALGORITHMS['ida_star'] = IDAStar
if RRT:
    ALGORITHMS['rrt'] = RRT

@app.route('/')
def index():
    """Serve the main visualization page."""
    return render_template('index.html')

@app.route('/api/run_algorithm', methods=['POST'])
def run_algorithm():
    """Run a pathfinding algorithm and return the results."""
    try:
        # Check if Grid class is available
        Grid = try_import('src.core.grid', 'Grid')
        if not Grid:
            return jsonify({'error': 'Grid class not available'}), 500
        
        data = request.get_json()
        
        # Extract parameters
        algorithm_name = data.get('algorithm', 'astar')
        grid_data = data.get('grid', [])
        start_pos = tuple(data.get('start', [1, 1]))
        goal_pos = tuple(data.get('goal', [28, 18]))
        
        # Validate algorithm
        if algorithm_name not in ALGORITHMS:
            return jsonify({'error': f'Unknown algorithm: {algorithm_name}. Available: {list(ALGORITHMS.keys())}'}), 400
        
        # Create grid from data
        height = len(grid_data)
        width = len(grid_data[0]) if height > 0 else 0
        
        if width == 0 or height == 0:
            return jsonify({'error': 'Invalid grid data'}), 400
        
        grid = Grid(width, height)
        
        # Set obstacles
        for y in range(height):
            for x in range(width):
                if grid_data[y][x] == 1:  # 1 represents obstacle
                    grid.set_obstacle(x, y)
        
        # Get algorithm class and create instance
        algorithm_class = ALGORITHMS[algorithm_name]
        algorithm = algorithm_class()
        
        # Run pathfinding
        path = algorithm.find_path(grid, start_pos, goal_pos)
        
        # Get additional information
        visited_nodes = getattr(algorithm, 'visited_nodes', [])
        open_nodes = getattr(algorithm, 'open_nodes', [])
        
        # Prepare response
        result = {
            'success': True,
            'path': path if path else [],
            'visited_nodes': visited_nodes,
            'open_nodes': open_nodes,
            'stats': {
                'path_length': len(path) if path else 0,
                'nodes_visited': len(visited_nodes),
                'nodes_in_open': len(open_nodes)
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/compare_algorithms', methods=['POST'])
def compare_algorithms():
    """Compare multiple algorithms on the same grid."""
    try:
        # Check if Grid class is available
        Grid = try_import('src.core.grid', 'Grid')
        if not Grid:
            return jsonify({'error': 'Grid class not available'}), 500
        
        data = request.get_json()
        
        # Extract parameters
        algorithms = data.get('algorithms', ['astar', 'dijkstra'])
        grid_data = data.get('grid', [])
        start_pos = tuple(data.get('start', [1, 1]))
        goal_pos = tuple(data.get('goal', [28, 18]))
        
        results = {}
        
        # Create grid from data
        height = len(grid_data)
        width = len(grid_data[0]) if height > 0 else 0
        
        if width == 0 or height == 0:
            return jsonify({'error': 'Invalid grid data'}), 400
        
        for algorithm_name in algorithms:
            if algorithm_name not in ALGORITHMS:
                results[algorithm_name] = {'error': 'Unknown algorithm'}
                continue
            
            try:
                # Create fresh grid for each algorithm
                grid = Grid(width, height)
                
                # Set obstacles
                for y in range(height):
                    for x in range(width):
                        if grid_data[y][x] == 1:  # 1 represents obstacle
                            grid.set_obstacle(x, y)
                
                # Get algorithm class and create instance
                algorithm_class = ALGORITHMS[algorithm_name]
                algorithm = algorithm_class()
                
                # Measure execution time
                import time
                start_time = time.perf_counter()
                path = algorithm.find_path(grid, start_pos, goal_pos)
                end_time = time.perf_counter()
                
                # Get additional information
                visited_nodes = getattr(algorithm, 'visited_nodes', [])
                open_nodes = getattr(algorithm, 'open_nodes', [])
                
                results[algorithm_name] = {
                    'success': True,
                    'path': path if path else [],
                    'execution_time': (end_time - start_time) * 1000,  # Convert to milliseconds
                    'stats': {
                        'path_length': len(path) if path else 0,
                        'nodes_visited': len(visited_nodes),
                        'nodes_in_open': len(open_nodes),
                        'optimal': algorithm_name in ['astar', 'dijkstra', 'theta_star', 'ida_star']
                    }
                }
                
            except Exception as e:
                results[algorithm_name] = {'error': str(e)}
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/algorithm_info/<algorithm_name>')
def get_algorithm_info(algorithm_name):
    """Get information about a specific algorithm."""
    
    algorithm_descriptions = {
        'astar': {
            'name': 'A*',
            'description': 'A* is a best-first search algorithm that uses both actual distance from start and estimated distance to goal. Guarantees shortest path with admissible heuristic.',
            'complexity': 'O(b^d)',
            'optimal': True,
            'complete': True,
            'heuristic': 'Manhattan/Euclidean',
            'memory_usage': 'High',
            'characteristics': [
                'Uses both g-cost (actual) and h-cost (heuristic)',
                'Maintains open and closed lists',
                'Guarantees optimal path with admissible heuristic',
                'Most popular pathfinding algorithm'
            ]
        },
        'weighted_astar': {
            'name': 'Weighted A*',
            'description': 'Weighted A* trades optimality for speed by inflating the heuristic. Finds paths faster but may not be optimal.',
            'complexity': 'O(b^d)',
            'optimal': False,
            'complete': True,
            'heuristic': 'Weighted Euclidean',
            'memory_usage': 'High',
            'characteristics': [
                'Uses inflated heuristic (weight > 1.0)',
                'Faster than standard A*',
                'Path quality bounded by weight factor',
                'Good for real-time applications'
            ]
        },
        'dijkstra': {
            'name': 'Dijkstra\'s Algorithm',
            'description': 'Dijkstra\'s algorithm explores uniformly in all directions, guaranteeing the shortest path. No heuristic used.',
            'complexity': 'O(V²) or O((V+E)logV)',
            'optimal': True,
            'complete': True,
            'heuristic': 'None',
            'memory_usage': 'High',
            'characteristics': [
                'No heuristic guidance',
                'Explores uniformly in all directions',
                'Always finds optimal path',
                'Slower than A* but more thorough'
            ]
        },
        'theta_star': {
            'name': 'Theta*',
            'description': 'Theta* allows any-angle paths by checking line-of-sight, creating more natural looking paths than grid-constrained algorithms.',
            'complexity': 'O(b^d)',
            'optimal': True,
            'complete': True,
            'heuristic': 'Euclidean',
            'memory_usage': 'High',
            'characteristics': [
                'Any-angle pathfinding',
                'Line-of-sight optimization',
                'More natural, smoother paths',
                'Higher computational cost per node'
            ]
        },
        'jps': {
            'name': 'Jump Point Search',
            'description': 'Jump Point Search dramatically speeds up A* on uniform-cost grids by jumping over intermediate nodes.',
            'complexity': 'O(b^d) but with much smaller branching factor',
            'optimal': True,
            'complete': True,
            'heuristic': 'Manhattan',
            'memory_usage': 'Medium',
            'characteristics': [
                'Dramatic speedup over A*',
                'Works best on uniform-cost grids',
                'Prunes symmetric paths',
                'Maintains optimality guarantee'
            ]
        },
        'ida_star': {
            'name': 'Iterative Deepening A*',
            'description': 'Iterative Deepening A* uses less memory than A* by performing depth-limited searches with increasing thresholds.',
            'complexity': 'O(b^d)',
            'optimal': True,
            'complete': True,
            'heuristic': 'Manhattan/Euclidean',
            'memory_usage': 'Low',
            'characteristics': [
                'Linear memory usage',
                'Iterative threshold increases',
                'Good for memory-constrained environments',
                'May revisit nodes multiple times'
            ]
        },
        'rrt': {
            'name': 'Rapidly-exploring Random Tree',
            'description': 'Rapidly-exploring Random Tree builds a tree by random sampling, good for complex environments but paths may be suboptimal.',
            'complexity': 'O(n log n)',
            'optimal': False,
            'complete': True,
            'heuristic': 'None (sampling-based)',
            'memory_usage': 'Variable',
            'characteristics': [
                'Probabilistically complete',
                'Good for high-dimensional spaces',
                'Random sampling approach',
                'Paths are typically not optimal'
            ]
        }
    }
    
    if algorithm_name not in algorithm_descriptions:
        return jsonify({'error': 'Unknown algorithm'}), 404
    
    return jsonify(algorithm_descriptions[algorithm_name])

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Check if we can import our core framework
    Grid = try_import('src.core.grid', 'Grid')
    
    if not Grid:
        print("Failed to import core Grid class")
        print("Make sure you're running from the project root directory")
        print("Available algorithms:")
        for name in ALGORITHMS:
            print(f"  + {name}")
        if not ALGORITHMS:
            print("  No algorithms available - check your imports")
    else:
        print("Successfully imported pathfinding framework")
        print("Available algorithms:")
        for name in ALGORITHMS:
            print(f"  + {name}")
    
    print("\nStarting Pathfinding Algorithm Visualizer...")
    print("Open your browser to: http://127.0.0.1:5000")
    
    app.run(debug=True, host='127.0.0.1', port=5000)