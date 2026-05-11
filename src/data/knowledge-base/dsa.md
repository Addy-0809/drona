# Data Structures and Algorithms — Comprehensive Knowledge Base

## 1. Introduction to Data Structures

A **data structure** is a specialized format for organizing, processing, retrieving, and storing data. The choice of data structure directly impacts the efficiency of algorithms that manipulate data. Data structures are broadly classified into **linear** (arrays, linked lists, stacks, queues) and **non-linear** (trees, graphs, hash tables) categories.

**Abstract Data Types (ADT)**: An ADT is a mathematical model for data types defined by its behavior (semantics) rather than implementation. Examples include List ADT, Stack ADT, Queue ADT, Map ADT, and Set ADT.

**Complexity Analysis**: Every data structure operation has time and space complexity measured using Big-O notation. Common complexities ranked from fastest to slowest: O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n) linearithmic, O(n²) quadratic, O(2ⁿ) exponential, O(n!) factorial.

## 2. Arrays

An **array** is a contiguous block of memory storing elements of the same type, accessed by index in O(1) time.

**Static Arrays**: Fixed-size, allocated at compile time. Size cannot change after creation. Declaration: `int arr[100]`. Memory = size × sizeof(element).

**Dynamic Arrays**: Resizable arrays (ArrayList in Java, vector in C++, list in Python). When capacity is exceeded, a new array of double the size is allocated and elements are copied over. Amortized insertion time is O(1), worst-case O(n) for resizing.

**Key Operations and Complexities**:
- Access by index: O(1)
- Search (unsorted): O(n)
- Search (sorted, binary search): O(log n)
- Insertion at end: O(1) amortized
- Insertion at index i: O(n) — requires shifting elements
- Deletion at index i: O(n) — requires shifting elements

**Multi-dimensional Arrays**: 2D arrays are stored in row-major (C/C++) or column-major (Fortran) order. Address of element A[i][j] in row-major: Base + (i × cols + j) × size.

**Applications**: Lookup tables, matrix operations, image processing (pixel grids), implementing other data structures (heaps, hash tables).

## 3. Linked Lists

A **linked list** is a linear collection of nodes where each node contains data and a pointer/reference to the next node. Unlike arrays, elements are not stored contiguously.

### Singly Linked List
Each node has: `data` + `next` pointer. The last node's next is NULL.
- Insertion at head: O(1)
- Insertion at tail (with tail pointer): O(1)
- Insertion at position k: O(k)
- Deletion of head: O(1)
- Deletion by value: O(n)
- Search: O(n)

### Doubly Linked List
Each node has: `prev` + `data` + `next`. Allows traversal in both directions.
- Advantages: O(1) deletion when node reference is known, backward traversal
- Disadvantages: Extra memory per node for prev pointer

### Circular Linked List
Last node points back to the first node, forming a circle. Useful for round-robin scheduling, circular buffers, and multiplayer game turn management.

**Sentinel Nodes**: A dummy head/tail node simplifies edge cases (empty list, single element) by eliminating null checks.

**Floyd's Cycle Detection Algorithm (Tortoise and Hare)**: Uses two pointers — slow moves 1 step, fast moves 2 steps. If they meet, a cycle exists. To find the cycle start, reset one pointer to head and move both at speed 1.

## 4. Stacks

A **stack** is a Last-In-First-Out (LIFO) data structure. The element added most recently is removed first.

**Operations**:
- push(x): Add element to top — O(1)
- pop(): Remove and return top element — O(1)
- peek()/top(): Return top element without removing — O(1)
- isEmpty(): Check if stack is empty — O(1)

**Implementations**: Array-based (fixed/dynamic) or linked-list-based.

**Applications**:
- **Expression evaluation**: Infix to postfix conversion (Shunting Yard algorithm), postfix evaluation
- **Parentheses matching**: Push opening brackets, pop and match for closing brackets
- **Function call stack**: Each function call creates a stack frame with local variables, return address
- **Undo/Redo**: Operations pushed onto undo stack; undone operations pushed onto redo stack
- **DFS traversal**: Iterative depth-first search uses an explicit stack
- **Browser history**: Back/forward navigation

