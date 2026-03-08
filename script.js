const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

const RECEIVER_WALLET = 'UQBwcw41wYAnPcQuHFtB9a_khXQLQR3LUCq5hMsyyQGuj37k';
const API_BASE = 'https://angelcase-backend-production-f2fc.up.railway.app';
const MANIFEST_URL = 'https://Pug97.github.io/angel-case-site/tonconnect-manifest.json';

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: MANIFEST_URL,
  buttonRootId: 'tonConnectButton'
});

const casesPage = document.getElementById('casesPage');
const caseDetailPage = document.getElementById('caseDetailPage');
const inventoryPage = document.getElementById('inventoryPage');
const profilePage = document.getElementById('profilePage');

const navCases = document.getElementById('navCases');
const navInventory = document.getElementById('navInventory');
const navProfile = document.getElementById('navProfile');
const pageSubtitle = document.getElementById('pageSubtitle');

const balanceBox = document.querySelector('.balance-box');
const balanceValue = document.getElementById('balanceValue');

const telegramName = document.getElementById('telegramName');
const telegramId = document.getElementById('telegramId');
const walletValue = document.getElementById('walletValue');

const topupAmount = document.getElementById('topupAmount');
const payTonBtn = document.getElementById('payTonBtn');
const depositInfo = document.getElementById('depositInfo');

const casesGrid = document.getElementById('casesGrid');
const caseDetailImage = document.getElementById('caseDetailImage');
const caseDetailTitle = document.getElementById('caseDetailTitle');
const caseDetailPrice = document.getElementById('caseDetailPrice');
const caseItemsGrid = document.getElementById('caseItemsGrid');
const openCaseBtn = document.getElementById('openCaseBtn');
const backToCasesBtn = document.getElementById('backToCasesBtn');

const inventoryList = document.getElementById('inventoryList');

const winPopup = document.getElementById('winPopup');
const popupItem = document.getElementById('popupItem');
const popupSubtext = document.getElementById('popupSubtext');
const claimBtn = document.getElementById('claimBtn');

let currentCase = null;
let balanceRevealTimer = null;
let isBalanceExpanded = false;

const appState = {
  balance: 0,
  wallet: '',
  userId: '',
  userName: 'Гость',
  cases: []
};

function setText(el, value) {
  if (el) el.textContent = value;
}

function formatShortBalance(value) {
  return `${Number(value || 0).toFixed(3)} TON`;
}

function formatFullBalance(value) {
  return `${Number(value || 0).toFixed(6)} TON`;
}

function renderBalance() {
  const shortValue = formatShortBalance(appState.balance);
  const fullValue = formatFullBalance(appState.balance);

  if (balanceValue) {
    balanceValue.textContent = isBalanceExpanded ? fullValue : shortValue;
    balanceValue.title = fullValue;
  }

  if (balanceBox) {
    balanceBox.title = `Полный баланс: ${fullValue}`;
  }
}

function expandBalanceTemporarily() {
  isBalanceExpanded = true;
  renderBalance();

  if (balanceRevealTimer) clearTimeout(balanceRevealTimer);

  balanceRevealTimer = setTimeout(() => {
    isBalanceExpanded = false;
    renderBalance();
  }, 2200);
}

function rarityLabel(rarity) {
  if (rarity === 'rare') return 'Rare';
  if (rarity === 'epic') return 'Epic';
  if (rarity === 'legendary') return 'Legendary';
  return 'Common';
}

function rarityClass(rarity) {
  if (rarity === 'rare') return 'rarity-rare';
  if (rarity === 'epic') return 'rarity-epic';
  if (rarity === 'legendary') return 'rarity-legendary';
  return 'rarity-common';
}

function rarityEmoji(rarity) {
  if (rarity === 'rare') return '💎';
  if (rarity === 'epic') return '✨';
  if (rarity === 'legendary') return '👑';
  return '🎁';
}

function giftClassFromRarity(rarity) {
  if (rarity === 'rare') return 'rare';
  if (rarity === 'epic') return 'epic';
  if (rarity === 'legendary') return 'legendary';
  return 'common';
}

function updateUI() {
  renderBalance();
  setText(telegramName, appState.userName);
  setText(telegramId, appState.userId || '—');
  setText(walletValue, appState.wallet || 'Не подключён');
}

