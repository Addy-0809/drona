# Web Programming — Comprehensive Knowledge Base

## 1. HTML (HyperText Markup Language)

**HTML5** is the standard markup language for creating web pages. It defines the structure and semantics of web content.

**Document Structure**: `<!DOCTYPE html>`, `<html>`, `<head>` (metadata, title, links, scripts), `<body>` (visible content).

**Semantic Elements**: `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`, `<figure>`, `<figcaption>`, `<time>`, `<mark>`, `<details>`, `<summary>`. These convey meaning to browsers and search engines (SEO benefits, accessibility).

**Forms and Input**: `<form action="" method="POST">`, Input types: text, password, email, number, date, range, color, file, checkbox, radio, submit. Attributes: required, placeholder, pattern, min/max, autocomplete. `<select>`, `<textarea>`, `<datalist>`.

**Media**: `<img>` (src, alt, srcset for responsive), `<video>` (controls, autoplay, loop), `<audio>`, `<canvas>` (2D drawing API), `<svg>` (scalable vector graphics).

**Storage APIs**: localStorage (persistent, ~5MB), sessionStorage (tab lifetime), IndexedDB (large structured data), Cookies (small, sent with requests).

**Web APIs**: Geolocation, Notifications, Web Workers (background threads), Service Workers (offline/caching), Fetch API, WebSocket, Drag and Drop, History API, Intersection Observer.

## 2. CSS (Cascading Style Sheets)

**Selectors**: Element (`div`), Class (`.class`), ID (`#id`), Attribute (`[type="text"]`), Pseudo-class (`:hover`, `:nth-child()`, `:focus`, `:first-child`), Pseudo-element (`::before`, `::after`, `::placeholder`), Combinators (descendant ` `, child `>`, adjacent `+`, general sibling `~`).

**Specificity**: Inline (1000) > ID (100) > Class/Attribute/Pseudo-class (10) > Element/Pseudo-element (1). `!important` overrides all.

**Box Model**: Content → Padding → Border → Margin. `box-sizing: border-box` includes padding and border in width/height.

**Display**: `block` (full width, new line), `inline` (no width/height), `inline-block` (inline with dimensions), `none` (removed), `flex`, `grid`.

### Flexbox
Container: `display: flex`. Properties: `flex-direction` (row/column), `justify-content` (main axis — flex-start, center, space-between, space-around, space-evenly), `align-items` (cross axis — stretch, center, flex-start, flex-end, baseline), `flex-wrap`, `gap`.
Items: `flex` (shorthand for grow/shrink/basis), `order`, `align-self`.

### CSS Grid
Container: `display: grid`. `grid-template-columns`, `grid-template-rows` (fr units, repeat(), minmax()), `gap`, `grid-template-areas`.
Items: `grid-column` (start/end), `grid-row`, `grid-area`.

**Positioning**: `static` (default), `relative` (offset from normal position), `absolute` (relative to nearest positioned ancestor), `fixed` (relative to viewport), `sticky` (switches between relative and fixed).

**Responsive Design**: Media queries `@media (max-width: 768px)`. Mobile-first approach. Breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px). Fluid typography: `clamp()`. Container queries.

**CSS Variables (Custom Properties)**: `--primary: #6366f1;` declared in `:root`, used as `var(--primary)`.

**Animations**: `@keyframes` for complex animations. `transition` for simple state changes. Properties: duration, timing-function (ease, linear, cubic-bezier), delay. `transform`: translate, rotate, scale, skew. Hardware-accelerated via GPU.

## 3. JavaScript

**Data Types**: Primitives: string, number, bigint, boolean, undefined, null, symbol. Reference: object, array, function.

**Variable Declaration**: `var` (function-scoped, hoisted), `let` (block-scoped), `const` (block-scoped, immutable binding).

**Functions**: Function declaration (hoisted), function expression, arrow functions (`=>`), IIFE, generators (`function*`), async functions.

**Closures**: A function retains access to its outer (lexical) scope even after the outer function has returned. Used for data privacy, factories, memoization.

**Prototypes and Inheritance**: Every object has a prototype chain. `Object.create()`, constructor functions, ES6 classes (syntactic sugar over prototypes). `class`, `extends`, `super`, `static`.

**this Keyword**: Refers to the execution context. In methods: the object. In functions: global/undefined (strict). Arrow functions: lexical this (from enclosing scope). `bind()`, `call()`, `apply()` to set explicitly.

**Promises and Async/Await**: Promise states: pending → fulfilled/rejected. `.then()`, `.catch()`, `.finally()`. `Promise.all()` (all must resolve), `Promise.race()` (first to settle), `Promise.allSettled()`. `async/await` is syntactic sugar over promises — `await` pauses execution until promise settles.

**Event Loop**: Call Stack → Web APIs → Callback Queue (macrotasks: setTimeout, I/O) → Microtask Queue (Promises, MutationObserver) → Render. Microtasks always run before macrotasks.

**DOM Manipulation**: `document.getElementById()`, `querySelector()`, `querySelectorAll()`, `createElement()`, `appendChild()`, `innerHTML`, `textContent`, `classList`, `addEventListener()`, Event delegation, Event bubbling/capturing.

**ES6+ Features**: Destructuring, spread/rest operators, template literals, Map/Set/WeakMap/WeakSet, for...of, optional chaining (?.), nullish coalescing (??), modules (import/export), Proxy/Reflect.

**Error Handling**: try/catch/finally. Custom errors extending Error class. Unhandled rejection detection.

## 4. React

**Component-Based Architecture**: UI built from reusable components. Functional components (with hooks) preferred over class components.

**JSX**: JavaScript XML — syntax extension allowing HTML-like code in JavaScript. Compiled to React.createElement() calls.

