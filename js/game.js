// ============================================================
// CORE - game.js
// ============================================================
console.log('🎮 Bắt đầu load game.js...');
// ⭐ TRẠNG THÁI SPAWN
let spawnActive = false;      // Quái có được spawn không
// ⭐ FLAG: Chờ gamedrawcreate.js load xong
window._gameReady = false;

// Canvas initialization with safety check
let canvas, ctx, W, H;
let _lastH = 0, _lastW = 0;

function initCanvas() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('❌ Canvas not found! Retrying...');
        setTimeout(initCanvas, 50);
        return;
    }
    ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
        console.error('❌ Failed to get canvas context! Retrying...');
        setTimeout(initCanvas, 50);
        return;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    console.log('✅ Canvas initialized:', canvas.width, 'x', canvas.height);
    
    // Initialize after canvas is ready
    initCanvasOnly();
}

function initGame() {
    resize();
    initJoysticks();  // ⭐ Khởi tạo joystick sau khi DOM ready
    
    // Resize listener
    let resizeTimer = null;
    window.addEventListener('resize', function() {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 300);
    });
    
    window.addEventListener('orientationchange', function() {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 500);
    });
    
    // Start game loop
    loop();
    
    // Show hypercube on load
    window.addEventListener('load', function() {
        setTimeout(function() {
            if (typeof hypercube !== 'undefined') {
                const el = document.getElementById('hypercube');
                if (el && hypercubeActive) el.style.display = 'block';
            }
        }, 500);
    });
}

// Initialize canvas when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCanvasOnly);
} else {
    initCanvasOnly();
}

// ============================================================
// INIT CANVAS ONLY (no game loop)
// ============================================================
function initCanvasOnly() {
    // Ensure canvas is available
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('❌ Canvas not found in initCanvasOnly! Retrying...');
        setTimeout(initCanvasOnly, 50);
        return;
    }
    
    ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
        console.error('❌ Failed to get canvas context in initCanvasOnly! Retrying...');
        setTimeout(initCanvasOnly, 50);
        return;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    resize();
    initJoysticks();  // ⭐ Khởi tạo joystick sau khi DOM ready
    
    // Resize listener
    let resizeTimer = null;
    window.addEventListener('resize', function() {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 300);
    });
    
    window.addEventListener('orientationchange', function() {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 500);
    });
    
    // Show hypercube on load
    window.addEventListener('load', function() {
        setTimeout(function() {
            if (typeof hypercube !== 'undefined') {
                const el = document.getElementById('hypercube');
                if (el && hypercubeActive) el.style.display = 'block';
            }
        }, 500);
    });
    
    console.log('✅ Canvas initialized:', canvas.width, 'x', canvas.height, '| W:', W, 'H:', H);
}

// ============================================================
// START GAME LOOP (called from gamemenu.js startGame)
// ============================================================
function startGameLoop() {
    if (window._gameLoopStarted) return;
    window._gameLoopStarted = true;
    console.log('🎮 Starting game loop...');
    loop();
}

// Export
window.startGameLoop = startGameLoop;

// ============================================================
// RESIZE (CHỈ SET 1 LẦN) - Đọc kích thước thực từ CSS (aspect-ratio 4:3)
// ============================================================
function resize() {
    // ⭐ Đọc kích thước thực của canvas sau khi CSS aspect-ratio áp dụng
    const newW = canvas.clientWidth;
    const newH = canvas.clientHeight;
    
    // ⭐ FALLBACK: If canvas not rendered yet, use window size with 4:3 aspect
    let finalW = newW, finalH = newH;
    if (newW === 0 || newH === 0) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        // Maintain 4:3 aspect ratio
        if (vw / vh > 4 / 3) {
            finalW = vh * 4 / 3;
            finalH = vh;
        } else {
            finalW = vw;
            finalH = vw * 3 / 4;
        }
        console.warn('⚠️ Canvas not rendered yet, using fallback size:', finalW, 'x', finalH);
    }
    
    // ⭐ KHÔNG THAY ĐỔI → KHÔNG LÀM GÌ
    if (Math.abs(_lastW - finalW) < 5 && Math.abs(_lastH - finalH) < 5) {
        return;
    }
    
    _lastW = finalW;
    _lastH = finalH;
    
    // Set canvas resolution (CSS pixels * devicePixelRatio)
    canvas.width = Math.floor(finalW * devicePixelRatio);
    canvas.height = Math.floor(finalH * devicePixelRatio);
    
    // Game logical size (CSS pixels)
    W = finalW;
    H = finalH;
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.imageSmoothingEnabled = false;
    
    console.log('📐 Resize:', W, 'x', H, '| Canvas:', canvas.width, 'x', canvas.height);
}

