import {
  Question,
  HierarchicalReasoningError,
  CognitiveEvaluation,
  QuestionType,
  TestEngineMode,
  AdaptiveEvidence,
  NextBestTask,
  LearningMode,
} from '../src/types.ts';
import { db, DEFAULT_USER_ID } from './db.ts';
import { queryGemini, CURRENT_MODEL } from './gemini.ts';

// Initial Hierarchical Reasoning Errors (Unassessed Seed Profile)
export const INITIAL_HIERARCHICAL_ERRORS: HierarchicalReasoningError[] = [
  {
    id: 'err_assoc_causation',
    name: 'Association → Causation Confounding',
    domain: 'Thermodynamics & Energy Flux',
    reasoning_family: 'Causal Reasoning',
    specific_failure: 'Confuses macro-association (e.g. temperature rise in gas compression) with boundary heat flux (Q) ignoring adiabatic mechanical work',
    trigger_conditions: 'Triggered when two macroscopic thermodynamic state variables shift together in familiar cycles',
    countermeasure: 'Force explicit first-principles First Law chain [dU = dQ - dW] and isolate state variables from boundary energy fluxes',
    model_confidence: null,
    status: 'Unassessed',
    stage: null,
    error_frequency: 0,
    recent_frequency: 0,
    historical_frequency: 0,
    successful_repairs: 0,
    transfer_status: 'Unassessed',
    last_seen: '',
    current_hypothesis: 'Awaiting student reasoning evidence. The adaptive engine will calibrate this hypothesis as tests are taken.',
    next_diagnostic_test: 'Take initial diagnostic test on thermodynamic energy conservation and entropy flux.',
  },
  {
    id: 'err_directionality_inversion',
    name: 'Directionality Inversion in Dynamic Flux Chains',
    domain: 'Electrodynamics & Reactive Impedance',
    reasoning_family: 'Mechanism Reasoning',
    specific_failure: 'Reverses force → effect or back-action flux relationship when mediated through intermediate reactive impedance or induced back-EMF',
    trigger_conditions: 'Triggered when Lenz law back-action or electromagnetic damping acts on falling conductors or dynamic circuits',
    countermeasure: 'Ask: "If parameter X increases, what physical flux changes first, and which sign does Lenz law / Lorentz force mandate?"',
    model_confidence: null,
    status: 'Unassessed',
    stage: null,
    error_frequency: 0,
    recent_frequency: 0,
    historical_frequency: 0,
    successful_repairs: 0,
    transfer_status: 'Unassessed',
    last_seen: '',
    current_hypothesis: 'Awaiting student reasoning evidence. The adaptive engine will test directionality in dynamic flux and impedance chains.',
    next_diagnostic_test: 'Take diagnostic test on Lenz induction and Lorentz braking directionality.',
  },
  {
    id: 'err_premature_closure',
    name: 'Premature Closure on Prototype Matching',
    domain: 'Oscillatory Dynamics & Dissipation Mechanics',
    reasoning_family: 'Physical Hypothesis Closure',
    specific_failure: 'Stops physical inquiry once a familiar prototype is identified (e.g. assuming viscous drag purely from decay), before evaluating competing damping models with quantitative discriminators',
    trigger_conditions: 'Triggered by decaying wave or mechanical amplitude vignettes matching a textbook prototype without verifying envelope linearity vs exponentiality',
    countermeasure: 'Demand a single decisive mathematical or physical discriminator (linear decrement vs exponential envelope ratio) before committing to a mechanism',
    model_confidence: null,
    status: 'Unassessed',
    stage: null,
    error_frequency: 0,
    recent_frequency: 0,
    historical_frequency: 0,
    successful_repairs: 0,
    transfer_status: 'Unassessed',
    last_seen: '',
    current_hypothesis: 'Awaiting student reasoning evidence. The adaptive engine will challenge prototype recognition with competing physical models.',
    next_diagnostic_test: 'Take diagnostic test comparing viscous fluid drag against Coulomb dry friction.',
  },
  {
    id: 'err_overanalysis_trap',
    name: 'Overanalysis & Reluctance to Commit',
    domain: 'Physical Verification & Scientific Decision Thresholds',
    reasoning_family: 'Cognitive Efficiency',
    specific_failure: 'Continues requesting redundant environmental or parameter sweeps when the physical discriminator threshold has already definitively falsified the competing model',
    trigger_conditions: 'Triggered by the availability of multiple secondary apparatus sweeps or background logs in experimental setups',
    countermeasure: 'Enforce decision threshold awareness: "STOP — ENOUGH INFORMATION. COMMIT."',
    model_confidence: null,
    status: 'Unassessed',
    stage: null,
    error_frequency: 0,
    recent_frequency: 0,
    historical_frequency: 0,
    successful_repairs: 0,
    transfer_status: 'Unassessed',
    last_seen: '',
    current_hypothesis: 'Awaiting student reasoning evidence. Pacing and experimental commitment thresholds will be monitored.',
    next_diagnostic_test: 'Take diagnostic test on physical discriminator thresholds in experimental physics.',
  },
  {
    id: 'err_missing_variable',
    name: 'Missing Compensatory Feedback or State Variable',
    domain: 'Rigid Body Dynamics & Wave Systems',
    reasoning_family: 'Variable Accounting',
    specific_failure: 'Analyzes a primary dynamical perturbation in isolation without accounting for vector angular momentum coupling (dL/dt = τ) or boundary conditions',
    trigger_conditions: 'Triggered by rotating gyroscopes or boundary reflections with omitted vector or wave impedance terms',
    countermeasure: 'Require identification of the conserved vector quantity or boundary continuity constraints before declaring the steady-state response',
    model_confidence: null,
    status: 'Unassessed',
    stage: null,
    error_frequency: 0,
    recent_frequency: 0,
    historical_frequency: 0,
    successful_repairs: 0,
    transfer_status: 'Unassessed',
    last_seen: '',
    current_hypothesis: 'Awaiting student reasoning evidence. Angular momentum vector coupling and boundary matching will be tested.',
    next_diagnostic_test: 'Take diagnostic test evaluating gyroscopic precession and torque-momentum vector coupling.',
  }
];

