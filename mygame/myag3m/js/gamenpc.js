// ============================================================
// NPC + SHOP + SMITH SYSTEM - gamencp.js
// ============================================================
console.log('🧙 Bắt đầu load gamencp.js...');

let nearNPC = false;
let shopOpen = false;
let smithOpen = false;
let currentNPC = null;
let currentSmithTab = 'forge';

// ============================================================
// SHOP ITEMS
// ============================================================
const SHOP_ITEMS = [
    { id: 'buy_pistol', item: 'PISTOL', icon: '🔫', name: 'Súng lục', cost: { coin: 100 }, description: 'Common' },
    { id: 'buy_rifle', item: 'RIFLE', icon: '🔫', name: 'Súng trường', cost: { coin: 300 }, description: 'Common' },
    { id: 'buy_sword', item: 'SWORD', icon: '⚔️', name: 'Kiếm', cost: { coin: 200 }, description: 'Common' },
    { id: 'buy_awp', item: 'AWP', icon: '🎯', name: 'AWP', cost: { coin: 500 }, description: 'Rare' },
    { id: 'buy_barret', item: 'BARRET', icon: '🎯', name: 'Barret', cost: { coin: 700 }, description: 'Rare' },
    { id: 'buy_shotgun', item: 'SHOTGUN', icon: '🔱', name: 'Shotgun', cost: { coin: 600 }, description: 'Rare' },
    { id: 'buy_potion', item: 'MIXED_POTION', icon: '⚗️', name: 'Thuốc tổng hợp', cost: { coin: 50 }, description: 'Hồi 30 HP + 30 MP' },
    { id: 'buy_bomb', item: 'BOMB', icon: '💣', name: 'Bom', cost: { coin: 75 }, description: 'Nổ diện rộng' },
    { 
        id: 'buy_railgun', item: 'RAILGUN', icon: '⚡', name: '⭐ Railgun', 
        cost: { coin: 2000, iron_scrap: 50, item_awp: 1, item_barret: 1, btoken: 10 }, 
        description: 'Epic - Damage 80' 
    },
    { 
        id: 'buy_plasma', item: 'PLASMA', icon: '🌟', name: '⭐ Plasma Gun', 
        cost: { coin: 3000, iron_scrap: 80, slime_goo: 50, item_shotgun: 1, item_awp: 2, btoken: 20 }, 
        description: 'Epic - 18 nòng' 
    },
    // 🏜️ SA MẠC ITEMS
    { id: 'buy_scimitar', item: 'SCIMITAR', icon: '🗡️', name: 'Scimitar Sa Mạc', cost: { coin: 800, iron_scrap: 30 }, description: 'Rare - Kiếm cong du hành' },
    { id: 'buy_sand_blaster', item: 'SAND_BLASTER', icon: '🔫', name: 'Súng Phun Cát', cost: { coin: 1500, iron_scrap: 50, sand_essence: 20 }, description: 'Epic - Phun cát xuyên thấu' },
    { id: 'buy_cactus_spear', item: 'CACTUS_SPEAR', icon: '🪃', name: 'Thương Xương Rồng', cost: { coin: 2500, iron_scrap: 80, cactus_core: 1 }, description: 'Epic - Thương gai cổ xưa' },
    { 
        id: 'buy_scorpion_twin', item: 'SCORPION_TWIN_BLADES', icon: '⚔️', name: 'Song Đao Bọ Cạp', 
        cost: { coin: 5000, iron_scrap: 150, scorpion_stinger: 1, btoken: 30 }, 
        description: 'Legendary - §§§ Sa Mạc' 
    },
    { id: 'buy_sand_essence', item: 'SAND_ESSENCE', icon: '🏜️', name: 'Tinh Tú Cát', cost: { coin: 200 }, description: 'Rare - Chế tạo vũ khí sa mạc' },
    { id: 'buy_cactus_core', item: 'CACTUS_CORE', icon: '🌵', name: 'Tim Xương Rồng', cost: { coin: 1000, iron_scrap: 50 }, description: 'Epic - Từ Golem xương rồng' }
];

