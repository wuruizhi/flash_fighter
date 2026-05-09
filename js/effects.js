/* ============================================
   Flash Fighter - Visual Effects System
   Motion trails, energy bursts, afterimages
   ============================================ */
FF.Effects = class {
    constructor() {
        this.particles = [];
        this.shakeAmount = 0; this.shakeDuration = 0; this.shakeTime = 0;
        this.slowMo = 1; this.slowMoTimer = 0;
        this.damageNumbers = [];
        this.flashes = [];
        this.trails = [];       // Motion blur trails
        this.afterimages = [];  // Ghost afterimages
        this.energyBursts = []; // Energy ring effects
        this.slashLines = [];   // Slash arc lines
        this.screenFlash = 0;   // Full screen white flash
        this.comboDisplay = { count: 0, timer: 0, x: 0, y: 0, scale: 1 };
        this.comboFireParticles = [];
    }

    update(dt) {
        if (this.shakeTime > 0) { this.shakeTime -= dt; if (this.shakeTime <= 0) this.shakeAmount = 0; }
        if (this.slowMoTimer > 0) { this.slowMoTimer -= dt; if (this.slowMoTimer <= 0) this.slowMo = 1; }
        if (this.screenFlash > 0) this.screenFlash -= dt * 0.005;

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt * 0.06; p.y += p.vy * dt * 0.06;
            p.vy += (p.gravity || 0.15) * dt * 0.06;
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);
            if (p.size > 0.5) p.size *= (p.shrink || 0.99);
            if (p.life <= 0) this.particles.splice(i, 1);
        }
        // Damage numbers
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const d = this.damageNumbers[i];
            d.y -= 0.8; d.life -= dt;
            d.alpha = Math.max(0, d.life / d.maxLife);
            d.scale = 1 + (1 - d.alpha) * 0.3;
            if (d.life <= 0) this.damageNumbers.splice(i, 1);
        }
        // Flashes
        for (let i = this.flashes.length - 1; i >= 0; i--) {
            this.flashes[i].life -= dt;
            if (this.flashes[i].life <= 0) this.flashes.splice(i, 1);
        }
        // Trails
        for (let i = this.trails.length - 1; i >= 0; i--) {
            this.trails[i].life -= dt;
            this.trails[i].alpha = Math.max(0, this.trails[i].life / this.trails[i].maxLife);
            if (this.trails[i].life <= 0) this.trails.splice(i, 1);
        }
        // Afterimages
        for (let i = this.afterimages.length - 1; i >= 0; i--) {
            this.afterimages[i].life -= dt;
            this.afterimages[i].alpha = Math.max(0, this.afterimages[i].life / this.afterimages[i].maxLife) * 0.4;
            if (this.afterimages[i].life <= 0) this.afterimages.splice(i, 1);
        }
        // Energy bursts
        for (let i = this.energyBursts.length - 1; i >= 0; i--) {
            const e = this.energyBursts[i];
            e.life -= dt; e.radius += dt * e.speed;
            e.alpha = Math.max(0, e.life / e.maxLife);
            if (e.life <= 0) this.energyBursts.splice(i, 1);
        }
        // Slash lines
        for (let i = this.slashLines.length - 1; i >= 0; i--) {
            this.slashLines[i].life -= dt;
            this.slashLines[i].alpha = Math.max(0, this.slashLines[i].life / this.slashLines[i].maxLife);
            if (this.slashLines[i].life <= 0) this.slashLines.splice(i, 1);
        }
        // Combo display
        if (this.comboDisplay.timer > 0) {
            this.comboDisplay.timer -= dt;
            this.comboDisplay.scale *= 0.95;
            if (this.comboDisplay.scale < 1) this.comboDisplay.scale = 1;
        }
        // Combo fire
        for (let i = this.comboFireParticles.length - 1; i >= 0; i--) {
            const p = this.comboFireParticles[i];
            p.y -= 1.2; p.x += (Math.random() - 0.5) * 1.5;
            p.life -= dt; p.alpha = Math.max(0, p.life / p.maxLife);
            p.size *= 0.97;
            if (p.life <= 0) this.comboFireParticles.splice(i, 1);
        }
    }

    getShakeOffset() {
        if (this.shakeTime <= 0) return { x: 0, y: 0 };
        const i = this.shakeAmount * (this.shakeTime / this.shakeDuration);
        return { x: (Math.random() - 0.5) * i * 2, y: (Math.random() - 0.5) * i * 2 };
    }

    shake(amount, duration) { this.shakeAmount = amount; this.shakeDuration = duration; this.shakeTime = duration; }
    slowMotion(factor, duration) { this.slowMo = factor; this.slowMoTimer = duration; }

    // === PARTICLE SPAWNERS ===

    spawnHitParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 3 + Math.random() * 7;
            this.particles.push({
                x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 3,
                size: 2 + Math.random() * 5, color: color || '#FFD700',
                life: 250 + Math.random() * 350, maxLife: 600, alpha: 1, gravity: 0.12, shrink: 0.98
            });
        }
        // Add spark streaks
        for (let i = 0; i < Math.min(count, 6); i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 5 + Math.random() * 8;
            this.particles.push({
                x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 4,
                size: 1, color: '#FFF',
                life: 100 + Math.random() * 150, maxLife: 250, alpha: 1, gravity: 0.08, shrink: 1.0
            });
        }
    }

    spawnDust(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 30, y,
                vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 3,
                size: 4 + Math.random() * 6, color: 'rgba(180,160,120,0.6)',
                life: 300 + Math.random() * 200, maxLife: 500, alpha: 1, gravity: 0.05, shrink: 0.97
            });
        }
    }

    // Energy attack particles (for heavy/special attacks)
    spawnEnergyParticles(x, y, facing, color, count) {
        for (let i = 0; i < count; i++) {
            const a = (Math.random() - 0.5) * 1.2;
            const spd = 4 + Math.random() * 6;
            this.particles.push({
                x, y: y + (Math.random() - 0.5) * 30,
                vx: facing * spd + Math.cos(a) * 2, vy: Math.sin(a) * spd - 1,
                size: 3 + Math.random() * 6, color,
                life: 200 + Math.random() * 300, maxLife: 500, alpha: 1, gravity: 0, shrink: 0.96
            });
        }
    }

    // Afterimage ghost
    addAfterimage(x, y, facing, color) {
        this.afterimages.push({ x, y, facing, color, life: 200, maxLife: 200, alpha: 0.4 });
    }

    // Slash arc effect
    addSlashArc(x, y, facing, color, radius) {
        this.slashLines.push({
            x, y, facing, color: color || '#FFF', radius: radius || 60,
            startAngle: -Math.PI * 0.6, endAngle: Math.PI * 0.3,
            life: 150, maxLife: 150, alpha: 1
        });
    }

    // Energy ring burst
    addEnergyBurst(x, y, color, maxRadius) {
        this.energyBursts.push({
            x, y, color: color || '#FFD700', radius: 5,
            maxRadius: maxRadius || 80, speed: 0.3,
            life: 300, maxLife: 300, alpha: 1
        });
    }

    // Full screen flash
    flashScreen(intensity) { this.screenFlash = intensity || 0.6; }

    // Ground impact
    groundImpact(x, y) {
        this.spawnDust(x, y);
        this.addEnergyBurst(x, y, 'rgba(255,200,100,0.5)', 50);
        this.shake(4, 100);
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x + (Math.random()-0.5)*40, y, vx: 0, vy: 0,
                size: 2+Math.random()*3, color: '#888',
                life: 200, maxLife: 200, alpha: 0.5, gravity: -0.05, shrink: 0.95
            });
        }
    }

    addDamageNumber(x, y, damage, isCrit) {
        this.damageNumbers.push({
            x: x + (Math.random() - 0.5) * 20, y: y - 20,
            damage: Math.round(damage),
            color: isCrit ? '#FF4444' : '#FFFFFF',
            life: 800, maxLife: 800, alpha: 1,
            scale: isCrit ? 2.2 : 1.5
        });
    }

    addHitFlash(x, y) {
        this.flashes.push({ x, y, life: 100, maxLife: 100, size: 35 + Math.random() * 25 });
    }

    updateCombo(count, x, y) {
        this.comboDisplay.count = count;
        this.comboDisplay.timer = 2500;
        this.comboDisplay.x = x; this.comboDisplay.y = y;
        this.comboDisplay.scale = 2.2;
        // Spawn fire particles for high combos
        if (count >= 3) {
            for (let i = 0; i < 5 + count; i++) {
                this.comboFireParticles.push({
                    x: 120 + (Math.random()-0.5)*40, y: 200 + Math.random()*20,
                    size: 4+Math.random()*6,
                    color: count >= 10 ? `hsl(${Math.random()*30},100%,60%)` : count >= 5 ? '#FFD700' : '#FF8844',
                    life: 300+Math.random()*300, maxLife: 600, alpha: 1
                });
            }
        }
    }

    // === RENDER ===

    render(ctx, camX) {
        // Screen flash (full canvas overlay)
        if (this.screenFlash > 0) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, this.screenFlash);
            ctx.fillStyle = '#FFF';
            ctx.fillRect(-50, -50, FF.CONFIG.CANVAS_WIDTH + 100, FF.CONFIG.CANVAS_HEIGHT + 100);
            ctx.restore();
        }

        // Energy bursts (rings)
        for (const e of this.energyBursts) {
            ctx.save();
            ctx.globalAlpha = e.alpha * 0.7;
            ctx.strokeStyle = e.color;
            ctx.lineWidth = 3 * e.alpha;
            ctx.beginPath();
            ctx.arc(e.x - camX, e.y, e.radius, 0, Math.PI * 2);
            ctx.stroke();
            // Inner glow
            ctx.globalAlpha = e.alpha * 0.2;
            ctx.fillStyle = e.color;
            ctx.beginPath();
            ctx.arc(e.x - camX, e.y, e.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Afterimages (ghost silhouettes)
        for (const a of this.afterimages) {
            ctx.save();
            ctx.globalAlpha = a.alpha;
            ctx.translate(a.x - camX, a.y);
            if (a.facing === -1) ctx.scale(-1, 1);
            ctx.fillStyle = a.color || 'rgba(100,200,255,0.3)';
            // Simplified body silhouette
            ctx.beginPath();
            ctx.ellipse(0, -45, 16, 45, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, -82, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Slash arcs
        for (const s of this.slashLines) {
            ctx.save();
            ctx.globalAlpha = s.alpha * 0.9;
            ctx.translate(s.x - camX, s.y);
            if (s.facing === -1) ctx.scale(-1, 1);
            // Main arc
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 4 * s.alpha;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(0, 0, s.radius, s.startAngle, s.endAngle);
            ctx.stroke();
            // Glow arc
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2 * s.alpha;
            ctx.beginPath();
            ctx.arc(0, 0, s.radius * 0.95, s.startAngle + 0.1, s.endAngle - 0.1);
            ctx.stroke();
            // Trail arc (wider, fading)
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 8 * s.alpha;
            ctx.globalAlpha = s.alpha * 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, s.radius * 1.05, s.startAngle - 0.2, s.endAngle + 0.1);
            ctx.stroke();
            ctx.restore();
        }

        // Hit flashes (bigger, more dramatic)
        for (const f of this.flashes) {
            const alpha = f.life / f.maxLife;
            const r = f.size * (1 - alpha * 0.3);
            const fx = f.x - camX;
            ctx.save();
            // Radial glow
            ctx.globalAlpha = alpha * 0.5;
            const grd = ctx.createRadialGradient(fx, f.y, 0, fx, f.y, r * 1.5);
            grd.addColorStop(0, 'rgba(255,255,255,0.8)');
            grd.addColorStop(0.3, 'rgba(255,220,100,0.4)');
            grd.addColorStop(1, 'rgba(255,100,0,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(fx - r * 1.5, f.y - r * 1.5, r * 3, r * 3);
            // Core white flash
            ctx.globalAlpha = alpha * 0.9;
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(fx, f.y, r * 0.4, 0, Math.PI * 2);
            ctx.fill();
            // Star burst rays
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2.5;
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2 + alpha * 4;
                const inner = r * 0.3, outer = r * (0.7 + Math.random() * 0.4);
                ctx.beginPath();
                ctx.moveTo(fx + Math.cos(a) * inner, f.y + Math.sin(a) * inner);
                ctx.lineTo(fx + Math.cos(a) * outer, f.y + Math.sin(a) * outer);
                ctx.stroke();
            }
            // Cross flare
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1.5;
            const cr = r * 1.2;
            ctx.beginPath(); ctx.moveTo(fx - cr, f.y); ctx.lineTo(fx + cr, f.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(fx, f.y - cr * 0.7); ctx.lineTo(fx, f.y + cr * 0.7); ctx.stroke();
            ctx.restore();
        }

        // Particles (with glow for bright colors)
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            const px = p.x - camX, py = p.y;
            if (p.size > 3) {
                ctx.shadowColor = p.color;
                ctx.shadowBlur = p.size * 2;
            }
            if (p.size <= 1.5) {
                // Spark streak
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px - p.vx * 3, py - p.vy * 3);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(px, py, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Damage numbers (with outline glow)
        for (const d of this.damageNumbers) {
            ctx.save();
            ctx.globalAlpha = d.alpha;
            const fs = Math.round(16 * d.scale);
            ctx.font = `bold ${fs}px 'Orbitron', monospace`;
            ctx.textAlign = 'center';
            const dx = d.x - camX;
            // Glow
            ctx.shadowColor = d.color;
            ctx.shadowBlur = 8;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(d.damage, dx, d.y);
            ctx.fillStyle = d.color;
            ctx.fillText(d.damage, dx, d.y);
            ctx.restore();
        }

        // Combo display (with fire effect)
        if (this.comboDisplay.timer > 0 && this.comboDisplay.count > 1) {
            const c = this.comboDisplay;
            const alpha = Math.min(1, c.timer / 500);
            const tx = 120, ty = 200;

            // Fire particles behind combo number
            for (const p of this.comboFireParticles) {
                ctx.save();
                ctx.globalAlpha = p.alpha * 0.8;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.textAlign = 'center';
            const s = c.scale;
            // Glow behind number
            ctx.shadowColor = c.count >= 10 ? '#FF2200' : c.count >= 5 ? '#FFD700' : '#FF8844';
            ctx.shadowBlur = 15 + c.count * 2;
            ctx.font = `900 ${Math.round(40 * s)}px 'Orbitron', monospace`;
            ctx.fillStyle = c.count >= 10 ? '#FF2200' : c.count >= 5 ? '#FFD700' : '#FF8844';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.strokeText(`${c.count}`, tx, ty);
            ctx.fillText(`${c.count}`, tx, ty);
            ctx.shadowBlur = 0;
            ctx.font = `700 ${Math.round(14 * s)}px 'Noto Sans SC', sans-serif`;
            ctx.fillStyle = '#FFF';
            ctx.strokeText('COMBO', tx, ty + 24);
            ctx.fillText('COMBO', tx, ty + 24);
            ctx.font = `700 12px 'Orbitron', monospace`;
            ctx.fillStyle = '#FFD700';
            ctx.fillText('HITS!', tx, ty + 40);
            ctx.restore();
        }
    }
};
