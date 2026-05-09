/* ============================================
   Flash Fighter - Enemy System
   Elite + Boss AI with special attacks
   ============================================ */
FF.Enemy = class {
    constructor(type, x, y) {
        const def = FF.ENEMY_TYPES[type];
        this.type = type;
        this.x = x; this.y = y; this.vx = 0; this.vy = 0;
        this.hp = def.hp; this.maxHp = def.hp;
        this.speed = def.speed; this.attackDamage = def.attackDamage;
        this.attackRange = def.attackRange; this.attackCooldown = def.attackCooldown;
        this.aggroRange = def.aggroRange;
        this.width = def.width; this.height = def.height;
        this.colorKey = def.color; this.score = def.score;
        this.superArmor = !!def.superArmor;
        this.elite = !!def.elite;
        this.boss = !!def.boss;
        this.bossName = def.bossName || '';
        this.atkPattern = def.atkPattern || 'normal';
        this.facing = -1;
        this.state = 'idle';
        this.stateTimer = 0; this.cooldown = 0;
        this.anim = 'idle'; this.animTime = 0; this.animFrame = 0;
        this.currentPose = { ...FF.POSES.idle1 };
        this.attackHit = false; this.attackActive = false;
        this.dead = false; this.grounded = true;
        // AI
        this.thinkTimer = 500 + Math.random() * 500;
        this.circleDir = Math.random() > 0.5 ? 1 : -1;
        // Boss phase
        this.phase = 1;
        this.phases = def.phases || 1;
        // Elite/Boss special state
        this.specialTimer = 3000 + Math.random() * 2000;
        this.isCharging = false;
        this.chargeVx = 0;
        this.comboHitsLeft = 0;
        this.comboDelay = 0;
        // Visual
        this.flashTimer = 0;
        this.shakeX = 0;
    }

    update(dt, player, game) {
        if (this.dead) return;
        if (this.stateTimer > 0) this.stateTimer -= dt;
        if (this.cooldown > 0) this.cooldown -= dt;
        if (this.specialTimer > 0) this.specialTimer -= dt;
        if (this.flashTimer > 0) this.flashTimer -= dt;

        switch (this.state) {
            case 'idle': case 'walk':
                this._aiUpdate(dt, player, game);
                break;
            case 'attack':
                if (this.stateTimer <= 0) {
                    // Elite combo: chain attacks
                    if (this.comboHitsLeft > 0) {
                        this.comboHitsLeft--;
                        this._startAttack();
                    } else {
                        this.state = 'idle';
                        this.attackActive = false;
                        this.cooldown = this.attackCooldown * (0.8 + Math.random() * 0.4);
                    }
                }
                break;
            case 'hurt':
                if (this.stateTimer <= 0) this.state = 'idle';
                break;
            case 'knockdown':
                if (this.stateTimer <= 0) {
                    if (this.hp <= 0) this.dead = true;
                    else this.state = 'idle';
                }
                break;
            case 'charging':
                this.x += this.chargeVx;
                this.stateTimer -= dt;
                // Check if charge hit player
                if (!this.attackHit) {
                    const dx = Math.abs(this.x - player.x);
                    const dy = Math.abs(this.y - player.y);
                    if (dx < 40 && dy < 50) {
                        this.attackHit = true;
                        this.attackActive = true;
                    }
                }
                if (this.stateTimer <= 0 || this.x < 20 || this.x > (game.level ? game.level.width - 20 : 2400)) {
                    this.state = 'idle';
                    this.attackActive = false;
                    this.cooldown = this.attackCooldown;
                    this.isCharging = false;
                    this.vx = 0;
                }
                break;
        }

        // Physics
        this.vy += FF.CONFIG.GRAVITY;
        this.x += this.vx; this.y += this.vy;
        if (this.state !== 'attack' && this.state !== 'charging') this.vx *= FF.CONFIG.FRICTION;
        if (this.y >= FF.CONFIG.GROUND_Y) { this.y = FF.CONFIG.GROUND_Y; this.vy = 0; this.grounded = true; }
        if (game.level) this.x = Math.max(20, Math.min((game.level.width || 2400) - 20, this.x));

        this._updateAnimation(dt);
    }

    _aiUpdate(dt, player, game) {
        const dx = player.x - this.x;
        const dist = Math.abs(dx);
        this.facing = dx > 0 ? 1 : -1;
        this.thinkTimer -= dt;
        if (this.thinkTimer <= 0) {
            this.thinkTimer = 300 + Math.random() * 400;
            this.circleDir = Math.random() > 0.5 ? 1 : -1;
        }

        if (player.state === 'dead') { this.state = 'idle'; this.setAnim('idle'); return; }

        // Elite/Boss special attacks
        if ((this.elite || this.boss) && this.specialTimer <= 0 && dist < this.aggroRange) {
            this._doSpecialAttack(player, game);
            return;
        }

        // Boss phase rage
        if (this.boss && this.phase > 1 && Math.random() < 0.002 * this.phase) {
            this.flashTimer = 200;
        }

        if (dist < this.attackRange && this.cooldown <= 0) {
            this._startAttack();
            // Elite ninja: combo attack
            if (this.atkPattern === 'combo') {
                this.comboHitsLeft = 1 + Math.floor(Math.random() * 2);
            }
            return;
        }

        if (dist < this.aggroRange) {
            const targetDist = this.attackRange * 0.8;
            if (dist > targetDist + 10) {
                this.vx = this.facing * this.speed;
                this.state = 'walk'; this.setAnim('walk');
            } else if (dist < targetDist - 10) {
                this.vx = -this.facing * this.speed * 0.5;
                this.state = 'walk'; this.setAnim('walk');
            } else {
                this.vx = this.circleDir * this.speed * 0.3;
                this.state = 'walk'; this.setAnim('walk');
            }
        } else {
            this.state = 'idle'; this.setAnim('idle');
        }
    }

    _doSpecialAttack(player, game) {
        this.specialTimer = (this.boss ? 2500 : 3500) + Math.random() * 2000;
        const pattern = this.atkPattern;
        if (pattern === 'dash' || (this.boss && Math.random() < 0.4)) {
            // Dash attack - rush toward player
            this.state = 'attack';
            this.stateTimer = 350;
            this.attackHit = false;
            this.vx = this.facing * this.speed * 3;
            this.attackDamage *= 1.5;
            this.setAnim('lp');
            setTimeout(() => { this.attackDamage /= 1.5; }, 400);
        } else if (pattern === 'charge') {
            // Charging bull rush
            this.state = 'charging';
            this.stateTimer = 600;
            this.chargeVx = this.facing * this.speed * 2.5;
            this.attackHit = false;
            this.isCharging = true;
            this.flashTimer = 300;
            this.setAnim('walk');
        } else if (pattern === 'combo') {
            // Quick combo flurry
            this._startAttack();
            this.comboHitsLeft = 2 + Math.floor(Math.random() * 2);
        } else if (this.boss) {
            // Boss ground slam - area attack
            this.state = 'attack';
            this.stateTimer = 500;
            this.attackHit = false;
            this.attackActive = false;
            this.setAnim('lp');
            this.flashTimer = 200;
            if (game.effects) {
                game.effects.shake(6, 300);
            }
        }
    }

    _startAttack() {
        this.state = 'attack';
        this.stateTimer = this.elite ? 300 : this.boss ? 350 : 400;
        this.attackHit = false;
        this.attackActive = false;
        this.setAnim('lp');
        this.vx = this.facing * 2;
    }

    takeDamage(damage, knockback, fromDir, isKnockdown, isLauncher) {
        if (this.dead) return;
        // Boss damage reduction in higher phases
        if (this.boss && this.phase > 1) damage *= (1 - (this.phase - 1) * 0.1);
        this.hp -= damage;
        this.vx = fromDir * knockback;
        this.flashTimer = 100;

        if (this.hp <= 0) {
            this.state = 'knockdown'; this.stateTimer = 1500;
            this.vy = -6; this.setAnim('die'); return;
        }

        if (isKnockdown || (isLauncher && !this.superArmor)) {
            this.state = 'knockdown'; this.stateTimer = 1000;
            this.vy = isLauncher ? -8 : -4; this.setAnim('knockdown');
        } else if (!this.superArmor) {
            this.state = 'hurt'; this.stateTimer = 200; this.setAnim('hurt');
        }
        // Boss phase transition
        if (this.phases > 1) {
            const newPhase = Math.ceil((1 - this.hp / this.maxHp) * this.phases);
            if (newPhase > this.phase) {
                this.phase = newPhase;
                this.speed *= 1.15;
                this.attackDamage *= 1.1;
                this.attackCooldown *= 0.85;
                this.flashTimer = 500;
                // Reset special timer for phase transition attack
                this.specialTimer = 500;
            }
        }
    }

    getAttackBox() {
        if (this.state === 'charging' && this.attackActive) {
            return { x: this.x + this.facing * 25, y: this.y - 45, w: 50, h: 60 };
        }
        if (this.state !== 'attack' || !this.attackActive) return null;
        return { x: this.x + this.facing * this.attackRange * 0.5, y: this.y - 45, w: this.attackRange, h: 50 };
    }

    getHurtBox() { return { x: this.x, y: this.y - this.height / 2, w: this.width, h: this.height }; }

    setAnim(name) { if (this.anim === name) return; this.anim = name; this.animTime = 0; this.animFrame = 0; }

    _updateAnimation(dt) {
        const anim = FF.ANIMS[this.anim];
        if (!anim) return;
        this.animTime += dt;
        const frame = anim.frames[this.animFrame];
        if (!frame) return;
        if (this.animTime >= frame.dur) {
            this.animTime -= frame.dur; this.animFrame++;
            if (this.animFrame >= anim.frames.length) this.animFrame = anim.loop ? 0 : anim.frames.length - 1;
        }
        const curFrame = anim.frames[this.animFrame];
        const nextIdx = (this.animFrame + 1) % anim.frames.length;
        const nextFrame = anim.frames[anim.loop ? nextIdx : Math.min(nextIdx, anim.frames.length - 1)];
        const t = curFrame.dur > 0 ? this.animTime / curFrame.dur : 0;
        this.currentPose = FF.lerpPose(curFrame.pose, nextFrame.pose, Math.min(1, t));
        this.attackActive = !!curFrame.active;
    }

    render(ctx, camX) {
        if (this.dead && this.state !== 'knockdown') return;
        ctx.save();
        const drawX = this.x - camX;
        ctx.translate(drawX, this.y);
        if (this.facing === -1) ctx.scale(-1, 1);

        const colors = FF.CONFIG.ENEMY_COLORS[this.colorKey] || FF.CONFIG.ENEMY_COLORS.thug;
        const scale = this.type.includes('Brute') || this.type === 'boss3' ? 1.35
            : this.type.includes('heavy') || this.type === 'boss1' ? 1.2
            : this.type.includes('Ninja') || this.type.includes('fast') ? 0.9 : 1;
        ctx.scale(scale, scale);

        // Flash effect for elites/bosses
        if (this.flashTimer > 0 && Math.floor(this.flashTimer / 40) % 2 === 0) {
            ctx.globalAlpha = 0.7;
        }
        // Charging glow
        if (this.isCharging) {
            ctx.shadowColor = '#FF4400';
            ctx.shadowBlur = 15;
        }

        this._drawBody(ctx, this.currentPose, colors);

        // Elite marker
        if (this.elite) {
            ctx.save();
            if (this.facing === -1) ctx.scale(-1, 1);
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('★', 0, -this.height - 5);
            ctx.restore();
        }
        // Boss crown
        if (this.boss) {
            ctx.save();
            if (this.facing === -1) ctx.scale(-1, 1);
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('👑', 0, -this.height - 8);
            ctx.restore();
        }

        ctx.restore();

        // HP bar (bigger for boss/elite)
        if (!this.dead && this.hp < this.maxHp) {
            const bw = this.boss ? 80 : this.elite ? 50 : 40;
            const bh = this.boss ? 6 : 4;
            const bx = drawX - bw / 2;
            const by = this.y - this.height * scale - (this.boss ? 25 : 15);
            ctx.fillStyle = '#222'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
            ctx.fillStyle = '#333'; ctx.fillRect(bx, by, bw, bh);
            const hpPct = this.hp / this.maxHp;
            const hpColor = this.boss ? (hpPct > 0.5 ? '#FF4400' : hpPct > 0.25 ? '#FF8800' : '#FF0000')
                : this.elite ? '#FF6600' : '#CC3333';
            ctx.fillStyle = hpColor;
            ctx.fillRect(bx, by, bw * hpPct, bh);
            // Boss name
            if (this.boss && this.bossName) {
                ctx.save();
                ctx.fillStyle = '#FFD700'; ctx.font = 'bold 11px "Noto Sans SC",sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(this.bossName, drawX, by - 5);
                // Phase indicator
                ctx.fillStyle = '#FFF'; ctx.font = '9px Arial';
                const phaseStr = '●'.repeat(this.phase) + '○'.repeat(Math.max(0, this.phases - this.phase));
                ctx.fillText('Phase ' + phaseStr, drawX, by - 16);
                ctx.restore();
            }
        }
    }

    _drawBody(ctx, pose, colors) {
        const skin = colors.skin, shirt = colors.shirt, pants = colors.pants;
        const sY = -70, hY = -40, hdY = -82, hdR = 11;
        const uA = 20, fA = 18, uL = 22, lL = 22;

        ctx.save();
        ctx.rotate((pose.body || 0) * 0.3);

        // Helper
        const drawLimb = (x1,y1,x2,y2,c,w) => {
            ctx.strokeStyle=c; ctx.lineWidth=w; ctx.lineCap='round';
            ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        };

        // Back leg
        const lkx=-6+Math.sin(pose.lHip)*uL, lky=hY+Math.cos(pose.lHip)*uL;
        const lfx=lkx+Math.sin(pose.lHip+pose.lKnee)*lL, lfy=lky+Math.cos(pose.lHip+pose.lKnee)*lL;
        drawLimb(-6,hY,lkx,lky,pants,8); drawLimb(lkx,lky,lfx,lfy,skin,8);
        ctx.fillStyle='#333'; ctx.beginPath(); ctx.ellipse(lfx+4,lfy+2,9,5,0,0,Math.PI*2); ctx.fill();

        // Back arm
        const lex=-10+Math.cos(pose.lShoulder)*uA, ley=sY+Math.sin(pose.lShoulder)*uA;
        const lhx=lex+Math.cos(pose.lShoulder+pose.lElbow)*fA, lhy=ley+Math.sin(pose.lShoulder+pose.lElbow)*fA;
        drawLimb(-10,sY,lex,ley,skin,7); drawLimb(lex,ley,lhx,lhy,skin,7);
        ctx.fillStyle=skin; ctx.beginPath(); ctx.arc(lhx,lhy,4,0,Math.PI*2); ctx.fill();

        // Torso
        ctx.fillStyle=shirt;
        ctx.beginPath(); ctx.moveTo(-14,sY-2); ctx.lineTo(14,sY-2); ctx.lineTo(16,hY+2); ctx.lineTo(-16,hY+2); ctx.closePath(); ctx.fill();
        // Elite stripe
        if (this.elite) {
            ctx.strokeStyle='#FFD700'; ctx.lineWidth=2;
            ctx.beginPath(); ctx.moveTo(-14,sY+5); ctx.lineTo(14,sY+5); ctx.stroke();
        }
        // Boss emblem
        if (this.boss) {
            ctx.fillStyle='rgba(255,215,0,0.6)'; ctx.font='bold 10px Arial'; ctx.textAlign='center';
            ctx.fillText('X', 0, hY-10);
        }

        // Pants
        ctx.fillStyle=pants; ctx.fillRect(-16,hY,32,12);

        // Front leg
        const rkx=6+Math.sin(pose.rHip)*uL, rky=hY+Math.cos(pose.rHip)*uL;
        const rfx=rkx+Math.sin(pose.rHip+pose.rKnee)*lL, rfy=rky+Math.cos(pose.rHip+pose.rKnee)*lL;
        drawLimb(6,hY,rkx,rky,pants,8); drawLimb(rkx,rky,rfx,rfy,skin,8);
        ctx.fillStyle='#333'; ctx.beginPath(); ctx.ellipse(rfx+4,rfy+2,9,5,0,0,Math.PI*2); ctx.fill();

        // Front arm
        const rex=10+Math.cos(pose.rShoulder)*uA, rey=sY+Math.sin(pose.rShoulder)*uA;
        const rhx=rex+Math.cos(pose.rShoulder+pose.rElbow)*fA, rhy=rey+Math.sin(pose.rShoulder+pose.rElbow)*fA;
        drawLimb(10,sY,rex,rey,skin,7); drawLimb(rex,rey,rhx,rhy,skin,7);
        ctx.fillStyle=skin; ctx.beginPath(); ctx.arc(rhx,rhy,4,0,Math.PI*2); ctx.fill();

        // Elite weapon (knife for eliteKnife)
        if (this.type === 'eliteKnife') {
            const angle = pose.rShoulder + pose.rElbow;
            ctx.save(); ctx.translate(rhx,rhy); ctx.rotate(angle);
            ctx.strokeStyle='#C0C0C0'; ctx.lineWidth=2; ctx.lineCap='round';
            ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(15,0); ctx.stroke();
            ctx.fillStyle='#DDD'; ctx.beginPath(); ctx.moveTo(15,-2); ctx.lineTo(20,0); ctx.lineTo(15,2); ctx.fill();
            ctx.restore();
        }

        // Neck
        drawLimb(0,sY,0,sY-8,skin,6);

        // Head
        ctx.save(); ctx.translate(0,hdY); ctx.rotate(pose.headTilt||0);
        ctx.fillStyle=skin; ctx.beginPath(); ctx.arc(0,0,hdR,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.arc(0,-1,hdR+1,-Math.PI,0); ctx.fill();
        // Ninja mask
        if (this.type === 'eliteNinja') {
            ctx.fillStyle='#1a1a2e';
            ctx.fillRect(-hdR,0,hdR*2,hdR-2);
        }
        // Boss scar
        if (this.boss) {
            ctx.strokeStyle='#CC4444'; ctx.lineWidth=1.5;
            ctx.beginPath(); ctx.moveTo(-4,-6); ctx.lineTo(3,4); ctx.stroke();
        }
        ctx.fillStyle='#FFF'; ctx.fillRect(3,-3,3,3); ctx.fillRect(-1,-3,3,3);
        ctx.fillStyle=this.boss?'#FF0000':'#111';
        ctx.fillRect(4,-2,2,2); ctx.fillRect(0,-2,2,2);
        ctx.restore();
        ctx.restore();
    }
};
