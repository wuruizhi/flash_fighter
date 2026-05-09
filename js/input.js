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
