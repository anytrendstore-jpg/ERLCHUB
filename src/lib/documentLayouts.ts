import type { City } from '@/lib/whitelistTypes';

/** Todas las plantillas son imágenes de 500x350 (ver /public/documents). */
export const DOCUMENT_IMAGE_SIZE = { width: 500, height: 350 };

/** Tamaño único para TODO el texto de datos, en los 3 tipos de documento — así se ve consistente en todas partes. */
export const FIELD_SIZE = 10;

/** Separación entre una etiqueta dibujada por código y su valor (solo cuando `field.label` está presente). */
export const LABEL_GAP = 0.038;

export type DocumentField = {
  key:
    | 'firstName' | 'lastName' | 'birthPlace' | 'sex' | 'height' | 'group'
    | 'birthDate' | 'issuedAt' | 'issuePlace' | 'expiryDate' | 'robloxUsername'
    | 'nationality' | 'documentNumber';
  /** Posición del VALOR como fracción del ancho/alto de la imagen (0-1). */
  x: number;
  y: number;
  size: number;
  color: string;
  weight?: string;
  align?: CanvasTextAlign;
  uppercase?: boolean;
  maxWidth?: number;
  /** Solo si la plantilla NO trae la etiqueta ya impresa — se dibuja justo encima del valor. */
  label?: string;
};

export type PhotoSlot = { x: number; y: number; w: number; h: number; shape: 'circle' | 'rect' };

/** Panel translúcido opcional detrás de los campos, para plantillas sin zona de datos reservada. */
export type DataPanel = { x: number; y: number; w: number; h: number };

export interface DocumentLayout {
  /** Ruta a la imagen real de referencia, usada tal cual como textura del frente. */
  image: string;
  /** Identificador usado por cardArt.ts para dibujar el REVERSO (sin foto de referencia). */
  artKey: string;
  fields: DocumentField[];
  photo?: PhotoSlot;
  panel?: DataPanel;
}

function field(key: DocumentField['key'], x: number, y: number, extra: Partial<DocumentField> = {}): DocumentField {
  return { key, x, y, size: FIELD_SIZE, color: '#1a1a1a', weight: '600', ...extra };
}

/**
 * Coordenadas medidas por análisis de píxeles sobre las plantillas reales
 * (bandas de texto oscuro en /public/documents/license-*.png) — por eso
 * LS/LB/VC/LV comparten la misma grilla de etiquetas.
 */
function licenseFields(): DocumentField[] {
  return [
    field('firstName', 0.335, 0.385, { weight: '700', uppercase: true }),
    field('robloxUsername', 0.774, 0.385, { color: '#7c3aed', weight: '700', maxWidth: 100 }),
    field('lastName', 0.335, 0.478, { weight: '700', uppercase: true }),
    field('birthPlace', 0.335, 0.573, { maxWidth: 130 }),
    field('sex', 0.335, 0.648),
    field('height', 0.45, 0.648),
    field('group', 0.60, 0.648, { maxWidth: 100 }),
    field('birthDate', 0.335, 0.723),
    field('issuedAt', 0.335, 0.805, { maxWidth: 190 }),
  ];
}

/**
 * Diseño nuevo de California: es un template en blanco (sin campos impresos
 * más allá del encabezado "CALIFORNIA / DRIVER LICENSE"), así que acá se
 * dibuja también el resto: una sola placa de datos debajo del encabezado con
 * la foto en su propia columna a la izquierda y la identidad en una columna
 * fija a la derecha — nunca se cruzan, cada dato tiene un lugar fijo.
 */
function losSantosFields(): DocumentField[] {
  const idCol = 0.335; // columna de identidad — arranca justo después de la foto
  const idColWidth = 300; // ancho disponible en px (sobre un lienzo de 500px) para esa columna
  const row3 = [idCol, idCol + 0.19, idCol + 0.38]; // sexo / altura / grupo, tres columnas iguales
  return [
    field('firstName', idCol, 0.365, { label: 'NOMBRE COMPLETO', size: 13, weight: '700', uppercase: true, maxWidth: idColWidth }),
    field('lastName', idCol, 0.425, { size: 13, weight: '700', uppercase: true, maxWidth: idColWidth }),
    field('birthDate', idCol, 0.515, { label: 'FECHA DE NACIMIENTO' }),
    field('sex', row3[0], 0.615, { label: 'SEXO' }),
    field('height', row3[1], 0.615, { label: 'ALTURA' }),
    field('group', row3[2], 0.615, { label: 'GRUPO', maxWidth: 110 }),
    field('issuedAt', idCol, 0.715, { label: 'FECHA Y LUGAR DE EXPEDICIÓN', maxWidth: idColWidth }),
    field('robloxUsername', idCol, 0.79, { label: 'USUARIO DEL SISTEMA', color: '#7c3aed', size: 9, weight: '600', maxWidth: idColWidth }),
    field('documentNumber', 0.08, 0.895, { label: 'DOCUMENT No.', size: 11, weight: '700' }),
  ];
}