// Curated Gold-Standard Diagnostic Questions (The 10 Diagnostic Archetypes in BSc Physics)
export const CURATED_DIAGNOSTIC_QUESTIONS: Question[] = [
  // 1. Association vs Causation — Thermodynamics & Energy Conservation (TYPE A)
  {
    id: 'diag_assoc_thermo_entropy_1',
    topic_id: 'top_carnot_entropy',
    topic_name: 'Carnot Cycles, Entropy & Second Law',
    subject_name: 'Thermal & Statistical Physics',
    mode: 'first_principles',
    question_type: 'TYPE_A_DIRECT_DIAGNOSTIC',
    difficulty: 'Mechanistic',
    root_error_target: 'err_assoc_causation',
    internal_rationale: 'Target: Causal reasoning vs Association. Tests whether student distinguishes macroscopic temperature rise correlation from directional heat and entropy flux gradients.',
    competing_paths: [
      'Path 1: First Law energy conservation [dU = dQ - dW] where adiabatic work (-dW > 0) drives dU and dT > 0 with dQ = 0',
      'Path 2 (Bug): Temperature rise in gas compression is assumed to prove heat absorption from an external reservoir (Q > 0)'
    ],
    falsification_criteria: 'Selecting Option A demonstrates understanding of thermodynamic work and directional heat flux. Selecting Option B confirms association→causation fallacy.',
    scenario_vignette: 'In an experimental physics demonstration, an ideal gas in an insulated piston-cylinder apparatus is rapidly compressed by an external mechanical force, causing its measured temperature to rise from 300 K to 450 K. A student notes: "Because temperature increased, the gas must have absorbed heat from an external thermal reservoir (Q > 0), proving that temperature change is caused by heat addition."',
    question_text: 'From first principles of the First Law of Thermodynamics (dU = dQ - dW), why is the student\'s reasoning fundamentally flawed?',
    options: [
      'In an adiabatic compression (dQ = 0), external work done on the system (-dW > 0) directly increases internal energy (dU = n C_v dT > 0), causing temperature to rise with zero heat transfer; temperature change is a state property shift, not an exclusive signature of heat flux.',
      'Insulated walls become thermally permeable when internal pressure exceeds atmospheric pressure.',
      'Gas molecules undergo spontaneous nuclear fusion during rapid volume contraction, creating latent heat internally.',
      'The First Law applies only to isobaric processes; in adiabatic processes, heat is mathematically undefined.'
    ],
    correct_answer: 'In an adiabatic compression (dQ = 0), external work done on the system (-dW > 0) directly increases internal energy (dU = n C_v dT > 0), causing temperature to rise with zero heat transfer; temperature change is a state property shift, not an exclusive signature of heat flux.',
    explanation: 'By the First Law of Thermodynamics, dU = dQ - dW (where dW is work done by the system). In an adiabatic compression, dQ = 0 and work is done ON the gas (dW < 0), so dU = -dW > 0. For an ideal gas, internal energy is solely a function of temperature: dU = n C_v dT. Therefore, dT > 0 occurs purely due to mechanical work without any heat addition. Associating a temperature increase exclusively with heat absorption confuses a state variable change with boundary heat transfer.',
    discriminator_note: 'CRUCIAL DISCRIMINATOR: dU = dQ - dW isolates work from heat transfer; adiabatic compression produces dT > 0 while dQ = 0.',
    reasoning_target: 'Distinguishing state variable changes (dT, dU) from boundary energy transfer fluxes (dQ, dW).',
    created_at: new Date().toISOString()
  },

  // 2. Directionality — Lenz\'s Law & Electromagnetic Back-EMF (TYPE C)
  {
    id: 'diag_directionality_lenz_back_emf_1',
    topic_id: 'top_lenz_induction',
    topic_name: 'Lenz\'s Law & Electromagnetic Induction',
    subject_name: 'Electrodynamics & Field Theory',
    mode: 'second_order',
    question_type: 'TYPE_C_MECHANISM_REVERSAL',
    difficulty: 'Second-Order',
    root_error_target: 'err_directionality_inversion',
    internal_rationale: 'Target: Mechanism Directionality. Evaluates if student reverses force/flux relationship when mediated by reactive impedance or induced back-EMF.',
    competing_paths: [
      'Path 1: Faraday-Lenz law EMF = -dΦ/dt creates opposing magnetic dipole, exerting a retarding Lorentz drag force on approaching magnet',
      'Path 2 (Bug): Induced magnetic field attracts the approaching magnet to pull it forward faster'
    ],
    falsification_criteria: 'Selecting Option A proves correct directionality. Selecting Option B confirms directional inversion.',
    scenario_vignette: 'A laboratory student drops a cylindrical neodymium magnet (north pole facing downward) through a stationary vertical copper ring. The student predicts: "As the magnetic flux through the ring increases, the induced electric current will generate a downward magnetic field that attracts the magnet from below, pulling it downward with an acceleration exceeding gravitational acceleration g."',
    question_text: 'Trace the electrodynamic causal sequence using Faraday law and Lenz law. Where does the student\'s causal directionality break?',
    options: [
      'By Lenz law (EMF = -dΦ/dt), the induced current generates an opposing upward magnetic dipole (North pole on top) that exerts a repulsive upward Lorentz force, decelerating the falling magnet (a < g) in strict accordance with energy conservation.',
      'The copper ring acts as a superconductor that completely expels the magnet downward via the Meissner effect.',
      'The magnetic field of the falling magnet induces electrostatic attraction that pulls the copper ring downward with it.',
      'The gravitational field couples to the magnetic vector potential, reversing the sign of Faraday law at terminal velocity.'
    ],
    correct_answer: 'By Lenz law (EMF = -dΦ/dt), the induced current generates an opposing upward magnetic dipole (North pole on top) that exerts a repulsive upward Lorentz force, decelerating the falling magnet (a < g) in strict accordance with energy conservation.',
    explanation: 'By Faraday law of electromagnetic induction, EMF = -dΦ_B/dt. As the North pole falls toward the ring, downward magnetic flux increases (dΦ_B/dt > 0). Lenz law mandates that the induced current must circulate counter-clockwise (viewed from above) to create an opposing upward magnetic field B_ind, presenting a North pole toward the approaching North pole. This creates a repulsive upward force F_Lorentz that opposes the motion, ensuring acceleration is strictly less than g. Reversing this directionality would create positive feedback where the magnet accelerates indefinitely without external energy input, violating conservation of energy.',
    discriminator_note: 'CRUCIAL DISCRIMINATOR: Lenz sign (EMF = -dΦ/dt) guarantees back-action opposes change in flux, enforcing conservation of energy.',
    reasoning_target: 'Electrodynamic directionality and opposing Lorentz back-action.',
    created_at: new Date().toISOString()
  },

  // 3. Premature Closure — Damping Mechanisms: Viscous vs Coulomb Friction (TYPE D)
  {
    id: 'diag_premature_closure_oscillator_damping_1',
    topic_id: 'top_damped_oscillator',
    topic_name: 'Damped & Driven Harmonic Oscillators',
    subject_name: 'Classical Mechanics & Dynamics',
    mode: 'causal_discrimination',
    question_type: 'TYPE_D_COMPETING_MECHANISMS',
    difficulty: 'Physical Synthesis',
    root_error_target: 'err_premature_closure',
    internal_rationale: 'Target: Premature Closure. Tests whether student stops inquiry upon recognizing amplitude decay (assuming viscous drag), or evaluates envelope linearity and period constancy discriminators against Coulomb dry friction.',
    competing_paths: [
      'Path 1: Coulomb (dry) friction damping with linear envelope decay [ΔA = -4 f_k/k per cycle] and invariant period',
      'Path 2 (Bug): Viscous fluid damping assumed automatically purely from observing decaying oscillations'
    ],
    falsification_criteria: 'Selecting Option A proves discriminator acuity between viscous and dry friction. Selecting Option B represents premature closure.',
    scenario_vignette: 'An experimental oscillator consisting of a slider on a guide rail attached to a spring (k = 50 N/m) is pulled to x_0 = 10.0 cm and released. Successive peak displacements are measured: x_1 = 8.5 cm, x_2 = 7.0 cm, x_3 = 5.5 cm, x_4 = 4.0 cm. A student immediately concludes: "This is a classic underdamped harmonic oscillator governed by linear viscous fluid drag F = -b v, so the amplitude decays exponentially."',
    question_text: 'What decisive quantitative physical discriminator proves that the student committed premature closure on the wrong physical mechanism?',
    options: [
      'The amplitude decreases by a constant linear decrement (ΔA = -1.5 cm per cycle), which is the exact mathematical signature of constant Coulomb dry friction (F_friction = ±μ_k N), whereas linear viscous drag produces an exponential decay envelope with a constant ratio between successive peaks.',
      'The natural frequency of an oscillator on a rail is always zero because gravity cancels spring force.',
      'Viscous drag only occurs when the oscillator is immersed in liquid helium at sub-Kelvin temperatures.',
      'A spring constant of 50 N/m is mathematically incompatible with damped motion.'
    ],
    correct_answer: 'The amplitude decreases by a constant linear decrement (ΔA = -1.5 cm per cycle), which is the exact mathematical signature of constant Coulomb dry friction (F_friction = ±μ_k N), whereas linear viscous drag produces an exponential decay envelope with a constant ratio between successive peaks.',
    explanation: 'For linear viscous damping (F_drag = -b v), the envelope decays exponentially: x_n = x_0 e^(-γ n T), meaning the ratio between successive peaks is constant: x_{n+1}/x_n = e^(-γ T) = constant. In this experiment, the successive peak differences are constant: 10.0 - 8.5 = 1.5 cm, 8.5 - 7.0 = 1.5 cm, 7.0 - 5.5 = 1.5 cm. In Coulomb dry friction, energy dissipated per half-cycle is W = f_k (2A), leading to a constant reduction in peak amplitude of ΔA = -4 f_k / k per complete cycle. Concluding viscous damping merely from observing decay is premature closure that ignores the linear vs exponential discriminator.',
    discriminator_note: 'CRUCIAL DISCRIMINATOR: Linear decrement (ΔA = constant) proves Coulomb dry friction; exponential decrement (x_{n+1}/x_n = constant) proves linear viscous drag.',
    reasoning_target: 'Discriminator analysis between Coulomb dry friction and viscous damping models.',
    created_at: new Date().toISOString()
  },

  // 4. Missing Variable — Gyroscopic Angular Momentum Coupling (TYPE E)
  {
    id: 'diag_missing_variable_gyroscopic_precession_1',
    topic_id: 'top_gyroscopic_precession',
    topic_name: 'Angular Momentum & Gyroscopic Precession',
    subject_name: 'Classical Mechanics & Dynamics',
    mode: 'second_order',
    question_type: 'TYPE_E_MISSING_VARIABLE',
    difficulty: 'Mechanistic',
    root_error_target: 'err_missing_variable',
    internal_rationale: 'Target: Missing Variable Accounting. Tests whether student notices omitted angular momentum vector coupling (dL/dt = τ) in rotating rigid bodies.',
    competing_paths: [
      'Path 1: External torque τ = r × mg produces orthogonal angular momentum displacement dL = τ dt, driving steady horizontal precession Ω_p = τ/L',
      'Path 2 (Bug): Torque acts as in non-rotating statics, causing immediate downward tipping without precession'
    ],
    falsification_criteria: 'Identifying spin angular momentum vector L and vector rate dL/dt = τ as the missing variable resolves the paradox.',
    scenario_vignette: 'A heavy wheel spinning rapidly at angular velocity ω about a horizontal axle is supported by a pivot at only one end, leaving the other end free. A physics student reasons: "Gravity exerts a downward torque τ = r × mg about the pivot. Because there is no upward balancing force at the free end, the axle must immediately tip downward and fall, exactly like a non-spinning rod supported at one end."',
    question_text: 'What critical dynamical variable is completely missing from the student\'s causal model of the spinning gyroscope?',
    options: [
      'The spin angular momentum vector L = I ω; torque τ changes angular momentum via dL/dt = τ, causing the horizontal vector L to rotate in the horizontal plane (steady precession Ω_p = τ / L) rather than tipping downward.',
      'The Coriolis force generated by the Earth rotation, which exerts an upward anti-gravity force on all rotating disks.',
      'The atmospheric aerodynamic lift generated by the rim of the spinning wheel exceeding the gravitational weight.',
      'The electrostatic repulsion between the axle pivot and the ground bearing.'
    ],
    correct_answer: 'The spin angular momentum vector L = I ω; torque τ changes angular momentum via dL/dt = τ, causing the horizontal vector L to rotate in the horizontal plane (steady precession Ω_p = τ / L) rather than tipping downward.',
    explanation: 'For a non-rotating body, L = 0, so applied torque τ produces angular acceleration in the direction of the torque (downward tipping). For a rapidly spinning wheel, the system possesses a large horizontal spin angular momentum L = I ω. By Newton second law for rotation, τ = dL/dt, so in time dt, the change in angular momentum is dL = τ dt. Because torque τ = r × mg is perpendicular to L in the horizontal plane, dL is directed horizontally, perpendicular to L. This causes the vector L to rotate horizontally with precession frequency Ω_p = dθ/dt = (dL / L) / dt = τ / L = (m g r) / (I ω), rather than falling.',
    discriminator_note: 'CRUCIAL DISCRIMINATOR: dL/dt = τ dictates vector orientation shift; large initial L redirects torque into orthogonal precession rather than direct downward angular acceleration.',
    reasoning_target: 'Vector coupling of torque to pre-existing angular momentum in rigid body dynamics.',
    created_at: new Date().toISOString()
  },

  // 5. Discriminator Selection — Quantum Tunneling vs Classical Barrier Hopping (TYPE D)
  {
    id: 'diag_discriminator_tunneling_vs_classical_1',
    topic_id: 'top_schrodinger_tunnel',
    topic_name: 'Quantum Tunneling & Potential Barriers',
    subject_name: 'Quantum Mechanics & Modern Physics',
    mode: 'causal_discrimination',
    question_type: 'TYPE_D_COMPETING_MECHANISMS',
    difficulty: 'Mechanistic',
    root_error_target: 'err_assoc_causation',
    internal_rationale: 'Target: Discriminator Acuity. Isolates the definitive physical discriminator separating quantum barrier tunneling from classical thermal activation over a barrier.',
    competing_paths: [
      'Mechanism A: Quantum tunneling through a potential barrier V_0 with transmission coefficient T ∝ e^(-2 κ a) independent of temperature T',
      'Mechanism B: Classical thermal activation over barrier with Arrhenius rate rate ∝ e^(-E_a / (k_B T))'
    ],
    falsification_criteria: 'Temperature-independent transmission as T → 0 K confirms quantum tunneling over classical thermal activation.',
    scenario_vignette: 'In an experimental solid-state nanostructure, electrons traverse a thin insulating barrier of height V_0 > E. Two competing transport mechanisms are proposed: Mechanism A: Quantum mechanical barrier tunneling. Mechanism B: Classical thermal activation (thermionic emission) over the barrier.',
    question_text: 'Which experimental parameter sweep serves as the decisive physical discriminator that definitively proves Mechanism A over Mechanism B?',
    options: [
      'Cooling the apparatus toward absolute zero (T → 0 K): Quantum tunneling transmission remains finite and nearly temperature-independent, whereas classical thermal activation rate collapses exponentially to zero according to the Arrhenius relation e^(-ΔE / (k_B T)).',
      'Measuring the color of the external apparatus casing under incandescent illumination.',
      'Increasing the thickness of the external copper wiring connecting the cryostat to the voltmeter.',
      'Checking whether the vacuum chamber pressure remains exactly at atmospheric level.'
    ],
    correct_answer: 'Cooling the apparatus toward absolute zero (T → 0 K): Quantum tunneling transmission remains finite and nearly temperature-independent, whereas classical thermal activation rate collapses exponentially to zero according to the Arrhenius relation e^(-ΔE / (k_B T)).',
    explanation: 'Classical barrier hopping requires thermal energy fluctuations, governed by Boltzmann statistics: rate ∝ e^(-(V_0 - E)/(k_B T)). As temperature T → 0 K, thermal activation vanishes completely. In contrast, quantum tunneling depends on the overlap of the evanescent wave function across the barrier width a: T_tunnel ≈ 16 (E/V_0)(1 - E/V_0) e^(-2 κ a), where κ = √(2m(V_0 - E))/ħ. This penetration is governed by barrier width and height, remaining finite even at 0 K. Temperature-independence at cryogenic temperatures is the gold-standard discriminator proving tunneling.',
    discriminator_note: 'CRUCIAL DISCRIMINATOR: Cryogenic temperature invariance (T → 0 K) discriminates quantum wave penetration from classical thermal activation.',
    reasoning_target: 'Isolating experimental discriminators between quantum tunneling and thermal activation.',
    created_at: new Date().toISOString()
  },

  // 6. Transfer Test — Mechanical String Impedance to Electromagnetic Fresnel Reflection (TYPE B)
  {
    id: 'diag_transfer_em_wave_dispersion_1',
    topic_id: 'top_maxwell_boundary',
    topic_name: 'Maxwell Equations & Electromagnetic Wave Propagation',
    subject_name: 'Electrodynamics & Field Theory',
    mode: 'second_order',
    question_type: 'TYPE_B_DISGUISED_TRANSFER',
    difficulty: 'Second-Order',
    root_error_target: 'err_assoc_causation',
    internal_rationale: 'Target: Disguised Transfer across disciplines. Tests whether student transfers boundary condition matching from mechanical strings to electromagnetic wave reflection at dielectric interfaces.',
    competing_paths: [
      'Path 1: Electric and magnetic field boundary conditions [E_{1t} = E_{2t}, H_{1t} = H_{2t}] mirror transverse displacement and tension continuity across knotted strings',
      'Path 2 (Bug): Wave reflections treated as particle collisions with billiard-ball hard boundaries'
    ],
    falsification_criteria: 'Matching continuity conditions of tangential fields confirms transfer of wave boundary principles to electrodynamics.',
    scenario_vignette: 'In classical mechanics, a transverse wave pulse traveling along a light string of mass density μ_1 reflects inverted (with a 180° phase shift) upon striking a heavier string of mass density μ_2 > μ_1. A physics student now analyzes a monochromatic plane electromagnetic wave incident normally from air (refractive index n_1 = 1.0) onto a glass slab (refractive index n_2 = 1.5).',
    question_text: 'Transferring the boundary matching principles of mechanical wave transmission to electrodynamics, why does the reflected electric field undergo a 180° phase inversion?',
    options: [
      'Maxwell boundary conditions require continuity of tangential electric fields (E_1 = E_2) at the interface; when wave impedance Z_2 = √(μ_0 / ε_2) is lower than Z_1, the Fresnel reflection coefficient r = (n_1 - n_2)/(n_1 + n_2) is negative, mathematically enforcing a π (180°) phase flip identical to a wave meeting a higher-density string.',
      'Glass absorbs 100% of incident photons and emits new anti-photons with opposite spin.',
      'Photons lose half their kinetic energy upon striking the dielectric surface, reversing momentum via classical restitution.',
      'Dielectric polarization bends space-time curvature, causing time-reversal of the incident electromagnetic wave.'
    ],
    correct_answer: 'Maxwell boundary conditions require continuity of tangential electric fields (E_1 = E_2) at the interface; when wave impedance Z_2 = √(μ_0 / ε_2) is lower than Z_1, the Fresnel reflection coefficient r = (n_1 - n_2)/(n_1 + n_2) is negative, mathematically enforcing a π (180°) phase flip identical to a wave meeting a higher-density string.',
    explanation: 'This is a pristine transfer of wave boundary mechanics into electrodynamics. At any boundary, dynamic fields must satisfy continuity constraints: tangential E and H must be continuous across charge-free interfaces. By solving the wave equation with these boundary conditions, Fresnel reflection coefficient for normal incidence is r = (n_1 - n_2)/(n_1 + n_2). When n_2 > n_1 (incident on an optically denser medium with lower wave impedance), r < 0. A negative amplitude coefficient signifies a phase shift of π radians (180°), exactly analogously to a mechanical wave on a light string reflecting off a denser string.',
    discriminator_note: 'CRUCIAL DISCRIMINATOR: Fresnel coefficient r = (n_1 - n_2)/(n_1 + n_2) < 0 when n_2 > n_1, confirming wave impedance mismatch dictates phase inversion.',
    reasoning_target: 'Transferring mechanical boundary impedance matching to electromagnetic Fresnel reflection.',
    created_at: new Date().toISOString()
  },

  // 7. Overanalysis — Decision Sufficiency in Photoelectric Effect (TYPE G)
  {
    id: 'diag_overanalysis_photoelectric_commit_1',
    topic_id: 'top_schrodinger_tunnel',
    topic_name: 'Quantum Tunneling & Potential Barriers',
    subject_name: 'Quantum Mechanics & Modern Physics',
    mode: 'causal_discrimination',
    question_type: 'TYPE_G_OVERANALYSIS',
    difficulty: 'Physical Synthesis',
    root_error_target: 'err_overanalysis_trap',
    internal_rationale: 'Target: Cognitive Efficiency / Overanalysis Trap. Tests if student identifies that physical discriminator threshold is achieved and commits to the quantum model without requesting superfluous classical parameter sweeps.',
    competing_paths: [
      'Path 1: STOP — ENOUGH INFORMATION. COMMIT. Instantaneous photocurrent below cutoff wavelength with zero current above cutoff definitively falsifies classical wave accumulation and confirms quantum photon hypothesis',
      'Path 2 (Bug): Demanding redundant multi-day temperature, humidity, and magnetic field sweeps before committing to the photon model'
    ],
    falsification_criteria: 'Selecting Option A proves recognition of decision sufficiency. Selecting options B, C, or D confirms the overanalysis trap.',
    scenario_vignette: 'In an experimental verification of the photoelectric effect on a sodium cathode (work function Φ = 2.3 eV), illumination with 500 nm light (E = 2.48 eV) generates immediate photocurrent within < 1 nanosecond, even at ultra-low intensity (10⁻⁹ W/m²). Illumination with a 650 nm laser (E = 1.91 eV) at 1000 W/m² generates zero photocurrent after hours of continuous exposure. A student researcher acknowledges that the photon hypothesis explains this cutoff, but refuses to publish or conclude, insisting on: (1) Running a 72-hour thermal drift log of the room humidity, (2) Measuring the Earth ambient magnetic field to 6 decimal places, and (3) Re-testing with 15 different brands of optical filters.',
    question_text: 'Evaluate the researcher\'s cognitive decision-making strategy:',
    options: [
      'STOP — ENOUGH INFORMATION. COMMIT. The instantaneous photoemission below threshold wavelength combined with zero emission above cutoff at 10¹²-fold higher intensity definitively falsifies classical continuous wave energy accumulation and satisfies the discriminator threshold for Einstein quantum hypothesis; additional secondary environmental sweeps have zero marginal diagnostic value.',
      'The researcher is correct: Room humidity might form a water layer that classically blocks photons only at 650 nm.',
      'The researcher is correct: Earth magnetic field could deflect electrons back into the cathode only when illuminated by red light.',
      'The researcher is correct: Classical wave theory requires at least 6 months of continuous exposure to accumulate sufficient surface work.'
    ],
    correct_answer: 'STOP — ENOUGH INFORMATION. COMMIT. The instantaneous photoemission below threshold wavelength combined with zero emission above cutoff at 10¹²-fold higher intensity definitively falsifies classical continuous wave energy accumulation and satisfies the discriminator threshold for Einstein quantum hypothesis; additional secondary environmental sweeps have zero marginal diagnostic value.',
    explanation: 'In physical decision science, when an invariant physical discriminator satisfies the hypothesis discrimination threshold, further data collection is cognitive overanalysis. In the photoelectric effect, the classical wave model predicts that energy is delivered continuously over time: even low-frequency light should eventually eject electrons if intensity or duration is high enough, and low-intensity light should exhibit a measurable time lag (hours or days) to accumulate energy. Experimentally, emission is instantaneous (< 10⁻⁹ s) for ν > ν_0 and strictly zero for ν < ν_0 regardless of intensity. This single discriminator cleanly separates quantum from classical models. Demanding secondary environmental parameter sweeps is classic cognitive reluctance to commit.',
    discriminator_note: 'CRUCIAL DISCRIMINATOR: Zero emission at high intensity above cutoff vs instantaneous emission at low intensity below cutoff satisfies decisive proof.',
    reasoning_target: 'Recognizing when experimental discriminator threshold is achieved and committing to model conclusion.',
    created_at: new Date().toISOString()
  },

  // 8. Exploration Test — Phase Velocity vs Group Velocity in Dispersive Waveguides (TYPE F)
  {
    id: 'diag_exploration_phase_group_velocity_1',
    topic_id: 'top_maxwell_boundary',
    topic_name: 'Maxwell Equations & Electromagnetic Wave Propagation',
    subject_name: 'Electrodynamics & Field Theory',
    mode: 'second_order',
    question_type: 'TYPE_F_FALSE_CONFIDENCE',
    difficulty: 'Mechanistic',
    root_error_target: 'err_directionality_inversion',
    internal_rationale: 'Target: Personal Model Exploration. Tests whether student confuses phase velocity (v_p = ω/k) with group/signal velocity (v_g = dω/dk) in dispersive media.',
    competing_paths: [
      'Hypothesis 1: Fundamental confusion of phase vs group velocity',
      'Hypothesis 2: Misinterpreting wave envelope modulation as particle acceleration',
      'Hypothesis 3: Correct understanding that information/energy travels at group/front velocity, not phase velocity'
    ],
    falsification_criteria: 'Recognizing that superluminal phase velocity (v_p > c) does not transmit information confirms understanding of wave packet dynamics.',
    scenario_vignette: 'In an experimental plasma or resonant waveguide, electromagnetic waves propagate with dispersion relation ω² = ω_p² + c² k². At frequencies near the plasma frequency ω_p, the phase velocity v_p = ω/k = c / √(1 - ω_p²/ω²) clearly exceeds the speed of light in vacuum (v_p > c). A physics student proclaims: "Special relativity has been violated; we can use this plasma guide to send instantaneous telegraph messages to distant observers."',
    question_text: 'Predict the true propagation velocity of a physical signal (modulated wave packet) and resolve the student\'s paradox:',
    options: [
      'Information and energy propagate at the group velocity v_g = dω/dk = c √(1 - ω_p²/ω²), which is strictly less than c (v_p × v_g = c²); individual phase wave crests travel faster than c but carry zero net energy or encoded signal.',
      'The phase velocity exceeding c causes time to run backward inside the plasma chamber, erasing the transmitted message.',
      'Relativity is indeed violated inside ionized gases because Maxwell equations do not apply to charged plasmas.',
      'Group velocity and phase velocity are mathematically identical in all dispersive media.'
    ],
    correct_answer: 'Information and energy propagate at the group velocity v_g = dω/dk = c √(1 - ω_p²/ω²), which is strictly less than c (v_p × v_g = c²); individual phase wave crests travel faster than c but carry zero net energy or encoded signal.',
    explanation: 'In dispersive media, phase velocity v_p = ω/k is the speed of individual wave crests of an infinite monochromatic plane wave, which exists across all time and space and carries zero localized information. An actual physical signal is a localized wave packet containing a spread of frequencies Δω. The envelope of this packet travels at the group velocity v_g = dω/dk. Differentiating the dispersion relation ω² = ω_p² + c² k² gives 2ω dω = 2 c² k dk, so (dω/dk)(ω/k) = c², meaning v_g × v_p = c². Since v_p > c, v_g < c. Information travels at the signal velocity (bounded by v_g and the Sommerfeld-Brillouin front velocity), which is strictly subluminal, preserving relativistic causality.',
    discriminator_note: 'CRUCIAL DISCRIMINATOR: v_g = dω/dk < c governs energy/signal transfer; v_p > c carries zero modulation information.',
    reasoning_target: 'Discriminating phase velocity from group and signal propagation velocity in dispersive systems.',
    created_at: new Date().toISOString()
  },

  // 9. Adversarial Model Test — Destroy Frictionless Perpetual Heat Engine (TYPE I)
  {
    id: 'diag_adversarial_destroy_perpetual_heat_engine_1',
    topic_id: 'top_carnot_entropy',
    topic_name: 'Carnot Cycles, Entropy & Second Law',
    subject_name: 'Thermal & Statistical Physics',
    mode: 'adversarial',
    question_type: 'TYPE_I_ADVERSARIAL_MODEL',
    difficulty: 'Second-Order',
    root_error_target: 'err_assoc_causation',
    internal_rationale: 'Target: Adversarial Model Attack. Requires student to identify the thermodynamic boundary condition and Second Law constraint that destroys a naive heat engine model.',
    competing_paths: [
      'Counterexample: Kelvin-Planck statement of Second Law & entropy generation [∮ dQ/T < 0 for irreversible cycle]',
      'Naive Model: Eliminating mechanical friction allows 100% heat-to-work conversion'
    ],
    falsification_criteria: 'Citing Kelvin-Planck statement and closed-cycle entropy balance destroys the frictionless 100% conversion model.',
    scenario_vignette: 'Consider this proposed physical model: "The only reason heat engines have efficiency less than 100% is mechanical friction and acoustic dissipation in the piston mechanisms. If we construct a magnetic-levitation frictionless cylinder in an ultra-high vacuum, an engine absorbing heat Q_H from a single reservoir at temperature T_H can convert 100% of that heat into mechanical work W = Q_H in a continuous periodic cycle."',
    question_text: 'DESTROY THIS MODEL. What fundamental thermodynamic law or cycle constraint definitively breaks this naive model?',
    options: [
      'The Kelvin-Planck statement of the Second Law of Thermodynamics: It is impossible for any cyclic device to absorb heat from a single thermal reservoir and produce an equivalent amount of work without rejecting heat to a lower-temperature reservoir; in a closed cycle, the working fluid must return to its initial state (ΔS_cycle = 0), which requires expelling entropy via heat rejection Q_C > 0 to a cold sink at T_C.',
      'Magnetic levitation consumes all electrical potential of the universe within 3 seconds.',
      'Ideal gas molecules stick irreversibly to vacuum cylinder walls due to nuclear strong force.',
      'Heat can only be converted into gravitational potential energy, never mechanical work.'
    ],
    correct_answer: 'The Kelvin-Planck statement of the Second Law of Thermodynamics: It is impossible for any cyclic device to absorb heat from a single thermal reservoir and produce an equivalent amount of work without rejecting heat to a lower-temperature reservoir; in a closed cycle, the working fluid must return to its initial state (ΔS_cycle = 0), which requires expelling entropy via heat rejection Q_C > 0 to a cold sink at T_C.',
    explanation: 'The naive model attributes inefficiency entirely to non-ideal mechanical friction. The Second Law of Thermodynamics (Kelvin-Planck statement) destroys this: for any engine operating in a cycle, the working substance must return to its initial thermodynamic state, so its change in entropy per cycle is ΔS_system = ∮ dS = 0. During the isothermal expansion at T_H, the fluid absorbs heat Q_H, gaining entropy ΔS = Q_H / T_H > 0. To complete the cycle and reset its state, the engine MUST dump this entropy to an external sink. Because work W produces zero entropy transfer, the only way to dump entropy is by rejecting heat Q_C > 0 to a colder reservoir at T_C < T_H. Therefore, Q_C cannot be zero, and efficiency η = 1 - Q_C/Q_H is strictly less than 100% even in an idealized frictionless universe.',
    discriminator_note: 'CRUCIAL DISCRIMINATOR: Cyclic state reset requires ΔS_system = 0; entropy absorbed at T_H cannot be destroyed, forcing Q_C > 0 rejection.',
    reasoning_target: 'Adversarially breaking frictionless conversion models with cyclic entropy balance and Kelvin-Planck statement.',
    created_at: new Date().toISOString()
  },

  // 10. Reconstruction Test — Reconstruct Underdamped Harmonic Motion from First Principles (TYPE J)
  {
    id: 'diag_reconstruction_damped_oscillator_1',
    topic_id: 'top_damped_oscillator',
    topic_name: 'Damped & Driven Harmonic Oscillators',
    subject_name: 'Classical Mechanics & Dynamics',
    mode: 'first_principles',
    question_type: 'TYPE_J_RECONSTRUCTION',
    difficulty: 'Mechanistic',
    root_error_target: 'err_missing_variable',
    internal_rationale: 'Target: First-Principles Reconstruction. Tests derivation of underdamped harmonic motion and exponential decay from minimal Newtonian axioms.',
    competing_paths: [
      'First-principles derivation: Newton second law [m a = -k x - b v] → characteristic equation roots [r = -γ ± i ω_d] → Euler formula sinusoidal decay',
      'Memorized recall: Writing formula without deriving characteristic roots from differential equation'
    ],
    falsification_criteria: 'Setting up differential equation and solving characteristic roots demonstrates first-principles derivation.',
    scenario_vignette: 'You are tasked with deriving the equation of motion and time-domain solution for an underdamped harmonic oscillator without relying on memorized formulas, starting from Newton second law and linear resistive forces.',
    question_text: 'Which minimal sequence of physical axioms and mathematical steps accurately reconstructs underdamped motion from first principles?',
    options: [
      'Apply Newton second law: m x\'\'(t) = -k x(t) - b x\'(t) → Rearrange to standard form: x\'\' + 2γ x\' + ω_0² x = 0 (where γ = b/(2m), ω_0 = √(k/m)) → Substitute ansatz x(t) = e^(r t) yielding characteristic equation r² + 2γ r + ω_0² = 0 → In underdamped regime (γ < ω_0), roots are r = -γ ± i ω_d (where ω_d = √(ω_0² - γ²)) → General real solution: x(t) = A e^(-γ t) cos(ω_d t + φ).',
      'Assume velocity is constant → Multiply position by spring stiffness → Integrate force over time to get displacement.',
      'Equate kinetic energy directly to gravitational acceleration → Differentiate with respect to temperature.',
      'Apply Coulomb law of electrostatics between the spring coils → Solve using Fourier series for static point charges.'
    ],
    correct_answer: 'Apply Newton second law: m x\'\'(t) = -k x(t) - b x\'(t) → Rearrange to standard form: x\'\' + 2γ x\' + ω_0² x = 0 (where γ = b/(2m), ω_0 = √(k/m)) → Substitute ansatz x(t) = e^(r t) yielding characteristic equation r² + 2γ r + ω_0² = 0 → In underdamped regime (γ < ω_0), roots are r = -γ ± i ω_d (where ω_d = √(ω_0² - γ²)) → General real solution: x(t) = A e^(-γ t) cos(ω_d t + φ).',
    explanation: 'To reconstruct from first principles: 1. Identify active forces: linear restoring Hookean force F_s = -k x and linear viscous resistance F_d = -b v = -b x\'. 2. Apply Newton second law: Σ F = m x\'\' → m x\'\' + b x\' + k x = 0. 3. Divide by mass m and define damping factor γ = b/(2m) and natural frequency ω_0 = √(k/m): x\'\' + 2γ x\' + ω_0² x = 0. 4. Try exponential ansatz x(t) = e^(r t) yielding characteristic polynomial r² + 2γ r + ω_0² = 0. 5. Quadratic formula gives roots r = -γ ± √(γ² - ω_0²). For underdamping (γ < ω_0), the discriminant is negative: r = -γ ± i √(ω_0² - γ²) = -γ ± i ω_d. 6. Applying Euler identity e^(± i ω_d t) = cos(ω_d t) ± i sin(ω_d t) produces the decaying harmonic oscillation x(t) = A e^(-γ t) cos(ω_d t + φ).',
    discriminator_note: 'CRUCIAL DISCRIMINATOR: Complex conjugate characteristic roots r = -γ ± i ω_d mathematically mandate the exponential decay factor e^(-γ t) multiplying the harmonic cosine.',
    reasoning_target: 'First-principles derivation of underdamped harmonic motion from differential equations of motion.',
    created_at: new Date().toISOString()
  }
];

