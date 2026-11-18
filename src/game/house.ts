// Planta baja — cotas del modelo estructural Vidmar.
// X al este. En el archivo Z crece al norte; acá z = −Z (el norte queda en −z,
// así W mira hacia la casa). Espesores centrados en el eje, como el plano 2D.
// W22 (espesor 0,60 m) deja 1,50 m libres antes de W19: el paso queda ancho, a techo.

export const WALL_H = 2.4;
export const EYE = 1.62;
// Entrada, de cara al norte.
export const SPAWN = { x: 8.9, z: -3.15, yaw: 0 };

export type Box = {
  pos: [number, number, number];
  size: [number, number, number];
  kind: "wall" | "glass" | "floor" | "ceil" | "solid" | "post";
  color?: string;
};

export type Solid = { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number };

type Hole = { from: number; to: number; sill: number; head: number; glass?: boolean; pass?: boolean };

type Wall = {
  axis: "h" | "v";
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  thick: number;
  holes: Hole[];
};

const DOOR = (from: number, to: number, head = 2.1): Hole => ({ from, to, sill: 0, head });
const WIN = (from: number, to: number, sill: number, head: number, pass = false): Hole => ({
  from,
  to,
  sill,
  head: Math.min(head, WALL_H),
  glass: true,
  pass,
});

const jz = (z: number) => -z;

function jh(z: number, x0: number, x1: number, thick: number, holes: Hole[] = []): Wall {
  const hs = holes.map((h) => ({ ...h, from: Math.min(h.from, h.to), to: Math.max(h.from, h.to) }));
  return { axis: "h", x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: jz(z), z1: jz(z), thick, holes: hs };
}
function jv(x: number, z0: number, z1: number, thick: number, holes: Hole[] = []): Wall {
  const a = jz(z0);
  const b = jz(z1);
  const hs = holes.map((h) => {
    const p = jz(h.from);
    const q = jz(h.to);
    return { ...h, from: Math.min(p, q), to: Math.max(p, q) };
  });
  return { axis: "v", x0: x, x1: x, z0: Math.min(a, b), z1: Math.max(a, b), thick, holes: hs };
}

