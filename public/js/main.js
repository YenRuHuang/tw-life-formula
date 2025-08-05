// 全域變數
let currentUser = null;
let tools = [];

// DOM 載入完成後執行
document.addEventListener('DOMContentLoaded', async function () {
  try {
    // 初始化用戶會話
    await initializeUserSession();

    // 載入工具列表
    await loadTools();

    // 綁定事件監聽器
    bindEventListeners();

    console.log('台灣人生算式初始化完成');
  } catch (error) {
    console.error('初始化失敗:', error);
    showError('系統初始化失敗，請重新整理頁面');
  }
});

// 初始化用戶會話
async function initializeUserSession() {
  try {
    const response = await fetch('/api/users/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      currentUser = data.data;
      console.log('用戶會話建立成功:', currentUser);
    } else {
      throw new Error(data.error?.message || '會話建立失敗');
    }
  } catch (error) {
    console.error('用戶會話初始化失敗:', error);
    throw error;
  }
}

// 載入工具列表
async function loadTools() {
  try {
    const response = await fetch('/api/tools');
    const data = await response.json();

    if (data.success) {
      tools = data.data.tools;
      renderTools();
    } else {
      throw new Error(data.error?.message || '工具載入失敗');
    }
  } catch (error) {
    console.error('工具載入失敗:', error);
    showError('工具載入失敗，請重新整理頁面');
  }
}

// 渲染工具卡片
function renderTools() {
  const toolsGrid = document.getElementById('toolsGrid');

  if (!toolsGrid) {
    console.error('找不到工具網格容器');
    return;
  }

  toolsGrid.innerHTML = '';

  tools.forEach(tool => {
    const toolCard = createToolCard(tool);
    toolsGrid.appendChild(toolCard);
  });
}

// 建立工具卡片
function createToolCard(tool) {
  const card = document.createElement('div');
  card.className = 'tool-card';
  card.dataset.toolId = tool.id;

  card.innerHTML = `
        <span class="tool-icon">${tool.icon}</span>
        <h3 class="tool-name">${tool.name}</h3>
        <p class="tool-description">${tool.description}</p>
    `;

  card.addEventListener('click', () => openToolModal(tool));

  return card;
}

// 開啟工具模態框
function openToolModal(tool) {
  showInputForm(tool);
}

// 顯示輸入表單
function showInputForm(tool) {
  const modal = document.getElementById('resultModal');
  const resultContent = document.getElementById('resultContent');

  if (!modal || !resultContent) {
    console.error('找不到模態框');
    return;
  }

  // 生成動態輸入表單
  const formHTML = generateInputForm(tool);
  
  resultContent.innerHTML = `
    <h2>🧮 ${tool.name}</h2>
    <p class="tool-description-modal">${tool.description}</p>
    
    <form class="tool-input-form" id="toolForm-${tool.id}">
      ${formHTML}
      
      <div class="form-actions">
        <button type="submit" class="submit-btn">
          <span class="btn-icon">🚀</span>
          開始計算我的人生
        </button>
        <button type="button" class="demo-btn" onclick="fillDemoData('${tool.id}')">
          <span class="btn-icon">🎲</span>
          使用示範數據
        </button>
      </div>
    </form>
  `;

  // 綁定表單提交事件
  const form = document.getElementById(`toolForm-${tool.id}`);
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      executeToolWithFormData(tool, form);
    });
  }

  modal.style.display = 'block';
}

