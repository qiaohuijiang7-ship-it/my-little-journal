/**
 * MY LITTLE JOURNAL - Magic Wand Cursor & Particle Engine
 * High-performance canvas-based particle trail & click/touch sparkles.
 * Pointer-events none, 60fps lightweight animation.
 */

const Cursor = (() => {
  let canvas = null;
  let ctx = null;
  let particles = [];
  let isRunning = false;
  let lastX = 0;
  let lastY = 0;
  let lastMoveTime = 0;

  const COLORS = [
    '#F4B8CD', // Sweet pink
    '#D8C5E8', // Lavender
    '#FFF275', // Star gold
    '#C9D9EA', // Misty blue
    '#FFFDF8'  // Pearl cream
  ];

  class Particle {
    constructor(x, y, type = 'star', speedMult = 1) {
      this.x = x;
      this.y = y;
      this.type = type; // 'star' | 'heart' | 'dot'
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 2 + 0.8) * speedMult;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - (speedMult > 1 ? 0.8 : 0.2); // slight float up
      
      this.size = Math.random() * 4 + 3.5;
      this.alpha = 1;
      this.decay = Math.random() * 0.025 + 0.02;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.15;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.03; // delicate gravity
      this.alpha -= this.decay;
      this.rotation += this.rotationSpeed;
      return this.alpha > 0;
    }

    draw(ctx) {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle = this.color;
      ctx.strokeStyle = this.color;

      if (this.type === 'star') {
        const r = this.size;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.quadraticCurveTo(0, 0, 0, r);
        ctx.quadraticCurveTo(0, 0, -r, 0);
        ctx.quadraticCurveTo(0, 0, 0, -r);
        ctx.fill();
      } else if (this.type === 'heart') {
        const s = this.size * 0.7;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.4);
        ctx.bezierCurveTo(-s, -s * 1.2, -s * 1.5, s * 0.2, 0, s * 1.4);
        ctx.bezierCurveTo(s * 1.5, s * 0.2, s, -s * 1.2, 0, -s * 0.4);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  const loop = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (p.update()) {
        p.draw(ctx);
      } else {
        particles.splice(i, 1);
      }
    }

    if (particles.length > 0) {
      requestAnimationFrame(loop);
      isRunning = true;
    } else {
      isRunning = false;
    }
  };

  const startLoop = () => {
    if (!isRunning) {
      isRunning = true;
      requestAnimationFrame(loop);
    }
  };

  const resize = () => {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  const canAnimate = () => {
    const settings = typeof window.JournalStorage !== 'undefined' ? window.JournalStorage.getSettings() : { animationEnabled: true };
    return Boolean(settings && settings.animationEnabled);
  };

  return {
    init() {
      canvas = document.getElementById('particles-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'particles-canvas';
        document.body.appendChild(canvas);
      }
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '999999';
      ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);

      // Mouse Move: Throttled trail particles
      window.addEventListener('mousemove', (e) => {
        if (!canAnimate()) return;
        const now = Date.now();
        const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
        if (now - lastMoveTime > 35 && dist > 14) {
          lastMoveTime = now;
          lastX = e.clientX;
          lastY = e.clientY;

          const types = ['star', 'dot', 'star'];
          const type = types[Math.floor(Math.random() * types.length)];
          particles.push(new Particle(e.clientX, e.clientY, type, 0.5));
          startLoop();
        }
      });

      // Mouse Click: Sparkle & heart burst
      window.addEventListener('click', (e) => {
        if (!canAnimate()) return;
        this.burst(e.clientX, e.clientY);
      });

      // Mobile Touch Burst
      window.addEventListener('touchstart', (e) => {
        if (!canAnimate()) return;
        if (e.touches && e.touches[0]) {
          this.burst(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });
    },

    burst(x, y, count = 12) {
      if (!canAnimate()) return;
      for (let i = 0; i < count; i++) {
        const types = ['star', 'heart', 'star', 'dot'];
        const type = types[Math.floor(Math.random() * types.length)];
        particles.push(new Particle(x, y, type, 1.8));
      }
      startLoop();
    }
  };
})();

// Attach to window
window.Cursor = Cursor;