// Ejes en metros del JSON (Z norte). Los huecos son puertas, ventanas o vanos.
const WALLS: Wall[] = [
  // Frente sur: machones de la cochera. El medio queda abierto (portón).
  jh(0.15, 0.0, 1.2, 0.3),
  jh(0.15, 5.85, 6.6, 0.3),

  // Lavadero / despensa / recepción — banda sur de servicio
  jh(6.45, 1.5, 6.45, 0.3), // W05
  jv(1.5, 6.45, 8.95, 0.3, [DOOR(7.95, 8.75)]), // W06 — D01 salida al exterior
  jh(8.95, 1.5, 4.15, 0.3, [WIN(1.65, 4.0, 0.9, 2.1)]), // W07 — WIN01
  jv(4.125, 6.45, 8.95, 0.15, [DOOR(7.95, 8.8)]), // W08 — OP01 lavadero–despensa
  jh(8.95, 4.15, 6.45, 0.3, [DOOR(5.35, 6.15)]), // W09 — OP05 despensa–cocina
  jv(6.45, 6.45, 8.95, 0.3), // W10
  jh(6.45, 6.45, 11.25, 0.3, [DOOR(8.45, 9.45, 2.1)]), // W11 — D02 puerta de la recepción
  jh(8.95, 7.5, 10.2, 0.3), // W12 muro norte de recepción (no cierra los costados)

  // Patio interior
  jv(11.25, 0.6, 8.95, 0.3, [
    WIN(0.75, 6.3, 0, 2.4), // WIN17 ventanal
    WIN(6.6, 8.8, 0, 2.2), // WIN02
  ]),
  jv(13.55, 0.6, 8.95, 0.3, [
    WIN(1.4, 3.9, 0.3, 2.2), // WIN09
    WIN(5.25, 6.65, 1.2, 2.1), // WIN19
    WIN(7.65, 8.45, 1.5, 2.1), // WIN20
  ]),
  jh(0.6, 11.25, 18.2, 0.3, [WIN(11.4, 13.4, 0, 2.4)]), // W28 — WIN18
  jv(18.2, 0.6, 8.95, 0.3), // W30

  // Estar / cocina
  jv(4.2, 8.95, 14.75, 0.3, [WIN(10.6, 13.2, 0.95, 2.1)]), // W15 — WIN03
  // Galería–estar: dos corredizas y el paño del este. El hueco 8,40–8,80 es la columna.
  jh(14.75, 4.2, 8.4, 0.3, [WIN(4.95, 8.15, 0, 2.2, true)]), // W16 — WIN04
  jh(14.75, 8.8, 12.95, 0.3, [WIN(9.0, 12.7, 0, 2.2, true)]), // W17 — WIN05
  jh(14.75, 12.95, 14.8, 0.3), // W18
  jh(14.75, 14.8, 18.2, 0.3, [DOOR(17.2, 18.1, 2.2)]), // W19 — OP02 estar–pasillo
  jh(8.95, 11.25, 13.55, 0.3, [WIN(11.5, 13.3, 0, 2.2)]), // W20 — WIN07
  jv(18.2, 8.95, 14.75, 0.3, [WIN(9.1, 14.6, 0, 2.4)]), // W21 — WIN08
  // W22: espesor 0,60. Termina 1,50 m antes del eje de W19 (z 14,75).
  jv(16.9, 8.95, 13.25, 0.6),

  // Parrilla, abierta al oeste
  jv(4.2, 16.25, 18.9, 0.3), // W24
  jh(18.9, 0.75, 4.2, 0.3), // W25
  jh(16.25, 0.75, 4.2, 0.3), // W26

  // Suite, vestidor, baño, antebaño
  jh(4.75, 13.55, 17.125, 0.15), // W31
  jh(7.125, 13.55, 17.125, 0.15), // W33
  jv(15.825, 7.125, 8.95, 0.15, [DOOR(7.25, 8.0)]), // W36 — D03
  jv(17.125, 4.75, 7.125, 0.15, [DOOR(5.35, 6.525, 2.2)]), // W37 — OP03
  jh(8.95, 13.55, 18.2, 0.3, [DOOR(17.2, 18.0)]), // W52 — D14
  jv(17.125, 7.95, 8.95, 0.15), // W53 — el tramo 7,125–7,95 es OP04, sin muro

  // Baños del estar y patio de luz
  jv(14.8, 14.75, 20.15, 0.3, [
    WIN(15.25, 16.05, 1.5, 2.1), // WIN10
    WIN(18.85, 19.65, 1.5, 2.1), // WIN12
  ]),
  jv(16.9, 14.75, 20.15, 0.15, [DOOR(17.05, 17.85)]), // W39 — OP06
  jh(16.55, 14.8, 16.9, 0.15, [DOOR(16.0, 16.75)]), // W40 — D06
  jh(18.35, 14.8, 16.9, 0.15, [DOOR(16.0, 16.75)]), // W41 — D07

  // Dormitorio, vestidor superior, estudio
  jh(20.15, 13.25, 16.9, 0.3), // W42
  jv(18.2, 14.75, 23.8, 0.3, [DOOR(21.3, 22.1)]), // W43 — D10
  jv(13.25, 14.75, 29.65, 0.3, [
    WIN(14.9, 20.0, 0, 2.4), // WIN21 ventanal al patio de luz
    WIN(21.15, 22.95, 0.6, 2.1), // WIN16
    WIN(24.8, 25.6, 1.2, 2.1), // WIN22
    WIN(27.4, 29.1, 0.6, 2.1), // WIN14
  ]),
  jv(16.9, 20.15, 26.6, 0.15, [DOOR(21.3, 22.1)]), // W45 — D08 (inicia en z=20.15 cubriendo el hueco junto a la puerta)
  jh(24.4, 14.15, 16.9, 0.15), // W46 — al oeste queda OP08, sin muro
  jh(26.0, 13.25, 16.9, 0.15), // W49
  jv(18.2, 23.8, 29.65, 0.3), // W50
  jh(29.65, 13.25, 18.2, 0.3, [WIN(14.0, 17.45, 0, 2.2)]), // W51 — WIN15 al pérgola
];

type Room = { name: string; x0: number; x1: number; z0: number; z1: number };

// Rectángulos en el eje del juego (z = −Z del plano).
function room(name: string, x0: number, x1: number, zn0: number, zn1: number): Room {
  return { name, x0, x1, z0: jz(Math.max(zn0, zn1)), z1: jz(Math.min(zn0, zn1)) };
}