// ============================================================
// CRAFT RECIPES
// ============================================================
const CRAFT_RECIPES = [
    {
        id: 'craft_collapsed',
        result: 'COLLAPSED',
        icon: '💀',
        name: 'Collapsed',
        cost: { dark_goo: 88 },
        description: 'Sự sụp đổ — nguyên liệu §§§'
    },
    {
        id: 'craft_scythe',
        result: 'COLLAPSED_SCYTHE',
        icon: '⚔️',
        name: 'Collapsed Scythe',
        cost: { collapsed: 10, btoken: 50, coin: 10000 },
        description: 'Cái chết — Kết thúc vở kịch'
    },
    // 🏜️ SA MẠC CRAFTING
    {
        id: 'craft_scimitar',
        result: 'SCIMITAR',
        icon: '🗡️',
        name: 'Scimitar Sa Mạc',
        cost: { iron_scrap: 40, sand_essence: 10, coin: 500 },
        description: 'Rare - Kiếm cong du hành'
    },
    {
        id: 'craft_sand_blaster',
        result: 'SAND_BLASTER',
        icon: '🔫',
        name: 'Súng Phun Cát',
        cost: { iron_scrap: 60, sand_essence: 30, cactus_core: 1, btoken: 10 },
        description: 'Epic - Phun cát xuyên thấu'
    },
    {
        id: 'craft_cactus_spear',
        result: 'CACTUS_SPEAR',
        icon: '🪃',
        name: 'Thương Xương Rồng',
        cost: { iron_scrap: 100, cactus_core: 2, dark_goo: 5, btoken: 15 },
        description: 'Epic - Thương gai cổ xưa'
    },
    {
        id: 'craft_scorpion_twin',
        result: 'SCORPION_TWIN_BLADES',
        icon: '⚔️',
        name: 'Song Đao Bọ Cạp',
        cost: { iron_scrap: 200, scorpion_stinger: 2, collapsed: 5, btoken: 50 },
        description: 'Legendary - §§§ Sa Mạc'
    },
    {
        id: 'craft_sa_vuong_scythe',
        result: 'SA_VUONG_SCYTHE',
        icon: '☠️',
        name: 'Liềm Sa Vương',
        cost: { iron_scrap: 300, ancient_scroll: 1, collapsed: 10, scorpion_stinger: 3, btoken: 100, coin: 50000 },
        description: 'Legendary §§§ - Vũ khí của Sa Vương'
    }
];

// ============================================================
// UTILITY
// ============================================================
function countItem(itemId) {
    if (typeof inventory === 'undefined') return 0;
    let count = 0;
    for (let item of inventory) {
        if (item && item.id === itemId) count += (item.count || 1);
    }
    return count;
}

function removeItem(itemId, count) {
    if (typeof inventory === 'undefined') return;
    for (let i = 0; i < inventory.length; i++) {
        const item = inventory[i];
        if (item && item.id === itemId) {
            const removeCount = Math.min(count, item.count || 1);
            item.count -= removeCount;
            count -= removeCount;
            if (item.count <= 0) inventory[i] = null;
            if (count <= 0) break;
        }
    }
    if (typeof updateInventoryUI === 'function') updateInventoryUI();
    if (typeof updateHotbarUI === 'function') updateHotbarUI();
}

// ============================================================
// KIỂM TRA GẦN NPC
// ============================================================
function checkNearNPC() {
    if (typeof NPCS === 'undefined') return;
    if (typeof player === 'undefined') return;
    if (NPCS.length === 0) return;
    
    let nearestNPC = null;
    let minDist = 80;
    
    for (let npc of NPCS) {
        const dx = player.x - npc.x;
        const dy = player.y - npc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
            minDist = dist;
            nearestNPC = npc;
        }
    }
    
    const isNear = nearestNPC !== null;
    if (isNear !== nearNPC) {
        nearNPC = isNear;
        currentNPC = nearestNPC;
        updateTalkButton();
    }
}

function updateTalkButton() {
    const talkBtn = document.getElementById('talkBtn');
    if (!talkBtn) return;
    if (nearNPC && !shopOpen && !smithOpen) {
        talkBtn.style.display = 'flex';
    } else {
        talkBtn.style.display = 'none';
    }
}

