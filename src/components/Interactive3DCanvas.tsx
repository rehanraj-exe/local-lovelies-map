import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  ox: number;
  oy: number;
  oz: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  color: string;
}

export const Interactive3DCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // 3D Projection Parameters
    const fov = 400;
    const particleCount = Math.min(60, Math.floor((width * height) / 25000));
    const particles: Particle[] = [];

    // Colors aligned with Re:Local visual identity (primary purple, indigo, glow)
    const colors = [
      'rgba(139, 92, 246, ',  // Purple/Violet
      'rgba(99, 102, 241, ',  // Indigo
      'rgba(236, 72, 153, ',  // Pink
      'rgba(59, 130, 246, ',  // Blue
    ];

    // Initialize 3D particles
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * width * 1.5;
      const y = (Math.random() - 0.5) * height * 1.5;
      const z = Math.random() * fov * 2;
      particles.push({
        x,
        y,
        z,
        ox: x,
        oy: y,
        oz: z,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX - width / 2;
      mouseRef.current.targetY = e.clientY - height / 2;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Detect dark theme dynamically
      const isDark = document.documentElement.classList.contains('dark');
      const opacityMultiplier = isDark ? 0.8 : 1.8;
      const lineMultiplier = isDark ? 1.0 : 2.5;

      // Smooth mouse transition
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      const scrollY = window.scrollY;

      // Project and draw particles
      particles.forEach((p) => {
        // Apply rotation based on mouse coordinates (3D feel)
        const angleX = mouse.y * 0.0002;
        const angleY = mouse.x * 0.0002;

        // 3D Y-rotation
        let x1 = p.x * Math.cos(angleY) - p.z * Math.sin(angleY);
        let z1 = p.z * Math.cos(angleY) + p.x * Math.sin(angleY);

        // 3D X-rotation
        let y2 = p.y * Math.cos(angleX) - z1 * Math.sin(angleX);
        let z2 = z1 * Math.cos(angleX) + p.y * Math.sin(angleX);

        // Slow constant depth movement
        z2 -= 0.5;
        if (z2 <= 0) {
          z2 = fov * 2;
        }
        p.z = z2;

        // Incorporate scroll parallax (depth offset)
        const scrollOffset = scrollY * (1 - z2 / (fov * 2)) * 0.4;
        const projectedY = y2 + scrollOffset;

        // Perspective projection calculation
        const scale = fov / (fov + z2);
        const projX = x1 * scale + width / 2;
        const projY = projectedY * scale + height / 2;
        const r = p.radius * scale * 2;

        // Only draw if on screen
        if (projX >= 0 && projX <= width && projY >= 0 && projY <= height) {
          // Glow effect gradient
          const grad = ctx.createRadialGradient(projX, projY, 0, projX, projY, r * 3);
          const opacity = Math.min(1.0, scale * 0.7 * (1 - z2 / (fov * 2)) * opacityMultiplier);
          grad.addColorStop(0, p.color + `${opacity})`);
          grad.addColorStop(0.3, p.color + `${opacity * 0.4})`);
          grad.addColorStop(1, p.color + '0)');

          ctx.beginPath();
          ctx.arc(projX, projY, r * 3, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      });

      // Draw constellation connections (line links)
      for (let i = 0; i < particles.length; i++) {
        const pi = particles[i];
        const scaleI = fov / (fov + pi.z);
        const scrollOffsetI = scrollY * (1 - pi.z / (fov * 2)) * 0.4;
        const xi = pi.x * scaleI + width / 2;
        const yi = (pi.y + scrollOffsetI) * scaleI + height / 2;

        for (let j = i + 1; j < particles.length; j++) {
          const pj = particles[j];
          const scaleJ = fov / (fov + pj.z);
          const scrollOffsetJ = scrollY * (1 - pj.z / (fov * 2)) * 0.4;
          const xj = pj.x * scaleJ + width / 2;
          const yj = (pj.y + scrollOffsetJ) * scaleJ + height / 2;

          // Compute screen distance
          const dx = xi - xj;
          const dy = yi - yj;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const opacity = Math.min(1.0, (1 - dist / 150) * 0.15 * scaleI * scaleJ * lineMultiplier);
            ctx.beginPath();
            ctx.moveTo(xi, yi);
            ctx.lineTo(xj, yj);
            ctx.strokeStyle = isDark 
              ? `rgba(139, 92, 246, ${opacity})` 
              : `rgba(99, 102, 241, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
};
