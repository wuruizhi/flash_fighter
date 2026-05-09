/* ============================================
   Flash Fighter - Level Manager
   ============================================ */
FF.Level = class {
    constructor(levelIndex) {
        const def = FF.LEVELS[levelIndex];
        this.index = levelIndex;
        this.name = def.name;
        this.bgType = def.bgType;
        this.width = def.width;
        this.waves = JSON.parse(JSON.stringify(def.waves));
        this.weaponTypes = def.weapons || [];
        this.currentWave = 0;
        this.waveActive = false;
        this.waveDelay = 0;
        this.completed = false;
        this.enemies = [];
        this.weaponDrops = [];
        this.scrollBoundary = 0;
        this.bgOffset = 0;
    }

    update(dt, player, game) {
        if (this.completed) return;

        // Wave management
        if (!this.waveActive && this.currentWave < this.waves.length) {
            this.waveDelay -= dt;
            if (this.waveDelay <= 0) {
                this._spawnWave(player, game);
            }
        }

        // Check wave clear
        if (this.waveActive) {
            const alive = this.enemies.filter(e => !e.dead);
            if (alive.length === 0) {
                this.waveActive = false;
                this.currentWave++;
                if (this.currentWave >= this.waves.length) {
                    this.completed = true;
                } else {
                    this.waveDelay = 1500;
                    // Drop weapon after clearing wave
                    if (Math.random() < 0.5 && this.weaponTypes.length > 0) {
                        const wt = this.weaponTypes[Math.floor(Math.random() * this.weaponTypes.length)];
                        this.weaponDrops.push({ type: wt, x: player.x + (Math.random() - 0.5) * 100, y: FF.CONFIG.GROUND_Y });
                    }
                    // Unlock scrolling
                    this.scrollBoundary = Math.min(this.width - FF.CONFIG.CANVAS_WIDTH, this.scrollBoundary + FF.CONFIG.CANVAS_WIDTH * 0.6);
                }
            }
        }

        // Update enemies
        for (const e of this.enemies) {
            e.update(dt, player, game);
        }
    }

    _spawnWave(player, game) {
        const wave = this.waves[this.currentWave];
        this.waveActive = true;
        let spawnDelay = 0;
        for (const group of wave.enemies) {
            for (let i = 0; i < group.count; i++) {
                const side = Math.random() > 0.5 ? 1 : -1;
                const spawnX = player.x + side * (FF.CONFIG.CANVAS_WIDTH * 0.5 + 50 + Math.random() * 100);
                const enemy = new FF.Enemy(group.type, Math.max(20, Math.min(this.width - 20, spawnX)), FF.CONFIG.GROUND_Y);
                enemy.facing = -side;
                this.enemies.push(enemy);
            }
        }
    }

    renderBackground(ctx, camX) {
        switch (this.bgType) {
            case 'street': this._drawStreet(ctx, camX); break;
            case 'alley': this._drawAlley(ctx, camX); break;
            case 'rooftop': this._drawRooftop(ctx, camX); break;
        }
    }

    _drawStreet(ctx, camX) {
        const W = FF.CONFIG.CANVAS_WIDTH;
        const H = FF.CONFIG.CANVAS_HEIGHT;
        const GY = FF.CONFIG.GROUND_Y;

        // Sky gradient
        const sky = ctx.createLinearGradient(0, 0, 0, GY);
        sky.addColorStop(0, '#1a1a2e');
        sky.addColorStop(0.5, '#16213e');
        sky.addColorStop(1, '#0f3460');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, GY);

        // Stars
        for (let i = 0; i < 30; i++) {
            const sx = ((i * 137 + 50) % W);
            const sy = ((i * 89 + 20) % (GY * 0.6));
            ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.4})`;
            ctx.fillRect(sx, sy, 1.5, 1.5);
        }

        // Moon
        ctx.fillStyle = '#FFE4B5';
        ctx.beginPath();
        ctx.arc(W - 100, 60, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(W - 90, 55, 22, 0, Math.PI * 2);
        ctx.fill();

        // Background buildings (parallax)
        const bgScroll = camX * 0.2;
        ctx.fillStyle = '#0d1b2a';
        for (let i = 0; i < 12; i++) {
            const bx = i * 120 - (bgScroll % 120) - 60;
            const bh = 100 + ((i * 73) % 150);
            ctx.fillRect(bx, GY - bh, 90, bh);
            // Windows
            ctx.fillStyle = '#1a3a5c';
            for (let wy = GY - bh + 15; wy < GY - 10; wy += 20) {
                for (let wx = bx + 10; wx < bx + 80; wx += 18) {
                    if (Math.random() > 0.3) {
                        ctx.fillStyle = Math.random() > 0.5 ? '#FFD700' : '#1a3a5c';
                        ctx.fillRect(wx, wy, 8, 10);
                    }
                }
            }
            ctx.fillStyle = '#0d1b2a';
        }

        // Midground buildings
        const mgScroll = camX * 0.5;
        ctx.fillStyle = '#162447';
        for (let i = 0; i < 8; i++) {
            const bx = i * 180 - (mgScroll % 180) - 90;
            const bh = 60 + ((i * 97) % 100);
            ctx.fillRect(bx, GY - bh, 140, bh);
        }

        // Ground
        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(0, GY, W, H - GY);

        // Road markings
        ctx.fillStyle = '#3d3d3d';
        ctx.fillRect(0, GY, W, 3);
        ctx.fillStyle = '#555';
        const roadScroll = camX % 80;
        for (let i = -1; i < W / 80 + 1; i++) {
            ctx.fillRect(i * 80 - roadScroll, GY + 40, 40, 3);
        }

        // Sidewalk
        ctx.fillStyle = '#383838';
        ctx.fillRect(0, GY, W, 8);

        // Street lights
        const slScroll = camX % 300;
        for (let i = -1; i < W / 300 + 2; i++) {
            const sx = i * 300 - slScroll;
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(sx, GY);
            ctx.lineTo(sx, GY - 120);
            ctx.lineTo(sx + 15, GY - 125);
            ctx.stroke();
            // Light glow
            const grd = ctx.createRadialGradient(sx + 15, GY - 125, 2, sx + 15, GY - 125, 60);
            grd.addColorStop(0, 'rgba(255,220,150,0.3)');
            grd.addColorStop(1, 'rgba(255,220,150,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(sx - 50, GY - 185, 130, 120);
        }

        // Weapon drops
        this._renderWeaponDrops(ctx, camX);
    }

    _drawAlley(ctx, camX) {
        const W = FF.CONFIG.CANVAS_WIDTH;
        const H = FF.CONFIG.CANVAS_HEIGHT;
        const GY = FF.CONFIG.GROUND_Y;

        // Dark sky
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, W, GY);

        // Brick walls
        const wallScroll = camX * 0.3;
        ctx.fillStyle = '#1a1210';
        ctx.fillRect(0, 80, W, GY - 80);
        // Brick pattern
        ctx.strokeStyle = '#2a1e18';
        ctx.lineWidth = 0.5;
        for (let y = 90; y < GY; y += 12) {
            const offset = (Math.floor(y / 12) % 2) * 15;
            for (let x = -30 + offset - (wallScroll % 30); x < W + 30; x += 30) {
                ctx.strokeRect(x, y, 28, 10);
            }
        }

        // Graffiti splotches
        ctx.fillStyle = 'rgba(200,50,50,0.15)';
        ctx.fillRect(200 - (wallScroll % 400), 200, 80, 40);
        ctx.fillStyle = 'rgba(50,50,200,0.12)';
        ctx.fillRect(500 - (wallScroll % 600), 180, 60, 50);

        // Dumpsters
        const dumpScroll = camX * 0.7;
        for (let i = 0; i < 3; i++) {
            const dx = 350 * i + 100 - (dumpScroll % 1050);
            if (dx > -60 && dx < W + 60) {
                ctx.fillStyle = '#2a4a2a';
                ctx.fillRect(dx, GY - 40, 50, 40);
                ctx.fillStyle = '#1a3a1a';
                ctx.fillRect(dx, GY - 42, 50, 5);
            }
        }

        // Ground
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, GY, W, H - GY);
        ctx.fillStyle = '#222';
        ctx.fillRect(0, GY, W, 3);

        // Puddles
        ctx.fillStyle = 'rgba(30,40,60,0.4)';
        const pudScroll = camX % 500;
        ctx.beginPath();
        ctx.ellipse(200 - pudScroll, GY + 30, 40, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dim light
        const grd = ctx.createRadialGradient(W / 2, GY - 100, 10, W / 2, GY, 200);
        grd.addColorStop(0, 'rgba(255,200,100,0.08)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);

        this._renderWeaponDrops(ctx, camX);
    }

    _drawRooftop(ctx, camX) {
        const W = FF.CONFIG.CANVAS_WIDTH;
        const H = FF.CONFIG.CANVAS_HEIGHT;
        const GY = FF.CONFIG.GROUND_Y;

        // Sunset/dusk sky
        const sky = ctx.createLinearGradient(0, 0, 0, GY);
        sky.addColorStop(0, '#0f0c29');
        sky.addColorStop(0.4, '#302b63');
        sky.addColorStop(0.7, '#24243e');
        sky.addColorStop(1, '#e94560');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, GY);

        // City skyline (far)
        const farScroll = camX * 0.1;
        ctx.fillStyle = '#1a1a2e';
        for (let i = 0; i < 20; i++) {
            const bx = i * 80 - (farScroll % 80) - 40;
            const bh = 80 + ((i * 61) % 200);
            ctx.fillRect(bx, GY - bh, 60, bh);
        }

        // City skyline (near)
        const nearScroll = camX * 0.3;
        ctx.fillStyle = '#16213e';
        for (let i = 0; i < 12; i++) {
            const bx = i * 130 - (nearScroll % 130) - 65;
            const bh = 50 + ((i * 83) % 120);
            ctx.fillRect(bx, GY - bh, 100, bh);
            // Lit windows
            for (let wy = GY - bh + 10; wy < GY; wy += 15) {
                for (let wx = bx + 8; wx < bx + 90; wx += 14) {
                    if (((wx * 7 + wy * 3) % 11) < 4) {
                        ctx.fillStyle = '#FFD700';
                        ctx.fillRect(wx, wy, 6, 8);
                    }
                }
                ctx.fillStyle = '#16213e';
            }
        }

        // Rooftop surface
        ctx.fillStyle = '#333';
        ctx.fillRect(0, GY, W, H - GY);
        ctx.fillStyle = '#444';
        ctx.fillRect(0, GY, W, 4);

        // Rooftop details
        const dtlScroll = camX * 0.8;
        // Pipes
        ctx.fillStyle = '#555';
        ctx.fillRect(100 - (dtlScroll % 800), GY - 30, 8, 30);
        ctx.fillRect(600 - (dtlScroll % 800), GY - 45, 6, 45);
        // Antenna
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        const antX = 400 - (dtlScroll % 900);
        ctx.beginPath();
        ctx.moveTo(antX, GY);
        ctx.lineTo(antX, GY - 80);
        ctx.moveTo(antX - 15, GY - 60);
        ctx.lineTo(antX + 15, GY - 60);
        ctx.moveTo(antX - 10, GY - 70);
        ctx.lineTo(antX + 10, GY - 70);
        ctx.stroke();
        // Blinking red light
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(antX, GY - 80, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        this._renderWeaponDrops(ctx, camX);
    }

    _renderWeaponDrops(ctx, camX) {
        for (const w of this.weaponDrops) {
            const wp = FF.WEAPONS[w.type];
            if (!wp) continue;
            const dx = w.x - camX;
            // Glow
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.15;
            const grd = ctx.createRadialGradient(dx, w.y - 5, 2, dx, w.y - 5, 25);
            grd.addColorStop(0, 'rgba(255,255,100,0.5)');
            grd.addColorStop(1, 'rgba(255,255,100,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(dx - 25, w.y - 30, 50, 50);
            ctx.restore();
            // Weapon
            ctx.strokeStyle = wp.color;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(dx - 12, w.y - 5);
            ctx.lineTo(dx + 12, w.y - 5);
            ctx.stroke();
            // Label
            ctx.fillStyle = '#FFF';
            ctx.font = '10px "Noto Sans SC", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(wp.name, dx, w.y - 18);
            ctx.fillText('↓拾取', dx, w.y + 12);
        }
    }
};
