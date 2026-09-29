
# Hướng dẫn setup n8n self-hosted + Airtable cho Game Save Sync

## 1. Chuẩn bị Airtable

### 1.1 Tạo Base mới
1. Vào https://airtable.com → **Add a base** → **Start from scratch**
2. Đặt tên: `Game Save Data`
3. Tạo 2 tables:

### 1.2 Table: `Characters` (Lưu thông tin nhân vật chính)
| Field Name | Type | Options |
|------------|------|---------|
| `User ID` | Single line text | Primary field, unique (format: `googleId_slotIndex`) |
| `Email` | Email | |
| `Name` | Single line text | |
| `Avatar URL` | URL | |
| `Save Slot` | Number | Integer (0,1,2) |
| `Character Name` | Single line text | |
| `Level` | Number | Integer |
| `EXP` | Number | Integer |
| `HP` | Number | Integer |
| `Max HP` | Number | Integer |
| `MP` | Number | Integer |
| `Max MP` | Number | Integer |
| `Coins` | Number | Integer |
| `Current Map` | Number | Integer (1-8) |
| `Play Time (ms)` | Number | Integer |
| `Kill Count` | Number | Integer |
| `Last Sync` | Date time | ISO format |
| `Created At` | Created time | Auto |

### 1.3 Table: `Inventory Items` (Lưu đồ vật - linked record)
| Field Name | Type | Options |
|------------|------|---------|
| `Item ID` | Single line text | Primary (vd: `railgun_slot0_user123`) |
| `Character` | Link to `Characters` | Allow multiple? No |
| `Item Name` | Single line text | |
| `Item Type` | Single select | weapon, material, consumable |
| `Rarity` | Single select | common, rare, epic, legendary |
| `Count` | Number | Integer |
| `Weapon Level` | Number | Integer (0-75) |
| `Damage` | Number | Integer |
| `Slot Type` | Single select | inventory, hotbar |
| `Slot Index` | Number | Integer |
| `Synced At` | Date time | ISO format |

---

## 2. Lấy API Key & Base ID

1. **Personal Access Token**: https://airtable.com/create/tokens
   - Name: `n8n Game Sync`
   - Scopes: `data.records:read`, `data.records:write`, `schema.bases:read`
   - Access: Base cụ thể `Game Save Data`
   - Copy token: `patXXXXXXXXXXXX.XXXXXXXXXXXX`

2. **Base ID**: Mở base Airtable → URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
   - Base ID = `appXXXXXXXXXXXXXX`

3. **Table Names**: `Characters`, `Inventory Items` (phải khớp chính xác)

---

## 3. Cài đặt n8n Self-hosted

### 3.1 Docker Compose (Khuyên dùng)
```yaml
# docker-compose.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=your-domain.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://your-domain.com/
      - GENERIC_TIMEZONE=Asia/Ho_Chi_Minh
    volumes:
      - n8n_data:/home/node/.n8n
    restart: unless-stopped

volumes:
  n8n_data:
```

Chạy: `docker-compose up -d`

### 3.2 Truy cập n8n
- Mở: `https://your-domain.com:5678`
- Tạo account admin đầu tiên

---

## 4. Tạo Workflow n8n

### 4.1 Import workflow JSON (Nhanh nhất)
Copy file `n8n-workflow-game-save.json` (xem dưới) → Import trong n8n.

### 4.2 Tạo thủ công (Step-by-step)

#### Node 1: **Webhook** (Trigger)
- **Webhook URL**: `/webhook/save-game` (hoặc tùy chỉnh)
- **HTTP Method**: POST
- **Response Mode**: On Received
- **Response Code**: 200
- **Response Data**: `{"success": true}`

#### Node 2: **Set** (Parse & Validate) - Tên: `Prepare Data`
```javascript
// Expressions cho các field chính
const userId = $json.user.id;
const email = $json.user.email;
const name = $json.user.name;
const saveSlot = $json.saveSlot;
const char = $json.character;
const stats = $json.stats;
const inventory = $json.inventory || [];
const hotbar = $json.hotbar || [];
const action = $json.action;
const timestamp = $json.timestamp;
```

**Output Fields**:
- `userId`, `email`, `name`, `saveSlot`, `action`, `timestamp`
- Tất cả field character: `char.level`, `char.exp`, `char.hp`, `char.maxHp`, `char.mp`, `char.maxMp`, `char.coins`, `char.currentMap`
- Stats: `stats.playTime`, `stats.killCount`, `stats.bossSpawned`, `stats.hypercubeInteracted`, `stats.map2Visited`
- `inventoryJson`: `{{ JSON.stringify($json.inventory) }}`
- `hotbarJson`: `{{ JSON.stringify($json.hotbar) }}`

#### Node 3: **Airtable** - Upsert Character
- **Operation**: Upsert
- **Base ID**: `{{ $credentials.airtableBaseId }}` (hoặc hardcode)
- **Table**: `Characters`
- **Key Field**: `User ID`
- **Key Value**: `{{ $json.userId }}_{{ $json.saveSlot }}` (Composite key: userId_slot)
- **Fields Mapping**:
  ```
  User ID: {{ $json.userId }}_{{ $json.saveSlot }}
  Email: {{ $json.email }}
  Name: {{ $json.name }}
  Save Slot: {{ $json.saveSlot }}
  Character Name: {{ $json.name }}
  Level: {{ $json.char.level }}
  EXP: {{ $json.char.exp }}
  HP: {{ $json.char.hp }}
  Max HP: {{ $json.char.maxHp }}
  MP: {{ $json.char.mp }}
  Max MP: {{ $json.char.maxMp }}
  Coins: {{ $json.char.coins }}
  Current Map: {{ $json.char.currentMap }}
  Play Time (ms): {{ $json.stats.playTime }}
  Kill Count: {{ $json.stats.killCount }}
  Boss Spawned: {{ $json.stats.bossSpawned }}
  Hypercube Interacted: {{ $json.stats.hypercubeInteracted }}
  Map 2 Visited: {{ $json.stats.map2Visited }}
  Last Sync: {{ new Date($json.timestamp).toISOString() }}
  ```

