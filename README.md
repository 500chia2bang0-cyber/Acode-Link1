# Acode-Link1

**Top-down Action RPG** — Medieval × Cyberpunk × Fantasy  
*Single-player foundation → Multiplayer co-op vision*

---

## 🎮 Trạng thái hiện tại (v1.0 - Foundation)

### ✅ Đã hoàn thành (Core Systems)
- **Character & Camera**: Player movement, camera follow, map boundaries
- **Combat**: Pistol, Rifle, Shotgun, Sniper, Scythe, Plasma, Bomb, Potions
- **Enemies**: 5 slime types + Desert mobs (Mummy, Sandworm, Scorpion, Snake, Cactus)
- **Elite Monsters**: Stronger, faster, higher rewards
- **Boss System**: Map-specific bosses (Demon Lord Map 1, Sa Vương Map 2) với phase, pattern bắn
- **NPC Shopkeeper**: Buy/Sell (Common → Legendary), sell back 40% giá
- **NPC Smith**: Forge weapons với B-Token, upgrade lên cấp 75, craft Supreme (§§§)
- **Inventory & Hotbar**: Drag-drop, stackable consumables, weapon levels
- **Map System**: 2 maps (Thảo Nguyên, Sa Mạc Sahara) với portal 2 chiều
- **Special Mechanics**: Hypercube (4D block), Orb Decade, Map Transition effects

### ✅ Save & Sync System (NEW)
- **Google Sign-In**: OAuth 2.0 (Identity Services), JWT decode client-side
- **3 Character Slots/User**: `gameSave_{googleId}_{slotIndex}` localStorage
- **Auto-save**: 30s local, 2min sync to server
- **n8n + Airtable Backend**: Self-hosted n8n (localhost:5678) → Airtable
  - `Characters` table: Profile, stats, position, map
  - `Inventory Items` table: Linked records, weapon level, rarity, slot
  - `Map State` table: **Boss spawned, Hypercube interacted, Map 2 visited** (shared multiplayer state)
- **Export/Import JSON**: Backup/restore save file
- **Token Management**: Expiry check, refresh prompt

---

## 🌐 Multiplayer Vision (Đang thiết kế - Phase 2+)

> **Mục tiêu**: Nhiều player cùng 1 map, cùng fight boss, share world state

### Kiến trúc dữ liệu
| Loại State | Ví dụ | Lưu trữ | Đồng bộ |
|------------|-------|---------|---------|
| **Per-Player** | Level, HP, Inventory, Position, Coins | `Characters` + `Inventory Items` | Save/Auto-sync (HTTP) |
| **Map-Level (Shared)** | Boss HP, Boss spawned, Hypercube, Map visited | `Map State` (1 record/map) | **Real-time (WebSocket)** |
| **Local Only** | Camera zoom, UI settings, Particles | localStorage | Không sync |

### Luồng chơi Multiplayer
```
Player A join Map 1          Player B join Map 1
       │                           │
       ▼                           ▼
WebSocket Room "map_1" ◄──────► WebSocket Room "map_1"
       │                           │
       ├─ Player A trigger boss ──►│
       │     (broadcast)           │
       │◄────── Boss spawn ────────┤
       │                           │
       ├─ Damage boss (500) ──────►│
       │     (broadcast HP)        │
       │◄────── HP Update ─────────┤
       │                           │
       └──── Boss die (shared loot) ┘
```

### Roadmap Multiplayer
| Phase | Mục tiêu | Tech |
|-------|----------|------|
| **1 (Done)** | Foundation: Save system, n8n, Airtable, auth | HTTP polling |
| **2 (Next)** | WebSocket Server: Map rooms, real-time boss HP, player join/leave | Node.js + Socket.io |
| **3** | Party System: Invite, shared XP/loot, revive teammate | WebSocket + Airtable |
| **4** | Social: Leaderboard, Discord bot, Daily challenges | Airtable Views + Webhooks |

---

## 📁 Cấu trúc Project

