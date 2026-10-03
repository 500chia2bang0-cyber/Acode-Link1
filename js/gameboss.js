// ============================================================
// BOSS FIGHT - gameboss.js
// ============================================================
console.log('👹 Bắt đầu load gameboss.js...');

// ============================================================
// CẤU HÌNH
// ============================================================
const BOSS_CONFIG = {
    KILL_THRESHOLD: 8,
    BOSS_NAME: 'Demon Lord',
    BOSS_COLOR: '#8b0000',
    BOSS_HP: 3000,
    BOSS_SIZE: 130,
    BOSS_SPEED: 1.75,
    BOSS_DAMAGE: 40,
    BOSS_SCORE: 1000,
    BULLET_SPEED: 20,
    BULLET_COOLDOWN: 90,
    BULLET_COUNT: 16,
    BULLET_DAMAGE: 20,
    BULLET_RADIUS: 8,
    BULLET_COLOR: '#00aaff'
};

// ⭐ Gộp cấu hình boss của map hiện tại lên trên cấu hình mặc định
function getBossConfig() {
    const cfg = {};
    for (const k in BOSS_CONFIG) cfg[k] = BOSS_CONFIG[k];
    if (typeof MAP !== 'undefined' && MAP.bossConfig) {
        for (const k in MAP.bossConfig) cfg[k] = MAP.bossConfig[k];
    }
    return cfg;
}

// ============================================================
// TRẠNG THÁI
// ============================================================
let killCount = 0;
let boss = null;
let bossBullets = [];
let bossSpawned = false;

// ============================================================
// ĐẾM KILL
// ============================================================
function onMonsterKilled() {
    killCount++;
    console.log('💀 Kill:', killCount + '/' + BOSS_CONFIG.KILL_THRESHOLD);
    
    if (killCount >= BOSS_CONFIG.KILL_THRESHOLD && !bossSpawned) {
        spawnBoss();
    }
}

// ============================================================
// SPAWN BOSS
// ============================================================
function spawnBoss() {
    bossSpawned = true;

    // ⭐ Lấy cấu hình boss của map hiện tại (map 2 có boss riêng)
    const cfg = getBossConfig();
    const sp = (typeof MAP !== 'undefined' && MAP.bossSpawn)
        ? MAP.bossSpawn
        : { x: 64 * 40, y: 48 * 40 };

    if (typeof monsters !== 'undefined') monsters.length = 0;

    boss = {
        x: sp.x,
        y: sp.y,
        size: cfg.BOSS_SIZE,
        hp: cfg.BOSS_HP,
        maxHp: cfg.BOSS_HP,
        speed: cfg.BOSS_SPEED,
        damage: cfg.BOSS_DAMAGE,
        score: cfg.BOSS_SCORE,
        color: cfg.BOSS_COLOR || '#8b0000',
        name: cfg.BOSS_NAME || 'Demon Lord',
        cfg: cfg,
        hitCooldown: 0,
        bulletCooldown: 0,
        knockbackX: 0,
        knockbackY: 0,
        isBoss: true
    };

    console.log('👹 SPAWN BOSS:', boss.name, '| HP', boss.hp, '| map', currentMap);

    if (typeof showNotification === 'function') {
        showNotification('👹 ' + (boss.name).toUpperCase() + ' XUẤT HIỆN!');
    }
}

