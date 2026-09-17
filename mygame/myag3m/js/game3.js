// ============================================================
// QUÁI VẬT - game3.js
// ============================================================

const MONSTER_CONFIG = {
    MAX_MONSTERS: 15,
    SPAWN_INTERVAL: 180,
    BULLET_DAMAGE: 15
};

const MONSTER_TYPES = {
    SLIME_RED: {
        name: 'Slime đỏ',
        color: '#FF0000FF',
        sprite: 'slime_red',
        size: 40,
        hp: 120,
        speed: 1.2,
        damage: 30,
        score: 10,
        exp: 10
    },
    SLIME_GREEN: {
        name: 'Slime xanh',
        color: '#4ade80',
        sprite: 'slime_green',
        size: 40,
        hp: 140,
        speed: 1.4,
        damage: 28,
        score: 15,
        exp: 15
    },
    SLIME_YELLOW: {
        name: 'Slime vàng',
        color: '#fbbf24',
        sprite: 'slime_yellow',
        size: 40,
        hp: 120,
        speed: 1.6,
        damage: 25,
        score: 20,
        exp: 20
    },
    SLIME_CYAN: {
        name: 'Slime xanh dương',
        color: '#22d3ee',
        sprite: 'slime_cyan',
        size: 40,
        hp: 160,
        speed: 1.8,
        damage: 32,
        score: 25,
        exp: 25
    },
    SLIME_BLACK: {
        name: 'Slime đen',
        color: '#1a1a1a',
        sprite: 'slime_black',
        size: 50,          // ⭐ TO HƠN
        // ⚠️ v2 SỬA: bản gốc để hp: 10 (comment ghi "MÁU CAO") và speed: 16
        //    trong khi player chỉ có speed 4 -> không thể né + damage elite
        //    = 40% maxHP + 80 ≈ 160/201 HP = gần như one-shot.
        //    Đã chỉnh thành elite cân bằng. Muốn quay lại bản cũ thì đổi về
        //    hp: 10, speed: 16, damage: 80.
        hp: 50,
        speed: 12.0,
        damage: 50,
        score: 100,
        exp: 100,
        isElite: true      // ⭐ ĐÁNH DẤU ELITE
    },

    // ========================================================
    // 🏜️ QUÁI RIÊNG CỦA SA MẠC (map 2)
    // Dùng lại sprite slime nhưng nhuộm màu -> nhìn như quái mới
    // ========================================================
    SAND_SCORPION: {
        name: 'Bọ cát',
        color: '#c8862a',
        sprite: 'slime_yellow',
        tint: '#d99a3c',
        size: 44,
        hp: 230,
        speed: 2.2,
        damage: 34,
        score: 40,
        exp: 40
    },
    MUMMY_GUARD: {
        name: 'Xác ướp',
        color: '#d8cfa8',
        sprite: 'slime_black',
        tint: '#cbbf95',
        size: 54,
        hp: 420,
        speed: 1.15,
        damage: 52,
        score: 75,
        exp: 75
    },

    // ========================================================
    // 🏜️ QUÁI MỚI RIÊNG CỦA SA MẠC (Map 2 Extended)
    // ========================================================
    SAND_WORM: {
        name: 'Giun cát',
        color: '#c19a6b',
        sprite: 'slime_yellow',
        tint: '#b8860b',
        size: 60,
        hp: 600,
        speed: 0.8,
        damage: 60,
        score: 120,
        exp: 120,
        isElite: true
    },
    DESERT_BANDIT: {
        name: 'Cướp sa mạc',
        color: '#a0522d',
        sprite: 'slime_red',
        tint: '#8b4513',
        size: 42,
        hp: 280,
        speed: 2.8,
        damage: 38,
        score: 55,
        exp: 55
    },
    CACTUS_GOLEM: {
        name: 'Golem xương rồng',
        color: '#2d7d2d',
        sprite: 'slime_green',
        tint: '#1a5a1a',
        size: 68,
        hp: 800,
        speed: 0.7,
        damage: 70,
        score: 180,
        exp: 180,
        isElite: true
    },
    SAND_ELEMENTAL: {
        name: 'Thần cát',
        color: '#f4d59e',
        sprite: 'slime_cyan',
        tint: '#e8c47a',
        size: 50,
        hp: 350,
        speed: 2.5,
        damage: 45,
        score: 90,
        exp: 90
    },
    SCORPION_KING: {
        name: 'Vua bọ cạp',
        color: '#8b0000',
        sprite: 'slime_black',
        tint: '#5a0000',
        size: 70,
        hp: 1200,
        speed: 1.5,
        damage: 85,
        score: 300,
        exp: 300,
        isElite: true
    }
};

