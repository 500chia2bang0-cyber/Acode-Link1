// ============================================================
// DRAW + UPDATE - gamedrawcreate.js
// ============================================================
console.log('🎨 Bắt đầu load gamedrawcreate.js...');

// ⭐ CAMERA ZOOM STATE
window.cameraZoom = 1.0;
window.smoothCameraEnabled = true;

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
// CAMERA ZOOM HANDLING
// ============================================================
window.updateCameraZoom = function(zoom) {
    window.cameraZoom = Math.max(0.5, Math.min(2, zoom));
    console.log('📷 Camera zoom:', window.cameraZoom);
};

window.applyCameraTransform = function() {
    const zoom = window.cameraZoom || 1;
    // Scale from screen center (W/2, H/2) so zoom centers on player
    const centerX = W / 2;
    const centerY = H / 2;
    ctx.setTransform(
        devicePixelRatio * zoom, 0, 0, devicePixelRatio * zoom,
        centerX * devicePixelRatio * (1 - zoom),
        centerY * devicePixelRatio * (1 - zoom)
    );
};

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
    
    // ⭐ VẼ VŨ KHÍ - Kiểm tra sprite đã load chưa
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
        const cached = getScaledSprite(sprite, scale);
        
        // ⭐ KHÓA LẬT THEO FIREJOY (không theo Hand)
        let lockAngle = (hand && typeof hand.angle === 'number') ? hand.angle : 0;
        if (typeof fireJoy !== 'undefined' && fireJoy.active && typeof fireJoy.angle === 'number') {
            lockAngle = fireJoy.angle;
        }
        
        const shouldFlip = Math.abs(lockAngle) > Math.PI / 2;
        
        c.save();
        if (shouldFlip) {
            c.scale(1, -1);
            c.rotate(-lockAngle);
        } else {
            c.rotate(lockAngle);
        }
        c.drawImage(cached, 12, -cached.height / 2);
        c.restore();
    } else {
        // Fallback: vẽ hình chữ nhật nếu sprite chưa load
        c.fillStyle = '#666';
        c.fillRect(12, -8, 24, 16);
    }
    
    c.restore();
}
// ============================================================
// VẼ GAME
// ============================================================
window.drawGame = function() {
    try {
        if (typeof ctx === 'undefined') return;
        if (typeof W === 'undefined' || W === 0) return;
        
        // Apply camera zoom transform
        if (typeof window.applyCameraTransform === 'function') {
            window.applyCameraTransform();
        } else {
            // Fallback
            ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        }
        
        // Screen effects
        if (typeof applyScreenEffects === 'function') applyScreenEffects();
        
        // Clear (account for zoom)
        const zoom = window.cameraZoom || 1;
        ctx.clearRect(0, 0, W / zoom, H / zoom);
        
        // ⭐ MAP
        if (typeof drawMapBase === 'function') drawMapBase();
    
        // 🌀 CỔNG DỊCH CHUYỂN (map 2)
        if (typeof drawMapPortal === 'function') drawMapPortal();
        
        // 🟣 VẼ ORB DECADE (chỉ map 1)
        if (
            typeof orbDecadeActive !== 'undefined' &&
            orbDecadeActive &&
            currentMap === 1 &&
            typeof ORB_DECADE !== 'undefined' &&
            typeof Camera !== 'undefined' &&
            typeof ctx !== 'undefined'
        ) {
            const s = Camera.toScreen(ORB_DECADE.x, ORB_DECADE.y);
            const pulse = Math.sin(Date.now() * 0.005) * 5;
            ctx.save();
            const glow = ctx.createRadialGradient(s.x, s.y, 5, s.x, s.y, 65 + pulse);
            glow.addColorStop(0, 'rgba(255,255,255,0.9)');
            glow.addColorStop(0.25, 'rgba(190,80,255,0.65)');
            glow.addColorStop(0.65, 'rgba(120,30,255,0.25)');
            glow.addColorStop(1, 'rgba(100,0,180,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 65 + pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#8b2cff';
            ctx.strokeStyle = '#f0c8ff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(s.x, s.y, ORB_DECADE.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(s.x - 9, s.y - 10, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
         
        // Đạn
        if (typeof drawBullets === 'function') drawBullets();
        
        // NPC
        if (typeof drawNPCs === 'function') drawNPCs();
        
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
    
      // ⭐ VẼ SỐ MÁU BỊ TRỪ (ĐÈ LÊN TRÊN)
        if (typeof drawDamageNumbers === 'function') {
            drawDamageNumbers();
        }
    
    // 🌀 HIỆU ỨNG CHUYỂN MAP (vẽ trên cùng, đè lên mọi thứ)
        if (typeof drawMapTransition === 'function') drawMapTransition();
    } catch (e) {
        console.error('❌ drawGame error:', e);
    }
};

// ============================================================
// N8N WEBHOOK SYNC
// ============================================================
const N8N_WEBHOOK_URL = 'http://localhost:5678/workflow/VQNDvgMz0CIgerTu'; // ⚠️ THAY BẰNG URL N8N THỰC

async function syncToN8n(saveData, action = 'save') {
    const userProfile = SaveSystem.getUserProfile();
    if (!userProfile || !userProfile.id) {
        console.log('📡 N8N: Chưa đăng nhập Google, bỏ qua sync');
        return;
    }
    
    const payload = {
        action: action,
        timestamp: Date.now(),
        user: {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            picture: userProfile.picture
        },
        saveSlot: window.currentSaveSlot,
        character: {
            name: userProfile.name,
            level: saveData.player?.level || 1,
            exp: saveData.player?.exp || 0,
            hp: saveData.player?.hp || 200,
            maxHp: saveData.player?.maxHp || 200,
            mp: saveData.player?.mp || 200,
            maxMp: saveData.player?.maxMp || 200,
            coins: saveData.player?.coins || 0,
            currentMap: saveData.currentMap || 1,
            x: saveData.player?.x || 0,
            y: saveData.player?.y || 0
        },
        stats: {
            playTime: (saveData.lastPlayed || Date.now()) - (saveData.createdAt || Date.now()),
            killCount: saveData.killCount || 0,
            bossSpawned: saveData.bossSpawned || false,
            hypercubeInteracted: saveData.hypercubeInteracted || false,
            map2Visited: saveData.map2Visited || false
        },
        inventory: saveData.inventory?.map(item => item ? {
            id: item.id,
            name: item.name,
            count: item.count || 1,
            level: item.level || item.weaponLevel || 0,
            damage: item.damage || 0,
            type: item.type || 'material',
            rarity: item.rarity || 'common'
        } : null).filter(Boolean) || [],
        hotbar: saveData.hotbar?.map(item => item ? {
            id: item.id,
            name: item.name,
            count: item.count || 1,
            level: item.level || item.weaponLevel || 0,
            damage: item.damage || 0,
            type: item.type || 'weapon',
            rarity: item.rarity || 'common'
        } : null).filter(Boolean) || []
    };
    
    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log('📡 N8N: Sync thành công', action);
            if (typeof showNotification === 'function' && action === 'save') {
                showNotification('☁️ Đã đồng bộ lên server!');
            }
        } else {
            console.warn('📡 N8N: Sync thất bại', response.status, response.statusText);
        }
    } catch (error) {
        console.error('📡 N8N: Lỗi kết nối', error);
    }
}

