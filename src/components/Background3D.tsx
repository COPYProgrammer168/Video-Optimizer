'use client'

import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function FloatingNodes({ mouse }: { mouse: { x: number; y: number } }) {
  const pointsRef = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const count = 3000
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15 - 8
    }
    return pos
  }, [])

  const colors = useMemo(() => {
    const count = 3000
    const cols = new Float32Array(count * 3)
    const colorOptions = [
      new THREE.Color('#22D3EE'),
      new THREE.Color('#818CF8'),
      new THREE.Color('#34D399'),
      new THREE.Color('#06B6D4'),
    ]
    for (let i = 0; i < count; i++) {
      const c = colorOptions[Math.floor(Math.random() * colorOptions.length)]
      cols[i * 3] = c.r
      cols[i * 3 + 1] = c.g
      cols[i * 3 + 2] = c.b
    }
    return cols
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return
    const t = state.clock.getElapsedTime()
    pointsRef.current.rotation.y = t * 0.03 + mouse.x * 0.05
    pointsRef.current.rotation.x = t * 0.02 + mouse.y * 0.03
    pointsRef.current.position.z = -8 + mouse.y * 2
  })

  return (
    <Points ref={pointsRef} positions={positions} colors={colors} stride={3} frustumCulled>
      <PointMaterial
        transparent
        vertexColors
        size={0.04}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}

function NeonRing() {
  const ringRef = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!ringRef.current) return
    const t = state.clock.getElapsedTime()
    ringRef.current.rotation.z = t * 0.1
    ringRef.current.rotation.x = Math.sin(t * 0.2) * 0.2
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.15
      ring2Ref.current.rotation.y = t * 0.1
    }
  })

  return (
    <>
      <mesh ref={ringRef} position={[0, 0, -5]}>
        <torusGeometry args={[5, 0.02, 16, 100]} />
        <meshBasicMaterial color="#22D3EE" transparent opacity={0.4} />
      </mesh>
      <mesh ref={ring2Ref} position={[0, 0, -5]}>
        <torusGeometry args={[7, 0.015, 16, 100]} />
        <meshBasicMaterial color="#818CF8" transparent opacity={0.25} />
      </mesh>
      <mesh position={[0, 0, -5]}>
        <torusGeometry args={[9, 0.01, 16, 100]} />
        <meshBasicMaterial color="#34D399" transparent opacity={0.15} />
      </mesh>
    </>
  )
}

function GridPlane() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.position.z = -10 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.5
    ;(meshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.05 + Math.sin(state.clock.getElapsedTime()) * 0.02
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, -10]}>
      <planeGeometry args={[40, 40, 40, 40]} />
      <meshBasicMaterial color="#0891B2" wireframe opacity={0.05} transparent />
    </mesh>
  )
}

function HolographicPlane() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.position.z = -6 + Math.sin(state.clock.getElapsedTime() * 0.3) * 1
    ;(meshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.03 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.02
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, -6]}>
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial color="#22D3EE" transparent opacity={0.03} side={THREE.DoubleSide} />
    </mesh>
  )
}

function DataLines() {
  const linesRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!linesRef.current) return
    linesRef.current.rotation.y = state.clock.getElapsedTime() * 0.02
  })

  return (
    <group ref={linesRef}>
      {[-5, -2.5, 0, 2.5, 5].map((x, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([x, -8, -8, x, 8, -8]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#22D3EE" transparent opacity={0.1} />
        </line>
      ))}
    </group>
  )
}

export default function Background3D() {
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0B0F17]" />
        <div className="absolute inset-0 hex-grid" />
        <div className="scanline-overlay" />
      </div>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ alpha: true, antialias: true }}
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} color="#22D3EE" intensity={0.5} />
        <pointLight position={[-10, -10, -10]} color="#818CF8" intensity={0.3} />
        <pointLight position={[0, 5, -5]} color="#34D399" intensity={0.2} />
        <pointLight position={[-5, -5, 5]} color="#22D3EE" intensity={0.15} />
        <FloatingNodes mouse={mouseRef.current} />
        <NeonRing />
        <GridPlane />
        <HolographicPlane />
        <DataLines />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </>
  )
}
