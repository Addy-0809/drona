# Python Programming — Comprehensive Knowledge Base

## 1. Python Fundamentals

**Python** is a high-level, interpreted, dynamically-typed, garbage-collected programming language. Created by Guido van Rossum (1991). Emphasizes readability (significant whitespace). Multi-paradigm: procedural, OOP, functional.

**Data Types**: int (arbitrary precision), float (64-bit IEEE 754), complex, str (immutable Unicode), bool (True/False), NoneType.

**Collections**: list (ordered, mutable, []), tuple (ordered, immutable, ()), dict (key-value, {}), set (unordered, unique, {}), frozenset (immutable set).

**String Operations**: Slicing s[start:stop:step], f-strings f"{var}", methods: split(), join(), strip(), replace(), find(), upper(), lower(), startswith(), endswith(), format(). Strings are immutable.

**Control Flow**: if/elif/else, for (iterates over iterables), while, break, continue, pass. Ternary: x if condition else y.

**List Comprehension**: [expr for x in iterable if condition]. Dict comprehension: {k:v for ...}. Set comprehension: {expr for ...}. Generator expression: (expr for ...).

**Functions**: def name(params): body. Default args, *args (variable positional), **kwargs (variable keyword). Return multiple values (tuple unpacking). Lambda: lambda x: x**2. First-class functions — can be passed as arguments, returned, assigned.

**Scope**: LEGB rule — Local, Enclosing, Global, Built-in. global keyword, nonlocal keyword (for closures).

## 2. Object-Oriented Programming

**Class Definition**: class ClassName: with __init__ constructor. self refers to instance.

**Encapsulation**: Convention: _protected, __private (name mangling → _ClassName__attr). No true private in Python.

**Inheritance**: class Child(Parent). super().__init__() calls parent. Multiple inheritance: class C(A, B). MRO (Method Resolution Order) — C3 linearization algorithm. isinstance(), issubclass().

**Polymorphism**: Duck typing — "if it quacks like a duck." Method overriding. No method overloading (use default args or *args).

**Abstraction**: abc module — ABC (Abstract Base Class), @abstractmethod. Cannot instantiate ABC directly.

**Special (Dunder) Methods**: __init__ (constructor), __str__ (string representation), __repr__ (official representation), __len__, __getitem__, __setitem__, __iter__, __next__, __eq__, __lt__, __add__, __enter__/__exit__ (context manager), __call__.

**Properties**: @property decorator for getters. @name.setter for setters. Computed attributes with validation.

**Class vs Static Methods**: @classmethod receives cls, can modify class state. @staticmethod receives neither self nor cls, utility function.

**Dataclasses** (3.7+): @dataclass decorator auto-generates __init__, __repr__, __eq__. Fields with types and defaults.

## 3. Data Structures in Python

**List**: Dynamic array. Append O(1) amortized, Insert/Delete O(n), Access O(1), Search O(n). list.sort() uses Timsort — O(n log n), stable.

**Dictionary**: Hash table. Get/Set/Delete O(1) average. Ordered (insertion order since 3.7). dict.get(key, default), dict.items(), dict.keys(), dict.values(), dict.update().

**Set**: Hash set. Add/Remove/Lookup O(1). Union (|), Intersection (&), Difference (-), Symmetric Difference (^).

**collections module**: Counter (frequency counting), defaultdict (default factory), OrderedDict, deque (double-ended queue — O(1) append/pop both ends), namedtuple, ChainMap.

**heapq module**: Min-heap operations. heappush, heappop, heapify, nlargest, nsmallest. No max-heap — negate values.

**bisect module**: Binary search on sorted lists. bisect_left, bisect_right, insort.

## 4. File I/O and Exception Handling

**File Operations**: open(filename, mode). Modes: 'r' (read), 'w' (write, truncate), 'a' (append), 'rb'/'wb' (binary). Context manager: with open() as f. Methods: read(), readline(), readlines(), write(), writelines().

**Exception Handling**: try/except/else/finally. Specific exceptions: ValueError, TypeError, KeyError, IndexError, FileNotFoundError, ZeroDivisionError. Custom exceptions: class MyError(Exception). raise to throw. Exception chaining: raise X from Y.

**Assertions**: assert condition, "message". Removed with -O flag. For debugging, not production error handling.

## 5. Iterators, Generators, Decorators

**Iterators**: Objects implementing __iter__() and __next__(). StopIteration signals end. iter() creates iterator from iterable.

