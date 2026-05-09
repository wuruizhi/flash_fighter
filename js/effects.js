/* ============================================
   Flash Fighter - Visual Effects
   ============================================ */
FF.Effects = class {
    constructor() {
        this.particles = [];
        this.shakeAmount = 0;
        this.shakeDuration = 0;
        this.shakeTime = 0;
        this.slowMo = 1;
        this.slowMoTimer = 0;
        this.damageNumbers = [];
        this.flashes = [];
        this.comboDisplay = { count: 0, timer: 0, x: 0, y: 0, scale: 1 };
    }

    update(dt) {
        // Screen shake
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            if (this.shakeTime <= 0) this.shakeAmount = 0;
        }
        // Slow motion
        if (this.slowMoTimer > 0) {
            this.slowMoTimer -= dt;
            if (this.slowMoTimer <= 0) this.slowMo = 1;
        }
        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt * 0.06;
            p.y += p.vy * dt * 0.06;
            p.vy += 0.15 * dt * 0.06;
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);
            if (p.life <= 0) this.particles.splice(i, 1);
        }
        // Damage numbers
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const d = this.damageNumbers[i];
            d.y -= 0.8;
            d.life -= dt;
            d.alpha = Math.max(0, d.life / d.maxLife);
            d.scale = 1 + (1 - d.alpha) * 0.3;
            if (d.life <= 0) this.damageNumbers.splice(i, 1);
        }
        // Flashes
        for (let i = this.flashes.length - 1; i >= 0; i--) {
            this.flashes[i].life -= dt;
            if (this.flashes[i].life <= 0) this.flashes.splice(i, 1);
        }
        // Combo display
        if (this.comboDisplay.timer > 0) {
            this.comboDisplay.timer -= dt;
            this.comboDisplay.scale *= 0.95;
            if (this.comboDisplay.scale < 1) this.comboDisplay.scale = 1;
        }
    }

    getShakeOffset() {
        if (this.shakeTime <= 0) return { x: 0, y: 0 };
        const intensity = this.shakeAmount * (this.shakeTime / this.shakeDuration);
        return {
            x: (Math.random() - 0.5) * intensity * 2,
            y: (Math.random() - 0.5) * intensity * 2
        };
    }

    shake(amount, duration) {
        this.shakeAmount = amount;
        this.shakeDuration = duration;
        this.shakeTime = duration;
    }

    slowMotion(factor, duration) {
        this.slowMo = factor;
        this.slowMoTimer = duration;
    }

    spawnHitParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: 2 + Math.random() * 4,
                color: color || '#FFD700',
                life: 200 + Math.random() * 300,
                maxLife: 500,
                alpha: 1
            });
        }
    }

    spawnDust(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 2,
                size: 3 + Math.random() * 5,
                color: 'rgba(180,160,120,0.6)',
                life: 300 + Math.random() * 200,
                maxLife: 500,
                alpha: 1
            });
        }
    }

    addDamageNumber(x, y, damage, isCrit) {
        this.damageNumbers.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y - 20,
            damage: Math.round(damage),
            color: isCrit ? '#FF4444' : '#FFFFFF',
            life: 800,
            maxLife: 800,
            alpha: 1,
            scale: isCrit ? 2.0 : 1.5
        });
    }

    addHitFlash(x, y) {
        this.flashes.push({ x, y, life: 80, maxLife: 80, size: 30 + Math.random() * 20 });
    }

    updateCombo(count, x, y) {
        this.comboDisplay.count = count;
        this.comboDisplay.timer = 2000;
        this.comboDisplay.x = x;
        this.comboDisplay.y = y;
        this.comboDisplay.scale = 2.0;
    }

    render(ctx, camX) {
        // Hit flashes
        for (const f of this.flashes) {
            const alpha = f.life / f.maxLife;
            const r = f.size * (1 - alpha * 0.5);
            ctx.save();
            ctx.globalAlpha = alpha * 0.8;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(f.x - camX, f.y, r * 0.5, 0, Math.PI * 2);
            ctx.fill();
            // Star burst
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2 + alpha * 3;
                ctx.beginPath();
                ctx.moveTo(f.x - camX + Math.cos(a) * r * 0.3, f.y + Math.sin(a) * r * 0.3);
                ctx.lineTo(f.x - camX + Math.cos(a) * r, f.y + Math.sin(a) * r);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Particles
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - camX - p.size / 2, p.y - p.size / 2, p.size, p.size);
            ctx.restore();
        }

        // Damage numbers
        for (const d of this.damageNumbers) {
            ctx.save();
            ctx.globalAlpha = d.alpha;
            ctx.font = `bold ${Math.round(16 * d.scale)}px 'Orbitron', monospace`;
            ctx.textAlign = 'center';
            ctx.fillStyle = d.color;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(d.damage, d.x - camX, d.y);
            ctx.fillText(d.damage, d.x - camX, d.y);
            ctx.restore();
        }

        // Combo display
        if (this.comboDisplay.timer > 0 && this.comboDisplay.count > 1) {
            const c = this.comboDisplay;
            const alpha = Math.min(1, c.timer / 500);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.textAlign = 'center';
            // Combo count
            const s = c.scale;
            ctx.font = `900 ${Math.round(36 * s)}px 'Orbitron', monospace`;
            ctx.fillStyle = c.count >= 10 ? '#FF2200' : c.count >= 5 ? '#FFD700' : '#FF8844';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            const tx = 120;
            const ty = 200;
            ctx.strokeText(`${c.count}`, tx, ty);
            ctx.fillText(`${c.count}`, tx, ty);
            ctx.font = `700 ${Math.round(14 * s)}px 'Noto Sans SC', sans-serif`;
            ctx.fillStyle = '#FFF';
            ctx.strokeText('COMBO', tx, ty + 22);
            ctx.fillText('COMBO', tx, ty + 22);
            // Hits text
            ctx.font = `700 ${Math.round(11)}px 'Orbitron', monospace`;
            ctx.fillStyle = '#FFD700';
            ctx.fillText('HITS!', tx, ty + 38);
            ctx.restore();
        }
    }
};
