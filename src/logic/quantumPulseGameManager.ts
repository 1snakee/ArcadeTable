import { Ledger } from '../logic/ledger';
import type { Player } from '../logic/types';

export type PulseOutcome = 'PLAYER' | 'HOUSE';
export type AnimationPhase = 'IDLE' | 'ORBITING' | 'ACCELERATING' | 'MERGING' | 'PULSING' | 'RESULT';

export interface ParticleState {
    angle: number;
    color: string;
}

export class QuantumPulseGameManager {
    players: Player[] = [];
    dealerId: string = '';
    ledger: Ledger;

    phase: 'IDLE' | 'BETTING' | 'ANIMATING' | 'RESULT' = 'IDLE';
    currentBet: number = 0;
    currentPlayerId: string = '';
    lastOutcome: PulseOutcome | null = null;

    constructor(ledger: Ledger) {
        this.ledger = ledger;
    }

    addPlayer(name: string): void {
        const player: Player = {
            id: Math.random().toString(36).substring(7),
            name,
            chips: 0,
            hand: [],
            currentBet: 0,
            insuranceBet: 0,
            status: 'idle',
            isDealer: false
        };
        this.players.push(player);
    }

    setDealer(playerId: string): void {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        this.players.forEach(p => p.isDealer = false);
        player.isDealer = true;
        this.dealerId = player.id;
    }

    placeBet(playerId: string, amount: number): boolean {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return false;

        this.currentBet = amount;
        this.currentPlayerId = playerId;
        player.chips -= amount;
        this.phase = 'BETTING';
        return true;
    }

    determineOutcome(): PulseOutcome {
        // True 50/50 using crypto.getRandomValues for fairness
        const randomValues = new Uint32Array(1);
        crypto.getRandomValues(randomValues);
        const outcome: PulseOutcome = (randomValues[0] % 2 === 0) ? 'PLAYER' : 'HOUSE';
        this.lastOutcome = outcome;
        return outcome;
    }

    resolveRound(outcome: PulseOutcome): void {
        const player = this.players.find(p => p.id === this.currentPlayerId);
        const dealer = this.players.find(p => p.id === this.dealerId);

        if (!player || !dealer) return;

        if (outcome === 'PLAYER') {
            // Player wins
            const winAmount = this.currentBet * 2;
            player.chips += winAmount;
            this.ledger.recordTransfer(this.dealerId, this.currentPlayerId, this.currentBet);
        } else {
            // House wins
            this.ledger.recordTransfer(this.currentPlayerId, this.dealerId, this.currentBet);
        }

        this.phase = 'RESULT';
    }

    resetRound(): void {
        this.currentBet = 0;
        this.currentPlayerId = '';
        this.lastOutcome = null;
        this.phase = 'IDLE';
    }

    getPlayerById(id: string): Player | undefined {
        return this.players.find(p => p.id === id);
    }

    getNonDealerPlayers(): Player[] {
        return this.players.filter(p => p.id !== this.dealerId);
    }
}
