import { Text } from '@react-three/drei';

export function GameTable() {
  return (
    <group>
      {/* Main Table Surface */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[12, 0.2, 8]} />
        <meshStandardMaterial
          color="#1a472a"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Table Felt Pattern */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[11.5, 0.01, 7.5]} />
        <meshStandardMaterial
          color="#22c55e"
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* Foundation Outlines */}
      {[-1.8, -0.6, 0.6, 1.8].map((x, index) => (
        <group key={index} position={[x, 0.02, 2.5]}>
          <mesh>
            <boxGeometry args={[0.85, 0.005, 1.25]} />
            <meshStandardMaterial
              color="#1a472a"
              transparent
              opacity={0.3}
            />
          </mesh>
          
          {/* Foundation Labels */}
          <Text
            position={[0, 0.01, 0]}
            fontSize={0.15}
            color="#1a472a"
            anchorX="center"
            anchorY="middle"
          >
            {['♠', '♥', '♣', '♦'][index]}
          </Text>
        </group>
      ))}

      {/* Deck Position Outline */}
      <group position={[-4, 0.02, 0.5]}>
        <mesh>
          <boxGeometry args={[0.85, 0.005, 1.25]} />
          <meshStandardMaterial
            color="#1a472a"
            transparent
            opacity={0.3}
          />
        </mesh>
        
        <Text
          position={[0, 0.01, 0]}
          fontSize={0.1}
          color="#1a472a"
          anchorX="center"
          anchorY="middle"
        >
          DECK
        </Text>
      </group>

      {/* Waste Position Outline */}
      <group position={[-2.5, 0.02, 0.5]}>
        <mesh>
          <boxGeometry args={[0.85, 0.005, 1.25]} />
          <meshStandardMaterial
            color="#1a472a"
            transparent
            opacity={0.3}
          />
        </mesh>
        
        <Text
          position={[0, 0.01, 0]}
          fontSize={0.1}
          color="#1a472a"
          anchorX="center"
          anchorY="middle"
        >
          WASTE
        </Text>
      </group>

      {/* Tableau Column Outlines */}
      {Array.from({ length: 7 }, (_, i) => (
        <group key={i} position={[i * 1.2 - 3.6, 0.02, -1]}>
          <mesh>
            <boxGeometry args={[0.85, 0.005, 4]} />
            <meshStandardMaterial
              color="#1a472a"
              transparent
              opacity={0.2}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}