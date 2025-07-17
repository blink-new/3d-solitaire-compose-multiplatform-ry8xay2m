import { useState } from 'react';
import { Card } from '../types/game';
import { cn } from '../lib/utils';

interface SimpleCardProps {
  card: Card;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  draggable?: boolean;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

const suitColors = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-gray-900',
  spades: 'text-gray-900'
};

export function SimpleCard({ 
  card, 
  onClick, 
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  className, 
  style,
  draggable = false
}: SimpleCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart?.(e);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd?.(e);
  };

  return (
    <div
      className={cn(
        'w-16 h-24 rounded-lg border-2 cursor-pointer transition-all duration-200',
        'hover:scale-105 hover:shadow-lg hover:-translate-y-1',
        'card-shadow select-none',
        card.faceUp 
          ? 'bg-white border-gray-300' 
          : 'bg-gradient-to-br from-green-600 to-green-700 border-green-500',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 scale-110 rotate-3',
        className
      )}
      onClick={onClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={style}
    >
      {card.faceUp ? (
        <div className="h-full flex flex-col p-1 relative">
          {/* Top left */}
          <div className="flex flex-col items-start">
            <span className={cn('text-xs font-bold leading-none', suitColors[card.suit])}>
              {card.rank}
            </span>
            <span className={cn('text-xs leading-none', suitColors[card.suit])}>
              {suitSymbols[card.suit]}
            </span>
          </div>
          
          {/* Center */}
          <div className="flex-1 flex items-center justify-center">
            <span className={cn('text-2xl', suitColors[card.suit])}>
              {suitSymbols[card.suit]}
            </span>
          </div>
          
          {/* Bottom right (rotated) */}
          <div className="absolute bottom-1 right-1 flex flex-col items-center rotate-180">
            <span className={cn('text-xs font-bold leading-none', suitColors[card.suit])}>
              {card.rank}
            </span>
            <span className={cn('text-xs leading-none', suitColors[card.suit])}>
              {suitSymbols[card.suit]}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-green-200 text-lg font-bold">
            ♠♥♣♦
          </div>
        </div>
      )}
    </div>
  );
}