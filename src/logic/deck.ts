import type { Card, Rank, Suit } from './types';

export class Deck {
    private cards: Card[] = [];

    constructor() {
        this.initialize();
    }

    initialize() {
        this.cards = [];
        const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        for (const suit of suits) {
            for (const rank of ranks) {
                let value = parseInt(rank);
                if (isNaN(value)) {
                    if (rank === 'A') value = 11;
                    else value = 10;
                }
                this.cards.push({
                    suit,
                    rank,
                    value,
                    id: `${rank}-${suit}-${Math.random().toString(36).substr(2, 9)}`
                });
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw(): Card | undefined {
        return this.cards.pop();
    }

    remaining(): number {
        return this.cards.length;
    }
}
