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
const inventoryPage = document.getElementById('inventoryPage');
const profilePage = document.getElementById('profilePage');
const roulettePage = document.getElementById('roulettePage');

const navCases = document.getElementById('navCases');
const navInventory = document.getElementById('navInventory');
const navProfile = document.getElementById('navProfile');
const pageSubtitle = document.getElementById('pageSubtitle');

const balanceValue = document.getElementById('balanceValue');
const balanceBox = document.querySelector('.balance-box');
const telegramName = document.getElementById('telegramName');
const telegramId = document.getElementById('telegramId');
const walletValue = document.getElementById('walletValue');

const topupAmount = document.getElementById('topupAmount');
const payTonBtn = document.getElementById('payTonBtn');
const depositInfo = document.getElementById('depositInfo');
const inventoryList = document.getElementById('inventoryList');

const itemsContainer = document.getElementById('items');
const spinSound = document.getElementById('spinSound');
const openCaseBtn = document.getElementById('openCase');
const rouletteCaseName = document.getElementById('rouletteCaseName');
const backToCasesBtn = document.getElementById('backToCasesBtn');

const winPopup = document.getElementById('winPopup');
const popupItem = document.getElementById('popupItem');
const claimBtn = document.getElementById('claimBtn');

let idleRunning = true;
let spinning = false;
let currentOffset = 0;
let idleFrame = null;
let spinFrame = null;
let currentCase = { key: 'angel', name: 'Angel Case', price: 1 };
let currentWonPrize = null;
let currentWonRarity = null;
let balanceRevealTimer = null;
let isBalanceExpanded = false;

const giftsByCase = {
  angel: [
    { name: 'Small Gift', class: 'common' },
    { name: 'Angel Feather', class: 'common' },
    { name: 'Golden Wing', class: 'rare' },
    { name: 'Heaven Box', class: 'rare' },
    { name: 'Divine Halo', class: 'epic' },
    { name: 'Angel Crown', class: 'legendary' }
  ],
  heaven: [
    { name: 'Silver Halo', class: 'common' },
    { name: 'Sky Gift', class: 'rare' },
    { name: 'Holy Box', class: 'rare' },
    { name: 'Saint Relic', class: 'epic' },
    { name: 'Heaven Crown', class: 'legendary' }
  ],
  divine: [
    { name: 'Sacred Gift', class: 'rare' },
    { name: 'Divine Feather', class: 'epic' },
    { name: 'Light Relic', class: 'epic' },
    { name: 'Celestial Crown', class: 'legendary' }
  ]
};

const appState = {
  balance: 0,
  wallet: '',
  userId: '',
  userName: 'Гость'
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

function renderInventory(items) {
  if (!inventoryList) return;

  if (!items || !items.length) {
    inventoryList.innerHTML = `<div class="inventory-empty">Пока пусто</div>`;
    return;
  }

  inventoryList.innerHTML = items.map(item => {
    const date = item.created_at ? new Date(item.created_at).toLocaleString('ru-RU') : '';
    return `
      <div class="inventory-item">
        <div class="inventory-left">
          <div class="inventory-icon ${item.rarity}">${rarityEmoji(item.rarity)}</div>
          <div class="inventory-main">
            <div class="inventory-name">${item.item_name}</div>
            <div class="inventory-date">${date}</div>
          </div>
        </div>
        <div class="inventory-rarity ${rarityClass(item.rarity)}">${rarityLabel(item.rarity)}</div>
      </div>
    `;
  }).join('');
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

    if (!res.ok) {
      console.error('profile_error', data);
      return;
    }

    appState.balance = Number(data.balance || 0);
    appState.wallet = data.wallet_address || '';
    updateUI();
  } catch (e) {
    console.error('fetchProfile error:', e);
  }
}

async function fetchInventory() {
  if (!appState.userId) return;

  try {
    const res = await fetch(`${API_BASE}/api/inventory/${appState.userId}`);
    const data = await res.json();

    if (!res.ok) {
      console.error('inventory_error', data);
      return;
    }

    renderInventory(data.items || []);
  } catch (e) {
    console.error('fetchInventory error:', e);
  }
}

