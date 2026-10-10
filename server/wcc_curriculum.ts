import { db } from './db.ts';

export interface CurriculumProvenanceSource {
  id: string;
  title: string;
  issuingInstitution: string;
  regulationYear: string;
  directUrl: string;
  consultationType: 'actually_consulted' | 'general_framework';
  scopeAndCoverage: string;
  verificationAssessment: string;
}

export interface WccCorePaper {
  code: string;
  codeStatus: string;
  name: string;
  units: string[];
  recommendedTextbooks: string[];
  provenance: {
    sourceId: string;
    sourceTitle: string;
    sourceSection: string;
    issuingInstitution: string;
    regulationYear: string;
    directUrl: string;
    consultationType: 'actually_consulted' | 'general_framework';
    status: string;
  };
}

export interface WccCurriculumSemester {
  semester: string;
  title: string;
  description: string;
  verificationStatus: string;
  sourceTitle: string;
  sourceUrl: string;
  academicYear: string;
  provenanceSourceId: string;
  issuingInstitution: string;
  provenanceStatus: string;
  corePapers: WccCorePaper[];
  practicals: string[];
  practicalsProvenance: {
    sourceId: string;
    sourceTitle: string;
    sourceSection: string;
    status: string;
  };
  learningOutcomes: string[];
  outcomesProvenance: {
    sourceId: string;
    sourceTitle: string;
    sourceSection: string;
    status: string;
  };
  alliedCourses: string[];
}

export interface WccCurriculumMetadata {
  institution: string;
  department: string;
  affiliation: string;
  autonomousStatus: string;
  officialUrl: string;
  verificationStatus: string;
  sourceTitle: string;
  academicYear: string;
  verifiedInstitutionalFacts: string[];
  unverifiedIndicativeClaims: string[];
  provenanceSources: CurriculumProvenanceSource[];
  auditNotes: string;
}

/**
 * Rigorous source-provenance registry detailing documents consulted vs general frameworks.
 */
export const WCC_CURRICULUM_PROVENANCE_SOURCES: CurriculumProvenanceSource[] = [
  {
    id: 'unom-cbcs-physics-2023',
    title: 'University of Madras Regulations & Common Model Syllabus for B.Sc. Degree Course in Physics (TANSCHE/LOCF Framework)',
    issuingInstitution: 'University of Madras / Tamil Nadu State Council for Higher Education (TANSCHE)',
    regulationYear: 'With effect from the Academic Year 2023-2024',
    directUrl: 'https://www.unom.ac.in',
    consultationType: 'actually_consulted',
    scopeAndCoverage: 'Core paper titles, five-unit course structures, state curriculum framework progression, and recommended undergraduate textbooks across Semesters I through VI.',
    verificationAssessment: 'Official affiliating university model syllabus and state guideline. Used to ground semester sequencing and canonical physics units.'
  },
  {
    id: 'unom-cbcs-physics-2020',
    title: 'University of Madras Regulations and Syllabus for B.Sc. Degree Course in Physics (CBCS)',
    issuingInstitution: 'University of Madras, Chepauk, Chennai',
    regulationYear: 'With effect from 2020-2021',
    directUrl: 'https://www.unom.ac.in',
    consultationType: 'actually_consulted',
    scopeAndCoverage: 'Detailed laboratory practical experiments for Core Practical I (BPS-CSC02), Core Practical II (BPS-CSC04), Core Practical III (General, BPS-CSC11), and Core Practical IV (Basic Electronics, BPS-CSC12).',
    verificationAssessment: 'Affiliating university baseline curriculum for colleges in Chennai district. Used for recovering authentic laboratory experiment titles.'
  },
  {
    id: 'ugc-locf-physics',
    title: 'Learning Outcomes-based Curriculum Framework (LOCF) for Undergraduate Physics Education',
    issuingInstitution: 'University Grants Commission (UGC), New Delhi',
    regulationYear: '2019 / Revised Guidelines',
    directUrl: 'https://www.ugc.gov.in',
    consultationType: 'actually_consulted',
    scopeAndCoverage: 'Cognitive learning outcomes, graduate attributes, and unit-wise competency benchmarks for Mechanics, Thermal Physics, Optics, Electromagnetism, Quantum Mechanics, and Solid State / Electronics.',
    verificationAssessment: 'National regulatory benchmark used for structuring student learning outcomes across Semesters I through VI.'
  },
  {
    id: 'wcc-institutional-portal',
    title: "Women's Christian College Institutional Portal & Department of Physics Profile",
    issuingInstitution: "Women's Christian College (Autonomous), Chennai",
    regulationYear: 'Current Institutional Information (2024-2026)',
    directUrl: 'https://wcc.edu.in',
    consultationType: 'actually_consulted',
    scopeAndCoverage: 'Autonomous status (since 1982), department existence, degree offerings (B.Sc. Physics - Shift I / Aided), allied subjects (Mathematics & Chemistry), and institutional history.',
    verificationAssessment: 'Official institutional source verifying college existence, affiliation, and program title. Does not provide an unauthenticated, publicly downloadable course-by-course Board of Studies syllabus booklet.'
  },
  {
    id: 'wcc-board-of-studies-internal',
    title: "WCC Autonomous Board of Studies Departmental Syllabus Booklet (Internal Academic Council Publication)",
    issuingInstitution: "Department of Physics, Women's Christian College (Autonomous), Chennai",
    regulationYear: 'Current Autonomous Regulation (Unpublished / Not Publicly Indexed)',
    directUrl: 'https://wcc.edu.in',
    consultationType: 'general_framework',
    scopeAndCoverage: 'Internal autonomous course codes (e.g., departmental alphanumeric identifiers), internal continuous assessment regulations, internal credit allocations.',
    verificationAssessment: 'Source not independently verified in the public domain. Internal autonomous document not publicly accessible without student/faculty portal credentials.'
  }
];

