# Operating Systems — Comprehensive Knowledge Base

## 1. Introduction to Operating Systems

An **Operating System (OS)** is system software that manages hardware resources and provides services for application software. It acts as an intermediary between users and computer hardware.

**Functions**: Process management, memory management, file system management, I/O management, security and protection, networking, user interface.

**Types**: Batch OS, Time-Sharing OS (multitasking), Distributed OS, Real-Time OS (RTOS — hard real-time and soft real-time), Embedded OS, Mobile OS.

**OS Structure**: Monolithic (Linux — entire OS in kernel space), Microkernel (Minix, QNX — minimal kernel, services in user space), Hybrid (Windows NT, macOS — mix), Layered (THE OS — concentric layers), Exokernel (minimal abstraction, apps manage resources directly).

**System Calls**: Interface between user programs and OS kernel. Categories: Process control (fork, exec, wait, exit), File management (open, read, write, close), Device management (ioctl, read, write), Information maintenance (getpid, alarm, sleep), Communication (pipe, shmget, mmap, socket).

**Dual Mode Operation**: CPU operates in User Mode (restricted instructions) and Kernel Mode (privileged instructions). Mode bit: 0 = kernel, 1 = user. System calls trigger mode switch via trap/interrupt.

## 2. Process Management

A **process** is a program in execution with its own address space, program counter, registers, and stack.

**Process States**: New → Ready → Running → Waiting (Blocked) → Terminated. Transitions: admit (New→Ready), dispatch (Ready→Running), interrupt/preempt (Running→Ready), I/O or event wait (Running→Waiting), I/O or event completion (Waiting→Ready), exit (Running→Terminated).

**Process Control Block (PCB)**: Data structure storing: Process ID (PID), process state, program counter, CPU registers, memory management info, I/O status, scheduling info, accounting info.

**Context Switch**: Saving the state (PCB) of the current process and loading the state of the next process. Overhead includes saving/restoring registers, flushing TLB, cache pollution. Typical cost: 1-10 microseconds.

**Process Creation**: fork() creates a child process (copy of parent). exec() replaces the process image with a new program. In Linux, fork() uses Copy-on-Write (COW) — pages shared until one process writes.

**Threads**: Lightweight processes sharing the same address space. Thread has its own: stack, program counter, registers. Shares with other threads in the same process: code, data, heap, open files.

