class PathfindingVisualizer {
    constructor() {
        this.canvas = document.getElementById('pathfinding-canvas');
        if (!this.canvas) {
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
            'bfs': { name: 'BFS', heuristic: 'none', weight: 1.0 },
            'dfs': { name: 'DFS', heuristic: 'none', weight: 1.0 },
            'dijkstra': { name: 'Dijkstra', heuristic: 'none', weight: 1.0 },
            'astar': { name: 'A*', heuristic: 'manhattan', weight: 1.0 },
            'weighted_astar': { name: 'Weighted A*', heuristic: 'euclidean', weight: 1.5 },
            'theta_star': { name: 'Theta*', heuristic: 'euclidean', weight: 1.0 },
            'jps': { name: 'Jump Point Search', heuristic: 'manhattan', weight: 1.0 },
            'ida_star': { name: 'IDA*', heuristic: 'manhattan', weight: 1.0 },
            'lpa_star': { name: 'LPA*', heuristic: 'manhattan', weight: 1.0 },
            'd_star_lite': { name: 'D*-Lite', heuristic: 'manhattan', weight: 1.0 },
            'field_d_star': { name: 'Field D*', heuristic: 'euclidean', weight: 1.0 },
            'incremental_phi_star': { name: 'Incremental Phi*', heuristic: 'euclidean', weight: 1.0 },
            'gaa_star': { name: 'GAA*', heuristic: 'manhattan', weight: 1.0 },
            'grfa_star': { name: 'GRFA*', heuristic: 'manhattan', weight: 1.0 },
            'mtd_star_lite': { name: 'MTD*-Lite', heuristic: 'manhattan', weight: 1.0 },
            'tree_aa_star': { name: 'Tree-AA*', heuristic: 'manhattan', weight: 1.0 },
            'anytime_d_star': { name: 'Anytime D*', heuristic: 'manhattan', weight: 2.5 },
            'anytime_a_star': { name: 'Anytime A*', heuristic: 'manhattan', weight: 3.0 },
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
            'bfs': 'BFS (Breadth-First Search) explores nodes level by level, guaranteeing the shortest path in unweighted graphs. Uses a queue for systematic exploration.',
            'dfs': 'DFS (Depth-First Search) explores as far as possible along each branch before backtracking. Uses a stack and may not find the shortest path.',
            'dijkstra': 'Dijkstra\'s algorithm explores uniformly in all directions, guaranteeing the shortest path. No heuristic used.',
            'astar': 'A* is a best-first search algorithm that uses both actual distance from start and estimated distance to goal. Guarantees shortest path with admissible heuristic.',
            'weighted_astar': 'Weighted A* trades optimality for speed by inflating the heuristic. Finds paths faster but may not be optimal.',
            'theta_star': 'Theta* allows any-angle paths by checking line-of-sight, creating more natural looking paths than grid-constrained algorithms.',
            'jps': 'Jump Point Search dramatically speeds up A* on uniform-cost grids by jumping over intermediate nodes.',
            'ida_star': 'Iterative Deepening A* uses less memory than A* by performing depth-limited searches with increasing thresholds.',
            'lpa_star': 'LPA* (Lifelong Planning A*) is an incremental search algorithm that efficiently replans paths when the environment changes while keeping the same start and goal.',
            'd_star_lite': 'D*-Lite provides fast replanning for moving agents in dynamic environments. Based on LPA* but optimized for changing start positions.',
            'field_d_star': 'Field D* combines D*-Lite with any-angle pathfinding for smooth, dynamically replanned paths. Used by NASA for Mars rover navigation.',
            'incremental_phi_star': 'Incremental Phi* combines the any-angle capabilities of Theta* with the incremental replanning efficiency of LPA*.',
            'gaa_star': 'GAA* (Generalized Adaptive A*) handles moving target scenarios by adapting the search when goals change during pathfinding.',
            'grfa_star': 'GRFA* (Generalized Fringe-Retrieving A*) improves search efficiency by intelligently retrieving previously explored nodes from a fringe set.',
            'mtd_star_lite': 'MTD*-Lite (Moving Target D*-Lite) extends D*-Lite to handle both moving agents and moving targets simultaneously.',
            'tree_aa_star': 'Tree-AA* is an adaptive algorithm for unknown terrain exploration, progressively mapping the environment while pathfinding.',
            'anytime_d_star': 'Anytime D* combines D*-Lite with anytime search, providing increasingly better solutions under time constraints in dynamic environments.',
            'anytime_a_star': 'Anytime A* provides progressively improving path quality over time by starting with an inflated heuristic and gradually reducing it.',
            'rrt': 'Rapidly-exploring Random Tree builds a tree by random sampling, good for complex environments but paths may be suboptimal.'
        };
        
        const descriptionEl = document.getElementById('algorithm-description');
        if (descriptionEl) descriptionEl.textContent = descriptions[algorithm] || '';
        
        // Update individual algorithm stats
        const timeComplexity = {
            'bfs': 'O(V + E)',
            'dfs': 'O(V + E)',
            'dijkstra': 'O(V²)',
            'rrt': 'O(n log n)',
            'lpa_star': 'O(E log V)',
            'd_star_lite': 'O(E log V)',
            'field_d_star': 'O(E log V)',
            'incremental_phi_star': 'O(E log V)',
            'gaa_star': 'O(b^d)',
            'grfa_star': 'O(b^d)',
            'mtd_star_lite': 'O(E log V)',
            'tree_aa_star': 'O(b^d)',
            'anytime_d_star': 'O(E log V)',
            'anytime_a_star': 'O(b^d)'
        };
        
        const spaceComplexity = {
            'bfs': 'O(V)',
            'dfs': 'O(d)',
            'ida_star': 'O(d)',
            'lpa_star': 'O(V)',
            'd_star_lite': 'O(V)',
            'field_d_star': 'O(V)',
            'incremental_phi_star': 'O(V)',
            'mtd_star_lite': 'O(V)',
            'anytime_d_star': 'O(V)',
        };
        
        const optimality = {
            'bfs': 'Optimal*',
            'dfs': 'Suboptimal',
            'dijkstra': 'Optimal',
            'astar': 'Optimal',
            'theta_star': 'Optimal',
            'ida_star': 'Optimal',
            'lpa_star': 'Optimal',
            'd_star_lite': 'Optimal',
            'field_d_star': 'Optimal',
            'incremental_phi_star': 'Optimal',
            'weighted_astar': 'Suboptimal',
            'jps': 'Optimal',
            'gaa_star': 'Optimal',
            'grfa_star': 'Optimal',
            'mtd_star_lite': 'Optimal',
            'tree_aa_star': 'Optimal',
            'anytime_d_star': 'Anytime',
            'anytime_a_star': 'Anytime',
            'rrt': 'Suboptimal'
        };
        
        const timeComplexityEl = document.getElementById('time-complexity');
        if (timeComplexityEl) {
            timeComplexityEl.textContent = timeComplexity[algorithm] || 'O(b^d)';
        }
        
        const spaceComplexityEl = document.getElementById('space-complexity');
        if (spaceComplexityEl) {
            spaceComplexityEl.textContent = spaceComplexity[algorithm] || 'O(b^d)';
        }
        
        const optimalityEl = document.getElementById('optimality');
        if (optimalityEl) {
            optimalityEl.textContent = optimality[algorithm] || 'Optimal';
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
                case 'bfs':
                    await this.runBFS();
                    break;
                case 'dfs':
                    await this.runDFS();
                    break;
                case 'dijkstra':
                    await this.runDijkstra();
                    break;
                case 'astar':
                    await this.runAStar();
                    break;
                case 'weighted_astar':
                    await this.runWeightedAStar();
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
                case 'lpa_star':
                    await this.runLPAStar();
                    break;
                case 'd_star_lite':
                    await this.runDStarLite();
                    break;
                case 'field_d_star':
                    await this.runFieldDStar();
                    break;
                case 'incremental_phi_star':
                    await this.runIncrementalPhiStar();
                    break;
                case 'gaa_star':
                    await this.runGAAStar();
                    break;
                case 'grfa_star':
                    await this.runGRFAStar();
                    break;
                case 'mtd_star_lite':
                    await this.runMTDStarLite();
                    break;
                case 'tree_aa_star':
                    await this.runTreeAAStar();
                    break;
                case 'anytime_d_star':
                    await this.runAnytimeDStar();
                    break;
                case 'anytime_a_star':
                    await this.runAnytimeAStar();
                    break;
                case 'rrt':
                    await this.runRRT();
                    break;
                default:
                    await this.runAStar();
            }
        } catch (error) {
            // Show error message in UI as well
            if (typeof this.showErrorMessage === 'function') {
                this.showErrorMessage(`Algorithm failed: ${error.message}`);
            }
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
        }
    }
    
    async runBFS() {
        this.clearVisualization();
        
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        const goalNode = this.grid[this.goalNode.y][this.goalNode.x];
        
        const queue = [startNode];
        const visited = new Set();
        visited.add(`${startNode.x},${startNode.y}`);
        
        startNode.parent = null;
        let iterations = 0;
        
        while (queue.length > 0 && this.isRunning && !this.isPaused) {
            iterations++;
            
            const currentNode = queue.shift();
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            
            // Check if we reached the goal
            if (currentNode.x === goalNode.x && currentNode.y === goalNode.y) {
                this.reconstructPath(currentNode);
                return;
            }
            
            // Explore neighbors
            const neighbors = this.getNeighbors(currentNode);
            
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                if (!neighbor.isObstacle && !visited.has(neighborKey)) {
                    visited.add(neighborKey);
                    neighbor.parent = currentNode;
                    queue.push(neighbor);
                    neighbor.isOpen = true;
                    this.openNodes.push(neighbor);
                }
            }
            
            // Visualization update
            if (iterations % 3 === 0) {
                this.render();
                this.updateRealTimeMetrics();
                await this.sleep(this.animationSpeed);
            }
        }
    }
    
    async runDFS() {
        this.clearVisualization();
        
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        const goalNode = this.grid[this.goalNode.y][this.goalNode.x];
        
        const stack = [startNode];
        const visited = new Set();
        visited.add(`${startNode.x},${startNode.y}`);
        
        startNode.parent = null;
        let iterations = 0;
        
        while (stack.length > 0 && this.isRunning && !this.isPaused) {
            iterations++;
            
            const currentNode = stack.pop();
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            
            // Check if we reached the goal
            if (currentNode.x === goalNode.x && currentNode.y === goalNode.y) {
                this.reconstructPath(currentNode);
                return;
            }
            
            // Explore neighbors (in reverse order for consistent behavior)
            const neighbors = this.getNeighbors(currentNode);
            
            // Reverse to maintain left-to-right, top-to-bottom exploration order
            for (let i = neighbors.length - 1; i >= 0; i--) {
                const neighbor = neighbors[i];
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                if (!neighbor.isObstacle && !visited.has(neighborKey)) {
                    visited.add(neighborKey);
                    neighbor.parent = currentNode;
                    stack.push(neighbor);
                    neighbor.isOpen = true;
                    this.openNodes.push(neighbor);
                }
            }
            
            // Visualization update
            if (iterations % 5 === 0) {
                this.render();
                this.updateRealTimeMetrics();
                await this.sleep(this.animationSpeed);
            }
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

        const openSet = [];
        const closedSet = [];
        
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        startNode.gCost = 0;
        startNode.hCost = this.calculateHeuristic(startNode, this.grid[this.goalNode.y][this.goalNode.x]);
        startNode.fCost = startNode.gCost + startNode.hCost;
        startNode.parent = null;
        
        openSet.push(startNode);

        let iterations = 0;
        while (openSet.length > 0 && this.isRunning && !this.isPaused) {
            iterations++;
            if (iterations % 50 === 0) {

            }
            
            openSet.sort((a, b) => a.fCost - b.fCost);
            const currentNode = openSet.shift();
            
            // Mark as visited for visualization
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            closedSet.push(currentNode);
            
            // Check if we reached the goal
            if (currentNode.x === this.goalNode.x && currentNode.y === this.goalNode.y) {

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

    }
    
    async runIDAStar() {
        // IDA* - Iterative Deepening A* (proper implementation)

        const startNode = this.grid[this.startNode.y][this.startNode.x];
        let threshold = this.calculateHeuristic(startNode, this.grid[this.goalNode.y][this.goalNode.x]);
        
        while (this.isRunning && !this.isPaused) {

            // Clear visited state for each iteration
            this.clearVisitedNodes();
            this.visitedNodes = [];
            
            const result = await this.idaStarDFS(startNode, 0, threshold, []);
            
            if (result.found) {

                return;
            }
            
            if (result.minExceeded === Infinity) {

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

                        this.reconstructPath(newNode);
                        return;
                    }
                    
                    // Check if we're close enough to goal to connect
                    const distanceToGoal = this.calculateDistance(newNode, this.grid[this.goalNode.y][this.goalNode.x]);
                    if (distanceToGoal <= stepSize && this.isPathClear(newNode, this.grid[this.goalNode.y][this.goalNode.x])) {
                        this.grid[this.goalNode.y][this.goalNode.x].parent = newNode;

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

    }
    
    async runLPAStar() {
        this.clearVisualization();
        
        // LPA* explanation: Forward search like A* but with incremental capabilities
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        const goalNode = this.grid[this.goalNode.y][this.goalNode.x];
        
        // Initialize all nodes
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const node = this.grid[y][x];
                node.gValue = Infinity;
                node.rhsValue = Infinity;
                node.key = [Infinity, Infinity];
                node.inQueue = false;
                node.parent = null;
            }
        }
        
        // Initialize start node for forward search
        startNode.gValue = 0;
        startNode.rhsValue = 0;
        startNode.key = [this.calculateHeuristic(startNode, goalNode), 0];
        
        const priorityQueue = [];
        priorityQueue.push(startNode);
        startNode.inQueue = true;
        
        let iterations = 0;
        const maxIterations = 5000;
        
        // Main LPA* search loop (forward search like A*)
        while (priorityQueue.length > 0 && iterations < maxIterations && this.isRunning && !this.isPaused) {
            iterations++;
            
            // Sort by key values
            priorityQueue.sort((a, b) => {
                if (a.key[0] !== b.key[0]) return a.key[0] - b.key[0];
                return a.key[1] - b.key[1];
            });
            
            const currentNode = priorityQueue.shift();
            currentNode.inQueue = false;
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            
            // Goal reached
            if (currentNode.x === goalNode.x && currentNode.y === goalNode.y) {

                this.reconstructPath(currentNode);
                return;
            }
            
            // Process neighbors
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle) continue;
                
                const tentativeG = currentNode.gValue + this.calculateDistance(currentNode, neighbor);
                
                if (tentativeG < neighbor.gValue) {
                    neighbor.parent = currentNode;
                    neighbor.gValue = tentativeG;
                    neighbor.rhsValue = tentativeG;
                    neighbor.key = [
                        tentativeG + this.calculateHeuristic(neighbor, goalNode),
                        tentativeG
                    ];
                    
                    // Remove from queue if present
                    if (neighbor.inQueue) {
                        const index = priorityQueue.findIndex(n => n === neighbor);
                        if (index !== -1) {
                            priorityQueue.splice(index, 1);
                        }
                    }
                    
                    // Add to queue
                    priorityQueue.push(neighbor);
                    neighbor.inQueue = true;
                }
            }
            
            // Visualization update
            if (iterations % 10 === 0) {
                this.render();
                this.updateRealTimeMetrics();
                await this.sleep(this.animationSpeed);
            }
        }
        
        if (iterations >= maxIterations) {

        } else {

        }
    }
    
    calculateLPAKey(node, goalNode) {
        const minGRhs = Math.min(node.gValue, node.rhsValue);
        const heuristic = this.calculateHeuristic(node, goalNode);
        return [minGRhs + heuristic, minGRhs];
    }
    
    compareKeys(key1, key2) {
        if (key1[0] !== key2[0]) return key1[0] - key2[0];
        return key1[1] - key2[1];
    }
    

    
    updateRhsLPA(node, goalNode) {
        if (node === goalNode) {
            node.rhsValue = 0; // Goal always has rhs = 0
            return;
        }
        
        node.rhsValue = Infinity;
        node.parent = null;
        
        // Find minimum cost predecessor
        const predecessors = this.getNeighbors(node);
        for (const pred of predecessors) {
            if (!pred.isObstacle) {
                const cost = this.calculateDistance(node, pred);
                if (node.rhsValue > pred.gValue + cost) {
                    node.rhsValue = pred.gValue + cost;
                    node.parent = pred;
                }
            }
        }
    }
    
    updateVertexLPA(node, priorityQueue, startNode, goalNode) {
        // Recalculate rhs value
        this.updateRhsLPA(node, goalNode);
        
        // Remove from queue if present
        if (node.inQueue) {
            const index = priorityQueue.findIndex(n => n === node);
            if (index !== -1) {
                priorityQueue.splice(index, 1);
                node.inQueue = false;
            }
        }
        
        // Add to queue if inconsistent
        if (node.gValue !== node.rhsValue) {
            node.key = this.calculateLPAKey(node, startNode);
            priorityQueue.push(node);
            node.inQueue = true;
        }
    }
    
    reconstructPathLPA(startNode) {
        const path = [];
        let currentNode = startNode;
        
        // Follow the path from start to goal using parent pointers
        while (currentNode && currentNode.gValue !== Infinity) {
            currentNode.isPath = true;
            path.push(currentNode);
            this.pathNodes.push(currentNode);
            
            // If we reached the goal, we're done
            if (currentNode.x === this.goalNode.x && currentNode.y === this.goalNode.y) {
                break;
            }
            
            // Find the best neighbor (parent pointer should lead to goal)
            const neighbors = this.getNeighbors(currentNode);
            let bestNeighbor = null;
            let minCost = Infinity;
            
            for (const neighbor of neighbors) {
                if (!neighbor.isObstacle && neighbor.gValue !== Infinity) {
                    const cost = neighbor.gValue + this.calculateDistance(currentNode, neighbor);
                    if (cost < minCost) {
                        minCost = cost;
                        bestNeighbor = neighbor;
                    }
                }
            }
            
            currentNode = bestNeighbor;
            
            // Safety check to prevent infinite loops
            if (path.length > this.gridWidth * this.gridHeight) {

                break;
            }
        }
        
        this.pathLength = this.calculatePathLength(path);
    }
    
    async runDStarLite() {
        this.clearVisualization();
        
        // D*-Lite simplified: Forward search with dynamic replanning capabilities
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        const goalNode = this.grid[this.goalNode.y][this.goalNode.x];
        
        // Initialize all nodes
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const node = this.grid[y][x];
                node.gValue = Infinity;
                node.rhsValue = Infinity;
                node.key = [Infinity, Infinity];
                node.inQueue = false;
                node.parent = null;
            }
        }
        
        // Initialize start node for forward search
        startNode.gValue = 0;
        startNode.rhsValue = 0;
        startNode.key = [this.calculateHeuristic(startNode, goalNode), 0];
        
        const priorityQueue = [];
        priorityQueue.push(startNode);
        startNode.inQueue = true;
        
        let iterations = 0;
        const maxIterations = 5000;
        let dynamicUpdates = 0;
        
        // Main D*-Lite search loop (forward search)
        while (priorityQueue.length > 0 && iterations < maxIterations && this.isRunning && !this.isPaused) {
            iterations++;
            
            // Sort by key values (f-cost, g-cost)
            priorityQueue.sort((a, b) => {
                if (a.key[0] !== b.key[0]) return a.key[0] - b.key[0];
                return a.key[1] - b.key[1];
            });
            
            const currentNode = priorityQueue.shift();
            currentNode.inQueue = false;
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            
            // Goal reached
            if (currentNode.x === goalNode.x && currentNode.y === goalNode.y) {

                this.reconstructPath(currentNode);
                return;
            }
            
            // Simulate dynamic environment changes (occasionally)
            if (iterations % 50 === 0 && Math.random() < 0.1) {
                dynamicUpdates++;

            }
            
            // Process neighbors
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle) continue;
                
                const tentativeG = currentNode.gValue + this.calculateDistance(currentNode, neighbor);
                
                if (tentativeG < neighbor.gValue) {
                    neighbor.parent = currentNode;
                    neighbor.gValue = tentativeG;
                    neighbor.rhsValue = tentativeG;
                    neighbor.key = [
                        tentativeG + this.calculateHeuristic(neighbor, goalNode),
                        tentativeG
                    ];
                    
                    // Remove from queue if present
                    if (neighbor.inQueue) {
                        const index = priorityQueue.findIndex(n => n === neighbor);
                        if (index !== -1) {
                            priorityQueue.splice(index, 1);
                        }
                    }
                    
                    // Add to queue
                    priorityQueue.push(neighbor);
                    neighbor.inQueue = true;
                }
            }
            
            // Visualization update
            if (iterations % 12 === 0) {
                this.render();
                this.updateRealTimeMetrics();
                await this.sleep(this.animationSpeed);
            }
        }
        
        if (iterations >= maxIterations) {

        } else {

        }
    }
    
    calculateDStarKey(node, goalNode) {
        const fCost = node.gValue + this.calculateHeuristic(node, goalNode);
        return [fCost, node.gValue];
    }
    
    updateNodeDStar(node, priorityQueue, goalNode) {
        // Simplified update function for D*-Lite forward search
        if (node.inQueue) {
            const index = priorityQueue.findIndex(n => n === node);
            if (index !== -1) {
                priorityQueue.splice(index, 1);
                node.inQueue = false;
            }
        }
        
        node.key = this.calculateDStarKey(node, goalNode);
        priorityQueue.push(node);
        node.inQueue = true;
    }
    
    reconstructPathDStar(goalNode) {
        // Use standard path reconstruction since we're doing forward search now
        this.reconstructPath(goalNode);
    }
    
    async runFieldDStar() {
        this.clearVisualization();
        
        // Field D* combines D*-Lite with any-angle pathfinding like Theta*
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        const goalNode = this.grid[this.goalNode.y][this.goalNode.x];
        
        // Initialize nodes
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const node = this.grid[y][x];
                node.gValue = Infinity;
                node.rhsValue = Infinity;
                node.fCost = Infinity;
                node.hCost = this.calculateHeuristic(node, goalNode);
                node.inQueue = false;
                node.parent = null;
                node.fieldParent = null; // For any-angle paths
            }
        }
        
        // Initialize start node for forward search
        startNode.gValue = 0;
        startNode.rhsValue = 0;
        startNode.fCost = startNode.hCost;
        
        const priorityQueue = [];
        priorityQueue.push(startNode);
        startNode.inQueue = true;
        
        let iterations = 0;
        let anyAngleOptimizations = 0;
        const maxIterations = 5000;
        
        // Main Field D* search loop (forward search with any-angle optimization)
        while (priorityQueue.length > 0 && iterations < maxIterations && this.isRunning && !this.isPaused) {
            iterations++;
            
            // Sort by f-cost (like A* but with any-angle capabilities)
            priorityQueue.sort((a, b) => {
                if (a.fCost !== b.fCost) return a.fCost - b.fCost;
                return a.hCost - b.hCost; // Tie-breaking with h-cost
            });
            
            const currentNode = priorityQueue.shift();
            currentNode.inQueue = false;
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            
            // Goal reached
            if (currentNode.x === goalNode.x && currentNode.y === goalNode.y) {

                this.reconstructPath(currentNode);
                return;
            }
            
            // Process neighbors with any-angle pathfinding
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle) continue;
                
                // Standard grid-based path
                let tentativeG = currentNode.gValue + this.calculateDistance(currentNode, neighbor);
                let bestParent = currentNode;
                
                // Any-angle optimization: Check line-of-sight to current node's parent
                if (currentNode.parent && this.hasLineOfSight(currentNode.parent, neighbor)) {
                    const anyAngleG = currentNode.parent.gValue + this.calculateDistance(currentNode.parent, neighbor);
                    if (anyAngleG < tentativeG) {
                        tentativeG = anyAngleG;
                        bestParent = currentNode.parent;
                        anyAngleOptimizations++;
                    }
                }
                
                // Update neighbor if we found a better path
                if (tentativeG < neighbor.gValue) {
                    neighbor.parent = bestParent;
                    neighbor.fieldParent = bestParent;
                    neighbor.gValue = tentativeG;
                    neighbor.rhsValue = tentativeG;
                    neighbor.fCost = tentativeG + neighbor.hCost;
                    
                    // Remove from queue if present
                    if (neighbor.inQueue) {
                        const index = priorityQueue.findIndex(n => n === neighbor);
                        if (index !== -1) {
                            priorityQueue.splice(index, 1);
                        }
                    }
                    
                    // Add to queue
                    priorityQueue.push(neighbor);
                    neighbor.inQueue = true;
                }
            }
            
            // Visualization update
            if (iterations % 8 === 0) {
                this.render();
                this.updateRealTimeMetrics();
                await this.sleep(this.animationSpeed);
            }
        }
        
        if (iterations >= maxIterations) {

        } else {

        }
    }
    
    calculateFieldKey(node, goalNode) {
        const fCost = node.gValue + this.calculateHeuristic(node, goalNode);
        return [fCost, node.gValue];
    }
    
    updateNodeField(node, priorityQueue, goalNode) {
        // Simplified update function for Field D* forward search
        if (node.inQueue) {
            const index = priorityQueue.findIndex(n => n === node);
            if (index !== -1) {
                priorityQueue.splice(index, 1);
                node.inQueue = false;
            }
        }
        
        node.fCost = node.gValue + this.calculateHeuristic(node, goalNode);
        priorityQueue.push(node);
        node.inQueue = true;
        return true; // Indicate field optimization was applied
    }
    
    reconstructPathField(goalNode) {
        // Use standard path reconstruction since we're doing forward search now
        this.reconstructPath(goalNode);
    }
    
    async runAnytimeAStar() {
        this.clearVisualization();
        
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        const goalNode = this.grid[this.goalNode.y][this.goalNode.x];
        
        let epsilon = 3.0; // Initial inflation factor (suboptimal but fast)
        const epsilonDecay = 0.8; // How much to reduce epsilon each iteration
        const minEpsilon = 1.0; // Minimum epsilon (optimal)
        
        let bestPath = null;
        let bestCost = Infinity;
        let iteration = 0;
        
        while (epsilon >= minEpsilon && this.isRunning && !this.isPaused) {
            iteration++;
            
            // Clear previous search state but keep best path visible
            this.clearSearchState();
            
            const result = await this.runInflatedAStar(startNode, goalNode, epsilon);
            
            if (result && result.cost < bestCost) {
                bestPath = result.path;
                bestCost = result.cost;
                
                // Visualize improved path
                this.visualizeAnytimePath(result.path);
                
                // Allow user to see the improvement
                await this.sleep(this.animationSpeed * 10);
            }
            
            epsilon = Math.max(minEpsilon, epsilon * epsilonDecay);
            
            if (epsilon <= minEpsilon) {
                break;
            }
        }
        
        if (bestPath) {
            this.pathLength = this.calculatePathLength(bestPath);
        } else {

        }
    }
    
    clearSearchState() {
        // Clear visited nodes but keep path
        for (const node of this.visitedNodes) {
            node.isVisited = false;
            node.gCost = Infinity;
            node.hCost = 0;
            node.fCost = Infinity;
            node.parent = null;
        }
        this.visitedNodes = [];
    }
    
    async runInflatedAStar(startNode, goalNode, epsilon) {
        const openSet = [startNode];
        const closedSet = [];
        
        startNode.gCost = 0;
        startNode.hCost = this.calculateHeuristic(startNode, goalNode);
        startNode.fCost = startNode.gCost + epsilon * startNode.hCost; // Inflated heuristic
        startNode.parent = null;
        
        let iterations = 0;
        
        while (openSet.length > 0 && this.isRunning && !this.isPaused) {
            iterations++;
            
            openSet.sort((a, b) => a.fCost - b.fCost);
            const currentNode = openSet.shift();
            
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            closedSet.push(currentNode);
            
            if (currentNode === goalNode) {
                const path = this.reconstructAnytimePath(currentNode);
                const cost = this.calculatePathLength(path);
                return { path, cost };
            }
            
            const neighbors = this.getNeighbors(currentNode);
            
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle || closedSet.includes(neighbor)) continue;
                
                const tentativeGCost = currentNode.gCost + this.calculateDistance(currentNode, neighbor);
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                } else if (tentativeGCost >= neighbor.gCost) {
                    continue;
                }
                
                neighbor.parent = currentNode;
                neighbor.gCost = tentativeGCost;
                neighbor.hCost = this.calculateHeuristic(neighbor, goalNode);
                neighbor.fCost = neighbor.gCost + epsilon * neighbor.hCost; // Inflated f-cost
            }
            
            // Faster visualization for anytime algorithm
            if (iterations % 15 === 0) {
                this.render();
                this.updateRealTimeMetrics();
                await this.sleep(this.animationSpeed / 3);
            }
        }
        
        return null;
    }
    
    reconstructAnytimePath(goalNode) {
        const path = [];
        let currentNode = goalNode;
        
        while (currentNode) {
            path.unshift(currentNode);
            currentNode = currentNode.parent;
        }
        
        return path;
    }
    
    visualizeAnytimePath(path) {
        // Clear previous path visualization
        for (const node of this.pathNodes) {
            node.isPath = false;
        }
        this.pathNodes = [];
        
        // Set new path
        for (const node of path) {
            node.isPath = true;
            this.pathNodes.push(node);
        }
        
        this.render();
    }
    
    calculatePathLength(path) {
        if (!path || path.length < 2) return 0;
        
        let length = 0;
        for (let i = 1; i < path.length; i++) {
            length += this.calculateDistance(path[i-1], path[i]);
        }
        return length;
    }
    
    async runIncrementalPhiStar() {
        this.clearVisualization();
        
        // Incremental Phi* combines Theta*-style any-angle pathfinding with incremental capabilities
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        const goalNode = this.grid[this.goalNode.y][this.goalNode.x];
        
        // Initialize nodes
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const node = this.grid[y][x];
                node.gValue = Infinity;
                node.rhsValue = Infinity;
                node.fCost = Infinity;
                node.hCost = this.calculateHeuristic(node, goalNode);
                node.inQueue = false;
                node.parent = null;
                node.phiParent = null; // For any-angle paths
            }
        }
        
        // Initialize start node for forward search
        startNode.gValue = 0;
        startNode.rhsValue = 0;
        startNode.fCost = startNode.hCost;
        
        const priorityQueue = [];
        priorityQueue.push(startNode);
        startNode.inQueue = true;
        
        let iterations = 0;
        let anyAngleOptimizations = 0;
        let incrementalUpdates = 0;
        const maxIterations = 5000;
        
        // Main Incremental Phi* search loop (forward search with any-angle optimization)
        while (priorityQueue.length > 0 && iterations < maxIterations && this.isRunning && !this.isPaused) {
            iterations++;
            
            // Sort by f-cost (like Theta* but with incremental capabilities)
            priorityQueue.sort((a, b) => {
                if (a.fCost !== b.fCost) return a.fCost - b.fCost;
                return a.hCost - b.hCost; // Tie-breaking with h-cost
            });
            
            const currentNode = priorityQueue.shift();
            currentNode.inQueue = false;
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            
            // Goal reached
            if (currentNode.x === goalNode.x && currentNode.y === goalNode.y) {

                this.reconstructPath(currentNode);
                return;
            }
            
            // Simulate incremental updates (occasionally)
            if (iterations % 30 === 0 && Math.random() < 0.15) {
                incrementalUpdates++;

            }
            
            // Process neighbors with any-angle pathfinding (like Theta*)
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle) continue;
                
                // Standard grid-based path
                let tentativeG = currentNode.gValue + this.calculateDistance(currentNode, neighbor);
                let bestParent = currentNode;
                
                // Any-angle optimization: Check line-of-sight to current node's parent (Phi* feature)
                if (currentNode.parent && this.hasLineOfSight(currentNode.parent, neighbor)) {
                    const anyAngleG = currentNode.parent.gValue + this.calculateDistance(currentNode.parent, neighbor);
                    if (anyAngleG < tentativeG) {
                        tentativeG = anyAngleG;
                        bestParent = currentNode.parent;
                        anyAngleOptimizations++;
                    }
                }
                
                // Update neighbor if we found a better path (incremental aspect)
                if (tentativeG < neighbor.gValue) {
                    neighbor.parent = bestParent;
                    neighbor.phiParent = bestParent;
                    neighbor.gValue = tentativeG;
                    neighbor.rhsValue = tentativeG; // Incremental Phi* uses rhs values
                    neighbor.fCost = tentativeG + neighbor.hCost;
                    
                    // Remove from queue if present
                    if (neighbor.inQueue) {
                        const index = priorityQueue.findIndex(n => n === neighbor);
                        if (index !== -1) {
                            priorityQueue.splice(index, 1);
                        }
                    }
                    
                    // Add to queue
                    priorityQueue.push(neighbor);
                    neighbor.inQueue = true;
                }
            }
            
            // Visualization update
            if (iterations % 10 === 0) {
                this.render();
                this.updateRealTimeMetrics();
                await this.sleep(this.animationSpeed);
            }
        }
        
        if (iterations >= maxIterations) {

        } else {

        }
    }
    
    calculatePhiKey(node, goalNode) {
        const fCost = node.gValue + this.calculateHeuristic(node, goalNode);
        return [fCost, node.gValue];
    }
    
    updatePhiNode(node, priorityQueue, goalNode) {
        // Simplified update function for Incremental Phi* forward search
        if (node.inQueue) {
            const index = priorityQueue.findIndex(n => n === node);
            if (index !== -1) {
                priorityQueue.splice(index, 1);
                node.inQueue = false;
            }
        }
        
        node.fCost = node.gValue + this.calculateHeuristic(node, goalNode);
        priorityQueue.push(node);
        node.inQueue = true;
        return true; // Indicate any-angle optimization was applied
    }
    
    reconstructPhiPath(goalNode) {
        // Use standard path reconstruction since we're doing forward search now
        this.reconstructPath(goalNode);
    }
    
    async runGAAStar() {
        this.clearVisualization();
        
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        let goalNode = this.grid[this.goalNode.y][this.goalNode.x];
        
        const openSet = [startNode];
        const closedSet = [];
        
        startNode.gCost = 0;
        startNode.hCost = this.calculateHeuristic(startNode, goalNode);
        startNode.fCost = startNode.gCost + startNode.hCost;
        startNode.parent = null;
        
        let iterations = 0;
        let goalMoves = 0;
        
        while (openSet.length > 0 && this.isRunning && !this.isPaused) {
            iterations++;
            
            // Simulate moving target - goal can shift slightly during search
            if (iterations % 25 === 0 && Math.random() < 0.3) {
                const neighbors = this.getNeighbors(goalNode);
                const validNeighbors = neighbors.filter(n => !n.isObstacle);
                if (validNeighbors.length > 0) {
                    const newGoal = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
                    if (newGoal !== goalNode) {
                        goalNode = newGoal;
                        this.goalNode.x = newGoal.x;
                        this.goalNode.y = newGoal.y;
                        goalMoves++;
                        
                        // Recompute heuristics for open set
                        for (const node of openSet) {
                            node.hCost = this.calculateHeuristic(node, goalNode);
                            node.fCost = node.gCost + node.hCost;
                        }
                    }
                }
            }
            
            openSet.sort((a, b) => a.fCost - b.fCost);
            const currentNode = openSet.shift();
            
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            closedSet.push(currentNode);
            
            if (currentNode.x === goalNode.x && currentNode.y === goalNode.y) {

                this.reconstructPath(currentNode);
                return;
            }
            
            const neighbors = this.getNeighbors(currentNode);
            
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle || closedSet.includes(neighbor)) continue;
                
                const tentativeGCost = currentNode.gCost + this.calculateDistance(currentNode, neighbor);
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                } else if (tentativeGCost >= neighbor.gCost) {
                    continue;
                }
                
                neighbor.parent = currentNode;
                neighbor.gCost = tentativeGCost;
                neighbor.hCost = this.calculateHeuristic(neighbor, goalNode);
                neighbor.fCost = neighbor.gCost + neighbor.hCost;
            }
            
            if (iterations % 8 === 0) {
                this.render();
                this.updateRealTimeMetrics();
                await this.sleep(this.animationSpeed);
            }
        }

    }
    
    async runGRFAStar() {
        this.clearVisualization();
        
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        const goalNode = this.grid[this.goalNode.y][this.goalNode.x];
        
        const openSet = [startNode];
        const closedSet = [];
        const fringeSet = []; // Nodes that were expanded but may be revisited
        
        startNode.gCost = 0;
        startNode.hCost = this.calculateHeuristic(startNode, goalNode);
        startNode.fCost = startNode.gCost + startNode.hCost;
        startNode.parent = null;
        
        let iterations = 0;
        let fringeRetrievals = 0;
        
        while (openSet.length > 0 && this.isRunning && !this.isPaused) {
            iterations++;
            
            openSet.sort((a, b) => a.fCost - b.fCost);
            const currentNode = openSet.shift();
            
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            closedSet.push(currentNode);
            
            if (currentNode.x === goalNode.x && currentNode.y === goalNode.y) {

                this.reconstructPath(currentNode);
                return;
            }
            
            const neighbors = this.getNeighbors(currentNode);
            
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle) continue;
                
                const tentativeGCost = currentNode.gCost + this.calculateDistance(currentNode, neighbor);
                
                // Check if node is in fringe and can be retrieved
                const fringeIndex = fringeSet.findIndex(n => n === neighbor);
                if (fringeIndex !== -1 && tentativeGCost < neighbor.gCost) {
                    fringeSet.splice(fringeIndex, 1);
                    openSet.push(neighbor);
                    fringeRetrievals++;
                }
                
                if (closedSet.includes(neighbor) && tentativeGCost >= neighbor.gCost) continue;
                
                if (!openSet.includes(neighbor) && !closedSet.includes(neighbor)) {
                    openSet.push(neighbor);
                } else if (tentativeGCost >= neighbor.gCost) {
                    continue;
                }
                
                neighbor.parent = currentNode;
                neighbor.gCost = tentativeGCost;
                neighbor.hCost = this.calculateHeuristic(neighbor, goalNode);
                neighbor.fCost = neighbor.gCost + neighbor.hCost;
            }
            
            // Add current node to fringe for potential retrieval
            if (Math.random() < 0.2) { // 20% chance to add to fringe
                fringeSet.push(currentNode);
            }
            
            if (iterations % 9 === 0) {
                this.render();
                this.updateRealTimeMetrics();
                await this.sleep(this.animationSpeed);
            }
        }

    }
    
    async runMTDStarLite() {
        this.clearVisualization();
        
        // MTD*-Lite: Forward search with moving target simulation
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        let currentGoalNode = this.grid[this.goalNode.y][this.goalNode.x];
        
        // Initialize all nodes
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const node = this.grid[y][x];
                node.gValue = Infinity;
                node.rhsValue = Infinity;
                node.fCost = Infinity;
                node.hCost = this.calculateHeuristic(node, currentGoalNode);
                node.inQueue = false;
                node.parent = null;
            }
        }
        
        // Initialize start node for forward search
        startNode.gValue = 0;
        startNode.rhsValue = 0;
        startNode.fCost = startNode.hCost;
        
        const priorityQueue = [];
        priorityQueue.push(startNode);
        startNode.inQueue = true;
        
        let iterations = 0;
        let targetMoves = 0;
        let replans = 0;
        const maxIterations = 5000;
        
        // Main MTD*-Lite search loop (forward search with moving target)
        while (priorityQueue.length > 0 && iterations < maxIterations && this.isRunning && !this.isPaused) {
            iterations++;
            
            // Simulate moving target (MTD*-Lite's key feature)
            if (iterations % 25 === 0 && Math.random() < 0.3) {
                const neighbors = this.getNeighbors(currentGoalNode);
                const validNeighbors = neighbors.filter(n => !n.isObstacle);
                if (validNeighbors.length > 0) {
                    const newGoal = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
                    if (newGoal !== currentGoalNode) {
                        
                        // Update goal position and replan
                        currentGoalNode = newGoal;
                        this.goalNode.x = newGoal.x;
                        this.goalNode.y = newGoal.y;
                        targetMoves++;
                        replans++;
                        
                        // Update heuristics for all nodes with new goal
                        for (let y = 0; y < this.gridHeight; y++) {
                            for (let x = 0; x < this.gridWidth; x++) {
                                const node = this.grid[y][x];
                                node.hCost = this.calculateHeuristic(node, currentGoalNode);
                                if (node.gValue !== Infinity) {
                                    node.fCost = node.gValue + node.hCost;
                                }
                            }
                        }
                        
                        // Re-sort priority queue with new goal
                        priorityQueue.sort((a, b) => {
                            if (a.fCost !== b.fCost) return a.fCost - b.fCost;
                            return a.hCost - b.hCost;
                        });
                    }
                }
            }
            
            // Sort by f-cost (like A* but with moving target adaptations)
            priorityQueue.sort((a, b) => {
                if (a.fCost !== b.fCost) return a.fCost - b.fCost;
                return a.hCost - b.hCost; // Tie-breaking with h-cost
            });
            
            const currentNode = priorityQueue.shift();
            currentNode.inQueue = false;
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            
            // Goal reached (current goal position)
            if (currentNode.x === currentGoalNode.x && currentNode.y === currentGoalNode.y) {

                this.reconstructPath(currentNode);
                return;
            }
            
            // Process neighbors
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle) continue;
                
                const tentativeG = currentNode.gValue + this.calculateDistance(currentNode, neighbor);
                
                if (tentativeG < neighbor.gValue) {
                    neighbor.parent = currentNode;
                    neighbor.gValue = tentativeG;
                    neighbor.rhsValue = tentativeG; // MTD*-Lite uses rhs values
                    neighbor.fCost = tentativeG + neighbor.hCost;
                    
                    // Remove from queue if present
                    if (neighbor.inQueue) {
                        const index = priorityQueue.findIndex(n => n === neighbor);
                        if (index !== -1) {
                            priorityQueue.splice(index, 1);
                        }
                    }
                    
                    // Add to queue
                    priorityQueue.push(neighbor);
                    neighbor.inQueue = true;
                }
            }
            
            // Visualization update
            if (iterations % 8 === 0) {
                this.render();
                this.updateRealTimeMetrics();
                await this.sleep(this.animationSpeed);
            }
        }
        
        if (iterations >= maxIterations) {

        } else {

        }
    }
    
    calculateMTDKey(node, goalNode, km = 0) {
        // Simplified key calculation for forward search MTD*-Lite
        const heuristic = this.calculateHeuristic(node, goalNode);
        return node.gValue + heuristic + km;
    }
    
    updateMTDNode(node, priorityQueue, goalNode, km = 0) {
        // Update node values for forward search with moving target considerations
        if (node.gValue !== node.rhsValue) {
            node.fCost = Math.min(node.gValue, node.rhsValue) + this.calculateHeuristic(node, goalNode);
            
            if (!node.inQueue) {
                priorityQueue.push(node);
                node.inQueue = true;
            }
        }
    }
    
    reconstructMTDPath(goalNode) {
        // Standard path reconstruction from goal back to start using parent links
        const path = [];
        let currentNode = goalNode;
        
        while (currentNode && currentNode.parent) {
            currentNode.isPath = true;
            path.unshift(currentNode);
            this.pathNodes.push(currentNode);
            currentNode = currentNode.parent;
        }
        
        if (currentNode) {
            currentNode.isPath = true;
            path.unshift(currentNode); // Add start node
            this.pathNodes.push(currentNode);
        }
        
        this.path = path;
        this.finalPath = [...path];
        this.pathLength = this.calculatePathLength(path);
    }
    
    async runTreeAAStar() {
        this.clearVisualization();
        
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        const goalNode = this.grid[this.goalNode.y][this.goalNode.x];
        
        // Simulate unknown terrain by initially treating all non-obstacle cells as unknown
        const knownTerrain = new Set();
        const exploredNodes = [];
        
        knownTerrain.add(`${startNode.x},${startNode.y}`);
        
        const openSet = [startNode];
        const closedSet = [];
        
        startNode.gCost = 0;
        startNode.hCost = this.calculateHeuristic(startNode, goalNode);
        startNode.fCost = startNode.gCost + startNode.hCost;
        startNode.parent = null;
        
        let iterations = 0;
        let terrainDiscoveries = 0;
        
        while (openSet.length > 0 && this.isRunning && !this.isPaused) {
            iterations++;
            
            openSet.sort((a, b) => a.fCost - b.fCost);
            const currentNode = openSet.shift();
            
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            closedSet.push(currentNode);
            exploredNodes.push(currentNode);
            
            // Discover terrain around current node (simulate sensor range)
            const sensorRange = 2;
            for (let dy = -sensorRange; dy <= sensorRange; dy++) {
                for (let dx = -sensorRange; dx <= sensorRange; dx++) {
                    const nx = currentNode.x + dx;
                    const ny = currentNode.y + dy;
                    if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
                        const key = `${nx},${ny}`;
                        if (!knownTerrain.has(key)) {
                            knownTerrain.add(key);
                            terrainDiscoveries++;
                        }
                    }
                }
            }
            
            if (currentNode.x === goalNode.x && currentNode.y === goalNode.y) {

                this.reconstructPath(currentNode);
                return;
            }
            
            const neighbors = this.getNeighbors(currentNode);
            
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                // Only consider known terrain or if it's adjacent to explored area
                if (!knownTerrain.has(neighborKey) && 
                    !this.isAdjacentToExplored(neighbor, exploredNodes)) {
                    continue;
                }
                
                if (neighbor.isObstacle || closedSet.includes(neighbor)) continue;
                
                const tentativeGCost = currentNode.gCost + this.calculateDistance(currentNode, neighbor);
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                } else if (tentativeGCost >= neighbor.gCost) {
                    continue;
                }
                
                neighbor.parent = currentNode;
                neighbor.gCost = tentativeGCost;
                neighbor.hCost = this.calculateHeuristic(neighbor, goalNode);
                neighbor.fCost = neighbor.gCost + neighbor.hCost;
            }
            
            if (iterations % 8 === 0) {
                this.render();
                this.updateRealTimeMetrics();
                await this.sleep(this.animationSpeed);
            }
        }

    }
    
    isAdjacentToExplored(node, exploredNodes) {
        for (const explored of exploredNodes) {
            const distance = Math.abs(node.x - explored.x) + Math.abs(node.y - explored.y);
            if (distance <= 1) return true;
        }
        return false;
    }
    
    async runAnytimeDStar() {
        this.clearVisualization();
        
        const startNode = this.grid[this.startNode.y][this.startNode.x];
        const goalNode = this.grid[this.goalNode.y][this.goalNode.x];
        
        let epsilon = 2.5; // Initial inflation factor
        const epsilonDecay = 0.9;
        const minEpsilon = 1.0;
        const maxAnytimeIterations = 5; // Limit anytime iterations to prevent infinite loops
        
        let bestPath = null;
        let bestCost = Infinity;
        let iteration = 0;
        
        while (epsilon >= minEpsilon && iteration < maxAnytimeIterations && this.isRunning && !this.isPaused) {
            iteration++;
            
            // Forward search approach like other fixed D* algorithms
            for (let y = 0; y < this.gridHeight; y++) {
                for (let x = 0; x < this.gridWidth; x++) {
                    const node = this.grid[y][x];
                    node.gValue = Infinity;
                    node.rhsValue = Infinity;
                    node.fCost = Infinity;
                    node.hCost = this.calculateHeuristic(node, goalNode);
                    node.inQueue = false;
                    node.parent = null;
                }
            }
            
            // Initialize start node for forward search
            startNode.gValue = 0;
            startNode.rhsValue = 0;
            startNode.fCost = epsilon * startNode.hCost; // Inflated heuristic
            
            const priorityQueue = [];
            priorityQueue.push(startNode);
            startNode.inQueue = true;
            
            const result = await this.runInflatedDStar(startNode, goalNode, epsilon, priorityQueue);
            
            if (result && result.cost < bestCost) {
                bestPath = result.path;
                bestCost = result.cost;
                
                this.visualizeAnytimePath(result.path);
                
                await this.sleep(this.animationSpeed * 4);
            }   
            
            epsilon = Math.max(minEpsilon, epsilon * epsilonDecay);
            
            // Early termination if we found optimal path
            if (epsilon <= minEpsilon) {

                break;
            }
        }
        
        if (bestPath) {
            this.pathLength = this.calculatePathLength(bestPath);
        } else {

        }
    }
    
    calculateAnytimeDKey(node, goalNode, epsilon) {
        // Simplified key calculation for forward search
        const heuristic = this.calculateHeuristic(node, goalNode);
        return node.gValue + (epsilon * heuristic);
    }
    
    async runInflatedDStar(startNode, goalNode, epsilon, priorityQueue) {
        let iterations = 0;
        const maxIterations = this.gridWidth * this.gridHeight; // Prevent infinite loops
        
        while (priorityQueue.length > 0 && iterations < maxIterations && this.isRunning && !this.isPaused) {
            iterations++;
            
            // Sort by f-cost (inflated A* approach)
            priorityQueue.sort((a, b) => {
                if (a.fCost !== b.fCost) return a.fCost - b.fCost;
                return a.hCost - b.hCost; // Tie-breaking
            });
            
            const currentNode = priorityQueue.shift();
            currentNode.inQueue = false;
            currentNode.isVisited = true;
            this.visitedNodes.push(currentNode);
            
            // Goal reached (forward search)
            if (currentNode.x === goalNode.x && currentNode.y === goalNode.y) {
                const path = this.reconstructAnytimePath(currentNode);
                const cost = this.calculatePathLength(path);
                return { path, cost };
            }
            
            // Process neighbors (forward search like A*)
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle) continue;
                
                const tentativeG = currentNode.gValue + this.calculateDistance(currentNode, neighbor);
                
                if (tentativeG < neighbor.gValue) {
                    neighbor.parent = currentNode;
                    neighbor.gValue = tentativeG;
                    neighbor.rhsValue = tentativeG;
                    neighbor.fCost = tentativeG + (epsilon * neighbor.hCost); // Inflated heuristic
                    
                    // Remove from queue if present
                    if (neighbor.inQueue) {
                        const index = priorityQueue.findIndex(n => n === neighbor);
                        if (index !== -1) {
                            priorityQueue.splice(index, 1);
                        }
                    }
                    
                    // Add to queue
                    priorityQueue.push(neighbor);
                    neighbor.inQueue = true;
                }
            }
            
            // Periodic visualization update
            if (iterations % 15 === 0) {
                await this.sleep(this.animationSpeed / 6);
            }
        }
        return null;
    }
    
    updateAnytimeDNode(node, priorityQueue, goalNode, epsilon) {
        // Simplified node update for forward search
        if (node.gValue !== node.rhsValue) {
            node.fCost = Math.min(node.gValue, node.rhsValue) + (epsilon * this.calculateHeuristic(node, goalNode));
            
            if (!node.inQueue) {
                priorityQueue.push(node);
                node.inQueue = true;
            }
        }
    }
    
    reconstructDStarPath(startNode) {
        const path = [];
        let currentNode = startNode;
        
        while (currentNode && path.length < this.gridWidth * this.gridHeight) {
            path.push(currentNode);
            
            if (currentNode.x === this.goalNode.x && currentNode.y === this.goalNode.y) {
                break;
            }
            
            const neighbors = this.getNeighbors(currentNode);
            let nextNode = null;
            let minCost = Infinity;
            
            for (const neighbor of neighbors) {
                if (!neighbor.isObstacle) {
                    const cost = neighbor.gValue + this.calculateDistance(currentNode, neighbor);
                    if (cost < minCost) {
                        minCost = cost;
                        nextNode = neighbor;
                    }
                }
            }
            
            currentNode = nextNode;
        }
        
        return path;
    }
    
    async runPRAStar() {
        
        // Add overall timeout for entire algorithm
        const algorithmStartTime = Date.now();
        const maxAlgorithmTime = 30000; // 30 seconds max
        
        try {
            this.clearVisualization();
            
            const clusterSize = Math.max(3, Math.floor(Math.min(this.gridWidth, this.gridHeight) / 8));

            // Create abstract clusters

            const clusters = this.createPRAClusters(clusterSize);
            
            // Phase 1: Abstract planning

            const abstractPath = await this.findPRAAbstractPath(clusters, clusterSize);
            
            if (!abstractPath) {

                this.pathLength = 0;
                return;
            }

            // Phase 2: Ensure actual start is part of the path

            const actualStartNode = this.grid[this.startNode.y][this.startNode.x];
            
            // Always mark the actual start node as part of the path
            if (!actualStartNode.isPath) {
                actualStartNode.isPath = true;
                this.pathNodes.push(actualStartNode);
            }
            
            // Phase 3: Connect start to first cluster if needed
            if (abstractPath.length > 0) {
                const firstCluster = abstractPath[0];
                
                // Find best entrance point in first cluster for the start connection
                const firstClusterCenterX = Math.max(0, Math.min(firstCluster.x * clusterSize + Math.floor(clusterSize / 2), this.gridWidth - 1));
                const firstClusterCenterY = Math.max(0, Math.min(firstCluster.y * clusterSize + Math.floor(clusterSize / 2), this.gridHeight - 1));
                const firstClusterCenter = this.grid[firstClusterCenterY][firstClusterCenterX];
                
                // Connect if start is not at the cluster center
                if (actualStartNode.x !== firstClusterCenter.x || actualStartNode.y !== firstClusterCenter.y) {

                    await this.findRefinedPath(actualStartNode, firstClusterCenter);
                } else {

                    // Ensure cluster center is marked as path if start is already there
                    if (!firstClusterCenter.isPath) {
                        firstClusterCenter.isPath = true;
                        this.pathNodes.push(firstClusterCenter);
                    }
                }
            }
            
            // Phase 3: Partial refinement - only refine clusters containing the path

            let totalRefinements = 0;
            
            for (let i = 0; i < abstractPath.length - 1; i++) {
                // Check timeout
                if (Date.now() - algorithmStartTime > maxAlgorithmTime) {

                    break;
                }

                const refinementResult = await this.refineClusterPRA(abstractPath[i], abstractPath[i + 1], clusterSize);
                if (refinementResult && refinementResult.refined) {
                    totalRefinements++;
                }
                
                // Allow UI updates and update metrics
                this.updateRealTimeMetrics();
                await this.sleep(10);
            }
            
            // Phase 5: Connect last cluster to actual goal and ensure goal is part of path

            if (abstractPath.length > 0) {
                const lastCluster = abstractPath[abstractPath.length - 1];
                
                // Find best exit point in last cluster for the goal connection
                const lastClusterCenterX = Math.max(0, Math.min(lastCluster.x * clusterSize + Math.floor(clusterSize / 2), this.gridWidth - 1));
                const lastClusterCenterY = Math.max(0, Math.min(lastCluster.y * clusterSize + Math.floor(clusterSize / 2), this.gridHeight - 1));
                const lastClusterCenter = this.grid[lastClusterCenterY][lastClusterCenterX];
                
                const actualGoalNode = this.grid[this.goalNode.y][this.goalNode.x];
                
                // Connect if goal is not at the cluster center
                if (lastClusterCenter.x !== actualGoalNode.x || lastClusterCenter.y !== actualGoalNode.y) {

                    await this.findRefinedPath(lastClusterCenter, actualGoalNode);
                } else {

                    // Ensure cluster center is marked as path if goal is already there
                    if (!lastClusterCenter.isPath) {
                        lastClusterCenter.isPath = true;
                        this.pathNodes.push(lastClusterCenter);
                    }
                }
            }
            
            // Phase 6: Ensure actual goal is part of the path

            const actualGoalNode = this.grid[this.goalNode.y][this.goalNode.x];
            
            // Always mark the actual goal node as part of the path
            if (!actualGoalNode.isPath) {
                actualGoalNode.isPath = true;
                this.pathNodes.push(actualGoalNode);
            }

            // Calculate path length and update metrics
            if (this.pathNodes.length > 0) {
                this.pathLength = this.calculatePathLength(this.pathNodes);
            } else {
                this.pathLength = 0;

            }
            
            // Final render to show the complete path

            this.render();
            
        } catch (error) {


            this.pathLength = 0; // Ensure failure is tracked
        }
    }
    
    createPRAClusters(clusterSize) {
        const clusters = {};
        
        for (let cy = 0; cy < Math.ceil(this.gridHeight / clusterSize); cy++) {
            for (let cx = 0; cx < Math.ceil(this.gridWidth / clusterSize); cx++) {
                const clusterId = `${cx}-${cy}`;
                const cluster = {
                    id: clusterId,
                    x: cx,
                    y: cy,
                    refined: false,
                    cost: this.estimateClusterCost(cx, cy, clusterSize)
                };
                clusters[clusterId] = cluster;
            }
        }
        
        return clusters;
    }
    
    estimateClusterCost(cx, cy, clusterSize) {
        let obstacles = 0;
        let total = 0;
        
        for (let y = cy * clusterSize; y < Math.min((cy + 1) * clusterSize, this.gridHeight); y++) {
            for (let x = cx * clusterSize; x < Math.min((cx + 1) * clusterSize, this.gridWidth); x++) {
                total++;
                if (this.grid[y][x].isObstacle) obstacles++;
            }
        }
        
        return total > 0 ? (obstacles / total) * 100 : 0;
    }
    
    async findPRAAbstractPath(clusters, clusterSize) {
        const startCluster = this.getClusterCoords(this.startNode.x, this.startNode.y, clusterSize);
        const goalCluster = this.getClusterCoords(this.goalNode.x, this.goalNode.y, clusterSize);
        
        if (!startCluster || !goalCluster) {

            return null;
        }
        
        
        // Simple abstract A* between cluster centers with safety limits
        const openSet = [startCluster];
        const closedSet = [];
        
        startCluster.gCost = 0;
        startCluster.hCost = Math.abs(startCluster.x - goalCluster.x) + Math.abs(startCluster.y - goalCluster.y);
        startCluster.fCost = startCluster.gCost + startCluster.hCost;
        startCluster.parent = null;
        
        let iterations = 0;
        const maxIterations = 1000; // Prevent infinite loops
        
        while (openSet.length > 0 && iterations < maxIterations && this.isRunning && !this.isPaused) {
            iterations++;
            
            // Debug logging every 100 iterations to detect stuck states
            if (iterations % 100 === 0) {

                this.updateRealTimeMetrics();
            }
            
            openSet.sort((a, b) => a.fCost - b.fCost);
            const current = openSet.shift();
            closedSet.push(current);
            
            // Track expanded nodes for metrics (abstract level)
            this.visitedNodes.push({ x: current.x, y: current.y, isAbstract: true });
            
            if (current.x === goalCluster.x && current.y === goalCluster.y) {

                const path = [];
                let node = current;
                let pathLength = 0;
                const maxPathLength = 100; // Prevent infinite path reconstruction
                
                while (node && pathLength < maxPathLength) {
                    path.unshift(node);
                    node = node.parent;
                    pathLength++;
                }
                return path;
            }
            
            // Get neighboring clusters
            const neighbors = this.getClusterNeighbors(current);
            
            for (const neighbor of neighbors) {
                // Check bounds
                const maxClusterX = Math.ceil(this.gridWidth / clusterSize);
                const maxClusterY = Math.ceil(this.gridHeight / clusterSize);
                
                if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= maxClusterX || neighbor.y >= maxClusterY) {
                    continue;
                }
                
                if (closedSet.some(c => c.x === neighbor.x && c.y === neighbor.y)) continue;
                
                const tentativeG = current.gCost + 1 + (neighbor.cost || 0) / 10; // Factor in cluster difficulty
                
                const existing = openSet.find(c => c.x === neighbor.x && c.y === neighbor.y);
                if (!existing) {
                    neighbor.gCost = tentativeG;
                    neighbor.hCost = Math.abs(neighbor.x - goalCluster.x) + Math.abs(neighbor.y - goalCluster.y);
                    neighbor.fCost = neighbor.gCost + neighbor.hCost;
                    neighbor.parent = current;
                    openSet.push(neighbor);
                    // Track abstract nodes as open for metrics
                    this.openNodes.push({ x: neighbor.x, y: neighbor.y, isAbstract: true });
                } else if (tentativeG < existing.gCost) {
                    existing.gCost = tentativeG;
                    existing.fCost = existing.gCost + existing.hCost;
                    existing.parent = current;
                }
            }
            
            // Periodic visualization update
            if (iterations % 20 === 0) {
                await this.sleep(2);
            }
        }
        
        if (iterations >= maxIterations) {

        } else {

        }
        
        return null;
    }
    
    getClusterCoords(x, y, clusterSize) {
        const cx = Math.floor(x / clusterSize);
        const cy = Math.floor(y / clusterSize);
        return {
            x: cx,
            y: cy,
            id: `${cx}-${cy}`,
            cost: this.estimateClusterCost(cx, cy, clusterSize),
            gCost: Infinity,
            hCost: 0,
            fCost: Infinity,
            parent: null
        };
    }
    
    getClusterNeighbors(cluster) {
        const neighbors = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        // Calculate cluster bounds based on current cluster size
        const clusterSize = Math.max(3, Math.floor(Math.min(this.gridWidth, this.gridHeight) / 8));
        const maxClusterX = Math.ceil(this.gridWidth / clusterSize);
        const maxClusterY = Math.ceil(this.gridHeight / clusterSize);
        
        for (const [dx, dy] of directions) {
            const nx = cluster.x + dx;
            const ny = cluster.y + dy;
            
            // Proper bounds checking
            if (nx >= 0 && ny >= 0 && nx < maxClusterX && ny < maxClusterY) {
                neighbors.push({
                    x: nx,
                    y: ny,
                    id: `${nx}-${ny}`,
                    cost: this.estimateClusterCost(nx, ny, clusterSize),
                    gCost: Infinity,
                    hCost: 0,
                    fCost: Infinity,
                    parent: null
                });
            }
        }
        
        return neighbors;
    }
    
    async refineClusterPRA(fromCluster, toCluster, clusterSize) {
        // Find actual path within and between clusters
        const startX = fromCluster.x * clusterSize + Math.floor(clusterSize / 2);
        const startY = fromCluster.y * clusterSize + Math.floor(clusterSize / 2);
        const goalX = toCluster.x * clusterSize + Math.floor(clusterSize / 2);
        const goalY = toCluster.y * clusterSize + Math.floor(clusterSize / 2);
        
        // Clamp to grid bounds (both lower and upper bounds)
        const clampedStartX = Math.max(0, Math.min(startX, this.gridWidth - 1));
        const clampedStartY = Math.max(0, Math.min(startY, this.gridHeight - 1));
        const clampedGoalX = Math.max(0, Math.min(goalX, this.gridWidth - 1));
        const clampedGoalY = Math.max(0, Math.min(goalY, this.gridHeight - 1));
        
        const refinedStart = this.grid[clampedStartY][clampedStartX];
        const refinedGoal = this.grid[clampedGoalY][clampedGoalX];
        
        // Safety check: ensure start and goal are not obstacles
        if (refinedStart.isObstacle || refinedGoal.isObstacle) {
            return { refined: false };
        }
        
        return await this.findRefinedPath(refinedStart, refinedGoal);
    }
    
    async findRefinedPath(startNode, goalNode) {
        if (!startNode || !goalNode) {

            return { refined: false };
        }
        
        // Reset ALL grid nodes' pathfinding state before starting this refinement
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const node = this.grid[y][x];
                // Don't reset isObstacle - that's permanent grid state!
                // Only reset pathfinding-related properties
                if (!node.isPath) { // Don't reset nodes that are already part of the final path
                    node.gCost = Infinity;
                    node.hCost = 0;
                    node.fCost = Infinity;
                    node.parent = null;
                    // Don't reset isVisited - keep visualization of exploration
                }
            }
        }
        
        const openSet = [startNode];
        const closedSet = [];
        
        // Initialize start node for this refined search
        startNode.gCost = 0;
        startNode.hCost = this.calculateHeuristic(startNode, goalNode);
        startNode.fCost = startNode.gCost + startNode.hCost;
        startNode.parent = null;
        
        let iterations = 0;
        const maxIterations = Math.min(1000, this.gridWidth * this.gridHeight / 4); // Prevent infinite loops
        const refinementStartTime = Date.now();
        const maxRefinementTime = 5000; // 5 seconds per refinement max
        
        while (openSet.length > 0 && iterations < maxIterations && this.isRunning && !this.isPaused) {
            // Timeout check for individual refinement
            if (Date.now() - refinementStartTime > maxRefinementTime) {

                break;
            }
            iterations++;
            
            openSet.sort((a, b) => a.fCost - b.fCost);
            const current = openSet.shift();
            
            current.isVisited = true;
            this.visitedNodes.push(current);
            closedSet.push(current);
            
            // Periodic visualization update for PRA*
            if (iterations % 10 === 0) {
                this.render();
                this.updateRealTimeMetrics();
                await this.sleep(this.animationSpeed / 4);
            }
            
            if (current === goalNode) {

                let node = current;
                let pathLength = 0;
                const maxPathLength = this.gridWidth * this.gridHeight; // Prevent infinite reconstruction
                
                while (node && pathLength < maxPathLength) {
                    // CRITICAL: Never mark obstacles as path nodes!
                    if (!node.isObstacle) {
                        // Only mark as path if not already marked (avoid duplicates)
                        if (!node.isPath) {
                            node.isPath = true;
                            this.pathNodes.push(node);
                        }
                    } else {
                        console.error(`PRA*: ERROR - Trying to mark obstacle at (${node.x}, ${node.y}) as path!`);
                        break; // Stop path reconstruction if we hit an obstacle
                    }
                    
                    // Stop when we reach the start node (include it in the path)
                    if (node === startNode) {
                        break;
                    }
                    
                    node = node.parent;
                    pathLength++;
                }
                
                // Render after each segment is found
                this.render();
                await this.sleep(this.animationSpeed);
                
                return { refined: true };
            }
            
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle || closedSet.includes(neighbor)) continue;
                
                // Double-check: Never process obstacles (safety check)
                if (neighbor.isObstacle) {
                    console.error(`PRA*: ERROR - Neighbor at (${neighbor.x}, ${neighbor.y}) is obstacle but passed first check!`);
                    continue;
                }
                
                const tentativeG = current.gCost + this.calculateDistance(current, neighbor);
                
                if (tentativeG < (neighbor.gCost || Infinity)) {
                    neighbor.parent = current;
                    neighbor.gCost = tentativeG;
                    neighbor.hCost = this.calculateHeuristic(neighbor, goalNode);
                    neighbor.fCost = neighbor.gCost + neighbor.hCost;
                    
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        this.openNodes.push(neighbor);
                    }
                }
            }
            
            // Periodic visualization update (less frequent to prevent delays)
            if (iterations % 20 === 0) {
                await this.sleep(Math.min(this.animationSpeed / 10, 1)); // Cap at 1ms
            }
        }
        
        return { refined: false };
    }
    
    async runHAAStar() {
        
        try {
            this.clearVisualization();
            
            const clusterSize = Math.max(4, Math.floor(Math.min(this.gridWidth, this.gridHeight) / 5));

            // Cycle through unit types to demonstrate different capabilities
            const unitTypes = ['ground', 'flying', 'amphibious'];
            if (!this.haaUnitTypeIndex) this.haaUnitTypeIndex = 0;
            const currentUnitType = unitTypes[this.haaUnitTypeIndex % unitTypes.length];
            this.haaUnitTypeIndex++;

            // Create annotated clusters with terrain capabilities

            const annotatedClusters = this.createAnnotatedClusters(clusterSize, currentUnitType);

            // Find path considering unit capabilities

            const annotatedPath = await this.findAnnotatedPath(annotatedClusters, clusterSize, currentUnitType);
            
            if (!annotatedPath) {

                return;
            }

            // Connect actual start to first waypoint

            if (annotatedPath.length > 0) {
                const startNode = this.grid[this.startNode.y][this.startNode.x];
                const firstWaypoint = annotatedPath[0];
                if (startNode.x !== firstWaypoint.x || startNode.y !== firstWaypoint.y) {
                    await this.findCapabilityConstrainedPath(startNode, firstWaypoint, currentUnitType);
                }
            }
            
            // Refine path with capability constraints

            await this.refineAnnotatedPath(annotatedPath, clusterSize, currentUnitType);
            
            // Connect last waypoint to actual goal

            if (annotatedPath.length > 0) {
                const goalNode = this.grid[this.goalNode.y][this.goalNode.x];
                const lastWaypoint = annotatedPath[annotatedPath.length - 1];
                if (lastWaypoint.x !== goalNode.x || lastWaypoint.y !== goalNode.y) {
                    await this.findCapabilityConstrainedPath(lastWaypoint, goalNode, currentUnitType);
                }
            }

            // Final render to show the complete path

            this.render();
            
        } catch (error) {


        }
    }
    
    createAnnotatedClusters(clusterSize, unitType) {
        const clusters = [];
        
        for (let cy = 0; cy < Math.ceil(this.gridHeight / clusterSize); cy++) {
            clusters[cy] = [];
            for (let cx = 0; cx < Math.ceil(this.gridWidth / clusterSize); cx++) {
                const cluster = {
                    id: `${cx}-${cy}`,
                    x: cx,
                    y: cy,
                    capabilities: this.analyzeClusterCapabilities(cx, cy, clusterSize),
                    entrances: []
                };
                
                // Determine if unit can traverse this cluster
                cluster.traversable = this.canUnitTraverseCluster(cluster, unitType);
                
                this.findAnnotatedEntrances(cluster, clusterSize, cx, cy, unitType);
                clusters[cy][cx] = cluster;
            }
        }
        
        return clusters;
    }
    
    analyzeClusterCapabilities(cx, cy, clusterSize) {
        const capabilities = {
            hasObstacles: false,
            obstacleRatio: 0,
            hasNarrowPassages: false,
            terrainType: 'open'
        };
        
        let obstacles = 0;
        let total = 0;
        
        for (let y = cy * clusterSize; y < Math.min((cy + 1) * clusterSize, this.gridHeight); y++) {
            for (let x = cx * clusterSize; x < Math.min((cx + 1) * clusterSize, this.gridWidth); x++) {
                total++;
                if (this.grid[y][x].isObstacle) {
                    obstacles++;
                    capabilities.hasObstacles = true;
                }
            }
        }
        
        capabilities.obstacleRatio = total > 0 ? obstacles / total : 0;
        
        if (capabilities.obstacleRatio > 0.6) {
            capabilities.terrainType = 'dense';
        } else if (capabilities.obstacleRatio > 0.3) {
            capabilities.terrainType = 'moderate';
            capabilities.hasNarrowPassages = true;
        }
        
        return capabilities;
    }
    
    canUnitTraverseCluster(cluster, unitType) {
        switch (unitType) {
            case 'ground':
                return cluster.capabilities.obstacleRatio < 0.8; // Can't pass through very dense areas
            case 'flying':
                return true; // Flying units can go anywhere
            case 'amphibious':
                return cluster.capabilities.obstacleRatio < 0.9; // Can handle more difficult terrain
            default:
                return true;
        }
    }
    
    findAnnotatedEntrances(cluster, clusterSize, cx, cy, unitType) {
        const entrances = [];
        const minX = cx * clusterSize;
        const maxX = Math.min((cx + 1) * clusterSize - 1, this.gridWidth - 1);
        const minY = cy * clusterSize;
        const maxY = Math.min((cy + 1) * clusterSize - 1, this.gridHeight - 1);
        
        // Only add entrances if unit can use them
        for (let x = minX; x <= maxX; x++) {
            if (minY > 0 && this.canUnitUseNode(this.grid[minY][x], unitType)) {
                entrances.push({ x, y: minY, direction: 'north', unitType });
            }
            if (maxY < this.gridHeight - 1 && this.canUnitUseNode(this.grid[maxY][x], unitType)) {
                entrances.push({ x, y: maxY, direction: 'south', unitType });
            }
        }
        
        for (let y = minY; y <= maxY; y++) {
            if (minX > 0 && this.canUnitUseNode(this.grid[y][minX], unitType)) {
                entrances.push({ x: minX, y, direction: 'west', unitType });
            }
            if (maxX < this.gridWidth - 1 && this.canUnitUseNode(this.grid[y][maxX], unitType)) {
                entrances.push({ x: maxX, y, direction: 'east', unitType });
            }
        }
        
        cluster.entrances = entrances;
    }
    
    canUnitUseNode(node, unitType) {
        if (node.isObstacle) {
            return unitType === 'flying'; // Only flying units can go over obstacles
        }
        return true;
    }
    
    async findAnnotatedPath(clusters, clusterSize, unitType) {
        // Safety checks
        const startClusterY = Math.floor(this.startNode.y / clusterSize);
        const startClusterX = Math.floor(this.startNode.x / clusterSize);
        const goalClusterY = Math.floor(this.goalNode.y / clusterSize);
        const goalClusterX = Math.floor(this.goalNode.x / clusterSize);
        
        if (!clusters[startClusterY] || !clusters[startClusterY][startClusterX] ||
            !clusters[goalClusterY] || !clusters[goalClusterY][goalClusterX]) {

            return null;
        }
        
        const startCluster = clusters[startClusterY][startClusterX];
        const goalCluster = clusters[goalClusterY][goalClusterX];
        
        if (!startCluster.traversable || !goalCluster.traversable) {

            return null;
        }
        
        const openSet = [startCluster];
        const closedSet = [];
        
        startCluster.gCost = 0;
        startCluster.hCost = Math.abs(startCluster.x - goalCluster.x) + Math.abs(startCluster.y - goalCluster.y);
        startCluster.fCost = startCluster.gCost + startCluster.hCost;
        startCluster.parent = null;
        
        let iterations = 0;
        const maxIterations = clusters.length * clusters[0].length; // Prevent infinite loops
        
        while (openSet.length > 0 && iterations < maxIterations && this.isRunning && !this.isPaused) {
            iterations++;
            
            openSet.sort((a, b) => a.fCost - b.fCost);
            const current = openSet.shift();
            closedSet.push(current);
            
            if (current === goalCluster) {

                const path = [];
                let node = current;
                let pathLength = 0;
                const maxPathLength = 100; // Prevent infinite reconstruction
                
                while (node && pathLength < maxPathLength) {
                    path.unshift(node);
                    node = node.parent;
                    pathLength++;
                }
                return path;
            }
            
            // Get neighboring traversable clusters
            const neighbors = this.getAnnotatedNeighbors(current, clusters, unitType);
            
            for (const neighbor of neighbors) {
                if (closedSet.includes(neighbor) || !neighbor.traversable) continue;
                
                const movementCost = this.calculateMovementCost(current, neighbor, unitType);
                const tentativeG = current.gCost + movementCost;
                
                if (tentativeG < (neighbor.gCost || Infinity)) {
                    neighbor.gCost = tentativeG;
                    neighbor.hCost = Math.abs(neighbor.x - goalCluster.x) + Math.abs(neighbor.y - goalCluster.y);
                    neighbor.fCost = neighbor.gCost + neighbor.hCost;
                    neighbor.parent = current;
                    
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
            
            // Periodic visualization update
            if (iterations % 10 === 0) {
                await this.sleep(3);
            }
        }
        
        if (iterations >= maxIterations) {

        } else {

        }
        
        return null;
    }
    
    getAnnotatedNeighbors(cluster, clusters, unitType) {
        const neighbors = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dx, dy] of directions) {
            const nx = cluster.x + dx;
            const ny = cluster.y + dy;
            
            if (ny >= 0 && ny < clusters.length && 
                nx >= 0 && nx < clusters[ny].length) {
                const neighbor = clusters[ny][nx];
                if (this.canUnitTraverseCluster(neighbor, unitType)) {
                    neighbors.push(neighbor);
                }
            }
        }
        
        return neighbors;
    }
    
    calculateMovementCost(fromCluster, toCluster, unitType) {
        let baseCost = 1;
        
        // Adjust cost based on terrain difficulty and unit type
        switch (unitType) {
            case 'ground':
                baseCost += toCluster.capabilities.obstacleRatio * 3;
                if (toCluster.capabilities.hasNarrowPassages) baseCost += 1;
                break;
            case 'flying':
                baseCost = 1; // Flying units have uniform cost
                break;
            case 'amphibious':
                baseCost += toCluster.capabilities.obstacleRatio * 1.5;
                break;
        }
        
        return baseCost;
    }
    
    async refineAnnotatedPath(path, clusterSize, unitType) {
        for (let i = 0; i < path.length - 1; i++) {
            await this.refineAnnotatedSegment(path[i], path[i + 1], clusterSize, unitType);
        }
    }
    
    async refineAnnotatedSegment(fromCluster, toCluster, clusterSize, unitType) {
        const startX = Math.min(fromCluster.x * clusterSize + Math.floor(clusterSize / 2), this.gridWidth - 1);
        const startY = Math.min(fromCluster.y * clusterSize + Math.floor(clusterSize / 2), this.gridHeight - 1);
        const goalX = Math.min(toCluster.x * clusterSize + Math.floor(clusterSize / 2), this.gridWidth - 1);
        const goalY = Math.min(toCluster.y * clusterSize + Math.floor(clusterSize / 2), this.gridHeight - 1);
        
        const startNode = this.grid[startY][startX];
        const goalNode = this.grid[goalY][goalX];
        
        return await this.findCapabilityConstrainedPath(startNode, goalNode, unitType);
    }
    
    async findCapabilityConstrainedPath(startNode, goalNode, unitType) {
        if (!startNode || !goalNode) {

            return false;
        }
        
        const openSet = [startNode];
        const closedSet = [];
        
        // Reset pathfinding data
        startNode.gCost = 0;
        startNode.hCost = this.calculateHeuristic(startNode, goalNode);
        startNode.fCost = startNode.gCost + startNode.hCost;
        startNode.parent = null;
        
        let iterations = 0;
        const maxIterations = this.gridWidth * this.gridHeight; // Prevent infinite loops
        
        while (openSet.length > 0 && iterations < maxIterations && this.isRunning && !this.isPaused) {
            iterations++;
            
            openSet.sort((a, b) => a.fCost - b.fCost);
            const current = openSet.shift();
            
            current.isVisited = true;
            this.visitedNodes.push(current);
            closedSet.push(current);
            
            // Periodic visualization update for HAA*
            if (iterations % 10 === 0) {
                this.render();
                await this.sleep(this.animationSpeed / 4);
            }
            
            if (current === goalNode) {

                let node = current;
                let pathLength = 0;
                const maxPathLength = this.gridWidth * this.gridHeight; // Prevent infinite reconstruction
                
                while (node && pathLength < maxPathLength) {
                    node.isPath = true;
                    this.pathNodes.push(node);
                    node = node.parent;
                    pathLength++;
                }
                
                // Render after each segment is found
                this.render();
                await this.sleep(this.animationSpeed);
                
                return true;
            }
            
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (!this.canUnitUseNode(neighbor, unitType) || closedSet.includes(neighbor)) continue;
                
                const moveCost = this.getUnitMoveCost(current, neighbor, unitType);
                if (moveCost === Infinity) continue; // Skip impossible moves
                
                const tentativeG = current.gCost + moveCost;
                
                if (tentativeG < (neighbor.gCost || Infinity)) {
                    neighbor.parent = current;
                    neighbor.gCost = tentativeG;
                    neighbor.hCost = this.calculateHeuristic(neighbor, goalNode);
                    neighbor.fCost = neighbor.gCost + neighbor.hCost;
                    
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
            
            // Periodic visualization update
            if (iterations % 20 === 0) {
                await this.sleep(this.animationSpeed / 10);
            }
        }
        
        if (iterations >= maxIterations) {

        } else {

        }
        
        return false;
    }
    
    getUnitMoveCost(from, to, unitType) {
        const baseCost = this.calculateDistance(from, to);
        
        switch (unitType) {
            case 'ground':
                return to.isObstacle ? Infinity : baseCost;
            case 'flying':
                return baseCost; // Can fly over obstacles
            case 'amphibious':
                return baseCost * (to.isObstacle ? 2 : 1); // Can cross obstacles but at higher cost
            default:
                return baseCost;
        }
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
        if (!nodeA || !nodeB) return 0;
        
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
        // Proper JPS jump point detection
        const jumpPoints = [];
        
        // Get valid directions based on parent (for pruning)
        const directions = this.getPrunedDirections(node);
        
        for (const [dx, dy] of directions) {
            const jumpPoint = this.jump(node.x, node.y, dx, dy);
            if (jumpPoint) {
                jumpPoints.push(this.grid[jumpPoint.y][jumpPoint.x]);
            }
        }
        
        return jumpPoints;
    }
    
    getPrunedDirections(node) {
        const directions = [];
        
        if (!node.parent) {
            // No parent, explore all 8 directions
            return [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ];
        }
        
        // Pruning based on parent direction
        const px = node.parent.x;
        const py = node.parent.y;
        const dx = Math.sign(node.x - px);
        const dy = Math.sign(node.y - py);
        
        if (dx === 0 && dy === 0) {
            // Same position (shouldn't happen), explore all
            return [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ];
        }
        
        if (dx !== 0 && dy !== 0) {
            // Diagonal movement - add the diagonal and two adjacent directions
            directions.push([dx, dy]); // Continue diagonal
            directions.push([dx, 0]);  // Horizontal component
            directions.push([0, dy]);  // Vertical component
        } else if (dx !== 0) {
            // Horizontal movement
            directions.push([dx, 0]);  // Continue horizontal
            directions.push([dx, -1]); // Diagonal up
            directions.push([dx, 1]);  // Diagonal down
        } else {
            // Vertical movement
            directions.push([0, dy]);  // Continue vertical
            directions.push([-1, dy]); // Diagonal left
            directions.push([1, dy]);  // Diagonal right
        }
        
        return directions;
    }
    
    jump(x, y, dx, dy, depth = 0) {
        // Prevent infinite recursion
        if (depth > Math.max(this.gridWidth, this.gridHeight)) {
            return null;
        }
        
        const nextX = x + dx;
        const nextY = y + dy;
        
        // Check bounds and obstacles
        if (nextX < 0 || nextX >= this.gridWidth || 
            nextY < 0 || nextY >= this.gridHeight ||
            this.grid[nextY][nextX].isObstacle) {
            return null;
        }
        
        // Found goal
        if (nextX === this.goalNode.x && nextY === this.goalNode.y) {
            return { x: nextX, y: nextY };
        }
        
        // Check for forced neighbors
        if (this.hasForcedNeighbor(this.grid[nextY][nextX], dx, dy)) {
            return { x: nextX, y: nextY };
        }
        
        // For diagonal movement, check horizontal and vertical components
        if (dx !== 0 && dy !== 0) {
            if (this.jump(nextX, nextY, dx, 0, depth + 1) || 
                this.jump(nextX, nextY, 0, dy, depth + 1)) {
                return { x: nextX, y: nextY };
            }
        }
        
        // Continue jumping in the same direction
        return this.jump(nextX, nextY, dx, dy, depth + 1);
    }
    
    hasForcedNeighbor(node, dx, dy) {
        // Proper forced neighbor detection for JPS
        const x = node.x;
        const y = node.y;
        
        if (dx !== 0 && dy !== 0) {
            // Diagonal movement - check for forced neighbors
            // A forced neighbor exists if there's an obstacle adjacent to the current node
            // that would make a diagonal move necessary
            return (this.isObstacle(x - dx, y) && !this.isObstacle(x - dx, y + dy)) ||
                   (this.isObstacle(x, y - dy) && !this.isObstacle(x + dx, y - dy));
        } else if (dx !== 0) {
            // Horizontal movement - check above and below
            return (this.isObstacle(x, y + 1) && !this.isObstacle(x + dx, y + 1)) ||
                   (this.isObstacle(x, y - 1) && !this.isObstacle(x + dx, y - 1));
        } else if (dy !== 0) {
            // Vertical movement - check left and right  
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
        // Clear any existing path before generating new maze
        this.clearPath();
        
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
                
                // Cell background - prioritize obstacles to show walls even with paths
                if (node.isObstacle) {
                    this.ctx.fillStyle = '#2d3748';
                } else if (node.isPath) {
                    this.ctx.fillStyle = '#7c3aed'; // Darker purple for better visibility
                } else if (node.isVisited) {
                    this.ctx.fillStyle = '#bee3f8';
                } else if (node.isOpen) {
                    this.ctx.fillStyle = '#fbb6ce';
                } else {
                    this.ctx.fillStyle = 'white';
                }
                
                this.ctx.fillRect(cellX + 1, cellY + 1, this.cellSize - 2, this.cellSize - 2);
                
                // Add special indicator for paths through obstacles (flying units)
                if (node.isPath && node.isObstacle) {
                    // Draw a diagonal pattern to show path through obstacle
                    this.ctx.strokeStyle = '#fbbf24'; // Yellow for flying through walls
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(cellX + 3, cellY + 3);
                    this.ctx.lineTo(cellX + this.cellSize - 3, cellY + this.cellSize - 3);
                    this.ctx.moveTo(cellX + this.cellSize - 3, cellY + 3);
                    this.ctx.lineTo(cellX + 3, cellY + this.cellSize - 3);
                    this.ctx.stroke();
                }
                
                // Add border for path cells (only for non-obstacle paths)
                if (node.isPath && !node.isObstacle) {
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

    // Debug function to test hierarchical algorithms
    debugHierarchicalAlgorithms() {







        // Test if basic functions exist
        const functions = ['createClusters', 'buildAbstractGraph', 'findAbstractPath', 'refinePath'];
        functions.forEach(funcName => {

        });

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
            
            // Store parent for later scrolling after completion
            this.comparisonParent = parent;
        }
        
        await this.runComparison();
    }
    
    async runComparison() {
        // Include all major algorithms for comprehensive comparison (excluding hierarchical)
        const algorithms = [
            'astar', 'weighted_astar', 'dijkstra', 'bfs', 'dfs',
            'theta_star', 'jps', 'ida_star', 'rrt', 'lpa_star',
            'd_star_lite', 'field_d_star', 'mtd_star_lite', 'anytime_d_star',
            'gaa_star', 'incremental_phi_star', 'anytime_a_star'
        ];
        const results = [];
        
        // Store original state
        const originalAlgorithm = this.currentAlgorithm;
        const originalSpeed = this.animationSpeed;
        this.animationSpeed = 0; // Run without visualization for speed

        for (let i = 0; i < algorithms.length; i++) {
            const algorithm = algorithms[i];
            
            // Update algorithm info in real-time
            this.currentAlgorithm = algorithm;
            this.updateAlgorithmInfo();
            
            // Update progress
            const chartDiv = document.getElementById('comparison-chart');
            if (chartDiv) {
                chartDiv.innerHTML = `
                    <div class="comparison-progress">
                        <h4>Running Comprehensive Comparison</h4>
                        <p>Currently testing: <strong>${this.algorithmConfigs[algorithm]?.name || algorithm.toUpperCase()}</strong></p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${((i + 1) / algorithms.length * 100)}%"></div>
                        </div>
                        <p>${i + 1} of ${algorithms.length} algorithms complete</p>
                    </div>
                `;
            }
            
            this.clearVisualization();
            
            const startTime = performance.now();
            let success = false;
            let errorMessage = null;
            let memoryUsage = 0;
            
            try {
                // Calculate memory usage (approximate)
                const beforeMemory = this.visitedNodes.length + this.openNodes.length + this.pathNodes.length;
                
                await this.runAlgorithm();
                const endTime = performance.now();
                success = this.pathNodes.length > 0;
                
                // Calculate final memory usage
                memoryUsage = this.visitedNodes.length + this.openNodes.length + this.pathNodes.length - beforeMemory;
                
                // Update performance metrics in real-time
                this.updatePerformanceMetrics({
                    executionTime: (endTime - startTime).toFixed(2),
                    pathLength: this.pathLength || 0,
                    nodesExpanded: this.nodesExpanded || this.visitedNodes.length,
                    nodesVisited: this.visitedNodes.length,
                    memoryUsage: Math.max(memoryUsage, this.visitedNodes.length),
                    successRate: success ? '100%' : '0%'
                });
                
                results.push({
                    algorithm: algorithm,
                    name: this.algorithmConfigs[algorithm]?.name || algorithm.toUpperCase(),
                    time: (endTime - startTime).toFixed(2),
                    nodesVisited: this.visitedNodes.length,
                    nodesExpanded: this.nodesExpanded || this.visitedNodes.length,
                    pathLength: this.pathLength || 0,
                    memoryUsage: Math.max(memoryUsage, this.visitedNodes.length),
                    success: success,
                    optimal: this.isOptimalAlgorithm(algorithm),
                    category: this.getAlgorithmCategory(algorithm),
                    score: this.calculatePerformanceScore(endTime - startTime, this.visitedNodes.length, this.pathLength || 0, success)
                });
            } catch (error) {
                errorMessage = error.message;
                
                // Update metrics for failed algorithm
                this.updatePerformanceMetrics({
                    executionTime: 'Failed',
                    pathLength: 'N/A',
                    nodesExpanded: 'N/A',
                    nodesVisited: 'N/A',
                    memoryUsage: 'N/A',
                    successRate: '0%'
                });
                
                results.push({
                    algorithm: algorithm,
                    name: this.algorithmConfigs[algorithm]?.name || algorithm.toUpperCase(),
                    time: 'Failed',
                    nodesVisited: 0,
                    nodesExpanded: 0,
                    pathLength: 0,
                    memoryUsage: 0,
                    success: false,
                    optimal: false,
                    category: this.getAlgorithmCategory(algorithm),
                    error: errorMessage,
                    score: 10000 // High score for failed algorithms
                });
            }
            
            // Small delay to show each result
            await this.sleep(500);
        }
        
        // Restore original state
        this.animationSpeed = originalSpeed;
        this.currentAlgorithm = originalAlgorithm;
        this.clearVisualization();
        this.updateAlgorithmInfo(); // Reset info panel to original algorithm

        // Sort results by performance (best first)
        const sortedResults = this.sortResultsByPerformance(results);
        
        this.displayComparisonResults(sortedResults);
        
        // Scroll to results after all comparisons are done
        if (this.comparisonParent) {
            this.comparisonParent.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    displayComparisonResults(results) {
        const chartDiv = document.getElementById('comparison-chart');
        if (!chartDiv) return;
        
        // Results are already sorted by performance from sortResultsByPerformance()
        const successfulResults = results.filter(r => r.success);
        const failedCount = results.length - successfulResults.length;
        
        // Create comprehensive comparison results HTML
        const html = `
            <div class="comparison-overview">
                <div class="stats-summary">
                    <div class="stat-item">
                        <span class="stat-label">Tested:</span>
                        <span class="stat-value">${results.length} algorithms</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Successful:</span>
                        <span class="stat-value">${successfulResults.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Failed:</span>
                        <span class="stat-value">${failedCount}</span>
                    </div>
                </div>
            </div>
            
            <div class="comparison-results-inline">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Algorithm</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Time (ms)</th>
                            <th>Nodes Visited</th>
                            <th>Nodes Expanded</th>
                            <th>Path Length</th>
                            <th>Memory</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map((result, index) => `
                            <tr class="${result.success ? 'success' : 'failed'}">
                                <td>
                                    ${result.success ? 
                                        (index < 3 ? `<span class="rank-badge rank-${index + 1}">#${index + 1}</span>` : `<span class="rank-badge">#${index + 1}</span>`) : 
                                        '<span class="rank-failed">-</span>'
                                    }
                                </td>
                                <td>
                                    <strong>${result.name}</strong>
                                    ${result.optimal ? '<span class="optimal-badge">★</span>' : ''}
                                </td>
                                <td><span class="category-badge ${result.category.toLowerCase().replace('-', '')}">${result.category}</span></td>
                                <td>
                                    ${result.success ? 
                                        '<span class="status-success">✓ Success</span>' : 
                                        `<span class="status-failed">✗ Failed</span>`
                                    }
                                </td>
                                <td>${result.time === 'Failed' ? 'N/A' : result.time + 'ms'}</td>
                                <td>${result.nodesVisited}</td>
                                <td>${result.nodesExpanded}</td>
                                <td>${result.pathLength || 'N/A'}</td>
                                <td>${result.memoryUsage || 'N/A'}</td>
                                <td>${result.success ? result.score.toFixed(1) : 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="comparison-analysis">
                    <div class="analysis-section">
                        <h4>🏆 Performance Leaders</h4>
                        <ul>
                            <li><strong>🥇 Overall Winner:</strong> ${successfulResults.length > 0 ? successfulResults[0].name : 'N/A'}</li>
                            <li><strong>⚡ Fastest Execution:</strong> ${this.getFastest(successfulResults)}</li>
                            <li><strong>🧠 Most Memory Efficient:</strong> ${this.getMostEfficient(successfulResults)}</li>
                            <li><strong>🎯 Shortest Path:</strong> ${this.getShortestPath(successfulResults)}</li>
                            <li><strong>⭐ Most Optimal:</strong> ${this.getMostOptimal(successfulResults)}</li>
                        </ul>
                    </div>
                    
                    <div class="analysis-section">
                        <h4>📊 Category Performance</h4>
                        ${this.generateCategoryAnalysis(successfulResults)}
                    </div>
                    
                    <div class="analysis-section">
                        <h4>💡 Recommendations</h4>
                        ${this.generateRecommendations(successfulResults)}
                    </div>
                </div>
            </div>
        `;
        
        chartDiv.innerHTML = html;
    }
    
    getFastest(results) {
        const valid = results.filter(r => r.time !== 'N/A' && r.time !== 'Failed' && r.success);
        if (valid.length === 0) return 'N/A';
        return valid.reduce((min, r) => parseFloat(r.time) < parseFloat(min.time) ? r : min).name;
    }
    
    getMostEfficient(results) {
        const valid = results.filter(r => r.nodesVisited !== 'N/A' && r.success);
        if (valid.length === 0) return 'N/A';
        return valid.reduce((min, r) => r.nodesVisited < min.nodesVisited ? r : min).name;
    }
    
    getShortestPath(results) {
        const valid = results.filter(r => r.pathLength !== 'N/A' && r.success);
        if (valid.length === 0) return 'N/A';
        return valid.reduce((min, r) => r.pathLength < min.pathLength ? r : min).name;
    }
    
    calculatePerformanceScore(time, nodesVisited, pathLength, success) {
        if (!success) return 10000; // Penalize failed algorithms heavily
        
        // Lower score is better (normalize and weight different factors)
        const timeScore = parseFloat(time) || 1000;
        const nodeScore = nodesVisited || 1000;
        const pathScore = pathLength || 100;
        
        // Weighted scoring: 30% time, 40% nodes, 30% path length
        return (timeScore * 0.3) + (nodeScore * 0.4) + (pathScore * 0.3);
    }
    
    sortResultsByPerformance(results) {
        return results.sort((a, b) => {
            // First prioritize successful algorithms
            if (a.success !== b.success) {
                return b.success - a.success; // Success first
            }
            
            // Then sort by performance score (lower is better)
            if (a.success && b.success) {
                return a.score - b.score;
            }
            
            // For failed algorithms, sort alphabetically
            return a.name.localeCompare(b.name);
        });
    }
    
    isOptimalAlgorithm(algorithm) {
        const optimalAlgorithms = [
            'astar', 'dijkstra', 'theta_star', 'ida_star', 'lpa_star',
            'd_star_lite', 'field_d_star', 'mtd_star_lite', 'gaa_star', 'incremental_phi_star'
        ];
        return optimalAlgorithms.includes(algorithm);
    }
    
    getAlgorithmCategory(algorithm) {
        const categories = {
            'astar': 'Classic',
            'weighted_astar': 'Classic',
            'dijkstra': 'Classic',
            'bfs': 'Classic',
            'dfs': 'Classic',
            'theta_star': 'Any-Angle',
            'incremental_phi_star': 'Any-Angle',
            'jps': 'Optimized',
            'ida_star': 'Memory-Efficient',
            'rrt': 'Sampling',
            'lpa_star': 'Dynamic',
            'd_star_lite': 'Dynamic',
            'field_d_star': 'Dynamic',
            'mtd_star_lite': 'Dynamic',
            'anytime_d_star': 'Dynamic',
            'gaa_star': 'Adaptive',
            'anytime_a_star': 'Anytime'
        };
        return categories[algorithm] || 'Other';
    }
    
    getBestOverall(results) {
        if (results.length === 0) return 'N/A';
        
        // Score based on multiple factors (lower is better)
        const scored = results.map(r => ({
            ...r,
            score: (parseFloat(r.time) || 1000) * 0.3 + 
                   (r.nodesVisited || 1000) * 0.4 + 
                   (r.pathLength || 100) * 0.3
        }));
        
        return scored.reduce((best, r) => r.score < best.score ? r : best).name;
    }
    
    generateCategoryAnalysis(results) {
        const categories = {};
        results.forEach(r => {
            if (!categories[r.category]) {
                categories[r.category] = { count: 0, avgTime: 0, avgNodes: 0 };
            }
            categories[r.category].count++;
            categories[r.category].avgTime += parseFloat(r.time) || 0;
            categories[r.category].avgNodes += r.nodesVisited || 0;
        });
        
        let html = '<ul>';
        Object.keys(categories).forEach(cat => {
            const data = categories[cat];
            const avgTime = (data.avgTime / data.count).toFixed(1);
            const avgNodes = Math.round(data.avgNodes / data.count);
            html += `<li><strong>${cat}:</strong> ${data.count} algorithms, average ${avgTime}ms, average ${avgNodes} nodes</li>`;
        });
        html += '</ul>';
        
        return html;
    }
    
    getMostOptimal(results) {
        const optimalResults = results.filter(r => r.optimal && r.success);
        if (optimalResults.length === 0) return 'N/A';
        return optimalResults[0].name; // First in sorted list
    }
    
    generateRecommendations(results) {
        if (results.length === 0) {
            return '<p>No successful algorithms to analyze.</p>';
        }
        
        const winner = results.length > 0 ? results[0].name : 'N/A';
        const fastest = this.getFastest(results);
        const mostEfficient = this.getMostEfficient(results);
        const shortestPath = this.getShortestPath(results);
        
        return `
            <ul>
                <li><strong>🏆 Top Performer:</strong> ${winner} - Best overall balance of all metrics</li>
                <li><strong>⚡ For Speed:</strong> ${fastest} - Fastest execution time</li>
                <li><strong>🧠 For Memory:</strong> ${mostEfficient} - Lowest memory footprint</li>
                <li><strong>🎯 For Accuracy:</strong> ${shortestPath} - Guarantees optimal paths</li>
                <li><strong>📱 Real-time Apps:</strong> Consider top 3 performers for responsive UIs</li>
                <li><strong>🗺️ Large Maps:</strong> Hierarchical algorithms (HPA*, PRA*, HAA*) scale better</li>
            </ul>
        `;
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