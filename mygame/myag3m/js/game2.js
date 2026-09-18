// ============================================================
// MAP + CAMERA + NPC + CHUYỂN MAP - game2.js   [v2]
// ============================================================
// v2: gom map thành registry MAPS[], mỗi map có dữ liệu / palette /
//     va chạm / spawn / NPC riêng. Hệ thống cũ (MAP.isWalkable,
//     MAP.getWidth...) vẫn giữ nguyên nên các file khác KHÔNG phải sửa.
// ============================================================
console.log('🌍 Bắt đầu load game2.js (v2)...');

const MAP_TILE = 40;
const MAP_COLS = 128;
const MAP_ROWS = 96;

// ============================================================
// TIỆN ÍCH
// ============================================================

// Random "giả" nhưng cố định theo (r, c) -> chi tiết vẽ không bị nhấp nháy
function tileNoise(r, c, seed) {
    let n = (r | 0) * 374761393 + (c | 0) * 668265263 + (seed | 0) * 1442695041;
    n = (n ^ (n >> 13)) * 1274126177;
    n = n ^ (n >> 16);
    return ((n >>> 0) % 100000) / 100000;
}

function inMap(c, r) {
    return c >= 0 && c < MAP_COLS && r >= 0 && r < MAP_ROWS;
}

// ============================================================
// FACTORY: gắn các phương thức dùng chung cho mọi map
// ============================================================
function attachMapMethods(m) {
    m.getWidth = function () { return this.cols * this.tileSize; };
    m.getHeight = function () { return this.rows * this.tileSize; };

    m.isWalkable = function (x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return true;
        return this.solid.indexOf(this.data[row][col]) === -1;
    };

    // Tô 1 ô
    m.setTile = function (c, r, t) {
        if (inMap(c, r)) this.data[r][c] = t;
    };

    // Đĩa tròn
    m.disc = function (cc, cr, radius, t, density) {
        const d = this.data;
        for (let r = cr - radius; r <= cr + radius; r++) {
            for (let c = cc - radius; c <= cc + radius; c++) {
                if (!inMap(c, r)) continue;
                if (Math.hypot(c - cc, r - cr) < radius) {
                    if (density === undefined || tileNoise(r, c, 5) < density) d[r][c] = t;
                }
            }
        }
    };

    // Rừng (map 1) - giữ nguyên hành vi bản gốc
    m.forest = function (cc, cr, radius) {
        const d = this.data;
        for (let r = cr - radius; r <= cr + radius; r++) {
            for (let c = cc - radius; c <= cc + radius; c++) {
                if (!inMap(c, r)) continue;
                if (Math.hypot(c - cc, r - cr) < radius && Math.random() > 0.3) d[r][c] = 4;
            }
        }
    };

    // Ốc đảo sa mạc: nước + vành chà là + cát ẩm
    m.oasis = function (cc, cr, radius) {
        const d = this.data;
        for (let r = cr - radius - 4; r <= cr + radius + 4; r++) {
            for (let c = cc - radius - 4; c <= cc + radius + 4; c++) {
                if (!inMap(c, r)) continue;
                const dist = Math.hypot(c - cc, r - cr);
                if (dist < radius) d[r][c] = 3;
                else if (dist < radius + 2.4 && tileNoise(r, c, 71) > 0.34) d[r][c] = 4;
                else if (dist < radius + 3.2) d[r][c] = 2;
            }
        }
    };

    // Dãy núi đá (solid)
    m.ridge = function (c1, r1, c2, r2, thick) {
        const d = this.data;
        const steps = Math.max(Math.abs(c2 - c1), Math.abs(r2 - r1)) * 3 + 1;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const cc = c1 + (c2 - c1) * t + (tileNoise(i, 1, 91) - 0.5) * 3.5;
            const rr = r1 + (r2 - r1) * t + (tileNoise(i, 2, 93) - 0.5) * 3.5;
            const rad = thick + tileNoise(i, 3, 95) * 1.8;
            for (let r = Math.floor(rr - rad); r <= Math.ceil(rr + rad); r++) {
                for (let c = Math.floor(cc - rad); c <= Math.ceil(cc + rad); c++) {
                    if (!inMap(c, r)) continue;
                    if (Math.hypot(c - cc, r - rr) <= rad) d[r][c] = 1;
                }
            }
        }
    };

    // Hành lang: dọn đá + di tích để luôn có đường đi
    m.corridor = function (c1, r1, c2, r2, half, clearTiles) {
        const d = this.data;
        const clear = clearTiles || [1, 5];
        const steps = Math.max(Math.abs(c2 - c1), Math.abs(r2 - r1)) * 3 + 1;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const cc = c1 + (c2 - c1) * t;
            const rr = r1 + (r2 - r1) * t;
            for (let r = Math.floor(rr - half); r <= Math.ceil(rr + half); r++) {
                for (let c = Math.floor(cc - half); c <= Math.ceil(cc + half); c++) {
                    if (!inMap(c, r)) continue;
                    if (Math.hypot(c - cc, r - rr) <= half && clear.indexOf(d[r][c]) !== -1) {
                        d[r][c] = 0;
                    }
                }
            }
        }
    };

    // Đấu trường: vòng tường + 4 cổng
    m.arena = function (cc, cr, radius, wallTile, floorTile) {
        const d = this.data;
        wallTile = wallTile || 1;
        for (let r = cr - radius - 2; r <= cr + radius + 2; r++) {
            for (let c = cc - radius - 2; c <= cc + radius + 2; c++) {
                if (!inMap(c, r)) continue;
                const dist = Math.hypot(c - cc, r - cr);
                if (dist > radius - 1 && dist < radius + 0.5) {
                    d[r][c] = wallTile;
                } else if (dist < radius - 1) {
                    if (floorTile !== undefined && tileNoise(r, c, 17) > 0.88) d[r][c] = floorTile;
                    else d[r][c] = 0;
                }
            }
        }
        const gates = [
            [cr + radius, cc], [cr - radius, cc],
            [cr, cc + radius], [cr, cc - radius]
        ];
        for (let g of gates) {
            for (let r = g[0] - 1; r <= g[0] + 1; r++) {
                for (let c = g[1] - 1; c <= g[1] + 1; c++) {
                    if (inMap(c, r)) d[r][c] = 0;
                }
            }
        }
    };

    // Tìm chỗ trống gần nhất (cứu hộ khi bị kẹt trong đá)
    m.findFreeSpot = function (x, y) {
        if (this.isWalkable(x, y)) return { x: x, y: y };
        const ts = this.tileSize;
        for (let ring = 1; ring <= 12; ring++) {
            for (let a = 0; a < 16; a++) {
                const ang = (a / 16) * Math.PI * 2;
                const nx = x + Math.cos(ang) * ring * ts;
                const ny = y + Math.sin(ang) * ring * ts;
                if (this.isWalkable(nx, ny)) return { x: nx, y: ny };
            }
        }
        return { x: x, y: y };
    };

    return m;
}

