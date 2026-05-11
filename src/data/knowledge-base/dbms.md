# Database Management Systems — Comprehensive Knowledge Base

## 1. Introduction to DBMS

A **Database Management System (DBMS)** is software that provides an interface for users and applications to define, create, manage, and query databases. It serves as an intermediary between users and the database, ensuring data integrity, security, and efficient access.

**Advantages over File Systems**: Data redundancy control, data consistency, data sharing, data integrity enforcement, data security, backup and recovery, concurrent access control, data independence.

**DBMS Architecture (3-Schema)**:
- **External Schema (View Level)**: Individual user views of the database
- **Conceptual Schema (Logical Level)**: Complete logical structure of the entire database
- **Internal Schema (Physical Level)**: Physical storage structure and access paths

**Data Independence**:
- **Logical Data Independence**: Ability to change conceptual schema without affecting external schemas
- **Physical Data Independence**: Ability to change internal schema without affecting conceptual schema

**Types of DBMS**: Relational (RDBMS — MySQL, PostgreSQL, Oracle), NoSQL (MongoDB, Cassandra), Object-Oriented (db4o), Graph (Neo4j), Document-based, Key-Value stores, Column-family stores.

## 2. Entity-Relationship (ER) Model

The **ER Model** is a high-level conceptual data model used to design database schemas visually before implementation.

**Components**:
- **Entity**: A real-world object or concept (represented as rectangle). Example: Student, Course
- **Attribute**: Property of an entity (represented as oval). Types:
  - Simple vs Composite (can be divided into sub-attributes)
  - Single-valued vs Multi-valued (can have multiple values)
  - Stored vs Derived (computed from other attributes)
  - Key attribute (uniquely identifies entity — underlined)
- **Relationship**: Association between entities (represented as diamond). Types:
  - **One-to-One (1:1)**: One entity in A relates to at most one in B
  - **One-to-Many (1:N)**: One entity in A relates to many in B
  - **Many-to-Many (M:N)**: Many in A relate to many in B

**Participation Constraints**:
- **Total Participation**: Every entity must participate (double line)
- **Partial Participation**: Participation is optional (single line)

**Weak Entity**: Cannot be uniquely identified by its own attributes alone. Depends on a strong (owner) entity via an identifying relationship. Has a partial key (discriminator).

**Generalization**: Bottom-up approach — combining entities with common attributes into a higher-level entity. Example: Undergraduate + Graduate → Student.

**Specialization**: Top-down approach — creating sub-entities from a higher-level entity based on distinguishing features.

**ER to Relational Mapping Rules**:
1. Each strong entity → table with all simple attributes
2. Each weak entity → table with its attributes + primary key of owner
3. Each 1:N relationship → foreign key on the N-side table
4. Each M:N relationship → new junction/bridge table
5. Each 1:1 relationship → foreign key on either side (prefer total participation side)
6. Multi-valued attribute → separate table

## 3. Relational Model

The **relational model** represents data as a collection of relations (tables). Each relation has a schema (structure) and instances (rows/tuples).

**Terminology**: Relation = Table, Tuple = Row, Attribute = Column, Domain = set of allowed values, Degree = number of attributes, Cardinality = number of tuples.

**Keys**:
- **Super Key**: Any set of attributes that uniquely identifies a tuple
- **Candidate Key**: Minimal super key (no proper subset is a super key)
- **Primary Key**: Chosen candidate key to uniquely identify tuples
- **Alternate Key**: Candidate keys not chosen as primary key
- **Foreign Key**: Attribute that references the primary key of another relation
- **Composite Key**: Primary key composed of multiple attributes

**Integrity Constraints**:
- **Domain Constraint**: Attribute values must belong to the defined domain
- **Entity Integrity**: Primary key cannot be NULL
- **Referential Integrity**: Foreign key must reference an existing primary key or be NULL
- **Key Constraint**: No two tuples can have the same primary key value

## 4. Relational Algebra

**Relational Algebra** is a procedural query language that operates on relations and produces relations as output.

