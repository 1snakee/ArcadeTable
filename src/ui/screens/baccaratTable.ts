import { BaccaratGameManager } from '../../logic/baccaratGameManager';
import { Ledger } from '../../logic/ledger';
import type { Card, BetType } from '../../logic/types';
import { Animations } from '../animations';
import { Controls } from '../components/controls';

export class BaccaratTableScreen {
    container: HTMLElement;
    game: BaccaratGameManager;
    ledger: Ledger;
    onExit: () => void;

    // UI Elements
    dealerArea!: HTMLElement;
    tableArea!: HTMLElement;
    controlsArea!: HTMLElement;

    selectedChip: number = 0.10;
    controls: Controls | null = null;
    private isProcessing = false;
    private playerNames: Map<string, string> = new Map();
    private playerBets: Map<string, { betType: BetType; amount: number }> = new Map();
    private currentBettingPlayerIndex: number = 0;

    constructor(root: HTMLElement, game: BaccaratGameManager, ledger: Ledger, onExit: () => void) {
        this.game = game;
        this.ledger = ledger;
        this.onExit = onExit;

        // Populate player names map
        this.game.players.forEach(p => this.playerNames.set(p.id, p.name));

        this.container = document.createElement('div');
        this.container.className = 'w-full h-full relative overflow-hidden';
        root.appendChild(this.container);

        this.renderTableStructure();
        this.initTable();
    }

    renderTableStructure() {
        this.container.innerHTML = `
            <!-- Top Bar -->
            <div class="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-50 pointer-events-none">
                <button id="ledger-btn" class="pointer-events-auto neon-glass-panel px-4 py-2 text-white/80 hover:text-neon-blue text-sm flex items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(0,191,255,0.3)]">
                    <span class="text-lg">📊</span> Ledger
                </button>
                
                <div class="pointer-events-auto flex flex-col items-center">
                     <h2 class="text-xl font-bold text-white tracking-wider font-display" style="text-shadow: 0 0 10px rgba(255,255,255,0.5);">BACCARAT</h2>
                </div>

                <button id="menu-btn" class="pointer-events-auto p-3 text-white/50 hover:text-neon-pink transition-colors rounded-full hover:bg-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            <!-- Main Game Area -->
            <div id="game-layer" class="relative w-full h-full z-10 flex flex-col items-center justify-center p-4 gap-6">
                
                <!-- Hands Area (Side by Side) -->
                <div class="flex gap-16 items-start justify-center min-h-[200px]">
                    <!-- Banker Hand -->
                    <div class="flex flex-col items-center gap-4">
                        <h3 class="text-neon-pink font-bold tracking-widest text-sm uppercase">Banker</h3>
                        <div id="banker-hand" class="flex items-center justify-center -space-x-20 min-h-[144px]"></div>
                        <div id="banker-score" class="text-3xl font-black text-white opacity-0 transition-opacity">0</div>
                    </div>

                    <!-- Player Hand -->
                    <div class="flex flex-col items-center gap-4">
                        <h3 class="text-neon-blue font-bold tracking-widest text-sm uppercase">Player</h3>
                        <div id="player-hand" class="flex items-center justify-center -space-x-20 min-h-[144px]"></div>
                        <div id="player-score" class="text-3xl font-black text-white opacity-0 transition-opacity">0</div>
                    </div>
                </div>

                <!-- Betting Zones -->
                <div class="w-full max-w-3xl grid grid-cols-3 gap-6 items-center justify-items-center">
                    <!-- Player Bet Zone -->
                    <div class="bet-zone group relative w-full aspect-[4/3] max-w-[180px] rounded-2xl border-2 border-neon-blue/30 bg-neon-blue/5 hover:bg-neon-blue/10 transition-all cursor-pointer flex flex-col items-center justify-center gap-2" data-type="PLAYER">
                        <div class="text-neon-blue font-bold text-xl">PLAYER</div>
                        <div class="text-white/40 text-xs">1:1</div>
                        <div class="chip-stack absolute bottom-3"></div>
                        <div class="absolute inset-0 rounded-2xl ring-0 group-hover:ring-4 ring-neon-blue/20 transition-all"></div>
                    </div>

                    <!-- Tie Bet Zone -->
                    <div class="bet-zone group relative w-full aspect-[4/3] max-w-[150px] rounded-2xl border-2 border-neon-green/30 bg-neon-green/5 hover:bg-neon-green/10 transition-all cursor-pointer flex flex-col items-center justify-center gap-2" data-type="TIE">
                        <div class="text-neon-green font-bold text-lg">TIE</div>
                        <div class="text-white/40 text-xs">8:1</div>
                        <div class="chip-stack absolute bottom-3"></div>
                        <div class="absolute inset-0 rounded-2xl ring-0 group-hover:ring-4 ring-neon-green/20 transition-all"></div>
                    </div>

                    <!-- Banker Bet Zone -->
                    <div class="bet-zone group relative w-full aspect-[4/3] max-w-[180px] rounded-2xl border-2 border-neon-pink/30 bg-neon-pink/5 hover:bg-neon-pink/10 transition-all cursor-pointer flex flex-col items-center justify-center gap-2" data-type="BANKER">
                        <div class="text-neon-pink font-bold text-xl">BANKER</div>
                        <div class="text-white/40 text-xs">0.95:1</div>
                        <div class="chip-stack absolute bottom-3"></div>
                        <div class="absolute inset-0 rounded-2xl ring-0 group-hover:ring-4 ring-neon-pink/20 transition-all"></div>
                    </div>
                </div>

                <!-- Player Islands -->
                <div id="player-islands" class="flex gap-3 justify-center flex-wrap max-w-5xl mt-4">
                    <!-- Populated dynamically -->
                </div>

            </div>

            <!-- Controls Layer (Bottom Center) -->
            <div id="controls-container" class="absolute left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto transition-all duration-500 opacity-0 min-w-[300px] justify-center z-50" style="bottom: 1.5rem;"></div>

            <!-- Global Status Text -->
            <div id="global-status" class="absolute top-1/2 left-1/2 pointer-events-none opacity-0 transition-all duration-500 z-50" style="transform: translate(-50%, -50%);">
                <div class="neon-status-text text-6xl font-black text-white text-center px-12 py-6 rounded-2xl whitespace-nowrap pointer-events-auto cursor-pointer" style="font-family: var(--font-family-display);"></div>
            </div>

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
        `;
    }