// ============================================================
// 🌱 MAP 1 — THẢO NGUYÊN (giữ nguyên layout bản gốc)
// ============================================================
const MAP1 = attachMapMethods({
    id: 1,
    name: 'Thảo Nguyên',
    banner: '🌱 THẢO NGUYÊN',
    bannerSub: 'Vùng đất khởi đầu',

    cols: MAP_COLS,
    rows: MAP_ROWS,
    tileSize: MAP_TILE,
    data: [],

    // Ô chặn đường. Map 1: CHỈ tường đấu trường (đúng như bản gốc)
    solid: [1],

    palette: {
        0: '#3a7a3a',
        1: '#6a6a6a',
        2: '#4a9a4a',
        3: '#2a7a9a',
        4: '#3a7a3a'
    },
    decor: 'grass',
    hasCanopy: true,
    canopyTile: 4,
    canopyStyle: 'tree',
    hasShadows: true,

    entryPoint: { x: 2560, y: 2300 },
    portal: null,
    spawnOnArrival: false,

    spawn: {
        maxMonsters: 15,
        interval: 180,
        table: ['SLIME_RED', 'SLIME_GREEN', 'SLIME_YELLOW', 'SLIME_CYAN', 'SLIME_BLACK']
    },

    // Boss mặc định (Demon Lord) -> dùng BOSS_CONFIG gốc
    bossConfig: null,
    bossSpawn: { x: 64 * 40, y: 48 * 40 },
    bossTrigger: { type: 'kills', count: 1 },

    npcs: [
        { x: 57 * 40, y: 41 * 40, size: 32, name: 'Thương nhân', color: '#ffd700', icon: '🧙', type: 'shop' },
        { x: 71 * 40, y: 41 * 40, size: 32, name: 'Thợ rèn', color: '#ff6600', icon: '⚒️', type: 'smith' }
    ],

    generate: function () {
        const d = this.data;
        for (let r = 0; r < this.rows; r++) {
            d[r] = [];
            for (let c = 0; c < this.cols; c++) {
                const rand = Math.random();
                if (rand < 0.60) d[r][c] = 0;
                else if (rand < 0.75) d[r][c] = 2;
                else if (rand < 0.88) d[r][c] = 3;
                else d[r][c] = 4;
            }
        }
        this.disc(30, 20, 8, 3);
        this.disc(80, 50, 10, 3);
        this.disc(100, 30, 6, 3);
        this.disc(20, 70, 7, 3);

        this.forest(50, 40, 12);
        this.forest(90, 70, 10);
        this.forest(10, 15, 8);

        this.arena(64, 48, 10);
    }
});

