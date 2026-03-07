const tg = window.Telegram.WebApp
tg.expand()

const itemsContainer = document.getElementById("items")

const gifts = [

"Common 🎁",
"Common 🎁",
"Common 🎁",
"Rare 💎",
"Rare 💎",
"Epic 🔥",
"Legendary 👑"

]

function generateItems(){

itemsContainer.innerHTML=""

for(let i=0;i<50;i++){

const gift = gifts[Math.floor(Math.random()*gifts.length)]

const div = document.createElement("div")

div.className="item"

div.innerText=gift

itemsContainer.appendChild(div)

}

}

generateItems()

document.getElementById("openCase").onclick = function(){

generateItems()

const winIndex = Math.floor(Math.random()*40)+5

const offset = winIndex * 120

itemsContainer.style.transform = `translateX(-${offset}px)`

const winItem = itemsContainer.children[winIndex].innerText

setTimeout(()=>{

document.getElementById("result").innerText = "You won: " + winItem

},4000)

}
