#!/usr/bin/env node

/**
 * 測試 Google Gemini API 連接
 * 執行：node scripts/test-gemini-api.js
 */

require('dotenv').config();

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🧪 測試 Google Gemini API...');
  
  if (!apiKey || apiKey === '你的_API_KEY_在這裡') {
    console.error('❌ 錯誤：請先在 .env 文件中設置 GEMINI_API_KEY');
    console.log('📋 申請步驟：');
    console.log('1. 前往：https://makersuite.google.com/app/apikey');
    console.log('2. 用 Google 帳號登入');
    console.log('3. 點擊「Create API Key」');
    console.log('4. 複製 API Key 到 .env 文件');
    process.exit(1);
  }

  try {
    // 測試 Gemini API (使用最新的 Gemini 2.5 Flash 模型)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "請用繁體中文回答：你好，這是一個 API 連接測試。"
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API 請求失敗：', response.status, errorData);
      return;
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]) {
      console.log('✅ Gemini API 連接成功！');
      console.log('🤖 測試回應：', data.candidates[0].content.parts[0].text);
      console.log('');
      console.log('🎉 太好了！你的 API Key 可以正常使用');
      console.log('💡 現在可以啟動專案：npm run dev');
    } else {
      console.error('❌ API 回應格式異常：', data);
    }

  } catch (error) {
    console.error('❌ 測試失敗：', error.message);
    console.log('');
    console.log('🔧 可能的解決方案：');
    console.log('1. 檢查網路連接');
    console.log('2. 確認 API Key 是否正確');
    console.log('3. 檢查 API 配額是否足夠');
  }
}

// 執行測試
testGeminiAPI();
