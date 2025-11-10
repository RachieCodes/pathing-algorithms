class PathfindingVisualizer {
    constructor() {
        this.canvas = document.getElementById('pathfinding-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        // Grid properties
        this.gridWidth = 30;
        this.gridHeight = 20;
        this.cellSize = 25;
        this.canvas.width = this.gridWidth * this.cellSize;
        this.canvas.height = this.gridHeight * this.cellSize;
        
        // Grid state
        this.grid = this.initializeGrid();
        this.startNode = { x: 1, y: 1 };
        this.goalNode = { x: this.gridWidth - 2, y: this.gridHeight - 2 };
        
        // Visualization state
        this.isRunning = false;
        this.isPaused = false;
        this.isDrawing = false;
        this.drawMode = 'obstacle'; // 'obstacle', 'start', 'goal'
        this.animationSpeed = 50; // ms between steps
        this.currentAlgorithm = null;
        
        // Pathfinding results
        this.visitedNodes = [];
        this.pathNodes = [];
        this.openNodes = [];
        this.currentStep = 0;
        
        // Performance tracking
        this.startTime = 0;
        this.endTime = 0;
        this.nodesVisited = 0;
        this.pathLength = 0;
        
        // Algorithm configurations
        this.algorithmConfigs = {
            'astar': { name: 'A*', heuristic: 'manhattan', weight: 1.0 },
            'weighted_astar': { name: 'Weighted A*', heuristic: 'euclidean', weight: 1.5 },
            'dijkstra': { name: 'Dijkstra', heuristic: 'none', weight: 1.0 },
            'theta_star': { name: 'Theta*', heuristic: 'euclidean', weight: 1.0 },
            'jps': { name: 'Jump Point Search', heuristic: 'manhattan', weight: 1.0 },
            'ida_star': { name: 'IDA*', heuristic: 'manhattan', weight: 1.0 },
            'rrt': { name: 'RRT', heuristic: 'none', weight: 1.0 }
        };
        
        // Edit mode for manual grid editing
        this.editMode = 'wall';
        this.isMouseDown = false;
        
        this.initializeEventListeners();
        this.generateRandomMaze();
        this.render();
        this.updateAlgorithmInfo();
    }
    
    initializeGrid() {
        const grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                grid[y][x] = {
                    x: x,
                    y: y,
                    isObstacle: false,
                    isVisited: false,
                    isPath: false,
                    isOpen: false,
                    gCost: Infinity,
                    hCost: 0,
                    fCost: Infinity,
                    parent: null
                };
            }
        }
        return grid;
    }
    
    initializeEventListeners() {
        // Canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Control buttons
        const runButton = document.getElementById('run-algorithm');
        if (runButton) runButton.addEventListener('click', () => this.runAlgorithm());
        
        const clearGridButton = document.getElementById('clear-grid');
        if (clearGridButton) clearGridButton.addEventListener('click', () => this.resetGrid());
        
        const clearPathButton = document.getElementById('clear-path');
        if (clearPathButton) clearPathButton.addEventListener('click', () => this.clearPath());
        
        const generateMazeButton = document.getElementById('generate-maze');
        if (generateMazeButton) generateMazeButton.addEventListener('click', () => this.generateRandomMaze());
        
        const compareButton = document.getElementById('compare-algorithms');
        if (compareButton) compareButton.addEventListener('click', () => this.showComparison());
        
        // Edit mode selector
        const editModeSelect = document.getElementById('edit-mode');
        if (editModeSelect) editModeSelect.addEventListener('change', (e) => this.setEditMode(e.target.value));
        
        // Canvas mouse events for manual editing
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        
        // Control inputs
        const gridSizeSelect = document.getElementById('grid-size');
        if (gridSizeSelect) gridSizeSelect.addEventListener('change', (e) => this.changeGridSize(e.target.value));
        
        const obstacleDensitySlider = document.getElementById('obstacle-density');
        if (obstacleDensitySlider) obstacleDensitySlider.addEventListener('input', (e) => this.updateObstacleDensity(e.target.value));
        
        const animationSpeedSlider = document.getElementById('animation-speed');
        if (animationSpeedSlider) animationSpeedSlider.addEventListener('input', (e) => this.updateAnimationSpeed(e.target.value));
        
        const algorithmSelect = document.getElementById('algorithm-select');
        if (algorithmSelect) algorithmSelect.addEventListener('change', (e) => this.selectAlgorithm(e.target.value));
        
        // Modal close
        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        
        const comparisonModal = document.getElementById('comparison-modal');
        if (comparisonModal) comparisonModal.addEventListener('click', (e) => {
            if (e.target.id === 'comparison-modal') this.closeModal();
        });
    }
    
    handleMouseDown(e) {
        if (this.isRunning) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) / this.cellSize);
        
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
        
        this.isDrawing = true;
        
        // Determine draw mode based on what was clicked
        if (e.button === 2) { // Right click - remove obstacles
            this.drawMode = 'remove';
        } else if (this.grid[y][x].x === this.startNode.x && this.grid[y][x].y === this.startNode.y) {
            this.drawMode = 'start';
        } else if (this.grid[y][x].x === this.goalNode.x && this.grid[y][x].y === this.goalNode.y) {
            this.drawMode = 'goal';
        } else {
            this.drawMode = 'obstacle';
        }
        
        this.handleCellClick(x, y);
    }
    
    handleMouseMove(e) {
        if (!this.isDrawing || this.isRunning) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) / this.cellSize);
        
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
        
        this.handleCellClick(x, y);
    }
    
    handleMouseUp() {
        this.isDrawing = false;
    }
    
    handleCellClick(x, y) {
        const cell = this.grid[y][x];
        
        switch (this.drawMode) {
            case 'start':
                this.startNode = { x, y };
                break;
            case 'goal':
                this.goalNode = { x, y };
                break;
            case 'obstacle':
                if (!(x === this.startNode.x && y === this.startNode.y) && 
                    !(x === this.goalNode.x && y === this.goalNode.y)) {
                    cell.isObstacle = true;
                }
                break;
            case 'remove':
                cell.isObstacle = false;
                break;
        }
        
        this.render();
    }
    
    changeGridSize(size) {
        this.stopAlgorithm();
        console.log('Changing grid size to:', size);
        
        let width, height;
        
        if (size.includes('x')) {
            // Format: "widthxheight"
            [width, height] = size.split('x').map(Number);
        } else {
            // Format: single number for square grid
            width = height = parseInt(size);
        }
        
        // Validate grid size
        if (isNaN(width) || isNaN(height) || width < 5 || height < 5 || width > 100 || height > 100) {
            console.error('Invalid grid size. Must be between 5 and 100. Got:', width, 'x', height);
            return;
        }
        
        this.gridWidth = width;
        this.gridHeight = height;
        
        // Update canvas size with reasonable limits
        const maxCanvasWidth = 1200;
        const maxCanvasHeight = 800;
        
        let newWidth = this.gridWidth * this.cellSize;
        let newHeight = this.gridHeight * this.cellSize;
        
        // Adjust cell size if canvas would be too large
        if (newWidth > maxCanvasWidth || newHeight > maxCanvasHeight) {
            const scaleX = maxCanvasWidth / newWidth;
            const scaleY = maxCanvasHeight / newHeight;
            const scale = Math.min(scaleX, scaleY);
            this.cellSize = Math.max(Math.floor(this.cellSize * scale), 8); // Minimum 8px cells
            
            newWidth = this.gridWidth * this.cellSize;
            newHeight = this.gridHeight * this.cellSize;
        }
        
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        
        // Reinitialize grid
        this.grid = this.initializeGrid();
        
        // Reset positions to safe locations
        this.startNode = { x: 1, y: 1 };
        this.goalNode = { 
            x: Math.max(this.gridWidth - 2, 2), 
            y: Math.max(this.gridHeight - 2, 2) 
        };
        
        // Ensure start and goal are different
        if (this.startNode.x === this.goalNode.x && this.startNode.y === this.goalNode.y) {
            this.goalNode.x = Math.max(this.gridWidth - 1, 2);
        }
        
        this.clearVisualization();
        this.generateRandomMaze();
        this.render();
        
        console.log('Grid size changed to:', this.gridWidth, 'x', this.gridHeight, 'Canvas size:', this.canvas.width, 'x', this.canvas.height);
    }
    
    updateObstacleDensity(density) {
        const densityValueEl = document.getElementById('density-value');
        if (densityValueEl) densityValueEl.textContent = density + '%';
    }
    
    updateAnimationSpeed(speed) {
        this.animationSpeed = parseInt(speed);
        const speedValueEl = document.getElementById('speed-value');
        if (speedValueEl) speedValueEl.textContent = speed + 'ms';
    }
    
    setEditMode(mode) {
        this.editMode = mode;
        console.log('Edit mode changed to:', mode);
    }
    
    handleMouseDown(e) {
        this.isMouseDown = true;
        this.handleCellClick(e);
    }
    
    handleMouseMove(e) {
        if (this.isMouseDown) {
            this.handleCellClick(e);
        }
    }
    
    handleMouseUp() {
        this.isMouseDown = false;
    }
    
    handleCellClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) / this.cellSize);
        
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
            return;
        }
        
        const node = this.grid[y][x];
        
        switch (this.editMode) {
            case 'start':
                // Clear previous start node visualization
                this.clearVisualization();
                this.startNode = { x, y };
                break;
                
            case 'goal':
                // Clear previous goal node visualization
                this.clearVisualization();
                this.goalNode = { x, y };
                break;
                
            case 'wall':
                // Don't place walls on start or goal
                if ((x !== this.startNode.x || y !== this.startNode.y) &&
                    (x !== this.goalNode.x || y !== this.goalNode.y)) {
                    node.isObstacle = true;
                }
                break;
                
            case 'erase':
                node.isObstacle = false;
                break;
        }
        
        this.render();
    }
    
    selectAlgorithm(algorithm) {
        this.currentAlgorithm = algorithm;
        this.updateAlgorithmInfo();
    }
    
    updateAlgorithmInfo() {
        const algorithm = this.currentAlgorithm || 'astar';
        const config = this.algorithmConfigs[algorithm];
        
        if (!config) return;
        
        // Update algorithm title
        const titleEl = document.getElementById('algorithm-title');
        if (titleEl) titleEl.textContent = config.name;
        
        // Update algorithm description based on type
        const descriptions = {
            'astar': 'A* is a best-first search algorithm that uses both actual distance from start and estimated distance to goal. Guarantees shortest path with admissible heuristic.',
            'weighted_astar': 'Weighted A* trades optimality for speed by inflating the heuristic. Finds paths faster but may not be optimal.',
            'dijkstra': 'Dijkstra\'s algorithm explores uniformly in all directions, guaranteeing the shortest path. No heuristic used.',
            'theta_star': 'Theta* allows any-angle paths by checking line-of-sight, creating more natural looking paths than grid-constrained algorithms.',
            'jps': 'Jump Point Search dramatically speeds up A* on uniform-cost grids by jumping over intermediate nodes.',
            'ida_star': 'Iterative Deepening A* uses less memory than A* by performing depth-limited searches with increasing thresholds.',
            'rrt': 'Rapidly-exploring Random Tree builds a tree by random sampling, good for complex environments but paths may be suboptimal.'
        };
        
        const descriptionEl = document.getElementById('algorithm-description');
        if (descriptionEl) descriptionEl.textContent = descriptions[algorithm] || '';
        
        // Update individual algorithm stats
        const timeComplexityEl = document.getElementById('time-complexity');
        if (timeComplexityEl) {
            timeComplexityEl.textContent = algorithm === 'dijkstra' ? 'O(V²)' : 
                                           algorithm === 'rrt' ? 'O(n log n)' : 'O(b^d)';
        }
        
        const spaceComplexityEl = document.getElementById('space-complexity');
        if (spaceComplexityEl) {
            spaceComplexityEl.textContent = algorithm === 'ida_star' ? 'O(d)' : 'O(b^d)';
        }
        
        const optimalityEl = document.getElementById('optimality');
        if (optimalityEl) {
            optimalityEl.textContent = ['astar', 'dijkstra', 'theta_star', 'ida_star'].includes(algorithm) ? 'Optimal' : 'Suboptimal';
        }
        
        const completenessEl = document.getElementById('completeness');
        if (completenessEl) {
            completenessEl.textContent = 'Complete';
        }
    }
    
    async runAlgorithm() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        
        const runButton = document.getElementById('run-algorithm');
        if (runButton) runButton.disabled = true;
        
        // Clear previous results
        this.clearVisualization();
        
        // Reset path length for new algorithm run
        this.pathLength = 0;
        
        // Start timing
        this.startTime = performance.now();
        
        // Initialize real-time metrics
        this.updateRealTimeMetrics();
        
        try {
            switch (this.currentAlgorithm || 'astar') {
                case 'astar':
                    await this.runAStar();
                    break;
                case 'weighted_astar':
                    await this.runWeightedAStar();
                    break;
                case 'dijkstra':
                    await this.runDijkstra();
                    break;
                case 'theta_star':
                    await this.runThetaStar();
                    break;
                case 'jps':
                    await this.runJumpPointSearch();
                    break;
                case 'ida_star':
                    await this.runIDAStar();
                    break;
                case 'rrt':
                    await this.runRRT();
                    break;
                default:
                    await this.runAStar();
            }
        } catch (error) {
            console.error('Algorithm execution error:', error);
        }
        
        this.endTime = performance.now();
        this.isRunning = false;
        
        const runBtn = document.getElementById('run-algorithm');
        if (runBtn) runBtn.disabled = false;
        
        this.updatePerformanceMetrics();
    }
    
    stopAlgorithm() {
        if (this.isRunning) {
            this.isRunning = false;
            this.isPaused = false;
            
            const runBtn = document.getElementById('run-algorithm');
            if (runBtn) runBtn.disabled = false;
            
            const pauseBtn = document.getElementById('pause-resume');
            if (pauseBtn) pauseBtn.textContent = 'Pause';
            
            // Update final metrics when stopped
            this.updateRealTimeMetrics();
            
            console.log('Algorithm execution stopped');
        }
    }
    
    async runAStar() {
        const openSet = [this.grid[this.startNode.y][this.startNode.x]];
        const closedSet = [];
        
        // Initialize start node
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        startNode.gCost = 0;
        startNode.hCost = this.calculateHeuristic(startNode, this.grid[this.goalNode.y][this.goalNode.x]);
        startNode.fCost = startNode.gCost + startNode.hCost;
        
        while (openSet.length > 0 && this.isRunning && !this.isPaused) {
            // Find node with lowest fCost
            openSet.sort((a, b) => a.fCost - b.fCost);
            const currentNode = openSet.shift();
            
            // Mark as visited
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            closedSet.push(currentNode);
            
            // Check if we reached the goal
            if (currentNode.x === this.goalNode.x && currentNode.y === this.goalNode.y) {
                this.reconstructPath(currentNode);
                return;
            }
            
            // Explore neighbors
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle || closedSet.includes(neighbor)) continue;
                
                const tentativeGCost = currentNode.gCost + 1;
                
                if (tentativeGCost < neighbor.gCost) {
                    neighbor.parent = currentNode;
                    neighbor.gCost = tentativeGCost;
                    neighbor.hCost = this.calculateHeuristic(neighbor, this.grid[this.goalNode.y][this.goalNode.x]);
                    neighbor.fCost = neighbor.gCost + neighbor.hCost;
                    
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        neighbor.isOpen = true;
                        this.openNodes.push(neighbor);
                    }
                }
            }
            
            this.render();
            this.updateRealTimeMetrics();
            await this.sleep(this.animationSpeed);
        }
    }
    
    async runWeightedAStar() {
        // Similar to A* but with weighted heuristic
        const weight = 1.5;
        const openSet = [this.grid[this.startNode.y][this.startNode.x]];
        const closedSet = [];
        
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        startNode.gCost = 0;
        startNode.hCost = this.calculateHeuristic(startNode, this.grid[this.goalNode.y][this.goalNode.x]);
        startNode.fCost = startNode.gCost + (startNode.hCost * weight);
        
        while (openSet.length > 0 && this.isRunning && !this.isPaused) {
            openSet.sort((a, b) => a.fCost - b.fCost);
            const currentNode = openSet.shift();
            
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            closedSet.push(currentNode);
            
            if (currentNode.x === this.goalNode.x && currentNode.y === this.goalNode.y) {
                this.reconstructPath(currentNode);
                return;
            }
            
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle || closedSet.includes(neighbor)) continue;
                
                const tentativeGCost = currentNode.gCost + 1;
                
                if (tentativeGCost < neighbor.gCost) {
                    neighbor.parent = currentNode;
                    neighbor.gCost = tentativeGCost;
                    neighbor.hCost = this.calculateHeuristic(neighbor, this.grid[this.goalNode.y][this.goalNode.x]);
                    neighbor.fCost = neighbor.gCost + (neighbor.hCost * weight);
                    
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        neighbor.isOpen = true;
                        this.openNodes.push(neighbor);
                    }
                }
            }
            
            this.render();
            this.updateRealTimeMetrics();
            await this.sleep(this.animationSpeed);
        }
    }
    
    async runDijkstra() {
        // Dijkstra's algorithm (A* without heuristic)
        const openSet = [this.grid[this.startNode.y][this.startNode.x]];
        const closedSet = [];
        
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        startNode.gCost = 0;
        startNode.fCost = 0;
        
        while (openSet.length > 0 && this.isRunning && !this.isPaused) {
            openSet.sort((a, b) => a.gCost - b.gCost);
            const currentNode = openSet.shift();
            
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            closedSet.push(currentNode);
            
            if (currentNode.x === this.goalNode.x && currentNode.y === this.goalNode.y) {
                this.reconstructPath(currentNode);
                return;
            }
            
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle || closedSet.includes(neighbor)) continue;
                
                const tentativeGCost = currentNode.gCost + 1;
                
                if (tentativeGCost < neighbor.gCost) {
                    neighbor.parent = currentNode;
                    neighbor.gCost = tentativeGCost;
                    neighbor.fCost = neighbor.gCost;
                    
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        neighbor.isOpen = true;
                        this.openNodes.push(neighbor);
                    }
                }
            }
            
            this.render();
            this.updateRealTimeMetrics();
            await this.sleep(this.animationSpeed);
        }
    }
    
    async runThetaStar() {
        // Theta* with line-of-sight optimization for any-angle pathfinding
        console.log('Starting Theta* algorithm with line-of-sight optimization');
        console.log(`Start: (${this.startNode.x}, ${this.startNode.y}), Goal: (${this.goalNode.x}, ${this.goalNode.y})`);
        
        const openSet = [];
        const closedSet = [];
        
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        startNode.gCost = 0;
        startNode.hCost = this.calculateHeuristic(startNode, this.grid[this.goalNode.y][this.goalNode.x]);
        startNode.fCost = startNode.gCost + startNode.hCost;
        startNode.parent = null;
        
        openSet.push(startNode);
        console.log('Theta*: Initial setup complete, starting main loop');
        
        let iterations = 0;
        while (openSet.length > 0 && this.isRunning && !this.isPaused) {
            iterations++;
            if (iterations % 50 === 0) {
                console.log(`Theta*: Iteration ${iterations}, open set size: ${openSet.length}`);
            }
            
            openSet.sort((a, b) => a.fCost - b.fCost);
            const currentNode = openSet.shift();
            
            // Mark as visited for visualization
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            closedSet.push(currentNode);
            
            // Check if we reached the goal
            if (currentNode.x === this.goalNode.x && currentNode.y === this.goalNode.y) {
                console.log(`Theta*: Path found in ${iterations} iterations!`);
                this.reconstructPath(currentNode);
                return;
            }
            
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle) continue;
                
                // Skip if already in closed set
                if (closedSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) continue;
                
                // Standard A* step - calculate tentative g-cost via current node
                const distance = this.calculateDistance(currentNode, neighbor);
                const tentativeGCost = currentNode.gCost + distance;
                
                // Check if this path to neighbor is better than any previous one
                const isInOpenSet = openSet.some(node => node.x === neighbor.x && node.y === neighbor.y);
                
                if (tentativeGCost < neighbor.gCost) {
                    // This path is the best until now, record it
                    neighbor.parent = currentNode;
                    neighbor.gCost = tentativeGCost;
                    neighbor.hCost = this.calculateHeuristic(neighbor, this.grid[this.goalNode.y][this.goalNode.x]);
                    neighbor.fCost = neighbor.gCost + neighbor.hCost;
                    
                    // Theta* optimization: Path 2 - Check line of sight to grandparent
                    if (currentNode.parent && this.hasLineOfSight(currentNode.parent, neighbor)) {
                        const directDistance = this.calculateDistance(currentNode.parent, neighbor);
                        const directGCost = currentNode.parent.gCost + directDistance;
                        
                        // If direct path is better, use it
                        if (directGCost < neighbor.gCost) {
                            neighbor.parent = currentNode.parent;
                            neighbor.gCost = directGCost;
                            neighbor.fCost = neighbor.gCost + neighbor.hCost;
                        }
                    }
                    
                    if (!isInOpenSet) {
                        // Add to open set if not already there
                        openSet.push(neighbor);
                        neighbor.isOpen = true;
                        this.openNodes.push(neighbor);
                    }
                }
            }
            
            this.render();
            this.updateRealTimeMetrics();
            await this.sleep(this.animationSpeed);
        }
        
        console.log('Theta*: No solution found');
    }
    
    async idaStarDFS(node, g, threshold, path) {
        const f = g + this.calculateHeuristic(node, this.grid[this.goalNode.y][this.goalNode.x]);
        
        // If f exceeds threshold, return the exceeded value
        if (f > threshold) {
            return { found: false, minExceeded: f };
        }
        
        // Goal test
        if (node.x === this.goalNode.x && node.y === this.goalNode.y) {
            // Reconstruct path from the path array
            for (let i = 0; i < path.length; i++) {
                if (i > 0) {
                    path[i].parent = path[i - 1];
                }
            }
            node.parent = path.length > 0 ? path[path.length - 1] : null;
            this.reconstructPath(node);
            return { found: true, minExceeded: -1 };
        }
        
        // Check for running state and avoid infinite loops
        if (!this.isRunning || this.isPaused || path.length > 100) {
            return { found: false, minExceeded: Infinity };
        }
        
        // Mark as visited for visualization
        if (!node.isVisited) {
            node.isVisited = true;
            this.visitedNodes.push(node);
            this.render();
            this.updateRealTimeMetrics();
            await this.sleep(this.animationSpeed / 3);
        }
        
        let minExceeded = Infinity;
        const neighbors = this.getNeighbors(node);
        
        for (const neighbor of neighbors) {
            if (neighbor.isObstacle) continue;
            
            // Check if neighbor is already in current path (avoid cycles)
            const inPath = path.some(pathNode => pathNode.x === neighbor.x && pathNode.y === neighbor.y);
            if (inPath) continue;
            
            // Add current node to path and explore neighbor
            path.push(node);
            const result = await this.idaStarDFS(neighbor, g + 1, threshold, path);
            path.pop(); // Remove from path (backtrack)
            
            if (result.found) {
                return result;
            }
            
            if (result.minExceeded < minExceeded) {
                minExceeded = result.minExceeded;
            }
        }
        
        return { found: false, minExceeded: minExceeded };
    }

    async runJumpPointSearch() {
        // Enhanced JPS implementation with line-of-sight optimization
        // Combines jump point pruning with any-angle pathfinding
        console.log('Starting JPS with line-of-sight optimization');
        
        const openSet = [];
        const closedSet = [];
        
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        startNode.gCost = 0;
        startNode.hCost = this.calculateHeuristic(startNode, this.grid[this.goalNode.y][this.goalNode.x]);
        startNode.fCost = startNode.gCost + startNode.hCost;
        startNode.parent = null;
        
        openSet.push(startNode);
        
        let iterations = 0;
        let lineOfSightOptimizations = 0;
        
        while (openSet.length > 0 && this.isRunning && !this.isPaused) {
            iterations++;
            openSet.sort((a, b) => a.fCost - b.fCost);
            const currentNode = openSet.shift();
            
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            closedSet.push(currentNode);
            
            if (currentNode.x === this.goalNode.x && currentNode.y === this.goalNode.y) {
                console.log(`JPS: Path found in ${iterations} iterations with ${lineOfSightOptimizations} line-of-sight optimizations!`);
                this.reconstructPath(currentNode);
                return;
            }
            
            // Find jump points instead of all neighbors
            const jumpPoints = this.findJumpPoints(currentNode);
            for (const jumpPoint of jumpPoints) {
                if (jumpPoint.isObstacle) continue;
                
                // Skip if already in closed set
                if (closedSet.some(node => node.x === jumpPoint.x && node.y === jumpPoint.y)) continue;
                
                // Calculate standard JPS cost
                const distance = this.calculateDistance(currentNode, jumpPoint);
                const tentativeGCost = currentNode.gCost + distance;
                
                // Check if this path to jump point is better than any previous one
                const isInOpenSet = openSet.some(node => node.x === jumpPoint.x && node.y === jumpPoint.y);
                
                if (tentativeGCost < jumpPoint.gCost) {
                    // Standard JPS path
                    jumpPoint.parent = currentNode;
                    jumpPoint.gCost = tentativeGCost;
                    jumpPoint.hCost = this.calculateHeuristic(jumpPoint, this.grid[this.goalNode.y][this.goalNode.x]);
                    jumpPoint.fCost = jumpPoint.gCost + jumpPoint.hCost;
                    
                    // JPS + Line-of-sight optimization: Check if we can connect directly to grandparent
                    if (currentNode.parent && this.hasLineOfSight(currentNode.parent, jumpPoint)) {
                        const directDistance = this.calculateDistance(currentNode.parent, jumpPoint);
                        const directGCost = currentNode.parent.gCost + directDistance;
                        
                        // If direct path through grandparent is better, use it
                        if (directGCost < jumpPoint.gCost) {
                            jumpPoint.parent = currentNode.parent;
                            jumpPoint.gCost = directGCost;
                            jumpPoint.fCost = jumpPoint.gCost + jumpPoint.hCost;
                            lineOfSightOptimizations++;
                        }
                    }
                    
                    if (!isInOpenSet) {
                        openSet.push(jumpPoint);
                        jumpPoint.isOpen = true;
                        this.openNodes.push(jumpPoint);
                    }
                }
            }
            
            this.render();
            this.updateRealTimeMetrics();
            await this.sleep(this.animationSpeed);
        }
        
        console.log(`JPS: No solution found after ${iterations} iterations with ${lineOfSightOptimizations} line-of-sight optimizations`);
    }
    
    async runIDAStar() {
        // IDA* - Iterative Deepening A* (proper implementation)
        console.log('Starting IDA* algorithm');
        
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        let threshold = this.calculateHeuristic(startNode, this.grid[this.goalNode.y][this.goalNode.x]);
        
        while (this.isRunning && !this.isPaused) {
            console.log(`IDA*: Searching with threshold ${threshold}`);
            
            // Clear visited state for each iteration
            this.clearVisitedNodes();
            this.visitedNodes = [];
            
            const result = await this.idaStarDFS(startNode, 0, threshold, []);
            
            if (result.found) {
                console.log('IDA*: Path found!');
                return;
            }
            
            if (result.minExceeded === Infinity) {
                console.log('IDA*: No solution exists');
                break;
            }
            
            threshold = result.minExceeded;
            await this.sleep(100); // Small delay between iterations
        }
    }

    clearVisitedNodes() {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const node = this.grid[y][x];
                node.isVisited = false;
                node.parent = null;
                node.gCost = Infinity;
                node.hCost = 0;
                node.fCost = 0;
            }
        }
    }
    

    
    async runRRT() {
        // Rapidly-exploring Random Tree - Fixed implementation
        console.log('Starting RRT algorithm');
        
        const tree = [];
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        startNode.isVisited = true;
        startNode.parent = null;
        tree.push(startNode);
        this.visitedNodes.push(startNode);
        
        const maxIterations = 500;
        const stepSize = 1;
        let goalBias = 0.1; // 10% chance to sample goal
        
        for (let i = 0; i < maxIterations && this.isRunning && !this.isPaused; i++) {
            let targetNode;
            
            // Goal biasing - occasionally sample toward goal
            if (Math.random() < goalBias) {
                targetNode = this.grid[this.goalNode.y][this.goalNode.x];
            } else {
                targetNode = this.getRandomNode();
            }
            
            const nearestNode = this.findNearestNode(tree, targetNode);
            const newNode = this.steerRRT(nearestNode, targetNode, stepSize);
            
            if (newNode && !newNode.isObstacle && !tree.includes(newNode)) {
                // Check if path to new node is obstacle-free
                if (this.isPathClear(nearestNode, newNode)) {
                    newNode.parent = nearestNode;
                    newNode.isVisited = true;
                    tree.push(newNode);
                    this.visitedNodes.push(newNode);
                    
                    // Check if we reached the goal
                    if (newNode.x === this.goalNode.x && newNode.y === this.goalNode.y) {
                        console.log('RRT: Path found!');
                        this.reconstructPath(newNode);
                        return;
                    }
                    
                    // Check if we're close enough to goal to connect
                    const distanceToGoal = this.calculateDistance(newNode, this.grid[this.goalNode.y][this.goalNode.x]);
                    if (distanceToGoal <= stepSize && this.isPathClear(newNode, this.grid[this.goalNode.y][this.goalNode.x])) {
                        this.grid[this.goalNode.y][this.goalNode.x].parent = newNode;
                        console.log('RRT: Connected to goal!');
                        this.reconstructPath(this.grid[this.goalNode.y][this.goalNode.x]);
                        return;
                    }
                }
            }
            
            // Update visualization periodically
            if (i % 5 === 0) {
                this.render();
                this.updateRealTimeMetrics();
                await this.sleep(this.animationSpeed);
            }
        }
        
        console.log('RRT: Maximum iterations reached - no path found');
    }
    
    // Utility methods for algorithms
    
    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dx, dy] of directions) {
            const x = node.x + dx;
            const y = node.y + dy;
            
            if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                neighbors.push(this.grid[y][x]);
            }
        }
        
        return neighbors;
    }
    
    calculateHeuristic(nodeA, nodeB, type = 'manhattan') {
        const dx = Math.abs(nodeA.x - nodeB.x);
        const dy = Math.abs(nodeA.y - nodeB.y);
        
        switch (type) {
            case 'manhattan':
                return dx + dy;
            case 'euclidean':
                return Math.sqrt(dx * dx + dy * dy);
            case 'octile':
                return Math.max(dx, dy) + (Math.sqrt(2) - 1) * Math.min(dx, dy);
            default:
                return dx + dy;
        }
    }
    
    calculateDistance(nodeA, nodeB) {
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    hasLineOfSight(nodeA, nodeB) {
        // If nodes are the same, they have line of sight
        if (nodeA.x === nodeB.x && nodeA.y === nodeB.y) return true;
        
        const x0 = nodeA.x;
        const y0 = nodeA.y;
        const x1 = nodeB.x;
        const y1 = nodeB.y;
        
        // Use Bresenham's line algorithm to check for obstacles
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        
        let x = x0;
        let y = y0;
        
        const xInc = x1 > x0 ? 1 : -1;
        const yInc = y1 > y0 ? 1 : -1;
        
        let error = dx - dy;
        
        const dx2 = dx * 2;
        const dy2 = dy * 2;
        
        while (x !== x1 || y !== y1) {
            // Check bounds first
            if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
                return false;
            }
            
            // Check for obstacle
            if (this.grid[y][x].isObstacle) {
                return false;
            }
            
            if (error > 0) {
                x += xInc;
                error -= dy2;
            } else {
                y += yInc;
                error += dx2;
            }
        }
        
        return true;
    }
    
    findJumpPoints(node) {
        // Simplified jump point detection
        const jumpPoints = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dx, dy] of directions) {
            let x = node.x + dx;
            let y = node.y + dy;
            let distance = 1;
            
            while (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight && 
                   !this.grid[y][x].isObstacle && distance < 5) {
                
                // Simple jump point: if we can see the goal or find a forced neighbor
                if ((x === this.goalNode.x && y === this.goalNode.y) || 
                    this.hasForcedNeighbor(this.grid[y][x], dx, dy)) {
                    jumpPoints.push(this.grid[y][x]);
                    break;
                }
                
                x += dx;
                y += dy;
                distance++;
            }
        }
        
        return jumpPoints;
    }
    
    hasForcedNeighbor(node, dx, dy) {
        // Simplified forced neighbor detection
        const x = node.x;
        const y = node.y;
        
        // Check if there are obstacles that would create forced neighbors
        if (dx !== 0 && dy !== 0) { // Diagonal movement
            return (this.isObstacle(x - dx, y) && !this.isObstacle(x - dx, y + dy)) ||
                   (this.isObstacle(x, y - dy) && !this.isObstacle(x + dx, y - dy));
        } else if (dx !== 0) { // Horizontal movement
            return (this.isObstacle(x, y + 1) && !this.isObstacle(x + dx, y + 1)) ||
                   (this.isObstacle(x, y - 1) && !this.isObstacle(x + dx, y - 1));
        } else if (dy !== 0) { // Vertical movement
            return (this.isObstacle(x + 1, y) && !this.isObstacle(x + 1, y + dy)) ||
                   (this.isObstacle(x - 1, y) && !this.isObstacle(x - 1, y + dy));
        }
        
        return false;
    }
    
    isObstacle(x, y) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
            return true;
        }
        return this.grid[y][x].isObstacle;
    }
    
    getRandomNode() {
        const x = Math.floor(Math.random() * this.gridWidth);
        const y = Math.floor(Math.random() * this.gridHeight);
        return this.grid[y][x];
    }
    
    findNearestNode(tree, targetNode) {
        let nearest = tree[0];
        let minDistance = this.calculateDistance(nearest, targetNode);
        
        for (const node of tree) {
            const distance = this.calculateDistance(node, targetNode);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = node;
            }
        }
        
        return nearest;
    }
    
    steerRRT(fromNode, toNode, stepSize) {
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return null;
        
        let newX, newY;
        
        if (distance <= stepSize) {
            newX = toNode.x;
            newY = toNode.y;
        } else {
            const ratio = stepSize / distance;
            newX = Math.round(fromNode.x + dx * ratio);
            newY = Math.round(fromNode.y + dy * ratio);
        }
        
        // Ensure coordinates are within bounds
        newX = Math.max(0, Math.min(this.gridWidth - 1, newX));
        newY = Math.max(0, Math.min(this.gridHeight - 1, newY));
        
        return this.grid[newY][newX];
    }
    
    isPathClear(nodeA, nodeB) {
        // Simple line-of-sight check between two nodes
        const dx = Math.abs(nodeB.x - nodeA.x);
        const dy = Math.abs(nodeB.y - nodeA.y);
        const steps = Math.max(dx, dy);
        
        if (steps === 0) return true;
        
        const xStep = (nodeB.x - nodeA.x) / steps;
        const yStep = (nodeB.y - nodeA.y) / steps;
        
        for (let i = 0; i <= steps; i++) {
            const x = Math.round(nodeA.x + i * xStep);
            const y = Math.round(nodeA.y + i * yStep);
            
            if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
                return false;
            }
            
            if (this.grid[y][x].isObstacle) {
                return false;
            }
        }
        
        return true;
    }
    
    reconstructPath(goalNode) {
        const path = [];
        let current = goalNode;
        
        while (current) {
            path.unshift(current);
            current = current.parent;
        }
        
        // Mark path nodes
        for (const node of path) {
            node.isPath = true;
            this.pathNodes.push(node);
        }
        
        this.pathLength = path.length - 1;
        
        // Update metrics when path is found
        this.updateRealTimeMetrics();
        
        // Render the final path immediately
        this.render();
    }
    
    // Control methods
    
    pauseResume() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-resume');
        if (pauseBtn) pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
    }
    
    resetGrid() {
        this.stopAlgorithm();
        this.grid = this.initializeGrid();
        this.startNode = { x: 1, y: 1 };
        this.goalNode = { x: this.gridWidth - 2, y: this.gridHeight - 2 };
        this.clearVisualization();
        this.render();
    }
    
    clearPath() {
        this.stopAlgorithm();
        this.clearVisualization();
        this.render();
    }
    
    clearVisualization() {
        this.visitedNodes = [];
        this.pathNodes = [];
        this.openNodes = [];
        this.pathLength = 0;
        
        // Reset metrics display
        this.resetMetricsDisplay();
        
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const node = this.grid[y][x];
                node.isVisited = false;
                node.isPath = false;
                node.isOpen = false;
                node.gCost = Infinity;
                node.hCost = 0;
                node.fCost = Infinity;
                node.parent = null;
            }
        }
    }
    
    generateRandomMaze() {
        this.stopAlgorithm();
        
        // Clear existing obstacles
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x].isObstacle = false;
            }
        }
        
        const densityElement = document.getElementById('obstacle-density');
        const density = densityElement ? parseInt(densityElement.value) / 100 : 0.3;
        
        // Completely random maze generation
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                // Skip start and goal positions
                if ((x === this.startNode.x && y === this.startNode.y) ||
                    (x === this.goalNode.x && y === this.goalNode.y)) {
                    continue;
                }
                
                if (Math.random() < density) {
                    this.grid[y][x].isObstacle = true;
                }
            }
        }
        
        this.render();
    }
    
    // Keep the old method for backward compatibility
    generateMaze() {
        this.generateRandomMaze();
    }
    
    generateRandomPattern(density) {
        // Original random obstacle generation
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (Math.random() < density && 
                    !(x === this.startNode.x && y === this.startNode.y) &&
                    !(x === this.goalNode.x && y === this.goalNode.y)) {
                    this.grid[y][x].isObstacle = true;
                }
            }
        }
    }
    
    generateMazeWalls() {
        // Create maze-like walls with corridors
        for (let y = 2; y < this.gridHeight - 2; y += 4) {
            for (let x = 1; x < this.gridWidth - 1; x++) {
                if (!(x === this.startNode.x && y === this.startNode.y) &&
                    !(x === this.goalNode.x && y === this.goalNode.y)) {
                    this.grid[y][x].isObstacle = true;
                }
            }
        }
        
        for (let x = 2; x < this.gridWidth - 2; x += 4) {
            for (let y = 1; y < this.gridHeight - 1; y++) {
                if (!(x === this.startNode.x && y === this.startNode.y) &&
                    !(x === this.goalNode.x && y === this.goalNode.y)) {
                    this.grid[y][x].isObstacle = true;
                }
            }
        }
        
        // Add some random gaps
        for (let i = 0; i < Math.floor((this.gridWidth * this.gridHeight) / 50); i++) {
            const x = Math.floor(Math.random() * this.gridWidth);
            const y = Math.floor(Math.random() * this.gridHeight);
            if (this.grid[y] && this.grid[y][x]) {
                this.grid[y][x].isObstacle = false;
            }
        }
    }
    
    generateSpiral() {
        // Create spiral pattern
        const centerX = Math.floor(this.gridWidth / 2);
        const centerY = Math.floor(this.gridHeight / 2);
        const maxRadius = Math.min(centerX, centerY) - 2;
        
        for (let radius = 2; radius < maxRadius; radius += 3) {
            const circumference = 2 * Math.PI * radius;
            const points = Math.floor(circumference);
            
            for (let i = 0; i < points; i++) {
                const angle = (2 * Math.PI * i) / points;
                const x = Math.floor(centerX + radius * Math.cos(angle));
                const y = Math.floor(centerY + radius * Math.sin(angle));
                
                if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight &&
                    !(x === this.startNode.x && y === this.startNode.y) &&
                    !(x === this.goalNode.x && y === this.goalNode.y)) {
                    this.grid[y][x].isObstacle = true;
                }
            }
        }
    }
    
    generateRooms() {
        // Create room-like structures
        const numRooms = Math.floor(Math.random() * 4) + 2;
        
        for (let room = 0; room < numRooms; room++) {
            const roomWidth = Math.floor(Math.random() * 8) + 4;
            const roomHeight = Math.floor(Math.random() * 6) + 3;
            const roomX = Math.floor(Math.random() * (this.gridWidth - roomWidth - 2)) + 1;
            const roomY = Math.floor(Math.random() * (this.gridHeight - roomHeight - 2)) + 1;
            
            // Draw room walls
            for (let x = roomX; x < roomX + roomWidth; x++) {
                for (let y = roomY; y < roomY + roomHeight; y++) {
                    if ((x === roomX || x === roomX + roomWidth - 1 ||
                         y === roomY || y === roomY + roomHeight - 1) &&
                        !(x === this.startNode.x && y === this.startNode.y) &&
                        !(x === this.goalNode.x && y === this.goalNode.y)) {
                        this.grid[y][x].isObstacle = true;
                    }
                }
            }
            
            // Add doorways
            const numDoors = Math.floor(Math.random() * 3) + 1;
            for (let door = 0; door < numDoors; door++) {
                const side = Math.floor(Math.random() * 4);
                let doorX, doorY;
                
                switch (side) {
                    case 0: // Top
                        doorX = roomX + Math.floor(Math.random() * (roomWidth - 2)) + 1;
                        doorY = roomY;
                        break;
                    case 1: // Right
                        doorX = roomX + roomWidth - 1;
                        doorY = roomY + Math.floor(Math.random() * (roomHeight - 2)) + 1;
                        break;
                    case 2: // Bottom
                        doorX = roomX + Math.floor(Math.random() * (roomWidth - 2)) + 1;
                        doorY = roomY + roomHeight - 1;
                        break;
                    case 3: // Left
                        doorX = roomX;
                        doorY = roomY + Math.floor(Math.random() * (roomHeight - 2)) + 1;
                        break;
                }
                
                if (doorX >= 0 && doorX < this.gridWidth && doorY >= 0 && doorY < this.gridHeight) {
                    this.grid[doorY][doorX].isObstacle = false;
                }
            }
        }
    }
    
    // Rendering
    
    render() {
        if (!this.ctx || !this.canvas) {
            console.error('Canvas or context not available for rendering');
            return;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.canvas.width, y * this.cellSize);
            this.ctx.stroke();
        }
        
        // Draw cells
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const node = this.grid[y][x];
                const cellX = x * this.cellSize;
                const cellY = y * this.cellSize;
                
                // Cell background
                if (node.isPath) {
                    this.ctx.fillStyle = '#7c3aed'; // Darker purple for better visibility
                } else if (node.isVisited) {
                    this.ctx.fillStyle = '#bee3f8';
                } else if (node.isOpen) {
                    this.ctx.fillStyle = '#fbb6ce';
                } else if (node.isObstacle) {
                    this.ctx.fillStyle = '#2d3748';
                } else {
                    this.ctx.fillStyle = 'white';
                }
                
                this.ctx.fillRect(cellX + 1, cellY + 1, this.cellSize - 2, this.cellSize - 2);
                
                // Add border for path cells
                if (node.isPath) {
                    this.ctx.strokeStyle = '#5b21b6'; // Darker purple border
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(cellX + 1, cellY + 1, this.cellSize - 2, this.cellSize - 2);
                }
                
                // Start and goal nodes
                if (x === this.startNode.x && y === this.startNode.y) {
                    this.ctx.fillStyle = '#48bb78';
                    this.ctx.fillRect(cellX + 3, cellY + 3, this.cellSize - 6, this.cellSize - 6);
                    
                    // Draw "S"
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '12px bold sans-serif';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('S', cellX + this.cellSize / 2, cellY + this.cellSize / 2 + 4);
                }
                
                if (x === this.goalNode.x && y === this.goalNode.y) {
                    this.ctx.fillStyle = '#f56565';
                    this.ctx.fillRect(cellX + 3, cellY + 3, this.cellSize - 6, this.cellSize - 6);
                    
                    // Draw "G"
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '12px bold sans-serif';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('G', cellX + this.cellSize / 2, cellY + this.cellSize / 2 + 4);
                }
            }
        }
        
        // Draw path connections for algorithms that support any-angle paths
        if (this.currentAlgorithm === 'theta_star' && this.pathNodes.length > 1) {
            this.ctx.strokeStyle = '#9f7aea';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            
            for (let i = 1; i < this.pathNodes.length; i++) {
                const prevNode = this.pathNodes[i - 1];
                const currNode = this.pathNodes[i];
                
                const prevX = prevNode.x * this.cellSize + this.cellSize / 2;
                const prevY = prevNode.y * this.cellSize + this.cellSize / 2;
                const currX = currNode.x * this.cellSize + this.cellSize / 2;
                const currY = currNode.y * this.cellSize + this.cellSize / 2;
                
                if (i === 1) {
                    this.ctx.moveTo(prevX, prevY);
                }
                this.ctx.lineTo(currX, currY);
            }
            
            this.ctx.stroke();
        }
    }
    
    // Performance tracking
    
    resetMetricsDisplay() {
        const executionTimeEl = document.getElementById('execution-time');
        if (executionTimeEl) executionTimeEl.textContent = '-';
        
        const nodesVisitedEl = document.getElementById('nodes-visited');
        if (nodesVisitedEl) nodesVisitedEl.textContent = '-';
        
        const nodesExpandedEl = document.getElementById('nodes-expanded');
        if (nodesExpandedEl) nodesExpandedEl.textContent = '-';
        
        const memoryUsageEl = document.getElementById('memory-usage');
        if (memoryUsageEl) memoryUsageEl.textContent = '-';
        
        const pathLengthEl = document.getElementById('path-length');
        if (pathLengthEl) pathLengthEl.textContent = '-';
        
        const successRateEl = document.getElementById('success-rate');
        if (successRateEl) successRateEl.textContent = '-';
        
        const optimalityEl = document.getElementById('optimality');
        if (optimalityEl) optimalityEl.textContent = '-';
    }
    
    updateRealTimeMetrics() {
        const currentTime = performance.now();
        const executionTime = this.startTime ? currentTime - this.startTime : 0;
        const currentNodesVisited = this.visitedNodes.length;
        const currentNodesExpanded = this.openNodes.length;
        
        // Update execution time in real-time
        const executionTimeEl = document.getElementById('execution-time');
        if (executionTimeEl) executionTimeEl.textContent = executionTime.toFixed(2) + 'ms';
        
        // Update nodes visited in real-time
        const nodesVisitedEl = document.getElementById('nodes-visited');
        if (nodesVisitedEl) nodesVisitedEl.textContent = currentNodesVisited;
        
        // Update nodes expanded in real-time
        const nodesExpandedEl = document.getElementById('nodes-expanded');
        if (nodesExpandedEl) nodesExpandedEl.textContent = currentNodesExpanded;
        
        // Update memory usage estimate
        const memoryUsageEl = document.getElementById('memory-usage');
        if (memoryUsageEl) memoryUsageEl.textContent = Math.round(currentNodesVisited * 0.1) + 'KB';
        
        // Update path length if path exists
        const pathLengthEl = document.getElementById('path-length');
        if (pathLengthEl) pathLengthEl.textContent = this.pathLength || '-';
        
        // Update success rate based on current state
        const successRateEl = document.getElementById('success-rate');
        if (successRateEl) {
            if (this.pathLength > 0) {
                successRateEl.textContent = '100%';
            } else if (this.isRunning) {
                successRateEl.textContent = 'Searching...';
            } else {
                successRateEl.textContent = '0%';
            }
        }
    }
    
    updatePerformanceMetrics() {
        const executionTime = this.endTime - this.startTime;
        this.nodesVisited = this.visitedNodes.length;
        
        const executionTimeEl = document.getElementById('execution-time');
        if (executionTimeEl) executionTimeEl.textContent = executionTime.toFixed(2) + 'ms';
        
        const nodesVisitedEl = document.getElementById('nodes-visited');
        if (nodesVisitedEl) nodesVisitedEl.textContent = this.nodesVisited;
        
        const pathLengthEl = document.getElementById('path-length');
        if (pathLengthEl) pathLengthEl.textContent = this.pathLength || 0;
        
        const nodesExpandedEl = document.getElementById('nodes-expanded');
        if (nodesExpandedEl) nodesExpandedEl.textContent = this.openNodes.length;
        
        const memoryUsageEl = document.getElementById('memory-usage');
        if (memoryUsageEl) memoryUsageEl.textContent = Math.round(this.visitedNodes.length * 0.1) + 'KB';
        
        // Enhanced success rate logic
        const successRateEl = document.getElementById('success-rate');
        if (successRateEl) {
            if (this.pathLength > 0) {
                successRateEl.textContent = '100%';
            } else {
                // Check if algorithm completed without finding path
                if (this.endTime > 0 && this.pathLength === 0) {
                    successRateEl.textContent = '0%';
                } else {
                    successRateEl.textContent = '-';
                }
            }
        }
        
        // Update optimality if it exists
        const optimalPath = this.calculateOptimalPath();
        const optimality = optimalPath > 0 && this.pathLength > 0 ? (optimalPath / this.pathLength * 100).toFixed(1) : '0';
        const optimalityEl = document.getElementById('optimality');
        if (optimalityEl) optimalityEl.textContent = optimality + '%';
    }
    
    calculateOptimalPath() {
        // Simple Manhattan distance as approximation of optimal path
        const dx = Math.abs(this.goalNode.x - this.startNode.x);
        const dy = Math.abs(this.goalNode.y - this.startNode.y);
        return dx + dy;
    }
    
    // Comparison functionality
    
    async showComparison() {
        const chartDiv = document.getElementById('comparison-chart');
        if (chartDiv) {
            // Show loading message
            const parent = chartDiv.parentElement;
            parent.style.display = 'block';
            chartDiv.innerHTML = '<p>Running comparison...</p>';
            
            // Scroll to comparison section
            parent.scrollIntoView({ behavior: 'smooth' });
        }
        
        await this.runComparison();
    }
    
    async runComparison() {
        const algorithms = ['astar', 'weighted_astar', 'dijkstra', 'theta_star', 'jps'];
        const results = [];
        
        for (const algorithm of algorithms) {
            // Save current state
            const originalAlgorithm = this.currentAlgorithm;
            this.currentAlgorithm = algorithm;
            
            // Run algorithm without visualization
            const originalSpeed = this.animationSpeed;
            this.animationSpeed = 0;
            
            this.clearVisualization();
            const startTime = performance.now();
            
            try {
                await this.runAlgorithm();
                const endTime = performance.now();
                
                results.push({
                    name: this.algorithmConfigs[algorithm].name,
                    time: (endTime - startTime).toFixed(2),
                    nodesVisited: this.visitedNodes.length,
                    pathLength: this.pathLength,
                    optimal: ['astar', 'dijkstra', 'theta_star'].includes(algorithm)
                });
            } catch (error) {
                results.push({
                    name: this.algorithmConfigs[algorithm].name,
                    time: 'N/A',
                    nodesVisited: 'N/A',
                    pathLength: 'N/A',
                    optimal: false
                });
            }
            
            // Restore settings
            this.animationSpeed = originalSpeed;
            this.currentAlgorithm = originalAlgorithm;
        }
        
        this.displayComparisonResults(results);
    }
    
    displayComparisonResults(results) {
        const chartDiv = document.getElementById('comparison-chart');
        if (!chartDiv) return;
        
        // Create comparison results HTML
        const html = `
            <h3>Algorithm Comparison Results</h3>
            <div class="comparison-results-inline">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Algorithm</th>
                            <th>Time (ms)</th>
                            <th>Nodes Visited</th>
                            <th>Path Length</th>
                            <th>Optimal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(result => `
                            <tr>
                                <td><strong>${result.name}</strong></td>
                                <td>${result.time}ms</td>
                                <td>${result.nodesVisited}</td>
                                <td>${result.pathLength}</td>
                                <td>${result.optimal ? 'Yes' : 'No'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="comparison-summary">
                    <h4>Performance Summary</h4>
                    <ul>
                        <li><strong>Fastest:</strong> ${this.getFastest(results)}</li>
                        <li><strong>Most Efficient:</strong> ${this.getMostEfficient(results)}</li>
                        <li><strong>Shortest Path:</strong> ${this.getShortestPath(results)}</li>
                    </ul>
                </div>
            </div>
        `;
        
        chartDiv.innerHTML = html;
    }
    
    getFastest(results) {
        const valid = results.filter(r => r.time !== 'N/A');
        if (valid.length === 0) return 'N/A';
        return valid.reduce((min, r) => parseFloat(r.time) < parseFloat(min.time) ? r : min).name;
    }
    
    getMostEfficient(results) {
        const valid = results.filter(r => r.nodesVisited !== 'N/A');
        if (valid.length === 0) return 'N/A';
        return valid.reduce((min, r) => r.nodesVisited < min.nodesVisited ? r : min).name;
    }
    
    getShortestPath(results) {
        const valid = results.filter(r => r.pathLength !== 'N/A');
        if (valid.length === 0) return 'N/A';
        return valid.reduce((min, r) => r.pathLength < min.pathLength ? r : min).name;
    }
    
    closeModal() {
        // Modal functionality removed - keeping for compatibility
    }
    
    // Utility methods
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});