const tg = window.Telegram.WebApp

tg.expand()

const gifts = [

"Common Telegram Gift",
"Rare Telegram Gift",
"Epic NFT Gift",
"Legendary NFT Gift"

]

document.getElementById("openCase").onclick = function(){

const random = Math.floor(Math.random()*gifts.length)

const win = gifts[random]

document.getElementById("result").innerText = "You won: " + win

}