// ============================================================
// NHÂN VẬT
// ============================================================
const player = {
    x: 7680, y: 5760, size: 32, speed: 4,  // ⭐ GIỮA MAP MỚI 384x288
    hp: 200, maxHp: 200, mp: 200, maxMp: 200, coins: 0,
    
    level: 1,
    exp: 0,
    expToNext: 100,
    
    init: function() {
        this.x = 7680;  // ⭐ GIỮA MAP MỚI
        this.y = 5760;  // ⭐ GIỮA MAP MỚI
        this.updateMaxStats();
        this.hp = this.maxHp;
        this.mp = this.maxMp;
    },
    
    updateMaxStats: function() {
        const base = Math.pow(this.level, 1.7) * 200;
        this.maxHp = Math.floor(base);
        this.maxMp = Math.floor(base);
    },
    
    addExp: function(amount) {
        if (this.level >= 50) return;
        this.exp += amount;
        while (this.exp >= this.expToNext && this.level < 50) {
            this.levelUp();
        }
        if (typeof UI !== 'undefined') UI.update();
    },
    
    levelUp: function() {
        if (this.level >= 50) return;
        this.exp -= this.expToNext;
        this.level++;
        this.expToNext = Math.floor(100 * Math.pow(this.level, 1.8));
        this.updateMaxStats();
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        console.log('🎉 LÊN CẤP ' + this.level);
        if (typeof showNotification === 'function') {
            showNotification('🎉 LÊN CẤP ' + this.level + '!');
        }
    },
    
    draw: function(c) {
        const half = this.size / 2;
        const x = this.x - half, y = this.y - half;
        c.fillStyle = '#2196F3';
        c.fillRect(x, y, this.size, this.size);
        c.strokeStyle = '#ffffff';
        c.lineWidth = 3;
        c.strokeRect(x, y, this.size, this.size);
        c.strokeStyle = '#4fc3f7';
        c.lineWidth = 1.5;
        c.strokeRect(x + 4, y + 4, this.size - 8, this.size - 8);
    }
};

// ============================================================
// JOYSTICK - Khởi tạo sau khi DOM ready
// ============================================================
let moveJoy = null;
let fireJoy = null;

function initJoysticks() {
    moveJoy = {
        el: document.getElementById('joystickKnob'),
        base: document.getElementById('joystickBase'),
        area: document.getElementById('joystickArea'),
        active: false, pointerId: null,
        dirX: 0, dirY: 0, maxDist: 40,
        
        setPos: function(cx, cy) {
            if (!this.base) return;
            const rect = this.base.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            let dx = cx - centerX, dy = cy - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > this.maxDist) {
                dx = (dx / dist) * this.maxDist;
                dy = (dy / dist) * this.maxDist;
            }
            if (this.el) this.el.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
            this.dirX = dx / this.maxDist;
            this.dirY = dy / this.maxDist;
        },
        
        getDir: function() {
            if (!this.active) return { x: 0, y: 0 };
            return { x: this.dirX, y: this.dirY };
        }
    };
    
    fireJoy = {
        el: document.getElementById('fireJoystickKnob'),
        base: document.getElementById('fireJoystickBase'),
        indicator: document.getElementById('directionIndicator'),
        area: document.getElementById('fireJoystickArea'),
        active: false, pointerId: null,
        angle: 0, maxDist: 40,
        fireRate: 8, counter: 0,
        
        setPos: function(cx, cy) {
            if (!this.base) return;
            const rect = this.base.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            let dx = cx - centerX, dy = cy - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > this.maxDist) {
                dx = (dx / dist) * this.maxDist;
                dy = (dy / dist) * this.maxDist;
            }
            if (this.el) this.el.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
            this.angle = Math.atan2(dy, dx);
            if (dist > 5) {
                if (this.indicator) {
                    this.indicator.classList.add('active');
                    const deg = this.angle * (180 / Math.PI) + 90;
                    this.indicator.style.transform = 'translate(-50%, -50%) rotate(' + deg + 'deg)';
                }
            } else {
                if (this.indicator) this.indicator.classList.remove('active');
            }
        },
        
        getAngle: function() {
            // ⭐ FIX: For auto weapons, return angle even when not active (keyboard F key, etc.)
            // Only return null for tap-to-fire weapons (sniper, shotgun)
            if (!this.active && this.pointerId !== 'keyboard') return null;
            // ⭐ Ensure angle is valid - fallback to 0 if not set
            const currentAngle = (typeof this.angle === 'number' && !isNaN(this.angle)) ? this.angle : 0;
            const step = (2 * Math.PI) / 64;
            return Math.round(currentAngle / step) * step;
        }
    };
    
    console.log('✅ Joystick objects created');
}

