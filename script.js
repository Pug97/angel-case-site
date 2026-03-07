// подключаем Telegram Mini App
const tg = window.Telegram.WebApp

// разворачиваем приложение
tg.expand()

// показываем цвет Telegram темы
document.body.style.backgroundColor = tg.themeParams.bg_color || "#0f0f0f"


// получаем данные пользователя
const user = tg.initDataUnsafe?.user

if(user){

console.log("User ID:", user.id)
console.log("User name:", user.first_name)

}


// список подарков (можно менять)
const gifts = [

{
name: "Common Gift 🎁",
chance: 50
},

{
name: "Rare Gift 💎",
chance: 30
},

{
name: "Epic NFT Gift 🔥",
chance: 15
},

{
name: "Legendary NFT 👑",
chance: 5
}

]



// функция рулетки
function spinCase(){

const random = Math.random() * 100

let cumulative = 0

for(let gift of gifts){

cumulative += gift.chance

if(random <= cumulative){

showResult(gift.name)

break

}

}

}



// показать результат
function showResult(prize){

const resultDiv = document.getElementById("result")

resultDiv.innerText = "You won: " + prize

}



// кнопка открытия кейса
document.getElementById("openCase").addEventListener("click", spinCase)
