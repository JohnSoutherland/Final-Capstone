let socket;

const canvasCreateSize = 480;
const Mobile_canvasCreateSize = 384;

let gridSize = 0;
let canvasMap = [];
let Palette = [];

let canvasSize = 0;

var colorIndex = 0;

sessionStorage.setItem("user-game-status","just-joined");

function setup() {
    
    let canvas = createCanvas(canvasCreateSize, canvasCreateSize);
    if (window.innerWidth < 600) {
        canvas = createCanvas(Mobile_canvasCreateSize,Mobile_canvasCreateSize);
    }
    canvas.parent("canvas-holder");
    
    colorMode(RGB, 255);
    rectMode(CORNER);
    noStroke();
    
    socket = io();
    socket.on("justJoined", newGame);
    socket.on("newMap", newGame);
    socket.on("updateClientMap", drawPixel);
    socket.on("setUserStatus", setUserStatus);
    socket.on("updateArtist", updateArtist);
    socket.on("drawPrompt", setPromptDiv);
}

function draw() {
    background(255, 255, 255);
    // skip if there is not grid
    if ((gridSize == 0) || (typeof canvasMap === 'undefined')) {
        return;
    }
    
    // draw grid
    for (var i = 0; i < canvasMap.length; i++) {
        for (var j = 0; j < canvasMap[i].length; j++)
        {
            let c = color(Palette[canvasMap[i][j]]);
            fill(c);
            rect(i*canvasSize,j*canvasSize,i*canvasSize+(canvasSize),j*canvasSize+(canvasSize));
        }
    }
    
    checkMouse();
}



// User-related functions

function validateUsername() {    
    let username = document.getElementById("username").value.trim();
    
    if ((username.length > 5) && (username.search(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/) == -1)) {
        //setUserStatus("guesser");
        socket.emit('loginUser', username);
    }
}

function updateArtist(isGuesser) {
    /// uhh
}

function newGame(gameData) {
    canvasMap = gameData.Grid;
    gridSize = gameData.Pixel;
    Palette = gameData.Palette;
    canvasSize = canvasCreateSize/gridSize;
    //createPalette();
}


