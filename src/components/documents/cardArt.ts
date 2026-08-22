/**
 * Arte vectorial de los documentos, dibujado a mano con Canvas 2D replicando
 * fielmente el diseño, la paleta y los elementos decorativos de las
 * plantillas de referencia (California/Liberty City/Florida/Nevada,
 * Tarjeta de Residencia y Pasaporte) — así el modelo 3D se ve nítido a
 * cualquier tamaño y cada documento tiene cara frontal y trasera reales.
 */

type Ctx = CanvasRenderingContext2D;

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStar(ctx: Ctx, cx: number, cy: number, r: number, color: string, rot = -Math.PI / 2) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const ang = (Math.PI / 5) * i + rot;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function starOutline(ctx: Ctx, cx: number, cy: number, r: number, color: string, lw: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

/** Logo compacto "ERLC HUB" tal como aparece en las plantillas: caja blanca redondeada, "ER" morado + "LC" negro, "HUB" debajo, con un pequeño subrayado. */
function erlcBadge(ctx: Ctx, x: number, y: number, w: number, h: number, style: 'light' | 'dark' = 'light') {
  ctx.save();
  if (style === 'light') {
    roundRect(ctx, x, y, w, h, h * 0.16);
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.fill();
  }
  ctx.textBaseline = 'alphabetic';
  ctx.font = `900 ${h * 0.4}px Arial, sans-serif`;
  const padX = w * 0.1;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8e00f7';
  ctx.fillText('ER', x + padX, y + h * 0.46);
  const erWidth = ctx.measureText('ER').width;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillText('LC', x + padX + erWidth, y + h * 0.46);
  ctx.font = `700 ${h * 0.24}px Arial, sans-serif`;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillText('HUB', x + padX, y + h * 0.78);
  ctx.strokeStyle = '#8e00f7';
  ctx.lineWidth = h * 0.03;
  ctx.beginPath();
  ctx.moveTo(x + padX, y + h * 0.85);
  ctx.lineTo(x + padX + w * 0.32, y + h * 0.85);
  ctx.stroke();
  ctx.restore();
}

function usaFlagIcon(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.save();
  roundRect(ctx, x, y, w, h, h * 0.06);
  ctx.clip();
  const stripeH = h / 7;
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#b22234' : '#ffffff';
    ctx.fillRect(x, y + i * stripeH, w, stripeH + 0.5);
  }
  ctx.fillStyle = '#3c3b6e';
  ctx.fillRect(x, y, w * 0.4, stripeH * 4);
  ctx.fillStyle = '#ffffff';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      drawStar(ctx, x + w * 0.08 + c * w * 0.13, y + stripeH * 0.6 + r * stripeH * 1.15, w * 0.022, '#fff');
    }
  }
  ctx.restore();
}

