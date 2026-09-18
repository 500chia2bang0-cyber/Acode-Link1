// ============================================================
// ĐẠN - gamebullets.js
// ============================================================
console.log('🔫 Bắt đầu load gamebullets.js...');

// ============================================================
// CẤU HÌNH
// ============================================================
const BULLET_CONFIG = {
    auto:    { speed: 25,  radius: 5, life: 80,  color: '#ffd700' },
    sniper:  { speed: 25, radius: 6, life: 120, color: '#ff3333' },
    shotgun: { speed: 25,  radius: 4, life: 50,  color: '#ff9900' }
};

// ============================================================
// BẮN AUTO (Súng lục, súng trường, kiếm)
// ============================================================
function fireAutoBullet(angle, damage) {
    if (typeof bullets === 'undefined') {
        console.error('❌ bullets không tồn tại!');
        return;
    }
    if (typeof player === 'undefined') return;
    
    const cfg = BULLET_CONFIG.auto;
    
    bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * cfg.speed,
        vy: Math.sin(angle) * cfg.speed,
        radius: cfg.radius,
        color: cfg.color,
        life: cfg.life,
        damage: damage || 15,
        type: 'auto',
        pierce: 0,
        hitMonsters: []
    });
    
    console.log('🔫 Bắn auto | Angle:', Math.round(angle * 180 / Math.PI) + '°');
}

// ============================================================
// BẮN SNIPER (AWP, Barret, Railgun)
// ============================================================
function fireSniperBullet(angle, damage, pierce) {
    if (typeof bullets === 'undefined') {
        console.error('❌ bullets không tồn tại!');
        return;
    }
    if (typeof player === 'undefined') return;
    
    const cfg = BULLET_CONFIG.sniper;
    
    bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * cfg.speed,
        vy: Math.sin(angle) * cfg.speed,
        radius: cfg.radius,
        color: cfg.color,
        life: cfg.life,
        damage: damage || 100,
        type: 'sniper',
        isSniper: true,
        pierce: pierce || 0,
        hitMonsters: []
    });
    
    console.log('🎯 Bắn sniper | Damage:', damage, '| Pierce:', pierce);
}

// ============================================================
// CHÉM SCYTHE — TAY VÒNG + CHÉM XUỐNG
// ============================================================
// ============================================================
// CHÉM SCYTHE — LASER NHIỀU NÒNG
// ============================================================
function fireScytheSlash(angle, damage, item) {
    if (typeof bullets === 'undefined') return;
    if (typeof player === 'undefined') return;
    if (typeof Hand === 'undefined') return;
    
    // ⭐ BẮT ĐẦU ANIMATION
    Hand.startSwing();
    
    // ⭐ TẠO VỆT CHÉM (SỐNG 15 FRAME)
    if (typeof addSlashTrail === 'function') {
        addSlashTrail(angle, 'rgba(255, 0, 0, 1)');
    }
    
    // ⭐ 5 TIA LASER
    const laserCount = 15;
    const spreadAngle = 0.5;
    
    for (let i = 0; i < laserCount; i++) {
        const offset = (i - (laserCount - 1) / 2) * (spreadAngle / (laserCount - 1));
        const a = angle + offset;
        
        bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(a) * 45,
            vy: Math.sin(a) * 45,
            radius: 20,
            color: '#ff0000',
            life: 80,
            damage: damage * 2,
            type: 'scythe_laser',
            isSniper: true,
            pierce: 99,
            isScythe: true,
            angle: a,
            hitMonsters: []
        });
    }
    
    // ⭐ SCREEN SHAKE SAU 100MS (frame 5)
    setTimeout(function() {
        if (typeof triggerShake === 'function') {
            triggerShake(12, 8);
        }
    }, 100);
    
    console.log('💀 SCYTHE §§§! 5 tia laser');
}
// ============================================================
// BẮN SHOTGUN / PLASMA (nhiều nòng)
// ============================================================
function fireShotgunSniperBullet(angle, damage, item) {
    if (typeof bullets === 'undefined') return;
    if (typeof player === 'undefined') return;
    if (!item) return;
    
    const cfg = BULLET_CONFIG ? BULLET_CONFIG.sniper : { speed: 15, radius: 6, life: 120 };
    const count = item.barrelCount || 5;
    const spread = item.spreadAngle || 0.5;
    const pierce = item.pierce || 1;
    
    let bulletColor = '#ffaa00';
    if (item.id === 'plasma') bulletColor = '#ff00ff';
    
    for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * (spread / (count - 1 || 1));
        const a = angle + offset;
        
        bullets.push({
            x: player.x, y: player.y,
            vx: Math.cos(a) * cfg.speed,
            vy: Math.sin(a) * cfg.speed,
            radius: cfg.radius - 2,
            color: bulletColor,
            life: cfg.life,
            damage: damage || 60,
            type: 'sniper_multi',
            isSniper: true,
            pierce: pierce,
            hitMonsters: []
        });
    }
    
    console.log('🔱 Bắn', count, 'viên');
}

