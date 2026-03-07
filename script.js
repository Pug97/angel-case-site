const tg = window.Telegram.WebApp
tg.expand()

const itemsContainer = document.getElementById("items")

const spinSound = document.getElementById("spinSound")
const winSound = document.getElementById("winSound")

let idleRunning = true
let spinning = false
let currentOffset = 0
let animationFrame

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

currentOffset += 0.3

itemsContainer.style.transform=`translateX(-${currentOffset}px)`

requestAnimationFrame(idleAnimation)

}

idleAnimation()



document.getElementById("openCase").addEventListener("click", function(){

if(spinning) return

spinning = true
idleRunning = false

spinSound.currentTime = 0
spinSound.play()

let startTime = performance.now()

function spinAnimation(time){

let elapsed = (time - startTime) / 1000

/* скорость зависит от звука */

let progress = elapsed / spinSound.duration

currentOffset += 25 * (1 - progress)

itemsContainer.style.transform=`translateX(-${currentOffset}px)`

if(elapsed < spinSound.duration){

animationFrame = requestAnimationFrame(spinAnimation)

}else{

finishSpin()

}

}

requestAnimationFrame(spinAnimation)

})



function finishSpin(){

spinSound.pause()

const markerX = window.innerWidth/2

const items = document.querySelectorAll(".item")

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

}



function showWinPopup(prize){

document.getElementById("popupItem").innerText=prize
document.getElementById("winPopup").style.display="flex"

winSound.currentTime=0
winSound.play()

}



document.getElementById("claimBtn").onclick=function(){

document.getElementById("winPopup").style.display="none"

}
