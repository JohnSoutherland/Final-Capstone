// Initializing the server
let express = require('express');
let app = express();
const port = process.env.PORT || 3000;
let server = app.listen(port);
let sockets = require('socket.io');
let io = sockets(server);

console.log('CONNECTION ESTABLISHED AT PORT ' + port);

app.use(express.static('public'));

io.on("connection", newConnection);


// Prompt variables
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
    "DNA",
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


// Palette And Mapping
const paletteColors = [
    //      6 COLORS
    [
        // default
        ["rgb(254,252,246)", "rgb(158,156,156)", "rgb(62,60,66)", "rgb(202,60,66)", "rgb(81,79,218)", "rgb(54,193,95)"],
        
        // PUFFBALL-6 by 'polyphrog' from Lospec
        ["rgb(238,219,200)", "rgb(224,187,104)", "rgb(151,179,78)", "rgb(213,131,83)", "rgb(84,139,113)", "rgb(90,71,62)"],
        
        // OIL 6 by 'GrafxKid' from Lospec
        ["rgb(251,245,239)", "rgb(242,211,171)", "rgb(198,159,165)", "rgb(139,109,156)", "rgb(73,77,126)", "rgb(39,39,68)"],
        
        // VINTAGE VOLTAGE by 'SoundsDotZip' from Lospec
        ["rgb(255,245,217)", "rgb(245,214,137)", "rgb(235,162,84)", "rgb(47,114,158)", "rgb(38,61,110)", "rgb(25,25,48)"],
        
        // BRAZIL FLAG++ by 'o_emanuel' from Lospec
        ["rgb(224,232,205)", "rgb(230,203,71)", "rgb(222,145,57)", "rgb(57,164,65)", "rgb(66,94,154)", "rgb(39,33,53)"]
        
        //
        //["","","","","",""]
    ],
    
    //      4 COLORS
    [
        ["rgb(254, 252, 246)","rgb(158, 156, 156)","rgb(62, 60, 66)","rgb(202, 60, 66)"],
        
    ],
    
    //      2 COLORS
    [
        ["rgb(255,255,255)","rgb(0,0,0)"],
        ["rgb(223, 21, 33)","rgb(20, 45, 50)"]
    ],
];
const canvasOptions = [
    {
        size: 32,
        scale: 0.5,
        palette: paletteColors[0]
    },
    {
        size: 24,
        scale: 1.0,
        palette: paletteColors[1]
    },
    {
        size: 16,
        scale: 2.0,
        palette: paletteColors[2]
    },
    {
        size: 8,
        scale: 4.0,
        palette: paletteColors[2]
    }
];

let canvasMap;

let optionIndex = 0;

let currentPalette = paletteColors[0][0];

function newCanvas() {
    var newSize = canvasOptions[optionIndex].size;
    canvasMap = new Array(newSize);
    for (var i = 0; i < canvasMap.length; i++) {
        canvasMap[i] = new Array(newSize);
        for (var j = 0; j < canvasMap[i].length; j++) {
            canvasMap[i][j] = 0;
        }
    }
}
newCanvas();

function returnGameData() {
    var gameData = {
        Grid: canvasMap,
        Pixel: canvasOptions[optionIndex].size,
        Palette: currentPalette
    };
    return gameData;
}


// Manipulating PlayerList
const MIN_PLAYER_COUNT = 2;

let playerList = [];
let loggedplayers = 0;
let prev_loggedplayerLength = -1;
let playerDrawer = 0;
let playersGuessed = 0;

function addToPlayerList(playerID) {
    var playerInfo = {
        ID: playerID,
        Username: "",
        loggedIn: false,
        isDrawer: false,
        alreadyGuessed: false,
        points: 0
    };
    var length = playerList.push(playerInfo);
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
    var startOver = false;
    
    for (var i = 0; i < playerList.length; i++) {
        if (playerList[i].ID === playerID) {
            if (playerList[i].loggedIn) {
                // store the number of logged players here.
                prev_loggedplayerLength = loggedplayers;
                loggedplayers--;
            }
            
            if (i < playerDrawer) {
                playerDrawer--;
            } else if (i == playerDrawer) {
                startOver = true;
            }
            
            // remove player from list
            playerList.splice(i,1);
            break;
        }
        
    }
    
    if (startOver) {
        next_artist();
        newGame();
    }
    
    /*
    if (loggedplayers >= MIN_PLAYER_COUNT) {
        
        if (playerList[playerDrawer].isDrawer == false) {
            playerList[playerDrawer].isDrawer = true;
            newGame();
        }
    }*/
    
    if (playerList.length < MIN_PLAYER_COUNT) {
        //currentPrompt = -1;
        io.emit("drawPrompt", "please wait for enough players to join.");
        io.emit("timerTick", "--");
        io.emit("setUserStatus", "neither");
        clearInterval(timerInterval);
        gamePlaying = false;
    }
    //return false;
}


// Timer/Gameplay Functions
const MAX_GAME_TIMER = 75;
const MAX_WAIT_TIMER = 10;

let timerInterval;
let gamePlaying = false;
let timer = MAX_GAME_TIMER;
let timerRanOut = true;

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
    }
    io.emit("timerTick", timer);
}


