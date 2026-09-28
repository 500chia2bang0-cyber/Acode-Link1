// ============================================================
// MAIN MENU & GOOGLE SIGN-IN - gamemenu.js
// ============================================================
console.log('🎮 Bắt đầu load gamemenu.js...');

// ⭐ TRẠNG THÁI MENU
let isMenuOpen = true;
let isLoggedIn = false;
let userProfile = null;
let currentSaveSlot = null;

// ⭐ SAVE DATA KEYS
const SAVE_KEYS = {
    PROFILE: 'userProfile',
    TOKEN: 'googleToken',
    SAVE_PREFIX: 'gameSave_',
    SLOT_COUNT: 3
};

// ⭐ DEFAULT SAVE STRUCTURE
function getDefaultSaveData() {
    return {
        createdAt: Date.now(),
        lastPlayed: Date.now(),
        playTime: 0,
        player: {
            x: 2560, y: 1920,
            hp: 200, maxHp: 200,
            mp: 200, maxMp: 200,
            coins: 0,
            level: 1,
            exp: 0,
            expToNext: 100
        },
        inventory: [],
        hotbar: [],
        selectedSlot: 0,
        currentMap: 1,
        bossSpawned: false,
        killCount: 0,
        hypercubeInteracted: false,
        map2Visited: false
    };
}

// ⭐ KHỞI TẠO GOOGLE SIGN-IN
function initGoogleSignIn() {
    // Google Identity Services sẽ load async, đợi ready
    if (typeof google === 'undefined' || !google.accounts) {
        setTimeout(initGoogleSignIn, 100);
        return;
    }

    // ⚠️ THAY THẾ CLIENT ID NÀY BẰNG CLIENT ID THỰC TỪ GOOGLE CLOUD CONSOLE
    // Tạo ở: https://console.cloud.google.com/apis/credentials
    // Cần cấu hình: Authorized JavaScript origins (vd: http://localhost:8080)
    const CLIENT_ID = '118193822223-sm6egk8s4tmei2868e5n6g2atd7npogj.apps.googleusercontent.com'; // ⚠️ THAY BẰNG CLIENT ID THỰC

    if (CLIENT_ID.includes('THAY BẰNG')) {
        console.error('❌ Chưa cấu hình Google Client ID! Vui lòng thay CLIENT_ID trong gamemenu.js');
        showGoogleConfigError();
        return;
    }

    try {
        google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true
        });

        // Render nút Google Sign-In
        google.accounts.id.renderButton(
            document.getElementById('googleSignInBtn'),
            {
                theme: 'outline',
                size: 'large',
                width: '100%',
                text: 'continue_with',
                shape: 'rectangular',
                logo_alignment: 'left'
            }
        );

        console.log('✅ Google Sign-In initialized');
    } catch (e) {
        console.error('❌ Google Sign-In init error:', e);
        showGoogleConfigError();
    }
}

// ⭐ XỬ LÝ KHI ĐĂNG NHẬP GOOGLE THÀNH CÔNG
function handleGoogleSignIn(response) {
    console.log('✅ Google Sign-In callback received');
    
    if (!response || !response.credential) {
        console.error('❌ No credential in response');
        showSignInError('Không nhận được thông tin đăng nhập từ Google');
        return;
    }

    try {
        // Decode JWT token để lấy thông tin user
        const payload = parseJwt(response.credential);
        
        if (!payload || !payload.sub) {
            throw new Error('Invalid token payload');
        }

        userProfile = {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
            given_name: payload.given_name,
            family_name: payload.family_name
        };

        // Lưu vào localStorage
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        localStorage.setItem('googleToken', response.credential);

        // Cập nhật UI
        showLoggedInState();
        
        console.log('👤 User:', userProfile.name, '(' + userProfile.email + ')');
    } catch (e) {
        console.error('❌ Handle Google Sign-In error:', e);
        showSignInError('Lỗi xử lý đăng nhập: ' + e.message);
    }
}

// ⭐ PARSE JWT TOKEN (không verify signature - chỉ client-side)
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Parse JWT error:', e);
        return {};
    }
}