// ============================================================
// ĐẠN
// ============================================================
let bullets = [];
const MAX_BULLETS = 200; // ⭐ GIỚI HẠN ĐẠN TỔNG

// ============================================================
// UI
// ============================================================
const UI = {
    hpBar: document.getElementById('hpBar'),
    mpBar: document.getElementById('mpBar'),
    expBar: document.getElementById('expBar'),
    hpText: document.getElementById('hpText'),
    mpText: document.getElementById('mpText'),
    expText: document.getElementById('expText'),
    coinText: document.getElementById('coinCount'),
    levelText: document.getElementById('levelText'),
    
    update: function() {
        if (this.hpBar) this.hpBar.style.width = (player.hp / player.maxHp * 100) + '%';
        if (this.mpBar) this.mpBar.style.width = (player.mp / player.maxMp * 100) + '%';
        if (this.expBar) this.expBar.style.width = (player.exp / player.expToNext * 100) + '%';
        if (this.hpText) this.hpText.textContent = Math.floor(player.hp) + '/' + player.maxHp;
        if (this.mpText) this.mpText.textContent = Math.floor(player.mp) + '/' + player.maxMp;
        if (this.expText) this.expText.textContent = player.exp + '/' + player.expToNext;
        if (this.coinText) this.coinText.textContent = player.coins;
        if (this.levelText) this.levelText.textContent = player.level;
    }
};

// ============================================================
// LOAD SPRITES SÚNG
// ============================================================
const weaponSprites = {
    pistol: new Image(), 
    rifle: new Image(), 
    shotgun: new Image(),
    sniper: new Image(),
    barret: new Image(), 
    bomb: new Image(),
    plasma: new Image(), 
    railgun: new Image(), 
    scythe: new Image()
};

// ⭐ Load với error handling cho tất cả sprites
const weaponSpriteSources = {
    pistol: 'assets/sprites/weapons/pistol.png',
    rifle: 'assets/sprites/weapons/assault_rifle.png',
    shotgun: 'assets/sprites/weapons/shotgun.png',
    sniper: 'assets/sprites/weapons/sniper.png',
    barret: 'assets/sprites/weapons/sniper.png',
    bomb: 'assets/sprites/weapons/explosive.png',
    plasma: 'assets/sprites/weapons/plasma.png',
    railgun: 'assets/sprites/weapons/sniper.png',
    scythe: 'assets/sprites/weapons/collapsed_scythe.png'
};

for (const [key, src] of Object.entries(weaponSpriteSources)) {
    weaponSprites[key].src = src;
    weaponSprites[key].onload = () => console.log(`✅ Load ${key}.png OK`);
    weaponSprites[key].onerror = () => console.error(`❌ Load ${key}.png FAILED!`);
}
// ============================================================
// LOAD SPRITES SLIME
// ============================================================
const monsterSprites = {
    slime_red: new Image(),
    slime_green: new Image(),
    slime_yellow: new Image(),
    slime_black: new Image(),
    slime_cyan: new Image()
};