**Infix to Postfix Conversion**: Use operator precedence and associativity. Scan left to right: operands go directly to output, operators go to stack (popping higher-or-equal precedence operators first), left parenthesis pushed, right parenthesis pops until left parenthesis.

## 5. Queues

A **queue** is a First-In-First-Out (FIFO) data structure. Elements are added at the rear and removed from the front.

**Operations**:
- enqueue(x): Add element to rear — O(1)
- dequeue(): Remove and return front element — O(1)
- front()/peek(): View front element — O(1)
- isEmpty(): Check if empty — O(1)

**Circular Queue**: Uses a fixed-size array with front and rear indices that wrap around. Efficiently uses space by reusing vacated positions. Full when `(rear + 1) % size == front`.

**Double-Ended Queue (Deque)**: Supports insertion and deletion at both ends. Can function as both stack and queue.

**Priority Queue**: Elements have associated priorities. Highest priority element is dequeued first regardless of insertion order. Typically implemented using a heap. Operations: insert O(log n), extractMax/Min O(log n).

**Applications**: CPU scheduling (round-robin), BFS traversal, print queue, message queues in distributed systems, buffering (keyboard buffer, network packets).

## 6. Hash Tables

A **hash table** (hash map) stores key-value pairs using a hash function to compute an index into an array of buckets.

**Hash Function**: Maps keys to array indices. A good hash function distributes keys uniformly. Common: division method `h(k) = k mod m`, multiplication method `h(k) = floor(m * (k*A mod 1))` where 0 < A < 1 (Knuth suggests A ≈ 0.6180339887).

**Collision Resolution**:
1. **Chaining (Open Hashing)**: Each bucket holds a linked list of entries. Average search/insert: O(1 + α) where α = n/m is the load factor.
2. **Open Addressing (Closed Hashing)**: All entries stored in the array itself. On collision, probe for next empty slot:
   - Linear probing: h(k, i) = (h(k) + i) mod m — causes primary clustering
   - Quadratic probing: h(k, i) = (h(k) + c₁i + c₂i²) mod m — reduces clustering
   - Double hashing: h(k, i) = (h₁(k) + i·h₂(k)) mod m — best distribution

**Load Factor (α)**: α = n/m (number of entries / table size). When α exceeds threshold (typically 0.7), the table is resized (usually doubled) and all entries are rehashed.

**Average Case Complexities**: Insert O(1), Search O(1), Delete O(1). Worst case (all collisions): O(n).

**Applications**: Databases (indexing), caches, symbol tables in compilers, counting frequencies, implementing sets.

## 7. Trees

A **tree** is a hierarchical, non-linear data structure consisting of nodes connected by edges. A tree with n nodes has exactly n-1 edges.

**Terminology**: Root (topmost node), parent, child, leaf (no children), internal node (has children), depth (edges from root to node), height (edges from node to deepest leaf), level (depth + 1), subtree, degree (number of children).

### Binary Tree
Each node has at most 2 children (left and right).
- **Full Binary Tree**: Every node has 0 or 2 children
- **Complete Binary Tree**: All levels filled except possibly the last, which is filled left to right
- **Perfect Binary Tree**: All internal nodes have 2 children, all leaves at the same level. Nodes = 2^(h+1) - 1
- **Balanced Binary Tree**: Height difference between left and right subtrees of any node ≤ 1

**Traversals**:
- **Inorder (LNR)**: Left → Node → Right. Gives sorted order for BST.
- **Preorder (NLR)**: Node → Left → Right. Used for copying/serializing trees.
- **Postorder (LRN)**: Left → Right → Node. Used for deletion, expression evaluation.
- **Level-order (BFS)**: Visit nodes level by level using a queue.

### Binary Search Tree (BST)
For every node: all left descendants < node < all right descendants.
- Search: O(h), where h = height. Best O(log n) for balanced, worst O(n) for skewed.
- Insert: O(h)
- Delete: 3 cases — leaf (remove directly), one child (replace with child), two children (replace with inorder successor or predecessor, then delete that)
- Inorder traversal gives sorted sequence

### AVL Tree (Self-Balancing BST)
Named after Adelson-Velsky and Landis. Maintains balance factor (BF) = height(left) - height(right) ∈ {-1, 0, 1} for every node.

