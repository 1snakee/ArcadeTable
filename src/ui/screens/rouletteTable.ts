import { RouletteGameManager, type RouletteBetType } from '../../logic/rouletteGameManager';
import { Ledger } from '../../logic/ledger';
import { soundManager } from '../soundManager';
import { Controls } from '../components/controls';

export class RouletteTableScreen {
    container: HTMLElement;
    game: RouletteGameManager;
    ledger: Ledger;
    onExit: () => void;

    // UI Elements
    canvas!: HTMLCanvasElement;
    ctx!: CanvasRenderingContext2D;
    controls: Controls | null = null;

    // State
    selectedChip: number = 0.10;
    isSpinning: boolean = false;
    currentBettingPlayerIndex: number = 0;
    animationId: number | null = null;

    // Animation Params
    scrollOffset: number = 0;
    targetOffset: number = 0;
    velocity: number = 0;
    startTime: number = 0;
    spinDuration: number = 5000; // 5 seconds

    // Visual Constants
    SEGMENT_WIDTH = 100;
    VISIBLE_SEGMENTS = 7;

    constructor(root: HTMLElement, game: RouletteGameManager, ledger: Ledger, onExit: () => void) {
        this.game = game;
        this.ledger = ledger;
        this.onExit = onExit;

        this.container = document.createElement('div');
        this.container.className = 'w-full h-full relative overflow-hidden bg-black';
        root.appendChild(this.container);

        this.render();
        this.init();
    }

    render() {
        this.container.innerHTML = `
            <!-- Top Bar -->
            <div class="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-50 pointer-events-none">
                <button id="ledger-btn" class="pointer-events-auto neon-glass-panel px-4 py-2 text-white/80 hover:text-neon-blue text-sm flex items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(0,191,255,0.3)]">
                    <span class="text-lg">📊</span> Ledger
                </button>
                
                <div class="pointer-events-auto flex flex-col items-center">
                     <h2 class="text-xl font-bold text-white tracking-wider font-display" style="text-shadow: 0 0 10px rgba(255,255,255,0.5);">ROULETTE</h2>
                </div>

                <button id="exit-btn" class="pointer-events-auto btn-neon-danger px-4 py-2 text-sm">
                    Exit
                </button>
            </div>

            <!-- Main Game Area -->
            <div class="relative w-full h-full flex flex-col items-center justify-center gap-8">
                
                <!-- Wheel / Bar Area -->
                <div class="relative w-full max-w-4xl h-48 bg-black/50 rounded-xl border-y-2 border-neon-purple/30 overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
                    <canvas id="roulette-canvas" class="w-full h-full"></canvas>
                    
                    <!-- Center Indicator -->
                    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-white z-20 shadow-[0_0_15px_white]"></div>
                    <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-white z-20"></div>
                    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[15px] border-b-white z-20"></div>
                    
                    <!-- Gradients for fade effect -->
                    <div class="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10"></div>
                    <div class="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10"></div>
                </div>

                <!-- History -->
                <div id="history-bar" class="flex gap-2 h-8 items-center justify-center">
                    <!-- Populated dynamically -->
                </div>

                <!-- Betting Controls -->
                <div class="flex flex-col gap-6 items-center w-full max-w-2xl">
                    
                    <!-- Bet Buttons -->
                    <div class="flex gap-8 w-full justify-center">
                        <button id="bet-red" class="group relative w-48 h-32 rounded-2xl bg-gradient-to-br from-red-900 to-red-600 border-2 border-red-500/50 hover:border-red-400 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,0,0,0.4)] flex flex-col items-center justify-center gap-2">
                            <span class="text-3xl font-black text-white drop-shadow-lg">RED</span>
                            <span class="text-white/60 text-sm font-bold">2x Payout</span>
                            <div id="red-chip-stack" class="absolute bottom-2"></div>
                            <div class="absolute inset-0 rounded-2xl ring-0 group-hover:ring-4 ring-red-500/30 transition-all"></div>
                        </button>

                        <button id="bet-black" class="group relative w-48 h-32 rounded-2xl bg-gradient-to-br from-gray-900 to-black border-2 border-gray-500/50 hover:border-white/50 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center gap-2">
                            <span class="text-3xl font-black text-white drop-shadow-lg">BLACK</span>
                            <span class="text-white/60 text-sm font-bold">2x Payout</span>
                            <div id="black-chip-stack" class="absolute bottom-2"></div>
                            <div class="absolute inset-0 rounded-2xl ring-0 group-hover:ring-4 ring-white/20 transition-all"></div>
                        </button>
                    </div>

                    <!-- Chip Selector -->
                    <div class="flex gap-4 p-4 bg-black/40 rounded-full border border-white/10 backdrop-blur-md">
                        ${[0.05, 0.10, 0.20, 0.50].map(val => `
                            <button class="chip-btn w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center font-bold text-xs text-white hover:scale-110 transition-all hover:border-solid hover:border-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]" data-value="${val}">
                                $${val.toFixed(2)}
                            </button>
                        `).join('')}
                    </div>

                    <!-- Action Button -->
                    <div class="flex flex-col gap-2 w-full max-w-md items-center">
                        <div id="current-player-indicator" class="text-neon-blue font-bold text-lg animate-pulse">
                            Player 1's Turn
                        </div>
                        <button id="confirm-bet-btn" class="btn-primary-neon px-12 py-4 text-xl font-black tracking-widest w-full disabled:opacity-50 disabled:cursor-not-allowed">
                            CONFIRM BET
                        </button>
                        <button id="spin-btn" class="hidden btn-primary-neon px-12 py-4 text-xl font-black tracking-widest w-full disabled:opacity-50 disabled:cursor-not-allowed">
                            SPIN
                        </button>
                    </div>
                </div>
            </div>

            <!-- Ledger Modal -->
            <div id="ledger-modal" class="absolute inset-0 bg-black/90 z-[60] hidden flex items-center justify-center backdrop-blur-sm">
                <div class="neon-glass-panel-premium p-8 max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto animate-fade-in">
                    <div class="flex justify-between items-center mb-6 border-b border-neon-purple/20 pb-4">
                        <h2 class="text-3xl font-bold text-white font-display tracking-tight" style="text-shadow: 0 0 20px rgba(138,43,226,0.5);">Debt Ledger</h2>
                        <div class="flex gap-3">
                            <button id="reset-ledger" class="px-3 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-sm transition-colors">Reset History</button>
                            <button id="close-ledger" class="text-white/50 hover:text-neon-pink text-3xl transition-colors">&times;</button>
                        </div>
                    </div>
                    <div id="ledger-content" class="text-white"></div>
                </div>
            </div>
        `;
    }

