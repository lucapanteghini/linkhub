import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

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

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Aurora: noise fbm con domain warping che scorre lentamente nella palette brand.
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

    float t = uTime * 0.05;

    // domain warping a due livelli per un flusso organico
    vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));
    vec2 r = vec2(
      fbm(p + 3.5 * q + vec2(1.7, 9.2) + t * 0.6),
      fbm(p + 3.5 * q + vec2(8.3, 2.8) - t * 0.5)
    );
    float f = fbm(p + 3.5 * r);

    vec3 bg     = vec3(0.024, 0.027, 0.055);
    vec3 purple = vec3(0.549, 0.420, 1.000);
    vec3 teal   = vec3(0.098, 0.827, 0.635);
    vec3 blue   = vec3(0.227, 0.627, 1.000);
    vec3 pink   = vec3(1.000, 0.369, 0.541);

    vec3 col = bg;
    col = mix(col, blue,   smoothstep(0.0, 0.85, f));
    col = mix(col, purple, smoothstep(0.25, 1.0, r.x));
    col = mix(col, teal,   smoothstep(0.30, 1.0, q.y * r.y * 2.2));
    col = mix(col, pink,   smoothstep(0.55, 1.05, f * q.x * 1.9));

    // tono cinematografico: tieni scuro per leggibilità del contenuto
    col *= 0.6;

    // vignette: scurisce i bordi
    float vig = smoothstep(1.25, 0.25, length(uv - 0.5));
    col *= mix(0.45, 1.0, vig);

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
    // parallasse morbida verso il puntatore
    mouse.current.x = THREE.MathUtils.damp(mouse.current.x, state.pointer.x, 2.2, delta);
    mouse.current.y = THREE.MathUtils.damp(mouse.current.y, state.pointer.y, 2.2, delta);
    uniforms.uMouse.value.copy(mouse.current);
  });

  return (
    <mesh frustumCulled={false}>
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

export default function Scene3D() {
  const enabled = useMemo(() => hasWebGL(), []);
  if (!enabled) return null;

  return (
    <div className="scene3d" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 1] }}
      >
        <AuroraPlane />
      </Canvas>
    </div>
  );
}