// ============================================================
// SHOP
// ============================================================
function openShop() {
    if (shopOpen || smithOpen) return;
    
    if (currentNPC && currentNPC.type === 'smith') {
        openSmith(currentNPC);
        return;
    }
    
    if (currentNPC && currentNPC.type === 'guide') {
        showGuideDialog();
        return;
    }
    
    shopOpen = true;
    
    const shopPanel = document.getElementById('shopPanel');
    if (shopPanel) {
        shopPanel.classList.add('open');
        document.body.classList.add('shop-open');
        updateShopCoins();
        
        // ⭐ Reset về tab MUA
        currentShopTab = 'buy';
        sellSelection = [];
        document.querySelectorAll('.shopTab').forEach(function(el) {
            if (el.dataset.tab === 'buy') el.classList.add('active');
            else el.classList.remove('active');
        });
        
        renderShopItems();
        setTimeout(initShopScroll, 200);
    }
    
    const talkBtn = document.getElementById('talkBtn');
    if (talkBtn) talkBtn.style.display = 'none';
}

// ============================================================
// HƯỚNG DẪN VIÊN (Guide NPC)
// ============================================================
function showGuideDialog() {
    const messages = [
        '🧭 Chào mừng đến Sa Mạc Sahara!',
        '🏜️ Đây là đất của cát và di tích cổ xưa.',
        '⚠️ Cẩn thận: Quái sa mạc nhanh và mạnh hơn!',
        '👹 Sa Vương chờ ở trung tâm đấu trường di tích.',
        '💡 Mẹo: Sử dụng vũ khí xuyên thấu (pierce) để đối phó đám quái.',
        '🏜️ Tinh tú cát, Tim xương rồng, Đuôi bọ cạp - nguyên liệu quý!',
        '⚔️ Chế tạo Scimitar, Súng Phun Cát, Thương Xương Rồng tại Thợ rèn.',
        '📜 Cuộn giấy cổ từ Sa Vương mở khóa Liềm Sa Vương §§§!',
        '🌀 Cổng dịch chuyển ở gần điểm spawn quay về Thảo Nguyên.'
    ];
    
    let msgIndex = 0;
    const showNext = () => {
        if (msgIndex < messages.length) {
            if (typeof showNotification === 'function') {
                showNotification(messages[msgIndex]);
            }
            msgIndex++;
            setTimeout(showNext, 2500);
        }
    };
    showNext();
    
    if (typeof showNotification === 'function') {
        showNotification('🧭 Hướng dẫn viên: "Ta sẽ chỉ cho ngươi đường!"');
    }
}

function closeShop() {
    if (!shopOpen) return;
    shopOpen = false;
    console.log('🏪 Đóng shop');
    const shopPanel = document.getElementById('shopPanel');
    if (shopPanel) {
        shopPanel.classList.remove('open');
        document.body.classList.remove('shop-open');
    }
}

function updateShopCoins() {
    const el = document.getElementById('shopCoinCount');
    if (el && typeof player !== 'undefined') el.textContent = player.coins;
}

function renderShopItems() {
    const content = document.getElementById('shopContent');
    if (!content) return;
    content.innerHTML = '';
    
    for (let shopItem of SHOP_ITEMS) {
        const el = document.createElement('div');
        el.className = 'shopItem';
        const canBuy = canAfford(shopItem.cost);
        
        let costText = '';
        if (shopItem.cost.coin) costText += '💰 ' + shopItem.cost.coin + ' ';
        if (shopItem.cost.iron_scrap) costText += '⚙️ ' + shopItem.cost.iron_scrap + ' ';
        if (shopItem.cost.slime_goo) costText += '🟢 ' + shopItem.cost.slime_goo + ' ';
        if (shopItem.cost.btoken) costText += '💠 ' + shopItem.cost.btoken + ' ';
        if (shopItem.cost.item_awp) costText += '🎯 AWP x' + shopItem.cost.item_awp + ' ';
        if (shopItem.cost.item_barret) costText += '🎯 Barret x' + shopItem.cost.item_barret + ' ';
        if (shopItem.cost.item_shotgun) costText += '🔱 Shotgun x' + shopItem.cost.item_shotgun + ' ';
        if (shopItem.cost.sand_essence) costText += '🏜️ ' + shopItem.cost.sand_essence + ' ';
        if (shopItem.cost.cactus_core) costText += '🌵 ' + shopItem.cost.cactus_core + ' ';
        
        el.innerHTML = 
            '<div class="itemIcon">' + shopItem.icon + '</div>' +
            '<div class="itemInfo">' +
                '<div class="itemName">' + shopItem.name + '</div>' +
                '<div class="itemCost">' + costText + '</div>' +
                '<div style="font-size:11px;color:#888;margin-top:4px;">' + shopItem.description + '</div>' +
            '</div>' +
            '<button class="buyBtn" ' + (canBuy ? '' : 'disabled') + '>' + (canBuy ? 'MUA' : 'KHÔNG ĐỦ') + '</button>';
        
        const buyBtn = el.querySelector('.buyBtn');
        if (buyBtn && canBuy) {
            buyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                buyShopItem(shopItem);
            });
        }
        content.appendChild(el);
    }
}