let monsters = [];
let spawnTimer = 0;

// ============================================================
// ⭐ CẤU HÌNH SPAWN THEO TỪNG MAP
// ============================================================
function getSpawnConfig() {
    if (typeof MAP !== 'undefined' && MAP.spawn) return MAP.spawn;
    return {
        maxMonsters: MONSTER_CONFIG.MAX_MONSTERS,
        interval: MONSTER_CONFIG.SPAWN_INTERVAL,
        table: Object.keys(MONSTER_TYPES)
    };
}

function spawnMonster() {
    // ⭐ CHƯA KÍCH HOẠT SPAWN → KHÔNG SPAWN
    if (!spawnActive) return;
    if (typeof player === 'undefined') return;
    if (typeof MAP === 'undefined') return;

    const sc = getSpawnConfig();
    if (monsters.length >= sc.maxMonsters) return;

    // ⭐ Bảng quái riêng của từng map
    const table = (sc.table && sc.table.length) ? sc.table : Object.keys(MONSTER_TYPES);
    const key = table[Math.floor(Math.random() * table.length)];
    const type = MONSTER_TYPES[key];
    if (!type) return;
    
    let sx = 0, sy = 0, found = false;
    for (let i = 0; i < 50 && !found; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 200 + Math.random() * 400;
        sx = player.x + Math.cos(angle) * distance;
        sy = player.y + Math.sin(angle) * distance;
        sx = Math.max(40, Math.min(MAP.getWidth() - 40, sx));
        sy = Math.max(40, Math.min(MAP.getHeight() - 40, sy));
        if (MAP.isWalkable(sx, sy)) found = true;
    }
    
    monsters.push({
        x: sx, y: sy,
        size: type.size,
        type: type,
        hp: type.hp,
        maxHp: type.hp,
        speed: type.speed + (Math.random() - 0.5) * 0.3,
        damage: type.damage,
        score: type.score,
        color: type.color,
        name: type.name,
        isElite: type.isElite || false,  // ⭐ ELITE
        hitCooldown: 0,
        knockbackX: 0,
        knockbackY: 0
    });
}