// ============================================================
// SAVE SYSTEM - 3 SLOTS PER USER
// ============================================================
function getSaveKey(slotIndex) {
    if (!userProfile || !userProfile.id) return null;
    return SAVE_KEYS.SAVE_PREFIX + userProfile.id + '_' + slotIndex;
}

function loadSaveData(slotIndex) {
    const key = getSaveKey(slotIndex);
    if (!key) return getDefaultSaveData();
    
    const data = localStorage.getItem(key);
    if (data) {
        try {
            const parsed = JSON.parse(data);
            // Merge with defaults for new fields
            return { ...getDefaultSaveData(), ...parsed };
        } catch (e) {
            console.error('Parse save data error:', e);
        }
    }
    return getDefaultSaveData();
}

function saveSaveData(slotIndex, data) {
    const key = getSaveKey(slotIndex);
    if (!key) return false;
    
    const saveData = {
        ...loadSaveData(slotIndex),
        ...data,
        lastPlayed: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(saveData));
    return true;
}

function getAllSaveSlots() {
    const slots = [];
    for (let i = 0; i < SAVE_KEYS.SLOT_COUNT; i++) {
        const save = loadSaveData(i);
        const isEmpty = save.createdAt === save.lastPlayed && save.player.level === 1 && save.player.coins === 0;
        slots.push({
            index: i,
            isEmpty: isEmpty,
            data: save
        });
    }
    return slots;
}

function deleteSaveSlot(slotIndex) {
    const key = getSaveKey(slotIndex);
    if (!key) return false;
    localStorage.removeItem(key);
    return true;
}

// ============================================================
// CHARACTER SELECTION SCREEN
// ============================================================
function renderCharacterSlots() {
    const container = document.getElementById('characterSlots');
    if (!container) return;
    
    const slots = getAllSaveSlots();
    container.innerHTML = '';
    
    slots.forEach(slot => {
        const slotEl = document.createElement('div');
        slotEl.className = 'characterSlot' + (slot.isEmpty ? ' empty' : '');
        slotEl.dataset.index = slot.index;
        
        const data = slot.data;
        const player = data.player;
        const lastPlayed = new Date(data.lastPlayed);
        const lastPlayedStr = lastPlayed.toLocaleDateString('vi-VN') + ' ' + lastPlayed.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
        slotEl.innerHTML = `
            <div class="slotNumber">${slot.index + 1}</div>
            <div class="characterAvatar">${slot.isEmpty ? '+' : '🧙'}</div>
            <div class="characterName">${slot.isEmpty ? 'Tạo mới' : (userProfile?.name || 'Player')}</div>
            <div class="characterClass">${slot.isEmpty ? '' : 'Map ' + data.currentMap}</div>
            <div class="characterLevel">${slot.isEmpty ? '' : 'Cấp ' + player.level}</div>
            <div class="characterStats">
                <div class="characterStat">
                    <span class="characterStatLabel">HP</span>
                    <span class="characterStatValue">${player.hp}/${player.maxHp}</span>
                </div>
                <div class="characterStat">
                    <span class="characterStatLabel">Vàng</span>
                    <span class="characterStatValue">${player.coins}</span>
                </div>
                <div class="characterStat">
                    <span class="characterStatLabel">Lần chơi cuối</span>
                    <span class="characterStatValue">${slot.isEmpty ? 'Chưa chơi' : lastPlayedStr}</span>
                </div>
            </div>
            ${!slot.isEmpty ? `
                <button class="deleteCharacterBtn" data-index="${slot.index}" onclick="event.stopPropagation(); deleteCharacterConfirm(${slot.index})">🗑️</button>
            ` : ''}
        `;
        
        slotEl.addEventListener('click', () => selectCharacterSlot(slot.index, slot.isEmpty));
        container.appendChild(slotEl);
    });
}

function selectCharacterSlot(slotIndex, isEmpty) {
    currentSaveSlot = slotIndex;
    
    if (isEmpty) {
        // New character - create fresh save
        saveSaveData(slotIndex, getDefaultSaveData());
    }
    
    // Load the save data into game
    const saveData = loadSaveData(slotIndex);
    applySaveData(saveData);
    
    // Close menu and start game
    showCharacterSelect(false);
    startGame();
}

