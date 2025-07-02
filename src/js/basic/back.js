
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



// The entire script is wrapped in an immediately invoked function expression (IIFE)
// to encapsulate the scope and prevent global variable collisions.
(function() {

    /*
    ----------------------------------------------------------------------------
     2.1. INITIAL SETUP AND CARD STATE
    ----------------------------------------------------------------------------
     Handles unique initialization and preloading of resources for the card.
    */

    let timerBackEndListener = null; // Listener for the back timer completion event.
    let timerBarBackElement = null;  // DOM element of the back timer bar.

    // Prevents double initialization if the script has already been executed in this DOM.
    if (document.querySelector('.main-quiz-container').hasAttribute('data-initialized-back')) {
        return;
    }
    document.querySelector('.main-quiz-container').setAttribute('data-initialized-back', 'true');

    // Loads and configures feedback sounds for evaluation.
    const soundCorrect = new Audio('Correct_Sound.wav');
    soundCorrect.preload = "auto"; // Preloads audio for instant playback.
    soundCorrect.volume = 0.1;     // Sets a low default volume.
    soundCorrect.onerror = () => console.error("Error loading Correct_Sound.wav");

    const soundIncorrect = new Audio('Incorrect_Sound.wav');
    soundIncorrect.preload = "auto";
    soundIncorrect.volume = 0.1;
    soundIncorrect.onerror = () => console.error("Error loading Incorrect_Sound.wav");

    try {
        /*
        ----------------------------------------------------------------------------
         2.2. CORE UTILITIES
        ----------------------------------------------------------------------------
         General purpose functions that assist quiz operation,
         such as sound playback and array comparison.
        */

        // Plays an audio element, restarting it if already in progress.
        function playSound(audioElement) {
            audioElement.currentTime = 0; // Restarts playback from the beginning.
            audioElement.play().catch(e => {
                // Catches playback errors (e.g., autoplay blocked).
                console.error("Error playing sound. Was there interaction on the front?", e);
            });
        }
        
        // Plays the result sound (correct/incorrect) if applicable.
        function playResultSound(evalResult, questionData) {
            // Does not play sound for 'basic' card types.
            if (questionData.type === 'basic') return;
            if (evalResult.isCorrect) {
                playSound(soundCorrect);
            } else {
                playSound(soundIncorrect);
            }
        }

        // Unified function to perform Anki actions (card rating).
        // Adapts to different Anki environments (pycmd, AnkiDroidJS, AnkiBridge).
        function _ankiAction(ease) {
            if (typeof pycmd !== "undefined") {
                pycmd("ease" + ease);
                return;
            }
            try {
                if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.ankiBridge) {
                    window.webkit.messageHandlers.ankiBridge.postMessage("ease" + ease);
                    return;
                }
            } catch(e) {}
            try {
                if (typeof AnkiDroidJS !== "undefined") {
                    if (ease === 1) buttonAnswerEase1();
                    else if (ease === 2) buttonAnswerEase2();
                    else if (ease === 3) buttonAnswerEase3();
                    else if (ease === 4) buttonAnswerEase4();
                    return;
                }
            } catch(e) {}
        }
        
        // Compares two arrays to check if they are equal, regardless of order.
        const arraysEqualUnordered=(a,b)=>{if(!a||!b||a.length!==b.length)return!1;const sA=[...a].sort(),sB=[...b].sort();return sA.every((v,i)=>v===sB[i])};
        // Compares two arrays to check if they are equal, preserving order.
        const arraysEqualOrdered=(a,b)=>{if(!a||!b||a.length!==b.length)return!1;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return!1;return!0};
        
        /*
        ----------------------------------------------------------------------------
         2.3. ADVANCED MEDIA PLAYER MODULE
        ----------------------------------------------------------------------------
         Contains functions to generate and control custom audio and video players,
         with functionalities like speed control, loop, and volume.
         This module is duplicated from the Front Template to ensure independence
         and completeness of the logic on the back, although much of its functionality
         would have already been initialized on the front.
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
                    <button class="control-btn loop-btn" title="Activate/deactivate A-B loop" disabled><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"></path></svg></button>
                </div>
                <div class="volume-container">
                    <button class="volume-btn">
                        <svg class="volume-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"></path></svg>
                        <svg class="mute-icon" style="display:none;" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1z"/></svg>
                    </button>
                    <div class="volume-slider-container">
                        <div class="volume-slider-fill"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

        // Generates the HTML structure for a custom video player.
        function getCustomVideoPlayerHTML(src) { 
            return `<div class="custom-video-player"><video class="custom-video-element" src="${src}"></video><div class="video-overlay"></div><div class="video-controls-container"><div class="progress-controls"><div class="progress-bar-container"><div class="progress-bar-buffered"></div><div class="loop-range-indicator"></div><div class="mark-indicator mark-a-indicator"></div><div class="mark-indicator mark-b-indicator"></div><div class="progress-bar-fill"></div></div><div class="time-display"><span class="current-time">0:00</span> / <span class="duration">0:00</span></div></div><div class="bottom-controls"><div class="control-group left-controls"><button class="control-btn play-pause-btn-small" title="Play/Pause"><svg class="play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 8.64v6.72c0 .46.54.66.91.43l5.34-3.36c.3-.19.3-.68 0-.86L9.41 8.21c-.37-.23-.91-.03-.91.43z"></path></svg><svg class="pause-icon" style="display:none;" viewBox="0 0 24 24" fill="currentColor"><path d="M7 19c0 .55.45 1 1 1h2c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1H8c-.55 0-1 .45-1 1v14zm7-14v14c0 .55.45 1 1 1h2c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1z"></path></svg></button></div><div class="control-group middle-controls"></div><div class="control-group right-controls"><button class="control-btn fullscreen-btn" title="Fullscreen"><svg class="fullscreen-open-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path></svg><svg class="fullscreen-close-icon" style="display:none;" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"></path></svg></button><button class="control-btn more-options-btn" title="More options"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg></button><div class="more-options-menu"></div></div></div><div style="display: none;"><div class="volume-container"><button class="control-btn volume-btn" title="Mute/Unmute"><svg class="volume-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"></path></svg><svg class="mute-icon" style="display:none;" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zM7 9v6h4l5 5V4L11 9H7zm7 5.68V9.32l2.58 2.58c.08-.2.12-.41.12-.68z"></path></svg></button><div class="volume-slider-container"><div class="volume-slider-fill"></div></div></div><div class="control-group loop-controls-group"><button class="control-btn mark-btn mark-a-btn" title="Mark start point (A)">A</button><button class="control-btn mark-btn mark-b-btn" title="Mark end point (B)">B</button><button class="control-btn loop-btn" title="Toggle A-B loop" disabled><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"></path></svg></button></div><div class="control-group speed-controls-group"><button class="control-btn speed-down-btn" title="Decrease speed"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"></path></svg></button><span class="speed-display">1.0x</span><button class="control-btn speed-up-btn" title="Increase speed"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"></path></svg></button></div></div></div></div>`;
        }

        /*
         2.3.2. Media Rendering and Update Engine
        */

        // Converts custom Anki syntax (e.g., "![[media.mp3]]")
        // into custom player HTML or image tags.
        function parseAndRenderMedia(text) { 
            if (!text || typeof text !== 'string') return text; 
            const mediaRegex = /!\[\[([^\]]+)\]\]/g; 
            return text.replace(mediaRegex, (match, filename) => { 
                const sanitizedFilename = encodeURI(filename.trim()); 
                const extension = (filename.split('.').pop() || '').toLowerCase(); 
                let mediaHtml = ''; 
                switch (extension) { 
                    case 'mp3': case 'wav': case 'ogg': mediaHtml = getCustomAudioPlayerHTML(sanitizedFilename); break; 
                    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': case 'svg': mediaHtml = `<img class="embedded-media" src="${sanitizedFilename}" alt="Image: ${filename}">`; break; 
                    case 'mp4': case 'webm': mediaHtml = getCustomVideoPlayerHTML(sanitizedFilename); break; 
                    default: return match;
                } 
                return `<div class="media-wrapper">${mediaHtml}</div>`; 
            });
        }

        // Initializes *all* custom players (audio and video) found in the DOM.
        function initializeAllCustomMediaPlayers() { 
            document.querySelectorAll('.custom-audio-player:not(.initialized)').forEach(p => initializeCustomAudioPlayer(p)); 
            document.querySelectorAll('.custom-video-player:not(.initialized)').forEach(p => initializeCustomVideoPlayer(p)); 
        }

        /*
         2.3.3. Player Initialization Logic
        */

        // Logic to initialize a custom audio player.
        // NOTE: This function contains a section marked as "CORRECTED"
        // in the original source code, which remains intact.
        function initializeCustomAudioPlayer(p) { 
            if(p.classList.contains('initialized'))return;
            // Destructuring variables for DOM elements, keeping original names to preserve code.
            const a=p.querySelector('.custom-audio-element'),b=p.querySelector('.play-pause-btn'),c=p.querySelector('.progress-bar-container'),d=p.querySelector('.progress-bar-fill'),e=p.querySelector('.current-time'),f=p.querySelector('.duration'),g=p.querySelector('.speed-down-btn'),h=p.querySelector('.speed-up-btn'),i=p.querySelector('.speed-display'),j=p.querySelector('.mark-a-btn'),k=p.querySelector('.mark-b-btn'),l=p.querySelector('.loop-btn'),m=p.querySelector('.volume-btn'),n=p.querySelector('.volume-slider-container'),o=p.querySelector('.volume-slider-fill'),q=p.querySelector('.loop-range-indicator'),r=p.querySelector('.mark-a-indicator'),s=p.querySelector('.mark-b-indicator');
            let t=null,u=null,v=!1; // Variables for marks A, B and loop state.
            const playbackSpeeds=[0.25,.5,.75,1,1.25,1.5,1.75,2];let currentSpeedIndex=3; // Playback speeds.
            let isDraggingProgressBar = false, wasPlayingOnDragStart = false, isDraggingVolume = false; // Drag flags.

            // Helper function to format seconds to MM:SS.
            const formatTime=z=>{if(isNaN(z))return"0:00";const A=Math.floor(z/60),B=Math.floor(z%60);return`${A}:${B<10?"0":""}${B}`};
            a.addEventListener('loadedmetadata',()=>{f.textContent=formatTime(a.duration);updateMarksUI();});
            a.addEventListener('timeupdate',()=>{e.textContent=formatTime(a.currentTime);d.style.width=`${a.currentTime/a.duration*100}%`;if(v&&u!==null&&t!==null){const B=Math.max(t,u);if(a.currentTime>=B)a.currentTime=Math.min(t,u)}});
            a.addEventListener('play',()=>p.classList.add('playing'));a.addEventListener('pause',()=>p.classList.remove('playing'));a.addEventListener('ended',()=>p.classList.remove('playing'));
            b.addEventListener('click',()=>a.paused?a.play():a.pause());

            // Progress bar dragging logic.
            function updateProgressBarTime(event) { const rect = c.getBoundingClientRect(); let clickX = event.clientX - rect.left; clickX = Math.max(0, Math.min(clickX, rect.width)); const newTime = (clickX / rect.width) * a.duration; a.currentTime = newTime; d.style.width = `${(newTime / a.duration) * 100}%`; e.textContent = formatTime(newTime); }
            const handleProgressBarDrag = (event) => { if (isDraggingProgressBar) { updateProgressBarTime(event); } };
            const handleProgressBarEnd = () => { if (isDraggingProgressBar) { isDraggingProgressBar = false; document.removeEventListener('mousemove', handleProgressBarDrag); document.removeEventListener('mouseup', handleProgressBarEnd); if (wasPlayingOnDragStart) { a.play(); } } };
            c.addEventListener('mousedown', (event) => { isDraggingProgressBar = true; wasPlayingOnDragStart = !a.paused; if (wasPlayingOnDragStart) { a.pause(); } updateProgressBarTime(event); document.addEventListener('mousemove', handleProgressBarDrag); document.addEventListener('mouseup', handleProgressBarEnd); });

            // Speed controls.
            h.addEventListener('click',()=>{if(currentSpeedIndex<playbackSpeeds.length-1){currentSpeedIndex++;a.playbackRate=playbackSpeeds[currentSpeedIndex];i.textContent=`${playbackSpeeds[currentSpeedIndex].toFixed(2)}x`}});
            g.addEventListener('click',()=>{if(currentSpeedIndex>0){currentSpeedIndex--;a.playbackRate=playbackSpeeds[currentSpeedIndex];i.textContent=`${playbackSpeeds[currentSpeedIndex].toFixed(2)}x`}});
            
            // --- START OF LOGIC FIX (Original source code) ---
            // A and B mark controls for loop.
            j.addEventListener('click',()=>{t=a.currentTime;j.classList.add('active');if(u!==null&&t>=u)u=null;updateMarksUI();});
            k.addEventListener('click',()=>{u=a.currentTime;k.classList.add('active');if(t!==null&&u<=t)t=null;updateMarksUI();});
            l.addEventListener('click',()=>{if(t===null||u===null)return;v=!v;l.classList.toggle('active',v);if(!v){t=u=null;j.classList.remove('active');k.classList.remove('active');updateMarksUI()}});
            
            // Function to update the UI of marks and the loop range.
            function updateMarksUI() {
                const duration = a.duration; if (isNaN(duration) || duration <= 0) return;
                
                if (t !== null) { r.style.left = `${(t / duration) * 100}%`; r.style.display = "block"; } else { r.style.display = "none"; j.classList.remove('active'); }
                if (u !== null) { s.style.left = `${(u / duration) * 100}%`; s.style.display = "block"; } else { s.style.display = "none"; k.classList.remove('active'); }

                if (t !== null && u !== null) {
                    const A = Math.min(t, u), B = Math.max(t, u);
                    const C = (A / duration) * 100, D = ((B - A) / duration) * 100;
                    q.style.left = `${C}%`; q.style.width = `${D}%`; q.style.display = "block";
                    l.disabled = false;
                } else {
                    q.style.display = "none";
                    l.disabled = true;
                    if (v) { v = false; l.classList.remove('active'); }
                }
            }
            // --- END OF LOGIC FIX (Original source code) ---

            // Volume dragging and control logic.
            function handleVolumeUpdate(event) { const rect = n.getBoundingClientRect(); let clickX = event.clientX - rect.left; clickX = Math.max(0, Math.min(clickX, rect.width)); const newVolume = clickX / rect.width; a.muted = false; a.volume = newVolume; }
            const handleVolumeDrag = (event) => { if(isDraggingVolume) handleVolumeUpdate(event); };
            const handleVolumeEnd = () => { if(isDraggingVolume) { isDraggingVolume = false; document.removeEventListener('mousemove', handleVolumeDrag); document.removeEventListener('mouseup', handleVolumeEnd); } };
            n.addEventListener('mousedown', (event) => { isDraggingVolume = true; handleVolumeUpdate(event); document.addEventListener('mousemove', handleVolumeDrag); document.addEventListener('mouseup', handleVolumeEnd); });

            m.addEventListener('click',()=>a.muted=!a.muted); // Toggle mute.
            // Updates volume interface when audio volume changes.
            a.addEventListener('volumechange',()=>{o.style.width=a.muted?"0%":`${a.volume*100}%`;p.querySelector('.volume-icon').style.display=a.muted||a.volume===0?'none':'block';p.querySelector('.mute-icon').style.display=a.muted||a.volume===0?'block':'none'});
            p.classList.add('initialized'); // Marks player as initialized.
        }

        // Logic to initialize a custom video player.
        // NOTE: This function maintains the structure and line length
        // of the original source code to ensure immutability.
        function initializeCustomVideoPlayer(playerContainer) {
            const video = playerContainer.querySelector('.custom-video-element');
            const overlay = playerContainer.querySelector('.video-overlay');
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
            
            let controlsTimeout;
            const playbackSpeeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
            let currentSpeedIndex = 3; 
            let markA = null;
            let markB = null;
            let isLooping = false;

            let isDraggingProgressBar = false;
            let wasPlayingOnDragStart = false;
            let isDraggingVolume = false;

            if (!video || !overlay || !playPauseBtnSmall || !progressBarFill || !progressBarContainer || !fullscreenBtn) {
                console.warn("WARNING: Critical elements missing for video player. Will not fully initialize.");
                playerContainer.classList.add('initialized');
                return; 
            }

            const showControls = () => { playerContainer.classList.add('controls-visible'); clearTimeout(controlsTimeout); };
            const hideControls = () => { if (video.paused || (moreOptionsMenu && moreOptionsMenu.classList.contains('active'))) return; playerContainer.classList.remove('controls-visible'); };
            const startHideTimer = () => { if (video.paused) return; clearTimeout(controlsTimeout); controlsTimeout = setTimeout(hideControls, 2500); };

            playerContainer.addEventListener('mousemove', () => { showControls(); startHideTimer(); });
            playerContainer.addEventListener('mouseleave', hideControls);

            function formatTime(seconds) {
                const minutes = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
            }

            function updateIcons() {
                const isPaused = video.paused;
                playPauseBtnSmall.querySelector('.play-icon').style.display = isPaused ? 'block' : 'none';
                playPauseBtnSmall.querySelector('.pause-icon').style.display = isPaused ? 'none' : 'block';
                if (volumeContainer) { const isMuted = video.muted || video.volume === 0; volumeContainer.querySelector('.volume-icon').style.display = isMuted ? 'none' : 'block'; volumeContainer.querySelector('.mute-icon').style.display = isMuted ? 'block' : 'none'; }
                const isFullscreen = !!document.fullscreenElement;
                fullscreenBtn.querySelector('.fullscreen-open-icon').style.display = isFullscreen ? 'none' : 'block';
                fullscreenBtn.querySelector('.fullscreen-close-icon').style.display = isFullscreen ? 'block' : 'none';
            }

            function togglePlay() { video.paused ? video.play() : video.pause(); }

            video.addEventListener('play', () => { playerContainer.classList.add('playing'); video.playbackRate = playbackSpeeds[currentSpeedIndex]; startHideTimer(); updateIcons(); });
            video.addEventListener('pause', () => { playerContainer.classList.remove('playing'); showControls(); updateIcons(); });
            video.addEventListener('loadedmetadata', () => { if (durationEl) durationEl.textContent = formatTime(video.duration); updateMarksUI(); });
            video.addEventListener('timeupdate', () => { if (progressBarFill) progressBarFill.style.width = `${(video.currentTime / video.duration) * 100}%`; if (currentTimeEl) currentTimeEl.textContent = formatTime(video.currentTime); if (isLooping && markA !== null && markB !== null && video.currentTime >= markB) { video.currentTime = markA; } });
            video.addEventListener('ended', () => { if (isLooping && markA !== null) { video.currentTime = markA; video.play(); } else { playerContainer.classList.remove('playing'); video.currentTime = 0; } });
            video.addEventListener('progress', () => { if (video.buffered.length > 0 && progressBarBuffered) { const bufferedEnd = video.buffered.end(video.buffered.length - 1); progressBarBuffered.style.width = `${(bufferedEnd / video.duration) * 100}%`; } });

            overlay.addEventListener('click', togglePlay);
            video.addEventListener('click', togglePlay);
            playPauseBtnSmall.addEventListener('click', togglePlay);
            
            function updateProgressBarTime(e) { const rect = progressBarContainer.getBoundingClientRect(); let clickX = e.clientX - rect.left; clickX = Math.max(0, Math.min(clickX, rect.width)); const newTime = (clickX / rect.width) * video.duration; video.currentTime = newTime; if (progressBarFill) progressBarFill.style.width = `${(newTime / video.duration) * 100}%`; if (currentTimeEl) currentTimeEl.textContent = formatTime(newTime); }
            const handleProgressBarDrag = (e) => { if (isDraggingProgressBar) { updateProgressBarTime(e); } };
            const handleProgressBarEnd = () => { if (isDraggingProgressBar) { isDraggingProgressBar = false; document.removeEventListener('mousemove', handleProgressBarDrag); document.removeEventListener('mouseup', handleProgressBarEnd); if (wasPlayingOnDragStart) { video.play(); } } };
            progressBarContainer.addEventListener('mousedown', (e) => { isDraggingProgressBar = true; wasPlayingOnDragStart = !video.paused; if (wasPlayingOnDragStart) { video.pause(); } updateProgressBarTime(e); document.addEventListener('mousemove', handleProgressBarDrag); document.addEventListener('mouseup', handleProgressBarEnd); });

            if (speedUpBtn && speedDownBtn && speedDisplay) { function updateSpeed() { const newSpeed = playbackSpeeds[currentSpeedIndex]; video.playbackRate = newSpeed; speedDisplay.textContent = `${newSpeed.toFixed(2).replace(/\.00$/, '').replace(/\.([1-9])0$/, '.$1')}x`; speedDownBtn.disabled = currentSpeedIndex === 0; speedUpBtn.disabled = currentSpeedIndex === playbackSpeeds.length - 1; } speedUpBtn.addEventListener('click', () => { currentSpeedIndex = Math.min(currentSpeedIndex + 1, playbackSpeeds.length - 1); updateSpeed(); }); speedDownBtn.addEventListener('click', () => { currentSpeedIndex = Math.max(currentSpeedIndex - 1, 0); updateSpeed(); }); updateSpeed(); }

            if (markABtn && markBBtn && loopBtn) { function updateMarksUI() { const duration = video.duration; if (isNaN(duration)) return; if (markAIndicator) markAIndicator.style.display = markA !== null ? 'block' : 'none'; if (markA !== null && markAIndicator) markAIndicator.style.left = `${(markA / duration) * 100}%`; if (markBIndicator) markBIndicator.style.display = markB !== null ? 'block' : 'none'; if (markB !== null && markBIndicator) markBIndicator.style.left = `${(markB / duration) * 100}%`; if (markA !== null && markB !== null && loopRangeIndicator) { loopRangeIndicator.style.left = `${(markA / duration) * 100}%`; loopRangeIndicator.style.width = `${((markB - markA) / duration) * 100}%`; loopRangeIndicator.style.display = 'block'; loopBtn.disabled = false; } else if (loopRangeIndicator) { loopRangeIndicator.style.display = 'none'; loopBtn.disabled = true; if (isLooping) { isLooping = false; loopBtn.classList.remove('active'); } } } markABtn.addEventListener('click', () => { markA = video.currentTime; if (markB !== null && markA >= markB) markB = null; updateMarksUI(); }); markBBtn.addEventListener('click', () => { markB = video.currentTime; if (markA !== null && markB <= markA) markA = null; updateMarksUI(); }); loopBtn.addEventListener('click', () => { isLooping = !isLooping; loopBtn.classList.toggle('active', isLooping); }); updateMarksUI(); }
            
            if (volumeBtn && volumeSliderContainer && volumeSliderFill) { function updateVolumeUI() { volumeSliderFill.style.width = `${video.muted ? 0 : video.volume * 100}%`; updateIcons(); } volumeBtn.addEventListener('click', () => { video.muted = !video.muted; updateVolumeUI(); }); const handleVolumeUpdate = (e) => { const rect = volumeSliderContainer.getBoundingClientRect(); let clickX = e.clientX - rect.left; clickX = Math.max(0, Math.min(clickX, rect.width)); const newVolume = clickX / rect.width; video.muted = false; video.volume = newVolume; updateVolumeUI(); }; const handleVolumeDrag = (e) => { if (isDraggingVolume) { handleVolumeUpdate(e); } }; const handleVolumeEnd = () => { if (isDraggingVolume) { isDraggingVolume = false; document.removeEventListener('mousemove', handleVolumeDrag); document.removeEventListener('mouseup', handleVolumeEnd); } }; volumeSliderContainer.addEventListener('mousedown', (e) => { isDraggingVolume = true; handleVolumeUpdate(e); document.addEventListener('mousemove', handleVolumeDrag); document.addEventListener('mouseup', handleVolumeEnd); }); video.addEventListener('volumechange', updateVolumeUI); updateVolumeUI(); }
            
            if (fullscreenBtn) { function toggleFullscreen() { if (!document.fullscreenElement) { playerContainer.requestFullscreen().catch(err => console.error(err)); } else { document.exitFullscreen(); } } fullscreenBtn.addEventListener('click', toggleFullscreen); video.addEventListener('dblclick', toggleFullscreen); document.addEventListener('fullscreenchange', updateIcons); }
            
            if (leftControls && middleControls && rightControls && moreOptionsBtn && moreOptionsMenu) {
                const handleResponsiveLayout = (width) => {
                    if (speedControlsGroup) { if (width < 650 && !moreOptionsMenu.contains(speedControlsGroup)) { moreOptionsMenu.prepend(speedControlsGroup); } else if (width >= 650 && moreOptionsMenu.contains(speedControlsGroup)) { rightControls.prepend(speedControlsGroup); } }
                    if (loopControlsGroup) { if (width < 520 && !moreOptionsMenu.contains(loopControlsGroup)) { moreOptionsMenu.prepend(loopControlsGroup); } else if (width >= 520 && moreOptionsMenu.contains(loopControlsGroup)) { middleControls.appendChild(loopControlsGroup); } }
                    if (volumeContainer) { if (width < 420 && !moreOptionsMenu.contains(volumeContainer)) { moreOptionsMenu.prepend(volumeContainer); } else if (width >= 420 && moreOptionsMenu.contains(volumeContainer)) { leftControls.appendChild(volumeContainer); } }
                    if (moreOptionsMenu.children.length > 0) { moreOptionsBtn.style.display = 'flex'; } else { moreOptionsBtn.style.display = 'none'; moreOptionsMenu.classList.remove('active'); }
                };
                const resizeObserver = new ResizeObserver(entries => { for (let entry of entries) { handleResponsiveLayout(entry.contentRect.width); } });
                resizeObserver.observe(playerContainer);

                moreOptionsBtn.addEventListener('click', (e) => { e.stopPropagation(); const playerRect = playerContainer.getBoundingClientRect(); const btnRect = moreOptionsBtn.getBoundingClientRect(); const availableSpace = btnRect.top - playerRect.top; moreOptionsMenu.style.maxHeight = `${availableSpace - 20}px`; moreOptionsMenu.classList.toggle('active'); if (moreOptionsMenu.classList.contains('active')) { showControls(); } });
                document.addEventListener('click', (e) => { if (!moreOptionsMenu.contains(e.target) && e.target !== moreOptionsBtn && !moreOptionsBtn.contains(e.target)) { moreOptionsMenu.classList.remove('active'); } });
                
                if (volumeContainer) leftControls.appendChild(volumeContainer);
                if (loopControlsGroup) middleControls.appendChild(loopControlsGroup);
                if (speedControlsGroup) rightControls.prepend(speedControlsGroup);
                handleResponsiveLayout(playerContainer.clientWidth);
            }
            updateIcons();
            playerContainer.classList.add('initialized');
        }

        // Applies CSS classes to standard images to make them look like custom media.
        function styleAnkiImages(containerSelector) { 
            const container = document.querySelector(containerSelector); 
            if (!container) return; 
            container.querySelectorAll('img:not(.embedded-media)').forEach(img => { 
                if (img.closest('.custom-audio-player, .custom-video-player, .replay-button, .play-action')) return; 
                const wrapper = document.createElement('div'); 
                wrapper.className = 'media-wrapper'; 
                if(img.parentNode) {
                    img.parentNode.insertBefore(wrapper, img); 
                    wrapper.appendChild(img); 
                    img.classList.add('embedded-media'); 
                }
            }); 
        }

        // Converts standard HTML5 <audio> and <video> tags into custom players.
        function upgradeStandardMedia(containerSelector) {
            const container = document.querySelector(containerSelector);
            if (!container) return;
            container.querySelectorAll('audio:not(.custom-audio-element)').forEach(audio => {
                const src = audio.getAttribute('src');
                if (!src) return;
                const tempWrapper = document.createElement('div');
                tempWrapper.innerHTML = getCustomAudioPlayerHTML(src);
                const newPlayer = tempWrapper.firstElementChild;
                if(audio.parentNode) { audio.parentNode.replaceChild(newPlayer, audio); }
            });
            container.querySelectorAll('video:not(.custom-video-element)').forEach(video => {
                const src = video.getAttribute('src');
                if (!src) return;
                const tempWrapper = document.createElement('div');
                tempWrapper.innerHTML = getCustomVideoPlayerHTML(src);
                const newPlayer = tempWrapper.firstElementChild;
                if(video.parentNode) { video.parentNode.replaceChild(newPlayer, video); }
            });
        }
        
        /*
        ----------------------------------------------------------------------------
         2.4. QUIZ LOGIC MODULE
        ----------------------------------------------------------------------------
         Contains functions to process question data (from Anki fields),
         evaluate user answer and build the feedback interface on the back.
        */

        // Parses Anki card fields (Question, Options, Tags, etc.)
        // to structure quiz data for JavaScript use.
        function parseFields() {
            const get = id => document.getElementById(id)?.innerHTML || '';
            const knownQuizTypes = {'sc': 'single-choice', 'mc': 'multiple-choice', 'tf': 'true-falso', 'ae': 'exact-answer', 'r': 'matching', 'o': 'ordering', 'f': 'sentence-formation', 'b': 'basic' };
            const rawTagsString = get('anki-field-tags') || '';
            const allTags = rawTagsString.split(/\s+/).map(t => t.trim()).filter(Boolean);
            let detectedQuizType = null, thematicTags = [];
            for (const tag of allTags) {
                const normalizedTag = tag.toLowerCase(); 
                if (knownQuizTypes[normalizedTag] && !detectedQuizType) {
                    detectedQuizType = knownQuizTypes[normalizedTag];
                } else {
                    thematicTags.push(tag.replace(/_/g, ' '));
                }
            }
            if (!detectedQuizType) detectedQuizType = 'basic'; 
            const q = { type: detectedQuizType, text: get('anki-field-pregunta'), tags: thematicTags, pistas: [] };
            const rawPistas = (get('anki-field-pistas') || "").split('|');
            q.pistas = rawPistas.map(pistaString => {
                const trimmedPista = pistaString.trim(); if (!trimmedPista) return null;
                const parts = trimmedPista.split(/<br\s*\/?>/i);
                const title = parts[0].trim();
                const content = parts.length > 1 ? parts.slice(1).join('<br>').trim() : null;
                return { title: title, content: content };
            }).filter(Boolean);
            const parseOpt = s => {
                const trimmedS = s.trim(); if (!trimmedS) return null;
                const m = trimmedS.match(/^([a-zA-Z0-9_.-]+)[\.\)]\s*(.+)/s);
                return m && m[2] ? {id:m[1].trim(),text:m[2].trim(),value:m[1].trim()} : {id:trimmedS,text:trimmedS,value:trimmedS};
            };
            const cleanId = id => id.trim().replace(/[\.\)]$/, '');
            const opts = get('anki-field-opciones'), ans = get('anki-field-respuesta_correcta'), expl = get('anki-field-explicacion');
            if (expl) {
                let contentToParse = expl; const explanationParts = contentToParse.split('|'); let allPartsHadValidIds = true;
                const tempIndividualExplanations = new Map();
                if (explanationParts.length > 1 || (explanationParts.length === 1 && /^[a-zA-Z0-9_.-]+[\.\)]/.test(explanationParts[0].trim()))) {
                    for (const part of explanationParts) {
                        const trimmedPart = part.trim(); const explanationMatch = trimmedPart.match(/^([a-zA-Z0-9_.-]+)[\.\)]\s*(.+)/s);
                        if (explanationMatch && explanationMatch[2] && explanationMatch[2].trim() !== "") {
                            tempIndividualExplanations.set(explanationMatch[1].trim(), explanationMatch[2].trim().replace(/\\n/g, '<br>'));
                        } else { allPartsHadValidIds = false; break; }
                    }
                } else { allPartsHadValidIds = false; }
                if (allPartsHadValidIds && tempIndividualExplanations.size > 0) q.individualExplanations = tempIndividualExplanations;
                else q.generalExplanation = expl.replace(/\\n/g, '<br>');
            } else { q.generalExplanation = null; }
            switch (q.type) {
                case 'single-choice': q.options = opts.split('|').map(parseOpt).filter(Boolean); q.correctAnswer = cleanId(ans); break;
                case 'true-falso': q.options = [{id:"true",text:"True",value:"true"},{id:"false",text:"False",value:"false"}]; q.correctAnswer = ans.toLowerCase().trim()==='true'?'true':'false'; break;
                case 'multiple-choice': q.options = opts.split('|').map(parseOpt).filter(Boolean); q.correctAnswers = ans.split(',').map(cleanId).filter(Boolean); break;
                case 'exact-answer': q.answer = ans; break;
                case 'matching':
                    const allParts = opts.split('|').map(parseOpt).filter(Boolean); q.leftOptions=[]; q.rightOptions=[];
                    allParts.forEach(o => { if (/^\d+$/.test(o.id)) q.rightOptions.push(o); else if (/^[a-zA-Z]/.test(o.id)) q.leftOptions.push(o); });
                    q.correctAnswersMap={}; ans.split(/[;,]/).forEach(pair=>{const a=pair.trim().split('-');if(a.length===2)q.correctAnswersMap[cleanId(a[0])]=a[1].trim();}); break;
                case 'ordering': q.allOptions = opts.split('|').map(parseOpt).filter(Boolean); q.correctOrder = ans.split(',').map(cleanId).filter(Boolean); break;
                case 'sentence-formation': case 'frase': q.wordBankOptions = opts.split('|').map(s=>s.trim()).filter(Boolean); q.correctSentenceWords = ans.split(/\s+/).map(s=>s.trim()).filter(Boolean); break;
                case 'basic': q.answer = ans; break;
                default: return null;
            }
            return q;
        }

        // Evaluates the user's answer against the card's correct answer.
        // Also determines if the user explicitly marked "I don't know" or if the answer
        // is implicitly considered "I don't know" by being empty when one was expected.
        function evaluateAnswer(q, userAnswerData) {
            let isCorrect = null;
            const userAnswer = userAnswerData.answer;
            let answeredIdk = userAnswerData.idk; // Using 'let' to allow modification

            // --- START OF IMPROVEMENT (Original source code) ---
            // Only apply this logic if the card is NOT of type 'basic'.
            if (q.type !== 'basic') {
                // 1. Check if the user's answer is functionally empty.
                const userAnswerIsEmpty = (
                    userAnswer === null ||
                    (Array.isArray(userAnswer) && userAnswer.length === 0) ||
                    (typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer) && Object.keys(userAnswer).length === 0) ||
                    (Array.isArray(userAnswer) && userAnswer.length === 1 && (userAnswer[0] === "" || userAnswer[0] === undefined))
                );

                // 2. Check if an answer was expected (to avoid "trick questions").
                let correctAnswerIsExpected = false;
                switch(q.type) {
                    case 'single-choice':
                    case 'true-falso':
                        correctAnswerIsExpected = !!q.correctAnswer;
                        break;
                    case 'multiple-choice':
                        correctAnswerIsExpected = q.correctAnswers && q.correctAnswers.length > 0;
                        break;
                    case 'exact-answer':
                        correctAnswerIsExpected = q.answer && q.answer.trim() !== '';
                        break;
                    case 'matching':
                        correctAnswerIsExpected = q.correctAnswersMap && Object.keys(q.correctAnswersMap).length > 0;
                        break;
                    case 'ordering':
                        correctAnswerIsExpected = q.correctOrder && q.correctOrder.length > 0;
                        break;
                    case 'sentence-formation':
                    case 'frase':
                        correctAnswerIsExpected = q.correctSentenceWords && q.correctSentenceWords.length > 0;
                        break;
                }

                // 3. KEY LOGIC: If the user did not answer, but an answer was expected,
                //    and they hadn't explicitly pressed "I don't know", we force it to "Didn't Know".
                if (!answeredIdk && userAnswerIsEmpty && correctAnswerIsExpected) {
                    answeredIdk = true;
                }
            }
            // --- END OF IMPROVEMENT (Original source code) ---

            // The rest of the original evaluation logic continues to work, but now
            // with the potentially updated 'answeredIdk' value.
            if (q.type === 'basic') { 
                isCorrect = null; 
            } else if (answeredIdk) { 
                isCorrect = false; 
            } else { 
                switch(q.type) { 
                    case 'single-choice': case 'true-falso': isCorrect = userAnswer && userAnswer[0] === q.correctAnswer; break; 
                    case 'multiple-choice': isCorrect = arraysEqualUnordered(userAnswer, q.correctAnswers); break; 
                    case 'exact-answer':
                        const userAnswerText = (userAnswer && userAnswer[0]) ? userAnswer[0] : "";
                        isCorrect = userAnswerText.trim().toLowerCase() === q.answer.trim().toLowerCase();
                        break; 
                    case 'matching': 
                        if (!userAnswer) { isCorrect = false; break; } 
                        let correctMatches = 0; 
                        const totalPairs = q.leftOptions.length; 
                        if (Object.keys(userAnswer).length === totalPairs) { 
                            q.leftOptions.forEach(l => { if (userAnswer[l.id] === q.correctAnswersMap[l.id]) correctMatches++; }); 
                            isCorrect = correctMatches === totalPairs; 
                        } else { 
                            isCorrect = false; 
                        } 
                        break; 
                    case 'ordering': isCorrect = arraysEqualOrdered(userAnswer, q.correctOrder); break; 
                    case 'sentence-formation': case 'frase': isCorrect = arraysEqualOrdered(userAnswer, q.correctSentenceWords); break; 
                } 
            } 
            return { isCorrect, answeredIdk }; 
        }

        // Calculates differences between two strings, useful for showing feedback
        // in exact text answers.
        function getDiffParts(str1, str2) {
            const dp = Array(str1.length + 1).fill(null).map(() => Array(str2.length + 1).fill(0));
            for (let i = 1; i <= str1.length; i++) {
                for (let j = 1; j <= str2.length; j++) {
                    if (str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase()) {
                        dp[i][j] = dp[i - 1][j - 1] + 1;
                    } else {
                        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                    }
                }
            }
            let i = str1.length, j = str2.length;
            const result = [];
            while (i > 0 || j > 0) {
                if (i > 0 && j > 0 && str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase()) {
                    result.unshift({ type: 'common', value: str1[i - 1] });
                    i--; j--;
                } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                    result.unshift({ type: 'removed', value: str2[j - 1] });
                    j--;
                } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
                    result.unshift({ type: 'added', value: str1[i - 1] });
                    i--;
                } else {
                    break;
                }
            }
            return result;
        }
        
        // Renders the HTML for the back of the card, displaying the correct answer,
        // the user's answer, and feedback.
        function renderResult(q, userAnswerData, evalResult) {
            const { isCorrect, answeredIdk } = evalResult;
            const userAnswer = userAnswerData.answer;
            
            const tagsHTML = `<div class="question-tags-container">${(q.tags && q.tags.length > 0 ? q.tags : []).map(tag => `<span class="tag-badge">${tag}</span>`).join('')}</div>`;
            
            // Starts the back card structure.
            let html = `
                <div id="q-card-back" class="question-card-item styled-card ${q.individualExplanations && q.individualExplanations.size > 0 ? 'has-individual-explanations' : ''}">
                    <div class="question-card-header">${tagsHTML}</div>
                    <p>${parseAndRenderMedia(q.text)}</p>
                    <div id="options-box-back" style="display: flex; flex-direction: column;">`;
            
            // Generates specific feedback interface for each quiz type.
            switch (q.type) {
                case 'basic':
                    // Displays only the correct answer for basic cards.
                    html += `<div class="feedback-details"><h4>Answer</h4><div class="diff-container">${parseAndRenderMedia(q.answer)}</div></div>`;
                    break;
                
                case 'single-choice': case 'true-falso': case 'multiple-choice':
                    let optionsToRender = q.options || [];
                    try {
                        // Attempts to retrieve shuffled options order from sessionStorage.
                        const storedOptionsJSON = sessionStorage.getItem('ankiQuizShuffledOptions');
                        if (storedOptionsJSON) {
                            const storedOptions = JSON.parse(storedOptionsJSON);
                            if (Array.isArray(storedOptions) && storedOptions.length > 0) {
                                optionsToRender = storedOptions;
                            }
                        }
                    } catch (e) {
                        console.error("Could not read stored option order.", e);
                    }
                    sessionStorage.removeItem('ankiQuizShuffledOptions'); // Clears sessionStorage.

                    optionsToRender.forEach(opt => {
                        const isCorrectOpt = q.type === 'multiple-choice' ? q.correctAnswers.includes(opt.value) : q.correctAnswer === opt.value;
                        const isSelectedByUser = !answeredIdk && userAnswer && userAnswer.includes(opt.value);
                        
                        let labelClasses = 'option-label evaluated';
                        if (isCorrectOpt) labelClasses += answeredIdk ? ' feedback-idk' : ' feedback-correct';
                        if (isSelectedByUser) { labelClasses += ' user-selected'; if (!isCorrectOpt) labelClasses += ' feedback-incorrect'; }
                        
                        let explClasses = 'inline-explanation';
                        if (isCorrectOpt) explClasses += answeredIdk ? ' feedback-idk' : ' feedback-correct';
                        if (isSelectedByUser && !isCorrectOpt) explClasses += ' feedback-incorrect';
                        
                        const explanationHTML = q.individualExplanations && q.individualExplanations.has(opt.id) ? `<div class="${explClasses}">${parseAndRenderMedia(q.individualExplanations.get(opt.id))}</div>` : '';
                        
                        html += `
                            <div class="option-container">
                                <label class="${labelClasses}">
                                    <input type="${q.type === 'multiple-choice' ? 'checkbox' : 'radio'}" name="q-option" value="${opt.value}" class="styled-input" disabled ${isSelectedByUser ? 'checked' : ''}>
                                    <span class="option-text">${parseAndRenderMedia(opt.text)}</span>
                                </label>
                                ${explanationHTML}
                            </div>`;
                    });
                    break;
                
                case 'exact-answer':
                    // Displays user's answer and correct answer, with difference analysis if incorrect.
                    if (!isCorrect && !answeredIdk) {
                        const userAnswerText = userAnswer && userAnswer[0] ? userAnswer[0] : '';
                        const correctAnswerText = q.answer;
                        const escapeHtml = (text) => text.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
                        const diffParts = getDiffParts(userAnswerText.trim(), correctAnswerText.trim());
                        
                        const hasAdditions = diffParts.some(part => part.type === 'added');
                        const hasRemovals = diffParts.some(part => part.type === 'removed');
                        let analysisHtmlBlock = '';
                        
                        if (hasAdditions || hasRemovals) {
                            analysisHtmlBlock = '<div class="feedback-subsection"><h4>ANALYSIS</h4>';
                            if (hasAdditions) {
                                const userAnalysisHtml = diffParts.map(part => part.type === 'removed' ? '' : `<span class="diff-${part.type}">${escapeHtml(part.value)}</span>`).join('');
                                analysisHtmlBlock += `<div class="diff-analysis-section"><div class="diff-container">${userAnalysisHtml}</div></div>`;
                            }
                            if (hasRemovals) {
                                const correctAnalysisHtml = diffParts.map(part => part.type === 'added' ? '' : `<span class="diff-${part.type}">${escapeHtml(part.value)}</span>`).join('');
                                analysisHtmlBlock += `<div class="diff-analysis-section"><div class="diff-container">${correctAnalysisHtml}</div></div>`;
                            }
                            analysisHtmlBlock += '</div>';
                        }
                        html += `
                            <div class="feedback-details">
                                <div class="feedback-columns-container">
                                    <div class="feedback-subsection">
                                        <h4>MY ANSWER</h4>
                                        <div class="diff-container">${escapeHtml(userAnswerText)}</div>
                                    </div>
                                    ${analysisHtmlBlock}
                                    <div class="feedback-subsection">
                                        <h4>CORRECT ANSWER</h4>
                                        <div class="diff-container">${escapeHtml(correctAnswerText)}</div>
                                    </div>
                                </div>
                            </div>`;
                    } else {
                        // If correct or "I don't know", only displays the correct answer.
                        html += `<div class="feedback-details"><div class="feedback-subsection"><h4>CORRECT ANSWER</h4><div class="diff-container">${q.answer.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">")}</div></div></div>`;
                    }
                    break;
                
                case 'matching':
                    // Displays matched options with correction feedback.
                    let leftOptionsToRender = q.leftOptions || [];
                    let rightOptionsToRender = q.rightOptions || [];
                    try {
                        // Retrieves options order from sessionStorage.
                        const storedLeftJSON = sessionStorage.getItem('ankiQuizMatchingLeft');
                        if (storedLeftJSON) leftOptionsToRender = JSON.parse(storedLeftJSON);
                        const storedRightJSON = sessionStorage.getItem('ankiQuizMatchingRight');
                        if (storedRightJSON) rightOptionsToRender = JSON.parse(storedRightJSON);
                    } catch (e) {
                        console.error("Could not read matching options order.", e);
                    }
                    sessionStorage.removeItem('ankiQuizMatchingLeft');
                    sessionStorage.removeItem('ankiQuizMatchingRight');

                    (leftOptionsToRender).forEach(left => {
                        const correctRightId = q.correctAnswersMap[left.id];
                        let idToSelectInDropdown = answeredIdk ? correctRightId : (userAnswer ? userAnswer[left.id] : null);
                        let feedbackClass = answeredIdk ? ' feedback-idk' : ((idToSelectInDropdown === correctRightId) ? ' feedback-correct' : ' feedback-incorrect');
                        
                        html += `
                            <div class="matching-row evaluated" data-left-id="${left.id}">
                                <div class="matching-row-content${feedbackClass}">
                                    <div class="matching-row-left">${parseAndRenderMedia(left.text)}</div>
                                    <div class="matching-row-right">
                                        <select class="styled-select" disabled>
                                            <option value="">-- Select --</option>
                                            ${rightOptionsToRender.map(r => `<option value="${r.id}" ${idToSelectInDropdown === r.id ? 'selected' : ''}>${parseAndRenderMedia(r.text)}</option>`).join('')}
                                        </select>
                                    </div>
                                </div>
                                ${q.individualExplanations && q.individualExplanations.has(left.id) ? `<div class="inline-explanation${feedbackClass}">${parseAndRenderMedia(q.individualExplanations.get(left.id))}</div>` : ''}
                            </div>`;
                    });
                    break;
                
                case 'ordering':
                    // Displays the ordered sequence, with visual feedback.
                    let itemsToDisplay = (answeredIdk || !userAnswer || userAnswer.length === 0) ?
                        (q.correctOrder || []).map(id => q.allOptions.find(opt => opt.id === id) || { id: `unknown-${id}`, text: 'Missing element' }) :
                        (userAnswer || []).map(id => q.allOptions.find(opt => opt.id === id) || { id: `unknown-${id}`, text: 'Element not found' });
                    
                    html += `<div id="draggable-list" class="draggable-list evaluated">`;
                    if (itemsToDisplay.length > 0) {
                        itemsToDisplay.forEach((opt, idx) => {
                            const itemId = opt ? opt.id : null;
                            const correctPositionIndex = q.correctOrder.indexOf(itemId);
                            const displayNumber = answeredIdk ? (idx + 1) : (correctPositionIndex > -1 ? correctPositionIndex + 1 : 'X');
                            
                            let feedbackClass = answeredIdk ? ' feedback-idk' : ((q.correctOrder.length > idx && itemId === q.correctOrder[idx]) ? ' feedback-correct' : ' feedback-incorrect');
                            const explanationHTML = q.individualExplanations && q.individualExplanations.has(itemId) ? `<div class="inline-explanation${feedbackClass}">${parseAndRenderMedia(q.individualExplanations.get(itemId))}</div>` : '';
                            
                            html += `
                                <div class="draggable-item evaluated" data-id="${itemId}">
                                    <div class="draggable-item-content${feedbackClass}">
                                        <span class="order-number">${displayNumber}.</span>
                                        <span class="item-text">${parseAndRenderMedia(opt ? opt.text : 'N/A')}</span>
                                    </div>
                                    ${explanationHTML}
                                </div>`;
                        });
                    } else { html += `<div class="draggable-item evaluated"><div class="draggable-item-content"><span class="item-text">Error: No elements found.</span></div></div>`; }
                    html += `</div>`;
                    break;
                
                case 'sentence-formation': case 'frase':
                    // Displays the sentence formed by the user and the correct sentence.
                    const userWords = !answeredIdk && userAnswer ? userAnswer : [];
                    const isSentenceCorrect = arraysEqualOrdered(userWords, q.correctSentenceWords);
                    
                    html += `<div id="sentence-response-area-back" class="sentence-response-area evaluated ${!answeredIdk ? (isSentenceCorrect ? 'feedback-correct' : 'feedback-incorrect') : ''}">`;
                    if (userWords.length > 0) userWords.forEach(w => { html += `<button type="button" class="sentence-word-button" disabled>${w}</button>`; });
                    else if (answeredIdk || (userAnswer && userAnswer.length === 0)) html += `<span class="text-gray-500">No sentence was formed.</span>`;
                    html += `</div>`;
                    if (!isSentenceCorrect || answeredIdk) {
                        html += `<p style="font-size:0.9rem; margin-top:1rem;">Correct sentence:</p><div class="sentence-response-area evaluated" style="margin-top:0.5rem;"><span class="text-green-500">${q.correctSentenceWords.join(' ')}</span></div>`;
                    }
                    break;
            }
            html += '</div>'; // Closes #options-box-back.

            // Displays general feedback message (Correct, Incorrect, Didn't Know).
            if (isCorrect !== null) {
                let feedbackText = '';
                if (answeredIdk) feedbackText = '<strong>Didn\'t Know.</strong> Time to review!';
                else if (isCorrect) feedbackText = '<strong>Correct!</strong>';
                else feedbackText = '<strong>Incorrect.</strong>';
                html += `<div class="feedback-per-question ${answeredIdk ? 'idk' : (isCorrect ? 'correct' : 'incorrect')}">${feedbackText}</div>`;
            }

            // Displays general explanation if it exists.
            if (q.generalExplanation) {
                html += `<div id="explanation-q-back" class="explanation-content visible"><h4>Explanation:</h4><p>${parseAndRenderMedia(q.generalExplanation)}</p></div>`;
            }

            // Displays individual hints if they exist and opens them by default on the back.
            if (q.pistas && q.pistas.length > 0) {
                html += `
                    <div class="hint-section-main">
                        ${q.pistas.map((pista, idx) => `
                            <div class="individual-hint-item">
                                <button type="button" class="toggle-individual-hint-button" aria-expanded="true">
                                    <span class="hint-title-display">${pista.title}</span>
                                    <span class="individual-arrow" style="transform: rotate(180deg);">▼</span>
                                </button>
                                <div class="hint-content-wrapper" style="max-height: 500px;">
                                    <div class="p-3-manual">
                                        <div class="display-individual-hint">${pista.content ? parseAndRenderMedia(pista.content) : 'This hint has no additional content.'}</div>
                                    </div>
                                </div>
                            </div>`).join('')}
                    </div>`;
            }
            html += '</div>'; // Closes #q-card-back.
            return html;
        }

        /*
        ----------------------------------------------------------------------------
         2.5. BACK-SPECIFIC LOGIC
        ----------------------------------------------------------------------------
         Functions for interacting with Anki review buttons
         and the back timer.
        */

        // Automatically presses the Anki review button (Again/Good)
        // based on the evaluation result.
        function pressAutomaticButton() {
            const feedbackElement = document.querySelector('.feedback-per-question');
            if (!feedbackElement) return; // If no feedback, does nothing.
            const feedbackText = feedbackElement.textContent || '';
            let buttonToPress = null;

            if (feedbackText.includes('Incorrect') || feedbackText.includes('Didn\'t Know')) {
                buttonToPress = document.querySelector('.anki-button-again'); // "Again" button.
            } else if (feedbackText.includes('Correct!')) {
                buttonToPress = document.querySelector('.anki-button-good'); // "Good" button.
            }
            
            // Simulates a click on the determined button.
            if (buttonToPress) buttonToPress.click();
        }
        
        // Cancels and hides the back timer bar.
        function cancelBackTimer() {
            if (!timerBarBackElement || !timerBackEndListener) return;

            // Freezes the bar in its current position.
            const currentWidth = getComputedStyle(timerBarBackElement).width;
            timerBarBackElement.style.transition = 'none';
            timerBarBackElement.style.width = currentWidth;

            // Removes the listener so it doesn't activate when the timer ends.
            timerBarBackElement.removeEventListener('transitionend', timerBackEndListener);
            timerBackEndListener = null;

            // Hides the timer container.
            const timerContainer = document.querySelector('.timer-bar-container');
            if (timerContainer) {
                timerContainer.style.display = 'none';
            }
        }
        
        // Configures and activates the timer bar for the back.
        function setupBackTimer() {
            timerBarBackElement = document.getElementById('timer-bar-back');
            if (!timerBarBackElement) return; // Exits if element does not exist.

            // Clears any previous listener to avoid duplicates.
            if (timerBackEndListener) {
                timerBarBackElement.removeEventListener('transitionend', timerBackEndListener);
            }

            const timerDurationBack = 5; // Duration of the back timer in seconds.

            // Defines the action to execute when the timer ends:
            // automatically presses the review button.
            timerBackEndListener = () => {
                pressAutomaticButton();
            };
            
            timerBarBackElement.addEventListener('transitionend', timerBackEndListener);

            // Resets and starts the bar.
            timerBarBackElement.style.transition = 'none';
            timerBarBackElement.style.width = '100%';

            // Small delay to ensure the transition applies correctly.
            setTimeout(() => {
                if (!timerBarBackElement) return;
                timerBarBackElement.style.transition = `width ${timerDurationBack}s linear`;
                timerBarBackElement.style.width = '0%';
            }, 10);
        }

        /*
        ============================================================================
         SECTION 3: MAIN EXECUTION FLOW AND ERROR HANDLING
        ============================================================================
         Orchestrates the initialization of all back card components
         and provides a basic mechanism to capture and display critical errors.
        */
        
        // Retrieves user answer from the front, stored in sessionStorage.
        const userAnswerData = JSON.parse(sessionStorage.getItem('ankiQuizUserAnswer') || '{"answer":null,"idk":true}');
        sessionStorage.removeItem('ankiQuizUserAnswer'); // Clears the answer once read.
        
        const questionData = parseFields(); // Parses question data.
        const container = document.getElementById('quiz-container-anki-back');

        if (questionData) {
            const evalResult = evaluateAnswer(questionData, userAnswerData); // Evaluates the answer.
            container.innerHTML = renderResult(questionData, userAnswerData, evalResult); // Renders the back.
            
            playResultSound(evalResult, questionData); // Plays feedback sound.

            // THIS IS THE CORRECTED BLOCK (Original source code)
            // --- START: Cursor hiding logic (Persistence Version) ---
            // This block of code is responsible for hiding the cursor
            // after a period of inactivity, improving the visual experience
            // during study.
            (function() {
                const targetElement = document.body; // CHANGE: Pointing to the body (Original source code)
                if (!targetElement) return;

                const CURSOR_STATE_KEY = 'ankiQuizCursorIsIdle'; // Key for sessionStorage to persist state.
                let cursorIdleTimeout; // Reference to the cursor inactivity timer.

                // Hides the cursor by adding a class to the target element.
                function hideCursor() {
                    targetElement.classList.add('cursor-idle'); // CHANGE: Adding the class to the body (Original source code)
                    sessionStorage.setItem(CURSOR_STATE_KEY, 'true'); // Marks cursor as idle in sessionStorage.
                }

                // Shows the cursor and resets the hiding timer.
                function showCursorAndResetTimer() {
                    targetElement.classList.remove('cursor-idle'); // CHANGE: Removing the class from the body (Original source code)
                    sessionStorage.removeItem(CURSOR_STATE_KEY); // Removes idle state from sessionStorage.
                    clearTimeout(cursorIdleTimeout); // Clears any existing timer.
                    cursorIdleTimeout = setTimeout(hideCursor, 2500); // Sets a new timer.
                }

                // On card load, checks if the cursor was hidden in the previous session.
                if (sessionStorage.getItem(CURSOR_STATE_KEY) === 'true') {
                    targetElement.classList.add('cursor-idle'); // CHANGE: Applying to the body (Original source code)
                } else {
                    showCursorAndResetTimer(); // If not hidden, starts the normal timer.
                }
                
                // Adds a listener to detect mouse movement and reset the timer.
                targetElement.addEventListener('mousemove', showCursorAndResetTimer); // CHANGE: Listener is on the body (Original source code)
            })();
            // --- END: Cursor hiding logic (Original source code) ---

            setupBackTimer(); // Initializes the back timer.

            const timerContainer = document.querySelector('.timer-bar-container');

            // Adds listener to cancel timer on click.
            if (timerContainer) {
                timerContainer.addEventListener('click', cancelBackTimer);
            }
            // Allows canceling timer with 'Escape' key.
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelBackTimer();
                }
            });
            
            // Configures event listeners for Anki review buttons.
            document.querySelectorAll('#anki-buttons .anki-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    cancelBackTimer(); // Cancels timer on button click.
                    e.preventDefault();
                    const ease = parseInt(button.dataset.ease, 10); // Gets 'ease' value (1, 2, 3).
                    if (!ease) return;
                    
                    let exitClass = '';
                    // Assigns an exit animation class based on the pressed button.
                    if (ease === 1) exitClass = 'exiting-again';
                    else if (ease === 2) exitClass = 'exiting-hard';
                    else if (ease === 3) exitClass = 'exiting-good';

                    if (exitClass) {
                        // Disables buttons to prevent multiple clicks.
                        document.querySelectorAll('#anki-buttons .anki-button').forEach(b => b.disabled = true);
                        document.body.classList.add(exitClass); // Adds class to body for animation.
                        // Executes Anki action after a brief animation.
                        setTimeout(() => { _ankiAction(ease); }, 250); 
                    } else {
                        _ankiAction(ease); // Executes action directly if no animation.
                    }
                });
            });
            
            // --- START: MEDIA INITIALIZATION CALLS (Original source code) ---
            // Ensures all media and image elements are processed
            // and correctly initialized on the back of the card.
            upgradeStandardMedia('#quiz-container-anki-back');
            initializeAllCustomMediaPlayers();
            styleAnkiImages('#quiz-container-anki-back');
            // --- END: MEDIA INITIALIZATION CALLS (Original source code) ---

            // Adjusts style of inline explanations.
            document.querySelectorAll('#q-card-back .inline-explanation').forEach(el => { el.style.padding = '0.75rem 1.25rem'; el.style.maxHeight = '500px'; });
        } else {
            // Displays an error message if quiz type is not valid.
            container.innerHTML = "<div class='styled-card'><strong>Error:</strong> No valid quiz type found.</div>";
        }

        // ===== FRONT TEMPLATE & BACK TEMPLATE =====
        // --- START: Improved persistent cursor logic (V5) (Original source code) ---
        // This block of code is responsible for the persistence of the cursor state
        // (hidden/visible) between the front and back of the card,
        // and for its hiding due to inactivity.
        (function() {
            const CURSOR_STATE_KEY = 'ankiQuizCursorIsIdle';
            let cursorIdleTimeout;

            // Function to hide the cursor.
            const hideCursor = () => {
                document.documentElement.classList.add('cursor-idle');
                sessionStorage.setItem(CURSOR_STATE_KEY, 'true');
            };

            // Function to show the cursor.
            const showCursor = () => {
                document.documentElement.classList.remove('cursor-idle');
                sessionStorage.removeItem(CURSOR_STATE_KEY);
            };

            // Mouse activity handler: shows cursor and resets timer.
            const cursorActivityHandler = () => {
                showCursor();
                clearTimeout(cursorIdleTimeout);
                cursorIdleTimeout = setTimeout(hideCursor, 2500);
            };

            // Cleanup of previous listeners to avoid duplicates.
            if (window.ankiCursorHandler) {
                document.removeEventListener('mousemove', window.ankiCursorHandler);
            }

            // Register new global handler for mouse movement.
            window.ankiCursorHandler = cursorActivityHandler;
            document.addEventListener('mousemove', window.ankiCursorHandler);

            // Immediate initialization based on previous cursor state in sessionStorage.
            if (sessionStorage.getItem(CURSOR_STATE_KEY) === 'true') {
                // Hide immediately WITHOUT waiting for everything to load.
                document.documentElement.classList.add('cursor-idle');
                // Configure timeout for possible reactivation.
                cursorIdleTimeout = setTimeout(() => {
                    // Only keep hidden if no activity since load.
                    if (sessionStorage.getItem(CURSOR_STATE_KEY) === 'true') {
                        hideCursor();
                    }
                }, 100);
            } else {
                // Start timer if it was active or it's the first load.
                cursorIdleTimeout = setTimeout(hideCursor, 2500);
            }
        })();
        // --- END: Improved cursor logic (Original source code) ---

    } catch (e) {
        // Catches and displays any unexpected error in the back interface.
        document.getElementById('quiz-container-anki-back').innerHTML = `<div class='styled-card' style='color:red;'><strong>Error:</strong> ${e.message}<br>Stack: ${e.stack}</div>`;
        console.error("Error on the back of the card:", e);
    }

    // Listener to clear the timer when leaving the page, preventing memory leaks.
    window.addEventListener('beforeunload', () => {
        if (timerBarBackElement && timerBackEndListener) {
            timerBarBackElement.removeEventListener('transitionend', timerBackEndListener);
        }
    });

})(); // End of IIFE.

// Global keyboard handler for Anki review buttons.
// This allows the user to rate the card using keyboard arrows.
document.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement.tagName;
    const isTextInput = ['INPUT', 'TEXTAREA'].includes(activeTag);
    const isShortcutKey = [',', '.', '/'].includes(e.key.toLowerCase());
    
    // If focus is on a text field and the key is not a shortcut,
    // allow normal text input.
    if (isTextInput && !isShortcutKey) return;
    
    let button = null;

    // Assigns the corresponding Anki button to the pressed key.
    switch(e.key.toLowerCase()) {
        case 'arrowleft': button = document.querySelector('.anki-button-again'); break;
        case 'arrowdown': button = document.querySelector('.anki-button-hard'); break;
        case 'arrowright': button = document.querySelector('.anki-button-good'); break;
    }

    if (button) {
        e.preventDefault(); // Prevents default arrow key behavior.
        button.click();     // Simulates a click on the button.
    }
});