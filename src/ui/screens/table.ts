import { GameManager } from '../../logic/gameState';
import { Ledger } from '../../logic/ledger';
import { PlayerSlot } from '../components/playerSlot';
import { DealerArea } from '../components/dealerArea';
import { Controls } from '../components/controls';

export class TableScreen {
    container: HTMLElement;
    game: GameManager;
    ledger: Ledger;
    onExit: () => void;
    playerSlots: PlayerSlot[] = [];
    dealerArea: DealerArea | null = null;
    controls: Controls | null = null;
    private isProcessing = false;
    private statusTimeout: any = null;
    private canvas: HTMLCanvasElement | null = null;
    private animationId: number | null = null;

    constructor(root: HTMLElement, game: GameManager, ledger: Ledger, onExit: () => void) {
        this.game = game;
        this.ledger = ledger;
        this.onExit = onExit;
        this.container = document.createElement('div');
        this.container.className = 'w-full h-full relative overflow-hidden';
        root.appendChild(this.container);

        this.renderTableStructure();
        this.initBackgroundAnimation();
        this.initTable();
    }

    renderTableStructure() {
        this.container.innerHTML = `
      <!-- Animated Background Canvas -->
      <canvas id="table-bg" class="absolute inset-0 w-full h-full"></canvas>
      
      <!-- Subtle Vignette Overlay -->
      <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);"></div>

      <div id="game-layer" class="relative w-full h-full z-10">
        <!-- Top Bar -->
        <div class="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-50 pointer-events-none">
            <button id="ledger-btn" class="pointer-events-auto neon-glass-panel px-4 py-2 text-white/80 hover:text-neon-blue text-sm flex items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(0,191,255,0.3)]">
                <span class="text-lg">📊</span> Ledger
            </button>
            
            <button id="menu-btn" class="pointer-events-auto p-3 text-white/50 hover:text-neon-pink transition-colors rounded-full hover:bg-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
        </div>

        <!-- Dealer Area -->
        <div id="dealer-container"></div>
        
        <!-- Players Area -->
        <div id="players-container" class="w-full h-full"></div>
        
        <!-- Controls Layer (Bottom Center) -->
        <div id="controls-container" class="absolute left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto transition-all duration-500 opacity-0 min-w-[300px] justify-center z-50" style="bottom: 3rem;">
          <!-- Controls injected here -->
        </div>

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
      </div>
    `;
    }

