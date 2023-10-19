let socket;

const Default_canvasCreateSize = 480;
const Mobile_canvasCreateSize = 384;
let canvasCreateSize = Default_canvasCreateSize;

let gridSize = 0;
let canvasMap = [];
let Palette = [];

let canvasSize = 0;

var colorIndex = 0;

sessionStorage.setItem("user-game-status","just-joined");

function setup() {
    
    if (window.innerWidth < 500) {
        canvasCreateSize = Mobile_canvasCreateSize; 
    }
    
    let canvas = createCanvas(canvasCreateSize, canvasCreateSize);
    canvas.parent("canvas-holder");
    
    colorMode(RGB, 255);
    rectMode(CORNER);
    noStroke();
    
    socket = io();
    socket.on("justJoined", newGame);
    socket.on("newMap", newGame);
    socket.on("updateClientMap", drawPixel);
    socket.on("setUserStatus", setUserStatus);
    //socket.on("updateArtist", updateArtist);
    socket.on("drawPrompt", setPromptDiv);
    socket.on("timerTick", updateTimer);
    socket.on("disableGuess", disableGuessing);
    socket.on("showResults", displayResults);
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

function updateTimer(newTime) {
    var timer = document.getElementById("timer");
    timer.innerHTML = newTime;
}

// User-related functions
function validateUsername() {    
    let username = document.getElementById("username").value.trim();
    
    var trimmedName = username.trim();
    
    if ((trimmedName.length >= 3) && ((trimmedName.search(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/) == -1)) && (trimmedName !== "")) {
        //setUserStatus("guesser");
        sessionStorage.setItem("user-login-name", trimmedName);
        socket.emit('loginUser', trimmedName);
    }
}

/*
//function updateArtist(isGuesser) //{
    /// uhh
//}
*/

function newGame(gameData) {
    var results = document.getElementById('results-holder');
    if (results) {
        results.remove();
    }
    canvasMap = gameData.Grid;
    gridSize = gameData.Pixel;
    Palette = gameData.Palette;
    canvasSize = canvasCreateSize/gridSize;
    //createPalette();
}

function setPromptDiv(prompt) {
    var holder = document.getElementById("prompt-holder");
    holder.innerHTML = "";
    
    var text = document.createElement("span");
    text.setAttribute("id","prompt");
    text.innerHTML = prompt;
    
    holder.appendChild(text);
}

function setUserStatus(drawStatus) {
    var selection = document.getElementById('login-menu');
    if (selection) {
        selection.remove();
    }
    
    var usernameHold = document.getElementById("username-display");
    if (usernameHold && (usernameHold.innerHTML === "")) {
        usernameHold.innerHTML = sessionStorage.getItem("user-login-name");
    }
    
    sessionStorage.setItem("user-game-status", drawStatus);
    //console.log("setting status to %s;", drawStatus);
    
    if (drawStatus === "artist") {
        createPalette();
        socket.emit("requestPrompt");
    } else if (drawStatus === "guesser") {
        createUserInput();
        document.getElementById("prompt-holder").innerHTML = "";
    }
}

function createUserInput() {
    let selection = document.getElementById("selection");
    selection.innerHTML = "";
    
    var input = document.createElement("input");
    input.setAttribute("type","text");
    input.setAttribute("id","guess-input");
    input.setAttribute("placeholder","Enter Guess here");
    input.setAttribute("maxlength", "16");
    input.addEventListener("keyup", (e) => {
        if (e.keyCode == 13) {
            //console.log("ENTER PRESSED;");
            validateUserGuess();
        }
    });
    
    selection.appendChild(input);
    
    document.getElementById("prompt-holder").innerHTML = "";
}

function validateUserGuess() {
    //console.log("guessssss")
    var guess = document.getElementById("guess-input");
    var UserStatus = sessionStorage.getItem("user-game-status");
    if (((guess) && (guess.value.trim() !== "")) && (UserStatus === "guesser")) {
        socket.emit("userGuess", guess.value.trim());
        guess.value = "";
    }
}

function disableGuessing(disable) {
    var guessInput = document.getElementById("guess-input");
    if (guessInput) {
        guessInput.setAttribute("disabled", disable);
        guessInput.setAttribute("placeholder", "You Guessed Correctly!");
    }
}

function displayResults(data) {
    
    // clear most of the UI
    sessionStorage.setItem("user-game-status", "neither");
    
    document.getElementById("selection").innerHTML = "";
    document.getElementById("prompt-holder").innerHTML = "";
    
    var resultholder = document.createElement("div");
    resultholder.setAttribute("id", "results-holder");
    resultholder.setAttribute("data-time-up", data.timerup);
    
    var header = document.createElement("h1");
    var textholder = "TIME'S UP!";
    if (data.timerup == false) {
        textholder = "EVERYONE GUESSED CORRECTLY!"
    }
    
    var text = document.createTextNode(textholder);
    header.append(text);
    resultholder.appendChild(header);
    
    header = document.createElement("h2");
    textholder = data.prompt.charAt(0).toUpperCase() + data.prompt.slice(1);
    
    text = document.createTextNode(
    "The word was \""+textholder+"\".");
    header.append(text);
    resultholder.appendChild(header);
    
    header = document.createElement("h4");
    text = document.createTextNode("Scoreboard:");
    header.append(text);
    resultholder.appendChild(header);
    
    var results = document.createElement("table");
    results.innerHTML = "";
    
    var scoreboard = data.result;
    for (var i = 0; i < scoreboard.length; i++) {
        var newRow = document.createElement("tr");
        var entry = document.createElement("td");
        
        entry.append( document.createTextNode(scoreboard[i].name) );
        newRow.appendChild(entry);
        
        entry = document.createElement("td");
        entry.append( document.createTextNode(scoreboard[i].points) );
        newRow.appendChild(entry);
        
        results.appendChild(newRow);
    }
    
    resultholder.appendChild(results);
    document.body.appendChild(resultholder);
}