function canAfford(cost) {
    if (typeof player === 'undefined') return false;
    if (cost.coin && player.coins < cost.coin) return false;
    if (cost.iron_scrap && countItem('iron_scrap') < cost.iron_scrap) return false;
    if (cost.slime_goo && countItem('slime_goo') < cost.slime_goo) return false;
    if (cost.btoken && countItem('btoken') < cost.btoken) return false;
    if (cost.item_awp && countItem('awp') < cost.item_awp) return false;
    if (cost.item_barret && countItem('barret') < cost.item_barret) return false;
    if (cost.item_shotgun && countItem('shotgun') < cost.item_shotgun) return false;
    if (cost.sand_essence && countItem('sand_essence') < cost.sand_essence) return false;
    if (cost.cactus_core && countItem('cactus_core') < cost.cactus_core) return false;
    return true;
}

function buyShopItem(shopItem) {
    if (!canAfford(shopItem.cost)) {
        if (typeof showNotification === 'function') showNotification('❌ Không đủ nguyên liệu!');
        return;
    }
    
    if (shopItem.cost.coin) player.coins -= shopItem.cost.coin;
    if (shopItem.cost.iron_scrap) removeItem('iron_scrap', shopItem.cost.iron_scrap);
    if (shopItem.cost.slime_goo) removeItem('slime_goo', shopItem.cost.slime_goo);
    if (shopItem.cost.btoken) removeItem('btoken', shopItem.cost.btoken);
    if (shopItem.cost.item_awp) removeItem('awp', shopItem.cost.item_awp);
    if (shopItem.cost.item_barret) removeItem('barret', shopItem.cost.item_barret);
    if (shopItem.cost.item_shotgun) removeItem('shotgun', shopItem.cost.item_shotgun);
    if (shopItem.cost.sand_essence) removeItem('sand_essence', shopItem.cost.sand_essence);
    if (shopItem.cost.cactus_core) removeItem('cactus_core', shopItem.cost.cactus_core);
    
    if (typeof ITEMS !== 'undefined' && typeof addItemToInventory === 'function') {
        if (ITEMS[shopItem.item]) addItemToInventory(ITEMS[shopItem.item], 1);
    }
    
    if (typeof UI !== 'undefined') UI.update();
    updateShopCoins();
    renderShopItems();
    if (typeof showNotification === 'function') showNotification('✅ Đã mua: ' + shopItem.name);
}

// ============================================================
// SCROLL SHOP
// ============================================================
function initShopScroll() {
    const scroll = document.getElementById('shopScroll');
    const scrollbar = document.getElementById('shopScrollbar');
    const thumb = document.getElementById('shopScrollThumb');
    if (!scroll || !scrollbar || !thumb) return;
    
    let isDragging = false;
    let dragTouchId = null;
    let startY = 0;
    let startScrollTop = 0;
    
    function updateThumb() {
        const sh = scroll.scrollHeight;
        const ch = scroll.clientHeight;
        const st = scroll.scrollTop;
        if (sh <= ch) { thumb.style.display = 'none'; return; }
        thumb.style.display = 'block';
        const ratio = ch / sh;
        const th = Math.max(30, scrollbar.clientHeight * ratio);
        const maxST = sh - ch;
        const maxTT = scrollbar.clientHeight - th;
        thumb.style.height = th + 'px';
        thumb.style.top = (maxST > 0 ? (st / maxST) * maxTT : 0) + 'px';
    }
    
    scroll.addEventListener('scroll', updateThumb);
    
    thumb.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (isDragging) return;
        const touch = e.changedTouches[0];
        isDragging = true;
        dragTouchId = touch.identifier;
        startY = touch.clientY;
        startScrollTop = scroll.scrollTop;
    }, { passive: false });
    
    thumb.addEventListener('touchmove', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) return;
        for (let touch of e.changedTouches) {
            if (touch.identifier === dragTouchId) {
                const deltaY = touch.clientY - startY;
                const maxST = scroll.scrollHeight - scroll.clientHeight;
                const maxTT = scrollbar.clientHeight - thumb.clientHeight;
                if (maxTT <= 0) return;
                scroll.scrollTop = startScrollTop + (deltaY / maxTT) * maxST;
            }
        }
    }, { passive: false });
    
    thumb.addEventListener('touchend', function() {
        isDragging = false;
        dragTouchId = null;
    });
    
    setInterval(updateThumb, 500);
    setTimeout(updateThumb, 100);
}

