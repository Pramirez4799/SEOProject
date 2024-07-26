let numberOfSongsGuessed = 0;

// Function to get URL parameters
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params.entries());
}

// Array to store all songs of the playlist
const songsArray = [];
// Array to store choice of possible songs (4 songs)
const choicesArray = [];

// Fetch and display songs for the selected playlist
function fetchSongs(playlistId) {
    fetch(`/playlist/${playlistId}/tracks`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error fetching playlist songs:', data.error);
                return;
            }
            
            // Log songs to the console
            console.log('Songs:', data);
            data.items.forEach(item => {
                // Add songs to array with their preview URLs
                songsArray.push({ name: item.track.name, preview_url: item.track.preview_url });
            });
            console.log('array:', songsArray);

            // Select random song and assign that as the song to be guessed
            const randomIndex = Math.floor(Math.random() * songsArray.length);
            const correctSong = songsArray[randomIndex];
            // First index is always the correct song
            choicesArray[0] = correctSong;
            console.log('Selected song:', correctSong);

            // Remove the correct song from the array so that the other three options are different songs 
            songsArray.splice(randomIndex, 1);
            console.log('Updated array:', songsArray);

            // Select three more different songs and add them to choicesArray
            for (let i = 1; i < 4; i++) {
                const anotherRandomIndex = Math.floor(Math.random() * songsArray.length);
                const otherSong = songsArray[anotherRandomIndex];
                choicesArray[i] = otherSong;
                // Remove song from possible choices
                songsArray.splice(anotherRandomIndex, 1);
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

            // Display songs as choices in the console
            choicesArray.forEach((song, index) => {
                console.log(`Choice ${index + 1}: ${song.name}`);
            });
        })
        .catch(error => {
            console.error('Error fetching playlist songs:', error);
        });
}

// Function to shuffle an array (Fisher-Yates shuffle algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Function to play the selected song
function playSong(previewUrl) {
    const audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.src = previewUrl;
    audioPlayer.play();
}

// Get playlistId from URL parameters and fetch songs
const queryParams = getQueryParams();
if (queryParams.playlistId) {
    fetchSongs(queryParams.playlistId);
} else {
    console.error('No playlistId found in URL parameters');
}
