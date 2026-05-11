# Java Programming — Comprehensive Knowledge Base

## 1. Java Fundamentals

**Java** is a class-based, object-oriented, platform-independent language. "Write Once, Run Anywhere" via JVM (Java Virtual Machine). Strongly typed, compiled to bytecode (.class files), garbage collected.

**JDK vs JRE vs JVM**: JDK (development tools + JRE), JRE (runtime + JVM + libraries), JVM (executes bytecode). JIT (Just-In-Time) compilation optimizes hot code paths.

**Data Types**: Primitives: byte (8-bit), short (16), int (32), long (64), float (32), double (64), char (16-bit Unicode), boolean. Wrapper classes: Integer, Long, Double, etc. Autoboxing/unboxing.

**Variables**: Local (method scope), Instance (object scope), Static/Class (class scope). final keyword — constant.

**Operators**: Arithmetic (+,-,*,/,%), Relational (==,!=,<,>,<=,>=), Logical (&&,||,!), Bitwise (&,|,^,~,<<,>>,>>>), Assignment, Ternary (?:), instanceof.

**Control Flow**: if/else, switch (with pattern matching in Java 17+), for, enhanced for-each, while, do-while, break, continue, labeled break/continue.

**Arrays**: Fixed-size, zero-indexed. int[] arr = new int[10]. Multidimensional: int[][]. Arrays.sort(), Arrays.binarySearch(), Arrays.copyOf(), Arrays.fill(). Array class utility methods.

**Strings**: Immutable (String), Mutable (StringBuilder — not thread-safe, StringBuffer — thread-safe). String pool. Methods: length(), charAt(), substring(), indexOf(), equals(), compareTo(), split(), trim(), replace(), toUpperCase(). String concatenation with + uses StringBuilder internally.

## 2. Object-Oriented Programming

**Four Pillars**: Encapsulation, Inheritance, Polymorphism, Abstraction.

**Classes and Objects**: class keyword. Constructor (same name as class, no return type). this keyword. new keyword for instantiation. Constructors can be overloaded. Constructor chaining: this() and super().

**Encapsulation**: Access modifiers: private (class only), default/package-private (package), protected (package + subclasses), public (everywhere). Getters and setters. Information hiding.

**Inheritance**: extends keyword. Single inheritance only (one parent class). super keyword for parent access. Constructor is NOT inherited — call super() explicitly. IS-A relationship.

**Polymorphism**: Compile-time (method overloading — same name, different parameters). Runtime (method overriding — same signature in parent and child, resolved at runtime via dynamic dispatch). @Override annotation.

**Abstraction**: Abstract classes (abstract keyword — can have abstract and concrete methods, cannot be instantiated). Interfaces (interface keyword — all methods abstract by default, can have default and static methods since Java 8). A class can implement multiple interfaces.

**Interface vs Abstract Class**: Interface — multiple implementation, contract-only (before Java 8), default methods. Abstract class — partial implementation, shared state (instance variables), constructor.

**final keyword**: final class (cannot be extended), final method (cannot be overridden), final variable (constant).

**static keyword**: Belongs to class, not instance. Static methods, static variables (shared across instances), static blocks (class loading), static inner classes.

**Object class methods**: toString(), equals(), hashCode(), clone(), finalize(), getClass(), wait(), notify(), notifyAll(). equals/hashCode contract.

## 3. Collections Framework

**Iterable** → **Collection** → List, Set, Queue. Separate: **Map**.

### List (Ordered, allows duplicates)
- **ArrayList**: Dynamic array. Get O(1), Add O(1) amortized, Insert/Remove O(n). Best for random access.
- **LinkedList**: Doubly linked list. Add/Remove at ends O(1), Get O(n). Also implements Deque.
- **Vector**: Synchronized ArrayList (legacy). Use ArrayList + Collections.synchronizedList() instead.

### Set (No duplicates)
- **HashSet**: Hash table. Add/Remove/Contains O(1). No ordering.
- **LinkedHashSet**: Hash table + linked list. Insertion order preserved.
- **TreeSet**: Red-black tree. Sorted order. Add/Remove/Contains O(log n). Implements NavigableSet.

### Queue/Deque
- **PriorityQueue**: Min-heap. Offer/Poll O(log n), Peek O(1). Natural ordering or Comparator.
- **ArrayDeque**: Resizable array. Faster than LinkedList for stack/queue. Push/Pop O(1).

### Map (Key-Value pairs)
- **HashMap**: Hash table. Get/Put O(1). Allows null key/values. Not synchronized.
- **LinkedHashMap**: Insertion order. Access-order mode for LRU cache.
- **TreeMap**: Red-black tree. Sorted by keys. Get/Put O(log n). NavigableMap.
- **Hashtable**: Synchronized (legacy). Use ConcurrentHashMap instead.
- **ConcurrentHashMap**: Thread-safe, lock-striping. Better concurrency than Hashtable.

**Comparable vs Comparator**: Comparable — natural ordering (compareTo, implements in the class). Comparator — custom ordering (compare, separate class or lambda).

**Collections utility**: sort(), binarySearch(), reverse(), shuffle(), unmodifiableList(), synchronizedList(), frequency(), min(), max().

## 4. Exception Handling

