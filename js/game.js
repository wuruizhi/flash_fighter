/* ============================================
   Flash Fighter - Game Engine
   2-Player + PvP + Story mode
   ============================================ */
FF.Game = class {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.W = FF.CONFIG.CANVAS_WIDTH; this.H = FF.CONFIG.CANVAS_HEIGHT;
        canvas.width = this.W; canvas.height = this.H;
        this.keyboard = new FF.KeyboardState();
        // Load saved bindings or use defaults
        this.bindings = JSON.parse(JSON.stringify(FF.DEFAULT_BINDINGS));
        try { const saved = localStorage.getItem('ff_bindings'); if (saved) this.bindings = JSON.parse(saved); } catch(e) {}
        this.p1Input = new FF.PlayerInput(this.bindings.p1, this.keyboard);
        this.p2Input = new FF.PlayerInput(this.bindings.p2, this.keyboard);
        this.audio = new FF.Audio();
        this.effects = new FF.Effects();
        this.ui = new FF.UI();
        this.players = []; this.level = null; this.camX = 0;
        this.state = 'menu'; // menu, modeSelect, settings, playing, paused, levelTransition, gameOver, victory
        this.gameMode = 'story'; // story, pvp, coop
        this.currentLevel = 0;
        this.transitionAlpha = 0; this.transitionPhase = 0; this.transitionTimer = 0;
        this.waveWarningTimer = 0; this.lastTime = 0; this.running = true;
        this.pvpWinner = -1;
    }

    start() { this.audio.init(); this.lastTime = performance.now(); this._loop(); }

    _loop() {
        if (!this.running) return;
        const now = performance.now();
        let dt = Math.min(50, now - this.lastTime);
        this.lastTime = now;
        dt *= this.effects.slowMo;
        this.p1Input.update(); this.p2Input.update();
        this._update(dt);
        this._render();
        this.keyboard.clear();
        requestAnimationFrame(() => this._loop());
    }

    _update(dt) {
        switch (this.state) {
            case 'menu':
                if (this.p1Input.confirm || this.p2Input.confirm) { this.audio.resume(); this.state = 'modeSelect'; }
                break;
            case 'modeSelect':
                if (this.keyboard.wasPressed('Digit1')) { this.gameMode = 'story'; this._startGame(1); }
                else if (this.keyboard.wasPressed('Digit2')) { this.gameMode = 'coop'; this._startGame(2); }
                else if (this.keyboard.wasPressed('Digit3')) { this.gameMode = 'pvp'; this._startPvP(); }
                else if (this.keyboard.wasPressed('Digit4') || this.keyboard.wasPressed('KeyO')) { this.state = 'settings'; this.ui.settingsInit(this.bindings); }
                else if (this.keyboard.wasPressed('Escape')) { this.state = 'menu'; }
                break;
            case 'settings':
                this.ui.settingsUpdate(this.keyboard, this.bindings);
                if (this.keyboard.wasPressed('Escape') && !this.ui.settingsBinding) {
                    // Save bindings
                    try { localStorage.setItem('ff_bindings', JSON.stringify(this.bindings)); } catch(e) {}
                    this.p1Input.bindings = { ...this.bindings.p1 };
                    this.p2Input.bindings = { ...this.bindings.p2 };
                    this.state = 'modeSelect';
                }
                break;
            case 'playing':
                this._updatePlaying(dt);
                if (this.p1Input.pause || this.p2Input.pause) this.state = 'paused';
                break;
            case 'paused':
                if (this.p1Input.pause || this.p2Input.pause) this.state = 'playing';
                if (this.p1Input.confirm) this.state = 'modeSelect';
                break;
            case 'levelTransition': this._updateTransition(dt); break;
            case 'gameOver': case 'victory':
                if (this.p1Input.confirm || this.p2Input.confirm) this.state = 'modeSelect';
                break;
        }
    }

    _updatePlaying(dt) {
        const inputs = [this.p1Input, this.p2Input];
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].update(dt, inputs[i], this);
        }
        if (this.level) this.level.update(dt, this.players[0], this);
        if (this.gameMode === 'pvp') this._resolvePvPCombat(dt);
        else this._resolveCombat(dt);
        this.effects.update(dt);
        this._updateCamera(dt);
        if (this.waveWarningTimer > 0) this.waveWarningTimer -= dt;

        // Check deaths
        for (const p of this.players) {
            if (p.state === 'dead' && p.stateTimer <= 0) {
                if (this.gameMode === 'pvp') {
                    this.pvpWinner = p.playerIndex === 0 ? 1 : 0;
                    this.state = 'victory'; this.ui.victoryAlpha = 0;
                    this.audio.play('levelComplete'); this.audio.stopBGM();
                    return;
                }
                p.lives--;
                if (p.lives <= 0) {
                    // In coop check if other player alive
                    const other = this.players.find(o => o !== p && o.lives > 0);
                    if (!other) {
                        this.state = 'gameOver'; this.ui.gameOverAlpha = 0;
                        this.audio.play('gameOver'); this.audio.stopBGM();
                    }
                } else {
                    p.hp = p.maxHp; p.state = 'idle'; p.invincible = 2000; p.setAnim('idle');
                }
            }
        }
        // Level complete
        if (this.level && this.level.completed && this.gameMode !== 'pvp') {
            this.currentLevel++;
            if (this.currentLevel >= FF.LEVELS.length) {
                this.state = 'victory'; this.ui.victoryAlpha = 0;
                this.audio.play('levelComplete'); this.audio.stopBGM();
                this.players.forEach(p => p.setAnim('victory'));
            } else { this._startLevelTransition(); this.audio.play('levelComplete'); }
        }
    }

    _resolveCombat(dt) {
        if (!this.level) return;
        for (const player of this.players) {
            if (player.state === 'dead') continue;
            const pAtk = player.getAttackBox();
            if (pAtk && !player.attackHit) {
                for (const enemy of this.level.enemies) {
                    if (enemy.dead || enemy.state === 'knockdown') continue;
                    if (this._boxOverlap(pAtk, enemy.getHurtBox())) {
                        player.attackHit = true;
                        const atk = FF.ATTACKS[player.attackName];
                        let dmg = atk.damage;
                        if (player.weapon) dmg *= FF.WEAPONS[player.weapon].damageMult;
                        if (player.comboCount > 2) dmg *= 1 + (player.comboCount - 2) * 0.1;
                        enemy.takeDamage(dmg, atk.knockback, player.facing, atk.knockdown, atk.launcher);
                        player.onHitEnemy(this);
                        const hx = (player.x + enemy.x) / 2, hy = enemy.y - 45;
                        this.effects.addHitFlash(hx, hy);
                        this.effects.spawnHitParticles(hx, hy, 8, '#FFD700');
                        this.effects.addDamageNumber(hx, hy, dmg, player.comboCount >= 5);
                        this.audio.play('hit');
                        if (dmg >= 15) this.effects.shake(dmg * 0.3, 150);
                        if (enemy.hp <= 0) {
                            player.score += enemy.score * (1 + player.comboCount * 0.1);
                            if (this.level.enemies.filter(e => !e.dead && e !== enemy).length === 0) {
                                this.effects.slowMotion(0.2, 600); this.effects.shake(8, 300);
                            }
                            this.effects.spawnHitParticles(hx, hy, 15, '#FF4400');
                            this.audio.play('death');
                        }
                        break;
                    }
                }
            }
            // Enemy attacks
            if (player.invincible <= 0) {
                for (const enemy of this.level.enemies) {
                    if (enemy.dead) continue;
                    const eAtk = enemy.getAttackBox();
                    if (eAtk && !enemy.attackHit && this._boxOverlap(eAtk, player.getHurtBox())) {
                        enemy.attackHit = true;
                        player.takeDamage(enemy.attackDamage, 5, enemy.facing, enemy.type === 'heavy' || enemy.type === 'boss');
                        this.effects.spawnHitParticles(player.x, player.y - 40, 5, '#FF0000');
                        this.effects.shake(3, 100); this.audio.play('hit');
                    }
                }
            }
        }
    }

    _resolvePvPCombat(dt) {
        if (this.players.length < 2) return;
        for (let i = 0; i < 2; i++) {
            const atk = this.players[i], def = this.players[1 - i];
            if (atk.state === 'dead' || def.state === 'dead') continue;
            const aBox = atk.getAttackBox();
            if (aBox && !atk.attackHit && def.invincible <= 0 && this._boxOverlap(aBox, def.getHurtBox())) {
                atk.attackHit = true;
                const atkDef = FF.ATTACKS[atk.attackName];
                let dmg = atkDef.damage;
                if (atk.weapon) dmg *= FF.WEAPONS[atk.weapon].damageMult;
                if (atk.comboCount > 2) dmg *= 1 + (atk.comboCount - 2) * 0.1;
                def.takeDamage(dmg, atkDef.knockback, atk.facing, atkDef.knockdown);
                atk.onHitEnemy(this);
                const hx = (atk.x + def.x) / 2, hy = def.y - 45;
                this.effects.addHitFlash(hx, hy);
                this.effects.spawnHitParticles(hx, hy, 8, i === 0 ? '#FFD700' : '#4488FF');
                this.effects.addDamageNumber(hx, hy, dmg, atk.comboCount >= 5);
                if (dmg >= 15) this.effects.shake(dmg * 0.3, 150);
                this.audio.play('hit');
            }
        }
    }

    _boxOverlap(a, b) {
        return Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
    }

    _updateCamera(dt) {
        let targetX;
        if (this.gameMode === 'pvp' && this.players.length === 2) {
            const midX = (this.players[0].x + this.players[1].x) / 2;
            targetX = midX - this.W * 0.5;
        } else {
            targetX = this.players[0].x - this.W * 0.4;
        }
        const maxCam = this.level ? Math.max(0, this.level.width - this.W) : 0;
        const scrollBound = this.level ? this.level.scrollBoundary : maxCam;
        const clamped = Math.max(0, Math.min(Math.min(maxCam, scrollBound), targetX));
        this.camX += (clamped - this.camX) * FF.CONFIG.CAMERA_FOLLOW_SPEED;
    }

    _startGame(numPlayers) {
        this.currentLevel = 0;
        this.players = [new FF.Player(150, FF.CONFIG.GROUND_Y, 0)];
        if (numPlayers >= 2) this.players.push(new FF.Player(250, FF.CONFIG.GROUND_Y, 1));
        this.effects = new FF.Effects();
        this.ui.gameOverAlpha = 0; this.ui.victoryAlpha = 0;
        this._startLevelTransition();
        this.audio.startBGM();
    }

    _startPvP() {
        this.players = [new FF.Player(250, FF.CONFIG.GROUND_Y, 0), new FF.Player(700, FF.CONFIG.GROUND_Y, 1)];
        this.players[1].facing = -1;
        this.level = new FF.Level(2); // Use rooftop
        this.level.waves = []; this.level.waveActive = false; this.level.completed = false;
        this.level.scrollBoundary = 9999;
        this.effects = new FF.Effects();
        this.ui.gameOverAlpha = 0; this.ui.victoryAlpha = 0;
        this.pvpWinner = -1;
        this.state = 'playing'; this.waveWarningTimer = 0;
        this.audio.startBGM();
    }

    _startLevelTransition() { this.state = 'levelTransition'; this.transitionAlpha = 0; this.transitionPhase = 0; this.transitionTimer = 0; }

    _updateTransition(dt) {
        this.transitionTimer += dt;
        switch (this.transitionPhase) {
            case 0:
                this.transitionAlpha = Math.min(1, this.transitionAlpha + dt * 0.003);
                if (this.transitionAlpha >= 1) {
                    this.transitionPhase = 1; this.transitionTimer = 0;
                    this.level = new FF.Level(this.currentLevel);
                    this.players.forEach((p, i) => { p.x = 150 + i * 80; p.y = FF.CONFIG.GROUND_Y; });
                    this.camX = 0;
                }
                break;
            case 1: if (this.transitionTimer >= 1500) this.transitionPhase = 2; break;
            case 2:
                this.transitionAlpha = Math.max(0, this.transitionAlpha - dt * 0.003);
                if (this.transitionAlpha <= 0) { this.state = 'playing'; this.waveWarningTimer = 2000; }
                break;
        }
    }

    findNearbyWeapon(x, y, r) {
        if (!this.level) return null;
        for (const w of this.level.weaponDrops) if (Math.abs(w.x-x)<r && Math.abs(w.y-y)<r) return w;
        return null;
    }
    removeWeaponDrop(wp) {
        if (!this.level) return;
        const i = this.level.weaponDrops.indexOf(wp); if (i >= 0) this.level.weaponDrops.splice(i, 1);
    }

    _render() {
        const ctx = this.ctx, W = this.W, H = this.H;
        ctx.clearRect(0, 0, W, H);
        switch (this.state) {
            case 'menu': this.ui.renderMenu(ctx, W, H); break;
            case 'modeSelect': this.ui.renderModeSelect(ctx, W, H); break;
            case 'settings': this.ui.renderSettings(ctx, W, H, this.bindings); break;
            case 'playing': case 'paused':
                this._renderGame(ctx, W, H);
                if (this.state === 'paused') this.ui.renderPause(ctx, W, H);
                break;
            case 'levelTransition':
                if (this.transitionPhase >= 1 && this.level) this._renderGame(ctx, W, H);
                this.ui.renderLevelTransition(ctx, W, H, FF.LEVELS[this.currentLevel].name, this.transitionAlpha);
                break;
            case 'gameOver': this._renderGame(ctx, W, H); this.ui.renderGameOver(ctx, W, H, this.players[0].score); break;
            case 'victory':
                this._renderGame(ctx, W, H);
                if (this.gameMode === 'pvp') this.ui.renderPvPVictory(ctx, W, H, this.pvpWinner);
                else this.ui.renderVictory(ctx, W, H, this.players[0].score);
                break;
        }
    }

    _renderGame(ctx, W, H) {
        const shake = this.effects.getShakeOffset();
        ctx.save(); ctx.translate(shake.x, shake.y);
        if (this.level) this.level.renderBackground(ctx, this.camX);
        const entities = [];
        for (const p of this.players) entities.push({ obj: p, y: p.y });
        if (this.level) for (const e of this.level.enemies) if (!e.dead || e.state === 'knockdown') entities.push({ obj: e, y: e.y });
        entities.sort((a, b) => a.y - b.y);
        for (const ent of entities) {
            ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath();
            const sx = ent.obj.x - this.camX, sc = Math.max(0.3, 1 - (FF.CONFIG.GROUND_Y - ent.obj.y) * 0.002);
            ctx.ellipse(sx, FF.CONFIG.GROUND_Y + 3, 18 * sc, 5 * sc, 0, 0, Math.PI * 2);
            ctx.fill(); ctx.restore();
            ent.obj.render(ctx, this.camX);
        }
        this.effects.render(ctx, this.camX);
        ctx.restore();
        // HUD
        if (this.players.length > 0 && this.level) {
            this.ui.renderHUD(ctx, this.players[0], this.level, W, 'left', this.gameMode);
            if (this.players.length > 1) this.ui.renderHUD(ctx, this.players[1], this.level, W, 'right', this.gameMode);
        }
        if (this.waveWarningTimer > 0 && this.gameMode !== 'pvp') this.ui.renderWaveWarning(ctx, W, H);
        if (this.level && !this.level.waveActive && !this.level.completed && this.level.currentWave > 0 && this.gameMode !== 'pvp')
            this.ui.renderGoArrow(ctx, W, H);
    }
};