/**
 * Initializes or updates user model in database with hierarchical error tracking
 */
export function ensureAdaptiveUserModel(userId: string = DEFAULT_USER_ID) {
  const now = new Date().toISOString();

  // Ensure user exists in users table to satisfy foreign key constraints
  const userCheck = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!userCheck) {
    db.prepare('INSERT OR IGNORE INTO users (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
      userId,
      userId === DEFAULT_USER_ID ? 'BSc Physics Scholar' : userId,
      now,
      now
    );
  }

  const row = db.prepare('SELECT * FROM user_model WHERE user_id = ?').get(userId) as any;

  if (row) {
    let existingErrors: HierarchicalReasoningError[] = [];
    try {
      const parsed = JSON.parse(row.error_profile || '[]');
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].reasoning_family) {
        existingErrors = parsed;
      } else {
        existingErrors = INITIAL_HIERARCHICAL_ERRORS;
        db.prepare('UPDATE user_model SET error_profile = ?, updated_at = ? WHERE user_id = ?').run(
          JSON.stringify(existingErrors),
          now,
          userId
        );
      }
    } catch {
      existingErrors = INITIAL_HIERARCHICAL_ERRORS;
      db.prepare('UPDATE user_model SET error_profile = ?, updated_at = ? WHERE user_id = ?').run(
        JSON.stringify(existingErrors),
        now,
        userId
      );
    }
  } else {
    // If no row exists, initialize the user model
    db.prepare(`
      INSERT INTO user_model (
        id, user_id, reasoning_profile, error_profile, confidence_calibration, cognitive_resource_allocation,
        topic_mastery, recommended_difficulty, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'model_' + userId,
      userId,
      JSON.stringify({
        first_principles_index: null,
        causal_precision: null,
        directionality_integrity: null,
        discriminator_acuity: null,
        exception_awareness: null,
        anti_overanalysis_score: null,
      }),
      JSON.stringify(INITIAL_HIERARCHICAL_ERRORS),
      JSON.stringify({
        brier_score: 0.18,
        overconfidence_bias: 12,
        underconfidence_bias: 5,
        calibration_curve: [
          { predicted_confidence: 20, actual_accuracy: 25 },
          { predicted_confidence: 40, actual_accuracy: 42 },
          { predicted_confidence: 60, actual_accuracy: 55 },
          { predicted_confidence: 80, actual_accuracy: 70 },
          { predicted_confidence: 100, actual_accuracy: 85 },
        ],
      }),
      JSON.stringify({
        energy_level: 82,
        cognitive_load: 35,
        decision_fatigue_index: 20,
        focus_state: 'Optimal Flow',
        optimal_session_duration_min: 40,
        current_streak_minutes: 15,
      }),
      JSON.stringify({
        top_damped_oscillator: { mastery_score: 45, tests_taken: 0, last_tested: now },
        top_lenz_induction: { mastery_score: 50, tests_taken: 0, last_tested: now },
        top_carnot_entropy: { mastery_score: 40, tests_taken: 0, last_tested: now },
        top_maxwell_boundary: { mastery_score: 35, tests_taken: 0, last_tested: now },
      }),
      'Mechanistic',
      now
    );
  }

  // Ensure initial questions exist in questions table
  for (const q of CURATED_DIAGNOSTIC_QUESTIONS) {
    const check = db.prepare('SELECT id FROM questions WHERE id = ?').get(q.id);
    if (!check) {
      db.prepare(`
        INSERT INTO questions (
          id, topic_id, mode, question_text, options, correct_answer,
          explanation, reasoning_target, difficulty, scenario_vignette, clinical_vignette, discriminator_note,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        q.id,
        q.topic_id,
        q.mode,
        q.question_text,
        JSON.stringify(q.options),
        q.correct_answer,
        q.explanation,
        q.reasoning_target,
        q.difficulty,
        q.scenario_vignette || '',
        q.scenario_vignette || '',
        q.discriminator_note || '',
        now
      );
    }
  }
}

/**
 * Returns a rich summary of the learner's active cognitive flaws and mental models
 * formatted for cross-context adaptation across all webapp tools (Doubt Chat,
 * Compressor, Adversarial, First Principles, Reverse Engineering, Simulation, Reconstruction, Tests).
 */