**Hooks**: `useState` (state management), `useEffect` (side effects — replaces lifecycle methods), `useContext` (context consumption), `useReducer` (complex state logic), `useMemo` (memoize values), `useCallback` (memoize functions), `useRef` (mutable reference/DOM access), `useId` (unique IDs).

**State Management**: Component state (useState), Context API (global state without prop drilling), External libraries: Redux (action → reducer → store → view), Zustand (minimal store), Jotai (atomic state).

**React Router**: Client-side routing. `<BrowserRouter>`, `<Routes>`, `<Route>`, `<Link>`, `useNavigate()`, `useParams()`, `useSearchParams()`, dynamic routes, nested routes, lazy loading with `React.lazy()` and `Suspense`.

**Performance**: React.memo (prevent re-renders), useMemo, useCallback, code splitting, virtualization (react-window), key prop for lists (reconciliation algorithm).

**Server Components** (React 18+): Components that render on the server. No client-side JavaScript. Can directly access databases, file system. 'use client' directive for client components.

## 5. Node.js

**Node.js**: JavaScript runtime built on Chrome's V8 engine. Event-driven, non-blocking I/O.

**Event Loop**: libuv-based. Phases: Timers → Pending Callbacks → Idle → Poll → Check → Close Callbacks. process.nextTick() runs before next phase.

**Modules**: CommonJS (`require/module.exports`) and ES Modules (`import/export`). Built-in modules: fs, path, http, crypto, os, stream, buffer, events.

**npm**: Node Package Manager. package.json defines dependencies. Semantic versioning (major.minor.patch). npm install, npm run, npm init.

**Express.js**: Minimal web framework. Middleware pattern: `app.use()`. Routing: `app.get/post/put/delete()`. Request/response objects. Error handling middleware.

## 6. REST APIs

**REST (Representational State Transfer)**: Architectural style for web services. Stateless, client-server, cacheable, uniform interface.

**HTTP Methods**: GET (retrieve), POST (create), PUT (replace), PATCH (partial update), DELETE (remove). Idempotent: GET, PUT, DELETE. Non-idempotent: POST.

**Status Codes**: 200 OK, 201 Created, 204 No Content, 301 Moved, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 405 Method Not Allowed, 409 Conflict, 429 Rate Limited, 500 Internal Error, 502 Bad Gateway, 503 Service Unavailable.

**Best Practices**: Use nouns for resources (/users, /posts), plural naming, versioning (/api/v1/), pagination (limit/offset or cursor), filtering/sorting via query params, HATEOAS (hypermedia links), proper error responses with message and code.

**Authentication**: API keys, JWT (JSON Web Tokens — header.payload.signature, stateless), OAuth 2.0 (authorization framework — authorization code flow, client credentials, PKCE), session-based (cookies + server-side session store).

## 7. Next.js

**Full-stack React framework**. Features: file-based routing, server-side rendering (SSR), static site generation (SSG), API routes, middleware, image optimization.

**Routing (App Router)**: File-system based. `app/page.tsx` = route. `app/layout.tsx` = shared layout. Dynamic routes: `[param]`. Catch-all: `[...slug]`. Route groups: `(group)`.

**Rendering**: Server Components (default — rendered on server), Client Components ('use client' directive), SSG (generateStaticParams), ISR (Incremental Static Regeneration — revalidate).

**Data Fetching**: Server Components can use async/await directly. fetch() with caching options. Route handlers (API routes): `app/api/route.ts`.

**Middleware**: `middleware.ts` at project root. Runs before every request. Used for authentication, redirects, headers.

## 8. TypeScript

**Static type system** for JavaScript. Types checked at compile time.

**Basic Types**: string, number, boolean, null, undefined, void, never, any, unknown, object.

**Interfaces and Types**: `interface User { name: string; age: number; }`. Type aliases: `type ID = string | number`. Intersection: `A & B`. Union: `A | B`.

**Generics**: `function identity<T>(arg: T): T`. Constraints: `<T extends HasLength>`. Generic classes, interfaces.

**Utility Types**: `Partial<T>`, `Required<T>`, `Readonly<T>`, `Pick<T, K>`, `Omit<T, K>`, `Record<K, V>`, `ReturnType<F>`.

**Enums**: `enum Direction { Up, Down, Left, Right }`. Const enums for compile-time inlining.

## 9. Databases in Web Development

**SQL Databases**: PostgreSQL (advanced features, JSONB), MySQL (widely used), SQLite (embedded). ORM: Prisma, Drizzle, TypeORM, Sequelize.

**NoSQL**: MongoDB (document — BSON), Redis (key-value, caching), Firebase Firestore (real-time document), DynamoDB (key-value, AWS).

**Firebase**: Authentication (Google, email, phone), Firestore (real-time NoSQL), Cloud Storage, Cloud Functions, Hosting. Real-time listeners, offline support, security rules.

## 10. Security in Web Development

**XSS (Cross-Site Scripting)**: Injecting malicious scripts. Types: Stored, Reflected, DOM-based. Prevention: input sanitization, output encoding, CSP headers, HttpOnly cookies.

**CSRF (Cross-Site Request Forgery)**: Unauthorized commands from authenticated user. Prevention: CSRF tokens, SameSite cookies, checking Origin/Referer headers.

**SQL Injection**: Malicious SQL in user input. Prevention: parameterized queries, ORM, input validation.

**CORS**: Browser security policy restricting cross-origin requests. Server sets Access-Control-Allow-Origin headers.

**HTTPS**: TLS encryption for all data in transit. HSTS header forces HTTPS.

**Content Security Policy**: HTTP header restricting resource sources. Prevents XSS and data injection attacks.
