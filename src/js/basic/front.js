
/*
Copyright (C) 2025 Leonel Rodriguez leonelrodriguezfl@gmail.com
This program is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/



function runAnkiTemplate() {
    // =========================================================================
    // START OF ORIGINAL CODE
    // =========================================================================
    
    /*
    ----------------------------------------------------------------------------
     2.1. INITIAL SETUP AND CARD STATE
    ----------------------------------------------------------------------------
     Manages the unique initialization of the card and clears previous states
     to ensure consistent behavior between sessions.
    */

    // Prevents double initialization of the card if it has already loaded.
    if (document.querySelector('.main-quiz-container').hasAttribute('data-initialized')) {
        return;
    }
    document.querySelector('.main-quiz-container').setAttribute('data-initialized', 'true');

    // Clears any previous keyboard handler to avoid conflicts
    // in subsequent cards or reloads.
    if (window.ankiQuizKeyboardHandler) {
        document.removeEventListener('keydown', window.ankiQuizKeyboardHandler);
        window.ankiQuizKeyboardHandler = null;
    }

    // Attempts to clear the user's stored answer in sessionStorage.
    // This is vital for each card to start with a clean state.
    try {
        sessionStorage.removeItem('ankiQuizUserAnswer');
    } catch (e) {
        // Logs any error that occurs during cleanup.
        console.error("Error clearing sessionStorage:", e);
    }
    
    let timerEndListener = null; // Listener for the timer completion event.
    let timerBarElement = null;  // DOM element of the timer bar.
    let userAnswer = null;       // Stores the user's answer.
    let questionData = null;     // Contains the parsed question data.

    let navigableItems = []; // Navigable elements for keyboard interaction.
    let currentIndex = -1;   // Index of the currently focused item in navigation.

    /*
    ----------------------------------------------------------------------------
     2.2. CORE UTILITIES
    ----------------------------------------------------------------------------
     General purpose functions that support quiz operation,
     including sound handling, timer, and basic array operations.
    */



    // Orchestrates the logic to show the card answer in Anki,
    // handling different environments (pycmd, AnkiDroidJS, AnkiBridge).
    function ankiShowAnswer() {
        if (typeof pycmd !== "undefined") {
            pycmd("ans");
            return;
        }
        try {
            if (typeof AnkiDroidJS !== "undefined") {
                showAnswer();
                return;
            }
        } catch(e) {}
        try {
            if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.ankiBridge) {
                window.webkit.messageHandlers.ankiBridge.postMessage("showAnswer");
                return;
            }
        } catch(e) {}
    }
    
    // Configures and activates the timer bar for the front card.
    function setupTimer() {
        timerBarElement = document.getElementById('timer-bar');
        // If the timer element does not exist, the function does nothing.
        if (!timerBarElement) {
            return;
        }

        // Clears any listener from a previous execution to avoid duplicates.
        if (timerEndListener) {
            timerBarElement.removeEventListener('transitionend', timerEndListener);
        }
        
        const timerDuration = 10; // Timer duration in seconds.
        
        // Defines the action to execute when the timer reaches zero:
        // stores the current answer and flips the card, marking it as "I don't know".
        timerEndListener = () => {
            if (document.getElementById('quiz-container-anki-front')) {
                storeAnswerAndFlip(false); // Flipped due to timeout, treated as incorrect/unknown.
            }
        };
        timerBarElement.addEventListener('transitionend', timerEndListener);
        
        // Resets the timer bar to 100% width without transition
        // so that each card starts with a full bar.
        timerBarElement.style.transition = 'none';
        timerBarElement.style.width = '100%';

        // Small delay (10ms) to ensure the 'transition' property
        // has been reset before applying the new transition,
        // guaranteeing a fluid animation from the start.
        setTimeout(() => {
            if (!timerBarElement) return; // Re-check if element exists before applying.
            timerBarElement.style.transition = `width ${timerDuration}s linear`;
            timerBarElement.style.width = '0%'; // Starts the timer reduction animation.
        }, 10);
    }

    // Stores the user's answer in sessionStorage and asks Anki
    // to show the back of the card.
    function storeAnswerAndFlip(isIdk = false) {
        // Stops and clears the front-side timer to prevent it
        // from activating after the card has been flipped.
        if (timerBarElement && timerEndListener) {
            timerBarElement.style.transition = 'none';
            timerBarElement.removeEventListener('transitionend', timerEndListener);
            timerEndListener = null;
        }
        
        // Attempts to quickly play and pause sounds to cache them
        // and avoid delays in subsequent playback on the back.
        try {
            soundUnlock1.volume = 0; // Ensures it's not heard during preloading.
            soundUnlock1.play().then(() => soundUnlock1.pause()).catch(e=>{});
            soundUnlock2.volume = 0; // Ensures it's not heard during preloading.
            soundUnlock2.play().then(() => soundUnlock2.pause()).catch(e=>{});
        } catch(e) {}

        // Saves the user's answer and whether they marked "I don't know" in sessionStorage.
        sessionStorage.setItem('ankiQuizUserAnswer', JSON.stringify({ answer: userAnswer, idk: isIdk }));
        
        // Calls the Anki-specific function to show the back of the card
        // with a small delay to ensure sessionStorage is updated.
        setTimeout(ankiShowAnswer, 50);
    }

    // Shuffles array elements using the Fisher-Yates algorithm,
    // creating a copy of the original array so as not to modify it directly.
    const shuffleArray = (array) => {
        const newArray = [...array]; // Creates a shallow copy of the array.
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            // Swaps elements.
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    /*
    ----------------------------------------------------------------------------
     2.3. ADVANCED MEDIA PLAYER MODULE
    ----------------------------------------------------------------------------
     Contains functions to generate and control custom audio and video players,
     with functionalities like speed control, loop, and volume.
    */

    /*
     2.3.1. HTML Generators for Players
    */

    // Generates the HTML structure for a custom audio player.
    function getCustomAudioPlayerHTML(src) {
        return `<div class="custom-audio-player">
 <audio class="custom-audio-element" src="${src}" preload="metadata"></audio>
 <button class="play-pause-btn">
 <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98c-.67-.43-1.54.05-1.54.84z"></path></svg>
 <svg class="pause-icon" style="display: none;" viewBox="0 0 24 24" fill="currentColor"><path d="M7 19c0 .55.45 1 1 1h2c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1H8c-.55 0-1 .45-1 1v14zm7-14v14c0 .55.45 1 1 1h2c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1z"></path></svg>
 </button>
 <div class="main-controls-wrapper">
 <div class="progress-time-container">
 <div class="progress-bar-container">
 <div class="loop-range-indicator"></div>
 <div class="mark-indicator mark-a-indicator"></div>
 <div class="mark-indicator mark-b-indicator"></div>
 <div class="progress-bar-fill"></div>
 </div>
 <div class="time-display">
 <span class="current-time">0:00</span> / <span class="duration">0:00</span>
 </div>
 </div>
 <div class="secondary-controls">
 <div class="speed-controls">
 <button class="control-btn speed-down-btn" title="Decrease speed"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"></path></svg></button>
 <span class="speed-display">1.0x</span>
 <button class="control-btn speed-up-btn" title="Increase speed"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"></path></svg></button>
 </div>
 <div class="loop-controls">
 <button class="control-btn mark-a-btn" title="Mark start point (A)">A</button>
 <button class="control-btn mark-b-btn" title="Mark end point (B)">B</button>
 <button class="control-btn loop-btn" title="Toggle A-B loop" disabled><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"></path></svg></button>
 </div>
 <div class="volume-container">
 <button class="volume-btn"><svg class="volume-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"></path></svg><svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1z"/></svg></button>
 <div class="volume-slider-container"><div class="volume-slider-fill"></div></div>
 </div>
 </div>
 </div>
 </div>`;
    }

    // Generates the HTML structure for a custom video player.
    function getCustomVideoPlayerHTML(src) {
        return `<div class="custom-video-player">
 <video class="custom-video-element" src="${src}"></video>
 <div class="video-overlay"></div>
 <div class="video-controls-container">
 <div class="progress-controls">
 <div class="progress-bar-container">
 <div class="progress-bar-buffered"></div>
 <div class="loop-range-indicator"></div>
 <div class="mark-indicator mark-a-indicator"></div>
 <div class="mark-indicator mark-b-indicator"></div>
 <div class="progress-bar-fill"></div>
 </div>
 <div class="time-display">
 <span class="current-time">0:00</span> / <span class="duration">0:00</span>
 </div>
 </div>
 <div class="bottom-controls">
 <div class="control-group left-controls">
 <button class="control-btn play-pause-btn-small" title="Play/Pause"><svg class="play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 8.64v6.72c0 .46.54.66.91.43l5.34-3.36c.3-.19.3-.68 0-.86L9.41 8.21c-.37-.23-.91-.03-.91.43z"></path></svg><svg class="pause-icon" style="display:none;" viewBox="0 0 24 24" fill="currentColor"><path d="M7 19c0 .55.45 1 1 1h2c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1H8c-.55 0-1 .45-1 1v14zm7-14v14c0 .55.45 1 1 1h2c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1z"></path></svg></button>
 </div>
 <div class="control-group middle-controls"></div>
 <div class="control-group right-controls">
 <button class="control-btn fullscreen-btn" title="Fullscreen"><svg class="fullscreen-open-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path></svg><svg class="fullscreen-close-icon" style="display:none;" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"></path></svg></button>
 <button class="control-btn more-options-btn" title="More options"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg></button>
 <div class="more-options-menu"></div>
 </div>
 </div>
 <div style="display: none;">
 <div class="volume-container">
 <button class="control-btn volume-btn" title="Mute/Unmute"><svg class="volume-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"></path></svg><svg class="mute-icon" style="display:none;" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zM7 9v6h4l5 5V4L11 9H7zm7 5.68V9.32l2.58 2.58c.08-.2.12-.41.12-.68z"></path></svg></button>
 <div class="volume-slider-container"><div class="volume-slider-fill"></div></div>
 </div>
 <div class="control-group loop-controls-group">
 <button class="control-btn mark-btn mark-a-btn" title="Mark start point (A)">A</button>
 <button class="control-btn mark-btn mark-b-btn" title="Mark end point (B)">B</button>
 <button class="control-btn loop-btn" title="Toggle A-B loop" disabled><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"></path></svg></button>
 </div>
 <div class="control-group speed-controls-group">
 <button class="control-btn speed-down-btn" title="Decrease speed"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"></path></svg></button>
 <span class="speed-display">1.0x</span>
 <button class="control-btn speed-up-btn" title="Increase speed"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"></path></svg></button>
 </div>
 </div>
 </div>
 </div>`;
    }

    /*
     2.3.2. Media Rendering and Update Engine
    */

    // Parses text and replaces Anki syntax (e.g., "![[media.mp3]]")
    // with custom player HTML or image tags.
    function parseAndRenderMedia(text) {
        // Returns original text if not a string or is empty.
        if (!text || typeof text !== 'string') {
            return text;
        }
        
        // Regular expression to find Anki media syntax.
        const mediaRegex = /!\[\[([^\]]+)\]\]/g;
        
        // Replaces each match with the appropriate player HTML.
        return text.replace(mediaRegex, (match, filename) => {
            const sanitizedFilename = encodeURI(filename.trim());
            const extension = (filename.split('.').pop() || '').toLowerCase();
            let mediaHtml = '';
            
            // Determines the type of player or HTML tag based on the extension.
            switch (extension) {
                case 'mp3':
                case 'wav':
                case 'ogg':
                    mediaHtml = getCustomAudioPlayerHTML(sanitizedFilename);
                    break;
                case 'png':
                case 'jpg':
                case 'jpeg':
                case 'gif':
                case 'webp':
                case 'svg':
                    mediaHtml = `<img class="embedded-media" src="${sanitizedFilename}" alt="Image: ${filename}">`;
                    break;
                case 'mp4':
                case 'webm':
                    mediaHtml = getCustomVideoPlayerHTML(sanitizedFilename);
                    break;
                default:
                    return match; // If unknown type, returns original text.
            }
            return `<div class="media-wrapper">${mediaHtml}</div>`;
        });
    }

    // Identifies standard HTML5 `<audio>` and `<video>` tags within
    // a container and replaces them with custom players.
    function upgradeStandardMedia(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return; // Exits if container does not exist.

        // Processes all `<audio>` tags that are not already custom players.
        container.querySelectorAll('audio:not(.custom-audio-element)').forEach(audioElement => {
            const src = audioElement.getAttribute('src');
            if (!src) return; // If no 'src', ignores it.

            const tempWrapper = document.createElement('div');
            tempWrapper.innerHTML = getCustomAudioPlayerHTML(src);
            const newPlayer = tempWrapper.firstElementChild; // The newly created custom player.

            // Replaces the original <audio> tag with the new player.
            if (audioElement.parentNode) {
                audioElement.parentNode.replaceChild(newPlayer, audioElement);
            }
        });

        // Processes all `<video>` tags that are not already custom players.
        container.querySelectorAll('video:not(.custom-video-element)').forEach(videoElement => {
            const src = videoElement.getAttribute('src');
            if (!src) return; // If no 'src', ignores it.

            const tempWrapper = document.createElement('div');
            tempWrapper.innerHTML = getCustomVideoPlayerHTML(src);
            const newPlayer = tempWrapper.firstElementChild; // The newly created custom player.

            // Replaces the original <video> tag with the new player.
            if (videoElement.parentNode) {
                videoElement.parentNode.replaceChild(newPlayer, videoElement);
            }
        });
    }

    // Applies specific CSS classes to Anki `<img>` tags
    // to ensure consistent appearance with other embedded media.
    function styleAnkiImages(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return; // Exits if container does not exist.

        // Selects images that are not already part of custom players or buttons.
        container.querySelectorAll('img:not(.embedded-media)').forEach(imageElement => {
            // Avoids processing images that are part of player controls
            // or Anki buttons (e.g., audio replay buttons).
            if (imageElement.closest('.custom-audio-player, .custom-video-player, .replay-button, .play-action')) {
                return;
            }
            const wrapper = document.createElement('div');
            wrapper.className = 'media-wrapper'; // Wraps the image to apply container styles.
            if (imageElement.parentNode) {
                imageElement.parentNode.insertBefore(wrapper, imageElement);
                wrapper.appendChild(imageElement);
                imageElement.classList.add('embedded-media'); // Adds the class for media styles.
            }
        });
    }
    
    /*
     2.3.3. Player Initialization Logic
    */

    // Initializes all custom audio and video players
    // that have not yet been processed in the DOM.
    function initializeAllCustomMediaPlayers() {
        document.querySelectorAll('.custom-audio-player:not(.initialized)').forEach(player => initializeCustomAudioPlayer(player));
        document.querySelectorAll('.custom-video-player:not(.initialized)').forEach(player => initializeCustomVideoPlayer(player));
    }

    // Configures interactivity for a custom audio player
    // given its DOM container. Includes playback control, progress, volume,
    // speed, and loop functionality.
    function initializeCustomAudioPlayer(playerContainer) {
        // Prevents re-initializing already configured players.
        if (playerContainer.classList.contains('initialized')) return;

        // References to the internal DOM elements of the player.
        const audioElement = playerContainer.querySelector('.custom-audio-element');
        const playPauseBtn = playerContainer.querySelector('.play-pause-btn');
        const progressBarContainer = playerContainer.querySelector('.progress-bar-container');
        const progressBarFill = playerContainer.querySelector('.progress-bar-fill');
        const currentTimeEl = playerContainer.querySelector('.current-time');
        const durationEl = playerContainer.querySelector('.duration');
        const speedDownBtn = playerContainer.querySelector('.speed-down-btn');
        const speedUpBtn = playerContainer.querySelector('.speed-up-btn');
        const speedDisplay = playerContainer.querySelector('.speed-display');
        const markABtn = playerContainer.querySelector('.mark-a-btn');
        const markBBtn = playerContainer.querySelector('.mark-b-btn');
        const loopBtn = playerContainer.querySelector('.loop-btn');
        const volumeBtn = playerContainer.querySelector('.volume-btn');
        const volumeSliderContainer = playerContainer.querySelector('.volume-slider-container');
        const volumeSliderFill = playerContainer.querySelector('.volume-slider-fill');
        const loopRangeIndicator = playerContainer.querySelector('.loop-range-indicator');
        const markAIndicator = playerContainer.querySelector('.mark-a-indicator');
        const markBIndicator = playerContainer.querySelector('.mark-b-indicator');

        // State variables for loop functionality.
        let markA = null;
        let markB = null;
        let isLooping = false;

        // Available playback speeds and the index of the current speed.
        const playbackSpeeds = [0.25, .5, .75, 1, 1.25, 1.5, 1.75, 2];
        let currentSpeedIndex = 3; // Index for 1.0x by default.

        // Flags to control progress bar and volume dragging.
        let isDraggingProgressBar = false;
        let wasPlayingOnDragStart = false; // Stores playback state before dragging.
        let isDraggingVolume = false;

        // Helper function to format seconds to a time format (MM:SS).
        const formatTime = seconds => {
            if (isNaN(seconds)) return "0:00";
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
        };

        // Updates the UI of marks A and B and the loop range.
        function updateMarksUI() {
            const duration = audioElement.duration;
            if (isNaN(duration) || duration <= 0) return; // Does nothing if duration is invalid.

            // Updates the position and visibility of mark A indicator.
            if (markA !== null) {
                markAIndicator.style.left = `${(markA / duration) * 100}%`;
                markAIndicator.style.display = "block";
            } else {
                markAIndicator.style.display = "none";
                markABtn.classList.remove('active'); // Deactivates button if mark does not exist.
            }

            // Updates the position and visibility of mark B indicator.
            if (markB !== null) {
                markBIndicator.style.left = `${(markB / duration) * 100}%`;
                markBIndicator.style.display = "block";
            } else {
                markBIndicator.style.display = "none";
                markBBtn.classList.remove('active'); // Deactivates button if mark does not exist.
            }

            // Updates the position and width of the loop range indicator.
            if (markA !== null && markB !== null) {
                const start = Math.min(markA, markB);
                const end = Math.max(markA, markB);
                const leftPercent = (start / duration) * 100;
                const widthPercent = ((end - start) / duration) * 100;
                loopRangeIndicator.style.left = `${leftPercent}%`;
                loopRangeIndicator.style.width = `${widthPercent}%`;
                loopRangeIndicator.style.display = "block";
                loopBtn.disabled = false; // Enables loop button.
            } else {
                loopRangeIndicator.style.display = "none";
                loopBtn.disabled = true; // Disables loop button.
                if (isLooping) {
                    isLooping = false;
                    loopBtn.classList.remove('active');
                }
            }
        }

        // Updates the progress bar position and current time
        // based on the mouse event position.
        function updateProgressBarTime(event) {
            const rect = progressBarContainer.getBoundingClientRect();
            let clickX = event.clientX - rect.left;
            // Limits clickX within the progress bar boundaries.
            clickX = Math.max(0, Math.min(clickX, rect.width));
            const newTime = (clickX / rect.width) * audioElement.duration;
            audioElement.currentTime = newTime;
            progressBarFill.style.width = `${(newTime / audioElement.duration) * 100}%`;
            currentTimeEl.textContent = formatTime(newTime);
        }

        // Handler for mouse drag event over the progress bar.
        const handleProgressBarDrag = (event) => {
            if (isDraggingProgressBar) {
                updateProgressBarTime(event);
            }
        };

        // Handler for mouse drag end event over the progress bar.
        const handleProgressBarEnd = () => {
            if (isDraggingProgressBar) {
                isDraggingProgressBar = false;
                document.removeEventListener('mousemove', handleProgressBarDrag);
                document.removeEventListener('mouseup', handleProgressBarEnd);
                if (wasPlayingOnDragStart) {
                    audioElement.play(); // Resumes playback if it was active.
                }
            }
        };

        // Updates audio volume and volume bar.
        function handleVolumeUpdate(event) {
            const rect = volumeSliderContainer.getBoundingClientRect();
            let clickX = event.clientX - rect.left;
            // Limits clickX within the volume control boundaries.
            clickX = Math.max(0, Math.min(clickX, rect.width));
            const newVolume = clickX / rect.width;
            audioElement.muted = false; // Unmutes if volume is adjusted.
            audioElement.volume = newVolume;
        }

        // Handler for mouse drag event over the volume bar.
        const handleVolumeDrag = (event) => {
            if (isDraggingVolume) handleVolumeUpdate(event);
        };

        // Handler for mouse drag end event over the volume bar.
        const handleVolumeEnd = () => {
            if (isDraggingVolume) {
                isDraggingVolume = false;
                document.removeEventListener('mousemove', handleVolumeDrag);
                document.removeEventListener('mouseup', handleVolumeEnd);
            }
        };

        /*
         Event Binding (Event Listeners)
        */

        // Updates displayed duration when audio metadata is loaded.
        audioElement.addEventListener('loadedmetadata', () => {
            durationEl.textContent = formatTime(audioElement.duration);
            updateMarksUI();
        });

        // Updates current time and progress bar; manages A-B loop.
        audioElement.addEventListener('timeupdate', () => {
            currentTimeEl.textContent = formatTime(audioElement.currentTime);
            progressBarFill.style.width = `${(audioElement.currentTime / audioElement.duration) * 100}%`;
            if (isLooping && markB !== null && markA !== null) {
                const loopEnd = Math.max(markA, markB);
                if (audioElement.currentTime >= loopEnd) {
                    audioElement.currentTime = Math.min(markA, markB); // Restarts at point A.
                }
            }
        });

        // Adds/removes 'playing' class to container for visual styles.
        audioElement.addEventListener('play', () => playerContainer.classList.add('playing'));
        audioElement.addEventListener('pause', () => playerContainer.classList.remove('playing'));
        audioElement.addEventListener('ended', () => playerContainer.classList.remove('playing'));

        // Toggles play/pause when clicking the button.
        playPauseBtn.addEventListener('click', () => audioElement.paused ? audioElement.play() : audioElement.pause());

        // Starts progress bar dragging when mouse is pressed.
        progressBarContainer.addEventListener('mousedown', (event) => {
            isDraggingProgressBar = true;
            wasPlayingOnDragStart = !audioElement.paused;
            if (wasPlayingOnDragStart) {
                audioElement.pause();
            }
            updateProgressBarTime(event);
            document.addEventListener('mousemove', handleProgressBarDrag);
            document.addEventListener('mouseup', handleProgressBarEnd);
        });

        // Controls playback speed when clicking speed buttons.
        speedUpBtn.addEventListener('click', () => {
            if (currentSpeedIndex < playbackSpeeds.length - 1) {
                currentSpeedIndex++;
                audioElement.playbackRate = playbackSpeeds[currentSpeedIndex];
                speedDisplay.textContent = `${playbackSpeeds[currentSpeedIndex].toFixed(2)}x`;
            }
        });
        speedDownBtn.addEventListener('click', () => {
            if (currentSpeedIndex > 0) {
                currentSpeedIndex--;
                audioElement.playbackRate = playbackSpeeds[currentSpeedIndex];
                speedDisplay.textContent = `${playbackSpeeds[currentSpeedIndex].toFixed(2)}x`;
            }
        });

        // Handles marking points A and B for the loop.
        markABtn.addEventListener('click', () => {
            markA = audioElement.currentTime;
            markABtn.classList.add('active');
            // If mark A is greater than B, B is invalidated (ensures A < B).
            if (markB !== null && markA >= markB) markB = null;
            updateMarksUI();
        });
        markBBtn.addEventListener('click', () => {
            markB = audioElement.currentTime;
            markBBtn.classList.add('active');
            // If mark B is less than A, A is invalidated (ensures A < B).
            if (markA !== null && markB <= markA) markA = null;
            updateMarksUI();
        });

        // Toggles A-B loop functionality.
        loopBtn.addEventListener('click', () => {
            // Only allows activating the loop if both marks are defined.
            if (markA === null || markB === null) return;
            isLooping = !isLooping;
            loopBtn.classList.toggle('active', isLooping);
            // If loop is deactivated, marks A and B are reset.
            if (!isLooping) {
                markA = null;
                markB = null;
                markABtn.classList.remove('active');
                markBBtn.classList.remove('active');
                updateMarksUI();
            }
        });

        // Starts volume control dragging.
        volumeSliderContainer.addEventListener('mousedown', (event) => {
            isDraggingVolume = true;
            handleVolumeUpdate(event);
            document.addEventListener('mousemove', handleVolumeDrag);
            document.addEventListener('mouseup', handleVolumeEnd);
        });

        // Toggles mute/unmute state.
        volumeBtn.addEventListener('click', () => audioElement.muted = !audioElement.muted);

        // Updates volume interface when audio volume changes (including mute).
        audioElement.addEventListener('volumechange', () => {
            volumeSliderFill.style.width = audioElement.muted ? "0%" : `${audioElement.volume * 100}%`;
            playerContainer.querySelector('.volume-icon').style.display = audioElement.muted || audioElement.volume === 0 ? 'none' : 'block';
            playerContainer.querySelector('.mute-icon').style.display = audioElement.muted || audioElement.volume === 0 ? 'block' : 'none';
        });

        // Marks player as initialized to prevent future configurations.
        playerContainer.classList.add('initialized');
    }

    // Configures interactivity for a custom video player,
    // including playback, progress, volume, speed, loop, fullscreen
    // and responsive control layout.
    function initializeCustomVideoPlayer(playerContainer) {
        // Prevents re-initializing already configured players.
        if (playerContainer.classList.contains('initialized')) return;

        // References to the internal DOM elements of the player.
        const videoElement = playerContainer.querySelector('.custom-video-element');
        const videoOverlay = playerContainer.querySelector('.video-overlay');
        const playPauseBtnSmall = playerContainer.querySelector('.play-pause-btn-small');
        const progressBarFill = playerContainer.querySelector('.progress-bar-fill');
        const progressBarBuffered = playerContainer.querySelector('.progress-bar-buffered');
        const currentTimeEl = playerContainer.querySelector('.current-time');
        const durationEl = playerContainer.querySelector('.duration');
        const progressBarContainer = playerContainer.querySelector('.progress-bar-container');
        const fullscreenBtn = playerContainer.querySelector('.fullscreen-btn');

        const volumeContainer = playerContainer.querySelector('.volume-container');
        const loopControlsGroup = playerContainer.querySelector('.loop-controls-group');
        const speedControlsGroup = playerContainer.querySelector('.speed-controls-group');
        
        const speedDownBtn = speedControlsGroup ? speedControlsGroup.querySelector('.speed-down-btn') : null;
        const speedUpBtn = speedControlsGroup ? speedControlsGroup.querySelector('.speed-up-btn') : null;
        const speedDisplay = speedControlsGroup ? speedControlsGroup.querySelector('.speed-display') : null;
        const markABtn = loopControlsGroup ? loopControlsGroup.querySelector('.mark-a-btn') : null;
        const markBBtn = loopControlsGroup ? loopControlsGroup.querySelector('.mark-b-btn') : null;
        const loopBtn = loopControlsGroup ? loopControlsGroup.querySelector('.loop-btn') : null;
        const volumeBtn = volumeContainer ? volumeContainer.querySelector('.volume-btn') : null;
        const volumeSliderContainer = volumeContainer ? volumeContainer.querySelector('.volume-slider-container') : null;
        const volumeSliderFill = volumeContainer ? volumeContainer.querySelector('.volume-slider-fill') : null;

        const markAIndicator = playerContainer.querySelector('.mark-a-indicator');
        const markBIndicator = playerContainer.querySelector('.mark-b-indicator');
        const loopRangeIndicator = playerContainer.querySelector('.loop-range-indicator');
        
        const moreOptionsBtn = playerContainer.querySelector('.more-options-btn');
        const moreOptionsMenu = playerContainer.querySelector('.more-options-menu');
        const leftControls = playerContainer.querySelector('.left-controls');
        const middleControls = playerContainer.querySelector('.middle-controls');
        const rightControls = playerContainer.querySelector('.right-controls');
        
        let controlsTimeout; // Timer for hiding controls due to inactivity.
        const playbackSpeeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
        let currentSpeedIndex = 3; // Index for 1.0x by default.
        let markA = null;
        let markB = null;
        let isLooping = false;

        // Flags to control dragging.
        let isDraggingProgressBar = false;
        let wasPlayingOnDragStart = false;
        let isDraggingVolume = false;

        // Checks for the existence of critical elements for basic functionality.
        if (!videoElement || !videoOverlay || !playPauseBtnSmall || !progressBarFill || !progressBarContainer || !fullscreenBtn) {
            console.warn("WARNING: Critical elements missing for video player. Will not fully initialize.");
            playerContainer.classList.add('initialized');
            return;
        }

        // Shows video controls and restarts the hide timer.
        const showControls = () => {
            playerContainer.classList.add('controls-visible');
            clearTimeout(controlsTimeout);
        };

        // Hides video controls, unless paused or options menu is open.
        const hideControls = () => {
            if (videoElement.paused || (moreOptionsMenu && moreOptionsMenu.classList.contains('active'))) return;
            playerContainer.classList.remove('controls-visible');
        };

        // Starts the timer to automatically hide controls.
        const startHideTimer = () => {
            if (videoElement.paused) return; // Does not hide if video is paused.
            clearTimeout(controlsTimeout);
            controlsTimeout = setTimeout(hideControls, 2500); // Hides after 2.5 seconds of inactivity.
        };

        // Formats seconds to a time format (MM:SS).
        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        }

        // Updates play/pause, volume, and fullscreen icons.
        function updateIcons() {
            const isPaused = videoElement.paused;
            playPauseBtnSmall.querySelector('.play-icon').style.display = isPaused ? 'block' : 'none';
            playPauseBtnSmall.querySelector('.pause-icon').style.display = isPaused ? 'none' : 'block';
            
            if (volumeContainer) {
                const isMuted = videoElement.muted || videoElement.volume === 0;
                volumeContainer.querySelector('.volume-icon').style.display = isMuted ? 'none' : 'block';
                volumeContainer.querySelector('.mute-icon').style.display = isMuted ? 'block' : 'none';
            }
            const isFullscreen = !!document.fullscreenElement;
            fullscreenBtn.querySelector('.fullscreen-open-icon').style.display = isFullscreen ? 'none' : 'block';
            fullscreenBtn.querySelector('.fullscreen-close-icon').style.display = isFullscreen ? 'block' : 'none';
        }

        // Toggles playback state (play/pause).
        function togglePlay() { videoElement.paused ? videoElement.play() : videoElement.pause(); }

        /*
         Event Binding (Event Listeners)
        */

        // Shows controls and restarts timer on mouse movement over player.
        playerContainer.addEventListener('mousemove', () => { showControls(); startHideTimer(); });
        // Hides controls when mouse leaves player.
        playerContainer.addEventListener('mouseleave', hideControls);

        // Events related to video playback state.
        videoElement.addEventListener('play', () => {
            playerContainer.classList.add('playing');
            videoElement.playbackRate = playbackSpeeds[currentSpeedIndex]; // Ensures correct speed at start.
            startHideTimer();
            updateIcons();
        });
        videoElement.addEventListener('pause', () => {
            playerContainer.classList.remove('playing');
            showControls(); // Shows controls when paused.
            updateIcons();
        });
        videoElement.addEventListener('loadedmetadata', () => {
            if (durationEl) durationEl.textContent = formatTime(videoElement.duration);
            updateMarksUI(); // Updates marks when duration is known.
        });
        videoElement.addEventListener('timeupdate', () => {
            if (progressBarFill) progressBarFill.style.width = `${(videoElement.currentTime / videoElement.duration) * 100}%`;
            if (currentTimeEl) currentTimeEl.textContent = formatTime(videoElement.currentTime);
            // A-B loop logic: if current time exceeds mark B, return to mark A.
            if (isLooping && markA !== null && markB !== null && videoElement.currentTime >= markB) {
                videoElement.currentTime = markA;
            }
        });
        videoElement.addEventListener('ended', () => {
            // If loop is active, restart at point A and play; otherwise, stop.
            if (isLooping && markA !== null) {
                videoElement.currentTime = markA;
                videoElement.play();
            } else {
                playerContainer.classList.remove('playing');
                videoElement.currentTime = 0; // Resets video at the end.
            }
        });
        videoElement.addEventListener('progress', () => {
            // Updates the buffered bar of the progress bar.
            if (videoElement.buffered.length > 0 && progressBarBuffered) {
                const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
                progressBarBuffered.style.width = `${(bufferedEnd / videoElement.duration) * 100}%`;
            }
        });

        // Toggles playback on clicking overlay, video, or small button.
        videoOverlay.addEventListener('click', togglePlay);
        videoElement.addEventListener('click', togglePlay);
        playPauseBtnSmall.addEventListener('click', togglePlay);
        
        // Updates progress bar and time on click.
        function updateProgressBarTime(event) {
            const rect = progressBarContainer.getBoundingClientRect();
            let clickX = event.clientX - rect.left;
            clickX = Math.max(0, Math.min(clickX, rect.width));
            const newTime = (clickX / rect.width) * videoElement.duration;
            videoElement.currentTime = newTime;
            if (progressBarFill) progressBarFill.style.width = `${(newTime / videoElement.duration) * 100}%`;
            if (currentTimeEl) currentTimeEl.textContent = formatTime(newTime);
        }

        // Handler for mouse dragging on the progress bar.
        const handleProgressBarDrag = (event) => {
            if (isDraggingProgressBar) {
                updateProgressBarTime(event);
            }
        };

        // Handler for ending drag on the progress bar.
        const handleProgressBarEnd = () => {
            if (isDraggingProgressBar) {
                isDraggingProgressBar = false;
                document.removeEventListener('mousemove', handleProgressBarDrag);
                document.removeEventListener('mouseup', handleProgressBarEnd);
                if (wasPlayingOnDragStart) {
                    videoElement.play(); // Resumes if playing before drag.
                }
            }
        };

        // Starts the drag process on the progress bar.
        progressBarContainer.addEventListener('mousedown', (event) => {
            isDraggingProgressBar = true;
            wasPlayingOnDragStart = !videoElement.paused;
            if (wasPlayingOnDragStart) {
                videoElement.pause();
            }
            updateProgressBarTime(event);
            document.addEventListener('mousemove', handleProgressBarDrag);
            document.addEventListener('mouseup', handleProgressBarEnd);
        });

        /*
         Initialization of Modular Functionalities
        */

        // Playback Speed Controls: increases/decreases and updates UI.
        if (speedUpBtn && speedDownBtn && speedDisplay) {
            function updateSpeed() {
                const newSpeed = playbackSpeeds[currentSpeedIndex];
                videoElement.playbackRate = newSpeed;
                speedDisplay.textContent = `${newSpeed.toFixed(2).replace(/\.00$/, '').replace(/\.([1-9])0$/, '.$1')}x`;
                speedDownBtn.disabled = currentSpeedIndex === 0;
                speedUpBtn.disabled = currentSpeedIndex === playbackSpeeds.length - 1;
            }
            speedUpBtn.addEventListener('click', () => {
                currentSpeedIndex = Math.min(currentSpeedIndex + 1, playbackSpeeds.length - 1);
                updateSpeed();
            });
            speedDownBtn.addEventListener('click', () => {
                currentSpeedIndex = Math.max(currentSpeedIndex - 1, 0);
                updateSpeed();
            });
            updateSpeed(); // Calls initially to reflect default speed.
        }

        // A-B Loop Controls: marks points, activates/deactivates loop.
        if (markABtn && markBBtn && loopBtn) {
            function updateMarksUI() {
                const duration = videoElement.duration;
                if (isNaN(duration)) return;

                if (markAIndicator) markAIndicator.style.display = markA !== null ? 'block' : 'none';
                if (markA !== null && markAIndicator) markAIndicator.style.left = `${(markA / duration) * 100}%`;
                
                if (markBIndicator) markBIndicator.style.display = markB !== null ? 'block' : 'none';
                if (markB !== null && markBIndicator) markBIndicator.style.left = `${(markB / duration) * 100}%`;
                
                if (markA !== null && markB !== null && loopRangeIndicator) {
                    loopRangeIndicator.style.left = `${(markA / duration) * 100}%`;
                    loopRangeIndicator.style.width = `${((markB - markA) / duration) * 100}%`;
                    loopRangeIndicator.style.display = 'block';
                    loopBtn.disabled = false;
                } else if (loopRangeIndicator) {
                    loopRangeIndicator.style.display = 'none';
                    loopBtn.disabled = true;
                    if (isLooping) {
                        isLooping = false;
                        loopBtn.classList.remove('active');
                    }
                }
            }
            markABtn.addEventListener('click', () => {
                markA = videoElement.currentTime;
                // If mark A is greater than B, B is invalidated.
                if (markB !== null && markA >= markB) markB = null;
                updateMarksUI();
            });
            markBBtn.addEventListener('click', () => {
                markB = videoElement.currentTime;
                // If mark B is less than A, A is invalidated.
                if (markA !== null && markB <= markA) markA = null;
                updateMarksUI();
            });
            loopBtn.addEventListener('click', () => {
                isLooping = !isLooping;
                loopBtn.classList.toggle('active', isLooping);
            });
            updateMarksUI();
        }
        
        // Volume Controls: adjusts volume, mutes, and updates UI.
        if (volumeBtn && volumeSliderContainer && volumeSliderFill) {
            function updateVolumeUI() {
                volumeSliderFill.style.width = `${videoElement.muted ? 0 : videoElement.volume * 100}%`;
                updateIcons(); // Updates volume/mute icon.
            }
            volumeBtn.addEventListener('click', () => { videoElement.muted = !videoElement.muted; updateVolumeUI(); });

            // Handler to update volume on click or drag.
            const handleVolumeUpdate = (e) => {
                const rect = volumeSliderContainer.getBoundingClientRect();
                let clickX = e.clientX - rect.left;
                clickX = Math.max(0, Math.min(clickX, rect.width));
                const newVolume = clickX / rect.width;
                videoElement.muted = false; // Unmutes.
                videoElement.volume = newVolume;
                updateVolumeUI();
            };
            const handleVolumeDrag = (e) => { if (isDraggingVolume) { handleVolumeUpdate(e); } };
            const handleVolumeEnd = () => {
                if (isDraggingVolume) {
                    isDraggingVolume = false;
                    document.removeEventListener('mousemove', handleVolumeDrag);
                    document.removeEventListener('mouseup', handleVolumeEnd);
                }
            };
            volumeSliderContainer.addEventListener('mousedown', (e) => {
                isDraggingVolume = true;
                handleVolumeUpdate(e);
                document.addEventListener('mousemove', handleVolumeDrag);
                document.addEventListener('mouseup', handleVolumeEnd);
            });
            videoElement.addEventListener('volumechange', updateVolumeUI);
            updateVolumeUI(); // Calls initially to reflect default volume.
        }
        
        // Fullscreen Controls: toggles fullscreen mode.
        if (fullscreenBtn) {
            function toggleFullscreen() {
                if (!document.fullscreenElement) {
                    playerContainer.requestFullscreen().catch(err => console.error("Error activating fullscreen:", err));
                } else {
                    document.exitFullscreen();
                }
            }
            fullscreenBtn.addEventListener('click', toggleFullscreen);
            videoElement.addEventListener('dblclick', toggleFullscreen); // Double click also activates fullscreen.
            document.addEventListener('fullscreenchange', updateIcons); // Updates icons when fullscreen state changes.
        }
        
        // Responsive Layout Logic and "More Options" Menu to reposition controls.
        if (leftControls && middleControls && rightControls && moreOptionsBtn && moreOptionsMenu) {
            const handleResponsiveLayout = (width) => {
                // Repositions speed controls.
                if (speedControlsGroup) {
                    if (width < 650 && !moreOptionsMenu.contains(speedControlsGroup)) {
                        moreOptionsMenu.prepend(speedControlsGroup);
                    } else if (width >= 650 && moreOptionsMenu.contains(speedControlsGroup)) {
                        rightControls.prepend(speedControlsGroup);
                    }
                }
                // Repositions loop controls.
                if (loopControlsGroup) {
                    if (width < 520 && !moreOptionsMenu.contains(loopControlsGroup)) {
                        moreOptionsMenu.prepend(loopControlsGroup);
                    } else if (width >= 520 && moreOptionsMenu.contains(loopControlsGroup)) {
                        middleControls.appendChild(loopControlsGroup);
                    }
                }
                // Repositions volume controls.
                if (volumeContainer) {
                    if (width < 420 && !moreOptionsMenu.contains(volumeContainer)) {
                        moreOptionsMenu.prepend(volumeContainer);
                    } else if (width >= 420 && moreOptionsMenu.contains(volumeContainer)) {
                        leftControls.appendChild(volumeContainer);
                    }
                }
                // Shows/hides "More Options" button if there are elements in the menu.
                if (moreOptionsMenu.children.length > 0) {
                    moreOptionsBtn.style.display = 'flex';
                } else {
                    moreOptionsBtn.style.display = 'none';
                    moreOptionsMenu.classList.remove('active');
                }
            };
            
            // Observes size changes in the player container to adjust layout.
            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    handleResponsiveLayout(entry.contentRect.width);
                }
            });
            resizeObserver.observe(playerContainer);

            // Handles click on "More Options" button to toggle menu visibility.
            moreOptionsBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevents click from propagating to the document.
                const playerRect = playerContainer.getBoundingClientRect();
                const btnRect = moreOptionsBtn.getBoundingClientRect();
                // Calculates available space for the dropdown menu.
                const availableSpace = btnRect.top - playerRect.top;
                moreOptionsMenu.style.maxHeight = `${availableSpace - 20}px`; // Adjusts max height.
                moreOptionsMenu.classList.toggle('active');
                if (moreOptionsMenu.classList.contains('active')) {
                    showControls(); // Ensures controls are visible when menu opens.
                }
            });

            // Closes "More Options" menu if clicked outside.
            document.addEventListener('click', (e) => {
                if (!moreOptionsMenu.contains(e.target) && e.target !== moreOptionsBtn && !moreOptionsBtn.contains(e.target)) {
                    moreOptionsMenu.classList.remove('active');
                }
            });
            
            // Initial re-assembly of controls in their default positions (to avoid visual duplicates).
            // These will move according to 'handleResponsiveLayout'.
            if (volumeContainer) leftControls.appendChild(volumeContainer);
            if (loopControlsGroup) middleControls.appendChild(loopControlsGroup);
            if (speedControlsGroup) rightControls.prepend(speedControlsGroup);

            // Calls initial layout function to configure controls based on current width.
            handleResponsiveLayout(playerContainer.clientWidth);
        }

        updateIcons(); // Calls initially to configure correct icons.
        playerContainer.classList.add('initialized'); // Marks player as initialized.
    }

    /*
    ----------------------------------------------------------------------------
     2.4. QUIZ LOGIC MODULE
    ----------------------------------------------------------------------------
     Contains functions to process question data (from Anki fields),
     build the quiz user interface according to its type,
     and attach necessary event handlers for interaction.
    */

    // Parses Anki card fields (Question, Options, Tags, etc.)
    // to structure quiz data for JavaScript use.
    function parseFields() {
        // Helper function to get innerHTML of an element by its ID.
        const get = id => document.getElementById(id)?.innerHTML || '';

        // Map of known quiz types based on tags.
        const knownQuizTypes = {
            'sc': 'single-choice',
            'mc': 'multiple-choice',
            'tf': 'true-falso',
            'ae': 'exact-answer',
            'r': 'matching',
            'o': 'ordering',
            'f': 'sentence-formation',
            'b': 'basic'
        };
        
        const rawTagsString = get('anki-field-tags') || '';
        const allTags = rawTagsString.split(/\s+/).map(t => t.trim()).filter(Boolean);
        
        let detectedQuizType = null;
        let thematicTags = [];
        
        // Iterates over tags to identify quiz type and thematic tags.
        for (const tag of allTags) {
            const normalizedTag = tag.toLowerCase();
            // The first quiz type tag found defines the main type.
            if (knownQuizTypes[normalizedTag] && !detectedQuizType) {
                detectedQuizType = knownQuizTypes[normalizedTag];
            } else {
                thematicTags.push(tag.replace(/_/g, ' ')); // Stores other tags as thematic.
            }
        }
        
        // If no specific quiz type is detected, assumes 'basic'.
        if (!detectedQuizType) {
            detectedQuizType = 'basic';
        }

        // Main object to store question data.
        const q = {
            type: detectedQuizType,
            text: get('anki-field-pregunta'),
            tags: thematicTags,
            pistas: []
        };

        // Processes the 'Pistas' field, splitting it into objects with title and content.
        const rawPistas = (get('anki-field-pistas') || "").split('|');
        q.pistas = rawPistas.map(pistaString => {
            const trimmedPista = pistaString.trim();
            if (!trimmedPista) return null; // Ignores empty hints.
            const parts = trimmedPista.split(/<br\s*\/?>/i); // Splits by <br> for title/content.
            const title = parts[0].trim();
            const content = parts.length > 1 ? parts.slice(1).join('<br>').trim() : null;
            return { title: title, content: content };
        }).filter(Boolean); // Filters out any null hints.
        
        // Helper function to parse an option string into an {id, text, value} object.
        const parseOpt = s => {
            const trimmedS = s.trim();
            if (!trimmedS) return null;
            const m = trimmedS.match(/^([a-zA-Z0-9_.-]+)[\.\)]\s*(.+)/s);
            // If the option has an ID and text (e.g., "1. Option"), extracts them.
            return m && m[2] ? { id: m[1].trim(), text: m[2].trim(), value: m[1].trim() } : { id: trimmedS, text: trimmedS, value: trimmedS };
        };

        // Helper function to clean an ID (removes '. ' or ')' at the end).
        const cleanId = id => id.trim().replace(/[\.\)]$/, '');
        
        // Gets content of main fields.
        const opts = get('anki-field-opciones');
        const ans = get('anki-field-respuesta_correcta');
        const expl = get('anki-field-explicacion');

        // Processes explanations (general or individual).
        if (expl) {
            let contentToParse = expl;
            const explanationParts = contentToParse.split('|');
            let allPartsHadValidIds = true;
            const tempIndividualExplanations = new Map();

            // Attempts to parse individual explanations if the format suggests it.
            if (explanationParts.length > 1 || (explanationParts.length === 1 && /^[a-zA-Z0-9_.-]+[\.\)]/.test(explanationParts[0].trim()))) {
                for (const part of explanationParts) {
                    const trimmedPart = part.trim();
                    const explanationMatch = trimmedPart.match(/^([a-zA-Z0-9_.-]+)[\.\)]\s*(.+)/s);
                    if (explanationMatch && explanationMatch[2] && explanationMatch[2].trim() !== "") {
                        // Stores individual explanations by ID.
                        tempIndividualExplanations.set(explanationMatch[1].trim(), explanationMatch[2].trim().replace(/\\n/g, '<br>'));
                    } else {
                        allPartsHadValidIds = false; // If a part doesn't match, not all are individual.
                        break;
                    }
                }
            } else {
                allPartsHadValidIds = false;
            }

            // Assigns explanations as individual if all parts were valid, otherwise as general.
            if (allPartsHadValidIds && tempIndividualExplanations.size > 0) {
                q.individualExplanations = tempIndividualExplanations;
            } else {
                q.generalExplanation = expl.replace(/\\n/g, '<br>');
            }
        } else {
            q.generalExplanation = null;
        }

        // Structures question data according to quiz type.
        switch (q.type) {
            case 'single-choice':
                q.options = opts.split('|').map(parseOpt).filter(Boolean);
                q.correctAnswer = cleanId(ans);
                break;
            case 'true-falso':
                q.options = [{id:"true",text:"True",value:"true"},{id:"false",text:"False",value:"false"}];
                // Normalizes correct answer to 'true' or 'false'.
                q.correctAnswer = ans.toLowerCase().trim()==='true'?'true':'false';
                break;
            case 'multiple-choice':
                q.options = opts.split('|').map(parseOpt).filter(Boolean);
                q.correctAnswers = ans.split(',').map(cleanId).filter(Boolean);
                break;
            case 'exact-answer':
                q.answer = ans;
                break;
            case 'matching':
                const allParts = opts.split('|').map(parseOpt).filter(Boolean);
                q.leftOptions=[];
                q.rightOptions=[];
                // Separates options into 'left' (letters) and 'right' (numbers).
                allParts.forEach(option => {
                    if (/^\d+$/.test(option.id)) q.rightOptions.push(option);
                    else if (/^[a-zA-Z]/.test(option.id)) q.leftOptions.push(option);
                });
                q.correctAnswersMap={};
                // Maps correct answers from 'A-1; B-2' to an object.
                ans.split(/[;,]/).forEach(pair=>{
                    const parts=pair.trim().split('-');
                    if(parts.length===2)q.correctAnswersMap[cleanId(parts[0])]=parts[1].trim();
                });
                break;
            case 'ordering':
                q.allOptions = opts.split('|').map(parseOpt).filter(Boolean);
                q.correctOrder = ans.split(',').map(cleanId).filter(Boolean);
                break;
            case 'sentence-formation':
            case 'frase':
                q.wordBankOptions = opts.split('|').map(s=>s.trim()).filter(Boolean);
                q.correctSentenceWords = ans.split(/\s+/).map(s=>s.trim()).filter(Boolean);
                break;
            case 'basic':
                q.answer = ans;
                break;
            default:
                return null; // Returns null if quiz type is unknown.
        }
        return q;
    }

    // Builds the HTML for the quiz interface on the front of the card
    // based on the parsed question data.
    function buildHTML(question) {
        // Generates HTML for question tags.
        const tagsHTML = `<div class="question-tags-container">${(question.tags && question.tags.length > 0 ? question.tags : []).map(tag => `<span class="tag-badge">${tag}</span>`).join('')}</div>`;
        
        let html = `
            <div id="q-card" class="question-card-item styled-card">
                <div class="question-card-header">${tagsHTML}</div>
                <p>${parseAndRenderMedia(question.text)}</p>
                <div id="options-box" style="display: flex; flex-direction: column;">`;
        
        // Generates specific interface for each quiz type.
        switch (question.type) {
            case 'single-choice':
            case 'true-falso':
            case 'multiple-choice':
                // Shuffles options to appear in a random order.
                const shuffledOptions = shuffleArray(question.options);
                // Stores shuffled order in sessionStorage for retrieval on the back.
                sessionStorage.setItem('ankiQuizShuffledOptions', JSON.stringify(shuffledOptions));
                (shuffledOptions || []).forEach(option => {
                    html += `
                        <div class="option-container">
                            <label class="option-label">
                                <input type="${question.type === 'multiple-choice' ? 'checkbox' : 'radio'}" name="q-option" value="${option.value}" class="styled-input">
                                <span class="option-text">${parseAndRenderMedia(option.text)}</span>
                            </label>
                        </div>`;
                });
                break;
            
            case 'exact-answer':
                // Text area for exact answer.
                html += `<textarea id="exact-answer-input" class="styled-textarea" rows="3" placeholder="Type your answer..."></textarea>`;
                break;
            
            case 'matching':
                // Shuffles left and right options.
                const shuffledLeftOptions = shuffleArray(question.leftOptions);
                const shuffledRightOptions = shuffleArray(question.rightOptions);
                // Stores order for card back.
                sessionStorage.setItem('ankiQuizMatchingLeft', JSON.stringify(shuffledLeftOptions));
                sessionStorage.setItem('ankiQuizMatchingRight', JSON.stringify(shuffledRightOptions));
                (shuffledLeftOptions || []).forEach(leftOption => {
                    html += `
                        <div class="matching-row" data-left-id="${leftOption.id}">
                            <div class="matching-row-content">
                                <div class="matching-row-left">${parseAndRenderMedia(leftOption.text)}</div>
                                <div class="matching-row-right">
                                    <select class="styled-select">
                                        <option value="">-- Select --</option>
                                        ${shuffledRightOptions.map(rightOption => `<option value="${rightOption.id}">${parseAndRenderMedia(rightOption.text)}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>`;
                });
                break;
            
            case 'ordering':
                // List of draggable elements to order.
                html += `
                    <div id="draggable-list" class="draggable-list">
                        ${shuffleArray(question.allOptions).map((option, index) => `
                            <div class="draggable-item" draggable="true" data-id="${option.id}">
                                <div class="draggable-item-content">
                                    <span class="order-number">${index + 1}.</span>
                                    <span class="item-text">${parseAndRenderMedia(option.text)}</span>
                                </div>
                            </div>`).join('')}
                    </div>`;
                break;
            
            case 'sentence-formation':
            case 'frase':
                // Area to build the sentence and a word bank.
                html += `
                    <div id="sentence-response-area" class="sentence-response-area"></div>
                    <div id="sentence-word-bank" class="sentence-word-bank">
                        ${shuffleArray(question.wordBankOptions).map(word => `<button type="button" class="sentence-word-button" data-word-text="${word}">${word}</button>`).join('')}
                    </div>`;
                break;

            case 'basic':
                // For basic cards, no answer options on the front.
                break;
        }
        
        html += `</div>`; // Closes #options-box

        // Adds hints section if they exist.
        if (question.pistas && question.pistas.length > 0) {
            html += `
                <div class="hint-section-main">
                    ${question.pistas.map((pista, index) => `
                        <div class="individual-hint-item">
                            <button type="button" class="toggle-individual-hint-button" aria-expanded="false">
                                <span class="hint-title-display">${pista.title}</span>
                                <span class="individual-arrow">▼</span>
                            </button>
                            <div class="hint-content-wrapper">
                                <div class="p-3-manual">
                                    <div class="display-individual-hint">${pista.content ? parseAndRenderMedia(pista.content) : 'This hint has no additional content.'}</div>
                                </div>
                            </div>
                        </div>`).join('')}
                </div>`;
        }
        
        // Defines action buttons ("Show Answer" or "I don't know" / "Evaluate").
        let actionButtonsHTML;
        if (question.type === 'basic') {
            actionButtonsHTML = `<div id="action-buttons" style="display: flex; justify-content: flex-end; align-items: center; margin-top:2rem;"><button type="button" id="eval-btn" class="btn btn-primary btn-xs">Show Answer</button></div>`;
        } else {
            actionButtonsHTML = `<div id="action-buttons" style="display: flex; justify-content: space-between; align-items: center; margin-top:2rem;"><button type="button" id="idk-btn" class="btn btn-secondary btn-xs">I don't know</button><button type="button" id="eval-btn" class="btn btn-primary btn-xs">Evaluate</button></div>`;
        }
        
        html += actionButtonsHTML;
        html += `</div>`; // Closes #q-card
        return html;
    }

    // Attaches event handlers to interactive quiz elements,
    // allowing the user to select answers, type, or drag.
    function attachListeners(question) {
        const card = document.getElementById('q-card');
        const evalBtn = card.querySelector('#eval-btn');
        const idkBtn = card.querySelector('#idk-btn');
        
        // Initializes 'userAnswer' according to quiz type to ensure correct format.
        if (question.type === 'matching') {
            userAnswer = {};
        } else if (['multiple-choice', 'ordering', 'sentence-formation', 'frase'].includes(question.type)) {
            userAnswer = [];
        } else {
            userAnswer = null;
        }
        
        // Handlers for main buttons.
        if (idkBtn) {
            idkBtn.addEventListener('click', () => { storeAnswerAndFlip(true); });
        }
        evalBtn.addEventListener('click', () => storeAnswerAndFlip(false));
        
        // Specific handlers for each quiz type.
        if (question.type === 'multiple-choice') {
            card.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    // Collects all checked options.
                    userAnswer = Array.from(card.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
                    // Updates visual state of labels.
                    card.querySelectorAll('label.option-label').forEach(label => label.classList.remove('user-selected'));
                    card.querySelectorAll('input[type="checkbox"]:checked').forEach(input => input.closest('label').classList.add('user-selected'));
                });
            });
        }
        else if (['single-choice', 'true-falso'].includes(question.type)) {
            card.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio._lastCheckedState = radio.checked; // Stores state to allow unchecking.
                radio.addEventListener('click', function() {
                    // If button was already checked and clicked again, unchecks it.
                    if (this._lastCheckedState) {
                        this.checked = false;
                        userAnswer = null;
                        this.closest('label').classList.remove('user-selected');
                        this._lastCheckedState = false;
                    } else {
                        userAnswer = [this.value];
                        // Visually unchecks all other options.
                        card.querySelectorAll('label.option-label').forEach(label => label.classList.remove('user-selected'));
                        this.closest('label').classList.add('user-selected');
                        this._lastCheckedState = true;
                        // Ensures only one radio button is checked.
                        card.querySelectorAll('input[type="radio"]').forEach(otherRadio => {
                            if (otherRadio !== this) {
                                otherRadio.checked = false;
                                otherRadio._lastCheckedState = false;
                                otherRadio.closest('label').classList.remove('user-selected');
                            }
                        });
                    }
                });
            });
        }
        else if (question.type === 'exact-answer') {
            const textarea = card.querySelector('#exact-answer-input');
            const hasRENTag = question.tags && question.tags.includes('REN'); // Checks if it's a numeric question.
            if (hasRENTag) {
                // Configures virtual keyboard for numeric input on mobile devices.
                textarea.setAttribute('inputmode', 'numeric');
                textarea.setAttribute('pattern', '[0-9]*');
            }
            // Automatically focuses textarea after a short delay.
            setTimeout(() => {
                textarea.focus();
                // Simulates a touch to show the numeric keyboard on iOS if it has the REN tag.
                if (hasRENTag && 'ontouchstart' in window) {
                    setTimeout(() => {
                        const event = new Event('touchstart', { bubbles: true });
                        textarea.dispatchEvent(event);
                    }, 100);
                }
            }, 250);
            textarea.addEventListener('input', event => {
                userAnswer = [event.target.value]; // Stores textarea value as answer.
            });
        }
        else if (question.type === 'matching') {
            card.querySelectorAll('select.styled-select').forEach(select => select.addEventListener('change', () => {
                userAnswer = {}; // Resets answer object.
                // Collects current selections from all matching dropdowns.
                card.querySelectorAll('select.styled-select').forEach(currentSelect => {
                    const leftId = currentSelect.closest('.matching-row').dataset.leftId;
                    if (currentSelect.value) userAnswer[leftId] = currentSelect.value;
                });
            }));
        } 
        else if (question.type === 'ordering') {
            const list = card.querySelector('#draggable-list');
            
            // Updates 'userAnswer' array with current order of elements.
            const updateOrder = () => {
                userAnswer = Array.from(list.children).map(item => item.dataset.id);
                // Updates visible numbers in the ordered list.
                list.querySelectorAll('.order-number').forEach((numberSpan, index) => numberSpan.textContent = `${index + 1}.`);
            };
            
            updateOrder(); // Calls initially to set order on load.
            
            // Handlers for drag & drop functionality.
            list.addEventListener('dragstart', event => event.target.classList.add('dragging'));
            list.addEventListener('dragend', event => {
                event.target.classList.remove('dragging');
                updateOrder(); // Updates order after dropping.
                // Readjusts keyboard focus if keyboard navigation is active.
                if (window.ankiQuizKeyboardHandler) {
                    const previouslyFocusedItem = navigableItems[currentIndex];
                    updateNavigableItems(); // Recalculates navigable items.
                    const newIndexOfFocusedItem = navigableItems.findIndex(item => item === previouslyFocusedItem);
                    if (newIndexOfFocusedItem !== -1) {
                        currentIndex = newIndexOfFocusedItem;
                    }
                }
            });
            list.addEventListener('dragover', event => {
                event.preventDefault(); // Allows dropping elements.
                // Determines insertion position for the dragged element.
                const afterElement = [...list.querySelectorAll('.draggable-item:not(.dragging)')].reduce((closest, currentElement) => {
                    const boundingBox = currentElement.getBoundingClientRect();
                    const offset = event.clientY - boundingBox.top - boundingBox.height / 2;
                    return (offset < 0 && offset > closest.offset) ? { offset: offset, element: currentElement } : closest
                }, { offset: Number.NEGATIVE_INFINITY }).element;
                const draggable = list.querySelector('.dragging');
                if (afterElement) {
                    list.insertBefore(draggable, afterElement); // Inserts before the found element.
                } else {
                    list.appendChild(draggable); // If no 'after' element, adds to the end.
                }
            });
        }
        else if (question.type === 'sentence-formation' || question.type === 'frase') {
            const responseArea = card.querySelector('#sentence-response-area');
            const wordBank = card.querySelector('#sentence-word-bank');
            
            // Function to render word buttons in the response area.
            const render = () => {
                responseArea.innerHTML = userAnswer.map((word,index)=>`<button type="button" class="sentence-word-button" data-word-index="${index}" data-word-text="${word}">${word}</button>`).join('');
            };
            
            // On clicking a word from the bank, adds it to the response area.
            wordBank.addEventListener('click', event => {
                if (event.target.classList.contains('sentence-word-button')) {
                    userAnswer.push(event.target.dataset.wordText);
                    render();
                }
            });
            // On clicking a word in the response area, removes it.
            responseArea.addEventListener('click', event => {
                if (event.target.classList.contains('sentence-word-button')) {
                    userAnswer.splice(parseInt(event.target.dataset.wordIndex), 1);
                    render();
                }
            });
        }

        // Handlers for individual hint buttons.
        card.querySelectorAll('.toggle-individual-hint-button').forEach(button => {
            button.addEventListener('click', () => {
                const content = button.nextElementSibling; // The hint content wrapper.
                const isExpanded = button.getAttribute('aria-expanded') === 'true';
                // Toggles ARIA attribute for accessibility.
                button.setAttribute('aria-expanded', !isExpanded);
                // Rotates the arrow visually.
                button.querySelector('.individual-arrow').style.transform = isExpanded ? '' : 'rotate(180deg)';
                // Animates hint content expansion/collapse.
                content.style.maxHeight = isExpanded ? null : content.scrollHeight + 'px';
            });
        }); 
    }

    /*
    ----------------------------------------------------------------------------
     2.5. KEYBOARD NAVIGATION MODULE
    ----------------------------------------------------------------------------
     Implements quiz navigation using directional keys (W, S, A, D)
     and the spacebar to select or interact with elements,
     improving accessibility and user flow.
    */

    // Initializes the keyboard navigation system for quiz elements.
    function initializeKeyboardNavigation(question) {
        // Clears any previous keyboard handler to avoid duplicate effects.
        if (window.ankiQuizKeyboardHandler) {
            document.removeEventListener('keydown', window.ankiQuizKeyboardHandler);
            window.ankiQuizKeyboardHandler = null;
        }

        // Defines the global state object for keyboard navigation.
        window.ankiQuizKeyboardState = {
            navigableItems: [], // List of all interactive elements that can be focused.
            currentIndex: -1,   // Index of the currently focused element.
            grabbedItem: null,  // Dragged item in ordering mode.
            // Helper functions that will be redefined within this scope.
            updateNavigableItems: () => {},
            updateFocus: () => {},
        };
        const state = window.ankiQuizKeyboardState;

        const quizType = question.type;
        
        let activeZone = 'bank'; // Default active zone for 'sentence-formation'.
        let bankItems = [], responseItems = [], mainItems = []; // Element lists by zone.
        let bankIndex = -1, responseIndex = -1, mainIndex = -1; // Focus indices by zone.
        const responseArea = document.getElementById('sentence-response-area');
        const wordBank = document.getElementById('sentence-word-bank');

        // Updates the list of navigable elements on the card.
        state.updateNavigableItems = function() {
            const quizContainer = document.getElementById('quiz-container-anki-front');
            if (!quizContainer) return;
            
            const hintButtons = Array.from(quizContainer.querySelectorAll('.toggle-individual-hint-button'));
            const actionButtons = Array.from(quizContainer.querySelectorAll('#action-buttons button'));

            if (quizType === 'sentence-formation') {
                bankItems = Array.from(wordBank.querySelectorAll('.sentence-word-button'));
                responseItems = Array.from(responseArea.querySelectorAll('.sentence-word-button'));
                mainItems = [...hintButtons, ...actionButtons]; // Action and hint buttons as main elements.
            } else {
                let coreItems = [];
                // Determines "core" quiz elements based on type.
                switch (quizType) {
                    case 'single-choice': case 'multiple-choice': case 'true-falso':
                        coreItems = Array.from(quizContainer.querySelectorAll('.option-container')); break;
                    case 'matching':
                        coreItems = Array.from(quizContainer.querySelectorAll('.matching-row')); break;
                    case 'ordering':
                        coreItems = Array.from(quizContainer.querySelectorAll('.draggable-item')); break;
                }
                // Combines core elements with hint and action buttons.
                state.navigableItems = [...coreItems, ...hintButtons, ...actionButtons];
            }
        }
        
        // Gets the "focusable" child element within a container.
        // Used to apply the focus class to the visually correct element.
        function getFocusableChild(container) {
            if (!container) return null;
            if (container.classList.contains('matching-row')) return container.querySelector('.matching-row-content');
            if (container.classList.contains('draggable-item')) return container.querySelector('.draggable-item-content');
            if (container.classList.contains('option-container')) return container.querySelector('.option-label');
            return container; // If not a specific type, the container itself is focusable.
        }
        
        // Updates the visually focused element and its index in the current zone.
        state.updateFocus = function(newIndex, zone = null) {
            let items, localIndex, setIndex;
            // Determines element list and local index based on active zone.
            if (zone === 'bank') {
                items = bankItems; localIndex = bankIndex;
                if (bankIndex > -1 && bankItems[bankIndex]) bankItems[bankIndex].classList.remove('keyboard-focused');
                setIndex = (i) => bankIndex = i;
            } 
            else if (zone === 'response') {
                items = responseItems; localIndex = responseIndex;
                if (responseIndex > -1 && responseItems[responseIndex]) responseItems[responseIndex].classList.remove('keyboard-focused');
                setIndex = (i) => responseIndex = i;
            } 
            else if (zone === 'main') {
                items = mainItems; localIndex = mainIndex;
                if (mainIndex > -1 && mainItems[mainIndex]) getFocusableChild(mainItems[mainIndex]).classList.remove('keyboard-focused');
                setIndex = (i) => mainIndex = i;
            } 
            else { // Generic zone for other quiz types.
                items = state.navigableItems; 
                localIndex = state.currentIndex; 
                if (state.currentIndex > -1 && state.navigableItems[state.currentIndex]) getFocusableChild(state.navigableItems[state.currentIndex])?.classList.remove('keyboard-focused'); 
                setIndex = (i) => state.currentIndex = i; 
            }
            
            // Adjusts new index to be cyclic (wraps around).
            if (newIndex < 0) newIndex = items.length - 1; else if (newIndex >= items.length) newIndex = 0;
            localIndex = items.length > 0 ? newIndex : -1; // -1 if no elements.
            
            // Applies focus class and scrolls element into view.
            if (localIndex > -1 && items[localIndex]) { 
                const focusableChild = getFocusableChild(items[localIndex]); 
                focusableChild?.classList.add('keyboard-focused'); 
                focusableChild?.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
            }
            setIndex(localIndex); // Updates global zone index.
        };
        
        // Switches active keyboard navigation zone (only for sentence-formation).
        function switchZone(newZone) {
            // Removes visual focus from outgoing zone.
            if (activeZone === 'bank') {
                if (bankIndex > -1 && bankItems[bankIndex]) bankItems[bankIndex].classList.remove('keyboard-focused');
                if (wordBank) wordBank.classList.remove('keyboard-zone-active');
            } else if (activeZone === 'response') {
                if (responseIndex > -1 && responseItems[responseIndex]) responseItems[responseIndex].classList.remove('keyboard-focused');
                if (responseArea) responseArea.classList.remove('keyboard-zone-active');
            } else if (activeZone === 'main') {
                if (mainIndex > -1 && mainItems[mainIndex]) getFocusableChild(mainItems[mainIndex]).classList.remove('keyboard-focused');
            }
            
            activeZone = newZone; // Sets new active zone.
            
            // Applies visual focus and sets initial focus in the new zone.
            if (activeZone === 'bank') {
                if (wordBank) wordBank.classList.add('keyboard-zone-active');
                state.updateFocus(bankIndex > -1 ? bankIndex : 0, 'bank');
            } else if (activeZone === 'response') {
                if (responseArea) responseArea.classList.add('keyboard-zone-active');
                state.updateFocus(responseIndex > -1 ? responseIndex : 0, 'response');
            } else if (activeZone === 'main') {
                state.updateFocus(0, 'main'); // Always focuses first 'main' element.
            }
        }
        
        // Main keyboard event handler.
        window.ankiQuizKeyboardHandler = function(event) {
            const key = event.key.toLowerCase();

            // If focus is on a text field, allows normal input.
            // 'Enter' key can still be used to flip the card.
            if (document.activeElement.tagName.match(/TEXTAREA|INPUT|SELECT/)) {
                if (key === 'enter' && !event.shiftKey) {
                    event.preventDefault(); // Prevents newline in textarea.
                    storeAnswerAndFlip(false); // Flips the card.
                }
                return;
            }

            // Defines keys that activate quiz navigation.
            const gameKeys = ['w', 's', 'a', 'd', ' ', 'enter'];
            if (!gameKeys.includes(key)) return; // Ignores other keys.

            event.preventDefault(); // Prevents default key behavior.
            event.stopPropagation(); // Stops event propagation.

            // If 'Enter' is pressed, flips the card.
            if (key === 'enter') { return storeAnswerAndFlip(false); }
            
            // Specific logic for 'sentence-formation' quiz type.
            if (quizType === 'sentence-formation') {
                if (key === 'w') { // Navigates up or changes zone.
                    if (activeZone === 'main') {
                        if (mainIndex === 0) { switchZone('bank'); } // Jumps to word bank.
                        else { state.updateFocus(mainIndex - 1, 'main'); }
                    } else if (activeZone === 'bank') {
                        if (responseItems.length > 0) { switchZone('response'); } // If words in response, jumps there.
                        else if (mainItems.length > 0) { switchZone('main'); setTimeout(() => state.updateFocus(mainItems.length - 1, 'main'), 0); } // Else, jumps to last 'main' element.
                    } else if (activeZone === 'response') {
                        if (mainItems.length > 0) { switchZone('main'); setTimeout(() => state.updateFocus(mainItems.length - 1, 'main'), 0); } // Jumps to last 'main' element.
                    }
                } else if (key === 's') { // Navigates down or changes zone.
                    if (activeZone === 'response') { switchZone('bank'); } // Jumps to word bank.
                    else if (activeZone === 'bank' && mainItems.length > 0) { switchZone('main'); } // Jumps to main zone.
                    else if (activeZone === 'main') {
                        if (mainIndex === mainItems.length - 1) { 
                            if (responseItems.length > 0) { switchZone('response'); } // If words in response, jumps there.
                            else { switchZone('bank'); } // Else, jumps to word bank.
                        } else { state.updateFocus(mainIndex + 1, 'main'); }
                    }
                } 
                else if (key === 'a' || key === 'd') { // Navigates sideways within current zone.
                    if (activeZone === 'bank') { state.updateFocus(key === 'a' ? bankIndex - 1 : bankIndex + 1, 'bank'); } 
                    else if (activeZone === 'response') { state.updateFocus(key === 'a' ? responseIndex - 1 : responseIndex + 1, 'response'); }
                } 
                else if (key === ' ') { // Selects or removes a word.
                    let itemToClick, localIndex;
                    if (activeZone === 'bank') { itemToClick = bankItems[bankIndex]; localIndex = bankIndex; } 
                    else if (activeZone === 'response') { itemToClick = responseItems[responseIndex]; localIndex = responseIndex; } 
                    else { itemToClick = mainItems[mainIndex]; }
                    
                    if (itemToClick) {
                        itemToClick.click(); // Simulates a click on the focused element.
                        // After a click on the bank or response area,
                        // recalculate navigable elements and readjust focus.
                        if(activeZone === 'bank' || activeZone === 'response') {
                            setTimeout(() => {
                                state.updateNavigableItems();
                                let currentItems = activeZone === 'bank' ? bankItems : responseItems;
                                let newIndex = Math.min(localIndex, currentItems.length - 1);
                                state.updateFocus(newIndex, activeZone);
                            }, 50);
                        }
                    }
                }
                return; // Exits function, event already handled.
            }

            // General navigation logic for other quiz types.
            const currentItem = state.navigableItems[state.currentIndex];
            
            if (key === 'w' || key === 's') { // Vertical navigation.
                if (quizType === 'ordering' && state.grabbedItem) {
                    // If an item is "grabbed" in ordering mode, moves it.
                    const list = document.getElementById('draggable-list');
                    if (key === 'w' && state.grabbedItem.previousElementSibling) { list.insertBefore(state.grabbedItem, state.grabbedItem.previousElementSibling); } 
                    else if (key === 's' && state.grabbedItem.nextElementSibling) { list.insertBefore(state.grabbedItem, state.grabbedItem.nextElementSibling.nextElementSibling); }
                    // Updates order and numbering.
                    const updateOrder = () => { userAnswer = Array.from(list.children).map(item => item.dataset.id); list.querySelectorAll('.order-number').forEach((n,i)=>n.textContent=`${i+1}.`); };
                    updateOrder();
                    state.updateNavigableItems(); // Recalculates navigable list.
                    state.currentIndex = state.navigableItems.indexOf(state.grabbedItem); // Keeps focus on the moved item.
                } else {
                    // If not in "drag" mode, simply moves focus.
                    state.updateFocus(key === 'w' ? state.currentIndex - 1 : state.currentIndex + 1, null);
                }
            }
            else if (key === ' ') { // Interaction with the focused element.
                if (!currentItem) return; // Does nothing if no element is focused.

                if (currentItem.matches('.option-container')) {
                    // If it's an option (radio/checkbox), simulates a click.
                    currentItem.querySelector('input')?.click();
                } 
                else if (currentItem.matches('.draggable-item')) {
                    // If it's a draggable element, "grabs" or "releases" it.
                    if (state.grabbedItem === null) {
                        state.grabbedItem = currentItem;
                        getFocusableChild(state.grabbedItem)?.classList.add('keyboard-grabbed');
                    } else {
                        getFocusableChild(state.grabbedItem)?.classList.remove('keyboard-grabbed');
                        state.grabbedItem = null;
                    }
                } else {
                    // For other buttons or elements, simulates a direct click.
                    currentItem.click();
                }
            }
            // Specific logic for 'matching' type when navigating with 'A' or 'D'.
            else if ((key === 'a' || key === 'd') && quizType === 'matching' && currentItem?.matches('.matching-row')) {
                const select = currentItem.querySelector('select');
                if (select) {
                    let changed = false;
                    if (key === 'a' && select.selectedIndex > 0) { select.selectedIndex--; changed = true; }
                    if (key === 'd' && select.selectedIndex < select.options.length - 1) { select.selectedIndex++; changed = true; }
                    if (changed) select.dispatchEvent(new Event('change', { bubbles: true })); // Dispatches 'change' event manually.
                }
            }
        };
        
        state.updateNavigableItems(); // Calls initially to populate element list.

        // Sets initial active zone for 'sentence-formation' type.
        if (quizType === 'sentence-formation') {
            switchZone('bank');
        }
        
        // Adds global event listener for keys.
        document.addEventListener('keydown', window.ankiQuizKeyboardHandler);
    }
    
    /*
    ----------------------------------------------------------------------------
     2.6. ADDITIONAL FUNCTIONALITIES MODULE (UX)
    ----------------------------------------------------------------------------
     Implements user experience improvements, such as
     media autoplay and cursor hiding due to inactivity.
    */

    // Attempts to autoplay the first media element
    // (audio or video) present on the card.
    function triggerAutoplay() {
        const firstMediaElement = document.querySelector('.custom-audio-element, .custom-video-element');
        if (firstMediaElement) {
            // Small delay to ensure the element is ready for playback.
            setTimeout(() => {
                firstMediaElement.play().catch(e => {
                    // Catches and logs errors if the browser blocks autoplay.
                    console.log("Autoplay was blocked by the browser.");
                });
            }, 100);
        }
    }

    // Initializes cursor hiding behavior due to inactivity.
    // The cursor hides after a period of no mouse movement.
    function initializeCursorHiding() {
        const targetElement = document.body; // Element on which the cursor is hidden.
        if (!targetElement) return;

        const CURSOR_STATE_KEY = 'ankiQuizCursorIsIdle'; // Key for sessionStorage.
        let cursorIdleTimeout; // Reference to inactivity timer.

        // Function to visually hide the cursor.
        function hideCursor() {
            targetElement.classList.add('cursor-idle');
            sessionStorage.setItem(CURSOR_STATE_KEY, 'true'); // Persists hidden state.
        }

        // Function to show cursor and reset timer.
        function showCursorAndResetTimer() {
            targetElement.classList.remove('cursor-idle');
            sessionStorage.removeItem(CURSOR_STATE_KEY); // Removes persistent state.
            clearTimeout(cursorIdleTimeout); // Clears existing timer.
            cursorIdleTimeout = setTimeout(hideCursor, 2500); // Sets a new timer.
        }

        // Retrieves previous cursor state on card load.
        if (sessionStorage.getItem(CURSOR_STATE_KEY) === 'true') {
            targetElement.classList.add('cursor-idle'); // If hidden, hides it again.
        } else {
            showCursorAndResetTimer(); // Otherwise, starts normal timer.
        }

        // Adds listener to reset timer on each mouse movement.
        targetElement.addEventListener('mousemove', showCursorAndResetTimer);
    }

    /*
    ============================================================================
     SECTION 3: MAIN EXECUTION FLOW AND ERROR HANDLING
    ============================================================================
     Orchestrates the initialization of all front card components
     and provides a basic mechanism to capture and display critical errors.
    */
    try {
        const container = document.getElementById('quiz-container-anki-front');
        
        setupTimer(); // Initializes and activates the timer bar.
        
        questionData = parseFields(); // Parses question data from Anki fields.

        // If question data is valid, builds interface and attaches listeners.
        if (questionData) {
            container.innerHTML = buildHTML(questionData); // Renders quiz HTML.
            
            attachListeners(questionData); // Attaches event handlers to quiz elements.
            
            // Processes and enhances media and image elements.
            upgradeStandardMedia('#quiz-container-anki-front');
            initializeAllCustomMediaPlayers();
            styleAnkiImages('#quiz-container-anki-front');
            
            triggerAutoplay(); // Attempts to autoplay the first media.
            initializeKeyboardNavigation(questionData); // Enables keyboard navigation.
            initializeCursorHiding(); // Initializes cursor hiding due to inactivity.
        } else {
            // Shows an error message if the quiz type is not valid.
            container.innerHTML = "<div class='styled-card'><strong>Error:</strong> No valid quiz type found.</div>";
        }

        // --- START: Duplicated persistent cursor logic (Original source code) ---
        // This block is a duplication of the cursor hiding functionality.
        // It is kept here as it was in the original code to ensure the
        // immutability of the functional logic, although its presence is redundant.
        (function() {
            const CURSOR_STATE_KEY = 'ankiQuizCursorIsIdle';
            let cursorIdleTimeout;
            const hideCursor = () => { document.documentElement.classList.add('cursor-idle'); sessionStorage.setItem(CURSOR_STATE_KEY, 'true'); };
            const showCursor = () => { document.documentElement.classList.remove('cursor-idle'); sessionStorage.removeItem(CURSOR_STATE_KEY); };
            const cursorActivityHandler = () => { showCursor(); clearTimeout(cursorIdleTimeout); cursorIdleTimeout = setTimeout(hideCursor, 2500); };
            if (window.ankiCursorHandler) { document.removeEventListener('mousemove', window.ankiCursorHandler); }
            window.ankiCursorHandler = cursorActivityHandler;
            document.addEventListener('mousemove', window.ankiCursorHandler);
            if (sessionStorage.getItem(CURSOR_STATE_KEY) === 'true') {
                document.documentElement.classList.add('cursor-idle');
                cursorIdleTimeout = setTimeout(() => { if (sessionStorage.getItem(CURSOR_STATE_KEY) === 'true') { hideCursor(); } }, 100);
            } else {
                cursorIdleTimeout = setTimeout(hideCursor, 2500);
            }
        })();
        // --- END: Duplicated persistent cursor logic (Original source code) ---

    } catch (e) {
        // Catches and displays any unexpected error in the quiz interface.
        document.getElementById('quiz-container-anki-front').innerHTML = `<div class='styled-card' style='color:red;'><strong>Error:</strong> ${e.message}<br>Stack: ${e.stack}</div>`;
        console.error("Error on the front of the card:", e);
    }
    
    // =========================================================================
    // END OF ORIGINAL CODE
    // =========================================================================
}


