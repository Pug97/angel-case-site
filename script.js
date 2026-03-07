const tg = window.Telegram.WebApp
tg.expand()

const itemsContainer = document.getElementById("items")
const spinSound = document.getElementById("spinSound")
const winSound = document.getElementById("winSound")

let idleRunning = true
let spinning = false
let currentOffset = 0
let idleFrame = null
let spinFrame = null

const ITEM_FULL_WIDTH = 140

const gifts = [
  {name:"Small Gift", class:"common"},
  {name:"Angel Feather", class:"common"},
  {name:"Golden Wing", class:"rare"},
  {name:"Heaven Box", class:"rare"},
  {name:"Divine Halo", class:"epic"},
  {name:"Sacred Relic", class:"epic"},
  {name:"Angel Crown", class:"legendary"}
]

function randomGift(){
  return gifts[Math.floor(Math.random() * gifts.length)]
}

function createItem(gift){
  const div = document.createElement("div")
  div.className = "item " + gift.class
  div.innerText = gift.name
  return div
}

function fillItems(count = 120){
  itemsContainer.innerHTML = ""
  for(let i = 0; i < count; i++){
    itemsContainer.appendChild(createItem(randomGift()))
  }
}

function appendMoreItems(count = 80){
  for(let i = 0; i < count; i++){
    itemsContainer.appendChild(createItem(randomGift()))
  }
}

fillItems()

function setOffset(value){
  currentOffset = value
  itemsContainer.style.transform = `translate3d(-${currentOffset}px,0,0)`
}

function idleAnimation(){
  if(!idleRunning) return

  setOffset(currentOffset + 0.35)

  if(itemsContainer.children.length < 160){
    appendMoreItems(80)
  }

  idleFrame = requestAnimationFrame(idleAnimation)
}

idleAnimation()

document.getElementById("openCase").addEventListener("click", function(){

  if(spinning) return

  spinning = true
  idleRunning = false

  if(idleFrame){
    cancelAnimationFrame(idleFrame)
    idleFrame = null
  }

  spinSound.currentTime = 0
  spinSound.play().catch(() => {})

  if(itemsContainer.children.length < 220){
    appendMoreItems(140)
  }

  const soundDuration = (!isNaN(spinSound.duration) && spinSound.duration > 0) ? spinSound.duration : 5
  const extraTime = 1
  const totalDuration = soundDuration + extraTime

  const startOffset = currentOffset

  const minTravel = 2200
  const maxTravel = 3200
  const totalTravel = minTravel + Math.random() * (maxTravel - minTravel)

  const startTime = performance.now()

  function easeOutCubic(t){
    return 1 - Math.pow(1 - t, 3)
  }

  function animateSpin(now){
    const elapsed = (now - startTime) / 1000
    const progress = Math.min(elapsed / totalDuration, 1)
    const eased = easeOutCubic(progress)

    const newOffset = startOffset + totalTravel * eased
    setOffset(newOffset)

    if(itemsContainer.children.length < 180){
      appendMoreItems(100)
    }

    if(progress < 1){
      spinFrame = requestAnimationFrame(animateSpin)
    }else{
      finishSpin()
    }
  }

  spinFrame = requestAnimationFrame(animateSpin)
})

function finishSpin(){

  spinSound.pause()

  const marker = document.querySelector(".marker")
  const markerRect = marker.getBoundingClientRect()
  const markerX = markerRect.left + markerRect.width / 2

  const items = document.querySelectorAll(".item")
  let winItem = null

  items.forEach(item => {
    const rect = item.getBoundingClientRect()
    if(rect.left <= markerX && rect.right >= markerX){
      winItem = item
    }
  })

  if(winItem){
    showWinPopup(winItem.innerText)
  }

  spinning = false
  idleRunning = true
  idleAnimation()
}

function showWinPopup(prize){
  document.getElementById("popupItem").innerText = prize
  document.getElementById("winPopup").style.display = "flex"

  winSound.currentTime = 0
  winSound.play().catch(() => {})
}

document.getElementById("claimBtn").onclick = function(){
  document.getElementById("winPopup").style.display = "none"
}
