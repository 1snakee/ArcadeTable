export class BackgroundManager {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number = 0;
    height: number = 0;
    animationId: number = 0;

    // Configuration
    mode: 'SETUP' | 'TABLE' = 'SETUP';

    // Colors
    setupColors: string[] = [
        '#a855f7', // Purple 500
        '#3b82f6', // Blue 500
        '#ec4899', // Pink 500
        '#06b6d4', // Cyan 500
        '#8b5cf6'  // Violet 500
    ];

    tableColors: string[] = [
        '#8a2be2', // Blue Violet
        '#00bfff', // Deep Sky Blue
        '#ff00ff', // Magenta
        '#ff1493', // Deep Pink
        '#4b0082'  // Indigo
    ];

    blobs: Blob[] = [];
    particles: Particle[] = [];

    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d')!;
        this.init();
    }

    init() {
        this.canvas.id = 'background-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.transition = 'filter 1s ease';
        document.body.appendChild(this.canvas);

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.createBlobs();
        this.createParticles();
        this.animate();
    }

    setMode(mode: 'SETUP' | 'TABLE') {
        this.mode = mode;
        const targetColors = mode === 'SETUP' ? this.setupColors : this.tableColors;

        this.blobs.forEach(blob => {
            blob.targetColor = targetColors[Math.floor(Math.random() * targetColors.length)];
        });

        this.particles.forEach(particle => {
            particle.targetColor = targetColors[Math.floor(Math.random() * targetColors.length)];
        });
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    createBlobs() {
        this.blobs = [];
        const blobCount = 6;
        for (let i = 0; i < blobCount; i++) {
            this.blobs.push(new Blob(this.width, this.height, this.setupColors));
        }
    }

    createParticles() {
        this.particles = [];
        const particleCount = 60;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(this.width, this.height, this.setupColors));
        }
    }

    animate() {
        // Clear with mode-specific base color
        if (this.mode === 'SETUP') {
            // Lighter, more transparent base for setup
            this.ctx.fillStyle = '#1a1a2e';
        } else {
            // Deep dark base for table
            this.ctx.fillStyle = '#050505';
        }

        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Blobs
        this.blobs.forEach(blob => {
            blob.update(this.width, this.height, this.mode);
            blob.draw(this.ctx);
        });

        // Draw Particles
        this.particles.forEach(particle => {
            particle.update(this.width, this.height);
            particle.draw(this.ctx);
        });

        // Overlay Gradient
        const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        if (this.mode === 'SETUP') {
            gradient.addColorStop(0, 'rgba(30, 30, 50, 0.1)');
            gradient.addColorStop(1, 'rgba(40, 30, 60, 0.2)');
        } else {
            gradient.addColorStop(0, 'rgba(10, 10, 20, 0.2)');
            gradient.addColorStop(1, 'rgba(20, 10, 30, 0.4)');
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

class Blob {
    x: number;
    y: number;
    radius: number;
    color: string;
    targetColor: string;
    vx: number;
    vy: number;
    angle: number;
    angleSpeed: number;

    constructor(w: number, h: number, colors: string[]) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.radius = Math.random() * 200 + 150;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.targetColor = this.color;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.angle = Math.random() * Math.PI * 2;
        this.angleSpeed = (Math.random() - 0.5) * 0.002;
    }

    update(w: number, h: number, mode: 'SETUP' | 'TABLE') {
        this.x += this.vx * (mode === 'TABLE' ? 1.5 : 1);
        this.y += this.vy * (mode === 'TABLE' ? 1.5 : 1);
        this.angle += this.angleSpeed;

        // Bounce off edges
        if (this.x < -this.radius) this.x = w + this.radius;
        if (this.x > w + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = h + this.radius;
        if (this.y > h + this.radius) this.y = -this.radius;

        this.color = this.targetColor;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.globalAlpha = 0.4;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class Particle {
    x: number;
    y: number;
    size: number;
    color: string;
    targetColor: string;
    vx: number;
    vy: number;
    alpha: number;
    alphaSpeed: number;

    constructor(w: number, h: number, colors: string[]) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 3 + 1;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.targetColor = this.color;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.alpha = Math.random();
        this.alphaSpeed = (Math.random() - 0.5) * 0.01;
    }

    update(w: number, h: number) {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha += this.alphaSpeed;

        if (this.alpha <= 0 || this.alpha >= 1) {
            this.alphaSpeed *= -1;
        }

        if (this.x < 0) this.x = w;
        if (this.x > w) this.x = 0;
        if (this.y < 0) this.y = h;
        if (this.y > h) this.y = 0;

        this.color = this.targetColor;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