const ROOMS: Room[] = [
  room("Lavadero", 1.5, 4.125, 6.45, 8.95),
  room("Despensa", 4.125, 6.45, 6.45, 8.95),
  room("Recepción", 6.45, 11.25, 6.45, 8.95),
  room("Patio interior", 11.25, 13.55, 0.6, 8.95),
  room("Suite", 13.55, 18.2, 0.6, 4.75),
  room("Vestidor", 13.55, 17.125, 4.75, 7.125),
  room("Baño suite", 13.55, 15.825, 7.125, 8.95),
  room("Antebaño", 15.825, 17.125, 7.125, 8.95),
  room("Acceso suite", 17.125, 18.2, 7.125, 8.95),
  room("Cocina", 4.2, 7.5, 8.95, 14.75),
  room("Parrilla", 0.75, 4.2, 16.25, 18.9),
  room("Galería", 4.2, 13.25, 14.75, 18.9),
  room("Patio de luz", 13.25, 14.8, 14.75, 20.15),
  room("Baño 1", 14.8, 16.9, 14.75, 16.55),
  room("Baño 2", 14.8, 16.9, 16.55, 18.35),
  room("Baño 3", 14.8, 16.9, 18.35, 20.15),
  room("Pasillo baños", 16.9, 18.2, 14.75, 20.15),
  room("Dormitorio", 13.25, 16.9, 20.15, 24.4),
  room("Vestidor superior", 13.25, 16.9, 24.4, 26.0),
  room("Pasillo", 16.9, 18.2, 20.15, 26.6),
  room("Estudio", 13.25, 18.2, 26.0, 29.65),
  room("Pérgola", 13.25, 18.2, 29.65, 33.3),
  room("Estar", 4.2, 18.2, 8.95, 14.75),
  room("Cochera", 0.15, 6.45, 0.15, 6.45),
  room("Entrada", 6.45, 11.25, 0.15, 6.45),
];

export function roomAt(x: number, z: number): string {
  for (const r of ROOMS) {
    if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return r.name;
  }
  return "Exterior";
}

