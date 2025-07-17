import { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { Card3D } from './Card3D';
import { GameTable } from './GameTable';
import { GameState, Card, DragState } from '../types/game';
import { initializeGame, canPlaceOnTableau, canPlaceOnFoundation, checkWinCondition, getHint } from '../utils/gameLogic';
import { Button } from './ui/button';
import { RotateCcw, Lightbulb, Play, Trophy, Clock, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function SolitaireGame() {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedCards: [],
    sourceLocation: '',
    sourceIndex: undefined
  });
  const [gameTime, setGameTime] = useState(0);

  // Timer effect
  useEffect(() => {
    if (!gameState.gameWon) {
      const timer = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState.gameWon]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const newGame = useCallback(() => {
    setGameState(initializeGame());
    setGameTime(0);
    toast.success('New game started!');
  }, []);

  const drawFromDeck = useCallback(() => {
    setGameState(prev => {
      if (prev.deck.length === 0) {
        // Reset deck from waste
        const newDeck = [...prev.waste].reverse().map((card, index) => ({
          ...card,
          faceUp: false,
          position: [-4, 0.1 + index * 0.01, 0] as [number, number, number]
        }));
        
        return {
          ...prev,
          deck: newDeck,
          waste: [],
          moves: prev.moves + 1
        };
      } else {
        // Draw 3 cards (or remaining cards if less than 3)
        const cardsToDraw = Math.min(3, prev.deck.length);
        const drawnCards = prev.deck.slice(-cardsToDraw).map((card, index) => ({
          ...card,
          faceUp: true,
          position: [-2.5, 0.1 + (prev.waste.length + index) * 0.01, 0] as [number, number, number]
        }));
        
        return {
          ...prev,
          deck: prev.deck.slice(0, -cardsToDraw),
          waste: [...prev.waste, ...drawnCards],
          moves: prev.moves + 1
        };
      }
    });
  }, []);

  const moveCardToFoundation = useCallback((card: Card, suit: string) => {
    setGameState(prev => {
      const foundation = prev.foundations[suit as keyof typeof prev.foundations];
      if (!canPlaceOnFoundation(card, foundation)) return prev;

      const newFoundation = [...foundation, {
        ...card,
        position: [
          suit === 'spades' ? -1.8 : suit === 'hearts' ? -0.6 : suit === 'clubs' ? 0.6 : 1.8,
          0.1 + foundation.length * 0.01,
          2.5
        ] as [number, number, number]
      }];

      const newState = {
        ...prev,
        foundations: {
          ...prev.foundations,
          [suit]: newFoundation
        },
        score: prev.score + 10,
        moves: prev.moves + 1
      };

      // Check win condition
      if (checkWinCondition(newState)) {
        newState.gameWon = true;
        toast.success('🎉 Congratulations! You won!');
      }

      return newState;
    });
  }, []);

  const handleCardClick = useCallback((card: Card) => {
    // Try to auto-move to foundation
    const foundation = gameState.foundations[card.suit];
    if (canPlaceOnFoundation(card, foundation)) {
      moveCardToFoundation(card, card.suit);
      return;
    }

    // If it's a face-down card in tableau, flip it
    if (!card.faceUp) {
      setGameState(prev => {
        const newTableau = prev.tableau.map(column => 
          column.map(c => c.id === card.id ? { ...c, faceUp: true } : c)
        );
        
        return {
          ...prev,
          tableau: newTableau,
          moves: prev.moves + 1
        };
      });
    }
  }, [gameState.foundations, moveCardToFoundation]);

  const showHint = useCallback(() => {
    const hint = getHint(gameState);
    if (hint) {
      toast(hint, { icon: '💡' });
    }
  }, [gameState]);

  const undoMove = useCallback(() => {
    if (gameState.history.length > 0) {
      const previousState = gameState.history[gameState.history.length - 1];
      setGameState(previousState);
      toast.success('Move undone');
    } else {
      toast.error('No moves to undo');
    }
  }, [gameState.history]);

  return (
    <div className="w-full h-screen bg-slate-900 relative">
      {/* Game UI Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="game-ui px-4 py-2 rounded-lg flex items-center gap-2">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-white font-medium">Score: {gameState.score}</span>
          </div>
          
          <div className="game-ui px-4 py-2 rounded-lg flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-white font-medium">{formatTime(gameTime)}</span>
          </div>
          
          <div className="game-ui px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="text-white font-medium">Moves: {gameState.moves}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={showHint}
            variant="outline"
            size="sm"
            className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30"
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            Hint
          </Button>
          
          <Button
            onClick={undoMove}
            variant="outline"
            size="sm"
            className="bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30"
            disabled={gameState.history.length === 0}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Undo
          </Button>
          
          <Button
            onClick={newGame}
            variant="outline"
            size="sm"
            className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30"
          >
            <Play className="w-4 h-4 mr-1" />
            New Game
          </Button>
        </div>
      </div>

      {/* Victory Modal */}
      {gameState.gameWon && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="game-ui p-8 rounded-xl text-center max-w-md">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Congratulations!</h2>
            <p className="text-gray-300 mb-4">
              You completed the game in {formatTime(gameTime)} with {gameState.moves} moves!
            </p>
            <p className="text-green-400 font-semibold mb-6">Final Score: {gameState.score}</p>
            <Button onClick={newGame} className="bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        </div>
      )}

      {/* 3D Game Canvas */}
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 8, 6]} fov={60} />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={15}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 0, 0]}
        />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.3} />

        <Environment preset="studio" />

        {/* Game Table */}
        <GameTable />

        {/* Deck Cards */}
        {gameState.deck.map((card, index) => (
          <Card3D
            key={card.id}
            card={card}
            onClick={drawFromDeck}
          />
        ))}

        {/* Waste Cards */}
        {gameState.waste.map((card, index) => (
          <Card3D
            key={card.id}
            card={card}
            onClick={() => handleCardClick(card)}
          />
        ))}

        {/* Foundation Cards */}
        {Object.entries(gameState.foundations).map(([suit, cards]) =>
          cards.map((card, index) => (
            <Card3D
              key={card.id}
              card={card}
              onClick={() => handleCardClick(card)}
            />
          ))
        )}

        {/* Tableau Cards */}
        {gameState.tableau.map((column, colIndex) =>
          column.map((card, cardIndex) => (
            <Card3D
              key={card.id}
              card={card}
              onClick={() => handleCardClick(card)}
            />
          ))
        )}
      </Canvas>
    </div>
  );
}