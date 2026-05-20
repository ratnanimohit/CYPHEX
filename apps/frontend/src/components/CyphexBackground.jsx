import { useEffect, useRef } from "react";

export function CyphexBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Floating CYPHEX particles
    const word = "CYPHEX";
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4 - 0.15,
      alpha: Math.random() * 0.18 + 0.04,
      size: Math.random() * 7 + 7,
      char: word[Math.floor(Math.random() * word.length)],
      drift: Math.random() * Math.PI * 2,
      driftSpeed: Math.random() * 0.008 + 0.003,
    }));

    // 3D oval shape params
    let angle = 0;

    function drawOval(t) {
      const cx = window.innerWidth * 0.72;
      const cy = window.innerHeight * 0.44;
      const rx = Math.min(window.innerWidth * 0.18, 220);
      const ry = Math.min(window.innerHeight * 0.38, 320);

      // Rotating 3D perspective effect — draw multiple ellipse rings
      const rings = 18;
      for (let i = 0; i < rings; i++) {
        const progress = i / rings;
        const tilt = Math.sin(t * 0.6 + progress * Math.PI) * 0.18;
        const scaleX = Math.cos(t * 0.4 + progress * 0.5) * 0.12 + 0.88;
        const alpha = 0.03 + Math.sin(progress * Math.PI) * 0.07;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tilt);
        ctx.scale(scaleX, 1);
        ctx.beginPath();
        ctx.ellipse(0, 0, rx * (0.4 + progress * 0.6), ry * (0.4 + progress * 0.6), 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,255,198,${alpha})`;
        ctx.lineWidth = i === Math.floor(rings / 2) ? 1.5 : 0.6;
        ctx.stroke();
        ctx.restore();
      }

      // Glowing core
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx * 0.9);
      grad.addColorStop(0, "rgba(0,255,198,0.07)");
      grad.addColorStop(0.5, "rgba(61,169,252,0.04)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, ry / rx);
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Equator ring highlight
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(t * 0.3) * 0.2);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 1.01, ry * 0.18, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,255,198,${0.12 + Math.sin(t) * 0.05})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    function draw(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw 3D oval
      drawOval(t);

      // Draw floating CYPHEX particles
      ctx.font = `600 ${12}px 'Inter', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const p of particles) {
        p.drift += p.driftSpeed;
        p.x += p.vx + Math.sin(p.drift) * 0.3;
        p.y += p.vy;

        if (p.y < -20) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -20) p.x = canvas.width + 10;
        if (p.x > canvas.width + 20) p.x = -10;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.font = `600 ${p.size}px 'Inter', monospace`;
        ctx.fillStyle = "#00ffc6";
        ctx.shadowColor = "rgba(0,255,198,0.4)";
        ctx.shadowBlur = 6;
        ctx.fillText(p.char, p.x, p.y);
        ctx.restore();
      }
    }

    let start = null;
    function loop(ts) {
      if (!start) start = ts;
      const t = (ts - start) / 1000;
      draw(t);
      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