function showPage(page) {
  if (casesPage) casesPage.classList.remove('active');
  if (inventoryPage) inventoryPage.classList.remove('active');
  if (profilePage) profilePage.classList.remove('active');
  if (roulettePage) roulettePage.classList.remove('active');

  if (navCases) navCases.classList.remove('active');
  if (navInventory) navInventory.classList.remove('active');
  if (navProfile) navProfile.classList.remove('active');

  if (page === 'cases') {
    if (casesPage) casesPage.classList.add('active');
    if (navCases) navCases.classList.add('active');
    setText(pageSubtitle, 'Кейсы');
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

  if (page === 'roulette') {
    if (roulettePage) roulettePage.classList.add('active');
    setText(pageSubtitle, currentCase.name);
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
      if (attempts >= maxAttempts) {
        clearInterval(timer);
      }
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
        `К оплате точно: ${Number(order.exactAmount).toFixed(6)} TON\n` +
        `Сейчас откроется кошелёк.\n` +
        `Подтверди перевод именно на эту сумму.`;
    }

    if (payTonBtn) {
      payTonBtn.textContent = 'Открываем кошелёк...';
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
        'Платёж был отменён или кошелёк вернул ошибку.\n' +
        'Если кошелёк открылся, проверь сумму и попробуй ещё раз.';
    }
  } finally {
    if (payTonBtn) {
      payTonBtn.disabled = false;
      payTonBtn.textContent = 'Отправить TON';
    }
  }
}

function createItem(gift) {
  const div = document.createElement('div');
  div.className = 'item ' + gift.class;
  div.innerText = gift.name;
  return div;
}

function randomGift() {
  const pool = giftsByCase[currentCase.key] || giftsByCase.angel;
  return pool[Math.floor(Math.random() * pool.length)];
}

function giftClassFromRarity(rarity) {
  if (rarity === 'rare') return 'rare';
  if (rarity === 'epic') return 'epic';
  if (rarity === 'legendary') return 'legendary';
  return 'common';
}

function fillItems(count = 140) {
  if (!itemsContainer) return;
  itemsContainer.innerHTML = '';
  for (let i = 0; i < count; i++) {
    itemsContainer.appendChild(createItem(randomGift()));
  }
}

function appendMoreItems(count = 100) {
  if (!itemsContainer) return;
  for (let i = 0; i < count; i++) {
    itemsContainer.appendChild(createItem(randomGift()));
  }
}

function buildWinningLine(prizeName, rarity) {
  if (!itemsContainer) return null;

  itemsContainer.innerHTML = '';
  const totalItems = 90;
  const targetIndex = 62;
  let targetElement = null;

  for (let i = 0; i < totalItems; i++) {
    let gift;
    if (i === targetIndex) {
      gift = {
        name: prizeName,
        class: giftClassFromRarity(rarity)
      };
    } else {
      gift = randomGift();
    }

    const item = createItem(gift);

    if (i === targetIndex) {
      item.dataset.winTarget = '1';
      targetElement = item;
    }

    itemsContainer.appendChild(item);
  }

  return targetElement;
}

function setOffset(value) {
  currentOffset = value;
  if (itemsContainer) {
    itemsContainer.style.transform = `translate3d(-${currentOffset}px, 0, 0)`;
  }
}

function idleAnimation() {
  if (!idleRunning) return;

  setOffset(currentOffset + 0.45);

  if (itemsContainer && itemsContainer.children.length < 180) {
    appendMoreItems(100);
  }

  idleFrame = requestAnimationFrame(idleAnimation);
}

