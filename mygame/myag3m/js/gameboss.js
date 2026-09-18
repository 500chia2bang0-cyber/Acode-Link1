// ============================================================
// BOSS FIGHT - gameboss.js
// ============================================================
console.log('👹 Bắt đầu load gameboss.js...');

// ============================================================
// CẤU HÌNH
// ============================================================
const BOSS_CONFIG = {
    KILL_THRESHOLD: 1,
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
    
    // Khởi tạo phase system cho boss
    if (boss.phase === undefined) {
        boss.phase = 1;
        boss.phaseTimer = 0;
        boss.specialCooldown = 0;
        boss.summonCooldown = 0;
    }
    
    if (boss.hitCooldown > 0) boss.hitCooldown--;
    if (boss.bulletCooldown > 0) boss.bulletCooldown--;
    if (boss.specialCooldown > 0) boss.specialCooldown--;
    if (boss.summonCooldown > 0) boss.summonCooldown--;
    boss.phaseTimer++;
    
    // Kiểm tra phase transition dựa trên HP
    const hpPercent = boss.hp / boss.maxHp;
    if (hpPercent <= 0.3 && boss.phase < 3) {
        boss.phase = 3;
        triggerShake(20, 30);
        triggerFlash(0.6);
        if (typeof showNotification === 'function') {
            showNotification('👹 SA VƯƠNG: "CÁT SẼ NHỎM BẠN!"');
        }
        console.log('👹 Boss chuyển phase 3 - Cơn bão cát!');
    } else if (hpPercent <= 0.6 && boss.phase < 2) {
        boss.phase = 2;
        triggerShake(15, 20);
        triggerFlash(0.4);
        if (typeof showNotification === 'function') {
            showNotification('👹 SA VƯƠNG: "KHÔNG THỂ TRỐI THOÁT!"');
        }
        console.log('👹 Boss chuyển phase 2 - Triệu hồi tùy tùng!');
    }
    
    // Di chuyển về player (tốc độ tăng theo phase)
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    let currentSpeed = boss.speed;
    if (boss.phase === 2) currentSpeed *= 1.3;
    if (boss.phase === 3) currentSpeed *= 1.6;
    
    if (dist > 5) {
        const mx = (dx / dist) * currentSpeed;
        const my = (dy / dist) * currentSpeed;
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
        let damage = boss.damage;
        if (typeof calculateDamage === 'function') {
            damage = calculateDamage(boss.damage, 0.25);
        }
        // Phase 3: damage tăng
        if (boss.phase === 3) damage = Math.floor(damage * 1.5);
        player.hp = Math.max(0, player.hp - damage);
        boss.hitCooldown = 60;
        if (typeof UI !== 'undefined') UI.update();
    }
    
    // ===== PHASE 1: Bắn cung tròn cơ bản =====
    // ===== PHASE 2: Bắn xoáy + Triệu hồi quái =====
    // ===== PHASE 3: Bão cát + Bắn nỏ liên hồi =====
    
    if (boss.bulletCooldown === 0) {
        if (boss.phase === 1) {
            fireBossBullets(); // Bắn cung tròn 16 hướng
            boss.bulletCooldown = boss.cfg.BULLET_COOLDOWN || 90;
        } else if (boss.phase === 2) {
            fireBossSpiral(); // Bắn xoáy
            boss.bulletCooldown = 60;
            
            // Triệu hồi quái tùy tùng
            if (boss.summonCooldown <= 0 && typeof spawnMonster === 'function') {
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const sx = boss.x + Math.cos(angle) * 150;
                    const sy = boss.y + Math.sin(angle) * 150;
                    if (MAP.isWalkable(sx, sy) && typeof monsters !== 'undefined' && monsters.length < 25) {
                        const type = MONSTER_TYPES.SAND_SCORPION;
                        monsters.push({
                            x: sx, y: sy,
                            size: type.size,
                            type: type,
                            hp: type.hp,
                            maxHp: type.hp,
                            speed: type.speed,
                            damage: type.damage,
                            score: type.score,
                            color: type.color,
                            name: type.name,
                            isElite: false,
                            hitCooldown: 0,
                            knockbackX: 0,
                            knockbackY: 0,
                            isMinion: true
                        });
                    }
                }
                boss.summonCooldown = 300; // 5 giây
                if (typeof showNotification === 'function') {
                    showNotification('🦂 Bọ cát tiến gần!');
                }
            }
        } else if (boss.phase === 3) {
            fireBossSandStorm(); // Bão cát
            boss.bulletCooldown = 30; // Bắn nhanh hơn
            
            // Special: Bắn nỏ 3 đợt
            if (boss.specialCooldown <= 0) {
                fireBossBurst();
                boss.specialCooldown = 180; // 3 giây
            }
        }
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
                
                if (boss.hp <= 0) {
                    onBossKilled();
                    return;
                }
            }
        }
    }
}