function ghostWatermark(ctx: Ctx, w: number, h: number, cx: number, cy: number, scale = 1) {
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.translate(cx, cy);
  ctx.rotate(-0.12);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${h * 0.24 * scale}px Arial, sans-serif`;
  ctx.fillStyle = '#8e00f7';
  ctx.fillText('ERLC', 0, 0);
  ctx.font = `700 ${h * 0.075 * scale}px Arial, sans-serif`;
  ctx.fillStyle = '#5b21b6';
  ctx.fillText('HUB', 0, h * 0.1 * scale);
  ctx.restore();
}

function crosshatch(ctx: Ctx, w: number, h: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = w * 0.0014;
  for (let i = -20; i < 40; i++) {
    ctx.beginPath();
    ctx.moveTo(i * w * 0.035, 0);
    ctx.lineTo(i * w * 0.035 + h, h);
    ctx.stroke();
  }
  ctx.restore();
}

function borderFrame(ctx: Ctx, w: number, h: number, color: string, alpha = 0.5) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = w * 0.005;
  roundRect(ctx, w * 0.012, h * 0.017, w * 0.976, h * 0.966, h * 0.05);
  ctx.stroke();
  ctx.restore();
}

/**
 * En la versión 2D esto recortaba esquinas redondeadas (el contenedor CSS ya
 * las tenía). En 3D la caja es de esquinas rectas, así que recortar aquí solo
 * dejaba las 4 esquinas del canvas transparentes → Three.js las pinta negras.
 * Por eso ya no recorta: solo deja el lienzo listo para pintarlo completo.
 */
function backdrop(_ctx: Ctx, _w: number, _h: number) {
  // no-op a propósito (ver comentario arriba)
}

/* -------------------------------------------------------------------- *
 * Licencia — Los Santos / California
 * -------------------------------------------------------------------- */

export function drawLosSantosFront(ctx: Ctx, w: number, h: number) {
  ctx.save();
  backdrop(ctx, w, h);

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#fdf6dd');
  grad.addColorStop(0.55, '#eef6e6');
  grad.addColorStop(1, '#e3f0e6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  crosshatch(ctx, w * 0.7, h * 0.55, '#2f8a8f', 0.14);

  // paisaje: sol, montaña y olas (esquina inferior derecha, muy pálido)
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = '#2f6f7a';
  ctx.lineWidth = h * 0.006;
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.42, h * 0.16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.55, h * 0.75);
  ctx.lineTo(w * 0.68, h * 0.5);
  ctx.lineTo(w * 0.8, h * 0.68);
  ctx.lineTo(w * 0.92, h * 0.48);
  ctx.lineTo(w * 1.02, h * 0.7);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(w * 0.55, h * (0.82 + i * 0.028));
    ctx.quadraticCurveTo(w * 0.75, h * (0.79 + i * 0.028), w, h * (0.83 + i * 0.028));
    ctx.stroke();
  }
  ctx.restore();

  // espiral teal inferior izquierda
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#2f8a8f';
  ctx.lineWidth = h * 0.012;
  for (let i = 1; i <= 5; i++) {
    ctx.beginPath();
    ctx.arc(w * 0.085, h * 0.78, (h * 0.11 / 5) * i, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  ghostWatermark(ctx, w, h, w * 0.66, h * 0.42, 1);

  // título
  ctx.fillStyle = '#0b3d66';
  ctx.textAlign = 'left';
  ctx.font = `700 ${h * 0.11}px Georgia, serif`;
  ctx.fillText('CALIFORNIA', w * 0.055, h * 0.115);

  usaFlagIcon(ctx, w * 0.6, h * 0.032, w * 0.075, h * 0.055);
  ctx.fillStyle = '#0b3d66';
  ctx.textAlign = 'left';
  ctx.font = `800 ${h * 0.04}px Arial, sans-serif`;
  ctx.fillText('DRIVER', w * 0.685, h * 0.07);
  ctx.fillText('LICENSE', w * 0.685, h * 0.115);

  // insignia dorada con estrella
  ctx.beginPath();
  ctx.arc(w * 0.925, h * 0.095, h * 0.058, 0, Math.PI * 2);
  ctx.fillStyle = '#f2a900';
  ctx.fill();
  ctx.lineWidth = h * 0.005;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  drawStar(ctx, w * 0.925, h * 0.095, h * 0.03, '#fff');

  // oso silueta
  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#8a6b4a';
  ctx.translate(w * 0.52, h * 0.85);
  ctx.scale(w * 0.00034, w * 0.00034);
  ctx.beginPath();
  ctx.ellipse(0, 0, 110, 55, 0, 0, Math.PI * 2);
  ctx.ellipse(-95, -30, 34, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // firma: mariposa + línea
  ctx.save();
  ctx.fillStyle = '#f2d16b';
  ctx.beginPath();
  ctx.arc(w * 0.1, h * 0.78, h * 0.028, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5aa7b0';
  ctx.beginPath();
  ctx.ellipse(w * 0.115, h * 0.79, w * 0.02, h * 0.018, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0b3d66';
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = h * 0.004;
  ctx.beginPath();
  ctx.moveTo(w * 0.045, h * 0.845);
  ctx.lineTo(w * 0.24, h * 0.845);
  ctx.stroke();
  ctx.restore();

  erlcBadge(ctx, w * 0.845, h * 0.855, w * 0.13, h * 0.11);

  ctx.restore();
  borderFrame(ctx, w, h, '#0b3d66');
}

export function drawLosSantosBack(ctx: Ctx, w: number, h: number) {
  drawGenericLicenseBack(ctx, w, h, '#0b3d66', '#eef6e6');
}

/* -------------------------------------------------------------------- *
 * Licencia — Liberty City
 * -------------------------------------------------------------------- */

export function drawLibertyCityFront(ctx: Ctx, w: number, h: number) {
  ctx.save();
  backdrop(ctx, w, h);

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#eef3ea');
  grad.addColorStop(1, '#dbe7dc');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  crosshatch(ctx, w, h, '#4c6b52', 0.08);

  // gran sello circular oficial (muy pálido) centro-derecha
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.translate(w * 0.66, h * 0.52);
  ctx.strokeStyle = '#3f6b47';
  ctx.lineWidth = h * 0.006;
  ctx.beginPath();
  ctx.arc(0, 0, h * 0.34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, h * 0.28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = `700 ${h * 0.16}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#3f6b47';
  ctx.fillText('★', 0, -h * 0.02);
  ctx.restore();

  ghostWatermark(ctx, w, h, w * 0.6, h * 0.44, 1.05);

  erlcBadge(ctx, w * 0.025, h * 0.03, w * 0.13, h * 0.11);

  ctx.fillStyle = '#2b3b30';
  ctx.textAlign = 'center';
  ctx.font = `700 ${h * 0.09}px Georgia, serif`;
  ctx.fillText('LIBERTY CITY STATE', w * 0.6, h * 0.11);
  ctx.font = `600 ${h * 0.035}px Georgia, serif`;
  ctx.save();
  ctx.letterSpacing = '6px';
  ctx.fillText('D R I V E R   L I C E N S E', w * 0.6, h * 0.155);
  ctx.restore();

  usaFlagIcon(ctx, w * 0.88, h * 0.035, w * 0.08, h * 0.06);

  ctx.save();
  ctx.fillStyle = '#2b3b30';
  ctx.textAlign = 'left';
  ctx.font = `700 ${h * 0.045}px Arial, sans-serif`;
  ctx.fillText('ID', w * 0.335, h * 0.235);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#2b3b30';
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = h * 0.004;
  ctx.beginPath();
  ctx.moveTo(w * 0.045, h * 0.88);
  ctx.lineTo(w * 0.24, h * 0.88);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
  borderFrame(ctx, w, h, '#2b3b30');
}

