// https://stackoverflow.com/questions/21211906/get-value-from-element-in-the-clicked-class
function changeColorSelection() {
    colorIndex = this.getAttribute("data-index");
    var elements = document.getElementsByClassName("colors");
    for (var i = 0; i < elements.length; i++) {
        if (i == colorIndex) {
            elements[i].setAttribute("data-state","selected");
        } else {
            elements[i].setAttribute("data-state","unselected");
        }
    }
};

function fillCanvas() {
    if (sessionStorage.getItem("user-game-status") !== "artist") {return;}
    
    for (var i = 0; i < gridSize; i++) {
        for (var k = 0; k < gridSize; k++) {
            drawPixelSelf(i, k, false);
            emitPixel(i, k, false);
        }
    }
}

// Drawing functions
function checkMouse() {
    var player_status = sessionStorage.getItem("user-game-status");
    if (player_status !== "artist") {return;}
    
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

function drawPixelSelf(inX, inY, calculate = true) {
    var tempX = inX;
    var tempY = inY;
    
    if (calculate) {
        tempX = Math.floor(inX/canvasSize);
        tempY = Math.floor(inY/canvasSize);

        tempX = clamp(tempX, 0, gridSize);
        tempY = clamp(tempY, 0, gridSize);
    }
    /*
    if ((tempX < 0) || (tempX > gridSize)) {return;}
    if ((tempY < 0) || (tempY > gridSize)) {return;}
    */
    canvasMap[tempX][tempY] = colorIndex;
}

function drawPixel(data) {
    canvasMap[data.X][data.Y] = data.Color;
}

function emitPixel(inX, inY, calculate = true) {
    var tempX = inX;
    var tempY = inY;
    
    if (calculate) {
        tempX = Math.floor(inX/canvasSize);
        tempY = Math.floor(inY/canvasSize);

        tempX = clamp(tempX, 0, gridSize);
        tempY = clamp(tempY, 0, gridSize);
    }
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