// ============================================================
// SMITH SYSTEM
// ============================================================
function openSmith(npc) {
    if (smithOpen) return;
    smithOpen = true;
    console.log('⚒️ Mở Smith');
    
    const panel = document.getElementById('smithPanel');
    if (panel) {
        panel.classList.add('open');
        document.body.classList.add('smith-open');
        switchSmithTab('forge');
    }
    
    const talkBtn = document.getElementById('talkBtn');
    if (talkBtn) talkBtn.style.display = 'none';
}

function closeSmith() {
    if (!smithOpen) return;
    smithOpen = false;
    console.log('⚒️ Đóng Smith');
    const panel = document.getElementById('smithPanel');
    if (panel) {
        panel.classList.remove('open');
        document.body.classList.remove('smith-open');
    }
}

function switchSmithTab(tab) {
    currentSmithTab = tab;
    document.querySelectorAll('.smithTab').forEach(function(el) {
        if (el.dataset.tab === tab) el.classList.add('active');
        else el.classList.remove('active');
    });
    
    if (tab === 'forge') {
        updateSmithUI();
        document.getElementById('smithActions').style.display = 'flex';
    } else if (tab === 'craft') {
        renderCraftUI();
        document.getElementById('smithActions').style.display = 'none';
    }
}

function updateSmithUI() {
    const content = document.getElementById('smithContent');
    const btokenEl = document.getElementById('smithBtokenCount');
    const forgeBtn = document.getElementById('smithForgeBtn');
    if (!content) return;
    
    if (btokenEl) btokenEl.textContent = countItem('btoken');
    
    const item = (typeof inventory !== 'undefined' && typeof selectedSlot !== 'undefined')
        ? inventory[selectedSlot] : null;
    
    if (!item || item.type !== 'weapon') {
        content.innerHTML = 
    '<div class="smithWeaponRow">' +
        '<div class="smithWeaponIcon">' + item.icon + '</div>' +
        '<div class="smithWeaponInfo">' +
            '<div class="smithWeaponName">' + item.name + '</div>' +
            '<div class="smithWeaponStat">Cấp: <span class="highlight">' + weaponLevel + '/75</span></div>' +
            '<div class="smithWeaponStat">Bậc: <span class="highlight">' + rarity + '</span></div>' +
            '<div class="smithWeaponStat">DMG: <span class="highlight">' + formatNumber(currentDamage) + '</span></div>' +
            (weaponLevel >= 75 
                ? '<div class="maxLevelBadge">🏆 CẤP TỐI ĐA</div>'
                : '<div class="smithWeaponStat">Chi phí: <span class="btoken">💠 1 Btoken</span></div>'
            ) +
        '</div>' +
    '</div>';

// Disable nút rèn nếu max cấp
if (forgeBtn) forgeBtn.disabled = (weaponLevel >= 75) || (countItem('btoken') < 1);
    }
    
    const weaponLevel = item.weaponLevel || 0;
    const baseDamage = item.baseDamage || item.damage || 15;
    const currentDamage = typeof getWeaponDamage === 'function' 
        ? getWeaponDamage(item) : baseDamage;
    
    const rarityText = {
        'common': '⚪ Phổ thông',
        'rare': '🔵 Siêu cấp',
        'epic': '🟣 Tối thượng',
        'legendary': '🟡 §§§'
    };
    const rarity = rarityText[item.rarity || 'common'];
    
    content.innerHTML = 
        '<div class="smithWeaponRow">' +
            '<div class="smithWeaponIcon">' + item.icon + '</div>' +
            '<div class="smithWeaponInfo">' +
                '<div class="smithWeaponName">' + item.name + '</div>' +
                '<div class="smithWeaponStat">Cấp: <span class="highlight">' + weaponLevel + '</span></div>' +
                '<div class="smithWeaponStat">Bậc: <span class="highlight">' + rarity + '</span></div>' +
                '<div class="smithWeaponStat">DMG: <span class="highlight">' + formatNumber(currentDamage) + '</span></div>' +
                '<div class="smithWeaponStat">Chi phí: <span class="btoken">💠 1 Btoken</span></div>' +
            '</div>' +
        '</div>';
    
    if (forgeBtn) forgeBtn.disabled = countItem('btoken') < 1;
}

function formatNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
    return (num / 1000000000000).toFixed(1) + 'T';
}

function forgeWeapon() {
    if (typeof inventory === 'undefined') return;
    const item = inventory[selectedSlot];
    
    if (!item || item.type !== 'weapon') {
        if (typeof showNotification === 'function') showNotification('❌ Không có vũ khí!');
        return;
    }
    
    // ⭐ CHECK MAX CẤP 75
    const currentLevel = item.weaponLevel || 0;
    if (currentLevel >= 75) {
        if (typeof showNotification === 'function') {
            showNotification('🏆 Vũ khí đã đạt cấp tối đa 75!');
        }
        return;
    }
    
    if (countItem('btoken') < 1) {
        if (typeof showNotification === 'function') showNotification('❌ Không đủ Btoken!');
        return;
    }
    
    removeItem('btoken', 1);
    item.weaponLevel = currentLevel + 1;
    item.damage = typeof getWeaponDamage === 'function' ? getWeaponDamage(item) : item.damage;
    
    // Thông báo
    if (typeof showNotification === 'function') {
        if (item.weaponLevel >= 75) {
            showNotification('🏆 ' + item.name + ' ĐẠT CẤP TỐI ĐA 75!');
        } else {
            showNotification('⚒️ Rèn thành công! ' + item.name + ' cấp ' + item.weaponLevel);
        }
    }
    
    if (typeof updateInventoryUI === 'function') updateInventoryUI();
    if (typeof updateHotbarUI === 'function') updateHotbarUI();
    updateSmithUI();
}

// ============================================================
// CRAFT SYSTEM
// ============================================================
function renderCraftUI() {
    const content = document.getElementById('smithContent');
    if (!content) return;
    content.innerHTML = '';
    
    for (let recipe of CRAFT_RECIPES) {
        const el = document.createElement('div');
        el.className = 'craftItem';
        const canCraft = canCraftItem(recipe.cost);
        
        let costText = '';
        if (recipe.cost.dark_goo) costText += '⚫ ' + recipe.cost.dark_goo + ' ';
        if (recipe.cost.collapsed) costText += '💀 ' + recipe.cost.collapsed + ' ';
        if (recipe.cost.btoken) costText += '💠 ' + recipe.cost.btoken + ' ';
        if (recipe.cost.coin) costText += '🪙 ' + recipe.cost.coin + ' ';
        if (recipe.cost.sand_essence) costText += '🏜️ ' + recipe.cost.sand_essence + ' ';
        if (recipe.cost.cactus_core) costText += '🌵 ' + recipe.cost.cactus_core + ' ';
        if (recipe.cost.scorpion_stinger) costText += '🦂 ' + recipe.cost.scorpion_stinger + ' ';
        if (recipe.cost.ancient_scroll) costText += '📜 ' + recipe.cost.ancient_scroll + ' ';
        
        el.innerHTML = 
            '<div class="craftIcon">' + recipe.icon + '</div>' +
            '<div class="craftInfo">' +
                '<div class="craftName">' + recipe.name + '</div>' +
                '<div class="craftCost">' + costText + '</div>' +
            '</div>' +
            '<button class="craftBtn" ' + (canCraft ? '' : 'disabled') + '>' + (canCraft ? 'CHẾ' : 'THIẾU') + '</button>';
        
        const btn = el.querySelector('.craftBtn');
        if (btn && canCraft) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                craftItem(recipe);
            });
        }
        content.appendChild(el);
    }
}

