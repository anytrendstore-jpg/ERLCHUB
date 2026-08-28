export type WhitelistPhase =
  | "registration"   
  | "discord"       
  | "roblox"         
  | "questionnaire"  
  | "review"         
  | "dni"            
  | "completed";     

export type ApplicationStatus =
  | "pending" 
  | "in_review" 
  | "approved" 
  | "rejected" 
  | "needs_revision"; 

export type RegistrationMethod = "email" | "discord" | "google";

export type DocumentType =
  | "license"
  | "residence_card"
  | "passport"
  /** Valores heredados de solicitudes creadas antes de unificar el pasaporte en un solo modelo. */
  | "california_license"
  | "passport_1"
  | "passport_2";

export type City = "los_santos" | "liberty_city" | "vice_city" | "las_venturas";

export interface CityInfo {
  id: City;
  name: string;
  state: string;
  country: string;
  available: boolean;
  flag: string;
  /** Degradado del botón de selección, a juego con los colores reales del logo de esa ciudad. */
  accent: string;
  /** Logo real de la ciudad (public/server/*.png), a juego con el degradado de accent. */
  logo: string;
  /** Texto de venta: por qué elegir esta ciudad, para que el jugador decida con criterio. */
  description: string;
}

export interface DiscordData {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
  verified: boolean;
  connectedAt: Date;
}

export interface RobloxData {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  verified: boolean;
  connectedAt: Date;
}

export interface QuestionnaireResponse {
  question: string;
  answer: string;
}

export interface CharacterData {
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  gender: "male" | "female" | "other";
  height: string;
  nationality: string;
  city: City;
  group: string;
  avatar: string;
}

export interface GeneratedDocument {
  id: string;
  type: DocumentType;
  characterData: CharacterData;
  issueDate: string;
  expirationDate: string;
  documentNumber: string;
  qrCode: string;
  securityCode: string;
  imageUrl?: string;
}