```
Acode-Link1/
├── index.html              # Entry point, UI overlays
├── style.css               # Styling
├── js/
│   ├── saveSystem.js       # NEW: Unified save/load/sync module
│   ├── gamemenu.js         # Main menu, Google Sign-In, Character select
│   ├── gamedrawcreate.js   # Draw/Update loop, N8N sync payload
│   ├── game.js             # Core: Player, Joystick, UI, Sprites, Loop
│   ├── game2.js            # Map System v2: Registry, Portal, Transition, NPC
│   ├── game3.js            # Monsters: Slimes + Desert mobs, AI, Spawn
│   ├── game4.js            # Items: Weapons, Materials, Forge, Upgrade
│   ├── gameboss.js         # Boss: Spawn, Patterns, Phases, Rewards
│   ├── gamebullets.js      # Projectiles: Auto, Sniper, Shotgun, Scythe
│   ├── gameitems.js        # Dropped items, Consumables, Explosions
│   ├── gamenpc.js          # Shopkeeper, Smith UI & Logic
│   └── gamechecker.js      # Collision, Quest, Achievement checks
├── assets/sprites/         # PNG/GIF sprites
├── n8n-workflow-game-save.json    # Import vào n8n
├── N8N_AIRTABLE_SETUP.md   # Hướng dẫn setup backend
├── MULTIPLAYER_ARCHITECTURE.md    # Thiết kế multiplayer chi tiết
└── ProjectBossFight.zip    # Full game package
```

---

## 🛠️ Setup & Chạy

### 1. Game Client (Static)
```bash
# Serve folder (cần HTTPS cho Google OAuth)
npx serve . -l 8080 --ssl-cert cert.pem --ssl-key key.pem
# Hoặc dùng live server VS Code
```

### 2. n8n Self-hosted (Docker)
```yaml
# docker-compose.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://localhost:5678/
      - N8N_CORS_ORIGIN=*          # Quan trọng cho localhost game
      - GENERIC_TIMEZONE=Asia/Ho_Chi_Minh
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
```
```bash
docker-compose up -d
# Mở http://localhost:5678 → Import n8n-workflow-game-save.json
```

### 3. Airtable
- Tạo Base `Game Save Data`
- 3 Tables: `Characters`, `Inventory Items`, `Map State` (xem `N8N_AIRTABLE_SETUP.md`)
- Tạo Personal Access Token → Config n8n Credentials

### 4. Google Cloud Console
- Tạo OAuth 2.0 Client ID
- Authorized JavaScript origins: `http://localhost:8080`
- Cập nhật `CLIENT_ID` trong `js/gamemenu.js:57`

---

## 🎯 Tính năng nổi bật

| Hệ thống | Chi tiết |
|----------|----------|
| **Weapon Variety** | 8 loại súng + Scythe, mỗi loại mode riêng (auto/sniper/shotgun) |
| **Upgrade System** | Weapon Level 0→75, damage scale, Supreme tier (§§§) |
| **Boss Mechanics** | Multi-phase, pattern bullet, zone trigger (Map 2), kill threshold (Map 1) |
| **Map Design** | Procedural terrain + hand-crafted arena, portal 2 chiều, canopy/shadow |
| **Visual FX** | Slash trails, damage numbers, screen shake, 4D hypercube, portal animation |
| **Mobile Ready** | Dual joystick, touch controls, responsive UI, landscape lock |

---

## 📚 Tài liệu tham khảo
- `N8N_AIRTABLE_SETUP.md` — Setup backend chi tiết
- `MULTIPLAYER_ARCHITECTURE.md` — Kiến trúc multiplayer, schema, roadmap
- `n8n-workflow-game-save.json` — Workflow sẵn sàng import

---

## 👨‍💻 Tác giả
Dự án cá nhân — Phát triển từ single-player foundation hướng tới multiplayer co-op RPG.

*Made with ❤️ — Vanilla JS, Canvas 2D, n8n, Airtable*