// ============================================================
// BẮN THEO LOẠI VŨ KHÍ
// ============================================================
function fireByWeapon(angle, type, damage, item) {
    // ⭐ TÍNH LẠI DAMAGE THEO CẤP VŨ KHÍ
    if (item && typeof getWeaponDamage === 'function') {
        damage = getWeaponDamage(item);
    }
     // ⭐ SCYTHE — ĐẠN TO + HIỆU ỨNG CHÉM
    if (item && item.id === 'collapsed_scythe') {
        fireScytheSlash(angle, damage, item);
        return;
    }
    if (item && item.multiBarrel) {
        fireShotgunSniperBullet(angle, damage, item);
        return;
    }
    
    switch (type) {
        case 'sniper':
            fireSniperBullet(angle, damage, item ? item.pierce : 0);
            break;
        case 'shotgun':
            fireShotgunBullet(angle, damage);
            break;
        default:
            fireAutoBullet(angle, damage);
    }
}

// ============================================================
// LẤY LOẠI VŨ KHÍ
// ============================================================
function getWeaponType(item) {
    if (!item) return 'auto';
    if (item.multiBarrel) return 'sniper';
    if (item.id === 'awp' || item.id === 'barret' || item.id === 'railgun') return 'sniper';
    if (item.id === 'shotgun') return 'shotgun';
    return 'auto';
}

// ============================================================
// CẬP NHẬT ĐẠN
// ============================================================
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;
        
        // Xóa nếu hết life hoặc ra khỏi map
        if (b.life <= 0 || b.x < 0 || b.x > MAP.getWidth() ||
            b.y < 0 || b.y > MAP.getHeight()) {
            bullets.splice(i, 1);
        }
    }
}
// ============================================================
// VẼ ĐẠN
// ============================================================
function drawBullets() {
    for (let b of bullets) {
        const screen = Camera.toScreen(b.x, b.y);
        
        // ⭐ LASER SCYTHE — §§§
        if (b.type === 'scythe_laser') {
            // ⭐ VỆT LASER DÀI - optimized: no gradient creation per frame
            const laserLength = 100;
            const endX = screen.x - b.vx * (laserLength / 15);
            const endY = screen.y - b.vy * (laserLength / 15);
            
            // Outer glow - single stroke with solid color
            ctx.strokeStyle = 'rgba(255, 30, 30, 0.6)';
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(screen.x, screen.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Core laser
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(screen.x, screen.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Inner bright core
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screen.x, screen.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Tip
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // Icon
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💀', screen.x, screen.y);
            
            continue;
        }
        
        // ... code cũ vẽ đạn thường
  
        
        
      
        // Đạn plasma (hồng tím)
        if (b.color === '#ff00ff') {
            ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, b.radius * 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Vệt dài cho đạn sniper
        if (b.isSniper && b.color !== '#ff00ff') {
            ctx.strokeStyle = 'rgba(255, 50, 50, 0.5)';
            ctx.lineWidth = 9;
            ctx.beginPath();
            ctx.moveTo(screen.x - b.vx * 2, screen.y - b.vy * 2);
            ctx.lineTo(screen.x, screen.y);
            ctx.stroke();
        }
        
        // Vẽ đạn
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Viền sáng cho đạn xuyên
        if (b.pierce > 0) {
            ctx.strokeStyle = b.color === '#ff00ff' 
                ? 'rgba(255, 200, 255, 0.8)' 
                : 'rgba(255, 200, 100, 0.6)';
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, b.radius + 2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

console.log('🔫 gamebullets.js sẵn sàng!');
console.log('📦 Hàm: fireAutoBullet, fireSniperBullet, fireShotgunSniperBullet');