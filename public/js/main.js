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
  // 暫時直接執行工具，後續會建立輸入表單
  executeToolWithMockData(tool);
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
        monthlyExpenses: 30000
      };
    case 'breakup-cost':
      return {
        relationshipMonths: 24,
        monthlySpending: 8000,
        sharedAssets: 50000
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

  resultContent.innerHTML = `
        <h2>${tool.name}</h2>
        <div class="result-value">${result.result.value}%</div>
        <div class="result-message">${result.result.message}</div>

        <div class="result-suggestions">
            <h3>💡 改善建議</h3>
            <ul>
                ${result.result.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
            </ul>
        </div>

        <div class="share-buttons">
            <button class="share-btn facebook" onclick="shareToFacebook('${tool.name}', '${result.result.message}')">
                分享到 Facebook
            </button>
            <button class="share-btn line" onclick="shareToLine('${tool.name}', '${result.result.message}')">
                分享到 LINE
            </button>
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

// 顯示錯誤訊息
function showError(message) {
  alert(message); // 暫時使用 alert，後續會改為更好的 UI
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
