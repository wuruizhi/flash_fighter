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
        this.root.innerHTML = `
            <div class="touch-menu">
                <button class="touch-btn touch-small" data-action="confirm">START</button>
                <button class="touch-btn touch-small" data-action="pause">PAUSE</button>
            </div>
            <div class="touch-dpad">
                <button class="touch-btn touch-dir touch-up" data-action="up">^</button>
                <button class="touch-btn touch-dir touch-left" data-action="left">&lt;</button>
                <button class="touch-btn touch-dir touch-down" data-action="down">v</button>
                <button class="touch-btn touch-dir touch-right" data-action="right">&gt;</button>
            </div>
            <div class="touch-actions">
                <button class="touch-btn touch-run" data-action="dash">RUN</button>
                <button class="touch-btn touch-action" data-action="hp">HP</button>
                <button class="touch-btn touch-action" data-action="hk">HK</button>
                <button class="touch-btn touch-action" data-action="lp">LP</button>
                <button class="touch-btn touch-action" data-action="lk">LK</button>
                <button class="touch-btn touch-special" data-action="special">SP</button>
            </div>
        `;
        document.getElementById('game-container').appendChild(this.root);
        this._bindButtons();
    }

    setBindings(bindings) {
        this.bindings = { ...bindings };
    }

    _codeFor(action) {
        if (action === 'confirm') return 'Enter';
        if (action === 'pause') return 'Escape';
        return this.bindings[action];
    }

    _bindButtons() {
        const buttons = this.root.querySelectorAll('[data-action]');
        buttons.forEach(btn => {
            const action = btn.dataset.action;
            const press = e => {
                e.preventDefault();
                btn.setPointerCapture(e.pointerId);
                this.active.set(e.pointerId, { action, btn });
                this.kb.pressVirtual(this._codeFor(action));
                btn.classList.add('is-active');
            };
            const release = e => {
                const item = this.active.get(e.pointerId);
                if (!item) return;
                this.kb.releaseVirtual(this._codeFor(item.action));
                item.btn.classList.remove('is-active');
                this.active.delete(e.pointerId);
            };
            btn.addEventListener('pointerdown', press);
            btn.addEventListener('pointerup', release);
            btn.addEventListener('pointercancel', release);
            btn.addEventListener('lostpointercapture', release);
        });
    }
};
