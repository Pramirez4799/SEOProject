let numberOfSongsGuessed = 0;
let numOfSongs = 0;
let correctSong;
const choicesArray = [];
const songsArray = []; 
let roundNum = 0;

// Function to reset game data
function resetGame() {
    numberOfSongsGuessed = 0;
    numOfSongs = 0;
    correctSong = null;
    choicesArray.length = 0;
    songsArray.length = 0; // Clear songsArray
}

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

// Add event listeners
songChoice1.addEventListener("click", handleSongChoiceClick0);
songChoice2.addEventListener("click", handleSongChoiceClick1);
songChoice3.addEventListener("click", handleSongChoiceClick2);
songChoice4.addEventListener("click", handleSongChoiceClick3);

// Variables to keep track of the time
let countdownTime = 120; // Time in seconds
let timerInterval;

// Get playlistId from URL parameters and fetch songs
// const queryParams = getQueryParams();
// Start the countdown timer
startCountdown();
// Reset the game state
resetGame();
initializePage();

// Functions below

function getPlaylistId() {
    return sessionStorage.getItem('playlistId');
}

async function initializePage() {
    const playlistId = getPlaylistId();
    await fetchSongs(playlistId);
    loadSongsToPage();
}

// Grab all songs and load to songs array (only need to do once)
async function fetchSongs(playlistId) {
    try {
        // Add a cache-busting query parameter
        const response = await fetch(`/playlist/${playlistId}/tracks?nocache=${new Date().getTime()}`);
        const data = await response.json();

        if (data.error) {
            console.error('Error fetching playlist songs:', data.error);
            return;
        }

        // Clear the songsArray before adding new songs
        songsArray.length = 0;

        // Add songs to songsArray with name and preview URLs
        data.items.forEach(item => {
            songsArray.push({ name: item.track.name, preview_url: item.track.preview_url });
        });

    } catch (error) {
        console.error('Error fetching playlist songs:', error);
    }
}

// Function to handle the guess
function handleGuess(selectedSong) {
    if (selectedSong.name === correctSong.name) {
        console.log("Nice!");
        numberOfSongsGuessed++;
        updateAnswer(true);
    } else {
        console.log("Wrong!");
        updateAnswer(false);
    }
}

// Function to shuffle the choicesArray
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Function to play the selected song
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

// Function to get id from URL
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params.entries());
}

function loadSongsToPage() {
    // Only quiz up to 10 songs 
    if(numOfSongs < 11){
        // Log songs to the console
        console.log('Songs:', songsArray);
        console.log(numberOfSongsGuessed);

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
        // Change song names
        songChoice1.innerHTML = choicesArray[0].name;
        songChoice2.innerHTML = choicesArray[1].name;
        songChoice3.innerHTML = choicesArray[2].name;
        songChoice4.innerHTML = choicesArray[3].name;

        // Automatically play the correct song
        playSong(correctSong.preview_url);
        numOfSongs++;
        roundNum++;
        if (roundNum < 11){
            document.getElementById('roundnumber').innerHTML = roundNum;
        }
    }
}

// Function to start the countdown timer
function startCountdown() {
    // Clear any existing interval
    clearInterval(timerInterval);

    // Update the timer display every second
    timerInterval = setInterval(() => {
        countdownTime--;
        
        // Update the display
        updateTimerDisplay(countdownTime);

        // Stop the timer if time is up
        if (countdownTime <= 0) {
            clearInterval(timerInterval);
            handleTimeUp();
        }
    }, 1000);
}

// Function to update the timer display
function updateTimerDisplay(time) {
    // Convert seconds to minutes and seconds
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    
    // Format display 
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timer123').innerHTML = display;
}

function updateAnswer(value) {
    if (value === true){
        document.getElementById('footer').innerHTML = "Correct";
    }
    else if (value === false){
        document.getElementById('footer').innerHTML = "Wrong";
    }
    
    // Check if 10 songs have been guessed
    if (numOfSongs >= 10) {
        showModal();
    }
}

// Handle what happens when time runs out 
function handleTimeUp() {
    console.log('Time is up!');
    showModal();
}

function showModal() {
    document.getElementById('my_modal_6').checked = true;
}