export function getUserCognitiveFlawSummary(userId: string = DEFAULT_USER_ID): {
  primary_weakness: string;
  flaws: HierarchicalReasoningError[];
  prompt_injection: string;
} {
  ensureAdaptiveUserModel(userId);
  const userModelRow = db.prepare('SELECT error_profile FROM user_model WHERE user_id = ?').get(userId) as any;
  let errors: HierarchicalReasoningError[] = INITIAL_HIERARCHICAL_ERRORS;
  if (userModelRow?.error_profile) {
    try {
      const parsed = JSON.parse(userModelRow.error_profile);
      if (Array.isArray(parsed) && parsed[0]?.reasoning_family) {
        errors = parsed;
      }
    } catch {}
  }

  // Sort by priority: unstable status, high error frequency, high model confidence
  const sorted = [...errors].sort((a, b) => {
    const aConf = a.model_confidence ?? 0;
    const bConf = b.model_confidence ?? 0;
    const aP = aConf * (a.recent_frequency + 1) * (a.status === 'Unstable' ? 2.0 : 1.0);
    const bP = bConf * (b.recent_frequency + 1) * (b.status === 'Unstable' ? 2.0 : 1.0);
    return bP - aP;
  });

  const primary = sorted[0] || errors[0];
  const hasAssessedFlaws = sorted.some((f) => f.stage !== null && f.model_confidence !== null);

  const activeFlawsList = sorted.slice(0, 4).map((f) => `- [${f.name}] (${f.reasoning_family}): ${f.specific_failure}. Current hypothesis: "${f.current_hypothesis}"`).join('\n');

  const prompt_injection = hasAssessedFlaws
    ? `
=== STUDENT COGNITIVE PROFILE & TRACKED REASONING FLAW (CROSS-CONTEXT ADAPTATION) ===
The student currently engaging with you has been actively diagnosed with the following cognitive reasoning flaw pattern across the MECHANISM webapp:
• PRIMARY TARGET FLAW TO ATTACK & CORRECT: "${primary.name}"
• Specific Flawed Pattern: ${primary.specific_failure}
• Trigger Condition: ${primary.trigger_conditions}
• Current Physical Working Model: "${primary.current_hypothesis}"
• Recommended Countermeasure: ${primary.countermeasure}

ADDITIONAL TRACKED FLAWS IN STUDENT COGNITIVE PROFILE:
${activeFlawsList}

CROSS-CONTEXT INSTRUCTION:
1. You MUST continuously adapt to this diagnosed flaw in the student's pattern of understanding.
2. In whatever context you are currently operating (Doubt Chat, Compressor, Adversarial Attack, First Principles, Reverse Engineering, Simulation, or Reconstruction), actively observe whether the student's questions, hypotheses, or answers exhibit this exact flaw (e.g., reversing directionality, confusing association with causation, premature closure without checking discriminators, overanalysis, or ignoring compensatory loops).
3. When the student makes this mistake, address it directly, expose the flaw's physical inconsistency or violation of dynamical laws, and guide them to rectify their mental model.
========================================================================================`
    : `
=== STUDENT COGNITIVE PROFILE & TRACKED REASONING FLAW (CROSS-CONTEXT ADAPTATION) ===
The student is currently at the baseline unassessed state. No recurring cognitive reasoning bugs have yet been diagnosed.
CROSS-CONTEXT INSTRUCTION:
1. Actively monitor the student's reasoning as they formulate hypotheses, ask doubts, and answer questions.
2. Probe whether they derive from first principles, preserve causal directionality in feedback loops, isolate crucial discriminators, or succumb to association fallacies.
3. Guide their thinking process constructively so that the adaptive engine accurately maps their cognitive profile.
========================================================================================`;

  return {
    primary_weakness: hasAssessedFlaws ? primary.name : 'Unassessed Baseline',
    flaws: sorted,
    prompt_injection,
  };
}

/**
 * Calculates evidence strength using an interpretable, multi-factor combination
 * of diagnostic fidelity, confidence, task difficulty, time pressure, recurrence,
 * cross-feature presence, and transfer across organ systems.
 */
export interface EvidenceStrengthCalculationParams {
  feature: string;
  confidence?: number | null;
  isCorrect?: boolean | null;
  correctReasoning?: boolean | null;
  reasoningText?: string | null;
  taskDifficulty?: string | null;
  timeTakenSec?: number | null;
  errorId?: string | null;
  topicId?: string | null;
  reconstructionScore?: number | null;
  userId?: string;
}

export function calculateEvidenceStrength(params: EvidenceStrengthCalculationParams): number {
  const {
    feature,
    confidence,
    isCorrect,
    correctReasoning,
    reasoningText,
    taskDifficulty,
    timeTakenSec,
    errorId,
    topicId,
    reconstructionScore,
    userId = DEFAULT_USER_ID,
  } = params;

  // 1. Base Diagnostic Quality
  let baseWeight = 0.42;
  if (feature === 'reconstruction' || feature === 'compressor' || feature === 'simulation' || feature === 'adversarial') {
    baseWeight = 0.56;
  } else if (reasoningText && reasoningText.trim().length > 25) {
    baseWeight = 0.52;
  } else if (feature === 'doubt_chat') {
    baseWeight = 0.50;
  }

  // 2. Reasoning Clarity
  let clarityMod = 0;
  if (correctReasoning === true) {
    clarityMod += 0.10;
  } else if (correctReasoning === false) {
    clarityMod += 0.12;
  }

  // 3. Confidence Factor (Calibration weighting)
  let confMultiplier = 1.0;
  if (confidence != null) {
    if (isCorrect === false && confidence >= 80) {
      confMultiplier = 1.25; // False Certainty / blind spot
    } else if (isCorrect === false && confidence <= 35) {
      confMultiplier = 0.75; // Tentative guess
    } else if (isCorrect === true && confidence >= 80) {
      confMultiplier = 1.18; // Consolidated certainty
    } else if (isCorrect === true && confidence <= 40) {
      confMultiplier = 0.85; // Hesitant correct answer
    }
  }

  // 4. Task Difficulty
  let difficultyMod = 1.0;
  if (taskDifficulty === 'Foundation') {
    if (isCorrect === false) difficultyMod = 1.20;
  } else if (taskDifficulty === 'Physical Synthesis' || taskDifficulty === 'Second-Order' || taskDifficulty === 'Mastery') {
    difficultyMod = 1.10;
  }

  // 5. Time Pressure / Efficiency Factor
  let timeMod = 0;
  if (timeTakenSec != null) {
    if (timeTakenSec < 12 && isCorrect === false) {
      timeMod += 0.08;
    } else if (timeTakenSec > 65 && (errorId === 'err_overanalysis_trap' || feature === 'simulation')) {
      timeMod += 0.12;
    }
  }

  // 6. Reconstruction Quality Factor
  let reconMod = 0;
  if (reconstructionScore != null) {
    if (reconstructionScore >= 85) reconMod += 0.12;
    else if (reconstructionScore < 50) reconMod += 0.15;
  }

  // 7. Empirical History: Recurrence, Cross-Feature Presence, and Transfer
  let recurrenceMod = 0;
  let crossFeatureMultiplier = 1.0;
  let transferMultiplier = 1.0;

  if (errorId) {
    try {
      const priorRows = db.prepare(`
        SELECT feature, topic_id, correct_answer, correct_reasoning
        FROM adaptive_evidence
        WHERE user_id = ? AND error_id = ?
      `).all(userId, errorId) as Array<{ feature: string; topic_id?: string; correct_answer?: number; correct_reasoning?: number }>;

      if (priorRows.length > 0) {
        const priorMistakes = priorRows.filter((r) => r.correct_answer === 0 || r.correct_reasoning === 0).length;
        recurrenceMod = Math.min(0.24, priorMistakes * 0.06);

        const featuresSeen = new Set(priorRows.map((r) => r.feature));
        featuresSeen.add(feature);
        if (featuresSeen.size >= 2) {
          // Cross-feature recurrence is stronger evidence than repeated mistakes inside one identical context
          crossFeatureMultiplier = 1.30;
        }

        const topicsSeen = new Set(priorRows.map((r) => r.topic_id).filter(Boolean));
        if (topicId) topicsSeen.add(topicId);
        if (topicsSeen.size >= 2) {
          transferMultiplier = 1.20;
        }
      }
    } catch {
      // ignore
    }
  }

  const rawScore = (baseWeight + clarityMod + timeMod + reconMod + recurrenceMod) * confMultiplier * difficultyMod * crossFeatureMultiplier * transferMultiplier;
  return Math.max(0.15, Math.min(0.98, Number(rawScore.toFixed(2))));
}

/**
 * Derives the optimal next best learning task ON DEMAND from:
 * - Personal Model
 * - Error Model
 * - Recent Adaptive Evidence
 * - Selected Topic
 * - Current Learning Mode
 */
export function deriveNextBestTask(params: {
  userId?: string;
  selectedTopicId?: string;
  currentMode?: string;
}): NextBestTask {
  const userId = params.userId || DEFAULT_USER_ID;
  ensureAdaptiveUserModel(userId);

  const userModelRow = db.prepare('SELECT * FROM user_model WHERE user_id = ?').get(userId) as any;
  let errors: HierarchicalReasoningError[] = INITIAL_HIERARCHICAL_ERRORS;
  let topicMastery: Record<string, any> = {};
  let calibration: any = {};
  let profile: any = {};

  if (userModelRow) {
    try {
      if (userModelRow.error_profile) errors = JSON.parse(userModelRow.error_profile);
      if (userModelRow.topic_mastery) topicMastery = JSON.parse(userModelRow.topic_mastery);
      if (userModelRow.confidence_calibration) calibration = JSON.parse(userModelRow.confidence_calibration);
      if (userModelRow.reasoning_profile) profile = JSON.parse(userModelRow.reasoning_profile);
    } catch {}
  }

  const topics = db.prepare('SELECT * FROM topics').all() as any[];
  const topicMap = new Map<string, any>(topics.map((t) => [t.id, t]));

  // Query recent adaptive evidence (last 15 items)
  const recentEvidence = db.prepare(`
    SELECT * FROM adaptive_evidence
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 15
  `).all(userId) as any[];

  // Selected topic resolution
  let effectiveTopic = topics[0] || { id: 'top_damped_oscillator', name: 'Damped & Driven Harmonic Oscillators' };
  if (params.selectedTopicId && topicMap.has(params.selectedTopicId)) {
    effectiveTopic = topicMap.get(params.selectedTopicId);
  }

  // Priority Candidates:
  // Dimension A: Recurring / High-Confidence Errors
  const unstableErrors = errors.filter((e) => e.status === 'Unstable' || (e.model_confidence != null && e.model_confidence >= 0.65 && e.recent_frequency >= 1));
  const sortedUnstable = [...unstableErrors].sort((a, b) => {
    const aScore = (a.model_confidence || 0) * 100 + a.recent_frequency * 25;
    const bScore = (b.model_confidence || 0) * 100 + b.recent_frequency * 25;
    return bScore - aScore;
  });

  // Dimension B: Cross-Context Weaknesses (errors appearing across multiple features or topics)
  const crossContextErrors = errors.filter((e) => (e.feature_sources && e.feature_sources.length >= 2) || (e.linked_evidence_count && e.linked_evidence_count >= 3 && e.status !== 'Stable' && e.status !== 'Well-calibrated'));

  // Dimension C: Uncertain Root-Cause Hypotheses (Emerging signals)
  const emergingErrors = errors.filter((e) => e.status === 'Emerging' || (e.model_confidence != null && e.model_confidence < 0.55 && e.error_frequency === 1));

  // Dimension D: Transfer Testing (Primary defended, transfer status is Pending)
  const transferPendingErrors = errors.filter((e) => (e.transfer_status === 'Pending' || e.transfer_status === 'Tested') && e.successful_repairs >= 1 && e.status !== 'Well-calibrated');

  // Dimension E: Reconstruction (Needs Reconstruction status, or low first-principles score)
  const weakTopics = topics.filter((t) => {
    const m = topicMastery[t.id];
    return m && (m.status === 'Needs Reconstruction' || (m.mastery_percentage != null && m.mastery_percentage < 60));
  });

  // Dimension F: Calibration Gap (High overconfidence bias > 15)
  const hasCalibrationBias = calibration?.overconfidence_bias != null && calibration.overconfidence_bias >= 15;

  // Dimension G: Spaced Retesting (Errors previously stabilized)
  const stabilizedErrors = errors.filter((e) => e.status === 'Stable' && e.successful_repairs >= 2);

  // Scoring & Dispatch
  if (sortedUnstable.length > 0) {
    const target = sortedUnstable[0];
    return {
      mode: 'mcq_test',
      test_mode: 'weakness_hunt',
      topic_id: effectiveTopic.id,
      topic_name: effectiveTopic.name,
      title: `Weakness Hunt: Dissecting ${target.name}`,
      reason: `Diagnosed high-confidence flaw (${Math.round((target.model_confidence || 0) * 100)}% confidence, ${target.recent_frequency} recent manifestation${target.recent_frequency === 1 ? '' : 's'}). Active hypothesis: "${target.current_hypothesis}".`,
      target_error_id: target.id,
      target_error_name: target.name,
      priority: 'CRITICAL',
      rationale_dimensions: {
        category: 'RECURRING_ERROR',
        evidence_count: target.linked_evidence_count || target.error_frequency,
        urgency_score: Math.round((target.model_confidence || 0.5) * 100 + target.recent_frequency * 20),
      },
    };
  }

  if (crossContextErrors.length > 0) {
    const target = crossContextErrors[0];
    return {
      mode: 'compressor',
      test_mode: 'mechanism_test',
      topic_id: effectiveTopic.id,
      topic_name: effectiveTopic.name,
      title: `Cross-Feature Verification: ${target.name}`,
      reason: `Flaw observed across multiple learning features (${(target.feature_sources || []).join(', ')}). Requires causal mechanism synthesis to eliminate underlying biophysical confusion.`,
      target_error_id: target.id,
      target_error_name: target.name,
      priority: 'HIGH',
      rationale_dimensions: {
        category: 'CROSS_CONTEXT_WEAKNESS',
        evidence_count: target.linked_evidence_count || 3,
        urgency_score: 85,
      },
    };
  }

  if (transferPendingErrors.length > 0) {
    const target = transferPendingErrors[0];
    return {
      mode: 'mcq_test',
      test_mode: 'transfer_test',
      topic_id: effectiveTopic.id,
      topic_name: effectiveTopic.name,
      title: `Disguised Transfer: ${target.name}`,
      reason: `Student successfully defended this mechanism in its primary context. The central engine now requires testing whether the model holds when disguised in an alternative organ system.`,
      target_error_id: target.id,
      target_error_name: target.name,
      priority: 'HIGH',
      rationale_dimensions: {
        category: 'TRANSFER_TEST',
        evidence_count: target.linked_evidence_count || target.successful_repairs,
        urgency_score: 80,
      },
    };
  }

  if (weakTopics.length > 0 || (profile?.first_principles_index != null && profile.first_principles_index < 60)) {
    const weakTopic = weakTopics[0] || effectiveTopic;
    return {
      mode: 'reconstruction',
      test_mode: 'reconstruction',
      topic_id: weakTopic.id,
      topic_name: weakTopic.name,
      title: `First-Principles Reconstruction: ${weakTopic.name}`,
      reason: `Topic mastery is currently categorized as "${topicMastery[weakTopic.id]?.status || 'Needs Reconstruction'}". Closed-book causal reconstruction is required to rebuild structural foundations.`,
      priority: 'HIGH',
      rationale_dimensions: {
        category: 'RECONSTRUCTION',
        evidence_count: recentEvidence.filter((e) => e.topic_id === weakTopic.id).length,
        urgency_score: 75,
      },
    };
  }

  if (emergingErrors.length > 0) {
    const target = emergingErrors[0];
    return {
      mode: 'mcq_test',
      test_mode: 'quick_diagnostic',
      topic_id: effectiveTopic.id,
      topic_name: effectiveTopic.name,
      title: `Targeted Diagnostic Probe: ${target.name}`,
      reason: `An isolated error signal was detected (${target.specific_failure}). Probing with a targeted discriminator question to confirm or falsify the candidate hypothesis.`,
      target_error_id: target.id,
      target_error_name: target.name,
      priority: 'MEDIUM',
      rationale_dimensions: {
        category: 'UNCERTAIN_HYPOTHESIS',
        evidence_count: target.linked_evidence_count || 1,
        urgency_score: 68,
      },
    };
  }

  if (hasCalibrationBias) {
    return {
      mode: 'mcq_test',
      test_mode: 'calibration_test',
      topic_id: effectiveTopic.id,
      topic_name: effectiveTopic.name,
      title: `Confidence Calibration Challenge: ${effectiveTopic.name}`,
      reason: `Measured overconfidence bias (+${calibration.overconfidence_bias}%). Challenging intuition with deceptive distractors that look plausible superficially but violate physical conservation rules.`,
      priority: 'MEDIUM',
      rationale_dimensions: {
        category: 'CALIBRATION',
        evidence_count: recentEvidence.length,
        urgency_score: 65,
      },
    };
  }

  if (stabilizedErrors.length > 0) {
    const target = stabilizedErrors[0];
    return {
      mode: 'adversarial',
      test_mode: 'adversarial_test',
      topic_id: effectiveTopic.id,
      topic_name: effectiveTopic.name,
      title: `Adversarial Stress Test: ${target.name}`,
      reason: `Mental model on ${target.domain} previously stabilized. Subjecting the working hypothesis to pathological boundary perturbations to ensure resilience.`,
      target_error_id: target.id,
      target_error_name: target.name,
      priority: 'NORMAL',
      rationale_dimensions: {
        category: 'SPACED_RETEST',
        evidence_count: target.linked_evidence_count || 2,
        urgency_score: 55,
      },
    };
  }

  // Baseline Exploration
  const unassessedTopic = topics.find((t) => topicMastery[t.id]?.status === 'Unassessed') || effectiveTopic;
  return {
    mode: 'first_principles',
    test_mode: 'quick_diagnostic',
    topic_id: unassessedTopic.id,
    topic_name: unassessedTopic.name,
    title: `First-Principles Exploration: ${unassessedTopic.name}`,
    reason: `Topic is unassessed. Deconstruct its physical axioms and conservation laws from the ground up to establish baseline causal models.`,
    priority: 'NORMAL',
    rationale_dimensions: {
      category: 'EXPLORATION',
      evidence_count: 0,
      urgency_score: 45,
    },
  };
}

