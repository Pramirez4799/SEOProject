// Function to get query parameters
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(params.entries());
}

// Function to get the selected difficulty
function getSelectedDifficulty() {
  const selectedOption = document.querySelector(
    'input[name="difficulty"]:checked'
  );
  if (selectedOption) {
    return selectedOption.value;
  } else {
    return null;
  }
}
// Get playlistId from URL parameters
const queryParams = getQueryParams();
const playlistId = queryParams.playlistId; // Store playlistId

// Event listener for the button click
document.getElementById("checkButton").addEventListener("click", () => {
  const selectedDifficulty = getSelectedDifficulty();
  const enteredNumber = document.getElementById("numberInput").value;

  if (selectedDifficulty && enteredNumber) {
    console.log("Selected Difficulty:", selectedDifficulty);
    console.log("Entered Number:", enteredNumber);

    // You can now use the selectedDifficulty and enteredNumber variables as needed
  } else {
    console.error("Please select a difficulty and enter a number.");
  }
  validSettings(selectedDifficulty, enteredNumber, playlistId);
});

// Function to check if the settings are valid
function validSettings(selectedDifficulty, enteredNumber, playlistId) {
  getQueryParams();
  fetchSongs(playlistId).then((songCount) => {
    if (songCount < enteredNumber) {
      console.error(
        "Entered number is greater than the number of songs in the playlist."
      );
    } else {
      console.log(
        "Valid settings:",
        selectedDifficulty,
        enteredNumber,
        playlistId
      );
      // Continue with your game logic or whatever you need to do next
    }
  });
}

// Fetch and display songs for the selected playlist
function fetchSongs(playlistId) {
  fetch(`/playlist/${playlistId}/tracks`)
    .then((response) => response.json())
    .then((data) => {
      console.log("Songs:", data); // Log songs to the console for now
      const songListElement = document.getElementById("songList");
      songListElement.innerHTML = "<h3>Playlist Songs:</h3>";
      if (data.items) {
        const ul = document.createElement("ul");
        data.items.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = `${item.track.name} by ${item.track.artists
            .map((artist) => artist.name)
            .join(", ")}`;
          ul.appendChild(li);
        });
        songListElement.appendChild(ul);
      } else {
        songListElement.innerHTML += "<p>No songs found in this playlist.</p>";
      }
    })
    .catch((error) => {
      console.error("Error fetching playlist songs:", error);
    });
}

// Get playlistId from URL parameters and fetch songs
if (queryParams.playlistId) {
  fetchSongs(queryParams.playlistId);
} else {
  console.error("No playlistId found in URL parameters");
}