function getSpinDuration() {
  if (spinSound && !isNaN(spinSound.duration) && spinSound.duration > 0) {
    return {
      soundDuration: spinSound.duration,
      totalDuration: spinSound.duration + 1
    };
  }

  return {
    soundDuration: 5,
    totalDuration: 6
  };
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function showWinPopup(prize) {
  setText(popupItem, prize);
  if (winPopup) winPopup.style.display = 'flex';
}

function finishSpin() {
  if (spinSound) {
    spinSound.pause();
    spinSound.currentTime = 0;
  }

  if (currentWonPrize) {
    showWinPopup(currentWonPrize);
    fetchInventory();
  }

  spinning = false;
  idleRunning = true;
  idleAnimation();
}

function startSpinAnimation(prizeName, rarity) {
  if (spinning) return;

  spinning = true;
  idleRunning = false;

  if (idleFrame) {
    cancelAnimationFrame(idleFrame);
    idleFrame = null;
  }

  if (spinFrame) {
    cancelAnimationFrame(spinFrame);
    spinFrame = null;
  }

  currentWonPrize = prizeName;
  currentWonRarity = rarity;

  const targetElement = buildWinningLine(prizeName, rarity);

  if (!targetElement || !itemsContainer) {
    spinning = false;
    return;
  }

  currentOffset = 0;
  setOffset(0);

  if (spinSound) {
    spinSound.pause();
    spinSound.currentTime = 0;
    spinSound.play().catch(() => {});
  }

  requestAnimationFrame(() => {
    const roulette = document.querySelector('.roulette');
    if (!roulette) return;

    const timing = getSpinDuration();
    const totalDuration = timing.totalDuration;

    const targetOffset =
      targetElement.offsetLeft +
      targetElement.offsetWidth / 2 -
      roulette.clientWidth / 2;

    const finalOffset = Math.max(targetOffset, 0);
    const startTime = performance.now();

    function animateSpin(now) {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / totalDuration, 1);
      const eased = easeOutCubic(progress);

      const newOffset = finalOffset * eased;
      setOffset(newOffset);

      if (progress < 1) {
        spinFrame = requestAnimationFrame(animateSpin);
      } else {
        finishSpin();
      }
    }

    spinFrame = requestAnimationFrame(animateSpin);
  });
}

async function openCaseRequest(caseKey, price) {
  if (!appState.userId) {
    alert('Не удалось получить Telegram ID');
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/api/cases/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: appState.userId,
        username: appState.userName,
        caseKey,
        price
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Ошибка открытия кейса');
      return null;
    }

    appState.balance = Number(data.newBalance || 0);
    updateUI();
    return data;
  } catch (e) {
    console.error('openCaseRequest error:', e);
    alert('Ошибка соединения с backend');
    return null;
  }
}

function openCaseScreen(caseKey, caseName, casePrice) {
  currentCase = {
    key: caseKey,
    name: caseName,
    price: Number(casePrice)
  };

  setText(rouletteCaseName, `${caseName} • ${casePrice} TON`);
  currentOffset = 0;
  fillItems();
  showPage('roulette');
}

function bindEvents() {
  document.querySelectorAll('.case-open-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.case-card');
      const caseName = card?.querySelector('.case-name')?.textContent || 'Case';
      openCaseScreen(btn.dataset.case, caseName, btn.dataset.price);
    });
  });

  if (navCases) navCases.addEventListener('click', () => showPage('cases'));
  if (navInventory) navInventory.addEventListener('click', () => showPage('inventory'));
  if (navProfile) navProfile.addEventListener('click', () => showPage('profile'));
  if (backToCasesBtn) backToCasesBtn.addEventListener('click', () => showPage('cases'));
  if (payTonBtn) payTonBtn.addEventListener('click', payTon);

  if (balanceBox) {
    balanceBox.addEventListener('click', expandBalanceTemporarily);
  }

  if (openCaseBtn) {
    openCaseBtn.addEventListener('click', async () => {
      const result = await openCaseRequest(currentCase.key, currentCase.price);
      if (result) {
        startSpinAnimation(result.prize, result.rarity);
      }
    });
  }

  if (claimBtn) {
    claimBtn.addEventListener('click', () => {
      if (winPopup) winPopup.style.display = 'none';
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
  fetchProfile();
  fetchInventory();
  updateUI();
  fillItems();
  showPage('cases');
  bindEvents();

  if (spinSound && spinSound.readyState >= 1) {
    idleAnimation();
  } else if (spinSound) {
    spinSound.addEventListener(
      'loadedmetadata',
      () => {
        if (!idleFrame && !spinning) {
          idleAnimation();
        }
      },
      { once: true }
    );

    setTimeout(() => {
      if (!idleFrame && !spinning) {
        idleAnimation();
      }
    }, 500);
  }
}

initApp();
