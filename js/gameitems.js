// ============================================================
// ITEM - gameitems.js
// ============================================================
// ============================================================
// VẬT PHẨM RƠI TRÊN ĐẤT
// ============================================================
let droppedItems = [];

const DROP_CONFIG = {
    ITEM_LIFETIME: 600,
    PICKUP_RANGE: 40
};

// Cập nhật vật phẩm rơi
function updateDroppedItems() {
    if (typeof player === 'undefined') return;
    if (typeof addItemToInventory === 'undefined') return;
    
    for (let i = droppedItems.length - 1; i >= 0; i--) {
        const drop = droppedItems[i];
        drop.lifetime--;
        drop.bob += drop.bobSpeed;
        
        // Kiểm tra khoảng cách với player
        const dx = player.x - drop.x;
        const dy = player.y - drop.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Nhặt nếu lại gần
        if (dist < DROP_CONFIG.PICKUP_RANGE) {
            if (addItemToInventory(drop.item, drop.item.count || 1)) {
                showNotification('✅ Nhặt: ' + drop.item.name + ' x' + (drop.item.count || 1));
                droppedItems.splice(i, 1);
                continue;
            }
        }
        
        // Hết hạn thì xóa
        if (drop.lifetime <= 0) {
            droppedItems.splice(i, 1);
        }
    }
}

