"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges, Html, Line, RoundedBox, Sparkles } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import {
  WORLD,
  lerpPose,
  overviewPose,
  smoothstep,
  spanPose,
  type Scene,
  type SceneSpan,
  type Vec3,
} from "@/lib/scene";

const AMBER = "#ffb347";
const ICE = "#7fd8ff";
const BG = "#060912";
const WIRE = "#2a3a60";

interface Props {
  scene: Scene;
  /** Fractional stop index: 0 is the overview, n is the nth span. Updated on scroll. */
  progress: RefObject<number>;
  /** The stop nearest the viewport centre. */
  active: number;
  /** False when the trace is off screen; rendering pauses. */
  running: boolean;
  onSelect: (stop: number) => void;
}

const leftEnd = (s: SceneSpan): Vec3 => [s.position[0] - s.size[0] / 2, s.position[1], s.position[2]];

/** Flies the camera between stops as the page scrolls, with a little pointer parallax. */
function Rig({ scene, progress }: Pick<Props, "scene" | "progress">) {
  const aspect = useThree((s) => s.size.width / s.size.height);
  const poses = useMemo(
    () => [overviewPose(scene, aspect), ...scene.spans.map((s) => spanPose(s, aspect))],
    [scene, aspect],
  );
  const look = useRef<THREE.Vector3 | null>(null);
  const goal = useMemo(() => new THREE.Vector3(), []);
  const goalLook = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const p = Math.min(progress.current ?? 0, poses.length - 1);
    const i = Math.min(Math.floor(p), poses.length - 2);
    const pose = lerpPose(poses[i], poses[i + 1], smoothstep(p - i));
    goal.set(pose.position[0] + state.pointer.x * 0.7, pose.position[1] + state.pointer.y * 0.4, pose.position[2]);
    goalLook.set(...pose.target);
    look.current ??= goalLook.clone();
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 3.5);
    state.camera.position.lerp(goal, k);
    look.current.lerp(goalLook, k);
    state.camera.lookAt(look.current);
  });
  return null;
}