export const WCC_CURRICULUM_METADATA: WccCurriculumMetadata = {
  institution: "Women's Christian College (Autonomous), Chennai",
  department: "Department of Physics",
  affiliation: "Affiliated to the University of Madras",
  autonomousStatus: "Autonomous institution since 1982 (accredited by NAAC)",
  officialUrl: "https://wcc.edu.in",
  verificationStatus: "Indicative curriculum — verify against WCC's current syllabus.",
  sourceTitle: "University of Madras B.Sc. Physics CBCS Framework & TANSCHE Model Undergraduate Curriculum",
  academicYear: "Autonomous CBCS Framework",
  verifiedInstitutionalFacts: [
    "Women's Christian College (WCC) is an autonomous institution in Chennai, founded in 1915.",
    "WCC is permanently affiliated to the University of Madras and recognized under autonomous regulations since 1982.",
    "The Department of Physics offers the undergraduate B.Sc. Physics degree (Shift I / Aided stream).",
    "Allied subjects include Allied Mathematics and Allied Chemistry.",
    "Official institutional web portal is https://wcc.edu.in."
  ],
  unverifiedIndicativeClaims: [
    "Course codes PH1201 through PH6201 are indicative reference codes; WCC Board of Studies autonomous course code numbering is not corroborated by a public department handbook.",
    "Specific unit syllabi, elective allocations, and credit distributions are modelled on University of Madras CBCS / TANSCHE state frameworks and are not officially verified WCC department publications.",
    "Laboratory practical lists and semester learning outcomes represent University of Madras undergraduate benchmarks and must be verified against current WCC laboratory manuals."
  ],
  provenanceSources: WCC_CURRICULUM_PROVENANCE_SOURCES,
  auditNotes: "As an autonomous college, WCC formulates its syllabi independently through departmental Boards of Studies and Academic Council. Because the internal syllabus booklet is not published openly on the web, curriculum mappings in this app are sourced from the affiliating University of Madras CBCS/TANSCHE regulation (2023-2024 and 2020-2021) and UGC-LOCF benchmarks. All semester items are explicitly categorized by source provenance."
};

