// ============================================================
// CHECKER - gamechecker.js
// ============================================================
console.log('🔍 Bắt đầu load gamechecker.js...');

const GAME_STATE = {
    aimLine: { active: false, angle: 0, length: 300 }
};

function getCurrentItem() {
    if (typeof inventory === 'undefined') return null;
    if (typeof selectedSlot === 'undefined') return null;
    return inventory[selectedSlot];
}

function checkCurrentFireMode() {
    const item = getCurrentItem();
    if (!item) return 'none';
    if (item.type === 'material') return 'none';
    return item.mode || 'auto';
}

// ============================================================
// JOYSTICK EVENTS - Gắn event listeners vào joystick
// ============================================================
function attachJoystickEvents() {
    if (!moveJoy || !fireJoy) {
        console.warn('⚠️ Joystick objects not ready, retrying...');
        setTimeout(attachJoystickEvents, 100);
        return;
    }
    if (!moveJoy.area || !fireJoy.area) {
        console.warn('⚠️ Joystick DOM elements not ready, retrying...');
        setTimeout(attachJoystickEvents, 100);
        return;
    }
    
    console.log('✅ Gắn event joystick');
    
    // Auto-attach if not already attached
    if (attachJoystickEvents._attached) return;
    attachJoystickEvents._attached = true;

    // Helper to get clientX/clientY from touch or mouse event
    function getClientPos(e) {
        if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        if (e.changedTouches && e.changedTouches.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        return { x: e.clientX, y: e.clientY };
    }

    // MOVE JOY - Touch events
    moveJoy.area.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (moveJoy.pointerId !== null) return;
        const touch = e.changedTouches[0];
        moveJoy.pointerId = touch.identifier;
        moveJoy.active = true;
        moveJoy.setPos(touch.clientX, touch.clientY);
    }, { passive: false });
    
    moveJoy.area.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (!moveJoy.active) return;
        for (let touch of e.changedTouches) {
            if (touch.identifier === moveJoy.pointerId) {
                moveJoy.setPos(touch.clientX, touch.clientY);
            }
        }
    }, { passive: false });
    
    moveJoy.area.addEventListener('touchend', function(e) {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            if (touch.identifier === moveJoy.pointerId) {
                moveJoy.active = false;
                moveJoy.pointerId = null;
                moveJoy.dirX = 0;
                moveJoy.dirY = 0;
                if (moveJoy.el) moveJoy.el.style.transform = 'translate(-50%, -50%)';
            }
        }
    }, { passive: false });
    
    moveJoy.area.addEventListener('touchcancel', function(e) {
        for (let touch of e.changedTouches) {
            if (touch.identifier === moveJoy.pointerId) {
                moveJoy.active = false;
                moveJoy.pointerId = null;
                moveJoy.dirX = 0;
                moveJoy.dirY = 0;
                if (moveJoy.el) moveJoy.el.style.transform = 'translate(-50%, -50%)';
            }
        }
    });

    // MOVE JOY - Mouse events (for desktop testing)
    moveJoy.area.addEventListener('mousedown', function(e) {
        if (moveJoy.pointerId !== null) return;
        moveJoy.pointerId = 'mouse';
        moveJoy.active = true;
        moveJoy.setPos(e.clientX, e.clientY);
    });
    
    window.addEventListener('mousemove', function(e) {
        if (!moveJoy.active || moveJoy.pointerId !== 'mouse') return;
        moveJoy.setPos(e.clientX, e.clientY);
    });
    
    window.addEventListener('mouseup', function(e) {
        if (!moveJoy.active || moveJoy.pointerId !== 'mouse') return;
        moveJoy.active = false;
        moveJoy.pointerId = null;
        moveJoy.dirX = 0;
        moveJoy.dirY = 0;
        if (moveJoy.el) moveJoy.el.style.transform = 'translate(-50%, -50%)';
    });

    // FIRE JOY
    fireJoy._hasFired = false;
    
    // FIRE JOY - Touch events
    fireJoy.area.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (fireJoy.pointerId !== null) return;
        const touch = e.changedTouches[0];
        if (touch.identifier === moveJoy.pointerId) return;
        fireJoy.pointerId = touch.identifier;
        fireJoy.active = true;
        fireJoy._hasFired = false;
        fireJoy.setPos(touch.clientX, touch.clientY);
        GAME_STATE.aimLine.active = false;
    }, { passive: false });
    
    fireJoy.area.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (!fireJoy.active) return;
        for (let touch of e.changedTouches) {
            if (touch.identifier === fireJoy.pointerId) {
                fireJoy.setPos(touch.clientX, touch.clientY);
                const mode = checkCurrentFireMode();
                if (mode === 'sniper') {
                    GAME_STATE.aimLine.active = true;
                    GAME_STATE.aimLine.angle = fireJoy.angle;
                }
            }
        }
    }, { passive: false });
    
    fireJoy.area.addEventListener('touchend', function(e) {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            if (touch.identifier === fireJoy.pointerId) {
                handleFireJoyRelease();
            }
        }
    }, { passive: false });
    
    fireJoy.area.addEventListener('touchcancel', function(e) {
        for (let touch of e.changedTouches) {
            if (touch.identifier === fireJoy.pointerId) {
                handleFireJoyRelease();
            }
        }
    });

    // FIRE JOY - Mouse events (for desktop testing)
    fireJoy.area.addEventListener('mousedown', function(e) {
        if (fireJoy.pointerId !== null) return;
        if (moveJoy.pointerId === 'mouse') return;
        fireJoy.pointerId = 'mouse';
        fireJoy.active = true;
        fireJoy._hasFired = false;
        fireJoy.setPos(e.clientX, e.clientY);
        GAME_STATE.aimLine.active = false;
    });
    
    window.addEventListener('mousemove', function(e) {
        if (!fireJoy.active || fireJoy.pointerId !== 'mouse') return;
        fireJoy.setPos(e.clientX, e.clientY);
        const mode = checkCurrentFireMode();
        if (mode === 'sniper') {
            GAME_STATE.aimLine.active = true;
            GAME_STATE.aimLine.angle = fireJoy.angle;
        }
    });
    
    window.addEventListener('mouseup', function(e) {
        if (!fireJoy.active || fireJoy.pointerId !== 'mouse') return;
        handleFireJoyRelease();
    });
    
    // ⭐ DESKTOP TESTING: Allow keyboard 'F' key to simulate fire joystick hold
    window.addEventListener('keydown', function(e) {
        if (e.code === 'KeyF' && !fireJoy.active) {
            fireJoy.pointerId = 'keyboard';
            fireJoy.active = true;
            fireJoy._hasFired = false;
            fireJoy.angle = 0; // Default angle (right)
            fireJoy.setPos(window.innerWidth * 0.75, window.innerHeight * 0.5);
            console.log('⌨️ Keyboard fire joystick activated (F key)');
        }
    });
    
    window.addEventListener('keyup', function(e) {
        if (e.code === 'KeyF' && fireJoy.pointerId === 'keyboard') {
            handleFireJoyRelease();
            console.log('⌨️ Keyboard fire joystick released (F key)');
        }
    });

    console.log('✅ Gắn event joystick xong!');
}

