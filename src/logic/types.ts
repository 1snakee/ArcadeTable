export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    suit: Suit;
    rank: Rank;
    value: number; // 2-10, 10 for face cards, 11 for Ace (handled dynamically in hand calc)
    id: string; // Unique ID for animations
}

export interface Player {
    id: string;
    name: string;
    isDealer: boolean;
    chips: number;
    hand: Card[];
    currentBet: number;
    insuranceBet: number;
    status: 'idle' | 'betting' | 'playing' | 'stand' | 'bust' | 'blackjack' | 'surrender';

    // Split hand support
    splitHands?: Card[][]; // Array of hands if player has split
    splitBets?: number[]; // Bet for each split hand
    currentSplitIndex?: number; // Which split hand is currently being played (0-based)
    isSplitAces?: boolean; // If true, split aces only get 1 card
}

export type GamePhase = 'SETUP' | 'BETTING' | 'DEALING' | 'INSURANCE' | 'PLAYER_TURN' | 'DEALER_TURN' | 'RESOLUTION';

export interface GameState {
    phase: GamePhase;
    players: Player[];
    deck: Card[];
    dealerId: string;
    currentPlayerIndex: number; // Index in players array (skipping dealer usually)
    pot: number;
}

export type BetType = 'PLAYER' | 'BANKER' | 'TIE';

export interface BaccaratResult {
    winner: 'PLAYER' | 'BANKER' | 'TIE';
    playerScore: number;
    bankerScore: number;
    playerHand: Card[];
    bankerHand: Card[];
}