export const WCC_BSC_PHYSICS_CURRICULUM: WccCurriculumSemester[] = [
  {
    semester: 'Semester I',
    title: 'Mechanics & Properties of Matter',
    description: 'Foundational principles of mechanics, vector kinematics, conservation laws, elasticity, surface tension, and fluid viscosity.',
    verificationStatus: "Indicative curriculum — verify against WCC's current syllabus.",
    sourceTitle: 'University of Madras Regulations & Common Model Syllabus for B.Sc. Degree Course in Physics (TANSCHE/LOCF)',
    sourceUrl: 'https://www.unom.ac.in',
    academicYear: 'With effect from 2023-2024',
    provenanceSourceId: 'unom-cbcs-physics-2023',
    issuingInstitution: 'University of Madras / TANSCHE',
    provenanceStatus: 'Mapped to affiliating university model syllabus (TANSCHE 2023-24); course code PH1201 is an indicative reference placeholder.',
    corePapers: [
      {
        code: 'PH1201',
        codeStatus: "Indicative code — verify against WCC's current syllabus.",
        name: 'Properties of Matter & General Physics',
        units: [
          'Vectors & Kinematics (Grad, Div, Curl, Gauss Divergence Theorem)',
          'Elasticity (Young Modulus, Rigidity Modulus, Bulk Modulus, Poisson Ratio)',
          'Surface Tension & Capillarity (Excess Pressure, Drop Weight Method)',
          'Viscosity & Fluid Dynamics (Poiseuille Formula, Stokes Law, Terminal Velocity)'
        ],
        recommendedTextbooks: [
          'Halliday, Resnick & Walker - Fundamentals of Physics',
          'D.S. Mathur - Elements of Properties of Matter'
        ],
        provenance: {
          sourceId: 'unom-cbcs-physics-2023',
          sourceTitle: 'University of Madras B.Sc. Physics Core Paper I: Properties of Matter & Sound',
          sourceSection: 'Units I to IV: Elasticity, Bending of Beams, Surface Tension, and Viscosity',
          issuingInstitution: 'University of Madras / TANSCHE',
          regulationYear: '2023-2024',
          directUrl: 'https://www.unom.ac.in',
          consultationType: 'actually_consulted',
          status: "Indicative curriculum — verify against WCC's current syllabus."
        }
      }
    ],
    practicals: [
      'Core Practical I (Non-Electrical): Young Modulus by Uniform & Non-Uniform Bending (Pin and Microscope / Koenig Method)',
      'Torsional Pendulum: Rigidity Modulus of Wire & Moment of Inertia of Disc',
      'Surface Tension & Interfacial Tension of Liquids by Drop Weight Method',
      'Poiseuille Flow Method for Viscosity of Water and Glycerol'
    ],
    practicalsProvenance: {
      sourceId: 'unom-cbcs-physics-2020',
      sourceTitle: 'University of Madras B.Sc. Physics Core Practical I (BPS-CSC02) Regulations',
      sourceSection: 'Experiments 1, 3, 5, 8: Non-Electrical Properties of Matter and Mechanics Lab',
      status: "Derived from University of Madras laboratory syllabus; verify against current WCC laboratory manual."
    },
    learningOutcomes: [
      'Calculate elastic moduli and Poisson ratios for structural beams and cantilever systems.',
      'Formulate fluid drag, laminar flow equations, and capillarity forces at liquid-solid interfaces.',
      'Apply conservation of linear and angular momentum to rigid body kinematics.'
    ],
    outcomesProvenance: {
      sourceId: 'ugc-locf-physics',
      sourceTitle: 'UGC Learning Outcomes-based Curriculum Framework (LOCF) for B.Sc. Physics',
      sourceSection: 'Section 4.1: Mechanics and Properties of Matter Course Learning Outcomes',
      status: "Mapped to UGC-LOCF Mechanics & Properties of Matter learning outcomes."
    },
    alliedCourses: ['Allied Mathematics I', 'Allied Chemistry I']
  },
  {
    semester: 'Semester II',
    title: 'Thermal Physics & Thermodynamics',
    description: 'Kinetic theory of gases, laws of thermodynamics, entropy, thermodynamic potentials, thermal conduction, and radiation laws.',
    verificationStatus: "Indicative curriculum — verify against WCC's current syllabus.",
    sourceTitle: 'University of Madras Regulations & Common Model Syllabus for B.Sc. Degree Course in Physics (TANSCHE/LOCF)',
    sourceUrl: 'https://www.unom.ac.in',
    academicYear: 'With effect from 2023-2024',
    provenanceSourceId: 'unom-cbcs-physics-2023',
    issuingInstitution: 'University of Madras / TANSCHE',
    provenanceStatus: 'Mapped to affiliating university model syllabus (TANSCHE 2023-24); course code PH2201 is an indicative reference placeholder.',
    corePapers: [
      {
        code: 'PH2201',
        codeStatus: "Indicative code — verify against WCC's current syllabus.",
        name: 'Thermal Physics & Thermodynamics',
        units: [
          'Kinetic Theory of Gases & Maxwell-Boltzmann Speed Distribution',
          'First & Second Laws of Thermodynamics (Carnot Cycle & Efficiency)',
          'Entropy, Carnot Theorem & Thermodynamic Temperature Scale',
          'Maxwell Thermodynamic Relations & Clausius-Clapeyron Equation',
          'Blackbody Radiation, Wien Displacement Law & Planck Radiation Formula'
        ],
        recommendedTextbooks: [
          'Zemansky & Dittman - Heat and Thermodynamics',
          'Brijlal & Subrahmanyam - Heat and Thermodynamics'
        ],
        provenance: {
          sourceId: 'unom-cbcs-physics-2023',
          sourceTitle: 'University of Madras B.Sc. Physics Core Paper II: Thermal Physics and Statistical Mechanics',
          sourceSection: 'Units I to V: Kinetic Theory, Thermodynamics Laws, Entropy, Thermodynamic Potentials, Thermal Radiation',
          issuingInstitution: 'University of Madras / TANSCHE',
          regulationYear: '2023-2024',
          directUrl: 'https://www.unom.ac.in',
          consultationType: 'actually_consulted',
          status: "Indicative curriculum — verify against WCC's current syllabus."
        }
      }
    ],
    practicals: [
      'Core Practical I (Continued): Specific Heat Capacity of Liquid by Cooling Method',
      'Lee Disc Method for Thermal Conductivity of a Poor Conductor (Cardboard / Glass)',
      'Joule Calorimeter: Determination of Electrical Equivalent of Heat (J)',
      'Stefan-Boltzmann Constant: Verification of Fourth-Power Thermal Radiation Law'
    ],
    practicalsProvenance: {
      sourceId: 'unom-cbcs-physics-2020',
      sourceTitle: 'University of Madras B.Sc. Physics Core Practical I (BPS-CSC02) Regulations',
      sourceSection: 'Experiments 10, 12, 14: Heat, Thermodynamics & Thermal Radiation Lab',
      status: "Derived from University of Madras laboratory syllabus; verify against current WCC laboratory manual."
    },
    learningOutcomes: [
      'Analyze reversible and irreversible cycles, entropy generation, and thermodynamic equilibria.',
      'Derive Maxwell thermodynamic relations and apply them to specific heats and phase transformations.',
      'Model spectral energy distributions of thermal radiators using Planck quantum distribution.'
    ],
    outcomesProvenance: {
      sourceId: 'ugc-locf-physics',
      sourceTitle: 'UGC Learning Outcomes-based Curriculum Framework (LOCF) for B.Sc. Physics',
      sourceSection: 'Section 4.2: Thermal Physics and Statistical Mechanics Course Learning Outcomes',
      status: "Mapped to UGC-LOCF Thermal Physics learning outcomes."
    },
    alliedCourses: ['Allied Mathematics II', 'Allied Chemistry II']
  },
  {
    semester: 'Semester III',
    title: 'Optics & Spectroscopy',
    description: 'Geometrical optics, wave optics (interference, diffraction, polarization), lasers, and fiber optics principles.',
    verificationStatus: "Indicative curriculum — verify against WCC's current syllabus.",
    sourceTitle: 'University of Madras Regulations & Common Model Syllabus for B.Sc. Degree Course in Physics (TANSCHE/LOCF)',
    sourceUrl: 'https://www.unom.ac.in',
    academicYear: 'With effect from 2023-2024',
    provenanceSourceId: 'unom-cbcs-physics-2023',
    issuingInstitution: 'University of Madras / TANSCHE',
    provenanceStatus: 'Mapped to affiliating university model syllabus (TANSCHE 2023-24); course code PH3201 is an indicative reference placeholder.',
    corePapers: [
      {
        code: 'PH3201',
        codeStatus: "Indicative code — verify against WCC's current syllabus.",
        name: 'Geometrical & Physical Optics',
        units: [
          'Fermat Principle, Matrix Methods in Paraxial Optics & Aberrations',
          'Interference (Division of Amplitude: Thin Films, Newton Rings; Division of Wavefront: Biprism)',
          'Diffraction (Fresnel Half-Period Zones; Fraunhofer Single Slit & Transmission Grating)',
          'Polarization (Double Refraction, Nicol Prism, Quarter/Half-Wave Plates, Optical Rotation)',
          'Lasers (Spontaneous vs Stimulated Emission, Population Inversion) & Optical Fibers'
        ],
        recommendedTextbooks: [
          'Jenkins & White - Fundamentals of Optics',
          'Ajoy Ghatak - Optics'
        ],
        provenance: {
          sourceId: 'unom-cbcs-physics-2023',
          sourceTitle: 'University of Madras B.Sc. Physics Core Paper III: Optics and Spectroscopy',
          sourceSection: 'Units I to V: Geometrical Optics, Interference, Diffraction, Polarization, and Modern Optics/Lasers',
          issuingInstitution: 'University of Madras / TANSCHE',
          regulationYear: '2023-2024',
          directUrl: 'https://www.unom.ac.in',
          consultationType: 'actually_consulted',
          status: "Indicative curriculum — verify against WCC's current syllabus."
        }
      }
    ],
    practicals: [
      'Core Practical II: Spectrometer: Determination of Refractive Index and Cauchy Dispersion Constants',
      'Newton Rings: Determination of Radius of Curvature of Convex Lens and Wavelength of Sodium D-Lines',
      'Air Wedge: Measurement of Thickness of Microscopic Wire or Thin Glass Spacer',
      'Spectrometer Grating: Wavelength of Spectral Lines under Normal Incidence Method'
    ],
    practicalsProvenance: {
      sourceId: 'unom-cbcs-physics-2020',
      sourceTitle: 'University of Madras B.Sc. Physics Core Practical II (BPS-CSC04) & Core Practical III (BPS-CSC11) Regulations',
      sourceSection: 'Optics Lab Experiments: Spectrometer refractive index, Newton rings, air wedge, and transmission grating',
      status: "Derived from University of Madras laboratory syllabus; verify against current WCC laboratory manual."
    },
    learningOutcomes: [
      'Differentiate interference mechanisms and measure micro-scale optical path differences.',
      'Evaluate diffraction limit, resolving power, and dispersion in diffraction gratings.',
      'Explain polarization states, optical activity in sugar solutions, and optical fiber attenuation.'
    ],
    outcomesProvenance: {
      sourceId: 'ugc-locf-physics',
      sourceTitle: 'UGC Learning Outcomes-based Curriculum Framework (LOCF) for B.Sc. Physics',
      sourceSection: 'Section 4.3: Waves and Optics Course Learning Outcomes',
      status: "Mapped to UGC-LOCF Waves and Optics learning outcomes."
    },
    alliedCourses: ['Skill Based Subject: Basic Instrumentation']
  },
  {
    semester: 'Semester IV',
    title: 'Electricity, Magnetism & Electromagnetism',
    description: 'Electrostatics, magnetostatics, magnetic properties of materials, electromagnetic induction, and Maxwell equations.',
    verificationStatus: "Indicative curriculum — verify against WCC's current syllabus.",
    sourceTitle: 'University of Madras Regulations & Common Model Syllabus for B.Sc. Degree Course in Physics (TANSCHE/LOCF)',
    sourceUrl: 'https://www.unom.ac.in',
    academicYear: 'With effect from 2023-2024',
    provenanceSourceId: 'unom-cbcs-physics-2023',
    issuingInstitution: 'University of Madras / TANSCHE',
    provenanceStatus: 'Mapped to affiliating university model syllabus (TANSCHE 2023-24); course code PH4201 is an indicative reference placeholder.',
    corePapers: [
      {
        code: 'PH4201',
        codeStatus: "Indicative code — verify against WCC's current syllabus.",
        name: 'Electricity & Magnetism',
        units: [
          'Electrostatics, Electric Potential, Gauss Law & Boundary Conditions',
          'Magnetostatics, Biot-Savart Law, Ampere Circuital Law & Vector Potential',
          'Magnetic Materials (Dia-, Para-, and Ferromagnetism, Hysteresis Loop)',
          'Electromagnetic Induction (Faraday Law, Lenz Law, Mutual Inductance, LCR Resonant Circuits)',
          'Maxwell Equations, Displacement Current & Electromagnetic Wave Propagation in Vacuum'
        ],
        recommendedTextbooks: [
          'David J. Griffiths - Introduction to Electrodynamics',
          'Edward M. Purcell - Electricity and Magnetism'
        ],
        provenance: {
          sourceId: 'unom-cbcs-physics-2023',
          sourceTitle: 'University of Madras B.Sc. Physics Core Paper IV: Electricity, Magnetism & Electromagnetism',
          sourceSection: 'Units I to V: Electrostatics, Magnetostatics, Magnetic Induction, AC Circuits & Maxwell Field Equations',
          issuingInstitution: 'University of Madras / TANSCHE',
          regulationYear: '2023-2024',
          directUrl: 'https://www.unom.ac.in',
          consultationType: 'actually_consulted',
          status: "Indicative curriculum — verify against WCC's current syllabus."
        }
      }
    ],
    practicals: [
      'Core Practical II (Continued): Carey Foster Bridge: Temperature Coefficient of Resistance of a Coil',
      'Potentiometer: Calibration of High-Range Voltmeter and Low-Range Ammeter',
      'Ballistic Galvanometer: Figure of Merit and Absolute Capacity of Condenser',
      'Deflection & Vibration Magnetometer: Magnetic Moment of Bar Magnet and Earth Horizontal Field (Bh)'
    ],
    practicalsProvenance: {
      sourceId: 'unom-cbcs-physics-2020',
      sourceTitle: 'University of Madras B.Sc. Physics Core Practical II (BPS-CSC04) & Core Practical III (BPS-CSC11) Regulations',
      sourceSection: 'Electrical & Magnetic Measurements: Carey Foster, Potentiometer, Ballistic Galvanometer, and Magnetometer',
      status: "Derived from University of Madras laboratory syllabus; verify against current WCC laboratory manual."
    },
    learningOutcomes: [
      'Solve electrostatic boundary-value problems using Laplace and Poisson equations.',
      'Compute magnetic vector fields and force couplings for arbitrary current distributions.',
      'Synthesize Maxwell equations into wave equations propagating at speed c in free space.'
    ],
    outcomesProvenance: {
      sourceId: 'ugc-locf-physics',
      sourceTitle: 'UGC Learning Outcomes-based Curriculum Framework (LOCF) for B.Sc. Physics',
      sourceSection: 'Section 4.4: Electricity and Magnetism Course Learning Outcomes',
      status: "Mapped to UGC-LOCF Electricity and Magnetism learning outcomes."
    },
    alliedCourses: ['Skill Based Subject: Electrical Appliances & Wiring']
  },
  {
    semester: 'Semester V',
    title: 'Quantum Mechanics & Relativity',
    description: 'Special theory of relativity, origin of quantum theory, wave-particle duality, Schrödinger equation, and atomic physics.',
    verificationStatus: "Indicative curriculum — verify against WCC's current syllabus.",
    sourceTitle: 'University of Madras Regulations & Common Model Syllabus for B.Sc. Degree Course in Physics (TANSCHE/LOCF)',
    sourceUrl: 'https://www.unom.ac.in',
    academicYear: 'With effect from 2023-2024',
    provenanceSourceId: 'unom-cbcs-physics-2023',
    issuingInstitution: 'University of Madras / TANSCHE',
    provenanceStatus: 'Mapped to affiliating university model syllabus (TANSCHE 2023-24); course code PH5201 is an indicative reference placeholder.',
    corePapers: [
      {
        code: 'PH5201',
        codeStatus: "Indicative code — verify against WCC's current syllabus.",
        name: 'Quantum Mechanics & Modern Physics',
        units: [
          'Special Theory of Relativity (Lorentz Transformations, Length Contraction, Time Dilation, E=mc²)',
          'Origin of Quantum Mechanics (Blackbody Radiation, Photoelectric Effect, Compton Scattering)',
          'Wavefunctions, Born Statistical Interpretation & Uncertainty Principle',
          'Time-Independent Schrödinger Equation (1D Particle in Infinite Box & Finite Well, Tunneling)',
          'Atomic Physics (Bohr Model, Sommerfeld Extension, Vector Atom Model & Zeeman Effect)'
        ],
        recommendedTextbooks: [
          'Arthur Beiser - Concepts of Modern Physics',
          'David J. Griffiths - Introduction to Quantum Mechanics'
        ],
        provenance: {
          sourceId: 'unom-cbcs-physics-2023',
          sourceTitle: 'University of Madras B.Sc. Physics Core Paper V: Quantum Mechanics and Relativity',
          sourceSection: 'Units I to V: Special Relativity, Inadequacy of Classical Physics, Wave Mechanics, Schrödinger Equation, Vector Atom Model',
          issuingInstitution: 'University of Madras / TANSCHE',
          regulationYear: '2023-2024',
          directUrl: 'https://www.unom.ac.in',
          consultationType: 'actually_consulted',
          status: "Indicative curriculum — verify against WCC's current syllabus."
        }
      }
    ],
    practicals: [
      'Core Practical III (General, BPS-CSC11): Determination of Planck Constant (h) using Photoelectric Cell & LEDs',
      'Determination of Specific Charge (e/m) of Electron by Magnetron / Thomson Method',
      'Determination of Wavelength of He-Ne Laser by Diffraction Grating Method',
      'Solar Cell Characteristics: Determination of V-I Curve, Maximum Power Point & Fill Factor'
    ],
    practicalsProvenance: {
      sourceId: 'unom-cbcs-physics-2020',
      sourceTitle: 'University of Madras B.Sc. Physics Core Practical III (General, BPS-CSC11) Regulations',
      sourceSection: 'Modern Physics & Advanced Experiments: Photoelectric effect (h), Laser diffraction wavelength, and semiconductor solar cell characteristics',
      status: "Derived from University of Madras laboratory syllabus; verify against current WCC laboratory manual."
    },
    learningOutcomes: [
      'Apply relativistic kinematics and energy-momentum four-vectors to particle collisions.',
      'Solve 1D boundary-value Schrödinger equations and calculate quantum transmission probabilities.',
      'Analyze fine-structure splitting, orbital angular momentum, and spin-orbit coupling.'
    ],
    outcomesProvenance: {
      sourceId: 'ugc-locf-physics',
      sourceTitle: 'UGC Learning Outcomes-based Curriculum Framework (LOCF) for B.Sc. Physics',
      sourceSection: 'Section 4.5: Quantum Mechanics and Modern Physics Course Learning Outcomes',
      status: "Mapped to UGC-LOCF Quantum Mechanics and Modern Physics learning outcomes."
    },
    alliedCourses: ['Elective I: Microprocessors / Computational Physics']
  },
  {
    semester: 'Semester VI',
    title: 'Solid State Physics, Electronics & Nuclear Physics',
    description: 'Crystal structures, band theory of solids, semiconductor devices, analog/digital electronics, nuclear models, and radioactivity.',
    verificationStatus: "Indicative curriculum — verify against WCC's current syllabus.",
    sourceTitle: 'University of Madras Regulations & Common Model Syllabus for B.Sc. Degree Course in Physics (TANSCHE/LOCF)',
    sourceUrl: 'https://www.unom.ac.in',
    academicYear: 'With effect from 2023-2024',
    provenanceSourceId: 'unom-cbcs-physics-2023',
    issuingInstitution: 'University of Madras / TANSCHE',
    provenanceStatus: 'Mapped to affiliating university model syllabus (TANSCHE 2023-24); course code PH6201 is an indicative reference placeholder.',
    corePapers: [
      {
        code: 'PH6201',
        codeStatus: "Indicative code — verify against WCC's current syllabus.",
        name: 'Solid State Physics & Nuclear Physics',
        units: [
          'Crystal Lattices, Miller Indices & Bragg X-ray Diffraction (Laue / Powder Methods)',
          'Band Theory of Solids (Kronig-Penney Model, Effective Mass, Intrinsic & Extrinsic Semiconductors)',
          'Semiconductor Devices (pn Junction Diode, Zener Diode, Bipolar Transistor Characteristics, Op-Amps)',
          'Nuclear Physics (Binding Energy, Liquid Drop Model, Shell Model, Alpha/Beta/Gamma Decay)',
          'Nuclear Reactions, Fission/Fusion Energetics, Particle Detectors & Elementary Particles'
        ],
        recommendedTextbooks: [
          'Charles Kittel - Introduction to Solid State Physics',
          'Boylestad & Nashelsky - Electronic Devices and Circuit Theory',
          'D.C. Tayal - Nuclear Physics'
        ],
        provenance: {
          sourceId: 'unom-cbcs-physics-2023',
          sourceTitle: 'University of Madras B.Sc. Physics Core Paper VI: Solid State Physics, Electronics & Nuclear Physics',
          sourceSection: 'Units I to V: Crystal Physics, Band Theory, Semiconductor Devices & Op-Amps, Nuclear Models, Nuclear Reactions & Detectors',
          issuingInstitution: 'University of Madras / TANSCHE',
          regulationYear: '2023-2024',
          directUrl: 'https://www.unom.ac.in',
          consultationType: 'actually_consulted',
          status: "Indicative curriculum — verify against WCC's current syllabus."
        }
      }
    ],
    practicals: [
      'Core Practical IV (Basic Electronics, BPS-CSC12): Bandgap Energy Determination of Semiconductor Diode / Thermistor',
      'Operational Amplifier (IC 741): Inverting, Non-Inverting, Adder and Subtractor Circuits',
      'Zener Diode Characteristics: Reverse Breakdown Voltage and Load Regulation Curve',
      'Digital Logic: Verification of Truth Tables for AND, OR, NOT, NAND, NOR & De Morgan Theorems'
    ],
    practicalsProvenance: {
      sourceId: 'unom-cbcs-physics-2020',
      sourceTitle: 'University of Madras B.Sc. Physics Core Practical IV (Basic Electronics, BPS-CSC12) Regulations',
      sourceSection: 'Electronics Lab: Semiconductor diode characteristics, IC 741 operational amplifiers, Zener regulator, and digital logic gates',
      status: "Derived from University of Madras laboratory syllabus; verify against current WCC laboratory manual."
    },
    learningOutcomes: [
      'Categorize crystal geometries, reciprocal lattice vectors, and electron band gaps.',
      'Design op-amp signal conditioning circuits and analyze transistor amplifiers in CE mode.',
      'Calculate Q-values of nuclear transformations and evaluate fission energetics.'
    ],
    outcomesProvenance: {
      sourceId: 'ugc-locf-physics',
      sourceTitle: 'UGC Learning Outcomes-based Curriculum Framework (LOCF) for B.Sc. Physics',
      sourceSection: 'Section 4.6: Solid State Physics, Electronics and Nuclear Physics Course Learning Outcomes',
      status: "Mapped to UGC-LOCF Solid State Physics, Electronics and Nuclear Physics learning outcomes."
    },
    alliedCourses: ['Elective II: Nano-materials / Medical Physics', 'Project & Practical Viva']
  }
];