function pushBox(
  boxes: Box[],
  solids: Solid[],
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  y0: number,
  y1: number,
  kind: Box["kind"],
  color?: string,
  collide = true,
) {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minZ = Math.min(z0, z1);
  const maxZ = Math.max(z0, z1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  if (maxX - minX < 0.02 || maxZ - minZ < 0.02 || maxY - minY < 0.02) return;
  boxes.push({
    pos: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    size: [maxX - minX, maxY - minY, maxZ - minZ],
    kind,
    color,
  });
  if (collide) solids.push({ minX, maxX, minZ, maxZ, minY, maxY });
}

function addWall(boxes: Box[], solids: Solid[], w: Wall) {
  const holes = [...w.holes].sort((a, b) => a.from - b.from);
  if (w.axis === "h") {
    const z0 = w.z0 - w.thick / 2;
    const z1 = w.z0 + w.thick / 2;
    let cursor = w.x0;
    const emit = (a: number, b: number, y0: number, y1: number, kind: Box["kind"], col?: string, block = true) => {
      pushBox(boxes, solids, a, z0, b, z1, y0, y1, kind, col, block);
    };
    for (const hole of holes) {
      const a = Math.max(hole.from, w.x0);
      const b = Math.min(hole.to, w.x1);
      if (b <= cursor) continue;
      if (a > cursor) emit(cursor, a, 0, WALL_H, "wall");
      if (a < b) {
        if (hole.sill > 0) emit(a, b, 0, hole.sill, "wall");
        if (hole.head < WALL_H - 0.01) emit(a, b, hole.head, WALL_H, "wall");
        if (hole.glass) emit(a, b, hole.sill, hole.head, "glass", undefined, !hole.pass);
      }
      cursor = Math.max(cursor, b);
    }
    if (cursor < w.x1) emit(cursor, w.x1, 0, WALL_H, "wall");
  } else {
    const x0 = w.x0 - w.thick / 2;
    const x1 = w.x0 + w.thick / 2;
    let cursor = w.z0;
    const emit = (a: number, b: number, y0: number, y1: number, kind: Box["kind"], block = true) => {
      pushBox(boxes, solids, x0, a, x1, b, y0, y1, kind, undefined, block);
    };
    for (const hole of holes) {
      const a = Math.max(hole.from, w.z0);
      const b = Math.min(hole.to, w.z1);
      if (b <= cursor) continue;
      if (a > cursor) emit(cursor, a, 0, WALL_H, "wall");
      if (a < b) {
        if (hole.sill > 0) emit(a, b, 0, hole.sill, "wall");
        if (hole.head < WALL_H - 0.01) emit(a, b, hole.head, WALL_H, "wall");
        if (hole.glass) emit(a, b, hole.sill, hole.head, "glass", !hole.pass);
      }
      cursor = Math.max(cursor, b);
    }
    if (cursor < w.z1) emit(cursor, w.z1, 0, WALL_H, "wall");
  }
}

export function buildGeometry(): { boxes: Box[]; solids: Solid[] } {
  const boxes: Box[] = [];
  const solids: Solid[] = [];
  for (const w of WALLS) addWall(boxes, solids, w);

  // Columna entre las dos corredizas de la galería (no es un paso).
  pushBox(boxes, solids, 8.4, jz(14.75) - 0.15, 8.8, jz(14.75) + 0.15, 0, WALL_H, "post", "#cfc6b8");

  // Dinteles de los pasos que no tienen muro: OP04 y OP08. OP07 no lleva dintel.
  pushBox(boxes, solids, 17.125 - 0.075, jz(7.95), 17.125 + 0.075, jz(7.125), 2.1, WALL_H, "wall");
  pushBox(boxes, solids, 13.42, jz(24.4) - 0.075, 14.15, jz(24.4) + 0.075, 2.1, WALL_H, "wall");

  const slab = (
    x0: number,
    x1: number,
    zn0: number,
    zn1: number,
    color: string,
    ceil: boolean,
  ) => {
    pushBox(boxes, solids, x0, jz(zn1), x1, jz(zn0), 0, 0.06, "floor", color, false);
    if (ceil) pushBox(boxes, solids, x0, jz(zn1), x1, jz(zn0), WALL_H, WALL_H + 0.06, "ceil", "#fbfaf7", false);
  };

  // Losas de piso y techo continuas hasta los ejes de muros para evitar rendijas y filtraciones de luz
  slab(0.15, 6.45, 0.15, 6.45, "#a8a299", true); // cochera
  slab(6.45, 11.25, 0.15, 6.45, "#c5beb4", true); // entrada
  slab(1.5, 6.45, 6.45, 8.95, "#d0c8be", true); // lavadero + despensa
  slab(6.45, 11.25, 6.45, 8.95, "#ded6cb", true); // recepción
  slab(11.25, 13.55, 0.6, 8.95, "#b2aba0", false); // patio interior (sin techo)
  slab(13.55, 18.2, 0.6, 8.95, "#dfcbb1", true); // suite y servicios
  slab(4.2, 18.2, 8.95, 14.75, "#dec9ad", true); // cocina y estar
  slab(0.75, 4.2, 16.25, 18.9, "#bca992", true); // parrilla
  slab(4.2, 13.25, 14.75, 18.9, "#cca785", true); // galería
  slab(13.25, 14.8, 14.75, 20.15, "#b2aba0", false); // patio de luz (sin techo)
  slab(14.8, 18.2, 14.75, 20.15, "#d9c5ab", true); // baños y pasillo
  slab(13.25, 18.2, 20.15, 29.65, "#dbcaa9", true); // dormitorios, vestidor y estudio

  // Pérgola al norte del estudio (el rectángulo punteado): postes y losa calada.
  for (const x of [13.55, 15.7, 17.85]) {
    for (const z of [30.05, 32.85]) {
      pushBox(boxes, solids, x - 0.07, jz(z) - 0.07, x + 0.07, jz(z) + 0.07, 0, 2.35, "post", "#8c5a32");
    }
  }
  pushBox(boxes, solids, 13.4, jz(33.05), 18.05, jz(29.85), 2.28, 2.38, "ceil", "#c4a574", false);

  return { boxes, solids };
}

export function collide(solids: Solid[], x: number, z: number, r: number): boolean {
  for (const s of solids) {
    if (s.maxY < 0.4 || s.minY > 1.45) continue;
    const cx = Math.max(s.minX, Math.min(x, s.maxX));
    const cz = Math.max(s.minZ, Math.min(z, s.maxZ));
    const dx = x - cx;
    const dz = z - cz;
    if (dx * dx + dz * dz < r * r) return true;
  }
  return false;
}
