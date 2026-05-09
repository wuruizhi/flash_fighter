/* ============================================
   Flash Fighter - Enemy System
   ============================================ */
FF.Enemy = class {
    constructor(type, x, y) {
        const def = FF.ENEMY_TYPES[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.speed = def.speed;
        this.attackDamage = def.attackDamage;
        this.attackRange = def.attackRange;
        this.attackCooldown = def.attackCooldown;
        this.aggroRange = def.aggroRange;
        this.width = def.width;
        this.height = def.height;
        this.colorKey = def.color;
        this.score = def.score;
        this.superArmor = !!def.superArmor;
        this.facing = -1;
        this.state = 'idle'; // idle, walk, attack, hurt, knockdown, dead
        this.stateTimer = 0;
        this.cooldown = 0;
        this.anim = 'idle';
        this.animTime = 0;
        this.animFrame = 0;
        this.currentPose = { ...FF.POSES.idle1 };
        this.attackHit = false;
        this.attackActive = false;
        this.dead = false;
        this.grounded = true;
        // AI
        this.thinkTimer = 500 + Math.random() * 500;
        this.desiredX = x;
        this.circleDir = Math.random() > 0.5 ? 1 : -1;
        // Boss phase
        this.phase = 1;
        this.phases = def.phases || 1;
    }

    update(dt, player, game) {
        if (this.dead) return;
        if (this.stateTimer > 0) this.stateTimer -= dt;
        if (this.cooldown > 0) this.cooldown -= dt;

        switch (this.state) {
            case 'idle':
            case 'walk':
                this._aiUpdate(dt, player, game);
                break;
            case 'attack':
                if (this.stateTimer <= 0) {
                    this.state = 'idle';
                    this.attackActive = false;
                    this.cooldown = this.attackCooldown * (0.8 + Math.random() * 0.4);
                }
                break;
            case 'hurt':
                if (this.stateTimer <= 0) this.state = 'idle';
                break;
            case 'knockdown':
                if (this.stateTimer <= 0) {
                    if (this.hp <= 0) {
                        this.dead = true;
                    } else {
                        this.state = 'idle';
                    }
                }
                break;
        }

        // Physics
        this.vy += FF.CONFIG.GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
        if (this.state !== 'attack') this.vx *= FF.CONFIG.FRICTION;
        if (this.y >= FF.CONFIG.GROUND_Y) {
            this.y = FF.CONFIG.GROUND_Y;
            this.vy = 0;
            this.grounded = true;
        }

        // Level bounds
        if (game.level) {
            this.x = Math.max(20, Math.min((game.level.width || 2400) - 20, this.x));
        }

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

        if (player.state === 'dead') {
            this.state = 'idle';
            this.setAnim('idle');
            return;
        }

        if (dist < this.attackRange && this.cooldown <= 0) {
            this._startAttack();
            return;
        }

        if (dist < this.aggroRange) {
            // Approach player but maintain spacing
            const targetDist = this.attackRange * 0.8;
            if (dist > targetDist + 10) {
                this.vx = this.facing * this.speed;
                this.state = 'walk';
                this.setAnim('walk');
            } else if (dist < targetDist - 10) {
                this.vx = -this.facing * this.speed * 0.5;
                this.state = 'walk';
                this.setAnim('walk');
            } else {
                // Circle strafe
                this.vx = this.circleDir * this.speed * 0.3;
                this.state = 'walk';
                this.setAnim('walk');
            }
        } else {
            this.state = 'idle';
            this.setAnim('idle');
        }
    }

    _startAttack() {
        this.state = 'attack';
        this.stateTimer = 400;
        this.attackHit = false;
        this.attackActive = false;
        this.setAnim('lp');
        this.vx = this.facing * 2;
    }

    takeDamage(damage, knockback, fromDir, isKnockdown, isLauncher) {
        if (this.dead) return;
        this.hp -= damage;
        this.vx = fromDir * knockback;

        if (this.hp <= 0) {
            this.state = 'knockdown';
            this.stateTimer = 1500;
            this.vy = -6;
            this.setAnim('die');
            return;
        }

        if (isKnockdown || (isLauncher && !this.superArmor)) {
            this.state = 'knockdown';
            this.stateTimer = 1000;
            this.vy = isLauncher ? -8 : -4;
            this.setAnim('knockdown');
        } else if (!this.superArmor) {
            this.state = 'hurt';
            this.stateTimer = 200;
            this.setAnim('hurt');
        }
        // Boss phase transition
        if (this.phases > 1) {
            const newPhase = Math.ceil((1 - this.hp / this.maxHp) * this.phases);
            if (newPhase > this.phase) {
                this.phase = newPhase;
                this.speed *= 1.15;
                this.attackDamage *= 1.1;
                this.attackCooldown *= 0.85;
            }
        }
    }

    getAttackBox() {
        if (this.state !== 'attack' || !this.attackActive) return null;
        return {
            x: this.x + this.facing * this.attackRange * 0.5,
            y: this.y - 45,
            w: this.attackRange,
            h: 50
        };
    }

    getHurtBox() {
        return { x: this.x, y: this.y - this.height / 2, w: this.width, h: this.height };
    }

    setAnim(name) {
        if (this.anim === name) return;
        this.anim = name;
        this.animTime = 0;
        this.animFrame = 0;
    }

    _updateAnimation(dt) {
        const anim = FF.ANIMS[this.anim];
        if (!anim) return;
        this.animTime += dt;
        const frame = anim.frames[this.animFrame];
        if (!frame) return;
        if (this.animTime >= frame.dur) {
            this.animTime -= frame.dur;
            this.animFrame++;
            if (this.animFrame >= anim.frames.length) {
                this.animFrame = anim.loop ? 0 : anim.frames.length - 1;
            }
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

        const pose = this.currentPose;
        const colors = FF.CONFIG.ENEMY_COLORS[this.colorKey] || FF.CONFIG.ENEMY_COLORS.thug;
        const scale = this.type === 'heavy' ? 1.2 : this.type === 'boss' ? 1.35 : this.type === 'fast' ? 0.9 : 1;
        ctx.scale(scale, scale);
        this._drawBody(ctx, pose, colors);
        ctx.restore();

        // HP bar
        if (!this.dead && this.hp < this.maxHp) {
            const bw = 40;
            const bx = drawX - bw / 2;
            const by = this.y - this.height * scale - 15;
            ctx.fillStyle = '#333';
            ctx.fillRect(bx, by, bw, 4);
            ctx.fillStyle = this.type === 'boss' ? '#FF4400' : '#CC3333';
            ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), 4);
        }
    }

    _drawBody(ctx, pose, colors) {
        const skin = colors.skin;
        const shirt = colors.shirt;
        const pants = colors.pants;
        const shoulderY = -70;
        const hipY = -40;
        const headY = -82;
        const headR = 11;
        const upperArm = 20;
        const forearm = 18;
        const upperLeg = 22;
        const lowerLeg = 22;

        ctx.save();
        ctx.rotate((pose.body || 0) * 0.3);

        // Back leg
        const lHipX = -6;
        const lKneeX = lHipX + Math.sin(pose.lHip) * upperLeg;
        const lKneeY = hipY + Math.cos(pose.lHip) * upperLeg;
        const lFootX = lKneeX + Math.sin(pose.lHip + pose.lKnee) * lowerLeg;
        const lFootY = lKneeY + Math.cos(pose.lHip + pose.lKnee) * lowerLeg;
        ctx.strokeStyle = pants;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(lHipX, hipY);
        ctx.lineTo(lKneeX, lKneeY);
        ctx.stroke();
        ctx.strokeStyle = skin;
        ctx.beginPath();
        ctx.moveTo(lKneeX, lKneeY);
        ctx.lineTo(lFootX, lFootY);
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(lFootX + 4, lFootY + 2, 9, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Back arm
        const lShoulderX = -10;
        const lElbowX = lShoulderX + Math.cos(pose.lShoulder) * upperArm;
        const lElbowY = shoulderY + Math.sin(pose.lShoulder) * upperArm;
        const lHandX = lElbowX + Math.cos(pose.lShoulder + pose.lElbow) * forearm;
        const lHandY = lElbowY + Math.sin(pose.lShoulder + pose.lElbow) * forearm;
        ctx.strokeStyle = skin;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(lShoulderX, shoulderY);
        ctx.lineTo(lElbowX, lElbowY);
        ctx.lineTo(lHandX, lHandY);
        ctx.stroke();
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.arc(lHandX, lHandY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Torso
        ctx.fillStyle = shirt;
        ctx.beginPath();
        ctx.moveTo(-14, shoulderY - 2);
        ctx.lineTo(14, shoulderY - 2);
        ctx.lineTo(16, hipY + 2);
        ctx.lineTo(-16, hipY + 2);
        ctx.closePath();
        ctx.fill();

        // Pants
        ctx.fillStyle = pants;
        ctx.fillRect(-16, hipY, 32, 12);

        // Front leg
        const rHipX = 6;
        const rKneeX = rHipX + Math.sin(pose.rHip) * upperLeg;
        const rKneeY = hipY + Math.cos(pose.rHip) * upperLeg;
        const rFootX = rKneeX + Math.sin(pose.rHip + pose.rKnee) * lowerLeg;
        const rFootY = rKneeY + Math.cos(pose.rHip + pose.rKnee) * lowerLeg;
        ctx.strokeStyle = pants;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(rHipX, hipY);
        ctx.lineTo(rKneeX, rKneeY);
        ctx.stroke();
        ctx.strokeStyle = skin;
        ctx.beginPath();
        ctx.moveTo(rKneeX, rKneeY);
        ctx.lineTo(rFootX, rFootY);
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(rFootX + 4, rFootY + 2, 9, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Front arm
        const rShoulderX = 10;
        const rElbowX = rShoulderX + Math.cos(pose.rShoulder) * upperArm;
        const rElbowY = shoulderY + Math.sin(pose.rShoulder) * upperArm;
        const rHandX = rElbowX + Math.cos(pose.rShoulder + pose.rElbow) * forearm;
        const rHandY = rElbowY + Math.sin(pose.rShoulder + pose.rElbow) * forearm;
        ctx.strokeStyle = skin;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(rShoulderX, shoulderY);
        ctx.lineTo(rElbowX, rElbowY);
        ctx.lineTo(rHandX, rHandY);
        ctx.stroke();
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.arc(rHandX, rHandY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Neck
        ctx.strokeStyle = skin;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, shoulderY);
        ctx.lineTo(0, shoulderY - 8);
        ctx.stroke();

        // Head
        ctx.save();
        ctx.translate(0, headY);
        ctx.rotate(pose.headTilt || 0);
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.arc(0, 0, headR, 0, Math.PI * 2);
        ctx.fill();
        // Hair
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, -1, headR + 1, -Math.PI, 0);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.fillRect(3, -3, 3, 3);
        ctx.fillRect(-1, -3, 3, 3);
        ctx.fillStyle = '#111';
        ctx.fillRect(4, -2, 2, 2);
        ctx.fillRect(0, -2, 2, 2);
        ctx.restore();

        ctx.restore();
    }
};
