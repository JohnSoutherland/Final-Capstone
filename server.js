let express = require('express');
let app = express();
const port = process.env.PORT || 3000;
let server = app.listen(port);
let sockets = require('socket.io');
let io = sockets(server);

let canvasMap;

const canvasDefaultSize = 384;
let canvasSize = [8, 16, 24, 32];
let currentPalette = ["rgb(254, 251, 246)","rgb(61, 60, 66)","rgb(255, 60, 66)","rgb(61, 60, 255)"];

var sizeIndex = 3;

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
    socket.emit("justJoined", returnGame());
    socket.on("nextGame", newGame);
    socket.on("updateMap", updateMap);
    
    
    socket.on("disconnect", () => {
        console.log("%s disconnected.", socket.id);
    });
    
    function updateMap(data) {
        canvasMap[data.X][data.Y] = data.Color;
        socket.broadcast.emit("updateClientMap", data);
    }
    
};