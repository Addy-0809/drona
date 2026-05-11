# Probability and Statistics — Comprehensive Knowledge Base

## 1. Probability Fundamentals

**Sample Space (S)**: Set of all possible outcomes. **Event**: Subset of sample space. **Probability**: P(A) = |A|/|S| for equally likely outcomes. Axioms: P(A) ≥ 0, P(S) = 1, P(A∪B) = P(A) + P(B) for mutually exclusive events.

**Conditional Probability**: P(A|B) = P(A∩B)/P(B). **Bayes' Theorem**: P(A|B) = P(B|A)·P(A)/P(B). **Total Probability**: P(B) = Σ P(B|Aᵢ)·P(Aᵢ).

**Independence**: P(A∩B) = P(A)·P(B). Mutually exclusive ≠ independent.

**Combinatorics**: Permutations P(n,r) = n!/(n-r)!. Combinations C(n,r) = n!/[r!(n-r)!]. Multinomial coefficient = n!/(n₁!·n₂!·...·nₖ!).

## 2. Random Variables and Distributions

**Random Variable**: Function mapping outcomes to real numbers. **Discrete**: countable values. **Continuous**: uncountable values.

**PMF** (Probability Mass Function): P(X=x) for discrete. **PDF** (Probability Density Function): f(x) for continuous, P(a≤X≤b) = ∫f(x)dx. **CDF**: F(x) = P(X≤x).

**Expected Value**: E[X] = Σ xᵢP(xᵢ) or ∫xf(x)dx. Linearity: E[aX+bY] = aE[X]+bE[Y]. **Variance**: Var(X) = E[(X-μ)²] = E[X²]-(E[X])². Standard Deviation: σ = √Var(X).

### Discrete Distributions

**Bernoulli**: X∈{0,1}, P(X=1)=p. E[X]=p, Var=p(1-p).

**Binomial**: n independent Bernoulli trials. P(X=k) = C(n,k)p^k(1-p)^(n-k). E[X]=np, Var=np(1-p).

**Poisson**: Events in fixed interval. P(X=k) = e^(-λ)λ^k/k!. E[X]=λ, Var=λ. Approximates Binomial for large n, small p (λ=np).

**Geometric**: Trials until first success. P(X=k) = (1-p)^(k-1)p. E[X]=1/p, Var=(1-p)/p².

**Negative Binomial**: Trials until r-th success. **Hypergeometric**: Sampling without replacement. **Uniform Discrete**: P(X=k) = 1/n for k=1..n.

### Continuous Distributions

**Uniform**: f(x) = 1/(b-a) for a≤x≤b. E[X]=(a+b)/2, Var=(b-a)²/12.

**Normal (Gaussian)**: f(x) = (1/σ√2π)exp(-(x-μ)²/2σ²). 68-95-99.7 rule. Standard normal Z = (X-μ)/σ. Sum of normals is normal. CLT convergence.

**Exponential**: f(x) = λe^(-λx) for x≥0. E[X]=1/λ, Var=1/λ². Memoryless property: P(X>s+t|X>s) = P(X>t). Models time between Poisson events.

**Gamma**: Generalizes exponential. f(x) = (λ^α/Γ(α))x^(α-1)e^(-λx). Sum of α independent exponentials.

**Beta**: f(x) = x^(α-1)(1-x)^(β-1)/B(α,β) on [0,1]. Prior for probabilities in Bayesian stats.

**Chi-Squared (χ²)**: Sum of squared standard normals. df=k. Used in goodness-of-fit and independence tests.

**t-Distribution**: Used for small samples when σ unknown. Heavier tails than normal. Approaches normal as df→∞.

**F-Distribution**: Ratio of two chi-squared variables. Used in ANOVA and regression F-tests.

## 3. Joint Distributions and Covariance

**Joint PMF/PDF**: P(X=x, Y=y) or f(x,y). Marginal: P(X=x) = Σ_y P(X=x, Y=y).

