# 使用官方 Node.js 18 映像
FROM node:18-slim

# 安裝系統依賴和字體支援
RUN apt-get update && apt-get install -y \
    # Canvas 需要的依賴
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    # 字體支援
    fontconfig \
    fonts-liberation \
    fonts-dejavu-core \
    fonts-noto-core \
    fonts-noto-cjk \
    # 清理快取
    && rm -rf /var/lib/apt/lists/*

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝 Node.js 依賴
RUN npm install

# 複製應用程式碼
COPY . .

# 創建必要的目錄
RUN mkdir -p public/images/shares public/images/qrcodes logs

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=3001

# 開放端口
EXPOSE 3001

# 啟動應用
CMD ["npm", "start"]
