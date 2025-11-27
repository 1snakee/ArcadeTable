import type { Player, Card } from '../../logic/types';

export class PlayerSlot {
    container: HTMLElement;
    playerId: string;
    cardsContainer: HTMLElement;
    chipsContainer: HTMLElement;
    infoContainer: HTMLElement;

    constructor(root: HTMLElement, player: Player, index: number, totalPlayers: number) {
        this.playerId = player.id;
        this.container = document.createElement('div');

        // Calculate position - distribute evenly
        const step = 100 / (totalPlayers + 1);
        const left = step * (index + 1);

        this.container.className = 'absolute bottom-32 transform -translate-x-1/2 flex flex-col items-center gap-4 transition-all duration-500 z-10';
        this.container.style.left = `${left}%`;

        this.container.innerHTML = `
        <div class="relative w-44 flex flex-col items-center">
            <!-- Cards Area - positioned above panel -->
            <div class="relative mb-2" style="min-height: 120px;">
                <!-- Floating Hand Value -->
                <div class="hand-value absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 transition-all duration-300 z-30" id="hand-value-${player.id}">
                    <div class="hand-value-num neon-value-badge px-3 py-1 rounded-full text-sm font-bold">0</div>
                </div>

                <!-- Bust Badge -->
                <div class="bust-badge absolute top-10 left-1/2 -translate-x-1/2 z-40 opacity-0 pointer-events-none transition-all duration-300" id="bust-badge-${player.id}"> 
                    <div class="neon-bust-badge text-white font-black text-xs px-4 py-1.5 rounded-lg uppercase tracking-widest">
                        BUST
                    </div>
                </div>

                <!-- Cards Container -->
                <div class="cards-area flex justify-center items-center z-10" id="cards-${player.id}">
                </div>
            </div>

            <!-- Player Info Panel -->
            <div class="player-panel neon-player-panel w-full p-4 flex flex-col items-center gap-2 transition-all duration-300 group relative overflow-hidden">
                <!-- Glowing top edge when active -->
                <div class="active-glow absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-0 transition-opacity duration-300"></div>
                
                <div class="text-sm font-bold text-white truncate max-w-full tracking-wide">${player.name}</div>
                <div class="text-xs font-mono ${player.chips < 0 ? 'text-neon-pink' : 'text-neon-blue'}">$${player.chips.toFixed(2)}</div>
                
                ${player.isDealer ? '<div class="absolute -top-3 bg-gradient-to-r from-neon-purple to-neon-pink text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-lg uppercase tracking-wider">Dealer</div>' : ''}

                <!-- Bet Display -->
                <div class="flex items-center gap-2 text-xs opacity-0 transition-all duration-300 translate-y-2" id="bet-display-${player.id}">
                    <div class="w-4 h-4 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink shadow-[0_0_8px_rgba(138,43,226,0.5)] border border-white/20"></div>
                    <span class="text-white font-bold" id="bet-amt-${player.id}">$0.00</span>
                </div>
            </div>
        </div>
        `;

        root.appendChild(this.container);
        this.cardsContainer = this.container.querySelector(`#cards-${player.id}`)!;
        this.chipsContainer = this.container.querySelector(`#bet-display-${player.id}`)!;
        this.infoContainer = this.container.querySelector('.player-panel')!;
    }

    update(player: Player, isActive: boolean = false) {
        // Update chips
        const chipsEl = this.infoContainer.querySelector('.text-neon-blue, .text-neon-pink') as HTMLElement;
        if (chipsEl) {
            chipsEl.textContent = `$${player.chips.toFixed(2)}`;
            chipsEl.className = `text-xs font-mono ${player.chips < 0 ? 'text-neon-pink' : 'text-neon-blue'}`;
        }

        // Update bet display
        const betDisplayEl = this.container.querySelector(`#bet-display-${player.id}`) as HTMLElement;
        const betAmtEl = this.container.querySelector(`#bet-amt-${player.id}`);
        if (betDisplayEl && betAmtEl) {
            betAmtEl.textContent = `$${player.currentBet.toFixed(2)}`;
            if (player.currentBet > 0) {
                betDisplayEl.style.opacity = '1';
                betDisplayEl.style.transform = 'translateY(0)';
            } else {
                betDisplayEl.style.opacity = '0';
                betDisplayEl.style.transform = 'translateY(10px)';
            }
        }

        // Active Turn Styling
        const activeGlow = this.infoContainer.querySelector('.active-glow') as HTMLElement;
        if (isActive && player.status === 'playing') {
            this.infoContainer.classList.add('neon-active-turn');
            this.infoContainer.style.transform = 'scale(1.05)';
            if (activeGlow) activeGlow.style.opacity = '1';
        } else {
            this.infoContainer.classList.remove('neon-active-turn');
            this.infoContainer.style.transform = 'scale(1)';
            if (activeGlow) activeGlow.style.opacity = '0';
        }

        // Bust Handling
        const bustBadge = this.container.querySelector(`#bust-badge-${player.id}`) as HTMLElement;
        if (player.status === 'bust') {
            this.infoContainer.classList.add('neon-bust-panel');
            if (bustBadge) {
                bustBadge.style.opacity = '1';
                bustBadge.style.transform = 'translateX(-50%) scale(1.1)';
            }
        } else {
            this.infoContainer.classList.remove('neon-bust-panel');
            if (bustBadge) {
                bustBadge.style.opacity = '0';
                bustBadge.style.transform = 'translateX(-50%) scale(0.8)';
            }

            if (player.status === 'blackjack') {
                this.infoContainer.classList.add('neon-blackjack-panel');
            } else {
                this.infoContainer.classList.remove('neon-blackjack-panel');
            }
        }
    }

