# Differential Calculus — Comprehensive Knowledge Base

## 1. Limits and Continuity

**Limit Definition**: limₓ→ₐ f(x) = L means for every ε > 0, there exists δ > 0 such that |f(x) - L| < ε whenever 0 < |x - a| < δ (epsilon-delta definition).

**One-Sided Limits**: Left limit limₓ→ₐ⁻ f(x) (approach from below), Right limit limₓ→ₐ⁺ f(x) (approach from above). Two-sided limit exists iff both one-sided limits exist and are equal.

**Limit Properties**: Linearity, product, quotient (denominator ≠ 0), composition (if outer function continuous). Squeeze theorem. L'Hôpital's rule for 0/0 and ∞/∞ forms.

**Standard Limits**: lim(x→0) sinx/x = 1, lim(x→0) tanx/x = 1, lim(x→0) (eˣ-1)/x = 1, lim(x→0) (aˣ-1)/x = lna, lim(x→0) log(1+x)/x = 1/lna, lim(x→∞)(1+1/x)ˣ = e, lim(x→0)(1+x)^(1/x) = e.

**Continuity**: f continuous at x=a if lim(x→a) f(x) = f(a). Continuity on interval: continuous at every point. Types of discontinuity: removable (limit exists but f(a) undefined or ≠ limit), jump (left and right limits differ), infinite/essential (limit doesn't exist).

**Theorems on Continuous Functions**: Intermediate Value Theorem (IVT), Extreme Value Theorem (continuous on [a,b] attains max and min), Bolzano's theorem (continuous, f(a)f(b) < 0 → root exists).

## 2. Differentiation Fundamentals

**Derivative from First Principles**: f'(x) = lim(h→0) [f(x+h) - f(x)]/h. Alternative: f'(a) = lim(x→a) [f(x) - f(a)]/(x - a).

**Geometric Interpretation**: Slope of tangent line to curve at point. Tangent line: y - f(a) = f'(a)(x - a). Normal line: y - f(a) = -1/f'(a) · (x - a).

**Physical Interpretation**: Rate of change. Velocity v(t) = s'(t). Acceleration a(t) = v'(t) = s''(t).

**Differentiability implies Continuity**: If f is differentiable at a, then f is continuous at a. Converse is false (e.g., |x| at x=0: continuous but not differentiable).

## 3. Differentiation Rules

**Basic Rules**: d/dx(c) = 0, d/dx(xⁿ) = nxⁿ⁻¹, d/dx(cf) = cf', d/dx(f±g) = f'±g'.

**Product Rule**: (fg)' = f'g + fg'. Extended: (fgh)' = f'gh + fg'h + fgh'.

**Quotient Rule**: (f/g)' = (f'g - fg')/g².

**Chain Rule**: d/dx[f(g(x))] = f'(g(x))·g'(x). In Leibniz notation: dy/dx = (dy/du)·(du/dx). Extended: dy/dx = (dy/du)·(du/dv)·(dv/dx).

**Standard Derivatives**:
- Trigonometric: (sinx)' = cosx, (cosx)' = -sinx, (tanx)' = sec²x, (cotx)' = -csc²x, (secx)' = secx·tanx, (cscx)' = -cscx·cotx
- Inverse Trigonometric: (sin⁻¹x)' = 1/√(1-x²), (cos⁻¹x)' = -1/√(1-x²), (tan⁻¹x)' = 1/(1+x²), (cot⁻¹x)' = -1/(1+x²), (sec⁻¹x)' = 1/(|x|√(x²-1)), (csc⁻¹x)' = -1/(|x|√(x²-1))
- Exponential/Logarithmic: (eˣ)' = eˣ, (aˣ)' = aˣ lna, (lnx)' = 1/x, (log_a x)' = 1/(x lna)
- Hyperbolic: (sinhx)' = coshx, (coshx)' = sinhx, (tanhx)' = sech²x

## 4. Advanced Differentiation Techniques

**Implicit Differentiation**: For equations not explicitly solved for y. Differentiate both sides with respect to x, treat y as function of x, collect dy/dx terms. Example: x² + y² = r² → 2x + 2y(dy/dx) = 0 → dy/dx = -x/y.

**Logarithmic Differentiation**: Take natural log of both sides. Useful for: (1) Products/quotients of many functions, (2) Variable in both base and exponent like y = xˣ: ln y = x ln x, (1/y)dy/dx = lnx + 1, dy/dx = xˣ(lnx + 1).

**Parametric Differentiation**: If x = f(t), y = g(t), then dy/dx = (dy/dt)/(dx/dt) = g'(t)/f'(t). Second derivative: d²y/dx² = d/dt(dy/dx) / (dx/dt).

**Differentiation of Functions Defined by Integrals**: Leibniz rule: d/dx ∫ₐ⁽ˣ⁾ᵇ⁽ˣ⁾ f(t)dt = f(b(x))·b'(x) - f(a(x))·a'(x).

**Higher Order Derivatives**: f''(x), f'''(x), f⁽ⁿ⁾(x). Leibniz rule for nth derivative of product: (fg)⁽ⁿ⁾ = Σ C(n,k) f⁽ᵏ⁾ g⁽ⁿ⁻ᵏ⁾.

## 5. Applications of Derivatives

### Rate of Change and Related Rates
Derivative represents instantaneous rate of change. Related rates: when two or more quantities change with time and are related by an equation, differentiate with respect to t to find how one rate relates to another. Example: expanding balloon — dV/dt = 4πr²(dr/dt).

### Tangent and Normal
Equation of tangent at (x₁, y₁): y - y₁ = f'(x₁)(x - x₁). Equation of normal: y - y₁ = [-1/f'(x₁)](x - x₁). Angle between two curves at intersection: tanα = |m₁ - m₂|/(1 + m₁m₂). Orthogonal curves: m₁ × m₂ = -1.

### Increasing/Decreasing Functions
f increasing on interval if f'(x) > 0 for all x in interval. f decreasing if f'(x) < 0. Strictly increasing/decreasing if inequality is strict (not just non-negative/non-positive).

### Maxima and Minima
**Critical Points**: Where f'(x) = 0 (stationary points) or f'(x) undefined.

**First Derivative Test**: If f' changes from + to - at c: local maximum. If f' changes from - to + at c: local minimum. No sign change: neither.

**Second Derivative Test**: At critical point c where f'(c) = 0: f''(c) > 0 → local minimum, f''(c) < 0 → local maximum, f''(c) = 0 → test inconclusive (use higher order derivatives or first derivative test).

**Absolute (Global) Extrema on [a,b]**: Evaluate f at all critical points in (a,b) and endpoints a, b. Largest = absolute max, smallest = absolute min.

**nth Derivative Test**: If f'(c) = f''(c) = ... = f⁽ⁿ⁻¹⁾(c) = 0 and f⁽ⁿ⁾(c) ≠ 0. If n is even: f⁽ⁿ⁾(c) > 0 → min, f⁽ⁿ⁾(c) < 0 → max. If n is odd: inflection point.

### Concavity and Inflection Points
**Concave Up**: f''(x) > 0 (tangent line below curve, "holds water"). **Concave Down**: f''(x) < 0 (tangent line above curve). **Inflection Point**: Where concavity changes — f''(x) = 0 and sign of f'' changes.

### Curve Sketching
Systematic approach: (1) Domain, (2) Intercepts, (3) Symmetry (even/odd/periodic), (4) Asymptotes (vertical: where denominator = 0; horizontal: limits at ±∞; oblique), (5) First derivative analysis (increasing/decreasing, critical points, local extrema), (6) Second derivative analysis (concavity, inflection), (7) Plot key points and sketch.

### Mean Value Theorem (MVT)
If f continuous on [a,b] and differentiable on (a,b), then ∃ c ∈ (a,b) such that f'(c) = [f(b) - f(a)]/(b - a). Geometric meaning: there exists a point where tangent is parallel to secant.

**Rolle's Theorem**: Special case of MVT where f(a) = f(b). Then ∃ c ∈ (a,b) such that f'(c) = 0.

**Cauchy's MVT**: If f, g continuous on [a,b] and differentiable on (a,b), g'(x) ≠ 0, then ∃ c: f'(c)/g'(c) = [f(b)-f(a)]/[g(b)-g(a)]. Basis for L'Hôpital's rule.

### L'Hôpital's Rule (Detailed)
For indeterminate forms 0/0 or ∞/∞: lim f(x)/g(x) = lim f'(x)/g'(x) (if latter limit exists or is ±∞). Can be applied repeatedly. Other forms converted: 0·∞ → rewrite as quotient. ∞-∞ → combine into single fraction. 0⁰, ∞⁰, 1^∞ → take logarithm, apply to exponent.

### Taylor and Maclaurin Series
**Taylor Series** of f about x = a: f(x) = Σₙ₌₀^∞ [f⁽ⁿ⁾(a)/n!](x-a)ⁿ. **Maclaurin Series**: Taylor series at a = 0.

**Taylor's Theorem with Remainder**: f(x) = Pₙ(x) + Rₙ(x). Lagrange remainder: Rₙ(x) = [f⁽ⁿ⁺¹⁾(c)/(n+1)!](x-a)ⁿ⁺¹ for some c between a and x.

**Common Maclaurin Series**: eˣ = 1 + x + x²/2! + x³/3! + ..., sinx = x - x³/3! + x⁵/5! - ..., cosx = 1 - x²/2! + x⁴/4! - ..., ln(1+x) = x - x²/2 + x³/3 - ... (|x| ≤ 1, x ≠ -1), (1+x)ⁿ = 1 + nx + n(n-1)x²/2! + ... (binomial series).

### Partial Derivatives (Introduction)
For f(x,y): ∂f/∂x = lim(h→0) [f(x+h,y) - f(x,y)]/h (differentiate treating y as constant). Similarly ∂f/∂y.

**Total Differential**: df = (∂f/∂x)dx + (∂f/∂y)dy. Approximation: Δf ≈ df.

**Euler's Theorem for Homogeneous Functions**: If f is homogeneous of degree n (f(tx,ty) = tⁿf(x,y)), then x(∂f/∂x) + y(∂f/∂y) = nf(x,y).

### Indeterminate Forms and Evaluation
**Seven Forms**: 0/0, ∞/∞ (apply L'Hôpital directly), 0·∞ (rewrite as 0/(1/∞) or ∞/(1/0)), ∞-∞ (combine fractions), 0⁰, ∞⁰, 1^∞ (take ln, evaluate limit of exponent, then exponentiate).
