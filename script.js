const tg = window.Telegram.WebApp
tg.expand()

const itemsContainer = document.getElementById("items")
const spinSound = document.getElementById("spinSound")
const tickSound = document.getElementById("tickSound")

let idleRunning = true
let spinning = false
let currentOffset = 0
let idleFrame = null
let spinFrame = null
let lastTickedItem = null

const gifts = [
  { name: "Small Gift", class: "common" },
  { name: "Angel Feather", class: "common" },
  { name: "Golden Wing", class: "rare" },
  { name: "Heaven Box", class: "rare" },
  { name: "Divine Halo", class: "epic" },
  { name: "Sacred Relic", class: "epic" },
  { name: "Angel Crown", class: "legendary" }
]

const tickPool = []
let tickPoolIndex = 0

function setupTickPool() {
  const src = tickSound?.querySelector("source")?.getAttribute("src") || "tick.mp3"

  for (let i = 0; i < 8; i++) {
    const audio = new Audio(src)
    audio.preload = "auto"
    tickPool.push(audio)
  }
}

function playTick() {
  if (!tickPool.length) return

  const audio = tickPool[tickPoolIndex]
  audio.currentTime = 0
  audio.play().catch(() => {})

  tickPoolIndex++
  if (tickPoolIndex >= tickPool.length) {
    tickPoolIndex = 0
  }
}

function randomGift() {
  return gifts[Math.floor(Math.random() * gifts.length)]
}

function createItem(gift) {
  const div = document.createElement("div")
  div.className = "item " + gift.class
  div.innerText = gift.name
  return div
}

function fillItems(count = 140) {
  itemsContainer.innerHTML = ""
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

function getMarkerX() {
  const marker = document.querySelector(".marker")
  const markerRect = marker.getBoundingClientRect()
  return markerRect.left + markerRect.width / 2
}

function getCenteredItem() {
  const markerX = getMarkerX()
  const items = document.querySelectorAll(".item")

  for (const item of items) {
    const rect = item.getBoundingClientRect()
    if (rect.left <= markerX && rect.right >= markerX) {
      return item
    }
  }

  return null
}

function handleTickSync() {
  if (!spinning) return

  const currentItem = getCenteredItem()

  if (currentItem && currentItem !== lastTickedItem) {
    lastTickedItem = currentItem
    playTick()
  }
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
  return getCenteredItem()
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
  lastTickedItem = null
  idleAnimation()
}

function startSpin() {
  if (spinning) return

  spinning = true
  idleRunning = false
  lastTickedItem = null

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

    handleTickSync()

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

function showWinPopup(prize) {
  document.getElementById("popupItem").innerText = prize
  document.getElementById("winPopup").style.display = "flex"
}

document.getElementById("claimBtn").onclick = function () {
  document.getElementById("winPopup").style.display = "none"
}

document.getElementById("openCase").addEventListener("click", startSpin)

setupTickPool()
fillItems()

if (spinSound.readyState >= 1) {
  idleAnimation()
} else {
  spinSound.addEventListener("loadedmetadata", () => {
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