monsterSprites.slime_red.src = 'assets/sprites/monsters/slime_red.png';
monsterSprites.slime_green.src = 'assets/sprites/monsters/slime_green.png';
monsterSprites.slime_yellow.src = 'assets/sprites/monsters/slime_yellow.png';
monsterSprites.slime_black.src = 'assets/sprites/monsters/slime_black.png';
monsterSprites.slime_cyan.src = 'assets/sprites/monsters/slime_cyan.png';

console.log('👾 Đã load 5 slime sprites');
// ============================================================
// SCREEN EFFECTS
// ============================================================
let shakeTime = 0, shakeIntensity = 0, flashAlpha = 0;

function triggerShake(intensity, duration) {
    shakeIntensity = intensity;
    shakeTime = duration;
}

function triggerFlash(alpha) {
    flashAlpha = alpha;
}

function applyScreenEffects() {
    if (shakeTime > 0) {
        shakeTime--;
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
    }
    if (flashAlpha > 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, ' + flashAlpha + ')';
        ctx.fillRect(0, 0, W, H);
        flashAlpha *= 0.9;
        if (flashAlpha < 0.01) flashAlpha = 0;
    }
}

// ============================================================
// TÍNH DAMAGE % MAX HP
// ============================================================
function calculateDamage(baseDamage, percentMaxHP) {
    if (typeof player === 'undefined') return baseDamage;
    const percentDmg = (percentMaxHP || 0) * player.maxHp;
    return Math.floor(percentDmg + (baseDamage || 0));
}

// ============================================================
// GAME LOOP — CHỜ GAME READY
// ============================================================
function loop() {
    // ⭐ CHỜ GAMEDRAWCREATE LOAD XONG VÀ CANVAS SẴN SÀNG
    if (!window._gameReady || typeof ctx === 'undefined' || typeof W === 'undefined' || W === 0 || typeof H === 'undefined' || H === 0) {
        requestAnimationFrame(loop);
        return;
    }
    
    if (typeof window.updateGame === 'function') {
        try { window.updateGame(); } catch(e) { console.error('❌ updateGame error:', e); }
    }
    if (typeof window.drawGame === 'function') {
        try { window.drawGame(); } catch(e) { console.error('❌ drawGame error:', e); }
    }
    requestAnimationFrame(loop);
}

// ============================================================
// HỒI HP/MP
// ============================================================
setInterval(function() {
    let changed = false;
    if (player.hp < player.maxHp) { player.hp = Math.min(player.maxHp, player.hp + 5); changed = true; }
    if (player.mp < player.maxMp) { player.mp = Math.min(player.maxMp, player.mp + 5); changed = true; }
    if (changed) UI.update();
}, 2000);

// ============================================================
// KHỞI ĐỘNG
// ============================================================
player.init();
UI.update();

// ⭐ CHỜ ORIENTATION
// ============================================================
// BÀN TAY (HAND) — NẮM VŨ KHÍ
// ============================================================
const Hand = {
    angle: 0,
    distance: 35,
    swingProgress: 0,
    isSwinging: false,
    swingDuration: 6,           // ⭐ 6 frames — nhanh
    swingTimer: 0,
    
    update: function() {
        if (typeof player === 'undefined') return;
        if (typeof fireJoy === 'undefined') return;
        
        // Xoay theo joystick
        if (fireJoy.active) {
            this.angle = fireJoy.angle;
        } else if (typeof moveJoy !== 'undefined' && moveJoy.active) {
            const dir = moveJoy.getDir();
            if (dir.x !== 0 || dir.y !== 0) {
                this.angle = Math.atan2(dir.y, dir.x);
            }
        }
        
        // Animation chém
        if (this.isSwinging) {
            this.swingTimer++;
            this.swingProgress = this.swingTimer / this.swingDuration;
            
            if (this.swingTimer >= this.swingDuration) {
                this.isSwinging = false;
                this.swingTimer = 0;
                this.swingProgress = 0;
            }
        }
    },
    
    startSwing: function() {
        this.isSwinging = true;
        this.swingTimer = 0;
        this.swingProgress = 0;
    },
    
    getPosition: function() {
        if (typeof player === 'undefined') return { x: 0, y: 0, angle: 0 };
        
        let offsetAngle = this.angle;
        
        // ⭐ ANIMATION 6 FRAMES
        if (this.isSwinging) {
            const p = this.swingProgress;    // 0 → 1
            
            if (p < 0.33) {
                // Frame 1-2: Vòng ra sau (góc -180°)
                offsetAngle = this.angle - Math.PI;
            } else if (p < 0.66) {
                // Frame 3-4: Chém xuống (góc +90°)
                offsetAngle = this.angle + Math.PI / 2;
            } else {
                // Frame 5-6: Về gốc
                offsetAngle = this.angle;
            }
        }
        
        return {
            x: player.x + Math.cos(offsetAngle) * this.distance,
            y: player.y + Math.sin(offsetAngle) * this.distance,
            angle: offsetAngle
        };
    }
};

