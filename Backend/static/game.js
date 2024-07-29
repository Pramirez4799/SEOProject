let numberOfSongsGuessed = 0;
let correctSong; 
const choicesArray = [];
// array that stores all songs of playlist 
const songsArray = [];
// Get playlistId from URL parameters and fetch songs
const queryParams = getQueryParams();
initializePage();

//functions below!!!!!!!!!!!!!!!!!!!!!!!!
async function initializePage() {
    await fetchSongs(queryParams.playlistId);
    loadSongsToPage();
}
//grab all songs and load to songs array (only need to do once )
async function fetchSongs(playlistId) {
    try {
        const response = await fetch(`/playlist/${playlistId}/tracks`);
        const data = await response.json();

        if (data.error) {
            console.error('Error fetching playlist songs:', data.error);
            return;
        }

        //add songs to songsArray with name and preview URLs
        data.items.forEach(item => {
            songsArray.push({ name: item.track.name, preview_url: item.track.preview_url });
        });

        console.log('Songs:', songsArray);
    } catch (error) {
        console.error('Error fetching playlist songs:', error);
    }
}
// function to handle the guess
function handleGuess(selectedSong) {
    if (selectedSong.name === correctSong.name) {
        console.log("Nice!");
        numberOfSongsGuessed++;
    } else {
        console.log("Wrongggggggggggggggg");
    }
    //load songs again after a guess
    loadSongsToPage();
}

// function to shuffle the choicesArray
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// function to play the selected song
function playSong(previewUrl) {
    const audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.src = previewUrl;
    audioPlayer.play();
}

//function to get id from url
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params.entries());
}

function loadSongsToPage(){
    //copy array of songs 
    const copiedSongsArray = [...songsArray];
    // Log songs to the console
    console.log('Songs:', songsArray);
    //select a random number and use that to determine song from array 
    const randomIndex = Math.floor(Math.random() * songsArray.length);
    correctSong = songsArray[randomIndex];
    // First index is always the correct song
    choicesArray[0] = correctSong;

    // Remove the correct song from the array so that the other three options are different songs 
    songsArray.splice(randomIndex, 1);

    // Select three more different songs and add them to choicesArray
    for (let i = 1; i < 4; i++) {
        const anotherRandomIndex = Math.floor(Math.random() * songsArray.length);
        const otherSong = copiedSongsArray[anotherRandomIndex];
        choicesArray[i] = otherSong;
        // Remove song from possible choices
        copiedSongsArray.splice(anotherRandomIndex, 1);
    }

    // Shuffle choicesArray to randomize the position of the correct song
    shuffleArray(choicesArray);

    // Display songs in HTML elements
    const songChoice1 = document.getElementById("song1");
    const songChoice2 = document.getElementById("song2");
    const songChoice3 = document.getElementById("song3");
    const songChoice4 = document.getElementById("song4");
    songChoice1.innerHTML = choicesArray[0].name;
    songChoice2.innerHTML = choicesArray[1].name;
    songChoice3.innerHTML = choicesArray[2].name;
    songChoice4.innerHTML = choicesArray[3].name;

    // Automatically play the correct song
    playSong(correctSong.preview_url);

    // Set up event listeners for the choices
    songChoice1.addEventListener("click", function() {
        handleGuess(choicesArray[0]);
    });
    songChoice2.addEventListener("click", function() {
        handleGuess(choicesArray[1]);
    });
    songChoice3.addEventListener("click", function() {
        handleGuess(choicesArray[2]);
    });
    songChoice4.addEventListener("click", function() {
        handleGuess(choicesArray[3]);
    });
}
