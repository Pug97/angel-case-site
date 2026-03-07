const tg = window.Telegram.WebApp
tg.expand()

const itemsContainer = document.getElementById("items")
const spinSound = document.getElementById("spinSound")

let idleRunning = true
let spinning = false
let currentOffset = 0
let idleFrame = null
let spinFrame = null

const gifts = [
  { name: "Small Gift", class: "common" },
  { name: "Angel Feather", class: "common" },
  { name: "Golden Wing", class: "rare" },
  { name: "Heaven Box", class: "rare" },
  { name: "Divine Halo", class: "epic" },
  { name: "Sacred Relic", class: "epic" },
  { name: "Angel Crown", class: "legendary" }
]

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
  const marker = document.querySelector(".marker")
  const markerRect = marker.getBoundingClientRect()
  const markerX = markerRect.left + markerRect.width / 2

  const items = document.querySelectorAll(".item")
  let winItem = null

  items.forEach(item => {
    const rect = item.getBoundingClientRect()
    if (rect.left <= markerX && rect.right >= markerX) {
      winItem = item
    }
  })

  return winItem
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

  /* БЫЛО медленно — теперь быстрее */
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

function showWinPopup(prize) {
  document.getElementById("popupItem").innerText = prize
  document.getElementById("winPopup").style.display = "flex"
}

document.getElementById("claimBtn").onclick = function () {
  document.getElementById("winPopup").style.display = "none"
}

document.getElementById("openCase").addEventListener("click", startSpin)

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