// Export for game.js to call
window.attachJoystickEvents = attachJoystickEvents;

// ============================================================
// XỬ LÝ THẢ JOYSTICK BẮN
// ============================================================
function handleFireJoyRelease() {
    if (fireJoy._hasFired) return;
    if (!fireJoy.active) return;
    
    fireJoy._hasFired = true;
    
    const finalAngle = fireJoy.angle;
    const item = getCurrentItem();
    
    console.log('🔥 Thả | Item:', item ? item.name : 'none');
    
    // ⭐ CHỈ KÍCH HOẠT TAP-TO-FIRE WEAPONS (sniper, shotgun, scythe, consumables)
    // Auto weapons bắn liên tục trong updateGame qua fireJoy.shouldFire()
    if (item && item.type !== 'material') {
        const isAutoWeapon = item.type === 'weapon' && item.mode === 'auto';
        
        if (!isAutoWeapon && typeof activateSniperItem === 'function') {
            activateSniperItem(item, finalAngle);
        }
        // Auto weapons: không làm gì khi thả - bắn liên tục trong updateGame
    }
    
    GAME_STATE.aimLine.active = false;
    fireJoy.active = false;
    fireJoy.pointerId = null;
    if (fireJoy.el) fireJoy.el.style.transform = 'translate(-50%, -50%)';
    if (fireJoy.indicator) fireJoy.indicator.classList.remove('active');
    
    setTimeout(function() {
        fireJoy._hasFired = false;
    }, 100);
}

