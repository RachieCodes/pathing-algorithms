# Pathfinding Algorithms Comprehensive Comparison

A complete educational framework for understanding pathfinding algorithms. This project explains how different algorithms find the shortest path between two points, with visual demonstrations and easy-to-understand explanations.

## What is Pathfinding?

Imagine you're in a maze and need to find the shortest route from entrance to exit. Pathfinding algorithms are step-by-step methods that computers use to solve this exact problem. They're used everywhere: GPS navigation, video game characters moving around obstacles, robot navigation, and more.

## Understanding the Algorithms

This project includes 17 different pathfinding algorithms, each with unique strengths and best-use scenarios. Think of them as different strategies for solving the same puzzle.

## Algorithm Categories Explained

### Classical Algorithms
These are the foundational pathfinding methods that most other algorithms build upon. They're reliable, well-understood, and work well for most situations.

### Any-Angle Algorithms  
Standard pathfinding forces movement along grid lines (up, down, left, right, diagonal). Any-angle algorithms allow movement in any direction, creating more natural, smoother paths like how you'd actually walk around obstacles.

### Optimized Algorithms
These take existing algorithms and make them faster or use less memory, often with clever shortcuts or different approaches to the same problem.

### Dynamic Algorithms
These can update their paths when things change in the environment, like when new obstacles appear or existing ones move.

### Sampling-Based Algorithms
Instead of systematically checking every possibility, these algorithms randomly sample points and build paths, often working better in complex environments.

## Detailed Algorithm Explanations

### A* (A-Star)
**What it does:** A* is like having a very smart friend help you navigate. It knows where you want to go and always chooses the most promising path forward while keeping track of how far you've already traveled.

**How it works:** Imagine you're at point A trying to reach point B. A* looks at all possible next steps and for each one, it calculates: "How far have I traveled so far?" plus "How far do I estimate it is to my destination?" It always explores the path with the lowest total first.

**Why it's special:** A* guarantees to find the shortest path (if one exists) and is usually quite fast. It's the algorithm most other pathfinding methods are compared against.

**Best for:** General-purpose pathfinding when you need the optimal (shortest) path and have moderate memory available.

### Dijkstra's Algorithm
**What it does:** Dijkstra's algorithm is like painting outward from your starting point, coloring every reachable location with the distance it takes to get there. It's very thorough and systematic.

**How it works:** Starting from your location, it explores every possible path simultaneously, always expanding to the closest unexplored point first. It's like a flood filling outward, but keeping track of distances.

**Why it's useful:** Dijkstra finds the shortest path to ALL reachable points, not just your destination. This makes it perfect when you might have multiple possible destinations.

**Best for:** When you need paths to multiple destinations, or when you don't know exactly where you're going but want to explore all possibilities.

### Weighted A*
**What it does:** This is A* with a twist - it's willing to sacrifice some path quality for speed. It's like taking a "good enough" route that gets you there faster rather than spending time finding the perfect route.

**How it works:** Weighted A* works exactly like A*, but it puts extra emphasis on getting closer to the goal. You can adjust how much it favors speed over optimality.

**Why it's popular:** In real-time applications (like video games), you often need a path RIGHT NOW, even if it's not perfect. Weighted A* delivers.

**Best for:** Real-time systems, video games, or any situation where you need fast results and can accept slightly longer paths.

### Breadth-First Search (BFS)
**What it does:** BFS explores outward from the start point like ripples in a pond, checking every location at distance 1, then distance 2, then distance 3, and so on.

**How it works:** It's completely fair and systematic - it explores all paths of length 1 before trying any paths of length 2. This guarantees it finds the shortest path in terms of number of steps.

**Why it's reliable:** BFS will always find the shortest path (in terms of steps), but it doesn't consider that some steps might be more expensive than others.

**Best for:** Simple grids where every move has the same cost, or when you want to understand pathfinding basics.

### Depth-First Search (DFS)
**What it does:** DFS picks a direction and commits to it, going as far as possible down one path before backtracking and trying another.

**How it works:** Imagine exploring a maze by always choosing the leftmost unexplored path, going until you hit a dead end, then backtracking to try the next option.

**Why it's different:** DFS doesn't guarantee the shortest path, but it uses very little memory and can be surprisingly fast in certain situations.

**Best for:** Puzzle solving, maze generation, or when memory is extremely limited.