export function drawLibertyCityBack(ctx: Ctx, w: number, h: number) {
  drawGenericLicenseBack(ctx, w, h, '#2b3b30', '#eef3ea');
}

/* -------------------------------------------------------------------- *
 * Licencia — Vice City (Florida)
 * -------------------------------------------------------------------- */

export function drawViceCityFront(ctx: Ctx, w: number, h: number) {
  ctx.save();
  backdrop(ctx, w, h);

  ctx.fillStyle = '#faf6ea';
  ctx.fillRect(0, 0, w, h);

  // formas geométricas tostadas diagonales a la derecha
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#e7c79a';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(w * (0.55 + i * 0.16), 0);
    ctx.lineTo(w * (0.72 + i * 0.16), 0);
    ctx.lineTo(w * (0.62 + i * 0.16), h);
    ctx.lineTo(w * (0.45 + i * 0.16), h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  crosshatch(ctx, w * 0.6, h, '#c9a877', 0.08);
  ghostWatermark(ctx, w, h, w * 0.62, h * 0.4, 0.95);

  // caja de foto dorada grande a la izquierda
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = w * 0.01;
  ctx.shadowOffsetY = h * 0.01;
  roundRect(ctx, w * 0.045, h * 0.16, w * 0.19, h * 0.58, w * 0.012);
  ctx.fillStyle = '#e5c26b';
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#2f6b3f';
  ctx.textAlign = 'left';
  ctx.font = `italic 800 ${h * 0.1}px Georgia, serif`;
  ctx.fillText('Florida', w * 0.055, h * 0.115);
  const floridaW = ctx.measureText('Florida').width;
  ctx.fillStyle = '#4a4a4a';
  ctx.font = `700 ${h * 0.05}px Arial, sans-serif`;
  ctx.fillText('DRIVER LICENSE', w * 0.055 + floridaW + w * 0.02, h * 0.11);

  ctx.beginPath();
  ctx.arc(w * 0.88, h * 0.09, h * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = '#f2a900';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = h * 0.006;
  ctx.stroke();
  drawStar(ctx, w * 0.88, h * 0.09, h * 0.032, '#fff');
  usaFlagIcon(ctx, w * 0.925, h * 0.05, w * 0.06, h * 0.045);

  ctx.save();
  ctx.strokeStyle = '#4a4a4a';
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = h * 0.004;
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = h * 0.008;
  ctx.beginPath();
  ctx.moveTo(w * 0.045, h * 0.88);
  ctx.lineTo(w * 0.23, h * 0.88);
  ctx.stroke();
  ctx.restore();

  // sello dorado inferior derecho
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = w * 0.008;
  ctx.beginPath();
  ctx.arc(w * 0.885, h * 0.72, h * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = '#e5c26b';
  ctx.fill();
  ctx.restore();

  erlcBadge(ctx, w * 0.845, h * 0.855, w * 0.13, h * 0.11);

  ctx.restore();
  borderFrame(ctx, w, h, '#2f6b3f');
}

export function drawViceCityBack(ctx: Ctx, w: number, h: number) {
  drawGenericLicenseBack(ctx, w, h, '#2f6b3f', '#faf6ea');
}

/* -------------------------------------------------------------------- *
 * Licencia — Las Venturas (Nevada)
 * -------------------------------------------------------------------- */

export function drawLasVenturasFront(ctx: Ctx, w: number, h: number) {
  ctx.save();
  backdrop(ctx, w, h);

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#eef4fb');
  grad.addColorStop(1, '#d3e3f4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // silueta de montañas
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#7b9fc4';
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h * 0.26);
  ctx.lineTo(w * 0.42, h * 0.05);
  ctx.lineTo(w * 0.52, h * 0.2);
  ctx.lineTo(w * 0.63, h * 0.02);
  ctx.lineTo(w * 0.78, h * 0.22);
  ctx.lineTo(w * 0.92, h * 0.06);
  ctx.lineTo(w, h * 0.2);
  ctx.lineTo(w, h * 0.28);
  ctx.lineTo(w * 0.3, h * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ghostWatermark(ctx, w, h, w * 0.6, h * 0.5, 1);

  // florecillas azules a la derecha
  ctx.save();
  ctx.translate(w * 0.86, h * 0.42);
  ctx.strokeStyle = '#5a8f4f';
  ctx.lineWidth = h * 0.006;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * w * 0.02, h * 0.22);
    ctx.quadraticCurveTo(i * w * 0.02 - w * 0.01, h * 0.1, i * w * 0.02, 0);
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    drawStar(ctx, (i % 3) * w * 0.025, Math.floor(i / 3) * h * 0.1, w * 0.014, '#6ea3e0', 0);
  }
  ctx.restore();

  ctx.fillStyle = '#1c3f66';
  ctx.textAlign = 'left';
  ctx.font = `italic 800 ${h * 0.1}px Arial, sans-serif`;
  ctx.fillText('NEVADA', w * 0.055, h * 0.115);

  ctx.fillStyle = '#333';
  ctx.font = `800 ${h * 0.038}px Arial, sans-serif`;
  ctx.fillText('DRIVER LICENSE', w * 0.44, h * 0.075);
  usaFlagIcon(ctx, w * 0.79, h * 0.045, w * 0.07, h * 0.05);

  // insignia bandera Nevada (escudo dorado con estrella)
  ctx.save();
  ctx.translate(w * 0.925, h * 0.14);
  ctx.fillStyle = '#c9a227';
  ctx.beginPath();
  ctx.moveTo(-w * 0.045, -h * 0.09);
  ctx.lineTo(w * 0.045, -h * 0.09);
  ctx.lineTo(w * 0.045, h * 0.05);
  ctx.lineTo(0, h * 0.09);
  ctx.lineTo(-w * 0.045, h * 0.05);
  ctx.closePath();
  ctx.fill();
  drawStar(ctx, 0, -h * 0.02, h * 0.035, '#fff');
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#1c3f66';
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = h * 0.004;
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = h * 0.008;
  ctx.beginPath();
  ctx.moveTo(w * 0.045, h * 0.88);
  ctx.lineTo(w * 0.23, h * 0.88);
  ctx.stroke();
  ctx.restore();

  erlcBadge(ctx, w * 0.845, h * 0.855, w * 0.13, h * 0.11);

  ctx.restore();
  borderFrame(ctx, w, h, '#1c3f66');
}

export function drawLasVenturasBack(ctx: Ctx, w: number, h: number) {
  drawGenericLicenseBack(ctx, w, h, '#1c3f66', '#eef4fb');
}

/* -------------------------------------------------------------------- *
 * Dorso genérico de licencia (compartido, coloreado por ciudad)
 * -------------------------------------------------------------------- */

function drawGenericLicenseBack(ctx: Ctx, w: number, h: number, accent: string, bg: string) {
  ctx.save();
  backdrop(ctx, w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  crosshatch(ctx, w, h, accent, 0.06);
  ghostWatermark(ctx, w, h, w * 0.72, h * 0.55, 0.8);

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, h * 0.08, w, h * 0.15);

  ctx.save();
  ctx.translate(w * 0.06, h * 0.3);
  ctx.fillStyle = '#111';
  let bx = 0;
  for (let i = 0; i < 46; i++) {
    const bw = ((i * 37) % 5) / 5 * (w * 0.006) + w * 0.0025;
    if (i % 2 === 0) ctx.fillRect(bx, 0, bw, h * 0.1);
    bx += bw + w * 0.003;
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = accent;
  ctx.textAlign = 'left';
  ctx.font = `700 ${h * 0.032}px Arial, sans-serif`;
  ctx.fillText('RESTRICCIONES / ENDOSOS', w * 0.06, h * 0.48);
  ctx.font = `400 ${h * 0.025}px Arial, sans-serif`;
  ctx.globalAlpha = 0.85;
  const lines = [
    'NONE · Este documento es propiedad de ERLC HUB y se emite',
    'únicamente para uso dentro del roleplay del servidor.',
    'Si se encuentra, repórtelo al equipo de soporte de ERLC HUB.',
    'La alteración o falsificación de este documento está prohibida.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, w * 0.06, h * 0.56 + i * h * 0.045));
  ctx.restore();

  erlcBadge(ctx, w * 0.845, h * 0.85, w * 0.13, h * 0.11);
  ctx.restore();
  borderFrame(ctx, w, h, accent);
}

const LICENSE_FRONT: Record<string, (ctx: Ctx, w: number, h: number) => void> = {
  los_santos: drawLosSantosFront,
  liberty_city: drawLibertyCityFront,
  vice_city: drawViceCityFront,
  las_venturas: drawLasVenturasFront,
};
const LICENSE_BACK: Record<string, (ctx: Ctx, w: number, h: number) => void> = {
  los_santos: drawLosSantosBack,
  liberty_city: drawLibertyCityBack,
  vice_city: drawViceCityBack,
  las_venturas: drawLasVenturasBack,
};

export function drawLicenseFront(ctx: Ctx, w: number, h: number, cityId: string) {
  (LICENSE_FRONT[cityId] || drawLosSantosFront)(ctx, w, h);
}
export function drawLicenseBack(ctx: Ctx, w: number, h: number, cityId: string) {
  (LICENSE_BACK[cityId] || drawLosSantosBack)(ctx, w, h);
}

/* -------------------------------------------------------------------- *
 * Tarjeta de residencia
 * -------------------------------------------------------------------- */

export function drawResidenceFront(ctx: Ctx, w: number, h: number) {
  ctx.save();
  backdrop(ctx, w, h);
  ctx.fillStyle = '#eef0f5';
  ctx.fillRect(0, 0, w, h);

  // bandera de fondo, atenuada
  ctx.save();
  ctx.globalAlpha = 0.5;
  const stripeH = h / 9;
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#b22234' : '#f4f4f4';
    ctx.fillRect(0, i * stripeH, w, stripeH + 0.5);
  }
  ctx.fillStyle = '#3c3b6e';
  ctx.fillRect(0, 0, w * 0.32, h * 0.5);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      drawStar(ctx, w * 0.03 + c * w * 0.075, h * 0.08 + r * h * 0.15, w * 0.018, 'rgba(255,255,255,0.85)');
    }
  }
  ctx.restore();

  // estrellas grandes decorativas (una azul marino, otra verde-teal) sobre el campo azul
  starOutline(ctx, w * 0.09, h * 0.32, h * 0.11, '#1c2b52', h * 0.012);
  starOutline(ctx, w * 0.2, h * 0.55, h * 0.1, '#2f6b57', h * 0.012);

  // estatua de la libertad estilizada, dominando la derecha
  ctx.save();
  ctx.globalAlpha = 0.85;
  const tealGrad = ctx.createLinearGradient(w * 0.55, 0, w, h);
  tealGrad.addColorStop(0, '#8fc3b0');
  tealGrad.addColorStop(1, '#3f7d68');
  ctx.fillStyle = tealGrad;
  // cuerpo/túnica
  ctx.beginPath();
  ctx.moveTo(w * 0.66, h);
  ctx.quadraticCurveTo(w * 0.62, h * 0.55, w * 0.72, h * 0.28);
  ctx.quadraticCurveTo(w * 0.76, h * 0.16, w * 0.8, h * 0.1);
  ctx.lineTo(w * 1.05, h * 0.1);
  ctx.lineTo(w * 1.05, h);
  ctx.closePath();
  ctx.fill();
  // rostro (óvalo simple)
  ctx.beginPath();
  ctx.ellipse(w * 0.8, h * 0.42, w * 0.05, h * 0.09, -0.1, 0, Math.PI * 2);
  ctx.fillStyle = '#a9d4c2';
  ctx.fill();
  // corona con picos
  ctx.strokeStyle = '#2f6b57';
  ctx.lineWidth = h * 0.012;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(w * 0.8, h * 0.3);
    ctx.lineTo(w * 0.8 + i * w * 0.018, h * 0.2);
    ctx.stroke();
  }
  // brazo y antorcha
  ctx.beginPath();
  ctx.moveTo(w * 0.83, h * 0.35);
  ctx.lineTo(w * 0.9, h * 0.08);
  ctx.lineWidth = h * 0.02;
  ctx.strokeStyle = tealGrad;
  ctx.stroke();
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.moveTo(w * 0.9, h * 0.08);
  ctx.lineTo(w * 0.87, h * 0.02);
  ctx.lineTo(w * 0.93, h * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ghostWatermark(ctx, w, h, w * 0.5, h * 0.5, 1.1);

  ctx.fillStyle = '#12294f';
  ctx.textAlign = 'left';
  ctx.font = `700 ${h * 0.048}px Arial, sans-serif`;
  ctx.fillText('UNITED STATES OF AMERICA', w * 0.02, h * 0.1);
  ctx.font = `700 ${h * 0.07}px Georgia, serif`;
  ctx.fillText('TARJETA DE RESIDENCIA', w * 0.02, h * 0.17);

  usaFlagIcon(ctx, w * 0.5, h * 0.02, w * 0.07, h * 0.05);
  erlcBadge(ctx, w * 0.855, h * 0.02, w * 0.13, h * 0.11, 'light');

  ctx.restore();
  borderFrame(ctx, w, h, '#3c3b6e');
}

export function drawResidenceBack(ctx: Ctx, w: number, h: number) {
  drawGenericLicenseBack(ctx, w, h, '#3c3b6e', '#eef0f5');
}

/* -------------------------------------------------------------------- *
 * Pasaporte
 * -------------------------------------------------------------------- */

/** Textura de cuero: grano granulado + viñeta, para simular una tapa de pasaporte real. */
function leatherTexture(ctx: Ctx, w: number, h: number, baseColor: string, darkColor: string) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, baseColor);
  grad.addColorStop(0.5, darkColor);
  grad.addColorStop(1, baseColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // grano de cuero: motas pequeñas semi-aleatorias (determinista, sin Math.random para SSR-safe)
  ctx.save();
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 900; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = rand() * w * 0.004 + w * 0.001;
    ctx.globalAlpha = rand() * 0.08 + 0.02;
    ctx.fillStyle = rand() > 0.5 ? '#000000' : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // viñeta
  ctx.save();
  const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Portada roja de cuero, estilo pasaporte real, con relieve dorado. */
export function drawPassportCoverFront(ctx: Ctx, w: number, h: number) {
  leatherTexture(ctx, w, h, '#7a1420', '#5a0f18');

  ctx.strokeStyle = 'rgba(212,175,55,0.6)';
  ctx.lineWidth = w * 0.006;
  roundRect(ctx, w * 0.045, h * 0.03, w * 0.91, h * 0.94, w * 0.02);
  ctx.stroke();
  ctx.lineWidth = w * 0.0022;
  roundRect(ctx, w * 0.065, h * 0.045, w * 0.87, h * 0.91, w * 0.016);
  ctx.stroke();

  ctx.fillStyle = '#d4af37';
  ctx.textAlign = 'center';
  ctx.font = `700 ${w * 0.052}px Georgia, serif`;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = w * 0.006;
  ctx.shadowOffsetY = h * 0.002;
  ctx.fillText('ESTADOS UNIDOS', w / 2, h * 0.135);
  ctx.fillText('DE ERLC HUB', w / 2, h * 0.175);

  // emblema: círculo con estrella (escudo nacional simplificado)
  ctx.save();
  ctx.translate(w / 2, h * 0.42);
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.24, 0, Math.PI * 2);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = w * 0.008;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.2, 0, Math.PI * 2);
  ctx.lineWidth = w * 0.003;
  ctx.stroke();
  drawStar(ctx, 0, 0, w * 0.15, '#d4af37');
  // ramas decorativas a los lados del emblema
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = w * 0.006;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * w * 0.26, w * 0.08);
    ctx.quadraticCurveTo(side * w * 0.34, 0, side * w * 0.26, -w * 0.14);
    ctx.stroke();
  }
  ctx.restore();

  ctx.font = `700 ${w * 0.075}px Georgia, serif`;
  ctx.shadowBlur = w * 0.008;
  ctx.fillText('PASAPORTE', w / 2, h * 0.72);
  ctx.font = `600 ${w * 0.034}px Arial, sans-serif`;
  ctx.fillStyle = 'rgba(212,175,55,0.85)';
  ctx.shadowBlur = w * 0.004;
  ctx.fillText('ERLC ᴴᵁᴮ', w / 2, h * 0.79);
  ctx.shadowBlur = 0;

  borderFrame(ctx, w, h, '#3a0a10', 0.4);
}