**User-Level Threads vs Kernel-Level Threads**: User-level managed by user library (fast context switch, but can't exploit multicore), Kernel-level managed by OS (slower switch, true parallelism).

**Multithreading Models**: Many-to-One (many user threads → one kernel thread), One-to-One (each user thread → kernel thread, used in Linux), Many-to-Many (M user threads → N kernel threads).

## 3. CPU Scheduling

**CPU Scheduler** selects a process from the ready queue to execute on the CPU.

**Scheduling Criteria**: CPU utilization (maximize), throughput (maximize), turnaround time (minimize), waiting time (minimize), response time (minimize).

**Preemptive vs Non-Preemptive**: Preemptive — OS can interrupt a running process. Non-preemptive — process runs until it voluntarily yields or terminates.

### Scheduling Algorithms

**FCFS (First-Come, First-Served)**: Non-preemptive. Simple FIFO queue. Problem: Convoy effect — short processes wait behind long ones. Average waiting time can be high.

**SJF (Shortest Job First)**: Optimal for minimizing average waiting time. Non-preemptive version: select shortest burst time. Preemptive version (SRTF — Shortest Remaining Time First): preempt if new process has shorter remaining burst.

**Priority Scheduling**: Each process assigned a priority. Highest priority runs first. Problem: Starvation of low-priority processes. Solution: **Aging** — gradually increase priority of waiting processes.

**Round Robin (RR)**: Preemptive FCFS with time quantum q. Each process gets at most q time units. If not done, moved to end of ready queue. If q is very large → FCFS. If q is very small → excessive context switches. Typical q: 10-100ms.

**Multilevel Queue Scheduling**: Multiple queues with different priorities and scheduling algorithms. Example: Foreground (interactive, RR), Background (batch, FCFS). Fixed priority between queues.

**Multilevel Feedback Queue Scheduling (MLFQ)**: Processes can move between queues based on behavior. CPU-bound processes sink to lower priority; I/O-bound processes rise. Most flexible scheduler. Used in modern OS.

**Scheduling Metrics**:
- **Turnaround Time** = Completion Time - Arrival Time
- **Waiting Time** = Turnaround Time - Burst Time
- **Response Time** = First Run Time - Arrival Time
- **Throughput** = Number of processes completed / Time

**Gantt Chart**: Visual timeline showing which process runs at each time unit. Used to calculate scheduling metrics.

## 4. Process Synchronization

**Race Condition**: When multiple processes/threads access shared data concurrently and the outcome depends on the execution order.

**Critical Section Problem**: Ensure that when one process is executing in its critical section, no other process can execute in its critical section.

**Requirements for Solution**:
1. **Mutual Exclusion**: Only one process in CS at a time
2. **Progress**: If no process is in CS, a waiting process can enter
3. **Bounded Waiting**: Limit on how many times other processes can enter CS before a waiting process

### Synchronization Mechanisms

**Peterson's Solution**: Software solution for 2 processes using shared variables (flag[] and turn). Satisfies all three requirements. Only works for 2 processes without hardware support.

**Hardware Solutions**: Test-and-Set (TAS), Compare-and-Swap (CAS) — atomic instructions. Used to build locks.

**Mutex Lock**: Binary lock. acquire() before CS, release() after CS. Busy waiting (spinlock) or blocking.

**Semaphore**: Integer variable accessed via atomic wait(S)/P(S) and signal(S)/V(S) operations.
- **Binary Semaphore (Mutex)**: Value 0 or 1. Mutual exclusion.
- **Counting Semaphore**: Value ≥ 0. Controls access to a resource with finite instances.

**Monitor**: High-level synchronization construct. Only one process can be active inside the monitor at a time. Uses condition variables (wait and signal) for synchronization.

### Classic Problems

**Producer-Consumer (Bounded Buffer)**: Producer adds items to buffer, Consumer removes. Semaphores: mutex (1), empty (N), full (0). Producer: wait(empty), wait(mutex), produce, signal(mutex), signal(full). Consumer: wait(full), wait(mutex), consume, signal(mutex), signal(empty).

**Readers-Writers Problem**: Multiple readers can read simultaneously, but writers need exclusive access. First variant: readers priority (writers may starve). Second variant: writers priority (readers may starve). Solution using semaphores or read-write locks.

**Dining Philosophers Problem**: 5 philosophers, 5 forks. Each needs 2 forks to eat. Solutions: pick up both or none, odd/even ordering, limit to N-1 simultaneous philosophers, use a monitor.

## 5. Deadlock

**Deadlock**: A set of processes where each is waiting for a resource held by another process in the set, forming a circular wait.

**Necessary Conditions** (all four must hold simultaneously):
1. **Mutual Exclusion**: At least one resource is non-shareable
2. **Hold and Wait**: A process holds at least one resource while waiting for others
3. **No Preemption**: Resources cannot be forcibly taken from a process
4. **Circular Wait**: Circular chain of processes, each waiting for a resource held by the next

**Resource Allocation Graph (RAG)**: Directed graph with process nodes and resource nodes. Request edge: P → R, Assignment edge: R → P. If cycle exists and each resource has single instance → deadlock. If multiple instances, cycle is necessary but not sufficient.

**Deadlock Prevention**: Negate at least one necessary condition. No hold-and-wait (request all resources at once). Allow preemption. Impose total ordering on resource types (circular wait prevention).

**Deadlock Avoidance**: **Banker's Algorithm** — before granting a request, check if resulting state is safe (a sequence exists where all processes can finish). Maintains Available, Max, Allocation, Need matrices. Need = Max - Allocation. Safe state: exists a safe sequence.

**Deadlock Detection**: Periodically check for cycles using wait-for graph (single instance) or detection algorithm similar to Banker's (multiple instances).

**Deadlock Recovery**: Process termination (abort all deadlocked or one at a time), Resource preemption (select victim, rollback, avoid starvation).

## 6. Memory Management

**Logical vs Physical Address**: Logical (virtual) address generated by CPU, Physical address seen by memory. Memory Management Unit (MMU) translates logical to physical using base register or page table.

**Address Binding**: Compile-time (absolute code), Load-time (relocatable code), Execution-time (requires hardware support, most flexible).

### Contiguous Allocation

**Fixed Partitioning**: Memory divided into fixed-size partitions. Internal fragmentation — wasted space within partition.

**Variable Partitioning**: Partitions created dynamically. External fragmentation — enough total memory but not contiguous. Compaction can solve but is expensive.

**Allocation Strategies**: First Fit (first hole that fits — fast), Best Fit (smallest sufficient hole — minimal waste, slow), Worst Fit (largest hole — leaves large remainder), Next Fit (like first fit but starts from last allocation point).

### Paging

**Paging** divides logical memory into fixed-size **pages** and physical memory into same-size **frames**. Page table maps page numbers to frame numbers. Eliminates external fragmentation.

**Page Table Entry (PTE)**: Frame number, valid/invalid bit, protection bits (read/write/execute), dirty bit (modified), reference bit (accessed).

**Translation**: Logical address = (page number, offset). Physical address = (frame number, offset). Page number indexes into page table to get frame number.

**Page Table Implementation**:
- **Single-level**: Direct array. Problem: table size for large address spaces.
- **Two-level (Hierarchical)**: Page table of page tables. Outer table indexes inner table.
- **Inverted Page Table**: One entry per physical frame. Searched by (PID, page number). Saves space but slow search. Used with hashing.
- **Hashed Page Table**: Hash function maps page number to page table entry. Good for large sparse address spaces.

**Translation Lookaside Buffer (TLB)**: Hardware cache of recent page table entries. TLB hit: no memory access needed for translation. TLB miss: access page table in memory. Effective access time = hit_ratio × (TLB_time + mem_time) + (1 - hit_ratio) × (TLB_time + 2 × mem_time).

### Segmentation

**Segmentation** divides logical address space into variable-size segments (code, data, stack, heap). Segment table: (base, limit) for each segment. Logical address = (segment number, offset). Supports sharing and protection at logical level.

**Segmented Paging**: Combines segmentation and paging. Each segment is divided into pages. Used in Intel x86 architecture.

## 7. Virtual Memory

**Virtual Memory** allows execution of processes not completely in memory. Uses demand paging — pages loaded only when needed.

**Demand Paging**: Pages brought into memory only when accessed. If page not in memory → **page fault**: trap to OS, find page on disk, load into free frame, update page table, restart instruction.

**Page Replacement Algorithms** (when no free frames available):

**FIFO**: Replace the oldest page. Simple but suffers from Belady's Anomaly (more frames can cause more faults).

**Optimal (OPT/MIN)**: Replace page that won't be used for longest time in future. Best possible but requires future knowledge — used as benchmark.

**LRU (Least Recently Used)**: Replace page not used for longest time in the past. Approximates OPT. Implementation: counter-based, stack-based. No Belady's anomaly (stack algorithm).

**LRU Approximation**: Clock algorithm (Second Chance) — circular queue with reference bits. On replacement, if reference bit = 1, give second chance (set to 0, advance pointer); if 0, replace.

**Enhanced Second Chance**: Uses (reference bit, dirty bit) pair. Priority: (0,0) > (0,1) > (1,0) > (1,1). Clean unreferenced pages replaced first.

**Thrashing**: When a process spends more time paging than executing. Occurs when working set exceeds available frames. Solution: Working Set Model — track the set of pages referenced in the last Δ time units. Allocate enough frames for each process's working set.

**Page Fault Rate**: f = number of page faults / number of references. Effective access time = (1-f) × memory_access + f × (page_fault_service_time).

**Copy-on-Write (COW)**: Parent and child share pages after fork(). Pages duplicated only when one process writes (page marked read-only, write triggers copy).

**Memory-Mapped Files**: Map file directly into virtual address space. Read/write operations become memory accesses. Efficient for random access and shared memory IPC.

## 8. File Systems

**File**: Named collection of related information stored on secondary storage. Attributes: name, type, location, size, protection, timestamps.

**File Operations**: Create, open, close, read, write, seek (reposition pointer), delete, truncate.

**File Access Methods**: Sequential (read/write in order), Direct/Random (access any block directly by position), Indexed (index structure for fast lookup).

**Directory Structure**: Single-level (one directory for all files), Two-level (per-user directories), Tree-structured (hierarchical), Acyclic graph (shared subdirectories via links), General graph (cycles possible — need garbage collection).

### File Allocation Methods

**Contiguous Allocation**: File stored in contiguous blocks. Fast sequential and random access. Problem: external fragmentation, need to know file size at creation.

**Linked Allocation**: Each block has pointer to next block. No external fragmentation. Slow random access O(n). Problem: pointer overhead, reliability (one bad pointer loses rest of file). FAT (File Allocation Table) improves by caching pointers in a table.

**Indexed Allocation**: Index block contains pointers to all data blocks. Fast random access. Overhead of index block. Multi-level indexing for large files.

**Unix Inode Structure**: 12 direct pointers, 1 single indirect (pointer to block of pointers), 1 double indirect, 1 triple indirect. Supports files up to TBs.

### Disk Scheduling Algorithms

**FCFS**: Service requests in arrival order. Simple but inefficient (long seek times).

**SSTF (Shortest Seek Time First)**: Service nearest request. Like SJF. Problem: starvation of distant requests.

**SCAN (Elevator)**: Arm moves in one direction servicing requests, reverses at end. Fair, no starvation.

**C-SCAN (Circular SCAN)**: Like SCAN but only services in one direction, jumps back to beginning at end. More uniform wait time.

**LOOK/C-LOOK**: Like SCAN/C-SCAN but reverses at last request in direction, not at disk end. More efficient.

## 9. I/O Management

**I/O Techniques**: Programmed I/O (CPU polls device — busy waiting), Interrupt-Driven I/O (device interrupts CPU when ready — CPU free between interrupts), DMA (Direct Memory Access — hardware controller transfers data directly to/from memory without CPU).

**Device Drivers**: Software modules that interface between OS and hardware devices. Provide uniform interface to kernel.

**Buffering**: Single buffering (one buffer), Double buffering (two buffers — one for I/O, one for processing), Circular buffering (ring of buffers).

**Spooling**: Simultaneous Peripheral Operations On-Line. Output placed in buffer (spool) for device processing later. Example: print spooling — jobs queued and printed in order.

## 10. Security and Protection

**Protection**: Internal mechanism controlling access to resources by processes and users. **Security**: Defense against external attacks.

**Access Control**: Access Control List (ACL — per resource, lists users/permissions), Capability List (per user, lists resources/permissions).

**Access Matrix**: Matrix with subjects (users/processes) as rows and objects (files/resources) as columns. Each cell contains allowed operations.

**Authentication**: Password-based, biometric, multi-factor, certificates.

**Threats**: Viruses, worms, Trojan horses, ransomware, rootkits, buffer overflow attacks, privilege escalation.