function initTelegramUser() {
  const user = tg?.initDataUnsafe?.user;
  if (!user) {
    updateUI();
    return;
  }

  appState.userId = String(user.id || '');
  appState.userName = user.username
    ? `@${user.username}`
    : [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Пользователь';

  updateUI();
}

async function fetchProfile() {
  if (!appState.userId) return;

  try {
    const res = await fetch(`${API_BASE}/api/profile/${appState.userId}`);
    const data = await res.json();

    if (!res.ok) return;

    appState.balance = Number(data.balance || 0);
    appState.wallet = data.wallet_address || '';
    updateUI();
  } catch (e) {
    console.error('fetchProfile error:', e);
  }
}

async function fetchCases() {
  try {
    const res = await fetch(`${API_BASE}/api/cases`);
    const data = await res.json();

    if (!res.ok) return;

    appState.cases = data.cases || [];
    renderCases(appState.cases);
  } catch (e) {
    console.error('fetchCases error:', e);
  }
}

function renderCases(cases) {
  if (!casesGrid) return;

  if (!cases.length) {
    casesGrid.innerHTML = `<div class="inventory-empty">Пока кейсы не созданы</div>`;
    return;
  }

  casesGrid.innerHTML = cases.map(item => {
    return `
      <div class="case-tile" data-case-key="${item.case_key}">
        <div class="case-tile-image">${item.image || '🎁'}</div>
        <div class="case-tile-title">${item.title}</div>
      </div>
    `;
  }).join('');
}

function renderCaseDetail(caseData) {
  currentCase = caseData;

  setText(caseDetailImage, caseData.image || '🎁');
  setText(caseDetailTitle, caseData.title || 'Case');
  setText(caseDetailPrice, `${Number(caseData.price_ton || 0).toFixed(2)} TON`);

  const previewItems = (caseData.preview || []).length
    ? caseData.preview
    : [];

  if (!previewItems.length) {
    caseItemsGrid.innerHTML = `<div class="inventory-empty">Предметы ещё не добавлены</div>`;
    return;
  }

  caseItemsGrid.innerHTML = previewItems.map(item => {
    const itemImage =
      item.image ||
      (item.item_type === 'ton_balance' ? '💸' : rarityEmoji(item.rarity));

    return `
      <div class="case-item-card">
        <div class="case-item-image">${itemImage}</div>
        <div class="case-item-name">${item.item_name}</div>
        <div class="case-item-value">${Number(item.ton_value || 0).toFixed(3)} TON</div>
      </div>
    `;
  }).join('');
}

async function fetchInventory() {
  if (!appState.userId) return;

  try {
    const res = await fetch(`${API_BASE}/api/inventory/${appState.userId}`);
    const data = await res.json();

    if (!res.ok) return;
    renderInventory(data.items || []);
  } catch (e) {
    console.error('fetchInventory error:', e);
  }
}

function renderInventory(items) {
  if (!inventoryList) return;

  if (!items || !items.length) {
    inventoryList.innerHTML = `<div class="inventory-empty">Пока пусто</div>`;
    return;
  }

  inventoryList.innerHTML = items.map(item => {
    const date = item.created_at ? new Date(item.created_at).toLocaleString('ru-RU') : '';
    const sellDisabled = Number(item.can_sell) !== 1 || item.status !== 'owned';
    const withdrawDisabled = Number(item.can_withdraw) !== 1 || item.status !== 'owned';

    return `
      <div class="inventory-item">
        <div class="inventory-top">
          <div class="inventory-left">
            <div class="inventory-icon ${giftClassFromRarity(item.rarity)}">${item.image || rarityEmoji(item.rarity)}</div>
            <div class="inventory-main">
              <div class="inventory-name">${item.item_name}</div>
              <div class="inventory-meta">${Number(item.ton_value).toFixed(3)} TON • ${date}</div>
            </div>
          </div>
          <div class="inventory-rarity ${rarityClass(item.rarity)}">${rarityLabel(item.rarity)}</div>
        </div>

        <div class="inventory-actions">
          <button
            class="inventory-action-btn ${sellDisabled ? 'inventory-action-disabled' : 'inventory-action-sell'}"
            data-action="sell"
            data-id="${item.id}"
            ${sellDisabled ? 'disabled' : ''}
          >
            Продать
          </button>

          <button
            class="inventory-action-btn ${withdrawDisabled ? 'inventory-action-disabled' : 'inventory-action-withdraw'}"
            data-action="withdraw"
            data-id="${item.id}"
            ${withdrawDisabled ? 'disabled' : ''}
          >
            Вывести
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function showPage(page) {
  if (casesPage) casesPage.classList.remove('active');
  if (caseDetailPage) caseDetailPage.classList.remove('active');
  if (inventoryPage) inventoryPage.classList.remove('active');
  if (profilePage) profilePage.classList.remove('active');

  if (navCases) navCases.classList.remove('active');
  if (navInventory) navInventory.classList.remove('active');
  if (navProfile) navProfile.classList.remove('active');

  if (page === 'cases') {
    if (casesPage) casesPage.classList.add('active');
    if (navCases) navCases.classList.add('active');
    setText(pageSubtitle, 'Кейсы');
  }

  if (page === 'caseDetail') {
    if (caseDetailPage) caseDetailPage.classList.add('active');
    setText(pageSubtitle, currentCase?.title || 'Кейс');
  }

  if (page === 'inventory') {
    if (inventoryPage) inventoryPage.classList.add('active');
    if (navInventory) navInventory.classList.add('active');
    setText(pageSubtitle, 'Инвентарь');
    fetchInventory();
  }

  if (page === 'profile') {
    if (profilePage) profilePage.classList.add('active');
    if (navProfile) navProfile.classList.add('active');
    setText(pageSubtitle, 'Профиль');
  }
}

function showWinPopup(prize, itemType, tonValue) {
  setText(popupItem, prize);

  if (popupSubtext) {
    if (itemType === 'ton_balance') {
      popupSubtext.textContent = `На баланс начислено ${Number(tonValue).toFixed(3)} TON`;
    } else {
      popupSubtext.textContent = `Предмет добавлен в инвентарь • ${Number(tonValue).toFixed(3)} TON`;
    }
  }

  if (winPopup) winPopup.style.display = 'flex';
}

async function openCurrentCase() {
  if (!currentCase || !appState.userId) return;

  try {
    openCaseBtn.disabled = true;
    openCaseBtn.textContent = 'Открываем...';

    const res = await fetch(`${API_BASE}/api/cases/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: appState.userId,
        username: appState.userName,
        caseKey: currentCase.case_key
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Ошибка открытия кейса');
      return;
    }

    appState.balance = Number(data.newBalance || 0);
    updateUI();
    fetchInventory();

    showWinPopup(data.prize, data.itemType, data.tonValue);
  } catch (e) {
    console.error('openCurrentCase error:', e);
    alert('Ошибка соединения с backend');
  } finally {
    openCaseBtn.disabled = false;
    openCaseBtn.textContent = 'Открыть';
  }
}

async function sellInventoryItem(inventoryId) {
  try {
    const res = await fetch(`${API_BASE}/api/inventory/sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: appState.userId,
        inventoryId
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Не удалось продать предмет');
      return;
    }

    appState.balance = Number(data.newBalance || 0);
    updateUI();
    fetchInventory();
  } catch (e) {
    console.error('sellInventoryItem error:', e);
  }
}

async function withdrawInventoryItem(inventoryId) {
  try {
    const res = await fetch(`${API_BASE}/api/inventory/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: appState.userId,
        inventoryId
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Не удалось создать заявку на вывод');
      return;
    }

    alert('Заявка на вывод создана');
    fetchInventory();
  } catch (e) {
    console.error('withdrawInventoryItem error:', e);
  }
}

async function pollDeposit(orderId) {
  let attempts = 0;
  const maxAttempts = 36;

  const timer = setInterval(async () => {
    attempts++;

    try {
      const res = await fetch(`${API_BASE}/api/deposits/${orderId}`);
      const data = await res.json();

      if (res.ok && data.status === 'confirmed') {
        clearInterval(timer);

        if (depositInfo) {
          depositInfo.textContent =
            `Пополнение подтверждено.\n` +
            `Заказ: ${orderId}\n` +
            `Начислено: ${Number(data.amount).toFixed(6)} TON`;
        }

        await fetchProfile();
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(timer);

        if (depositInfo) {
          depositInfo.textContent =
            `Платёж отправлен, но подтверждение ещё не найдено.\n` +
            `Заказ: ${orderId}\n` +
            `Проверь баланс позже.`;
        }
      }
    } catch (e) {
      if (attempts >= maxAttempts) clearInterval(timer);
    }
  }, 5000);
}

async function payTon() {
  const amount = Number(topupAmount?.value);

  if (!tonConnectUI.account?.address) {
    alert('Сначала подключи TON-кошелёк');
    return;
  }

  if (!amount || amount <= 0) {
    alert('Введите сумму');
    return;
  }

  if (!appState.userId) {
    alert('Не удалось получить Telegram ID');
    return;
  }

  try {
    if (payTonBtn) {
      payTonBtn.disabled = true;
      payTonBtn.textContent = 'Создание заказа...';
    }

    const createRes = await fetch(`${API_BASE}/api/deposits/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: appState.userId,
        username: appState.userName,
        amount
      })
    });

    const order = await createRes.json();

    if (!createRes.ok) {
      alert(order.error || 'Не удалось создать пополнение');
      return;
    }

    if (depositInfo) {
      depositInfo.textContent =
        `Заказ создан.\n` +
        `Заказ: ${order.orderId}\n` +
        `Ты ввёл: ${Number(order.requestedAmount).toFixed(2)} TON\n` +
        `К оплате точно: ${Number(order.exactAmount).toFixed(6)} TON`;
    }

    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 300,
      messages: [
        {
          address: RECEIVER_WALLET,
          amount: order.exactNano
        }
      ]
    };

    await tonConnectUI.sendTransaction(tx);

    if (depositInfo) {
      depositInfo.textContent =
        `Платёж отправлен.\n` +
        `Заказ: ${order.orderId}\n` +
        `Точная сумма: ${Number(order.exactAmount).toFixed(6)} TON\n` +
        `Ожидаем подтверждение сети...`;
    }

    if (topupAmount) topupAmount.value = '';
    pollDeposit(order.orderId);
  } catch (e) {
    console.error('payTon error:', e);

    if (depositInfo) {
      depositInfo.textContent =
        'Платёж был отменён или кошелёк вернул ошибку.';
    }
  } finally {
    if (payTonBtn) {
      payTonBtn.disabled = false;
      payTonBtn.textContent = 'Отправить TON';
    }
  }
}

function bindEvents() {
  if (navCases) navCases.addEventListener('click', () => showPage('cases'));
  if (navInventory) navInventory.addEventListener('click', () => showPage('inventory'));
  if (navProfile) navProfile.addEventListener('click', () => showPage('profile'));

  if (backToCasesBtn) {
    backToCasesBtn.addEventListener('click', () => showPage('cases'));
  }

  if (openCaseBtn) {
    openCaseBtn.addEventListener('click', openCurrentCase);
  }

  if (balanceBox) {
    balanceBox.addEventListener('click', expandBalanceTemporarily);
  }

  if (claimBtn) {
    claimBtn.addEventListener('click', () => {
      if (winPopup) winPopup.style.display = 'none';
    });
  }

  if (payTonBtn) {
    payTonBtn.addEventListener('click', payTon);
  }

  if (casesGrid) {
    casesGrid.addEventListener('click', e => {
      const tile = e.target.closest('.case-tile');
      if (!tile) return;

      const caseKey = tile.dataset.caseKey;
      const caseData = appState.cases.find(item => item.case_key === caseKey);

      if (!caseData) return;

      renderCaseDetail(caseData);
      showPage('caseDetail');
    });
  }

  if (inventoryList) {
    inventoryList.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const inventoryId = Number(btn.dataset.id);

      if (action === 'sell') {
        sellInventoryItem(inventoryId);
      }

      if (action === 'withdraw') {
        withdrawInventoryItem(inventoryId);
      }
    });
  }

  tonConnectUI.onStatusChange(async wallet => {
    try {
      if (wallet?.account?.address) {
        appState.wallet = wallet.account.address;
        updateUI();

        if (appState.userId) {
          await fetch(`${API_BASE}/api/profile/bind-wallet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId: appState.userId,
              username: appState.userName,
              wallet: wallet.account.address
            })
          });

          await fetchProfile();
        }
      } else {
        appState.wallet = '';
        updateUI();
      }
    } catch (e) {
      console.error('bind wallet error:', e);
    }
  });
}

function initApp() {
  initTelegramUser();
  updateUI();
  fetchProfile();
  fetchCases();
  fetchInventory();
  showPage('cases');
  bindEvents();
}

initApp();