export interface ApplicantData {
  id: string;
  registrationMethod: RegistrationMethod;
  email?: string;
  currentPhase: WhitelistPhase;
  status: ApplicationStatus;
  discord?: DiscordData;
  roblox?: RobloxData;
  questionnaire?: QuestionnaireResponse[];
  questionnaireScore?: number;
  character?: CharacterData;
  documents?: GeneratedDocument[];
  staffNotes?: string;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/** Ruta a la que debe ir el usuario según la fase en la que esté — fuente única, también reexportada desde whitelistServer.ts. */
export const PHASE_ROUTES: Record<WhitelistPhase, string> = {
  registration: "/whitelist",
  discord: "/whitelist/discord",
  roblox: "/whitelist/roblox",
  questionnaire: "/whitelist/formulario",
  review: "/whitelist/espera",
  dni: "/whitelist/dni",
  completed: "/whitelist/completado",
};

export interface PhaseInfo {
  id: WhitelistPhase;
  number: number;
  title: string;
  description: string;
  icon: string;
}

export interface StaffFilters {
  status?: ApplicationStatus;
  phase?: WhitelistPhase;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface QuestionConfig {
  id: string;
  question: string;
  type: "text" | "textarea" | "select" | "radio";
  options?: string[];
  required: boolean;
  minLength?: number;
  maxLength?: number;
  hint?: string;
}

export const CITIES: CityInfo[] = [
  {
    id: "los_santos",
    name: "Los Santos",
    state: "California",
    country: "Estados Unidos",
    available: true,
    flag: "🇺🇸",
    accent: "from-[#00c6fb] via-[#e6007a] to-[#fb8500]",
    logo: "/server/los-santos.png",
    description: "Sol, palmeras y la city grande de California. El corazón del roleplay: policía, bandas, negocios y una economía que nunca duerme."
  },
  {
    id: "liberty_city",
    name: "Liberty City",
    state: "Liberty City State",
    country: "Estados Unidos",
    available: false,
    flag: "🇺🇸",
    accent: "from-[#c7ced6] via-[#5f8fd6] to-[#0f2e5c]",
    logo: "/server/liberty-city.png",
    description: "El pulso de una gran metrópoli. Rascacielos, crimen organizado y una vida nocturna que no se detiene nunca."
  },
  {
    id: "vice_city",
    name: "Vice City",
    state: "Florida",
    country: "Estados Unidos",
    available: false,
    flag: "🇺🇸",
    accent: "from-[#ff2fd4] via-[#a855f7] to-[#22d3ee]",
    logo: "/server/vice-city.png",
    description: "Neones, playas de Florida y estética retro de los 80. Para quienes buscan un roleplay más relajado y con estilo."
  },
  {
    id: "las_venturas",
    name: "Las Venturas",
    state: "Nevada",
    country: "Estados Unidos",
    available: false,
    flag: "🇺🇸",
    accent: "from-[#dc2626] via-[#f59e0b] to-[#7f1d1d]",
    logo: "/server/las-venturas.png",
    description: "Casinos y luces de neón en pleno desierto de Nevada. La ciudad del juego, el lujo y las segundas oportunidades."
  }
];

export const PHASES: PhaseInfo[] = [
  {
    id: "registration",
    number: 0,
    title: "Acceso",
    description: "Inicia sesión con Discord",
    icon: "UserPlus"
  },
  {
    id: "discord",
    number: 1,
    title: "Discord",
    description: "Únete al servidor y acepta las reglas",
    icon: "MessageCircle"
  },
  {
    id: "roblox",
    number: 2,
    title: "Roblox",
    description: "Vincula tu cuenta de Roblox",
    icon: "Gamepad2"
  },
  {
    id: "questionnaire",
    number: 3,
    title: "Evaluación",
    description: "Completa el formulario de roleplay",
    icon: "FileText"
  },
  {
    id: "review",
    number: 4,
    title: "Revisión",
    description: "Tu solicitud está siendo revisada",
    icon: "Clock"
  },
  {
    id: "dni",
    number: 5,
    title: "Documentos",
    description: "Crea tu documento de identidad",
    icon: "CreditCard"
  },
  {
    id: "completed",
    number: 6,
    title: "Completado",
    description: "Whitelist aprobada",
    icon: "CheckCircle"
  }
];

export const QUESTIONNAIRE_QUESTIONS: QuestionConfig[] = [
  {
    id: "q1",
    question: "¿Qué es el roleplay y cuál es su objetivo principal?",
    type: "textarea",
    required: true,
    minLength: 100,
    maxLength: 500,
    hint: "Explica con tus propias palabras qué significa hacer roleplay"
  },
  {
    id: "q2",
    question: "¿Qué significa el término 'IC' (In Character) y 'OOC' (Out of Character)?",
    type: "textarea",
    required: true,
    minLength: 80,
    maxLength: 400,
    hint: "Describe la diferencia entre actuar como personaje y ser tú mismo"
  },
  {
    id: "q3",
    question: "¿Qué es el 'Metagaming' y por qué está prohibido?",
    type: "textarea",
    required: true,
    minLength: 80,
    maxLength: 400,
    hint: "Explica qué es y da un ejemplo"
  },
  {
    id: "q4",
    question: "¿Qué es el 'Powergaming' y cómo afecta al roleplay?",
    type: "textarea",
    required: true,
    minLength: 80,
    maxLength: 400,
    hint: "Describe este comportamiento y por qué es negativo"
  },
  {
    id: "q5",
    question: "Describe la historia de fondo (background) de tu personaje",
    type: "textarea",
    required: true,
    minLength: 200,
    maxLength: 1000,
    hint: "Incluye origen, motivaciones, personalidad y objetivos"
  },
  {
    id: "q6",
    question: "¿Cómo reaccionaría tu personaje si es asaltado a punta de pistola?",
    type: "textarea",
    required: true,
    minLength: 100,
    maxLength: 500,
    hint: "Describe la situación de roleplay paso a paso"
  },
  {
    id: "q7",
    question: "¿Qué harías si presencias una violación de reglas por parte de otro jugador?",
    type: "textarea",
    required: true,
    minLength: 80,
    maxLength: 400,
    hint: "Describe el procedimiento correcto"
  },
  {
    id: "q8",
    question: "¿Tienes experiencia previa en servidores de roleplay? Si es así, ¿cuáles?",
    type: "textarea",
    required: true,
    minLength: 50,
    maxLength: 300,
    hint: "Menciona servidores y tiempo de experiencia"
  },
  {
    id: "q9",
    question: "¿Qué facción o trabajo te gustaría desempeñar en el servidor?",
    type: "select",
    required: true,
    options: [
      "Policía / LSPD",
      "Servicios Médicos / EMS",
      "Bomberos / LSFD",
      "Mecánico",
      "Civil / Empresario",
      "Criminal / Pandillero",
      "Abogado / Legal",
      "Político / Gobierno",
      "Periodista / Medios",
      "Otro"
    ]
  },
  {
    id: "q10",
    question: "¿Por qué quieres unirte a ERLC HUB?",
    type: "textarea",
    required: true,
    minLength: 100,
    maxLength: 500,
    hint: "Cuéntanos tus motivaciones para ser parte de nuestra comunidad"
  }
];

export const HEIGHT_OPTIONS = [
  "1.50m - 1.55m",
  "1.56m - 1.60m",
  "1.61m - 1.65m",
  "1.66m - 1.70m",
  "1.71m - 1.75m",
  "1.76m - 1.80m",
  "1.81m - 1.85m",
  "1.86m - 1.90m",
  "1.91m - 1.95m",
  "1.96m - 2.00m"
];

/** Solo países hispanohablantes, tal como pide el brief del DNI del servidor. */
export const NATIONALITY_OPTIONS = [
  "Mexicano",
  "Colombiano",
  "Argentino",
  "Venezolano",
  "Peruano",
  "Chileno",
  "Español",
  "Ecuatoriano",
  "Boliviano",
  "Paraguayo",
  "Uruguayo",
  "Guatemalteco",
  "Hondureño",
  "Salvadoreño",
  "Nicaragüense",
  "Costarricense",
  "Panameño",
  "Cubano",
  "Dominicano",
  "Puertorriqueño"
];

/** Lugar de nacimiento: las 4 ciudades del servidor + un cajón para el resto del mundo hispano. */
export const BIRTHPLACE_OPTIONS = [
  "Los Santos",
  "Liberty City",
  "Vice City",
  "Las Venturas",
  "Países Hispanos"
];

export const GROUP_OPTIONS = [
  "Ciudadano",
  "LSPD - Policía",
  "LSFD - Bomberos",
  "EMS - Servicios Médicos",
  "Mecánico",
  "Taxista",
  "Empresario",
  "Criminal",
  "Sin afiliación"
];