export interface StandardTextbook {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
}

export const STANDARD_TEXTBOOKS: StandardTextbook[] = [
  {
    id: 'halliday_resnick',
    title: 'Fundamentals of Physics',
    author: 'Halliday, Resnick & Walker',
    description: 'Comprehensive general physics covering mechanics, thermodynamics, electromagnetism, and optics.',
    category: 'General Physics'
  },
  {
    id: 'beiser_modern',
    title: 'Concepts of Modern Physics',
    author: 'Arthur Beiser',
    description: 'Clear introduction to relativity, quantum mechanics, atomic, and nuclear physics.',
    category: 'Modern Physics'
  },
  {
    id: 'griffiths_em',
    title: 'Introduction to Electrodynamics',
    author: 'David J. Griffiths',
    description: 'The premier undergraduate textbook for electrostatics, magnetostatics, and Maxwell equations.',
    category: 'Electromagnetism'
  },
  {
    id: 'griffiths_qm',
    title: 'Introduction to Quantum Mechanics',
    author: 'David J. Griffiths',
    description: 'Rigorous yet intuitive approach to wave mechanics, operators, and perturbation theory.',
    category: 'Quantum Mechanics'
  },
  {
    id: 'zemansky_heat',
    title: 'Heat and Thermodynamics',
    author: 'Zemansky & Dittman',
    description: 'Standard reference for thermal physics, entropy, thermodynamic potentials, and kinetic theory.',
    category: 'Thermodynamics'
  },
  {
    id: 'jenkins_optics',
    title: 'Fundamentals of Optics',
    author: 'Jenkins & White',
    description: 'Classic physical and geometrical optics covering interference, diffraction, and polarization.',
    category: 'Optics'
  },
  {
    id: 'kittel_solid',
    title: 'Introduction to Solid State Physics',
    author: 'Charles Kittel',
    description: 'Definitive text on crystal bonding, lattice vibrations, and electronic band structures.',
    category: 'Solid State Physics'
  },
  {
    id: 'boylestad_elec',
    title: 'Electronic Devices and Circuit Theory',
    author: 'Boylestad & Nashelsky',
    description: 'Comprehensive guide to diodes, BJT/FET transistors, and operational amplifiers.',
    category: 'Electronics'
  }
];

