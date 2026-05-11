# Calculus — Comprehensive Knowledge Base

## 1. Limits and Continuity

**Limit**: limₓ→ₐ f(x) = L if f(x) approaches L as x approaches a. Left-hand limit: limₓ→ₐ⁻ f(x). Right-hand limit: limₓ→ₐ⁺ f(x). Limit exists iff both one-sided limits exist and are equal.

**Limit Laws**: Sum, difference, product, quotient (denominator ≠ 0), power, root. lim[cf(x)] = c·lim f(x). lim[f(x)±g(x)] = lim f(x) ± lim g(x). lim[f(x)·g(x)] = lim f(x) · lim g(x).

**Indeterminate Forms**: 0/0, ∞/∞, 0·∞, ∞-∞, 0⁰, 1^∞, ∞⁰. **L'Hôpital's Rule**: If lim f(x)/g(x) is 0/0 or ∞/∞, then lim f(x)/g(x) = lim f'(x)/g'(x) (if the latter exists).

**Squeeze Theorem**: If g(x) ≤ f(x) ≤ h(x) near a and lim g(x) = lim h(x) = L, then lim f(x) = L.

**Important Limits**: lim(x→0) sin(x)/x = 1. lim(x→0) (1-cos(x))/x = 0. lim(x→∞) (1+1/x)ˣ = e. lim(x→0) (eˣ-1)/x = 1. lim(x→0) ln(1+x)/x = 1.

**Continuity**: f is continuous at a if: (1) f(a) is defined, (2) lim f(x) exists, (3) lim f(x) = f(a). Types of discontinuity: removable, jump, infinite.

**Intermediate Value Theorem (IVT)**: If f is continuous on [a,b] and N is between f(a) and f(b), then ∃ c ∈ (a,b) such that f(c) = N. Used to prove existence of roots.

## 2. Differentiation

**Derivative**: f'(x) = lim(h→0) [f(x+h)-f(x)]/h. Geometric meaning: slope of tangent line. Physical meaning: instantaneous rate of change.

**Differentiation Rules**: Power: d/dx[xⁿ] = nxⁿ⁻¹. Constant: d/dx[c] = 0. Sum/Difference. Product: (fg)' = f'g + fg'. Quotient: (f/g)' = (f'g - fg')/g². Chain: d/dx[f(g(x))] = f'(g(x))·g'(x).

**Common Derivatives**: d/dx[sin x] = cos x, d/dx[cos x] = -sin x, d/dx[tan x] = sec²x, d/dx[eˣ] = eˣ, d/dx[ln x] = 1/x, d/dx[aˣ] = aˣ ln a, d/dx[sin⁻¹x] = 1/√(1-x²), d/dx[cos⁻¹x] = -1/√(1-x²), d/dx[tan⁻¹x] = 1/(1+x²).

**Implicit Differentiation**: Differentiate both sides with respect to x, treating y as function of x. Collect dy/dx terms.

**Logarithmic Differentiation**: Take ln of both sides. Useful for products/quotients of complicated functions or variable exponents.

**Higher Derivatives**: f''(x) = d²f/dx². f⁽ⁿ⁾(x) = dⁿf/dxⁿ. Second derivative: concavity, acceleration.

**Applications of Derivatives**:
- **Tangent/Normal lines**: Tangent: y - y₁ = f'(x₁)(x - x₁). Normal: slope = -1/f'(x₁).
- **Related Rates**: Multiple changing quantities related by equation. Differentiate with respect to time.
- **Extrema**: Critical points where f'(x) = 0 or f'(x) undefined. First derivative test (sign change). Second derivative test: f''(c) > 0 → local min, f''(c) < 0 → local max.
- **Concavity and Inflection**: f'' > 0 → concave up. f'' < 0 → concave down. Inflection point: f'' changes sign.
- **Optimization**: Find global max/min by checking critical points and endpoints.
- **Mean Value Theorem (MVT)**: If f continuous on [a,b] and differentiable on (a,b), ∃ c ∈ (a,b) such that f'(c) = [f(b)-f(a)]/(b-a).
- **Rolle's Theorem**: MVT special case where f(a) = f(b), so ∃ c where f'(c) = 0.
- **Newton's Method**: x_{n+1} = xₙ - f(xₙ)/f'(xₙ). Iterative root finding.

**Taylor Series**: f(x) = Σ f⁽ⁿ⁾(a)/n! · (x-a)ⁿ. Maclaurin series: Taylor at a = 0. Common: eˣ = Σxⁿ/n!, sin x = Σ(-1)ⁿx²ⁿ⁺¹/(2n+1)!, cos x = Σ(-1)ⁿx²ⁿ/(2n)!, ln(1+x) = Σ(-1)ⁿ⁺¹xⁿ/n, 1/(1-x) = Σxⁿ (|x|<1).

## 3. Integration

