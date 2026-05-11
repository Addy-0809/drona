# Design and Analysis of Algorithms — Comprehensive Knowledge Base

## 1. Algorithm Analysis Fundamentals

**Algorithm**: A finite sequence of well-defined instructions for solving a computational problem. Properties: Input, Output, Definiteness, Finiteness, Effectiveness.

**Asymptotic Notations**:
- **Big-O (O)**: Upper bound. f(n) = O(g(n)) if ∃ c, n₀ such that f(n) ≤ c·g(n) for all n ≥ n₀. Worst-case behavior.
- **Big-Omega (Ω)**: Lower bound. f(n) = Ω(g(n)) if ∃ c, n₀ such that f(n) ≥ c·g(n) for all n ≥ n₀. Best-case guarantee.
- **Big-Theta (Θ)**: Tight bound. f(n) = Θ(g(n)) if f(n) = O(g(n)) and f(n) = Ω(g(n)). Exact growth rate.
- **Little-o**: Strict upper bound (not tight). f(n) = o(g(n)) if lim f(n)/g(n) = 0.
- **Little-omega (ω)**: Strict lower bound. f(n) = ω(g(n)) if lim f(n)/g(n) = ∞.

**Common Growth Rates** (slowest to fastest): O(1) < O(log n) < O(√n) < O(n) < O(n log n) < O(n²) < O(n³) < O(2ⁿ) < O(n!) < O(nⁿ).

**Recurrence Relations**: Equations expressing T(n) in terms of T on smaller inputs. Solving methods:
- **Substitution Method**: Guess the form of solution, prove by induction.
- **Recursion Tree Method**: Draw tree of recursive calls, sum work at each level.
- **Master Theorem**: For T(n) = aT(n/b) + f(n):
  - Case 1: If f(n) = O(n^(log_b(a) - ε)), then T(n) = Θ(n^(log_b(a)))
  - Case 2: If f(n) = Θ(n^(log_b(a)) · log^k(n)), then T(n) = Θ(n^(log_b(a)) · log^(k+1)(n))
  - Case 3: If f(n) = Ω(n^(log_b(a) + ε)) and af(n/b) ≤ cf(n), then T(n) = Θ(f(n))

**Amortized Analysis**: Average cost per operation over a worst-case sequence. Methods: Aggregate (total cost / n), Accounting (assign amortized costs, maintain credit), Potential (define potential function, amortized = actual + ΔΦ).

## 2. Divide and Conquer

**Paradigm**: (1) Divide problem into subproblems, (2) Conquer subproblems recursively, (3) Combine solutions.

**Merge Sort**: T(n) = 2T(n/2) + O(n) → O(n log n). Stable, not in-place. Divide array in half, recursively sort, merge two sorted halves.

**Quick Sort**: Choose pivot, partition around it. Average T(n) = 2T(n/2) + O(n) → O(n log n). Worst case: O(n²) with bad pivot. Randomized quicksort avoids worst case with high probability.

**Binary Search**: T(n) = T(n/2) + O(1) → O(log n). Requires sorted array.

**Strassen's Matrix Multiplication**: T(n) = 7T(n/2) + O(n²) → O(n^2.807). Reduces 8 recursive multiplications to 7 using clever addition/subtraction.

**Closest Pair of Points**: Divide points by x-coordinate. Recursively find closest in each half. Check strip near dividing line. O(n log n).

**Karatsuba Multiplication**: Multiply n-digit numbers in O(n^1.585) instead of O(n²). Uses 3 multiplications instead of 4: xy = ac·B² + ((a+b)(c+d) - ac - bd)·B + bd where x = aB+b, y = cB+d.

