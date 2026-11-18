import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";
import { EYE, SPAWN, buildGeometry, collide, roomAt } from "./house";
import maquetaSource from "../../public/maqueta.html?raw";

function scopeMaqueta(source: string) {
  const css = source.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  const body = source.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? "";
  const html = body.replace(/<script[\s\S]*?<\/script>/g, "");
  const scoped = css.replace(/([^{}@]+)\{/g, (match, sel: string) => {
    if (sel.includes("@")) return match;
    const next = sel
      .split(",")
      .map((part) => {
        const t = part.trim();
        if (!t) return t;
        if (t === "*" || t === "body") return ".maqueta-view";
        return `.maqueta-view ${t}`;
      })
      .join(",");
    return `${next}{`;
  });
  return { css: scoped, html };
}

const MAQUETA = scopeMaqueta(maquetaSource);

type Probe = {
  getYaw: () => number;
  getSpeed: () => number;
  getPos: () => { x: number; z: number };
  setKeys: (codes: string[]) => void;
};

declare global {
  interface Window {
    __controlsTest?: Probe;
  }
}

const COLORS = {
  wall: "#ece5d8",
  glass: "#9ecde6",
  ceil: "#f7f5f0",
  solid: "#dfd6c8",
  post: "#734a29",
  floor: "#c6b59e",
};

function World({
  keys,
  look,
  yawRef,
}: {
  keys: MutableRefObject<Set<string>>;
  look: MutableRefObject<{ dragging: boolean; lx: number; ly: number }>;
  yawRef: MutableRefObject<number>;
}) {
  const { camera, gl } = useThree();
  const yaw = useRef(SPAWN.yaw);
  const pitch = useRef(-0.12);
  const pos = useRef(new THREE.Vector3(SPAWN.x, EYE, SPAWN.z));
  const speed = useRef(0);
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const { boxes, solids } = useMemo(() => buildGeometry(), []);

  useEffect(() => {
    const el = gl.domElement;
    const drag = { on: false, x: 0, y: 0, id: -1 };
    const sens = 0.003;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      drag.on = true;
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.id = e.pointerId;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const locked = document.pointerLockElement === el;
      let dx = 0;
      let dy = 0;
      if (locked) {
        dx = Math.max(-60, Math.min(60, e.movementX));
        dy = Math.max(-60, Math.min(60, e.movementY));
      } else if (drag.on && e.pointerId === drag.id) {
        dx = e.clientX - drag.x;
        dy = e.clientY - drag.y;
        drag.x = e.clientX;
        drag.y = e.clientY;
      } else if (look.current.dragging) {
        dx = e.clientX - look.current.lx;
        dy = e.clientY - look.current.ly;
        look.current.lx = e.clientX;
        look.current.ly = e.clientY;
      } else return;
      yaw.current -= dx * sens;
      pitch.current = Math.max(-1.05, Math.min(1.05, pitch.current - dy * sens));
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId === drag.id) drag.on = false;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [gl, look]);

  useEffect(() => {
    window.__controlsTest = {
      getYaw: () => yaw.current,
      getSpeed: () => speed.current,
      getPos: () => ({ x: pos.current.x, z: pos.current.z }),
      setKeys: (codes) => {
        keys.current = new Set(codes);
      },
    };
    return () => {
      delete window.__controlsTest;
    };
  }, [keys]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const stick = (window as unknown as { __stick?: { x: number; y: number } }).__stick;
    const stickX = stick?.x ?? 0;
    const stickY = stick?.y ?? 0;
    const fwd = (keys.current.has("KeyW") || keys.current.has("ArrowUp") ? 1 : 0) - (keys.current.has("KeyS") || keys.current.has("ArrowDown") ? 1 : 0) + stickY;
    const str = (keys.current.has("KeyD") || keys.current.has("ArrowRight") ? 1 : 0) - (keys.current.has("KeyA") || keys.current.has("ArrowLeft") ? 1 : 0) + stickX;
    const fx = -Math.sin(yaw.current);
    const fz = -Math.cos(yaw.current);
    const rx = Math.cos(yaw.current);
    const rz = -Math.sin(yaw.current);
    const len = Math.hypot(fwd, str) || 1;
    const accel = 3.15 * (keys.current.has("ShiftLeft") ? 1.7 : 1);
    let dx = ((fx * fwd + rx * str) / len) * accel * dt;
    let dz = ((fz * fwd + rz * str) / len) * accel * dt;
    if (!fwd && !str) {
      dx = 0;
      dz = 0;
    }
    speed.current = Math.hypot(dx, dz) / Math.max(dt, 0.0001);
    const r = 0.2;
    const nx = pos.current.x + dx;
    if (!collide(solids, nx, pos.current.z, r)) pos.current.x = nx;
    const nz = pos.current.z + dz;
    if (!collide(solids, pos.current.x, nz, r)) pos.current.z = nz;
    pos.current.y = EYE;
    camera.position.copy(pos.current);
    euler.current.set(pitch.current, yaw.current, 0, "YXZ");
    camera.up.set(0, 1, 0);
    camera.quaternion.setFromEuler(euler.current);
    yawRef.current = yaw.current;
    const label = document.getElementById("room-name");
    if (label) label.textContent = roomAt(pos.current.x, pos.current.z);
  });

  return (
    <group>
      <hemisphereLight args={["#f2ece1", "#544c40", 0.42]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[12, 24, 10]}
        intensity={0.85}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[9.5, -0.02, -16.5]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#637452" roughness={0.9} metalness={0.05} />
      </mesh>
      {boxes.map((b, i) => (
        <mesh key={i} position={b.pos} castShadow={b.kind !== "glass"} receiveShadow>
          <boxGeometry args={b.size} />
          <meshStandardMaterial
            color={b.color ?? (b.kind === "glass" ? COLORS.glass : b.kind === "ceil" ? COLORS.ceil : b.kind === "post" ? COLORS.post : b.kind === "floor" ? COLORS.floor : b.kind === "solid" ? COLORS.solid : COLORS.wall)}
            roughness={b.kind === "glass" ? 0.1 : b.kind === "floor" ? 0.45 : b.kind === "post" ? 0.6 : 0.85}
            metalness={b.kind === "glass" ? 0.1 : 0.04}
            transparent={b.kind === "glass"}
            opacity={b.kind === "glass" ? 0.4 : 1}
          />
        </mesh>
      ))}
    </group>
  );
}

