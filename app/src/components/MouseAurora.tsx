import { useEffect, useRef } from 'react';
import { getTimePalette } from '../hooks/useTimeOfDay';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    hue: number;
}

export default function MouseAurora() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const palette = getTimePalette();

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const count = 80;
        particlesRef.current = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.4 + 0.1,
            hue: Math.random() * palette.aurora.particleHueRange + palette.aurora.particleHueBase,
        }));

        const handleMouse = (e: MouseEvent) => {
            mouseRef.current.targetX = e.clientX;
            mouseRef.current.targetY = e.clientY;
        };
        window.addEventListener('mousemove', handleMouse);

        const draw = () => {
            const { width, height } = canvas;
            const mouse = mouseRef.current;

            mouse.x += (mouse.targetX - mouse.x) * 0.06;
            mouse.y += (mouse.targetY - mouse.y) * 0.06;

            ctx.clearRect(0, 0, width, height);

            // Aurora blob 1
            const g1 = ctx.createRadialGradient(
                mouse.x, mouse.y, 0,
                mouse.x, mouse.y, 400
            );
            g1.addColorStop(0, palette.aurora.blob1);
            g1.addColorStop(0.5, 'transparent');
            g1.addColorStop(1, 'transparent');
            ctx.fillStyle = g1;
            ctx.fillRect(0, 0, width, height);

            // Aurora blob 2
            const g2 = ctx.createRadialGradient(
                mouse.x + 150, mouse.y - 100, 0,
                mouse.x + 150, mouse.y - 100, 350
            );
            g2.addColorStop(0, palette.aurora.blob2);
            g2.addColorStop(0.5, 'transparent');
            g2.addColorStop(1, 'transparent');
            ctx.fillStyle = g2;
            ctx.fillRect(0, 0, width, height);

            const particles = particlesRef.current;
            for (const p of particles) {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 300) {
                    const force = (300 - dist) / 300 * 0.008;
                    p.vx += dx * force * 0.01;
                    p.vy += dy * force * 0.01;
                }

                p.vx *= 0.99;
                p.vy *= 0.99;
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${p.opacity})`;
                ctx.fill();

                if (dist < 200) {
                    for (const q of particles) {
                        const ddx = p.x - q.x;
                        const ddy = p.y - q.y;
                        const d = Math.sqrt(ddx * ddx + ddy * ddy);
                        if (d < 80 && d > 0) {
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(q.x, q.y);
                            ctx.strokeStyle = `hsla(${(p.hue + q.hue) / 2}, 60%, 65%, ${0.08 * (1 - d / 80)})`;
                            ctx.lineWidth = 0.5;
                            ctx.stroke();
                        }
                    }
                }
            }

            rafRef.current = requestAnimationFrame(draw);
        };

        rafRef.current = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouse);
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[1]"
            style={{ opacity: 0.7 }}
        />
    );
}