**Rotations** to restore balance after insertion/deletion:
- **Left Rotation (LL imbalance)**: When right subtree is heavier
- **Right Rotation (RR imbalance)**: When left subtree is heavier
- **Left-Right Rotation (LR)**: Left rotate on left child, then right rotate on node
- **Right-Left Rotation (RL)**: Right rotate on right child, then left rotate on node

All operations: O(log n) guaranteed.

### Red-Black Tree
Self-balancing BST with properties: (1) every node is red or black, (2) root is black, (3) leaves (NIL) are black, (4) red node's children are black, (5) all paths from root to leaves have the same number of black nodes.

Guarantees O(log n) operations. Used in Java TreeMap, C++ std::map, Linux CFS scheduler.

### B-Tree and B+ Tree
**B-Tree** of order m: each node can have up to m children and m-1 keys. All leaves at the same depth. Designed for disk-based storage — minimizes disk I/O by keeping tree height low.

**B+ Tree**: All data stored in leaf nodes (which are linked), internal nodes only store keys for routing. Used extensively in database indexing (MySQL InnoDB, PostgreSQL).

### Heap
A **heap** is a complete binary tree satisfying the heap property:
- **Max-Heap**: Parent ≥ children. Root is the maximum element.
- **Min-Heap**: Parent ≤ children. Root is the minimum element.

**Array representation**: For node at index i: left child = 2i+1, right child = 2i+2, parent = floor((i-1)/2).

**Operations**:
- Insert: Add at end, then heapify-up (bubble up). O(log n)
- Extract-Max/Min: Replace root with last element, then heapify-down (sift down). O(log n)
- Build heap from array: O(n) using bottom-up heapification
- Peek (get max/min without removing): O(1)

**Applications**: Priority queues, heap sort, Dijkstra's algorithm, median maintenance, K-th largest/smallest element.

## 8. Graphs

A **graph** G = (V, E) consists of vertices (nodes) V and edges E connecting pairs of vertices.

**Types**:
- **Directed (Digraph)**: Edges have direction (u → v)
- **Undirected**: Edges have no direction (u — v)
- **Weighted**: Edges have associated weights/costs
- **Unweighted**: All edges have equal weight
- **Dense**: |E| ≈ |V|² — use adjacency matrix
- **Sparse**: |E| << |V|² — use adjacency list
- **Connected**: Path exists between every pair of vertices (undirected)
- **Strongly Connected**: Path exists between every pair in both directions (directed)
- **DAG (Directed Acyclic Graph)**: Directed graph with no cycles

**Representations**:
1. **Adjacency Matrix**: V×V matrix, M[i][j] = 1 if edge exists. Space: O(V²). Edge check: O(1). Find neighbors: O(V).
2. **Adjacency List**: Array of lists, each list stores neighbors. Space: O(V + E). Find neighbors: O(degree). Edge check: O(degree).

### Graph Traversals

**BFS (Breadth-First Search)**: Explores level by level using a queue. Time: O(V + E). Finds shortest path in unweighted graphs. Used for: shortest path, connected components, bipartiteness check.

**DFS (Depth-First Search)**: Explores as deep as possible using a stack/recursion. Time: O(V + E). Used for: cycle detection, topological sort, connected components, articulation points, bridges.

### Shortest Path Algorithms

**Dijkstra's Algorithm**: Single-source shortest path for non-negative weights. Uses a priority queue (min-heap). Time: O((V + E) log V) with binary heap. Greedy approach — always processes the closest unvisited vertex.

**Bellman-Ford Algorithm**: Single-source shortest path, handles negative weights. Relaxes all edges V-1 times. Detects negative cycles (if relaxation possible after V-1 iterations). Time: O(VE).

**Floyd-Warshall Algorithm**: All-pairs shortest path using dynamic programming. dp[i][j] = min(dp[i][j], dp[i][k] + dp[k][j]) for all intermediate vertices k. Time: O(V³). Space: O(V²).

### Minimum Spanning Tree (MST)

**Kruskal's Algorithm**: Sort all edges by weight. Add edges in order if they don't form a cycle (use Union-Find). Time: O(E log E).

**Prim's Algorithm**: Start from any vertex, greedily add the minimum weight edge connecting the tree to a non-tree vertex. Uses priority queue. Time: O((V + E) log V).

