

export type GameType = 'BLACKJACK' | 'BACCARAT' | 'ROULETTE';


export interface SetupConfig {
    gameType: GameType;
    players: string[];
    dealerIndex: number;
}

export class SetupScreen {
    container: HTMLElement;
    onStart: (config: SetupConfig) => void;
    playerInputs: HTMLElement[] = [];
    private animationId: number | null = null;
    selectedGame: GameType = 'BLACKJACK';

    constructor(root: HTMLElement, onStart: (config: SetupConfig) => void) {
        this.onStart = onStart;
        this.container = document.createElement('div');
        this.container.className = 'w-full h-full relative overflow-hidden font-sans';
        root.appendChild(this.container);
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="absolute inset-0 flex items-center justify-center z-10 p-4">
                <div class="setup-panel p-8 w-full max-w-2xl flex flex-col gap-8 animate-fade-in relative overflow-hidden">
                    <!-- Decorative elements -->
                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-pink to-transparent opacity-60"></div>
                    <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-40"></div>
                    
                    <div class="text-center space-y-2">
                        <h1 class="text-5xl font-black text-white tracking-tight" style="font-family: var(--font-family-display); text-shadow: 0 0 30px rgba(138, 43, 226, 0.5), 0 0 60px rgba(0, 191, 255, 0.3);">
                            CASINO <span class="text-neon-pink"></span>
                        </h1>
                        <p class="text-white/60 text-sm uppercase tracking-widest">HTL Edition</p>
                    </div>

                    <!-- Game Selector -->
                    <div class="flex justify-center gap-3">
                        <button id="select-blackjack" class="game-select-btn active px-5 py-2 text-sm rounded-full border border-neon-blue bg-neon-blue/20 text-white font-bold transition-all hover:shadow-[0_0_15px_rgba(0,191,255,0.5)]">
                            BLACKJACK
                        </button>
                        <button id="select-baccarat" class="game-select-btn px-5 py-2 text-sm rounded-full border border-white/20 bg-transparent text-white/60 font-bold transition-all hover:border-neon-pink hover:text-white hover:shadow-[0_0_15px_rgba(255,20,147,0.5)]">
                            BACCARAT
                        </button>
                        <button id="select-roulette" class="game-select-btn px-5 py-2 text-sm rounded-full border border-white/20 bg-transparent text-white/60 font-bold transition-all hover:border-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(255,0,0,0.5)]">
                            ROULETTE
                        </button>
                    </div>
                    
                    <div id="players-list" class="flex flex-col gap-3 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
                        <!-- Player inputs will go here -->
                    </div>

                    <div class="flex flex-col gap-4 mt-2">
                        <button id="add-player" class="btn-secondary-neon w-full border-dashed transition-all">
                            + Add Player Seat
                        </button>
                        
                        <div class="h-px w-full bg-white/10 my-2"></div>
                        
                        <button id="start-game" class="btn-primary-neon w-full py-4 text-lg" disabled>
                            Enter Table
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.addPlayerInput();
        this.addPlayerInput(); // Start with 2 players

        // Game Selection Logic
        const btnBlackjack = document.getElementById('select-blackjack');
        const btnBaccarat = document.getElementById('select-baccarat');
        const btnRoulette = document.getElementById('select-roulette');

        btnBlackjack?.addEventListener('click', () => this.selectGame('BLACKJACK'));
        btnBaccarat?.addEventListener('click', () => this.selectGame('BACCARAT'));
        btnRoulette?.addEventListener('click', () => this.selectGame('ROULETTE'));

        document.getElementById('add-player')?.addEventListener('click', () => {
            if (this.playerInputs.length < 5) {
                this.addPlayerInput();
            }
        });

        document.getElementById('start-game')?.addEventListener('click', () => {
            this.startGame();
        });
    }

    selectGame(type: GameType) {
        this.selectedGame = type;
        const btnBlackjack = document.getElementById('select-blackjack');
        const btnBaccarat = document.getElementById('select-baccarat');
        const btnRoulette = document.getElementById('select-roulette');

        // Reset all buttons
        btnBlackjack?.classList.remove('active', 'border-neon-blue', 'bg-neon-blue/20');
        btnBlackjack?.classList.add('border-white/20', 'bg-transparent', 'text-white/60');

        btnBaccarat?.classList.remove('active', 'border-neon-pink', 'bg-neon-pink/20');
        btnBaccarat?.classList.add('border-white/20', 'bg-transparent', 'text-white/60');

        btnRoulette?.classList.remove('active', 'border-red-500', 'bg-red-500/20');
        btnRoulette?.classList.add('border-white/20', 'bg-transparent', 'text-white/60');

        // Activate selected button
        if (type === 'BLACKJACK') {
            btnBlackjack?.classList.add('active', 'border-neon-blue', 'bg-neon-blue/20', 'text-white');
            btnBlackjack?.classList.remove('border-white/20', 'bg-transparent', 'text-white/60');
        } else if (type === 'BACCARAT') {
            btnBaccarat?.classList.add('active', 'border-neon-pink', 'bg-neon-pink/20', 'text-white');
            btnBaccarat?.classList.remove('border-white/20', 'bg-transparent', 'text-white/60');
        } else if (type === 'ROULETTE') {
            btnRoulette?.classList.add('active', 'border-red-500', 'bg-red-500/20', 'text-white');
            btnRoulette?.classList.remove('border-white/20', 'bg-transparent', 'text-white/60');
        }
    }