function updateMonsters() {
    if (typeof player === 'undefined') return;
    
    spawnTimer++;
    if (spawnTimer >= getSpawnConfig().interval) {
        spawnTimer = 0;
        spawnMonster();
    }
    
    for (let i = monsters.length - 1; i >= 0; i--) {
        const m = monsters[i];
        
        if (m.hitCooldown > 0) m.hitCooldown--;
        
        // Knockback
        if (m.knockbackX || m.knockbackY) {
            const half = m.size / 2;
            const nx = m.x + m.knockbackX;
            const ny = m.y + m.knockbackY;
            if (MAP.isWalkable(nx, m.y)) m.x = nx;
            if (MAP.isWalkable(m.x, ny)) m.y = ny;
            m.knockbackX *= 0.7;
            m.knockbackY *= 0.7;
            if (Math.abs(m.knockbackX) < 0.2) m.knockbackX = 0;
            if (Math.abs(m.knockbackY) < 0.2) m.knockbackY = 0;
        }
        
        // Di chuyển về player
        const dx = player.x - m.x;
        const dy = player.y - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 10) {
            const mx = (dx / dist) * m.speed;
            const my = (dy / dist) * m.speed;
            const half = m.size / 2;
            if (MAP.isWalkable(m.x + mx + half, m.y) && MAP.isWalkable(m.x + mx - half, m.y)) m.x += mx;
            if (MAP.isWalkable(m.x, m.y + my + half) && MAP.isWalkable(m.x, m.y + my - half)) m.y += my;
        }
        
        // Va chạm với player
const playerDist = Math.sqrt((player.x - m.x) ** 2 + (player.y - m.y) ** 2);
if (playerDist < (player.size / 2 + m.size / 2) && m.hitCooldown === 0) {
    // ⭐ TÍNH DAMAGE THEO % MAX HP
    let damage = m.damage;
    
    if (m.type && m.type.isElite) {
        // Elite: 40% Max HP + nền
        damage = calculateDamage(m.damage, 0.4);
    } else if (m.type && m.type.percentDamage) {
        // Quái có % damage
        damage = calculateDamage(m.damage, m.type.percentDamage);
    }
    
    player.hp = Math.max(0, player.hp - damage);
    m.hitCooldown = 60;
    
    // ⭐ JUMPSCARE EFFECT
    if (m.type && m.type.isJumpscare) {
        if (typeof triggerShake === 'function') triggerShake(15, 20);
        if (typeof triggerFlash === 'function') triggerFlash(0.5);
        console.log('💀 JUMPSCARE! Mất ' + damage + ' HP!');
    }
    
    UI.update();
}
        
        // Kiểm tra đạn trúng quái (có xuyên thấu)
for (let j = bullets.length - 1; j >= 0; j--) {
    const b = bullets[j];
    const bd = Math.sqrt((b.x - m.x) ** 2 + (b.y - m.y) ** 2);
    
    if (bd < (m.size / 2 + b.radius)) {
        // Kiểm tra đạn đã trúng quái này chưa
        if (b.hitMonsters && b.hitMonsters.includes(m)) continue;
        
        // Gây sát thương
        m.hp -= (b.damage || MONSTER_CONFIG.BULLET_DAMAGE);
        
        // Đánh dấu đã trúng
        if (!b.hitMonsters) b.hitMonsters = [];
        b.hitMonsters.push(m);
        
        // Knockback
        const angle = Math.atan2(m.y - player.y, m.x - player.x);
        const force = b.isSniper ? 8 : 4;
        m.knockbackX = Math.cos(angle) * force;
        m.knockbackY = Math.sin(angle) * force;
        
        // Quái chết
if (m.hp <= 0) {
    player.coins += m.score;
    
    // ⭐ EXP theo loại quái
    let expAmount = m.type && m.type.exp ? m.type.exp : 10;
    
    if (typeof player.addExp === 'function') player.addExp(expAmount);
    
    UI.update();
    
    if (typeof onMonsterKilled === 'function') onMonsterKilled();
    if (typeof dropItemFromMonster === 'function') dropItemFromMonster(m);
    
    monsters.splice(i, 1);
    break;
}
        
        // XỬ LÝ XUYÊN THẤU
        if (b.pierce > 0) {
            b.pierce--;   // Giảm số lần xuyên
            console.log('🎯 Đạn xuyên! Còn', b.pierce, 'lần');
            // Không xóa đạn → tiếp tục bay
        } else {
            bullets.splice(j, 1);  // Hết xuyên → xóa đạn
        }
        
        break;  // Thoát vòng lặp quái (tránh trúng nhiều quái cùng frame)
    }
}
    }
}

// ============================================================
// ⭐ NHUỘM MÀU SPRITE (quái sa mạc dùng lại sprite slime)
// ============================================================
const tintedSpriteCache = {};

function getTintedSprite(sprite, tint) {
    const key = sprite.src + '|' + tint;
    if (tintedSpriteCache[key]) return tintedSpriteCache[key];

    const cv = document.createElement('canvas');
    cv.width = sprite.naturalWidth;
    cv.height = sprite.naturalHeight;
    const g = cv.getContext('2d');

    g.drawImage(sprite, 0, 0);
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = tint;
    g.fillRect(0, 0, cv.width, cv.height);
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(sprite, 0, 0);

    tintedSpriteCache[key] = cv;
    return cv;
}

function spriteReady(s) {
    if (!s) return false;
    if (s.complete === undefined) return s.width > 0;
    return s.complete && s.naturalWidth > 0;
}

function getMonsterSprite(m) {
    if (!m.type || !m.type.sprite) return null;
    const base = monsterSprites[m.type.sprite];
    if (!spriteReady(base)) return null;
    if (m.type.tint) return getTintedSprite(base, m.type.tint);
    return base;
}

