import { QuantumPulseGameManager } from '../../logic/quantumPulseGameManager';
import { Ledger } from '../../logic/ledger';
import { ParticleAnimation } from '../animations/particleAnimation';
import { Controls } from '../components/controls';

export class QuantumPulseTableScreen {
    container: HTMLElement;
    game: QuantumPulseGameManager;
    ledger: Ledger;
    onExit: () => void;

    private canvas!: HTMLCanvasElement;
    private animation: ParticleAnimation | null = null;
    private controls: Controls | null = null;
    private selectedChip: number = 0.10;
    private currentPlayerIndex: number = 0;
    private isProcessing: boolean = false;
    private playerBets: Map<string, number> = new Map();
    private playerNames: Map<string, string> = new Map();

    constructor(root: HTMLElement, game: QuantumPulseGameManager, ledger: Ledger, onExit: () => void) {
        this.game = game;
        this.ledger = ledger;
        this.onExit = onExit;

        // Populate player names map
        this.game.players.forEach(p => this.playerNames.set(p.id, p.name));

        this.container = document.createElement('div');
        this.container.className = 'w-full h-full relative overflow-hidden';
        root.appendChild(this.container);

        this.render();
        this.initGame();
    }

    render() {
        this.container.innerHTML = `
            <!-- Top Bar -->
            <div class="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-50 pointer-events-none">
                <button id="ledger-btn" class="pointer-events-auto neon-glass-panel px-4 py-2 text-white/80 hover:text-neon-blue text-sm flex items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(0,191,255,0.3)]">
                    <span class="text-lg">📊</span> Ledger
                </button>
                
                <div class="pointer-events-auto flex flex-col items-center">
                     <h2 class="text-xl font-bold text-white tracking-wider font-display" style="text-shadow: 0 0 10px rgba(255,255,255,0.5);">QUANTUM PULSE</h2>
                </div>

                <button id="menu-btn" class="pointer-events-auto p-3 text-white/50 hover:text-neon-pink transition-colors rounded-full hover:bg-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            <!-- Main Game Area -->
            <div id="game-layer" class="relative w-full h-full z-10 flex flex-col items-center justify-center p-4 gap-6">
                
                <!-- Canvas Arena -->
                <div class="relative">
                    <canvas id="quantum-canvas" width="400" height="400" class="rounded-2xl" style="width: 400px; height: 400px; background: radial-gradient(circle, rgba(138, 43, 226, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%); box-shadow: inset 0 0 50px rgba(138, 43, 226, 0.3), 0 0 30px rgba(0, 191, 255, 0.2);"></canvas>
                </div>

                <!-- Player Islands -->
                <div id="player-islands" class="flex gap-3 justify-center flex-wrap max-w-5xl">
                    <!-- Populated dynamically -->
                </div>

            </div>

            <!-- Controls Layer (Bottom Center) -->
            <div id="controls-container" class="absolute left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto transition-all duration-500 opacity-0 min-w-[300px] justify-center z-50" style="bottom: 1.5rem;"></div>

            <!-- Ledger Modal -->
            <div id="ledger-modal" class="absolute inset-0 bg-black/90 z-[60] hidden flex items-center justify-center backdrop-blur-sm">
                <div class="neon-glass-panel-premium p-8 max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto animate-fade-in">
                    <div class="flex justify-between items-center mb-6 border-b border-neon-purple/20 pb-4">
                        <h2 class="text-3xl font-bold text-white font-display tracking-tight" style="text-shadow: 0 0 20px rgba(138,43,226,0.5);">Debt Ledger</h2>
                        <div class="flex gap-3">
                            <button id="reset-ledger" class="btn-neon-danger text-sm py-1 px-3">Reset History</button>
                            <button id="close-ledger" class="text-white/50 hover:text-neon-pink text-3xl transition-colors">&times;</button>
                        </div>
                    </div>
                    <div id="ledger-content" class="text-white"></div>
                </div>
            </div>

            <!-- Menu Modal -->
            <div id="menu-modal" class="absolute inset-0 bg-black/90 z-[100] hidden flex items-center justify-center backdrop-blur-sm pointer-events-auto">
                <div class="neon-glass-panel-premium p-8 max-w-sm w-full mx-4 flex flex-col gap-6 animate-fade-in">
                    <h2 class="text-3xl font-bold text-white text-center mb-2 font-display" style="text-shadow: 0 0 20px rgba(0,191,255,0.5);">Menu</h2>
                    <button id="quantum-exit-btn" class="btn-neon-danger w-full py-3 cursor-pointer">Exit to Setup</button>
                    <button id="close-menu-btn" class="text-white/50 hover:text-neon-blue mt-2 text-sm uppercase tracking-widest transition-colors cursor-pointer">Close</button>
                </div>
            </div>
        `;
    }

