const tg = window.Telegram.WebApp
tg.expand()

const itemsContainer = document.getElementById("items")

const spinSound = document.getElementById("spinSound")
const winSound = document.getElementById("winSound")

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

const gift=randomGift()

const div=document.createElement("div")

div.className="item "+gift.class
div.innerText=gift.name

itemsContainer.appendChild(div)

}

}

generateItems()



function idleAnimation(){

if(!idleRunning) return

currentOffset+=0.25

itemsContainer.style.transition="none"
itemsContainer.style.transform=`translateX(-${currentOffset}px)`

requestAnimationFrame(idleAnimation)

}

idleAnimation()



document.getElementById("openCase").onclick=function(){

if(spinning) return

spinning=true
idleRunning=false


spinSound.currentTime = 0
spinSound.volume = 1
spinSound.play()

itemsContainer.style.transition="transform 5s cubic-bezier(.17,.67,.24,1)"

generateItems()

currentOffset+=Math.random()*2000+2000

itemsContainer.style.transform=`translateX(-${currentOffset}px)`


setTimeout(()=>{

spinSound.pause()

const markerX=window.innerWidth/2

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

},5000)

}



function showWinPopup(prize){

document.getElementById("popupItem").innerText=prize
document.getElementById("winPopup").style.display="flex"

winSound.currentTime = 0
winSound.play()

}



document.getElementById("claimBtn").onclick=function(){

document.getElementById("winPopup").style.display="none"

}