// ============================================================
// CẬP NHẬT BOSS
// ============================================================
function updateBoss() {
    if (!boss) return;
    if (typeof player === 'undefined') return;
    if (typeof MAP === 'undefined') return;
    
    if (boss.hitCooldown > 0) boss.hitCooldown--;
    if (boss.bulletCooldown > 0) boss.bulletCooldown--;
    
    // Di chuyển về player
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 5) {
        const mx = (dx / dist) * boss.speed;
        const my = (dy / dist) * boss.speed;
        const half = boss.size / 2;
        
        if (MAP.isWalkable(boss.x + mx + half, boss.y) && 
            MAP.isWalkable(boss.x + mx - half, boss.y)) {
            boss.x += mx;
        }
        if (MAP.isWalkable(boss.x, boss.y + my + half) && 
            MAP.isWalkable(boss.x, boss.y + my - half)) {
            boss.y += my;
        }
    }
    
    // Va chạm player
    const pd = Math.sqrt((player.x - boss.x) ** 2 + (player.y - boss.y) ** 2);
    if (pd < (player.size / 2 + boss.size / 2) && boss.hitCooldown === 0) {
        // ⭐ TÍNH DAMAGE
        let damage = boss.damage;
        if (typeof calculateDamage === 'function') {
            damage = calculateDamage(boss.damage, 0.25);
        }
        player.hp = Math.max(0, player.hp - damage);
        boss.hitCooldown = 60;
        if (typeof UI !== 'undefined') UI.update();
        // Hiện số máu bị trừ
        if (typeof addDamageNumber === 'function') {
            addDamageNumber(player.x, player.y - player.size/2, damage, '#ff4444');
        }
    }
    
    // Bắn đạn
    if (boss.bulletCooldown === 0) {
        fireBossBullets();
        boss.bulletCooldown = BOSS_CONFIG.BULLET_COOLDOWN;
    }
    
    // Kiểm tra đạn player trúng boss
    if (typeof bullets !== 'undefined') {
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            const bd = Math.sqrt((b.x - boss.x) ** 2 + (b.y - boss.y) ** 2);
            if (bd < (boss.size / 2 + b.radius)) {
                const dmg = b.damage || 15;
                boss.hp -= dmg;
                bullets.splice(j, 1);
                
                // Hiện số máu trên boss
                if (typeof addDamageNumber === 'function') {
                    addDamageNumber(boss.x, boss.y - boss.size/2, dmg, '#ffdd44');
                }
                
                if (boss.hp <= 0) {
                    onBossKilled();
                    return;
                }
            }
        }
    }
}

// ============================================================
// BẮN 12 HƯỚNG
// ============================================================
function fireBossBullets() {
    if (!boss) return;

    const cfg = boss.cfg || BOSS_CONFIG;
    const count = cfg.BULLET_COUNT || 16;
    const step = (2 * Math.PI) / count;

    // Mỗi lần bắn xoay đi một chút -> đạn không lặp lại y hệt
    boss.shotOffset = (boss.shotOffset || 0) + 0.32;

    for (let i = 0; i < count; i++) {
        const angle = i * step + boss.shotOffset;
        bossBullets.push({
            x: boss.x,
            y: boss.y,
            vx: Math.cos(angle) * (cfg.BULLET_SPEED || 20),   // ⭐ ĐẢM BẢO vx/vy CÓ GIÁ TRỊ
            vy: Math.sin(angle) * (cfg.BULLET_SPEED || 20),
            radius: cfg.BULLET_RADIUS || 8,
            color: cfg.BULLET_COLOR || '#00aaff',
            life: 180,
            damage: cfg.BULLET_DAMAGE || 20
        });
    }

    console.log('💙 Boss bắn', count, 'hướng');
}

// ============================================================
// CẬP NHẬT ĐẠN BOSS
// ============================================================
function updateBossBullets() {
    if (typeof player === 'undefined') return;
    if (typeof MAP === 'undefined') return;
    
    for (let i = bossBullets.length - 1; i >= 0; i--) {
        const b = bossBullets[i];
        
        // ⭐ DI CHUYỂN ĐẠN
        b.x += b.vx;
        b.y += b.vy;
        b.life--;
        
        // Kiểm tra trúng player
        const dx = player.x - b.x;
        const dy = player.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < (player.size / 2 + b.radius)) {
            // ⭐ TÍNH DAMAGE
            let damage = b.damage;
            if (typeof calculateDamage === 'function') {
                damage = calculateDamage(b.damage, 0.15);
            }
            player.hp = Math.max(0, player.hp - damage);
            bossBullets.splice(i, 1);
            if (typeof UI !== 'undefined') UI.update();
            // Hiện số máu bị trừ
            if (typeof addDamageNumber === 'function') {
                addDamageNumber(player.x, player.y - player.size/2, damage, '#ff4444');
            }
            continue;
        }
        
        // Xóa nếu ra khỏi map
        if (b.x < 0 || b.x > MAP.getWidth() || 
            b.y < 0 || b.y > MAP.getHeight() || 
            b.life <= 0) {
            bossBullets.splice(i, 1);
        }
    }
}