### Theta*
**What it does:** While most algorithms force you to move along grid edges, Theta* lets you move in straight lines to any visible point, creating paths that look like how people actually navigate.

**How it works:** At each step, Theta* checks: "Can I see my destination from here?" or "Can I see a better intermediate point?" If so, it draws a straight line instead of following grid edges.

**Why it's special:** The paths look natural and smooth, like how you'd actually walk around obstacles rather than taking robotic grid-based steps.

**Best for:** Robotics, game character movement, or anywhere you want natural-looking movement.

### Jump Point Search (JPS)
**What it does:** JPS is A* with a turbo boost. It identifies key "jump points" and skips over large empty areas, dramatically reducing the work needed.

**How it works:** Instead of examining every single grid square, JPS identifies strategic points where paths might change direction and focuses its attention there.

**Why it's revolutionary:** On open grids, JPS can be 10-20 times faster than A* while still finding the optimal path.

**Best for:** Large, open grids with sparse obstacles, especially in video games or large-scale pathfinding.

### IDA* (Iterative Deepening A*)
**What it does:** IDA* finds optimal paths while using almost no memory. It's like having a very patient explorer who's willing to restart their search multiple times with better information.

**How it works:** It performs multiple searches, each time allowing paths to be slightly longer than the previous attempt, until it finds the goal.

**Why it's clever:** IDA* uses almost constant memory - it doesn't need to remember all the paths it's exploring.

**Best for:** Embedded systems, mobile devices, or any situation where memory is severely limited but you still need optimal paths.

### RRT (Rapidly-exploring Random Tree)
**What it does:** RRT grows a tree-like structure of paths by randomly sampling points in space and connecting them, eventually reaching the goal.

**How it works:** Start with your beginning point. Repeatedly: pick a random point in space, find the closest point you can already reach, take a step from there toward the random point. Keep going until you can reach the goal.

**Why it's powerful:** RRT excels in complex environments where traditional grid-based methods struggle. It's probabilistic - run it longer and get better results.

**Best for:** Robot path planning, complex 3D environments, or situations with many obstacles and narrow passages.

### D*-Lite (Dynamic A*-Lite)
**What it does:** D*-Lite can update its path when the environment changes, like when new obstacles appear or existing ones move.

**How it works:** It starts with an initial path, but when conditions change (like a road closing), it efficiently recalculates only the affected portions instead of starting over.

**Why it's essential:** In real-world scenarios, environments are dynamic. D*-Lite handles changes efficiently.

**Best for:** Robot navigation in changing environments, GPS systems with traffic updates, or any dynamic scenario.

### Field D*
**What it does:** Combines the adaptability of D* with the smooth, natural paths of any-angle algorithms.

**How it works:** Like D*-Lite, but instead of being constrained to grid edges, it can plan smooth paths at any angle and update them when things change.

**Best for:** Mobile robots that need smooth paths in changing environments.

### Anytime A*
**What it does:** Anytime A* gives you a path quickly, then keeps improving it as long as you give it time.

**How it works:** First, it finds any path (even a poor one) very quickly. Then it uses remaining time to find better and better paths, eventually reaching the optimal solution.

**Why it's practical:** Perfect for real-time systems where you need SOME answer immediately but can accept improvements over time.

**Best for:** Interactive applications, games, or any time-critical system.

### Incremental Phi*
**What it does:** An any-angle algorithm that learns and improves its performance over multiple pathfinding requests in the same environment.

**How it works:** Like Theta*, but it remembers information from previous searches to make future searches faster.

**Best for:** Scenarios where you'll be doing many pathfinding requests in the same or similar environments.

### GAA* (Generalized Adaptive A*)
**What it does:** Efficiently handles situations where your destination keeps changing during the search.

**How it works:** When your goal moves, GAA* reuses previous computation rather than starting completely over.

**Best for:** Chasing moving targets, dynamic goal scenarios, or interactive applications where users change their destination.

### MTD*-Lite (Moving Target D*-Lite)
**What it does:** Specialized for efficiently tracking moving targets in changing environments.

**How it works:** Combines dynamic replanning with target prediction and tracking.

**Best for:** Games with moving enemies, surveillance systems, or robotic pursuit scenarios.

## How to Use This Project

### Live Demo (Easiest Way)