// ============================================================================
// START: BOOTSTRAP AND RESTART SYSTEM
// ============================================================================
// This block is critical for Anki's operation, as it ensures that
// the card script restarts correctly when a new card is loaded
// or navigated between them, even if the DOM does not fully reload.
(function() {
    // 1. Clears any mutation observer left by the previous card.
    // This prevents old script observers from remaining active,
    // ensuring a clean state for the new card.
    if (window.ankiTemplateObserver) {
        window.ankiTemplateObserver.disconnect();
    }

    // 2. Defines the mutation observer that will activate when Anki
    // loads the NEXT card in the same DOM context.
    const observer = new MutationObserver((mutations) => {
        // We are only interested in the class change on the 'body', which is the
        // most reliable signal from Anki to indicate a new card load.
        for (const mutation of mutations) {
            if (mutation.attributeName === 'class') {
                // We disconnect the observer immediately to avoid infinite loops
                // or unwanted re-executions once the card change has been
                // detected and processed.
                observer.disconnect();

                // We look for the NEW card's script block by its ID.
                const newCardScript = document.getElementById('anki-card-script');
                if (newCardScript) {
                    // We use `eval()` to re-execute the content of the new card's script.
                    // This ensures a complete re-initialization from scratch of all JavaScript logic.
                    eval(newCardScript.textContent);
                }
                // We exit the loop once we have processed the relevant mutation.
                break;
            }
        }
    });

    // 3. We save the reference to the observer in the `window` object.
    // This allows the next card (when loaded) to find it
    // and disconnect it at the start of its own execution (step 1 of this block).
    window.ankiTemplateObserver = observer;
    
    // 4. We start observing the document's `body` to detect
    // any changes in its attributes, specifically the class.
    // This is the main mechanism for detecting card changes in Anki.
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // 5. We execute the main logic (`runAnkiTemplate`) for the CURRENT card.
    // This is what initializes the card when it is first loaded
    // or when navigating to it directly.
    runAnkiTemplate();
})();
// ============================================================================
// END: BOOTSTRAP AND RESTART SYSTEM
// ============================================================================