fireJoy.shouldFire = function() {
    if (!this.active) return false;
    const mode = checkCurrentFireMode();
    if (mode !== 'auto') return false;
    this.counter++;
    if (this.counter >= this.fireRate) {
        this.counter = 0;
        return true;
    }
    return false;
};

// ⭐ FORCE ENABLE AUTO FIRE for testing - can be called from console
window.enableAutoFire = function() {
    if (fireJoy) {
        fireJoy.active = true;
        fireJoy.pointerId = 'keyboard';
        fireJoy.angle = 0;
        fireJoy.counter = 0;
        console.log('✅ Auto fire ENABLED via keyboard simulation');
    }
};

// ============================================================
// VẼ ĐƯỜNG CHỈ
// ============================================================
window.drawAimLine = function() {
    if (!GAME_STATE.aimLine.active) return;
    if (typeof fireJoy === 'undefined') return;
    if (!fireJoy.active) return;
    if (typeof Camera === 'undefined') return;
    if (typeof player === 'undefined') return;
    
    const step = (2 * Math.PI) / 64;
    const rounded = Math.round(GAME_STATE.aimLine.angle / step) * step;
    
    const start = Camera.toScreen(player.x, player.y);
    const endX = player.x + Math.cos(rounded) * GAME_STATE.aimLine.length;
    const endY = player.y + Math.sin(rounded) * GAME_STATE.aimLine.length;
    const end = Camera.toScreen(endX, endY);
    
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
};

// ============================================================
// SCROLLBAR KHO
// ============================================================
function initScrollbar() {
    const scroll = document.getElementById('inventoryScroll');
    const scrollbar = document.getElementById('inventoryScrollbar');
    const thumb = document.getElementById('inventoryScrollThumb');
    
    if (!scroll || !scrollbar || !thumb) {
        setTimeout(initScrollbar, 500);
        return;
    }
    
    console.log('✅ Scrollbar sẵn sàng');
    
    scroll.style.touchAction = 'pan-y';
    scroll.style.overflowY = 'auto';
    scroll.style.webkitOverflowScrolling = 'touch';
    
    let isDragging = false;
    let dragTouchId = null;
    let startY = 0;
    let startScrollTop = 0;
    
    function updateThumb() {
        const sh = scroll.scrollHeight;
        const ch = scroll.clientHeight;
        const st = scroll.scrollTop;
        
        if (sh <= ch) {
            thumb.style.display = 'none';
            return;
        }
        thumb.style.display = 'block';
        
        const ratio = ch / sh;
        const th = Math.max(30, scrollbar.clientHeight * ratio);
        const maxST = sh - ch;
        const maxTT = scrollbar.clientHeight - th;
        
        thumb.style.height = th + 'px';
        thumb.style.top = (maxST > 0 ? (st / maxST) * maxTT : 0) + 'px';
    }
    
    scroll.addEventListener('scroll', updateThumb);
    window.addEventListener('resize', updateThumb);
    
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
    
    thumb.addEventListener('touchend', function(e) {
        for (let touch of e.changedTouches) {
            if (touch.identifier === dragTouchId) {
                isDragging = false;
                dragTouchId = null;
            }
        }
    });
    
    thumb.addEventListener('touchcancel', function() {
        isDragging = false;
        dragTouchId = null;
    });
    
    scrollbar.addEventListener('touchstart', function(e) {
        if (e.target === thumb) return;
        e.preventDefault();
        const rect = scrollbar.getBoundingClientRect();
        const ratio = (e.touches[0].clientY - rect.top) / rect.height;
        scroll.scrollTop = ratio * (scroll.scrollHeight - scroll.clientHeight);
    }, { passive: false });
    
    setInterval(updateThumb, 500);
    setTimeout(updateThumb, 100);
}
// ============================================================
// 🟣 ORB DECADE - CHECKER TƯƠNG TÁC
// ============================================================