export function drawPassportCoverBack(ctx: Ctx, w: number, h: number) {
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, '#0b1f4d');
  gradient.addColorStop(1, '#132a63');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(212,175,55,0.4)';
  ctx.lineWidth = w * 0.004;
  roundRect(ctx, w * 0.03, h * 0.04, w * 0.94, h * 0.92, h * 0.03);
  ctx.stroke();

  ctx.save();
  ctx.translate(w / 2, h * 0.45);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = h * 0.01;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, h * 0.06 * i, -0.8, 0.8);
    ctx.stroke();
  }
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.arc(0, 0, h * 0.02, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = 'rgba(212,175,55,0.8)';
  ctx.textAlign = 'center';
  ctx.font = `500 ${h * 0.024}px Arial, sans-serif`;
  ctx.fillText('Este pasaporte contiene datos electrónicos', w / 2, h * 0.68);
  ctx.fillText('protegidos — propiedad de ERLC ᴴᵁᴮ', w / 2, h * 0.71);
}

function eagleHead(ctx: Ctx, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);

  // cuerpo/plumaje blanco
  ctx.fillStyle = '#f4f2ea';
  ctx.strokeStyle = '#8a8f78';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-90, 40);
  ctx.quadraticCurveTo(-100, -30, -40, -70);
  ctx.quadraticCurveTo(10, -95, 70, -60);
  ctx.quadraticCurveTo(95, -35, 80, 10);
  ctx.quadraticCurveTo(50, 20, 10, 15);
  ctx.quadraticCurveTo(-40, 30, -90, 40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // textura de plumas (líneas curvas)
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#a9ad97';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(-70 + i * 18, -50 + (i % 3) * 8);
    ctx.quadraticCurveTo(-60 + i * 18, -10, -75 + i * 18, 25);
    ctx.stroke();
  }
  ctx.restore();

  // pico
  ctx.fillStyle = '#d9a441';
  ctx.strokeStyle = '#8a6a2a';
  ctx.beginPath();
  ctx.moveTo(70, -55);
  ctx.quadraticCurveTo(120, -40, 128, -20);
  ctx.quadraticCurveTo(100, -18, 68, -25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(70, -25);
  ctx.quadraticCurveTo(95, -12, 118, -14);
  ctx.quadraticCurveTo(90, -2, 68, -8);
  ctx.closePath();
  ctx.fillStyle = '#c98f34';
  ctx.fill();

  // ojo
  ctx.fillStyle = '#f4c542';
  ctx.beginPath();
  ctx.ellipse(48, -48, 12, 9, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#241a10';
  ctx.beginPath();
  ctx.arc(50, -47, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // ceja/frente
  ctx.strokeStyle = '#c9c9b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(20, -70);
  ctx.quadraticCurveTo(50, -75, 68, -58);
  ctx.stroke();

  ctx.restore();
}

/** Página con el águila — puramente decorativa, sin campos dinámicos. */
export function drawPassportEaglePage(ctx: Ctx, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#dce8f5');
  grad.addColorStop(1, '#c3d9ef');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.55;
  roundRect(ctx, 0, h * 0.8, w, h * 0.2, 0);
  ctx.clip();
  const stripeH = (h * 0.2) / 5;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#b22234' : '#f5f5f5';
    ctx.fillRect(0, h * 0.8 + i * stripeH, w, stripeH + 0.5);
  }
  ctx.restore();

  // trigo
  ctx.save();
  ctx.translate(w * 0.5, h * 0.66);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = h * 0.006;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * w * 0.014, 0);
    ctx.lineTo(i * w * 0.014 * 1.7, -h * 0.16);
    ctx.stroke();
  }
  ctx.restore();

  eagleHead(ctx, w * 0.66, h * 0.42, Math.min(w, h) * 0.0034);

  ctx.save();
  ctx.fillStyle = '#12294f';
  ctx.textAlign = 'left';
  ctx.font = `italic 700 ${h * 0.1}px Georgia, serif`;
  ctx.fillText('We the People', w * 0.055, h * 0.155);
  ctx.font = `italic 400 ${h * 0.027}px Georgia, serif`;
  ctx.globalAlpha = 0.85;
  const lines = [
    'Of the United States, in Order to form a more perfect Union,',
    'establish Justice, insure domestic Tranquility, provide for the',
    'common defence, promote the general Welfare, and secure',
    'the Blessings of Liberty to ourselves and our Posterity.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, w * 0.055, h * 0.27 + i * h * 0.048));
  ctx.restore();

  borderFrame(ctx, w, h, '#12294f');
}

