import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Card } from '../types/game';
import * as THREE from 'three';

interface Card3DProps {
  card: Card;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

const suitColors = {
  hearts: '#ef4444',
  diamonds: '#ef4444',
  clubs: '#1f2937',
  spades: '#1f2937'
};

export function Card3D({ card, onClick, onDragStart, onDragEnd, isDragging }: Card3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current && !isDragging) {
      // Subtle floating animation
      meshRef.current.position.y = card.position[1] + Math.sin(state.clock.elapsedTime * 2 + card.position[0]) * 0.01;
      
      // Hover effect
      if (hovered) {
        meshRef.current.position.y += 0.05;
      }
    }
  });

  const handlePointerDown = (event: THREE.Event) => {
    event.stopPropagation();
    onDragStart?.();
  };

  const handlePointerUp = () => {
    onDragEnd?.();
  };

  const handleClick = (event: THREE.Event) => {
    event.stopPropagation();
    onClick?.();
  };

  return (
    <group
      ref={meshRef}
      position={card.position}
      rotation={card.rotation}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* Card Base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.02, 1.2]} />
        <meshStandardMaterial
          color={card.faceUp ? '#f8fafc' : '#1e293b'}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Card Face */}
      {card.faceUp ? (
        <group position={[0, 0.011, 0]}>
          {/* Rank - Top Left */}
          <Text
            position={[-0.25, 0, 0.4]}
            fontSize={0.12}
            color={suitColors[card.suit]}
            anchorX="center"
            anchorY="middle"
          >
            {card.rank}
          </Text>
          
          {/* Suit - Top Left */}
          <Text
            position={[-0.25, 0, 0.25]}
            fontSize={0.1}
            color={suitColors[card.suit]}
            anchorX="center"
            anchorY="middle"
          >
            {suitSymbols[card.suit]}
          </Text>

          {/* Center Suit Symbol */}
          <Text
            position={[0, 0, 0]}
            fontSize={0.2}
            color={suitColors[card.suit]}
            anchorX="center"
            anchorY="middle"
          >
            {suitSymbols[card.suit]}
          </Text>

          {/* Rank - Bottom Right (rotated) */}
          <Text
            position={[0.25, 0, -0.4]}
            fontSize={0.12}
            color={suitColors[card.suit]}
            anchorX="center"
            anchorY="middle"
            rotation={[0, 0, Math.PI]}
          >
            {card.rank}
          </Text>
        </group>
      ) : (
        /* Card Back Pattern */
        <group position={[0, 0.011, 0]}>
          <mesh>
            <boxGeometry args={[0.6, 0.001, 1.0]} />
            <meshStandardMaterial
              color="#22c55e"
              roughness={0.3}
              metalness={0.1}
            />
          </mesh>
          
          {/* Decorative pattern */}
          <Text
            position={[0, 0.001, 0]}
            fontSize={0.15}
            color="#1a472a"
            anchorX="center"
            anchorY="middle"
          >
            ♠♥♣♦
          </Text>
        </group>
      )}
    </group>
  );
}