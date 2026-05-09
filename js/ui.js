/* ============================================
   Flash Fighter - UI System
   Mode select, Settings, 2P HUD
   ============================================ */
FF.UI = class {
    constructor() {
        this.menuBlink = 0; this.gameOverAlpha = 0; this.victoryAlpha = 0;
        this.settingsPlayer = 0; // 0=P1, 1=P2
        this.settingsAction = 0;
        this.settingsBinding = false; // waiting for key press
        this.settingsActions = ['up','down','left','right','lp','lk','hp','hk','special'];
        this.settingsLabels = ['上移/跳跃','下移/蹲','左移','右移','轻拳(A)','轻脚(B)','重拳(C)','重脚(D)','必杀技'];
    }

    renderMenu(ctx, W, H) {
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H);
        const t = Date.now() * 0.001;
        for (let i = 0; i < 15; i++) {
            ctx.fillStyle = `rgba(204,0,0,${0.03+Math.sin(t+i)*0.02})`;
            ctx.beginPath(); ctx.arc((Math.sin(t+i*0.7)*0.5+0.5)*W, (Math.cos(t*0.8+i*0.5)*0.5+0.5)*H, 30+Math.sin(t+i*2)*15, 0, Math.PI*2); ctx.fill();
        }
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FF2200'; ctx.font = '900 54px "Noto Sans SC",sans-serif';
        ctx.shadowColor = 'rgba(255,34,0,0.6)'; ctx.shadowBlur = 20;
        ctx.fillText('闪客快打', W/2, H*0.3); ctx.shadowBlur = 0;
        ctx.fillStyle = '#FF6644'; ctx.font = '700 18px "Orbitron",monospace';
        ctx.fillText('FLASH FIGHTER', W/2, H*0.3+35);
        ctx.fillStyle = '#888'; ctx.font = '14px "Noto Sans SC",sans-serif';
        ctx.fillText('经典横版格斗 · 双人对战 · HTML5 复刻版', W/2, H*0.3+60);
        this._drawPreview(ctx, W/2-40, H*0.58, FF.CONFIG);
        this._drawPreview2(ctx, W/2+40, H*0.58, FF.CONFIG);
        this.menuBlink += 0.05;
        ctx.globalAlpha = 0.5+Math.sin(this.menuBlink)*0.5;
        ctx.fillStyle = '#FFF'; ctx.font = '700 20px "Noto Sans SC",sans-serif';
        ctx.fillText('按 ENTER 或 空格 开始', W/2, H*0.82);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#555'; ctx.font = '12px "Noto Sans SC",sans-serif';
        ctx.fillText('支持双人游戏 · 键位可自定义 · 拳皇风格操作', W/2, H*0.92);
    }

    _drawPreview(ctx, x, y, C) {
        ctx.save(); ctx.translate(x, y);
        const t = Date.now()*0.003, b = Math.sin(t)*2;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0,2,18,4,0,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle = C.SKIN_COLOR; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-6,-40); ctx.lineTo(-7,-20); ctx.lineTo(-5,0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6,-40); ctx.lineTo(7,-20); ctx.lineTo(5,0); ctx.stroke();
        ctx.fillStyle = C.SHOE_COLOR; ctx.beginPath(); ctx.ellipse(-2,2,9,4,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(8,2,9,4,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = C.JERSEY_COLOR; ctx.fillRect(-13,-70+b,26,30);
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText('24',0,-50+b);
        ctx.strokeStyle = C.SKIN_COLOR; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(-11,-68+b); ctx.lineTo(-18,-54+b); ctx.lineTo(-11,-44+b); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(11,-68+b); ctx.lineTo(18,-54+b); ctx.lineTo(11,-44+b); ctx.stroke();
        ctx.strokeStyle = C.SKIN_COLOR; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(0,-70+b); ctx.lineTo(0,-76+b); ctx.stroke();
        ctx.fillStyle = C.SKIN_COLOR; ctx.beginPath(); ctx.arc(0,-86+b,11,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = C.HAIR_COLOR; ctx.beginPath(); ctx.arc(0,-88+b,12,-Math.PI,0); ctx.fill();
        ctx.fillStyle = C.HEADBAND_COLOR; ctx.fillRect(-12,-90+b,24,3);
        ctx.fillStyle = '#FFF'; ctx.fillRect(2,-89+b,3,3); ctx.fillRect(-2,-89+b,3,3);
        ctx.fillStyle = '#111'; ctx.fillRect(3,-88+b,2,2); ctx.fillRect(-1,-88+b,2,2);
        ctx.fillStyle = '#DDD'; ctx.font = 'bold 10px Arial'; ctx.fillText('P1',0,18);
        ctx.restore();
    }

    _drawPreview2(ctx, x, y, C) {
        ctx.save(); ctx.translate(x, y); ctx.scale(-1,1);
        const t = Date.now()*0.003+1, b = Math.sin(t)*2;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0,2,18,4,0,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle = C.SKIN_COLOR; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-6,-40); ctx.lineTo(-7,-20); ctx.lineTo(-5,0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6,-40); ctx.lineTo(7,-20); ctx.lineTo(5,0); ctx.stroke();
        ctx.fillStyle = C.P2_SHOE; ctx.beginPath(); ctx.ellipse(-2,2,9,4,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(8,2,9,4,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = C.P2_JERSEY; ctx.fillRect(-13,-70+b,26,30);
        ctx.save(); ctx.scale(-1,1);
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText('24',0,-50+b);
        ctx.restore();
        ctx.strokeStyle = C.SKIN_COLOR; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(-11,-68+b); ctx.lineTo(-18,-54+b); ctx.lineTo(-11,-44+b); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(11,-68+b); ctx.lineTo(18,-54+b); ctx.lineTo(11,-44+b); ctx.stroke();
        ctx.strokeStyle = C.SKIN_COLOR; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(0,-70+b); ctx.lineTo(0,-76+b); ctx.stroke();
        ctx.fillStyle = C.SKIN_COLOR; ctx.beginPath(); ctx.arc(0,-86+b,11,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = C.HAIR_COLOR; ctx.beginPath(); ctx.arc(0,-88+b,12,-Math.PI,0); ctx.fill();
        ctx.fillStyle = C.P2_HEADBAND; ctx.fillRect(-12,-90+b,24,3);
        ctx.fillStyle = '#FFF'; ctx.fillRect(2,-89+b,3,3); ctx.fillRect(-2,-89+b,3,3);
        ctx.fillStyle = '#111'; ctx.fillRect(3,-88+b,2,2); ctx.fillRect(-1,-88+b,2,2);
        ctx.save(); ctx.scale(-1,1);
        ctx.fillStyle = '#88BBFF'; ctx.font = 'bold 10px Arial'; ctx.fillText('P2',0,18);
        ctx.restore();
        ctx.restore();
    }

    renderModeSelect(ctx, W, H) {
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FF2200'; ctx.font = '900 36px "Noto Sans SC",sans-serif';
        ctx.fillText('选择模式', W/2, H*0.2);
        const opts = [
            { key: '1', label: '单人闯关', desc: '独自挑战三个关卡' },
            { key: '2', label: '双人合作', desc: '两人一起闯关打敌人' },
            { key: '3', label: '双人对战 (PvP)', desc: 'P1 vs P2 格斗对决' },
            { key: '4', label: '键位设置', desc: '自定义操作按键' }
        ];
        opts.forEach((o, i) => {
            const y = H * 0.35 + i * 70;
            ctx.fillStyle = '#222'; ctx.fillRect(W/2-200, y-20, 400, 55);
            ctx.strokeStyle = '#444'; ctx.lineWidth = 1; ctx.strokeRect(W/2-200, y-20, 400, 55);
            ctx.fillStyle = '#FFD700'; ctx.font = '700 14px "Orbitron",monospace'; ctx.textAlign = 'left';
            ctx.fillText(`[${o.key}]`, W/2-180, y+5);
            ctx.fillStyle = '#FFF'; ctx.font = '700 18px "Noto Sans SC",sans-serif';
            ctx.fillText(o.label, W/2-130, y+5);
            ctx.fillStyle = '#888'; ctx.font = '12px "Noto Sans SC",sans-serif';
            ctx.fillText(o.desc, W/2-130, y+25);
        });
        ctx.textAlign = 'center'; ctx.fillStyle = '#555'; ctx.font = '12px "Noto Sans SC",sans-serif';
        ctx.fillText('按对应数字键选择 · ESC 返回', W/2, H*0.92);
    }

    // Settings screen
    settingsInit(bindings) { this.settingsPlayer = 0; this.settingsAction = 0; this.settingsBinding = false; }

    settingsUpdate(kb, bindings) {
        if (this.settingsBinding) {
            // Wait for any key press to bind
            for (const code in kb.justPressed) {
                if (code === 'Escape') { this.settingsBinding = false; return; }
                const pKey = this.settingsPlayer === 0 ? 'p1' : 'p2';
                const action = this.settingsActions[this.settingsAction];
                bindings[pKey][action] = code;
                this.settingsBinding = false;
                return;
            }
            return;
        }
        if (kb.wasPressed('ArrowUp') || kb.wasPressed('KeyW')) { this.settingsAction = (this.settingsAction - 1 + this.settingsActions.length) % this.settingsActions.length; }
        if (kb.wasPressed('ArrowDown') || kb.wasPressed('KeyS')) { this.settingsAction = (this.settingsAction + 1) % this.settingsActions.length; }
        if (kb.wasPressed('ArrowLeft') || kb.wasPressed('KeyA')) { this.settingsPlayer = 0; }
        if (kb.wasPressed('ArrowRight') || kb.wasPressed('KeyD')) { this.settingsPlayer = 1; }
        if (kb.wasPressed('Enter')) { this.settingsBinding = true; }
    }

    renderSettings(ctx, W, H, bindings) {
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700'; ctx.font = '900 28px "Noto Sans SC",sans-serif';
        ctx.fillText('键位设置', W/2, 40);
        ctx.fillStyle = '#888'; ctx.font = '12px "Noto Sans SC",sans-serif';
        ctx.fillText('←→ 切换玩家 · ↑↓ 选择动作 · Enter 修改按键 · ESC 保存返回', W/2, 65);

        // Player tabs
        for (let p = 0; p < 2; p++) {
            const tx = W/2 - 150 + p * 300;
            ctx.fillStyle = this.settingsPlayer === p ? '#FF2200' : '#444';
            ctx.font = '700 20px "Noto Sans SC",sans-serif';
            ctx.fillText(p === 0 ? 'P1 玩家一' : 'P2 玩家二', tx, 100);
        }

        // Key list
        const pKey = this.settingsPlayer === 0 ? 'p1' : 'p2';
        const bds = bindings[pKey];
        const startY = 130;
        this.settingsActions.forEach((action, i) => {
            const y = startY + i * 38;
            const selected = i === this.settingsAction;
            if (selected) { ctx.fillStyle = 'rgba(255,34,0,0.15)'; ctx.fillRect(W/2-250, y-12, 500, 32); }
            ctx.textAlign = 'left';
            ctx.fillStyle = selected ? '#FFD700' : '#AAA';
            ctx.font = `${selected?'700':'400'} 16px "Noto Sans SC",sans-serif`;
            ctx.fillText(this.settingsLabels[i], W/2-220, y+8);
            ctx.textAlign = 'right';
            const keyName = this._keyName(bds[action]);
            ctx.fillStyle = selected ? '#FFF' : '#888';
            ctx.font = '700 16px "Orbitron",monospace';
            if (this.settingsBinding && selected) {
                ctx.fillStyle = '#FF4400';
                ctx.fillText('[ 按下新按键... ]', W/2+220, y+8);
            } else {
                ctx.fillText(keyName, W/2+220, y+8);
            }
        });

        // Preview
        ctx.textAlign = 'center'; ctx.fillStyle = '#555'; ctx.font = '12px "Noto Sans SC",sans-serif';
        ctx.fillText('拳皇风格: 轻拳轻脚可连打组合连招，重拳重脚为终结技', W/2, H-30);
    }

    _keyName(code) {
        const map = {
            'KeyA':'A','KeyB':'B','KeyC':'C','KeyD':'D','KeyE':'E','KeyF':'F','KeyG':'G','KeyH':'H',
            'KeyI':'I','KeyJ':'J','KeyK':'K','KeyL':'L','KeyM':'M','KeyN':'N','KeyO':'O','KeyP':'P',
            'KeyQ':'Q','KeyR':'R','KeyS':'S','KeyT':'T','KeyU':'U','KeyV':'V','KeyW':'W','KeyX':'X',
            'KeyY':'Y','KeyZ':'Z',
            'Digit1':'1','Digit2':'2','Digit3':'3','Digit4':'4','Digit5':'5','Digit6':'6','Digit7':'7','Digit8':'8','Digit9':'9','Digit0':'0',
            'ArrowUp':'↑','ArrowDown':'↓','ArrowLeft':'←','ArrowRight':'→',
            'Space':'空格','Enter':'回车','ShiftLeft':'左Shift','ShiftRight':'右Shift',
            'ControlLeft':'左Ctrl','ControlRight':'右Ctrl',
            'Numpad0':'Num0','Numpad1':'Num1','Numpad2':'Num2','Numpad3':'Num3','Numpad4':'Num4',
            'Numpad5':'Num5','Numpad6':'Num6','Numpad7':'Num7','Numpad8':'Num8','Numpad9':'Num9',
        };
        return map[code] || code;
    }

    renderHUD(ctx, player, level, W, side, mode) {
        const pad = 15;
        const isLeft = side === 'left';
        const bx = isLeft ? pad : W - pad - 200;

        // HP
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx, pad, 200, 18);
        const hpPct = player.hp / player.maxHp;
        const hpGrd = ctx.createLinearGradient(bx, 0, bx+200, 0);
        const hpColor = player.playerIndex === 0 ? (hpPct > 0.3 ? '#00CC44' : '#FF2200') : (hpPct > 0.3 ? '#2266FF' : '#FF2200');
        const hpColor2 = player.playerIndex === 0 ? (hpPct > 0.3 ? '#44FF88' : '#FF6644') : (hpPct > 0.3 ? '#66AAFF' : '#FF6644');
        hpGrd.addColorStop(0, hpColor); hpGrd.addColorStop(1, hpColor2);
        ctx.fillStyle = hpGrd;
        if (isLeft) ctx.fillRect(bx+2, pad+2, 196*hpPct, 14);
        else ctx.fillRect(bx+198-196*hpPct, pad+2, 196*hpPct, 14);
        ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.strokeRect(bx, pad, 200, 18);
        ctx.fillStyle = '#FFF'; ctx.font = '700 11px "Orbitron",monospace';
        ctx.textAlign = isLeft ? 'left' : 'right';
        ctx.fillText(isLeft ? 'P1' : 'P2', isLeft ? bx+5 : bx+195, pad+14);
        ctx.textAlign = isLeft ? 'right' : 'left';
        ctx.fillText(`${Math.ceil(player.hp)}/${player.maxHp}`, isLeft ? bx+195 : bx+5, pad+14);

        // Rage
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx, pad+24, 150, 10);
        const ragePct = player.rage / FF.CONFIG.PLAYER_RAGE_MAX;
        ctx.fillStyle = '#FF6600'; ctx.fillRect(bx+1, pad+25, 148*ragePct, 8);
        if (ragePct >= 1) { ctx.fillStyle = `rgba(255,215,0,${0.3+Math.sin(Date.now()*0.01)*0.2})`; ctx.fillRect(bx+1, pad+25, 148, 8); }
        ctx.fillStyle = '#FFD700'; ctx.font = '700 8px "Orbitron",monospace';
        ctx.textAlign = isLeft ? 'left' : 'right';
        ctx.fillText('RAGE', isLeft ? bx+3 : bx+147, pad+33);

        // Score
        ctx.fillStyle = '#FFD700'; ctx.font = '700 12px "Orbitron",monospace';
        ctx.textAlign = isLeft ? 'left' : 'right';
        ctx.fillText(`SCORE:${Math.round(player.score)}`, isLeft ? bx : bx+200, pad+50);

        // Lives
        ctx.fillStyle = '#FF4444'; ctx.font = '12px sans-serif';
        ctx.fillText('❤'.repeat(Math.max(0, player.lives)), isLeft ? bx : bx+200, pad+66);

        // Weapon
        if (player.weapon) {
            ctx.fillStyle = '#FFF'; ctx.font = '11px "Noto Sans SC",sans-serif';
            ctx.fillText(`🗡 ${FF.WEAPONS[player.weapon].name}(${player.weaponDurability})`, isLeft ? bx : bx+200, pad+82);
        }

        // Level info (center, only once)
        if (isLeft && level && mode !== 'pvp') {
            ctx.textAlign = 'center'; ctx.fillStyle = '#AAA'; ctx.font = '12px "Noto Sans SC",sans-serif';
            ctx.fillText(level.name, W/2, pad+14);
            ctx.fillStyle = '#666'; ctx.font = '10px "Orbitron",monospace';
            ctx.fillText(`WAVE ${Math.min(level.currentWave+1,level.waves.length)}/${level.waves.length}`, W/2, pad+28);
        }
        if (isLeft && mode === 'pvp') {
            ctx.textAlign = 'center'; ctx.fillStyle = '#FF4400'; ctx.font = '700 16px "Noto Sans SC",sans-serif';
            ctx.fillText('⚔ P1 vs P2 ⚔', W/2, pad+16);
        }

        // Controls at bottom
        if (isLeft) {
            ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.font = '10px "Noto Sans SC",sans-serif';
            ctx.fillText('轻拳/轻脚连打连招 · 重拳/重脚终结 · ESC暂停', W/2, FF.CONFIG.CANVAS_HEIGHT-8);
        }
    }

    renderPause(ctx, W, H) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center'; ctx.fillStyle = '#FFF'; ctx.font = '900 36px "Noto Sans SC",sans-serif';
        ctx.fillText('游戏暂停', W/2, H*0.4);
        ctx.fillStyle = '#AAA'; ctx.font = '16px "Noto Sans SC",sans-serif';
        ctx.fillText('按 ESC 继续', W/2, H*0.5);
        ctx.fillText('按 ENTER 返回菜单', W/2, H*0.57);
    }

    renderLevelTransition(ctx, W, H, text, alpha) {
        ctx.fillStyle = `rgba(0,0,0,${alpha})`; ctx.fillRect(0, 0, W, H);
        if (alpha > 0.5) {
            ctx.globalAlpha = (alpha-0.5)*2; ctx.textAlign = 'center';
            ctx.fillStyle = '#FF2200'; ctx.font = '900 32px "Noto Sans SC",sans-serif';
            ctx.fillText(text, W/2, H*0.45);
            ctx.fillStyle = '#FFF'; ctx.font = '16px "Noto Sans SC",sans-serif';
            ctx.fillText('准备战斗！', W/2, H*0.55);
            ctx.globalAlpha = 1;
        }
    }

    renderGameOver(ctx, W, H, score) {
        this.gameOverAlpha = Math.min(1, this.gameOverAlpha+0.02);
        ctx.fillStyle = `rgba(10,0,0,${this.gameOverAlpha*0.85})`; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = this.gameOverAlpha; ctx.textAlign = 'center';
        ctx.fillStyle = '#CC0000'; ctx.font = '900 48px "Noto Sans SC",sans-serif';
        ctx.shadowColor = 'rgba(204,0,0,0.5)'; ctx.shadowBlur = 15;
        ctx.fillText('GAME OVER', W/2, H*0.38); ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFF'; ctx.font = '20px "Orbitron",monospace';
        ctx.fillText(`SCORE: ${Math.round(score)}`, W/2, H*0.48);
        if (Math.floor(Date.now()/500)%2===0) {
            ctx.fillStyle = '#AAA'; ctx.font = '16px "Noto Sans SC",sans-serif';
            ctx.fillText('按 ENTER 返回', W/2, H*0.6);
        }
        ctx.globalAlpha = 1;
    }

    renderVictory(ctx, W, H, score) {
        this.victoryAlpha = Math.min(1, this.victoryAlpha+0.015);
        ctx.fillStyle = `rgba(0,0,0,${this.victoryAlpha*0.8})`; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = this.victoryAlpha; ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700'; ctx.font = '900 48px "Noto Sans SC",sans-serif';
        ctx.shadowColor = 'rgba(255,215,0,0.5)'; ctx.shadowBlur = 20;
        ctx.fillText('通关成功！', W/2, H*0.35); ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFF'; ctx.font = '900 28px "Orbitron",monospace';
        ctx.fillText(`SCORE: ${Math.round(score)}`, W/2, H*0.48);
        if (Math.floor(Date.now()/500)%2===0) { ctx.fillStyle = '#AAA'; ctx.font = '16px "Noto Sans SC",sans-serif'; ctx.fillText('按 ENTER 返回', W/2, H*0.6); }
        ctx.globalAlpha = 1;
    }

    renderPvPVictory(ctx, W, H, winner) {
        this.victoryAlpha = Math.min(1, this.victoryAlpha+0.02);
        ctx.fillStyle = `rgba(0,0,0,${this.victoryAlpha*0.8})`; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = this.victoryAlpha; ctx.textAlign = 'center';
        const color = winner === 0 ? '#FF2200' : '#2266FF';
        ctx.fillStyle = color; ctx.font = '900 48px "Noto Sans SC",sans-serif';
        ctx.shadowColor = color; ctx.shadowBlur = 20;
        ctx.fillText(`P${winner+1} 胜利！`, W/2, H*0.4); ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFF'; ctx.font = '20px "Noto Sans SC",sans-serif';
        ctx.fillText('🏆 恭喜获胜！', W/2, H*0.52);
        if (Math.floor(Date.now()/500)%2===0) { ctx.fillStyle = '#AAA'; ctx.font = '16px "Noto Sans SC",sans-serif'; ctx.fillText('按 ENTER 返回', W/2, H*0.65); }
        ctx.globalAlpha = 1;
    }

    renderWaveWarning(ctx, W, H) {
        ctx.globalAlpha = 0.5+Math.sin(Date.now()*0.008)*0.3;
        ctx.textAlign = 'center'; ctx.fillStyle = '#FF4400'; ctx.font = '700 24px "Noto Sans SC",sans-serif';
        ctx.fillText('⚔ 敌人来袭！', W/2, H*0.15);
        ctx.globalAlpha = 1;
    }

    renderGoArrow(ctx, W, H) {
        const ox = Math.sin(Date.now()*0.005)*10;
        ctx.fillStyle = '#FFD700'; ctx.font = '700 20px "Noto Sans SC",sans-serif'; ctx.textAlign = 'right';
        ctx.fillText('前进 →→', W-20+ox, H*0.5);
    }
};