function deleteCharacterConfirm(slotIndex) {
    if (confirm('Xóa nhân vật slot ' + (slotIndex + 1) + '? Hành động này không thể hoàn tác!')) {
        deleteSaveSlot(slotIndex);
        renderCharacterSlots();
    }
}

function showCharacterSelect(show) {
    const mainMenu = document.getElementById('mainMenu');
    const loggedIn = document.getElementById('menuLoggedIn');
    const charSelect = document.getElementById('menuCharacterSelect');
    
    if (show) {
        loggedIn.classList.add('hidden');
        charSelect.classList.remove('hidden');
        renderCharacterSlots();
    } else {
        charSelect.classList.add('hidden');
        loggedIn.classList.remove('hidden');
    }
}

function applySaveData(saveData) {
    // Store save data globally for game to pick up
    window.currentSaveData = saveData;
    window.currentSaveSlot = currentSaveSlot;
    console.log('📂 Loaded save slot:', currentSaveSlot, saveData);
}

// ⭐ HIỂN THỊ LỖI CẤU HÌNH GOOGLE
function showGoogleConfigError() {
    const btn = document.getElementById('googleSignInBtn');
    if (btn) {
        btn.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #ff6666; background: rgba(255, 100, 100, 0.1); border-radius: 12px; border: 1px solid rgba(255, 100, 100, 0.3);">
                <div style="font-weight: bold; margin-bottom: 8px;">⚠️ Cần cấu hình Google Sign-In</div>
                <div style="font-size: 12px; color: #aaa;">Xem console (F12) để biết chi tiết</div>
            </div>
        `;
        btn.style.pointerEvents = 'none';
    }
}

// ⭐ HIỂN THỊ LỖI ĐĂNG NHẬP
function showSignInError(message) {
    const btn = document.getElementById('googleSignInBtn');
    if (btn) {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #ff6666; background: rgba(255, 100, 100, 0.1); border-radius: 12px; border: 1px solid rgba(255, 100, 100, 0.3);">
                <div style="font-weight: bold; margin-bottom: 8px;">❌ Đăng nhập thất bại</div>
                <div style="font-size: 12px; color: #aaa;">${message}</div>
            </div>
        `;
        setTimeout(() => {
            btn.innerHTML = originalHTML;
        }, 5000);
    }
}

// ⭐ XỬ LÝ KHI ĐĂNG NHẬP GOOGLE THÀNH CÔNG
function handleGoogleSignIn(response) {
    console.log('✅ Google Sign-In callback received');
    
    if (!response || !response.credential) {
        console.error('❌ No credential in response');
        showSignInError('Không nhận được thông tin đăng nhập từ Google');
        return;
    }

    try {
        // Decode JWT token để lấy thông tin user
        const payload = parseJwt(response.credential);
        
        if (!payload || !payload.sub) {
            throw new Error('Invalid token payload');
        }

        userProfile = {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
            given_name: payload.given_name,
            family_name: payload.family_name
        };

        // Lưu vào localStorage
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        localStorage.setItem('googleToken', response.credential);

        // Cập nhật UI
        showLoggedInState();
        
        console.log('👤 User:', userProfile.name, '(' + userProfile.email + ')');
    } catch (e) {
        console.error('❌ Handle Google Sign-In error:', e);
        showSignInError('Lỗi xử lý đăng nhập: ' + e.message);
    }
}

// ⭐ HIỂN THỊ TRẠNG THÁI ĐÃ ĐĂNG NHẬP
function showLoggedInState() {
    isLoggedIn = true;
    
    document.getElementById('menuLoggedOut').classList.add('hidden');
    document.getElementById('menuLoggedIn').classList.remove('hidden');
    
    if (userProfile) {
        const avatarEl = document.getElementById('userAvatar');
        const nameEl = document.getElementById('userName');
        const emailEl = document.getElementById('userEmail');
        
        if (userProfile.picture) {
            avatarEl.innerHTML = `<img src="${userProfile.picture}" alt="${userProfile.name}">`;
        } else {
            avatarEl.textContent = userProfile.name?.charAt(0)?.toUpperCase() || '?';
        }
        nameEl.textContent = userProfile.name || 'Player';
        emailEl.textContent = userProfile.email || '';
    }
}

