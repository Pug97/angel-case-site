const tg = window.Telegram.WebApp
tg.expand()

const itemsContainer = document.getElementById("items")

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

for(let i=0;i<60;i++){

const gift = randomGift()

const div = document.createElement("div")

div.className="item "+gift.class

div.innerText = gift.name

itemsContainer.appendChild(div)

}

}

generateItems()

document.getElementById("openCase").onclick=function(){

generateItems()

// выбираем индекс предмета который будет под стрелкой
const winIndex = Math.floor(Math.random()*20)+20

// ширина одного предмета
const itemWidth = 140

// рассчитываем позицию прокрутки
const offset = (winIndex * itemWidth) - (window.innerWidth / 2) + (itemWidth / 2)

itemsContainer.style.transform=`translateX(-${offset}px)`

setTimeout(()=>{

const winItem = itemsContainer.children[winIndex].innerText

document.getElementById("result").innerText="You won: "+winItem

},4000)

}