// ============================================================
// BOSS PHASE 2: BẮN XOÁY
// ============================================================
function fireBossSpiral() {
    if (!boss) return;
    const cfg = boss.cfg || BOSS_CONFIG;
    const count = 24;
    const step = (2 * Math.PI) / count;
    
    boss.spiralOffset = (boss.spiralOffset || 0) + 0.5;
    
    for (let i = 0; i < count; i++) {
        const angle = i * step + boss.spiralOffset;
        bossBullets.push({
            x: boss.x,
            y: boss.y,
            vx: Math.cos(angle) * (cfg.BULLET_SPEED || 20) * 0.8,
            vy: Math.sin(angle) * (cfg.BULLET_SPEED || 20) * 0.8,
            radius: cfg.BULLET_RADIUS || 8,
            color: '#ff8800',
            life: 200,
            damage: cfg.BULLET_DAMAGE || 20,
            isSpiral: true
        });
    }
    console.log('💙 Boss bắn xoáy', count, 'hướng');
}

// ============================================================
// BOSS PHASE 3: BÃO CÁT
// ============================================================
function fireBossSandStorm() {
    if (!boss) return;
    const cfg = boss.cfg || BOSS_CONFIG;
    
    // Bắn 8 hướng chính + 8 hướng phụ
    for (let ring = 0; ring < 2; ring++) {
        const count = 8;
        const step = (2 * Math.PI) / count;
        const speed = (cfg.BULLET_SPEED || 20) * (ring === 0 ? 1.2 : 0.6);
        const offset = ring === 0 ? 0 : Math.PI / 8;
        
        for (let i = 0; i < count; i++) {
            const angle = i * step + offset + (Date.now() * 0.001);
            bossBullets.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: (cfg.BULLET_RADIUS || 8) + ring * 2,
                color: ring === 0 ? '#ffaa00' : '#ffcc44',
                life: 240,
                damage: (cfg.BULLET_DAMAGE || 20) + ring * 5,
                isSandStorm: true
            });
        }
    }
    console.log('💙 Boss bắn bão cát!');
}

