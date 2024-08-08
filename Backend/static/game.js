let numberOfSongsGuessed = 0;
//current song postion
let songCount = 0;
// TODO: remove this variable and use another
//green round number on display
let roundNum = 0;
//correct song to be guessed
let correctSong;
//choices of songs
const choicesArray = [];
//storage of playlist songs
const songsArray = [];
let difficulty = 0;
let totalRounds = 0;
// Variables to keep track of the time
let initialTime = null;
let countdownTime = null; // Time in seconds
let timerInterval;
// Function to reset game data
function resetGame() {
  numberOfSongsGuessed = 0;
  songCount = 0;
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

// Get playlistId from URL parameters and fetch songs
// const queryParams = getQueryParams();
// Start the countdown timer
startCountdown();
// Reset the game state
resetGame();
initializePage();

// Functions below

// TODO: add this to getVariablesFromSettings function
function getPlaylistId() {
  return sessionStorage.getItem("playlistId");
}
function getDifficulty() {
  return sessionStorage.getItem("selectedDifficulty");
}
function getTotalSongs() {
  return sessionStorage.getItem("emteredNumber");
}
async function initializePage() {
  const playlistId = getPlaylistId();
  totalRounds = parseInt(getTotalSongs(), 10);

  //assign difficulty
  let diff = getDifficulty();
  if (diff == "easy") {
    difficulty = 1;
    initialTime = 9 * totalRounds;
    countdownTime = initialTime;
  } else if (diff == "medium") {
    difficulty = 1.5;
    initialTime = 6 * totalRounds;
    countdownTime = initialTime;
  } else if (diff == "hard") {
    difficulty = 2;
    initialTime = 3 * totalRounds;
    countdownTime = initialTime;
  }
  await fetchSongs(playlistId);
  loadSongsToPage();
}

// Grab all songs and load to songs array (only need to do once)
async function fetchSongs(playlistId) {
  try {
    const response = await fetch(
      `/playlist/${playlistId}/tracks?nocache=${new Date().getTime()}`
    );
    const data = await response.json();

    if (data.error) {
      console.error("Error fetching playlist songs:", data.error);
      return;
    }

    // Clear the songsArray before adding new songs
    songsArray.length = 0;

    // Add songs to songsArray with name and preview URLs
    data.items.forEach((item) => {
      songsArray.push({
        name: item.track.name,
        preview_url: item.track.preview_url,
      });
    });
  } catch (error) {
    console.error("Error fetching playlist songs:", error);
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
  const audioPlayer = document.getElementById("audioPlayer");

  // Stop any previous playback
  if (!audioPlayer.paused) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0; // Reset playback position
  }

  // Set up a new source
  audioPlayer.src = previewUrl;
}

// Function to get id from URL
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(params.entries());
}

function loadSongsToPage() {
  // Only quiz up to 10 songs
  if (songCount < totalRounds) {
    // Log songs to the console
    console.log("Songs:", songsArray);
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
      const anotherRandomIndex = Math.floor(
        Math.random() * copiedSongsArray.length
      );
      const otherSong = copiedSongsArray[anotherRandomIndex];
      choicesArray[i] = otherSong;
      // Remove song from possible choices
      copiedSongsArray.splice(anotherRandomIndex, 1);
    }

    console.log("Copied Songs Array:", copiedSongsArray);

    // Shuffle choicesArray to randomize the position of the correct song
    shuffleArray(choicesArray);
    // Change song names
    songChoice1.innerHTML = choicesArray[0].name;
    songChoice2.innerHTML = choicesArray[1].name;
    songChoice3.innerHTML = choicesArray[2].name;
    songChoice4.innerHTML = choicesArray[3].name;

    // Set the audio source but do not play automatically
    playSong(correctSong.preview_url);

    songCount++;
    roundNum++;
    //display to user current round number
    if (roundNum <= totalRounds) {
      document.getElementById("roundnumber").innerHTML = roundNum;
    }
  }
}

// Function to start the countdown timer
function startCountdown() {
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
  const display = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
  document.getElementById("timer123").innerHTML = display;
}

function updateAnswer(value) {
  if (value === true) {
    document.getElementById("footer").innerHTML = "Correct";
  } else if (value === false) {
    document.getElementById("footer").innerHTML = "Wrong";
  }

  // Check if 10 songs have been guessed
  if (songCount >= totalRounds) {
    showModal();
    console.log(countdownTime);
    clearInterval(timerInterval); // Stop the timer
    document.getElementById("songsCorrect").innerHTML =
      "Songs Guessed Correctly: " + numberOfSongsGuessed;
    //update score for html
    document.getElementById("gamescore").innerHTML =
      "Score: " + calculateScore();
    // update database
    updateScore(
      sessionStorage.getItem("spotifyId"),
      calculateScore(),
      totalRounds,
      numberOfSongsGuessed
    );
  }
}

// Handle what happens when time runs out
function handleTimeUp() {
  console.log("Time is up!");
  showModal();
  //update score for html
  document.getElementById("gamescore").innerHTML = "Score: " + calculateScore();
  // update database
  updateScore(
    sessionStorage.getItem("spotifyId"),
    calculateScore(),
    totalRounds,
    numberOfSongsGuessed
  );
}

function showModal() {
  document.getElementById("my_modal_6").checked = true;
}
function calculateScore() {
  let accuracyWeight = 0.6; // 60% weight for accuracy
  let timeWeight = 0.3; // 30% weight for time
  let difficultyWeight = 0.1; // 10% weight for difficulty

  let accuracyScore =
    (numberOfSongsGuessed / totalRounds) * 1000 * accuracyWeight;
  let timeScore = (countdownTime / initialTime) * 1000 * timeWeight;
  let difficultyScore = 100 * difficulty * difficultyWeight;

  let score = accuracyScore + timeScore + difficultyScore;
  return Math.round(score);
}
function updateScore(username, newScore, totalSongsPlayed, correct) {
  fetch("/update_metrics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      spotify_id: username,
      last_score: newScore,
      totalSongs: totalSongsPlayed,
      correctGuesses: correct,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data.message); // Handle success message
    })
    .catch((error) => {
      console.error("Error:", error); // Handle errors
    });
}