#### Node 4: **IF** - Check action
- **Condition**: `{{ $json.action === 'save' || $json.action === 'auto_sync' }}`
- **True**: Continue to Inventory sync
- **False**: End (chỉ log)

#### Node 5: **Code** - Prepare Inventory Items (True branch)
```javascript
// Node: Prepare Inventory Items
const items = [];

// Inventory items
if ($json.inventoryJson) {
  const inv = JSON.parse($json.inventoryJson);
  inv.forEach((item, idx) => {
    if (item) {
      items.push({
        'Item ID': `${item.id}_slot${idx}_${$json.userId}`,
        'Character': [$json.userId + '_' + $json.saveSlot], // Link to Characters record ID (sẽ map sau)
        'Item Name': item.name,
        'Item Type': item.type || 'material',
        'Rarity': item.rarity || 'common',
        'Count': item.count || 1,
        'Weapon Level': item.level || 0,
        'Damage': item.damage || 0,
        'Slot Type': 'inventory',
        'Slot Index': idx,
        'Synced At': new Date($json.timestamp).toISOString()
      });
    }
  });
}

// Hotbar items
if ($json.hotbarJson) {
  const hb = JSON.parse($json.hotbarJson);
  hb.forEach((item, idx) => {
    if (item) {
      items.push({
        'Item ID': `${item.id}_hotbar${idx}_${$json.userId}`,
        'Character': [$json.userId + '_' + $json.saveSlot],
        'Item Name': item.name,
        'Item Type': item.type || 'weapon',
        'Rarity': item.rarity || 'common',
        'Count': item.count || 1,
        'Weapon Level': item.level || 0,
        'Damage': item.damage || 0,
        'Slot Type': 'hotbar',
        'Slot Index': idx,
        'Synced At': new Date($json.timestamp).toISOString()
      });
    }
  });
}

return items.map(item => ({ json: item }));
```

#### Node 6: **Airtable** - Batch Upsert Inventory
- **Operation**: Upsert (Batch)
- **Base ID**: Same
- **Table**: `Inventory Items`
- **Key Field**: `Item ID`
- **Data**: Connect từ Node 5 output
- **Batch Size**: 50

#### Node 7: **Respond to Webhook** (Success)
- **Status Code**: 200
- **Body**: `{"success": true, "message": "Synced to Airtable"}`

#### Node 8: **Error Trigger** (Optional)
- Connect tất cả nodes → **Error Trigger** → **Slack/Discord/Email** notification

---

## 5. Cấu hình Credentials trong n8n

### 5.1 Airtable Credentials
1. n8n → **Credentials** → **New Credential** → **Airtable**
2. **Authentication**: Personal Access Token
3. **Token**: `patXXXXXXXXXXXX.XXXXXXXXXXXX` (từ bước 2)
4. **Base ID**: `appXXXXXXXXXXXXXX` (optional, có thể set ở node)
5. Test connection → Save

---

## 6. Cập nhật Game Code

### 6.1 Cập nhật Webhook URL
Mở `extracted/js/gamedrawcreate.js`, dòng đầu:
```javascript
const N8N_WEBHOOK_URL = 'https://your-n8n-domain.com/webhook/save-game';
// Thay bằng URL thực của n8n self-hosted
```

### 6.2 Test
1. Mở game, đăng nhập Google
2. Chọn slot → Play
3. Mở Settings (⚙️) → Save Game
4. Check n8n Execution log → Airtable records

---

## 7. Airtable Views hữu ích

### 7.1 Characters Table Views
- **Grid view**: Mặc định
- **Kanban view**: Group by `Current Map` (Map 1 vs Map 2)
- **Calendar view**: By `Last Sync`
- **Filter**: `Level > 10` (High level players)

### 7.2 Inventory Items Views
- **Group by**: `Slot Type` (Inventory vs Hotbar)
- **Filter**: `Weapon Level > 0` (Chỉ vũ khí đã nâng cấp)
- **Sort**: `Weapon Level` desc

---

## 8. Troubleshooting

### Lỗi thường gặp:

| Lỗi | Nguyên nhân | Fix |
|-----|-------------|-----|
| `401 Unauthorized` | Token sai/hết hạn | Tạo PAT mới ở Airtable |
| `404 Not Found` | Base ID/Table name sai | Check chính xác Base ID, Table name |
| `422 Unprocessable` | Field type mismatch | Check field types khớp (Number vs String) |
| `Link record not found` | Character record chưa tạo | Upsert Character trước, mới sync Inventory |
| `CORS Error` | Game chạy localhost, n8n domain khác | Config n8n `N8N_CORS_ORIGIN=*` hoặc proxy |

### Debug n8n:
1. Mở **Executions** tab
2. Click execution gần nhất → Xem input/output từng node
3. Dùng **Set node** để log biến trung gian

---

## 9. Workflow JSON Export (Import nhanh)

File: `n8n-workflow-game-save.json` - Import vào n8n → Workflows → Import

---

## 10. Mở rộng sau này

- **Leaderboard**: View Airtable sort by Level/Coins → Embed vào web
- **Discord Bot**: Webhook từ n8n gửi notify khi player lên cấp 50, kill boss
- **Backup**: Schedule workflow export Airtable → Google Drive/CSV hàng ngày
- **Analytics**: Metabase/Superset connect Airtable base