import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import productsData from '../../data/products.json';
import type { BgMode } from '../config';
import ShaderBackground from './backgrounds/ShaderBackground';
import { auroraFrag, circuitsFrag, cloudsFrag, seaFrag } from './backgrounds/shaders';

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// Shader del fondo a tutto schermo associato a ciascun modo (null = nessuno shader).
const SHADER_FRAG: Partial<Record<BgMode, string>> = {
  aurora: auroraFrag,
  clouds: cloudsFrag,
  circuits: circuitsFrag,
  sea: seaFrag,
  both: auroraFrag, // aurora + icone in orbita
};

/* ---------------- Icone in orbita (opzione B) ---------------- */

function makeGlowTexture(): THREE.CanvasTexture {
  const s = 128;
  const cnv = document.createElement('canvas');
  cnv.width = cnv.height = s;
  const ctx = cnv.getContext('2d')!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(cnv);
}

function OrbitIcons() {
  const products = productsData.products;
  const urls = useMemo(() => products.map((p) => `/${p.icon}`), [products]);
  const textures = useLoader(THREE.TextureLoader, urls);
  const glowTex = useMemo(makeGlowTexture, []);

  const group = useRef<THREE.Group>(null);
  const nodes = useRef<(THREE.Group | null)[]>([]);

  const items = useMemo(
    () =>
      products.map((p, i) => ({
        accent: new THREE.Color(p.accent),
        angle0: (i / products.length) * Math.PI * 2,
        rx: 4.1 + (i % 2) * 1.1,
        ry: 2.7 + (i % 3) * 0.45,
        speed: 0.05 + 0.012 * i,
        z: -1.2 - (i % 3) * 0.9,
        scale: 0.66 - (i % 3) * 0.05,
      })),
    [products]
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    items.forEach((it, i) => {
      const n = nodes.current[i];
      if (!n) return;
      const a = it.angle0 + t * it.speed;
      n.position.set(
        Math.cos(a) * it.rx,
        Math.sin(a) * it.ry,
        it.z + Math.sin(t * 0.5 + i) * 0.25
      );
    });
    if (group.current) {
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        -state.pointer.y * 0.12,
        2,
        delta
      );
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        state.pointer.x * 0.18,
        2,
        delta
      );
    }
  });

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <group key={i} ref={(el) => (nodes.current[i] = el)}>
          <sprite scale={[it.scale * 2.6, it.scale * 2.6, 1]}>
            <spriteMaterial
              map={glowTex}
              color={it.accent}
              transparent
              opacity={0.55}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
          <mesh>
            <planeGeometry args={[it.scale, it.scale]} />
            <meshBasicMaterial map={textures[i]} transparent opacity={0.92} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------------- Canvas ---------------- */

export default function Scene3D({ mode }: { mode: BgMode }) {
  const enabled = useMemo(() => hasWebGL(), []);
  if (!enabled || mode === 'off') return null;

  const frag = SHADER_FRAG[mode];
  const showOrbit = mode === 'orbit' || mode === 'both';

  return (
    <div className="scene3d" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 6], fov: 50 }}
      >
        {frag && <ShaderBackground fragmentShader={frag} />}
        {showOrbit && (
          <Suspense fallback={null}>
            <OrbitIcons />
          </Suspense>
        )}
      </Canvas>
    </div>
  );
}