export const LICENSE_LAYOUTS: Record<City, DocumentLayout> = {
  los_santos: {
    image: '/documents/license-los_santos.png', artKey: 'los_santos', fields: losSantosFields(),
    photo: { x: 0.17, y: 0.555, w: 0.2, h: 0.47, shape: 'rect' },
    panel: { x: 0.045, y: 0.275, w: 0.91, h: 0.645 },
  },
  liberty_city: {
    image: '/documents/license-liberty_city.png', artKey: 'liberty_city', fields: licenseFields(),
    photo: { x: 0.875, y: 0.655, w: 0.15, h: 0.22, shape: 'circle' },
  },
  vice_city: {
    image: '/documents/license-vice_city.png', artKey: 'vice_city', fields: licenseFields(),
    photo: { x: 0.115, y: 0.44, w: 0.18, h: 0.5, shape: 'rect' },
  },
  las_venturas: {
    image: '/documents/license-las_venturas.png', artKey: 'las_venturas', fields: licenseFields(),
    photo: { x: 0.875, y: 0.655, w: 0.15, h: 0.22, shape: 'circle' },
  },
};

/** Filas medidas sobre residence-card.png: 0.259/0.347/0.436/0.544/0.617/0.684/0.781 */
export const RESIDENCE_CARD_LAYOUT: DocumentLayout = {
  image: '/documents/residence-card.png',
  artKey: 'residence_card',
  fields: [
    field('nationality', 0.39, 0.30, { weight: '700' }),
    field('documentNumber', 0.72, 0.30, { weight: '700' }),
    field('lastName', 0.39, 0.388, { weight: '700', uppercase: true }),
    field('height', 0.72, 0.388),
    field('firstName', 0.39, 0.487, { weight: '700', uppercase: true }),
    field('group', 0.72, 0.487, { maxWidth: 100 }),
    field('sex', 0.39, 0.578),
    field('birthDate', 0.52, 0.578),
    field('issuePlace', 0.39, 0.645, { maxWidth: 100 }),
    field('issuedAt', 0.39, 0.72),
    field('expiryDate', 0.52, 0.72),
    field('robloxUsername', 0.72, 0.818, { color: '#7c3aed', weight: '700' }),
  ],
  photo: { x: 0.11, y: 0.28, w: 0.15, h: 0.20, shape: 'circle' },
};

export const PASSPORT_COVER_IMAGE = '/documents/passport-page1.png';

/** Filas medidas sobre passport-page2.png: 0.259/0.347/0.436/0.544/0.617/0.787 */
export const PASSPORT_DATA_LAYOUT: DocumentLayout = {
  image: '/documents/passport-page2.png',
  artKey: 'passport_data',
  fields: [
    field('nationality', 0.39, 0.30, { weight: '700' }),
    field('documentNumber', 0.72, 0.30, { weight: '700' }),
    field('lastName', 0.39, 0.388, { weight: '700', uppercase: true }),
    field('height', 0.72, 0.388),
    field('firstName', 0.39, 0.487, { weight: '700', uppercase: true }),
    field('group', 0.72, 0.487, { maxWidth: 90 }),
    field('sex', 0.39, 0.578),
    field('birthDate', 0.52, 0.578),
    field('issuePlace', 0.39, 0.645, { maxWidth: 90 }),
    field('issuedAt', 0.39, 0.735),
    field('expiryDate', 0.52, 0.735),
    field('robloxUsername', 0.72, 0.803, { color: '#7c3aed', weight: '700' }),
  ],
  photo: { x: 0.155, y: 0.534, w: 0.26, h: 0.53, shape: 'rect' },
};