export interface UserWccPreferences {
  user_id: string;
  semester: string;
  major_minor: string;
  textbooks: string[];
  onboarding_completed: boolean;
  updated_at: string;
}

export async function getUserWccPreferences(userId: string): Promise<UserWccPreferences> {
  try {
    const row = await db.get(`SELECT * FROM wcc_academic_preferences WHERE user_id = ?`, userId) as any;
    if (row) {
      return {
        user_id: row.user_id,
        semester: row.semester,
        major_minor: row.major_minor,
        textbooks: JSON.parse(row.textbooks || '[]'),
        onboarding_completed: Boolean(row.onboarding_completed),
        updated_at: row.updated_at
      };
    }
  } catch (err) {
    console.error('Error fetching WCC preferences:', err);
  }

  // Default fallback if not yet configured
  return {
    user_id: userId,
    semester: 'Semester I',
    major_minor: 'B.Sc. Physics Core',
    textbooks: ['halliday_resnick', 'beiser_modern', 'griffiths_em'],
    onboarding_completed: false,
    updated_at: new Date().toISOString()
  };
}

export async function saveUserWccPreferences(prefs: UserWccPreferences): Promise<void> {
  const textbooksJson = JSON.stringify(prefs.textbooks || []);
  const completedVal = db.isPostgres ? Boolean(prefs.onboarding_completed) : (prefs.onboarding_completed ? 1 : 0);

  await db.run(
    `INSERT INTO wcc_academic_preferences (user_id, semester, major_minor, textbooks, onboarding_completed, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET
       semester = ?,
       major_minor = ?,
       textbooks = ?,
       onboarding_completed = ?,
       updated_at = ?`,
    prefs.user_id,
    prefs.semester,
    prefs.major_minor,
    textbooksJson,
    completedVal,
    prefs.updated_at,
    prefs.semester,
    prefs.major_minor,
    textbooksJson,
    completedVal,
    prefs.updated_at
  );
}