// ============================================================
// VỆT CHÉM (SLASH TRAILS) — SỐNG LÂU HƠN ANIMATION
// ============================================================
let slashTrails = [];
const MAX_SLASH_TRAILS = 20; // ⭐ GIỚI HẠN VỆT CHÉM

// ===== SCYTHE VFX SETTINGS — chỉnh 4 số này để test nhanh =====
const SLASH_VFX = {
    depth: 145,        // độ sâu/bán kính: tăng = vệt nằm xa người hơn
    thickness: 91,    // độ dày thân vệt
    arcLength: 3.33,   // chiều dài cung (radian): tăng = cung dài hơn, quét ra sau lưng
    tailLength: 3.33  // độ kéo dài về phía sau theo cung
};

function addSlashTrail(angle, color) {
    // ⭐ CLEANUP if over limit
    if (slashTrails.length >= MAX_SLASH_TRAILS) {
        slashTrails.shift();
    }
    slashTrails.push({
        angle: angle,
        color: color || 'rgba(255, 40, 40, 1)',
        life: 32,
        maxLife: 32,
        radius: SLASH_VFX.depth,
        thickness: SLASH_VFX.thickness,
        arcLength: SLASH_VFX.arcLength,
        tailLength: SLASH_VFX.tailLength,
        // Slight variation makes repeated swings feel less like a static arc.
        width: 1,
        seed: Math.random() * Math.PI * 2
    });
}

function updateSlashTrails() {
    for (let i = slashTrails.length - 1; i >= 0; i--) {
        slashTrails[i].life--;
        if (slashTrails[i].life <= 0) {
            slashTrails.splice(i, 1);
        }
    }
}

