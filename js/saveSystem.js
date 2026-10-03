// ============================================================
// SAVE SYSTEM - Unified save/load/sync module
// ============================================================
console.log('💾 Bắt đầu load saveSystem.js...');

const SaveSystem = (function() {
    // Private state
    let _userProfile = null;
    let _currentSaveSlot = null;
    let _currentSaveData = null;

    // Constants
    const SAVE_PREFIX = 'gameSave_';
    const SLOT_COUNT = 3;
    const PROFILE_KEY = 'userProfile';
    const TOKEN_KEY = 'googleToken';

    // Default save structure
    function getDefaultSaveData() {
        return {
            createdAt: Date.now(),
            lastPlayed: Date.now(),
            playTime: 0,
            player: {
                x: 7680, y: 5760,  // ⭐ GIỮA MAP MỚI 384x288
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

    // Parse JWT token (client-side only, no signature verification)
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

    // Get save key for user+slot
    function getSaveKey(slotIndex) {
        if (!_userProfile || !_userProfile.id) return null;
        return SAVE_PREFIX + _userProfile.id + '_' + slotIndex;
    }

    // Set user profile (called after Google sign-in)
    function setUserProfile(profile) {
        _userProfile = profile;
    }

    // Get user profile
    function getUserProfile() {
        return _userProfile;
    }

    // Check if Google token is expired (JWT exp claim)
    function isTokenExpired() {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return true;
        
        try {
            const payload = parseJwt(token);
            if (!payload || !payload.exp) return true;
            // exp is in seconds, Date.now() is in ms
            return payload.exp * 1000 < Date.now();
        } catch (e) {
            console.error('Check token expiry error:', e);
            return true;
        }
    }

    // Refresh Google token (requires user interaction)
    async function refreshToken() {
        if (typeof google === 'undefined' || !google.accounts) return false;
        
        return new Promise((resolve) => {
            google.accounts.id.initialize({
                client_id: '118193822223-sm6egk8s4tmei2868e5n6g2atd7npogj.apps.googleusercontent.com',
                callback: (response) => {
                    if (response && response.credential) {
                        const payload = parseJwt(response.credential);
                        if (payload && payload.sub) {
                            const profile = {
                                id: payload.sub,
                                name: payload.name,
                                email: payload.email,
                                picture: payload.picture,
                                given_name: payload.given_name,
                                family_name: payload.family_name
                            };
                            saveUserProfile(profile, response.credential);
                            resolve(true);
                        }
                    }
                    resolve(false);
                },
                auto_select: false,
                cancel_on_tap_outside: true
            });
            
            // Prompt user to re-authenticate
            google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    console.log('Google prompt not displayed/skipped');
                    resolve(false);
                }
            });
        });
    }

    // Load save data for a slot
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

    // Save data to localStorage
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

    // Get all save slots
    function getAllSaveSlots() {
        const slots = [];
        for (let i = 0; i < SLOT_COUNT; i++) {
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

    // Delete a save slot
    function deleteSaveSlot(slotIndex) {
        const key = getSaveKey(slotIndex);
        if (!key) return false;
        localStorage.removeItem(key);
        return true;
    }

    // Set current save slot
    function setCurrentSaveSlot(slotIndex) {
        _currentSaveSlot = slotIndex;
    }

    // Get current save slot
    function getCurrentSaveSlot() {
        return _currentSaveSlot;
    }

    // Set current save data
    function setCurrentSaveData(data) {
        _currentSaveData = data;
    }

    // Get current save data
    function getCurrentSaveData() {
        return _currentSaveData;
    }

    // Prepare save data for game start
    function prepareSaveData(slotIndex) {
        const saveData = loadSaveData(slotIndex);
        _currentSaveData = saveData;
        _currentSaveSlot = slotIndex;
        // Also set globals for backward compatibility with gamedrawcreate.js
        window.currentSaveData = saveData;
        window.currentSaveSlot = slotIndex;
        console.log('📂 Prepared save slot:', slotIndex);
        return saveData;
    }

    // Collect current game state for saving
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
            map2Visited: typeof map2Visited !== 'undefined' ? map2Visited : false,
            // ⭐ NEW: Save map state flags
            orbDecadeActive: typeof orbDecadeActive !== 'undefined' ? orbDecadeActive : false,
            spawnActive: typeof spawnActive !== 'undefined' ? spawnActive : false
        };
    }

    // Save game (localStorage + async n8n sync)
    function saveGame() {
        if (_currentSaveSlot === null && _currentSaveSlot !== 0) {
            console.warn('No save slot selected');
            if (typeof showNotification === 'function') showNotification('❌ Chưa chọn slot lưu!');
            return;
        }

        const saveData = collectGameState();
        if (!saveData) return;

        const key = SAVE_PREFIX + (_userProfile?.id || 'local') + '_' + _currentSaveSlot;
        const fullSave = {
            ...loadSaveData(_currentSaveSlot),
            ...saveData,
            lastPlayed: Date.now()
        };

        // Step 1: Save to localStorage first (cannot fail)
        try {
            localStorage.setItem(key, JSON.stringify(fullSave));
            console.log('💾 Đã lưu localStorage:', key);
            if (typeof showNotification === 'function') {
                showNotification('💾 Đã lưu game!');
            }
        } catch (e) {
            console.error('❌ Lỗi lưu localStorage:', e);
            if (typeof showNotification === 'function') {
                showNotification('❌ Lỗi lưu: ' + e.message);
            }
            return;
        }

        // Step 2: Sync to n8n after (async, non-blocking)
        if (typeof syncToN8n === 'function') {
            syncToN8n(fullSave, 'save').catch(err => {
                console.warn('⚠️ Sync n8n thất bại (không ảnh hưởng save local):', err);
            });
        }
    }

    // Load game from slot
    function loadGame(slotIndex) {
        const saveData = loadSaveData(slotIndex);
        if (saveData) {
            applySaveData(saveData);
            return true;
        }
        return false;
    }

    // Apply save data to game state
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

    // Export save as JSON file
    function exportSave() {
        const saveData = collectGameState();
        if (!saveData) return;

        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            user: _userProfile ? { name: _userProfile.name, email: _userProfile.email } : { name: 'Local', email: '' },
            saveSlot: _currentSaveSlot,
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
    }

    // Import save from JSON
    function importSave(data) {
        if (!data || !data.data) {
            if (typeof showNotification === 'function') showNotification('❌ Dữ liệu save không hợp lệ!');
            return;
        }

        applySaveData(data.data);

        if (_currentSaveSlot !== null && _currentSaveSlot !== undefined) {
            const key = SAVE_PREFIX + (_userProfile?.id || 'local') + '_' + _currentSaveSlot;
            localStorage.setItem(key, JSON.stringify({
                ...loadSaveData(_currentSaveSlot),
                ...data.data,
                lastPlayed: Date.now()
            }));
        }

        if (typeof showNotification === 'function') showNotification('📥 Đã nhập save!');
    }

    // Reset all game data
    function resetGame() {
        const userId = _userProfile?.id || 'local';
        for (let i = 0; i < SLOT_COUNT; i++) {
            localStorage.removeItem(SAVE_PREFIX + userId + '_' + i);
        }

        if (typeof player !== 'undefined') player.init();
        if (typeof inventory !== 'undefined') {
            inventory.fill(null);
            if (typeof initInventoryUI === 'function') initInventoryUI();
        }

        _currentSaveSlot = null;
        _currentSaveData = null;

        location.reload();
    }

    // Load user profile from localStorage
    function loadUserProfile() {
        const savedProfile = localStorage.getItem(PROFILE_KEY);
        const savedToken = localStorage.getItem(TOKEN_KEY);

        if (savedProfile && savedToken) {
            try {
                _userProfile = JSON.parse(savedProfile);
                return _userProfile;
            } catch (e) {
                console.error('Parse saved profile error:', e);
                localStorage.removeItem(PROFILE_KEY);
                localStorage.removeItem(TOKEN_KEY);
            }
        }
        return null;
    }

    // Save user profile to localStorage
    function saveUserProfile(profile, token) {
        _userProfile = profile;
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        localStorage.setItem(TOKEN_KEY, token);
    }

    // Clear user profile
    function clearUserProfile() {
        _userProfile = null;
        localStorage.removeItem(PROFILE_KEY);
        localStorage.removeItem(TOKEN_KEY);
    }

    // Public API
    return {
        // Constants
        SLOT_COUNT,
        SAVE_PREFIX,

        // User profile
        setUserProfile,
        getUserProfile,
        loadUserProfile,
        saveUserProfile,
        clearUserProfile,
        isTokenExpired,
        refreshToken,

        // Save slots
        getSaveKey,
        loadSaveData,
        saveSaveData,
        getAllSaveSlots,
        deleteSaveSlot,

        // Current session
        setCurrentSaveSlot,
        getCurrentSaveSlot,
        setCurrentSaveData,
        getCurrentSaveData,
        prepareSaveData,

        // Game state
        collectGameState,
        saveGame,
        loadGame,
        applySaveData,
        exportSave,
        importSave,
        resetGame,
        getDefaultSaveData
    };
})();

// Export global
window.SaveSystem = SaveSystem;
console.log('💾 saveSystem.js sẵn sàng!');