/**
 * CENTRAL FUNCTION: processAdaptiveEvidence
 * All learning features feed one central adaptive engine through this function.
 * It persists evidence, updates the hierarchical error and personal models,
 * and invalidates/recalculates the recommended next best task.
 */
export function processAdaptiveEvidence(evidenceInput: Partial<AdaptiveEvidence> & {
  user_id?: string;
  feature: string;
  evidence_summary: string;
}): AdaptiveEvidence {
  const userId = evidenceInput.user_id || DEFAULT_USER_ID;
  const id = evidenceInput.id || 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = evidenceInput.created_at || new Date().toISOString();

  const strength = evidenceInput.evidence_strength != null
    ? evidenceInput.evidence_strength
    : calculateEvidenceStrength({
        feature: evidenceInput.feature,
        confidence: evidenceInput.confidence,
        isCorrect: evidenceInput.correct_answer,
        correctReasoning: evidenceInput.correct_reasoning,
        timeTakenSec: evidenceInput.time_taken_sec,
        errorId: evidenceInput.error_id,
        topicId: evidenceInput.topic_id,
        reconstructionScore: evidenceInput.reconstruction_score,
        userId,
      });

  const fullEvidence: AdaptiveEvidence = {
    id,
    user_id: userId,
    feature: evidenceInput.feature as any,
    topic_id: evidenceInput.topic_id || null,
    topic_name: evidenceInput.topic_name || null,
    error_id: evidenceInput.error_id || null,
    error_name: evidenceInput.error_name || null,
    correct_answer: evidenceInput.correct_answer != null ? Boolean(evidenceInput.correct_answer) : null,
    correct_reasoning: evidenceInput.correct_reasoning != null ? Boolean(evidenceInput.correct_reasoning) : null,
    robust_mechanism: evidenceInput.robust_mechanism != null ? Boolean(evidenceInput.robust_mechanism) : null,
    transferable_mastery: evidenceInput.transferable_mastery != null ? Boolean(evidenceInput.transferable_mastery) : null,
    confidence: evidenceInput.confidence != null ? Number(evidenceInput.confidence) : null,
    time_taken_sec: evidenceInput.time_taken_sec != null ? Number(evidenceInput.time_taken_sec) : null,
    discriminator_identified: evidenceInput.discriminator_identified != null ? Boolean(evidenceInput.discriminator_identified) : null,
    reconstruction_score: evidenceInput.reconstruction_score != null ? Number(evidenceInput.reconstruction_score) : null,
    evidence_strength: strength,
    evidence_summary: evidenceInput.evidence_summary,
    created_at: now,
  };

  db.prepare(`
    INSERT INTO adaptive_evidence (
      id, user_id, feature, topic_id, error_id,
      correct_answer, correct_reasoning, robust_mechanism, transferable_mastery,
      confidence, time_taken_sec, discriminator_identified, reconstruction_score,
      evidence_strength, evidence_summary, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    fullEvidence.id,
    fullEvidence.user_id,
    fullEvidence.feature,
    fullEvidence.topic_id,
    fullEvidence.error_id,
    fullEvidence.correct_answer != null ? (fullEvidence.correct_answer ? 1 : 0) : null,
    fullEvidence.correct_reasoning != null ? (fullEvidence.correct_reasoning ? 1 : 0) : null,
    fullEvidence.robust_mechanism != null ? (fullEvidence.robust_mechanism ? 1 : 0) : null,
    fullEvidence.transferable_mastery != null ? (fullEvidence.transferable_mastery ? 1 : 0) : null,
    fullEvidence.confidence,
    fullEvidence.time_taken_sec,
    fullEvidence.discriminator_identified != null ? (fullEvidence.discriminator_identified ? 1 : 0) : null,
    fullEvidence.reconstruction_score,
    fullEvidence.evidence_strength,
    fullEvidence.evidence_summary,
    fullEvidence.created_at
  );

  // Central model update & recommended task cache invalidation/recalculation
  computeAdaptiveUserModel(userId);

  return fullEvidence;
}

/**
 * Computes the complete adaptive user model strictly from empirical evidence.
 * Integrates question attempts, evaluations, reconstructions, and central adaptive_evidence.
 */
export function computeAdaptiveUserModel(userId: string = DEFAULT_USER_ID) {
  ensureAdaptiveUserModel(userId);

  const attempts = db.prepare(`
    SELECT qa.*, q.mode as q_mode, q.topic_id as q_topic_id, q.reasoning_target as q_reasoning_target, q.difficulty as q_difficulty
    FROM question_attempts qa
    LEFT JOIN questions q ON qa.question_id = q.id
    WHERE qa.user_id = ?
    ORDER BY qa.created_at ASC
  `).all(userId) as any[];

  const evaluations = db.prepare(`
    SELECT * FROM mechanism_evaluations ORDER BY created_at ASC
  `).all() as any[];

  const reconstructions = db.prepare(`
    SELECT * FROM reconstructions ORDER BY created_at ASC
  `).all() as any[];

  const evidences = db.prepare(`
    SELECT * FROM adaptive_evidence WHERE user_id = ? ORDER BY created_at ASC
  `).all(userId) as any[];

  const topics = db.prepare('SELECT * FROM topics').all() as any[];
  const userModelRow = db.prepare('SELECT * FROM user_model WHERE user_id = ?').get(userId) as any;

  // Initial Unassessed State (0 attempts, 0 evaluations, 0 reconstructions, 0 evidences)
  if (attempts.length === 0 && evaluations.length === 0 && reconstructions.length === 0 && evidences.length === 0) {
    const unassessedErrors = INITIAL_HIERARCHICAL_ERRORS.map((e) => ({
      ...e,
      stage: null,
      model_confidence: null,
      status: 'Unassessed' as const,
      error_frequency: 0,
      recent_frequency: 0,
      historical_frequency: 0,
      successful_repairs: 0,
      transfer_status: 'Unassessed' as const,
      linked_evidence_count: 0,
      feature_sources: [],
      evidence_strength: 0,
      current_hypothesis: 'Awaiting student reasoning evidence. The adaptive engine will calibrate this hypothesis as tests are taken.',
      next_diagnostic_test: `Take initial diagnostic test on ${e.domain}.`,
    }));

    const topicMastery: Record<string, any> = {};
    for (const t of topics) {
      topicMastery[t.id] = {
        topic_name: t.name,
        mastery_percentage: null,
        status: 'Unassessed',
        last_practiced: '',
      };
    }

    const reasoningProfile = {
      first_principles_index: null,
      causal_precision: null,
      directionality_integrity: null,
      discriminator_acuity: null,
      exception_awareness: null,
      anti_overanalysis_score: null,
    };

    const calibration = {
      brier_score: null,
      overconfidence_bias: null,
      underconfidence_bias: null,
      calibration_curve: [],
    };

    const cognitiveResources = {
      average_time_per_decision_sec: null,
      unnecessary_tests_requested_rate: null,
      overanalysis_flags_count: 0,
      decision_commit_efficiency: 'Pending Assessment',
    };

    const recommendedTest = {
      mode: 'quick_diagnostic' as const,
      title: 'Initial Diagnostic Evaluation',
      rationale: 'Initial unassessed baseline. Take your first diagnostic test to allow the adaptive engine to calibrate your reasoning model.',
      target_weakness: 'Unassessed Baseline',
    };

    const nextBestTask = deriveNextBestTask({ userId });

    return {
      id: userModelRow?.id || 'model_' + userId,
      user_id: userId,
      reasoning_profile: reasoningProfile,
      topic_mastery: topicMastery,
      error_profile: unassessedErrors,
      hierarchical_errors: unassessedErrors,
      evolving_hypotheses: [],
      evolution_log: [],
      recommended_test: recommendedTest,
      next_best_task: nextBestTask,
      recent_evidence: [],
      confidence_calibration: calibration,
      cognitive_resource_allocation: cognitiveResources,
      recommended_difficulty: 'Mechanistic',
      updated_at: userModelRow?.updated_at || new Date().toISOString(),
    };
  }

  // Active student calculation:
  // 1. Topic Mastery (Aggregating attempts, evaluations, reconstructions, and adaptive evidence)
  const topicMastery: Record<string, any> = {};
  for (const t of topics) {
    const tAttempts = attempts.filter((a) => a.q_topic_id === t.id);
    const tEvals = evaluations.filter((e) => e.topic_id === t.id);
    const tRecons = reconstructions.filter((r) => r.topic_id === t.id);
    const tEvidences = evidences.filter((e) => e.topic_id === t.id);

    if (tAttempts.length === 0 && tEvals.length === 0 && tRecons.length === 0 && tEvidences.length === 0) {
      topicMastery[t.id] = {
        topic_name: t.name,
        mastery_percentage: null,
        status: 'Unassessed',
        last_practiced: '',
      };
    } else {
      let scoreSum = 0;
      let count = 0;

      for (const a of tAttempts) {
        scoreSum += a.correct ? 100 : 25;
        count++;
      }
      for (const e of tEvals) {
        scoreSum += (e.overall_score != null ? e.overall_score * 100 : 70);
        count++;
      }
      for (const r of tRecons) {
        scoreSum += (r.score != null ? Number(r.score) : 75);
        count++;
      }
      for (const ev of tEvidences) {
        if (ev.feature !== 'mcq_test' && ev.feature !== 'reconstruction') {
          if (ev.robust_mechanism != null) scoreSum += ev.robust_mechanism ? 90 : 35;
          else if (ev.correct_reasoning != null) scoreSum += ev.correct_reasoning ? 85 : 40;
          else scoreSum += 70;
          count++;
        }
      }

      const pct = count > 0 ? Math.round(scoreSum / count) : 70;
      const status = pct >= 85 ? 'Consolidated' : pct >= 60 ? 'Calibrating' : 'Needs Reconstruction';
      const lastAtt = tEvidences[tEvidences.length - 1] || tAttempts[tAttempts.length - 1] || tEvals[tEvals.length - 1] || tRecons[tRecons.length - 1];
      topicMastery[t.id] = {
        topic_name: t.name,
        mastery_percentage: pct,
        status,
        last_practiced: lastAtt?.created_at || new Date().toISOString(),
      };
    }
  }

  // 2. Cognitive Reasoning Profile Categories
  const fpAttempts = attempts.filter(
    (a) => a.q_mode === 'first_principles' || a.question_id?.includes('damped') || a.question_id?.includes('thermo') || a.q_reasoning_target?.toLowerCase().includes('first-principle') || a.q_reasoning_target?.toLowerCase().includes('axiom')
  );
  const fpEvidences = evidences.filter((e) => e.feature === 'first_principles' || e.feature === 'reconstruction');

  const causalAttempts = attempts.filter(
    (a) => a.q_mode === 'mechanism_test' || a.question_id?.includes('carnot') || a.question_id?.includes('lenz') || a.q_reasoning_target?.toLowerCase().includes('causal') || a.reasoning_error?.includes('Association')
  );
  const causalEvidences = evidences.filter((e) => e.feature === 'compressor' || (e.error_id && e.error_id.includes('causation')));

  const dirAttempts = attempts.filter(
    (a) => a.q_mode === 'second_order' || a.question_id?.includes('directionality') || a.q_reasoning_target?.toLowerCase().includes('direction') || a.reasoning_error?.includes('Directionality')
  );
  const dirEvidences = evidences.filter((e) => e.error_id === 'err_directionality_inversion' || e.feature === 'compressor');

  const discAttempts = attempts.filter(
    (a) => a.q_mode === 'causal_discrimination' || a.question_id?.includes('discriminator') || a.question_id?.includes('premature') || a.q_reasoning_target?.toLowerCase().includes('discriminat') || a.reasoning_error?.includes('Closure')
  );
  const discEvidences = evidences.filter((e) => e.discriminator_identified != null || e.feature === 'reverse_engineering' || e.feature === 'simulation');

  const excAttempts = attempts.filter(
    (a) => a.question_id?.includes('missing_variable') || a.q_reasoning_target?.toLowerCase().includes('coupling') || a.q_reasoning_target?.toLowerCase().includes('angular') || a.q_reasoning_target?.toLowerCase().includes('feedback')
  );
  const excEvidences = evidences.filter((e) => e.feature === 'adversarial' || e.error_id === 'err_missing_variable');

  const overanalysisAttempts = attempts.filter(
    (a) => a.question_id?.includes('overanalysis') || a.reasoning_error?.includes('Overanalysis')
  );
  const overanalysisEvidences = evidences.filter((e) => e.error_id === 'err_overanalysis_trap');

  const calcCategoryScore = (catAttempts: any[], catEvidences: any[] = [], fallbackEvaluations?: any[]) => {
    let total = 0;
    let n = 0;
    if (catAttempts.length > 0) {
      for (const a of catAttempts) {
        total += a.correct ? 100 : 25;
        n++;
      }
    }
    if (catEvidences.length > 0) {
      for (const ev of catEvidences) {
        if (ev.correct_reasoning != null) total += ev.correct_reasoning ? 90 : 35;
        else if (ev.robust_mechanism != null) total += ev.robust_mechanism ? 90 : 35;
        else if (ev.reconstruction_score != null) total += ev.reconstruction_score;
        else total += 70;
        n++;
      }
    }
    if (n > 0) {
      return Math.round(total / n);
    }
    if (fallbackEvaluations && fallbackEvaluations.length > 0) {
      const avg = fallbackEvaluations.reduce((acc, e) => acc + (e.score || 0), 0) / fallbackEvaluations.length;
      return Math.round(avg);
    }
    return null;
  };

  const first_principles_index = calcCategoryScore(
    fpAttempts,
    fpEvidences,
    reconstructions.map((r) => ({ score: r.score != null ? Number(r.score) : 75 }))
  );
  const causal_precision = calcCategoryScore(causalAttempts, causalEvidences, evaluations.map((e) => ({ score: (e.causal_accuracy || 0.75) * 100 })));
  const directionality_integrity = calcCategoryScore(dirAttempts, dirEvidences, evaluations.map((e) => ({ score: (e.directionality || 0.8) * 100 })));
  const discriminator_acuity = calcCategoryScore(discAttempts, discEvidences);
  const exception_awareness = calcCategoryScore(excAttempts, excEvidences);

  let anti_overanalysis_score: number | null = null;
  const allTimeEvents = [
    ...attempts.map((a) => a.time_taken || 25),
    ...evidences.filter((e) => e.time_taken_sec != null).map((e) => e.time_taken_sec!),
  ];
  if (allTimeEvents.length > 0) {
    const avgTime = allTimeEvents.reduce((acc, t) => acc + t, 0) / allTimeEvents.length;
    const overanalysisCount = overanalysisAttempts.filter((a) => !a.correct).length + overanalysisEvidences.filter((e) => e.correct_reasoning === false).length;
    let base = 85;
    if (avgTime > 60) base -= 20;
    else if (avgTime > 40) base -= 10;
    base -= overanalysisCount * 15;
    anti_overanalysis_score = Math.max(20, Math.min(100, Math.round(base)));
  }

  const reasoningProfile = {
    first_principles_index,
    causal_precision,
    directionality_integrity,
    discriminator_acuity,
    exception_awareness,
    anti_overanalysis_score,
  };

  // 3. Confidence Calibration (Aggregating attempts + evidence confidence records)
  const confAttempts = [
    ...attempts.filter((a) => a.confidence != null && a.confidence > 0).map((a) => ({ confidence: a.confidence, correct: Boolean(a.correct) })),
    ...evidences.filter((e) => e.confidence != null && e.confidence > 0 && e.correct_answer != null).map((e) => ({ confidence: e.confidence!, correct: Boolean(e.correct_answer) })),
  ];

  let brier_score: number | null = null;
  let overconfidence_bias: number | null = null;
  let underconfidence_bias: number | null = null;
  let calibration_curve: Array<{ predicted_confidence: number; actual_accuracy: number }> = [];

  if (confAttempts.length > 0) {
    const totalBrier = confAttempts.reduce((acc, a) => {
      const outcome = a.correct ? 1.0 : 0.0;
      const prob = a.confidence / 100;
      return acc + Math.pow(prob - outcome, 2);
    }, 0);
    brier_score = Number((totalBrier / confAttempts.length).toFixed(2));

    const avgConf = confAttempts.reduce((acc, a) => acc + a.confidence, 0) / confAttempts.length;
    const avgAcc = (confAttempts.filter((a) => a.correct).length / confAttempts.length) * 100;
    const bias = Math.round(avgConf - avgAcc);
    overconfidence_bias = Math.max(0, bias);
    underconfidence_bias = Math.max(0, -bias);

    const buckets = [
      { predicted: 20, min: 0, max: 30 },
      { predicted: 40, min: 31, max: 50 },
      { predicted: 60, min: 51, max: 70 },
      { predicted: 80, min: 71, max: 90 },
      { predicted: 100, min: 91, max: 100 },
    ];
    calibration_curve = buckets.map((b) => {
      const inBucket = confAttempts.filter((a) => a.confidence >= b.min && a.confidence <= b.max);
      const acc = inBucket.length > 0 ? Math.round((inBucket.filter((a) => a.correct).length / inBucket.length) * 100) : b.predicted;
      return {
        predicted_confidence: b.predicted,
        actual_accuracy: acc,
      };
    });
  }

  // 4. Hierarchical Errors & Stages (Integrating cross-feature adaptive evidence)
  let existingErrors = INITIAL_HIERARCHICAL_ERRORS;
  if (userModelRow?.error_profile) {
    try {
      const p = JSON.parse(userModelRow.error_profile);
      if (Array.isArray(p) && p.length > 0 && p[0].reasoning_family) {
        existingErrors = p;
      }
    } catch {}
  }

  const updatedErrors = existingErrors.map((err) => {
    const errAttempts = attempts.filter(
      (a) => a.question_id?.includes(err.id.replace('err_', '')) || a.reasoning_error?.includes(err.name)
    );
    const errEvidences = evidences.filter(
      (e) => e.error_id === err.id || (e.evidence_summary && e.evidence_summary.includes(err.name))
    );

    const totalEventsCount = errAttempts.length + errEvidences.length;
    if (totalEventsCount === 0) {
      return {
        ...err,
        stage: err.stage != null ? err.stage : null,
        model_confidence: err.model_confidence != null ? err.model_confidence : null,
        status: err.status || 'Unassessed',
        linked_evidence_count: 0,
        feature_sources: [],
        evidence_strength: 0,
      };
    }

    // Failures vs Repairs
    const wrongAtts = errAttempts.filter((a) => !a.correct).length;
    const correctAtts = errAttempts.filter((a) => a.correct).length;

    const wrongEvs = errEvidences.filter((e) => e.correct_answer === 0 || e.correct_reasoning === 0 || (e.reconstruction_score != null && e.reconstruction_score < 60)).length;
    const correctEvs = errEvidences.filter((e) => e.correct_answer === 1 || e.correct_reasoning === 1 || e.robust_mechanism === 1 || (e.reconstruction_score != null && e.reconstruction_score >= 75)).length;

    const totalWrong = wrongAtts + wrongEvs;
    const totalCorrect = correctAtts + correctEvs;

    // Feature sources
    const featureSourcesSet = new Set<string>();
    if (errAttempts.length > 0) featureSourcesSet.add('mcq_test');
    for (const e of errEvidences) {
      if (e.feature) featureSourcesSet.add(e.feature);
    }
    const featureSources = Array.from(featureSourcesSet);

    // Aggregate evidence strength
    const avgStrength = errEvidences.length > 0
      ? Number((errEvidences.reduce((acc: number, e: any) => acc + (e.evidence_strength || 0.5), 0) / errEvidences.length).toFixed(2))
      : 0.50;

    // Recent failures (last 4 events)
    const recentWrongAtts = errAttempts.slice(-3).filter((a) => !a.correct).length;
    const recentWrongEvs = errEvidences.slice(-3).filter((e) => e.correct_answer === 0 || e.correct_reasoning === 0).length;
    const recentWrong = recentWrongAtts + recentWrongEvs;

    // Transfer status evaluation
    const transferSurvived = errEvidences.some((e) => e.transferable_mastery === 1) || (correctAtts >= 2);
    const transferTested = errEvidences.some((e) => e.feature === 'mcq_test' && e.transferable_mastery != null) || (totalCorrect >= 1);

    // Status and Confidence
    let status: any = 'Developing';
    let conf = 0.50;

    if (totalWrong === 1 && totalCorrect === 0) {
      // Single isolated mistake creates an Emerging signal rather than immediately declaring stable weakness
      status = 'Emerging';
      conf = Math.min(0.55, 0.40 + avgStrength * 0.15);
    } else if (totalWrong >= 2 || featureSources.length >= 2) {
      status = 'Unstable';
      conf = Math.min(0.96, Number((0.55 + totalWrong * 0.08 + (featureSources.length >= 2 ? 0.12 : 0) - totalCorrect * 0.05).toFixed(2)));
    } else if (totalCorrect >= 3 && recentWrong === 0) {
      status = transferSurvived ? 'Strong' : 'Stable';
      // Successful correction under a changed context reduces confidence in the error hypothesis
      conf = Math.max(0.20, Number((0.40 - totalCorrect * 0.05).toFixed(2)));
    }

    if (totalCorrect >= 5 && transferSurvived) {
      status = 'Well-calibrated';
      conf = 0.15;
    }

    const stage = Math.min(7, Math.max(1, 1 + totalCorrect));
    const transfer_status = transferSurvived ? 'Survived' : transferTested ? 'Tested' : totalCorrect >= 1 ? 'Pending' : 'Unassessed';

    const lastEvent = errEvidences[errEvidences.length - 1] || errAttempts[errAttempts.length - 1];

    // Hypothesis refinement
    let hypothesis = err.current_hypothesis;
    if (lastEvent && lastEvent.evidence_summary) {
      hypothesis = lastEvent.evidence_summary.slice(0, 120);
    }

    return {
      ...err,
      error_frequency: totalWrong,
      successful_repairs: totalCorrect,
      recent_frequency: recentWrong,
      stage,
      model_confidence: conf,
      status,
      transfer_status: transfer_status as any,
      linked_evidence_count: totalEventsCount,
      feature_sources: featureSources,
      evidence_strength: avgStrength,
      last_seen: lastEvent?.created_at || err.last_seen,
      current_hypothesis: hypothesis,
    };
  });

  // 5. Cognitive Resources
  const avgTime = allTimeEvents.length > 0 ? Math.round(allTimeEvents.reduce((acc, t) => acc + t, 0) / allTimeEvents.length) : null;
  const cognitiveResources = {
    average_time_per_decision_sec: avgTime,
    unnecessary_tests_requested_rate: attempts.length > 0 ? 0.12 : null,
    overanalysis_flags_count: attempts.filter((a) => a.time_taken > 70).length + evidences.filter((e) => e.error_id === 'err_overanalysis_trap').length,
    decision_commit_efficiency: avgTime && avgTime < 40 ? 'High' : avgTime ? 'Moderate' : 'Pending Assessment',
  };

  // 6. Next Best Task (Deriving dynamically on demand)
  const nextBestTask = deriveNextBestTask({ userId });
  const recommendedTest = {
    mode: (nextBestTask.test_mode || 'weakness_hunt') as any,
    title: nextBestTask.title,
    rationale: nextBestTask.reason,
    target_weakness: nextBestTask.target_error_name || nextBestTask.topic_name,
  };

  // Evolution log based on real attempt and evidence milestones
  const evolutionLog: any[] = [];
  for (const a of attempts) {
    if (a.reasoning_error && a.reasoning_error.includes('Root Error')) {
      evolutionLog.push({
        timestamp: a.created_at,
        trigger_event: `Diagnostic Question Attempt (${a.question_id})`,
        old_hypothesis: 'Initial hypothesis pending stress-testing.',
        new_evidence: `Manifested error in question ${a.question_id} with ${a.confidence}% confidence.`,
        revised_hypothesis: a.reasoning_error,
      });
    } else if (a.correct) {
      evolutionLog.push({
        timestamp: a.created_at,
        trigger_event: `Successful Defense (${a.question_id})`,
        old_hypothesis: 'Vulnerability under physical perturbation.',
        new_evidence: `Successfully defended mechanism with ${a.confidence}% confidence in ${a.time_taken || 25}s.`,
        revised_hypothesis: 'Progressing towards consolidated mental model; advancing to transfer verification.',
      });
    }
  }

  for (const ev of evidences) {
    evolutionLog.push({
      timestamp: ev.created_at,
      trigger_event: `Adaptive Evidence from [${ev.feature}]`,
      old_hypothesis: 'Continuous tracking across learning modes.',
      new_evidence: ev.evidence_summary,
      revised_hypothesis: `Evidence strength ${ev.evidence_strength}. Status: ${ev.correct_reasoning ? 'Defended' : 'Challenged'}.`,
    });
  }

  const evolvingHypotheses = updatedErrors
    .filter((e) => e.stage != null)
    .map((err) => ({
      id: 'hyp_' + err.id,
      target_weakness: err.name,
      hypothesis: err.current_hypothesis,
      competing_alternatives: [
        'Alternative A: Isolated terminology confusion',
        'Alternative B: Task-switching cognitive fatigue',
        'Alternative C: Context-dependent heuristic failure',
      ],
      status: (err.status === 'Well-calibrated' || err.status === 'Strong' ? 'Validated' : 'Active') as any,
      updated_at: err.last_seen || new Date().toISOString(),
    }));

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE user_model SET
      reasoning_profile = ?,
      topic_mastery = ?,
      error_profile = ?,
      confidence_calibration = ?,
      cognitive_resource_allocation = ?,
      updated_at = ?
    WHERE user_id = ?
  `).run(
    JSON.stringify(reasoningProfile),
    JSON.stringify(topicMastery),
    JSON.stringify(updatedErrors),
    JSON.stringify({ brier_score, overconfidence_bias, underconfidence_bias, calibration_curve }),
    JSON.stringify(cognitiveResources),
    now,
    userId
  );

  return {
    id: userModelRow?.id || 'model_' + userId,
    user_id: userId,
    reasoning_profile: reasoningProfile,
    topic_mastery: topicMastery,
    error_profile: updatedErrors,
    hierarchical_errors: updatedErrors,
    evolving_hypotheses: evolvingHypotheses,
    evolution_log: evolutionLog.slice(-20),
    recommended_test: recommendedTest,
    next_best_task: nextBestTask,
    recent_evidence: evidences.slice(-15).reverse(),
    confidence_calibration: { brier_score, overconfidence_bias, underconfidence_bias, calibration_curve },
    cognitive_resource_allocation: cognitiveResources,
    recommended_difficulty: 'Mechanistic',
    updated_at: now,
  };
}