**Basic Operations**:
- **Selection (σ)**: Selects tuples satisfying a condition. σ_condition(R). Unary. Example: σ_age>20(Student)
- **Projection (π)**: Selects specific columns, removes duplicates. π_attributes(R). Example: π_name,age(Student)
- **Union (∪)**: Combines tuples from two union-compatible relations. R ∪ S.
- **Set Difference (−)**: Tuples in R but not in S. R − S.
- **Cartesian Product (×)**: Combines every tuple in R with every tuple in S. |R × S| = |R| × |S|.
- **Rename (ρ)**: Renames a relation or its attributes.

**Derived Operations**:
- **Natural Join (⋈)**: Combines tuples with matching values on common attributes. Equijoin + projection to remove duplicate columns.
- **Theta Join**: Join with arbitrary condition. R ⋈_θ S = σ_θ(R × S).
- **Equijoin**: Theta join where condition uses equality.
- **Left/Right/Full Outer Join**: Preserves all tuples from left/right/both relations, filling NULLs for non-matching.
- **Semijoin**: Returns tuples from R that have a match in S.
- **Division (÷)**: R ÷ S returns tuples in R associated with ALL tuples in S. Used for "for all" queries.
- **Intersection (∩)**: R ∩ S = R − (R − S).

## 5. SQL (Structured Query Language)

### DDL (Data Definition Language)
- **CREATE TABLE**: Define table structure, data types, constraints
- **ALTER TABLE**: Add/modify/drop columns, add constraints
- **DROP TABLE**: Remove table and its data
- **TRUNCATE**: Remove all rows (faster than DELETE, no rollback)

### DML (Data Manipulation Language)
- **SELECT**: Query data. SELECT columns FROM table WHERE condition GROUP BY cols HAVING condition ORDER BY cols LIMIT n
- **INSERT INTO**: Add new rows
- **UPDATE**: Modify existing rows. UPDATE table SET col=val WHERE condition
- **DELETE FROM**: Remove rows matching condition

### DCL (Data Control Language)
- **GRANT**: Give privileges to users
- **REVOKE**: Remove privileges from users

### TCL (Transaction Control Language)
- **COMMIT**: Permanently save changes
- **ROLLBACK**: Undo changes since last commit
- **SAVEPOINT**: Create a point within a transaction to roll back to

### SQL Joins
- **INNER JOIN**: Returns matching rows from both tables
- **LEFT JOIN**: All rows from left table + matching from right (NULL if no match)
- **RIGHT JOIN**: All rows from right table + matching from left
- **FULL OUTER JOIN**: All rows from both tables, NULLs where no match
- **CROSS JOIN**: Cartesian product
- **SELF JOIN**: Table joined with itself

### Aggregate Functions
COUNT(), SUM(), AVG(), MIN(), MAX(). Used with GROUP BY to compute per-group aggregates. HAVING filters groups after aggregation (WHERE filters before).

### Subqueries
- **Scalar subquery**: Returns single value
- **Row subquery**: Returns single row
- **Table subquery**: Returns a table (used with IN, EXISTS, ANY, ALL)
- **Correlated subquery**: References outer query — executed once per outer row

### Views
A **view** is a virtual table defined by a query. Does not store data physically. Can simplify complex queries, provide security (restrict visible columns/rows).

**Materialized View**: Physically stored result of a view query. Must be refreshed when base tables change. Faster queries but stale data risk.

## 6. Normalization

**Normalization** is the process of organizing a database to reduce redundancy and prevent anomalies (insertion, update, deletion anomalies).

**Functional Dependency (FD)**: X → Y means if two tuples have the same X value, they must have the same Y value.

### Normal Forms

**1NF (First Normal Form)**: All attribute values are atomic (no repeating groups, no multi-valued attributes). Each cell contains a single value.

**2NF (Second Normal Form)**: 1NF + no partial dependency. Every non-key attribute is fully functionally dependent on the entire primary key (relevant when PK is composite).