function canCraftItem(cost) {
    if (typeof player === 'undefined') return false;
    if (cost.dark_goo && countItem('dark_goo') < cost.dark_goo) return false;
    if (cost.collapsed && countItem('collapsed') < cost.collapsed) return false;
    if (cost.btoken && countItem('btoken') < cost.btoken) return false;
    if (cost.coin && player.coins < cost.coin) return false;
    if (cost.sand_essence && countItem('sand_essence') < cost.sand_essence) return false;
    if (cost.cactus_core && countItem('cactus_core') < cost.cactus_core) return false;
    if (cost.scorpion_stinger && countItem('scorpion_stinger') < cost.scorpion_stinger) return false;
    if (cost.ancient_scroll && countItem('ancient_scroll') < cost.ancient_scroll) return false;
    return true;
}

function craftItem(recipe) {
    if (!canCraftItem(recipe.cost)) {
        if (typeof showNotification === 'function') showNotification('❌ Không đủ nguyên liệu!');
        return;
    }
    
    if (recipe.cost.dark_goo) removeItem('dark_goo', recipe.cost.dark_goo);
    if (recipe.cost.collapsed) removeItem('collapsed', recipe.cost.collapsed);
    if (recipe.cost.btoken) removeItem('btoken', recipe.cost.btoken);
    if (recipe.cost.coin) player.coins -= recipe.cost.coin;
    if (recipe.cost.sand_essence) removeItem('sand_essence', recipe.cost.sand_essence);
    if (recipe.cost.cactus_core) removeItem('cactus_core', recipe.cost.cactus_core);
    if (recipe.cost.scorpion_stinger) removeItem('scorpion_stinger', recipe.cost.scorpion_stinger);
    if (recipe.cost.ancient_scroll) removeItem('ancient_scroll', recipe.cost.ancient_scroll);
    
    if (typeof ITEMS !== 'undefined' && ITEMS[recipe.result]) {
        if (typeof addItemToInventory === 'function') addItemToInventory(ITEMS[recipe.result], 1);
    }
    
    if (typeof UI !== 'undefined') UI.update();
    renderCraftUI();
    if (typeof showNotification === 'function') showNotification('✅ Đã chế: ' + recipe.name);
    console.log('🔨 Chế tạo:', recipe.name);
}
// ============================================================
// SELL SYSTEM
// ============================================================
let currentShopTab = 'buy';
let sellSelection = [];   // Mảng index các item được chọn

// Giá bán = 40% giá gốc
const SELL_RATE = 0.4;

// Bảng giá gốc (dùng để tính giá bán)
const ITEM_PRICES = {
    'pistol': 100,
    'rifle': 300,
    'sword': 200,
    'awp': 500,
    'barret': 700,
    'shotgun': 600,
    'bomb': 75,
    'mixed_potion': 50,
    'iron_scrap': 10,
    'slime_goo': 5,
    'btoken': 200,
    'dark_goo': 1000,
    'collapsed': 50000,
    'collapsed_scythe': 200000,
    // 🏜️ SA MẠC
    'sand_essence': 200,
    'cactus_core': 1000,
    'scorpion_stinger': 2000,
    'ancient_scroll': 10000,
    'scimitar': 800,
    'sand_blaster': 1500,
    'cactus_spear': 2500,
    'scorpion_twin_blades': 5000,
    'sa_vuong_scythe': 100000
};

// Tính giá bán
function getSellPrice(itemId) {
    const basePrice = ITEM_PRICES[itemId] || 10;
    return Math.floor(basePrice * SELL_RATE);
}

// Chuyển tab
function switchShopTab(tab) {
    currentShopTab = tab;
    
    document.querySelectorAll('.shopTab').forEach(function(el) {
        if (el.dataset.tab === tab) el.classList.add('active');
        else el.classList.remove('active');
    });
    
    if (tab === 'buy') {
        renderShopItems();
    } else if (tab === 'sell') {
        sellSelection = [];
        renderSellUI();
    }
}

