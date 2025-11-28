export type AnimationPhase = 'IDLE' | 'ORBITING' | 'ACCELERATING' | 'MERGING' | 'PULSING';

export interface ParticleAnimationConfig {
    canvas: HTMLCanvasElement;
    centerX: number;
    centerY: number;
    orbitRadius: number;
    particleRadius: number;
    color1: string; // Player color
    color2: string; // House color
}

export class ParticleAnimation {
    private ctx: CanvasRenderingContext2D;
    private config: ParticleAnimationConfig;
    private animationId: number | null = null;
    private phase: AnimationPhase = 'IDLE';
    private startTime: number = 0;

    // Particle A (Player - Blue)
    private angleA: number = 0;

    // Particle B (House - Violet)
    private angleB: number = Math.PI; // Opposite side

    // Animation parameters
    private orbitSpeed: number = 2; // radians per second
    private accelerationFactor: number = 1;
    private pulseRadius: number = 0;
    private pulseColor: string = '';

    constructor(config: ParticleAnimationConfig) {
        this.config = config;
        const ctx = config.canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');
        this.ctx = ctx;

        // Set canvas resolution for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        config.canvas.width = config.canvas.offsetWidth * dpr;
        config.canvas.height = config.canvas.offsetHeight * dpr;
        this.ctx.scale(dpr, dpr);
    }

    start(winningColor: string, onComplete: () => void): void {
        this.phase = 'ORBITING';
        this.startTime = performance.now();
        this.pulseColor = winningColor;

        const animate = (timestamp: number) => {
            const elapsed = (timestamp - this.startTime) / 1000;

            this.clear();

            if (this.phase === 'ORBITING') {
                this.updateOrbit(elapsed);
                this.drawOrbitingParticles();

                if (elapsed > 2.5) {
                    this.phase = 'ACCELERATING';
                    this.startTime = timestamp;
                }
            } else if (this.phase === 'ACCELERATING') {
                this.updateAcceleration(elapsed);
                this.drawOrbitingParticles();

                if (elapsed > 0.5) {
                    this.phase = 'MERGING';
                    this.startTime = timestamp;
                }
            } else if (this.phase === 'MERGING') {
                this.updateMerge(elapsed);
                this.drawMergingParticles(elapsed / 0.3);

                if (elapsed > 0.3) {
                    this.phase = 'PULSING';
                    this.startTime = timestamp;
                }
            } else if (this.phase === 'PULSING') {
                this.updatePulse(elapsed);
                this.drawPulse();

                if (elapsed > 0.6) {
                    this.phase = 'IDLE';
                    this.stop();
                    onComplete();
                    return;
                }
            }

            this.animationId = requestAnimationFrame(animate);
        };

        this.animationId = requestAnimationFrame(animate);
    }

    private updateOrbit(elapsed: number): void {
        this.angleA = (this.orbitSpeed * elapsed) % (Math.PI * 2);
        this.angleB = this.angleA + Math.PI;
    }

    private updateAcceleration(elapsed: number): void {
        this.accelerationFactor = 1 + elapsed * 4;
        this.angleA = (this.orbitSpeed * elapsed * this.accelerationFactor) % (Math.PI * 2);
        this.angleB = this.angleA + Math.PI;
    }

    private updateMerge(elapsed: number): void {
        // Particles spiral inward
        this.angleA += elapsed * 10;
        this.angleB += elapsed * 10;
    }

    private updatePulse(elapsed: number): void {
        this.pulseRadius = elapsed * 200; // Expand outward
    }

    private drawOrbitingParticles(): void {
        const { centerX, centerY, orbitRadius, particleRadius, color1, color2 } = this.config;

        // Particle A (Player - Blue)
        const x1 = centerX + Math.cos(this.angleA) * orbitRadius;
        const y1 = centerY + Math.sin(this.angleA) * orbitRadius;
        this.drawParticle(x1, y1, particleRadius, color1);

        // Particle B (House - Violet)
        const x2 = centerX + Math.cos(this.angleB) * orbitRadius;
        const y2 = centerY + Math.sin(this.angleB) * orbitRadius;
        this.drawParticle(x2, y2, particleRadius, color2);
    }

    private drawMergingParticles(progress: number): void {
        const { centerX, centerY, orbitRadius, particleRadius, color1, color2 } = this.config;

        const currentRadius = orbitRadius * (1 - progress);

        const x1 = centerX + Math.cos(this.angleA) * currentRadius;
        const y1 = centerY + Math.sin(this.angleA) * currentRadius;
        this.drawParticle(x1, y1, particleRadius, color1);

        const x2 = centerX + Math.cos(this.angleB) * currentRadius;
        const y2 = centerY + Math.sin(this.angleB) * currentRadius;
        this.drawParticle(x2, y2, particleRadius, color2);
    }

    private drawParticle(x: number, y: number, radius: number, color: string): void {
        // Draw glow
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, `${color}80`);
        gradient.addColorStop(1, `${color}00`);

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw core
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    private drawPulse(): void {
        const { centerX, centerY } = this.config;

        // Draw expanding pulse ring
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, this.pulseRadius * 0.8,
            centerX, centerY, this.pulseRadius
        );
        gradient.addColorStop(0, `${this.pulseColor}00`);
        gradient.addColorStop(0.5, this.pulseColor);
        gradient.addColorStop(1, `${this.pulseColor}00`);

        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 20;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, this.pulseRadius, 0, Math.PI * 2);
        this.ctx.stroke();

        // Draw center glow
        const centerGlow = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50);
        centerGlow.addColorStop(0, this.pulseColor);
        centerGlow.addColorStop(1, `${this.pulseColor}00`);

        this.ctx.fillStyle = centerGlow;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
        this.ctx.fill();
    }

    private clear(): void {
        const { canvas } = this.config;
        this.ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    }

    stop(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.phase = 'IDLE';
    }

    reset(): void {
        this.stop();
        this.angleA = 0;
        this.angleB = Math.PI;
        this.accelerationFactor = 1;
        this.pulseRadius = 0;
        this.clear();
    }
}