**Covariance**: Cov(X,Y) = E[XY] - E[X]E[Y]. **Correlation**: ρ = Cov(X,Y)/(σ_X·σ_Y), ρ∈[-1,1]. Independent → uncorrelated (converse not always true).

**Var(X+Y)** = Var(X) + Var(Y) + 2Cov(X,Y). If independent: Var(X+Y) = Var(X) + Var(Y).

## 4. Sampling and Estimation

**Central Limit Theorem (CLT)**: For large n, sample mean X̄ ~ N(μ, σ²/n) regardless of population distribution. Foundation of statistical inference.

**Law of Large Numbers**: X̄ → μ as n → ∞. Weak (convergence in probability) and Strong (almost sure convergence).

**Point Estimation**: Estimator θ̂ for parameter θ. Properties: Unbiased (E[θ̂]=θ), Consistent (θ̂→θ as n→∞), Efficient (minimum variance), Sufficient (captures all info about θ).

**Maximum Likelihood Estimation (MLE)**: Find θ that maximizes L(θ|data) = Π f(xᵢ|θ). Take log-likelihood, set derivative to 0. MLE is consistent and asymptotically efficient.

**Method of Moments**: Set sample moments equal to population moments, solve for parameters.

**Confidence Interval**: Range likely containing true parameter. For mean with known σ: X̄ ± z_(α/2)·σ/√n. With unknown σ: X̄ ± t_(α/2,n-1)·s/√n.

## 5. Hypothesis Testing

**Setup**: Null hypothesis H₀ vs Alternative H₁. Test statistic computed from data. Compare to critical value or compute p-value.

**Type I Error (α)**: Reject H₀ when it's true (false positive). **Type II Error (β)**: Fail to reject H₀ when it's false (false negative). **Power** = 1-β = P(reject H₀|H₁ true).

**Z-test**: For mean with known σ. Z = (X̄-μ₀)/(σ/√n). **t-test**: Unknown σ. t = (X̄-μ₀)/(s/√n), df=n-1. **Two-sample t-test**: Compare two means. **Paired t-test**: Dependent samples.

**Chi-squared test**: Goodness-of-fit: χ² = Σ(O-E)²/E. Test of independence: compare observed vs expected in contingency table. df=(r-1)(c-1).

**ANOVA (Analysis of Variance)**: Compare means of 3+ groups. F = MSB/MSW (between-group variance / within-group variance). One-way, two-way ANOVA.

**p-value**: Probability of observing data as extreme as sample under H₀. If p < α, reject H₀.

## 6. Regression Analysis

**Simple Linear Regression**: Y = β₀ + β₁X + ε. OLS estimates: β̂₁ = Σ(xᵢ-x̄)(yᵢ-ȳ)/Σ(xᵢ-x̄)², β̂₀ = ȳ - β̂₁x̄.

**R² (Coefficient of Determination)**: Proportion of variance explained. R² = SSR/SST = 1 - SSE/SST. Values 0-1 (higher = better fit).

**Multiple Linear Regression**: Y = β₀ + β₁X₁ + β₂X₂ + ... + ε. Matrix form: β̂ = (X'X)⁻¹X'Y. Adjusted R² penalizes for extra predictors.

**Assumptions**: Linearity, independence of errors, homoscedasticity (constant variance), normality of residuals. Violations → transform data or use robust methods.

**Logistic Regression**: Binary outcome. P(Y=1) = 1/(1+e^(-z)) where z = β₀+β₁X. Log-odds: ln(p/(1-p)) = β₀+β₁X. MLE estimation.

## 7. Bayesian Statistics

**Bayes' Theorem**: P(θ|data) ∝ P(data|θ)·P(θ). Posterior ∝ Likelihood × Prior.

**Conjugate Priors**: Prior and posterior from same family. Beta-Binomial, Normal-Normal, Gamma-Poisson.

**MAP (Maximum A Posteriori)**: Point estimate = mode of posterior. MLE = MAP with uniform prior.

**Credible Interval**: Bayesian analog of confidence interval. 95% credible interval: 95% posterior probability that θ lies in interval.