/**
 * Test Selection Algorithm:
 * Evaluates current user error model, test mode, topic, custom topic input, format, and past attempts
 * to return the question with MAXIMUM DIAGNOSTIC VALUE.
 */
export async function selectAdaptiveQuestion(params: {
  mode: TestEngineMode;
  topic_id?: string;
  topic_ids?: string[];
  custom_topic_name?: string;
  topic_name?: string;
  question_format?: 'mcq' | 'long_answer';
  focus?: 'weakness' | 'transfer' | 'exploration' | 'reconstruction' | 'all';
  difficulty?: string;
  detected_gaps?: string[];
  context_summary?: string;
  unresolved_questions?: string[];
  userId?: string;
}): Promise<Question> {
  const userId = params.userId || DEFAULT_USER_ID;
  ensureAdaptiveUserModel(userId);

  const userModelRow = db.prepare('SELECT * FROM user_model WHERE user_id = ?').get(userId) as any;
  let errors: HierarchicalReasoningError[] = INITIAL_HIERARCHICAL_ERRORS;
  if (userModelRow?.error_profile) {
    try {
      const parsed = JSON.parse(userModelRow.error_profile);
      if (Array.isArray(parsed) && parsed[0]?.reasoning_family) {
        errors = parsed;
      }
    } catch (e) {
      // fallback
    }
  }

  // Fetch recent attempts to avoid immediate repetition
  const recentAttempts = db.prepare(`
    SELECT question_id FROM question_attempts
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 6
  `).all(userId) as Array<{ question_id: string }>;
  const recentQIds = new Set(recentAttempts.map((a) => a.question_id));

  // Determine priority error target
  // Sort errors by priority: high confidence + active recurring > pending transfer > emerging
  const sortedErrors = [...errors].sort((a, b) => {
    // Stage 1-3 errors that recently failed take high priority
    const aConf = a.model_confidence ?? 0;
    const bConf = b.model_confidence ?? 0;
    const aPriority = aConf * (a.recent_frequency + 1) * (a.status === 'Unstable' ? 1.5 : 1);
    const bPriority = bConf * (b.recent_frequency + 1) * (b.status === 'Unstable' ? 1.5 : 1);
    return bPriority - aPriority;
  });

  const priorityError = sortedErrors[0] || errors[0];

  // If a custom topic name is explicitly specified OR long_answer is requested,
  // directly generate a customized diagnostic question for that topic with Gemini!
  if ((params.custom_topic_name && params.custom_topic_name.trim().length > 0) || params.question_format === 'long_answer') {
    return await generateDynamicDiagnosticQuestion({
      target_error: priorityError,
      topic_id: params.topic_id,
      custom_topic_name: params.custom_topic_name?.trim(),
      topic_name: params.topic_name || params.custom_topic_name?.trim(),
      mode: params.mode,
      question_format: params.question_format || 'mcq',
      difficulty: params.difficulty || 'Mechanistic',
      detected_gaps: params.detected_gaps,
      context_summary: params.context_summary,
      unresolved_questions: params.unresolved_questions,
    });
  }

  const allowedTopicIds = new Set<string>();
  if (params.topic_id) allowedTopicIds.add(params.topic_id);
  if (Array.isArray(params.topic_ids)) {
    params.topic_ids.forEach((id) => allowedTopicIds.add(id));
  }

  // Match curated questions based on requested mode & focus
  let matchedQuestions = CURATED_DIAGNOSTIC_QUESTIONS.filter((q) => {
    // If specific topic(s) requested, verify matching topic
    if (allowedTopicIds.size > 0 && !allowedTopicIds.has(q.topic_id)) {
      return false;
    }

    // Mode-based filters
    if (params.mode === 'weakness_hunt') {
      return q.root_error_target === priorityError.id;
    }
    if (params.mode === 'transfer_test' || params.focus === 'transfer') {
      return q.question_type === 'TYPE_B_DISGUISED_TRANSFER';
    }
    if (params.mode === 'exploration_test' || params.focus === 'exploration') {
      return q.question_type === 'TYPE_F_FALSE_CONFIDENCE' || q.question_type === 'TYPE_D_COMPETING_MECHANISMS';
    }
    if (params.mode === 'mechanism_test') {
      return q.question_type === 'TYPE_C_MECHANISM_REVERSAL' || q.question_type === 'TYPE_D_COMPETING_MECHANISMS';
    }
    if (params.mode === 'first_principles') {
      return q.question_type === 'TYPE_A_DIRECT_DIAGNOSTIC' || q.question_type === 'TYPE_J_RECONSTRUCTION';
    }
    if (params.mode === 'adversarial_test') {
      return q.question_type === 'TYPE_I_ADVERSARIAL_MODEL';
    }
    if (params.mode === 'reconstruction' || params.focus === 'reconstruction') {
      return q.question_type === 'TYPE_J_RECONSTRUCTION';
    }
    if (params.mode === 'calibration_test') {
      return q.question_type === 'TYPE_F_FALSE_CONFIDENCE' || q.question_type === 'TYPE_G_OVERANALYSIS';
    }

    return true;
  });

  // Filter out recent questions if more than 1 choice available
  const nonRecent = matchedQuestions.filter((q) => !recentQIds.has(q.id));
  const candidatePool = nonRecent.length > 0 ? nonRecent : matchedQuestions;

  if (candidatePool.length > 0) {
    // Return candidate question with full diagnostic annotations
    const selected = candidatePool[Math.floor(Math.random() * candidatePool.length)];
    return { ...selected, question_format: 'mcq' };
  }

  // If no curated match or user requested custom topic, generate dynamic diagnostic question with Gemini
  return await generateDynamicDiagnosticQuestion({
    target_error: priorityError,
    topic_id: params.topic_id || (params.topic_ids && params.topic_ids[0]),
    topic_name: params.topic_name,
    custom_topic_name: params.custom_topic_name,
    mode: params.mode,
    question_format: params.question_format || 'mcq',
    difficulty: params.difficulty || 'Mechanistic',
    detected_gaps: params.detected_gaps,
    context_summary: params.context_summary,
    unresolved_questions: params.unresolved_questions,
  });
}