// Make it globally accessible for manual trigger
window.syncToN8n = syncToN8n;
window.collectGameState = collectGameState;
function collectGameState() {
    if (typeof player === 'undefined') return null;
    
    return {
        savedAt: Date.now(),
        player: {
            x: player.x,
            y: player.y,
            hp: player.hp,
            maxHp: player.maxHp,
            mp: player.mp,
            maxMp: player.maxMp,
            coins: player.coins,
            level: player.level,
            exp: player.exp,
            expToNext: player.expToNext
        },
        inventory: inventory ? [...inventory] : [],
        hotbar: inventory ? inventory.slice(0, 6) : [],
        selectedSlot: selectedSlot || 0,
        currentMap: currentMap || 1,
        killCount: killCount || 0,
        bossSpawned: typeof bossSpawned !== 'undefined' ? bossSpawned : false,
        hypercubeInteracted: typeof hypercube !== 'undefined' ? hypercube.interacted : false,
        map2Visited: typeof map2Visited !== 'undefined' ? map2Visited : false
    };
}

window.saveGame = function() {
    if (window.currentSaveSlot === null && window.currentSaveSlot !== 0) {
        console.warn('No save slot selected');
        if (typeof showNotification === 'function') showNotification('❌ Chưa chọn slot lưu!');
        return;
    }
    
    const saveData = collectGameState();
    if (!saveData) return;
    
    // Use SaveSystem to save (handles localStorage + n8n sync)
    SaveSystem.saveGame();
};

window.exportSave = function() {
    const saveData = collectGameState();
    if (!saveData) return;
    
    const userProfile = SaveSystem.getUserProfile();
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        user: userProfile ? { name: userProfile.name, email: userProfile.email } : { name: 'Local', email: '' },
        saveSlot: window.currentSaveSlot,
        data: saveData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game_save_' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
    
    if (typeof showNotification === 'function') showNotification('📤 Đã xuất save file!');
};

window.importSave = function(data) {
    if (!data || !data.data) {
        if (typeof showNotification === 'function') showNotification('❌ Dữ liệu save không hợp lệ!');
        return;
    }
    
    // Apply imported data
    SaveSystem.applySaveData(data.data);
    
    // Save to current slot
    if (window.currentSaveSlot !== null && window.currentSaveSlot !== undefined) {
        SaveSystem.saveSaveData(window.currentSaveSlot, {
            ...SaveSystem.loadSaveData(window.currentSaveSlot),
            ...data.data,
            lastPlayed: Date.now()
        });
    }
    
    if (typeof showNotification === 'function') showNotification('📥 Đã nhập save!');
};

window.resetGame = function() {
    SaveSystem.resetGame();
};

// Use SaveSystem for loading
window.loadGame = function(slotIndex) {
    return SaveSystem.loadGame(slotIndex);
};

