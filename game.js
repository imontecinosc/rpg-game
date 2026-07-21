const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize(){

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

}

window.addEventListener("resize",resize);

resize();

function gameLoop(){

    // Fondo
    ctx.fillStyle="#2d5a27";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Texto
    ctx.fillStyle="white";
    ctx.font="30px Arial";
    ctx.fillText("ULTIMA RPG",40,50);

    requestAnimationFrame(gameLoop);

}

gameLoop();
