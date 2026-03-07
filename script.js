const tg = window.Telegram.WebApp
tg.expand()

const itemsContainer = document.getElementById("items")

let idleOffset = 0
let idleRunning = true
let spinning = false

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
return gifts[Math.floor(Math.random()*gifts.length)]
}

function generateItems(){

itemsContainer.innerHTML=""

for(let i=0;i<80;i++){

const gift = randomGift()

const div = document.createElement("div")

div.className = "item " + gift.class
div.innerText = gift.name

itemsContainer.appendChild(div)

}

}

generateItems()


// idle движение рулетки
function idleAnimation(){

if(!idleRunning) return

idleOffset += 0.25

itemsContainer.style.transition = "none"
itemsContainer.style.transform = `translateX(-${idleOffset}px)`

requestAnimationFrame(idleAnimation)

}

idleAnimation()


// кнопка открытия кейса
document.getElementById("openCase").onclick = function(){

if(spinning) return

spinning = true

idleRunning = false

itemsContainer.style.transition = "transform 4s cubic-bezier(.17,.67,.24,1)"

generateItems()

const randomOffset = Math.random()*2000 + 1500

itemsContainer.style.transform = `translateX(-${randomOffset}px)`


// после остановки рулетки
setTimeout(()=>{

const markerX = window.innerWidth / 2

const items = document.querySelectorAll(".item")

let winItem = null

items.forEach(item=>{

const rect = item.getBoundingClientRect()

if(rect.left < markerX && rect.right > markerX){

winItem = item

}

})

if(winItem){

showWinPopup(winItem.innerText)

}

spinning = false

idleRunning = true
idleAnimation()

},4000)

}



// popup окно
function showWinPopup(prize){

document.getElementById("popupItem").innerText = prize

document.getElementById("winPopup").style.display = "flex"

}



// кнопка забрать
document.getElementById("claimBtn").onclick = function(){

document.getElementById("winPopup").style.display = "none"

}
