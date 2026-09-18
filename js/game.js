// ============================================================
// CORE - game.js
// ============================================================
console.log('🎮 Bắt đầu load game.js...');
// ⭐ TRẠNG THÁI SPAWN
let spawnActive = false;      // Quái có được spawn không
let hypercubeActive = true;   // Khối 4D có hiện không
// ⭐ FLAG: Chờ gamedrawcreate.js load xong
window._gameReady = false;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;

let W = 0, H = 0;

// ============================================================
// RESIZE (CHỈ SET 1 LẦN)
// ============================================================
let _lastH = 0
let _lastW = 0
function resize() {
    // ⭐ DÙNG WINDOW SIZE THAY VÌ PARENT
    const newW = window.innerWidth;
    const newH = window.innerHeight;
    
    // ⭐ KHÔNG THAY ĐỔI → KHÔNG LÀM GÌ
    if (Math.abs(_lastW - newW) < 5 && Math.abs(_lastH - newH) < 5) {
        return;
    }
    
    _lastW = newW;
    _lastH = newH;
    
    canvas.width = Math.floor(newW * devicePixelRatio);
    canvas.height = Math.floor(newH * devicePixelRatio);
    
    W = newW;
    H = newH;
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.imageSmoothingEnabled = false;
}

// ============================================================
// NHÂN VẬT
// ============================================================
const player = {
    x: 2560, y: 1920, size: 32, speed: 4,
    hp: 200, maxHp: 200, mp: 200, maxMp: 200, coins: 0,
    
    level: 1,
    exp: 0,
    expToNext: 100,
    
    init: function() {
        this.x = 2560;
        this.y = 1920;
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
// JOYSTICK
// ============================================================
const moveJoy = {
    el: document.getElementById('joystickKnob'),
    base: document.getElementById('joystickBase'),
    area: document.getElementById('joystickArea'),
    active: false, pointerId: null,
    dirX: 0, dirY: 0, maxDist: 40,
    
    setPos: function(cx, cy) {
        const rect = this.base.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let dx = cx - centerX, dy = cy - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.maxDist) {
            dx = (dx / dist) * this.maxDist;
            dy = (dy / dist) * this.maxDist;
        }
        this.el.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
        this.dirX = dx / this.maxDist;
        this.dirY = dy / this.maxDist;
    },
    
    getDir: function() {
        if (!this.active) return { x: 0, y: 0 };
        return { x: this.dirX, y: this.dirY };
    }
};

const fireJoy = {
    el: document.getElementById('fireJoystickKnob'),
    base: document.getElementById('fireJoystickBase'),
    indicator: document.getElementById('directionIndicator'),
    area: document.getElementById('fireJoystickArea'),
    active: false, pointerId: null,
    angle: 0, maxDist: 40,
    fireRate: 8, counter: 0,
    
    setPos: function(cx, cy) {
        const rect = this.base.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let dx = cx - centerX, dy = cy - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.maxDist) {
            dx = (dx / dist) * this.maxDist;
            dy = (dy / dist) * this.maxDist;
        }
        this.el.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
        this.angle = Math.atan2(dy, dx);
        if (dist > 5) {
            this.indicator.classList.add('active');
            const deg = this.angle * (180 / Math.PI) + 90;
            this.indicator.style.transform = 'translate(-50%, -50%) rotate(' + deg + 'deg)';
        } else {
            this.indicator.classList.remove('active');
        }
    },
    
    getAngle: function() {
        if (!this.active) return null;
        const step = (2 * Math.PI) / 64;
        return Math.round(this.angle / step) * step;
    }
};

// ============================================================
// ĐẠN
// ============================================================
let bullets = [];

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

weaponSprites.pistol.src = 'assets/sprites/weapons/pistol.png';
weaponSprites.rifle.src = 'assets/sprites/weapons/assault_rifle.png';
weaponSprites.shotgun.src = 'assets/sprites/weapons/shotgun.png';
weaponSprites.sniper.src = 'assets/sprites/weapons/sniper.png';
weaponSprites.barret.src = 'assets/sprites/weapons/sniper.png';
weaponSprites.bomb.src = 'assets/sprites/weapons/explosive.png';
weaponSprites.plasma.src = 'assets/sprites/weapons/plasma.png';
weaponSprites.railgun.src = 'assets/sprites/weapons/sniper.png';
weaponSprites.scythe.src = 'assets/sprites/weapons/collapsed_scythe.png';