**Maximum Subarray (Kadane's)**: Find contiguous subarray with largest sum. O(n). D&C approach: O(n log n) — max of (left, right, crossing).

## 3. Greedy Algorithms

**Paradigm**: Make locally optimal choice at each step. Works when: (1) Greedy-choice property — local optimum leads to global optimum, (2) Optimal substructure.

**Proving Correctness**: Exchange argument — show any optimal solution can be transformed to greedy solution without worsening it. Or structural induction.

**Activity Selection**: Sort by finish time. Greedily select earliest-finishing non-overlapping activity. O(n log n).

**Huffman Coding**: Lossless data compression. Build binary tree bottom-up using priority queue. Lower frequency → deeper in tree → longer code. Prefix-free codes. Optimal for character-level compression.

**Fractional Knapsack**: Sort items by value/weight ratio. Greedily take items (allow fractions). O(n log n). Greedy works (unlike 0/1 knapsack).

**Job Sequencing with Deadlines**: Sort by profit (descending). For each job, find latest available slot before deadline. O(n²) or O(n log n) with Union-Find.

**Minimum Spanning Tree**:
- **Kruskal's**: Sort edges, add if no cycle (Union-Find). O(E log E). Works well for sparse graphs.
- **Prim's**: Grow tree from start vertex, always add minimum weight edge to new vertex. O((V+E) log V) with binary heap, O(E + V log V) with Fibonacci heap.

**Dijkstra's Single-Source Shortest Path**: Greedy approach for non-negative edge weights. Min-heap priority queue. O((V+E) log V). Relax edges greedily.

## 4. Dynamic Programming

**Paradigm**: Solve overlapping subproblems by storing results (memoization/tabulation). Requirements: Optimal substructure + Overlapping subproblems.

**Top-Down (Memoization)**: Recursive with cache. Natural problem decomposition. May have stack overhead.
**Bottom-Up (Tabulation)**: Iterative, fill table from base cases. No recursion overhead. May compute unnecessary subproblems.

### Classic DP Problems

**0/1 Knapsack**: Items with weight and value. Maximize value within weight limit. dp[i][w] = max(dp[i-1][w], dp[i-1][w-wt[i]] + val[i]). Time: O(nW). Space-optimized: O(W) using single row.

**Unbounded Knapsack**: Items can be taken multiple times. dp[w] = max(dp[w], dp[w-wt[i]] + val[i]) for all items.

**Longest Common Subsequence (LCS)**: dp[i][j] = dp[i-1][j-1]+1 if X[i]=Y[j], else max(dp[i-1][j], dp[i][j-1]). O(mn). Reconstruct LCS by backtracking.

**Longest Increasing Subsequence (LIS)**: dp[i] = max length ending at i. O(n²) DP. O(n log n) with patience sorting + binary search.

**Edit Distance (Levenshtein)**: dp[i][j] = min(dp[i-1][j]+1 (delete), dp[i][j-1]+1 (insert), dp[i-1][j-1]+cost (substitute)). O(mn).

**Matrix Chain Multiplication**: Minimize scalar multiplications. dp[i][j] = min over k of (dp[i][k] + dp[k+1][j] + p[i-1]·p[k]·p[j]). O(n³).

**Coin Change**: Minimum coins for amount. dp[a] = min(dp[a-coin]+1) for each coin. O(n × amount). Number of ways: dp[a] += dp[a-coin].

**Rod Cutting**: Maximize revenue from cutting rod. dp[i] = max(price[j] + dp[i-j]) for j=1..i. O(n²).

**Longest Palindromic Subsequence**: dp[i][j] = dp[i+1][j-1]+2 if s[i]=s[j], else max(dp[i+1][j], dp[i][j-1]). O(n²).

**Floyd-Warshall All-Pairs Shortest Path**: dp[i][j] = min(dp[i][j], dp[i][k]+dp[k][j]). O(V³).

**Bellman-Ford**: Relax all edges V-1 times. Handles negative weights. O(VE).

**Travelling Salesman Problem (TSP)**: dp[S][i] = min cost to visit all cities in set S ending at i. O(n² × 2ⁿ). NP-hard but DP gives exponential improvement over n!.

**Subset Sum**: Does a subset sum to target? dp[i][s] = dp[i-1][s] || dp[i-1][s-arr[i]]. O(n × sum).

## 5. Backtracking

**Paradigm**: Systematically explore all candidates. Build solution incrementally. Abandon (prune) partial solutions that cannot lead to valid complete solutions.

**Template**: Choose → Explore (recurse) → Un-choose (backtrack).

**N-Queens**: Place N non-attacking queens on N×N board. Check row, column, diagonal conflicts. O(N!) worst case but pruning drastically reduces search space.

**Sudoku Solver**: Fill 9×9 grid with digits 1-9. Constraints: row, column, 3×3 box uniqueness. Try digits, backtrack on conflict.

**Graph Coloring**: Assign colors to vertices such that no adjacent vertices share a color. m-coloring decision problem is NP-complete for m ≥ 3.

**Hamiltonian Path/Cycle**: Visit every vertex exactly once. NP-complete. Backtracking explores all permutations with pruning.

**Subset Sum (Backtracking)**: Generate subsets, prune when partial sum exceeds target.

## 6. Branch and Bound

**Paradigm**: Systematic enumeration with pruning based on bounds. Maintains best solution found so far (incumbent). For each node, compute bound — if bound worse than incumbent, prune.

**0/1 Knapsack (B&B)**: Compute upper bound using fractional knapsack. If bound ≤ best known value, prune. FIFO (BFS), LIFO (DFS), or LC (Least Cost) search strategies.

**TSP (B&B)**: Reduce cost matrix. Lower bound = sum of reductions. Explore minimum-cost branches. Prune when bound exceeds best tour.

**Job Assignment Problem**: Assign n jobs to n persons minimizing total cost. Hungarian algorithm gives O(n³) optimal solution. B&B provides alternative approach.

## 7. Graph Algorithms (Advanced)

**Strongly Connected Components (SCC)**: Kosaraju's (2 DFS passes — one on original, one on transpose) or Tarjan's (single DFS with stack and low-link values). O(V + E).

**Articulation Points and Bridges**: Found using DFS. Articulation point: removal disconnects graph. Bridge: edge whose removal disconnects graph. O(V + E) using discovery time and low values.

**Network Flow**: 
- **Ford-Fulkerson Method**: Find augmenting paths in residual graph, augment flow. O(E × max_flow).
- **Edmonds-Karp**: BFS-based Ford-Fulkerson. O(VE²).
- **Max-Flow Min-Cut Theorem**: Maximum flow = minimum cut capacity.
- **Applications**: Bipartite matching, project selection, image segmentation.

**Bipartite Matching**: Maximum matching in bipartite graph. Hungarian algorithm: O(V³). Hopcroft-Karp: O(E√V).

## 8. String Algorithms

**KMP Pattern Matching**: Failure function (partial match table) avoids re-examining characters. O(n + m). Failure function: π[i] = length of longest proper prefix of pattern[0..i] that is also a suffix.

**Rabin-Karp**: Rolling hash for pattern matching. Hash(s[i+1..i+m]) computed from Hash(s[i..i+m-1]) in O(1). Average O(n+m), worst O(nm).

**Suffix Array and LCP Array**: Sorted array of all suffixes. Construction: O(n log n) or O(n). With LCP array: longest repeated substring, number of distinct substrings.

## 9. Computational Complexity

**P**: Problems solvable in polynomial time by a deterministic Turing machine.

**NP**: Problems verifiable in polynomial time. P ⊆ NP (every P problem is also NP).

**NP-Hard**: Problems at least as hard as the hardest NP problems. A problem H is NP-hard if every NP problem can be reduced to H in polynomial time.

**NP-Complete**: Problems that are both NP and NP-hard. First: Cook's theorem — SAT is NP-complete. Proving NP-completeness: (1) Show problem is in NP (polynomial verifier), (2) Reduce known NP-complete problem to it in polynomial time.

**Famous NP-Complete Problems**: SAT, 3-SAT, Clique, Vertex Cover, Hamiltonian Cycle, TSP (decision), Graph Coloring, Subset Sum, Knapsack (decision), Set Cover, Independent Set.

**P = NP Question**: Millennium Prize Problem. If P = NP, every problem whose solution can be verified quickly can also be solved quickly. Most experts believe P ≠ NP.

**Reductions**: Problem A reduces to B (A ≤_p B) if a polynomial-time algorithm can transform instances of A to instances of B. If B is in P and A ≤_p B, then A is in P.

## 10. Approximation Algorithms

For NP-hard optimization problems, find near-optimal solutions in polynomial time.

**Approximation Ratio**: ρ(n) = max(C/C*, C*/C) where C = algorithm's cost, C* = optimal cost.

**Vertex Cover**: 2-approximation — find maximal matching, take both endpoints. |C| ≤ 2|C*|.

**TSP** (metric/triangle inequality): 2-approximation using MST. Christofides' algorithm: 3/2-approximation using MST + minimum weight perfect matching on odd-degree vertices.

**Set Cover**: Greedy gives O(ln n)-approximation. Best possible unless P = NP.

**Knapsack FPTAS**: Fully Polynomial-Time Approximation Scheme. (1+ε)-approximation in O(n²/ε) time.