**Hierarchy**: Throwable → Error (unrecoverable — OutOfMemoryError, StackOverflowError) and Exception → Checked (must handle — IOException, SQLException) and Unchecked/Runtime (NullPointerException, ArrayIndexOutOfBoundsException, ArithmeticException).

**try-catch-finally**: try { risky } catch (ExceptionType e) { handle } finally { always runs }. Multi-catch: catch (A | B e). try-with-resources: try (Resource r = new R()) { } — auto-closes AutoCloseable resources.

**Custom Exceptions**: extend Exception (checked) or RuntimeException (unchecked). throw to throw, throws to declare.

## 5. Generics

**Purpose**: Type safety at compile time. Avoid casting. class Box<T> { T value; }. Generic methods: <T> T method(T param).

**Bounded Types**: <T extends Number> (upper bound). <T super Integer> (lower bound — wildcards only). Wildcards: ? (unknown), ? extends T (upper bounded), ? super T (lower bounded).

**PECS**: Producer Extends, Consumer Super. Read from ? extends, write to ? super.

**Type Erasure**: Generic type info removed at runtime. Cannot: new T(), new T[], instanceof T. Bridge methods generated by compiler.

## 6. Multithreading and Concurrency

**Thread Creation**: Extend Thread class (override run()), Implement Runnable (pass to Thread constructor), Implement Callable<V> (returns result, throws exception).

**Thread Lifecycle**: NEW → RUNNABLE → RUNNING → BLOCKED/WAITING/TIMED_WAITING → TERMINATED.

**Synchronization**: synchronized keyword (method or block). Intrinsic lock (monitor). wait(), notify(), notifyAll() — must hold lock. volatile keyword — visibility guarantee, no caching.

**java.util.concurrent**: ExecutorService (thread pool), Future/CompletableFuture, CountDownLatch, CyclicBarrier, Semaphore, ReentrantLock, ReadWriteLock, BlockingQueue, ConcurrentHashMap, AtomicInteger/Long/Reference.

**Thread Pool**: Executors.newFixedThreadPool(n), newCachedThreadPool(), newSingleThreadExecutor(), newScheduledThreadPool(). submit() returns Future.

**CompletableFuture**: Async composition. thenApply, thenAccept, thenCompose, thenCombine, exceptionally, allOf, anyOf.

## 7. Java 8+ Features

**Lambda Expressions**: (params) -> expression or (params) -> { statements }. Functional interfaces: one abstract method. @FunctionalInterface.

**Functional Interfaces**: Predicate<T> (boolean test), Function<T,R> (apply), Consumer<T> (accept), Supplier<T> (get), BiFunction, UnaryOperator, BinaryOperator.

**Stream API**: source.stream().filter().map().reduce()/collect(). Lazy evaluation. Terminal operations: forEach, collect, reduce, count, min, max, findFirst, anyMatch, allMatch. Collectors: toList(), toSet(), toMap(), groupingBy(), joining(), counting(). Parallel streams: parallelStream().

**Optional<T>**: Container for nullable values. of(), ofNullable(), empty(), isPresent(), ifPresent(), orElse(), orElseGet(), orElseThrow(), map(), flatMap().

**Date/Time API** (java.time): LocalDate, LocalTime, LocalDateTime, ZonedDateTime, Instant, Duration, Period. Immutable, thread-safe. DateTimeFormatter.

**Modules** (Java 9): module-info.java. requires, exports, provides, uses. Encapsulation at package level.

**Records** (Java 14+): Immutable data carriers. record Point(int x, int y) {}. Auto-generates constructor, getters, equals, hashCode, toString.

**Sealed Classes** (Java 17): sealed class Shape permits Circle, Rectangle {}. Restricts which classes can extend.

**Pattern Matching**: instanceof (Java 16): if (obj instanceof String s). Switch expressions (Java 14): yield keyword.

## 8. I/O and Serialization

**Byte Streams**: InputStream, OutputStream. FileInputStream, FileOutputStream, BufferedInputStream, BufferedOutputStream.

**Character Streams**: Reader, Writer. FileReader, FileWriter, BufferedReader, BufferedWriter. PrintWriter.

**NIO (New I/O)**: Path, Files, Channels, Buffers. Files.readAllLines(), Files.write(), Files.walk(). Non-blocking I/O with Selectors.

**Serialization**: Serializable interface. ObjectOutputStream.writeObject(), ObjectInputStream.readObject(). transient keyword excludes fields. serialVersionUID for version control.

## 9. JDBC and Database Access

**JDBC (Java Database Connectivity)**: Standard API for relational databases. DriverManager.getConnection(url, user, pass). Statement, PreparedStatement (parameterized — prevents SQL injection), CallableStatement. ResultSet for query results. Connection pooling (HikariCP).

## 10. Design Patterns

**Creational**: Singleton (one instance), Factory Method (subclass decides), Abstract Factory (family of objects), Builder (step-by-step construction), Prototype (clone).

**Structural**: Adapter (interface conversion), Decorator (add behavior), Facade (simplified interface), Proxy (surrogate), Composite (tree structure), Bridge, Flyweight.

**Behavioral**: Observer (publish-subscribe), Strategy (interchangeable algorithms), Command (encapsulate request), Iterator (sequential access), Template Method (algorithm skeleton), State, Chain of Responsibility, Mediator, Visitor.

**SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
