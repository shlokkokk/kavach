import { useEffect, useRef } from 'react';

export default function ParticleBackground({ count = 80 }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];
    
    // Interaction state
    let mouse = {
      x: null,
      y: null,
      radius: 140 // Attraction radius
    };
    
    const resize = () => {
      // If parent is hero, we want it to match parent, but window size is safer for full-screen hero
      const parent = canvas.parentElement;
      canvas.width = parent ? parent.clientWidth : window.innerWidth;
      canvas.height = parent ? parent.clientHeight : window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    const handleMouseMove = (event) => {
      // Adjust for canvas position relative to viewport
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    };
    
    const handleMouseOut = () => {
      mouse.x = null;
      mouse.y = null;
    };
    
    let ripples = [];
    const handleClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      
      // Only trigger if click is inside this canvas area
      if (clickX < 0 || clickX > canvas.width || clickY < 0 || clickY > canvas.height) return;
      
      ripples.push({
        x: clickX,
        y: clickY,
        radius: 0,
        maxRadius: 200,
        alpha: 0.5
      });
      
      // Explosive force on particles
      particles.forEach(p => {
        const dx = p.x - clickX;
        const dy = p.y - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          p.vx += (dx / dist) * force * 10; // Softer push
          p.vy += (dy / dist) * force * 10;
        }
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('click', handleClick);
    
    // Create particles with simulated 3D depth
    for (let i = 0; i < count; i++) {
      const z = Math.random() * 3 + 1; // Depth from 1 to 4
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        baseVx: (Math.random() - 0.5) * 0.8,
        baseVy: (Math.random() - 0.5) * 0.8,
        z: z,
        baseRadius: (Math.random() * 2 + 1) * (1.5 / z), // Closer (lower z) are bigger
        radius: 0,
        color: `rgba(0, 255, 178, ${0.9 / z})`,
        glowColor: `rgba(0, 255, 178, ${0.5 / z})`
      });
      particles[i].radius = particles[i].baseRadius;
    }
    
    const animate = () => {
      // Clear with slight trail effect
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw soft gradient shockwave flashes
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 8;
        r.alpha -= 0.02;
        
        if (r.alpha <= 0) {
          ripples.splice(i, 1);
          continue;
        }
        
        const gradient = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, r.radius);
        gradient.addColorStop(0, `rgba(0, 255, 178, 0)`);
        gradient.addColorStop(0.8, `rgba(0, 255, 178, ${r.alpha * 0.15})`);
        gradient.addColorStop(1, `rgba(0, 255, 178, 0)`);
        
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      
      particles.forEach((p, i) => {
        // Friction: gradually return to base velocity after explosion
        p.vx += (p.baseVx - p.vx) * 0.04;
        p.vy += (p.baseVy - p.vy) * 0.04;
        
        // Mouse interaction (Swarm + Connect)
        if (mouse.x !== null && mouse.y !== null) {
          let dx = mouse.x - p.x;
          let dy = mouse.y - p.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < mouse.radius) {
            // Laser connection to mouse
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(0, 255, 178, ${0.6 * (1 - distance / mouse.radius)})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // Swirl / Vortex physics around the mouse
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            
            // Attract (gravity) + Tangent (swirl)
            p.vx += forceDirectionX * force * 0.4 - forceDirectionY * force * 0.2;
            p.vy += forceDirectionY * force * 0.4 + forceDirectionX * force * 0.2;
            
            // Node lights up when near mouse
            p.radius = p.baseRadius * 1.3;
          } else {
            p.radius = p.baseRadius;
          }
        } else {
          p.radius = p.baseRadius;
        }
        
        // Speed limit
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 8) {
          p.vx = (p.vx / speed) * 8;
          p.vy = (p.vy / speed) * 8;
        }
        
        // Apply velocity
        p.x += p.vx;
        p.y += p.vy;
        
        // Smooth wrap around bounds
        if (p.x < -50) p.x = canvas.width + 50;
        if (p.x > canvas.width + 50) p.x = -50;
        if (p.y < -50) p.y = canvas.height + 50;
        if (p.y > canvas.height + 50) p.y = -50;
        
        // Draw Glowing Node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = p.radius * 4; // Dynamic glow based on size
        ctx.shadowColor = p.glowColor;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset for lines to keep them crisp
        
        // Draw Constellation Web
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const maxDist = 120;
          if (dist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 255, 178, ${0.4 * (1 - dist / maxDist)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });
      
      animId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('click', handleClick);
    };
  }, [count]);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