// ============================================================
// BOSS PHASE 3 SPECIAL: BẮN NỎ LIÊN HỒI
// ============================================================
function fireBossBurst() {
    if (!boss) return;
    const cfg = boss.cfg || BOSS_CONFIG;
    
    // Bắn 3 đợt liên tiếp với delay
    for (let burst = 0; burst < 3; burst++) {
        setTimeout(() => {
            if (!boss) return; // Boss có thể đã chết
            const count = 16;
            const step = (2 * Math.PI) / count;
            boss.burstOffset = (boss.burstOffset || 0) + 0.4;
            
            for (let i = 0; i < count; i++) {
                const angle = i * step + boss.burstOffset;
                bossBullets.push({
                    x: boss.x,
                    y: boss.y,
                    vx: Math.cos(angle) * (cfg.BULLET_SPEED || 20) * 1.5,
                    vy: Math.sin(angle) * (cfg.BULLET_SPEED || 20) * 1.5,
                    radius: cfg.BULLET_RADIUS || 8,
                    color: '#ff3300',
                    life: 150,
                    damage: Math.floor((cfg.BULLET_DAMAGE || 20) * 1.5),
                    isBurst: true
                });
            }
            triggerShake(10, 10);
        }, burst * 200); // 200ms giữa các đợt
    }
    console.log('💙 Boss bắn nỏ liên hồi!');
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
    
    // Hào quang theo phase
    let glowColor, glowAlpha;
    if (boss.phase === 3) {
        glowColor = 'rgba(255, 50, 0, ' + (0.4 * (0.5 + Math.sin(Date.now() / 200) * 0.3)) + ')';
    } else if (boss.phase === 2) {
        glowColor = 'rgba(255, 136, 0, ' + (0.3 * (0.5 + Math.sin(Date.now() / 250) * 0.3)) + ')';
    } else {
        glowColor = 'rgba(255, 0, 0, ' + (0.2 * (0.5 + Math.sin(Date.now() / 300) * 0.3)) + ')';
    }
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, half + 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Thân boss - đổi màu theo phase
    let bodyColor = boss.color;
    if (boss.phase === 3) bodyColor = '#aa2200';
    else if (boss.phase === 2) bodyColor = '#cc5500';
    
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, half, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = boss.phase === 3 ? '#ff3300' : boss.phase === 2 ? '#ff8800' : '#ff0000';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Mắt - phát sáng theo phase
    const eyeColor = boss.phase === 3 ? '#ff0000' : boss.phase === 2 ? '#ff8800' : '#ff0000';
    ctx.fillStyle = eyeColor;
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
    
    // Hiệu ứng phase 3: bụi cát bay quanh boss
    if (boss.phase === 3) {
        for (let i = 0; i < 8; i++) {
            const angle = (Date.now() * 0.002 + i * 0.785) % (Math.PI * 2);
            const dist = half + 20 + Math.sin(Date.now() * 0.005 + i) * 10;
            const sx = screen.x + Math.cos(angle) * dist;
            const sy = screen.y + Math.sin(angle) * dist;
            const alpha = 0.3 + Math.sin(Date.now() * 0.01 + i) * 0.2;
            ctx.fillStyle = 'rgba(255, 200, 100, ' + alpha + ')';
            ctx.beginPath();
            ctx.arc(sx, sy, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Hiệu ứng phase 2: vòng xoáy
    if (boss.phase === 2) {
        for (let i = 0; i < 4; i++) {
            const angle = (Date.now() * 0.0015 + i * 1.57) % (Math.PI * 2);
            const dist = half + 15;
            const sx = screen.x + Math.cos(angle) * dist;
            const sy = screen.y + Math.sin(angle) * dist;
            ctx.fillStyle = 'rgba(255, 150, 50, 0.4)';
            ctx.beginPath();
            ctx.arc(sx, sy, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
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
    
    // Tên boss + Phase indicator
    const phaseText = boss.phase > 1 ? ' [PHASE ' + boss.phase + ']' : '';
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = boss.phase === 3 ? '#ff3300' : boss.phase === 2 ? '#ff8800' : '#ff0000';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.strokeText('👹 ' + boss.name + phaseText, screen.x, screen.y - half - 40);
    ctx.fillText('👹 ' + boss.name + phaseText, screen.x, screen.y - half - 40);
}

// ============================================================
// VẼ ĐẠN BOSS
// ============================================================
function drawBossBullets() {
    if (typeof Camera === 'undefined') return;
    if (typeof ctx === 'undefined') return;
    
    for (let b of bossBullets) {
        const screen = Camera.toScreen(b.x, b.y);
        
        // ===== SPIRAL BULLETS (Phase 2) =====
        if (b.isSpiral) {
            // Vòng xoáy màu cam
            const pulse = Math.sin(Date.now() * 0.01 + b.x * 0.1) * 0.3 + 0.7;
            ctx.fillStyle = 'rgba(255, 136, 0, ' + (0.4 * pulse) + ')';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, b.radius + 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Vòng tròn xoáy bên trong
            ctx.strokeStyle = 'rgba(255, 200, 50, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, b.radius - 2, 0, Math.PI * 2);
            ctx.stroke();
            continue;
        }
        
        // ===== SAND STORM BULLETS (Phase 3) =====
        if (b.isSandStorm) {
            // Hiệu ứng cát bay
            const sandPulse = Math.sin(Date.now() * 0.015 + b.y * 0.05) * 0.4 + 0.6;
            ctx.fillStyle = 'rgba(255, 170, 0, ' + (0.5 * sandPulse) + ')';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, b.radius + 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Lõi vàng
            const gradient = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, b.radius);
            gradient.addColorStop(0, '#fff8cc');
            gradient.addColorStop(0.5, '#ffaa00');
            gradient.addColorStop(1, '#cc6600');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Viền cam
            ctx.strokeStyle = 'rgba(255, 100, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, b.radius + 1, 0, Math.PI * 2);
            ctx.stroke();
            continue;
        }
        
        // ===== BURST BULLETS (Phase 3 Special) =====
        if (b.isBurst) {
            // Hiệu ứng nổ lửa
            const burstPulse = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
            ctx.fillStyle = 'rgba(255, 51, 0, ' + (0.6 * burstPulse) + ')';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, b.radius + 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Lõi đỏ sáng
            const burstGradient = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, b.radius);
            burstGradient.addColorStop(0, '#fff');
            burstGradient.addColorStop(0.3, '#ff6600');
            burstGradient.addColorStop(1, '#cc0000');
            ctx.fillStyle = burstGradient;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Viền trắng sáng
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, b.radius + 2, 0, Math.PI * 2);
            ctx.stroke();
            continue;
        }
        
        // ===== DEFAULT BULLETS (Phase 1 & Map 1 Boss) =====
        // Hào quang xanh
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
// BOSS CHẾT - RƠI NHIỀU ITEMS
// ============================================================
function onBossKilled() {
    console.log('🎉 BOSS CHẾT!');

    // ============================================================
    // 🟣 BOSS CHẾT → ORB DECADE XUẤT HIỆN (chỉ map 1)
    // ============================================================
    if (currentMap === 1 && typeof orbDecadeActive !== 'undefined') {
        orbDecadeActive = true;
        console.log('🟣 BOSS CHẾT → ORB DECADE XUẤT HIỆN!');
        if (typeof showNotification === 'function') {
            showNotification('🟣 Một Orb Decade bí ẩn đã xuất hiện giữa đấu trường!');
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
    console.log('💠 Rơi 5 Btoken!');
    
    // ⭐ RƠI DARK GOO (20% cơ hội)
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
    console.log('⚫ Rơi Dark Goo (20%)!');
    
    // ⭐ RƠI 10 THUỐC (mỗi cái 2 count = 20 tổng)
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
    console.log('⚗️ Rơi 10 Thuốc (x2 = 20)!');
    
    // ⭐ RƠI 5 BOM (mỗi cái 2 count = 10 tổng)
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
    console.log('💣 Rơi 5 Bom (x2 = 10)!');
    
    // ⭐ RƠI 12 VỤN SẮT (mỗi cái 3 count = 36 tổng)
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
    console.log('⚙️ Rơi 12 Vụn sắt (x3 = 36)!');
    
    // ⭐ RƠI 18 CHẤT NHỜN (mỗi cái 2 count = 36 tổng)
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
    console.log('🟢 Rơi 18 Chất nhờn (x2 = 36)!');
    
    // ============================================================
    // 🏜️ MAP 2 BOSS (SA VƯƠNG) - RƠI ĐỒ ĐẶC BIỆT
    // ============================================================
    if (currentMap === 2 && boss && boss.name === 'Sa Vương') {
        // Cuộn giấy cổ (100%)
        droppedItems.push({
            x: boss.x + (Math.random() - 0.5) * 100,
            y: boss.y + (Math.random() - 0.5) * 100,
            item: { ...ITEMS.ANCIENT_SCROLL, count: 1 },
            lifetime: 1800,
            bob: 0,
            bobSpeed: 0.1
        });
        console.log('📜 Rơi Cuộn giấy cổ!');
        
        // Đuôi bọ cạp (80%)
        if (Math.random() < 0.8) {
            droppedItems.push({
                x: boss.x + (Math.random() - 0.5) * 100,
                y: boss.y + (Math.random() - 0.5) * 100,
                item: { ...ITEMS.SCORPION_STINGER, count: 1 + Math.floor(Math.random() * 2) },
                lifetime: 1800,
                bob: 0,
                bobSpeed: 0.1
            });
            console.log('🦂 Rơi Đuôi bọ cạp!');
        }
        
        // Tinh tú cát (100% x5)
        for (let i = 0; i < 5; i++) {
            droppedItems.push({
                x: boss.x + (Math.random() - 0.5) * 100,
                y: boss.y + (Math.random() - 0.5) * 100,
                item: { ...ITEMS.SAND_ESSENCE, count: 2 },
                lifetime: 1800,
                bob: 0,
                bobSpeed: 0.1
            });
        }
        console.log('🏜️ Rơi Tinh tú cát x10!');
        
        // Tim xương rồng (40%)
        if (Math.random() < 0.4) {
            droppedItems.push({
                x: boss.x + (Math.random() - 0.5) * 100,
                y: boss.y + (Math.random() - 0.5) * 100,
                item: { ...ITEMS.CACTUS_CORE, count: 1 },
                lifetime: 1800,
                bob: 0,
                bobSpeed: 0.1
            });
            console.log('🌵 Rơi Tim xương rồng!');
        }
        
        // Liềm Sa Vương (10% - rất hiếm)
        if (Math.random() < 0.1) {
            droppedItems.push({
                x: boss.x,
                y: boss.y,
                item: { ...ITEMS.SA_VUONG_SCYTHE, count: 1 },
                lifetime: 3600,
                bob: 0,
                bobSpeed: 0.05
            });
            if (typeof showNotification === 'function') {
                showNotification('☠️ LIỆM SA VƯƠNG RỜI! §§§');
            }
            console.log('☠️ Rơi Liềm Sa Vương §§§!');
        }
        
        // Vũ khí rare sa mạc
        const desertWeapons = [ITEMS.SCIMITAR, ITEMS.SAND_BLASTER, ITEMS.CACTUS_SPEAR];
        for (let i = 0; i < 3; i++) {
            const weapon = desertWeapons[Math.floor(Math.random() * desertWeapons.length)];
            droppedItems.push({
                x: boss.x + (Math.random() - 0.5) * 150,
                y: boss.y + (Math.random() - 0.5) * 150,
                item: { ...weapon, count: 1 },
                lifetime: 1800,
                bob: 0,
                bobSpeed: 0.1
            });
        }
        console.log('🏜️ Rơi 3 vũ khí sa mạc!');
        
        // Btoken nhiều hơn
        for (let i = 0; i < 10; i++) {
            droppedItems.push({
                x: boss.x + (Math.random() - 0.5) * 150,
                y: boss.y + (Math.random() - 0.5) * 150,
                item: { ...ITEMS.BTOKEN, count: 1 },
                lifetime: 1800,
                bob: 0,
                bobSpeed: 0.1
            });
        }
        console.log('💠 Rơi 10 Btoken!');
    }
    
    // ⭐ RƠI VŨ KHÍ RANDOM (5 cái) - Map 1 boss
    if (currentMap === 1) {
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
    }
    
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