    updateHandValue(value: number, isSoft: boolean, softValue: number | undefined, status: string, handIndex?: number) {
        let handValueEl: HTMLElement | null;

        if (handIndex !== undefined) {
            handValueEl = this.container.querySelector(`#hand-value-${this.playerId}-${handIndex}`);
        } else {
            handValueEl = this.container.querySelector(`#hand-value-${this.playerId}`);
        }

        const handValueNumEl = handValueEl?.querySelector('.hand-value-num');
        if (handValueEl && handValueNumEl) {
            handValueEl.style.opacity = '1';

            if (status === 'blackjack') {
                handValueNumEl.textContent = 'BJ';
                handValueNumEl.className = 'hand-value-num neon-blackjack-badge px-3 py-1 rounded-full text-sm font-black';
            } else if (value > 21) {
                handValueNumEl.className = 'hand-value-num neon-bust-value px-3 py-1 rounded-full text-sm font-bold';
                handValueNumEl.textContent = value.toString();
            } else {
                handValueNumEl.className = 'hand-value-num neon-value-badge px-3 py-1 rounded-full text-sm font-bold';

                if (isSoft && softValue !== undefined && value !== 21) {
                    handValueNumEl.textContent = `${softValue}/${value}`;
                } else {
                    handValueNumEl.textContent = value.toString();
                }
            }
        }
    }

    createCardElement(card: Card): HTMLElement {
        const cardEl = document.createElement('div');
        cardEl.className = 'neon-card w-20 h-28 flex flex-col items-center justify-between p-2 select-none relative flex-shrink-0';

        const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
        const colorClass = isRed ? 'text-red-500' : 'text-slate-800';
        const suitSymbol = this.getSuitSymbol(card.suit);

        cardEl.innerHTML = `
            <div class="w-full text-left text-lg font-bold ${colorClass} leading-none">${card.rank}</div>
            <div class="text-4xl ${colorClass}">${suitSymbol}</div>
            <div class="w-full text-right text-lg font-bold ${colorClass} leading-none transform rotate-180">${card.rank}</div>
        `;
        return cardEl;
    }

    renderSplitHands(player: Player, animate: boolean = false): Promise<void> {
        return new Promise(async (resolve) => {
            if (!player.splitHands || player.splitHands.length === 0) {
                resolve();
                return;
            }

            this.clearCards();

            const splitContainer = document.createElement('div');
            splitContainer.className = 'flex gap-6 justify-center items-start';

            // Create hand containers first (empty)
            const handContainers: { handDiv: HTMLElement, cardsDiv: HTMLElement }[] = [];

            player.splitHands.forEach((hand, handIndex) => {
                const handDiv = document.createElement('div');
                const isActive = handIndex === player.currentSplitIndex;

                handDiv.className = `flex flex-col items-center gap-2 relative transition-all duration-300 ${isActive ? 'scale-105' : 'opacity-60 scale-95'}`;

                // Hand Value
                const valueDiv = document.createElement('div');
                valueDiv.id = `hand-value-${player.id}-${handIndex}`;
                valueDiv.className = 'absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 transition-opacity z-20';
                valueDiv.innerHTML = `<div class="hand-value-num neon-value-badge px-2 py-0.5 rounded-full text-xs font-bold">0</div>`;
                handDiv.appendChild(valueDiv);

                // Indicator
                const indicator = document.createElement('div');
                indicator.className = `text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-neon-blue' : 'text-white/30'}`;
                indicator.textContent = `Hand ${handIndex + 1}`;
                handDiv.appendChild(indicator);

                // Cards container (empty initially if animating)
                const cardsDiv = document.createElement('div');
                cardsDiv.className = 'flex items-center justify-center h-28';
                cardsDiv.id = `split-hand-${player.id}-${handIndex}`;

                handDiv.appendChild(cardsDiv);
                splitContainer.appendChild(handDiv);
                handContainers.push({ handDiv, cardsDiv });
            });

            this.cardsContainer.appendChild(splitContainer);

            if (animate) {
                // Animate split: first show cards sliding apart, then deal second cards
                for (let handIndex = 0; handIndex < player.splitHands.length; handIndex++) {
                    const hand = player.splitHands[handIndex];
                    const { cardsDiv } = handContainers[handIndex];

                    // Add first card with slide animation
                    if (hand.length > 0) {
                        const cardEl = this.createCardElement(hand[0]);
                        cardEl.style.zIndex = '1';
                        cardsDiv.appendChild(cardEl);

                        // Slide animation from center
                        const slideDir = handIndex === 0 ? 50 : -50;
                        cardEl.animate([
                            { transform: `translateX(${slideDir}px)`, opacity: 0.7 },
                            { transform: 'translateX(0)', opacity: 1 }
                        ], {
                            duration: 400,
                            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                        });
                    }
                }

                // Wait for slide animation
                await new Promise(r => setTimeout(r, 500));

                // Now deal second cards to each hand with animation
                for (let handIndex = 0; handIndex < player.splitHands.length; handIndex++) {
                    const hand = player.splitHands[handIndex];
                    const { cardsDiv } = handContainers[handIndex];

                    if (hand.length > 1) {
                        const cardEl = this.createCardElement(hand[1]);
                        cardEl.style.zIndex = '2';
                        cardEl.style.marginLeft = '-50px';
                        cardsDiv.appendChild(cardEl);

                        // Deal animation from top
                        const animation = cardEl.animate([
                            { transform: 'translateY(-100vh) rotate(180deg) scale(0.5)', opacity: 0 },
                            { transform: 'translateY(0) rotate(0deg) scale(1)', opacity: 1 }
                        ], {
                            duration: 500,
                            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                        });

                        await new Promise(r => animation.onfinish = () => r(undefined));
                        await new Promise(r => setTimeout(r, 200));
                    }
                }
            } else {
                // No animation - just render all cards
                player.splitHands.forEach((hand, handIndex) => {
                    const { cardsDiv } = handContainers[handIndex];
                    hand.forEach((card, cardIndex) => {
                        const cardEl = this.createCardElement(card);
                        cardEl.style.zIndex = `${cardIndex + 1}`;
                        if (cardIndex > 0) cardEl.style.marginLeft = '-50px';
                        cardsDiv.appendChild(cardEl);
                    });
                });
            }

            resolve();
        });
    }