// ⭐ HIỂN THỊ TRẠNG THÁI CHƯA ĐĂNG NHẬP
function showLoggedOutState() {
    isLoggedIn = false;
    userProfile = null;
    
    document.getElementById('menuLoggedIn').classList.add('hidden');
    document.getElementById('menuLoggedOut').classList.remove('hidden');
    
    // Clear Google Sign-In
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }
}

// ⭐ ĐĂNG XUẤT
function signOut() {
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.revoke(() => {
            console.log('🚪 Đã revoke Google session');
        });
        google.accounts.id.disableAutoSelect();
    }
    
    localStorage.removeItem('userProfile');
    localStorage.removeItem('googleToken');
    
    showLoggedOutState();
}

// ⭐ KHỞI TẠO MENU
function initMenu() {
    const mainMenu = document.getElementById('mainMenu');
    const gameContainer = document.getElementById('gameContainer');
    const playBtn = document.getElementById('playBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const backToMenuBtn = document.getElementById('backToMenuBtn');

    // Kiểm tra localStorage có user không
    const savedProfile = localStorage.getItem('userProfile');
    const savedToken = localStorage.getItem('googleToken');
    
    if (savedProfile && savedToken) {
        try {
            userProfile = JSON.parse(savedProfile);
            // Token có thể hết hạn, nhưng UI vẫn hiện logged in
            // Thực tế sẽ check khi gọi API backend
            showLoggedInState();
        } catch (e) {
            console.error('Parse saved profile error:', e);
            localStorage.removeItem('userProfile');
            localStorage.removeItem('googleToken');
            showLoggedOutState();
        }
    } else {
        showLoggedOutState();
    }

    // Event listeners
    playBtn.addEventListener('click', () => showCharacterSelect(true));
    settingsBtn.addEventListener('click', openMenuSettings);
    signOutBtn.addEventListener('click', signOut);
    backToMenuBtn.addEventListener('click', () => showCharacterSelect(false));

    // Khởi tạo Google Sign-In
    initGoogleSignIn();
}

// ⭐ BẮT ĐẦU GAME (sau khi chọn slot)
function startGame() {
    console.log('🎮 Bắt đầu game...');
    
    const mainMenu = document.getElementById('mainMenu');
    const gameContainer = document.getElementById('gameContainer');
    
    // Ẩn menu
    mainMenu.style.display = 'none';
    gameContainer.classList.remove('menuHidden');
    isMenuOpen = false;
    
    // Load save data after game is ready
    const tryLoadSave = () => {
        if (typeof window._gameReady !== 'undefined' && window._gameReady) {
            if (window.currentSaveData && typeof window.applySaveData === 'function') {
                window.applySaveData(window.currentSaveData);
                console.log('📂 Applied save data on game start');
            }
            
            // Resize canvas
            if (typeof resize === 'function') resize();
        } else {
            // Wait for game to be ready
            setTimeout(tryLoadSave, 100);
        }
    };
    
    tryLoadSave();
}

// ⭐ MỞ SETTINGS TỪ MENU CHÍNH
function openMenuSettings() {
    console.log('⚙️ Settings clicked from main menu');
    // Show the in-game settings panel
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
        settingsPanel.classList.add('open');
        document.body.classList.add('settings-open');
    }
}

// ⭐ EXPORT GLOBAL
window.initMenu = initMenu;
window.startGame = startGame;
window.signOut = signOut;
window.showLoggedInState = showLoggedInState;
window.showLoggedOutState = showLoggedOutState;
window.showCharacterSelect = showCharacterSelect;
window.deleteCharacterConfirm = deleteCharacterConfirm;
window.openMenuSettings = openMenuSettings;

console.log('🎮 gamemenu.js sẵn sàng!');