function drawSlashTrails(c, px, py) {
    for (let t of slashTrails) {
        const alpha = Math.max(0, t.life / t.maxLife);
        const progress = 1 - alpha;
        const radius = t.radius + progress * 9;
        const centerA = -Math.PI * 0.10;
        const halfArc = t.arcLength * 0.5;
        // Mở rộng cung cân đối sang cả phía trước và phía sau người chơi.
        const startA = centerA - halfArc * 0.95 * t.tailLength;
        const endA = centerA + halfArc;

        c.save();
        c.translate(px, py);
        c.rotate(t.angle);
        c.globalCompositeOperation = 'lighter';
        c.lineCap = 'round';

        // 1) Large soft aura — gives the slash the luminous game-VFX look.
        c.strokeStyle = 'rgba(255, 30, 30, ' + (alpha * 0.16) + ')';
        c.lineWidth = (t.thickness * 1.9) - progress * (t.thickness * 0.75);
        c.beginPath();
        c.arc(0, 0, radius, startA, endA);
        c.stroke();

        // 2) Main red energy body.
        c.strokeStyle = 'rgba(255, 45, 45, ' + (alpha * 0.78) + ')';
        c.lineWidth = t.thickness - progress * (t.thickness * 0.30);
        c.beginPath();
        c.arc(0, 0, radius, startA, endA);
        c.stroke();

        // 3) Bright inner edge — a thin white/red core makes it look sharper.
        const core = c.createLinearGradient(-radius, -radius, radius, radius);
        core.addColorStop(0, 'rgba(255, 210, 210, ' + (alpha * 0.15) + ')');
        core.addColorStop(0.5, 'rgba(255, 255, 255, ' + (alpha * 0.95) + ')');
        core.addColorStop(1, 'rgba(255, 80, 80, ' + (alpha * 0.55) + ')');
        c.strokeStyle = core;
        c.lineWidth = Math.max(3, t.thickness * 0.23 - progress * 3);
        c.beginPath();
        c.arc(0, 0, radius, startA, endA);
        c.stroke();

        // 4) Sharp fading tip strokes, like a sword/scythe impact effect.
        const tipA = endA - 0.08;
        for (let k = 0; k < 3; k++) {
            const spread = (k - 1) * 0.055;
            const a1 = tipA + spread;
            const len = 28 + k * 9;
            const innerR = radius - 10;
            const outerR = radius + len * (0.55 + alpha * 0.45);
            c.strokeStyle = 'rgba(255, 120, 120, ' + (alpha * (0.7 - k * 0.14)) + ')';
            c.lineWidth = 3 - k * 0.45;
            c.beginPath();
            c.moveTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
            c.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
            c.stroke();
        }

        // 5) Tiny energy sparks around the outer edge.
        for (let k = 0; k < 6; k++) {
            const a = startA + (endA - startA) * ((k + 1) / 7) + Math.sin(t.seed + k) * 0.045;
            const r = radius + 7 + ((k * 17) % 13);
            const size = 2 + ((k * 3) % 3);
            c.fillStyle = 'rgba(255, 180, 180, ' + (alpha * (0.75 - k * 0.05)) + ')';
            c.beginPath();
            c.arc(Math.cos(a) * r, Math.sin(a) * r, size, 0, Math.PI * 2);
            c.fill();
        }

        c.restore();
    }
};

// ============================================================
// SETTINGS & VOLUME CONTROL
// ============================================================
window.masterVolume = 0.7;
window.sfxVolume = 0.8;
window.musicVolume = 0.5;
window.autoAttackEnabled = true;
window.showDamageNumbers = true;
window.showFloatingText = true;

window.setMasterVolume = function(vol) {
    window.masterVolume = Math.max(0, Math.min(1, vol));
    console.log('🔊 Master volume:', window.masterVolume);
};

window.setSfxVolume = function(vol) {
    window.sfxVolume = Math.max(0, Math.min(1, vol));
    console.log('🔊 SFX volume:', window.sfxVolume);
};

window.setMusicVolume = function(vol) {
    window.musicVolume = Math.max(0, Math.min(1, vol));
    console.log('🔊 Music volume:', window.musicVolume);
};

// Auto-save every 30 seconds (local only)
setInterval(function() {
    if (window.currentSaveSlot !== null && window.currentSaveSlot !== undefined && typeof window.saveGame === 'function') {
        window.saveGame();
        console.log('💾 Auto-saved');
    }
}, 30000);

// Auto-sync to n8n every 2 minutes (less frequent to avoid spam)
setInterval(function() {
    if (window.currentSaveSlot !== null && window.currentSaveSlot !== undefined && typeof window.syncToN8n === 'function') {
        const saveData = typeof window.collectGameState === 'function' ? window.collectGameState() : null;
        if (saveData) {
            window.syncToN8n(saveData, 'auto_sync');
            console.log('📡 Auto-synced to n8n');
        }
    }
}, 120000);

// ============================================================
// 🎞️ GIF DECODER - GIẢI MÃ FILE GIF THÀNH CÁC FRAME
// ============================================================
const gifCache = {};

function loadGif(url, id) {
    if (gifCache[id]) return;
    
    gifCache[id] = { frames: [], loaded: false, currentFrame: 0, timer: 0 };
    
    fetch(url)
        .then(function(response) { return response.arrayBuffer(); })
        .then(function(buffer) {
            parseGif(new Uint8Array(buffer), id);
        })
        .catch(function(err) {
            console.error('❌ Lỗi load GIF:', url, err);
        });
}

