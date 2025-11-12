# Pathfinding Algorithm Visualizer - Web Assets

This directory contains the static assets (CSS, JavaScript, images) used by the pathfinding visualizer.

**Note**: The main HTML file is now at the root level (`/index.html`) for GitHub Pages deployment. This directory contains the supporting files.

## Features

- **Interactive Grid Editor**: Draw obstacles, set start/goal positions with mouse
- **Multiple Algorithms**: A*, Dijkstra, Weighted A*, Theta*, Jump Point Search, IDA*, RRT
- **Real-time Visualization**: Watch algorithms explore the search space step-by-step
- **Performance Metrics**: Compare execution time, nodes visited, path length
- **Algorithm Comparison**: Side-by-side comparison of multiple algorithms
- **Customizable Parameters**: Grid size, obstacle density, animation speed

## Quick Start

### Option 1: Using the startup script (Recommended)

1. From the project root directory, run:
   ```bash
   python run_web_demo.py
   ```

2. Open your browser to: http://127.0.0.1:5000

### Option 2: Manual setup

1. Install Flask:
   ```bash
   pip install flask
   ```

2. Navigate to the web directory:
   ```bash
   cd web
   ```

3. Run the Flask app:
   ```bash
   python app.py
   ```

4. Open your browser to: http://127.0.0.1:5000

## How to Use

### Basic Usage

1. **Set Start/Goal**: Click on green (start) or red (goal) nodes and drag to move them
2. **Draw Obstacles**: Click and drag on empty cells to create obstacles
3. **Remove Obstacles**: Right-click and drag to remove obstacles
4. **Select Algorithm**: Choose from the dropdown menu
5. **Run Visualization**: Click "Run Algorithm" to see the pathfinding in action

### Controls

- **Grid Size**: Change the dimensions of the pathfinding grid
- **Obstacle Density**: Generate random obstacles with specified density
- **Animation Speed**: Control how fast the visualization plays
- **Pause/Resume**: Pause the algorithm execution to examine the current state
- **Reset Grid**: Clear all obstacles and reset to default layout
- **Clear Path**: Remove visualization while keeping obstacles

### Advanced Features

#### Algorithm Comparison
- Click "Compare Algorithms" to run multiple algorithms on the same grid
- View side-by-side performance metrics
- Analyze trade-offs between speed and optimality

#### Performance Metrics
- **Execution Time**: How long the algorithm took to run
- **Nodes Visited**: Number of nodes explored during search
- **Path Length**: Total length of the found path
- **Efficiency**: Ratio of path length to nodes visited
- **Optimality**: How close the found path is to the theoretical optimal

## Available Algorithms

### Classical Algorithms
- **A***: Optimal pathfinding with heuristic guidance
- **Dijkstra**: Guaranteed shortest path, explores uniformly
- **Weighted A***: Faster than A* but potentially suboptimal

### Any-Angle Algorithms  
- **Theta***: Creates smooth, natural-looking paths not constrained to grid lines

### Optimized Algorithms
- **Jump Point Search (JPS)**: Dramatically faster A* for uniform grids
- **IDA***: Memory-efficient iterative deepening A*

### Sampling-Based Algorithms
- **RRT**: Rapidly-exploring Random Tree for complex environments

## Tips

1. **For Best Results**: Use moderate grid sizes (20x15 to 50x30) for good performance
2. **Algorithm Selection**: 
   - Use A* for guaranteed optimal paths
   - Use JPS for speed on open grids
   - Use Theta* for smooth, realistic paths
   - Use Dijkstra when you want to see uniform exploration
3. **Obstacle Patterns**: Try different obstacle layouts to see how algorithms behave
4. **Performance Comparison**: Different algorithms excel in different scenarios

## Troubleshooting

### "Grid class not available" Error
- Make sure you're running from the project root directory
- Ensure the `src/` directory contains the pathfinding framework

### Algorithm Not Available
- Some algorithms may fail to import due to missing dependencies
- The interface will show which algorithms are successfully loaded
- Basic algorithms (A*, Dijkstra) should always be available

### Slow Performance
- Reduce grid size for better performance
- Decrease animation speed for faster execution
- Use simpler algorithms (A*, Dijkstra) for large grids

## Browser Compatibility

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## API Endpoints

The web interface also provides REST API endpoints:

- `POST /api/run_algorithm`: Execute a single algorithm
- `POST /api/compare_algorithms`: Compare multiple algorithms  
- `GET /api/algorithm_info/<name>`: Get detailed algorithm information

## Development

### File Structure
```
web/
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── static/
│   ├── style.css      # Styling and animations
│   └── script.js      # Interactive visualization logic
└── templates/
    └── index.html     # Main interface template
```

### Extending the Interface
- Add new algorithms by updating `ALGORITHMS` in `app.py`
- Modify visualization by editing `script.js`  
- Customize appearance by updating `style.css`
- Add new features by extending the HTML template