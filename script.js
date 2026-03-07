const tg = window.Telegram?.WebApp
if (tg) tg.expand()

const RECEIVER_WALLET = 'UQBwcw41wYAnPcQuHFtB9a_khXQLQR3LUCq5hMsyyQGuj37k'

/*
  ВАЖНО:
  После включения GitHub Pages замени URL ниже на свой реальный адрес сайта.
  Пример для вашего репо обычно выглядит так:
  https://Pug97.github.io/angel-case-site/tonconnect-manifest.json
*/
const MANIFEST_URL = 'https://Pug97.github.io/angel-case-site/tonconnect-manifest.json'

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: MANIFEST_URL,
  buttonRootId: 'tonConnectButton'
})

const casesPage = document.getElementById('casesPage')
const profilePage = document.getElementById('profilePage')
const roulettePage = document.getElementById('roulettePage')

const navCases = document.getElementById('navCases')
const navProfile = document.getElementById('navProfile')
const pageSubtitle = document.getElementById('pageSubtitle')

const balanceValue = document.getElementById('balanceValue')
const telegramName = document.getElementById('telegramName')
const telegramId = document.getElementById('telegramId')
const walletValue = document.getElementById('walletValue')

const topupAmount = document.getElementById('topupAmount')
const payTonBtn = document.getElementById('payTonBtn')
const depositInfo = document.getElementById('depositInfo')

const itemsContainer = document.getElementById('items')
const spinSound = document.getElementById('spinSound')
const openCaseBtn = document.getElementById('openCase')
const rouletteCaseName = document.getElementById('rouletteCaseName')
const backToCasesBtn = document.getElementById('backToCasesBtn')

const winPopup = document.getElementById('winPopup')
const popupItem = document.getElementById('popupItem')
const claimBtn = document.getElementById('claimBtn')

let idleRunning = true
let spinning = false
let currentOffset = 0
let idleFrame = null
let spinFrame = null
let currentCase = { key: 'angel', name: 'Angel Case', price: 1 }

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
}

const appState = {
  balance: Number(localStorage.getItem('angelcase_balance') || '0'),
  wallet: '',
  userId: '',
  userName: 'Гость'
}

function saveState() {
  localStorage.setItem('angelcase_balance', String(appState.balance))
}

function updateUI() {
  balanceValue.textContent = `${appState.balance.toFixed(2)} TON`
  telegramName.textContent = appState.userName
  telegramId.textContent = appState.userId || '—'
  walletValue.textContent = appState.wallet || 'Не подключён'
}