    addPlayerInput() {
        const list = document.getElementById('players-list');
        if (!list) return;

        const index = this.playerInputs.length;
        const wrapper = document.createElement('div');
        wrapper.className = 'group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/20 transition-all duration-300';

        wrapper.innerHTML = `
            <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-neon-blue font-bold text-sm border border-neon-purple/30">
                ${index + 1}
            </div>
            
            <div class="flex-1 relative">
                <input type="text" placeholder=" " class="player-name peer w-full bg-transparent border-b border-white/20 focus:border-neon-pink outline-none text-white px-0 py-2 transition-colors placeholder-transparent">
                <label class="absolute left-0 -top-3.5 text-white/40 text-xs transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-white/40 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-neon-pink peer-focus:text-xs pointer-events-none">Player Name</label>
            </div>

            <label class="flex items-center gap-3 cursor-pointer group/dealer">
                <div class="relative">
                    <input type="radio" name="dealer" value="${index}" class="dealer-select peer sr-only">
                    <div class="w-5 h-5 rounded-full border-2 border-white/30 peer-checked:border-neon-purple peer-checked:bg-neon-purple transition-all peer-checked:shadow-[0_0_10px_rgba(138,43,226,0.5)]"></div>
                </div>
                <span class="text-sm text-white/50 group-hover/dealer:text-white transition-colors">Dealer</span>
            </label>

            ${index >= 2 ? `<button class="remove-player text-white/20 hover:text-neon-pink transition-colors p-2 hover:bg-neon-pink/10 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>` : ''}
        `;

        list.appendChild(wrapper);
        this.playerInputs.push(wrapper);

        // Event listeners
        const input = wrapper.querySelector('.player-name') as HTMLInputElement;
        input.addEventListener('input', () => this.validate());

        const radio = wrapper.querySelector('.dealer-select') as HTMLInputElement;
        radio.addEventListener('change', () => this.validate());

        if (index >= 2) {
            wrapper.querySelector('.remove-player')?.addEventListener('click', () => {
                this.removePlayerAtIndex(index);
            });
        }

        this.validate();
    }

    removePlayerAtIndex(indexToRemove: number) {
        const wrapper = this.playerInputs[indexToRemove];
        if (!wrapper) return;

        wrapper.remove();
        this.playerInputs.splice(indexToRemove, 1);
        this.updatePlayerList();
    }

    updatePlayerList() {
        const list = document.getElementById('players-list');
        if (!list) return;

        // Save current values
        const currentValues = this.playerInputs.map(wrapper => {
            const input = wrapper.querySelector('.player-name') as HTMLInputElement;
            const radio = wrapper.querySelector('.dealer-select') as HTMLInputElement;
            return {
                name: input?.value || '',
                isDealer: radio?.checked || false
            };
        });

        // Clear and rebuild
        list.innerHTML = '';
        this.playerInputs = [];

        currentValues.forEach((data, idx) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/20 transition-all duration-300';

            wrapper.innerHTML = `
                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-neon-blue font-bold text-sm border border-neon-purple/30">
                    ${idx + 1}
                </div>
                
                <div class="flex-1 relative">
                    <input type="text" placeholder=" " value="${data.name}" class="player-name peer w-full bg-transparent border-b border-white/20 focus:border-neon-pink outline-none text-white px-0 py-2 transition-colors placeholder-transparent">
                    <label class="absolute left-0 -top-3.5 text-white/40 text-xs transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-white/40 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-neon-pink peer-focus:text-xs pointer-events-none">Player Name</label>
                </div>

                <label class="flex items-center gap-3 cursor-pointer group/dealer">
                    <div class="relative">
                        <input type="radio" name="dealer" value="${idx}" class="dealer-select peer sr-only" ${data.isDealer ? 'checked' : ''}>
                        <div class="w-5 h-5 rounded-full border-2 border-white/30 peer-checked:border-neon-purple peer-checked:bg-neon-purple transition-all peer-checked:shadow-[0_0_10px_rgba(138,43,226,0.5)]"></div>
                    </div>
                    <span class="text-sm text-white/50 group-hover/dealer:text-white transition-colors">Dealer</span>
                </label>

                ${idx >= 2 ? `<button class="remove-player text-white/20 hover:text-neon-pink transition-colors p-2 hover:bg-neon-pink/10 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>` : ''}
            `;

            list.appendChild(wrapper);
            this.playerInputs.push(wrapper);

            // Re-attach event listeners
            const input = wrapper.querySelector('.player-name') as HTMLInputElement;
            input.addEventListener('input', () => this.validate());

            const radio = wrapper.querySelector('.dealer-select') as HTMLInputElement;
            radio.addEventListener('change', () => this.validate());

            if (idx >= 2) {
                wrapper.querySelector('.remove-player')?.addEventListener('click', () => {
                    this.removePlayerAtIndex(idx);
                });
            }
        });

        this.validate();
    }

    validate() {
        const names = this.playerInputs.map(w => (w.querySelector('.player-name') as HTMLInputElement).value.trim());
        const dealerSelected = document.querySelector('input[name="dealer"]:checked');
        const validNames = names.every(n => n.length > 0);
        const validCount = names.length >= 2 && names.length <= 5;

        const btn = document.getElementById('start-game') as HTMLButtonElement;
        if (validNames && validCount && dealerSelected) {
            btn.disabled = false;
        } else {
            btn.disabled = true;
        }
    }

    startGame() {
        const names = this.playerInputs.map(w => (w.querySelector('.player-name') as HTMLInputElement).value.trim());
        const dealerIndex = parseInt((document.querySelector('input[name="dealer"]:checked') as HTMLInputElement).value);

        this.onStart({
            gameType: this.selectedGame,
            players: names,
            dealerIndex: dealerIndex
        });
    }

    cleanup() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', () => { });
    }
}
