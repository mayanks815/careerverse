'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Ring, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigation, PlanetId } from '@/context/NavigationContext';

// Define planet coordinates in 3D space
export const PLANET_POSITIONS: Record<PlanetId, [number, number, number]> = {
  space: [0, 0, 0], // fallback
  core: [0, 0, 0], // center
  education: [-12, 1, -5],
  skills: [10, -2, 7],
  experience: [-6, -4, 11],
  achievements: [12, 3, -9],
  contact: [0, 5, -13],
};

// 1. Starfield Background
function Starfield({ count = 2500 }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const scl = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Distribute stars in a huge sphere
      const r = 80 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      scl[i] = Math.random() * 0.15 + 0.05;
    }
    return [pos, scl];
  }, [count]);

  const timer = useMemo(() => new THREE.Timer(), []);
  useFrame((state) => {
    timer.update(state.clock.getElapsedTime());
    const elapsed = timer.getElapsed();
    if (pointsRef.current) {
      // Slow rotation of starfield
      pointsRef.current.rotation.y = elapsed * 0.003;
      pointsRef.current.rotation.x = elapsed * 0.001;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.12} 
        color="#ffffff" 
        transparent 
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

// 2. Spaceship component (custom primitives model)
function SpaceShip({ position, rotation }: { position: THREE.Vector3; rotation: THREE.Euler }) {
  const groupRef = useRef<THREE.Group>(null);
  const thrusterRef = useRef<THREE.PointLight>(null);

  // Sync positions from parent state animation
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(position);
      groupRef.current.rotation.copy(rotation);
    }
  }, [position, rotation]);

  const timer = useMemo(() => new THREE.Timer(), []);
  useFrame((state) => {
    timer.update(state.clock.getElapsedTime());
    const elapsed = timer.getElapsed();
    if (groupRef.current) {
      // Ambient floating/bobbing when not traveling
      groupRef.current.position.y += Math.sin(elapsed * 2) * 0.0015;
    }
    if (thrusterRef.current) {
      // Pulse thruster light intensiveness
      thrusterRef.current.intensity = 1.5 + Math.sin(elapsed * 20) * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Spaceship cockpit */}
      <mesh position={[0, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshStandardMaterial color="#00d2ff" emissive="#00d2ff" emissiveIntensity={0.6} metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Ship Main fuselage */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.6, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Port wing */}
      <mesh position={[-0.32, -0.05, -0.15]}>
        <boxGeometry args={[0.4, 0.02, 0.35]} />
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Starboard wing */}
      <mesh position={[0.32, -0.05, -0.15]}>
        <boxGeometry args={[0.4, 0.02, 0.35]} />
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Thruster exhaust cone */}
      <mesh position={[0, 0, -0.32]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.1, 0.15, 8]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* Glowing engine flame light */}
      <pointLight 
        ref={thrusterRef}
        position={[0, 0, -0.5]} 
        color="#00d2ff" 
        distance={3} 
        decay={2}
      />
    </group>
  );
}

