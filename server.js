let express = require('express');
let app = express();
const port = process.env.PORT || 3000;
let server = app.listen(port);
let sockets = require('socket.io');
let io = sockets(server);

let canvasMap;

let canvasSize = [8, 16, 24, 32];
/*let currentPalette = ["rgb(254, 252, 246)","rgb(158, 156, 156)"];*/
let currentPalette = ["rgb(254, 252, 246)","rgb(158, 156, 156)","rgb(62, 60, 66)","rgb(202, 60, 66)"];

var sizeIndex = 3;

let playerList = [];
let playerDrawer = 0;

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


function addToPlayerList(playerID) {
    var playerInfo = {
        ID: playerID,
        Username: "",
        loggedIn: false,
        isDrawer: true,     // change to false after implementing gameplay
        alreadyGuessed: false,
        points: 0
    };
    
    var length = playerList.push(playerInfo);
    if (length > 2) {
        // begin the game
    }
}

function findPlayer(playerID) {
    for (var i = 0; i < playerList; i++) {
        if (playerList[i].ID == playerID) {
            return i;
        }
    }
    return -1;
}



function removeFromPlayerList(playerID) {
    for (var i = 0; i < playerList.length; i++) {
        if (playerList[i].ID == playerID) {
            playerList.splice(i,1);
            //return true;
        }
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

function newGame(data) {
    // asdadasdas
}

function newConnection(socket) {
    console.log("%s connected.", socket.id);
    addToPlayerList(socket.id);
    console.log(playerList.length);
    socket.emit("justJoined", returnGame());
    socket.on("nextGame", newGame);
    socket.on("updateMap", updateMap);
    socket.on("loginUser", logInPlayer);
    
    
    socket.on("disconnect", () => {
        //console.log("%s disconnected.", socket.id);
        removeFromPlayerList(socket.id);
        console.log(playerList.length)
    });
    
    
    function logInPlayer() {
        var index = findPlayer(socket.id);
        if (index != -1) {
        playerList[index].loggedIn = true;
        playerList[index].Username = PlayerInfo.Username;
        }
    }
    
    function updateMap(data) {
        canvasMap[data.X][data.Y] = data.Color;
        socket.broadcast.emit("updateClientMap", data);
    }
    
};