// ============================================================
// 🏜️ MAP 2 — SA MẠC SAHARA
// ============================================================
const MAP2 = attachMapMethods({
    id: 2,
    name: 'Sa Mạc Sahara',
    banner: '🏜️ SA MẠC SAHARA',
    bannerSub: 'Vùng đất của cát và di tích',

    cols: MAP_COLS,
    rows: MAP_ROWS,
    tileSize: MAP_TILE,
    data: [],

    // 1 = núi đá (chặn). Di tích (5) đi được.
    solid: [1],

    palette: {
        0: '#d8b56a',   // cát
        1: '#7d6a52',   // núi đá
        2: '#e8cc86',   // cát sáng (đỉnh cồn)
        3: '#2f9fbf',   // nước ốc đảo
        4: '#2f6b3a',   // chà là
        5: '#a89272',   // di tích đổ nát
        6: '#c19d55'    // cát tối (chân cồn)
    },
    decor: 'desert',
    hasCanopy: true,
    canopyTile: 4,
    canopyStyle: 'palm',
    hasShadows: true,

    entryPoint: { x: 480, y: 3200 },

    // 🌀 Cổng quay về map 1
    portal: {
        x: 640, y: 3200,
        targetMap: 1,
        targetName: 'Thảo Nguyên',
        label: '🌀 VỀ THẢO NGUYÊN',
        interactDistance: 110
    },

    spawnOnArrival: true,

    spawn: {
        maxMonsters: 22,
        interval: 130,
        table: ['SLIME_YELLOW', 'SLIME_RED', 'SAND_SCORPION', 'MUMMY_GUARD', 'SAND_WORM', 'DESERT_BANDIT', 'CACTUS_GOLEM', 'SAND_ELEMENTAL', 'SCORPION_KING', 'SLIME_BLACK']
    },

    // 👹 Boss riêng của sa mạc
    bossConfig: {
        BOSS_NAME: 'Sa Vương',
        BOSS_HP: 5200,
        BOSS_SIZE: 150,
        BOSS_SPEED: 1.55,
        BOSS_DAMAGE: 45,
        BOSS_SCORE: 1600,
        BOSS_COLOR: '#8a5a1e',
        BULLET_COLOR: '#ffb648',
        BULLET_COUNT: 20,
        BULLET_DAMAGE: 22,
        BULLET_COOLDOWN: 78,
        BULLET_SPEED: 16
    },
    bossSpawn: { x: 64 * 40, y: 48 * 40 },
    // Bước vào đấu trường di tích -> boss xuất hiện
    bossTrigger: { type: 'zone', x: 64 * 40, y: 48 * 40, radius: 430 },

    npcs: [
        { x: 20 * 40, y: 82 * 40, size: 32, name: 'Thương nhân sa mạc', color: '#ffaa00', icon: '🧙', type: 'shop' },
        { x: 108 * 40, y: 60 * 40, size: 32, name: 'Hướng dẫn viên', color: '#00ffaa', icon: '🧭', type: 'guide' }
    ],

    generate: function () {
        const d = this.data;
        const cols = this.cols, rows = this.rows;

        // ---- 1) NỀN: cát + cồn cát lượn sóng ----
        for (let r = 0; r < rows; r++) {
            d[r] = [];
            for (let c = 0; c < cols; c++) {
                const wave = Math.sin(c * 0.115) + Math.sin(r * 0.07 + 1.7) + Math.sin((r + c) * 0.045);
                let t;
                if (wave > 1.35) t = 2;          // đỉnh cồn
                else if (wave < -1.35) t = 6;    // chân cồn
                else t = 0;
                if (t === 0 && tileNoise(r, c, 21) < 0.10) t = 2;
                d[r][c] = t;
            }
        }

        // ---- 2) ỐC ĐẢO ----
        this.oasis(22, 24, 6);
        this.oasis(104, 62, 7);
        this.oasis(78, 84, 5);

        // ---- 3) NÚI ĐÁ CHẮN (solid) ----
        this.ridge(6, 40, 34, 30, 2.6);
        this.ridge(42, 12, 66, 26, 2.2);
        this.ridge(96, 16, 121, 40, 2.8);
        this.ridge(8, 72, 30, 90, 2.4);
        this.ridge(100, 76, 122, 88, 2.6);
        this.ridge(44, 66, 38, 92, 2.2);

        // ---- 4) DI TÍCH ĐỔ NÁT (đi được, chỉ để trang trí) ----
        for (let i = 0; i < 300; i++) {
            const c = Math.floor(tileNoise(i, 1, 31) * cols);
            const r = Math.floor(tileNoise(i, 2, 41) * rows);
            if (Math.hypot(c - 64, r - 48) < 15) continue;      // chừa đấu trường
            if (Math.hypot(c - 12, r - 80) < 9) continue;       // chừa chỗ spawn
            const w = 1 + Math.floor(tileNoise(i, 3, 51) * 3);
            const h = 1 + Math.floor(tileNoise(i, 4, 61) * 2);
            for (let rr = r; rr < r + h; rr++) {
                for (let cc = c; cc < c + w; cc++) {
                    if (inMap(cc, rr) && d[rr][cc] !== 3) d[rr][cc] = 5;
                }
            }
        }

        // ---- 5) HÀNH LANG: chỗ spawn -> đấu trường ----
        this.corridor(12, 80, 64, 48, 2.2);

        // ---- 6) ĐẤU TRƯỜNG DI TÍCH (vòng đá + 4 cổng) ----
        this.arena(64, 48, 12, 1, 5);

        // ---- 7) BÃI ĐẤT TRỐNG QUANH ĐIỂM SPAWN ----
        this.disc(12, 80, 6, 0);
        this.disc(16, 80, 3, 0);        // chỗ đặt cổng về
    }
});

