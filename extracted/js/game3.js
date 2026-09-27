// ============================================================
// QUÁI VẬT - game3.js
// ============================================================
// ============================================================
// 🏜️ LOAD SPRITE SA MẠC
// ============================================================
const desertMonsterSprites = {
    scorpion: new Image(),
    snake: new Image(),
    sandworm: new Image(),
    mummy: new Image(),
    cactus: new Image()
};

desertMonsterSprites.scorpion.src = 'assets/sprites/monsters/desert_scorpion.png';
desertMonsterSprites.snake.src = 'assets/sprites/monsters/desert_snake.png';
desertMonsterSprites.sandworm.src = 'assets/sprites/monsters/desert_sandworm.png';
desertMonsterSprites.mummy.src = 'assets/sprites/monsters/desert_mummy.gif';
desertMonsterSprites.cactus.src = 'assets/sprites/monsters/desert_cactus.png';

// Load GIF Xác Ướp
window.addEventListener('load', function() {
    setTimeout(function() {
        loadGif('assets/sprites/monsters/desert_mummy.gif', 'mummy_gif');
    }, 500);
});
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
        speed: 8.0,
        damage: 50,
        score: 100,
        exp: 100,
        isElite: true      // ⭐ ĐÁNH DẤU ELITE
    },

    // ========================================================
    // 🏜️ QUÁI RIÊNG CỦA SA MẠC (map 2)
    // Dùng lại sprite slime nhưng nhuộm màu -> nhìn như quái mới
    // ========================================================
    
    MUMMY_GUARD: {
        name: 'Xác ướp',
        color: '#d8cfa8',
        sprite: 'slime_black',
        tint: '#cbbf95',
        size: 88,
        hp: 420,
        speed: 3,
        damage: 52,
        score: 75,
        exp: 75
    },
  BONE_DRAGON: {
        name: 'Xương Rồng',
        color: '#e8dcc8',
        sprite: 'slime_yellow', // fallback
        size: 120,               // ⭐ TĂNG SIZE (cũ 60)
        hp: 500,
        speed: 0,
        damage: 0,
        score: 80,
        exp: 60,
        isBoneDragon: true,
        tornadoTimer: 0,
        tornadoInterval: 180
    },
    SCORPION: {
        name: 'Bọ Cạp',
        color: '#5c3a21',
        sprite: 'slime_red',
        size: 99,               // ⭐ TĂNG SIZE (cũ 36)
        hp: 180,
        speed: 1.8,
        damage: 22,
        score: 35,
        exp: 35,
        isPoisonous: true
    },
    RATTLESNAKE: {
        name: 'Rắn Chuông',
        color: '#6b705c',
        sprite: 'slime_green',
        size: 179,               // ⭐ TĂNG SIZE (cũ 30)
        hp: 130,
        speed: 2.5,
        damage: 18,
        score: 30,
        exp: 30,
        isPoisonous: true
    },
    SAND_WORM_ELITE: {
        name: 'Giun Sa Mạc',
        color: '#8B4513',
        sprite: 'slime_black',
        size: 77,               // ⭐ BASE SIZE (dùng cho chiều cao/thân)
        hp: 900,
        speed: 1.2,             // ⭐ GIẢM TỐC ĐỘ (cũ 2.5)
        damage: 65,
        score: 220,
        exp: 180,
        isElite: true,
        isSandWorm: true
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
    
    // Hiện số máu bị trừ trên player
    if (typeof addDamageNumber === 'function') {
        addDamageNumber(player.x, player.y - player.size/2, damage, '#ff4444');
    }
    
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
        
        // ⭐ GIUN SA MẠC LẶN: BẤT TỬ KHI NGẦM CÁT
        if (m.type.isSandWorm && m.isSubmerged) {
            // Chỉ tạo hiệu ứng va chạm, không trừ máu
            if (typeof addDamageNumber === 'function') {
                addDamageNumber(m.x, m.y - m.size/2, 0, '#888888', true); // "MISS" hoặc "IMMUNE"
            }
            // Vẫn xử lý knockback nhẹ để có cảm giác va chạm
            const angle = Math.atan2(m.y - player.y, m.x - player.x);
            m.knockbackX = Math.cos(angle) * 1;
            m.knockbackY = Math.sin(angle) * 1;
            
            // Xử lý xuyên thấu
            if (b.pierce > 0) {
                b.pierce--;
            } else {
                bullets.splice(j, 1);
            }
            break;
        }
        
        // Gây sát thương
        const dmg = (b.damage || MONSTER_CONFIG.BULLET_DAMAGE);
        m.hp -= dmg;
        
        // Hiện số máu bị trừ
        if (typeof addDamageNumber === 'function') {
            addDamageNumber(m.x, m.y - m.size/2, dmg, '#ffdd44');
        }
        
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
    if (!m.type) return null;
    
    // ⭐ XỬ LÝ SPRITE SA MẠC
    if (m.type.isBoneDragon) return desertMonsterSprites.cactus;
    if (m.type.isSandWorm) return desertMonsterSprites.sandworm;
    if (m.type.name === 'Bọ Cạp' || m.type.sprite === 'slime_red' && m.type.tint === '#5c3a21') return desertMonsterSprites.scorpion;
    if (m.type.name === 'Rắn Chuông' || m.type.sprite === 'slime_green' && m.type.tint === '#6b705c') return desertMonsterSprites.snake;
    if (m.type.name === 'Xác ướp' || m.type.sprite === 'slime_black' && m.type.tint === '#cbbf95') {
        // Trả về null vì sẽ vẽ bằng GIF riêng
        return null;
    }
    
    // ⭐ QUÁI CŨ
    if (!m.type.sprite) return null;
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
    else if (name === 'Bọ Cạp') {
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
// ============================================================
// 🏜️ SA MẠC - QUÁI VẬT MỚI + CƠ CHẾ MÔI TRƯỜNG
// ============================================================

// ⭐ DEBUFF STATE CỦA PLAYER
if (typeof player !== 'undefined') {
    if (player.slowTimer === undefined) player.slowTimer = 0;
    if (player.poisonTimer === undefined) player.poisonTimer = 0;
}


// ============================================================
// 🌪️ HỆ THỐNG LỐC XOÁY CÁT
// ============================================================
let sandTornadoes = [];

function spawnTornadoes(boneDragon) {
    for (let i = 0; i < 2; i++) {
        sandTornadoes.push({
            x: boneDragon.x,
            y: boneDragon.y,
            originX: boneDragon.x,
            originY: boneDragon.y,
            radius: 18,
            angle: Math.random() * Math.PI * 2,
            spiralDist: 0,
            life: 360,
            speed: 1.8,
            hitCooldown: 0
        });
    }
    console.log('🌪️ Xương Rồng tạo 2 Lốc Xoáy Cát!');
}

function updateTornadoes() {
    if (typeof player === 'undefined') return;
    if (typeof MAP === 'undefined') return;

    for (let i = sandTornadoes.length - 1; i >= 0; i--) {
        let t = sandTornadoes[i];
        t.life--;
        if (t.hitCooldown > 0) t.hitCooldown--;

        if (t.life <= 0) {
            sandTornadoes.splice(i, 1);
            continue;
        }

        // ⭐ QUỸ ĐẠO SPIRAL XOẮN ỐC TỰ NHIÊN - XOAY CHẬM, MỞ RỘNG NHANH
        const goldenAngle = 2.39996323;
        t.angle += 0.04; // Xoay chậm (từ 0.12) - giống xoắn ốc thật
        t.spiralDist += 1.0; // Mở rộng nhanh theo bán kính (từ 0.7)
        
        // Bán kính mở rộng theo spiral logarit (xoắn ốc tự nhiên)
        const fibRadius = t.spiralDist * (1 + Math.sin(t.angle * 0.05) * 0.2);
        
        t.x = t.originX + Math.cos(t.angle * goldenAngle) * fibRadius;
        t.y = t.originY + Math.sin(t.angle * goldenAngle) * fibRadius;

        // Giới hạn trong map
        t.x = Math.max(20, Math.min(MAP.getWidth() - 20, t.x));
        t.y = Math.max(20, Math.min(MAP.getHeight() - 20, t.y));

        // ⭐ VA CHẠM VỚI PLAYER - HITBOX LỚN HƠN (radius + 15)
        const dx = player.x - t.x;
        const dy = player.y - t.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = t.radius + 15;

        if (dist < (player.size / 2 + hitRadius) && t.hitCooldown === 0) {
            player.hp = Math.max(0, player.hp - 18);
            t.hitCooldown = 60;

            // ⭐ DEBUFF LÀM CHẬM 60% (chỉ còn 40% tốc độ) - 4 GIÂY (240 frames)
            if (player.slowTimer < 240) {
                player.slowTimer = 240;
            }

            if (typeof UI !== 'undefined') UI.update();
            
            // Hiện số máu bị trừ
            if (typeof addDamageNumber === 'function') {
                addDamageNumber(player.x, player.y - player.size/2, 18, '#ff4444');
            }
        }
    }
}

function drawTornadoes() {
    if (typeof Camera === 'undefined' || typeof ctx === 'undefined' || typeof player === 'undefined') return;

    for (let t of sandTornadoes) {
        const screen = Camera.toScreen(t.x, t.y);
        const dx = player.x - t.x;
        
        ctx.save();
        ctx.translate(screen.x, screen.y);
        
        // ⭐ NHÓM 2: CHỈ LẬT NGANG THEO dx
        if (dx < 0) ctx.scale(-1, 1);
        
        ctx.rotate(Date.now() * 0.01);

        ctx.fillStyle = 'rgba(210, 180, 140, 0.7)';
        ctx.beginPath(); ctx.arc(0, 0, t.radius, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = 'rgba(139, 69, 19, 0.8)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, t.radius * 0.6, 0, Math.PI * 1.5); ctx.stroke();

        ctx.restore();
    }
}

// ============================================================
// ⚠️ GHI ĐÈ updateMonsters ĐỂ TÍCH HỢP LOGIC MỚI
// ============================================================
const _originalUpdateMonsters = updateMonsters;

window.updateMonsters = function() {
    if (typeof player === 'undefined') return;
    if (typeof MAP === 'undefined') return;

    // ⭐ ÁP DỤNG DEBUFF LÀM CHẬM
    let currentSpeedMultiplier = 1.0;
    if (player.slowTimer > 0) {
        player.slowTimer--;
        currentSpeedMultiplier = 0.4; // Chỉ còn 40% tốc độ (giảm 60%)
    }

    // ⭐ ÁP DỤNG DEBUFF TRÚNG ĐỘC
    if (player.poisonTimer > 0) {
        player.poisonTimer--;
        // Trừ 8 máu/giây -> 60fps => trừ mỗi 7.5 frames
        if (player.poisonTimer % 8 === 0) {
            player.hp = Math.max(0, player.hp - 8);
            if (typeof UI !== 'undefined') UI.update();
            // Hiện số máu bị độc
            if (typeof addDamageNumber === 'function') {
                addDamageNumber(player.x, player.y - player.size/2, 8, '#88ff88');
            }
        }
    }

    // Lưu speed gốc, áp dụng debuff
    const originalSpeed = player.speed;
    player.speed = originalSpeed * currentSpeedMultiplier;

    // Gọi logic cũ (spawn, di chuyển quái, va chạm, đạn trúng...)
    _originalUpdateMonsters();

    // Phục hồi speed gốc
    player.speed = originalSpeed;

    // ========================================================
    // LOGIC RIÊNG CHO QUÁI SA MẠC MỚI
    // ========================================================
    for (let i = monsters.length - 1; i >= 0; i--) {
        const m = monsters[i];
        if (!m.type) continue;

        const dx = player.x - m.x;
        const dy = player.y - m.y;
        const distToPlayer = Math.sqrt(dx * dx + dy * dy);
        const tileDist = distToPlayer / MAP_TILE; // Khoảng cách tính bằng ô

        // ⭐ XƯƠNG RỒNG: Tạo lốc xoáy mỗi 8 giây
        if (m.type.isBoneDragon) {
            m.type.tornadoTimer = (m.type.tornadoTimer || 0) + 1;
            if (m.type.tornadoTimer >= m.type.tornadoInterval) {
                m.type.tornadoTimer = 0;
                spawnTornadoes(m);
            }
            // Xương rồng đứng im, reset vị trí nếu bị knockback
            if (m.knockbackX || m.knockbackY) {
                m.knockbackX = 0;
                m.knockbackY = 0;
            }
        }

                // ⭐ GIUN SA MẠC ELITE: Cơ chế lặn/trồi theo khoảng cách 6 ô
        if (m.type.isSandWorm) {
            const tileDist = Math.sqrt(dx * dx + dy * dy) / MAP_TILE;
            
            if (tileDist > 2.5) {
                m.isSubmerged = true;
                // ⭐ DI CHUYỂN NGẦM: Dùng speed gốc (1.6), KHÔNH nhân x1.5 nữa
                if (Math.sqrt(dx*dx + dy*dy) > 10) {
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    m.x += (dx / dist) * m.speed;
                    m.y += (dy / dist) * m.speed;
                }
            } else {
                m.isSubmerged = false;
                // Trồi lên lao vào: Tăng tốc độ lúc tấn công (x1.8)
                if (Math.sqrt(dx*dx + dy*dy) > 10) {
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    m.x += (dx / dist) * m.speed * 1.8;
                    m.y += (dy / dist) * m.speed * 1.8;
                }
            }
        }
        // ⭐ BỌ CẠP & RẮN CHUÔNG: Gây độc khi cắn
        if (m.type.isPoisonous) {
            const hitDist = player.size / 2 + m.size / 2;
            if (distToPlayer < hitDist && m.hitCooldown === 0) {
                // Gây hiệu ứng trúng độc (5 giây = 300 frames)
                if (player.poisonTimer < 300) {
                    player.poisonTimer = 300;
                }
                m.hitCooldown = 60;
                console.log('☠️ Trúng độc từ ' + m.name + '!');
            }
        }
    }

    // Cập nhật lốc xoáy
    updateTornadoes();
};

// ============================================================
// ⚠️ GHI ĐÈ drawMonsters - TÍCH HỢP SPRITE MỚI + ĐỊNH HƯỚNG
// ============================================================



window.drawMonsters = function() {
    drawTornadoes();

    if (typeof Camera === 'undefined' || typeof ctx === 'undefined' || typeof player === 'undefined') return;

    for (let m of monsters) {
        if (!m.type) continue;
        
        const screen = Camera.toScreen(m.x, m.y);
        const half = m.size / 2;
        const dx = player.x - m.x;
        const dy = player.y - m.y;
        // ⭐ GÓC HUỐNG CHUẨN: atan2(dy, dx) -> 0 là sang PHẢI
        const angleToPlayer = Math.atan2(dy, dx);

        // Bóng chung
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(screen.x, screen.y + half + 2, half * 0.9, half * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // ========================================================
        // NHÓM 1: XOAY TỰ DO (Scorpion, Snake, Sand Worm trồi)
        // ⭐ SPRITE HƯỚNG MẶC ĐỊNH: XUỐNG (SOUTH / 90°) -> TRỪ PI/2
        // ========================================================
        const isGroup1 = m.type.name === 'Bọ Cạp' || m.type.name === 'Rắn Chuông' || (m.type.isSandWorm && !m.isSubmerged);
        
        if (isGroup1) {
            ctx.save();
            ctx.translate(screen.x, screen.y);
            // ⭐ SỬA LỆCH 90°: Sprite art hướng XUỐNG -> trừ PI/2
            ctx.rotate(angleToPlayer - Math.PI / 2);
            
            let sprite = null;
            if (m.type.name === 'Bọ Cạp') sprite = desertMonsterSprites.scorpion;
            else if (m.type.name === 'Rắn Chuông') sprite = desertMonsterSprites.snake;
            else if (m.type.isSandWorm) sprite = desertMonsterSprites.sandworm;
            
            if (sprite && spriteReady(sprite)) {
                // ⭐ GIUN SA MẠC: VẺ DÀI THEO TỈ LỆ (Rộng gấp 2 cao)
                if (m.type.isSandWorm) {
                    const w = m.size; // Chiều ngang = 80
                    const h = m.size *  2;     // Chiều cao = 40
                    ctx.drawImage(sprite, -w/2, -h/2, w, h);
                } else {
                    ctx.drawImage(sprite, -half, -half, m.size, m.size);
                }
            } else {
                ctx.fillStyle = m.color;
                ctx.beginPath();
                ctx.arc(0, 0, half, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
        // ========================================================
        // NHÓM 2: LẬT NGANG (Horizontal Flip) - Mummy, Cactus
        // ⭐ CHỈ LẬT THEO TRỤC X (dx). KHÔNG LẬT TRỤC Y (dy) để tránh ngửa người.
        // Sprite hướng PHẢI (RIGHT/0°) -> Player bên TRÁI (dx<0) -> Flip X (-1, 1)
        // ========================================================
        else if (m.type.name === 'Xác ướp' || m.type.isBoneDragon) {
            ctx.save();
            ctx.translate(screen.x, screen.y);
            
            // Chỉ flip ngang
            if (dx > 0) ctx.scale(-1, 1);
            
            if (m.type.name === 'Xác ướp') {
                const gifFrame = getGifFrame('mummy_gif', 16.67);
                if (gifFrame) {
                    ctx.drawImage(gifFrame, -half, -half, m.size, m.size);
                } else {
                    const fallbackSprite = desertMonsterSprites.mummy;
                    if (spriteReady(fallbackSprite)) ctx.drawImage(fallbackSprite, -half, -half, m.size, m.size);
                    else { ctx.fillStyle = m.color; ctx.fillRect(-half, -half, m.size, m.size); }
                }
            } else if (m.type.isBoneDragon) {
                const sprite = desertMonsterSprites.cactus;
                if (spriteReady(sprite)) ctx.drawImage(sprite, -half, -half, m.size, m.size);
                else { ctx.fillStyle = '#e8dcc8'; ctx.beginPath(); ctx.arc(0,0,half,0,Math.PI*2); ctx.fill(); ctx.fillText('💀',0,0); }
            }
            ctx.restore();
        }
        // ========================================================
        // NHÓM 3: GIUN SA MẠC LẶN (SUBMERGED) - Bóng mờ + hạt bắn lên
        // ========================================================
        else if (m.type.isSandWorm && m.isSubmerged) {
            // Bóng mờ dưới chân (không hòa vào cát)
            const shadowAlpha = 0.12 + Math.sin(Date.now() * 0.004) * 0.04;
            ctx.fillStyle = 'rgba(80, 60, 40, ' + shadowAlpha + ')'; // Màu đen mờ, không phải màu cát
            ctx.beginPath();
            ctx.ellipse(screen.x, screen.y + half * 0.4, half * 1.2, half * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Hạt bắn LÊN khi di chuyển - dùng world position
            if (!m._submergedPrevX) m._submergedPrevX = m.x;
            if (!m._submergedPrevY) m._submergedPrevY = m.y;
            
            const moved = Math.abs(m.x - m._submergedPrevX) > 0.5 || Math.abs(m.y - m._submergedPrevY) > 0.5;
            m._submergedPrevX = m.x;
            m._submergedPrevY = m.y;
            
            // Giới hạn tối đa 30 hạt
            if (!m.submergedParticles) m.submergedParticles = [];
            
            if (moved && m.submergedParticles.length < 30) {
                // Thêm 2 hạt bắn lên (giảm từ 3)
                for (let i = 0; i < 2; i++) {
                    const spawnX = m.x + (Math.random() - 0.5) * half * 1.3;
                    const spawnY = m.y - half * 0.5;
                    m.submergedParticles.push({
                        x: spawnX,
                        y: spawnY,
                        size: 3 + Math.random() * 4,
                        alpha: 0.7 + Math.random() * 0.2,
                        life: 25 + Math.random() * 15,
                        vx: (Math.random() - 0.5) * 2,
                        vy: -Math.random() * 3 - 1.5
                    });
                }
            }
            
            // Vẽ và cập nhật hạt bắn lên
            if (m.submergedParticles) {
                for (let i = m.submergedParticles.length - 1; i >= 0; i--) {
                    const p = m.submergedParticles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life--;
                    p.alpha *= 0.93;
                    p.vy += 0.08;
                    
                    // Convert to screen for drawing
                    const ps = Camera.toScreen(p.x, p.y);
                    
                    ctx.fillStyle = 'rgba(230, 200, 140, ' + p.alpha + ')';
                    ctx.beginPath();
                    ctx.arc(ps.x, ps.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    if (p.life <= 0 || p.alpha <= 0.03) {
                        m.submergedParticles.splice(i, 1);
                    }
                }
            }
        }
        // ========================================================
        // QUÁI CŨ (Slime)
        // ========================================================
        else {
            const sprite = getMonsterSprite(m);
            if (sprite) ctx.drawImage(sprite, screen.x - half, screen.y - half, m.size, m.size);
            else { ctx.fillStyle = m.color; ctx.beginPath(); ctx.arc(screen.x, screen.y, half, 0, Math.PI*2); ctx.fill(); }
        }

        // Viền Elite
        if (m.isElite) {
            ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(screen.x, screen.y, half + 3, 0, Math.PI*2); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,0,0,0.3)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(screen.x, screen.y, half + 8, 0, Math.PI*2); ctx.stroke();
        }
        
        // Thanh máu
        const barWidth = m.size * 1.2;
        const hpPercent = m.hp / m.maxHp;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(screen.x - barWidth/2, screen.y - half - 15, barWidth, 5);
        ctx.fillStyle = hpPercent > 0.5 ? '#4ade80' : hpPercent > 0.25 ? '#fbbf24' : '#f87171';
        ctx.fillRect(screen.x - barWidth/2, screen.y - half - 15, barWidth * hpPercent, 5);
    }
};
      
console.log('🏜️ Hệ thống quái Sa Mạc đã load xong!');
console.log('👾 game3.js sẵn sàng! (Có drop item theo loại quái)');
console.log('👾 game3.js sẵn sàng!');

// ============================================================
// 💥 HỆ THỐNG HIỂN THỊ SỐ MÁU BỊ TRỪ (DAMAGE NUMBERS)
// ============================================================
let damageNumbers = [];

function addDamageNumber(x, y, amount, color = '#ffdd44', isImmune = false) {
    damageNumbers.push({
        x: x + (Math.random() - 0.5) * 20, // Nhích ngẫu nhiên cho đẹp
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -2 - Math.random() * 2, // Bay lên
        life: 60,
        maxLife: 60,
        text: isImmune ? 'MISS' : amount.toString(),
        color: color,
        fontSize: isImmune ? 14 : 18 + Math.min(amount / 10, 12),
        alpha: 1,
        scale: 1.2
    });
}

function updateDamageNumbers() {
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const d = damageNumbers[i];
        d.x += d.vx;
        d.y += d.vy;
        d.life--;
        d.vy += 0.05; // Trọng lực
        d.alpha = d.life / d.maxLife;
        d.scale = 1 + (1 - d.alpha) * 0.5; // Phóng to rồi thu nhỏ
        
        if (d.life <= 0) {
            damageNumbers.splice(i, 1);
        }
    }
}

function drawDamageNumbers() {
    if (typeof Camera === 'undefined' || typeof ctx === 'undefined') return;
    
    for (const d of damageNumbers) {
        const screen = Camera.toScreen(d.x, d.y);
        ctx.save();
        ctx.translate(screen.x, screen.y);
        ctx.scale(d.scale, d.scale);
        ctx.globalAlpha = d.alpha;
        ctx.font = `bold ${d.fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Viền đen
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(d.text, 0, 0);
        
        // Text chính
        ctx.fillStyle = d.color;
        ctx.fillText(d.text, 0, 0);
        
        ctx.restore();
    }
}

// Export global
window.addDamageNumber = addDamageNumber;
window.updateDamageNumbers = updateDamageNumbers;
window.drawDamageNumbers = drawDamageNumbers;