// Render UI bán
// ============================================================
// RENDER UI BÁN
// ============================================================
function renderSellUI() {
    const content = document.getElementById('shopContent');
    if (!content) return;
    
    // ⭐ LAYOUT: Kho (trái) + Info (phải cố định)
    let html = '<div id="sellContainer">';
    
    // Bên trái: Kho đồ 6 cột + scroll riêng
    html += '<div id="sellInventoryWrapper">';
    html += '<div id="sellInventory">';
    for (let i = 0; i < inventory.length; i++) {
        const item = inventory[i];
        const isSelected = sellSelection.indexOf(i) !== -1;
        
        if (item) {
            html += '<div class="sellSlot ' + (isSelected ? 'selected' : '') + '" data-index="' + i + '">';
            html += '<span>' + item.icon + '</span>';
            if (item.count && item.count > 1) {
                html += '<span class="sellCount">' + item.count + '</span>';
            }
            html += '</div>';
        } else {
            html += '<div class="sellSlot empty"></div>';
        }
    }
    html += '</div>';   // Đóng sellInventory
    html += '</div>';   // Đóng sellInventoryWrapper
    
    // Bên phải: Tổng tiền + nút bán (CỐ ĐỊNH)
    const total = calculateSellTotal();
    html += '<div id="sellInfo">';
    html += '<div id="sellTotal">TỔNG<span class="amount">💰 ' + total + '</span></div>';
    html += '<button id="sellBtn" ' + (total > 0 ? '' : 'disabled') + '>BÁN</button>';
    html += '</div>';
    
    html += '</div>';   // Đóng sellContainer
    
    content.innerHTML = html;
    
    // ⭐ GẮN EVENT CHO SLOT
    content.querySelectorAll('.sellSlot:not(.empty)').forEach(function(el) {
        el.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleSellSelection(parseInt(this.dataset.index));
        });
    });
    
    // ⭐ GẮN EVENT CHO NÚT BÁN
    const sellBtn = document.getElementById('sellBtn');
    if (sellBtn && total > 0) {
        sellBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            executeSell();
        });
    }
}

// Chọn/bỏ chọn item
function toggleSellSelection(index) {
    const pos = sellSelection.indexOf(index);
    if (pos !== -1) {
        sellSelection.splice(pos, 1);
    } else {
        sellSelection.push(index);
    }
    renderSellUI();
}

// Tính tổng tiền bán
function calculateSellTotal() {
    let total = 0;
    for (let idx of sellSelection) {
        const item = inventory[idx];
        if (item) {
            const price = getSellPrice(item.id);
            const count = item.count || 1;
            total += price * count;
        }
    }
    return total;
}

// Thực hiện bán
function executeSell() {
    let total = 0;
    
    // Sắp xếp giảm dần để xóa không bị lệch index
    sellSelection.sort(function(a, b) { return b - a; });
    
    for (let idx of sellSelection) {
        const item = inventory[idx];
        if (item) {
            const price = getSellPrice(item.id);
            const count = item.count || 1;
            total += price * count;
            inventory[idx] = null;
        }
    }
    
    player.coins += total;
    
    if (typeof UI !== 'undefined') UI.update();
    updateShopCoins();
    
    if (typeof showNotification === 'function') {
        showNotification('💰 Bán được: ' + total + ' vàng!');
    }
    
    console.log('💰 Bán items:', sellSelection.length, '| Tổng:', total);
    
    sellSelection = [];
    renderSellUI();
    
    if (typeof updateInventoryUI === 'function') updateInventoryUI();
    if (typeof updateHotbarUI === 'function') updateHotbarUI();
}
// ============================================================
// INIT SYSTEM
// ============================================================
function initNPCSystem() {
    console.log('🧙 Khởi tạo NPC System...');
    
    // Nút Talk
    const talkBtn = document.getElementById('talkBtn');
    if (talkBtn) {
        talkBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openShop();
        }, { passive: false });
        talkBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openShop();
        });
    }
    
    // Đóng Shop
    const shopClose = document.getElementById('shopClose');
    if (shopClose) {
        shopClose.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeShop();
        });
    }
    
    // Đóng Smith
    const smithClose = document.getElementById('smithClose');
    if (smithClose) {
        smithClose.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeSmith();
        });
    }
    
    // Nút Rèn
    const forgeBtn = document.getElementById('smithForgeBtn');
    if (forgeBtn) {
        forgeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            forgeWeapon();
        });
    }
    
    // Tabs
    document.querySelectorAll('.smithTab').forEach(function(el) {
        el.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            switchSmithTab(this.dataset.tab);
        });
    });
    // ⭐ SHOP TABS
document.querySelectorAll('.shopTab').forEach(function(el) {
    el.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        switchShopTab(this.dataset.tab);
    });
});
    renderShopItems();
    console.log('✅ NPC System sẵn sàng!');


}

function updateNPCSystem() {
    if (shopOpen || smithOpen) return;
    checkNearNPC();
}

window.addEventListener('load', function() {
    setTimeout(initNPCSystem, 800);
});

console.log('🧙 gamencp.js sẵn sàng!');