function initTelegramUser() {
  const user = tg?.initDataUnsafe?.user
  if (!user) {
    updateUI()
    return
  }

  appState.userId = String(user.id || '')
  appState.userName = user.username
    ? `@${user.username}`
    : [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Пользователь'

  updateUI()
}

function showPage(page) {
  casesPage.classList.remove('active')
  profilePage.classList.remove('active')
  roulettePage.classList.remove('active')

  navCases.classList.remove('active')
  navProfile.classList.remove('active')

  if (page === 'cases') {
    casesPage.classList.add('active')
    navCases.classList.add('active')
    pageSubtitle.textContent = 'Кейсы'
  }

  if (page === 'profile') {
    profilePage.classList.add('active')
    navProfile.classList.add('active')
    pageSubtitle.textContent = 'Профиль'
  }

  if (page === 'roulette') {
    roulettePage.classList.add('active')
    pageSubtitle.textContent = currentCase.name
  }
}

function createComment() {
  const ts = Date.now()
  const user = appState.userId || 'guest'
  return `ANGELCASE:${user}:${ts}`
}

function buildCommentPayload(text) {
  const encoder = new TextEncoder()
  const textBytes = encoder.encode(text)
  const payload = new Uint8Array(4 + textBytes.length)

  payload[0] = 0
  payload[1] = 0
  payload[2] = 0
  payload[3] = 0
  payload.set(textBytes, 4)

  let binary = ''
  payload.forEach(b => binary += String.fromCharCode(b))
  return btoa(binary)
}

async function payTon() {
  const amount = Number(topupAmount.value)

  if (!tonConnectUI.account?.address) {
    alert('Сначала подключи TON-кошелёк')
    return
  }

  if (!amount || amount <= 0) {
    alert('Введите сумму')
    return
  }

  const comment = createComment()
  const nano = String(Math.round(amount * 1_000_000_000))

  const tx = {
    validUntil: Math.floor(Date.now() / 1000) + 300,
    messages: [
      {
        address: RECEIVER_WALLET,
        amount: nano,
        payload: buildCommentPayload(comment)
      }
    ]
  }

  try {
    const result = await tonConnectUI.sendTransaction(tx)

    depositInfo.textContent =
      `Перевод отправлен.\n` +
      `Сумма: ${amount} TON\n` +
      `Кому: ${RECEIVER_WALLET}\n` +
      `От кого: ${tonConnectUI.account.address}\n` +
      `Комментарий: ${comment}\n\n` +
      `Сейчас это только GitHub-этап.\n` +
      `На следующем этапе мы подключим сервер,\n` +
      `который будет проверять транзакцию и начислять баланс автоматически.`

    topupAmount.value = ''
  } catch (e) {
    depositInfo.textContent = 'Платёж был отменён или кошелёк вернул ошибку.'
  }
}

function createItem(gift) {
  const div = document.createElement('div')
  div.className = 'item ' + gift.class
  div.innerText = gift.name
  return div
}

function randomGift() {
  const pool = giftsByCase[currentCase.key] || giftsByCase.angel
  return pool[Math.floor(Math.random() * pool.length)]
}

function fillItems(count = 140) {
  itemsContainer.innerHTML = ''
  for (let i = 0; i < count; i++) {
    itemsContainer.appendChild(createItem(randomGift()))
  }
}

function appendMoreItems(count = 100) {
  for (let i = 0; i < count; i++) {
    itemsContainer.appendChild(createItem(randomGift()))
  }
}

function setOffset(value) {
  currentOffset = value
  itemsContainer.style.transform = `translate3d(-${currentOffset}px, 0, 0)`
}

function idleAnimation() {
  if (!idleRunning) return

  setOffset(currentOffset + 0.45)

  if (itemsContainer.children.length < 180) {
    appendMoreItems(100)
  }

  idleFrame = requestAnimationFrame(idleAnimation)
}

function getSpinDuration() {
  if (!isNaN(spinSound.duration) && spinSound.duration > 0) {
    return {
      soundDuration: spinSound.duration,
      totalDuration: spinSound.duration + 1
    }
  }

  return {
    soundDuration: 5,
    totalDuration: 6
  }
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function findWinningItem() {
  const marker = document.querySelector('.marker')
  const markerRect = marker.getBoundingClientRect()
  const markerX = markerRect.left + markerRect.width / 2

  const items = document.querySelectorAll('.item')
  let winItem = null

  items.forEach(item => {
    const rect = item.getBoundingClientRect()
    if (rect.left <= markerX && rect.right >= markerX) {
      winItem = item
    }
  })

  return winItem
}

function showWinPopup(prize) {
  popupItem.textContent = prize
  winPopup.style.display = 'flex'
}

function finishSpin() {
  spinSound.pause()
  spinSound.currentTime = 0

  const winItem = findWinningItem()
  if (winItem) {
    showWinPopup(winItem.innerText)
  }

  spinning = false
  idleRunning = true
  idleAnimation()
}

function startSpin() {
  if (spinning) return

  if (appState.balance < currentCase.price) {
    alert('Недостаточно баланса.\n\nНа этапе GitHub баланс пока тестовый и хранится только в браузере.')
    return
  }

  appState.balance -= currentCase.price
  saveState()
  updateUI()

  spinning = true
  idleRunning = false

  if (idleFrame) {
    cancelAnimationFrame(idleFrame)
    idleFrame = null
  }

  if (spinFrame) {
    cancelAnimationFrame(spinFrame)
    spinFrame = null
  }

  if (itemsContainer.children.length < 300) {
    appendMoreItems(220)
  }

  spinSound.pause()
  spinSound.currentTime = 0
  spinSound.play().catch(() => {})

  const timing = getSpinDuration()
  const soundDuration = timing.soundDuration
  const totalDuration = timing.totalDuration

  const startOffset = currentOffset
  const pixelsPerSecond = 950
  const extraTravel = 1100 + Math.random() * 350
  const totalTravel = (pixelsPerSecond * soundDuration) + extraTravel

  const startTime = performance.now()

  function animateSpin(now) {
    const elapsed = (now - startTime) / 1000
    const progress = Math.min(elapsed / totalDuration, 1)
    const eased = easeOutCubic(progress)

    const newOffset = startOffset + totalTravel * eased
    setOffset(newOffset)

    if (itemsContainer.children.length < 220) {
      appendMoreItems(120)
    }

    if (elapsed >= soundDuration && !spinSound.paused) {
      spinSound.pause()
    }

    if (progress < 1) {
      spinFrame = requestAnimationFrame(animateSpin)
    } else {
      finishSpin()
    }
  }

  spinFrame = requestAnimationFrame(animateSpin)
}

function openCaseScreen(caseKey, caseName, casePrice) {
  currentCase = {
    key: caseKey,
    name: caseName,
    price: Number(casePrice)
  }

  rouletteCaseName.textContent = `${caseName} • ${casePrice} TON`
  currentOffset = 0
  fillItems()
  showPage('roulette')
}

document.querySelectorAll('.case-open-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.case-card')
    const caseName = card.querySelector('.case-name').textContent
    openCaseScreen(btn.dataset.case, caseName, btn.dataset.price)
  })
})

navCases.addEventListener('click', () => showPage('cases'))
navProfile.addEventListener('click', () => showPage('profile'))
backToCasesBtn.addEventListener('click', () => showPage('cases'))
payTonBtn.addEventListener('click', payTon)
openCaseBtn.addEventListener('click', startSpin)
claimBtn.addEventListener('click', () => {
  winPopup.style.display = 'none'
})

tonConnectUI.onStatusChange(wallet => {
  if (wallet?.account?.address) {
    appState.wallet = wallet.account.address
  } else {
    appState.wallet = ''
  }
  updateUI()
})

/* Временная тестовая кнопка для локального баланса.
   Можно удалить позже, когда будет backend */
document.addEventListener('keydown', e => {
  if (e.key === '+') {
    appState.balance += 5
    saveState()
    updateUI()
  }
})

updateUI()
initTelegramUser()
fillItems()

if (spinSound.readyState >= 1) {
  idleAnimation()
} else {
  spinSound.addEventListener('loadedmetadata', () => {
    if (!idleFrame && !spinning) {
      idleAnimation()
    }
  }, { once: true })

  setTimeout(() => {
    if (!idleFrame && !spinning) {
      idleAnimation()
    }
  }, 500)
}
