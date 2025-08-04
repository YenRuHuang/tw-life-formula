# Hostinger 資料庫設定指南

## 步驟 1: 在 Hostinger 建立 MySQL 資料庫

1. 登入你的 Hostinger 控制面板
2. 找到「資料庫」或「MySQL 資料庫」選項
3. 點擊「建立新資料庫」
4. 輸入資料庫名稱，建議使用：`tw_life_formula`
5. 建立資料庫用戶（如果還沒有的話）
6. 記錄以下資訊：

## 步驟 2: 收集連接資訊

你需要收集以下資訊來填入 `.env` 文件：

```
資料庫主機 (DB_HOST): 通常是 localhost 或類似 mysql.hostinger.com
資料庫名稱 (DB_NAME): 你剛建立的資料庫名稱
用戶名稱 (DB_USER): 你的資料庫用戶名稱
密碼 (DB_PASSWORD): 你的資料庫密碼
端口 (DB_PORT): 通常是 3306
```

## 步驟 3: 更新 .env 文件

編輯專案根目錄的 `.env` 文件，填入真實的連接資訊：

```bash
# 資料庫配置 - 填入你的 Hostinger 資料庫資訊
DB_HOST=你的資料庫主機
DB_USER=你的用戶名稱
DB_PASSWORD=你的密碼
DB_NAME=tw_life_formula
DB_PORT=3306
```

## 步驟 4: 測試連接

執行以下命令來測試資料庫連接：

```bash
npm run db:test
```

如果連接成功，你會看到：
- ✅ 資料庫連接成功！
- 📊 MySQL 版本資訊
- 📋 現有資料表列表

## 步驟 5: 執行資料庫遷移

連接成功後，執行以下命令來建立資料表：

```bash
npm run db:migrate
```

## 步驟 6: 載入種子資料

執行以下命令來載入初始工具配置：

```bash
npm run db:seed
```

## 或者一次完成設定

你也可以使用以下命令一次完成遷移和種子資料載入：

```bash
npm run db:setup
```

## 常見問題

### 連接被拒絕 (ECONNREFUSED)
- 檢查資料庫主機地址和端口是否正確
- 確認 Hostinger 資料庫服務正在運行

### 存取被拒絕 (ER_ACCESS_DENIED_ERROR)
- 檢查用戶名稱和密碼是否正確
- 確認用戶有存取該資料庫的權限

### 找不到資料庫 (ER_BAD_DB_ERROR)
- 檢查資料庫名稱是否正確
- 確認資料庫已經建立

### 找不到主機 (ENOTFOUND)
- 檢查資料庫主機地址是否正確
- 確認網路連接正常

## 安全注意事項

1. **不要提交 .env 文件到 Git**
   - `.env` 文件已經在 `.gitignore` 中被排除
   - 絕對不要把資料庫密碼提交到版本控制

2. **使用強密碼**
   - 資料庫密碼應該包含大小寫字母、數字和特殊字符
   - 至少 12 個字符長度

3. **限制資料庫權限**
   - 只給應用程式需要的最小權限
   - 不要使用 root 用戶連接

## 下一步

資料庫設定完成後，你可以：

1. 啟動開發伺服器：`npm run dev`
2. 測試 API 端點：訪問 `http://localhost:3000/api/tools`
3. 查看管理後台：訪問 `http://localhost:3000/api/admin/dashboard`