// ============================================================
// REGISTRY
// ============================================================
const MAPS = {
    1: MAP1,
    2: MAP2
};

// Sinh dữ liệu 1 lần cho tất cả map -> đổi map là tức thì
MAP1.generate();
MAP2.generate();

// ⭐ Mọi file khác đều dùng biến `MAP` này -> không cần sửa gì
let MAP = MAP1;
let currentMap = 1;

// ============================================================
// 🟣 ORB DECADE (chỉ map 1)
// ============================================================
const ORB_DECADE = {
    x: 64 * 40,
    y: 48 * 40,
    radius: 30,
    interactDistance: 110
};

let orbDecadeActive = false;

// ============================================================
// 🌀 HIỆU ỨNG CHUYỂN MAP (fade đen)
// ============================================================
const MapTransition = {
    active: false,
    phase: 'idle',        // 'out' | 'in'
    alpha: 0,
    speed: 0.07,
    targetMap: null
};

function startMapTransition(id) {
    if (MapTransition.active) return;
    if (!MAPS[id]) return;
    if (id === currentMap) return;
    MapTransition.active = true;
    MapTransition.phase = 'out';
    MapTransition.alpha = 0;
    MapTransition.targetMap = id;
}

function updateMapTransition() {
    if (!MapTransition.active) return;

    if (MapTransition.phase === 'out') {
        MapTransition.alpha += MapTransition.speed;
        if (MapTransition.alpha >= 1) {
            MapTransition.alpha = 1;
            const target = MapTransition.targetMap;
            MapTransition.phase = 'in';
            enterMap(target);          // ⭐ đổi map đúng lúc màn hình đen
        }
    } else {
        MapTransition.alpha -= MapTransition.speed;
        if (MapTransition.alpha <= 0) {
            MapTransition.alpha = 0;
            MapTransition.active = false;
            MapTransition.phase = 'idle';
            MapTransition.targetMap = null;
        }
    }
}

function drawMapTransition() {
    if (MapTransition.alpha <= 0) return;
    const a = Math.min(1, MapTransition.alpha);

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, ' + a + ')';
    ctx.fillRect(0, 0, W, H);

    // Tên map hiện lên khi màn hình tối dần
    if (a > 0.45) {
        const textAlpha = (a - 0.45) / 0.55;
        ctx.globalAlpha = textAlpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const name = (MAPS[currentMap] && MAPS[currentMap].banner) || '';
        const sub = (MAPS[currentMap] && MAPS[currentMap].bannerSub) || '';

        ctx.font = 'bold 34px Arial';
        ctx.fillStyle = '#ffe9a8';
        ctx.shadowColor = 'rgba(255, 170, 60, 0.9)';
        ctx.shadowBlur = 24;
        ctx.fillText(name, W / 2, H / 2 - 14);

        ctx.shadowBlur = 0;
        ctx.font = '15px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fillText(sub, W / 2, H / 2 + 22);
        ctx.globalAlpha = 1;
    }

    ctx.restore();
}

