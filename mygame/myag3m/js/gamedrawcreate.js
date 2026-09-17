// ============================================================
// DRAW + UPDATE - gamedrawcreate.js
// ============================================================
console.log('🎨 Bắt đầu load gamedrawcreate.js...');

// ============================================================
// CACHE ẢNH SCALED
// ============================================================
const scaledWeaponCache = {};

function getScaledSprite(sprite, scale) {
    const key = sprite.src + '_' + scale;
    if (!scaledWeaponCache[key]) {
        const c = document.createElement('canvas');
        c.width = sprite.width * scale;
        c.height = sprite.height * scale;
        const cx = c.getContext('2d');
        cx.imageSmoothingEnabled = false;
        cx.drawImage(sprite, 0, 0, c.width, c.height);
        scaledWeaponCache[key] = c;
    }
    return scaledWeaponCache[key];
}

// ============================================================
// VẼ SÚNG
// ============================================================
function drawWeapon(c, px, py) {
    if (typeof inventory === 'undefined') return;
    if (typeof weaponSprites === 'undefined') return;
    if (typeof Hand === 'undefined') return;
    if (typeof Camera === 'undefined') return;
    
    const item = inventory[selectedSlot];
    if (!item || item.type === 'material' || item.type === 'consumable') return;
    
    // ⭐ LẤY VỊ TRÍ TAY
    const hand = Hand.getPosition();
    const screenX = hand.x - Camera.x;
    const screenY = hand.y - Camera.y;
    
    let sprite = null, scale = 3;
    
    switch (item.id) {
        case 'pistol': sprite = weaponSprites.pistol; scale = 3.5; break;
        case 'rifle': sprite = weaponSprites.rifle; scale = 3; break;
        case 'awp':
        case 'barret':
        case 'railgun': sprite = weaponSprites.sniper; scale = 3; break;
        case 'plasma': sprite = weaponSprites.plasma; scale = 3; break;
        case 'shotgun': sprite = weaponSprites.shotgun; scale = 3; break;
        case 'collapsed_scythe': sprite = weaponSprites.scythe; scale = 0.3; break;
        default: return;
    }
    
    // ⭐ VẼ BÀN TAY
    c.save();
    c.translate(screenX, screenY);
    
    // Bàn tay tròn
    c.fillStyle = '#f4a460';
    c.strokeStyle = '#8b4513';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(0, 0, 10, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    
    // ⭐ VẼ VŨ KHÍ (LẬT THEO JOYSTICK, KHÔNG THEO TAY)
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
        const cached = getScaledSprite(sprite, scale);
        
        // ⭐ KHÓA LẬT THEO FIREJOY (không theo Hand)
        let lockAngle = hand.angle;
        if (typeof fireJoy !== 'undefined' && fireJoy.active) {
            lockAngle = fireJoy.angle;
        }
        
        const shouldFlip = Math.abs(lockAngle) > Math.PI / 2;
        
        c.save();
        if (shouldFlip) {
            c.scale(1, -1);
            c.rotate(-hand.angle);
        } else {
            c.rotate(hand.angle);
        }
        c.drawImage(cached, 12, -cached.height / 2);
        c.restore();
    }
    
    c.restore();
}
// ============================================================
// VẼ GAME
// ============================================================
window.drawGame = function() {
    if (typeof ctx === 'undefined') return;
    if (typeof W === 'undefined' || W === 0) return;
    
    // Reset transform
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    
    // Screen effects
    if (typeof applyScreenEffects === 'function') applyScreenEffects();
    
    // Clear
    ctx.clearRect(0, 0, W, H);
    
    // ⭐ MAP
    if (typeof drawMapBase === 'function') drawMapBase();

    // 🌀 CỔNG DỊCH CHUYỂN (map 2)
    if (typeof drawMapPortal === 'function') drawMapPortal();
// ============================================================
// 🟣 VẼ ORB DECADE
// ============================================================

if (
    typeof orbDecadeActive !== 'undefined' &&
    orbDecadeActive &&
    currentMap === 1
) {
    const s = Camera.toScreen(
        ORB_DECADE.x,
        ORB_DECADE.y
    );

    const pulse = Math.sin(Date.now() * 0.005) * 5;

    ctx.save();

    // Hào quang
    const glow = ctx.createRadialGradient(
        s.x,
        s.y,
        5,
        s.x,
        s.y,
        65 + pulse
    );

    glow.addColorStop(
        0,
        'rgba(255,255,255,0.9)'
    );

    glow.addColorStop(
        0.25,
        'rgba(190,80,255,0.65)'
    );

    glow.addColorStop(
        0.65,
        'rgba(120,30,255,0.25)'
    );

    glow.addColorStop(
        1,
        'rgba(100,0,180,0)'
    );

    ctx.fillStyle = glow;

    ctx.beginPath();

    ctx.arc(
        s.x,
        s.y,
        65 + pulse,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Orb
    ctx.fillStyle = '#8b2cff';

    ctx.strokeStyle = '#f0c8ff';

    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.arc(
        s.x,
        s.y,
        ORB_DECADE.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();
    ctx.stroke();

    // Lõi sáng
    ctx.fillStyle = '#ffffff';

    ctx.beginPath();

    ctx.arc(
        s.x - 9,
        s.y - 10,
        8,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}
    
    // Đạn
    if (typeof drawBullets === 'function') drawBullets();
    
    // NPC
    if (typeof drawNPCs === 'function') drawNPCs();
    
    // Nhân vật
    // Nhân vật
if (typeof player !== 'undefined' && typeof Camera !== 'undefined') {
    const ox = player.x, oy = player.y;
    player.x -= Camera.x;
    player.y -= Camera.y;
    player.draw(ctx);
    player.x = ox;
    player.y = oy;
    
    // ⭐ GỌI RIÊNG SAU KHI PHỤC HỒI
    if (typeof drawWeapon === 'function') {
        try { drawWeapon(ctx); } catch(e) {}
    }
}
    
    // Quái
    if (typeof drawMonsters === 'function') drawMonsters();
    
    // Boss
    if (typeof drawBoss === 'function') drawBoss();
    if (typeof drawBossBullets === 'function') drawBossBullets();
    
    // Items
    if (typeof drawDroppedItems === 'function') drawDroppedItems();
    if (typeof drawExplosionEffects === 'function') drawExplosionEffects();
    
    // Aim line
    if (typeof window.drawAimLine === 'function') window.drawAimLine();
    
    // ⭐ TÁN CÂY
    if (typeof drawMapCanopy === 'function') drawMapCanopy();
  // ⭐ VẼ KHỐI 4D
if (typeof hypercube !== 'undefined') hypercube.draw();
  // ⭐ VẼ VỆT CHÉM (ĐÈ LÊN TRÊN)
if (typeof drawSlashTrails === 'function') {
    drawSlashTrails(ctx, player.x - Camera.x, player.y - Camera.y);
}

// 🌀 HIỆU ỨNG CHUYỂN MAP (vẽ trên cùng, đè lên mọi thứ)
if (typeof drawMapTransition === 'function') drawMapTransition();
};

// ============================================================
// UPDATE GAME
// ============================================================
window.updateGame = function() {
    if (typeof moveJoy === 'undefined') return;
    if (typeof player === 'undefined') return;
    if (typeof Camera === 'undefined') return;
    if (typeof MAP === 'undefined') return;
    
    // ⭐ Đóng băng di chuyển khi đang chuyển map
    const frozen = (typeof MapTransition !== 'undefined') && MapTransition.active;

    // Di chuyển
    const dir = frozen ? { x: 0, y: 0 } : moveJoy.getDir();
    if (dir.x !== 0 || dir.y !== 0) {
        const nx = player.x + dir.x * player.speed;
        const ny = player.y + dir.y * player.speed;
        const half = player.size / 2;
        
        if (MAP.isWalkable(nx + half, player.y - half) &&
            MAP.isWalkable(nx + half, player.y + half) &&
            MAP.isWalkable(nx - half, player.y - half) &&
            MAP.isWalkable(nx - half, player.y + half)) {
            player.x = nx;
        }
        if (MAP.isWalkable(player.x + half, ny - half) &&
            MAP.isWalkable(player.x + half, ny + half) &&
            MAP.isWalkable(player.x - half, ny - half) &&
            MAP.isWalkable(player.x - half, ny + half)) {
            player.y = ny;
        }
    }
    
    const half = player.size / 2;
    player.x = Math.max(half, Math.min(MAP.getWidth() - half, player.x));
    player.y = Math.max(half, Math.min(MAP.getHeight() - half, player.y));
    
    // ⭐ Cứu hộ: nếu lọt vào ô đá thì đẩy ra chỗ trống gần nhất
    if (typeof MAP.findFreeSpot === 'function' && !MAP.isWalkable(player.x, player.y)) {
        const free = MAP.findFreeSpot(player.x, player.y);
        player.x = free.x;
        player.y = free.y;
    }

    Camera.follow(player.x, player.y);
    
    // Bắn tự động
    if (typeof fireJoy !== 'undefined' && fireJoy.shouldFire && fireJoy.shouldFire()) {
        const item = (typeof inventory !== 'undefined' && typeof selectedSlot !== 'undefined') 
            ? inventory[selectedSlot] : null;
        if (item && typeof fireByWeapon === 'function') {
            const type = typeof getWeaponType === 'function' ? getWeaponType(item) : 'auto';
            fireByWeapon(fireJoy.getAngle(), type, item.damage, item);
        } else if (typeof fireAutoBullet === 'function') {
            fireAutoBullet(fireJoy.getAngle(), 15);
        }
    }
    
    if (typeof updateBullets === 'function') updateBullets();
    if (typeof updateMonsters === 'function') updateMonsters();
    if (typeof updateBoss === 'function') updateBoss();
    if (typeof updateBossBullets === 'function') updateBossBullets();
    if (typeof updateDroppedItems === 'function') updateDroppedItems();
    if (typeof updateExplosionEffects === 'function') updateExplosionEffects();
    if (typeof updateNPCSystem === 'function') updateNPCSystem();
    
    if (typeof UI !== 'undefined') UI.update();
  // ⭐ KHỐI 4D
if (typeof hypercube !== 'undefined') hypercube.update();
  // ⭐ CẬP NHẬT BÀN TAY
// ⭐ CẬP NHẬT BÀN TAY
if (typeof Hand !== 'undefined' && Hand.update) Hand.update();

// ⭐ CẬP NHẬT VỆT CHÉM
// ⭐ CẬP NHẬT VỆT CHÉM
if (typeof updateSlashTrails === 'function') {
    updateSlashTrails();
}

// 🌀 HIỆU ỨNG CHUYỂN MAP
if (typeof updateMapTransition === 'function') updateMapTransition();

// 🗺️ HỆ THỐNG CỦA MAP (cổng dịch chuyển, vùng boss, orb)
if (typeof updateMapSystems === 'function') updateMapSystems();
};


// ============================================================
// ⭐ BÁO GAME READY
// ============================================================
window._gameReady = true;
console.log('🎨 gamedrawcreate.js sẵn sàng! — GAME READY');