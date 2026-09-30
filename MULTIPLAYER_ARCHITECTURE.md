# Multiplayer Architecture Design - Acode-Link1

## Tổng quan
Game chuyển từ single-player sang **multiplayer co-op** (nhiều player cùng 1 map, fight boss chung). Cần tách biệt rõ ràng:
- **Per-player state** (cá nhân): character stats, inventory, position, progress
- **Map-level state** (chia sẻ): boss spawn, hypercube, map visited flags, world events

---

## 1. Phân loại State

### 1.1 Per-Player State (Lưu trên Airtable `Characters` + `Inventory Items`)
| Data | Nguồn | Đồng bộ |
|------|-------|---------|
| Profile (id, name, email, avatar) | Google OAuth | Login |
| Character stats (level, exp, hp, mp, coins) | Gameplay | Save/Auto-sync |
| Position (x, y) | Gameplay | Save/Auto-sync |
| Current Map | Gameplay | Save/Auto-sync |
| Inventory/Hotbar items | Gameplay | Save/Auto-sync |
| Kill count (cá nhân) | Gameplay | Save/Auto-sync |
| Play time | Gameplay | Save/Auto-sync |
| Selected slot | UI | Local only |

### 1.2 Map-Level State (Lưu trên Airtable `Map State` - 1 record/map)
| Data | Map | Cập nhật bởi | Đồng bộ |
|------|-----|--------------|---------|
| Boss Spawned | 1, 2 | Player đầu tiên trigger | Real-time (poll/websocket) |
| Boss HP (current) | 1, 2 | Tất cả player damage | Real-time |
| Hypercube Interacted | 1 | Player đầu tiên chạm | Real-time |
| Map 2 Visited | 2 | Player đầu tiên vào | Real-time |
| World events (orb active, portal open) | 1, 2 | Server/First player | Real-time |

### 1.3 Local-Only State (Không sync lên server)
| Data | Lý do |
|------|-------|
| Camera zoom, settings | Cá nhân preference |
| UI state (panel open/closed) | UX |
| Particle effects, visual only | Performance |
| Input state (joystick) | Real-time, không cần persist |

---

## 2. Đồng bộ dữ liệu (Sync Strategy)

### 2.1 Hiện tại: HTTP Polling qua n8n Webhook
```
Game Client → POST /webhook/save-game → n8n → Airtable
```
- **Ưu**: Đơn giản, hoạt động ngay với n8n self-hosted
- **Nhược**: Không real-time, delay ~30s-2min

### 2.2 Kế hoạch: WebSocket Server (Phase 2)
```
Game Client ←→ WebSocket Server ←→ Airtable (n8n webhook cho persist)
```
- WebSocket server (Node.js/Go) quản lý room theo Map ID
- Broadcast map state thay đổi real-time
- n8n vẫn dùng cho persist định kỳ + analytics

---

## 3. Cấu trúc Room/Map (Multiplayer)

### 3.1 Map Room Concept
```javascript
// Mỗi map = 1 room, nhiều player join được
const mapRooms = {
    1: {  // Thảo Nguyên
        players: new Map(), // userId -> { socket, characterData }
        state: {
            bossSpawned: false,
            bossHP: 3000,
            hypercubeInteracted: false,
            activePlayers: 0
        }
    },
    2: {  // Sa Mạc Sahara
        players: new Map(),
        state: {
            bossSpawned: false,
            bossHP: 5200,
            map2Visited: false,
            activePlayers: 0
        }
    }
};
```

### 3.2 Join/Leave Map
```javascript
// Player join map
function joinMap(playerId, mapId, characterData) {
    const room = mapRooms[mapId];
    room.players.set(playerId, { socket, characterData });
    room.state.activePlayers++;
    
    // Gửi state hiện tại cho player mới
    socket.emit('mapState', room.state);
    
    // Broadcast cho player khác
    socket.to(mapId).emit('playerJoined', { playerId, characterData });
}

// Player leave map
function leaveMap(playerId, mapId) {
    const room = mapRooms[mapId];
    room.players.delete(playerId);
    room.state.activePlayers--;
    socket.to(mapId).emit('playerLeft', { playerId });
}
```

### 3.3 Boss Fight Sync
```javascript
// Khi boss spawn
function spawnBoss(mapId, bossConfig) {
    const room = mapRooms[mapId];
    room.state.bossSpawned = true;
    room.state.bossHP = bossConfig.HP;
    room.state.bossMaxHP = bossConfig.HP;
    
    // Broadcast cho tất cả player trong map
    io.to(mapId).emit('bossSpawned', {
        boss: bossConfig,
        hp: room.state.bossHP
    });
    
    // Sync lên Airtable (n8n) để persist
    syncMapStateToAirtable(mapId, room.state);
}

// Player đánh boss
function onPlayerDamageBoss(playerId, mapId, damage) {
    const room = mapRooms[mapId];
    room.state.bossHP = Math.max(0, room.state.bossHP - damage);
    
    // Broadcast HP mới
    io.to(mapId).emit('bossHPUpdate', { hp: room.state.bossHP });
    
    if (room.state.bossHP <= 0) {
        onBossDefeated(mapId);
    }
}
```

---

## 4. Airtable Schema mở rộng (Multiplayer)