// ============================================================
// 🟣 ORB DECADE - KIỂM TRA KHOẢNG CÁCH
// ============================================================

function checkOrbDecadeInteraction() {

    const btn = document.getElementById('orbDecadeBtn');

    if (!btn) return;

    // Orb chưa được kích hoạt
    if (
        typeof orbDecadeActive === 'undefined' ||
        !orbDecadeActive
    ) {
        btn.style.display = 'none';
        return;
    }

    // Orb chỉ tồn tại ở Map 1
    if (
        typeof currentMap === 'undefined' ||
        currentMap !== 1
    ) {
        btn.style.display = 'none';
        return;
    }

    if (
        typeof player === 'undefined' ||
        !player
    ) {
        btn.style.display = 'none';
        return;
    }

    if (
        typeof ORB_DECADE === 'undefined'
    ) {
        btn.style.display = 'none';
        return;
    }

    const dx = player.x - ORB_DECADE.x;
    const dy = player.y - ORB_DECADE.y;

    const distance = Math.sqrt(
        dx * dx + dy * dy
    );

    // ========================================================
    // 👣 PLAYER ĐẾN GẦN ORB
    // ========================================================

    if (
        distance <= ORB_DECADE.interactDistance
    ) {

        btn.style.display = 'flex';

    } else {

        btn.style.display = 'none';

    }
}


// ============================================================
// 🏜️ CHUYỂN MAP
// ============================================================

function enterMap2() {

    if (currentMap === 2) return;

    const btn = document.getElementById('orbDecadeBtn');
    if (btn) btn.style.display = 'none';

    // ⭐ Chuyển map qua hiệu ứng fade (enterMap thật sự chạy ở giữa fade)
    if (typeof startMapTransition === 'function') {
        startMapTransition(2);
    } else {
        enterMap(2);
    }
}

// 🌀 Quay về map 1
function exitMap2() {

    if (currentMap === 1) return;

    if (typeof startMapTransition === 'function') {
        startMapTransition(1);
    } else {
        enterMap(1);
    }
}


// ============================================================
// 👆 NÚT ORB DECADE
// ============================================================

function initOrbDecadeButton() {
    const btn = document.getElementById('orbDecadeBtn');
    
    if (!btn) {
        console.warn('⚠️ Không tìm thấy orbDecadeBtn, thử lại sau...');
        setTimeout(initOrbDecadeButton, 500);
        return;
    }
    
    // Clone để xóa event cũ
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🟣 Orb Decade clicked - entering Map 2');
        enterMap2();
    });
    
    // Touch support
    newBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        enterMap2();
    }, { passive: false });
    
    console.log('🟣 Nút Orb Decade đã sẵn sàng!');
}


// ============================================================
// 🔄 CHECK MỖI FRAME
// ============================================================

function updateOrbDecadeChecker() {

    checkOrbDecadeInteraction();

}


// Khởi tạo nút
window.addEventListener(
    'load',
    function() {

        setTimeout(
            initOrbDecadeButton,
            300
        );

    }
);

// ============================================================
// SETTINGS PANEL - CAMERA ZOOM & GAME SETTINGS
// ============================================================
let settingsOpen = false;

// ⭐ HÀM MỞ SETTINGS - có thể gọi từ bất cứ đâu
function openSettingsPanel() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
        settingsPanel.classList.add('open');
        document.body.classList.add('settings-open');
        settingsOpen = true;
        
        // Update slider values from current state
        updateSettingsUI();
    }
}

// ⭐ HÀM ĐÓNG SETTINGS
function closeSettingsPanel() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
        settingsPanel.classList.remove('open');
        document.body.classList.remove('settings-open');
        settingsOpen = false;
    }
}