// 3. Central Core Planet with orbital rings
function CorePlanet() {
  const planetRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const timer = useMemo(() => new THREE.Timer(), []);
  useFrame((state) => {
    timer.update(state.clock.getElapsedTime());
    const elapsed = timer.getElapsed();
    if (planetRef.current) {
      planetRef.current.rotation.y = elapsed * 0.08;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -elapsed * 0.03;
    }
  });

  return (
    <group position={PLANET_POSITIONS.core}>
      {/* Glow aura */}
      <Sphere args={[2.0, 32, 32]}>
        <meshBasicMaterial color="#0055ff" transparent opacity={0.12} wireframe />
      </Sphere>
      
      {/* Core sphere */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshStandardMaterial 
          color="#0f172a" 
          emissive="#0033aa"
          emissiveIntensity={0.8}
          metalness={0.9} 
          roughness={0.2} 
        />
      </mesh>

      {/* Orbit Rings */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.3, Math.PI / 8, 0]}>
        <ringGeometry args={[2.3, 2.7, 64]} />
        <meshBasicMaterial color="#00d2ff" side={THREE.DoubleSide} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// 4. Education Planet (Emerald theme)
function EducationPlanet() {
  const planetRef = useRef<THREE.Mesh>(null);

  const timer = useMemo(() => new THREE.Timer(), []);
  useFrame((state) => {
    timer.update(state.clock.getElapsedTime());
    const elapsed = timer.getElapsed();
    if (planetRef.current) {
      planetRef.current.rotation.y = elapsed * 0.12;
    }
  });

  return (
    <group position={PLANET_POSITIONS.education}>
      <mesh ref={planetRef}>
        <sphereGeometry args={[1.0, 32, 32]} />
        <meshStandardMaterial 
          color="#064e3b" 
          emissive="#10b981"
          emissiveIntensity={0.5}
          metalness={0.7} 
          roughness={0.3} 
        />
      </mesh>
      
      {/* Sub academic ring */}
      <Ring args={[1.25, 1.4, 64]} rotation={[Math.PI / 3, 0, 0]}>
        <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} transparent opacity={0.25} />
      </Ring>
    </group>
  );
}

// 5. Skills Planet with Satellite categories (Purple theme)
function SkillsPlanet() {
  const planetRef = useRef<THREE.Mesh>(null);
  const satelliteGroupRef = useRef<THREE.Group>(null);

  const timer = useMemo(() => new THREE.Timer(), []);
  useFrame((state) => {
    timer.update(state.clock.getElapsedTime());
    const elapsed = timer.getElapsed();
    if (planetRef.current) {
      planetRef.current.rotation.y = elapsed * 0.15;
    }
    if (satelliteGroupRef.current) {
      satelliteGroupRef.current.rotation.y = elapsed * 0.4;
    }
  });

  return (
    <group position={PLANET_POSITIONS.skills}>
      <mesh ref={planetRef}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshStandardMaterial 
          color="#3b0764" 
          emissive="#9d4edd"
          emissiveIntensity={0.6}
          metalness={0.8} 
          roughness={0.2} 
        />
      </mesh>

      {/* Orbiting skill satellites */}
      <group ref={satelliteGroupRef}>
        {[0, 1, 2, 3].map((idx) => {
          const angle = (idx * Math.PI) / 2;
          const radius = 1.6;
          return (
            <mesh 
              key={idx} 
              position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}
            >
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshBasicMaterial color="#9d4edd" />
              <pointLight color="#9d4edd" intensity={0.4} distance={1} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

// 6. Experience Planet with Company Pods (Blue theme)
function ExperiencePlanet() {
  const planetRef = useRef<THREE.Mesh>(null);
  const podRef1 = useRef<THREE.Mesh>(null);
  const podRef2 = useRef<THREE.Mesh>(null);

  const timer = useMemo(() => new THREE.Timer(), []);
  useFrame((state) => {
    timer.update(state.clock.getElapsedTime());
    const elapsed = timer.getElapsed();
    if (planetRef.current) {
      planetRef.current.rotation.y = elapsed * 0.05;
    }
    // Orbit pod 1
    if (podRef1.current) {
      const radius = 1.7;
      const angle = elapsed * 0.5;
      podRef1.current.position.set(Math.cos(angle) * radius, Math.sin(angle) * 0.3, Math.sin(angle) * radius);
    }
    // Orbit pod 2
    if (podRef2.current) {
      const radius = 2.1;
      const angle = elapsed * 0.3 + Math.PI;
      podRef2.current.position.set(Math.cos(angle) * radius, Math.sin(angle) * -0.2, Math.sin(angle) * radius);
    }
  });

  return (
    <group position={PLANET_POSITIONS.experience}>
      <mesh ref={planetRef}>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshStandardMaterial 
          color="#0f172a" 
          emissive="#00d2ff"
          emissiveIntensity={0.4}
          metalness={0.9} 
          roughness={0.1} 
        />
      </mesh>

      {/* Orbiting company pods */}
      <mesh ref={podRef1}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#00d2ff" emissive="#00d2ff" emissiveIntensity={0.5} />
      </mesh>
      <mesh ref={podRef2}>
        <boxGeometry args={[0.18, 0.18, 0.18]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// 7. Achievement Belt (Gold Theme Asteroids)
function AchievementPlanet() {
  const planetRef = useRef<THREE.Mesh>(null);
  const beltRef = useRef<THREE.Group>(null);

  // Generate fixed coordinates for static asteroid group
  const asteroids = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => {
      const angle = (i * Math.PI * 2) / 8;
      const r = 1.4 + Math.random() * 0.6;
      return {
        pos: [Math.cos(angle) * r, (Math.random() - 0.5) * 0.6, Math.sin(angle) * r] as [number, number, number],
        size: Math.random() * 0.08 + 0.04,
        speed: 0.1 + Math.random() * 0.2
      };
    });
  }, []);

  const timer = useMemo(() => new THREE.Timer(), []);
  useFrame((state) => {
    timer.update(state.clock.getElapsedTime());
    const elapsed = timer.getElapsed();
    if (planetRef.current) {
      planetRef.current.rotation.y = elapsed * 0.1;
    }
    if (beltRef.current) {
      beltRef.current.rotation.y = elapsed * 0.2;
    }
  });

  return (
    <group position={PLANET_POSITIONS.achievements}>
      <mesh ref={planetRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial 
          color="#78350f" 
          emissive="#f59e0b"
          emissiveIntensity={0.5}
          metalness={0.7} 
          roughness={0.5} 
        />
      </mesh>

      {/* Asteroids list */}
      <group ref={beltRef}>
        {asteroids.map((ast, idx) => (
          <mesh key={idx} position={ast.pos}>
            <dodecahedronGeometry args={[ast.size, 1]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// 8. Contact Satellite (Rose Theme)
function ContactSatellite() {
  const satelliteRef = useRef<THREE.Group>(null);
  const panelRef = useRef<THREE.Mesh>(null);

  const timer = useMemo(() => new THREE.Timer(), []);
  useFrame((state) => {
    timer.update(state.clock.getElapsedTime());
    const elapsed = timer.getElapsed();
    if (satelliteRef.current) {
      satelliteRef.current.rotation.y = elapsed * 0.2;
      satelliteRef.current.position.y = PLANET_POSITIONS.contact[1] + Math.sin(elapsed * 1.5) * 0.15;
    }
    if (panelRef.current) {
      panelRef.current.rotation.x = Math.sin(elapsed) * 0.2;
    }
  });

  return (
    <group ref={satelliteRef} position={PLANET_POSITIONS.contact}>
      {/* Central capsule */}
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 0.8, 12]} />
        <meshStandardMaterial color="#881337" emissive="#f43f5e" emissiveIntensity={0.4} metalness={0.9} />
      </mesh>

      {/* Antenna dish */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.35, 0.2, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>

      {/* Left Solar Panel */}
      <mesh ref={panelRef} position={[-0.8, 0, 0]}>
        <boxGeometry args={[0.8, 0.25, 0.02]} />
        <meshStandardMaterial color="#1e1e3f" emissive="#3b82f6" emissiveIntensity={0.2} />
      </mesh>

      {/* Right Solar Panel */}
      <mesh position={[0.8, 0, 0]}>
        <boxGeometry args={[0.8, 0.25, 0.02]} />
        <meshStandardMaterial color="#1e1e3f" emissive="#3b82f6" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

// 9. Interactive Flight Paths & Camera Sequencer
function UniverseScene() {
  const { currentPlanet, targetPlanet, travelState, reducedMotion } = useNavigation();
  const { camera } = useThree();
  const persCamera = camera as THREE.PerspectiveCamera;

  // Ship positioning tracking
  const [shipPos, setShipPos] = useState<THREE.Vector3>(() => new THREE.Vector3(0, 2, 8));
  const [shipRot, setShipRot] = useState<THREE.Euler>(() => new THREE.Euler(0, 0, 0));

  // Remember previous positions for transition lines
  const prevPlanetRef = useRef<PlanetId>('space');

  // Animation timeline tracker
  const [progress, setProgress] = useState(0);

  // Compute flight path coordinates
  const flightPathPoints = useMemo(() => {
    if (!targetPlanet || targetPlanet === 'space') return [];

    const start = PLANET_POSITIONS[currentPlanet];
    const end = PLANET_POSITIONS[targetPlanet];

    // Compute bezier curve points
    const curvePoints: THREE.Vector3[] = [];
    const vStart = new THREE.Vector3(...start);
    const vEnd = new THREE.Vector3(...end);

    // Calculate midpoint and add height offset for curved flight paths
    const vMid = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);
    vMid.y += 4.5; // fly height arc

    const curve = new THREE.QuadraticBezierCurve3(vStart, vMid, vEnd);
    return curve.getPoints(50);
  }, [currentPlanet, targetPlanet]);

  // Track progress updates along flight path
  const timer = useMemo(() => new THREE.Timer(), []);
  useFrame((state) => {
    timer.update(state.clock.getElapsedTime());
    const elapsed = timer.getElapsed();

    // 1. DOCKED STATE: Hover/Orbit Camera
    if (travelState === 'idle') {
      if (currentPlanet === 'space') {
        // Broad universe orbit view
        const radius = 25;
        const angle = elapsed * 0.03;
        camera.position.set(Math.cos(angle) * radius, 12, Math.sin(angle) * radius);
        camera.lookAt(0, 0, 0);
      } else {
        // Locked on particular planet. Position camera offset to show planet & dock ship cleanly
        const pPos = PLANET_POSITIONS[currentPlanet];
        const planetVec = new THREE.Vector3(...pPos);
        
        // Calculate static offset (skewed left to leave room for the text panels)
        const targetCamPos = new THREE.Vector3()
          .copy(planetVec)
          .add(new THREE.Vector3(-4.5, 2.5, 4.5));
        
        camera.position.lerp(targetCamPos, 0.05);
        camera.lookAt(planetVec);

        // Keep spaceship parked near the planet
        const targetShipPos = new THREE.Vector3()
          .copy(planetVec)
          .add(new THREE.Vector3(1.2, 0.6, 0.8));
        setShipPos(targetShipPos);

        // Make ship orient facing the planet center
        const dir = new THREE.Vector3().subVectors(planetVec, targetShipPos).normalize();
        const pitch = Math.asin(dir.y);
        const yaw = Math.atan2(dir.x, dir.z);
        setShipRot(new THREE.Euler(pitch, yaw, 0));
      }
      return;
    }

    // 2. ACTIVE TRAVEL SEQUENCE
    if (targetPlanet) {
      const start = PLANET_POSITIONS[currentPlanet];
      const end = PLANET_POSITIONS[targetPlanet];
      
      const vStart = new THREE.Vector3(...start);
      const vEnd = new THREE.Vector3(...end);
      
      const vMid = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);
      vMid.y += 4.5;

      const curve = new THREE.QuadraticBezierCurve3(vStart, vMid, vEnd);

      // Increment progress variables based on current travel phase
      let currentProgress = progress;
      if (travelState === 'aligning') {
        // Slower alignment
        currentProgress = Math.min(0.05, progress + 0.003);
      } else if (travelState === 'warping') {
        // Rapid warp slide
        currentProgress = Math.min(0.92, progress + 0.015);
        // Warp FOV acceleration effect
        persCamera.fov = THREE.MathUtils.lerp(persCamera.fov, 85, 0.08);
        persCamera.updateProjectionMatrix();
      } else if (travelState === 'landing') {
        // Slowing down for landing sequence
        currentProgress = Math.min(1.0, progress + 0.012);
        persCamera.fov = THREE.MathUtils.lerp(persCamera.fov, 50, 0.1);
        persCamera.updateProjectionMatrix();
      }

      setProgress(currentProgress);

      // Update spaceship coordinates
      const currentPos = curve.getPointAt(currentProgress);
      setShipPos(currentPos);

      // Update ship rotation to face curve direction
      const tangent = curve.getTangentAt(currentProgress).normalize();
      const pitch = Math.asin(tangent.y);
      const yaw = Math.atan2(tangent.x, tangent.z);
      setShipRot(new THREE.Euler(pitch, yaw, 0));

      // Dynamic Camera follow path
      // Position camera behind the spaceship pointing at target
      const camOffset = new THREE.Vector3()
        .copy(tangent)
        .multiplyScalar(-3.5) // Distance behind ship
        .add(new THREE.Vector3(0, 1.2, 0)); // Elevation
      
      const nextCamPos = new THREE.Vector3().addVectors(currentPos, camOffset);
      camera.position.lerp(nextCamPos, 0.1);
      camera.lookAt(currentPos);
    }
  });

  // Reset progress when travel finishes
  useEffect(() => {
    if (travelState === 'idle') {
      setProgress(0);
      persCamera.fov = 50;
      persCamera.updateProjectionMatrix();
    }
  }, [travelState, persCamera]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} color="#ffffff" castShadow />
      <pointLight position={[0, 0, 0]} intensity={2.0} color="#0055ff" distance={30} />

      {/* Stellar visual structures */}
      <Starfield count={2200} />
      <CorePlanet />
      <EducationPlanet />
      <SkillsPlanet />
      <ExperiencePlanet />
      <AchievementPlanet />
      <ContactSatellite />

      {/* Spaceship */}
      <SpaceShip position={shipPos} rotation={shipRot} />

      {/* Flight Bezier Path Overlay */}
      {flightPathPoints.length > 0 && travelState !== 'idle' && (
        <Line 
          points={flightPathPoints} 
          color="#00d2ff" 
          lineWidth={1.5} 
          dashed={false}
          opacity={0.6}
          transparent
        />
      )}
    </>
  );
}

// 10. Core Exportable dynamically loaded element wrapper
export default function SpaceCanvas() {
  const { reducedMotion } = useNavigation();

  return (
    <div className="w-full h-full relative bg-space-black">
      <Canvas 
        shadows={{ type: THREE.PCFShadowMap }} 
        camera={{ position: [0, 12, 25], fov: 50, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#020205']} />
        <UniverseScene />
        {/* Enable static drag adjustments for keyboard/accessibility if desired */}
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          enableRotate={!reducedMotion} // Allow mouse-look orbit controls only if motion is not disabled
          maxPolarAngle={Math.PI / 2.1} 
          minPolarAngle={Math.PI / 3.5}
        />
      </Canvas>
    </div>
  );
}