**3NF (Third Normal Form)**: 2NF + no transitive dependency. For every FD X → Y, either X is a superkey or Y is part of a candidate key. Informally: every non-key attribute depends on "the key, the whole key, and nothing but the key."

**BCNF (Boyce-Codd Normal Form)**: For every FD X → Y, X must be a superkey. Stricter than 3NF — eliminates all redundancy from FDs.

**4NF**: BCNF + no multi-valued dependencies (MVD). X →→ Y means X determines a set of Y values independently.

**5NF (PJNF)**: No join dependencies that are not implied by candidate keys. Decomposition cannot be further losslessly decomposed.

**Decomposition Properties**:
- **Lossless Join**: Original relation can be reconstructed by joining decomposed relations (no spurious tuples)
- **Dependency Preservation**: All functional dependencies can be checked within individual decomposed relations

### Armstrong's Axioms
1. **Reflexivity**: If Y ⊆ X, then X → Y
2. **Augmentation**: If X → Y, then XZ → YZ
3. **Transitivity**: If X → Y and Y → Z, then X → Z
- Derived: Union, Decomposition, Pseudo-transitivity

**Closure of Attributes (X⁺)**: Set of all attributes functionally determined by X. Used to find candidate keys and check if a decomposition is lossless.

**Canonical Cover (Minimal Cover)**: Equivalent set of FDs with: single attribute on RHS, no extraneous attributes, no redundant FDs.

## 7. Transactions and Concurrency Control

A **transaction** is a logical unit of work consisting of one or more database operations that must execute atomically.

### ACID Properties
- **Atomicity**: Transaction executes completely or not at all (all-or-nothing)
- **Consistency**: Transaction takes DB from one consistent state to another
- **Isolation**: Concurrent transactions don't interfere with each other
- **Durability**: Once committed, changes survive system failures

### Transaction States
Active → Partially Committed → Committed (success) or Active → Failed → Aborted (rolled back)

### Schedule
A **schedule** is a sequence of operations from multiple transactions.
- **Serial Schedule**: Transactions execute one after another, no interleaving. Always correct but slow.
- **Serializable Schedule**: Non-serial schedule that produces the same result as some serial schedule.

### Conflict Serializability
Two operations **conflict** if they: (1) belong to different transactions, (2) access the same data item, (3) at least one is a write.

A schedule is **conflict serializable** if it can be transformed into a serial schedule by swapping non-conflicting operations. Tested using a **precedence graph** — if acyclic, schedule is conflict serializable.

### Concurrency Control Protocols

**Lock-Based**:
- **Shared Lock (S)**: For reading — multiple transactions can hold
- **Exclusive Lock (X)**: For writing — only one transaction can hold
- **Two-Phase Locking (2PL)**: Growing phase (acquire locks), Shrinking phase (release locks). Guarantees conflict serializability.
  - **Strict 2PL**: Hold all exclusive locks until commit/abort. Prevents cascading rollbacks.
  - **Rigorous 2PL**: Hold ALL locks until commit/abort.

**Timestamp-Based**: Each transaction gets a timestamp. Operations ordered by timestamp. Read/Write timestamps maintained per data item. Thomas Write Rule optimizes by ignoring obsolete writes.

**MVCC (Multi-Version Concurrency Control)**: Maintain multiple versions of data items. Readers don't block writers, writers don't block readers. Used by PostgreSQL, MySQL InnoDB, Oracle.

### Deadlock
**Deadlock**: Two or more transactions each waiting for a lock held by the other.

**Prevention**: Wait-Die (older waits, younger dies), Wound-Wait (older wounds/kills younger, younger waits). Based on timestamps.

**Detection**: Wait-for graph — if cycle exists, deadlock detected. Victim selection and rollback.

**Isolation Levels** (SQL Standard):
1. **Read Uncommitted**: Dirty reads possible
2. **Read Committed**: No dirty reads (only committed data visible)
3. **Repeatable Read**: No dirty or non-repeatable reads
4. **Serializable**: Full isolation, no anomalies

**Anomalies**: Dirty Read (reading uncommitted data), Non-Repeatable Read (same query returns different results), Phantom Read (new rows appear between queries).