// ⭐ KHỞI TẠO SETTINGS PANEL VÀ NÚT SETTINGS
function initSettingsPanel() {
    console.log('⚙️ Khởi tạo Settings Panel...');
    
    const settingsBtn = document.getElementById('gameSettingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsClose = document.getElementById('settingsClose');
    
    if (!settingsBtn) {
        console.warn('⚠️ Không tìm thấy gameSettingsBtn, thử lại sau...');
        setTimeout(initSettingsPanel, 500);
        return;
    }
    
    if (!settingsPanel) {
        console.warn('⚠️ Không tìm thấy settingsPanel');
        return;
    }
    
    // ⭐ XÓA EVENT CŨ (nếu có) bằng cách clone nút
    const newSettingsBtn = settingsBtn.cloneNode(true);
    settingsBtn.parentNode.replaceChild(newSettingsBtn, settingsBtn);
    
    // Gắn event cho nút settings mới
    newSettingsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('⚙️ Settings button clicked');
        openSettingsPanel();
    });
    
    // Touch support
    newSettingsBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openSettingsPanel();
    }, { passive: false });
    
    // Close button
    if (settingsClose) {
        const newCloseBtn = settingsClose.cloneNode(true);
        settingsClose.parentNode.replaceChild(newCloseBtn, settingsClose);
        newCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeSettingsPanel();
        });
    }
    
    // Camera zoom controls
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const cameraZoomSlider = document.getElementById('cameraZoomSlider');
    const zoomValue = document.getElementById('zoomValue');
    const smoothCameraToggle = document.getElementById('smoothCameraToggle');
    
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => adjustCameraZoom(0.1));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => adjustCameraZoom(-0.1));
    
    if (cameraZoomSlider) {
        cameraZoomSlider.addEventListener('input', function() {
            const zoom = parseFloat(this.value);
            applyCameraZoom(zoom);
            if (zoomValue) zoomValue.textContent = Math.round(zoom * 100) + '%';
        });
    }
    
    if (smoothCameraToggle) {
        smoothCameraToggle.addEventListener('change', function() {
            window.smoothCameraEnabled = this.checked;
        });
    }
    
    // Volume controls
    const masterVolumeSlider = document.getElementById('masterVolumeSlider');
    const masterVolumeValue = document.getElementById('masterVolumeValue');
    const sfxVolumeSlider = document.getElementById('sfxVolumeSlider');
    const sfxVolumeValue = document.getElementById('sfxVolumeValue');
    const musicVolumeSlider = document.getElementById('musicVolumeSlider');
    const musicVolumeValue = document.getElementById('musicVolumeValue');
    
    if (masterVolumeSlider) {
        masterVolumeSlider.addEventListener('input', function() {
            const vol = parseFloat(this.value);
            if (masterVolumeValue) masterVolumeValue.textContent = Math.round(vol * 100) + '%';
            if (typeof window.setMasterVolume === 'function') window.setMasterVolume(vol);
        });
    }
    
    if (sfxVolumeSlider) {
        sfxVolumeSlider.addEventListener('input', function() {
            const vol = parseFloat(this.value);
            if (sfxVolumeValue) sfxVolumeValue.textContent = Math.round(vol * 100) + '%';
            if (typeof window.setSfxVolume === 'function') window.setSfxVolume(vol);
        });
    }
    
    if (musicVolumeSlider) {
        musicVolumeSlider.addEventListener('input', function() {
            const vol = parseFloat(this.value);
            if (musicVolumeValue) musicVolumeValue.textContent = Math.round(vol * 100) + '%';
            if (typeof window.setMusicVolume === 'function') window.setMusicVolume(vol);
        });
    }
    
    // Gameplay toggles
    const autoAttackToggle = document.getElementById('autoAttackToggle');
    const showDamageNumbersToggle = document.getElementById('showDamageNumbersToggle');
    const showFloatingTextToggle = document.getElementById('showFloatingTextToggle');
    
    if (autoAttackToggle) autoAttackToggle.addEventListener('change', () => { window.autoAttackEnabled = autoAttackToggle.checked; });
    if (showDamageNumbersToggle) showDamageNumbersToggle.addEventListener('change', () => { window.showDamageNumbers = showDamageNumbersToggle.checked; });
    if (showFloatingTextToggle) showFloatingTextToggle.addEventListener('change', () => { window.showFloatingText = showFloatingTextToggle.checked; });
    
    // Data buttons
    const saveGameBtn = document.getElementById('saveGameBtn');
    const exportSaveBtn = document.getElementById('exportSaveBtn');
    const importSaveBtn = document.getElementById('importSaveBtn');
    const importSaveFile = document.getElementById('importSaveFile');
    const resetGameBtn = document.getElementById('resetGameBtn');
    
    if (saveGameBtn) saveGameBtn.addEventListener('click', () => { if (typeof window.saveGame === 'function') window.saveGame(); });
    if (exportSaveBtn) exportSaveBtn.addEventListener('click', () => { if (typeof window.exportSave === 'function') window.exportSave(); });
    if (importSaveBtn) importSaveBtn.addEventListener('click', () => { if (importSaveFile) importSaveFile.click(); });
    if (importSaveFile) importSaveFile.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && typeof window.importSave === 'function') {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const data = JSON.parse(event.target.result);
                    window.importSave(data);
                } catch (err) {
                    console.error('Import save error:', err);
                    if (typeof showNotification === 'function') showNotification('❌ File save không hợp lệ!');
                }
            };
            reader.readAsText(file);
        }
        this.value = '';
    });
    if (resetGameBtn) resetGameBtn.addEventListener('click', function() {
        if (confirm('⚠️ CẢNH BÁO: Xóa toàn bộ dữ liệu game? Hành động này không thể hoàn tác!')) {
            if (typeof window.resetGame === 'function') window.resetGame();
        }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && settingsOpen) {
            closeSettingsPanel();
        }
    });
    
    console.log('⚙️ Settings panel initialized');
}