### Topological Sort
Linear ordering of vertices in a DAG such that for every directed edge u → v, u appears before v. Methods: DFS-based (reverse postorder) or Kahn's algorithm (BFS with in-degree tracking). Time: O(V + E).

### Cycle Detection
- **Undirected graph**: BFS/DFS — if a visited neighbor is not the parent, cycle exists. Or use Union-Find.
- **Directed graph**: DFS with coloring (white/gray/black). If a gray node is encountered, back edge = cycle exists.

## 9. Sorting Algorithms

### Comparison-Based Sorts

**Bubble Sort**: Repeatedly swap adjacent elements if out of order. Best O(n) with optimization flag, Average/Worst O(n²). Stable. In-place.

**Selection Sort**: Find minimum in unsorted portion, swap to front. Always O(n²). Not stable. In-place.

**Insertion Sort**: Insert each element into its correct position in the sorted portion. Best O(n) for nearly sorted, Average/Worst O(n²). Stable. In-place. Efficient for small n.

**Merge Sort**: Divide array in half, recursively sort each half, merge two sorted halves. Always O(n log n). Stable. Not in-place — O(n) extra space. Based on divide and conquer.

**Quick Sort**: Choose a pivot, partition array into elements ≤ pivot and > pivot, recursively sort partitions. Average O(n log n), Worst O(n²) with poor pivot choice. Not stable. In-place. Randomized pivot or median-of-three avoids worst case.

**Heap Sort**: Build a max-heap, repeatedly extract max and place at end. Always O(n log n). Not stable. In-place.

### Non-Comparison Sorts

**Counting Sort**: Count occurrences of each value. Works for integers in known range [0, k]. Time: O(n + k). Stable. Space: O(k).

**Radix Sort**: Sort digit by digit (LSD or MSD) using a stable sort (counting sort) as subroutine. Time: O(d × (n + k)) where d = number of digits, k = base.

**Bucket Sort**: Distribute elements into buckets, sort each bucket, concatenate. Average O(n + k). Best for uniformly distributed data.

**Lower bound for comparison sorts**: Ω(n log n) — proven via decision tree model.

## 10. Searching Algorithms

**Linear Search**: Check each element sequentially. O(n). Works on unsorted data.

**Binary Search**: Requires sorted array. Compare target with middle element, eliminate half each step. O(log n). Iterative or recursive.

**Ternary Search**: Divide into three parts. O(log₃ n). Used for unimodal function optimization.

**Interpolation Search**: Improved binary search for uniformly distributed data. Estimates position: pos = low + ((target - arr[low]) × (high - low)) / (arr[high] - arr[low]). Average O(log log n), worst O(n).

## 11. Recursion and Backtracking

**Recursion**: A function that calls itself with a smaller subproblem. Every recursive function needs: (1) base case(s), (2) recursive step that progresses toward base case. Call stack stores activation records.

**Tail Recursion**: Recursive call is the last operation. Can be optimized by compilers to iteration (tail call optimization).

**Backtracking**: Systematic exploration of all candidates, abandoning ("pruning") paths that cannot lead to a valid solution. Template: choose → explore → un-choose.

**Classic Problems**: N-Queens (place N non-attacking queens on N×N board), Sudoku solver, maze solving, subset sum, permutation generation, graph coloring.

## 12. Dynamic Programming

**Dynamic Programming (DP)** solves problems by breaking them into overlapping subproblems and storing results to avoid redundant computation.

**Properties required**: (1) Optimal substructure — optimal solution contains optimal solutions to subproblems, (2) Overlapping subproblems — same subproblems solved multiple times.

**Approaches**:
- **Top-down (Memoization)**: Recursive with caching. Start from the original problem, cache results.
- **Bottom-up (Tabulation)**: Iterative, fill table from smallest subproblems upward.

