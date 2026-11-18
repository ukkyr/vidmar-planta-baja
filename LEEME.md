# Planta baja Vidmar — handoff para otro LLM

Recorrido 3D web de la planta baja (Vidmar Arquitectura). El usuario habla español argentino. No rehacer la app: seguir editando estos archivos.

## Qué abrir primero

1. `estructura.json` — cotas, muros, puertas, ventanas, vanos. Es la fuente, salvo la excepción de W22 de abajo.
2. `maqueta.html` — el mismo plano en 2D con códigos (W22, D01, WIN04, OP07…).
3. `plano-original.jpg` — el plano escaneado que ve el botón «Ver plano».
4. `src/game/house.ts` — TODA la geometría 3D. No hay otro archivo de muros.
5. `src/game/Walkthrough.tsx` — cámara, WASD, mouse, botones Ver plano / Ver maqueta.

## Sistema de coordenadas

- JSON: X hacia el este, Z hacia el norte, metros, origen [0,0].
- Juego: `game_x = json_x`, `game_z = -json_z`. El norte es −z. `yaw = 0` mira al norte.
- Helpers `jh` / `jv` en house.ts reciben coordenadas del JSON y convierten.
- Espesor centrado en el eje. Altura de muro `WALL_H = 2.4` (el JSON dice 2.60; el usuario pidió techos de 2.40 m). Ojo a 1.62 m.
- Spawn: entrada `{ x: 8.9, z: -3.15, yaw: 0 }`.

## Decisiones ya tomadas (no revertir)

- W22 (eje x = 16.90, espesor 0.60) va de z JSON 8.95 a **13.25**. W19 está en z 14.75. El hueco libre es **1.50 m** (el usuario lo pidió; en el JSON el vano OP07 era 0.60 m y le resultaba angosto). El hueco es de piso a techo y se puede cruzar.
- W45 (eje x = 16.90, espesor 0.15) va de z JSON **20.15** a 26.60. Cubre el espacio abierto previo entre 20.15 y 20.85 conectando directamente con W42. Solo tiene la puerta D08 (21.30 a 22.10); no hay vano abierto contiguo (el usuario lo pidió).
- Vidrios bloquean el paso, salvo las corredizas galería–estar WIN04 y WIN05 (`pass: true`).
- Puerta de salida del lavadero: D01, en el muro oeste.
- Recepción: no inventar muro sur ni muro este. El mostrador es la U abierta al sur (W12 al norte).
- Mouse: arrastrar para mirar. No usar pointer lock (en el preview queda de cabeza y el mouse falla). Rotación YXZ, sin roll.
- «Ver plano» muestra `plano-original.jpg`. «Ver maqueta» dibuja la nomenclatura **dentro de la página**. No usar un iframe a otro HTML: el preview (`*.grok-sandbox.com`) rechaza esa conexión.
- Colisión: cilindro radio 0.20. Los vidrios y los dinteles chocan; un hueco con `pass: true` no.

## Stack

TanStack Start + React 19 + React Three Fiber / Three.js. Entrada de la vista: el componente `Walkthrough`. Techo, pisos, muros y huecos salen de `buildGeometry()` en `house.ts`.

## Cómo seguir

Cambiar un muro, una puerta o una ventana solo en el array `WALLS` de `house.ts`, con las cotas del JSON. Si el usuario corrige una cota a mano, esa corrección gana sobre el JSON y hay que anotarla acá.

## Controles en el sitio publicado

El sitio de Netlify sirve `index.html` y `recorrido-3d.html` (el mismo archivo).

- «Ver maqueta 2D» y «Ver plano original» están en la barra de arriba, al lado del nombre del ambiente.
- En el teléfono los dos joysticks aparecen abajo (izquierda camina, derecha mira) y se pide orientación horizontal. En el escritorio no se muestran y siguen WASD y el mouse.
