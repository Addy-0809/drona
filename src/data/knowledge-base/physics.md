# Physics — Comprehensive Knowledge Base

## 1. Mechanics

### Kinematics
**Displacement** (Δx): Vector quantity, change in position. **Distance**: Scalar, total path length. **Velocity** (v): Rate of change of displacement, v = Δx/Δt. **Speed**: Scalar magnitude of velocity. **Acceleration** (a): Rate of change of velocity, a = Δv/Δt.

**Equations of Motion** (constant acceleration): v = u + at, s = ut + ½at², v² = u² + 2as, s = ½(u+v)t. Where u = initial velocity, v = final velocity, a = acceleration, s = displacement, t = time.

**Projectile Motion**: Horizontal: x = v₀cosθ·t (no acceleration). Vertical: y = v₀sinθ·t - ½gt². Range R = v₀²sin2θ/g. Max height H = v₀²sin²θ/2g. Time of flight T = 2v₀sinθ/g. Maximum range at θ = 45°.

**Circular Motion**: Centripetal acceleration a_c = v²/r = ω²r directed toward center. Centripetal force F = mv²/r. Angular velocity ω = 2π/T = 2πf. Period T = 1/f. v = rω.

### Newton's Laws
**First Law (Inertia)**: Object remains at rest or uniform motion unless acted upon by net external force. **Second Law**: F = ma (net force = mass × acceleration). **Third Law**: Every action has equal and opposite reaction.

**Friction**: Static friction f_s ≤ μ_sN (prevents motion). Kinetic friction f_k = μ_kN (opposes motion). μ_s > μ_k.

**Momentum**: p = mv. Conservation: total momentum of isolated system is constant. Impulse J = FΔt = Δp. Elastic collision: both KE and momentum conserved. Inelastic: only momentum conserved. Perfectly inelastic: objects stick together.

### Work, Energy, Power
**Work**: W = F·d·cosθ. Scalar quantity. Unit: Joule (J). Work by spring: W = ½kx².

**Kinetic Energy**: KE = ½mv². **Potential Energy**: Gravitational PE = mgh. Elastic PE = ½kx². Work-Energy Theorem: W_net = ΔKE.

**Conservation of Energy**: Total mechanical energy (KE + PE) is conserved in absence of non-conservative forces. E_i = E_f.

**Power**: P = W/t = Fv. Unit: Watt (W).

### Rotational Mechanics
**Torque**: τ = r × F = rFsinθ. Moment of inertia I = Σmᵢrᵢ². Newton's second law for rotation: τ = Iα. Angular momentum L = Iω. Conservation of angular momentum. Rotational KE = ½Iω². Parallel axis theorem: I = I_cm + Md².

**Common moments of inertia**: Solid cylinder ½MR², Hollow cylinder MR², Solid sphere ⅖MR², Hollow sphere ⅔MR², Rod (center) 1/12·ML², Rod (end) ⅓ML².

### Gravitation
**Newton's Law of Gravitation**: F = GMm/r². G = 6.674 × 10⁻¹¹ Nm²/kg². Gravitational field g = GM/r². At Earth's surface: g ≈ 9.8 m/s².

**Kepler's Laws**: (1) Elliptical orbits with Sun at focus. (2) Equal areas in equal times (areal velocity constant). (3) T² ∝ a³ (period squared proportional to semi-major axis cubed).

**Orbital velocity**: v = √(GM/r). Escape velocity: v_e = √(2GM/R) = √(2gR) ≈ 11.2 km/s for Earth. Geostationary orbit: T = 24 hours, r ≈ 42,164 km from Earth center.

## 2. Thermodynamics

**Zeroth Law**: If A and B are in thermal equilibrium with C, then A and B are in thermal equilibrium. Basis for temperature measurement.

**First Law**: ΔU = Q - W. Internal energy change = heat added - work done by system. For ideal gas: ΔU = nCᵥΔT.

**Processes**: Isothermal (constant T, ΔU=0, W=nRTln(V₂/V₁)), Adiabatic (Q=0, PVᵞ=const, TVᵞ⁻¹=const), Isobaric (constant P, W=PΔV), Isochoric (constant V, W=0).

**Second Law**: Clausius: Heat cannot spontaneously flow from cold to hot. Kelvin-Planck: No engine can convert all heat to work. Entropy of isolated system never decreases. ΔS ≥ Q/T.

**Entropy**: S = k_B ln(W). Measure of disorder. Reversible process: ΔS = 0. Irreversible: ΔS > 0.

**Carnot Engine**: Maximum efficiency between two temperatures. η = 1 - T_cold/T_hot. Carnot cycle: isothermal expansion, adiabatic expansion, isothermal compression, adiabatic compression.

**Ideal Gas**: PV = nRT. P₁V₁/T₁ = P₂V₂/T₂. KE_avg = 3kBT/2. v_rms = √(3kBT/m). Degrees of freedom: monatomic 3, diatomic 5, polyatomic 6.

## 3. Electromagnetism

### Electrostatics
**Coulomb's Law**: F = kq₁q₂/r². k = 8.99 × 10⁹ Nm²/C². Like charges repel, opposite attract.

**Electric Field**: E = F/q = kQ/r² (point charge). Superposition principle. Field lines: away from positive, toward negative.

