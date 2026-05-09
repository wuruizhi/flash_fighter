/* ============================================
   Flash Fighter - Game Configuration
   KOF-style 4-button + 2 Player support
   ============================================ */
const FF = window.FF = {};

FF.CONFIG = {
    CANVAS_WIDTH: 960, CANVAS_HEIGHT: 540, GROUND_Y: 440,
    GRAVITY: 0.55, FRICTION: 0.88, MAX_ENEMIES_ON_SCREEN: 6,
    PLAYER_SPEED: 4.5, PLAYER_RUN_SPEED: 7.0, PLAYER_JUMP_FORCE: -12,
    PLAYER_HP: 100, PLAYER_RAGE_MAX: 100, RAGE_PER_HIT: 5, RAGE_PER_DAMAGE: 8,
    CAMERA_FOLLOW_SPEED: 0.08, CAMERA_DEAD_ZONE: 80,
    ENEMY_CORPSE_DURATION: 12000,
    COMBO_TIMEOUT: 700, HITSTUN_MULT: 1, KNOCKBACK_MULT: 1,
    SKIN_COLOR: '#8B5E3C', SKIN_SHADOW: '#6B4226',
    JERSEY_COLOR: '#CC0000', JERSEY_ACCENT: '#FFD700',
    SHORTS_COLOR: '#CC0000', SHOE_COLOR: '#FFFFFF',
    SHOE_ACCENT: '#CC0000', HAIR_COLOR: '#1a1a1a', HEADBAND_COLOR: '#FFD700',
    // Player 2 colors
    P2_JERSEY: '#1155CC', P2_ACCENT: '#FFFFFF', P2_SHORTS: '#1155CC',
    P2_SHOE: '#222', P2_SHOE_ACCENT: '#1155CC', P2_HEADBAND: '#FFFFFF',
    ENEMY_COLORS: {
        thug:  { shirt: '#444', pants: '#333', skin: '#C4A57B' },
        fast:  { shirt: '#2244AA', pants: '#1a1a3a', skin: '#D4A574' },
        heavy: { shirt: '#333', pants: '#222', skin: '#8B6F47' },
        boss:  { shirt: '#440044', pants: '#220022', skin: '#9B7653' }
    }
};

// Default key bindings (KOF arcade style)
FF.DEFAULT_BINDINGS = {
    p1: { up:'KeyW', down:'KeyS', left:'KeyA', right:'KeyD',
          lp:'KeyJ', lk:'KeyK', hp:'KeyU', hk:'KeyI', special:'Space' },
    p2: { up:'ArrowUp', down:'ArrowDown', left:'ArrowLeft', right:'ArrowRight',
          lp:'Numpad1', lk:'Numpad2', hp:'Numpad4', hk:'Numpad5', special:'Numpad0' }
};

// Attack definitions - 4 button system
FF.ATTACKS = {
    lp:        { damage: 6,  knockback: 2,  hitstun: 150, range: 50,  animDuration: 200, sound: 'punch' },
    lp2:       { damage: 7,  knockback: 3,  hitstun: 170, range: 52,  animDuration: 220, sound: 'punch' },
    lp3:       { damage: 12, knockback: 8,  hitstun: 300, range: 55,  animDuration: 280, sound: 'heavyPunch' },
    lk:        { damage: 8,  knockback: 3,  hitstun: 180, range: 60,  animDuration: 240, sound: 'kick' },
    lk2:       { damage: 14, knockback: 6,  hitstun: 280, range: 65,  animDuration: 300, sound: 'kick' },
    hp:        { damage: 16, knockback: 10, hitstun: 350, range: 58,  animDuration: 350, sound: 'heavyPunch' },
    hk:        { damage: 18, knockback: 12, hitstun: 400, range: 70,  animDuration: 380, sound: 'heavyKick' },
    uppercut:  { damage: 22, knockback: 15, hitstun: 500, range: 55,  animDuration: 400, sound: 'heavyPunch', launcher: true },
    roundkick: { damage: 25, knockback: 18, hitstun: 500, range: 78,  animDuration: 420, sound: 'heavyKick' },
    jumpLP:    { damage: 8,  knockback: 4,  hitstun: 200, range: 50,  animDuration: 250, sound: 'punch' },
    jumpHK:    { damage: 16, knockback: 10, hitstun: 350, range: 65,  animDuration: 300, sound: 'heavyKick' },
    dashPunch: { damage: 20, knockback: 14, hitstun: 400, range: 75,  animDuration: 350, sound: 'heavyPunch' },
    sweep:     { damage: 12, knockback: 5,  hitstun: 350, range: 70,  animDuration: 350, sound: 'kick', knockdown: true },
    special:   { damage: 45, knockback: 25, hitstun: 800, range: 110, animDuration: 600, sound: 'special' }
};

