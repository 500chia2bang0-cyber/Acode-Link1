// ============================================================
// KHO ĐỒ - game4.js
// ============================================================
console.log('📦 Bắt đầu load game4.js...');

const INVENTORY_CONFIG = { TOTAL: 120, HOTBAR_SIZE: 6 };
let inventory = new Array(INVENTORY_CONFIG.TOTAL).fill(null);
let selectedSlot = 0;

const ITEMS = {
    // === VŨ KHÍ AUTO (COMMON - PHỔ THÔNG) ===
    PISTOL: {
        id: 'pistol', name: 'Súng lục', icon: '🔫',
        type: 'weapon', mode: 'auto',
        rarity: 'common',        // ⭐ Cấp vũ khí
        baseDamage: 35,          // Damage gốc
        damage: 35,              // Damage hiện tại (sẽ update)
        weaponLevel: 0,          // Cấp nâng cấp
        stackable: false
    },
    RIFLE: {
        id: 'rifle', name: 'Súng trường', icon: '🔫',
        type: 'weapon', mode: 'auto',
        rarity: 'common',
        baseDamage: 55,
        damage: 55,
        weaponLevel: 0,
        stackable: false
    },
    SWORD: {
        id: 'sword', name: 'Kiếm', icon: '⚔️',
        type: 'weapon', mode: 'auto',
        rarity: 'common',
        baseDamage: 30,
        damage: 30,
        weaponLevel: 0,
        stackable: false
    },
    
    // === VŨ KHÍ SNIPER (RARE - SIÊU CẤP) ===
    AWP: {
        id: 'awp', name: 'AWP', icon: '🎯',
        type: 'weapon', mode: 'sniper',
        rarity: 'rare',
        baseDamage: 180,
        damage: 180,
        pierce: 2,
        weaponLevel: 0,
        stackable: false
    },
    BARRET: {
        id: 'barret', name: 'Barret', icon: '🎯',
        type: 'weapon', mode: 'sniper',
        rarity: 'rare',
        baseDamage:200,
        damage: 200,
        pierce: 3,
        weaponLevel: 0,
        stackable: false
    },
    SHOTGUN: {
        id: 'shotgun', name: 'Shotgun', icon: '🔱',
        type: 'weapon', mode: 'sniper',
        rarity: 'rare',
        baseDamage: 20,
        damage: 20,
        pierce: 1,
        multiBarrel: true, barrelCount: 7, spreadAngle: 0.7,
        weaponLevel: 0,
        stackable: false
    },
    
    // === VŨ KHÍ ĐẶC BIỆT (EPIC - TỐI THƯỢNG) ===
    RAILGUN: {
        id: 'railgun', name: 'Railgun', icon: '⚡',
        type: 'weapon', mode: 'sniper',
        rarity: 'epic',
        baseDamage: 360,
        damage: 360,
        pierce: 10,
        weaponLevel: 0,
        stackable: false
    },
    PLASMA: {
        id: 'plasma', name: 'Plasma Gun', icon: '🌟',
        type: 'weapon', mode: 'sniper',
        rarity: 'epic',
        baseDamage: 30,
        damage: 30,
        pierce: 2,
        multiBarrel: true, barrelCount: 12, spreadAngle: 0.7,
        weaponLevel: 0,
        stackable: false
    },
    
    // === VẬT PHẨM TIÊU HAO ===
    BOMB: { id: 'bomb', name: 'Bom', icon: '💣', type: 'consumable', mode: 'sniper', damage: 250, stackable: true, maxStack: 9999 },
    MIXED_POTION: { id: 'mixed_potion', name: 'Thuốc tổng hợp', icon: '⚗️', type: 'consumable', mode: 'sniper', heal: 30, mana: 30, stackable: true, maxStack: 99 },
    
    // === NGUYÊN LIỆU ===
    COIN: { id: 'coin', name: 'Vàng', icon: '🪙', type: 'material', stackable: true, maxStack: 999999999999999 },
    SLIME_GOO: { id: 'slime_goo', name: 'Chất nhờn', icon: '🟢', type: 'material', stackable: true, maxStack: 9999 },
    IRON_SCRAP: { id: 'iron_scrap', name: 'Vụn sắt', icon: '⚙️', type: 'material', stackable: true, maxStack: 9999 },
    
    // ⭐ BTOKEN - TIỀN NÂNG CẤP VŨ KHÍ
    BTOKEN: {
        id: 'btoken', name: 'Btoken', icon: '💠',
        type: 'material', stackable: true, maxStack: 99999 },
    // === NGUYÊN LIỆU HIẾM ===
DARK_GOO: {
    id: 'dark_goo',
    name: 'Chất nhờn đen',
    icon: '⚫',
    type: 'material',
    rarity: 'epic',
    stackable: true,
    maxStack: 9999,
    description: 'Chất nhờn từ Elite — nỗi đau kết tinh'
},

COLLAPSED: {
    id: 'collapsed',
    name: 'Collapsed',
    icon: '💀',           // Hoặc icon riêng
    type: 'material',
    rarity: 'legendary',
    stackable: true,
    maxStack: 9999,
    description: 'Sự sụp đổ của thực tại — nguyên liệu chế tạo §§§'
},

// === VŨ KHÍ §§§ ===
COLLAPSED_SCYTHE: {
    id: 'collapsed_scythe',
    name: 'Collapsed Scythe',
    icon: '⚔️',
    type: 'weapon',
    mode: 'sniper',
    rarity: 'legendary',
    baseDamage: 80,
    damage: 80,
    pierce: 99,
    stackable: false,
    multiBarrel:true , barrelCount : 12 , spreadAngle : 0.3,
    description: 'Cái chết — Sự kết thúc của 1 vở kịch'
},

// === NGUYÊN LIỆU SA MẠC ===
SAND_ESSENCE: {
    id: 'sand_essence',
    name: 'Tinh tú cát',
    icon: '🏜️',
    type: 'material',
    rarity: 'rare',
    stackable: true,
    maxStack: 9999,
    description: 'Tinh tú của sa mạc — dùng để chế tạo vũ khí sa mạc'
},
CACTUS_CORE: {
    id: 'cactus_core',
    name: 'Tim xương rồng',
    icon: '🌵',
    type: 'material',
    rarity: 'epic',
    stackable: true,
    maxStack: 9999,
    description: 'Trái tim của Golem xương rồng — cực kỳ hiếm'
},
SCORPION_STINGER: {
    id: 'scorpion_stinger',
    name: 'Đuôi bọ cạp',
    icon: '🦂',
    type: 'material',
    rarity: 'epic',
    stackable: true,
    maxStack: 9999,
    description: 'Đuôi độc của Vua bọ cạp — nguyên liệu rèn đao'
},
ANCIENT_SCROLL: {
    id: 'ancient_scroll',
    name: 'Cuộn giấy cổ',
    icon: '📜',
    type: 'material',
    rarity: 'legendary',
    stackable: true,
    maxStack: 99,
    description: 'Bí mật của Sa Vương — mở khóa vũ khí tối thượng'
},

// === VŨ KHÍ SA MẠC ===
SCIMITAR: {
    id: 'scimitar',
    name: 'Scimitar Sa Mạc',
    icon: '🗡️',
    type: 'weapon',
    mode: 'auto',
    rarity: 'rare',
    baseDamage: 65,
    damage: 65,
    weaponLevel: 0,
    stackable: false,
    description: 'Kiếm cong của những người du hành sa mạc'
},
SAND_BLASTER: {
    id: 'sand_blaster',
    name: 'Súng Phun Cát',
    icon: '🔫',
    type: 'weapon',
    mode: 'sniper',
    rarity: 'epic',
    baseDamage: 45,
    damage: 45,
    pierce: 5,
    multiBarrel: true,
    barrelCount: 8,
    spreadAngle: 0.4,
    weaponLevel: 0,
    stackable: false,
    description: 'Bắn bắn cát nóng - xuyên thấu kẻ thù'
},
CACTUS_SPEAR: {
    id: 'cactus_spear',
    name: 'Thương Xương Rồng',
    icon: '🪃',
    type: 'weapon',
    mode: 'sniper',
    rarity: 'epic',
    baseDamage: 120,
    damage: 120,
    pierce: 8,
    weaponLevel: 0,
    stackable: false,
    description: 'Thương làm từ gai xương rồng cổ xưa'
},
SCORPION_TWIN_BLADES: {
    id: 'scorpion_twin_blades',
    name: 'Song Đao Bọ Cạp',
    icon: '⚔️',
    type: 'weapon',
    mode: 'sniper',
    rarity: 'legendary',
    baseDamage: 150,
    damage: 150,
    pierce: 15,
    multiBarrel: true,
    barrelCount: 10,
    spreadAngle: 0.35,
    weaponLevel: 0,
    stackable: false,
    description: 'Cặp dao của Vua Bọ Cạp - §§§ Sa Mạc'
},

// === VŨ KHÍ §§§ SA MẠC ===
SA_VUONG_SCYTHE: {
    id: 'sa_vuong_scythe',
    name: 'Liềm Sa Vương',
    icon: '☠️',
    type: 'weapon',
    mode: 'sniper',
    rarity: 'legendary',
    baseDamage: 200,
    damage: 200,
    pierce: 99,
    multiBarrel: true,
    barrelCount: 15,
    spreadAngle: 0.25,
    weaponLevel: 0,
    stackable: false,
    description: 'Vũ khí của Sa Vương — Chúa tể sa mạc §§§'
}
};

