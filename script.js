const tg = window.Telegram.WebApp
tg.expand()

const RECEIVER_WALLET = 'UQBwcw41wYAnPcQuHFtB9a_khXQLQR3LUCq5hMsyyQGuj37k'

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

const walletPopup = document.getElementById('walletPopup')
const bindWalletBtn = document.getElementById('bindWalletBtn')
const saveWalletBtn = document.getElementById('saveWalletBtn')
const closeWalletPopupBtn = document.getElementById('closeWalletPopupBtn')
const walletInput = document.getElementById('walletInput')

const payBtn = document.getElementById('payBtn')
const topupAmount = document.getElementById('topupAmount')

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
let currentCase = { name: 'Angel Case', price: 1 }

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
  wallet: localStorage.getItem('angelcase_wallet') || '',
  userId: '',
  userName: 'Гость'
}

function saveState() {
  localStorage.setItem('angelcase_balance', String(appState.balance))
  localStorage.setItem('angelcase_wallet', appState.wallet)
}

function updateUI() {
  balanceValue.textContent = `${appState.balance.toFixed(2)} TON`
  walletValue.textContent = appState.wallet || 'Не привязан'
  telegramName.textContent = appState.userName
  telegramId.textContent = appState.userId || '—'
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

function openWalletPopup() {
  walletInput.value = appState.wallet
  walletPopup.style.display = 'flex'
}

function closeWalletPopup() {
  walletPopup.style.display = 'none'
}

function saveWallet() {
  const wallet = walletInput.value.trim()
  if (!wallet) return

  appState.wallet = wallet
  saveState()
  updateUI()
  closeWalletPopup()
}

function topupBalanceDemo(amount) {
  appState.balance += amount
  saveState()
  updateUI()
}

function handleTopup() {
  const amount = Number(topupAmount.value)
  if (!appState.wallet) {
    alert('Сначала привяжи кошелёк')
    return
  }

  if (!amount || amount <= 0) {
    alert('Введите сумму пополнения')
    return
  }

  const ok = confirm(
    `Демо-пополнение на ${amount} TON\n\n` +
    `Адрес получателя:\n${RECEIVER_WALLET}\n\n` +
    `Сейчас это интерфейсный режим. Нажми OK, чтобы начислить баланс локально для теста.`
  )

  if (!ok) return

  topupBalanceDemo(amount)
  topupAmount.value = ''
  alert(`Баланс пополнен на ${amount} TON`)
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
    alert('Недостаточно баланса')
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

bindWalletBtn.addEventListener('click', openWalletPopup)
saveWalletBtn.addEventListener('click', saveWallet)
closeWalletPopupBtn.addEventListener('click', closeWalletPopup)

payBtn.addEventListener('click', handleTopup)
openCaseBtn.addEventListener('click', startSpin)
claimBtn.addEventListener('click', () => {
  winPopup.style.display = 'none'
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