**Antiderivative**: F(x) such that F'(x) = f(x). **Indefinite Integral**: ∫f(x)dx = F(x) + C.

**Basic Integrals**: ∫xⁿdx = xⁿ⁺¹/(n+1) + C (n≠-1). ∫1/x dx = ln|x| + C. ∫eˣdx = eˣ + C. ∫sin x dx = -cos x + C. ∫cos x dx = sin x + C. ∫sec²x dx = tan x + C. ∫1/(1+x²)dx = tan⁻¹x + C. ∫1/√(1-x²)dx = sin⁻¹x + C.

**Techniques of Integration**:
- **Substitution (u-sub)**: ∫f(g(x))g'(x)dx. Let u = g(x), du = g'(x)dx.
- **Integration by Parts**: ∫udv = uv - ∫vdu. LIATE priority: Logarithmic, Inverse trig, Algebraic, Trig, Exponential.
- **Trigonometric Integrals**: Powers of sin/cos — use identities. sin²x = (1-cos2x)/2, cos²x = (1+cos2x)/2.
- **Trigonometric Substitution**: √(a²-x²) → x = a sinθ. √(a²+x²) → x = a tanθ. √(x²-a²) → x = a secθ.
- **Partial Fractions**: For rational functions P(x)/Q(x). Decompose into simpler fractions: A/(x-a) + B/(x-b) + ...

**Definite Integral**: ∫ₐᵇ f(x)dx = F(b) - F(a). **Fundamental Theorem of Calculus**: Part 1: d/dx ∫ₐˣ f(t)dt = f(x). Part 2: ∫ₐᵇ f(x)dx = F(b) - F(a) where F' = f.

**Applications**:
- **Area between curves**: A = ∫ₐᵇ |f(x) - g(x)| dx.
- **Volume of revolution**: Disk method: V = π∫[f(x)]²dx. Washer: V = π∫([R(x)]²-[r(x)]²)dx. Shell method: V = 2π∫x·f(x)dx.
- **Arc length**: L = ∫ₐᵇ √(1+[f'(x)]²)dx.
- **Surface area of revolution**: SA = 2π∫f(x)√(1+[f'(x)]²)dx.

**Improper Integrals**: Infinite limits or discontinuous integrand. ∫₁^∞ 1/xᵖ dx converges iff p > 1 (p-test). Comparison test.

## 4. Sequences and Series

**Sequence**: Ordered list {aₙ}. Convergent if limₙ→∞ aₙ = L. Monotone convergence theorem.

**Series**: Σaₙ. Partial sums Sₙ. Series converges if {Sₙ} converges.

**Geometric Series**: Σarⁿ. Converges iff |r| < 1, sum = a/(1-r). **Harmonic Series**: Σ1/n diverges. **p-Series**: Σ1/nᵖ converges iff p > 1.

**Convergence Tests**: Divergence test (lim aₙ ≠ 0 → diverges). Integral test. Comparison test. Limit comparison. Ratio test (lim |a_{n+1}/aₙ| < 1 → converges). Root test (lim |aₙ|^(1/n) < 1). Alternating series test (Leibniz — |aₙ| decreasing, lim aₙ = 0). Absolute vs conditional convergence.

**Power Series**: Σcₙ(x-a)ⁿ. Radius of convergence R (ratio/root test). Interval of convergence (check endpoints).

## 5. Multivariable Calculus

**Partial Derivatives**: ∂f/∂x = limit while holding other variables constant. Mixed partials: fxy = fyx (Clairaut's theorem, if continuous).

**Gradient**: ∇f = (∂f/∂x, ∂f/∂y, ∂f/∂z). Points in direction of steepest increase. |∇f| = rate of steepest increase.

**Chain Rule**: dz/dt = (∂z/∂x)(dx/dt) + (∂z/∂y)(dy/dt).

**Directional Derivative**: D_u f = ∇f · û. Rate of change in direction û.

**Critical Points**: ∇f = 0. Second derivative test: D = fxx·fyy - (fxy)². D > 0, fxx > 0: local min. D > 0, fxx < 0: local max. D < 0: saddle point.

**Multiple Integrals**: Double integral ∬f(x,y)dA. Triple integral ∭f(x,y,z)dV. Change of variables: polar (r,θ), cylindrical (r,θ,z), spherical (ρ,θ,φ). Jacobian determinant.

**Line Integrals**: ∫C F·dr. If F = ∇f (conservative), then ∫C F·dr = f(end) - f(start). Path-independent.

**Surface Integrals**: ∬S F·dS. Flux through surface.

**Green's Theorem**: ∮C (P dx + Q dy) = ∬D (∂Q/∂x - ∂P/∂y)dA. Relates line integral to double integral.

**Stokes' Theorem**: ∮C F·dr = ∬S (∇×F)·dS. Generalization of Green's.

**Divergence Theorem**: ∬S F·dS = ∭V ∇·F dV. Relates surface integral to volume integral.
