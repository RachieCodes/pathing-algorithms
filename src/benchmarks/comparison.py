"""
Algorithm Comparison Framework
Comprehensive benchmarking and analysis system for pathfinding algorithms.
"""

import time
import statistics
import json
from typing import List, Dict, Any, Tuple, Type, Optional
from dataclasses import dataclass
from enum import Enum

from ..core import PathfindingAlgorithm, PathfindingResult, Grid, AngleGrid, DynamicGrid
from ..algorithms.classical import AStar, WeightedAStar, Dijkstra
from ..algorithms.any_angle import ThetaStar, BasicThetaStar
from ..algorithms.optimized import JumpPointSearch, IDAStar
from ..algorithms.sampling import RRT, RRTStar


class TestScenario(Enum):
    """Different test scenarios for algorithm evaluation."""
    OPEN_SPACE = "Open Space"
    MAZE_LIKE = "Maze-like"
    RANDOM_OBSTACLES = "Random Obstacles"
    NARROW_PASSAGES = "Narrow Passages"
    LARGE_SCALE = "Large Scale"
    WEIGHTED_TERRAIN = "Weighted Terrain"


@dataclass
class BenchmarkConfig:
    """Configuration for benchmark tests."""
    grid_sizes: List[Tuple[int, int]] = None
    obstacle_densities: List[float] = None
    num_trials: int = 10
    scenarios: List[TestScenario] = None
    algorithms: List[Type[PathfindingAlgorithm]] = None
    timeout_seconds: float = 30.0
    
    def __post_init__(self):
        if self.grid_sizes is None:
            self.grid_sizes = [(20, 20), (50, 50), (100, 100)]
        if self.obstacle_densities is None:
            self.obstacle_densities = [0.1, 0.2, 0.3]
        if self.scenarios is None:
            self.scenarios = list(TestScenario)
        if self.algorithms is None:
            self.algorithms = [AStar, WeightedAStar, Dijkstra, ThetaStar, JumpPointSearch, IDAStar, RRT]