### 4.1 Characters (existing - per player)
```javascript
// Thêm field cho multiplayer
"Current Map": Number,           // Map ID player đang ở
"Player X": Number,              // Vị trí X
"Player Y": Number,              // Vị trí Y
"Last Map Join": Date time,      // Lần cuối join map
"Party ID": Single line text,    // ID nhóm (nếu có party system)
```

### 4.2 Map State (NEW - 1 record/map)
```javascript
// Table: Map State
{
    "Map ID": 1,
    "Map Name": "Thảo Nguyên",
    "Boss Spawned": false,
    "Boss HP": 3000,
    "Boss Max HP": 3000,
    "Hypercube Interacted": false,
    "Active Players": 0,
    "Player List": "userId1_slot0,userId2_slot1", // CSV of players in map
    "Last Updated": ISO datetime,
    "Last Event": "boss_spawned|hypercube_activated|player_joined"
}
```

### 4.3 World Events Log (NEW - audit trail)
```javascript
// Table: World Events
{
    "Event ID": "uuid",
    "Map ID": 1,
    "Event Type": "boss_spawned|boss_defeated|hypercube_activated|map2_first_visit",
    "Triggered By": "userId_slot",
    "Participants": ["userId1_slot0", "userId2_slot1"],
    "Timestamp": ISO datetime,
    "Details": { "bossName": "Demon Lord", "duration": 120000 }
}
```

---

## 5. Conflict Resolution (Multi-device/Same Account)

### 5.1 Strategy: "Last Write Wins" + Server Authority
```
Client A (phone)          Client B (PC)           Server/Airtable
    │                         │                       │
    ├─ Save (slot 0) ──────►  │                       │
    │                         ├─ Save (slot 0) ────►  │
    │                         │                       ├─ Merge: newer timestamp wins
    │                         │                       │
    │◄──── Sync ─────────────┤                       │
    │                         ◄──── Sync ────────────┤
```

### 5.2 Implementation
```javascript
// SaveSystem.js - thêm version/timestamp check
function saveGame() {
    const localSave = collectGameState();
    const serverSave = await fetchServerSave(currentSaveSlot);
    
    if (serverSave && serverSave.lastPlayed > localSave.lastPlayed) {
        // Server mới hơn - hỏi user hoặc auto-merge
        if (confirm('Có dữ liệu mới hơn trên server. Tải về?')) {
            applySaveData(serverSave);
            return;
        }
    }
    
    // Local mới hơn hoặc user chọn giữ local
    SaveSystem.saveSaveData(currentSaveSlot, localSave);
    syncToN8n(localSave, 'save');
}
```

---

## 6. Roadmap Implementation

### Phase 1: Foundation (Current - Done)
- [x] Unified SaveSystem module
- [x] n8n workflow với Map State table
- [x] Complete sync payload (bossSpawned, hypercubeInteracted, map2Visited)
- [x] Token expiry handling
- [x] CORS config

### Phase 2: Real-time Sync (Next)
- [ ] WebSocket server (Node.js + Socket.io)
- [ ] Map room management
- [ ] Real-time boss HP sync
- [ ] Player position broadcast (optional, cho thấy player khác)

### Phase 3: Party/Co-op Features
- [ ] Party system (invite, join, leave)
- [ ] Shared XP/loot distribution
- [ ] Revive teammate mechanic
- [ ] Voice/chat integration (Discord webhook)

### Phase 4: Advanced
- [ ] Leaderboard (Airtable view → web embed)
- [ ] Discord bot notifications (boss spawn, level 50, etc.)
- [ ] Daily/weekly challenges
- [ ] Cross-map events

---

## 7. Testing Checklist

### Single Player (Current)
- [ ] Google Sign-In → Select slot → Play → Save → Check Airtable
- [ ] Auto-save 30s / Auto-sync 2min hoạt động
- [ ] Export/Import JSON
- [ ] Reset game xóa sạch data

### Multiplayer (Future)
- [ ] 2 clients join map 1 → thấy nhau
- [ ] Client A trigger boss → Client B thấy boss spawn
- [ ] Cả 2 đánh boss → HP sync real-time
- [ ] Boss die → cả 2 nhận reward
- [ ] Client A interact hypercube → Client B thấy quái spawn
- [ ] Reconnect: join lại map, nhận state hiện tại

---

## 8. Files Modified/Summary

| File | Thay đổi |
|------|----------|
| `js/saveSystem.js` | **NEW** - Unified save module |
| `js/gamemenu.js` | Refactor: dùng SaveSystem, xóa duplicate |
| `js/gamedrawcreate.js` | Refactor: dùng SaveSystem, fix sync payload |
| `index.html` | Thêm load `saveSystem.js` trước `gamedrawcreate.js` |
| `n8n-workflow-game-save.json` | **UPDATED** - Thêm Map State table, player X/Y |
| `N8N_AIRTABLE_SETUP.md` | **UPDATED** - Thêm Map State table, CORS config |
| `MULTIPLAYER_ARCHITECTURE.md` | **NEW** - File này |

---

## 9. Next Steps cho bạn

1. **Test current flow**: Chạy game, đăng nhập Google, chọn slot, chơi, save → check Airtable
2. **Setup n8n**: Import `n8n-workflow-game-save.json`, tạo 3 tables Airtable theo docs
3. **Verify CORS**: n8n docker compose thêm `N8N_CORS_ORIGIN=*`
4. **Plan WebSocket server**: Khi cần real-time, setup Node.js + Socket.io server riêng

Cần mình support phần nào tiếp? (Test current flow, viết WebSocket server, hay setup n8n?)