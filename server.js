let express = require('express');
let app = express();
const port = process.env.PORT || 3000;
let server = app.listen(port);
let sockets = require('socket.io');
let io = sockets(server);

const MAX_GAME_TIMER = 15;
const MAX_WAIT_TIMER = 7;

let canvasMap;

let canvasSize = [8, 16, 24, 32];
/*let currentPalette = ["rgb(254, 252, 246)","rgb(158, 156, 156)"];*/
let currentPalette = ["rgb(254, 252, 246)","rgb(158, 156, 156)","rgb(62, 60, 66)","rgb(202, 60, 66)"];

var sizeIndex = 3;

let playerList = [];
let playerDrawer = 0;
//let playersGuessed = 0;

let promptList = [
    "food",
    "money",
    "traffic",
    "car",
    "author",
    "library",
    "news",
    "music",
    "people",
    "crystal",
    "monster",
    "bed"
]

let currentPrompt = -1;


let timerInterval;
let gamePlaying = true;
let timer = MAX_GAME_TIMER;

function timerTick() {
    timer--;
    console.log("timer: %d", timer);
    
    if (timer <= 0) {
        
        
        if (gamePlaying) {
            timer = MAX_WAIT_TIMER;
        }
        else {
            timer = MAX_GAME_TIMER;
            next_artist();
            clearInterval(timerInterval);
            newGame();
        }
        console.log("timer-reset: %d", timer);
        //playerDrawer = (playerDrawer+1)%playerList.length;
        gamePlaying = !gamePlaying;
    }
}

//creating new map
function newCanvas() {
    canvasMap = new Array(canvasSize[sizeIndex]);
    for (var i = 0; i < canvasMap.length; i++) {
        canvasMap[i] = new Array(canvasSize[sizeIndex]);
        for (var j = 0; j < canvasMap[i].length; j++) {
            canvasMap[i][j] = 0;
        }
    }
}

console.log('CONNECTION ESTABLISHED AT PORT ' + port);
newCanvas();

app.use(express.static('public'));

io.on("connection", newConnection);

function next_artist() {
    playerList[playerDrawer].isDrawer = false;
    playerDrawer = (playerDrawer+1)%playerList.length;
    playerList[playerDrawer].isDrawer = true;
}

function addToPlayerList(playerID) {
    var playerInfo = {
        ID: playerID,
        Username: "",
        loggedIn: false,
        isDrawer: false,
        alreadyGuessed: false,
        points: 0
    };
    
    //var prev_length = playerList.length;
    var length = playerList.push(playerInfo);
    //if ((length > 1) && (prev_length < 2)) { 
        // Only start a new game if there are enough players
        // and ONLY when there weren't enough players prior.
        
        // Okay this is not going well.
        //newGame();
    //}
}

function findPlayerByID(playerID) {
    for (var i = 0; i < playerList.length; i++) {
        if (playerList[i].ID === playerID) {
            return i;
        }
    }
    return -1;
}
function findPlayerByName(playerName) {
    for (var i = 0; i < playerList.length; i++) {
        if (playerList[i].Username === playerName) {
            return i;
        }
    }
    return -1;
}

function removeFromPlayerList(playerID) {
    for (var i = 0; i < playerList.length; i++) {
        if (playerList[i].ID === playerID) {
            playerList.splice(i,1);
            
            
            if (i < playerDrawer) {
                playerDrawer--;
                //since we're removing one player here
            }
            //playerDrawer = (playerDrawer%(playerList.length));
            
            
            if (playerList.length > 0) {
                if (playerList[playerDrawer].isDrawer == false) {
                    
                    playerList[playerDrawer].isDrawer = true;
                    io.to(playerList[playerDrawer].ID).emit("setUserStatus", "artist");
                }
            }
            
            // Might need to change this soon.
            return;
        }
        
    }
    if (playerList.length == 1) {
        //currentPrompt = -1;
        io.to(playerList[0].ID).emit("drawPrompt", "please wait for enough players to join.");
        clearInterval(timerInterval);
        gamePlaying = false;
    }
    //return false;
}



function returnGame() {
    var gameData = {
        Grid: canvasMap,
        Pixel: canvasSize[sizeIndex],
        Palette: currentPalette
    };
    return gameData;
}

function newGame() {
    newCanvas();
    timer = MAX_GAME_TIMER;
    currentPrompt = Math.floor(Math.random() * promptList.length);
    console.log("%d", currentPrompt);
    //currentPrompt++;
    
    io.emit("newMap", returnGame());
    
    // Set all players Statuses...
    for (var i = 0; i < playerList.length; i++) {
        playerList[i].alreadyGuessed = false;
        
        var new_status = "guesser";
        
        if (playerList[i].isDrawer == true) {
            console.log("%s is now the artist!", playerList[i].Username);
            new_status = "artist";
        }
        
        io.to(playerList[i].ID).emit("setUserStatus", new_status);
    }
    
    timerInterval = setInterval(timerTick, 1000);
    // asdadasda
}

function newConnection(socket) {
    console.log("%s connected.", socket.id);
    addToPlayerList(socket.id);
    console.log(playerList.length);
    socket.emit("justJoined", returnGame());
    //socket.on("nextGame", newGame);
    socket.on("updateMap", updateMap);
    socket.on("loginUser", logInPlayer);
    socket.on("requestPrompt", retrievePrompt);
    
    socket.on("disconnect", () => {
        console.log("%s disconnected.", socket.id);
        removeFromPlayerList(socket.id);
        clearInterval(timerInterval);
        gamePlaying = false;
        console.log(playerList.length)
    });
    
    
    function logInPlayer(username) {
        var index = findPlayerByID(socket.id);
        var nameIndex = findPlayerByName(username);
        if ((index != -1) && (nameIndex == -1)) {
            playerList[index].loggedIn = true;
            playerList[index].Username = username;
            console.log("%s logged in as %s successfully.", socket.id, username);
            
            var status = "guesser"
            if (index == 0) {   
                // the player is the first to join
                playerList[index].isDrawer = true;
                playerDrawer = index;
                status = "artist";
            }
            socket.emit("setUserStatus", status);
        }
        if (playerList.length > 1) {
            newGame();
        }
    }
    
    function retrievePrompt() {
        var index = findPlayerByID(socket.id);
        if (index != -1) {
            let promptOutput = "-- nope --";
            
            if (playerList[index].isDrawer == true) {
                promptOutput = promptList[currentPrompt];
            }
            
            if (playerList.length < 2) {
                promptOutput = "please wait for enough players to join.";
            }
            
            console.log("%s", promptOutput);
            socket.emit("drawPrompt", promptOutput);
        }
    }
    
    function updateMap(data) {
        canvasMap[data.X][data.Y] = data.Color;
        socket.broadcast.emit("updateClientMap", data);
    }
    
};