**Electric Potential**: V = kQ/r. Work: W = qΔV. Potential energy: U = kq₁q₂/r. Equipotential surfaces perpendicular to field lines.

**Gauss's Law**: ∮E·dA = Q_enc/ε₀. Applications: infinite plane (E=σ/2ε₀), conducting sphere (E=kQ/r² outside, 0 inside), infinite line (E=2kλ/r).

**Capacitance**: C = Q/V. Parallel plate: C = ε₀A/d. With dielectric: C = κε₀A/d. Energy: U = ½CV² = ½QV = Q²/2C. Series: 1/C_total = Σ1/Cᵢ. Parallel: C_total = ΣCᵢ.

### Current Electricity
**Current**: I = dQ/dt. Conventional current: positive to negative. **Ohm's Law**: V = IR. **Resistance**: R = ρL/A. Resistivity ρ varies with temperature: ρ = ρ₀(1+αΔT).

**Kirchhoff's Laws**: KCL (junction rule): ΣI_in = ΣI_out. KVL (loop rule): ΣV around loop = 0.

**Series**: R_total = ΣRᵢ, same current. **Parallel**: 1/R_total = Σ1/Rᵢ, same voltage.

**Power**: P = VI = I²R = V²/R. Energy: E = Pt. Wheatstone bridge: R₁/R₂ = R₃/R₄ at balance.

### Magnetism
**Magnetic Force**: On charge: F = qv×B (Lorentz force). On current-carrying wire: F = IL×B. Magnetic field of long wire: B = μ₀I/2πr. Solenoid: B = μ₀nI.

**Biot-Savart Law**: dB = (μ₀/4π)(Idl×r̂)/r².

**Ampere's Law**: ∮B·dl = μ₀I_enc. Applications: infinite wire, solenoid, toroid.

**Faraday's Law**: EMF = -dΦ_B/dt. Lenz's Law: Induced current opposes change in flux. Motional EMF: ε = BLv.

**Inductance**: Self-inductance L = NΦ/I. Solenoid: L = μ₀n²Al. Energy: U = ½LI². Mutual inductance: EMF₂ = -M(dI₁/dt).

### Electromagnetic Waves
**Maxwell's Equations**: (1) Gauss's law (electric), (2) Gauss's law (magnetic — no monopoles), (3) Faraday's law, (4) Ampere-Maxwell law (displacement current).

**EM spectrum** (increasing frequency): Radio → Microwave → Infrared → Visible → UV → X-ray → Gamma ray. Speed: c = 3 × 10⁸ m/s. c = fλ.

## 4. Optics

**Reflection**: Angle of incidence = angle of reflection. Plane mirror: virtual, upright, same-size image. Concave/Convex mirrors: mirror equation 1/f = 1/v + 1/u. f = R/2.

**Refraction**: Snell's Law: n₁sinθ₁ = n₂sinθ₂. n = c/v. Total internal reflection when θ > θ_c = sin⁻¹(n₂/n₁) for n₁ > n₂.

**Lenses**: Convex (converging), Concave (diverging). Thin lens equation: 1/f = 1/v - 1/u. Power P = 1/f (diopters). Magnification m = v/u.

**Interference**: Young's Double Slit: bright fringes at dsinθ = mλ, dark at dsinθ = (m+½)λ. Fringe width β = λD/d. Constructive: path difference = mλ. Destructive: (m+½)λ.

**Diffraction**: Single slit: dark fringes at asinθ = mλ. Resolving power (Rayleigh criterion): θ_min = 1.22λ/D.

**Polarization**: Transverse wave property. Malus's Law: I = I₀cos²θ. Brewster's angle: tanθ_B = n₂/n₁.

## 5. Modern Physics

**Photoelectric Effect**: E = hf - φ. Photon energy E = hf = hc/λ. Work function φ = hf₀. KE_max = eV_stop. Threshold frequency f₀ = φ/h. h = 6.626 × 10⁻³⁴ Js.

**de Broglie Wavelength**: λ = h/p = h/mv. Wave-particle duality.

**Bohr Model** (hydrogen atom): Quantized orbits: L = nℏ. Energy: Eₙ = -13.6/n² eV. Radius: rₙ = n²a₀ (a₀ = 0.529 Å). Photon emission/absorption: hf = Eᵢ - Ef.

**Radioactivity**: Alpha (⁴He nucleus), Beta (electron/positron), Gamma (photon). N(t) = N₀e^(-λt). Half-life t₁/₂ = ln2/λ. Activity A = λN.

**Mass-Energy Equivalence**: E = mc². Nuclear binding energy. Mass defect Δm → energy released in fusion/fission.

**Nuclear Fission**: Heavy nucleus splits into lighter nuclei + neutrons + energy. Chain reaction. Critical mass. Nuclear reactors: moderator, control rods, coolant.

**Nuclear Fusion**: Light nuclei combine into heavier nucleus + energy. Powers stars. p-p chain, CNO cycle. Requires extreme temperature and pressure.

**Special Relativity**: Postulates: (1) Laws of physics same in all inertial frames. (2) Speed of light same in all frames. Time dilation: t = γt₀. Length contraction: L = L₀/γ. γ = 1/√(1-v²/c²). E² = (pc)² + (mc²)².