**Classic Problems**:
- **Fibonacci**: dp[i] = dp[i-1] + dp[i-2]. Space-optimized to O(1) with two variables.
- **0/1 Knapsack**: dp[i][w] = max(dp[i-1][w], dp[i-1][w-wt[i]] + val[i]). Time: O(nW).
- **Longest Common Subsequence (LCS)**: dp[i][j] = dp[i-1][j-1]+1 if match, else max(dp[i-1][j], dp[i][j-1]). Time: O(mn).
- **Longest Increasing Subsequence (LIS)**: O(n²) DP or O(n log n) with binary search + patience sorting.
- **Matrix Chain Multiplication**: dp[i][j] = min over k of (dp[i][k] + dp[k+1][j] + cost of multiplying). Time: O(n³).
- **Edit Distance (Levenshtein)**: dp[i][j] = min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1] + (s1[i]≠s2[j])). Time: O(mn).
- **Coin Change**: dp[i] = min(dp[i - coin] + 1) for all coins. Time: O(n × amount).
- **Rod Cutting**: dp[i] = max(price[j] + dp[i-j]) for j = 1 to i.

## 13. Greedy Algorithms

**Greedy** algorithms make the locally optimal choice at each step, hoping for a globally optimal solution. Works when the problem has the greedy-choice property and optimal substructure.

**Classic Problems**:
- **Activity Selection**: Sort by finish time, greedily select non-overlapping activities.
- **Huffman Coding**: Build optimal prefix-free code using a priority queue. Frequency-based compression.
- **Fractional Knapsack**: Sort by value/weight ratio, take greedily. O(n log n). (Unlike 0/1 Knapsack which needs DP.)
- **Job Sequencing with Deadlines**: Sort by profit, schedule in latest available slot before deadline.
- **Minimum number of coins**: For canonical coin systems, greedy works (e.g., US coins).

## 14. Divide and Conquer

**Divide** the problem into subproblems, **conquer** each recursively, **combine** results.

**Master Theorem** for T(n) = aT(n/b) + O(nᵈ):
- If d < log_b(a): T(n) = O(n^(log_b(a)))
- If d = log_b(a): T(n) = O(nᵈ log n)
- If d > log_b(a): T(n) = O(nᵈ)

**Examples**: Merge sort, quick sort, binary search, Strassen's matrix multiplication (O(n^2.807) vs O(n³)), closest pair of points (O(n log n)), Karatsuba multiplication.

## 15. Trie (Prefix Tree)

A **trie** is a tree-like data structure for storing strings, where each edge represents a character and paths from root to marked nodes represent stored strings.

**Operations**: Insert, search, prefix search — all O(m) where m = string length.

**Applications**: Autocomplete, spell checkers, IP routing (longest prefix match), dictionary implementations, DNA sequence matching.

**Space-Optimized Variants**: Compressed trie (Patricia tree/Radix tree) — merges single-child chains into one node.

## 16. Disjoint Set Union (Union-Find)

Maintains a collection of disjoint sets supporting:
- **MakeSet(x)**: Create a set with single element x
- **Find(x)**: Return the representative of the set containing x (with path compression)
- **Union(x, y)**: Merge sets containing x and y (union by rank/size)

With path compression + union by rank: nearly O(1) amortized per operation (inverse Ackermann function α(n)).

**Applications**: Kruskal's MST, cycle detection in undirected graphs, connected components, equivalence classes.

## 17. Segment Tree and Fenwick Tree

### Segment Tree
Binary tree for range queries and point updates. Each node stores aggregate (sum, min, max) of a range.
- Build: O(n)
- Query (range sum/min/max): O(log n)
- Update (point): O(log n)
- Lazy propagation for range updates: O(log n)

### Fenwick Tree (Binary Indexed Tree)
Space-efficient structure for prefix sum queries and point updates.
- Build: O(n)
- Point update: O(log n)
- Prefix sum query: O(log n)
- Range sum = prefix(r) - prefix(l-1)

## 18. String Algorithms

**KMP (Knuth-Morris-Pratt)**: Pattern matching using failure function (partial match table). O(n + m). Avoids re-examining characters.

**Rabin-Karp**: Rolling hash-based pattern matching. Average O(n + m), worst O(nm). Good for multiple pattern search.

**Z-Algorithm**: Computes Z-array where Z[i] = length of longest substring starting at i that matches a prefix. O(n). Used for pattern matching.

**Suffix Array**: Sorted array of all suffixes. Construction: O(n log n) or O(n). LCP array alongside for efficient string operations.

**Manacher's Algorithm**: Finds all palindromic substrings in O(n).