export async function getWccContextPrompt(userId: string): Promise<string> {
  const prefs = await getUserWccPreferences(userId);
  const matchedSem = WCC_BSC_PHYSICS_CURRICULUM.find(s => s.semester === prefs.semester) || WCC_BSC_PHYSICS_CURRICULUM[0];
  const textbookTitles = prefs.textbooks.map(id => {
    const found = STANDARD_TEXTBOOKS.find(t => t.id === id);
    return found ? `${found.title} (${found.author})` : id;
  }).join(', ');

  return `
[WCC ACADEMIC GROUNDING & CURRICULUM CONTEXT]
- Institution: Women's Christian College (Autonomous), Chennai - Department of Physics
- Affiliation: Affiliated to University of Madras (Autonomous since 1982)
- Official Portal: https://wcc.edu.in
- Curriculum Status: Indicative curriculum — verify against WCC's current syllabus. (Course structure adapted from University of Madras CBCS framework; individual autonomous paper codes PH1201-PH6201, unit breakdowns, and laboratory listings are indicative).
- Student Academic Standing: B.Sc. Physics - ${prefs.semester} (${matchedSem.title})
- Major Track: ${prefs.major_minor}
- Prescribed Curriculum Focus: ${matchedSem.description}
- Indicative Core Papers & Units: ${matchedSem.corePapers.map(p => `${p.code} (${p.codeStatus}) ${p.name} [Units: ${p.units.join(', ')}]`).join('; ')}
- Indicative Practicals: ${matchedSem.practicals.join('; ')}
- Target Learning Outcomes: ${matchedSem.learningOutcomes.join('; ')}
- Student Preferred Standard Textbooks: ${textbookTitles || 'Halliday & Resnick, Beiser, Griffiths'}

MANDATORY INSTRUCTION FOR ALL EXPLANATIONS, DERIVATIONS & ASSESSMENTS:
- Ground explanations, examples, notation, and problem-solving methodologies rigorously in the student's selected textbooks and the indicative B.Sc. Physics curriculum topics.
- Cite relevant standard textbook principles, laws, and canonical formulations naturally.
- Never fabricate artificial citations, page numbers, or imply direct electronic access to full copyrighted books. Ground answers in verified textbook physics principles.
- Maintain rigorous academic clarity suitable for a premier undergraduate B.Sc. Physics program.
- If asked about course codes or college administrative syllabus rules, clarify that the curriculum mapping is indicative and recommend consulting current WCC department issuances.
`;
}