function openSettingsPanel() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
        settingsPanel.classList.add('open');
        document.body.classList.add('settings-open');
        settingsOpen = true;
        
        // Update slider values from current state
        updateSettingsUI();
    }
}

function closeSettingsPanel() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
        settingsPanel.classList.remove('open');
        document.body.classList.remove('settings-open');
        settingsOpen = false;
    }
}

function updateSettingsUI() {
    const cameraZoomSlider = document.getElementById('cameraZoomSlider');
    const zoomValue = document.getElementById('zoomValue');
    const smoothCameraToggle = document.getElementById('smoothCameraToggle');
    
    if (cameraZoomSlider && typeof window.cameraZoom !== 'undefined') {
        cameraZoomSlider.value = window.cameraZoom;
        if (zoomValue) zoomValue.textContent = Math.round(window.cameraZoom * 100) + '%';
    }
    
    if (smoothCameraToggle && typeof window.smoothCameraEnabled !== 'undefined') {
        smoothCameraToggle.checked = window.smoothCameraEnabled;
    }
}

function adjustCameraZoom(delta) {
    const cameraZoomSlider = document.getElementById('cameraZoomSlider');
    const zoomValue = document.getElementById('zoomValue');
    
    if (cameraZoomSlider) {
        const currentZoom = parseFloat(cameraZoomSlider.value);
        const newZoom = Math.max(0.5, Math.min(2, currentZoom + delta));
        cameraZoomSlider.value = newZoom;
        applyCameraZoom(newZoom);
        if (zoomValue) zoomValue.textContent = Math.round(newZoom * 100) + '%';
    }
}

function applyCameraZoom(zoom) {
    window.cameraZoom = zoom;
    // Apply zoom to canvas rendering
    if (typeof window.updateCameraZoom === 'function') {
        window.updateCameraZoom(zoom);
    }
    // Also apply via CSS transform on canvas container if needed
    const gameScreen = document.getElementById('gameScreen');
    if (gameScreen) {
        gameScreen.style.transform = `scale(${zoom})`;
        gameScreen.style.transformOrigin = 'center center';
    }
}

// Global functions for other modules to call
window.openSettingsPanel = openSettingsPanel;
window.closeSettingsPanel = closeSettingsPanel;
window.applyCameraZoom = applyCameraZoom;

console.log('🔍 gamechecker.js sẵn sàng!');

// Initialize settings panel after DOM ready
window.addEventListener('load', function() {
    setTimeout(initSettingsPanel, 500);
});