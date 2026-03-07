const tg = window.Telegram.WebApp
tg.expand()

const itemsContainer = document.getElementById("items")

let idleOffset = 0
let idleRunning = true
let spinning = false
let currentOffset = 0

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

for(let i=0;i<40;i++){

const gift = randomGift()

const div = document.createElement("div")

div.className = "item " + gift.class
div.innerText = gift.name

itemsContainer.appendChild(div)

}

}

generateItems()



function idleAnimation(){

if(!idleRunning) return

currentOffset += 0.25

itemsContainer.style.transition="none"
itemsContainer.style.transform=`translateX(-${currentOffset}px)`

requestAnimationFrame(idleAnimation)

}

idleAnimation()



document.getElementById("openCase").onclick=function(){

if(spinning) return

spinning=true

idleRunning=false

itemsContainer.style.transition="transform 4s cubic-bezier(.17,.67,.24,1)"

// добавляем новые предметы вперед
generateItems()

// рулетка всегда движется дальше вправо
currentOffset += Math.random()*1500 + 1500

itemsContainer.style.transform=`translateX(-${currentOffset}px)`


setTimeout(()=>{

const markerX = window.innerWidth/2

const items=document.querySelectorAll(".item")

let winItem=null

items.forEach(item=>{

const rect=item.getBoundingClientRect()

if(rect.left < markerX && rect.right > markerX){

winItem=item

}

})

if(winItem){

showWinPopup(winItem.innerText)

}

spinning=false

idleRunning=true
idleAnimation()

},4000)

}



function showWinPopup(prize){

document.getElementById("popupItem").innerText=prize

document.getElementById("winPopup").style.display="flex"

}



document.getElementById("claimBtn").onclick=function(){

document.getElementById("winPopup").style.display="none"

}