console.log('📦 ITEMS:', Object.keys(ITEMS).length, 'loại');
// ============================================================
// UI
// ============================================================
function initInventoryUI() {
    const grid = document.getElementById('inventoryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    for (let i = 0; i < INVENTORY_CONFIG.TOTAL; i++) {
        const slot = document.createElement('div');
        slot.className = 'invSlot';
        slot.dataset.slot = i;
        slot.innerHTML = '<div class="invIcon"></div>';
        slot.addEventListener('click', function() {
            onInventorySlotClick(i);
        });
        grid.appendChild(slot);
    }
    
    updateInventoryUI();
    updateHotbarUI();
}

function updateInventoryUI() {
    const slots = document.querySelectorAll('.invSlot');
    for (let i = 0; i < slots.length; i++) {
        const el = slots[i];
        const item = inventory[i];
        const icon = el.querySelector('.invIcon');
        if (!icon) continue;
        
        if (item) {
            icon.textContent = item.icon;
            icon.style.opacity = '1';
            if (item.stackable && item.count && item.count > 1) {
                icon.textContent = item.icon + ' x' + item.count;
            }
        } else {
            icon.textContent = '';
            icon.style.opacity = '0.2';
        }
    }
}

function updateHotbarUI() {
    const slots = document.querySelectorAll('#hotbar .slot');
    for (let i = 0; i < slots.length; i++) {
        const el = slots[i];
        const item = inventory[i];
        const icon = el.querySelector('.slotIcon');
        const countEl = el.querySelector('.slotCount');
        if (!icon) continue;
        
        if (item) {
            icon.textContent = item.icon;
            icon.classList.remove('empty');
            if (item.stackable && item.count && item.count > 1) {
                if (countEl) {
                    countEl.textContent = item.count;
                    countEl.classList.add('visible');
                }
            } else {
                if (countEl) {
                    countEl.textContent = '';
                    countEl.classList.remove('visible');
                }
            }
        } else {
            icon.textContent = '';
            icon.classList.add('empty');
            if (countEl) {
                countEl.textContent = '';
                countEl.classList.remove('visible');
            }
        }
        
        if (i === selectedSlot) {
            el.classList.add('selected');
        } else {
            el.classList.remove('selected');
        }
    }
}

