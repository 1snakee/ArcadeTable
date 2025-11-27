import { Deck } from './deck';
import type { Card, GameState, Player } from './types';

export class GameManager {
    state: GameState;
    private deck: Deck;

    constructor() {
        this.deck = new Deck();
        this.state = {
            phase: 'SETUP',
            players: [],
            deck: [],
            dealerId: '',
            currentPlayerIndex: -1,
            pot: 0
        };
    }

    addPlayer(name: string) {
        const id = `player-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        this.state.players.push({
            id,
            name,
            isDealer: false,
            chips: 0,
            hand: [],
            currentBet: 0,
            insuranceBet: 0,
            status: 'idle'
        });
    }

    setDealer(playerId: string) {
        this.state.players.forEach(p => p.isDealer = (p.id === playerId));
        this.state.dealerId = playerId;
    }

    startGame() {
        if (this.state.players.length < 2) throw new Error("Need at least 2 players");
        if (!this.state.dealerId) throw new Error("No dealer selected");
        this.state.phase = 'BETTING';
        this.resetRound();
    }

    resetRound() {
        this.deck = new Deck();
        if (this.deck.remaining() < 20) {
            this.deck.initialize();
        }
        this.state.players.forEach(p => {
            p.hand = [];
            p.currentBet = 0;
            p.insuranceBet = 0;
            p.status = 'betting';
            p.splitHands = undefined;
            p.splitBets = undefined;
            p.currentSplitIndex = undefined;
            p.isSplitAces = undefined;
            if (p.isDealer) p.status = 'idle';
        });
        this.state.pot = 0;
        this.state.phase = 'BETTING';
    }

    placeBet(playerId: string, amount: number) {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player || player.isDealer) return;
        // Handle clear signal (-9999)
        if (amount === -9999) {
            player.currentBet = 0;
        } else {
            player.currentBet += amount;
            if (player.currentBet < 0) player.currentBet = 0;
        }
    }

    placeInsuranceBet(playerId: string) {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player || player.isDealer) return;
        const insuranceCost = player.currentBet / 2;
        if (player.chips >= insuranceCost) {
            player.insuranceBet = insuranceCost;
        }
    }

    dealInitialCards() {
        this.state.phase = 'DEALING';
        for (let i = 0; i < 2; i++) {
            for (const player of this.state.players) {
                const card = this.deck.draw();
                if (card) {
                    player.hand.push(card);
                }
            }
        }
    }

    dealCardTo(playerId: string): Card | undefined {
        if (this.deck.remaining() < 10) {
            this.deck.initialize();
        }
        const card = this.deck.draw();
        if (card) {
            const player = this.state.players.find(p => p.id === playerId);
            if (player) {
                // If player has split hands, add to current split hand
                if (player.splitHands && player.currentSplitIndex !== undefined) {
                    player.splitHands[player.currentSplitIndex].push(card);
                } else {
                    player.hand.push(card);
                }
            }
        }
        return card;
    }

    calculateHandValue(hand: Card[]): number {
        let value = 0;
        let aces = 0;
        for (const card of hand) {
            value += card.value;
            if (card.rank === 'A') aces++;
        }
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }
        return value;
    }

    calculateSoftHandValue(hand: Card[]): { value: number; isSoft: boolean; softValue?: number } {
        let total = 0;
        let aces = 0;
        hand.forEach(card => {
            if (card.rank === 'A') {
                aces++;
                total += 11;
            } else if (['K', 'Q', 'J'].includes(card.rank)) {
                total += 10;
            } else {
                total += parseInt(card.rank);
            }
        });
        const isSoft = aces > 0 && total <= 21;
        const softValue = isSoft ? total - 10 : undefined;
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }
        return { value: total, isSoft, softValue };
    }

    // Check if player can split
    canSplit(player: Player): boolean {
        // Can't split if already at max hands (4)
        if (player.splitHands && player.splitHands.length >= 4) return false;

        // Determine which hand to check
        const handToCheck = player.splitHands && player.currentSplitIndex !== undefined
            ? player.splitHands[player.currentSplitIndex]
            : player.hand;

        // Must have exactly 2 cards
        if (handToCheck.length !== 2) return false;

        // Check if cards have same value (allows 10-J, Q-K, etc.)
        const [card1, card2] = handToCheck;
        return card1.value === card2.value;
    }

    // Split a player's hand
    splitHand(playerId: string): boolean {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player || !this.canSplit(player)) return false;

        // Initialize split hands if first split
        if (!player.splitHands) {
            player.splitHands = [[...player.hand]];
            player.splitBets = [player.currentBet];
            player.currentSplitIndex = 0;
        }

        // Get the hand being split
        const handIndex = player.currentSplitIndex!;
        const handToSplit = player.splitHands[handIndex];

        // Split the cards
        const [card1, card2] = handToSplit;
        player.splitHands[handIndex] = [card1];
        player.splitHands.push([card2]);
        player.splitBets!.push(player.currentBet);

        // Check if splitting aces
        if (card1.rank === 'A') {
            player.isSplitAces = true;
        }

        // Deduct chips for the additional bet
        player.chips -= player.currentBet;

        // Deal one card to the hand that was split (handIndex)
        player.currentSplitIndex = handIndex;
        this.dealCardTo(playerId);

        // Deal one card to the new hand (last one)
        const newHandIndex = player.splitHands.length - 1;
        player.currentSplitIndex = newHandIndex;
        this.dealCardTo(playerId);

        // Reset to the hand that was split
        player.currentSplitIndex = handIndex;

        return true;
    }

    nextTurn() {
        // Check if current player has more split hands to play
        if (this.state.currentPlayerIndex !== -1) {
            const currentPlayer = this.state.players[this.state.currentPlayerIndex];
            if (currentPlayer && !currentPlayer.isDealer && currentPlayer.splitHands && currentPlayer.currentSplitIndex !== undefined) {
                if (currentPlayer.currentSplitIndex < currentPlayer.splitHands.length - 1) {
                    currentPlayer.currentSplitIndex++;
                    return;
                }
            }
        }

        let nextIndex = this.state.currentPlayerIndex + 1;
        while (nextIndex < this.state.players.length) {
            const player = this.state.players[nextIndex];
            if (!player.isDealer && player.status === 'playing') {
                this.state.currentPlayerIndex = nextIndex;
                // If player has split hands, start with first one
                if (player.splitHands) {
                    player.currentSplitIndex = 0;
                }
                return;
            }
            nextIndex++;
        }
        this.startDealerTurn();
    }

    startPlayerTurns() {
        this.state.phase = 'PLAYER_TURN';
        this.state.players.forEach((p) => {
            if (!p.isDealer && p.currentBet > 0) {
                p.status = 'playing';
                if (this.calculateHandValue(p.hand) === 21) {
                    p.status = 'blackjack';
                }
            }
        });
        this.state.currentPlayerIndex = -1;
        this.nextTurn();
    }

    resolveInsurance(dealerHasBlackjack: boolean) {
        this.state.players.forEach(p => {
            if (p.isDealer || p.insuranceBet === 0) return;
            if (dealerHasBlackjack) {
                p.chips += p.insuranceBet * 2;
            } else {
                p.chips -= p.insuranceBet;
            }
            p.insuranceBet = 0;
        });
    }

    startDealerTurn() {
        this.state.phase = 'DEALER_TURN';
        const dealer = this.state.players.find(p => p.isDealer);
        if (dealer) {
            dealer.status = 'playing';
        }
    }
}