    addCard(card: Card, splitIndex?: number): Promise<void> {
        return new Promise(resolve => {
            const cardEl = this.createCardElement(card);

            let targetContainer = this.cardsContainer;
            let isSplit = false;

            if (splitIndex !== undefined) {
                const splitDiv = this.container.querySelector(`#split-hand-${this.playerId}-${splitIndex}`);
                if (splitDiv) {
                    targetContainer = splitDiv as HTMLElement;
                    isSplit = true;
                }
            }

            const childCount = targetContainer.children.length;

            if (isSplit) {
                cardEl.style.marginLeft = childCount > 0 ? '-50px' : '0';
                cardEl.style.zIndex = `${childCount + 1}`;
                targetContainer.appendChild(cardEl);

                const animation = cardEl.animate([
                    { transform: 'translateY(-100vh) rotate(180deg) scale(0.5)', opacity: 0 },
                    { transform: 'translateY(0) rotate(0deg) scale(1)', opacity: 1 }
                ], {
                    duration: 600,
                    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                });
                animation.onfinish = () => resolve();
            } else {
                // Normale Hand: Nutze marginLeft für Überlappung
                cardEl.style.marginLeft = childCount > 0 ? '-50px' : '0';
                cardEl.style.transform = `rotate(${(childCount - 0.5) * 3}deg)`;
                cardEl.style.zIndex = `${childCount}`;

                targetContainer.appendChild(cardEl);

                const animation = cardEl.animate([
                    { transform: 'translateY(-100vh) rotate(180deg) scale(0.5)', opacity: 0 },
                    { transform: `rotate(${(childCount - 0.5) * 3}deg) scale(1)`, opacity: 1 }
                ], {
                    duration: 600,
                    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                });
                animation.onfinish = () => resolve();
            }
        });
    }

    updateSplitHandsState(player: Player) {
        if (!player.splitHands) return;

        // Update active/inactive state for each hand without re-rendering cards
        player.splitHands.forEach((_, handIndex) => {
            const handDiv = this.container.querySelector(`#split-hand-${player.id}-${handIndex}`)?.parentElement;
            if (handDiv) {
                const isActive = handIndex === player.currentSplitIndex;
                handDiv.className = `flex flex-col items-center gap-2 relative transition-all duration-300 ${isActive ? 'scale-105' : 'opacity-60 scale-95'}`;

                const indicator = handDiv.querySelector('div:first-of-type:not(.hand-value)');
                if (indicator && indicator.textContent?.startsWith('Hand')) {
                    indicator.className = `text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-neon-blue' : 'text-white/30'}`;
                }
            }
        });
    }

    clearCards() {
        this.cardsContainer.innerHTML = '';

        // Reset Value Displays
        const valueEls = this.container.querySelectorAll('.hand-value');
        valueEls.forEach(el => (el as HTMLElement).style.opacity = '0');

        // Reset Bust Badge
        const bustBadge = this.container.querySelector(`.bust-badge`) as HTMLElement;
        if (bustBadge) {
            bustBadge.style.opacity = '0';
            bustBadge.style.transform = 'translateX(-50%) scale(0.8)';
        }

        // Reset Panel Styling
        this.infoContainer.classList.remove('neon-bust-panel', 'neon-blackjack-panel');
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