// 生成動態輸入表單
function generateInputForm(tool) {
  if (!tool.inputSchema) {
    return '<p>工具配置錯誤</p>';
  }

  let formHTML = '';
  
  Object.entries(tool.inputSchema).forEach(([fieldName, fieldConfig]) => {
    const isRequired = fieldConfig.required ? 'required' : '';
    const fieldId = `${tool.id}-${fieldName}`;
    
    formHTML += `<div class="form-group">`;
    formHTML += `<label for="${fieldId}" class="form-label">`;
    formHTML += `${fieldConfig.label}`;
    if (fieldConfig.required) formHTML += `<span class="required">*</span>`;
    formHTML += `</label>`;

    if (fieldConfig.type === 'number') {
      const min = fieldConfig.min !== undefined ? `min="${fieldConfig.min}"` : '';
      const max = fieldConfig.max !== undefined ? `max="${fieldConfig.max}"` : '';
      formHTML += `
        <input 
          type="number" 
          id="${fieldId}" 
          name="${fieldName}" 
          class="form-input" 
          ${isRequired} 
          ${min} 
          ${max}
          placeholder="請輸入${fieldConfig.label}"
        >
      `;
    } else if (fieldConfig.type === 'string' && fieldConfig.options) {
      formHTML += `<select id="${fieldId}" name="${fieldName}" class="form-select" ${isRequired}>`;
      formHTML += `<option value="">請選擇${fieldConfig.label}</option>`;
      fieldConfig.options.forEach(option => {
        const optionLabel = getOptionLabel(fieldName, option);
        formHTML += `<option value="${option}">${optionLabel}</option>`;
      });
      formHTML += `</select>`;
    } else {
      formHTML += `
        <input 
          type="text" 
          id="${fieldId}" 
          name="${fieldName}" 
          class="form-input" 
          ${isRequired}
          placeholder="請輸入${fieldConfig.label}"
        >
      `;
    }
    
    formHTML += `</div>`;
  });

  return formHTML;
}

// 獲取選項顯示標籤
function getOptionLabel(fieldName, option) {
  const optionLabels = {
    lifestyle_level: {
      'basic': '基本生活',
      'comfortable': '舒適生活', 
      'luxury': '奢華生活'
    },
    phone_brand: {
      'iPhone': 'iPhone',
      'Samsung': 'Samsung',
      'Google': 'Google Pixel',
      'Xiaomi': '小米',
      'Oppo': 'Oppo',
      'Vivo': 'Vivo',
      'Huawei': 'Huawei',
      'OnePlus': 'OnePlus',
      '其他': '其他品牌'
    }
  };

  return optionLabels[fieldName]?.[option] || option;
}

// 填入示範數據
// eslint-disable-next-line no-unused-vars
function fillDemoData(toolId) {
  const demoData = getMockInputData(toolId);
  
  Object.entries(demoData).forEach(([fieldName, value]) => {
    const fieldId = `${toolId}-${fieldName}`;
    const field = document.getElementById(fieldId);
    if (field) {
      field.value = value;
    }
  });
}

// 執行工具（使用表單資料）
async function executeToolWithFormData(tool, form) {
  const submitBtn = form.querySelector('.submit-btn');
  const originalBtnText = submitBtn.innerHTML;
  
  try {
    console.log('開始執行工具:', tool.name);
    
    // 更新按鈕狀態
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-icon">⏳</span>計算中...請稍候';
    submitBtn.classList.add('loading');

    // 顯示計算進度訊息
    showCalculationProgress('正在收集資料...');

    // 收集表單資料
    const formData = new FormData(form);
    const inputData = {};
    
    for (const [key, value] of formData.entries()) {
      // 轉換數字類型
      if (tool.inputSchema[key]?.type === 'number') {
        inputData[key] = parseFloat(value) || 0;
      } else {
        inputData[key] = value;
      }
    }

    console.log('收集到的輸入資料:', inputData);

    // 驗證必填欄位
    const validation = validateFormData(tool, inputData);
    if (!validation.isValid) {
      showInlineError(`輸入驗證失敗：${validation.errors.join(', ')}`);
      return;
    }

    showCalculationProgress('正在進行計算...');

    const response = await fetch(`/api/tools/${tool.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(inputData)
    });

    const data = await response.json();

    if (data.success) {
      showCalculationProgress('計算完成！正在生成結果...');
      // 稍微延遲一下讓用戶看到完成訊息
      setTimeout(() => {
        showResult(tool, data.data);
      }, 500);
    } else {
      throw new Error(data.error?.message || '計算失敗');
    }
  } catch (error) {
    console.error('工具執行失敗:', error);
    showInlineError('計算失敗，請檢查輸入資料後重試');
  } finally {
    // 恢復按鈕狀態
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
    submitBtn.classList.remove('loading');
    hideCalculationProgress();
  }
}

// 驗證表單資料
function validateFormData(tool, inputData) {
  const errors = [];
  
  Object.entries(tool.inputSchema).forEach(([fieldName, fieldConfig]) => {
    if (fieldConfig.required && (!inputData[fieldName] || inputData[fieldName] === '')) {
      errors.push(`${fieldConfig.label}為必填欄位`);
    }
    
    if (fieldConfig.type === 'number' && inputData[fieldName] !== undefined) {
      const value = parseFloat(inputData[fieldName]);
      if (isNaN(value)) {
        errors.push(`${fieldConfig.label}必須是數字`);
      } else {
        if (fieldConfig.min !== undefined && value < fieldConfig.min) {
          errors.push(`${fieldConfig.label}不能小於 ${fieldConfig.min}`);
        }
        if (fieldConfig.max !== undefined && value > fieldConfig.max) {
          errors.push(`${fieldConfig.label}不能大於 ${fieldConfig.max}`);
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

// 執行工具（使用模擬資料）
async function executeToolWithMockData(tool) {
  try {
    showLoading(true);

    // 模擬輸入資料
    const mockInputData = getMockInputData(tool.id);

    const response = await fetch(`/api/tools/${tool.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockInputData)
    });

    const data = await response.json();

    if (data.success) {
      showResult(tool, data.data);
    } else {
      throw new Error(data.error?.message || '計算失敗');
    }
  } catch (error) {
    console.error('工具執行失敗:', error);
    showError('計算失敗，請稍後再試');
  } finally {
    showLoading(false);
  }
}