function parseGif(bytes, id) {
    // Kiểm tra header GIF89a hoặc GIF87a
    const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]);
    if (header.indexOf('GIF') !== 0) {
        console.error('❌ Không phải file GIF hợp lệ:', id);
        return;
    }

    const width = bytes[6] | (bytes[7] << 8);
    const height = bytes[8] | (bytes[9] << 8);
    const packed = bytes[10];
    const hasGlobalColorTable = (packed & 0x80) !== 0;
    const globalColorTableSize = hasGlobalColorTable ? 3 * Math.pow(2, (packed & 0x07) + 1) : 0;

    let offset = 13 + globalColorTableSize;
    const frames = [];
    let delay = 100; // Default 100ms
    let transparentIndex = -1;
    let disposalMethod = 0;

    // Tạo canvas nền để ghép các frame
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = width;
    bgCanvas.height = height;
    const bgCtx = bgCanvas.getContext('2d');

    while (offset < bytes.length - 1) {
        const blockType = bytes[offset];
        offset++;

        if (blockType === 0x21) { // Extension
            const extType = bytes[offset];
            offset++;

            if (extType === 0xF9) { // Graphic Control Extension
                const blockSize = bytes[offset];
                offset++;
                const gcePacked = bytes[offset];
                disposalMethod = (gcePacked >> 2) & 0x07;
                const hasTransparent = (gcePacked & 0x01) !== 0;
                delay = (bytes[offset + 1] | (bytes[offset + 2] << 8)) * 10; // Convert to ms
                if (delay === 0) delay = 100;
                transparentIndex = hasTransparent ? bytes[offset + 3] : -1;
                offset += blockSize;
                offset++; // Block terminator
            } else if (extType === 0xFF) { // Application Extension (loop)
                const blockSize = bytes[offset];
                offset += blockSize + 1;
                // Skip sub-blocks
                while (bytes[offset] !== 0 && offset < bytes.length) {
                    offset += bytes[offset] + 1;
                }
                offset++;
            } else {
                // Skip other extensions
                while (bytes[offset] !== 0 && offset < bytes.length) {
                    offset += bytes[offset] + 1;
                }
                offset++;
            }
        } else if (blockType === 0x2C) { // Image Descriptor
            const left = bytes[offset] | (bytes[offset + 1] << 8);
            const top = bytes[offset + 2] | (bytes[offset + 3] << 8);
            const w = bytes[offset + 4] | (bytes[offset + 5] << 8);
            const h = bytes[offset + 6] | (bytes[offset + 7] << 8);
            const imgPacked = bytes[offset + 8];
            offset += 9;

            const hasLocalColorTable = (imgPacked & 0x80) !== 0;
            const localColorTableSize = hasLocalColorTable ? 3 * Math.pow(2, (imgPacked & 0x07) + 1) : 0;
            
            let colorTable = [];
            if (hasLocalColorTable) {
                for (let i = 0; i < localColorTableSize / 3; i++) {
                    colorTable.push([bytes[offset], bytes[offset + 1], bytes[offset + 2]]);
                    offset += 3;
                }
            } else if (hasGlobalColorTable) {
                // Đọc lại global color table
                let gOffset = 13;
                for (let i = 0; i < globalColorTableSize / 3; i++) {
                    colorTable.push([bytes[gOffset], bytes[gOffset + 1], bytes[gOffset + 2]]);
                    gOffset += 3;
                }
            }

            const lzwMinCodeSize = bytes[offset];
            offset++;

            // Đọc LZW compressed data
            const compressedData = [];
            while (bytes[offset] !== 0 && offset < bytes.length) {
                const subBlockSize = bytes[offset];
                offset++;
                for (let i = 0; i < subBlockSize; i++) {
                    compressedData.push(bytes[offset++]);
                }
            }
            offset++; // Block terminator

            // Giải nén LZW
            const pixels = decodeLZW(compressedData, lzwMinCodeSize, w * h);

            // Vẽ frame lên canvas tạm
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = width;
            frameCanvas.height = height;
            const fCtx = frameCanvas.getContext('2d');

            // Xử lý disposal method
            if (disposalMethod === 2) {
                bgCtx.clearRect(left, top, w, h);
            } else if (disposalMethod === 3) {
                // Restore to previous - simplified: just clear
            }

            const imageData = fCtx.createImageData(w, h);
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const idx = y * w + x;
                    const colorIdx = pixels[idx];
                    const pIdx = (y * w + x) * 4;
                    
                    if (colorIdx === transparentIndex) {
                        imageData.data[pIdx + 3] = 0; // Transparent
                    } else if (colorTable[colorIdx]) {
                        imageData.data[pIdx] = colorTable[colorIdx][0];
                        imageData.data[pIdx + 1] = colorTable[colorIdx][1];
                        imageData.data[pIdx + 2] = colorTable[colorIdx][2];
                        imageData.data[pIdx + 3] = 255;
                    }
                }
            }
            fCtx.putImageData(imageData, 0, 0);
            
            // Ghép lên background
            bgCtx.drawImage(frameCanvas, 0, 0);

            // Lưu frame
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = width;
            finalCanvas.height = height;
            finalCanvas.getContext('2d').drawImage(bgCanvas, 0, 0);

            frames.push({
                canvas: finalCanvas,
                delay: delay
            });

            // Reset disposal cho frame tiếp
            if (disposalMethod === 1 || disposalMethod === 0) {
                // Do nothing or leave as is
            }
            disposalMethod = 0;
            transparentIndex = -1;

        } else if (blockType === 0x3B) { // Trailer
            break;
        } else {
            break;
        }
    }

    if (frames.length > 0) {
        gifCache[id].frames = frames;
        gifCache[id].loaded = true;
        console.log('✅ Loaded GIF:', id, '| Frames:', frames.length);
    }
}