//  Manipulating the Game settings
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
    var playersAvailabe = 0;
    
    for (var i = 0; i < playerList.length; i++) {
        if (playerList[i].loggedIn == false) {continue;}
        playersAvailabe++;
        //if (playerList[i].alreadyGuessed) {playersGuessed++;}
        
        var playerEntry = {
            name: playerList[i].Username,
            points:  playerList[i].points
        };
        results.push(playerEntry);
    }
    results.sort(compare);
    
    var data = {
        result: results,
        prompt: promptList[currentPrompt],
        timerup: timerRanOut
    }
    
    io.emit("showResults", data);
}

function newGame() {
    // resetting timer
    gamePlaying = true;
    timer = MAX_GAME_TIMER;
    clearInterval(timerInterval);
    timerRanOut = true; 
    
    // Picking a new prompt for artist
    var newPrompt = 0;
    do {
        newPrompt = Math.floor(Math.random() * promptList.length);
    } while(newPrompt == currentPrompt);
    currentPrompt = newPrompt;
    
    // Picking a new random palette
    var paletteSelection = canvasOptions[optionIndex].palette;
    var paletteIndex = Math.floor(Math.random() * paletteSelection.length);
    currentPalette = paletteSelection[paletteIndex];
    
    newCanvas();
    
    // sending new game data to players
    var gameData = returnGameData();
    io.emit("newMap", gameData);
    
    // Setting the status of all players
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
    
    // starting the timer here.
    timerInterval = setInterval(timerTick, 1000);
}

function next_artist() {
    
    if ((playerDrawer > -1) && (loggedplayers >= MIN_PLAYER_COUNT)){
        
        // is the index out of range?
        if (playerDrawer >= playerList.length) {
            // it's out of range; loop back around and find a viable candidate.
            playerDrawer = (playerDrawer%playerList.length)
            while (!playerList[playerDrawer].loggedIn) {
                playerDrawer = (playerDrawer+1)%playerList.length;
            }
        }
        else {
            // list is still within range; just go to next one
            playerList[playerDrawer].isDrawer = false;
            do {
                playerDrawer = (playerDrawer+1)%playerList.length;
            } while (!playerList[playerDrawer].loggedIn);
        }
        // make the new one the artist. 
        playerList[playerDrawer].isDrawer = true;
    }
    else {
        // index is out of range. just move it to 0.
        playerDrawer = 0;
        if (playerList.length > 0) {
            // if there's only one player, make them the artist for now. 
            playerList[playerDrawer].isDrawer = true;
        }
    }
}


// Player Connections
function newConnection(socket) {
    console.log("%s connected.", socket.id);
    addToPlayerList(socket.id);
    console.log(playerList.length);
    socket.emit("justJoined", returnGameData());
    socket.on("updateMap", updateMap);
    socket.on("loginUser", logInPlayer);
    socket.on("requestPrompt", retrievePrompt);
    socket.on("userGuess", compareGuess);
    socket.on("setGameParameters", setNewParameters);
    
    socket.on("disconnect", () => {
        console.log("%s disconnected.", socket.id);
        removeFromPlayerList(socket.id);
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
            var awardedPoints = Math.round(50*(timer/MAX_GAME_TIMER) * canvasOptions[optionIndex].scale);
            playerList[index].points += awardedPoints;
            playerList[playerDrawer].points += Math.round(awardedPoints/(playerList.length-1));
            
            console.log("%s has guessed correctly!", playerList[index].Username);
            playersGuessed++;
            
            if (playersGuessed >= (loggedplayers-1)) {
                // excluding the Artist
                timerRanOut = false;
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
            
            prev_loggedplayerLength = loggedplayers;
            loggedplayers++;
            
            if (loggedplayers < MIN_PLAYER_COUNT) {
                playerDrawer = index;
                playerList[playerDrawer].isDrawer = true;
            }
            
            var status = "guesser";

            if ((!gamePlaying) || (playerList.length < MIN_PLAYER_COUNT)) {
                status = "neither";
            }
            
            socket.emit("setUserStatus", status);
        }
        if ((prev_loggedplayerLength < MIN_PLAYER_COUNT) && (loggedplayers >= MIN_PLAYER_COUNT)) {
            //clearInterval(timerInterval);
            next_artist();
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
        // check if player is the artist.
        var player = findPlayerByID(socket.id);
        if (player > -1) {
            if (!playerList[player].isDrawer) {return;}
        }
        
        canvasMap[data.X][data.Y] = data.Color;
        socket.broadcast.emit("updateClientMap", data);
    }
    
    function setNewParameters(index) {
        // check if player is the artist.
        var player = findPlayerByID(socket.id);
        if (player > -1) {
            if (!playerList[index].isDrawer) {return;}
        }
        
        // check if index is even within range
        if ((index > -1) && (index < canvasOptions.length)) {
            optionIndex = index;

            // Picking a new random palette
            var paletteSelection = canvasOptions[optionIndex].palette;
            var paletteIndex = Math.floor(Math.random() * paletteSelection.length);
            currentPalette = paletteSelection[paletteIndex];
            
            newCanvas();
            // send to everyone
            io.emit("newMap", returnGameData());
        }
    }
    
}; 