// ============================================================
// 🔄 ĐỔI MAP — DỌN SẠCH ENTITY CỦA MAP CŨ
// ============================================================
function enterMap(id) {
    const target = MAPS[id];
    if (!target) return;
    if (id === currentMap && enterMap._ready) return;

    // ---- 1) Đóng bảng đang mở (shop / thợ rèn) ----
    if (typeof shopOpen !== 'undefined' && shopOpen && typeof closeShop === 'function') closeShop();
    if (typeof smithOpen !== 'undefined' && smithOpen && typeof closeSmith === 'function') closeSmith();
    if (typeof nearNPC !== 'undefined') nearNPC = false;
    if (typeof currentNPC !== 'undefined') currentNPC = null;
    if (typeof updateTalkButton === 'function') updateTalkButton();

    // ---- 2) ⭐ DỌN SẠCH QUÁI / ĐẠN / BOSS / VẬT RƠI ----
    if (typeof monsters !== 'undefined') monsters.length = 0;
    if (typeof bullets !== 'undefined') bullets.length = 0;
    if (typeof bossBullets !== 'undefined') bossBullets.length = 0;
    if (typeof droppedItems !== 'undefined') droppedItems.length = 0;
    if (typeof explosionEffects !== 'undefined') explosionEffects.length = 0;
    if (typeof slashTrails !== 'undefined') slashTrails.length = 0;

    if (typeof boss !== 'undefined') boss = null;
    if (typeof bossSpawned !== 'undefined') bossSpawned = false;
    if (typeof killCount !== 'undefined') killCount = 0;
    if (typeof bossZoneArmed !== 'undefined') bossZoneArmed = true;
    if (typeof spawnTimer !== 'undefined') spawnTimer = 0;

    // ---- 3) Đổi map ----
    currentMap = id;
    MAP = target;

    // ---- 4) Trạng thái spawn của map mới ----
    if (id === 1) {
        // Map 1 chỉ spawn khi đã kích hoạt khối 4D
        spawnActive = (typeof hypercube !== 'undefined') && hypercube.map === 1 && hypercube.interacted;
    } else {
        spawnActive = !!target.spawnOnArrival;
    }

    // ---- 5) Đặt người chơi vào điểm vào của map ----
    const ep = target.entryPoint || { x: 64 * 40, y: 48 * 40 };
    const free = target.findFreeSpot(ep.x, ep.y);
    player.x = free.x;
    player.y = free.y;
    Camera.follow(player.x, player.y);

    // ---- 6) NPC theo map ----
    if (typeof NPCS !== 'undefined') {
        NPCS.length = 0;
        for (let i = 0; i < target.npcs.length; i++) NPCS.push(target.npcs[i]);
    }

    // ---- 7) Khối 4D chỉ sống ở map 1 ----
    if (typeof hypercube !== 'undefined') {
        const el = document.getElementById('hypercube');
        const show = (hypercube.map === 1) && !hypercube.interacted;
        if (el) el.style.display = show ? 'block' : 'none';
    }

    // ---- 8) Nút bấm ----
    const orbBtn = document.getElementById('orbDecadeBtn');
    if (orbBtn) orbBtn.style.display = 'none';
    const portalBtn = document.getElementById('portalBtn');
    if (portalBtn) portalBtn.style.display = 'none';

    // ---- 9) Thông báo ----
    if (typeof showNotification === 'function') {
        showNotification(target.banner + ' — ' + target.name);
    }
    console.log('🗺️ Đã chuyển sang MAP', id, '-', target.name,
                '| quái:', (typeof monsters !== 'undefined' ? monsters.length : '?'),
                '| NPC:', (typeof NPCS !== 'undefined' ? NPCS.length : '?'));

    enterMap._ready = true;
}

function exitMap2() {
    if (currentMap === 1) return;
    startMapTransition(1);
}

// ============================================================
// 🌀 NÚT CỔNG DỊCH CHUYỂN
// ============================================================
function createPortalButton() {
    if (document.getElementById('portalBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'portalBtn';
    btn.innerHTML = '🌀 VỀ THẢO NGUYÊN';

    btn.style.position = 'fixed';
    btn.style.left = '50%';
    btn.style.bottom = '145px';
    btn.style.transform = 'translateX(-50%)';
    btn.style.zIndex = '9999';
    btn.style.padding = '14px 24px';
    btn.style.borderRadius = '14px';
    btn.style.border = '2px solid #ffffff';
    btn.style.background = 'rgba(150, 95, 20, 0.92)';
    btn.style.color = '#ffffff';
    btn.style.fontSize = '16px';
    btn.style.fontWeight = 'bold';
    btn.style.boxShadow = '0 0 20px rgba(255, 190, 80, 0.85)';
    btn.style.display = 'none';

    btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        exitMap2();
    });

    document.body.appendChild(btn);
}

setTimeout(createPortalButton, 500);

// Kiểm tra đứng gần cổng
function updateMapPortal() {
    const btn = document.getElementById('portalBtn');
    if (!btn) return;

    const p = MAP.portal;
    if (!p || MapTransition.active) {
        btn.style.display = 'none';
        return;
    }

    const dx = player.x - p.x;
    const dy = player.y - p.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    btn.style.display = (distance <= (p.interactDistance || 110)) ? 'flex' : 'none';
}

// ============================================================
// 👹 KÍCH HOẠT BOSS THEO VÙNG (map 2)
// ============================================================
let bossZoneArmed = true;

function checkBossZoneTrigger() {
    if (MapTransition.active) return;
    if (typeof boss === 'undefined' || typeof bossSpawned === 'undefined') return;
    if (boss || bossSpawned) return;

    const t = MAP.bossTrigger;
    if (!t || t.type !== 'zone') return;

    const d = Math.hypot(player.x - t.x, player.y - t.y);
    if (d > t.radius) {
        if (!bossZoneArmed && d > t.radius + 140) bossZoneArmed = true;
        return;
    }
    if (!bossZoneArmed) return;

    bossZoneArmed = false;
    spawnBoss();
}