/** Fondo (sin texto dinámico) de la página de datos del pasaporte. */
export function drawPassportDataBackground(ctx: Ctx, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#e9eef7');
  grad.addColorStop(1, '#dbe6f3');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.7;
  const stripeH = h * 0.09;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(178,34,52,0.08)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, h * 0.55 + i * stripeH, w, stripeH);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.translate(w * 0.58, h * 0.5);
  drawEagleSeal(ctx, h * 0.32);
  ctx.restore();

  erlcBadge(ctx, w * 0.02, h * 0.02, w * 0.1, h * 0.09);

  ctx.save();
  ctx.fillStyle = '#12294f';
  ctx.textAlign = 'center';
  ctx.font = `700 ${h * 0.05}px Georgia, serif`;
  ctx.fillText('UNITED STATES OF AMERICA', w / 2, h * 0.1);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#12294f';
  ctx.textAlign = 'right';
  ctx.font = `700 ${h * 0.026}px Georgia, serif`;
  ctx.fillText('United States', w * 0.94, h * 0.86);
  ctx.fillText('Department of State', w * 0.94, h * 0.895);
  ctx.font = `700 ${h * 0.045}px Georgia, serif`;
  ctx.fillText('USA', w * 0.94, h * 0.95);
  ctx.textAlign = 'left';
  ctx.font = `500 ${h * 0.024}px Arial, sans-serif`;
  ctx.fillText('SEE PAGE 27', w * 0.06, h * 0.9);
  ctx.restore();

  borderFrame(ctx, w, h, '#12294f');
}

function drawEagleSeal(ctx: Ctx, r: number) {
  ctx.strokeStyle = '#12294f';
  ctx.lineWidth = r * 0.02;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#12294f';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.45, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  drawStar(ctx, 0, -r * 0.05, r * 0.18, '#e9eef7');
}