class AlgorithmBenchmark:
    """
    Comprehensive benchmarking system for pathfinding algorithms.
    
    Features:
    - Multiple test scenarios
    - Statistical analysis
    - Performance metrics comparison
    - Algorithm suitability assessment
    """
    
    def __init__(self, config: BenchmarkConfig = None):
        self.config = config or BenchmarkConfig()
        self.results: Dict[str, List[Dict]] = {}
    
    def run_comprehensive_benchmark(self) -> Dict[str, Any]:
        """
        Run comprehensive benchmark across all configurations.
        
        Returns:
            Dictionary containing all benchmark results and analysis
        """
        print("Starting comprehensive pathfinding algorithm benchmark...")
        
        total_tests = (len(self.config.grid_sizes) * 
                      len(self.config.obstacle_densities) * 
                      len(self.config.scenarios) * 
                      len(self.config.algorithms) * 
                      self.config.num_trials)
        
        test_count = 0
        
        for grid_size in self.config.grid_sizes:
            for obstacle_density in self.config.obstacle_densities:
                for scenario in self.config.scenarios:
                    print(f"\\nTesting scenario: {scenario.value} ({grid_size[0]}x{grid_size[1]}, {obstacle_density:.1%} obstacles)")
                    
                    scenario_results = self._benchmark_scenario(
                        grid_size, obstacle_density, scenario
                    )
                    
                    scenario_key = f"{scenario.value}_{grid_size[0]}x{grid_size[1]}_{obstacle_density:.1f}"
                    self.results[scenario_key] = scenario_results
                    
                    test_count += len(self.config.algorithms) * self.config.num_trials
                    progress = (test_count / total_tests) * 100
                    print(f"Progress: {progress:.1f}% ({test_count}/{total_tests} tests)")
        
        # Analyze results
        analysis = self._analyze_results()
        
        return {
            'config': self._config_to_dict(),
            'raw_results': self.results,
            'analysis': analysis,
            'summary': self._create_summary()
        }
    
    def _benchmark_scenario(self, grid_size: Tuple[int, int], obstacle_density: float, 
                          scenario: TestScenario) -> List[Dict[str, Any]]:
        """Benchmark all algorithms on a specific scenario."""
        scenario_results = []
        
        for algorithm_class in self.config.algorithms:
            algorithm_results = self._benchmark_algorithm(
                algorithm_class, grid_size, obstacle_density, scenario
            )
            scenario_results.append(algorithm_results)
        
        return scenario_results
    
    def _benchmark_algorithm(self, algorithm_class: Type[PathfindingAlgorithm],
                           grid_size: Tuple[int, int], obstacle_density: float,
                           scenario: TestScenario) -> Dict[str, Any]:
        """Benchmark a single algorithm on multiple trials."""
        width, height = grid_size
        
        # Create algorithm instance
        try:
            if algorithm_class in [ThetaStar, BasicThetaStar]:
                algorithm = algorithm_class()
            elif algorithm_class == WeightedAStar:
                algorithm = algorithm_class(heuristic_weight=1.5)
            elif algorithm_class == RRT:
                algorithm = algorithm_class(max_iterations=5000)
            elif algorithm_class == RRTStar:
                algorithm = algorithm_class(max_iterations=3000)
            else:
                algorithm = algorithm_class()
        except Exception as e:
            return {
                'algorithm': algorithm_class.__name__,
                'error': f"Failed to initialize: {str(e)}",
                'trials': []
            }
        
        trials = []
        success_count = 0
        
        for trial in range(self.config.num_trials):
            try:
                # Create grid based on scenario
                grid = self._create_test_grid(width, height, obstacle_density, scenario)
                
                # Generate start and goal positions
                start, goal = self._generate_test_positions(grid)
                
                if not start or not goal:
                    continue
                
                # Run algorithm with timeout
                start_time = time.perf_counter()
                
                try:
                    result = algorithm.find_path(grid, start, goal)
                    elapsed_time = time.perf_counter() - start_time
                    
                    if elapsed_time > self.config.timeout_seconds:
                        result.found = False
                        result.error_message = "Timeout exceeded"
                    
                except Exception as e:
                    elapsed_time = time.perf_counter() - start_time
                    result = PathfindingResult()
                    result.found = False
                    result.error_message = str(e)
                    result.execution_time = elapsed_time
                
                # Record trial result
                trial_data = {
                    'trial': trial,
                    'success': result.found,
                    'execution_time': result.execution_time,
                    'path_length': result.path_length,
                    'nodes_expanded': result.nodes_expanded,
                    'nodes_visited': result.nodes_visited,
                    'memory_usage': result.memory_usage,
                    'algorithm_data': result.algorithm_data,
                    'error': result.error_message
                }
                
                trials.append(trial_data)
                
                if result.found:
                    success_count += 1
                
            except Exception as e:
                trials.append({
                    'trial': trial,
                    'success': False,
                    'error': str(e),
                    'execution_time': 0,
                    'path_length': 0,
                    'nodes_expanded': 0,
                    'nodes_visited': 0,
                    'memory_usage': 0
                })
        
        # Calculate statistics
        successful_trials = [t for t in trials if t['success']]
        
        stats = {
            'success_rate': success_count / len(trials) if trials else 0,
            'avg_execution_time': statistics.mean([t['execution_time'] for t in successful_trials]) if successful_trials else 0,
            'avg_path_length': statistics.mean([t['path_length'] for t in successful_trials]) if successful_trials else 0,
            'avg_nodes_expanded': statistics.mean([t['nodes_expanded'] for t in successful_trials]) if successful_trials else 0,
            'avg_nodes_visited': statistics.mean([t['nodes_visited'] for t in successful_trials]) if successful_trials else 0,
            'avg_memory_usage': statistics.mean([t['memory_usage'] for t in successful_trials]) if successful_trials else 0,
        }
        
        if successful_trials:
            stats.update({
                'std_execution_time': statistics.stdev([t['execution_time'] for t in successful_trials]) if len(successful_trials) > 1 else 0,
                'std_path_length': statistics.stdev([t['path_length'] for t in successful_trials]) if len(successful_trials) > 1 else 0,
                'min_execution_time': min([t['execution_time'] for t in successful_trials]),
                'max_execution_time': max([t['execution_time'] for t in successful_trials]),
            })
        
        return {
            'algorithm': algorithm.name,
            'category': algorithm.category.value,
            'statistics': stats,
            'trials': trials
        }
    
    def _create_test_grid(self, width: int, height: int, obstacle_density: float, 
                         scenario: TestScenario) -> Grid:
        """Create a test grid based on the scenario."""
        if scenario == TestScenario.OPEN_SPACE:
            grid = Grid(width, height)
            grid.add_random_obstacles(obstacle_density * 0.5)  # Reduced obstacles for open space
            
        elif scenario == TestScenario.MAZE_LIKE:
            grid = Grid(width, height)
            grid.add_maze_pattern()
            
        elif scenario == TestScenario.RANDOM_OBSTACLES:
            grid = Grid(width, height)
            grid.add_random_obstacles(obstacle_density)
            
        elif scenario == TestScenario.NARROW_PASSAGES:
            grid = Grid(width, height)
            # Create narrow passages pattern
            for y in range(height):
                for x in range(width):
                    if x % 8 == 0 or y % 8 == 0:
                        if not (x % 16 == 8 or y % 16 == 8):  # Leave some passages
                            grid.set_walkable(x, y, False)
                            
        elif scenario == TestScenario.LARGE_SCALE:
            grid = Grid(max(width, 100), max(height, 100))  # Ensure minimum size
            grid.add_random_obstacles(obstacle_density)
            
        else:  # WEIGHTED_TERRAIN or default
            grid = Grid(width, height)
            grid.add_random_obstacles(obstacle_density)
        
        return grid
    
    def _generate_test_positions(self, grid: Grid) -> Tuple[Optional[Tuple[int, int]], Optional[Tuple[int, int]]]:
        """Generate valid start and goal positions."""
        walkable_positions = []
        
        for y in range(grid.height):
            for x in range(grid.width):
                if grid.is_walkable(x, y):
                    walkable_positions.append((x, y))
        
        if len(walkable_positions) < 2:
            return None, None
        
        # Choose positions that are reasonably far apart
        import random
        start = random.choice(walkable_positions)
        
        # Find goal that's at least 1/4 of the grid diagonal away
        min_distance = max(grid.width, grid.height) * 0.25
        valid_goals = [pos for pos in walkable_positions 
                      if abs(pos[0] - start[0]) + abs(pos[1] - start[1]) >= min_distance]
        
        if not valid_goals:
            valid_goals = walkable_positions
        
        goal = random.choice([pos for pos in valid_goals if pos != start])
        
        return start, goal
    
    def _analyze_results(self) -> Dict[str, Any]:
        """Analyze benchmark results to extract insights."""
        analysis = {
            'algorithm_rankings': self._rank_algorithms(),
            'scenario_analysis': self._analyze_scenarios(),
            'scalability_analysis': self._analyze_scalability(),
            'recommendations': self._generate_recommendations()
        }
        
        return analysis
    
    def _rank_algorithms(self) -> Dict[str, List[str]]:
        """Rank algorithms by different metrics."""
        algorithm_metrics = {}
        
        # Collect metrics for each algorithm
        for scenario_key, scenario_results in self.results.items():
            for alg_result in scenario_results:
                alg_name = alg_result['algorithm']
                
                if alg_name not in algorithm_metrics:
                    algorithm_metrics[alg_name] = {
                        'success_rates': [],
                        'execution_times': [],
                        'path_lengths': [],
                        'nodes_expanded': [],
                        'memory_usage': []
                    }
                
                stats = alg_result['statistics']
                algorithm_metrics[alg_name]['success_rates'].append(stats['success_rate'])
                algorithm_metrics[alg_name]['execution_times'].append(stats['avg_execution_time'])
                algorithm_metrics[alg_name]['path_lengths'].append(stats['avg_path_length'])
                algorithm_metrics[alg_name]['nodes_expanded'].append(stats['avg_nodes_expanded'])
                algorithm_metrics[alg_name]['memory_usage'].append(stats['avg_memory_usage'])
        
        # Calculate average metrics and rank
        rankings = {}
        
        # Rank by success rate
        success_ranking = sorted(algorithm_metrics.keys(), 
                               key=lambda x: statistics.mean(algorithm_metrics[x]['success_rates']), 
                               reverse=True)
        rankings['success_rate'] = success_ranking
        
        # Rank by speed (lower is better)
        speed_ranking = sorted(algorithm_metrics.keys(), 
                             key=lambda x: statistics.mean([t for t in algorithm_metrics[x]['execution_times'] if t > 0]) or float('inf'))
        rankings['speed'] = speed_ranking
        
        # Rank by path quality (lower length is better)
        quality_ranking = sorted(algorithm_metrics.keys(), 
                               key=lambda x: statistics.mean([l for l in algorithm_metrics[x]['path_lengths'] if l > 0]) or float('inf'))
        rankings['path_quality'] = quality_ranking
        
        # Rank by memory efficiency (lower is better)
        memory_ranking = sorted(algorithm_metrics.keys(), 
                              key=lambda x: statistics.mean([m for m in algorithm_metrics[x]['memory_usage'] if m > 0]) or float('inf'))
        rankings['memory_efficiency'] = memory_ranking
        
        return rankings
    
    def _analyze_scenarios(self) -> Dict[str, Dict]:
        """Analyze which algorithms perform best in each scenario type."""
        scenario_analysis = {}
        
        for scenario in TestScenario:
            scenario_results = []
            
            for scenario_key, results in self.results.items():
                if scenario.value in scenario_key:
                    scenario_results.extend(results)
            
            if scenario_results:
                # Find best performing algorithm for this scenario
                best_overall = max(scenario_results, 
                                 key=lambda x: x['statistics']['success_rate'] * 0.5 + 
                                              (1.0 / (x['statistics']['avg_execution_time'] + 0.001)) * 0.3 +
                                              (1.0 / (x['statistics']['avg_path_length'] + 0.001)) * 0.2)
                
                scenario_analysis[scenario.value] = {
                    'best_algorithm': best_overall['algorithm'],
                    'avg_success_rate': statistics.mean([r['statistics']['success_rate'] for r in scenario_results]),
                    'algorithms_tested': len(scenario_results)
                }
        
        return scenario_analysis
    
    def _analyze_scalability(self) -> Dict[str, Any]:
        """Analyze how algorithms scale with grid size."""
        scalability = {}
        
        # Group results by grid size
        size_groups = {}
        for scenario_key, results in self.results.items():
            # Extract grid size from scenario key
            parts = scenario_key.split('_')
            if len(parts) >= 2:
                grid_size = parts[1]  # e.g., "50x50"
                
                if grid_size not in size_groups:
                    size_groups[grid_size] = []
                
                size_groups[grid_size].extend(results)
        
        # Analyze scaling for each algorithm
        for grid_size, results in size_groups.items():
            alg_performance = {}
            
            for result in results:
                alg_name = result['algorithm']
                if alg_name not in alg_performance:
                    alg_performance[alg_name] = []
                
                alg_performance[alg_name].append(result['statistics']['avg_execution_time'])
            
            scalability[grid_size] = {
                alg: statistics.mean(times) for alg, times in alg_performance.items()
            }
        
        return scalability
    
    def _generate_recommendations(self) -> Dict[str, str]:
        """Generate algorithm recommendations for different use cases."""
        rankings = self._rank_algorithms()
        
        recommendations = {
            'general_purpose': rankings['success_rate'][0] if rankings['success_rate'] else 'A*',
            'speed_critical': rankings['speed'][0] if rankings['speed'] else 'Dijkstra',
            'memory_constrained': rankings['memory_efficiency'][0] if rankings['memory_efficiency'] else 'IDA*',
            'path_quality': rankings['path_quality'][0] if rankings['path_quality'] else 'A*',
            'large_scale': 'Jump Point Search',  # Generally good for large grids
            'any_angle': 'Theta*',  # Specialized for smooth paths
            'dynamic_environment': 'D* Lite',  # For changing environments
            'unknown_environment': 'RRT'  # For exploration
        }
        
        return recommendations
    
    def _create_summary(self) -> Dict[str, Any]:
        """Create a summary of the benchmark results."""
        total_tests = sum(len(results) for results in self.results.values())
        
        all_algorithms = set()
        all_success_rates = []
        
        for results in self.results.values():
            for result in results:
                all_algorithms.add(result['algorithm'])
                all_success_rates.append(result['statistics']['success_rate'])
        
        return {
            'total_scenarios_tested': len(self.results),
            'total_algorithm_tests': total_tests,
            'algorithms_evaluated': list(all_algorithms),
            'overall_success_rate': statistics.mean(all_success_rates) if all_success_rates else 0,
            'benchmark_completed': True
        }
    
    def _config_to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary for serialization."""
        return {
            'grid_sizes': self.config.grid_sizes,
            'obstacle_densities': self.config.obstacle_densities,
            'num_trials': self.config.num_trials,
            'scenarios': [s.value for s in self.config.scenarios],
            'algorithms': [alg.__name__ for alg in self.config.algorithms],
            'timeout_seconds': self.config.timeout_seconds
        }
    
    def save_results(self, filepath: str):
        """Save benchmark results to JSON file."""
        results_data = {
            'config': self._config_to_dict(),
            'results': self.results,
            'analysis': self._analyze_results(),
            'summary': self._create_summary()
        }
        
        with open(filepath, 'w') as f:
            json.dump(results_data, f, indent=2)
        
        print(f"Results saved to {filepath}")
    
    def print_summary(self):
        """Print a formatted summary of the results."""
        analysis = self._analyze_results()
        summary = self._create_summary()
        
        print("\\n" + "="*60)
        print("PATHFINDING ALGORITHM BENCHMARK SUMMARY")
        print("="*60)
        
        print(f"\\nTotal Scenarios Tested: {summary['total_scenarios_tested']}")
        print(f"Total Algorithm Tests: {summary['total_algorithm_tests']}")
        print(f"Overall Success Rate: {summary['overall_success_rate']:.1%}")
        
        print("\\n" + "-"*40)
        print("ALGORITHM RANKINGS")
        print("-"*40)
        
        rankings = analysis['algorithm_rankings']
        
        print("\\nBy Success Rate:")
        for i, alg in enumerate(rankings['success_rate'][:5], 1):
            print(f"  {i}. {alg}")
        
        print("\\nBy Speed:")
        for i, alg in enumerate(rankings['speed'][:5], 1):
            print(f"  {i}. {alg}")
        
        print("\\nBy Path Quality:")
        for i, alg in enumerate(rankings['path_quality'][:5], 1):
            print(f"  {i}. {alg}")
        
        print("\\n" + "-"*40)
        print("RECOMMENDATIONS")
        print("-"*40)
        
        recommendations = analysis['recommendations']
        for use_case, algorithm in recommendations.items():
            print(f"  {use_case.replace('_', ' ').title()}: {algorithm}")
        
        print("\\n" + "="*60)