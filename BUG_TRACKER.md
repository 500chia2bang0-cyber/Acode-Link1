# 🐛 BUG TRACKER - Acode-Link1

## 📋 Danh sách bug và trạng thái

### 1. Auto weapons (Pistol/Rifle/Sword) không bắn được đạn
- **Trạng thái**: ❌ CHƯA FIX
- **Mô tả**: Giữ fire joystick không bắn auto, console không hiện log "🔫 Auto fire!"
- **Nguyên nhân khả dĩ**: `fireJoy.getAngle()` trả về null, `fireJoy.shouldFire()` không được gọi, hoặc event listeners không attach đúng
- **Cần làm**: 
  - [ ] Kiểm tra `fireJoy.active` được set true khi touch/mousedown
  - [ ] Kiểm tra `fireJoy.shouldFire()` logic
  - [ ] Thêm debug log chi tiết trong updateGame
  - [ ] Đảm bảo keyboard F key test hoạt động

### 2. NPC Shop mua đồ không đưa vào kho đồ
- **Trạng thái**: ❌ CHƯA FIX
- **Mô tả**: Mua đồ tại Shopkeeper/Smith → trừ coins/nguyên liệu nhưng item không xuất hiện trong inventory
- **Nguyên nhân khả dĩ**: `window.ITEMS` chưa export đúng, hoặc `addItemToInventory` không được gọi
- **Cần làm**:
  - [ ] Verify `window.ITEMS` tồn tại và có key đúng (pistol, railgun, plasma, etc.)
  - [ ] Verify `addItemToInventory` được gọi với template đúng
  - [ ] Thêm debug log trong `buyItem()` và `craftWeapon()`

### 3. Orb Decade không xuất hiện sau khi kill boss
- **Trạng thái**: ❌ CHƯA FIX
- **Yêu cầu mới**: Muốn Orb Decade **luôn xuất hiện** (dù chưa kill boss) để test dễ dàng
- **Mô tả**: `orbDecadeActive` không được set true, hoặc button không hiển thị
- **Cần làm**:
  - [ ] Set `orbDecadeActive = true` mặc định (không phụ thuộc boss kill)
  - [ ] Đảm bảo `checkOrbDecadeInteraction()` chạy mỗi frame
  - [ ] Verify `ORB_DECADE` position ở giữa map mới (192*40, 144*40)

### 4. Thông báo nhặt đồ spam gây FPS drop
- **Trạng thái**: ❌ CHƯA FIX
- **Mô tả**: Mỗi lần nhặt đồ hiện notification → spam khi nhặt nhiều item cùng lúc
- **Cần làm**:
  - [ ] Throttle notification: chỉ hiện 1 notification/loại item trong 1 khoảng thời gian
  - [ ] Gom nhóm notification: "Nhặt: Pistol x3" thay vì 3 notification riêng
  - [ ] Giới hạn tối đa notification cùng lúc (max 5)

### 5. FPS drop tổng thể
- **Trạng thái**: ⚠️ ĐANG THEO DÕI
- **Đã làm**: Giới hạn bullets (200), droppedItems (50), explosions (30), slashTrails (20), monsters (100), bossBullets (50)
- **Cần kiểm tra**: Memory leak, canvas transform reset, particle cleanup

---

## ✅ Bug đã fix (cập nhật khi xong)

- [ ] Auto weapons bắn được
- [ ] NPC Shop item vào kho
- [ ] Orb Decade luôn xuất hiện
- [ ] Notification throttle
- [ ] FPS ổn định

---

## 📝 Ghi chú kỹ thuật

### Load order scripts (index.html):
1. game.js - core, player, joystick init
2. game2.js - maps, NPCS, hypercube, ORB_DECADE
3. game3.js - monsters, spawn
4. game4.js - inventory, ITEMS (export window.ITEMS)
5. gamebullets.js - fire functions
6. gameitems.js - dropped items, pickups
7. gameboss.js - boss system
8. gamenpc.js - shop, smith, talk button
9. saveSystem.js - save/load
10. gamedrawcreate.js - drawGame, updateGame, applySaveData
11. gamechecker.js - joystick events, settings, scrollbar
12. gamemenu.js - menu, login

### Key global variables:
- `moveJoy`, `fireJoy` - joystick objects (created in game.js initJoysticks())
- `inventory` - 120 slots array
- `selectedSlot` - current hotbar slot
- `orbDecadeActive` - boolean
- `spawnActive` - boolean
- `currentMap` - 1 or 2
- `window.ITEMS` - item definitions (exported from game4.js)