    initGame() {
        // Init Canvas
        this.canvas = document.getElementById('quantum-canvas') as HTMLCanvasElement;
        if (!this.canvas) throw new Error('Canvas not found');

        this.animation = new ParticleAnimation({
            canvas: this.canvas,
            centerX: 200,
            centerY: 200,
            orbitRadius: 120,
            particleRadius: 12,
            color1: '#00BFFF', // Player color (neon blue)
            color2: '#8A2BE2'  // House color (neon violet)
        });

        // Init Controls
        const controlsContainer = this.container.querySelector('#controls-container') as HTMLElement;
        this.controls = new Controls(controlsContainer, (action, payload) => this.handleAction(action, payload));

        // Menu Listeners
        this.container.querySelector('#menu-btn')?.addEventListener('click', () => this.showMenu());
        this.container.querySelector('#close-menu-btn')?.addEventListener('click', () => this.hideMenu());
        this.container.querySelector('#quantum-exit-btn')?.addEventListener('click', () => this.onExit());

        // Ledger Listeners
        this.container.querySelector('#ledger-btn')?.addEventListener('click', () => this.showLedger());
        this.container.querySelector('#close-ledger')?.addEventListener('click', () => this.hideLedger());
        this.container.querySelector('#ledger-modal')?.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).id === 'ledger-modal') this.hideLedger();
        });
        this.container.querySelector('#reset-ledger')?.addEventListener('click', () => this.resetLedger());

        this.startBettingPhase();
    }

    handleAction(action: string, payload?: any) {
        if (this.isProcessing) return;

        if (action === 'bet') {
            if (payload === -9999) {
                // Clear current player's bet
                const nonDealerPlayers = this.game.getNonDealerPlayers();
                const currentPlayer = nonDealerPlayers[this.currentPlayerIndex];
                if (currentPlayer && this.playerBets.has(currentPlayer.id)) {
                    const betAmount = this.playerBets.get(currentPlayer.id)!;
                    currentPlayer.chips += betAmount;
                    this.playerBets.delete(currentPlayer.id);
                    this.updatePlayerIslands();
                }
            } else {
                // Click chip to stack bet
                this.placeBet(payload);
            }
        } else if (action === 'confirm-bet') {
            // Confirm bet and advance to next player
            this.confirmBet();
        } else if (action === 'deal') {
            // Start animation when all players are done
            this.startAnimation();
        }
    }

    placeBet(chipValue: number) {
        const nonDealerPlayers = this.game.getNonDealerPlayers();
        const currentPlayer = nonDealerPlayers[this.currentPlayerIndex];
        if (!currentPlayer) return;

        // Accumulate bet
        const currentBet = this.playerBets.get(currentPlayer.id) || 0;
        this.playerBets.set(currentPlayer.id, currentBet + chipValue);

        // Deduct from chips
        currentPlayer.chips -= chipValue;

        this.selectedChip = chipValue;
        this.highlightSelectedChip(chipValue);
        this.updatePlayerIslands();
    }

    confirmBet() {
        // Advance to next player
        this.currentPlayerIndex++;
        this.updatePlayerIslands();
        this.showCurrentPlayerControls();
    }

    startBettingPhase() {
        this.currentPlayerIndex = 0;
        this.playerBets.clear();
        this.game.resetRound();
        this.updatePlayerIslands();
        this.showCurrentPlayerControls();
    }

    showCurrentPlayerControls() {
        const nonDealerPlayers = this.game.getNonDealerPlayers();

        if (this.currentPlayerIndex >= nonDealerPlayers.length) {
            // All players have bet - show START button
            if (this.controls) {
                this.controls.showDealerControls('BETTING');
            }
            return;
        }

        const currentPlayer = nonDealerPlayers[this.currentPlayerIndex];
        if (currentPlayer && this.controls) {
            this.controls.showBettingControls();
            setTimeout(() => this.highlightSelectedChip(this.selectedChip), 50);
        }
    }

    highlightSelectedChip(value: number) {
        const chips = this.container.querySelectorAll('.neon-chip');
        chips.forEach(chip => {
            const val = parseFloat((chip as HTMLElement).dataset.value!);
            if (val === value) {
                chip.classList.add('ring-2', 'ring-white', 'scale-110');
            } else {
                chip.classList.remove('ring-2', 'ring-white', 'scale-110');
            }
        });
    }

    startAnimation() {
        // Transfer accumulated bets to game manager
        this.playerBets.forEach((amount, playerId) => {
            if (amount > 0) {
                this.game.placeBet(playerId, amount);
            }
        });

        // Only run animation if at least one player has bet
        if (this.playerBets.size > 0 && Array.from(this.playerBets.values()).some(v => v > 0)) {
            this.runAnimation();
        }
    }

    runAnimation() {
        this.isProcessing = true;
        if (this.controls) this.controls.hide();

        // Determine outcome before animation
        const outcome = this.game.determineOutcome();
        const winningColor = outcome === 'PLAYER' ? '#00BFFF' : '#8A2BE2';

        if (this.animation) {
            this.animation.start(winningColor, () => {
                this.showResult(outcome);
            });
        }
    }

    showResult(outcome: 'PLAYER' | 'HOUSE') {
        this.game.resolveRound(outcome);
        this.updatePlayerIslands();

        const msg = document.createElement('div');
        msg.className = 'absolute inset-0 flex items-center justify-center z-50 animate-bounce-in pointer-events-none';
        msg.innerHTML = `
            <div class="bg-black/80 backdrop-blur-xl border border-white/20 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                <h2 class="text-4xl font-black text-white mb-2 tracking-widest" style="color: ${outcome === 'PLAYER' ? '#00BFFF' : '#8A2BE2'}">
                    ${outcome === 'PLAYER' ? 'PLAYER WINS' : 'HOUSE WINS'}
                </h2>
            </div>
        `;
        this.container.appendChild(msg);

        this.isProcessing = false;
        if (this.controls) {
            this.controls.showDealerControls('RESOLUTION');
        }

        setTimeout(() => {
            msg.remove();
        }, 3000);
    }

    updatePlayerIslands() {
        const container = this.container.querySelector('#player-islands');
        if (!container) return;

        const nonDealerPlayers = this.game.getNonDealerPlayers();

        container.innerHTML = nonDealerPlayers.map((player, index) => {
            const isCurrent = index === this.currentPlayerIndex && this.game.phase === 'BETTING';
            const betAmount = this.playerBets.get(player.id) || 0;
            const hasBet = betAmount > 0;

            return `
                <div class="neon-glass-panel p-3 min-w-[180px] transition-all ${isCurrent ? 'ring-2 ring-neon-purple shadow-[0_0_30px_rgba(138,43,226,0.3)]' : ''}">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex-1">
                            <div class="font-bold text-white text-sm">${player.name}</div>
                            <div class="text-xs text-white/60">$${player.chips.toFixed(2)}</div>
                        </div>
                        ${isCurrent ? '<span class="text-neon-purple text-xs font-bold">👉</span>' : ''}
                    </div>
                    ${hasBet ? `
                        <div class="bg-white/5 p-2 rounded border border-white/10">
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-white/60">Bet:</span>
                                <span class="font-mono font-bold text-neon-purple">$${betAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    ` : isCurrent ? `
                        <div class="text-center text-xs text-neon-purple font-bold animate-pulse">
                            Click chips...
                        </div>
                    ` : `
                        <div class="text-center text-xs text-white/40">
                            Waiting...
                        </div>
                    `}
                </div>
            `;
        }).join('');
    }

    showMenu() {
        const modal = this.container.querySelector('#menu-modal');
        modal?.classList.remove('hidden');
    }

    hideMenu() {
        this.container.querySelector('#menu-modal')?.classList.add('hidden');
    }

    showLedger() {
        const modal = this.container.querySelector('#ledger-modal');
        const content = this.container.querySelector('#ledger-content');
        if (modal && content) {
            content.innerHTML = this.renderLedgerHistory();
            modal.classList.remove('hidden');
        }
    }

    renderLedgerHistory(): string {
        const debts = this.ledger.getDebts();
        if (debts.length === 0) {
            return '<div class="text-center text-white/50 italic p-8">No active debts</div>';
        }

        return `
            <div class="grid gap-4">
                ${debts.map(debt => {
            const fromName = this.playerNames.get(debt.from) || debt.from;
            const toName = this.playerNames.get(debt.to) || debt.to;

            return `
                    <div class="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center font-bold text-white text-xs">
                                ${fromName.substring(0, 2).toUpperCase()}
                            </div>
                            <div class="text-white/60">
                                <span class="text-white font-bold">${fromName}</span> owes <span class="text-white font-bold">${toName}</span>
                            </div>
                        </div>
                        <div class="text-neon-pink font-mono font-bold text-xl">
                            $${debt.amount.toFixed(2)}
                        </div>
                    </div>
                `}).join('')
            }
        </div>
            `;
    }

    hideLedger() {
        this.container.querySelector('#ledger-modal')?.classList.add('hidden');
    }

    resetLedger() {
        if (confirm('Clear all debt history?')) {
            this.ledger.reset();
            this.showLedger();
        }
    }

    cleanup() {
        if (this.animation) {
            this.animation.stop();
        }
    }
}
