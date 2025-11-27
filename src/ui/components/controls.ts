export class Controls {
  container: HTMLElement;
  onAction: (action: string, payload?: any) => void;

  constructor(root: HTMLElement, onAction: (action: string, payload?: any) => void) {
    this.container = root;
    this.onAction = onAction;
  }

  showBettingControls(balance: number) {
    this.container.innerHTML = `
            <div class="neon-glass-panel-premium p-4 flex flex-row gap-4 items-center animate-fade-in mx-auto max-w-fit">
                <div class="flex gap-2 items-center">
                    ${this.renderChip(0.05, 'from-neon-pink to-pink-700', 'border-neon-pink/50')}
                    ${this.renderChip(0.10, 'from-neon-blue to-blue-700', 'border-neon-blue/50')}
                    ${this.renderChip(0.20, 'from-neon-purple to-purple-700', 'border-neon-purple/50')}
                    ${this.renderChip(0.50, 'from-slate-700 to-slate-900', 'border-white/30')}
                </div>

                <div class="w-px h-12 bg-neon-purple/30"></div>

                <div class="flex gap-2 items-center">
                    <button class="btn-neon-danger px-3 py-2 text-xs h-12" id="clear-bet">Clear</button>
                    <button class="btn-neon-primary px-6 py-2 h-12 whitespace-nowrap" id="place-bet-btn">Place Bet</button>
                </div>
            </div>
        `;
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'auto';

    this.attachBettingListeners();
  }

  renderChip(value: number, gradientClass: string, borderClass: string) {
    const displayValue = value < 1 ? `${Math.round(value * 100)}¢` : `$${value}`;
    return `
            <button class="neon-chip w-12 h-12 bg-gradient-to-br ${gradientClass} ${borderClass} text-white relative group transition-all hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(138,43,226,0.5)]" data-value="${value}">
                <div class="absolute inset-0 rounded-full border-2 border-dashed border-white/20 opacity-50"></div>
                <div class="relative z-10 font-black text-xs drop-shadow-md">${displayValue}</div>
                <div class="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
            </button>
        `;
  }

  attachBettingListeners() {
    this.container.querySelectorAll('.neon-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = parseFloat((e.currentTarget as HTMLElement).dataset.value!);
        this.onAction('bet', val);
      });
    });

    this.container.querySelector('#clear-bet')?.addEventListener('click', () => {
      this.onAction('bet', -9999); // Clear signal
    });

    this.container.querySelector('#place-bet-btn')?.addEventListener('click', () => {
      this.onAction('confirm-bet');
    });
  }

  showPlayerControls(canDouble: boolean, canSplit: boolean) {
    this.container.innerHTML = `
            <div class="flex gap-3 animate-fade-in">
                <button class="btn-neon-danger min-w-[100px]" id="stand-btn">Stand</button>
                <button class="btn-neon-primary min-w-[100px]" id="hit-btn">Hit</button>
                ${canDouble ? `<button class="btn-neon-secondary min-w-[100px]" id="double-btn">Double</button>` : ''}
                ${canSplit ? `<button class="btn-neon-secondary min-w-[100px]" id="split-btn">Split</button>` : ''}
            </div>
        `;
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'auto';

    this.container.querySelector('#hit-btn')?.addEventListener('click', () => this.onAction('hit'));
    this.container.querySelector('#stand-btn')?.addEventListener('click', () => this.onAction('stand'));
    this.container.querySelector('#double-btn')?.addEventListener('click', () => this.onAction('double'));
    this.container.querySelector('#split-btn')?.addEventListener('click', () => this.onAction('split'));
  }

  showDealerControls(phase: string) {
    if (phase === 'BETTING') {
      this.container.innerHTML = `
                <div class="neon-glass-panel px-6 py-3 text-white animate-fade-in flex items-center gap-3">
                    <button class="btn-neon-primary px-6 py-2 h-12 whitespace-nowrap" id="deal-btn">Deal Cards</button>
                </div>
            `;
      this.container.querySelector('#deal-btn')?.addEventListener('click', () => this.onAction('deal'));
    } else if (phase === 'RESOLUTION') {
      this.container.innerHTML = `
                <button class="btn-neon-primary animate-fade-in px-8 py-3 text-lg" id="next-round-btn">
                    Next Round
                </button>
            `;
      this.container.querySelector('#next-round-btn')?.addEventListener('click', () => this.onAction('next-round'));
    } else {
      this.hide();
    }
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'auto';
  }

  showInsuranceControls(playerName: string) {
    const cost = this.container.getAttribute('data-cost') || '?';

    this.container.innerHTML = `
            <div class="neon-glass-panel-premium p-6 flex flex-col gap-4 items-center animate-fade-in">
                <div class="text-center">
                    <div class="text-white font-bold text-lg mb-1" style="text-shadow: 0 0 10px rgba(0,191,255,0.5);">Insurance?</div>
                    <div class="text-white/50 text-sm">Protect <span class="text-neon-blue">${playerName}</span>'s hand</div>
                    <div class="text-xs text-neon-purple mt-1">Cost: $${cost} • Pays 2:1</div>
                </div>
                
                <div class="flex gap-3 w-full">
                    <button class="btn-neon-danger flex-1" id="no-insurance">Decline</button>
                    <button class="btn-neon-gold flex-1" id="yes-insurance">Accept</button>
                </div>
            </div>
        `;
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'auto';

    // Event-Listener mit setTimeout hinzufügen
    setTimeout(() => {
      const yesBtn = this.container.querySelector('#yes-insurance');
      const noBtn = this.container.querySelector('#no-insurance');

      if (yesBtn) {
        yesBtn.addEventListener('click', (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          this.onAction('insurance', true);
        });
      }

      if (noBtn) {
        noBtn.addEventListener('click', (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          this.onAction('insurance', false);
        });
      }
    }, 100);
  }

  hide() {
    this.container.style.opacity = '0';
    this.container.style.pointerEvents = 'none';
  }
}
