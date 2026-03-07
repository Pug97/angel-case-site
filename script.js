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

div.innerText=gift.name

itemsContainer.appendChild(div)

}

}

generateItems()

document.getElementById("openCase").onclick=function(){

generateItems()

const winIndex = Math.floor(Math.random()*40)+10

const offset = winIndex * 140

itemsContainer.style.transform=`translateX(-${offset}px)`

const winItem = itemsContainer.children[winIndex].innerText

setTimeout(()=>{

document.getElementById("result").innerText="You won: "+winItem

},4000)

}