// 獲取模擬輸入資料
function getMockInputData(toolId) {
  switch (toolId) {
    case 'moonlight-calculator':
      return {
        salary: 50000,
        expenses: 45000,
        savings: 5000
      };
    case 'noodle-survival':
      return {
        savings: 10000,
        monthly_expenses: 30000
      };
    case 'breakup-cost':
      return {
        relationship_months: 24,
        monthly_spending: 8000,
        shared_assets: 50000
      };
    case 'phone-lifespan':
      return {
        phone_age_months: 12,
        daily_usage_hours: 8,
        phone_brand: 'iPhone'
      };
    case 'housing-index':
      return {
        living_space: 25,
        rent_price: 20000,
        city: '台北市'
      };
    case 'escape-taipei':
      return {
        current_salary: 50000,
        target_city: '台中市',
        lifestyle_level: 'comfortable'
      };
    case 'car-vs-uber':
      return {
        car_price: 800000,
        monthly_fuel: 5000,
        monthly_trips: 30
      };
    case 'birthday-collision':
      return {
        birth_month: 6,
        birth_day: 15
      };
    default:
      return {};
  }
}

// 顯示結果
function showResult(tool, result) {
  const modal = document.getElementById('resultModal');
  const resultContent = document.getElementById('resultContent');

  if (!modal || !resultContent) {
    console.error('找不到結果模態框');
    return;
  }

  // 適配新的 ToolManager 結果格式
  const displayValue = result.result.value !== null ? result.result.value : 'N/A';
  const displayMessage = result.result.description || result.result.message || '計算完成';
  const suggestions = result.result.suggestions || [];

  resultContent.innerHTML = `
        <h2>${result.toolName || tool.name}</h2>
        <div class="result-value">${displayValue}${result.result.unit || ''}</div>
        <div class="result-level">${result.result.level || ''}</div>
        <div class="result-message">${displayMessage}</div>

        ${suggestions.length > 0 ? `
        <div class="result-suggestions">
            <h3>💡 改善建議</h3>
            <ul>
                ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        <div class="share-section">
            <h3>📤 分享你的結果</h3>
            <div class="share-buttons">
                <button class="share-btn facebook" onclick="shareWithImage('${tool.id}', 'facebook', ${JSON.stringify(result)})">
                    📘 Facebook
                </button>
                <button class="share-btn line" onclick="shareWithImage('${tool.id}', 'line', ${JSON.stringify(result)})">
                    💬 LINE
                </button>
                <button class="share-btn instagram" onclick="shareWithImage('${tool.id}', 'instagram', ${JSON.stringify(result)})">
                    📷 Instagram
                </button>
            </div>
            <div id="sharePreview" class="share-preview" style="display: none;">
                <img id="shareImage" alt="分享圖片預覽" />
                <div class="share-actions">
                    <button class="copy-link-btn" onclick="copyShareLink()">
                        🔗 複製連結
                    </button>
                    <button class="download-image-btn" onclick="downloadShareImage()">
                        💾 下載圖片
                    </button>
                </div>
            </div>
        </div>

        <div class="usage-info">
            <small>剩餘使用次數: ${result.usage.remaining === -1 ? '無限制' : result.usage.remaining}</small>
        </div>
    `;

  modal.style.display = 'block';
}

// 分享到 Facebook
// eslint-disable-next-line no-unused-vars
function shareToFacebook(toolName, message) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(`我剛用了「${toolName}」：${message} 你也來試試看！`);

  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
}

// 分享到 LINE
// eslint-disable-next-line no-unused-vars
function shareToLine(toolName, message) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(`我剛用了「${toolName}」：${message} 你也來試試看！ ${window.location.href}`);

  window.open(`https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
}

