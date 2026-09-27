// ============================================================
// MAIN MENU & GOOGLE SIGN-IN - gamemenu.js
// ============================================================
console.log('🎮 Bắt đầu load gamemenu.js...');

// ⭐ TRẠNG THÁI MENU
let isMenuOpen = true;
let isLoggedIn = false;
let userProfile = null;

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
    playBtn.addEventListener('click', startGame);
    settingsBtn.addEventListener('click', openSettings);
    signOutBtn.addEventListener('click', signOut);

    // Khởi tạo Google Sign-In
    initGoogleSignIn();
}

// ⭐ BẮT ĐẦU GAME
function startGame() {
    console.log('🎮 Bắt đầu game...');
    
    const mainMenu = document.getElementById('mainMenu');
    const gameContainer = document.getElementById('gameContainer');
    
    // Ẩn menu
    mainMenu.style.display = 'none';
    gameContainer.classList.remove('menuHidden');
    isMenuOpen = false;
    
    // Trigger game ready nếu chưa
    if (typeof window._gameReady === 'undefined' || !window._gameReady) {
        // Game chưa load xong, đợi
        console.log('⏳ Đợi game load...');
    }
    
    // Resize canvas
    if (typeof resize === 'function') resize();
}

// ⭐ MỞ SETTINGS (placeholder)
function openSettings() {
    console.log('⚙️ Settings clicked - coming soon');
    alert('Settings coming soon! 🛠️');
}

// ⭐ EXPORT GLOBAL
window.initMenu = initMenu;
window.startGame = startGame;
window.signOut = signOut;
window.showLoggedInState = showLoggedInState;
window.showLoggedOutState = showLoggedOutState;

console.log('🎮 gamemenu.js sẵn sàng!');