**Generators**: Functions using yield. Lazy evaluation — produce values on demand. Memory efficient for large sequences. Generator expressions: (x**2 for x in range(10)).

**yield from**: Delegates to sub-generator. Useful for recursive generators and coroutines.

**Decorators**: Functions that modify other functions. @decorator syntax. Common: @staticmethod, @classmethod, @property, @functools.wraps, @functools.lru_cache. Decorator with arguments: factory pattern returning decorator.

**Context Managers**: with statement. __enter__ and __exit__ methods. Or @contextmanager from contextlib with yield.

## 6. Functional Programming

**map(func, iterable)**: Apply function to each element. Returns iterator. **filter(func, iterable)**: Keep elements where func returns True. **reduce(func, iterable)**: Cumulative application (from functools).

**functools**: partial (partial function application), lru_cache (memoization), wraps (preserve metadata), reduce, total_ordering.

**itertools**: count, cycle, repeat, chain, zip_longest, product, permutations, combinations, groupby, islice, tee, accumulate, starmap.

**operator module**: itemgetter, attrgetter, methodcaller — efficient key functions for sorting.

## 7. Modules and Packages

**Modules**: Single .py file. import module, from module import name, import module as alias. __name__ == "__main__" for script detection.

**Packages**: Directory with __init__.py. Relative imports: from . import sibling, from .. import parent.

**Virtual Environments**: venv module. Isolate project dependencies. python -m venv env, activate, pip install, requirements.txt, pip freeze.

**pip**: Package installer. pip install, pip uninstall, pip list, pip show, pip install -r requirements.txt.

## 8. Concurrency and Parallelism

**Threading**: threading module. GIL (Global Interpreter Lock) limits CPU parallelism. Good for I/O-bound tasks. Thread, Lock, RLock, Semaphore, Event, Condition, Barrier.

**Multiprocessing**: multiprocessing module. True parallelism (separate processes). Process, Pool, Queue, Pipe. Good for CPU-bound tasks.

**asyncio**: Asynchronous I/O. async def, await. Event loop. asyncio.gather(), asyncio.create_task(). Non-blocking I/O. Good for high-concurrency I/O (web servers, API calls).

**concurrent.futures**: ThreadPoolExecutor, ProcessPoolExecutor. submit(), map(), as_completed(). High-level API for thread/process pools.

## 9. Popular Libraries

**NumPy**: N-dimensional arrays (ndarray). Vectorized operations — orders of magnitude faster than lists. Broadcasting, indexing, slicing, reshaping. Linear algebra: dot, matmul, inv, det, eig. Random: np.random.

**Pandas**: DataFrames and Series. Data manipulation: read_csv, head, describe, groupby, merge, join, pivot_table, apply, map, filter, sort_values. Handling missing data: dropna, fillna, isna.

**Matplotlib**: Plotting library. plt.plot, plt.bar, plt.scatter, plt.hist, plt.pie, plt.subplot, plt.figure. Customization: labels, titles, legends, colors, styles.

**Requests**: HTTP library. requests.get, post, put, delete. Response: status_code, json(), text, headers. Sessions, authentication, timeouts.

**Flask/FastAPI**: Web frameworks. Flask: lightweight, @app.route, Jinja2 templates. FastAPI: modern, async, type hints, automatic docs (OpenAPI/Swagger), Pydantic models.

**SQLAlchemy**: ORM and SQL toolkit. Engine, Session, declarative models, relationships, queries.

**pytest**: Testing framework. test_ prefix functions. Fixtures, parametrize, assertions, mocking (unittest.mock).

## 10. Advanced Topics

**Type Hints** (3.5+): def func(x: int) -> str. typing module: List, Dict, Tuple, Optional, Union, Any, Callable, TypeVar, Generic, Protocol.

**Metaclasses**: type is the default metaclass. class Meta(type). __new__ and __init__ for class creation. Used in ORMs, ABCs, validation.

**Descriptors**: Objects implementing __get__, __set__, __delete__. Underlying mechanism for properties, methods, classmethod, staticmethod.

**Memory Management**: Reference counting + cyclic garbage collector. sys.getrefsize(), gc module. __slots__ for memory optimization. Weak references: weakref module.

**Regular Expressions**: re module. re.match, re.search, re.findall, re.sub, re.compile. Patterns: \d, \w, \s, ., *, +, ?, [], (), |, ^, $, {n,m}. Groups, lookahead, lookbehind.