// Vẽ vật phẩm rơi
function drawDroppedItems() {
    if (typeof Camera === 'undefined') return;
    
    for (let drop of droppedItems) {
        const screen = Camera.toScreen(drop.x, drop.y);
        const bobY = Math.sin(drop.bob) * 3;
        const glowPulse = 0.5 + Math.sin(drop.bob * 2) * 0.2;
        
        // Vòng sáng dưới
        ctx.fillStyle = 'rgba(255, 215, 0, ' + (0.3 * glowPulse) + ')';
        ctx.beginPath();
        ctx.ellipse(screen.x, screen.y + 10, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Nền đen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(screen.x, screen.y + bobY, 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Viền vàng
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y + bobY, 16, 0, Math.PI * 2);
        ctx.stroke();
        
        // Icon
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(drop.item.icon, screen.x, screen.y + bobY);
        
        // Tên
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(drop.item.name, screen.x, screen.y + 28);
        ctx.fillText(drop.item.name, screen.x, screen.y + 28);
    }
}

console.log('💊 gameitems.js sẵn sàng! (Có drop system)');

// ============================================================
// KÍCH HOẠT ITEM THEO TYPE
// ============================================================
function activateSniperItem(item, angle) {
    if (!item) {
        console.error('❌ activateSniperItem: item null');
        return;
    }
    
    // ⭐ TÍNH DAMAGE THEO CẤP VŨ KHÍ
    let damage = item.damage;
    if (item.type === 'weapon' && typeof getWeaponDamage === 'function') {
        damage = getWeaponDamage(item);
    }
    
    console.log('🎯 activateSniperItem:', item.name, '| Type:', item.type, '| Mode:', item.mode, '| multiBarrel:', item.multiBarrel, '| Damage:', damage);
    // ⭐ SCYTHE — CHÉM ĐẶC BIỆT (ĐẦU TIÊN!)
    if (item.id === 'collapsed_scythe') {
        if (typeof fireScytheSlash === 'function') {
            fireScytheSlash(angle, damage, item);
            return;
        }
    }
    // ========================================================
    // VẬT PHẨM TIÊU HAO
    // ========================================================
    if (item.type === 'consumable') {
        if (item.id === 'bomb') {
            if (typeof throwBomb === 'function') throwBomb(angle, item);
            return;
        }
        if (item.id === 'mixed_potion') {
            if (typeof useMixedPotion === 'function') useMixedPotion(item);
            return;
        }
    }
    
    // ========================================================
    // VŨ KHÍ
    // ========================================================
    if (item.type === 'weapon') {
        // ⭐ NHIỀU NÒNG
        if (item.multiBarrel) {
            console.log('🔱 Bắn', item.barrelCount, 'nòng');
            if (typeof fireShotgunSniperBullet === 'function') {
                fireShotgunSniperBullet(angle, damage, item);
            } else {
                console.error('❌ fireShotgunSniperBullet không tồn tại!');
            }
            return;
        }
        
        // ⭐ SNIPER MODE
        if (item.mode === 'sniper') {
            console.log('🎯 Bắn sniper | Damage:', damage, '| Pierce:', item.pierce);
            if (typeof fireSniperBullet === 'function') {
                fireSniperBullet(angle, damage, item.pierce || 0);
            } else {
                console.error('❌ fireSniperBullet không tồn tại!');
            }
            return;
        }
        
        // ⭐ AUTO MODE
        if (item.mode === 'auto') {
            console.log('🔫 Bắn auto');
            if (typeof fireAutoBullet === 'function') {
                fireAutoBullet(angle, damage);
            } else {
                console.error('❌ fireAutoBullet không tồn tại!');
            }
            return;
        }
    }
    
    console.warn('⚠️ Không xử lý được item:', item.name);
}
    
    

function throwBomb(angle, item) {
    if (!item) return;
    const bombRadius = 150;
    const bombX = player.x + Math.cos(angle) * 80;
    const bombY = player.y + Math.sin(angle) * 80;
    let hitCount = 0;
    
    for (let i = monsters.length - 1; i >= 0; i--) {
        const m = monsters[i];
        const dist = Math.sqrt((m.x - bombX) ** 2 + (m.y - bombY) ** 2);
        if (dist < bombRadius) {
            m.hp -= item.damage;
            hitCount++;
            if (m.hp <= 0) {
                player.coins += m.score;
                monsters.splice(i, 1);
                if (typeof dropItemFromMonster === 'function') dropItemFromMonster(m);
            }
        }
    }
    
    addExplosionEffect(bombX, bombY, bombRadius);
    showNotification('💣 Nổ! Trúng ' + hitCount + ' quái');
    consumeItem(item);
}

function useMixedPotion(item) {
    let hh = 0, hm = 0;
    if (item.heal) {
        const old = player.hp;
        player.hp = Math.min(player.maxHp, player.hp + item.heal);
        hh = player.hp - old;
    }
    if (item.mana) {
        const old = player.mp;
        player.mp = Math.min(player.maxMp, player.mp + item.mana);
        hm = player.mp - old;
    }
    if (hh === 0 && hm === 0) {
        showNotification('HP/MP đã đầy!');
        return;
    }
    let msg = '';
    if (hh > 0) msg += '❤️+' + hh + ' ';
    if (hm > 0) msg += '💙+' + hm;
    showNotification(msg);
    consumeItem(item);
    UI.update();
}

function consumeItem(item) {
    if (!item) return;
    if (item.stackable) {
        item.count--;
        if (item.count <= 0) inventory[selectedSlot] = null;
    } else {
        inventory[selectedSlot] = null;
    }
    updateInventoryUI();
    updateHotbarUI();
}

// Hiệu ứng nổ
let explosionEffects = [];

function addExplosionEffect(x, y, radius) {
    explosionEffects.push({ x, y, radius: 0, maxRadius: radius, life: 30, maxLife: 30 });
}

function updateExplosionEffects() {
    for (let i = explosionEffects.length - 1; i >= 0; i--) {
        const e = explosionEffects[i];
        e.life--;
        e.radius = e.maxRadius * (1 - e.life / e.maxLife);
        if (e.life <= 0) explosionEffects.splice(i, 1);
    }
}

function drawExplosionEffects() {
    for (let e of explosionEffects) {
        const screen = Camera.toScreen(e.x, e.y);
        const alpha = e.life / e.maxLife;
        ctx.strokeStyle = 'rgba(255, 150, 0, ' + alpha + ')';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, e.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 100, ' + (alpha * 0.3) + ')';
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, e.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

console.log('💊 gameitems.js sẵn sàng!');