// Combo tree (KOF style: light chains into heavy)
FF.COMBO_TREE = {
    'lp': { attack: 'lp', next: {
        'lp': { attack: 'lp2', next: {
            'lp': { attack: 'lp3', next: {} },
            'hp': { attack: 'uppercut', next: {} },
            'hk': { attack: 'roundkick', next: {} }
        }},
        'lk': { attack: 'lk', next: { 'hk': { attack: 'roundkick', next: {} } }},
        'hp': { attack: 'hp', next: {} },
        'hk': { attack: 'hk', next: {} }
    }},
    'lk': { attack: 'lk', next: {
        'lk': { attack: 'lk2', next: {} },
        'lp': { attack: 'lp', next: { 'hp': { attack: 'uppercut', next: {} } }},
        'hk': { attack: 'hk', next: {} }
    }},
    'hp': { attack: 'hp', next: {} },
    'hk': { attack: 'hk', next: {} }
};

FF.ENEMY_TYPES = {
    // Normal enemies
    thug:      { hp:35, speed:1.8, attackDamage:6, attackRange:50, attackCooldown:1500, aggroRange:300, width:30, height:80, color:'thug', score:100 },
    fast:      { hp:22, speed:3.2, attackDamage:8, attackRange:48, attackCooldown:1000, aggroRange:350, width:28, height:76, color:'fast', score:150 },
    heavy:     { hp:70, speed:1.2, attackDamage:18, attackRange:55, attackCooldown:2200, aggroRange:250, width:40, height:90, color:'heavy', score:200, superArmor:true },
    // Elite enemies (stronger with special behavior)
    eliteKnife:{ hp:50, speed:2.5, attackDamage:12, attackRange:55, attackCooldown:900, aggroRange:350, width:30, height:82, color:'eliteKnife', score:300, elite:true, atkPattern:'dash' },
    eliteNinja:{ hp:40, speed:3.8, attackDamage:10, attackRange:52, attackCooldown:700, aggroRange:400, width:28, height:78, color:'eliteNinja', score:350, elite:true, atkPattern:'combo' },
    eliteBrute:{ hp:100, speed:1.5, attackDamage:22, attackRange:60, attackCooldown:1800, aggroRange:280, width:44, height:95, color:'eliteBrute', score:400, elite:true, superArmor:true, atkPattern:'charge' },
    // Bosses - one per level
    boss1:     { hp:200, speed:2.0, attackDamage:18, attackRange:60, attackCooldown:1200, aggroRange:500, width:44, height:96, color:'boss1', score:1000, superArmor:true, phases:3, boss:true, bossName:'街霸·金刚' },
    boss2:     { hp:280, speed:2.5, attackDamage:20, attackRange:58, attackCooldown:1000, aggroRange:500, width:40, height:92, color:'boss2', score:1500, superArmor:true, phases:3, boss:true, bossName:'暗影·毒蛇' },
    boss3:     { hp:400, speed:2.8, attackDamage:25, attackRange:65, attackCooldown:900, aggroRange:500, width:48, height:100, color:'boss3', score:2500, superArmor:true, phases:4, boss:true, bossName:'天王·修罗' }
};

FF.CONFIG.ENEMY_COLORS.eliteKnife = { shirt:'#8B0000', pants:'#2a0a0a', skin:'#C4A57B' };
FF.CONFIG.ENEMY_COLORS.eliteNinja = { shirt:'#1a1a2e', pants:'#0a0a15', skin:'#D4A574' };
FF.CONFIG.ENEMY_COLORS.eliteBrute = { shirt:'#2a2a00', pants:'#1a1a00', skin:'#8B6F47' };
FF.CONFIG.ENEMY_COLORS.boss1 = { shirt:'#880000', pants:'#440000', skin:'#9B7653' };
FF.CONFIG.ENEMY_COLORS.boss2 = { shirt:'#004400', pants:'#002200', skin:'#C4A57B' };
FF.CONFIG.ENEMY_COLORS.boss3 = { shirt:'#330033', pants:'#1a001a', skin:'#8B5E3C' };