// ============================================================
// CẬP NHẬT CÁC HỆ THỐNG CỦA MAP (gọi mỗi frame từ updateGame)
// ============================================================
function updateMapSystems() {
    if (MapTransition.active) return;

    updateMapPortal();
    checkBossZoneTrigger();

    if (typeof updateOrbDecadeChecker === 'function') updateOrbDecadeChecker();
}

// ============================================================
// CAMERA
// ============================================================
const Camera = {
    x: 0, y: 0,

    follow: function (tx, ty) {
        const cx = tx - W / 2;
        const cy = ty - H / 2;
        this.x = Math.max(0, Math.min(MAP.getWidth() - W, cx));
        this.y = Math.max(0, Math.min(MAP.getHeight() - H, cy));
    },

    toScreen: function (wx, wy) {
        return { x: wx - this.x, y: wy - this.y };
    }
};

// ============================================================
// VẼ CHI TIẾT MẶT ĐẤT THEO TỪNG MAP
// ============================================================
const MAP_DECOR = {

    // 🌱 Thảo nguyên
    grass: function (tile, sx, sy, ts, r, c) {
        if (tile === 3) {
            // gợn nước
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            for (let w = 0; w < 3; w++) {
                ctx.beginPath();
                ctx.arc(sx + ts / 4 + w * ts / 3, sy + ts / 3 + (w % 2) * ts / 6, ts / 8, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (tile === 2 && tileNoise(r, c, 3) > 0.86) {
            // đám cỏ sáng
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(sx + ts * 0.2, sy + ts * 0.25, ts * 0.6, ts * 0.5);
        }
    },

    // 🏜️ Sa mạc
    desert: function (tile, sx, sy, ts, r, c) {
        const n = tileNoise(r, c, 7);

        if (tile === 3) {
            // gợn nước ốc đảo
            ctx.fillStyle = 'rgba(255,255,255,0.14)';
            const t = Date.now() * 0.0015;
            for (let w = 0; w < 2; w++) {
                const off = Math.sin(t + c * 0.6 + w * 2.1) * ts * 0.1;
                ctx.fillRect(sx + ts * 0.15 + off, sy + ts * (0.3 + w * 0.35), ts * 0.7, 2);
            }
        } else if (tile === 2) {
            // đỉnh cồn cát
            if (n > 0.45) {
                ctx.strokeStyle = 'rgba(255, 246, 214, 0.35)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(sx + ts * 0.1, sy + ts * (0.35 + n * 0.3));
                ctx.quadraticCurveTo(sx + ts * 0.5, sy + ts * (0.10 + n * 0.3), sx + ts * 0.9, sy + ts * (0.42 + n * 0.25));
                ctx.stroke();
            }
        } else if (tile === 6) {
            // vệt tối ở chân cồn
            if (n > 0.55) {
                ctx.fillStyle = 'rgba(120, 88, 36, 0.16)';
                ctx.fillRect(sx + ts * 0.05, sy + ts * 0.6, ts * 0.9, ts * 0.3);
            }
        } else if (tile === 5) {
            // vết nứt trên di tích
            ctx.strokeStyle = 'rgba(70, 55, 35, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (n > 0.5) {
                ctx.moveTo(sx + ts * 0.2, sy + ts * 0.2);
                ctx.lineTo(sx + ts * 0.55, sy + ts * 0.5);
                ctx.lineTo(sx + ts * 0.45, sy + ts * 0.85);
            } else {
                ctx.moveTo(sx + ts * 0.8, sy + ts * 0.15);
                ctx.lineTo(sx + ts * 0.5, sy + ts * 0.6);
            }
            ctx.stroke();
        } else if (tile === 1) {
            // khối đá: vệt sáng trên đỉnh
            ctx.fillStyle = 'rgba(255, 230, 190, 0.14)';
            ctx.fillRect(sx, sy, ts, ts * 0.22);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
            ctx.fillRect(sx, sy + ts * 0.78, ts, ts * 0.22);
        }
    }
};

// ============================================================
// VẼ MAP
// ============================================================
function drawMapBase() {
    const ts = MAP.tileSize;
    const sc = Math.max(0, Math.floor(Camera.x / ts));
    const sr = Math.max(0, Math.floor(Camera.y / ts));
    const ec = Math.min(MAP.cols, Math.ceil((Camera.x + W) / ts) + 1);
    const er = Math.min(MAP.rows, Math.ceil((Camera.y + H) / ts) + 1);

    const decor = MAP_DECOR[MAP.decor] || null;
    const pal = MAP.palette;

    for (let r = sr; r < er; r++) {
        const row = MAP.data[r];
        if (!row) continue;
        const sy = r * ts - Camera.y;
        for (let c = sc; c < ec; c++) {
            const tile = row[c];
            const sx = c * ts - Camera.x;

            ctx.fillStyle = pal[tile] || pal[0];
            ctx.fillRect(sx, sy, ts, ts);

            if (decor) decor(tile, sx, sy, ts, r, c);
        }
    }
}

function drawMapShadows() {
    if (!MAP.hasShadows) return;
    const ts = MAP.tileSize;
    const ct = MAP.canopyTile;
    const sc = Math.max(0, Math.floor(Camera.x / ts));
    const sr = Math.max(0, Math.floor(Camera.y / ts));
    const ec = Math.min(MAP.cols, Math.ceil((Camera.x + W) / ts) + 1);
    const er = Math.min(MAP.rows, Math.ceil((Camera.y + H) / ts) + 1);

    for (let r = sr; r < er; r++) {
        const row = MAP.data[r];
        if (!row) continue;
        const sy = r * ts - Camera.y;
        for (let c = sc; c < ec; c++) {
            if (row[c] !== ct) continue;
            const sx = c * ts - Camera.x;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
            ctx.beginPath();
            ctx.ellipse(sx + ts / 2 + 3, sy + ts / 2 + 4, ts * 0.35, ts * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawMapCanopy() {
    if (!MAP.hasCanopy) return;
    const ts = MAP.tileSize;
    const ct = MAP.canopyTile;
    const style = MAP.canopyStyle || 'tree';
    const sc = Math.max(0, Math.floor(Camera.x / ts));
    const sr = Math.max(0, Math.floor(Camera.y / ts));
    const ec = Math.min(MAP.cols, Math.ceil((Camera.x + W) / ts) + 1);
    const er = Math.min(MAP.rows, Math.ceil((Camera.y + H) / ts) + 1);

    for (let r = sr; r < er; r++) {
        const row = MAP.data[r];
        if (!row) continue;
        const sy = r * ts - Camera.y;
        for (let c = sc; c < ec; c++) {
            if (row[c] !== ct) continue;
            const sx = c * ts - Camera.x;

            if (style === 'palm') {
                drawPalm(ctx, sx + ts / 2, sy + ts / 2 - 4, ts, tileNoise(r, c, 33));
            } else {
                drawTree(ctx, sx + ts / 2, sy + ts / 2, ts);
            }
        }
    }
}

// Cây thảo nguyên (giữ phong cách bản gốc, lấy màu từ palette map 1)
function drawTree(c, cx, cy, ts) {
    c.fillStyle = '#6b4a1e';
    c.fillRect(cx - 3, cy + ts * 0.05, 6, ts * 0.3);

    c.fillStyle = '#1a6a1a';
    c.beginPath();
    c.arc(cx, cy - 2, ts * 0.38, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#2a8a2a';
    c.beginPath();
    c.arc(cx - 4, cy - 5, ts * 0.28, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#3a9a3a';
    c.beginPath();
    c.arc(cx + 2, cy - 8, ts * 0.18, 0, Math.PI * 2);
    c.fill();
}

// Cây chà là sa mạc
function drawPalm(c, cx, cy, ts, seed) {
    const sway = Math.sin(Date.now() * 0.0012 + seed * 6.28) * 2.5;

    // Bóng
    c.fillStyle = 'rgba(0,0,0,0.16)';
    c.beginPath();
    c.ellipse(cx + 4, cy + ts * 0.42, ts * 0.3, ts * 0.12, 0, 0, Math.PI * 2);
    c.fill();

    // Thân
    c.strokeStyle = '#7a5a2a';
    c.lineWidth = 4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx, cy + ts * 0.42);
    c.quadraticCurveTo(cx + sway * 0.4, cy, cx + sway, cy - ts * 0.22);
    c.stroke();

    // Tàu lá
    const topX = cx + sway;
    const topY = cy - ts * 0.22;
    for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + seed;
        const len = ts * 0.42;
        c.strokeStyle = i % 2 ? '#2f6b3a' : '#3d8a48';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(topX, topY);
        c.quadraticCurveTo(
            topX + Math.cos(ang) * len * 0.6,
            topY + Math.sin(ang) * len * 0.6 - 4,
            topX + Math.cos(ang) * len,
            topY + Math.sin(ang) * len + 5
        );
        c.stroke();
    }

    // Dừa
    c.fillStyle = '#8a6a2a';
    c.beginPath();
    c.arc(topX - 3, topY + 4, 2.6, 0, Math.PI * 2);
    c.arc(topX + 3, topY + 5, 2.6, 0, Math.PI * 2);
    c.fill();
}

// ============================================================
// 🌀 VẼ CỔNG DỊCH CHUYỂN
// ============================================================
function drawMapPortal() {
    const p = MAP.portal;
    if (!p) return;
    if (typeof Camera === 'undefined') return;

    const s = Camera.toScreen(p.x, p.y);
    const t = Date.now() * 0.001;

    ctx.save();

    // Cột sáng
    const beam = ctx.createLinearGradient(s.x, s.y - 150, s.x, s.y + 30);
    beam.addColorStop(0, 'rgba(255, 200, 90, 0)');
    beam.addColorStop(0.6, 'rgba(255, 190, 80, 0.22)');
    beam.addColorStop(1, 'rgba(255, 150, 40, 0.05)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(s.x - 16, s.y + 20);
    ctx.lineTo(s.x - 6, s.y - 150);
    ctx.lineTo(s.x + 6, s.y - 150);
    ctx.lineTo(s.x + 16, s.y + 20);
    ctx.closePath();
    ctx.fill();

    // Vòng xoáy cát
    for (let i = 0; i < 5; i++) {
        const prog = ((t * 0.45) + i / 5) % 1;
        const rad = 16 + prog * 46;
        const alpha = (1 - prog) * 0.85;
        ctx.strokeStyle = 'rgba(255, 205, 110, ' + alpha + ')';
        ctx.lineWidth = 4 - prog * 2.5;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, rad, rad * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Lõi
    const pulse = 1 + Math.sin(t * 4) * 0.12;
    const core = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 26 * pulse);
    core.addColorStop(0, 'rgba(255, 255, 235, 0.95)');
    core.addColorStop(0.4, 'rgba(255, 190, 80, 0.8)');
    core.addColorStop(1, 'rgba(255, 130, 20, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 26 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Chữ
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe9a8';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText('🌀 ' + p.targetName, s.x, s.y - 54);
    ctx.fillText('🌀 ' + p.targetName, s.x, s.y - 54);

    ctx.restore();
}

// ============================================================
// NPC
// ============================================================
const NPCS = [];

function initNPCs() {
    NPCS.length = 0;
    const list = MAPS[1].npcs;
    for (let i = 0; i < list.length; i++) NPCS.push(list[i]);
    console.log('🧙 Đã tạo', NPCS.length, 'NPC cho map 1');
}

function drawNPCs() {
    if (typeof Camera === 'undefined') return;
    if (typeof ctx === 'undefined') return;

    for (let npc of NPCS) {
        const screen = Camera.toScreen(npc.x, npc.y);
        const half = npc.size / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(screen.x, screen.y + half + 2, half * 0.8, half * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = npc.color;
        ctx.fillRect(screen.x - half, screen.y - half, npc.size, npc.size);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(screen.x - half, screen.y - half, npc.size, npc.size);

        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(npc.icon, screen.x, screen.y);

        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(npc.name, screen.x, screen.y - half - 10);
        ctx.fillText(npc.name, screen.x, screen.y - half - 10);
    }
}

initNPCs();

// ============================================================
// KHỐI 4D (HYPERCUBE) — chỉ tồn tại ở map 1
// ============================================================
const hypercube = {
    map: 1,
    x: 60 * 40,
    y: 45 * 40,
    size: 80,
    interacted: false,

    update: function () {
        if (this.interacted) return;
        if (currentMap !== this.map) return;
        if (typeof player === 'undefined') return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 60) this.interact();
    },

    interact: function () {
        if (this.interacted) return;
        this.interacted = true;

        spawnActive = true;
        hypercubeActive = false;

        const el = document.getElementById('hypercube');
        if (el) el.style.display = 'none';

        console.log('🎲 KHỐI 4D ĐÃ TƯƠNG TÁC! Quái bắt đầu spawn!');
        if (typeof showNotification === 'function') {
            showNotification('🎲 QUÁI BẮT ĐẦU XUẤT HIỆN!');
        }
    },

    reset: function () {
        this.interacted = false;
        hypercubeActive = true;

        // ⚠️ Chỉ hiện lại khối 4D, KHÔNG tự bật spawnActive.
        // Spawn chỉ được bật khi người chơi TƯƠNG TÁC LẠI với khối 4D.
        if (currentMap !== this.map) return;

        const el = document.getElementById('hypercube');
        if (el) el.style.display = 'block';

        console.log('🎲 KHỐI 4D HIỆN LẠI! (Cần tương tác lại để bật spawn)');
    },

    draw: function () {
        if (this.interacted) return;
        if (currentMap !== this.map) return;
        if (typeof Camera === 'undefined') return;

        const el = document.getElementById('hypercube');
        if (el) {
            const screen = Camera.toScreen(this.x, this.y);
            el.style.left = (screen.x - 40) + 'px';
            el.style.top = (screen.y - 40) + 'px';
        }
    }
};

console.log('🌍 game2.js (v2) sẵn sàng! — MAPS:', Object.keys(MAPS).join(', '),
            '| map hiện tại:', currentMap);
