let numberOfSongsGuessed = 0;
let correctSong; 
const choicesArray = [];
// Display songs in HTML elements
const songChoice1 = document.getElementById("song1");
const songChoice2 = document.getElementById("song2");
const songChoice3 = document.getElementById("song3");
const songChoice4 = document.getElementById("song4");
function handleSongChoiceClick0() {
    handleGuess(choicesArray[0]);
    loadSongsToPage();
}
function handleSongChoiceClick1() {
    handleGuess(choicesArray[1]);
    loadSongsToPage();
}
function handleSongChoiceClick2() {
    handleGuess(choicesArray[2]);
    loadSongsToPage();
}
function handleSongChoiceClick3() {
    handleGuess(choicesArray[3]);
    loadSongsToPage();
}
// Add new event listeners
songChoice1.addEventListener("click", handleSongChoiceClick0);
songChoice2.addEventListener("click", handleSongChoiceClick1);
songChoice3.addEventListener("click", handleSongChoiceClick2);
songChoice4.addEventListener("click", handleSongChoiceClick3);
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

        // console.log('Songs:', songsArray);
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
    
    // Stop any previous playback
    if (!audioPlayer.paused) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0; // Reset playback position
    }
    
    // Set up a new source
    audioPlayer.src = previewUrl;

    // Ensure the audio is ready to play before calling play
    audioPlayer.addEventListener('canplaythrough', function onCanPlayThrough() {
        audioPlayer.play().catch(error => {
            console.error('Error playing the song:', error);
        });
        // Remove the event listener after it has been called
        audioPlayer.removeEventListener('canplaythrough', onCanPlayThrough);
    }, { once: true }); // The event listener is only needed once
}


//function to get id from url
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params.entries());
}

function loadSongsToPage() {
    // Log songs to the console
    console.log('Songs:', songsArray);
    
    // Select a random number and use that to determine the correct song from the array
    const randomIndex = Math.floor(Math.random() * songsArray.length);
    correctSong = songsArray[randomIndex];
    
    // First index is always the correct song
    choicesArray[0] = correctSong;
    songsArray.splice(randomIndex, 1);
    // Copy the array of songs
    const copiedSongsArray = [...songsArray];
    
    // Remove the correct song from the array so that the other three options are different songs
    copiedSongsArray.splice(randomIndex, 1);

    // Select three more different songs and add them to choicesArray
    for (let i = 1; i < 4; i++) {
        const anotherRandomIndex = Math.floor(Math.random() * copiedSongsArray.length);
        const otherSong = copiedSongsArray[anotherRandomIndex];
        choicesArray[i] = otherSong;
        // Remove song from possible choices
        copiedSongsArray.splice(anotherRandomIndex, 1);
    }

    console.log('Copied Songs Array:', copiedSongsArray);
    
    // Shuffle choicesArray to randomize the position of the correct song
    shuffleArray(choicesArray);
    //change song names
    songChoice1.innerHTML = choicesArray[0].name;
    songChoice2.innerHTML = choicesArray[1].name;
    songChoice3.innerHTML = choicesArray[2].name;
    songChoice4.innerHTML = choicesArray[3].name;

    // Automatically play the correct song
    playSong(correctSong.preview_url);
}






