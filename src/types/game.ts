export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface GameState {
  deck: Card[];
  waste: Card[];
  foundations: {
    hearts: Card[];
    diamonds: Card[];
    clubs: Card[];
    spades: Card[];
  };
  tableau: Card[][];
  score: number;
  moves: number;
  time: number;
  gameWon: boolean;
  history: GameState[];
}

export interface DragState {
  isDragging: boolean;
  draggedCards: Card[];
  sourceLocation: string;
  sourceIndex?: number;
}