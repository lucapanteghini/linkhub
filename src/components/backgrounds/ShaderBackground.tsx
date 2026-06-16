import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { vertexShader } from './shaders';

// Piano fullscreen che esegue un fragment shader, con uniform uTime/uMouse/uRes.
// Condiviso da tutti gli sfondi shader (aurora, nuvole, circuiti, mare).
export default function ShaderBackground({ fragmentShader }: { fragmentShader: string }) {
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
        key={fragmentShader}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
