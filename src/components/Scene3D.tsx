import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import productsData from '../../data/products.json';
import { getBgMode } from '../config';

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

/* ---------------- Aurora (shader, palette Case Analyst) ---------------- */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uRes;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec2 p = uv;
    p.x *= aspect;
    p = p * 2.4 + uMouse * 0.25;

    float t = uTime * 0.045;

    vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));
    vec2 r = vec2(
      fbm(p + 3.5 * q + vec2(1.7, 9.2) + t * 0.6),
      fbm(p + 3.5 * q + vec2(8.3, 2.8) - t * 0.5)
    );
    float f = fbm(p + 3.5 * r);

    // palette Case Analyst: nero + verde fosforo + ambra
    vec3 bg       = vec3(0.020, 0.027, 0.022);
    vec3 greenDim = vec3(0.055, 0.330, 0.090);
    vec3 green    = vec3(0.200, 1.000, 0.200);
    vec3 amber    = vec3(1.000, 0.690, 0.000);

    vec3 col = bg;
    col = mix(col, greenDim, smoothstep(0.0, 0.9, f));
    col = mix(col, green,    smoothstep(0.50, 1.0, r.x));
    col = mix(col, amber,    smoothstep(0.72, 1.08, f * q.x * 1.9));

    col *= 0.5;

    float vig = smoothstep(1.25, 0.25, length(uv - 0.5));
    col *= mix(0.4, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function AuroraPlane() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mouse = useRef(new THREE.Vector2(0, 0));
  const { size, viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uRes: { value: new THREE.Vector2(1, 1) },
    }),
    []
  );

  useFrame((state, delta) => {
    if (!mat.current) return;
    uniforms.uTime.value += delta;
    uniforms.uRes.value.set(size.width * viewport.dpr, size.height * viewport.dpr);
    mouse.current.x = THREE.MathUtils.damp(mouse.current.x, state.pointer.x, 2.2, delta);
    mouse.current.y = THREE.MathUtils.damp(mouse.current.y, state.pointer.y, 2.2, delta);
    uniforms.uMouse.value.copy(mouse.current);
  });

  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

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

export default function Scene3D() {
  const enabled = useMemo(() => hasWebGL(), []);
  const mode = useMemo(getBgMode, []);
  if (!enabled || mode === 'off') return null;

  const showAurora = mode === 'aurora' || mode === 'both';
  const showOrbit = mode === 'orbit' || mode === 'both';

  return (
    <div className="scene3d" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 6], fov: 50 }}
      >
        {showAurora && <AuroraPlane />}
        {showOrbit && (
          <Suspense fallback={null}>
            <OrbitIcons />
          </Suspense>
        )}
      </Canvas>
    </div>
  );
}