FF.LEVELS = [
    { name:'第一关：街头巷战', bgType:'street', width:2400,
      waves:[
          {enemies:[{type:'thug',count:3}]},
          {enemies:[{type:'thug',count:3},{type:'fast',count:1}]},
          {enemies:[{type:'thug',count:2},{type:'fast',count:2}]},
          {enemies:[{type:'eliteKnife',count:1},{type:'thug',count:2}]},
          {enemies:[{type:'boss1',count:1}]}
      ], weapons:['pipe','bat'] },
    { name:'第二关：暗巷追击', bgType:'alley', width:2800,
      waves:[
          {enemies:[{type:'fast',count:3}]},
          {enemies:[{type:'thug',count:3},{type:'fast',count:2}]},
          {enemies:[{type:'eliteNinja',count:1},{type:'fast',count:2}]},
          {enemies:[{type:'heavy',count:1},{type:'eliteKnife',count:1},{type:'thug',count:2}]},
          {enemies:[{type:'eliteBrute',count:1},{type:'eliteNinja',count:1}]},
          {enemies:[{type:'boss2',count:1}]}
      ], weapons:['pipe','bat','knife'] },
    { name:'第三关：天台决战', bgType:'rooftop', width:2200,
      waves:[
          {enemies:[{type:'fast',count:3},{type:'thug',count:2}]},
          {enemies:[{type:'eliteNinja',count:2},{type:'fast',count:2}]},
          {enemies:[{type:'heavy',count:2},{type:'eliteKnife',count:1}]},
          {enemies:[{type:'eliteBrute',count:1},{type:'eliteNinja',count:1},{type:'eliteKnife',count:1}]},
          {enemies:[{type:'boss3',count:1},{type:'thug',count:2}]}
      ], weapons:['knife','katana'] }
];

FF.WEAPONS = {
    pipe:   { name:'铁管', damageMult:1.5, rangeMult:1.2, durability:15, color:'#888' },
    bat:    { name:'棍棒', damageMult:1.3, rangeMult:1.4, durability:20, color:'#8B6914' },
    knife:  { name:'匕首', damageMult:1.8, rangeMult:1.0, durability:10, color:'#C0C0C0' },
    katana: { name:'武士刀', damageMult:2.0, rangeMult:1.5, durability:8,  color:'#E8E8E8' }
};