// ============================================================
// VẼ BOSS
// ============================================================
function drawBoss() {
    if (!boss) return;
    if (typeof Camera === 'undefined') return;
    if (typeof ctx === 'undefined') return;
    
    const screen = Camera.toScreen(boss.x, boss.y);
    const half = boss.size / 2;
    
    // Bóng
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(screen.x, screen.y + half + 5, half * 0.9, half * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Hào quang
    const glowPulse = 0.5 + Math.sin(Date.now() / 300) * 0.3;
    ctx.fillStyle = 'rgba(255, 0, 0, ' + (0.2 * glowPulse) + ')';
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, half + 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Thân boss
    ctx.fillStyle = boss.color;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, half, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Mắt
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(screen.x - half * 0.4, screen.y - half * 0.2, half * 0.2, 0, Math.PI * 2);
    ctx.arc(screen.x + half * 0.4, screen.y - half * 0.2, half * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Miệng
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(screen.x - half * 0.3, screen.y + half * 0.3);
    ctx.lineTo(screen.x + half * 0.3, screen.y + half * 0.3);
    ctx.lineTo(screen.x, screen.y + half * 0.6);
    ctx.closePath();
    ctx.fill();
    
    // Thanh HP
    const barWidth = boss.size * 2;
    const barHeight = 12;
    const hpPercent = boss.hp / boss.maxHp;
    
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(screen.x - barWidth/2, screen.y - half - 30, barWidth, barHeight);
    
    ctx.fillStyle = hpPercent > 0.5 ? '#4ade80' : hpPercent > 0.25 ? '#fbbf24' : '#ff0000';
    ctx.fillRect(screen.x - barWidth/2, screen.y - half - 30, barWidth * hpPercent, barHeight);
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(screen.x - barWidth/2, screen.y - half - 30, barWidth, barHeight);
    
    // Tên boss
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.strokeText('👹 ' + boss.name, screen.x, screen.y - half - 40);
    ctx.fillText('👹 ' + boss.name, screen.x, screen.y - half - 40);
}

// ============================================================
// VẼ ĐẠN BOSS
// ============================================================
function drawBossBullets() {
    if (typeof Camera === 'undefined') return;
    if (typeof ctx === 'undefined') return;
    
    for (let b of bossBullets) {
        const screen = Camera.toScreen(b.x, b.y);
        
        // Hào quang
        ctx.fillStyle = 'rgba(0, 170, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, b.radius + 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Thân
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Viền
        ctx.strokeStyle = '#aaffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// ============================================================
// BOSS CHẾT
// ============================================================
// ============================================================
// BOSS CHẾT - RƠI NHIỀU ITEMS
// ============================================================
function onBossKilled() {
    console.log('🎉 BOSS CHẾT!');
    // ============================================================
    // 🟣 BOSS CHẾT → ORB DECADE XUẤT HIỆN
    // ============================================================

    if (currentMap === 1 && typeof orbDecadeActive !== 'undefined') {

        orbDecadeActive = true;

        console.log(
            '🟣 BOSS CHẾT → ORB DECADE XUẤT HIỆN! orbDecadeActive =', orbDecadeActive
        );

        if (typeof showNotification === 'function') {

            showNotification(
                '🟣 Một Orb Decade bí ẩn đã xuất hiện giữa đấu trường!'
            );

        }
        
        // ⭐ Force show orb decade button if player is nearby
        if (typeof checkOrbDecadeInteraction === 'function') {
            checkOrbDecadeInteraction();
        }
    }
    
    if (typeof player === 'undefined') return;
    if (typeof ITEMS === 'undefined') return;
    if (typeof droppedItems === 'undefined') return;
    // ⭐ RESET KHỐI 4D (chỉ map 1)
    if (currentMap === 1 && typeof hypercube !== 'undefined') {
        setTimeout(function() {
            // ⚠️ Nếu người chơi đã rời map 1 thì bỏ qua, tránh reset nhầm
            //    trạng thái spawn của map đang chơi
            if (currentMap !== 1) return;
            hypercube.reset();
            console.log('🎲 Boss chết → Khối 4D hiện lại!');
        }, 3000);   // 3 giây sau khi boss chết
    }
    
    // Vàng + EXP
    player.coins += boss.score;
    if (typeof player.addExp === 'function') player.addExp(500);
    if (typeof UI !== 'undefined') UI.update();
    
    // ⭐ RƠI 50 BTOKEN
    for (let i = 0; i < 5; i++) {
        droppedItems.push({
            x: boss.x + (Math.random() - 0.5) * 200,
            y: boss.y + (Math.random() - 0.5) * 200,
            item: { ...ITEMS.BTOKEN, count: 1 },
            lifetime: 1200,
            bob: 0,
            bobSpeed: 0.1 + Math.random() * 0.1
        });
    }
    console.log('💠 Rơi 50 Btoken!');
    
    // ⭐ RƠI 20 DARK GOO
  if (Math.random() < 0.2){
        droppedItems.push({
            x: boss.x + (Math.random() - 0.5) * 200,
            y: boss.y + (Math.random() - 0.5) * 200,
            item: { ...ITEMS.DARK_GOO, count: 1 },
            lifetime: 1200,
            bob: 0,
            bobSpeed: 0.1 + Math.random() * 0.1
        });
  }
    console.log('⚫ Rơi 20 Dark Goo!');
    
    // ⭐ RƠI 10 THUỐC
    for (let i = 0; i < 10; i++) {
        droppedItems.push({
            x: boss.x + (Math.random() - 0.5) * 200,
            y: boss.y + (Math.random() - 0.5) * 200,
            item: { ...ITEMS.MIXED_POTION, count: 2 },
            lifetime: 1200,
            bob: 0,
            bobSpeed: 0.1 + Math.random() * 0.1
        });
    }
    console.log('⚗️ Rơi 10 Thuốc!');
    
    // ⭐ RƠI 15 BOM
    for (let i = 0; i < 5; i++) {
        droppedItems.push({
            x: boss.x + (Math.random() - 0.5) * 200,
            y: boss.y + (Math.random() - 0.5) * 200,
            item: { ...ITEMS.BOMB, count: 2 },
            lifetime: 1200,
            bob: 0,
            bobSpeed: 0.1 + Math.random() * 0.1
        });
    }
    console.log('💣 Rơi 15 Bom!');
    
    // ⭐ RƠI 30 VỤN SẮT
    for (let i = 0; i < 12; i++) {
        droppedItems.push({
            x: boss.x + (Math.random() - 0.5) * 200,
            y: boss.y + (Math.random() - 0.5) * 200,
            item: { ...ITEMS.IRON_SCRAP, count: 3 },
            lifetime: 1200,
            bob: 0,
            bobSpeed: 0.1 + Math.random() * 0.1
        });
    }
    console.log('⚙️ Rơi 30 Vụn sắt!');
    
    // ⭐ RƠI 25 CHẤT NHỜN
    for (let i = 0; i < 18; i++) {
        droppedItems.push({
            x: boss.x + (Math.random() - 0.5) * 200,
            y: boss.y + (Math.random() - 0.5) * 200,
            item: { ...ITEMS.SLIME_GOO, count: 2 },
            lifetime: 1200,
            bob: 0,
            bobSpeed: 0.1 + Math.random() * 0.1
        });
    }
    console.log('🟢 Rơi 25 Chất nhờn!');
    
    // ⭐ RƠI VŨ KHÍ RANDOM (5 cái)
    const rareWeapons = [ITEMS.AWP, ITEMS.BARRET, ITEMS.SHOTGUN];
    for (let i = 0; i < 5; i++) {
        const weapon = rareWeapons[Math.floor(Math.random() * rareWeapons.length)];
        droppedItems.push({
            x: boss.x + (Math.random() - 0.5) * 200,
            y: boss.y + (Math.random() - 0.5) * 200,
            item: { ...weapon, count: 1 },
            lifetime: 1200,
            bob: 0,
            bobSpeed: 0.1 + Math.random() * 0.1
        });
    }
    console.log('🔫 Rơi 5 vũ khí rare!');
    
    // Xóa boss + đạn
    boss = null;
    bossBullets.length = 0;
    
    if (typeof showNotification === 'function') {
        showNotification('🎉 BẠN ĐÃ HẠ GỤC BOSS!');
    }
    
    setTimeout(function() {
        bossSpawned = false;
        killCount = 0;
        console.log('🔄 Reset boss');
    }, 10000);
}

console.log('👹 gameboss.js sẵn sàng!');