weaponSprites.scythe.onload = function() {
    console.log('✅ Load collapsed_scythe.png OK');
};
weaponSprites.scythe.onerror = function() {
    console.error('❌ Load collapsed_scythe.png FAILED!');
};
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
    // ⭐ CHỜ GAMEDRAWCREATE LOAD XONG
    if (!window._gameReady) {
        requestAnimationFrame(loop);
        return;
    }
    
    if (typeof window.updateGame === 'function') {
        try { window.updateGame(); } catch(e) {}
    }
    if (typeof window.drawGame === 'function') {
        try { window.drawGame(); } catch(e) {}
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

// ===== SCYTHE VFX SETTINGS — chỉnh 4 số này để test nhanh =====
const SLASH_VFX = {
    depth: 145,        // độ sâu/bán kính: tăng = vệt nằm xa người hơn
    thickness: 30,    // độ dày thân vệt (giảm từ 91 để tăng FPS)
    arcLength: 2.5,   // chiều dài cung (radian): giảm để nhẹ hơn
    tailLength: 2.0   // độ kéo dài về phía sau theo cung
};

function addSlashTrail(angle, color) {
    slashTrails.push({
        angle: angle,
        color: color || 'rgba(255, 40, 40, 1)',
        life: 12,
        maxLife: 12,
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
        const radius = t.radius + progress * 6;
        const centerA = -Math.PI * 0.10;
        const halfArc = t.arcLength * 0.5;
        const startA = centerA - halfArc * 0.95 * t.tailLength;
        const endA = centerA + halfArc;

        c.save();
        c.translate(px, py);
        c.rotate(t.angle);
        c.globalCompositeOperation = 'lighter';
        c.lineCap = 'round';

        // Single combined arc with gradient-like effect using multiple strokes
        const thickness = t.thickness - progress * (t.thickness * 0.3);
        
        // Outer glow (single stroke)
        c.strokeStyle = 'rgba(255, 30, 30, ' + (alpha * 0.2) + ')';
        c.lineWidth = thickness * 2.5;
        c.beginPath();
        c.arc(0, 0, radius, startA, endA);
        c.stroke();

        // Main body
        c.strokeStyle = 'rgba(255, 50, 50, ' + (alpha * 0.85) + ')';
        c.lineWidth = thickness;
        c.beginPath();
        c.arc(0, 0, radius, startA, endA);
        c.stroke();

        // Inner core (white highlight)
        c.strokeStyle = 'rgba(255, 255, 255, ' + (alpha * 0.6) + ')';
        c.lineWidth = Math.max(2, thickness * 0.25);
        c.beginPath();
        c.arc(0, 0, radius, startA, endA);
        c.stroke();

        // Tip effects - simplified
        const tipA = endA - 0.1;
        for (let k = 0; k < 2; k++) {
            const spread = (k - 0.5) * 0.08;
            const a1 = tipA + spread;
            const len = 20 + k * 8;
            const innerR = radius - 8;
            const outerR = radius + len * (0.6 + alpha * 0.4);
            c.strokeStyle = 'rgba(255, 100, 100, ' + (alpha * (0.6 - k * 0.15)) + ')';
            c.lineWidth = 2.5 - k * 0.5;
            c.beginPath();
            c.moveTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
            c.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
            c.stroke();
        }

        // Sparks - reduced count
        for (let k = 0; k < 3; k++) {
            const a = startA + (endA - startA) * ((k + 1) / 4) + Math.sin(t.seed + k) * 0.05;
            const r = radius + 5 + ((k * 11) % 10);
            const size = 1.5 + ((k * 2) % 2);
            c.fillStyle = 'rgba(255, 180, 180, ' + (alpha * (0.7 - k * 0.1)) + ')';
            c.beginPath();
            c.arc(Math.cos(a) * r, Math.sin(a) * r, size, 0, Math.PI * 2);
            c.fill();
        }

        c.restore();
    }
};

resize();
// ⭐ CHỈ 1 EVENT LISTENER
let resizeTimer = null;
window.addEventListener('resize', function() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 300);
});

window.addEventListener('orientationchange', function() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 500);
});

loop();
// ⭐ HIỆN KHỐI 4D BAN ĐẦU
window.addEventListener('load', function() {
    setTimeout(function() {
        if (typeof hypercube !== 'undefined') {
            const el = document.getElementById('hypercube');
            if (el && hypercubeActive) el.style.display = 'block';
        }
    }, 500);
});

console.log('🎮 game.js sẵn sàng!');