    init() {
        this.canvas = document.getElementById('roulette-canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;

        // Resize canvas
        const resize = () => {
            const rect = this.canvas.parentElement!.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.draw();
        };
        window.addEventListener('resize', resize);
        resize();

        // Event Listeners
        document.getElementById('exit-btn')?.addEventListener('click', () => this.onExit());

        document.getElementById('bet-red')?.addEventListener('click', () => this.placeBet('RED'));
        document.getElementById('bet-black')?.addEventListener('click', () => this.placeBet('BLACK'));

        document.getElementById('confirm-bet-btn')?.addEventListener('click', () => this.confirmBet());
        document.getElementById('spin-btn')?.addEventListener('click', () => this.handleSpin());

        document.querySelectorAll('.chip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = parseFloat((e.currentTarget as HTMLElement).dataset.value!);
                this.selectedChip = val;
                this.updateChipSelection();
            });
        });

        // Ledger
        document.getElementById('ledger-btn')?.addEventListener('click', () => this.showLedger());
        document.getElementById('reset-ledger')?.addEventListener('click', () => this.resetLedger());
        document.getElementById('close-ledger')?.addEventListener('click', () => {
            document.getElementById('ledger-modal')?.classList.add('hidden');
        });

        this.updateChipSelection();
        this.updateHistory();
        this.startBettingPhase();
        this.draw();
    }

    updateChipSelection() {
        document.querySelectorAll('.chip-btn').forEach(btn => {
            const val = parseFloat((btn as HTMLElement).dataset.value!);
            if (val === this.selectedChip) {
                btn.classList.add('bg-white', 'text-black', 'border-solid', 'scale-110', 'shadow-[0_0_15px_white]');
                btn.classList.remove('text-white', 'border-dashed');
            } else {
                btn.classList.remove('bg-white', 'text-black', 'border-solid', 'scale-110', 'shadow-[0_0_15px_white]');
                btn.classList.add('text-white', 'border-dashed');
            }
        });
    }

    startBettingPhase() {
        this.currentBettingPlayerIndex = 0;
        this.updateBettingUI();
    }

    updateBettingUI() {
        const players = this.game.players.filter(p => !p.isDealer);
        const currentPlayer = players[this.currentBettingPlayerIndex];

        const indicator = document.getElementById('current-player-indicator');
        const confirmBtn = document.getElementById('confirm-bet-btn');
        const spinBtn = document.getElementById('spin-btn');

        if (this.currentBettingPlayerIndex < players.length) {
            // Betting Phase
            if (indicator) indicator.textContent = `${currentPlayer.name}'s Turn`;
            confirmBtn?.classList.remove('hidden');
            spinBtn?.classList.add('hidden');
        } else {
            // All bets placed, ready to spin
            if (indicator) indicator.textContent = "Dealer's Turn";
            confirmBtn?.classList.add('hidden');
            spinBtn?.classList.remove('hidden');
        }

        this.updateBetVisuals();
    }

    placeBet(type: RouletteBetType) {
        if (this.isSpinning) return;

        const players = this.game.players.filter(p => !p.isDealer);
        if (this.currentBettingPlayerIndex >= players.length) return;

        const player = players[this.currentBettingPlayerIndex];

        this.game.placeBet(player.id, this.selectedChip, type);
        soundManager.playChipSound();
        this.updateBetVisuals();
    }

    confirmBet() {
        const players = this.game.players.filter(p => !p.isDealer);
        const player = players[this.currentBettingPlayerIndex];

        if (player.bet === 0) {
            // Optional: Alert user they must bet? Or allow skipping?
            // For now, let's require a bet
            soundManager.playDenySound();
            return;
        }

        soundManager.playConfirmSound();
        this.currentBettingPlayerIndex++;
        this.updateBettingUI();
    }

    updateBetVisuals() {
        const players = this.game.players.filter(p => !p.isDealer);
        // Show bets for ALL players? Or just current?
        // Let's show a summary or just the current player's bet on the big buttons.
        // Better: Show total bets on Red/Black from all players to simulate the "table" feel.

        const redStack = document.getElementById('red-chip-stack')!;
        const blackStack = document.getElementById('black-chip-stack')!;

        redStack.innerHTML = '';
        blackStack.innerHTML = '';

        let totalRed = 0;
        let totalBlack = 0;

        players.forEach(p => {
            if (p.betType === 'RED') totalRed += p.bet;
            if (p.betType === 'BLACK') totalBlack += p.bet;
        });

        if (totalRed > 0) {
            redStack.innerHTML = `<div class="px-3 py-1 bg-white text-black font-bold rounded-full text-xs shadow-lg">$${totalRed.toFixed(2)}</div>`;
        }
        if (totalBlack > 0) {
            blackStack.innerHTML = `<div class="px-3 py-1 bg-white text-black font-bold rounded-full text-xs shadow-lg">$${totalBlack.toFixed(2)}</div>`;
        }
    }

    handleSpin() {
        if (this.isSpinning) return;

        // Ensure at least one bet
        const hasBets = this.game.players.some(p => p.bet > 0);
        if (!hasBets) return;

        this.isSpinning = true;
        document.getElementById('spin-btn')?.setAttribute('disabled', 'true');

        // Generate result
        const result = this.game.spin(); // 0 (Red) or 1 (Black)

        // Start animation
        this.startSpinAnimation(result);
        soundManager.playSpinStart();
    }

    startSpinAnimation(result: number) {
        this.startTime = performance.now();

        // Calculate target offset
        // We want to land on a segment of the correct color.
        // 0 = Red, 1 = Black.
        // Segments alternate: Red, Black, Red, Black...
        // Index 0 = Red, 1 = Black, 2 = Red, 3 = Black...
        // We want to spin for a good distance.
        const minSpins = 50; // Minimum segments to pass
        let targetIndex = minSpins + (minSpins % 2 === result ? 0 : 1);

        // Add randomness to land somewhere within the segment (center +/- jitter)
        const jitter = (Math.random() - 0.5) * 0.8; // +/- 40% of width

        this.targetOffset = (targetIndex + jitter) * this.SEGMENT_WIDTH;

        // Reset scroll to 0 (or keep continuous if we wanted, but reset is easier for deterministic landing)
        this.scrollOffset = 0;

        const animate = (now: number) => {
            const elapsed = now - this.startTime;
            const progress = Math.min(elapsed / this.spinDuration, 1);

            // Easing: cubic-bezier(0.25, 0.1, 0.25, 1) - easeOutQuad-ish
            // Custom ease out for "wheel" feel
            const ease = 1 - Math.pow(1 - progress, 3);

            this.scrollOffset = this.targetOffset * ease;

            this.draw();

            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
                // Play tick sound if we cross a segment boundary
                // (Simplified: just loop sound)
            } else {
                this.finishSpin(result);
            }
        };

        this.animationId = requestAnimationFrame(animate);
    }

    finishSpin(result: number) {
        this.isSpinning = false;
        document.getElementById('spin-btn')?.removeAttribute('disabled');

        this.game.resolveBets();
        this.updateHistory();
        this.updateBetVisuals(); // Clear bets or show winnings?

        // Show win/loss
        const player = this.game.players.find(p => !p.isDealer);
        if (player && player.winnings > 0) {
            soundManager.playWinSound();
            this.showWinMessage(player.winnings);
        } else {
            soundManager.playLoseSound();
        }

        // Reset for next round after delay
        setTimeout(() => {
            this.game.resetRound();
            this.startBettingPhase(); // Reset betting flow
        }, 3000);
    }

    showWinMessage(amount: number) {
        const msg = document.createElement('div');
        msg.className = 'absolute inset-0 flex items-center justify-center z-50 animate-bounce-in pointer-events-none';
        msg.innerHTML = `
            <div class="bg-black/80 backdrop-blur-xl border border-neon-green/50 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(0,255,0,0.3)]">
                <h2 class="text-4xl font-black text-neon-green mb-2 tracking-widest">YOU WON!</h2>
                <div class="text-2xl text-white font-mono">+$${amount.toFixed(2)}</div>
            </div>
        `;
        this.container.appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
    }

    draw() {
        if (!this.ctx) return;

        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;

        this.ctx.clearRect(0, 0, w, h);

        // Draw segments
        // We need to draw segments around the current scrollOffset
        // Center of screen corresponds to scrollOffset

        // const startX = cx - (this.scrollOffset % (this.SEGMENT_WIDTH * 2)) - (this.SEGMENT_WIDTH * this.VISIBLE_SEGMENTS);
        // We render a repeating pattern of Red/Black
        // Since we only care about the visual loop, we can just render based on modulo

        // However, for the final landing to be correct, we need to respect the absolute index
        // The center pixel represents `this.scrollOffset`

        const centerIndex = this.scrollOffset / this.SEGMENT_WIDTH;
        const firstVisibleIndex = Math.floor(centerIndex - (this.VISIBLE_SEGMENTS / 2)) - 1;
        const lastVisibleIndex = Math.ceil(centerIndex + (this.VISIBLE_SEGMENTS / 2)) + 1;

        for (let i = firstVisibleIndex; i <= lastVisibleIndex; i++) {
            const x = cx + (i * this.SEGMENT_WIDTH) - this.scrollOffset;
            const isRed = i % 2 === 0; // 0=Red, 1=Black, 2=Red... matches our logic

            // Draw Segment
            this.ctx.fillStyle = isRed ? '#DC2626' : '#111827'; // Red-600 or Gray-900
            this.ctx.fillRect(x - (this.SEGMENT_WIDTH / 2) + 2, 10, this.SEGMENT_WIDTH - 4, h - 20);

            // Draw Border/Glow
            this.ctx.strokeStyle = isRed ? '#EF4444' : '#374151';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x - (this.SEGMENT_WIDTH / 2) + 2, 10, this.SEGMENT_WIDTH - 4, h - 20);

            // Draw Icon/Text
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            // this.ctx.fillText(isRed ? 'RED' : 'BLK', x, h/2);

            // Draw Diamond/Shape
            this.ctx.beginPath();
            this.ctx.moveTo(x, h / 2 - 20);
            this.ctx.lineTo(x + 20, h / 2);
            this.ctx.lineTo(x, h / 2 + 20);
            this.ctx.lineTo(x - 20, h / 2);
            this.ctx.closePath();
            this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
            this.ctx.fill();
        }
    }

    updateHistory() {
        const bar = document.getElementById('history-bar');
        if (!bar) return;

        bar.innerHTML = this.game.history.slice(0, 10).map(h => `
            <div class="w-4 h-4 rounded-full ${h.result === 0 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-gray-800 border border-white/20'}"></div>
        `).join('');
    }

    showLedger() {
        const modal = document.getElementById('ledger-modal');
        const content = document.getElementById('ledger-content');
        if (modal && content) {
            content.innerHTML = this.renderLedgerHistory();
            modal.classList.remove('hidden');
        }
    }

    resetLedger() {
        if (confirm('Are you sure you want to clear the entire debt history? This cannot be undone.')) {
            this.ledger.reset();
            const content = document.getElementById('ledger-content');
            if (content) {
                content.innerHTML = this.renderLedgerHistory();
            }
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
            const fromName = this.game.players.find(p => p.id === debt.from)?.name || debt.from;
            const toName = this.game.players.find(p => p.id === debt.to)?.name || debt.to;

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
}