function decodeLZW(data, minCodeSize, pixelCount) {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let maxCode = 1 << codeSize;
    
    const output = new Uint8Array(pixelCount);
    let outIdx = 0;

    // Khởi tạo bảng mã
    let table = [];
    function initTable() {
        table = [];
        for (let i = 0; i < clearCode; i++) {
            table[i] = [i];
        }
        table[clearCode] = [];
        table[eoiCode] = [];
    }
    initTable();

    let bitBuf = 0;
    let bitCount = 0;
    let dataIdx = 0;

    function readBits(n) {
        while (bitCount < n) {
            if (dataIdx >= data.length) return -1;
            bitBuf |= data[dataIdx++] << bitCount;
            bitCount += 8;
        }
        const val = bitBuf & ((1 << n) - 1);
        bitBuf >>= n;
        bitCount -= n;
        return val;
    }

    let prevEntry = null;

    while (outIdx < pixelCount) {
        const code = readBits(codeSize);
        if (code === -1 || code === eoiCode) break;

        if (code === clearCode) {
            initTable();
            codeSize = minCodeSize + 1;
            maxCode = 1 << codeSize;
            prevEntry = null;
            continue;
        }

        let entry;
        if (table[code]) {
            entry = table[code];
        } else if (code === table.length && prevEntry) {
            entry = prevEntry.concat(prevEntry[0]);
        } else {
            break;
        }

        for (let i = 0; i < entry.length && outIdx < pixelCount; i++) {
            output[outIdx++] = entry[i];
        }

        if (prevEntry) {
            table.push(prevEntry.concat(entry[0]));
            if (table.length >= maxCode && codeSize < 12) {
                codeSize++;
                maxCode = 1 << codeSize;
            }
        }

        prevEntry = entry;
    }

    return output;
}

function getGifFrame(id, dt) {
    const gif = gifCache[id];
    if (!gif || !gif.loaded || gif.frames.length === 0) return null;
    
    gif.timer = (gif.timer || 0) + (dt || 16.67);
    const frame = gif.frames[gif.currentFrame];
    
    if (gif.timer >= frame.delay) {
        gif.timer -= frame.delay;
        gif.currentFrame = (gif.currentFrame + 1) % gif.frames.length;
    }
    
    return gif.frames[gif.currentFrame].canvas;
}
console.log('🎮 game.js sẵn sàng!');