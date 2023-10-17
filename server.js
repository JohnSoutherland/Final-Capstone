let express = require('express');
let app = express();
const port = process.env.PORT || 3000;
let server = app.listen(port);
let sockets = require('socket.io');
let io = sockets(server);

const MAX_GAME_TIMER = 60;
const MAX_WAIT_TIMER = 14;

const MIN_PLAYER_COUNT = 2;

let canvasMap;

let canvasSize = [32, 24, 16, 8];
/*let currentPalette = ["rgb(254, 252, 246)","rgb(158, 156, 156)"];*/
let currentPalette = ["rgb(254, 252, 246)","rgb(158, 156, 156)","rgb(62, 60, 66)","rgb(202, 60, 66)", "rgb(81, 79, 218)", "rgb(54, 193, 95)"];

var sizeIndex = 0;

let playerList = [];
let prev_loggedplayerLength = -1;
let playerDrawer = 0;
let playersGuessed = 0;

const promptList = [
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
    "bed",
    "noise",
    "hand",
    "magic",
    "happy",
    "teacher",
    "elephant",
    "athlete",
    "explosion",
    "love",
    "space",
    "marriage",
    "dessert",
    "desert",
    "magnetic",
    "orbit",
    "math",
    "earth",
    "garden",
    "sign",
    "random",
    "friendship",
    "movie",
    "alcohol",
    "virus",
    "football",
    "time",
    "genetics",
    "alert",
    "dungeon",
    "boss",
    "angry",
    "party",
    "plane",
    "cute",
    "judge",
    "computer",
    "forest",
    "pet"
];

let currentPrompt = -1;


let timerInterval;
let gamePlaying = true;
let timer = MAX_GAME_TIMER;

function timerTick() {
    timer--;
    //console.log("timer: %d", timer);
    
    if (timer <= 0) {
        if (gamePlaying) {
            playersGuessed = 0;
            timer = MAX_WAIT_TIMER;
            gamePlaying = false;
            showResults();
        }
        else {
            timer = MAX_GAME_TIMER;
            next_artist();
            newGame();
            gamePlaying = true;
        }
        console.log("timer-reset: %d", timer);
        //playerDrawer = (playerDrawer+1)%playerList.length;
    }
    io.emit("timerTick", timer);
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
    
    if (playerDrawer > -1) {
        
        playerList[playerDrawer].isDrawer = false;
        do {
            playerDrawer = (playerDrawer+1)%playerList.length;
        } while(!playerList[playerDrawer].loggedIn);

        playerList[playerDrawer].isDrawer = true;
    }
}

function addToPlayerList(playerID) {
    prev_loggedplayerLength = playerList.length;
    
    var playerInfo = {
        ID: playerID,
        Username: "",
        loggedIn: false,
        isDrawer: false,
        alreadyGuessed: false,
        points: 0
    };
    
    //prev_loggedplayerLength = playerList.length;
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
    prev_loggedplayerLength = playerList.length;
    
    for (var i = 0; i < playerList.length; i++) {
        if (playerList[i].ID === playerID) {
            playerList.splice(i,1);
            
            
            if (i < playerDrawer) {
                playerDrawer--;
                //since we're removing one player here
            }
            if (i == playerDrawer) {
                if (playerDrawer >= playerList.length) {
                    playerDrawer = playerDrawer%playerList.length;
                }
            }
            
            //playerDrawer = (playerDrawer%(playerList.length));
            // Might need to change this soon.
            break;
        }
        
    }
    
    if (playerList.length > 0) {
        if (playerList[playerDrawer].isDrawer == false) {

            playerList[playerDrawer].isDrawer = true;
            //clearInterval(timerInterval);
            newGame();
        }
    }
    
    if (playerList.length < MIN_PLAYER_COUNT) {
        //currentPrompt = -1;
        io.emit("drawPrompt", "please wait for enough players to join.");
        io.emit("timerTick", "--");
        io.emit("setUserStatus", "artist");
        clearInterval(timerInterval);
        gamePlaying = false;
    }
    //return false;
}

function showResults() {
    // sorting the whole thing from most to least points
    function compare(a,b) {
        if (a.points < b.points) {
            return 1;
        }
        if (a.points > b.points) {
            return -1;
        }
        return 0;
    }
    var results = [];
    
    for (var i = 0; i < playerList.length; i++) {
        var playerEntry = {
            name: playerList[i].Username,
            points:  playerList[i].points
        };
        results.push(playerEntry);
    }
    results.sort(compare);
    
    var data = {
        result: results,
        prompt: promptList[currentPrompt]
    }
    
    io.emit("showResults", data);
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
    gamePlaying = true;
    timer = MAX_GAME_TIMER;
    clearInterval(timerInterval);
    
    var newPrompt = 0;
    do {
        newPrompt = Math.floor(Math.random() * promptList.length);
    } while(newPrompt == currentPrompt);
    
    currentPrompt = newPrompt;
    //console.log("%d", currentPrompt);
    //currentPrompt++;
    
    io.emit("newMap", returnGame());
    
    // Set all players Statuses...
    for (var i = 0; i < playerList.length; i++) {
        if (playerList[i].loggedIn == false) {continue;}
        
        playerList[i].alreadyGuessed = false;
        
        var new_status = "guesser";
        
        if (playerList[i].isDrawer == true) {
            console.log("%s is now the artist!", playerList[i].Username);
            new_status = "artist";
        }
        
        io.to(playerList[i].ID).emit("setUserStatus", new_status);
    }
    playersGuessed = 0;
    
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
    socket.on("userGuess", compareGuess);
    
    socket.on("disconnect", () => {
        console.log("%s disconnected.", socket.id);
        removeFromPlayerList(socket.id);
        //clearInterval(timerInterval);
        //gamePlaying = false;
        console.log(playerList.length)
    });
    
    function compareGuess(guess) {
        console.log("%s has guessed %s", socket.id, guess);
        if (guess === promptList[currentPrompt]) {
            var index = findPlayerByID(socket.id);
            
            if (index == -1) {return;}
            if (playerList[index].alreadyGuessed) {return;}
            if (!gamePlaying) {return;}
            
            playerList[index].alreadyGuessed = true;
            // award points...
            var awardedPoints = Math.round(50*(timer/MAX_GAME_TIMER))
            playerList[index].points += awardedPoints;
            playerList[playerDrawer].points += Math.round(awardedPoints/(playerList.length-1));
            
            console.log("%s has guessed correctly!", playerList[index].Username);
            playersGuessed++;
            if (playersGuessed >= playerList.length-1) {
                timer = 0;
            }
            socket.emit("disableGuess", true);
        }
    }
    
    function logInPlayer(username) {
        var index = findPlayerByID(socket.id);
        var nameIndex = findPlayerByName(username);
        if ((index != -1) && (nameIndex == -1)) {
            playerList[index].loggedIn = true;
            playerList[index].Username = username;
            console.log("%s logged in as %s successfully.", socket.id, username);
            //prev_loggedplayerLength = playerList.length;
            
            var status = "guesser"
            if (playerList.length < MIN_PLAYER_COUNT) {   
                // the player is the first to join
                playerList[index].isDrawer = true;
                playerDrawer = index;
                status = "artist";
            }
            if ((!gamePlaying) || (playerList.length < MIN_PLAYER_COUNT)) {
                status = "neither";
            }
            
            socket.emit("setUserStatus", status);
        }
        if ((prev_loggedplayerLength < MIN_PLAYER_COUNT) && (playerList.length >= MIN_PLAYER_COUNT)) {
            clearInterval(timerInterval);
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
            
            if (playerList.length < MIN_PLAYER_COUNT) {
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