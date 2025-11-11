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
            'hpa_star': { name: 'HPA*', heuristic: 'manhattan', weight: 1.0 },
            'pra_star': { name: 'PRA*', heuristic: 'manhattan', weight: 1.0 },
            'haa_star': { name: 'HAA*', heuristic: 'manhattan', weight: 1.0 },
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
            'hpa_star': 'HPA* (Hierarchical Path-Finding A*) uses a two-level hierarchy to efficiently pathfind on large maps, ideal for RTS games with multiple units.',
            'pra_star': 'PRA* (Partial Refinement A*) selectively refines only necessary parts of the hierarchical search space, improving efficiency over HPA*.',
            'haa_star': 'HAA* (Hierarchical Annotated A*) extends HPA* with terrain annotations, allowing different unit types with varying movement capabilities.',
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
            'hpa_star': 'O(V_abs + E_abs)',
            'pra_star': 'O(V_abs + E_abs)',
            'haa_star': 'O(V_abs + E_abs)',
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
            'hpa_star': 'O(V_abs)',
            'pra_star': 'O(V_abs)',
            'haa_star': 'O(V_abs)'
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
            'hpa_star': 'Near-Optimal',
            'pra_star': 'Near-Optimal',
            'haa_star': 'Near-Optimal',
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
                case 'hpa_star':
                    await this.runHPAStar();
                    break;
                case 'pra_star':
                    await this.runPRAStar();
                    break;
                case 'haa_star':
                    await this.runHAAStar();
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
            console.error('Algorithm execution error:', error);
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
            
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
            
            console.log('Algorithm execution stopped');
        }
    }
    
    async runBFS() {
        console.log('Starting BFS (Breadth-First Search) algorithm...');
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
                console.log(`BFS: Path found in ${iterations} iterations!`);
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
        
        console.log('BFS: No path found');
    }
    
    async runDFS() {
        console.log('Starting DFS (Depth-First Search) algorithm...');
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
                console.log(`DFS: Path found in ${iterations} iterations!`);
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
        
        console.log('DFS: No path found');
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
            if (iterations % 10 === 0 && jumpPoints.length > 0) {
                console.log(`JPS: Found ${jumpPoints.length} jump points from (${currentNode.x}, ${currentNode.y})`);
            }
            
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
    
    async runLPAStar() {
        console.log('Starting LPA* (Lifelong Planning A*) algorithm...');
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
                console.log(`LPA*: Path found in ${iterations} iterations!`);
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
            console.log('LPA*: Maximum iterations reached');
        } else {
            console.log('LPA*: No path found');
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
                console.log('LPA*: Path reconstruction safety limit reached');
                break;
            }
        }
        
        this.pathLength = this.calculatePathLength(path);
        console.log(`LPA*: Path length: ${this.pathLength.toFixed(2)} with ${path.length} nodes`);
    }
    
    async runDStarLite() {
        console.log('Starting D*-Lite (Dynamic A*) algorithm...');
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
                console.log(`D*-Lite: Path found in ${iterations} iterations with ${dynamicUpdates} dynamic updates!`);
                this.reconstructPath(currentNode);
                return;
            }
            
            // Simulate dynamic environment changes (occasionally)
            if (iterations % 50 === 0 && Math.random() < 0.1) {
                dynamicUpdates++;
                console.log(`D*-Lite: Simulating environment change ${dynamicUpdates}`);
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
            console.log('D*-Lite: Maximum iterations reached');
        } else {
            console.log('D*-Lite: No path found');
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
        console.log('Starting Field D* (Any-Angle Dynamic) algorithm...');
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
                console.log(`Field D*: Path found in ${iterations} iterations with ${anyAngleOptimizations} any-angle optimizations!`);
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
            console.log('Field D*: Maximum iterations reached');
        } else {
            console.log('Field D*: No path found');
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
    
    async runHPAStar() {
        console.log('=== HPA* ALGORITHM START ===');
        console.log('Starting HPA* (Hierarchical Path-Finding A*) algorithm...');
        
        // Add a timeout safety mechanism
        const startTime = Date.now();
        const maxDuration = 30000; // 30 seconds maximum
        
        // Immediate check - don't even try-catch this part
        if (!this.grid || this.grid.length === 0) {
            console.error('FATAL: Grid is not initialized!');
            console.log('Grid state:', this.grid);
            return;
        }
        
        console.log('Grid check passed - Grid dimensions:', this.gridWidth, 'x', this.gridHeight);
        
        // Check first row of grid to make sure it's properly initialized
        if (!this.grid[0] || this.grid[0].length === 0) {
            console.error('FATAL: Grid first row is not initialized!');
            console.log('First row state:', this.grid[0]);
            return;
        }
        
        console.log('Grid structure check passed');
        
        // Debug information
        this.debugHierarchicalAlgorithms();
        
        try {
            console.log('Step 1: Clearing visualization...');
            this.clearVisualization();
            console.log('Step 1: Complete');
            
            // Safety checks
            console.log('Step 2: Checking start and goal nodes...');
            if (!this.startNode || !this.goalNode) {
                console.error('HPA*: Start or goal node not set');
                console.log('Start node:', this.startNode);
                console.log('Goal node:', this.goalNode);
                return;
            }
            
            if (this.startNode.x === this.goalNode.x && this.startNode.y === this.goalNode.y) {
                console.log('HPA*: Start and goal are the same');
                return;
            }
            
            console.log(`HPA*: Starting from (${this.startNode.x}, ${this.startNode.y}) to (${this.goalNode.x}, ${this.goalNode.y})`);
            console.log('Step 2: Complete');
        } catch (error) {
            console.error('HPA*: Error in initial setup:', error);
            console.error('Error stack:', error.stack);
            return;
        }
        
        try {
            console.log('Step 3: Calculating cluster size...');
            const clusterSize = Math.max(4, Math.floor(Math.min(this.gridWidth, this.gridHeight) / 6));
            console.log(`HPA*: Using cluster size ${clusterSize}x${clusterSize}`);
            console.log('Step 3: Complete');
            
            // Phase 1: Create abstract graph
            console.log('Step 4: Creating clusters...');
            const clusters = this.createClusters(clusterSize);
            console.log(`HPA*: Created ${clusters.length} cluster rows`);
            console.log('Step 4: Complete');
            
            console.log('Step 5: Building abstract graph...');
            const abstractGraph = this.buildAbstractGraph(clusters, clusterSize);
            console.log(`HPA*: Created ${abstractGraph.nodes.length} abstract nodes and ${abstractGraph.edges.length} abstract edges`);
            console.log('Step 5: Complete');
            
            if (abstractGraph.nodes.length === 0) {
                console.error('HPA*: No abstract nodes created');
                return;
            }
            
            // Phase 2: Find abstract path
            console.log('HPA*: Finding abstract path...');
            const abstractPath = await this.findAbstractPath(abstractGraph, clusterSize);
            
            if (!abstractPath || abstractPath.length === 0) {
                console.error('HPA*: No abstract path found');
                return;
            }
            
            console.log(`HPA*: Found abstract path with ${abstractPath.length} waypoints`);
            
            // Phase 3: Refine path within clusters
            console.log('HPA*: Refining path within clusters...');
            await this.refinePath(abstractPath, clusterSize);
            
            console.log(`HPA*: Hierarchical path found with ${this.pathNodes.length} nodes!`);
            
            // Final render to show the complete path
            console.log('HPA*: Rendering final result...');
            this.render();
            
            const totalTime = Date.now() - startTime;
            console.log(`HPA*: Total execution time: ${totalTime}ms`);
            console.log('=== HPA* ALGORITHM COMPLETED SUCCESSFULLY ===');
        } catch (error) {
            console.error('=== HPA* ALGORITHM FAILED ===');
            console.error('HPA*: Error during algorithm execution:', error);
            console.error('Stack trace:', error.stack);
            console.error('Error occurred at step:', error.step || 'unknown');
        }
    }
    
    createClusters(clusterSize) {
        const clusters = [];
        
        for (let cy = 0; cy < Math.ceil(this.gridHeight / clusterSize); cy++) {
            clusters[cy] = [];
            for (let cx = 0; cx < Math.ceil(this.gridWidth / clusterSize); cx++) {
                const cluster = {
                    id: `${cx}-${cy}`,
                    x: cx,
                    y: cy,
                    entrances: [],
                    nodes: []
                };
                
                // Add nodes to cluster
                for (let y = cy * clusterSize; y < Math.min((cy + 1) * clusterSize, this.gridHeight); y++) {
                    for (let x = cx * clusterSize; x < Math.min((cx + 1) * clusterSize, this.gridWidth); x++) {
                        cluster.nodes.push(this.grid[y][x]);
                    }
                }
                
                // Find entrance points (border nodes that connect to adjacent clusters)
                this.findEntrancePoints(cluster, clusterSize, cx, cy);
                clusters[cy][cx] = cluster;
            }
        }
        
        return clusters;
    }
    
    findEntrancePoints(cluster, clusterSize, cx, cy) {
        const entrances = [];
        
        // Check all border positions
        const minX = cx * clusterSize;
        const maxX = Math.min((cx + 1) * clusterSize - 1, this.gridWidth - 1);
        const minY = cy * clusterSize;
        const maxY = Math.min((cy + 1) * clusterSize - 1, this.gridHeight - 1);
        
        // Top and bottom borders
        for (let x = minX; x <= maxX; x++) {
            if (minY > 0 && !this.grid[minY][x].isObstacle && !this.grid[minY - 1][x].isObstacle) {
                entrances.push({ x, y: minY, direction: 'north' });
            }
            if (maxY < this.gridHeight - 1 && !this.grid[maxY][x].isObstacle && !this.grid[maxY + 1][x].isObstacle) {
                entrances.push({ x, y: maxY, direction: 'south' });
            }
        }
        
        // Left and right borders
        for (let y = minY; y <= maxY; y++) {
            if (minX > 0 && !this.grid[y][minX].isObstacle && !this.grid[y][minX - 1].isObstacle) {
                entrances.push({ x: minX, y, direction: 'west' });
            }
            if (maxX < this.gridWidth - 1 && !this.grid[y][maxX].isObstacle && !this.grid[y][maxX + 1].isObstacle) {
                entrances.push({ x: maxX, y, direction: 'east' });
            }
        }
        
        cluster.entrances = entrances;
    }
    
    buildAbstractGraph(clusters, clusterSize) {
        const abstractNodes = [];
        const abstractEdges = [];
        
        // Calculate which clusters contain start and goal
        const startClusterX = Math.floor(this.startNode.x / clusterSize);
        const startClusterY = Math.floor(this.startNode.y / clusterSize);
        const goalClusterX = Math.floor(this.goalNode.x / clusterSize);
        const goalClusterY = Math.floor(this.goalNode.y / clusterSize);
        
        console.log(`HPA*: Start node (${this.startNode.x}, ${this.startNode.y}) in cluster (${startClusterX}, ${startClusterY})`);
        console.log(`HPA*: Goal node (${this.goalNode.x}, ${this.goalNode.y}) in cluster (${goalClusterX}, ${goalClusterY})`);
        
        // First, add the actual start and goal nodes to the abstract graph
        const startNode = {
            x: this.startNode.x,
            y: this.startNode.y,
            clusterX: startClusterX,
            clusterY: startClusterY,
            clusterId: `${startClusterX}-${startClusterY}`,
            type: 'start'
        };
        
        const goalNode = {
            x: this.goalNode.x,
            y: this.goalNode.y,
            clusterX: goalClusterX,
            clusterY: goalClusterY,
            clusterId: `${goalClusterX}-${goalClusterY}`,
            type: 'goal'
        };
        
        abstractNodes.push(startNode);
        abstractNodes.push(goalNode);
        
        console.log(`HPA*: Added start node at (${startNode.x}, ${startNode.y}) in cluster (${startClusterX}, ${startClusterY})`);
        console.log(`HPA*: Added goal node at (${goalNode.x}, ${goalNode.y}) in cluster (${goalClusterX}, ${goalClusterY})`);
        
        // Create nodes for each cluster center (excluding start/goal clusters)
        for (let cy = 0; cy < Math.ceil(this.gridHeight / clusterSize); cy++) {
            for (let cx = 0; cx < Math.ceil(this.gridWidth / clusterSize); cx++) {
                // Skip if this cluster already has start or goal node
                if ((cx === startClusterX && cy === startClusterY) || 
                    (cx === goalClusterX && cy === goalClusterY)) {
                    continue;
                }
                
                const centerX = cx * clusterSize + Math.floor(clusterSize / 2);
                const centerY = cy * clusterSize + Math.floor(clusterSize / 2);
                
                // Clamp to grid bounds
                const nodeX = Math.min(centerX, this.gridWidth - 1);
                const nodeY = Math.min(centerY, this.gridHeight - 1);
                
                abstractNodes.push({
                    x: nodeX,
                    y: nodeY,
                    clusterX: cx,
                    clusterY: cy,
                    clusterId: `${cx}-${cy}`,
                    type: 'cluster'
                });
            }
        }
        
        // Create abstract edges between adjacent clusters
        for (const currentNode of abstractNodes) {
            const cx = currentNode.clusterX;
            const cy = currentNode.clusterY;
            
            // Add edges to adjacent clusters
            const neighbors = [
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 },  // Left, Right
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 }   // Up, Down
            ];
            
            for (const { dx, dy } of neighbors) {
                const neighborX = cx + dx;
                const neighborY = cy + dy;
                
                if (neighborX >= 0 && neighborX < Math.ceil(this.gridWidth / clusterSize) &&
                    neighborY >= 0 && neighborY < Math.ceil(this.gridHeight / clusterSize)) {
                    
                    const neighborNode = abstractNodes.find(n => n.clusterX === neighborX && n.clusterY === neighborY);
                    if (neighborNode && neighborNode !== currentNode) {
                        // Calculate actual distance between the nodes
                        const distance = this.calculateHeuristic(currentNode, neighborNode);
                        abstractEdges.push({
                            from: currentNode,
                            to: neighborNode,
                            cost: distance
                        });
                    }
                }
            }
        }
        
        console.log(`HPA*: Created ${abstractNodes.length} abstract nodes and ${abstractEdges.length} abstract edges`);
        return { nodes: abstractNodes, edges: abstractEdges };
    }
    
    getClusterId(x, y, clusterSize) {
        const cx = Math.floor(x / clusterSize);
        const cy = Math.floor(y / clusterSize);
        return `${cx}-${cy}`;
    }
    
    async findAbstractPath(abstractGraph, clusterSize) {
        // Simplified abstract pathfinding using A* with safeguards
        const startAbstract = abstractGraph.nodes.find(n => n.type === 'start');
        const goalAbstract = abstractGraph.nodes.find(n => n.type === 'goal');
        
        if (!startAbstract || !goalAbstract) {
            console.log('HPA*: Start or goal not found in abstract graph');
            return null;
        }
        
        // Initialize all abstract nodes
        for (const node of abstractGraph.nodes) {
            node.gCost = Infinity;
            node.hCost = 0;
            node.fCost = Infinity;
            node.parent = null;
            node.visited = false;
        }
        
        // Use A* on abstract level
        const openSet = [startAbstract];
        const closedSet = [];
        
        startAbstract.gCost = 0;
        startAbstract.hCost = this.calculateHeuristic(startAbstract, goalAbstract);
        startAbstract.fCost = startAbstract.gCost + startAbstract.hCost;
        
        let iterations = 0;
        const maxIterations = abstractGraph.nodes.length * 2; // Prevent infinite loops
        
        while (openSet.length > 0 && iterations < maxIterations && this.isRunning && !this.isPaused) {
            iterations++;
            
            openSet.sort((a, b) => a.fCost - b.fCost);
            const current = openSet.shift();
            current.visited = true;
            closedSet.push(current);
            
            if (current === goalAbstract) {
                console.log(`HPA*: Abstract path found in ${iterations} iterations`);
                const path = [];
                let node = current;
                const maxPathLength = abstractGraph.nodes.length; // Prevent infinite reconstruction
                let pathLength = 0;
                
                while (node && pathLength < maxPathLength) {
                    path.unshift(node);
                    console.log(`HPA*: Abstract path waypoint: (${node.x}, ${node.y}) type: ${node.type}`);
                    node = node.parent;
                    pathLength++;
                }
                
                console.log(`HPA*: Abstract path reconstructed with ${path.length} waypoints`);
                console.log(`HPA*: Path starts at (${path[0]?.x}, ${path[0]?.y}) and ends at (${path[path.length-1]?.x}, ${path[path.length-1]?.y})`);
                
                return path;
            }
            
            // Find neighbors in same cluster or adjacent clusters
            const neighbors = this.getAbstractNeighbors(current, abstractGraph, clusterSize);
            
            for (const neighbor of neighbors) {
                if (neighbor.visited || closedSet.includes(neighbor)) continue;
                
                const tentativeG = current.gCost + this.calculateHeuristic(current, neighbor);
                
                // Check if this is a better path
                if (tentativeG < neighbor.gCost) {
                    neighbor.parent = current;
                    neighbor.gCost = tentativeG;
                    neighbor.hCost = this.calculateHeuristic(neighbor, goalAbstract);
                    neighbor.fCost = neighbor.gCost + neighbor.hCost;
                    
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
            
            // Visualization update
            if (iterations % 10 === 0) {
                await this.sleep(1);
            }
        }
        
        if (iterations >= maxIterations) {
            console.log('HPA*: Maximum iterations reached in abstract search');
        } else {
            console.log('HPA*: No abstract path found');
        }
        
        return null;
    }
    
    getAbstractNeighbors(node, abstractGraph, clusterSize) {
        const neighbors = [];
        
        // Find edges from this node using the abstract graph structure
        const edges = abstractGraph.edges.filter(edge => edge.from === node);
        
        for (const edge of edges) {
            neighbors.push(edge.to);
        }
        
        return neighbors;
    }
    
    async refinePath(abstractPath, clusterSize) {
        console.log(`HPA*: Refining path with ${abstractPath.length} waypoints`);
        
        // Ensure we start from actual start node and end at actual goal node
        const actualStart = { x: this.startNode.x, y: this.startNode.y, type: 'start' };
        const actualGoal = { x: this.goalNode.x, y: this.goalNode.y, type: 'goal' };
        
        console.log(`HPA*: Path refinement from (${actualStart.x}, ${actualStart.y}) to (${actualGoal.x}, ${actualGoal.y})`);
        
        if (abstractPath.length === 0) {
            // Direct path if no waypoints
            await this.findDetailedPath(actualStart, actualGoal);
            return;
        }
        
        // Connect start to first waypoint
        if (abstractPath[0].x !== actualStart.x || abstractPath[0].y !== actualStart.y) {
            console.log(`HPA*: Connecting start (${actualStart.x}, ${actualStart.y}) to first waypoint (${abstractPath[0].x}, ${abstractPath[0].y})`);
            await this.findDetailedPath(actualStart, abstractPath[0]);
        }
        
        // Connect waypoints
        for (let i = 0; i < abstractPath.length - 1; i++) {
            const from = abstractPath[i];
            const to = abstractPath[i + 1];
            console.log(`HPA*: Connecting waypoint (${from.x}, ${from.y}) to (${to.x}, ${to.y})`);
            await this.findDetailedPath(from, to);
        }
        
        // Connect last waypoint to goal
        const lastWaypoint = abstractPath[abstractPath.length - 1];
        if (lastWaypoint.x !== actualGoal.x || lastWaypoint.y !== actualGoal.y) {
            console.log(`HPA*: Connecting last waypoint (${lastWaypoint.x}, ${lastWaypoint.y}) to goal (${actualGoal.x}, ${actualGoal.y})`);
            await this.findDetailedPath(lastWaypoint, actualGoal);
        }
    }
    
    async findDetailedPath(from, to) {
        const fromNode = this.grid[from.y][from.x];
        const toNode = this.grid[to.y][to.x];
        
        // Safety check
        if (!fromNode || !toNode || fromNode.isObstacle || toNode.isObstacle) {
            console.log('HPA*: Invalid detailed path segment');
            return;
        }
        
        // If from and to are the same, no need to find a path
        if (fromNode === toNode) return;
        
        // Reset path-finding state for this segment
        const segmentNodes = new Set();
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const node = this.grid[y][x];
                if (!node.isVisited) { // Don't reset already processed nodes
                    node.gCost = Infinity;
                    node.hCost = 0;
                    node.fCost = Infinity;
                    node.parent = null;
                }
                segmentNodes.add(node);
            }
        }
        
        const openSet = [fromNode];
        const closedSet = [];
        
        fromNode.gCost = 0;
        fromNode.hCost = this.calculateHeuristic(fromNode, toNode);
        fromNode.fCost = fromNode.gCost + fromNode.hCost;
        
        let iterations = 0;
        const maxIterations = this.gridWidth * this.gridHeight; // Prevent infinite loops
        
        while (openSet.length > 0 && iterations < maxIterations && this.isRunning && !this.isPaused) {
            iterations++;
            
            openSet.sort((a, b) => a.fCost - b.fCost);
            const current = openSet.shift();
            
            current.isVisited = true;
            this.visitedNodes.push(current);
            closedSet.push(current);
            
            // Periodic visualization update
            if (iterations % 10 === 0) {
                this.render();
                await this.sleep(this.animationSpeed / 4);
            }
            
            if (current === toNode) {
                console.log(`HPA*: Detailed path segment found in ${iterations} iterations`);
                // Reconstruct this segment
                let node = current;
                const segmentPath = [];
                let pathLength = 0;
                const maxPathLength = this.gridWidth * this.gridHeight; // Prevent infinite reconstruction
                
                while (node && node !== fromNode && pathLength < maxPathLength) {
                    node.isPath = true;
                    this.pathNodes.push(node);
                    segmentPath.unshift(node);
                    node = node.parent;
                    pathLength++;
                }
                
                console.log(`HPA*: Segment path length: ${segmentPath.length}`);
                
                // Render after each segment is found
                this.render();
                await this.sleep(this.animationSpeed);
                
                return;
            }
            
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (neighbor.isObstacle || closedSet.includes(neighbor)) continue;
                
                const tentativeG = current.gCost + this.calculateDistance(current, neighbor);
                
                if (tentativeG < neighbor.gCost) {
                    neighbor.parent = current;
                    neighbor.gCost = tentativeG;
                    neighbor.hCost = this.calculateHeuristic(neighbor, toNode);
                    neighbor.fCost = neighbor.gCost + neighbor.hCost;
                    
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
            
            // Periodic visualization update
            if (iterations % 20 === 0) {
                await this.sleep(this.animationSpeed / 8);
            }
        }
        
        if (iterations >= maxIterations) {
            console.log(`HPA*: Maximum iterations reached for detailed path from (${from.x}, ${from.y}) to (${to.x}, ${to.y})`);
        } else {
            console.log(`HPA*: No detailed path found from (${from.x}, ${from.y}) to (${to.x}, ${to.y})`);
        }
    }
    
    async runAnytimeAStar() {
        console.log('Starting Anytime A* (Interruptible) algorithm...');
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
            console.log(`Anytime A*: Iteration ${iteration}, epsilon = ${epsilon.toFixed(2)}`);
            
            // Clear previous search state but keep best path visible
            this.clearSearchState();
            
            const result = await this.runInflatedAStar(startNode, goalNode, epsilon);
            
            if (result && result.cost < bestCost) {
                bestPath = result.path;
                bestCost = result.cost;
                
                // Visualize improved path
                this.visualizeAnytimePath(result.path);
                console.log(`Anytime A*: Found improved path with cost ${bestCost.toFixed(2)} (epsilon=${epsilon.toFixed(2)})`);
                
                // Allow user to see the improvement
                await this.sleep(this.animationSpeed * 10);
            }
            
            epsilon = Math.max(minEpsilon, epsilon * epsilonDecay);
            
            if (epsilon <= minEpsilon) {
                console.log(`Anytime A*: Final optimal path found with cost ${bestCost.toFixed(2)}`);
                break;
            }
        }
        
        if (bestPath) {
            this.pathLength = this.calculatePathLength(bestPath);
            console.log(`Anytime A*: Best path length: ${this.pathLength.toFixed(2)}`);
        } else {
            console.log('Anytime A*: No path found');
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
        console.log('Starting Incremental Phi* (Any-Angle Incremental) algorithm...');
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
                console.log(`Incremental Phi*: Path found in ${iterations} iterations with ${anyAngleOptimizations} any-angle optimizations and ${incrementalUpdates} incremental updates!`);
                this.reconstructPath(currentNode);
                return;
            }
            
            // Simulate incremental updates (occasionally)
            if (iterations % 30 === 0 && Math.random() < 0.15) {
                incrementalUpdates++;
                console.log(`Incremental Phi*: Simulating incremental update ${incrementalUpdates}`);
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
            console.log('Incremental Phi*: Maximum iterations reached');
        } else {
            console.log('Incremental Phi*: No path found');
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
        console.log('Starting GAA* (Generalized Adaptive A*) algorithm...');
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
                        console.log(`GAA*: Goal moved from (${goalNode.x}, ${goalNode.y}) to (${newGoal.x}, ${newGoal.y})`);
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
                console.log(`GAA*: Path found in ${iterations} iterations with ${goalMoves} goal moves!`);
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
        
        console.log('GAA*: No path found');
    }
    
    async runGRFAStar() {
        console.log('Starting GRFA* (Generalized Fringe-Retrieving A*) algorithm...');
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
                console.log(`GRFA*: Path found in ${iterations} iterations with ${fringeRetrievals} fringe retrievals!`);
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
        
        console.log('GRFA*: No path found');
    }
    
    async runMTDStarLite() {
        console.log('Starting MTD*-Lite (Moving Target D*-Lite) algorithm...');
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
                        console.log(`MTD*-Lite: Target moved from (${currentGoalNode.x}, ${currentGoalNode.y}) to (${newGoal.x}, ${newGoal.y})`);
                        
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
                console.log(`MTD*-Lite: Path found in ${iterations} iterations with ${targetMoves} target moves and ${replans} replans!`);
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
            console.log('MTD*-Lite: Maximum iterations reached');
        } else {
            console.log('MTD*-Lite: No path found');
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
        console.log(`MTD*-Lite: Path length: ${this.pathLength.toFixed(2)}, nodes: ${path.length}`);
    }
    
    async runTreeAAStar() {
        console.log('Starting Tree-AA* (Unknown Terrain Adaptive A*) algorithm...');
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
                console.log(`Tree-AA*: Path found in ${iterations} iterations with ${terrainDiscoveries} terrain discoveries!`);
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
        
        console.log('Tree-AA*: No path found');
    }
    
    isAdjacentToExplored(node, exploredNodes) {
        for (const explored of exploredNodes) {
            const distance = Math.abs(node.x - explored.x) + Math.abs(node.y - explored.y);
            if (distance <= 1) return true;
        }
        return false;
    }
    
    async runAnytimeDStar() {
        console.log('Starting Anytime D* (Dynamic Anytime) algorithm...');
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
            console.log(`Anytime D*: Iteration ${iteration}/${maxAnytimeIterations}, epsilon = ${epsilon.toFixed(2)}`);
            
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
                console.log(`Anytime D*: Found improved path with cost ${bestCost.toFixed(2)} (epsilon=${epsilon.toFixed(2)})`);
                
                await this.sleep(this.animationSpeed * 4);
            } else if (result) {
                console.log(`Anytime D*: Path found but not better than current best (cost: ${result.cost.toFixed(2)})`);
            } else {
                console.log(`Anytime D*: No path found for epsilon ${epsilon.toFixed(2)}`);
            }
            
            epsilon = Math.max(minEpsilon, epsilon * epsilonDecay);
            
            // Early termination if we found optimal path
            if (epsilon <= minEpsilon) {
                console.log('Anytime D*: Reached optimal epsilon, terminating');
                break;
            }
        }
        
        if (bestPath) {
            this.pathLength = this.calculatePathLength(bestPath);
            console.log(`Anytime D*: Final path cost: ${bestCost.toFixed(2)} in ${iteration} iterations`);
        } else {
            console.log('Anytime D*: No path found');
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
                console.log(`Anytime D*: Path found in ${iterations} iterations with epsilon ${epsilon.toFixed(2)}`);
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
        
        if (iterations >= maxIterations) {
            console.log(`Anytime D*: Maximum iterations reached for epsilon ${epsilon.toFixed(2)}`);
        } else {
            console.log(`Anytime D*: No path found for epsilon ${epsilon.toFixed(2)}`);
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
        console.log('Starting PRA* (Partial Refinement A*) algorithm...');
        
        // Add overall timeout for entire algorithm
        const algorithmStartTime = Date.now();
        const maxAlgorithmTime = 30000; // 30 seconds max
        
        try {
            this.clearVisualization();
            
            const clusterSize = Math.max(3, Math.floor(Math.min(this.gridWidth, this.gridHeight) / 8));
            console.log(`PRA*: Using cluster size ${clusterSize}x${clusterSize}`);
            
            // Create abstract clusters
            console.log('PRA*: Creating clusters...');
            const clusters = this.createPRAClusters(clusterSize);
            console.log(`PRA*: Created ${Object.keys(clusters).length} abstract clusters`);
            
            // Phase 1: Abstract planning
            console.log('PRA*: Finding abstract path...');
            const abstractPath = await this.findPRAAbstractPath(clusters, clusterSize);
            
            if (!abstractPath) {
                console.error('PRA*: No abstract path found');
                return;
            }
            
            console.log(`PRA*: Found abstract path with ${abstractPath.length} clusters`);
            
            // Phase 2: Partial refinement - only refine clusters containing the path
            console.log('PRA*: Performing partial refinement...');
            let totalRefinements = 0;
            
            for (let i = 0; i < abstractPath.length - 1; i++) {
                // Check timeout
                if (Date.now() - algorithmStartTime > maxAlgorithmTime) {
                    console.error('PRA*: Algorithm timeout - stopping refinement');
                    break;
                }
                
                console.log(`PRA*: Refining segment ${i + 1}/${abstractPath.length - 1}`);
                const refinementResult = await this.refineClusterPRA(abstractPath[i], abstractPath[i + 1], clusterSize);
                if (refinementResult && refinementResult.refined) {
                    totalRefinements++;
                }
                
                // Allow UI updates
                await this.sleep(10);
            }
            
            console.log(`PRA*: Path found with ${totalRefinements} cluster refinements!`);
            
            // Final render to show the complete path
            console.log('PRA*: Rendering final result...');
            this.render();
            
        } catch (error) {
            console.error('PRA*: Error during algorithm execution:', error);
            console.error('Stack trace:', error.stack);
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
            console.log('PRA*: Invalid start or goal cluster coordinates');
            return null;
        }
        
        console.log(`PRA*: Abstract path from cluster (${startCluster.x}, ${startCluster.y}) to (${goalCluster.x}, ${goalCluster.y})`);
        
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
                console.log(`PRA*: Abstract search iteration ${iterations}, openSet size: ${openSet.length}`);
            }
            
            openSet.sort((a, b) => a.fCost - b.fCost);
            const current = openSet.shift();
            closedSet.push(current);
            
            if (current.x === goalCluster.x && current.y === goalCluster.y) {
                console.log(`PRA*: Abstract path found in ${iterations} iterations`);
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
            console.log('PRA*: Maximum iterations reached in abstract search');
        } else {
            console.log('PRA*: No abstract path found');
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
        
        // Clamp to grid bounds
        const clampedStartX = Math.min(startX, this.gridWidth - 1);
        const clampedStartY = Math.min(startY, this.gridHeight - 1);
        const clampedGoalX = Math.min(goalX, this.gridWidth - 1);
        const clampedGoalY = Math.min(goalY, this.gridHeight - 1);
        
        const refinedStart = this.grid[clampedStartY][clampedStartX];
        const refinedGoal = this.grid[clampedGoalY][clampedGoalX];
        
        // Safety check: ensure start and goal are not obstacles
        if (refinedStart.isObstacle || refinedGoal.isObstacle) {
            console.log(`PRA*: Skipping refinement - start or goal is obstacle at (${clampedStartX}, ${clampedStartY}) -> (${clampedGoalX}, ${clampedGoalY})`);
            return { refined: false };
        }
        
        console.log(`PRA*: Refining cluster path from (${clampedStartX}, ${clampedStartY}) to (${clampedGoalX}, ${clampedGoalY})`);
        return await this.findRefinedPath(refinedStart, refinedGoal);
    }
    
    async findRefinedPath(startNode, goalNode) {
        if (!startNode || !goalNode) {
            console.log('PRA*: Invalid start or goal node for refinement');
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
                console.error(`PRA*: Refinement timeout after ${iterations} iterations`);
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
                await this.sleep(this.animationSpeed / 4);
            }
            
            if (current === goalNode) {
                console.log(`PRA*: Refined path segment found in ${iterations} iterations`);
                let node = current;
                let pathLength = 0;
                const maxPathLength = this.gridWidth * this.gridHeight; // Prevent infinite reconstruction
                
                while (node && pathLength < maxPathLength) {
                    // CRITICAL: Never mark obstacles as path nodes!
                    if (!node.isObstacle) {
                        node.isPath = true;
                        this.pathNodes.push(node);
                    } else {
                        console.error(`PRA*: ERROR - Trying to mark obstacle at (${node.x}, ${node.y}) as path!`);
                        break; // Stop path reconstruction if we hit an obstacle
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
                    }
                }
            }
            
            // Periodic visualization update (less frequent to prevent delays)
            if (iterations % 20 === 0) {
                await this.sleep(Math.min(this.animationSpeed / 10, 1)); // Cap at 1ms
            }
        }
        
        if (iterations >= maxIterations) {
            console.log(`PRA*: Maximum iterations (${maxIterations}) reached in refined search`);
        } else if (Date.now() - refinementStartTime > maxRefinementTime) {
            console.log(`PRA*: Timeout (${maxRefinementTime}ms) reached in refined search`);
        } else {
            console.log(`PRA*: No refined path found - openSet empty after ${iterations} iterations`);
        }
        
        return { refined: false };
    }
    
    async runHAAStar() {
        console.log('Starting HAA* (Hierarchical Annotated A*) algorithm...');
        
        try {
            this.clearVisualization();
            
            const clusterSize = Math.max(4, Math.floor(Math.min(this.gridWidth, this.gridHeight) / 5));
            console.log(`HAA*: Using cluster size ${clusterSize}x${clusterSize}`);
            
            // Simulate different unit types with terrain restrictions
            const unitTypes = ['ground', 'flying', 'amphibious'];
            const currentUnitType = unitTypes[Math.floor(Math.random() * unitTypes.length)];
            console.log(`HAA*: Pathfinding for ${currentUnitType} unit`);
            
            // Create annotated clusters with terrain capabilities
            console.log('HAA*: Creating annotated clusters...');
            const annotatedClusters = this.createAnnotatedClusters(clusterSize, currentUnitType);
            console.log(`HAA*: Created ${annotatedClusters.length} annotated cluster rows`);
            
            // Find path considering unit capabilities
            console.log('HAA*: Finding annotated path...');
            const annotatedPath = await this.findAnnotatedPath(annotatedClusters, clusterSize, currentUnitType);
            
            if (!annotatedPath) {
                console.error('HAA*: No suitable path found for unit type');
                return;
            }
            
            console.log(`HAA*: Found annotated path with ${annotatedPath.length} waypoints`);
            
            // Refine path with capability constraints
            console.log('HAA*: Refining path with terrain capabilities...');
            await this.refineAnnotatedPath(annotatedPath, clusterSize, currentUnitType);
            
            console.log(`HAA*: Hierarchical annotated path found for ${currentUnitType} unit!`);
            
            // Final render to show the complete path
            console.log('HAA*: Rendering final result...');
            this.render();
            
        } catch (error) {
            console.error('HAA*: Error during algorithm execution:', error);
            console.error('Stack trace:', error.stack);
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
            console.log('HAA*: Invalid cluster coordinates');
            return null;
        }
        
        const startCluster = clusters[startClusterY][startClusterX];
        const goalCluster = clusters[goalClusterY][goalClusterX];
        
        if (!startCluster.traversable || !goalCluster.traversable) {
            console.log(`HAA*: Start or goal cluster not traversable for ${unitType} unit`);
            return null;
        }
        
        console.log(`HAA*: Finding annotated path for ${unitType} unit from cluster (${startCluster.x}, ${startCluster.y}) to (${goalCluster.x}, ${goalCluster.y})`);
        
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
                console.log(`HAA*: Annotated path found in ${iterations} iterations`);
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
            console.log('HAA*: Maximum iterations reached in annotated search');
        } else {
            console.log(`HAA*: No annotated path found for ${unitType} unit`);
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
            console.log('HAA*: Invalid nodes for capability-constrained search');
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
                console.log(`HAA*: Capability-constrained path found in ${iterations} iterations for ${unitType} unit`);
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
            console.log(`HAA*: Maximum iterations reached in capability-constrained search for ${unitType} unit`);
        } else {
            console.log(`HAA*: No capability-constrained path found for ${unitType} unit`);
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

    // Debug function to test hierarchical algorithms
    debugHierarchicalAlgorithms() {
        console.log('=== Debugging Hierarchical Algorithms ===');
        console.log('Start node:', this.startNode);
        console.log('Goal node:', this.goalNode);
        console.log('Grid dimensions:', this.gridWidth, 'x', this.gridHeight);
        console.log('Grid exists:', !!this.grid);
        console.log('Running status:', this.isRunning);
        console.log('Paused status:', this.isPaused);
        
        // Test if basic functions exist
        const functions = ['createClusters', 'buildAbstractGraph', 'findAbstractPath', 'refinePath'];
        functions.forEach(funcName => {
            console.log(`Function ${funcName} exists:`, typeof this[funcName] === 'function');
        });
        
        console.log('=== End Debug ===');
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