    initTable() {
        // Init Controls
        const controlsContainer = this.container.querySelector('#controls-container') as HTMLElement;
        this.controls = new Controls(controlsContainer, (action, payload) => this.handleAction(action, payload));

        // Menu Listener
        this.container.querySelector('#menu-btn')?.addEventListener('click', () => this.showMenu());
        this.createMenuModal();

        // Ledger Listeners
        this.container.querySelector('#ledger-btn')?.addEventListener('click', () => this.showLedger());
        this.container.querySelector('#close-ledger')?.addEventListener('click', () => this.hideLedger());
        this.container.querySelector('#ledger-modal')?.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).id === 'ledger-modal') this.hideLedger();
        });
        this.container.querySelector('#reset-ledger')?.addEventListener('click', () => this.resetLedger());

        // Betting Zone Listeners
        this.container.querySelectorAll('.bet-zone').forEach(zone => {
            zone.addEventListener('click', (e) => {
                const type = (e.currentTarget as HTMLElement).dataset.type as BetType;
                this.placeBet(type);
            });
        });

        this.startBettingPhase();
    }

    createMenuModal() {
        if (this.container.querySelector('#menu-modal')) return;

        const menuModal = document.createElement('div');
        menuModal.id = 'menu-modal';
        menuModal.className = 'absolute inset-0 bg-black/90 z-[100] hidden flex items-center justify-center backdrop-blur-sm pointer-events-auto';
        menuModal.innerHTML = `
            <div class="neon-glass-panel-premium p-8 max-w-sm w-full mx-4 flex flex-col gap-6 animate-fade-in">
                <h2 class="text-3xl font-bold text-white text-center mb-2 font-display" style="text-shadow: 0 0 20px rgba(0,191,255,0.5);">Menu</h2>
                <button id="baccarat-exit-btn" class="btn-neon-danger w-full py-3 cursor-pointer">Exit to Setup</button>
                <button id="close-menu-btn" class="text-white/50 hover:text-neon-blue mt-2 text-sm uppercase tracking-widest transition-colors cursor-pointer">Close</button>
            </div>
        `;
        this.container.appendChild(menuModal);

        // Event Delegation
        menuModal.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            if (target.id === 'close-menu-btn') {
                this.handleCloseMenu();
            } else if (target.id === 'baccarat-exit-btn') {
                this.handleExitBtn();
            }
        });
    }

    showMenu() {
        const menuModal = this.container.querySelector('#menu-modal');
        if (!menuModal) {
            this.createMenuModal();
            return this.showMenu(); // Retry after creation
        }

        menuModal.classList.remove('hidden');
    }

    handleCloseMenu = () => {
        this.container.querySelector('#menu-modal')?.classList.add('hidden');
    }

    handleExitBtn = () => {
        this.onExit();
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
            < div class="grid gap-4" >
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
            this.showLedger(); // Refresh
        }
    }

    handleAction(action: string, payload?: any) {
        if (this.isProcessing) return;

        if (action === 'bet') {
            if (payload === -9999) {
                // Clear current player's bet
                const nonDealerPlayers = this.game.players.filter(p => p.id !== this.game.dealerId);
                const currentPlayer = nonDealerPlayers[this.currentBettingPlayerIndex];
                if (currentPlayer && this.playerBets.has(currentPlayer.id)) {
                    const bet = this.playerBets.get(currentPlayer.id)!;
                    currentPlayer.chips += bet.amount;
                    this.playerBets.delete(currentPlayer.id);
                    this.updatePlayerIslands();
                    this.updateBettingChips();
                }
            } else {
                this.selectedChip = payload;
                this.highlightSelectedChip(payload);
            }
        } else if (action === 'deal') {
            // Deal - all players have bet
            if (this.game.phase === 'BETTING' && this.allPlayersBet()) {
                this.game.startGame();
                this.animateDeal();
            }
        } else if (action === 'next-round') {
            this.isProcessing = false;
            this.game.resetRound();
            this.startBettingPhase();
        }
    }

    allPlayersBet(): boolean {
        const nonDealerPlayers = this.game.players.filter(p => p.id !== this.game.dealerId);
        return this.playerBets.size >= nonDealerPlayers.length;
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

    startBettingPhase() {
        this.currentBettingPlayerIndex = 0;
        this.playerBets.clear();
        this.game.phase = 'BETTING';
        this.isProcessing = false;

        this.isProcessing = false;

        this.updatePlayerIslands();
        this.updateBettingChips();
        this.showCurrentPlayerControls();
    }

    showCurrentPlayerControls() {
        const nonDealerPlayers = this.game.players.filter(p => p.id !== this.game.dealerId);

        if (this.currentBettingPlayerIndex >= nonDealerPlayers.length) {
            // All players bet - show DEAL button
            if (this.controls) {
                this.controls.showDealerControls('BETTING');
            }
            return;
        }

        const currentPlayer = nonDealerPlayers[this.currentBettingPlayerIndex];
        if (currentPlayer && this.controls) {
            this.controls.showBettingControls(currentPlayer.chips);
            setTimeout(() => this.highlightSelectedChip(this.selectedChip), 50);
        }
    }

    placeBet(type: BetType) {
        if (this.game.phase !== 'BETTING') return;
        if (this.selectedChip <= 0) return;

        const nonDealerPlayers = this.game.players.filter(p => p.id !== this.game.dealerId);
        if (this.currentBettingPlayerIndex >= nonDealerPlayers.length) return;

        const currentPlayer = nonDealerPlayers[this.currentBettingPlayerIndex];
        if (!currentPlayer) return;

        // Allow negative balance - no chip validation

        // Store bet
        this.playerBets.set(currentPlayer.id, {
            betType: type,
            amount: this.selectedChip
        });

        // Deduct chips
        currentPlayer.chips -= this.selectedChip;

        // Move to next player
        this.currentBettingPlayerIndex++;
        this.updatePlayerIslands();
        this.updateBettingChips();
        this.showCurrentPlayerControls();
    }

    updateBettingChips() {
        // Calculate totals per zone
        const totals = {
            PLAYER: 0,
            BANKER: 0,
            TIE: 0
        };

        this.playerBets.forEach(bet => {
            if (totals[bet.betType] !== undefined) {
                totals[bet.betType] += bet.amount;
            }
        });

        // Update UI
        Object.entries(totals).forEach(([type, amount]) => {
            const zone = this.container.querySelector(`.bet - zone[data - type="${type}"]`);
            const stack = zone?.querySelector('.chip-stack');

            if (stack) {
                if (amount > 0) {
                    stack.innerHTML = `
            < div class="neon-chip inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-white shadow-[0_0_20px_rgba(0,191,255,0.3)] transition-all backdrop-blur-sm border border-white/20 bg-gradient-to-br from-neon-blue/80 to-blue-600/80 text-xs" >
                $${amount.toFixed(2)}
        </div>
            `;
                } else {
                    stack.innerHTML = '';
                }
            }
        });
    }

    updatePlayerIslands() {
        const container = this.container.querySelector('#player-islands');
        if (!container) return;

        const nonDealerPlayers = this.game.players.filter(p => p.id !== this.game.dealerId);

        container.innerHTML = nonDealerPlayers.map((player, index) => {
            const isCurrent = index === this.currentBettingPlayerIndex && !this.allPlayersBet();
            const bet = this.playerBets.get(player.id);
            const hasBet = bet !== undefined;

            return `
            < div class="neon-glass-panel p-3 min-w-[180px] transition-all ${isCurrent ? 'ring-2 ring-neon-blue shadow-[0_0_30px_rgba(0,191,255,0.3)]' : ''}" >
                <div class="flex items-center justify-between mb-2" >
                    <div class="flex-1" >
                        <div class="font-bold text-white text-sm" > ${player.name} </div>
                            < div class="text-xs text-white/60" > $${player.chips.toFixed(2)} </div>
                                </div>
                        ${isCurrent ? '<span class="text-neon-blue text-xs font-bold">👉</span>' : ''}
        </div>
                    ${hasBet ? `
                        <div class="bg-white/5 p-2 rounded border border-white/10">
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-white/60">Bet:</span>
                                <span class="font-bold ${bet.betType === 'PLAYER' ? 'text-neon-blue' :
                        bet.betType === 'BANKER' ? 'text-neon-pink' :
                            'text-neon-green'
                    }">${bet.betType}</span>
                            </div>
                            <div class="flex items-center justify-between text-xs mt-1">
                                <span class="text-white/60">Amount:</span>
                                <span class="font-mono font-bold text-white">$${bet.amount.toFixed(2)}</span>
                            </div>
                        </div>
                    ` : isCurrent ? `
                        <div class="text-center text-xs text-neon-blue font-bold animate-pulse">
                            Choose bet...
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

    async animateDeal() {
        this.isProcessing = true;

        if (this.controls) {
            this.controls.hide();
        }

        document.getElementById('player-score')!.style.opacity = '0';
        document.getElementById('banker-score')!.style.opacity = '0';

        const playerHandEl = document.getElementById('player-hand')!;
        const bankerHandEl = document.getElementById('banker-hand')!;

        playerHandEl.innerHTML = '';
        bankerHandEl.innerHTML = '';

        // Animate initial 4 cards
        const initialCards = [
            { card: this.game.playerHand[0], target: playerHandEl },
            { card: this.game.bankerHand[0], target: bankerHandEl },
            { card: this.game.playerHand[1], target: playerHandEl },
            { card: this.game.bankerHand[1], target: bankerHandEl }
        ];

        for (const { card, target } of initialCards) {
            await this.dealCardTo(card, target);
        }

        this.updateScores(2);

        // Handle Third Cards if any
        if (this.game.playerHand.length > 2) {
            await new Promise(r => setTimeout(r, 1000));
            await this.dealCardTo(this.game.playerHand[2], playerHandEl);
            this.updateScores(3, false);
        }

        if (this.game.bankerHand.length > 2) {
            await new Promise(r => setTimeout(r, 1000));
            await this.dealCardTo(this.game.bankerHand[2], bankerHandEl);
            this.updateScores(3, true);
        }

        setTimeout(() => {
            this.showResult();
        }, 500);
    }

    async dealCardTo(card: Card, target: HTMLElement) {
        const cardEl = document.createElement('div');
        cardEl.className = 'relative w-20 h-28 bg-white rounded-lg shadow-xl flex items-center justify-center select-none transform transition-transform hover:-translate-y-2';

        const suitColor = (card.suit === 'hearts' || card.suit === 'diamonds') ? 'text-red-500' : 'text-black';
        const suitSymbol = this.getSuitSymbol(card.suit);

        cardEl.innerHTML = `
            < div class="absolute top-1 left-1 text-sm font-bold ${suitColor}" > ${card.rank} </div>
                < div class="absolute top-1 left-5 text-sm ${suitColor}" > ${suitSymbol} </div>
                    < div class="text-3xl ${suitColor}" > ${suitSymbol} </div>
                        < div class="absolute bottom-1 right-1 text-sm font-bold ${suitColor} transform rotate-180" > ${card.rank} </div>
                            < div class="absolute bottom-1 right-5 text-sm ${suitColor} transform rotate-180" > ${suitSymbol} </div>
                                `;

        target.appendChild(cardEl);
        await Animations.dealCard(cardEl, 0, 0, target);
    }

    getSuitSymbol(suit: string) {
        switch (suit) {
            case 'hearts': return '♥';
            case 'diamonds': return '♦';
            case 'clubs': return '♣';
            case 'spades': return '♠';
            default: return '';
        }
    }

    updateScores(cardCount: number, bankerThird?: boolean) {
        const pScore = this.game.calculateScore(this.game.playerHand.slice(0, this.game.playerHand.length > 2 && !bankerThird && cardCount === 2 ? 2 : this.game.playerHand.length));
        const bScore = this.game.calculateScore(this.game.bankerHand.slice(0, this.game.bankerHand.length > 2 && cardCount === 2 ? 2 : this.game.bankerHand.length));

        const pScoreEl = document.getElementById('player-score');
        const bScoreEl = document.getElementById('banker-score');

        if (pScoreEl) {
            pScoreEl.textContent = pScore.toString();
            pScoreEl.style.opacity = '1';
        }
        if (bScoreEl) {
            bScoreEl.textContent = bScore.toString();
            bScoreEl.style.opacity = '1';
        }
    }

    showResult() {
        const result = this.game.lastResult;
        if (!result) return;

        // Calculate for each player
        this.playerBets.forEach((bet, playerId) => {
            let winAmount = 0;

            if (bet.betType === 'PLAYER' && result.winner === 'PLAYER') {
                winAmount = bet.amount * 2;
            } else if (bet.betType === 'BANKER' && result.winner === 'BANKER') {
                winAmount = bet.amount * 1.95;
            } else if (bet.betType === 'TIE' && result.winner === 'TIE') {
                winAmount = bet.amount * 9;
            } else if (result.winner === 'TIE') {
                winAmount = bet.amount; // Push
            }

            const player = this.game.players.find(p => p.id === playerId);
            if (player) {
                player.chips += winAmount;

                const netChange = winAmount - bet.amount;
                if (netChange > 0 && this.game.dealerId) {
                    this.ledger.recordTransfer(this.game.dealerId, playerId, netChange);
                } else if (netChange < 0 && this.game.dealerId) {
                    this.ledger.recordTransfer(playerId, this.game.dealerId, Math.abs(netChange));
                }
            }
        });

        this.updatePlayerIslands();

        const msg = document.createElement('div');
        msg.className = 'absolute inset-0 flex items-center justify-center z-50 animate-bounce-in pointer-events-none';
        msg.innerHTML = `
                                < div class="bg-black/80 backdrop-blur-xl border border-white/20 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(0,0,0,0.8)]" >
                                    <h2 class="text-4xl font-black text-white mb-2 tracking-widest" > ${result.winner} WINS </h2>
                                        < div class="text-xl text-white/60" >
                                            Player ${result.playerScore} - ${result.bankerScore} Banker
                                                </div>
                                                </div>
                                                    `;
        this.container.appendChild(msg);

        if (this.controls) {
            this.controls.showDealerControls('RESOLUTION');
        }

        setTimeout(() => {
            msg.remove();
        }, 3000);
    }

    startLoop() {
        const loop = () => {
            requestAnimationFrame(loop);
        };
        loop();
    }

    cleanup() {
        // Cleanup listeners if needed
    }
}