function openInventory() {
    const p = document.getElementById('inventoryPanel');
    const h = document.getElementById('hotbar');
    if (p) {
        p.classList.add('open');
        updateInventoryUI();
        if (h) h.style.display = 'none';
    }
}

function closeInventory() {
    const p = document.getElementById('inventoryPanel');
    const h = document.getElementById('hotbar');
    if (p) {
        p.classList.remove('open');
        if (h) h.style.display = 'flex';
    }
}

function toggleInventory() {
    const p = document.getElementById('inventoryPanel');
    if (p && p.classList.contains('open')) {
        closeInventory();
    } else {
        openInventory();
    }
}

function onInventorySlotClick(index) {
    const item = inventory[index];
    if (!item) return;
    
    if (item.type === 'weapon' || item.type === 'consumable') {
        moveToHotbar(index);
        if (typeof showNotification === 'function') {
            showNotification('Đã trang bị ' + item.name);
        }
    }
}

function moveToHotbar(invIndex) {
    const item = inventory[invIndex];
    if (!item) return;
    
    if (invIndex < INVENTORY_CONFIG.HOTBAR_SIZE) {
        selectedSlot = invIndex;
        updateHotbarUI();
        return;
    }
    
    for (let i = 0; i < INVENTORY_CONFIG.HOTBAR_SIZE; i++) {
        if (!inventory[i]) {
            inventory[i] = item;
            inventory[invIndex] = null;
            selectedSlot = i;
            updateInventoryUI();
            updateHotbarUI();
            return;
        }
    }
    
    const temp = inventory[selectedSlot];
    inventory[selectedSlot] = item;
    inventory[invIndex] = temp;
    updateInventoryUI();
    updateHotbarUI();
}

function addItemToInventory(itemTemplate, count) {
    if (!itemTemplate) return false;
    if (typeof count === 'undefined') count = 1;
    
    if (itemTemplate.stackable) {
        for (let i = 0; i < inventory.length; i++) {
            const item = inventory[i];
            if (item && item.id === itemTemplate.id) {
                const maxStack = itemTemplate.maxStack || 99;
                if (item.count < maxStack) {
                    const canAdd = Math.min(count, maxStack - item.count);
                    item.count += canAdd;
                    count -= canAdd;
                    if (count <= 0) {
                        updateInventoryUI();
                        updateHotbarUI();
                        return true;
                    }
                }
            }
        }
    }
    
    for (let i = 0; i < inventory.length; i++) {
        if (!inventory[i]) {
            inventory[i] = { ...itemTemplate, count: count };
            updateInventoryUI();
            updateHotbarUI();
            return true;
        }
    }
    return false;
}

