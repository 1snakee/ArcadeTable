import { Ledger } from './ledger';

export type RouletteBetType = 'RED' | 'BLACK';

export interface RoulettePlayer {
    id: string;
    name: string;
    isDealer: boolean;
    bet: number;
    betType: RouletteBetType | null;
    winnings: number;
}

export type RouletteGameState = 'BETTING' | 'SPINNING' | 'PAYOUT';

export interface RouletteHistoryItem {
    result: number; // 0 = RED, 1 = BLACK
    timestamp: number;
}

export class RouletteGameManager {
    players: RoulettePlayer[] = [];
    dealerId: string | null = null;
    gameState: RouletteGameState = 'BETTING';
    ledger: Ledger;
    history: RouletteHistoryItem[] = [];

    // The deterministic result of the spin
    // 0 = RED, 1 = BLACK
    currentResult: number | null = null;

    constructor(ledger: Ledger) {
        this.ledger = ledger;
    }

    addPlayer(name: string) {
        const id = name.toLowerCase().replace(/\s+/g, '-');
        // Prevent duplicate IDs
        if (this.players.some(p => p.id === id)) {
            return;
        }

        this.players.push({
            id,
            name,
            isDealer: false,
            bet: 0,
            betType: null,
            winnings: 0
        });
    }

    setDealer(playerId: string) {
        this.dealerId = playerId;
        this.players.forEach(p => p.isDealer = p.id === playerId);
    }

    placeBet(playerId: string, amount: number, type: RouletteBetType) {
        if (this.gameState !== 'BETTING') return;

        const player = this.players.find(p => p.id === playerId);
        if (!player || player.isDealer) return;

        // If switching bet type, reset bet
        if (player.betType !== type) {
            player.bet = 0;
            player.betType = type;
        }

        player.bet += amount;
    }

    clearBet(playerId: string) {
        if (this.gameState !== 'BETTING') return;

        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        player.bet = 0;
        player.betType = null;
    }

    // Deterministic result generation
    spin(): number {
        if (this.gameState !== 'BETTING') return this.currentResult || 0;

        // 0 = RED, 1 = BLACK
        this.currentResult = Math.random() < 0.5 ? 0 : 1;
        this.gameState = 'SPINNING';

        return this.currentResult;
    }

    resolveBets() {
        if (this.gameState !== 'SPINNING' || this.currentResult === null || !this.dealerId) return;

        const winningType: RouletteBetType = this.currentResult === 0 ? 'RED' : 'BLACK';

        this.players.forEach(player => {
            if (player.isDealer) return;
            if (player.bet === 0 || !player.betType) return;

            if (player.betType === winningType) {
                // Win: Dealer owes Player (1:1 payout + original bet returned = 2x total, but debt is net win)
                // In this ledger system, we record the net transfer.
                // If I bet 10 and win, I get my 10 back + 10 profit.
                // So Dealer owes Player 10.
                const profit = player.bet;
                this.ledger.recordTransfer(this.dealerId!, player.id, profit);
                player.winnings = profit;
            } else {
                // Lose: Player owes Dealer
                this.ledger.recordTransfer(player.id, this.dealerId!, player.bet);
                player.winnings = -player.bet;
            }
        });

        this.history.unshift({
            result: this.currentResult,
            timestamp: Date.now()
        });

        // Keep last 20
        if (this.history.length > 20) {
            this.history.pop();
        }

        this.gameState = 'PAYOUT';
    }

    resetRound() {
        this.gameState = 'BETTING';
        this.currentResult = null;
        this.players.forEach(p => {
            p.bet = 0;
            p.betType = null;
            p.winnings = 0;
        });
    }

    getDealer(): RoulettePlayer | undefined {
        return this.players.find(p => p.id === this.dealerId);
    }
}
