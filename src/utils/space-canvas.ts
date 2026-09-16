interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
}

export class SpaceCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animId: number | null = null;
  private mouseX = -9999;
  private mouseY = -9999;
  private width = 0;
  private height = 0;
  private isRunning = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true })!;
    this.init();
  }

  private init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });
    window.addEventListener('mouseleave', () => {
      this.mouseX = -9999;
      this.mouseY = -9999;
    });

    this.createParticles();
    this.start();
  }

  private resize() {
    const parent = this.canvas.parentElement;
    this.width = parent ? parent.clientWidth : window.innerWidth;
    this.height = parent ? parent.clientHeight : window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
  }

  private createParticles() {
    this.particles = [];
    const count = Math.min(Math.floor((this.width * this.height) / 14000), 75);
    for (let i = 0; i < count; i++) {
      const baseAlpha = Math.random() * 0.45 + 0.15;
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: Math.random() * 1.8 + 0.8,
        alpha: baseAlpha,
        baseAlpha
      });
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    const loop = () => {
      if (!this.isRunning) return;
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const maxDist = 130;
    const mouseRadius = 160;

    // Draw connection lines
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const strength = (1 - dist / maxDist) * 0.18;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(0, 229, 255, ${strength})`;
          this.ctx.lineWidth = 0.85;
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }

    // Update & draw particles
    for (const p of this.particles) {
      // Gentle drift
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Mouse attraction / interaction
      const mdx = this.mouseX - p.x;
      const mdy = this.mouseY - p.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mDist < mouseRadius) {
        const factor = (1 - mDist / mouseRadius) * 0.03;
        p.x += mdx * factor;
        p.y += mdy * factor;
        p.alpha = Math.min(1, p.baseAlpha + (1 - mDist / mouseRadius) * 0.6);

        // Draw laser connector to mouse
        this.ctx.beginPath();
        this.ctx.strokeStyle = `rgba(0, 229, 255, ${(1 - mDist / mouseRadius) * 0.22})`;
        this.ctx.lineWidth = 0.75;
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(this.mouseX, this.mouseY);
        this.ctx.stroke();
      } else {
        p.alpha = p.baseAlpha;
      }

      // Draw particle dot
      this.ctx.beginPath();
      this.ctx.fillStyle = `rgba(0, 229, 255, ${p.alpha})`;
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}