// Helper to load save data - delegates to SaveSystem
window.loadSaveData = function(slotIndex) {
    return SaveSystem.loadSaveData(slotIndex);
};

function applySaveData(saveData) {
    if (!saveData) return;

    // Restore player state
    if (typeof player !== 'undefined' && saveData.player) {
        player.x = saveData.player.x;
        player.y = saveData.player.y;
        player.hp = saveData.player.hp;
        player.maxHp = saveData.player.maxHp;
        player.mp = saveData.player.mp;
        player.maxMp = saveData.player.maxMp;
        player.coins = saveData.player.coins;
        player.level = saveData.player.level;
        player.exp = saveData.player.exp;
        player.expToNext = saveData.player.expToNext;
        player.updateMaxStats();
    }

    // Restore inventory
    if (saveData.inventory && typeof inventory !== 'undefined') {
        inventory.length = 0;
        inventory.push(...saveData.inventory);
        
        // ⭐ POPULATE STARTER ITEMS FOR NEW CHARACTER (empty inventory)
        if (inventory.length === 0 || inventory.every(slot => slot === null)) {
            populateStarterItems();
        }
        
        if (typeof initInventoryUI === 'function') initInventoryUI();
    }

    // Restore selected slot
    if (saveData.selectedSlot !== undefined) {
        selectedSlot = saveData.selectedSlot;
        if (typeof updateHotbarUI === 'function') updateHotbarUI();
    }

    // Restore map
    if (saveData.currentMap && typeof enterMap === 'function') {
        enterMap(saveData.currentMap);
    }

    // Restore kill count
    if (saveData.killCount !== undefined) killCount = saveData.killCount;

    // Restore map state
    if (typeof bossSpawned !== 'undefined') bossSpawned = saveData.bossSpawned || false;
    if (typeof hypercube !== 'undefined') hypercube.interacted = saveData.hypercubeInteracted || false;
    if (typeof map2Visited !== 'undefined') map2Visited = saveData.map2Visited || false;

    if (typeof UI !== 'undefined') UI.update();
    console.log('📂 Applied save data:', saveData);
}

// ⭐ POPULATE STARTER ITEMS FOR NEW CHARACTER
function populateStarterItems() {
    if (typeof ITEMS === 'undefined') return;
    
    inventory[0] = { ...ITEMS.PISTOL, count: 1 };
    inventory[1] = { ...ITEMS.AWP, count: 1 };
    inventory[2] = { ...ITEMS.BARRET, count: 1 };
    inventory[3] = { ...ITEMS.SHOTGUN, count: 1 };
    inventory[4] = { ...ITEMS.MIXED_POTION, count: 5 };
    inventory[5] = { ...ITEMS.BOMB, count: 3 };
    inventory[6] = { ...ITEMS.RAILGUN, count: 1 };
    inventory[7] = { ...ITEMS.PLASMA, count: 1 };
    inventory[10] = { ...ITEMS.RIFLE, count: 1 };
    inventory[11] = { ...ITEMS.SWORD, count: 1 };
    inventory[15] = { ...ITEMS.COLLAPSED_SCYTHE, count: 1 };
    
    console.log('🎁 Starter items populated for new character');
}

// ============================================================
// UPDATE GAME
// ============================================================
window.updateGame = function() {
    try {
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
    } catch (e) {
        console.error('❌ updateGame error:', e);
    }
    
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
    if (typeof Hand !== 'undefined' && Hand.update) Hand.update();

    // ⭐ CẬP NHẬT VỆT CHÉM
    if (typeof updateSlashTrails === 'function') {
        updateSlashTrails();
    }

    // ⭐ CẬP NHẬT SỐ MÁU BỊ TRỪ
    if (typeof updateDamageNumbers === 'function') {
        updateDamageNumbers();
    }

    // 🌀 HIỆU ỨNG CHUYỂN MAP
    if (typeof updateMapTransition === 'function') updateMapTransition();

    // 🗺️ HỆ THỐNG CỦA MAP (cổng dịch chuyển, vùng boss, orb)
    if (typeof updateMapSystems === 'function') updateMapSystems();
};

// ============================================================
// ⭐ KHỞI TẠO UI GAME - Gọi khi game bắt đầu
// ============================================================
function initGameUI() {
    console.log('🎮 Khởi tạo Game UI...');
    
    // Initialize settings panel
    if (typeof initSettingsPanel === 'function') {
        initSettingsPanel();
    }
    
    // Initialize orb decade button
    if (typeof initOrbDecadeButton === 'function') {
        initOrbDecadeButton();
    }
    
    // Attach inventory event listeners
    if (typeof attachInventoryEventListeners === 'function') {
        attachInventoryEventListeners();
    }
    
    // Initialize inventory UI if not done
    if (typeof initInventoryUI === 'function') {
        initInventoryUI();
    }
    
    console.log('✅ Game UI khởi tạo xong');
}

// Export để gọi từ gamemenu.js startGame()
window.initGameUI = initGameUI;

// ============================================================
// ⭐ BÁO GAME READY
// ============================================================
window._gameReady = true;
console.log('🎨 gamedrawcreate.js sẵn sàng! — GAME READY');