function drawMonsters() {
    for (let m of monsters) {
        const screen = Camera.toScreen(m.x, m.y);
        const half = m.size / 2;
        
        // Bóng
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(screen.x, screen.y + half + 2, half * 0.9, half * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // ⭐ VẼ SPRITE NẾU CÓ (tự nhuộm màu nếu quái có `tint`)
        const sprite = getMonsterSprite(m);

        if (sprite) {
            ctx.drawImage(
                sprite,
                screen.x - half,
                screen.y - half,
                m.size,
                m.size
            );
        } else {
            // Fallback: hình tròn
            ctx.fillStyle = m.color;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, half, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // ⭐ VIỀN ĐỎ CHO ELITE
        if (m.isElite) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, half + 3, 0, Math.PI * 2);
            ctx.stroke();
            
            // Hào quang đỏ
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, half + 8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Thanh máu
        const barWidth = m.size * 1.2;
        const hpPercent = m.hp / m.maxHp;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(screen.x - barWidth/2, screen.y - half - 15, barWidth, 5);
        ctx.fillStyle = hpPercent > 0.5 ? '#4ade80' : hpPercent > 0.25 ? '#fbbf24' : '#f87171';
        ctx.fillRect(screen.x - barWidth/2, screen.y - half - 15, barWidth * hpPercent, 5);
    }
}
// ============================================================
// RƠI ITEM KHI QUÁI CHẾT
// ============================================================
function dropItemFromMonster(monster) {
    if (typeof ITEMS === 'undefined') return;
    if (typeof droppedItems === 'undefined') return;
    
    const drops = [];
    const isElite = monster.type && monster.type.isElite;
    const name = monster.name;
    
    // ⭐ ELITE RƠI CHẤT NHỜN ĐEN (8%)
    if (isElite) {
        if (Math.random() < 0.088) {
            drops.push({ 
                item: ITEMS.DARK_GOO, 
                count: 1 + Math.floor(Math.random() * 2)
            });
            console.log('⚫ Rơi Chất nhờn đen!');
        }
        // Elite cũng rơi Btoken (30%)
        if (Math.random() < 0.66) {
            drops.push({ item: ITEMS.BTOKEN, count: 1 });
        }
    }
    
    // ========================================================
    // RƠI THEO LOẠI SLIME
    // ========================================================
    
    if (name === 'Slime đỏ') {
        // 70% chất nhờn thường
        if (Math.random() < 0.7) {
            drops.push({ item: ITEMS.SLIME_GOO, count: 1 + Math.floor(Math.random() * 2) });
        }
        // 15% thuốc
        if (Math.random() < 0.15) {
            drops.push({ item: ITEMS.MIXED_POTION, count: 1 });
        }
    }
    else if (name === 'Slime xanh') {
        // 60% chất nhờn
        if (Math.random() < 0.6) {
            drops.push({ item: ITEMS.SLIME_GOO, count: 1 + Math.floor(Math.random() * 2) });
        }
        // 30% vụn sắt
        if (Math.random() < 0.3) {
            drops.push({ item: ITEMS.IRON_SCRAP, count: 1 });
        }
        // 15% thuốc
        if (Math.random() < 0.15) {
            drops.push({ item: ITEMS.MIXED_POTION, count: 1 });
        }
    }
    else if (name === 'Slime vàng') {
        // 50% chất nhờn
        if (Math.random() < 0.5) {
            drops.push({ item: ITEMS.SLIME_GOO, count: 1 });
        }
        // 40% vụn sắt
        if (Math.random() < 0.4) {
            drops.push({ item: ITEMS.IRON_SCRAP, count: 1 + Math.floor(Math.random() * 2) });
        }
        // 20% thuốc
        if (Math.random() < 0.2) {
            drops.push({ item: ITEMS.MIXED_POTION, count: 1 });
        }
        // 10% bom
        if (Math.random() < 0.1) {
            drops.push({ item: ITEMS.BOMB, count: 1 });
        }
    }
    else if (name === 'Slime xanh dương') {
        // 40% chất nhờn
        if (Math.random() < 0.4) {
            drops.push({ item: ITEMS.SLIME_GOO, count: 1 });
        }
        // 50% vụn sắt
        if (Math.random() < 0.5) {
            drops.push({ item: ITEMS.IRON_SCRAP, count: 1 + Math.floor(Math.random() * 2) });
        }
        // 25% thuốc
        if (Math.random() < 0.25) {
            drops.push({ item: ITEMS.MIXED_POTION, count: 1 });
        }
        // 20% bom
        if (Math.random() < 0.2) {
            drops.push({ item: ITEMS.BOMB, count: 1 });
        }
    }
    else if (name === 'Slime đen') {
        // Elite rơi nhiều
        // 100% vụn sắt x3
        drops.push({ item: ITEMS.IRON_SCRAP, count: 3 + Math.floor(Math.random() * 3) });
        // 50% thuốc
        if (Math.random() < 0.5) {
            drops.push({ item: ITEMS.MIXED_POTION, count: 1 + Math.floor(Math.random() * 2) });
        }
        // 40% bom
        if (Math.random() < 0.4) {
            drops.push({ item: ITEMS.BOMB, count: 1 + Math.floor(Math.random() * 2) });
        }
    }
    // 🏜️ QUÁI SA MẠC
    else if (name === 'Bọ cát') {
        if (Math.random() < 0.55) {
            drops.push({ item: ITEMS.IRON_SCRAP, count: 1 + Math.floor(Math.random() * 2) });
        }
        if (Math.random() < 0.22) {
            drops.push({ item: ITEMS.MIXED_POTION, count: 1 });
        }
        if (Math.random() < 0.12) {
            drops.push({ item: ITEMS.BTOKEN, count: 1 });
        }
    }
    else if (name === 'Xác ướp') {
        drops.push({ item: ITEMS.IRON_SCRAP, count: 2 + Math.floor(Math.random() * 3) });
        if (Math.random() < 0.35) {
            drops.push({ item: ITEMS.MIXED_POTION, count: 1 + Math.floor(Math.random() * 2) });
        }
        if (Math.random() < 0.18) {
            drops.push({ item: ITEMS.BTOKEN, count: 1 });
        }
        if (Math.random() < 0.08) {
            drops.push({ item: ITEMS.DARK_GOO, count: 1 });
        }
    }
    // 🏜️ QUÁI MỚI SA MẠC
    else if (name === 'Giun cát') {
        drops.push({ item: ITEMS.IRON_SCRAP, count: 4 + Math.floor(Math.random() * 4) });
        if (Math.random() < 0.4) {
            drops.push({ item: ITEMS.MIXED_POTION, count: 2 });
        }
        if (Math.random() < 0.25) {
            drops.push({ item: ITEMS.BTOKEN, count: 1 });
        }
        if (Math.random() < 0.15) {
            drops.push({ item: ITEMS.DARK_GOO, count: 1 });
        }
        if (Math.random() < 0.1) {
            drops.push({ item: ITEMS.SAND_ESSENCE, count: 1 });
        }
    }
    else if (name === 'Cướp sa mạc') {
        if (Math.random() < 0.6) {
            drops.push({ item: ITEMS.IRON_SCRAP, count: 1 + Math.floor(Math.random() * 2) });
        }
        if (Math.random() < 0.3) {
            drops.push({ item: ITEMS.MIXED_POTION, count: 1 });
        }
        if (Math.random() < 0.2) {
            drops.push({ item: ITEMS.BTOKEN, count: 1 });
        }
        if (Math.random() < 0.1) {
            drops.push({ item: ITEMS.COIN, count: 50 + Math.floor(Math.random() * 100) });
        }
    }
    else if (name === 'Golem xương rồng') {
        drops.push({ item: ITEMS.IRON_SCRAP, count: 6 + Math.floor(Math.random() * 4) });
        if (Math.random() < 0.5) {
            drops.push({ item: ITEMS.MIXED_POTION, count: 3 });
        }
        if (Math.random() < 0.3) {
            drops.push({ item: ITEMS.BTOKEN, count: 2 });
        }
        if (Math.random() < 0.2) {
            drops.push({ item: ITEMS.DARK_GOO, count: 1 });
        }
        if (Math.random() < 0.15) {
            drops.push({ item: ITEMS.CACTUS_CORE, count: 1 });
        }
    }
    else if (name === 'Thần cát') {
        if (Math.random() < 0.5) {
            drops.push({ item: ITEMS.SLIME_GOO, count: 2 });
        }
        if (Math.random() < 0.4) {
            drops.push({ item: ITEMS.IRON_SCRAP, count: 2 + Math.floor(Math.random() * 2) });
        }
        if (Math.random() < 0.25) {
            drops.push({ item: ITEMS.BTOKEN, count: 1 });
        }
        if (Math.random() < 0.2) {
            drops.push({ item: ITEMS.SAND_ESSENCE, count: 1 });
        }
    }
    else if (name === 'Vua bọ cạp') {
        drops.push({ item: ITEMS.IRON_SCRAP, count: 8 + Math.floor(Math.random() * 4) });
        drops.push({ item: ITEMS.MIXED_POTION, count: 4 });
        if (Math.random() < 0.5) {
            drops.push({ item: ITEMS.BTOKEN, count: 3 });
        }
        if (Math.random() < 0.3) {
            drops.push({ item: ITEMS.DARK_GOO, count: 2 });
        }
        if (Math.random() < 0.25) {
            drops.push({ item: ITEMS.SCORPION_STINGER, count: 1 });
        }
    }
    
    // Tạo vật phẩm rơi
    for (let d of drops) {
        droppedItems.push({
            x: monster.x + (Math.random() - 0.5) * 30,
            y: monster.y + (Math.random() - 0.5) * 30,
            item: { ...d.item, count: d.count },
            lifetime: 600,
            bob: 0,
            bobSpeed: 0.1
        });
    }
}

console.log('👾 game3.js sẵn sàng! (Có drop item theo loại quái)');
console.log('👾 game3.js sẵn sàng!');