// Smoother poses with more natural joint angles
FF.POSES = {
    // Fighting stance - knees bent, fists up, weight shifting
    idle1:  { body:-0.05, lShoulder:0.8, lElbow:2.5, rShoulder:1.6, rElbow:2.4, lHip:0.12, lKnee:0.18, rHip:-0.12, rKnee:0.18, headTilt:0 },
    idle2:  { body:-0.03, lShoulder:0.75, lElbow:2.55, rShoulder:1.55, rElbow:2.45, lHip:0.15, lKnee:0.15, rHip:-0.15, rKnee:0.15, headTilt:0.02 },
    idle3:  { body:-0.07, lShoulder:0.85, lElbow:2.45, rShoulder:1.65, rElbow:2.35, lHip:0.1, lKnee:0.2, rHip:-0.1, rKnee:0.2, headTilt:-0.02 },
    // Walk/Run - wide strides, big arm swings, forward lean, bounce
    walk1:  { body:0.2,  lShoulder:2.2, lElbow:1.0, rShoulder:0.2, rElbow:2.5, lHip:-0.7, lKnee:0.8, rHip:0.6, rKnee:0.05, headTilt:0.04 },
    walk15: { body:0.15, lShoulder:1.4, lElbow:1.8, rShoulder:1.0, rElbow:2.0, lHip:-0.15, lKnee:0.3, rHip:0.2, rKnee:0.15, headTilt:0.02 },
    walk2:  { body:0.2,  lShoulder:0.2, lElbow:2.5, rShoulder:2.2, rElbow:1.0, lHip:0.6, lKnee:0.05, rHip:-0.7, rKnee:0.8, headTilt:-0.04 },
    walk25: { body:0.15, lShoulder:1.0, lElbow:2.0, rShoulder:1.4, rElbow:1.8, lHip:0.2, lKnee:0.15, rHip:-0.15, rKnee:0.3, headTilt:-0.02 },
    // Run (dash) - even more exaggerated
    run1:   { body:0.3,  lShoulder:2.5, lElbow:0.8, rShoulder:-0.2, rElbow:2.8, lHip:-0.9, lKnee:1.0, rHip:0.8, rKnee:0.05, headTilt:0.05 },
    run2:   { body:0.3,  lShoulder:-0.2, lElbow:2.8, rShoulder:2.5, rElbow:0.8, lHip:0.8, lKnee:0.05, rHip:-0.9, rKnee:1.0, headTilt:-0.05 },
    // Jump / fall
    jump:   { body:-0.1, lShoulder:2.0, lElbow:1.6, rShoulder:1.0, rElbow:1.4, lHip:-0.5, lKnee:0.9, rHip:0.2, rKnee:0.7, headTilt:-0.08 },
    jumpUp: { body:-0.15, lShoulder:2.3, lElbow:1.8, rShoulder:0.7, rElbow:1.1, lHip:-0.3, lKnee:1.0, rHip:0.15, rKnee:0.8, headTilt:-0.1 },
    fall:   { body:0.08, lShoulder:1.8, lElbow:1.5, rShoulder:1.2, rElbow:1.6, lHip:-0.2, lKnee:0.4, rHip:0.3, rKnee:0.6, headTilt:0.06 },
    // Light punch
    lp_w:   { body:-0.1, lShoulder:1.4, lElbow:2.2, rShoulder:2.2, rElbow:2.6, lHip:0.08, lKnee:0, rHip:-0.12, rKnee:0.05, headTilt:-0.05 },
    lp_h:   { body:0.12, lShoulder:1.1, lElbow:1.7, rShoulder:0.1, rElbow:0.05, lHip:0.08, lKnee:0, rHip:-0.12, rKnee:0.08, headTilt:0.03 },
    // Light punch 2
    lp2_w:  { body:0.1, lShoulder:0.3, lElbow:2.4, rShoulder:1.7, rElbow:2.0, lHip:-0.08, lKnee:0, rHip:0.08, rKnee:0, headTilt:0.05 },
    lp2_h:  { body:-0.08, lShoulder:-0.1, lElbow:0.05, rShoulder:1.4, rElbow:1.7, lHip:-0.12, lKnee:0.05, rHip:0.08, rKnee:0, headTilt:-0.03 },
    // Light punch 3 (finisher)
    lp3_w:  { body:-0.18, lShoulder:1.8, lElbow:2.3, rShoulder:2.6, rElbow:2.3, lHip:0.15, lKnee:0.15, rHip:-0.25, rKnee:0.08, headTilt:-0.08 },
    lp3_h:  { body:0.22, lShoulder:0.8, lElbow:1.3, rShoulder:-0.2, rElbow:-0.05, lHip:-0.08, lKnee:0, rHip:-0.15, rKnee:0.12, headTilt:0.08 },
    // Light kick
    lk_w:   { body:-0.08, lShoulder:1.4, lElbow:2.0, rShoulder:1.4, rElbow:1.7, lHip:0.15, lKnee:0, rHip:-0.6, rKnee:1.0, headTilt:0 },
    lk_h:   { body:0.08, lShoulder:1.6, lElbow:2.1, rShoulder:1.2, rElbow:1.5, lHip:0.12, lKnee:0.08, rHip:-1.3, rKnee:0.05, headTilt:0.03 },
    // Light kick 2
    lk2_w:  { body:0.15, lShoulder:1.7, lElbow:2.1, rShoulder:1.1, rElbow:1.4, lHip:0.25, lKnee:0.08, rHip:0.4, rKnee:1.3, headTilt:-0.05 },
    lk2_h:  { body:-0.12, lShoulder:1.9, lElbow:2.3, rShoulder:0.9, rElbow:1.2, lHip:0.08, lKnee:0, rHip:-1.6, rKnee:0.02, headTilt:0.08 },
    // Heavy punch
    hp_w:   { body:-0.2, lShoulder:1.6, lElbow:2.3, rShoulder:2.8, rElbow:2.6, lHip:0.2, lKnee:0.15, rHip:-0.2, rKnee:0.08, headTilt:-0.1 },
    hp_h:   { body:0.25, lShoulder:1.0, lElbow:1.5, rShoulder:-0.3, rElbow:-0.1, lHip:-0.1, lKnee:0, rHip:-0.18, rKnee:0.12, headTilt:0.1 },
    // Heavy kick
    hk_w:   { body:0.25, lShoulder:1.9, lElbow:2.3, rShoulder:1.0, rElbow:1.3, lHip:0.25, lKnee:0.15, rHip:0.6, rKnee:1.4, headTilt:0.08 },
    hk_h:   { body:-0.18, lShoulder:2.3, lElbow:2.6, rShoulder:0.8, rElbow:1.0, lHip:0.08, lKnee:0, rHip:-1.8, rKnee:-0.15, headTilt:-0.08 },
    // Uppercut
    up_w:   { body:0.18, lShoulder:1.4, lElbow:1.9, rShoulder:2.4, rElbow:2.7, lHip:0.25, lKnee:0.25, rHip:-0.15, rKnee:0.08, headTilt:0.08 },
    up_h:   { body:-0.22, lShoulder:1.4, lElbow:1.9, rShoulder:-1.1, rElbow:-0.2, lHip:0.08, lKnee:0, rHip:-0.08, rKnee:0, headTilt:-0.12 },
    // Roundkick
    rk_w:   { body:0.28, lShoulder:1.9, lElbow:2.3, rShoulder:1.0, rElbow:1.2, lHip:0.25, lKnee:0.15, rHip:0.7, rKnee:1.4, headTilt:0.08 },
    rk_h:   { body:-0.18, lShoulder:2.3, lElbow:2.6, rShoulder:0.7, rElbow:0.9, lHip:0.08, lKnee:0, rHip:-1.9, rKnee:-0.15, headTilt:-0.08 },
    // Jump attacks
    jlp_h:  { body:0.08, lShoulder:2.2, lElbow:1.8, rShoulder:0.1, rElbow:0.1, lHip:-0.3, lKnee:0.6, rHip:0.15, rKnee:0.4, headTilt:0 },
    jhk_h:  { body:0.1, lShoulder:2.3, lElbow:1.9, rShoulder:0.6, rElbow:1.0, lHip:0.4, lKnee:0.25, rHip:-1.4, rKnee:0.02, headTilt:0 },
    // Dash punch
    dp_h:   { body:0.2, lShoulder:1.0, lElbow:1.4, rShoulder:-0.15, rElbow:0.02, lHip:-0.25, lKnee:0.15, rHip:0.25, rKnee:0, headTilt:0.08 },
    // Sweep
    sw_h:   { body:0.3, lShoulder:1.9, lElbow:2.3, rShoulder:1.0, rElbow:1.4, lHip:-0.4, lKnee:0.15, rHip:-1.6, rKnee:0.02, headTilt:0.08 },
    // Special
    sp_w:   { body:-0.28, lShoulder:2.6, lElbow:2.3, rShoulder:0.4, rElbow:0.6, lHip:0.25, lKnee:0.4, rHip:-0.25, rKnee:0.4, headTilt:-0.15 },
    sp_h:   { body:0.08, lShoulder:0.02, lElbow:0.02, rShoulder:Math.PI, rElbow:0.02, lHip:0, lKnee:0, rHip:0, rKnee:0, headTilt:0 },
    // Hurt / down / block
    hurt:   { body:0.18, lShoulder:1.9, lElbow:2.3, rShoulder:1.0, rElbow:1.9, lHip:0.15, lKnee:0.25, rHip:-0.08, rKnee:0.15, headTilt:0.12 },
    down:   { body:1.3, lShoulder:2.3, lElbow:1.8, rShoulder:0.6, rElbow:1.0, lHip:-0.25, lKnee:0.7, rHip:0.4, rKnee:1.0, headTilt:0.25 },
    block:  { body:-0.04, lShoulder:0.9, lElbow:2.7, rShoulder:2.2, rElbow:2.7, lHip:0.08, lKnee:0.08, rHip:-0.08, rKnee:0.08, headTilt:-0.04 },
    victory1:{ body:0, lShoulder:-1.0, lElbow:-0.5, rShoulder:-1.0, rElbow:-0.5, lHip:0.08, lKnee:0, rHip:-0.08, rKnee:0, headTilt:-0.08 },
    victory2:{ body:0, lShoulder:-1.2, lElbow:-0.8, rShoulder:-1.2, rElbow:-0.8, lHip:0.08, lKnee:0, rHip:-0.08, rKnee:0, headTilt:-0.12 }
};

