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
// JOYSTICK EVENTS
// ============================================================
function initJoysticks() {
    if (typeof moveJoy === 'undefined' || typeof fireJoy === 'undefined') {
        setTimeout(initJoysticks, 100);
        return;
    }
    
    console.log('✅ Gắn event joystick');
    
    // MOVE JOY
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
                moveJoy.el.style.transform = 'translate(-50%, -50%)';
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
                moveJoy.el.style.transform = 'translate(-50%, -50%)';
            }
        }
    });
    
    // FIRE JOY
    fireJoy._hasFired = false;
    
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
    
    console.log('✅ Gắn event joystick xong!');
}

// ============================================================
// XỬ LÝ THẢ
// ============================================================
function handleFireJoyRelease() {
    if (fireJoy._hasFired) return;
    if (!fireJoy.active) return;
    
    fireJoy._hasFired = true;
    
    const finalAngle = fireJoy.angle;
    const item = getCurrentItem();
    
    console.log('🔥 Thả | Item:', item ? item.name : 'none');
    
    if (item && item.type !== 'material') {
        if (typeof activateSniperItem === 'function') {
            activateSniperItem(item, finalAngle);
        }
    }
    
    GAME_STATE.aimLine.active = false;
    fireJoy.active = false;
    fireJoy.pointerId = null;
    fireJoy.el.style.transform = 'translate(-50%, -50%)';
    fireJoy.indicator.classList.remove('active');
    
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

    // ⭐ TẮT ORB DECADE SAU KHI SỬ DỤNG
    orbDecadeActive = false;

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
// 👆 NÚT ORB
// ============================================================

function initOrbDecadeButton() {

    const btn =
        document.getElementById('orbDecadeBtn');

    if (!btn) {
        console.warn(
            '⚠️ Không tìm thấy orbDecadeBtn'
        );
        return;
    }

    btn.addEventListener(
        'click',
        function(e) {

            e.preventDefault();
            e.stopPropagation();

            enterMap2();

        }
    );

    console.log(
        '🟣 Nút Orb Decade đã sẵn sàng!'
    );
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
// KHỞI TẠO
// ============================================================
initJoysticks();

window.addEventListener('load', function() {
    setTimeout(initScrollbar, 500);
});

console.log('🔍 gamechecker.js sẵn sàng!');