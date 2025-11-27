export class Animations {
    static async dealCard(cardElement: HTMLElement, _fromX: number, _fromY: number, _toElement: HTMLElement) {

        // Calculate relative position if needed, but for fixed elements we can use absolute coordinates
        // Actually, cardElement is appended to the slot.
        // We should start it at Deck position and animate to current position.

        // Get Deck Position (approximate top right or center top)
        // Let's assume deck is at top: 50%, -100px relative to table?
        // Or better, pass a "Deck" element reference.
        // For now, hardcode deck position as top-center of screen.
        const deckX = window.innerWidth / 2;
        const deckY = -100; // Offscreen top

        const finalRect = cardElement.getBoundingClientRect();
        const deltaX = deckX - finalRect.left - (finalRect.width / 2);
        const deltaY = deckY - finalRect.top - (finalRect.height / 2);

        // Apply initial transform
        cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.5)`;
        cardElement.style.opacity = '0';

        // Animate
        const animation = cardElement.animate([
            { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.5) rotate(180deg)`, opacity: 0 },
            { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 }
        ], {
            duration: 600,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Overshoot for "snap" effect
            fill: 'forwards'
        });

        return animation.finished;
    }

    static async chipFloat(amount: number, fromElement: HTMLElement, toElement: HTMLElement) {
        const chip = document.createElement('div');
        chip.className = 'fixed z-50 w-8 h-8 rounded-full bg-neon-green border-2 border-white shadow-[0_0_10px_rgba(57,255,20,0.8)] flex items-center justify-center text-[10px] font-bold text-black pointer-events-none';
        chip.textContent = amount.toString();
        document.body.appendChild(chip);

        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();

        const startX = fromRect.left + fromRect.width / 2 - 16;
        const startY = fromRect.top + fromRect.height / 2 - 16;

        const endX = toRect.left + toRect.width / 2 - 16;
        const endY = toRect.top + toRect.height / 2 - 16;

        chip.style.left = `${startX}px`;
        chip.style.top = `${startY}px`;

        const animation = chip.animate([
            { transform: 'translate(0, 0) scale(1)' },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.5)`, opacity: 0 }
        ], {
            duration: 500,
            easing: 'ease-in-out',
            fill: 'forwards'
        });

        await animation.finished;
        chip.remove();
    }
}