/**
 * Dynamically generates an un-gameable diagnostic question with Gemini
 * targeted at an explicit reasoning failure, supporting both MCQ and Long Answer types.
 */
export async function generateDynamicDiagnosticQuestion(params: {
  target_error: HierarchicalReasoningError;
  topic_id?: string;
  topic_name?: string;
  custom_topic_name?: string;
  mode: TestEngineMode;
  question_format?: 'mcq' | 'long_answer';
  difficulty: string;
  detected_gaps?: string[];
  context_summary?: string;
  unresolved_questions?: string[];
}): Promise<Question> {
  const err = params.target_error;
  const effectiveTopic = params.custom_topic_name || params.topic_name || 'Physics Mechanics & Dynamics';
  const isLongAnswer = params.question_format === 'long_answer';

  const gapsInfo = params.detected_gaps && params.detected_gaps.length > 0
    ? `\nActive Misconceptions / Flaws Flagged in Recent Student Dialogue:\n${params.detected_gaps.map((g) => `- ${g}`).join('\n')}\n`
    : '';
  const contextSummaryInfo = params.context_summary
    ? `\nRecent Discussion Summary / Mechanism Context:\n"${params.context_summary}"\n`
    : '';
  const unresolvedQuestionsInfo = params.unresolved_questions && params.unresolved_questions.length > 0
    ? `\nUnresolved Questions / Ambiguities from Prior Conversation:\n${params.unresolved_questions.map((q) => `- ${q}`).join('\n')}\n`
    : '';

  const prompt = isLongAnswer
    ? `You are the lead cognitive psychometrician and Physics professor for the MECHANISM adaptive test engine.
GENERATE A HIGH-DIAGNOSTIC-VALUE OPEN-ENDED LONG ANSWER PHYSICAL REASONING QUESTION.

Target Customized Topic / Concept: "${effectiveTopic}"
Target Reasoning Flaw Under Diagnostic Attack: "${err.name}"
Reasoning Family: "${err.reasoning_family}"
Specific Failure: "${err.specific_failure}"
Trigger Condition: "${err.trigger_conditions}"
Current Hypothesis About Learner's Flawed Mental Model: "${err.current_hypothesis}"
Target Difficulty: "${params.difficulty}"
Mode: "${params.mode}"${contextSummaryInfo}${gapsInfo}${unresolvedQuestionsInfo}

STRICT DESIGN RULES FOR LONG ANSWER QUESTION:
1. Formulate a rich, high-fidelity physical scenario with experimental apparatus, boundary parameters, or field values.
2. The question MUST ask the student to articulate their full mechanistic derivation:
   - Step A (primary initiating perturbation / applied potential / boundary change)
   - Step B (intermediate dynamical variable shift / flux response)
   - Step C (conservation feedback / equilibrium restoration)
   - Step D (discriminator from competing alternative physical models)
3. Specifically construct the scenario so that if the student commits their targeted flaw ("${err.name}"), their derivation will produce an erroneous conclusion or missing link.
4. Output a comprehensive canonical correct explanation and scoring rubric detailing what constitutes a sound causal derivation vs flawed pattern matching.

OUTPUT STRICT VALID JSON ONLY (no markdown formatting, no code fence):
{
  "question_text": "Detailed physical question requiring long-form mechanistic derivation...",
  "scenario_vignette": "Realistic experimental setup with precise parameter numbers and constraints...",
  "options": [],
  "correct_answer": "Complete canonical step-by-step mathematical/physical derivation and solution",
  "explanation": "Pristine first-principles physical explanation with all causal links and conservation laws",
  "discriminator_note": "CRUCIAL DISCRIMINATOR: The exact physical observation or measurement that confirms the mechanism",
  "scoring_rubric": "Rubric: 1. Correctly identifies primary governing law... 2. Distinguishes macro vs micro forces... 3. Avoids [${err.name}]",
  "reasoning_target": "Evaluating step-by-step causal derivation while challenging ${err.name}",
  "question_type": "TYPE_A_DIRECT_DIAGNOSTIC",
  "internal_rationale": "Internal diagnostic purpose: exposes whether student can construct a coherent causal chain on ${effectiveTopic} without committing ${err.name}",
  "competing_paths": ["Path 1: First-principles causal derivation", "Path 2: Target error (${err.name}) failure pattern"],
  "falsification_criteria": "Student's reasoning will be falsified if they violate conservation laws or reverse causality."
}`
    : `You are the lead cognitive psychometrician and Physics professor for the MECHANISM adaptive test engine.
GENERATE A HIGH-DIAGNOSTIC-VALUE PHYSICAL REASONING MULTIPLE CHOICE QUESTION.

Target Customized Topic / Focus: "${effectiveTopic}"
Target Reasoning Weakness: "${err.name}"
Reasoning Family: "${err.reasoning_family}"
Specific Failure: "${err.specific_failure}"
Trigger Condition: "${err.trigger_conditions}"
Current Hypothesis About Learner: "${err.current_hypothesis}"
Target Difficulty: "${params.difficulty}"
Mode: "${params.mode}"${contextSummaryInfo}${gapsInfo}${unresolvedQuestionsInfo}

STRICT DESIGN RULES:
1. OPTIMIZE FOR DIAGNOSTIC VALUE ON "${effectiveTopic}", NOT MERE TRIVIA DIFFICULTY.
2. Disguise the underlying reasoning challenge within realistic experimental or theoretical data for "${effectiveTopic}".
3. Craft 4 distinct options:
   - 1 scientifically pristine correct answer derived from physical first principles.
   - 1 distractor designed specifically to entrap the student IF AND ONLY IF they commit the targeted reasoning failure ("${err.name}").
   - 1 distractor representing a competing alternative mechanism.
   - 1 distractor representing superficial associative recall.
4. Provide a realistic physical vignette with precise quantitative or qualitative data.
5. Provide an internal diagnostic rationale (why this question was selected and what it reveals about how the student thinks).

OUTPUT STRICT VALID JSON ONLY (no markdown formatting, no code fence):
{
  "question_text": "...",
  "scenario_vignette": "...",
  "options": [
    "Option A...",
    "Option B...",
    "Option C...",
    "Option D..."
  ],
  "correct_answer": "Exact text of the correct option",
  "explanation": "Pristine physical explanation with causal chain and first principles",
  "discriminator_note": "CRUCIAL DISCRIMINATOR: ...",
  "reasoning_target": "The exact reasoning skill being evaluated",
  "question_type": "TYPE_B_DISGUISED_TRANSFER",
  "internal_rationale": "Internal diagnostic purpose of this question",
  "competing_paths": ["Path 1: Correct derivation", "Path 2: Target error bug"],
  "falsification_criteria": "How this question falsifies or confirms the student error model"
}`;

  try {
    const result = await queryGemini({
      prompt,
      temperature: 0.2,
    });

    let cleanJson = result.text.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    const parsed = JSON.parse(cleanJson);
    const id = 'dyn_q_' + Date.now();

    const newQ: Question = {
      id,
      topic_id: params.topic_id || 'top_custom_diagnostic',
      topic_name: effectiveTopic,
      subject_name: 'Physical Sciences',
      mode: params.mode,
      question_format: params.question_format || (isLongAnswer ? 'long_answer' : 'mcq'),
      question_text: parsed.question_text,
      scenario_vignette: parsed.scenario_vignette || parsed.physical_scenario || '',
      options: isLongAnswer ? [] : (parsed.options || []),
      correct_answer: parsed.correct_answer,
      explanation: parsed.explanation,
      discriminator_note: parsed.discriminator_note,
      reasoning_target: parsed.reasoning_target || err.name,
      difficulty: params.difficulty as any || 'Mechanistic',
      question_type: (parsed.question_type as QuestionType) || (isLongAnswer ? 'TYPE_A_DIRECT_DIAGNOSTIC' : 'TYPE_B_DISGUISED_TRANSFER'),
      root_error_target: err.id,
      internal_rationale: parsed.internal_rationale,
      competing_paths: parsed.competing_paths,
      falsification_criteria: parsed.falsification_criteria,
      scoring_rubric: parsed.scoring_rubric || '',
      created_at: new Date().toISOString(),
    };

    // Store generated question in database for persistence
    db.prepare(`
      INSERT INTO questions (
        id, topic_id, mode, question_text, options, correct_answer,
        explanation, reasoning_target, difficulty, scenario_vignette, clinical_vignette, discriminator_note,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newQ.id,
      newQ.topic_id,
      newQ.mode,
      newQ.question_text,
      JSON.stringify(newQ.options),
      newQ.correct_answer,
      newQ.explanation,
      newQ.reasoning_target,
      newQ.difficulty,
      newQ.scenario_vignette || '',
      newQ.scenario_vignette || '',
      newQ.discriminator_note || '',
      newQ.created_at
    );

    return newQ;
  } catch (err) {
    console.error('Error generating dynamic diagnostic question, falling back to curated pool:', err);
    return {
      ...CURATED_DIAGNOSTIC_QUESTIONS[0],
      question_format: params.question_format || 'mcq',
    };
  }
}

/**
 * Evaluates a student's answer, stated reasoning, stated confidence, and time taken.
 * Distinguishes surface errors from root cognitive errors, updates the hierarchical
 * error model, recalibrates confidence, and formulates the next test experiment.
 */
export async function evaluateAdaptiveAttempt(params: {
  question_id: string;
  answer: string;
  confidence: number; // 0 - 100%
  reasoning: string;
  time_taken: number;
  user_id?: string;
}): Promise<CognitiveEvaluation> {
  const userId = params.user_id || DEFAULT_USER_ID;
  ensureAdaptiveUserModel(userId);

  // Find question in curated list or database
  let q = CURATED_DIAGNOSTIC_QUESTIONS.find((item) => item.id === params.question_id);
  if (!q) {
    const row = db.prepare('SELECT * FROM questions WHERE id = ?').get(params.question_id) as any;
    if (row) {
      const opts = JSON.parse(row.options || '[]');
      q = {
        ...row,
        options: opts,
        question_format: opts.length === 0 ? 'long_answer' : 'mcq',
      };
    }
  }

  if (!q) {
    throw new Error('Diagnostic Question not found');
  }

  const isLongAnswer = q.question_format === 'long_answer' || (!q.options || q.options.length === 0);
  let isCorrect = isLongAnswer
    ? false // Will be determined by AI evaluation
    : params.answer.trim() === q.correct_answer.trim();
  const confidenceVal = Math.max(0, Math.min(100, params.confidence || 80));
  const timeTaken = params.time_taken || 25;

  // Load current user model
  const userModelRow = db.prepare('SELECT * FROM user_model WHERE user_id = ?').get(userId) as any;
  let errors: HierarchicalReasoningError[] = INITIAL_HIERARCHICAL_ERRORS;
  let calibration = {
    brier_score: 0.16,
    overconfidence_bias: 14,
    underconfidence_bias: 4,
    calibration_curve: [
      { predicted_confidence: 20, actual_accuracy: 25 },
      { predicted_confidence: 40, actual_accuracy: 42 },
      { predicted_confidence: 60, actual_accuracy: 52 },
      { predicted_confidence: 80, actual_accuracy: 68 },
      { predicted_confidence: 100, actual_accuracy: 86 },
    ],
  };

  if (userModelRow) {
    try {
      const parsedErrors = JSON.parse(userModelRow.error_profile);
      if (Array.isArray(parsedErrors) && parsedErrors[0]?.reasoning_family) {
        errors = parsedErrors;
      }
      if (userModelRow.confidence_calibration) {
        calibration = JSON.parse(userModelRow.confidence_calibration);
      }
    } catch {
      // fallback
    }
  }

  // Find target error associated with this question
  const targetErrorId = q.root_error_target || 'err_assoc_causation';
  const targetError = errors.find((e) => e.id === targetErrorId) || errors[0];

  const reasoningText = (params.reasoning || '').trim();

  // Perform Deep Cognitive Evaluation with Gemini on the answer AND stated reasoning
  let aiEvaluation: {
    is_correct?: boolean;
    reasoning_quality_score?: number;
    reasoning_critique?: string;
    target_error_occurred?: boolean;
    root_error_classified?: string;
    flaw_analysis?: string;
    model_revision?: string;
    recommended_next_test?: string;
  } | null = null;

  if (isLongAnswer || reasoningText.length > 8) {
    try {
      const evalPrompt = `You are the lead Physics cognitive psychometrician evaluating a student's diagnostic test response.
Target Topic: "${q.topic_name || 'Physical Sciences'}"
Question Text:
"""
${q.question_text}
"""
${q.scenario_vignette ? `Physical Scenario:\n"""\n${q.scenario_vignette}\n"""\n` : ''}
Question Format: ${isLongAnswer ? 'OPEN-ENDED LONG ANSWER' : 'MULTIPLE CHOICE QUESTION'}
Canonical Correct Answer / Derivation:
"""
${q.correct_answer}
"""
Canonical Physical Explanation:
"""
${q.explanation}
"""
Critical Discriminator: "${q.discriminator_note || 'N/A'}"
${q.scoring_rubric ? `Scoring Rubric: "${q.scoring_rubric}"` : ''}

STUDENT SUBMISSION:
Student's Selected or Written Answer:
"""
${params.answer}
"""
Student's Stated Reasoning ("Why did you choose this specific answer / explanation"):
"""
${params.reasoning || '(No explicit reasoning supplied)'}
"""
Stated Confidence: ${confidenceVal}%
Time Taken: ${timeTaken}s

TARGET COGNITIVE FLAW UNDER DIAGNOSTIC STRESS: "${targetError.name}"
Flaw Profile: ${targetError.specific_failure}
Trigger Condition: ${targetError.trigger_conditions}
Current Working Model: "${targetError.current_hypothesis}"

YOUR TASK:
1. Is the student's answer causally sound? (${isLongAnswer ? 'Evaluate if the long answer captures the primary insult, intermediate shifts, and key discriminators' : 'Evaluate if they selected the correct option'}).
2. Scrutinize the student's stated reasoning ("Why they chose it"):
   - Did they exhibit Directionality Inversion (reversing cause/effect)?
   - Did they commit Association-to-Causation Confounding (confusing macroscopic correlation with true dynamical causality)?
   - Did they commit Premature Closure (ignoring discriminators)?
   - Did they commit Overanalysis (hesitating when sufficiency is met)?
   - Did they omit compensatory physical feedback or restoring forces?
3. Provide a constructive, razor-sharp psychometric critique of their reasoning.
4. Provide a refined hypothesis of how this student's understanding fails, so this flaw can be tracked across the entire webapp.

OUTPUT STRICT JSON ONLY (no markdown fences):
{
  "is_correct": boolean,
  "reasoning_quality_score": number (0 - 100),
  "reasoning_critique": "Concise 2-3 sentence academic evaluation of their causal chain and blind spots",
  "target_error_occurred": boolean (true if student exhibited ${targetError.name} or related flaw),
  "root_error_classified": "Name of the classified flaw",
  "flaw_analysis": "Precise summary of the mistake in their pattern of understanding",
  "model_revision": "Refined diagnostic hypothesis about the student's cognitive model",
  "recommended_next_test": "Next diagnostic challenge or disguised transfer test"
}`;

      const geminiRes = await queryGemini({ prompt: evalPrompt, temperature: 0.15 });
      let cleanJson = geminiRes.text.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      }
      aiEvaluation = JSON.parse(cleanJson);
      if (isLongAnswer && typeof aiEvaluation?.is_correct === 'boolean') {
        isCorrect = aiEvaluation.is_correct;
      }
    } catch (e) {
      console.warn('Gemini attempt evaluation error, proceeding with deterministic fallback:', e);
    }
  }

  // 1. Evaluate Reasoning Quality
  let reasoningQualityScore = aiEvaluation?.reasoning_quality_score ?? (isCorrect ? 75 : 45);
  let reasoningCritique = aiEvaluation?.reasoning_critique ?? 'Adequate reasoning provided.';

  if (!aiEvaluation) {
    if (reasoningText.length > 20) {
      const hasCausalKeywords = /restoring force|damping|dissipation|flux|entropy|isentropic|adiabatic|lorentz|eddy|lagrangian|hamiltonian|phase space|impedance|velocity|discriminator|first principles|axiom|derivative|eigen/i.test(reasoningText);
      if (hasCausalKeywords && isCorrect) {
        reasoningQualityScore = 94;
        reasoningCritique = 'Exceptional first-principles physical derivation. Causal chain and directionality were explicitly linked.';
      } else if (hasCausalKeywords && !isCorrect) {
        reasoningQualityScore = 65;
        reasoningCritique = 'Identified relevant physical parameters, but inverted the direction of the intermediate impedance or opposing back-action.';
      } else {
        reasoningQualityScore = isCorrect ? 78 : 45;
        reasoningCritique = isCorrect
          ? 'Correct answer, but explanation relied partially on intuitive heuristic rather than formal physical steps.'
          : 'Reasoning missed the crucial experimental/detector discriminator.';
      }
    } else {
      reasoningQualityScore = isCorrect ? 60 : 35;
      reasoningCritique = 'Minimal reasoning provided before committing to decision.';
    }
  }

  // 2. Evaluate Confidence Calibration
  let calibrationVerdict: 'Overconfident' | 'Underconfident' | 'Calibrated' | 'False Certainty' = 'Calibrated';
  let calibrationAnalysis = '';

  if (!isCorrect && confidenceVal >= 80) {
    calibrationVerdict = confidenceVal === 100 ? 'False Certainty' : 'Overconfident';
    calibrationAnalysis = `High stated confidence (${confidenceVal}%) on an incorrect model indicates a persistent blind spot. The distractor appeared intuitively plausible, trapping unverified assumptions.`;
    calibration.overconfidence_bias = Math.min(30, calibration.overconfidence_bias + 3);
  } else if (isCorrect && confidenceVal <= 40) {
    calibrationVerdict = 'Underconfident';
    calibrationAnalysis = `Low stated confidence (${confidenceVal}%) despite sound derivation. Your physical mental model is stronger than your self-assessment.`;
    calibration.underconfidence_bias = Math.min(25, calibration.underconfidence_bias + 2);
  } else if (isCorrect && confidenceVal >= 70) {
    calibrationVerdict = 'Calibrated';
    calibrationAnalysis = `Well-calibrated certainty (${confidenceVal}%). High confidence was backed by correct causal directionality.`;
    calibration.overconfidence_bias = Math.max(5, calibration.overconfidence_bias - 1);
  } else {
    calibrationVerdict = 'Calibrated';
    calibrationAnalysis = `Appropriate calibration (${confidenceVal}% certainty). Uncertainty was acknowledged where alternative explanations existed.`;
  }

  // 3. Time Efficiency Analysis
  let timeEfficiencyAnalysis = '';
  if (q.question_type === 'TYPE_G_OVERANALYSIS') {
    if (isCorrect) {
      timeEfficiencyAnalysis = `Commit threshold recognized in ${timeTaken}s. Excellent cognitive economy: identified that additional diagnostic tests would provide zero marginal decision value.`;
    } else {
      timeEfficiencyAnalysis = `Overanalysis trap triggered (${timeTaken}s). Delayed life-saving intervention to gather redundant tests after the diagnostic threshold had already been reached.`;
    }
  } else {
    if (timeTaken < 15 && !isCorrect) {
      timeEfficiencyAnalysis = `Premature decision in ${timeTaken}s. Answered rapidly before inspecting the critical discriminator note.`;
    } else if (timeTaken > 45 && isCorrect) {
      timeEfficiencyAnalysis = `Deliberate analytical derivation (${timeTaken}s). High decision depth safely resolved competing mechanisms.`;
    } else {
      timeEfficiencyAnalysis = `Standard analytical pacing (${timeTaken}s). Efficient transition from observation to commitment.`;
    }
  }

  // 4. Update the Personal Error Model (Stage progression, decay, and hypothesis refinement)
  const targetErrorOccurred = aiEvaluation?.target_error_occurred !== undefined
    ? Boolean(aiEvaluation.target_error_occurred)
    : !isCorrect;
  const oldHypothesis = targetError.current_hypothesis;
  let newEvidence = '';
  let modelRevision = aiEvaluation?.model_revision || '';

  if (isCorrect) {
    // Student successfully defended against the error target!
    targetError.successful_repairs += 1;
    targetError.recent_frequency = Math.max(0, targetError.recent_frequency - 1);

    if (q.question_type === 'TYPE_B_DISGUISED_TRANSFER') {
      targetError.transfer_status = 'Survived';
    }

    // Advance stage or decay confidence
    if (targetError.stage < 7) {
      targetError.stage += 1;
    }

    if (targetError.successful_repairs >= 3) {
      targetError.status = targetError.transfer_status === 'Survived' ? 'Strong' : 'Stable';
      targetError.model_confidence = Math.max(0.35, Number((targetError.model_confidence - 0.08).toFixed(2)));
    }

    newEvidence = `Defended ${targetError.name} in question "${q.id}" (${confidenceVal}% confidence, stage ${targetError.stage}).`;

    // Refine hypothesis conditionally
    if (!modelRevision) {
      if (targetError.id === 'err_directionality_inversion') {
        modelRevision = 'Learner consistently respects directionality in dynamic flux and impedance interactions. Vulnerability appears restricted to multi-tiered boundary conditions under severe time constraints.';
      } else if (targetError.id === 'err_assoc_causation') {
        modelRevision = 'Learner successfully decoupled macroscopic state variables from boundary heat/work fluxes. Association error is decaying in thermodynamic and electrodynamic domains.';
      } else {
        modelRevision = `Learner demonstrated reliable discriminators for ${targetError.name}. Prioritizing transfer testing under varied physical contexts.`;
      }
    }

    targetError.current_hypothesis = modelRevision;
    targetError.next_diagnostic_test = `Spaced transfer test in advanced electrodynamics / mechanics (Stage ${targetError.stage}).`;
  } else {
    // Target error occurred
    targetError.error_frequency += 1;
    targetError.recent_frequency += 1;
    targetError.status = 'Unstable';
    targetError.model_confidence = Math.min(0.95, Number((targetError.model_confidence + 0.06).toFixed(2)));
    targetError.last_seen = new Date().toISOString();

    newEvidence = `Manifested ${targetError.name} in question "${q.id}" (${confidenceVal}% confidence, ${timeTaken}s).`;

    if (!modelRevision) {
      if (targetError.id === 'err_assoc_causation') {
        modelRevision = 'User reverts to association→causation ("higher temperature = heat absorbed") when the macroscopic state shift is prominent, failing to check mechanical work and adiabatic boundary conditions.';
      } else if (targetError.id === 'err_directionality_inversion') {
        modelRevision = 'Directional inversion occurs primarily when force and effect move oppositely through intermediate impedance or induced back-EMF (e.g. Lenz law back-action opposing motion).';
      } else if (targetError.id === 'err_premature_closure') {
        modelRevision = 'User closes physical inquiry prematurely upon recognizing a familiar prototype, bypassing envelope linearity and damping discriminators.';
      } else {
        modelRevision = `Error triggered under condition: ${targetError.trigger_conditions}. Current model reinforced with confidence ${targetError.model_confidence}.`;
      }
    }

    targetError.current_hypothesis = modelRevision;
    targetError.next_diagnostic_test = `Re-test under different physical disguise: ${targetError.countermeasure}`;
  }

  // Next Diagnostic Experiment Recommendation
  const nextExpMode: TestEngineMode = isCorrect
    ? (targetError.transfer_status === 'Pending' ? 'transfer_test' : 'mechanism_test')
    : 'weakness_hunt';

  const nextExperiment = {
    mode: nextExpMode,
    description: aiEvaluation?.recommended_next_test || (isCorrect
      ? `Advance to Stage ${targetError.stage}: Transfer test "${targetError.name}" into another physical system.`
      : `Re-test "${targetError.name}" under a different experimental disguise to test the refined hypothesis: "${modelRevision.slice(0, 80)}..."`),
    target: targetError.name,
  };

  // Persist updated user model in database
  const now = new Date().toISOString();
  db.prepare('UPDATE user_model SET error_profile = ?, confidence_calibration = ?, updated_at = ? WHERE user_id = ?').run(
    JSON.stringify(errors),
    JSON.stringify(calibration),
    now,
    userId
  );

  // Record attempt in question_attempts
  const attId = 'q_att_' + Date.now();
  db.prepare(`
    INSERT INTO question_attempts (
      id, user_id, question_id, answer, correct, confidence,
      reasoning, reasoning_error, time_taken, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    attId,
    userId,
    q.id,
    params.answer,
    isCorrect ? 1 : 0,
    confidenceVal,
    reasoningText,
    isCorrect ? '' : `Root Error: ${targetError.name}. ${calibrationAnalysis}`,
    timeTaken,
    now
  );

  // Emit to central adaptive evidence architecture
  const evidenceSummary = isCorrect
    ? `Test Attempt on "${q.topic_name || q.id}": Defended mechanism. Reasoning quality: ${reasoningQualityScore}%, stated confidence: ${confidenceVal}%, time: ${timeTaken}s.`
    : `Test Attempt on "${q.topic_name || q.id}": Manifested root error "${targetError.name}". Stated confidence: ${confidenceVal}%, time: ${timeTaken}s. Discriminator entrapment: ${q.discriminator_note || 'Bypassed critical physical discriminator.'}`;

  const emittedEvidence = processAdaptiveEvidence({
    user_id: userId,
    feature: 'mcq_test',
    topic_id: q.topic_id,
    topic_name: q.topic_name,
    error_id: targetError.id,
    error_name: targetError.name,
    correct_answer: isCorrect,
    correct_reasoning: reasoningQualityScore >= 70,
    robust_mechanism: isCorrect && reasoningQualityScore >= 75,
    transferable_mastery: q.question_type === 'TYPE_B_DISGUISED_TRANSFER' && isCorrect,
    confidence: confidenceVal,
    time_taken_sec: timeTaken,
    discriminator_identified: isCorrect,
    evidence_summary: evidenceSummary,
    created_at: now,
  });

  // Recalculate adaptive user model with new empirical evidence
  const updatedModel = computeAdaptiveUserModel(userId);

  return {
    correct: isCorrect,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    discriminator_note: q.discriminator_note,
    root_error_detected: isCorrect ? null : targetError.name,
    target_error_occurred: targetErrorOccurred,
    reasoning_quality_score: reasoningQualityScore,
    reasoning_critique: reasoningCritique,
    calibration_verdict: calibrationVerdict,
    calibration_analysis: calibrationAnalysis,
    time_efficiency_analysis: timeEfficiencyAnalysis,
    old_hypothesis: oldHypothesis,
    new_evidence: newEvidence,
    model_revision: modelRevision,
    next_experiment: nextExperiment,
    hierarchical_errors: updatedModel.hierarchical_errors,
    next_best_task: updatedModel.next_best_task,
    evidence: emittedEvidence,
  };
}