// Smoother animations with more keyframes and easing
FF.ANIMS = {
    idle:      { loop:true,  frames:[{pose:'idle1',dur:500},{pose:'idle2',dur:400},{pose:'idle3',dur:500},{pose:'idle1',dur:400}] },
    walk:      { loop:true,  frames:[{pose:'walk1',dur:120},{pose:'walk15',dur:80},{pose:'walk2',dur:120},{pose:'walk25',dur:80}] },
    run:       { loop:true,  frames:[{pose:'run1',dur:90},{pose:'walk15',dur:60},{pose:'run2',dur:90},{pose:'walk25',dur:60}] },
    jump:      { loop:false, frames:[{pose:'jump',dur:150},{pose:'jumpUp',dur:350}] },
    fall:      { loop:false, frames:[{pose:'fall',dur:400}] },
    lp:        { loop:false, frames:[{pose:'lp_w',dur:50},{pose:'lp_h',dur:100,active:true},{pose:'idle1',dur:50}] },
    lp2:       { loop:false, frames:[{pose:'lp2_w',dur:50},{pose:'lp2_h',dur:110,active:true},{pose:'idle1',dur:60}] },
    lp3:       { loop:false, frames:[{pose:'lp3_w',dur:80},{pose:'lp3_h',dur:130,active:true},{pose:'idle1',dur:70}] },
    lk:        { loop:false, frames:[{pose:'lk_w',dur:60},{pose:'lk_h',dur:120,active:true},{pose:'idle1',dur:60}] },
    lk2:       { loop:false, frames:[{pose:'lk2_w',dur:80},{pose:'lk2_h',dur:150,active:true},{pose:'idle1',dur:70}] },
    hp:        { loop:false, frames:[{pose:'hp_w',dur:120},{pose:'hp_h',dur:150,active:true},{pose:'idle1',dur:80}] },
    hk:        { loop:false, frames:[{pose:'hk_w',dur:130},{pose:'hk_h',dur:170,active:true},{pose:'idle1',dur:80}] },
    uppercut:  { loop:false, frames:[{pose:'up_w',dur:110},{pose:'up_h',dur:190,active:true},{pose:'idle1',dur:100}] },
    roundkick: { loop:false, frames:[{pose:'rk_w',dur:130},{pose:'rk_h',dur:190,active:true},{pose:'idle1',dur:100}] },
    jumpLP:    { loop:false, frames:[{pose:'jump',dur:40},{pose:'jlp_h',dur:170,active:true},{pose:'fall',dur:40}] },
    jumpHK:    { loop:false, frames:[{pose:'jump',dur:40},{pose:'jhk_h',dur:220,active:true},{pose:'fall',dur:40}] },
    dashPunch: { loop:false, frames:[{pose:'lp_w',dur:60},{pose:'dp_h',dur:200,active:true},{pose:'idle1',dur:90}] },
    sweep:     { loop:false, frames:[{pose:'lk_w',dur:80},{pose:'sw_h',dur:200,active:true},{pose:'idle1',dur:70}] },
    special:   { loop:false, frames:[{pose:'sp_w',dur:180},{pose:'sp_h',dur:300,active:true},{pose:'idle1',dur:120}] },
    hurt:      { loop:false, frames:[{pose:'hurt',dur:250},{pose:'idle1',dur:100}] },
    knockdown: { loop:false, frames:[{pose:'hurt',dur:180},{pose:'down',dur:700},{pose:'idle1',dur:250}] },
    block:     { loop:false, frames:[{pose:'block',dur:350}] },
    victory:   { loop:true,  frames:[{pose:'victory1',dur:350},{pose:'victory2',dur:350}] },
    die:       { loop:false, frames:[{pose:'hurt',dur:180},{pose:'down',dur:2000}] }
};

// Smooth easing function
FF.ease = function(t) {
    return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2;
};

FF.lerpPose = function(p1Name, p2Name, t) {
    const p1 = typeof p1Name === 'string' ? FF.POSES[p1Name] : p1Name;
    const p2 = typeof p2Name === 'string' ? FF.POSES[p2Name] : p2Name;
    if (!p1 || !p2) return p1 || p2 || FF.POSES.idle1;
    const et = FF.ease(Math.min(1, Math.max(0, t)));
    const result = {};
    for (const key in p1) result[key] = p1[key] + (p2[key] - p1[key]) * et;
    return result;
};
