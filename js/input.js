/* ============================================
   Flash Fighter - Multi-Player Input Manager
   Configurable key bindings, 2-player support
   ============================================ */
FF.KeyboardState = class {
    constructor() {
        this.keys = {};
        this.justPressed = {};
        window.addEventListener('keydown', e => {
            e.preventDefault();
            if (!this.keys[e.code]) { this.keys[e.code] = true; this.justPressed[e.code] = true; }
        });
        window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    }
    isDown(c) { return !!this.keys[c]; }
    wasPressed(c) { return !!this.justPressed[c]; }
    pressVirtual(c) {
        if (!c) return;
        if (!this.keys[c]) this.justPressed[c] = true;
        this.keys[c] = true;
    }
    releaseVirtual(c) {
        if (!c) return;
        this.keys[c] = false;
    }
    clear() { this.justPressed = {}; }
};

FF.PlayerInput = class {
    constructor(bindings, keyboard) {
        this.bindings = { ...bindings };
        this.kb = keyboard;
        this.dashState = { left: 0, right: 0 };
        this.dashThreshold = 250;
        this._prevLeft = false;
        this._prevRight = false;
        this._dashLeft = false;
        this._dashRight = false;
    }

    update() {
        // Detect dash (double-tap direction)
        this._dashLeft = false;
        this._dashRight = false;
        const nowL = this.kb.wasPressed(this.bindings.left);
        const nowR = this.kb.wasPressed(this.bindings.right);
        const now = performance.now();
        if (nowL) {
            if (now - this.dashState.left < this.dashThreshold) this._dashLeft = true;
            this.dashState.left = now;
        }
        if (nowR) {
            if (now - this.dashState.right < this.dashThreshold) this._dashRight = true;
            this.dashState.right = now;
        }
    }

    get left()    { return this.kb.isDown(this.bindings.left); }
    get right()   { return this.kb.isDown(this.bindings.right); }
    get up()      { return this.kb.isDown(this.bindings.up); }
    get down()    { return this.kb.isDown(this.bindings.down); }
    get jump()    { return this.kb.wasPressed(this.bindings.up); }
    get lp()      { return this.kb.wasPressed(this.bindings.lp); }
    get lk()      { return this.kb.wasPressed(this.bindings.lk); }
    get hp()      { return this.kb.wasPressed(this.bindings.hp); }
    get hk()      { return this.kb.wasPressed(this.bindings.hk); }
    get special() { return this.kb.wasPressed(this.bindings.special); }
    get dash()    { return this.kb.isDown(this.bindings.dash); }
    get dashLeft(){ return this._dashLeft; }
    get dashRight(){ return this._dashRight; }
    get pause()   { return this.kb.wasPressed('Escape'); }
    get confirm() { return this.kb.wasPressed('Enter') || this.kb.wasPressed('Space') || this.kb.wasPressed('Numpad0'); }

    getAttackKey() {
        if (this.lp) return 'lp';
        if (this.lk) return 'lk';
        if (this.hp) return 'hp';
        if (this.hk) return 'hk';
        return null;
    }
};

FF.TouchControls = class {
    constructor(keyboard, bindings) {
        this.kb = keyboard;
        this.bindings = { ...bindings };
        this.active = new Map();
        this.root = document.createElement('div');
        this.root.id = 'touch-controls';
        this.root.setAttribute('aria-hidden', 'true');
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.body.classList.add('touch-capable');
        this.root.innerHTML = `
            <div class="touch-menu">
                <button class="touch-btn touch-small touch-start" data-action="confirm" type="button">START</button>
                <button class="touch-btn touch-small touch-mode" data-action="story" type="button">1P</button>
                <button class="touch-btn touch-small touch-mode" data-action="coop" type="button">2P</button>
                <button class="touch-btn touch-small touch-mode" data-action="pvp" type="button">PVP</button>
                <button class="touch-btn touch-small touch-pause" data-action="pause" type="button">PAUSE</button>
            </div>
            <div class="touch-dpad">
                <button class="touch-btn touch-dir touch-up" data-action="up" type="button">^</button>
                <button class="touch-btn touch-dir touch-left" data-action="left" type="button">&lt;</button>
                <button class="touch-btn touch-dir touch-down" data-action="down" type="button">v</button>
                <button class="touch-btn touch-dir touch-right" data-action="right" type="button">&gt;</button>
            </div>
            <div class="touch-actions">
                <button class="touch-btn touch-run" data-action="dash" type="button">RUN</button>
                <button class="touch-btn touch-action" data-action="hp" type="button">HP</button>
                <button class="touch-btn touch-action" data-action="hk" type="button">HK</button>
                <button class="touch-btn touch-action" data-action="lp" type="button">LP</button>
                <button class="touch-btn touch-action" data-action="lk" type="button">LK</button>
                <button class="touch-btn touch-special" data-action="special" type="button">SP</button>
            </div>
        `;
        document.getElementById('game-container').appendChild(this.root);
        this._bindButtons();
    }

    setBindings(bindings) {
        this.bindings = { ...bindings };
    }

    setState(state) {
        this.root.dataset.state = state;
    }

    _codeFor(action) {
        if (action === 'confirm') return 'Enter';
        if (action === 'pause') return 'Escape';
        if (action === 'story') return 'Digit1';
        if (action === 'coop') return 'Digit2';
        if (action === 'pvp') return 'Digit3';
        return this.bindings[action];
    }

    _press(action, btn, id) {
        this.active.set(id, { action, btn });
        this.kb.pressVirtual(this._codeFor(action));
        btn.classList.add('is-active');
    }

    _release(id) {
        const item = this.active.get(id);
        if (!item) return;
        this.kb.releaseVirtual(this._codeFor(item.action));
        item.btn.classList.remove('is-active');
        this.active.delete(id);
    }

    _bindButtons() {
        const buttons = this.root.querySelectorAll('[data-action]');
        buttons.forEach(btn => {
            const action = btn.dataset.action;
            const pointerPress = e => {
                e.preventDefault();
                if (btn.setPointerCapture && e.pointerId !== undefined) {
                    try { btn.setPointerCapture(e.pointerId); } catch (err) {}
                }
                this._press(action, btn, e.pointerId !== undefined ? e.pointerId : 'mouse');
            };
            const pointerRelease = e => {
                this._release(e.pointerId !== undefined ? e.pointerId : 'mouse');
            };
            btn.addEventListener('pointerdown', pointerPress);
            btn.addEventListener('pointerup', pointerRelease);
            btn.addEventListener('pointercancel', pointerRelease);
            btn.addEventListener('lostpointercapture', pointerRelease);
            btn.addEventListener('touchstart', e => {
                if (window.PointerEvent) return;
                e.preventDefault();
                for (const t of e.changedTouches) this._press(action, btn, t.identifier);
            }, { passive:false });
            btn.addEventListener('touchend', e => {
                if (window.PointerEvent) return;
                e.preventDefault();
                for (const t of e.changedTouches) this._release(t.identifier);
            }, { passive:false });
            btn.addEventListener('touchcancel', e => {
                if (window.PointerEvent) return;
                e.preventDefault();
                for (const t of e.changedTouches) this._release(t.identifier);
            }, { passive:false });
        });
    }
};