// 顯示載入動畫
function showLoading(show) {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = show ? 'flex' : 'none';
  }
}

// 顯示計算進度訊息
function showCalculationProgress(message) {
  console.log('顯示計算進度:', message);
  const resultContent = document.getElementById('resultContent');
  if (!resultContent) {
    console.log('找不到 resultContent 元素');
    return;
  }

  // 在表單下方添加進度訊息
  let progressDiv = document.getElementById('calculationProgress');
  if (!progressDiv) {
    progressDiv = document.createElement('div');
    progressDiv.id = 'calculationProgress';
    progressDiv.className = 'calculation-progress';
    resultContent.appendChild(progressDiv);
  }

  progressDiv.innerHTML = `
    <div class="progress-content">
      <div class="progress-spinner"></div>
      <div class="progress-text">${message}</div>
    </div>
  `;
  progressDiv.style.display = 'block';
}

// 隱藏計算進度
function hideCalculationProgress() {
  const progressDiv = document.getElementById('calculationProgress');
  if (progressDiv) {
    progressDiv.style.display = 'none';
  }
}

// 顯示內聯錯誤訊息（在表單內顯示）
function showInlineError(message) {
  console.log('顯示錯誤訊息:', message);
  const resultContent = document.getElementById('resultContent');
  if (!resultContent) {
    console.log('找不到 resultContent 元素');
    // 備用：使用 alert
    alert(message);
    return;
  }

  // 移除之前的錯誤訊息
  const existingError = document.getElementById('inlineError');
  if (existingError) {
    existingError.remove();
  }

  // 創建錯誤訊息元素
  const errorDiv = document.createElement('div');
  errorDiv.id = 'inlineError';
  errorDiv.className = 'inline-error';
  errorDiv.innerHTML = `
    <div class="error-content">
      <span class="error-icon">⚠️</span>
      <span class="error-text">${message}</span>
    </div>
  `;

  // 將錯誤訊息插入到表單前面
  const form = resultContent.querySelector('.tool-input-form');
  if (form) {
    resultContent.insertBefore(errorDiv, form);
  } else {
    resultContent.appendChild(errorDiv);
  }

  // 3秒後自動隱藏錯誤訊息
  setTimeout(() => {
    if (errorDiv && errorDiv.parentNode) {
      errorDiv.style.opacity = '0';
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.remove();
        }
      }, 300);
    }
  }, 3000);
}

// 顯示錯誤訊息（保留舊版本作為備用）
function showError(message) {
  showInlineError(message);
}

// 綁定事件監聽器
function bindEventListeners() {
  // 關閉模態框
  const closeModal = document.getElementById('closeModal');
  const modal = document.getElementById('resultModal');

  if (closeModal && modal) {
    closeModal.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    // 點擊模態框外部關閉
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  // ESC 鍵關閉模態框
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal && modal.style.display === 'block') {
      modal.style.display = 'none';
    }
  });
}

// 工具函數 - 將來會使用
// eslint-disable-next-line no-unused-vars
function formatNumber(num) {
  return new Intl.NumberFormat('zh-TW').format(num);
}

// eslint-disable-next-line no-unused-vars
function formatCurrency(amount) {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount);
}

// 新版分享功能 - 支持圖片生成
// eslint-disable-next-line no-unused-vars
async function shareWithImage(toolId, platform, result) {
  try {
    const shareBtn = event.target;
    const originalText = shareBtn.textContent;
    
    // 更新按鈕狀態
    shareBtn.disabled = true;
    shareBtn.textContent = '生成中...';
    
    // 生成分享圖片
    const imageResponse = await fetch(`/api/tools/${toolId}/share/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        result: result.result,
        platform: platform
      })
    });
    
    const imageData = await imageResponse.json();
    
    if (!imageData.success) {
      throw new Error(imageData.error?.message || '圖片生成失敗');
    }
    
    // 生成分享文案
    const contentResponse = await fetch(`/api/tools/${toolId}/share/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        result: result.result,
        platform: platform
      })
    });
    
    const contentData = await contentResponse.json();
    
    if (!contentData.success) {
      throw new Error(contentData.error?.message || '文案生成失敗');
    }
    
    // 顯示分享預覽
    showSharePreview(imageData.data, contentData.data);
    
    // 根據平台執行分享
    await executeShare(platform, imageData.data, contentData.data);
    
    // 記錄分享行為
    await recordShareAction(toolId, platform, 'share');
    
  } catch (error) {
    console.error('分享失敗:', error);
    showInlineError(`分享失敗：${error.message}`);
  } finally {
    // 恢復按鈕狀態
    if (shareBtn) {
      shareBtn.disabled = false;
      shareBtn.textContent = originalText;
    }
  }
}

