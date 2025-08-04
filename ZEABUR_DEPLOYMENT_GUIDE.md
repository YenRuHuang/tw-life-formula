# 🚀 Zeabur 部署指引 - 台灣人生算式

## 📋 部署前準備

✅ **已完成項目：**
- zeabur.json 配置檔案已創建並推送到 GitHub
- 資料庫配置完成 (Hostinger MySQL)
- 所有必要的環境變數已準備
- Node.js 18+ 支援確認

## 🛠️ Zeabur 部署步驟

### 步驟 1: 登入 Zeabur Dashboard
1. 前往 [Zeabur Dashboard](https://dash.zeabur.com)
2. 使用您的 GitHub 帳戶登入

### 步驟 2: 創建新專案
1. 點擊 "Create Project" 或 "新增專案"
2. 專案名稱：`tw-life-formula`
3. 選擇地區：`Hong Kong` (低延遲)

### 步驟 3: 連接 GitHub Repository
1. 點擊 "Add Service" 或 "新增服務"
2. 選擇 "GitHub" 作為來源
3. 選擇您的 repository: `YenRuHuang/tw-life-formula`
4. 選擇分支：`main`

### 步驟 4: 設定環境變數
在 Zeabur 專案設定中，新增以下環境變數：

#### 🔐 資料庫配置
```
DB_HOST=srv502.hstgr.io
DB_USER=u959724721_twdb
DB_PASSWORD=TwLife2024
DB_NAME=u959724721_twdb
DB_PORT=3306
```

#### 🛡️ 安全設定
```
SESSION_SECRET=your_session_secret_at_least_32_characters_long_for_security
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters_long
BCRYPT_SALT_ROUNDS=12
```

#### ⚙️ 應用程式設定
```
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### 💰 變現設定 (後續新增)
```
GEMINI_API_KEY=(後續新增)
ADSENSE_PUBLISHER_ID=(後續新增)
ADSENSE_BANNER_SLOT=(後續新增)
ADSENSE_RECTANGLE_SLOT=(後續新增)
ADSENSE_MOBILE_SLOT=(後續新增)
STRIPE_PUBLISHABLE_KEY=(後續新增)
STRIPE_SECRET_KEY=(後續新增)
STRIPE_WEBHOOK_SECRET=(後續新增)
STRIPE_PRICE_ID=(後續新增)
PREMIUM_PRICE=99
PREMIUM_CURRENCY=TWD
```

#### 🌐 CORS 設定
```
ALLOWED_ORIGINS=https://your-zeabur-url.zeabur.app,https://twlifeformula.com
```

### 步驟 5: 確認部署設定
Zeabur 會自動偵測：
- ✅ 建置命令：`npm install`
- ✅ 啟動命令：`npm start`
- ✅ Node.js 18+ 環境
- ✅ 健康檢查：`/health` 端點

### 步驟 6: 開始部署
1. 點擊 "Deploy" 或 "部署"
2. 等待建置完成（約 2-3 分鐘）
3. 部署成功後會獲得 Zeabur URL

## ✅ 部署驗證

### 1. 健康檢查
訪問：`https://your-app.zeabur.app/health`
預期回應：
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

### 2. 資料庫連接測試
檢查 Zeabur 日誌，應該看到：
```
MySQL 資料庫連接成功
資料庫連接成功
🚀 台灣人生算式伺服器啟動成功！
```

### 3. API 端點測試
- 工具列表：`GET /api/tools`
- 用戶相關：`GET /api/users`
- 管理功能：`GET /api/admin`

## 🎯 部署後優勢

### ✅ **解決的問題：**
- 🚫 **端口衝突**：不再有本地端口佔用問題
- 🌐 **線上訪問**：隨時隨地可以訪問和展示
- 🔄 **自動部署**：Push 代碼自動更新
- 📱 **跨設備測試**：手機、平板都可以訪問
- 🤝 **團隊協作**：可以分享給他人測試

### 🚀 **開發流程：**
1. 本地開發代碼
2. `git push origin main`
3. Zeabur 自動部署
4. 線上測試新功能

## 🛠️ 常見問題解決

### Q: 部署失敗怎麼辦？
**A:** 檢查 Zeabur 日誌：
1. 進入專案 Dashboard
2. 點擊 "Deployments" 或"部署記錄"
3. 查看錯誤訊息
4. 常見問題：環境變數缺失、資料庫連接問題

### Q: 如何更新 CORS 設定？
**A:** 部署完成後：
1. 複製 Zeabur 提供的 URL
2. 更新環境變數 `ALLOWED_ORIGINS`
3. 重新部署

### Q: 如何查看應用程式日誌？
**A:** 
1. Zeabur Dashboard → 選擇服務
2. 點擊 "Logs" 標籤
3. 即時查看應用程式日誌

## 🎉 完成後步驟

部署成功後，您將獲得：
- 🌐 **線上 URL**：`https://your-app.zeabur.app`
- 📊 **即時監控**：CPU、記憶體使用情況
- 📝 **日誌查看**：即時應用程式日誌
- 🔄 **自動部署**：代碼更新自動生效

現在您可以：
1. 關閉本地 `npm run dev`
2. 直接使用 Zeabur 線上版本開發
3. 繼續進行任務3：實作 ToolManager 系統

---

**🎯 下一步：** 部署完成後，我們就可以開始實作任務3的核心工具管理系統，所有測試都在 Zeabur 上進行，不再有端口衝突問題！