export function Walkthrough() {
  const keys = useRef(new Set<string>());
  const look = useRef({ dragging: false, lx: 0, ly: 0 });
  const yawRef = useRef(0);
  const stickId = useRef<number | null>(null);
  const lookId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const w = window as Window & { toggleLayer?: (id: string, visible: boolean) => void };
    w.toggleLayer = (id, visible) => {
      const el = document.getElementById(id);
      if (el) el.style.display = visible ? "" : "none";
    };
    return () => {
      delete w.toggleLayer;
    };
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.code);
    };
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
    };
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  const onStickDown = (e: ReactPointerEvent) => {
    stickId.current = e.pointerId;
    origin.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onStickMove = (e: ReactPointerEvent) => {
    if (e.pointerId !== stickId.current) return;
    const dx = e.clientX - origin.current.x;
    const dy = e.clientY - origin.current.y;
    const mag = Math.min(1, Math.hypot(dx, dy) / 48);
    const ang = Math.atan2(dx, -dy);
    (window as unknown as { __stick: { x: number; y: number } }).__stick = {
      x: Math.sin(ang) * mag,
      y: Math.cos(ang) * mag,
    };
    const knob = document.getElementById("knob");
    if (knob) {
      knob.style.transform = `translate(${Math.sin(ang) * mag * 28}px, ${-Math.cos(ang) * mag * 28}px)`;
    }
  };
  const onStickUp = (e: ReactPointerEvent) => {
    if (e.pointerId !== stickId.current) return;
    stickId.current = null;
    (window as unknown as { __stick: { x: number; y: number } }).__stick = { x: 0, y: 0 };
    const knob = document.getElementById("knob");
    if (knob) knob.style.transform = "translate(0,0)";
  };

  const onLookDown = (e: ReactPointerEvent) => {
    lookId.current = e.pointerId;
    look.current = { dragging: true, lx: e.clientX, ly: e.clientY };
  };
  const onLookUp = (e: ReactPointerEvent) => {
    if (e.pointerId !== lookId.current) return;
    lookId.current = null;
    look.current.dragging = false;
  };

  return (
    <div className="stage">
      <Canvas
        camera={{ fov: 72, near: 0.08, far: 80, position: [SPAWN.x, EYE, SPAWN.z] }}
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#9bb3c7"]} />
        <fog attach="fog" args={["#9bb3c7", 35, 95]} />
        <World keys={keys} look={look} yawRef={yawRef} />
      </Canvas>

      <div className="hud">
        <div className="brand">
          <span className="kicker">Vidmar · planta baja</span>
          <strong id="room-name">Entrada</strong>
        </div>
        <p className="hint">WASD camina · arrastrá el mouse para mirar · Shift corre</p>
      </div>
      <div className="cross" />
      <div className="dock">
        <button
          className="plan-btn"
          type="button"
          onClick={() => {
            document.getElementById("plan")?.classList.remove("open");
            document.getElementById("maqueta")?.classList.toggle("open");
          }}
        >
          Ver maqueta
        </button>
        <button
          className="plan-btn"
          type="button"
          onClick={() => {
            document.getElementById("maqueta")?.classList.remove("open");
            document.getElementById("plan")?.classList.toggle("open");
          }}
        >
          Ver plano
        </button>
      </div>
      <div id="plan" className="plan">
        <button type="button" className="plan-close" onClick={() => document.getElementById("plan")?.classList.remove("open")}>
          Cerrar
        </button>
        <img src="/plano.jpg" alt="Plano de planta baja con cotas" />
      </div>
      <div id="maqueta" className="plan sheet">
        <div className="sheet-bar">
          <button type="button" className="plan-close" onClick={() => document.getElementById("maqueta")?.classList.remove("open")}>
            Cerrar
          </button>
        </div>
        <div className="maqueta-view">
          <style>{MAQUETA.css}</style>
          <div dangerouslySetInnerHTML={{ __html: MAQUETA.html }} />
        </div>
      </div>

      <div
        className="pad stick"
        onPointerDown={onStickDown}
        onPointerMove={onStickMove}
        onPointerUp={onStickUp}
        onPointerCancel={onStickUp}
      >
        <div id="knob" className="knob" />
      </div>
      <div className="pad look" onPointerDown={onLookDown} onPointerUp={onLookUp} onPointerCancel={onLookUp} />
    </div>
  );
}
