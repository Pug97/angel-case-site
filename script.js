const tg = window.Telegram.WebApp
tg.expand()

const itemsContainer = document.getElementById("items")

let idleOffset = 0
let idleRunning = true

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

div.className="item "+gift.class

div.innerText = gift.name

itemsContainer.appendChild(div)

}

}

generateItems()

// медленное движение рулетки
function idleAnimation(){

if(!idleRunning) return

idleOffset += 0.3

itemsContainer.style.transform = `translateX(-${idleOffset}px)`

requestAnimationFrame(idleAnimation)

}

idleAnimation()


document.getElementById("openCase").onclick=function(){

// останавливаем idle анимацию
idleRunning = false

itemsContainer.style.transition = "transform 4s cubic-bezier(.17,.67,.24,1)"

generateItems()

const winIndex = Math.floor(Math.random()*20)+20

const itemWidth = 140

const offset = (winIndex * itemWidth) - (window.innerWidth / 2) + (itemWidth / 2)

itemsContainer.style.transform=`translateX(-${offset}px)`

setTimeout(()=>{

const winItem = itemsContainer.children[winIndex].innerText

document.getElementById("result").innerText="You won: "+winItem

// после спина снова запускаем idle
idleRunning = true
idleAnimation()

},4000)

}