    initBackgroundAnimation() {
        this.canvas = this.container.querySelector('#table-bg');
        if (!this.canvas) return;

        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;

        let width = this.canvas.width = window.innerWidth;
        let height = this.canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            if (this.canvas) {
                width = this.canvas.width = window.innerWidth;
                height = this.canvas.height = window.innerHeight;
            }
        });

        // Neon colors (no green)
        const neonColors = [
            { r: 0, g: 191, b: 255 },    // Neon Blue #00bfff
            { r: 138, g: 43, b: 226 },   // Neon Purple #8a2be2
            { r: 255, g: 20, b: 147 },   // Neon Pink #ff1493
        ];

        // Flowing gradient blobs - more subtle for game screen
        const blobs = [
            { x: 0.2, y: 0.2, vx: 0.0002, vy: 0.00015, color: 0, size: 0.5 },
            { x: 0.8, y: 0.5, vx: -0.00015, vy: 0.0002, color: 1, size: 0.45 },
            { x: 0.5, y: 0.85, vx: 0.00015, vy: -0.00015, color: 2, size: 0.4 },
        ];

        // Subtle particles
        const particles: any[] = [];
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            const colorIdx = Math.floor(Math.random() * 3);
            const c = neonColors[colorIdx];
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                size: Math.random() * 1.5 + 0.5,
                color: `rgba(${c.r}, ${c.g}, ${c.b}, `
            });
        }

        let time = 0;

        const animate = () => {
            time += 0.003;

            // Dark background
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, width, height);

            // Draw flowing gradient blobs - more subtle
            blobs.forEach(blob => {
                blob.x += blob.vx;
                blob.y += blob.vy;

                if (blob.x < 0.1 || blob.x > 0.9) blob.vx *= -1;
                if (blob.y < 0.1 || blob.y > 0.9) blob.vy *= -1;

                const offsetX = Math.sin(time + blob.color * 2) * 0.03;
                const offsetY = Math.cos(time + blob.color * 2) * 0.03;

                const cx = (blob.x + offsetX) * width;
                const cy = (blob.y + offsetY) * height;
                const radius = blob.size * Math.min(width, height);

                const c = neonColors[blob.color];
                const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
                gradient.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, 0.08)`);
                gradient.addColorStop(0.5, `rgba(${c.r}, ${c.g}, ${c.b}, 0.03)`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            });

            // Draw particles
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color + (0.15 + Math.sin(time * 2 + p.x * 0.01) * 0.05) + ')';
                ctx.fill();
            });

            this.animationId = requestAnimationFrame(animate);
        };

        animate();
    }

    initTable() {
        // Init Dealer
        const dealerContainer = this.container.querySelector('#dealer-container') as HTMLElement;
        this.dealerArea = new DealerArea(dealerContainer);

        // Init Players
        const playersContainer = this.container.querySelector('#players-container') as HTMLElement;
        const players = this.game.state.players.filter(p => !p.isDealer);

        this.playerSlots = []; // Reset slots
        players.forEach((player, index) => {
            const slot = new PlayerSlot(playersContainer, player, index, players.length);
            this.playerSlots.push(slot);
        });

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

        // Start Game Loop / Initial State
        this.updateUI();
        this.startBettingPhase();
    }

    createMenuModal() {
        if (this.container.querySelector('#menu-modal')) return;

        const menuModal = document.createElement('div');
        menuModal.id = 'menu-modal';
        menuModal.className = 'absolute inset-0 bg-black/90 z-[60] hidden flex items-center justify-center backdrop-blur-sm';
        menuModal.innerHTML = `
            <div class="neon-glass-panel-premium p-8 max-w-sm w-full mx-4 flex flex-col gap-6 animate-fade-in">
                <h2 class="text-3xl font-bold text-white text-center mb-2 font-display" style="text-shadow: 0 0 20px rgba(0,191,255,0.5);">Menu</h2>
                <button id="change-dealer-btn" class="btn-neon-secondary w-full py-3">Change Dealer</button>
                <button id="exit-btn" class="btn-neon-danger w-full py-3">Exit to Setup</button>
                <button id="close-menu-btn" class="text-white/50 hover:text-neon-blue mt-2 text-sm uppercase tracking-widest transition-colors">Close</button>
            </div>
        `;
        this.container.querySelector('#game-layer')?.appendChild(menuModal);

        menuModal.querySelector('#close-menu-btn')?.addEventListener('click', () => {
            menuModal.classList.add('hidden');
        });

        menuModal.querySelector('#exit-btn')?.addEventListener('click', () => {
            if (confirm("Exit to Setup? Debts will be preserved in browser storage.")) {
                this.onExit();
            }
        });

        menuModal.querySelector('#change-dealer-btn')?.addEventListener('click', () => {
            menuModal.classList.add('hidden');
            this.showChangeDealerModal();
        });
    }

    showMenu() {
        const modal = this.container.querySelector('#menu-modal');
        modal?.classList.remove('hidden');
    }

    showChangeDealerModal() {
        let modal = this.container.querySelector('#dealer-modal') as HTMLElement;
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'dealer-modal';
            modal.className = 'absolute inset-0 bg-black/90 z-[60] flex items-center justify-center backdrop-blur-sm';
            this.container.querySelector('#game-layer')?.appendChild(modal);
        }

        const currentDealerId = this.game.state.dealerId;
        const potentialDealers = this.game.state.players.filter(p => p.id !== currentDealerId);

        modal.innerHTML = `
            <div class="neon-glass-panel-premium p-8 max-w-sm w-full mx-4 animate-fade-in">
                <h2 class="text-2xl font-bold text-white mb-6 font-display text-center" style="text-shadow: 0 0 20px rgba(138,43,226,0.5);">Select New Dealer</h2>
                <div class="flex flex-col gap-3 mb-6">
                    ${potentialDealers.map(p => `
                        <button class="dealer-select-btn p-4 bg-white/5 hover:bg-neon-purple/10 rounded-xl text-left text-white transition-all border border-white/10 hover:border-neon-purple flex justify-between items-center group" data-id="${p.id}">
                            <span class="font-bold">${p.name}</span>
                            <span class="opacity-0 group-hover:opacity-100 text-neon-purple transition-opacity">Select →</span>
                        </button>
                    `).join('')}
                </div>
                <button id="cancel-dealer-btn" class="text-white/50 hover:text-neon-pink w-full text-center text-sm uppercase tracking-widest transition-colors">Cancel</button>
            </div>
        `;

        modal.classList.remove('hidden');

        modal.querySelector('#cancel-dealer-btn')?.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        modal.querySelectorAll('.dealer-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newDealerId = (e.currentTarget as HTMLElement).dataset.id!;
                this.changeDealer(newDealerId);
                modal.classList.add('hidden');
            });
        });
    }

    changeDealer(newDealerId: string) {
        this.game.setDealer(newDealerId);
        this.game.resetRound();

        // Stop background animation before re-render
        if (this.animationId) cancelAnimationFrame(this.animationId);

        // Re-initialize table to reflect new positions
        this.renderTableStructure();
        this.initBackgroundAnimation();
        this.initTable();

        this.showStatus(`Dealer Changed to ${this.game.state.players.find(p => p.id === newDealerId)?.name}`);
    }

    handleAction(action: string, payload?: any) {
        if (this.isProcessing) return;

        // Actions that trigger animations or async flows should set processing
        if (['hit', 'stand', 'double', 'split', 'deal', 'next-round', 'dealer-play'].includes(action)) {
            this.isProcessing = true;
        }

        if (action === 'bet') {
            const currentPlayer = this.getCurrentBettingPlayer();
            if (currentPlayer) {
                this.game.placeBet(currentPlayer.id, payload);
                this.updateUI();
            }
        } else if (action === 'confirm-bet') {
            this.nextBettingStep();
        } else if (action === 'deal') {
            this.startDealingPhase();
        } else if (action === 'hit') {
            this.playerHit();
        } else if (action === 'stand') {
            this.playerStand();
        } else if (action === 'double') {
            this.playerDouble();
        } else if (action === 'split') {
            this.playerSplit();
        } else if (action === 'insurance') {
            this.handleInsurance(payload);
        } else if (action === 'dealer-play') {
            this.playDealerTurn();
        } else if (action === 'next-round') {
            this.clearTable();
            this.game.resetRound();
            this.startBettingPhase();
        }

        // Reset processing for synchronous actions or if async ones handle it themselves
        if (['bet', 'confirm-bet', 'insurance'].includes(action)) {
            this.isProcessing = false;
        }
    }

    getCurrentBettingPlayer() {
        return this.game.state.players[this.game.state.currentPlayerIndex];
    }

    startBettingPhase() {
        this.game.state.phase = 'BETTING';
        this.game.state.currentPlayerIndex = this.game.state.players.findIndex(p => !p.isDealer);
        this.updateUI();
        this.showBettingControls();
        this.isProcessing = false;
    }

    showBettingControls() {
        const player = this.getCurrentBettingPlayer();
        if (!player) {
            this.controls?.showDealerControls('BETTING');
            return;
        }
        this.controls?.showBettingControls(player.chips);
    }

    nextBettingStep() {
        let nextIndex = this.game.state.currentPlayerIndex + 1;
        while (nextIndex < this.game.state.players.length && this.game.state.players[nextIndex].isDealer) {
            nextIndex++;
        }

        if (nextIndex >= this.game.state.players.length) {
            this.game.state.currentPlayerIndex = -1;
            this.controls?.showDealerControls('BETTING');
        } else {
            this.game.state.currentPlayerIndex = nextIndex;
            this.showBettingControls();
        }
        this.updateUI();
    }

    async startDealingPhase() {
        // Validate all players have placed bets
        const nonDealers = this.game.state.players.filter(p => !p.isDealer);
        const allBetsPlaced = nonDealers.every(p => p.currentBet > 0);

        if (!allBetsPlaced) {
            this.showStatus('All players must place a bet!');
            // Find first player without bet
            const firstNonBet = nonDealers.find(p => p.currentBet <= 0);
            if (firstNonBet) {
                this.game.state.currentPlayerIndex = this.game.state.players.indexOf(firstNonBet);
                this.updateUI();
                this.showBettingControls();
            }
            return;
        }

        this.game.dealInitialCards();
        this.updateUI();

        // Clear table visually
        this.playerSlots.forEach(s => s.clearCards());
        this.dealerArea?.clearCards();

        // Animate dealing
        for (let i = 0; i < 2; i++) {
            for (const p of this.game.state.players) {
                if (p.isDealer) {
                    const card = p.hand[i];
                    const hidden = i === 1;
                    this.dealerArea?.addCard(card, hidden);
                    await new Promise(r => setTimeout(r, 200));
                } else {
                    const slot = this.playerSlots.find(s => s.playerId === p.id);
                    if (slot) {
                        const card = p.hand[i];
                        // Async add card, wait for animation
                        await slot.addCard(card);

                        // Update value ONLY for this player after animation
                        // Calculate partial hand value (first i+1 cards)
                        const partialHand = p.hand.slice(0, i + 1);
                        const handInfo = this.game.calculateSoftHandValue(partialHand);
                        slot.updateHandValue(handInfo.value, handInfo.isSoft, handInfo.softValue, p.status);
                    }
                }
            }
        }

        // Check for Insurance
        const dealer = this.game.state.players.find(p => p.isDealer);
        if (dealer && dealer.hand[0].rank === 'A') {
            this.isProcessing = false; // Allow insurance buttons to work
            this.startInsurancePhase();
        } else {
            this.game.startPlayerTurns();
            this.startTurnPhase();
        }
    }

    startInsurancePhase() {
        this.game.state.phase = 'INSURANCE';
        this.game.state.currentPlayerIndex = this.game.state.players.findIndex(p => !p.isDealer);
        this.updateUI();
        this.showInsuranceControls();
    }

    showInsuranceControls() {
        const player = this.getCurrentBettingPlayer();
        if (!player) {
            // All players decided
            this.resolveInsurancePhase();
            return;
        }

        // Show Yes/No
        const cost = player.currentBet / 2;
        this.container.querySelector('#controls-container')?.setAttribute('data-cost', cost.toFixed(2));
        this.controls?.showInsuranceControls(player.name);
    }

    handleInsurance(accepted: boolean) {
        const player = this.getCurrentBettingPlayer();
        if (player && accepted) {
            this.game.placeInsuranceBet(player.id);
        }

        // Next player
        let nextIndex = this.game.state.currentPlayerIndex + 1;
        while (nextIndex < this.game.state.players.length && this.game.state.players[nextIndex].isDealer) {
            nextIndex++;
        }

        if (nextIndex >= this.game.state.players.length) {
            this.resolveInsurancePhase();
        } else {
            this.game.state.currentPlayerIndex = nextIndex;
            this.showInsuranceControls();
        }
    }

    resolveInsurancePhase() {
        const dealer = this.game.state.players.find(p => p.isDealer)!;
        const dealerHasBlackjack = this.game.calculateHandValue(dealer.hand) === 21;

        // Record insurance outcomes in ledger
        this.game.state.players.forEach(p => {
            if (p.isDealer || p.insuranceBet === 0) return;

            if (dealerHasBlackjack) {
                // Win insurance: Dealer pays Player (2:1 payout on insurance bet)
                this.ledger.recordTransfer(dealer.id, p.id, p.insuranceBet * 2);
            } else {
                // Lose insurance: Player pays Dealer
                this.ledger.recordTransfer(p.id, dealer.id, p.insuranceBet);
            }
        });

        this.game.resolveInsurance(dealerHasBlackjack);

        if (dealerHasBlackjack) {
            // Reveal dealer card
            this.dealerArea?.revealHiddenCard(dealer.hand[1]);
            this.dealerArea?.updateHandValue(21, true);
            this.showStatus("Dealer has Blackjack!");

            dealer.status = 'blackjack';
            this.endRound();
        } else {
            this.showStatus("Dealer does not have Blackjack");
            setTimeout(() => {
                this.game.startPlayerTurns();
                this.startTurnPhase();
            }, 1500);
        }
    }

    renderCards() {
        this.playerSlots.forEach(s => s.clearCards());
        this.dealerArea?.clearCards();

        this.game.state.players.forEach(p => {
            if (p.isDealer) {
                p.hand.forEach((card, i) => {
                    const hidden = i === 1 && this.game.state.phase !== 'DEALER_TURN' && this.game.state.phase !== 'RESOLUTION';
                    this.dealerArea?.addCard(card, hidden);
                });
            } else {
                const slot = this.playerSlots.find(s => s.playerId === p.id);
                if (slot) {
                    p.hand.forEach(card => slot.addCard(card));
                }
            }
        });
    }

    startTurnPhase() {
        const currentPlayer = this.game.state.players[this.game.state.currentPlayerIndex];
        const nonDealers = this.game.state.players.filter(p => !p.isDealer);
        const allDone = nonDealers.every(p => p.status === 'bust' || p.status === 'stand' || p.status === 'blackjack');

        if (allDone || !currentPlayer || currentPlayer.isDealer) {
            this.startDealerTurn();
        } else {
            if (currentPlayer.status === 'blackjack') {
                setTimeout(() => {
                    this.game.nextTurn();
                    this.startTurnPhase();
                }, 1000);
                return;
            }

            this.game.state.phase = 'PLAYER_TURN';
            this.updateUI();

            // Determine which hand to check for double/split
            const handToCheck = currentPlayer.splitHands && currentPlayer.currentSplitIndex !== undefined
                ? currentPlayer.splitHands[currentPlayer.currentSplitIndex]
                : currentPlayer.hand;

            const canDouble = handToCheck.length === 2 && !currentPlayer.isSplitAces;
            const canSplit = this.game.canSplit(currentPlayer);

            this.controls?.showPlayerControls(canDouble, canSplit);
            this.isProcessing = false; // Allow input
        }
    }

    async playerHit(keepProcessing: boolean = false) {
        const player = this.game.state.players[this.game.state.currentPlayerIndex];
        const card = this.game.dealCardTo(player.id);

        if (card) {
            const slot = this.playerSlots.find(s => s.playerId === player.id);
            if (slot) {
                // Pass current split index if applicable
                await slot.addCard(card, player.currentSplitIndex);

                // Calculate value for the specific hand being played
                const handToCheck = player.splitHands && player.currentSplitIndex !== undefined
                    ? player.splitHands[player.currentSplitIndex]
                    : player.hand;

                const handInfo = this.game.calculateSoftHandValue(handToCheck);

                if (!player.splitHands) {
                    slot.updateHandValue(handInfo.value, handInfo.isSoft, handInfo.softValue, player.status);
                } else {
                    // Update specific split hand value
                    slot.updateHandValue(handInfo.value, handInfo.isSoft, handInfo.softValue, player.status, player.currentSplitIndex);
                }
            }

            // Check for bust on the CURRENT hand
            const handToCheck = player.splitHands && player.currentSplitIndex !== undefined
                ? player.splitHands[player.currentSplitIndex]
                : player.hand;

            const val = this.game.calculateHandValue(handToCheck);

            if (val > 21) {
                // BUST
                if (player.splitHands) {
                    this.controls?.hide(); // Hide controls immediately
                    // Move to next split hand if available
                    setTimeout(() => {
                        this.playerStand(); // This will trigger nextTurn which handles split progression
                    }, 1000);
                } else {
                    player.status = 'bust';
                    this.updateUI();
                    const slot = this.playerSlots.find(s => s.playerId === player.id);
                    slot?.updateHandValue(val, false, undefined, 'bust');

                    this.controls?.hide();
                    setTimeout(() => {
                        this.game.nextTurn();
                        this.startTurnPhase();
                    }, 1000);
                }
            } else if (val === 21) {
                this.updateUI();
                setTimeout(() => {
                    this.playerStand();
                }, 500);
            } else {
                this.updateUI();
                if (!keepProcessing) {
                    this.isProcessing = false; // Allow next hit
                }
            }
        }
    }

    playerStand() {
        const player = this.game.state.players[this.game.state.currentPlayerIndex];

        // If playing a split hand, check if it's the last one
        if (player.splitHands && player.currentSplitIndex !== undefined) {
            // Check if this is the last split hand
            if (player.currentSplitIndex === player.splitHands.length - 1) {
                // Last split hand, set status to stand
                player.status = 'stand';
            }
            // Move to next turn (which handles next hand)
            this.game.nextTurn();
            this.startTurnPhase();
        } else {
            player.status = 'stand';
            this.game.nextTurn();
            this.startTurnPhase();
        }
    }

    playerDouble() {
        const player = this.game.state.players[this.game.state.currentPlayerIndex];

        // Determine which hand we are playing
        const isSplit = player.splitHands && player.currentSplitIndex !== undefined;
        const handToCheck = isSplit
            ? player.splitHands![player.currentSplitIndex!]
            : player.hand;

        if (handToCheck.length !== 2) return;

        // Update the correct bet
        if (isSplit) {
            player.splitBets![player.currentSplitIndex!] *= 2;
        } else {
            player.currentBet *= 2;
        }

        this.playerHit(true);
        if (player.status !== 'bust') {
            player.status = 'stand';
            setTimeout(() => {
                this.game.nextTurn();
                this.startTurnPhase();
            }, 1000);
        }
    }

    async playerSplit() {
        const player = this.game.state.players[this.game.state.currentPlayerIndex];

        if (!this.game.canSplit(player)) {
            this.showStatus('Cannot split this hand');
            this.isProcessing = false;
            return;
        }

        // Perform the split
        const success = this.game.splitHand(player.id);

        if (success) {
            // Animate the split
            const slot = this.playerSlots.find(s => s.playerId === player.id);
            if (slot) {
                await slot.renderSplitHands(player, true);

                // Update hand values after animation
                player.splitHands?.forEach((hand, idx) => {
                    const handInfo = this.game.calculateSoftHandValue(hand);
                    slot.updateHandValue(handInfo.value, handInfo.isSoft, handInfo.softValue, player.status, idx);
                });
            }

            this.updateUI();

            // If split aces, auto-stand both hands
            if (player.isSplitAces) {
                this.showStatus('Split Aces! One card each.');
                player.status = 'stand';
                setTimeout(() => {
                    this.game.nextTurn();
                    this.startTurnPhase();
                }, 1500);
            } else {
                this.startTurnPhase();
            }
        } else {
            this.isProcessing = false;
        }
    }

    startDealerTurn() {
        this.game.state.phase = 'DEALER_TURN';
        this.updateUI();
        setTimeout(() => {
            this.playDealerTurn();
        }, 2000);
    }

    playDealerTurn() {
        const dealer = this.game.state.players.find(p => p.isDealer)!;

        // Reveal the dealer's hole card (second card)
        if (dealer.hand.length >= 2) {
            this.dealerArea?.revealHiddenCard(dealer.hand[1]);
        }

        // Update dealer's hand value
        const dealerValue = this.game.calculateHandValue(dealer.hand);
        this.dealerArea?.updateHandValue(dealerValue, true);

        const playLoop = () => {
            const val = this.game.calculateHandValue(dealer.hand);
            if (val < 17) {
                const card = this.game.dealCardTo(dealer.id);
                if (card) {
                    this.dealerArea?.addCard(card);
                    this.dealerArea?.updateHandValue(this.game.calculateHandValue(dealer.hand), true);
                }
                setTimeout(playLoop, 1000);
            } else {
                if (val > 21) {
                    this.showStatus('Dealer Bust!');
                }
                this.endRound();
            }
        };

        setTimeout(playLoop, 500);

    }

    endRound() {
        this.game.state.phase = 'RESOLUTION';
        const dealer = this.game.state.players.find(p => p.isDealer)!;
        const dealerVal = this.game.calculateHandValue(dealer.hand);
        this.game.state.players.forEach(p => {
            if (p.isDealer) return;

            // Helper to record result
            const recordResult = (winAmount: number) => {
                if (winAmount > 0) {
                    // Player won, Dealer owes Player
                    this.ledger.recordTransfer(dealer.id, p.id, winAmount);
                } else if (winAmount < 0) {
                    // Player lost, Player owes Dealer
                    this.ledger.recordTransfer(p.id, dealer.id, Math.abs(winAmount));
                }
            };

            // If player has split hands, calculate for each hand
            if (p.splitHands && p.splitHands.length > 0) {
                p.splitHands.forEach((hand, handIndex) => {
                    const val = this.game.calculateHandValue(hand);
                    const bet = p.splitBets![handIndex];
                    let win = 0;
                    if (val > 21) {
                        win = -bet;
                    } else if (val === 21 && hand.length === 2) {
                        if (dealerVal === 21 && dealer.hand.length === 2) {
                            win = 0;
                        } else if (!p.isSplitAces) {
                            win = bet * 1.5;
                        } else {
                            if (dealerVal > 21 || val > dealerVal) {
                                win = bet;
                            } else if (val < dealerVal) {
                                win = -bet;
                            }
                        }
                    } else {
                        if (dealerVal > 21) {
                            win = bet;
                        } else if (val > dealerVal) {
                            win = bet;
                        } else if (val < dealerVal) {
                            win = -bet;
                        }
                    }
                    p.chips += win; // Update local chips for display
                    recordResult(win);
                });
            } else {
                // Normal single hand
                let win = 0;
                const val = this.game.calculateHandValue(p.hand);
                if (p.status === 'bust') {
                    win = -p.currentBet;
                } else if (p.status === 'blackjack') {
                    if (dealerVal === 21 && dealer.hand.length === 2) {
                        win = 0;
                    } else {
                        win = p.currentBet * 1.5;
                    }
                } else {
                    if (dealerVal > 21) {
                        win = p.currentBet;
                    } else if (val > dealerVal) {
                        win = p.currentBet;
                    } else if (val < dealerVal) {
                        win = -p.currentBet;
                    } else {
                        win = 0;
                    }
                }
                p.chips += win;
                recordResult(win);
            }
        });
        this.updateUI();
        this.controls?.showDealerControls('RESOLUTION');
        this.isProcessing = false;
    }

    clearTable() {
        this.playerSlots.forEach(s => s.clearCards());
        this.dealerArea?.clearCards();
    }

    updateUI() {
        this.playerSlots.forEach(slot => {
            const player = this.game.state.players.find(p => p.id === slot.playerId);
            if (player) {
                const isActive = this.game.state.currentPlayerIndex === this.game.state.players.indexOf(player);
                slot.update(player, isActive);

                // Update split hands visual state (active indicator) without re-rendering cards
                if (player.splitHands && player.splitHands.length > 0) {
                    slot.updateSplitHandsState(player);
                    // Update values for each split hand
                    player.splitHands.forEach((hand, index) => {
                        const handInfo = this.game.calculateSoftHandValue(hand);
                        slot.updateHandValue(handInfo.value, handInfo.isSoft, handInfo.softValue, player.status, index);
                    });
                }
            }
        });
    }

    showStatus(message: string) {
        const statusEl = this.container.querySelector('#global-status') as HTMLElement;
        const textEl = statusEl?.querySelector('div');
        if (statusEl && textEl) {
            // Clear existing timeout
            if (this.statusTimeout) {
                clearTimeout(this.statusTimeout);
                this.statusTimeout = null;
            }

            textEl.textContent = message;
            statusEl.style.opacity = '1';
            statusEl.style.pointerEvents = 'auto';

            // Click to dismiss
            textEl.onclick = () => {
                statusEl.style.opacity = '0';
                statusEl.style.pointerEvents = 'none';
                if (this.statusTimeout) clearTimeout(this.statusTimeout);
            };

            statusEl.animate([
                { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 },
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }
            ], {
                duration: 400,
                easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            });

            this.statusTimeout = setTimeout(() => {
                statusEl.style.opacity = '0';
                statusEl.style.pointerEvents = 'none';
            }, 3000);
        }
    }

    showLedger() {
        const modal = this.container.querySelector('#ledger-modal') as HTMLElement;
        const content = this.container.querySelector('#ledger-content') as HTMLElement;

        if (modal && content) {
            const players = this.game.state.players;
            let html = '<div class="space-y-6">';

            // Show accumulated balances from ledger (not current chips)
            html += '<div class="mb-6"><h3 class="text-lg font-bold mb-3 text-neon-blue uppercase tracking-widest text-xs">Accumulated Balances</h3><div class="grid gap-3">';
            players.forEach(p => {
                const ledgerBalance = this.ledger.getNetBalance(p.id);
                const colorClass = ledgerBalance < 0 ? 'text-neon-pink' : 'text-neon-blue';
                html += `<div class="flex justify-between p-3 bg-white/5 rounded-lg border border-neon-purple/20"><span>${p.name}</span><span class="${colorClass} font-bold font-mono">$${ledgerBalance.toFixed(2)}</span></div>`;
            });
            html += '</div></div>';

            html += '<div><h3 class="text-lg font-bold mb-3 text-neon-purple uppercase tracking-widest text-xs">Outstanding Debts</h3>';

            const debts = this.ledger.getDebts();

            if (debts.length > 0) {
                html += '<div class="space-y-3">';
                debts.forEach(debt => {
                    const fromPlayer = players.find(p => p.id === debt.from);
                    const toPlayer = players.find(p => p.id === debt.to);

                    const fromName = fromPlayer ? fromPlayer.name : (debt.from === 'dealer' ? 'Dealer' : 'Unknown');
                    const toName = toPlayer ? toPlayer.name : (debt.to === 'dealer' ? 'Dealer' : 'Unknown');

                    html += `<div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-neon-pink/20">
                        <span class="text-white font-bold">${fromName}</span>
                        <span class="text-white/30 text-xs">OWES</span>
                        <span class="text-white font-bold">${toName}</span>
                        <span class="text-neon-pink font-bold font-mono">$${debt.amount.toFixed(2)}</span>
                    </div>`;
                });
                html += '</div>';
            } else {
                html += '<div class="text-white/30 text-center p-8 border-2 border-dashed border-neon-purple/20 rounded-xl">No debts - all players are settled!</div>';
            }
            html += '</div>';

            html += '</div>';
            content.innerHTML = html;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    hideLedger() {
        const modal = this.container.querySelector('#ledger-modal') as HTMLElement;
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    resetLedger() {
        if (confirm("Are you sure you want to clear all debt history?")) {
            this.ledger.reset();
            this.showLedger(); // Refresh view
            this.showStatus("Ledger Reset!");
        }
    }

    cleanup() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }
}
