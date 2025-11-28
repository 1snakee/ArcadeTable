import { Deck } from './deck';
import type { Card, Player, BetType, BaccaratResult } from './types';

export class BaccaratGameManager {
    deck: Deck;
    players: Player[] = [];
    phase: 'BETTING' | 'DEALING' | 'RESOLUTION' = 'BETTING';

    playerHand: Card[] = [];
    bankerHand: Card[] = [];

    // Track bets: playerId -> { type: amount }
    bets: Map<string, { [key in BetType]?: number }> = new Map();

    lastResult: BaccaratResult | null = null;
    dealerId: string | null = null;

    constructor() {
        this.deck = new Deck();
        // Initialize deck with multiple decks for Baccarat (usually 8)
        this.deck.initialize();
    }

    addPlayer(name: string) {
        const id = `player-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        this.players.push({
            id,
            name,
            isDealer: false,
            chips: 0, // No starting balance
            hand: [],
            currentBet: 0, // Not used directly in Baccarat, using `bets` map
            insuranceBet: 0,
            status: 'idle'
        });
    }

    placeBet(playerId: string, type: BetType, amount: number): boolean {
        if (this.phase !== 'BETTING') return false;

        const player = this.players.find(p => p.id === playerId);
        if (!player) return false;

        // if (player.chips < amount) return false; // Allow debt

        let playerBets = this.bets.get(playerId);
        if (!playerBets) {
            playerBets = {};
            this.bets.set(playerId, playerBets);
        }

        // Add to existing bet of this type or set new
        const currentAmount = playerBets[type] || 0;
        playerBets[type] = currentAmount + amount;

        player.chips -= amount;
        return true;
    }

    clearBets(playerId: string) {
        if (this.phase !== 'BETTING') return;

        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        const playerBets = this.bets.get(playerId);
        if (playerBets) {
            // Refund all
            let total = 0;
            if (playerBets.PLAYER) total += playerBets.PLAYER;
            if (playerBets.BANKER) total += playerBets.BANKER;
            if (playerBets.TIE) total += playerBets.TIE;
            player.chips += total;
            this.bets.delete(playerId);
        }
    }

    startGame() {
        if (this.bets.size === 0) return; // Need at least one bet? Or just deal?
        this.phase = 'DEALING';
        this.deal();
    }

    deal() {
        this.playerHand = [];
        this.bankerHand = [];
        this.lastResult = null;

        // Initial Deal: P, B, P, B
        this.playerHand.push(this.drawCard());
        this.bankerHand.push(this.drawCard());
        this.playerHand.push(this.drawCard());
        this.bankerHand.push(this.drawCard());

        this.resolveGame();
    }

    drawCard(): Card {
        if (this.deck.remaining() < 10) {
            this.deck.initialize(); // Reshuffle
        }
        return this.deck.draw()!;
    }

    getCardValue(card: Card): number {
        if (['10', 'J', 'Q', 'K'].includes(card.rank)) return 0;
        if (card.rank === 'A') return 1;
        return parseInt(card.rank);
    }

    calculateScore(hand: Card[]): number {
        const total = hand.reduce((sum, card) => sum + this.getCardValue(card), 0);
        return total % 10;
    }

    resolveGame() {
        let playerScore = this.calculateScore(this.playerHand);
        let bankerScore = this.calculateScore(this.bankerHand);

        // Natural Win (8 or 9)
        if (playerScore >= 8 || bankerScore >= 8) {
            this.finalizeRound();
            return;
        }

        // Player Third Card Rule
        let playerThirdCardValue = -1;
        if (playerScore <= 5) {
            const card = this.drawCard();
            this.playerHand.push(card);
            playerThirdCardValue = this.getCardValue(card);
            playerScore = this.calculateScore(this.playerHand);
        }

        // Banker Third Card Rule
        let bankerDraws = false;
        if (bankerScore <= 2) {
            bankerDraws = true;
        } else if (bankerScore === 3) {
            // Draws unless Player's third card was an 8
            if (playerThirdCardValue !== 8) bankerDraws = true;
        } else if (bankerScore === 4) {
            // Draws if Player's third card was 2, 3, 4, 5, 6, 7
            if ([2, 3, 4, 5, 6, 7].includes(playerThirdCardValue)) bankerDraws = true;
            // Also draws if player didn't take a third card (playerThirdCardValue === -1) and banker <= 5? 
            // Standard rule: If Player stands (6 or 7), Banker draws on 0-5.
            if (playerThirdCardValue === -1 && bankerScore <= 5) bankerDraws = true;
        } else if (bankerScore === 5) {
            // Draws if Player's third card was 4, 5, 6, 7
            if ([4, 5, 6, 7].includes(playerThirdCardValue)) bankerDraws = true;
            if (playerThirdCardValue === -1 && bankerScore <= 5) bankerDraws = true;
        } else if (bankerScore === 6) {
            // Draws if Player's third card was 6, 7
            if ([6, 7].includes(playerThirdCardValue)) bankerDraws = true;
            if (playerThirdCardValue === -1 && bankerScore <= 5) bankerDraws = true;
        }

        // Correction on Banker Logic when Player Stands:
        // If Player stands (has 6 or 7 initially), Banker draws on 0-5 and stands on 6-7.
        if (this.playerHand.length === 2) { // Player stood
            if (bankerScore <= 5) bankerDraws = true;
            else bankerDraws = false;
        }

        if (bankerDraws) {
            this.bankerHand.push(this.drawCard());
            bankerScore = this.calculateScore(this.bankerHand);
        }

        this.finalizeRound();
    }

    finalizeRound() {
        const playerScore = this.calculateScore(this.playerHand);
        const bankerScore = this.calculateScore(this.bankerHand);

        let winner: 'PLAYER' | 'BANKER' | 'TIE' = 'TIE';
        if (playerScore > bankerScore) winner = 'PLAYER';
        else if (bankerScore > playerScore) winner = 'BANKER';

        this.lastResult = {
            winner,
            playerScore,
            bankerScore,
            playerHand: this.playerHand,
            bankerHand: this.bankerHand
        };

        this.payout(winner);
        this.phase = 'RESOLUTION';
    }

    payout(winner: 'PLAYER' | 'BANKER' | 'TIE') {
        this.bets.forEach((playerBets, playerId) => {
            const player = this.players.find(p => p.id === playerId);
            if (!player) return;

            // Player Bet (1:1)
            if (playerBets.PLAYER && winner === 'PLAYER') {
                player.chips += playerBets.PLAYER * 2;
            } else if (playerBets.PLAYER && winner === 'TIE') {
                player.chips += playerBets.PLAYER; // Push
            }

            // Banker Bet (0.95:1) - usually 5% commission
            if (playerBets.BANKER && winner === 'BANKER') {
                player.chips += playerBets.BANKER * 1.95;
            } else if (playerBets.BANKER && winner === 'TIE') {
                player.chips += playerBets.BANKER; // Push
            }

            // Tie Bet (8:1)
            if (playerBets.TIE && winner === 'TIE') {
                player.chips += playerBets.TIE * 9; // 8:1 payout + original bet
            }
        });
    }

    setDealer(playerId: string) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        this.players.forEach(p => p.isDealer = false);
        player.isDealer = true;
        this.dealerId = player.id;
    }

    resetRound() {
        this.bets.clear();
        this.playerHand = [];
        this.bankerHand = [];
        this.lastResult = null;
        this.phase = 'BETTING';
    }
}
