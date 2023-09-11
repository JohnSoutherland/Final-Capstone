let socket;

const canvasCreateSize = 480;

let gridSize = 0;
let canvasMap = [];
let Palette = [];

let canvasSize = 0;

var colorIndex = 0;

function setup() {
    let canvas = createCanvas(canvasCreateSize, canvasCreateSize);
    canvas.parent("canvas-holder");
    
    colorMode(RGB, 255);
    rectMode(CORNER);
    noStroke();
    
    socket = io();
    socket.on("justJoined", newGame);
    socket.on("newMap", newGame);
    socket.on("updateClientMap", drawPixel);
    socket.on("updateUser", createPrompt);
}

function draw() {
    background(255, 0, 0);
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

function createPrompt(isGuesser) {
    /// uhh
}


function checkMouse() {
    if ((mouseX > (canvasCreateSize-1)) || (mouseX < 0)) {return;}
    if ((mouseY > (canvasCreateSize-1)) || (mouseY < 0)) {return;}
    
    if ((mouseIsPressed) && (mouseButton === LEFT)) {
        
        if (((pmouseX > (canvasCreateSize-1)) || (pmouseX < 0)) || ((pmouseY > (canvasCreateSize-1)) || (pmouseY < 0))) {
            emitPixel(mouseX, mouseY);
            drawPixelSelf(mouseX, mouseY);
        }
        else {
            drawline(mouseX, mouseY, pmouseX, pmouseY);
        }
    }
}

function drawline(inX, inY, inPX, inPY) {
    var pixelDist = Math.ceil(getDistance(inX,inY, inPX, inPY)/canvasSize);
    if (pixelDist < 1) {
        emitPixel(inX, inY);
        drawPixelSelf(inX, inY);
    } else {
        for (var i = 0; i < pixelDist; i++) {
            var newX = lerp(inX, inPX, (1/pixelDist)*i);
            var newY = lerp(inY, inPY, (1/pixelDist)*i);
            emitPixel(newX, newY);
            drawPixelSelf(newX, newY);
        }
    }
}

function drawPixelSelf(inX, inY) {
    var tempX = Math.floor(inX/canvasSize);
    var tempY = Math.floor(inY/canvasSize);
    
    tempX = clamp(tempX, 0, gridSize);
    tempY = clamp(tempY, 0, gridSize);
    /*
    if ((tempX < 0) || (tempX > gridSize)) {return;}
    if ((tempY < 0) || (tempY > gridSize)) {return;}
    */
    canvasMap[tempX][tempY] = colorIndex;
}

function drawPixel(data) {
    canvasMap[data.X][data.Y] = data.Color;
}

function emitPixel(inX, inY) {
    var tempX = Math.floor(inX/canvasSize);
    var tempY = Math.floor(inY/canvasSize);
    
    tempX = clamp(tempX, 0, gridSize);
    tempY = clamp(tempY, 0, gridSize);
    /*
    if ((tempX < 0) || (tempX > gridSize)) {return;}
    if ((tempY < 0) || (tempY > gridSize)) {return;}
    */
    var mouseData = {
        Color: colorIndex,
        X: tempX,
        Y: tempY
    };
    socket.emit("updateMap", mouseData);
}

function newGame(gameData) {
    canvasMap = gameData.Grid;
    gridSize = gameData.Pixel;
    Palette = gameData.Palette;
    canvasSize = canvasCreateSize/gridSize;
    createPalette();
}


function getDistance(x1, y1, x2, y2) {
    var x = x2 - x1;
    var y = y2 - y1;
    return Math.sqrt(x * x + y * y);
}

function clamp(value, min, max) {
    if (value < min) {return min;}
    if (value > max) {return max;}
    return value;
}