Try the algorithms right now in your browser:
**[🔗 Live Demo on GitHub Pages](https://rachiecodes.github.io/pathing-algorithms/)**

No installation required! The web interface lets you:
- Draw obstacles on a grid with your mouse
- Choose any algorithm from the dropdown
- Watch the algorithm search for a path in real-time
- Compare all algorithms at once to see their differences
- Adjust grid size and animation speed

### Run Locally (Optional)

To run the project locally, simply clone and open:

```bash
# Clone the repository
git clone https://github.com/RachieCodes/pathing-algorithms.git
cd pathing-algorithms

# Serve with a simple HTTP server:
python -m http.server 8000
# Then visit: http://localhost:8000
```

### Understanding the Visualizations

When you run an algorithm, you'll see different colored squares:
- **Green**: Your starting point
- **Red**: Your destination  
- **Black**: Obstacles (walls)
- **Light Blue**: Areas the algorithm has explored
- **Dark Blue**: Areas the algorithm is considering next
- **Yellow**: The final path found

## Choosing the Right Algorithm

### If you're just starting to learn pathfinding:
**Start with A*** - it's the most important algorithm to understand. Once you grasp A*, other algorithms will make much more sense.

### If you need the absolute shortest path:
**Use A*, Dijkstra, Theta*, JPS, or IDA*** - these guarantee the optimal solution.

### If you need speed over perfection:
**Use Weighted A*** - you can control the trade-off between speed and path quality.

### If you have a large, open area with few obstacles:
**Use Jump Point Search** - it can be 20 times faster than A* in the right conditions.

### If memory is extremely limited:
**Use IDA*** - it uses almost no memory while still finding optimal paths.

### If you want natural, smooth movement:
**Use Theta*** - paths look like how people actually move instead of robotic grid-steps.

### If obstacles or goals keep changing:
**Use D*-Lite or Field D*** - they efficiently update paths when things change.

### If you're working with complex 3D environments:
**Use RRT** - it handles complex obstacle arrangements that would overwhelm grid-based methods.



## Real-World Applications

### GPS Navigation Systems
GPS uses variations of Dijkstra and A* to find routes. When your GPS recalculates due to traffic, it's using concepts similar to D*-Lite.

### Video Games
- **A*** powers NPC movement in most games
- **Jump Point Search** handles large game worlds efficiently
- **Theta*** creates natural character movement
- **RRT** helps navigate complex 3D environments

### Robotics
- **RRT** family algorithms help robots navigate unknown spaces
- **D*-Lite** allows robots to adapt when they discover new obstacles
- **Field D*** creates smooth robot movement paths
- **Theta*** helps drones fly natural trajectories

### Network Routing
Internet routers use algorithms similar to Dijkstra to find the best path for data packets across the global network.

## Common Misconceptions

**"Faster algorithms are always better"** - Not true. A fast algorithm that finds a poor path might waste more time in the long run than a slower algorithm that finds a great path.

**"A* is always the best choice"** - A* is excellent for learning and general use, but specialized algorithms can be dramatically better in the right situations.

**"Optimal algorithms are always worth the extra cost"** - Sometimes a "good enough" path found quickly is better than a perfect path found slowly, especially in real-time applications.

**"Complex algorithms are always better"** - Simple algorithms like BFS or DFS are sometimes exactly what you need, especially for specific problem types.

## Conclusion

Pathfinding algorithms are fundamental tools in computer science, used everywhere from GPS systems to video games. Each algorithm represents a different strategy for solving the same basic problem: finding the best path between two points.

The key to mastering pathfinding is understanding that different situations call for different approaches. A* might be perfect for your RPG game, but RRT could be essential for your robot navigation system. Jump Point Search might revolutionize your strategy game's performance, while IDA* might be the only option that fits in your embedded system's memory.

Start with the basics, experiment with the visualizations, and gradually work your way up to more specialized algorithms. Most importantly, always consider your specific needs and constraints when choosing an algorithm.

Remember: the "best" pathfinding algorithm is the one that best solves YOUR specific problem within YOUR constraints. This project gives you the tools to understand, compare, and choose wisely.

## Getting Started Right Now

1. **Visit the live demo**: [https://rachiecodes.github.io/pathing-algorithms/](https://rachiecodes.github.io/pathing-algorithms/)
2. **Draw some obstacles** and **watch A* work**
3. **Try different algorithms** and see how they compare
4. **Use "Compare All"** to see all algorithms race against each other

