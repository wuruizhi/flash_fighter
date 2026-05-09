/* ============================================
   Flash Fighter - Player Character
   Smooth bone animation + KOF 4-button combat
   ============================================ */
FF.Player = class {
    constructor(x, y, playerIndex) {
        this.x = x; this.y = y; this.vx = 0; this.vy = 0;
        this.width = 34; this.height = 90; this.facing = playerIndex === 0 ? 1 : -1;
        this.playerIndex = playerIndex || 0;
        this.hp = FF.CONFIG.PLAYER_HP; this.maxHp = FF.CONFIG.PLAYER_HP;
        this.rage = 0; this.score = 0; this.grounded = false;
        this.state = 'idle'; this.anim = 'idle'; this.animTime = 0; this.animFrame = 0;
        this.currentPose = { ...FF.POSES.idle1 }; this.targetPose = null;
        this.attackName = null; this.attackHit = false; this.attackActive = false;
        this.stateTimer = 0; this.comboState = null; this.comboTimer = 0;
        this.comboCount = 0; this.invincible = 0;
        this.weapon = null; this.weaponDurability = 0;
        this.dashing = false; this.dashTimer = 0; this.lives = 3;
        // Smooth animation accumulators
        this.breatheT = Math.random() * Math.PI * 2;
        this.swayT = Math.random() * Math.PI * 2;
        // Colors based on player index
        const C = FF.CONFIG;
        if (playerIndex === 1) {
            this.jersey = C.P2_JERSEY; this.jerseyAccent = C.P2_ACCENT;
            this.shorts = C.P2_SHORTS; this.shoe = C.P2_SHOE;
            this.shoeAccent = C.P2_SHOE_ACCENT; this.headband = C.P2_HEADBAND;
        } else {
            this.jersey = C.JERSEY_COLOR; this.jerseyAccent = C.JERSEY_ACCENT;
            this.shorts = C.SHORTS_COLOR; this.shoe = C.SHOE_COLOR;
            this.shoeAccent = C.SHOE_ACCENT; this.headband = C.HEADBAND_COLOR;
        }
    }

    update(dt, input, game) {
        const C = FF.CONFIG;
        if (this.invincible > 0) this.invincible -= dt;
        if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) { this.comboState = null; this.comboCount = 0; } }
        if (this.dashTimer > 0) this.dashTimer -= dt;
        if (this.stateTimer > 0) this.stateTimer -= dt;
        // Secondary motion
        this.breatheT += dt * 0.004;
        this.swayT += dt * 0.002;

        switch (this.state) {
            case 'idle': case 'walk':
                this._handleMovement(dt, input, C);
                this._handleAttackInput(input, game);
                this._handleJump(input, C);
                if (input.down && !input.getAttackKey()) this._tryPickupWeapon(game);
                if (input.special && this.rage >= C.PLAYER_RAGE_MAX) this._startSpecial(game);
                break;
            case 'jump': case 'fall':
                this._handleAirMovement(dt, input, C);
                this._handleAirAttack(input, game);
                break;
            case 'attack':
                if (this.stateTimer <= 0) { this.state = this.grounded ? 'idle' : 'fall'; this.attackName = null; this.attackActive = false; }
                if (this.stateTimer < 80) this._handleAttackInput(input, game);
                break;
            case 'hurt': if (this.stateTimer <= 0) this.state = 'idle'; break;
            case 'knockdown': if (this.stateTimer <= 0) { this.state = 'idle'; this.invincible = 500; } break;
            case 'block': if (!input.down || !this.grounded) this.state = 'idle'; break;
            case 'dead': break;
        }

        // Physics
        this.vy += C.GRAVITY;
        this.x += this.vx; this.y += this.vy;
        if (this.state !== 'attack' && this.state !== 'hurt' && this.state !== 'knockdown') this.vx *= C.FRICTION;
        if (this.y >= C.GROUND_Y) {
            this.y = C.GROUND_Y; this.vy = 0;
            if (!this.grounded) { this.grounded = true; if (this.state === 'fall' || this.state === 'jump') { this.state = 'idle'; game.effects.spawnDust(this.x, this.y); } }
        } else { this.grounded = false; }
        if (game.level) { const lw = game.level.width || 2400; this.x = Math.max(20, Math.min(lw - 20, this.x)); }
        this._updateAnimation(dt);
    }

    _handleMovement(dt, input, C) {
        let moving = false;
        const speed = this.dashing ? C.PLAYER_RUN_SPEED : C.PLAYER_SPEED;
        if (input.left) { this.vx = -speed; this.facing = -1; moving = true; }
        else if (input.right) { this.vx = speed; this.facing = 1; moving = true; }
        if (input.dashLeft) { this.dashing = true; this.dashTimer = 300; this.facing = -1; }
        if (input.dashRight) { this.dashing = true; this.dashTimer = 300; this.facing = 1; }
        if (this.dashTimer <= 0) this.dashing = false;
        if (input.down && !moving) { this.state = 'block'; this.setAnim('block'); return; }
        this.state = moving ? 'walk' : 'idle';
        this.setAnim(moving ? 'walk' : 'idle');
    }

    _handleJump(input, C) {
        if (input.jump && this.grounded) { this.vy = C.PLAYER_JUMP_FORCE; this.grounded = false; this.state = 'jump'; this.setAnim('jump'); }
    }

    _handleAirMovement(dt, input, C) {
        if (input.left) { this.vx = -C.PLAYER_SPEED * 0.7; this.facing = -1; }
        else if (input.right) { this.vx = C.PLAYER_SPEED * 0.7; this.facing = 1; }
        if (this.vy > 0 && this.state === 'jump') { this.state = 'fall'; this.setAnim('fall'); }
    }

    _handleAttackInput(input, game) {
        if (this.state === 'attack' && this.stateTimer > 80) return;
        const key = input.getAttackKey();
        if (!key) return;
        // Sweep: down + lk
        if (input.down && key === 'lk' && this.grounded) { this._startAttack('sweep', game); return; }
        // Dash attack
        if (this.dashing && (key === 'hp' || key === 'lp')) { this._startAttack('dashPunch', game); this.vx = this.facing * 8; return; }
        // Combo tree
        let node = null;
        if (this.comboState && this.comboTimer > 0) node = this.comboState.next[key];
        if (!node) node = FF.COMBO_TREE[key];
        if (node) { this._startAttack(node.attack, game); this.comboState = node; this.comboTimer = FF.CONFIG.COMBO_TIMEOUT; }
    }

    _handleAirAttack(input, game) {
        if (this.state === 'attack') return;
        const key = input.getAttackKey();
        if (!key) return;
        if (key === 'lp' || key === 'hp') this._startAttack('jumpLP', game);
        else this._startAttack('jumpHK', game);
    }

    _startAttack(name, game) {
        const atk = FF.ATTACKS[name]; if (!atk) return;
        this.state = 'attack'; this.attackName = name; this.attackHit = false; this.attackActive = false;
        this.stateTimer = atk.animDuration; this.setAnim(name);
        game.audio.play(atk.sound);
    }

    _startSpecial(game) {
        this.rage = 0; this._startAttack('special', game);
        game.effects.shake(12, 400); game.effects.slowMotion(0.3, 500);
    }

    _tryPickupWeapon(game) {
        if (this.weapon) return;
        const wp = game.findNearbyWeapon(this.x, this.y, 50);
        if (wp) { this.weapon = wp.type; this.weaponDurability = FF.WEAPONS[wp.type].durability; game.removeWeaponDrop(wp); game.audio.play('pickup'); }
    }

    takeDamage(damage, knockback, fromDir, isKnockdown) {
        if (this.invincible > 0 || this.state === 'dead') return;
        if (this.state === 'block') { damage *= 0.2; knockback *= 0.3; }
        this.hp -= damage;
        this.rage = Math.min(FF.CONFIG.PLAYER_RAGE_MAX, this.rage + FF.CONFIG.RAGE_PER_DAMAGE);
        this.vx = fromDir * knockback;
        if (this.hp <= 0) { this.hp = 0; this.state = 'dead'; this.stateTimer = 2000; this.setAnim('die'); return; }
        if (isKnockdown) { this.state = 'knockdown'; this.stateTimer = 1300; this.vy = -5; this.setAnim('knockdown'); this.invincible = 1500; }
        else { this.state = 'hurt'; this.stateTimer = 300; this.setAnim('hurt'); this.invincible = 200; }
        this.comboState = null; this.comboCount = 0;
    }

    onHitEnemy(game) {
        this.comboCount++;
        this.rage = Math.min(FF.CONFIG.PLAYER_RAGE_MAX, this.rage + FF.CONFIG.RAGE_PER_HIT);
        if (this.comboCount > 1) { game.effects.updateCombo(this.comboCount, this.x, this.y - 60); game.audio.play('combo'); }
        if (this.weapon) { this.weaponDurability--; if (this.weaponDurability <= 0) { this.weapon = null; } }
    }

    getAttackBox() {
        if (!this.attackName || !this.attackActive) return null;
        const atk = FF.ATTACKS[this.attackName];
        const range = atk.range * (this.weapon ? FF.WEAPONS[this.weapon].rangeMult : 1);
        return { x: this.x + this.facing * range * 0.5, y: this.y - 45, w: range, h: 50 };
    }
    getHurtBox() { return { x: this.x, y: this.y - this.height / 2, w: this.width, h: this.height }; }

    setAnim(name) {
        if (this.anim === name) return;
        this.anim = name; this.animTime = 0; this.animFrame = 0;
    }

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
        this.currentPose = FF.lerpPose(curFrame.pose, nextFrame.pose, t);
        this.attackActive = !!curFrame.active;

        // Add procedural secondary motion for idle/walk
        if (this.state === 'idle' || this.state === 'walk') {
            const breathe = Math.sin(this.breatheT) * 0.015;
            const sway = Math.sin(this.swayT) * 0.01;
            this.currentPose.body += sway;
            this.currentPose.lShoulder += breathe;
            this.currentPose.rShoulder -= breathe;
            this.currentPose.headTilt += sway * 0.5;
        }
    }

    render(ctx, camX) {
        ctx.save();
        ctx.translate(this.x - camX, this.y);
        if (this.facing === -1) ctx.scale(-1, 1);
        if (this.invincible > 0 && Math.floor(this.invincible / 60) % 2 === 0) ctx.globalAlpha = 0.5;
        this._drawCharacter(ctx, this.currentPose, true);
        if (this.weapon) this._drawWeapon(ctx, this.currentPose);
        ctx.restore();
    }

    _drawCharacter(ctx, pose, isPlayer) {
        const C = FF.CONFIG;
        const skin = C.SKIN_COLOR, skinS = C.SKIN_SHADOW, hair = C.HAIR_COLOR;
        const jersey = this.jersey, accent = this.jerseyAccent;
        const shorts = this.shorts, shoe = this.shoe, shoeAcc = this.shoeAccent, hband = this.headband;
        const sY = -70, hY = -40, hdY = -82, hdR = 12;
        const uA = 20, fA = 18, uL = 22, lL = 22;

        ctx.save();
        ctx.rotate((pose.body || 0) * 0.3);

        // Helper to draw limb with rounded ends
        const drawLimb = (x1,y1,x2,y2,color,w) => {
            ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        };
        const drawShoe = (fx,fy) => {
            ctx.fillStyle = shoe;
            ctx.beginPath(); ctx.ellipse(fx+4,fy+2,10,5,0,0,Math.PI*2); ctx.fill();
            ctx.fillStyle = shoeAcc;
            ctx.beginPath(); ctx.ellipse(fx+6,fy+1,5,3,0,0,Math.PI*2); ctx.fill();
        };

        // Back leg
        const lhx=-6, lky=hY+Math.cos(pose.lHip)*uL, lkx=lhx+Math.sin(pose.lHip)*uL;
        const lfy=lky+Math.cos(pose.lHip+pose.lKnee)*lL, lfx=lkx+Math.sin(pose.lHip+pose.lKnee)*lL;
        drawLimb(lhx,hY,lkx,lky,skin,8); drawLimb(lkx,lky,lfx,lfy,skin,8); drawShoe(lfx,lfy);

        // Back arm
        const lsx=-10, ley=sY+Math.sin(pose.lShoulder)*uA, lex=lsx+Math.cos(pose.lShoulder)*uA;
        const lhy=ley+Math.sin(pose.lShoulder+pose.lElbow)*fA, lhx2=lex+Math.cos(pose.lShoulder+pose.lElbow)*fA;
        drawLimb(lsx,sY,lex,ley,skin,7); drawLimb(lex,ley,lhx2,lhy,skin,7);
        ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(lhx2,lhy,4,0,Math.PI*2); ctx.fill();

        // Torso (Jersey)
        ctx.fillStyle = jersey;
        ctx.beginPath(); ctx.moveTo(-14,sY-2); ctx.lineTo(14,sY-2); ctx.lineTo(16,hY+2); ctx.lineTo(-16,hY+2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-14,sY-2); ctx.lineTo(14,sY-2); ctx.stroke();
        // Number 24
        if (isPlayer) { ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText('24', 0, hY-8); }
        // Shorts
        ctx.fillStyle = shorts;
        ctx.beginPath(); ctx.moveTo(-16,hY); ctx.lineTo(16,hY); ctx.lineTo(14,hY+18); ctx.lineTo(-14,hY+18); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = accent; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-14,hY+16); ctx.lineTo(14,hY+16); ctx.stroke();

        // Front leg
        const rhx=6, rky=hY+Math.cos(pose.rHip)*uL, rkx=rhx+Math.sin(pose.rHip)*uL;
        const rfy=rky+Math.cos(pose.rHip+pose.rKnee)*lL, rfx=rkx+Math.sin(pose.rHip+pose.rKnee)*lL;
        drawLimb(rhx,hY,rkx,rky,skin,8); drawLimb(rkx,rky,rfx,rfy,skin,8); drawShoe(rfx,rfy);

        // Front arm
        const rsx=10, rey=sY+Math.sin(pose.rShoulder)*uA, rex=rsx+Math.cos(pose.rShoulder)*uA;
        const rhy=rey+Math.sin(pose.rShoulder+pose.rElbow)*fA, rhx2=rex+Math.cos(pose.rShoulder+pose.rElbow)*fA;
        drawLimb(rsx,sY,rex,rey,skin,7); drawLimb(rex,rey,rhx2,rhy,skin,7);
        ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(rhx2,rhy,4,0,Math.PI*2); ctx.fill();

        // Neck
        drawLimb(0,sY,0,sY-8,skin,6);

        // Head
        ctx.save(); ctx.translate(0,hdY); ctx.rotate(pose.headTilt||0);
        ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0,0,hdR,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(0,-2,hdR+1,-Math.PI,0); ctx.fill();
        ctx.fillStyle = hband; ctx.fillRect(-hdR-1,-4,(hdR+1)*2,3);
        ctx.fillStyle = '#FFF'; ctx.fillRect(3,-3,3,3); ctx.fillRect(-1,-3,3,3);
        ctx.fillStyle = '#111'; ctx.fillRect(4,-2,2,2); ctx.fillRect(0,-2,2,2);
        ctx.fillStyle = '#111'; ctx.fillRect(0,4,5,1.5);
        ctx.restore();
        ctx.restore();
    }

    _drawWeapon(ctx, pose) {
        const wp = FF.WEAPONS[this.weapon]; if (!wp) return;
        const rsx=10, sY=-70, uA=20, fA=18;
        const rex=rsx+Math.cos(pose.rShoulder)*uA, rey=sY+Math.sin(pose.rShoulder)*uA;
        const rhx=rex+Math.cos(pose.rShoulder+pose.rElbow)*fA, rhy=rey+Math.sin(pose.rShoulder+pose.rElbow)*fA;
        const angle = pose.rShoulder + pose.rElbow;
        ctx.save(); ctx.translate(rhx,rhy); ctx.rotate(angle);
        ctx.strokeStyle = wp.color; ctx.lineWidth = this.weapon==='katana'?2:3; ctx.lineCap = 'round';
        const len = this.weapon==='knife'?18:30;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(len,0); ctx.stroke();
        if (this.weapon==='katana'||this.weapon==='knife') {
            ctx.fillStyle='#DDD'; ctx.beginPath(); ctx.moveTo(len,-2); ctx.lineTo(len+5,0); ctx.lineTo(len,2); ctx.fill();
        }
        ctx.restore();
    }
};
