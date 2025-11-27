import type { Card } from '../../logic/types';

export class DealerArea {
  container: HTMLElement;
  cardsContainer: HTMLElement;
  valueContainer: HTMLElement;

  constructor(root: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-20';

    this.container.innerHTML = `
            <div class="neon-glass-panel p-6 rounded-2xl relative">
                <!-- Glowing bottom edge accent -->
                <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-60 rounded-b-2xl"></div>
                <div class="absolute bottom-0 left-1/4 w-1/2 h-px bg-neon-purple blur-sm"></div>
                
                <div class="text-xs font-bold text-neon-blue/80 uppercase tracking-[0.3em] mb-4 text-center">Dealer</div>
                
                <!-- Cards Area -->
                <div class="cards-area flex items-center justify-center min-h-[120px] min-w-[140px]" id="dealer-cards"></div>
                
                <!-- Hand Value Display -->
                <div id="dealer-hand-value" class="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 transition-all duration-300">
                    <div class="hand-value-num neon-value-badge px-4 py-1.5 rounded-full text-sm font-bold">0</div>
                </div>
            </div>
        `;

    root.appendChild(this.container);
    this.cardsContainer = this.container.querySelector('#dealer-cards')!;
    this.valueContainer = this.container.querySelector('#dealer-hand-value')!;
  }

  addCard(card: Card, hidden: boolean = false) {
    const cardEl = this.createCardElement(card, hidden);
    const childCount = this.cardsContainer.children.length;

    cardEl.style.zIndex = `${childCount}`;
    if (childCount > 0) {
      cardEl.style.marginLeft = '-40px';
    }

    this.cardsContainer.appendChild(cardEl);

    // Animation
    cardEl.animate([
      { transform: 'translateY(-100px) scale(0.8)', opacity: 0 },
      { transform: 'translateY(0) scale(1)', opacity: 1 }
    ], {
      duration: 500,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    });
  }

  revealHiddenCard(card: Card) {
    const hiddenCard = this.cardsContainer.querySelector('.hidden-card') as HTMLElement;
    if (hiddenCard) {
      // Create new face-up card
      const newCard = this.createCardElement(card, false);
      newCard.style.zIndex = hiddenCard.style.zIndex;
      newCard.style.marginLeft = hiddenCard.style.marginLeft;

      // Flip animation
      hiddenCard.style.transform = 'rotateY(90deg)';
      hiddenCard.style.transition = 'transform 0.2s ease-in';

      setTimeout(() => {
        this.cardsContainer.replaceChild(newCard, hiddenCard);
        newCard.style.transform = 'rotateY(-90deg)';
        // Force reflow
        newCard.offsetHeight;
        newCard.style.transition = 'transform 0.2s ease-out';
        newCard.style.transform = 'rotateY(0deg)';
      }, 200);
    }
  }

  updateHandValue(value: number, show: boolean) {
    const valueEl = this.valueContainer;
    const valueNum = valueEl?.querySelector('.hand-value-num');
    if (valueEl && valueNum) {
      valueNum.textContent = value.toString();
      if (show) {
        valueEl.style.opacity = '1';
      } else {
        valueEl.style.opacity = '0';
      }
    }
  }

  clearCards() {
    this.cardsContainer.innerHTML = '';
    this.updateHandValue(0, false);
  }

  createCardElement(card: Card, hidden: boolean): HTMLElement {
    const cardEl = document.createElement('div');
    cardEl.className = 'neon-card w-20 h-28 flex flex-col items-center justify-between p-2 select-none relative flex-shrink-0';

    if (hidden) {
      cardEl.classList.add('hidden-card');
      cardEl.innerHTML = `
                <div class="w-full h-full rounded-lg bg-gradient-to-br from-slate-800 to-slate-950 border border-neon-purple/30 flex items-center justify-center shadow-[0_0_15px_rgba(138,43,226,0.2)]">
                    <div class="w-10 h-10 rounded-full border-2 border-neon-purple/20 bg-neon-purple/5"></div>
                </div>
            `;
    } else {
      const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
      const colorClass = isRed ? 'text-red-500' : 'text-slate-800';
      const suitSymbol = this.getSuitSymbol(card.suit);

      cardEl.innerHTML = `
                <div class="w-full text-left text-lg font-bold ${colorClass} leading-none">${card.rank}</div>
                <div class="text-4xl ${colorClass}">${suitSymbol}</div>
                <div class="w-full text-right text-lg font-bold ${colorClass} leading-none transform rotate-180">${card.rank}</div>
            `;
    }
    return cardEl;
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
}
