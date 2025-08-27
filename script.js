                   
console.log('Lets write Javascript');
let currentSong = new Audio();
let songs;
let currFolder;

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const formattedMins = String(mins).padStart(2, '0');
    const formattedSecs = String(secs).padStart(2, '0');
    return `${formattedMins}:${formattedSecs}`;
}

function showFormattedTime(sec) {
    const result = formatTime(sec);
    document.getElementById('timeDisplay').innerText = result;
}

async function getSongs(folder) {
    currFolder = folder;
    try {
        let response = await fetch(`http://127.0.0.1:5500/${folder}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        songs = [];
        let anchors = div.getElementsByTagName("a");
        for (let index = 0; index < anchors.length; index++) {
            let href = anchors[index].href;
            if (href.endsWith(".mp3")) {
                songs.push(href.split(`/${folder}/`)[1]);
            }
        }

        // Show all the songs in the playlist
        let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0];
        songUL.innerHTML = "";
        for (const song of songs) {
            let cleanName = decodeURIComponent(song).replaceAll("/", "").replaceAll("-", " ").replaceAll("%20", " ").trim();
            songUL.innerHTML += `<li data-file="${song}"> <img class="invert" src="music.svg" alt="">
                <div class="info">
                    <div>${cleanName}</div>
                    <div>Ashwani</div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="play.svg" alt="">
                    </div>
                </div>
            </li>`;
        }

        // Attach an event listener to each song
        Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", element => {
                console.log("playing:", e.dataset.file);
                playmusic(e.dataset.file);
            });
        });

        return songs;

    } catch (error) {
        console.error("Error fetching songs:", error);
    }
}

const playmusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;

    if (!pause) {
        currentSong.play().catch(e => console.error("Playback Error:", e));
        play.src = "pause.svg"; // Only update icon when actually playing
    } else {
        play.src = "play.svg"; // Keep play icon when paused
    }

    // Clean track name for display
    let cleanTrackName = decodeURIComponent(track)
        .replace(".mp3", "")
        .replaceAll("_", " ")
        .trim();

    document.querySelector(".songinfo").innerHTML = cleanTrackName;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    try {
        let response = await fetch('http://127.0.0.1:5500/songs/');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;

        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");
        let array = Array.from(anchors);

        for (let index = 0; index < array.length; index++) {
            const e = array[index];

            if (e.href.includes("/songs")) {
                let folder = (e.href.split("/").slice(-2)[1]);

                // Get the metadata of the folder
                let metadataResponse = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
                if (!metadataResponse.ok) {
                    console.error(`Error fetching metadata for ${folder}:`, metadataResponse.status);
                    continue; // Skip this folder if metadata is not found
                }
                let responseData = await metadataResponse.json();
                console.log(responseData);
                cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                    <div class="play">
                        <div style="width: 40px; height: 40px; background-color: #00ff00; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 5px;">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="000000" style="width: 100%; height: 100%;">
                                <path d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"
                                    stroke="#000000" stroke-width="1.5" stroke-linejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="">
                    <h2>${responseData.title}</h2>
                    <p>${responseData.description}</p>
                </div>`;
            }
        }

        // Load the playlist whenever a card is clicked
        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async item => {
                console.log("Fetching songs");
                songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
                if (songs.length > 0) {
                    playmusic(songs[0]);
                }
            });
        });

    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

async function main() {
    // Get the list of all songs
    await getSongs("songs/ncs");
    playmusic(songs[0], true); // Play the first song

    // Display all the albums on the page
    displayAlbums();

    // Attach an event listener to play, next, and previous
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play().catch(e => console.error("Playback Error:", e));
            play.src = "pause.svg";
        } else {
            currentSong.pause();
            play.src = "play.svg";
        }
    });

    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `
        ${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = e.offsetX / e.target.getBoundingClientRect().width;
        document.querySelector(".circle").style.left = percent * 100 + "%";
        currentSong.currentTime = percent * currentSong.duration;
    });

    // Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Add an event listener for previous
    previous.addEventListener("click", () => {
        console.log("Previous clicked");
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playmusic(songs[index - 1]);
        }
    });

    // Add an event listener for next
    next.addEventListener("click", () => {
        console.log("Next clicked");
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playmusic(songs[index + 1]);
        }
    });

    // Add an event listener for volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("Setting volume to", e.target.value, "/ 100");
        currentSong.volume = parseInt(e.target.value) / 100;
    });

    // Add event listener to volume track
    document.querySelector(".volume>img").addEventListener("click", e => {
        console.log(e.target);
        console.log("Changing", e.target.src);
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    });
}

main();