function showNotification(text) {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = text;
    document.body.appendChild(notif);
    setTimeout(function() {
        notif.classList.add('fade-out');
        setTimeout(function() {
            notif.remove();
        }, 300);
    }, 1500);
}

// ============================================================
// KHỞI TẠO
// ============================================================
function initInventory() {
    console.log('📦 initInventory() bắt đầu...');
    
    inventory[0] = { ...ITEMS.PISTOL, count: 1 };
    inventory[1] = { ...ITEMS.AWP, count: 1 };
    inventory[2] = { ...ITEMS.BARRET, count: 1 };
    inventory[3] = { ...ITEMS.SHOTGUN, count: 1 };
    inventory[4] = { ...ITEMS.MIXED_POTION, count: 5 };
    inventory[5] = { ...ITEMS.BOMB, count: 3 };
    inventory[15]= { ... ITEMS.COLLAPSED_SCYTHE ,count : 1};
    inventory[10] = { ...ITEMS.RIFLE, count: 1 };
    inventory[6] = { ...ITEMS.RAILGUN, count: 1 };
    inventory[7] = { ...ITEMS.PLASMA, count: 1 };
    inventory[11] = { ...ITEMS.SWORD, count: 1 };
    
    initInventoryUI();
    
    // Nút kho
    const btn = document.getElementById('inventoryBtn');
    if (btn) {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', toggleInventory);
    }
    
    // ⭐ HOTBAR - XÓA EVENT CŨ + GẮN MỚI
    const slots = document.querySelectorAll('#hotbar .slot');
    slots.forEach(function(el) {
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
    });
    
    document.querySelectorAll('#hotbar .slot').forEach(function(el) {
        el.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const slot = parseInt(this.dataset.slot);
            selectedSlot = slot;
            updateHotbarUI();
            console.log('🎯 Hotbar slot', slot);
        }, { passive: false });
    });
    
    console.log('✅ Kho đồ sẵn sàng!');
}

window.addEventListener('load', function() {
    setTimeout(initInventory, 300);
});
// ============================================================
// TÍNH DAMAGE VŨ KHÍ THEO CẤP
// ============================================================
// ============================================================
// TÍNH DAMAGE VŨ KHÍ THEO CẤP (MAX 75)
// ============================================================
function getWeaponDamage(item) {
    if (!item) return 0;
    if (!item.baseDamage) return item.damage || 15;
    
    // ⭐ Giới hạn cấp 75
    let level = item.weaponLevel || 0;
    if (level > 75) level = 75;
    
    const base = item.baseDamage;
    
    // Công thức: (base + 15 × level) × 1.2^level
    const damage = Math.floor((base + 15 * level) * Math.pow(1.2, level));
    return damage;
}

// ============================================================
// NÂNG CẤP VŨ KHÍ BẰNG BTOKEN
// ============================================================
function upgradeWeapon(slotIndex) {
    const item = inventory[slotIndex];
    if (!item) return false;
    if (item.type !== 'weapon') return false;
    
    // Kiểm tra có Btoken không
    const btokenCount = countItem('btoken');
    if (btokenCount < 1) {
        if (typeof showNotification === 'function') {
            showNotification('❌ Không đủ Btoken!');
        }
        return false;
    }
    
    // Trừ 1 Btoken
    removeItem('btoken', 1);
    
    // Tăng level
    item.weaponLevel = (item.weaponLevel || 0) + 1;
    item.damage = getWeaponDamage(item);
    
    if (typeof showNotification === 'function') {
        showNotification('✅ ' + item.name + ' lên cấp ' + item.weaponLevel + '! Damage: ' + item.damage);
    }
    
    console.log('⬆️ Nâng cấp:', item.name, '| Level:', item.weaponLevel, '| Damage:', item.damage);
    
    if (typeof updateInventoryUI === 'function') updateInventoryUI();
    if (typeof updateHotbarUI === 'function') updateHotbarUI();
    
    return true;
}

// ============================================================
// ĐẾM SỐ LƯỢNG ITEM
// ============================================================
function countItem(itemId) {
    if (typeof inventory === 'undefined') return 0;
    let count = 0;
    for (let item of inventory) {
        if (item && item.id === itemId) {
            count += (item.count || 1);
        }
    }
    return count;
}

console.log('🔧 Hệ thống nâng cấp vũ khí sẵn sàng!');
console.log('🎒 game4.js sẵn sàng!');