## 8. Indexing

**Index**: Data structure that speeds up data retrieval at the cost of extra storage and write overhead.

**Types**:
- **Primary Index**: On the ordering key field of a sorted file. Dense (one entry per record) or Sparse (one entry per block).
- **Clustered Index**: On a non-key ordering field. One per table.
- **Secondary Index**: On any non-ordering field. Always dense.
- **Multilevel Index**: Index on index — reduces search to O(log_m n) where m = blocking factor of index.

**B+ Tree Index**: Most common in RDBMS. Balanced, all data in leaves, internal nodes for routing. Fan-out = number of pointers per node. Height = O(log_m n). Supports range queries efficiently.

**Hash Index**: Uses hash function for direct access. Best for equality queries. Not suitable for range queries.

**Bitmap Index**: Used for low-cardinality columns (e.g., gender, status). Each distinct value gets a bitmap. Efficient for AND/OR queries via bitwise operations. Common in data warehouses.

## 9. Query Processing and Optimization

**Query Processing Steps**: Parsing → Validation → Optimization → Execution.

**Query Optimization**: Transforms a query into an efficient execution plan.

**Cost Estimation**: Based on disk I/O (block transfers + seeks), CPU cost, memory usage, network cost (distributed DB).

**Equivalence Rules**: Selection pushdown, projection pushdown, join commutativity, join associativity, cascade of selections/projections.

**Join Algorithms**:
- **Nested Loop Join**: For each tuple in R, scan entire S. O(n_r × n_s). Simple but slow.
- **Block Nested Loop Join**: For each block of R, scan S. O(b_r × b_s / M + b_r). Better I/O.
- **Sort-Merge Join**: Sort both relations, merge. O(n log n). Efficient for sorted data.
- **Hash Join**: Hash smaller relation, probe with larger. O(n_r + n_s). Best for equijoins.
- **Index Nested Loop Join**: Use index on join column. O(n_r × log n_s) if B+ tree index exists.

## 10. Recovery System

**Log-Based Recovery**: Transaction log (journal) records all modifications.
- **Write-Ahead Logging (WAL)**: Log record must be written before the corresponding data page is written to disk.
- **ARIES (Algorithm for Recovery and Isolation Exploiting Semantics)**: Industry standard. Three phases: Analysis (determine dirty pages and active transactions), Redo (repeat history), Undo (rollback incomplete transactions).

**Checkpoint**: Point at which all dirty pages are flushed to disk and a checkpoint record is written to the log. Limits the amount of log to process during recovery.

**Shadow Paging**: Maintain two page tables — current and shadow. On commit, current becomes shadow. Simple but limits concurrency.

## 11. NoSQL Databases

**CAP Theorem (Brewer's Theorem)**: A distributed system can guarantee at most two of: Consistency (all nodes see same data), Availability (every request gets a response), Partition Tolerance (system works despite network partitions). RDBMS choose CA, most NoSQL choose AP or CP.

**Types**:
- **Key-Value Stores**: Redis, DynamoDB. Simple get/put by key. Fast, scalable.
- **Document Stores**: MongoDB, CouchDB. Store JSON/BSON documents. Flexible schema.
- **Column-Family Stores**: Cassandra, HBase. Store data by column families. Good for write-heavy workloads.
- **Graph Databases**: Neo4j, ArangoDB. Store nodes and relationships. Efficient for traversal queries.

**BASE Properties** (vs ACID): Basically Available, Soft State, Eventual Consistency.

## 12. Distributed Databases

**Fragmentation**: Horizontal (row-based partition), Vertical (column-based partition), Mixed.

**Replication**: Synchronous (all replicas updated before commit) vs Asynchronous (primary commits, replicas update later).

**Two-Phase Commit (2PC)**: Distributed transaction protocol. Phase 1: Coordinator sends PREPARE, participants vote YES/NO. Phase 2: If all YES → COMMIT; if any NO → ABORT.

**Sharding**: Distributing data across multiple servers based on a shard key. Hash-based or range-based partitioning.
