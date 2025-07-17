import { Card, Suit, Rank, GameState } from '../types/game';

const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  
  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        faceUp: false,
        position: [0, 0, 0],
        rotation: [0, 0, 0]
      });
    });
  });
  
  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function initializeGame(): GameState {
  const deck = createDeck();
  const tableau: Card[][] = [[], [], [], [], [], [], []];
  
  // Deal cards to tableau
  let deckIndex = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck[deckIndex++];
      card.faceUp = row === col; // Only top card is face up
      card.position = [col * 1.2 - 3.6, 0.1 + row * 0.02, row * -0.1];
      tableau[col].push(card);
    }
  }
  
  // Remaining cards go to deck
  const remainingDeck = deck.slice(deckIndex).map((card, index) => ({
    ...card,
    position: [-4, 0.1 + index * 0.01, 0] as [number, number, number]
  }));
  
  return {
    deck: remainingDeck,
    waste: [],
    foundations: {
      hearts: [],
      diamonds: [],
      clubs: [],
      spades: []
    },
    tableau,
    score: 0,
    moves: 0,
    time: 0,
    gameWon: false,
    history: []
  };
}

export function getRankValue(rank: Rank): number {
  switch (rank) {
    case 'A': return 1;
    case 'J': return 11;
    case 'Q': return 12;
    case 'K': return 13;
    default: return parseInt(rank);
  }
}

export function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

export function canPlaceOnTableau(card: Card, targetCard: Card | null): boolean {
  if (!targetCard) {
    return getRankValue(card.rank) === 13; // Only King can go on empty tableau
  }
  
  const cardValue = getRankValue(card.rank);
  const targetValue = getRankValue(targetCard.rank);
  
  return cardValue === targetValue - 1 && isRed(card.suit) !== isRed(targetCard.suit);
}

export function canPlaceOnFoundation(card: Card, foundation: Card[]): boolean {
  if (foundation.length === 0) {
    return getRankValue(card.rank) === 1; // Only Ace can start foundation
  }
  
  const topCard = foundation[foundation.length - 1];
  return card.suit === topCard.suit && getRankValue(card.rank) === getRankValue(topCard.rank) + 1;
}

export function checkWinCondition(gameState: GameState): boolean {
  return Object.values(gameState.foundations).every(foundation => foundation.length === 13);
}

export function getHint(gameState: GameState): string | null {
  // Check if any tableau cards can move to foundations
  for (let col = 0; col < gameState.tableau.length; col++) {
    const column = gameState.tableau[col];
    if (column.length > 0) {
      const topCard = column[column.length - 1];
      if (topCard.faceUp) {
        const foundation = gameState.foundations[topCard.suit];
        if (canPlaceOnFoundation(topCard, foundation)) {
          return `Move ${topCard.rank} of ${topCard.suit} to foundation`;
        }
      }
    }
  }
  
  // Check if waste card can move to foundation
  if (gameState.waste.length > 0) {
    const wasteCard = gameState.waste[gameState.waste.length - 1];
    const foundation = gameState.foundations[wasteCard.suit];
    if (canPlaceOnFoundation(wasteCard, foundation)) {
      return `Move ${wasteCard.rank} of ${wasteCard.suit} from waste to foundation`;
    }
  }
  
  // Check if deck has cards to draw
  if (gameState.deck.length > 0) {
    return 'Draw cards from deck';
  }
  
  return 'No obvious moves available';
}