// 顯示分享預覽
function showSharePreview(imageData, contentData) {
  const sharePreview = document.getElementById('sharePreview');
  const shareImage = document.getElementById('shareImage');
  
  if (sharePreview && shareImage) {
    shareImage.src = imageData.imagePath;
    shareImage.dataset.downloadUrl = imageData.imagePath;
    sharePreview.style.display = 'block';
    
    // 滾動到預覽區域
    sharePreview.scrollIntoView({ behavior: 'smooth' });
  }
}

// 執行分享到不同平台
async function executeShare(platform, imageData, contentData) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(contentData.content);
  
  switch (platform) {
    case 'facebook':
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
      break;
      
    case 'line':
      window.open(`https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
      break;
      
    case 'instagram':
      // Instagram 需要特殊處理，提示用戶手動分享
      showInstagramShareDialog(imageData.imagePath, contentData.content);
      break;
      
    default:
      throw new Error('不支援的分享平台');
  }
}

// Instagram 分享對話框
function showInstagramShareDialog(imagePath, content) {
  const dialog = document.createElement('div');
  dialog.className = 'instagram-share-dialog';
  dialog.innerHTML = `
    <div class="dialog-content">
      <h3>📷 Instagram 分享</h3>
      <p>Instagram 需要手動分享，請按照以下步驟：</p>
      <ol>
        <li>點擊「下載圖片」保存到相簿</li>
        <li>開啟 Instagram App</li>
        <li>選擇剛下載的圖片</li>
        <li>複製下方文案作為貼文內容</li>
      </ol>
      
      <div class="share-content">
        <label>分享文案：</label>
        <textarea readonly onclick="this.select()">${content}</textarea>
      </div>
      
      <div class="dialog-actions">
        <button onclick="downloadShareImage()" class="download-btn">💾 下載圖片</button>
        <button onclick="copyToClipboard('${content}')" class="copy-btn">📋 複製文案</button>
        <button onclick="closeInstagramDialog()" class="close-btn">關閉</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  // 自動選中文案
  const textarea = dialog.querySelector('textarea');
  setTimeout(() => textarea.select(), 100);
}

// 關閉 Instagram 對話框
// eslint-disable-next-line no-unused-vars
function closeInstagramDialog() {
  const dialog = document.querySelector('.instagram-share-dialog');
  if (dialog) {
    dialog.remove();
  }
}

// 複製分享連結
// eslint-disable-next-line no-unused-vars
function copyShareLink() {
  const url = window.location.href;
  copyToClipboard(url);
  showInlineError('連結已複製到剪貼簿！');
}

// 下載分享圖片
// eslint-disable-next-line no-unused-vars
function downloadShareImage() {
  const shareImage = document.getElementById('shareImage');
  if (shareImage && shareImage.dataset.downloadUrl) {
    const link = document.createElement('a');
    link.href = shareImage.dataset.downloadUrl;
    link.download = `台灣人生算式_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showInlineError('圖片下載完成！');
  }
}

// 複製到剪貼簿
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showInlineError('內容已複製到剪貼簿！');
    }).catch(() => {
      fallbackCopyToClipboard(text);
    });
  } else {
    fallbackCopyToClipboard(text);
  }
}

// 備用複製方法
function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    showInlineError('內容已複製到剪貼簿！');
  } catch (err) {
    console.error('複製失敗:', err);
    showInlineError('複製失敗，請手動複製');
  }
  
  document.body.removeChild(textArea);
}

// 記錄分享行為
async function recordShareAction(toolId, platform, action) {
  try {
    await fetch(`/api/tools/${toolId}/share/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        platform: platform,
        action: action
      })
    });
  } catch (error) {
    console.error('分享記錄失敗:', error);
    // 不影響用戶體驗，靜默失敗
  }
}
