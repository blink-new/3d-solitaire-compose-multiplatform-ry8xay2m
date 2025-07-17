import { useState, useEffect, useCallback } from 'react';
import { SimpleCard } from './SimpleCard';
import { GameState, Card } from '../types/game';
import { initializeGame, canPlaceOnTableau, canPlaceOnFoundation, checkWinCondition, getHint } from '../utils/gameLogic';
import { Button } from './ui/button';
import { RotateCcw, Lightbulb, Play, Trophy, Clock, Target, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function SimpleSolitaire() {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [gameTime, setGameTime] = useState(0);
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
  const [dragSource, setDragSource] = useState<{ type: string; index?: number } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

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

  const addToHistory = (currentState: GameState) => {
    return [...currentState.history.slice(-49), currentState]; // Keep last 50 states
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
        const newDeck = [...prev.waste].reverse().map(card => ({
          ...card,
          faceUp: false,
          position: [-4, 0.1, 0] as [number, number, number]
        }));
        
        return {
          ...prev,
          deck: newDeck,
          waste: [],
          moves: prev.moves + 1,
          history: addToHistory(prev)
        };
      } else {
        // Draw 3 cards (or remaining cards if less than 3)
        const cardsToDraw = Math.min(3, prev.deck.length);
        const drawnCards = prev.deck.slice(-cardsToDraw).map(card => ({
          ...card,
          faceUp: true,
          position: [-2.5, 0.1, 0] as [number, number, number]
        }));
        
        return {
          ...prev,
          deck: prev.deck.slice(0, -cardsToDraw),
          waste: [...prev.waste, ...drawnCards],
          moves: prev.moves + 1,
          history: addToHistory(prev)
        };
      }
    });
  }, []);

  const moveCardToFoundation = useCallback((card: Card, suit: string) => {
    setGameState(prev => {
      const foundation = prev.foundations[suit as keyof typeof prev.foundations];
      if (!canPlaceOnFoundation(card, foundation)) return prev;

      const newFoundation = [...foundation, card];

      const newState = {
        ...prev,
        foundations: {
          ...prev.foundations,
          [suit]: newFoundation
        },
        score: prev.score + 10,
        moves: prev.moves + 1,
        history: addToHistory(prev)
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
          moves: prev.moves + 1,
          history: addToHistory(prev)
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

  const autoComplete = useCallback(() => {
    setGameState(prev => {
      let newState = { ...prev };
      let foundMove = true;
      
      while (foundMove) {
        foundMove = false;
        
        // Check tableau cards
        for (let col = 0; col < newState.tableau.length; col++) {
          const column = newState.tableau[col];
          if (column.length > 0) {
            const topCard = column[column.length - 1];
            if (topCard.faceUp) {
              const foundation = newState.foundations[topCard.suit];
              if (canPlaceOnFoundation(topCard, foundation)) {
                // Move card to foundation
                newState.tableau[col] = column.slice(0, -1);
                newState.foundations[topCard.suit] = [...foundation, topCard];
                newState.score += 10;
                newState.moves += 1;
                
                // Flip next card if exists and face down
                const remainingColumn = newState.tableau[col];
                if (remainingColumn.length > 0 && !remainingColumn[remainingColumn.length - 1].faceUp) {
                  remainingColumn[remainingColumn.length - 1].faceUp = true;
                }
                
                foundMove = true;
                break;
              }
            }
          }
        }
        
        // Check waste card
        if (!foundMove && newState.waste.length > 0) {
          const wasteCard = newState.waste[newState.waste.length - 1];
          const foundation = newState.foundations[wasteCard.suit];
          if (canPlaceOnFoundation(wasteCard, foundation)) {
            newState.waste = newState.waste.slice(0, -1);
            newState.foundations[wasteCard.suit] = [...foundation, wasteCard];
            newState.score += 10;
            newState.moves += 1;
            foundMove = true;
          }
        }
      }
      
      // Check win condition
      if (checkWinCondition(newState)) {
        newState.gameWon = true;
        toast.success('🎉 Congratulations! You won!');
      }
      
      return newState;
    });
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

  // Drag and drop handlers
  const handleDragStart = useCallback((card: Card, source: { type: string; index?: number }) => {
    return (e: React.DragEvent) => {
      setDraggedCard(card);
      setDragSource(source);
      e.dataTransfer.effectAllowed = 'move';
    };
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedCard(null);
    setDragSource(null);
    setDragOverTarget(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDropOnFoundation = useCallback((suit: string) => {
    return (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedCard || !dragSource) return;

      const foundation = gameState.foundations[suit as keyof typeof gameState.foundations];
      if (canPlaceOnFoundation(draggedCard, foundation)) {
        setGameState(prev => {
          const newState = { ...prev };
          
          // Remove card from source
          if (dragSource.type === 'waste') {
            newState.waste = newState.waste.slice(0, -1);
          } else if (dragSource.type === 'tableau' && dragSource.index !== undefined) {
            newState.tableau[dragSource.index] = newState.tableau[dragSource.index].slice(0, -1);
            
            // Flip the next card if it exists and is face down
            const column = newState.tableau[dragSource.index];
            if (column.length > 0 && !column[column.length - 1].faceUp) {
              column[column.length - 1].faceUp = true;
            }
          }
          
          // Add card to foundation
          newState.foundations[suit as keyof typeof newState.foundations] = [
            ...foundation,
            draggedCard
          ];
          
          newState.score += 10;
          newState.moves += 1;
          newState.history = addToHistory(prev);
          
          // Check win condition
          if (checkWinCondition(newState)) {
            newState.gameWon = true;
            toast.success('🎉 Congratulations! You won!');
          }
          
          return newState;
        });
        
        toast.success(`Moved ${draggedCard.rank} of ${draggedCard.suit} to foundation`);
      } else {
        toast.error('Invalid move');
      }
      
      setDraggedCard(null);
      setDragSource(null);
      setDragOverTarget(null);
    };
  }, [draggedCard, dragSource, gameState]);

  const handleDropOnTableau = useCallback((columnIndex: number) => {
    return (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedCard || !dragSource) return;

      const targetColumn = gameState.tableau[columnIndex];
      const targetCard = targetColumn.length > 0 ? targetColumn[targetColumn.length - 1] : null;
      
      if (canPlaceOnTableau(draggedCard, targetCard)) {
        setGameState(prev => {
          const newState = { ...prev };
          
          // Remove card from source
          if (dragSource.type === 'waste') {
            newState.waste = newState.waste.slice(0, -1);
          } else if (dragSource.type === 'tableau' && dragSource.index !== undefined) {
            newState.tableau[dragSource.index] = newState.tableau[dragSource.index].slice(0, -1);
            
            // Flip the next card if it exists and is face down
            const column = newState.tableau[dragSource.index];
            if (column.length > 0 && !column[column.length - 1].faceUp) {
              column[column.length - 1].faceUp = true;
            }
          }
          
          // Add card to tableau
          newState.tableau[columnIndex] = [...targetColumn, draggedCard];
          newState.moves += 1;
          newState.history = addToHistory(prev);
          
          return newState;
        });
        
        toast.success(`Moved ${draggedCard.rank} of ${draggedCard.suit}`);
      } else {
        toast.error('Invalid move');
      }
      
      setDraggedCard(null);
      setDragSource(null);
      setDragOverTarget(null);
    };
  }, [draggedCard, dragSource, gameState]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-4">
      {/* Game UI Header */}
      <div className="flex justify-between items-center mb-6">
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
            onClick={autoComplete}
            variant="outline"
            size="sm"
            className="bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30"
          >
            <Zap className="w-4 h-4 mr-1" />
            Auto
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
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

      {/* Game Board */}
      <div className="max-w-6xl mx-auto">
        {/* Top Row - Deck, Waste, and Foundations */}
        <div className="flex justify-between items-start mb-8">
          {/* Deck and Waste */}
          <div className="flex gap-4">
            {/* Deck */}
            <div className="relative">
              <div className="w-16 h-24 rounded-lg border-2 border-dashed border-green-400/30 flex items-center justify-center">
                <span className="text-green-400/50 text-xs">DECK</span>
              </div>
              {gameState.deck.length > 0 && (
                <SimpleCard
                  card={gameState.deck[gameState.deck.length - 1]}
                  onClick={drawFromDeck}
                  className="absolute top-0 left-0"
                />
              )}
            </div>

            {/* Waste */}
            <div className="relative">
              <div className="w-16 h-24 rounded-lg border-2 border-dashed border-green-400/30 flex items-center justify-center">
                <span className="text-green-400/50 text-xs">WASTE</span>
              </div>
              {gameState.waste.length > 0 && (
                <SimpleCard
                  card={gameState.waste[gameState.waste.length - 1]}
                  onClick={() => handleCardClick(gameState.waste[gameState.waste.length - 1])}
                  draggable={gameState.waste[gameState.waste.length - 1].faceUp}
                  onDragStart={handleDragStart(gameState.waste[gameState.waste.length - 1], { type: 'waste' })}
                  onDragEnd={handleDragEnd}
                  className="absolute top-0 left-0"
                />
              )}
            </div>
          </div>

          {/* Foundations */}
          <div className="flex gap-4">
            {(['spades', 'hearts', 'clubs', 'diamonds'] as const).map((suit) => (
              <div key={suit} className="relative">
                <div 
                  className={`w-16 h-24 rounded-lg border-2 border-dashed flex items-center justify-center transition-all duration-200 ${
                    dragOverTarget === `foundation-${suit}` 
                      ? 'border-green-400 bg-green-400/20 scale-105' 
                      : 'border-green-400/30'
                  }`}
                  onDragOver={(e) => {
                    handleDragOver(e);
                    setDragOverTarget(`foundation-${suit}`);
                  }}
                  onDragLeave={() => setDragOverTarget(null)}
                  onDrop={handleDropOnFoundation(suit)}
                >
                  <span className="text-green-400/50 text-2xl">
                    {suit === 'spades' ? '♠' : suit === 'hearts' ? '♥' : suit === 'clubs' ? '♣' : '♦'}
                  </span>
                </div>
                {gameState.foundations[suit].length > 0 && (
                  <SimpleCard
                    card={gameState.foundations[suit][gameState.foundations[suit].length - 1]}
                    onClick={() => handleCardClick(gameState.foundations[suit][gameState.foundations[suit].length - 1])}
                    className="absolute top-0 left-0"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tableau */}
        <div className="flex gap-4 justify-center">
          {gameState.tableau.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-1 min-h-96">
              <div 
                className={`w-16 h-24 rounded-lg border-2 border-dashed transition-all duration-200 ${
                  dragOverTarget === `tableau-${colIndex}` 
                    ? 'border-green-400 bg-green-400/20 scale-105' 
                    : 'border-green-400/20'
                }`}
                onDragOver={(e) => {
                  handleDragOver(e);
                  setDragOverTarget(`tableau-${colIndex}`);
                }}
                onDragLeave={() => setDragOverTarget(null)}
                onDrop={handleDropOnTableau(colIndex)}
              ></div>
              {column.map((card, cardIndex) => {
                const isTopCard = cardIndex === column.length - 1;
                return (
                  <SimpleCard
                    key={card.id}
                    card={card}
                    onClick={() => handleCardClick(card)}
                    draggable={card.faceUp && isTopCard}
                    onDragStart={card.faceUp && isTopCard ? handleDragStart(card, { type: 'tableau', index: colIndex }) : undefined}
                    onDragEnd={handleDragEnd}
                    className="relative"
                    style={{
                      marginTop: cardIndex === 0 ? '-96px' : '-18px',
                      zIndex: cardIndex
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}