function Bar({
  s,
  index,
  active,
  overview,
  onSelect,
}: {
  s: SceneSpan;
  index: number;
  active: boolean;
  /** The opening shot: every bar is lit evenly. */
  overview: boolean;
  onSelect: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const [hover, setHover] = useState(false);
  const [w, h, d] = s.size;
  const color = s.span.kind === "project" ? ICE : AMBER;

  useEffect(() => {
    if (!hover) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hover]);

  useFrame((state, dt) => {
    // Bars grow from their start date, one after another, like spans being recorded.
    const grow = smoothstep((state.clock.elapsedTime - 0.5 - index * 0.1) / 0.8);
    if (group.current) group.current.scale.x = Math.max(grow, 0.0001);
    if (material.current) {
      const goal = active ? 1.5 : hover ? 1.1 : overview ? 0.8 : 0.3;
      material.current.emissiveIntensity +=
        (goal - material.current.emissiveIntensity) * (1 - Math.exp(-dt * 8));
    }
  });

  const events = {
    onClick: onSelect,
    onPointerOver: () => setHover(true),
    onPointerOut: () => setHover(false),
  };

  return (
    <group ref={group} position={leftEnd(s)}>
      <group position={[w / 2, 0, 0]}>
        {s.dashed ? (
          <mesh {...events}>
            <boxGeometry args={[w, h, d]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={active ? 0.2 : hover ? 0.12 : 0.04}
              depthWrite={false}
            />
            <Edges color={active || hover ? color : "#8a6a3a"} lineWidth={active ? 2 : 1} />
          </mesh>
        ) : (
          <RoundedBox args={[w, h, d]} radius={0.07} smoothness={4} {...events}>
            <meshStandardMaterial
              ref={material}
              color={color}
              emissive={color}
              emissiveIntensity={0.35}
              roughness={0.35}
              metalness={0.25}
              toneMapped={false}
            />
          </RoundedBox>
        )}
      </group>
      <Html position={[0, h / 2 + 0.16, d / 2]} zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
        <span
          className={`block whitespace-nowrap font-mono text-[11px] transition-colors duration-300 ${
            active ? "text-ink" : "text-muted"
          }`}
          style={{ transform: "translateY(-100%)" }}
        >
          {s.span.id}
        </span>
      </Html>
    </group>
  );
}

/** A bright dot running along the active span. */
function Packet({ s }: { s: SceneSpan }) {
  const ref = useRef<THREE.Mesh>(null);
  const [w, h, d] = s.size;
  useFrame((state) => {
    if (!ref.current) return;
    const t = (state.clock.elapsedTime * 0.45) % 1;
    ref.current.position.x = s.position[0] - w / 2 + t * w;
  });
  return (
    <mesh ref={ref} position={[s.position[0], s.position[1] + h / 2 + 0.06, s.position[2] + d / 2]}>
      <sphereGeometry args={[0.045, 16, 16]} />
      <meshBasicMaterial color={[4, 4, 4]} toneMapped={false} />
    </mesh>
  );
}

/** Year lines behind the bars, and the lines that tie each span to its parent. */
function Structure({ scene }: { scene: Scene }) {
  const back = -WORLD.barDepth;
  const spineX = -WORLD.width / 2 - 1;
  const top = WORLD.rowGap * 0.9;
  const byId = useMemo(() => new Map(scene.spans.map((s) => [s.span.id, s])), [scene]);
  const roots = scene.spans.filter((s) => !s.parentId);
  const spineBottom = Math.min(...roots.map((s) => s.position[1]));

  return (
    <>
      {scene.years.map(({ year, x }) => (
        <group key={year}>
          <Line
            points={[
              [x, top, back],
              [x, scene.bottom - WORLD.rowGap * 0.8, back],
            ]}
            color={WIRE}
            lineWidth={1}
          />
          <Html position={[x, top + 0.25, back]} zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
            <span className="block pl-1.5 font-mono text-[11px] text-muted/70">{year}</span>
          </Html>
        </group>
      ))}
      <Line
        points={[
          [spineX, top * 0.4, 0],
          [spineX, spineBottom, 0],
        ]}
        color={WIRE}
        lineWidth={1.5}
      />
      {scene.spans.map((s) => {
        const end = leftEnd(s);
        const parent = s.parentId ? byId.get(s.parentId) : undefined;
        const points: Vec3[] = parent
          ? [leftEnd(parent), end]
          : [[spineX, end[1], 0], [spineX, end[1], end[2]], end];
        return <Line key={s.span.id} points={points} color={WIRE} lineWidth={1} />;
      })}
    </>
  );
}

function World({ scene, progress, active, onSelect }: Omit<Props, "running">) {
  const wide = useThree((s) => s.size.width >= 768);
  const current = active > 0 ? scene.spans[active - 1] : undefined;

  return (
    <>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 30, 150]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 10, 12]} intensity={1.4} />
      <pointLight position={[-14, 4, 8]} intensity={40} color={ICE} />

      <Rig scene={scene} progress={progress} />
      <Structure scene={scene} />
      {scene.spans.map((s, i) => (
        <Bar
          key={s.span.id}
          s={s}
          index={i}
          active={active === i + 1}
          overview={active === 0}
          onSelect={() => onSelect(i + 1)}
        />
      ))}
      {current && <Packet key={current.span.id} s={current} />}
      <Sparkles
        count={wide ? 220 : 90}
        scale={[WORLD.width * 1.6, 22, 18]}
        position={scene.center}
        size={1.8}
        speed={0.25}
        opacity={0.5}
        color={ICE}
      />

      {wide && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.55} luminanceThreshold={1} luminanceSmoothing={0.2} />
        </EffectComposer>
      )}
    </>
  );
}

export default function TraceScene({ running, ...props }: Props) {
  const start = useMemo(() => {
    const pose = overviewPose(props.scene, 16 / 9);
    // Begin further out so the first frames dolly in.
    return [pose.position[0], pose.position[1] + 2, pose.position[2] + 14] as Vec3;
  }, [props.scene]);

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 38, near: 0.1, far: 200, position: start }}
      frameloop={running ? "always" : "never"}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <World {...props} />
    </Canvas>
  );
}
