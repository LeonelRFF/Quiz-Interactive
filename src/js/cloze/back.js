
// --- UNIFIED CLOZE AND QUIZ SCRIPT ---

(function() {

  

/*

----------------------------------------------------------------------------

2.1. INITIAL SETUP AND GLOBAL UTILITIES

----------------------------------------------------------------------------

Defines state variables and auxiliary general-purpose functions for the script.

*/

  

let timerIntervalBack = null; // Reference to the back timer interval.

const get = id => document.getElementById(id)?.innerHTML || ''; // Auxiliary function to get element content.

  

// Function to execute Anki review actions, adapting to different platforms.

function _ankiAction(ease) {

if (typeof pycmd !== "undefined") pycmd("ease" + ease);

else if (window.webkit?.messageHandlers?.ankiBridge) window.webkit.messageHandlers.ankiBridge.postMessage("ease" + ease);

else if (typeof AnkiDroidJS !== "undefined") {

if (ease === 1) buttonAnswerEase1();

else if (ease === 2) buttonAnswerEase2();

else if (ease === 3) buttonAnswerEase3();

else if (ease === 4) buttonAnswerEase4();

}

}

  

// Stops and hides the back timer.

function cancelBackTimer() {

if (timerIntervalBack) {

clearInterval(timerIntervalBack);

timerIntervalBack = null;

}

const timerFill = document.getElementById('timer-bar-back');

if (timerFill) {

const currentWidth = getComputedStyle(timerFill).width;

timerFill.style.transition = 'none';

timerFill.style.width = currentWidth; // Freezes the bar in its current position.

setTimeout(() => {

timerFill.style.transition = 'opacity 0.3s';

timerFill.style.opacity = '0'; // Fades the bar.

}, 10);

}

}

  

// Initializes listeners for review buttons and keyboard shortcuts.

function attachButtonListeners() {

// Adds listeners to Anki review buttons.

document.querySelectorAll('#anki-buttons .anki-button').forEach(button => {

button.addEventListener('click', (e) => {

e.preventDefault();

cancelBackTimer(); // Cancels the timer on click.

const ease = parseInt(button.dataset.ease, 10);

if (!ease) return;

// Assigns a class for the card exit animation.

let exitClass = '';

if (ease === 1) exitClass = 'exiting-again';

else if (ease === 2) exitClass = 'exiting-hard';

else if (ease === 3) exitClass = 'exiting-good';

if (exitClass) {

document.querySelectorAll('#anki-buttons .anki-button').forEach(b => b.disabled = true);

document.body.classList.add(exitClass);

setTimeout(() => { _ankiAction(ease); }, 250); // Executes the action after the animation.

} else {

_ankiAction(ease);

}

});

});

// Keyboard shortcut handler for review.

const keydownHandler = (e) => {

if (e.key === 'Escape') { e.preventDefault(); cancelBackTimer(); return; }

if (document.activeElement.tagName.match(/INPUT|TEXTAREA|SELECT/)) return;

let button = null;

switch(e.key) {

case '1': case 'ArrowLeft': button = document.querySelector('.anki-button-again'); break;

case '2': case 'ArrowDown': button = document.querySelector('.anki-button-hard'); break;

case '3': case 'ArrowRight': button = document.querySelector('.anki-button-good'); break;

}

if (button && !button.disabled) { e.preventDefault(); button.click(); }

};

document.addEventListener('keydown', keydownHandler);

// Allows canceling the timer by clicking its bar.

const timerContainer = document.querySelector('.timer-bar-container');

if (timerContainer) {

timerContainer.addEventListener('click', cancelBackTimer);

}

}

  

/*

----------------------------------------------------------------------------

2.2. SOUNDS AND TIMER MODULE

----------------------------------------------------------------------------

Manages feedback sound playback and the card back timer.

*/

  

// Loads and configures feedback sounds.

const soundCorrect = new Audio('Correct_Sound.wav'); soundCorrect.preload = "auto"; soundCorrect.volume = 0.1;

const soundIncorrect = new Audio('Incorrect_Sound.wav'); soundIncorrect.preload = "auto"; soundIncorrect.volume = 0.1;

// Plays feedback sound (correct/incorrect).

function playSound(isCorrect, wasSkipped) {

if (wasSkipped) {

soundIncorrect.play().catch(e => {}); // Plays incorrect sound if skipped.

return;

}

(isCorrect ? soundCorrect : soundIncorrect).play().catch(e => {});

}

// Starts the back timer. For non-basic cards, it automatically presses a button when finished.
function startBackTimer(evaluation, questionType) {
const timerBarBack = document.getElementById('timer-bar-back');
if (!timerBarBack) return;
const timerDurationBack = 5;
let timeLeftBack = timerDurationBack;
timerBarBack.style.width = '100%';
timerIntervalBack = setInterval(() => {
if (timeLeftBack <= 0) {
clearInterval(timerIntervalBack);
// IF THE CARD IS 'basic', DO NOTHING WHEN THE TIMER ENDS. IT JUST STOPS.
if (questionType === 'basic') {
return;
}
// For all other card types, maintain the original auto-grading logic.
let buttonToPress;
if (evaluation.skipped) {
buttonToPress = document.querySelector('.anki-button-again');
} else {
buttonToPress = evaluation.isCorrect ? document.querySelector('.anki-button-good') : document.querySelector('.anki-button-again');
}
if (buttonToPress) buttonToPress.click();
return;
}
timeLeftBack--;
timerBarBack.style.width = `${(timeLeftBack / timerDurationBack) * 100}%`;
}, 1000);
}
  

/*

----------------------------------------------------------------------------

2.3. MEDIA PLAYERS MODULE

----------------------------------------------------------------------------

Defines functions to generate and initialize custom audio

and video players. The content of these functions is kept minified

to preserve the original logic.

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

return `<div class="custom-video-player"><video class="custom-video-element" src="${src}"></video><div class="video-overlay"></div><div class="video-controls-container"><div class="progress-controls"><div class="progress-bar-container"><div class="progress-bar-buffered"></div><div class="loop-range-indicator"></div><div class="mark-indicator mark-a-indicator"></div><div class="mark-indicator mark-b-indicator"></div><div class="progress-bar-fill"></div></div><div class="time-display"><span class="current-time">0:00</span> / <span class="duration">0:00</span></div></div><div class="bottom-controls"><div class="control-group left-controls"><button class="control-btn play-pause-btn-small" title="Play/Pause"><svg class="play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 8.64v6.72c0 .46.54.66.91.43l5.34-3.36c.3-.19.3-.68 0-.86L9.41 8.21c-.37-.23-.91-.03-.91.43z"></path></svg><svg class="pause-icon" style="display:none;" viewBox="0 0 24 24" fill="currentColor"><path d="M7 19c0 .55.45 1 1 1h2c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1H8c-.55 0-1 .45-1 1v14zm7-14v14c0 .55.45 1 1 1h2c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1z"></path></svg></button></div><div class="control-group middle-controls"></div><div class="control-group right-controls"><button class="control-btn fullscreen-btn" title="Full screen"><svg class="fullscreen-open-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path></svg><svg class="fullscreen-close-icon" style="display:none;" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"></path></svg></button><button class="control-btn more-options-btn" title="More options"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg></button><div class="more-options-menu"></div></div></div><div style="display: none;"><div class="volume-container"><button class="control-btn volume-btn" title="Mute/Unmute"><svg class="volume-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"></path></svg><svg class="mute-icon" style="display:none;" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zM7 9v6h4l5 5V4L11 9H7zm7 5.68V9.32l2.58 2.58c.08-.2.12-.41.12-.68z"></path></svg></button><div class="volume-slider-container"><div class="volume-slider-fill"></div></div></div><div class="control-group loop-controls-group"><button class="control-btn mark-btn mark-a-btn" title="Mark start point (A)">A</button><button class="control-btn mark-btn mark-b-btn" title="Mark end point (B)">B</button><button class="control-btn loop-btn" title="Activate/deactivate A-B loop" disabled><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"></path></svg></button></div><div class="control-group speed-controls-group"><button class="control-btn speed-down-btn" title="Decrease speed"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"></path></svg></button><span class="speed-display">1.0x</span><button class="control-btn speed-up-btn" title="Increase speed"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"></path></svg></button></div></div></div></div>`;

}

// Parses text and replaces Anki syntax (e.g., "![[media.mp3]]") with custom player HTML.

function parseAndRenderMedia(text) {

if (!text || typeof text !== 'string') return text;

const mediaRegex = /!\[\[([^\]]+)\]\]/g;

return text.replace(mediaRegex, (match, filename) => {

const sanitizedFilename = encodeURI(filename.trim());

const extension = (filename.split('.').pop() || '').toLowerCase();

let mediaHtml = '';

switch (extension) {

case 'mp3': case 'wav': case 'ogg':

mediaHtml = getCustomAudioPlayerHTML(sanitizedFilename);

break;

case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': case 'svg':

mediaHtml = `<img class="embedded-media" src="${sanitizedFilename}" alt="Image: ${filename}">`;

break;

case 'mp4': case 'webm':

mediaHtml = getCustomVideoPlayerHTML(sanitizedFilename);

break;

default:

return match;

}

return `<div class="media-wrapper">${mediaHtml}</div>`;

});

}

// Initializes all custom audio and video players that have not been processed.

function initializeAllCustomMediaPlayers() {

document.querySelectorAll('.custom-audio-player:not(.initialized)').forEach(p => initializeCustomAudioPlayer(p));

document.querySelectorAll('.custom-video-player:not(.initialized)').forEach(p => initializeCustomVideoPlayer(p));

}

  

// Initializes a custom audio player, handling its control logic.

function initializeCustomAudioPlayer(p) {

if (p.classList.contains('initialized')) return;

  

const a = p.querySelector('.custom-audio-element');

const b = p.querySelector('.play-pause-btn');

const c = p.querySelector('.progress-bar-container');

const d = p.querySelector('.progress-bar-fill');

const e = p.querySelector('.current-time');

const f = p.querySelector('.duration');

const g = p.querySelector('.speed-down-btn');

const h = p.querySelector('.speed-up-btn');

const i = p.querySelector('.speed-display');

const j = p.querySelector('.mark-a-btn');

const k = p.querySelector('.mark-b-btn');

const l = p.querySelector('.loop-btn');

const m = p.querySelector('.volume-btn');

const n = p.querySelector('.volume-slider-container');

const o = p.querySelector('.volume-slider-fill');

const q = p.querySelector('.loop-range-indicator');

const r = p.querySelector('.mark-a-indicator');

const s = p.querySelector('.mark-b-indicator');

  

let t = null; // mark A time

let u = null; // mark B time

let v = !1; // is looping active

  

const playbackSpeeds = [0.25, .5, .75, 1, 1.25, 1.5, 1.75, 2];

let currentSpeedIndex = 3;

  

let isDraggingProgressBar = false;

let wasPlayingOnDragStart = false;

let isDraggingVolume = false;

  

const formatTime = z => {

if (isNaN(z)) return "0:00";

const A = Math.floor(z / 60);

const B = Math.floor(z % 60);

return `${A}:${B < 10 ? "0" : ""}${B}`;

};

const updateMarksUI = () => {

if (t !== null && u !== null) {

const A = Math.min(t, u);

const B = Math.max(t, u);

const C = A / a.duration * 100;

const D = (B - A) / a.duration * 100;

q.style.left = `${C}%`;

q.style.width = `${D}%`;

q.style.display = "block"

} else {

q.style.display = "none"

}

r.style.display = t !== null ? "block" : "none";

if (t !== null) r.style.left = `${t / a.duration * 100}%`;

s.style.display = u !== null ? "block" : "none";

if (u !== null) s.style.left = `${u / a.duration * 100}%`;

l.disabled = !(t !== null && u !== null)

};

a.addEventListener('loadedmetadata', () => { f.textContent = formatTime(a.duration); updateMarksUI() });

a.addEventListener('timeupdate', () => { e.textContent = formatTime(a.currentTime); if (!isDraggingProgressBar) d.style.width = `${a.currentTime / a.duration * 100}%`; v && u !== null && t !== null && a.currentTime >= u && (a.currentTime = t) });

a.addEventListener('play', () => p.classList.add('playing'));

a.addEventListener('pause', () => p.classList.remove('playing'));

a.addEventListener('ended', () => p.classList.remove('playing'));

b.addEventListener('click', () => a.paused ? a.play() : a.pause());

function updateProgressBarTime(e) {

const rect = c.getBoundingClientRect();

let clickX = e.clientX - rect.left;

clickX = Math.max(0, Math.min(clickX, rect.width));

const newTime = (clickX / rect.width) * a.duration;

a.currentTime = newTime;

d.style.width = `${(newTime / a.duration) * 100}%`;

e.textContent = formatTime(newTime);

}

const handleProgressBarDrag = (e) => { if (isDraggingProgressBar) { updateProgressBarTime(e) } };

const handleProgressBarEnd = () => { if (isDraggingProgressBar) { isDraggingProgressBar = false; document.removeEventListener('mousemove', handleProgressBarDrag); document.removeEventListener('mouseup', handleProgressBarEnd); if (wasPlayingOnDragStart) { a.play() } } };

c.addEventListener('mousedown', (e) => { isDraggingProgressBar = true; wasPlayingOnDragStart = !a.paused; if (wasPlayingOnDragStart) { a.pause() } updateProgressBarTime(e); document.addEventListener('mousemove', handleProgressBarDrag); document.addEventListener('mouseup', handleProgressBarEnd) });

h.addEventListener('click', () => { if (currentSpeedIndex < playbackSpeeds.length - 1) { currentSpeedIndex++; a.playbackRate = playbackSpeeds[currentSpeedIndex]; i.textContent = `${playbackSpeeds[currentSpeedIndex].toFixed(2)}x` } });

g.addEventListener('click', () => { if (currentSpeedIndex > 0) { currentSpeedIndex--; a.playbackRate = playbackSpeeds[currentSpeedIndex]; i.textContent = `${playbackSpeeds[currentSpeedIndex].toFixed(2)}x` } });

j.addEventListener('click', () => { t = a.currentTime; j.classList.add('active'); if (u !== null && t >= u) u = null; updateMarksUI() });

k.addEventListener('click', () => { u = a.currentTime; k.classList.add('active'); if (t !== null && u <= t) t = null; updateMarksUI() });

l.addEventListener('click', () => { v = !v; l.classList.toggle('active', v); v || (t = u = null, l.disabled = !0, j.classList.remove('active'), k.classList.remove('active'), updateMarksUI()) });

function handleVolumeUpdate(e) {

const rect = n.getBoundingClientRect();

let clickX = e.clientX - rect.left;

clickX = Math.max(0, Math.min(clickX, rect.width));

const newVolume = clickX / rect.width;

a.muted = false;

a.volume = newVolume;

}

const handleVolumeDrag = (e) => { if (isDraggingVolume) handleVolumeUpdate(e) };

const handleVolumeEnd = () => { if (isDraggingVolume) { isDraggingVolume = false; document.removeEventListener('mousemove', handleVolumeDrag); document.removeEventListener('mouseup', handleVolumeEnd) } };

n.addEventListener('mousedown', (e) => { isDraggingVolume = true; handleVolumeUpdate(e); document.addEventListener('mousemove', handleVolumeDrag); document.addEventListener('mouseup', handleVolumeEnd) });

m.addEventListener('click', () => a.muted = !a.muted);

a.addEventListener('volumechange', () => { o.style.width = a.muted ? "0%" : `${a.volume * 100}%`; p.querySelector('.volume-icon').style.display = a.muted || a.volume === 0 ? 'none' : 'block'; p.querySelector('.mute-icon').style.display = a.muted || a.volume === 0 ? 'block' : 'none' });

p.classList.add('initialized');

}

  

// Initializes a custom video player, handling its control logic.

function initializeCustomVideoPlayer(playerContainer) {

const video=playerContainer.querySelector('.custom-video-element');

const overlay=playerContainer.querySelector('.video-overlay');

const playPauseBtnSmall=playerContainer.querySelector('.play-pause-btn-small');

const progressBarFill=playerContainer.querySelector('.progress-bar-fill');

const progressBarBuffered=playerContainer.querySelector('.progress-bar-buffered');

const currentTimeEl=playerContainer.querySelector('.current-time');

const durationEl=playerContainer.querySelector('.duration');

const progressBarContainer=playerContainer.querySelector('.progress-bar-container');

const fullscreenBtn=playerContainer.querySelector('.fullscreen-btn');

const volumeContainer=playerContainer.querySelector('.volume-container');

const loopControlsGroup=playerContainer.querySelector('.loop-controls-group');

const speedControlsGroup=playerContainer.querySelector('.speed-controls-group');

const speedDownBtn=speedControlsGroup.querySelector('.speed-down-btn');

const speedUpBtn=speedControlsGroup.querySelector('.speed-up-btn');

const speedDisplay=speedControlsGroup.querySelector('.speed-display');

const markABtn=loopControlsGroup.querySelector('.mark-a-btn');

const markBBtn=loopControlsGroup.querySelector('.mark-b-btn');

const loopBtn=loopControlsGroup.querySelector('.loop-btn');

const volumeBtn=volumeContainer.querySelector('.volume-btn');

const volumeSliderContainer=volumeContainer.querySelector('.volume-slider-container');

const volumeSliderFill=volumeContainer.querySelector('.volume-slider-fill');

const markAIndicator=playerContainer.querySelector('.mark-a-indicator');

const markBIndicator=playerContainer.querySelector('.mark-b-indicator');

const loopRangeIndicator=playerContainer.querySelector('.loop-range-indicator');

const moreOptionsBtn=playerContainer.querySelector('.more-options-btn');

const moreOptionsMenu=playerContainer.querySelector('.more-options-menu');

const leftControls=playerContainer.querySelector('.left-controls');

const middleControls=playerContainer.querySelector('.middle-controls');

const rightControls=playerContainer.querySelector('.right-controls');

let controlsTimeout;

const playbackSpeeds=[0.25,0.5,0.75,1.0,1.25,1.5,1.75,2.0];

let currentSpeedIndex=3;

let markA=null;

let markB=null;

let isLooping=false;

let isDraggingProgressBar=false;

let wasPlayingOnDragStart=false;

let isDraggingVolume=false;

const showControls=()=>{playerContainer.classList.add('controls-visible');clearTimeout(controlsTimeout)};

const hideControls=()=>{if(video.paused||moreOptionsMenu.classList.contains('active'))return;playerContainer.classList.remove('controls-visible')};

const startHideTimer=()=>{if(video.paused)return;clearTimeout(controlsTimeout);controlsTimeout=setTimeout(hideControls,2500)};

playerContainer.addEventListener('mousemove',()=>{showControls();startHideTimer()});

playerContainer.addEventListener('mouseleave',hideControls);

function formatTime(seconds){

const minutes=Math.floor(seconds/60);

const secs=Math.floor(seconds%60);

return`${minutes}:${secs<10?'0':''}${secs}`

}

function updateIcons(){

const isPaused=video.paused;

playerContainer.querySelector('.play-icon').style.display=isPaused?'block':'none';

playerContainer.querySelector('.pause-icon').style.display=isPaused?'none':'block';

const isMuted=video.muted||video.volume===0;

volumeContainer.querySelector('.volume-icon').style.display=isMuted?'none':'block';

volumeContainer.querySelector('.mute-icon').style.display=isMuted?'block':'none';

const isFullscreen=!!document.fullscreenElement;

playerContainer.querySelector('.fullscreen-open-icon').style.display=isFullscreen?'none':'block';

playerContainer.querySelector('.fullscreen-close-icon').style.display=isFullscreen?'block':'none'

}

function togglePlay(){video.paused?video.play():video.pause()}

video.addEventListener('play',()=>{playerContainer.classList.add('playing');video.playbackRate=playbackSpeeds[currentSpeedIndex];startHideTimer();updateIcons()});

video.addEventListener('pause',()=>{playerContainer.classList.remove('playing');showControls();updateIcons()});

video.addEventListener('loadedmetadata',()=>{durationEl.textContent=formatTime(video.duration);updateMarksUI()});

video.addEventListener('timeupdate',()=>{progressBarFill.style.width=`${(video.currentTime/video.duration)*100}%`;currentTimeEl.textContent=formatTime(video.currentTime);if(isLooping&&markA!==null&&markB!==null&&video.currentTime>=markB){video.currentTime=markA}});

video.addEventListener('ended',()=>{if(isLooping&&markA!==null){video.currentTime=markA;video.play()}else{playerContainer.classList.remove('playing');video.currentTime=0}});

video.addEventListener('progress',()=>{if(video.buffered.length>0){const bufferedEnd=video.buffered.end(video.buffered.length-1);progressBarBuffered.style.width=`${(bufferedEnd/video.duration)*100}%`}});

overlay.addEventListener('click',togglePlay);

video.addEventListener('click',togglePlay);

playPauseBtnSmall.addEventListener('click',togglePlay);

function updateProgressBarTime(e){

const rect=progressBarContainer.getBoundingClientRect();

let clickX=e.clientX-rect.left;

clickX=Math.max(0,Math.min(clickX,rect.width));

const newTime=(clickX/rect.width)*video.duration;

video.currentTime=newTime;

progressBarFill.style.width=`${(newTime/video.duration)*100}%`;

currentTimeEl.textContent=formatTime(newTime)

}

const handleProgressBarDrag=(e)=>{if(isDraggingProgressBar){updateProgressBarTime(e)}};

const handleProgressBarEnd=()=>{if(isDraggingProgressBar){isDraggingProgressBar=false;document.removeEventListener('mousemove',handleProgressBarDrag);document.removeEventListener('mouseup',handleProgressBarEnd);if(wasPlayingOnDragStart){video.play()}}};

progressBarContainer.addEventListener('mousedown',(e)=>{isDraggingProgressBar=true;wasPlayingOnDragStart=!video.paused;if(wasPlayingOnDragStart){video.pause()}updateProgressBarTime(e);document.addEventListener('mousemove',handleProgressBarDrag);document.addEventListener('mouseup',handleProgressBarEnd)});

function updateSpeed(){

const newSpeed=playbackSpeeds[currentSpeedIndex];

video.playbackRate=newSpeed;

speedDisplay.textContent=`${newSpeed.toFixed(2).replace(/\.00$/,'').replace(/\.([1-9])0$/,'$1')}x`;

speedDownBtn.disabled=currentSpeedIndex===0;

speedUpBtn.disabled=currentSpeedIndex===playbackSpeeds.length-1

}

speedUpBtn.addEventListener('click',()=>{currentSpeedIndex=Math.min(currentSpeedIndex+1,playbackSpeeds.length-1);updateSpeed()});

speedDownBtn.addEventListener('click',()=>{currentSpeedIndex=Math.max(currentSpeedIndex-1,0);updateSpeed()});

function updateMarksUI(){

const duration=video.duration;

if(isNaN(duration))return;

markAIndicator.style.display=markA!==null?'block':'none';

if(markA!==null)markAIndicator.style.left=`${(markA/duration)*100}%`;

markBIndicator.style.display=markB!==null?'block':'none';

if(markB!==null)markBIndicator.style.left=`${(markB/duration)*100}%`;

if(markA!==null&&markB!==null){

loopRangeIndicator.style.left=`${(markA/duration)*100}%`;

loopRangeIndicator.style.width=`${((markB-markA)/duration)*100}%`;

loopRangeIndicator.style.display='block';

loopBtn.disabled=false

}else{

loopRangeIndicator.style.display='none';

loopBtn.disabled=true;

if(isLooping){isLooping=false;loopBtn.classList.remove('active')}

}

}

markABtn.addEventListener('click',()=>{markA=video.currentTime;if(markB!==null&&markA>=markB)markB=null;updateMarksUI()});

markBBtn.addEventListener('click',()=>{markB=video.currentTime;if(markA!==null&&markB<=markA)markA=null;updateMarksUI()});

loopBtn.addEventListener('click',()=>{isLooping=!isLooping;loopBtn.classList.toggle('active',isLooping)});

function updateVolumeUI(){

volumeSliderFill.style.width=`${video.muted?0:video.volume*100}%`;

updateIcons()

}

volumeBtn.addEventListener('click',()=>{video.muted=!video.muted;updateVolumeUI()});

const handleVolumeUpdate=(e)=>{

const rect=volumeSliderContainer.getBoundingClientRect();

let clickX=e.clientX-rect.left;

clickX=Math.max(0,Math.min(clickX,rect.width));

const newVolume=clickX/rect.width;

video.muted=false;

video.volume=newVolume;

updateVolumeUI()

};

const handleVolumeDrag=(e)=>{if(isDraggingVolume){handleVolumeUpdate(e)}};

const handleVolumeEnd=()=>{if(isDraggingVolume){isDraggingVolume=false;document.removeEventListener('mousemove',handleVolumeDrag);document.removeEventListener('mouseup',handleVolumeEnd)}};

volumeSliderContainer.addEventListener('mousedown',(e)=>{isDraggingVolume=true;handleVolumeUpdate(e);document.addEventListener('mousemove',handleVolumeDrag);document.addEventListener('mouseup',handleVolumeEnd)});

video.addEventListener('volumechange',updateVolumeUI);

function toggleFullscreen(){

if(!document.fullscreenElement){playerContainer.requestFullscreen().catch(err=>console.error(err))}else{document.exitFullscreen()}

}

fullscreenBtn.addEventListener('click',toggleFullscreen);

video.addEventListener('dblclick',toggleFullscreen);

document.addEventListener('fullscreenchange',updateIcons);

const handleResponsiveLayout=(width)=>{

if(width<650&&!moreOptionsMenu.contains(speedControlsGroup)){moreOptionsMenu.prepend(speedControlsGroup)}else if(width>=650&&moreOptionsMenu.contains(speedControlsGroup)){rightControls.prepend(speedControlsGroup)}

if(width<520&&!moreOptionsMenu.contains(loopControlsGroup)){moreOptionsMenu.prepend(loopControlsGroup)}else if(width>=520&&moreOptionsMenu.contains(loopControlsGroup)){middleControls.appendChild(loopControlsGroup)}

if(width<420&&!moreOptionsMenu.contains(volumeContainer)){moreOptionsMenu.prepend(volumeContainer)}else if(width>=420&&moreOptionsMenu.contains(volumeContainer)){leftControls.appendChild(volumeContainer)}

if(moreOptionsMenu.children.length>0){moreOptionsBtn.style.display='flex'}else{moreOptionsBtn.style.display='none';moreOptionsMenu.classList.remove('active')}

};

const resizeObserver=new ResizeObserver(entries=>{for(let entry of entries){handleResponsiveLayout(entry.contentRect.width)}});

resizeObserver.observe(playerContainer);

moreOptionsBtn.addEventListener('click',(e)=>{e.stopPropagation();const playerRect=playerContainer.getBoundingClientRect();const btnRect=moreOptionsBtn.getBoundingClientRect();const availableSpace=btnRect.top-playerRect.top;moreOptionsMenu.style.maxHeight=`${availableSpace-20}px`;moreOptionsMenu.classList.toggle('active');if(moreOptionsMenu.classList.contains('active')){showControls()}});

document.addEventListener('click',(e)=>{if(!moreOptionsMenu.contains(e.target)&&e.target!==moreOptionsBtn&&!moreOptionsBtn.contains(e.target)){moreOptionsMenu.classList.remove('active')}});

leftControls.appendChild(volumeContainer);

middleControls.appendChild(loopControlsGroup);

rightControls.prepend(speedControlsGroup);

handleResponsiveLayout(playerContainer.clientWidth);

updateSpeed();

updateVolumeUI();

updateIcons();

}

  

// Applies specific CSS classes to Anki `<img>` tags for visual consistency.

function styleAnkiImages(containerSelector) {

const container = document.querySelector(containerSelector);

if (!container) return;

container.querySelectorAll('img:not(.embedded-media)').forEach(img => {

if (img.closest('.custom-audio-player, .custom-video-player')) return;

const wrapper = document.createElement('div');

wrapper.className = 'media-wrapper';

img.parentNode.insertBefore(wrapper, img);

wrapper.appendChild(img);

img.classList.add('embedded-media');

});

}

// Converts standard HTML5 `<audio>` and `<video>` tags into custom players.

function upgradeStandardMedia(containerSelector) {

const container = document.querySelector(containerSelector);

if (!container) return;

container.querySelectorAll('audio:not(.custom-audio-element)').forEach(audio => {

const src = audio.getAttribute('src');

if (!src) return;

const tempWrapper = document.createElement('div');

tempWrapper.innerHTML = getCustomAudioPlayerHTML(src);

const newPlayer = tempWrapper.firstElementChild;

if (audio.parentNode) audio.parentNode.replaceChild(newPlayer, audio);

});

container.querySelectorAll('video:not(.custom-video-element)').forEach(video => {

const src = video.getAttribute('src');

if (!src) return;

const tempWrapper = document.createElement('div');

tempWrapper.innerHTML = getCustomVideoPlayerHTML(src);

const newPlayer = tempWrapper.firstElementChild;

if (video.parentNode) video.parentNode.replaceChild(newPlayer, video);

});

}

  

  

  

/*

----------------------------------------------------------------------------

2.4. CLOZE AND QUIZ LOGIC MODULE

----------------------------------------------------------------------------

Contains the main functions for parsing fields, evaluating user answers,

and building feedback HTML.

*/

  

const getCardNumber = () => { if (typeof AnkiDroidJS !== 'undefined') { try { return AnkiDroidJS.getCardOrdinal() + 1; } catch (e) {} } const m = document.body.className.match(/(^|\s)card(\d+)(\s|$)/); return m ? parseInt(m[2], 10) : 1; };

const arraysEqualOrdered=(a,b)=>{if(!a||!b||a.length!==b.length)return!1;for(let i=0;i<a.length;i++)if((a[i]||'').trim().toLowerCase()!==(b[i]||'').trim().toLowerCase())return!1;return!0};

const getDiffParts = (str1, str2) => {const s1=str1||'',s2=str2||'';if(s1.toLowerCase()===s2.toLowerCase())return[];const dp=Array(s1.length+1).fill(null).map(()=>Array(s2.length+1).fill(0));for(let i=1;i<=s1.length;i++){for(let j=1;j<=s2.length;j++){if(s1[i-1].toLowerCase()===s2[j-1].toLowerCase()){dp[i][j]=dp[i-1][j-1]+1}else{dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1])}}}let i=s1.length,j=s2.length;const result=[];while(i>0||j>0){if(i>0&&j>0&&s1[i-1].toLowerCase()===s2[j-1].toLowerCase()){result.unshift({type:'common',value:s1[i-1]});i--;j--}else if(j>0&&(i===0||dp[i][j-1]>=dp[i-1][j])){result.unshift({type:'removed',value:s2[j-1]});j--}else if(i>0&&(j===0||dp[i][j-1]<dp[i-1][j])){result.unshift({type:'added',value:s1[i-1]});i--}else{break}}return result;};

const escapeHtml = (text) => (text || '').replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");

  

// Parses Anki card fields to structure quiz data.

function parseFields() {

// Parses tags to determine quiz type.

const rawTagsString = get('anki-field-tags-back') || '';

const allTags = rawTagsString.split(/\s+/).map(t => t.trim()).filter(Boolean);

const knownQuizTypes = { 'f': 'sentence-formation', 'r': 'matching', 'o': 'ordering', 'sc': 'single-choice', 'mc': 'multiple-choice', 'ae': 'exact-answer', 'b': 'basic' };

let detectedQuizType = 'basic';

const thematicTags = allTags.filter(tag => {

const n = tag.toLowerCase();

if (knownQuizTypes[n]) {

detectedQuizType = knownQuizTypes[n];

return false;

}

return true;

}).map(t => t.replace(/_/g, ' '));

  

// Main object to store question data.

const q = { type: detectedQuizType, tags: thematicTags, correctAnswers: [], correctAnswersMap: {}, explanations: new Map(), generalExplanation: null, allOptions: [], pistas: [] };

// Regular expression for cloze fields.

const clozeRegex = /\{\{c(\d+)::([\s\S]*?)(::([\s\S]*?))?\}\}/g;

const currentClozeNum = getCardNumber();

const mainQuestionText = get('anki-field-pregunta-back');

const optionsSource = get('anki-field-opciones-back');

const answerSource = get('anki-field-respuesta_correcta-back');

const explanationSource = get('anki-field-explicacion-back');

const hintsSource = get('anki-field-pistas-back');

q.pistas = (hintsSource || "").split('|').map(s => s.trim()).filter(Boolean);

  

// Logic to detect if it is a final review card.

const allPossibleClozeSources = answerSource;

const allClozeMatches = Array.from((allPossibleClozeSources || '').matchAll(clozeRegex));

let maxClozeNum = 0;

allClozeMatches.forEach(m => maxClozeNum = Math.max(maxClozeNum, parseInt(m[1])));

const lastClozeMatch = allClozeMatches.length > 0 ? allClozeMatches.find(m => parseInt(m[1]) === maxClozeNum) : null;

const hasReviewCloze = lastClozeMatch && lastClozeMatch[2].trim() === '';

q.isReviewAllCard = hasReviewCloze && currentClozeNum === maxClozeNum;

  

// Determines the final quiz type for this card.

q.type = detectedQuizType;

if (hasReviewCloze && ['ordering', 'sentence-formation', 'exact-answer'].includes(detectedQuizType)) {}

  

  

  

  

// --- THIRD-PARTY CODE ATTRIBUTION ---

// The following function `processFieldForCloze` is an adaptation and refactoring

// of the original work "Simple Cloze Overlapper" by Michal Rus, licensed

// under Apache 2.0. It has been integrated into this broader quiz system.

// Full attribution and original license details can be found in the NOTICE file distributed with this template.Original repository: https://github.com/michalrus/anki-simple-cloze-overlapper

// --- END OF ATTRIBUTION ---

  

  

  

  

  

// Function to reveal cloze content.

function revealCloze(text, isOverlapper = false) {

if (!text) return '';

return text.replace(clozeRegex, (m, n, c, _, p) => {

const clozeNum = parseInt(n);

if (q.isReviewAllCard) { return (clozeNum < maxClozeNum) ? `<span class="cloze">${c}</span>` : ''; }

if (clozeNum === currentClozeNum) return `<span class="cloze">${c}</span>`;

if (hasReviewCloze && clozeNum === maxClozeNum) {

return '';

}

return isOverlapper ? c : `<span class="cloze-placeholder-inactive">[${p || "..."}]</span>`;

});

}

const parseIdAndText = s => {

const t = s.trim(); if (!t) return null;

const m = t.match(/^([a-zA-Z0-9_.-]+)[.)]\s*(.+)/s);

if (m && m[2]) { return { id: m[1].trim(), text: m[2].trim() }; }

return { id: t, text: t };

};

// Constructs the question text with revealed clozes.

q.text = mainQuestionText ? `<p>${mainQuestionText}</p>${revealCloze(answerSource, false)}` : revealCloze(answerSource, false);

  

// Finds cloze matches for the current card.

const clozeMatchesForCard = [];

const allClozeMatchesForType = Array.from((answerSource || '').matchAll(clozeRegex));

  

if (q.isReviewAllCard) { allClozeMatchesForType.filter(m => parseInt(m[1]) < maxClozeNum).forEach(m => clozeMatchesForCard.push(m)); }

else { allClozeMatchesForType.forEach(m => { if(parseInt(m[1]) === currentClozeNum) clozeMatchesForCard.push(m); }); }

// Parses individual and general explanations.

(explanationSource || '').split('|').forEach(part => {

const match = part.trim().match(/^([a-zA-Z0-9_.-]+)[.)]\s*(.+)/s);

if (match) q.explanations.set(match[1].trim(), match[2].trim());

});

if (q.explanations.size === 0 && explanationSource.trim()) {

q.generalExplanation = explanationSource.trim();

}

  

// Structures correct answer data according to quiz type.

if (q.type === 'single-choice' || q.type === 'multiple-choice') {

q.allOptions = (optionsSource || '').split('|').map(parseIdAndText).filter(Boolean);

const correctClozeContent = clozeMatchesForCard.map(m => m[2].trim());

const correctTextSet = new Set(correctClozeContent.map(s => s.toLowerCase()));

const correctIdSet = new Set(correctClozeContent.map(s => parseIdAndText(s).id.toLowerCase()));

q.correctAnswers = q.allOptions.filter(opt => correctTextSet.has(opt.text.toLowerCase()) || correctIdSet.has(opt.id.toLowerCase())).map(opt => opt.id);

} else if (q.type === 'ordering') {

const optionIdMap = new Map();

q.allOptions = (optionsSource || '').split('|').map(parseIdAndText).filter(Boolean);

q.allOptions.forEach(opt => optionIdMap.set(opt.text.toLowerCase(), opt.id));

const getMappedId = (text) => optionIdMap.get(text.toLowerCase()) || text;

q.correctAnswers = clozeMatchesForCard.map(m => getMappedId(m[2].trim()));

} else if (q.type === 'sentence-formation') {

q.correctAnswers = clozeMatchesForCard.map(m => m[2].trim());

} else if (q.type === 'matching') {

q.text = mainQuestionText;

q.leftOptions = (answerSource || '').split('|').map(parseIdAndText).filter(Boolean);

q.rightOptionsForLookup = (optionsSource || '').split('|').map(parseIdAndText).filter(Boolean);

const clozeContentRegex = /\{\{c\d+::([\s\S]*?)(::[\s\S]*?)?\}\}/;

q.leftOptions.forEach(leftItem => {

const match = leftItem.text.match(clozeContentRegex);

if (match && match[1]) {

const correctText = match[1].trim();

const correspondingRightOption = q.rightOptionsForLookup.find(rightItem => rightItem.text.trim().toLowerCase() === correctText.toLowerCase());

if (correspondingRightOption) q.correctAnswersMap[leftItem.id] = correspondingRightOption.id;

}

});

q.leftOptions.forEach(item => { item.text = revealCloze(item.text, true); });

} else {

q.correctAnswers = clozeMatchesForCard.map(m => m[2].trim());

}

return q;

}

  

// Evaluates the user's answer against the correct answer.

function evaluateAnswer(q, userResponse) {

// --- START OF IMPROVEMENT (Original from source code) ---

// Determines if an empty answer should be treated as "Didn't Know".

if (q.type !== 'basic' && !userResponse.idk) {

const userAnswer = userResponse.answer;

const userAnswerIsEmpty = (

userAnswer === null ||

(Array.isArray(userAnswer) && userAnswer.length === 0) ||

(typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer) && Object.keys(userAnswer).length === 0) ||

(Array.isArray(userAnswer) && userAnswer.length === 1 && (userAnswer[0] === "" || userAnswer[0] === undefined))

);

  

let correctAnswerIsExpected = false;

switch(q.type) {

case 'matching':

const leftItemsOnThisCard = q.leftOptions.filter(item => item.text.includes('<span class="cloze">'));

correctAnswerIsExpected = leftItemsOnThisCard.length > 0;

break;

case 'single-choice':

case 'multiple-choice':

case 'ordering':

case 'sentence-formation':

case 'exact-answer':

correctAnswerIsExpected = q.correctAnswers && q.correctAnswers.length > 0;

break;

}

if (userAnswerIsEmpty && correctAnswerIsExpected) {

userResponse.idk = true; // We force the state to "Didn't know".

}

}

// --- END OF IMPROVEMENT (Original from source code) ---

  

// Main evaluation.

if (userResponse.idk) return { isCorrect: false, skipped: true, individualResults: {} };

const userAnswer = userResponse.answer;

let isCorrect = false; let individualResults = {};

switch(q.type) {

case 'matching': {

const userAnswers = userAnswer || {}; let correctMatches = 0;

const leftItemsOnThisCard = q.leftOptions.filter(item => item.text.includes('<span class="cloze">'));

if (leftItemsOnThisCard.length === 0) return { isCorrect: true, skipped: true, individualResults: {} };

leftItemsOnThisCard.forEach(leftOpt => {

const correctRightId = q.correctAnswersMap[leftOpt.id]; const userChoiceId = userAnswers[leftOpt.id];

const isPairCorrect = correctRightId === userChoiceId;

individualResults[leftOpt.id] = { isCorrect: isPairCorrect, userChoiceId: userChoiceId, correctChoiceId: correctRightId };

if (isPairCorrect) correctMatches++;

});

isCorrect = correctMatches === leftItemsOnThisCard.length && Object.keys(userAnswers).length === leftItemsOnThisCard.length;

break;

}

case 'ordering': case 'sentence-formation': isCorrect = arraysEqualOrdered(userAnswer || [], q.correctAnswers); break;

case 'exact-answer': {

const userAnswersArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];

const results = q.correctAnswers.map((correct, index) => (userAnswersArray[index] || '').trim().toLowerCase() === correct.trim().toLowerCase());

isCorrect = results.every(res => res);

individualResults = results;

break;

}

case 'multiple-choice': {

const userSet = new Set((userAnswer || []).map(u => u.trim()));

const correctSet = new Set(q.correctAnswers.map(c => c.trim()));

isCorrect = userSet.size === correctSet.size && [...userSet].every(item => correctSet.has(item));

break;

}

case 'single-choice': isCorrect = userAnswer === q.correctAnswers[0]; break;

case 'basic': default: isCorrect = true; break;

}

return { isCorrect, skipped: false, individualResults };

}

  

// Builds the HTML for the back of the card with feedback.

function buildResultHTML(q, userResponse, evaluation) {

const { isCorrect, skipped, individualResults } = evaluation;

const tagsHTML = `<div class="question-tags-container">${q.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}</div>`;

let html = `<div id="q-card-back" class="question-card-item styled-card"><div class="question-card-header">${tagsHTML}</div>`;

let mainContentHTML = `<div class="question-text">${parseAndRenderMedia(q.text) || ''}</div>`;

let optionsHTML = '<div id="options-box-back">';

  

if (q.type === 'matching') {

const userAnswers = userResponse.answer || {};

const leftItemsOnThisCard = q.leftOptions.filter(item => new RegExp(`<span class="cloze">`).test(item.text));

if (leftItemsOnThisCard.length === 0) { // If no matching elements are expected on this card, just show the question and exit.

optionsHTML += `<p>No matching elements were expected for this card.</p>`;

} else {

leftItemsOnThisCard.forEach(leftOpt => {

const result = individualResults[leftOpt.id] || { isCorrect: false, userChoiceId: '' };

const feedbackClass = skipped ? 'feedback-idk' : (result.isCorrect ? 'feedback-correct' : 'feedback-incorrect');

const explanation = q.explanations.get(leftOpt.id);

const userChoiceId = userAnswers[leftOpt.id] || "";

let selectOptionsHTML = `<option value="">-- Select --</option>`;

q.rightOptionsForLookup.forEach(r => { selectOptionsHTML += `<option value="${r.id}" ${userChoiceId === r.id ? 'selected' : ''}>${parseAndRenderMedia(r.text)}</option>`; });

let selectHTML = `<select class="styled-select" disabled>${selectOptionsHTML}</select>`;

if (!result.isCorrect && !skipped) {

const correctChoiceObj = q.rightOptionsForLookup.find(r => r.id === result.correctChoiceId);

const correctChoiceText = correctChoiceObj ? `${parseAndRenderMedia(correctChoiceObj.text)}` : 'Error';

selectHTML += `<span class="correct-choice-arrow"> → </span><span class="correct-choice-text">${correctChoiceText}</span>`;

}

optionsHTML += `<div class="matching-row evaluated"><div class="matching-row-content ${feedbackClass}"><div class="matching-row-left">${parseAndRenderMedia(leftOpt.text)}</div><div class="matching-row-right">${selectHTML}</div></div>`;

if(explanation) { optionsHTML += `<div class="inline-explanation ${feedbackClass}">${parseAndRenderMedia(explanation)}</div>`; }

optionsHTML += `</div>`;

});

}

mainContentHTML = `<div class="question-text">${parseAndRenderMedia(q.text) ? parseAndRenderMedia(q.text) : ''}</div>`;

}

else if (q.type === 'exact-answer') {

const userAnswerArray = userResponse.answer || [];

q.correctAnswers.forEach((correctAnswerText, index) => {

const userAnswerText = (userAnswerArray[index] || '').trim();

const isThisPartCorrect = (individualResults[index] === true);

let feedbackHtml = '';

if (q.correctAnswers.length > 1) { feedbackHtml += `<h5>Analysis for cloze #${index + 1}</h5>`; }

if (skipped || isThisPartCorrect) {

feedbackHtml += `<div class="feedback-subsection" style="flex: none; width: 100%;"><h6>Correct Answer</h6><div class="diff-container">${parseAndRenderMedia(correctAnswerText)}</div></div>`;

} else {

const diffParts = getDiffParts(userAnswerText, correctAnswerText.trim());

const hasDifferences = diffParts.some(p => p.type !== 'common');

const myAnswerBlock = `<div class="feedback-subsection"><h6>MY ANSWER</h6><div class="diff-container">${escapeHtml(userAnswerText)}</div></div>`;

let analysisBlock = `<div class="feedback-subsection"><h6>ANALYSIS</h6>`;

if (hasDifferences) {

const userAnalysisHtml = diffParts.map(part => part.type === 'removed' ? '' : `<span class="diff-${part.type}">${escapeHtml(part.value)}</span>`).join('');

const correctAnalysisHtml = diffParts.map(part => part.type === 'added' ? '' : `<span class="diff-${part.type}">${escapeHtml(part.value)}</span>`).join('');

analysisBlock += `<div class="diff-analysis-section"><div class="diff-container">${userAnalysisHtml}</div></div>

<div class="diff-analysis-section"><div class="diff-container">${correctAnalysisHtml}</div></div>`;

}

analysisBlock += '</div>';

  

const correctAnswerBlock = `<div class="feedback-subsection"><h6>CORRECT ANSWER</h6><div class="diff-container">${parseAndRenderMedia(correctAnswerText)}</div></div>`;

  

feedbackHtml += `<div class="feedback-columns-container">

${myAnswerBlock}

${analysisBlock}

${correctAnswerBlock}

</div>`;

}

optionsHTML += `<div class="feedback-details">${feedbackHtml}</div>`;

});

}

else if (q.type === 'ordering') {

const userOrder = userResponse.answer || [];

const correctOrder = q.correctAnswers;

const findItemById = (id) => q.allOptions.find(opt => opt.id === id) || { id: id, text: id };

  

let itemsToDisplay = (skipped || userOrder.length === 0) ? correctOrder.map(findItemById) : userOrder.map(findItemById);

  

optionsHTML += `<div id="draggable-list" class="draggable-list evaluated">`;

itemsToDisplay.forEach((item, index) => {

const correctPositionIndex = correctOrder.indexOf(item.id);

const displayPosition = (correctPositionIndex > -1) ? (correctPositionIndex + 1) : "X";

let feedbackClass = 'feedback-incorrect';

if (skipped) { feedbackClass = 'feedback-idk'; }

else if (correctOrder[index] === item.id) { feedbackClass = 'feedback-correct'; }

const explanation = q.explanations.get(item.id);

  

optionsHTML += `<div class="draggable-item evaluated"><div class="draggable-item-content ${feedbackClass}"><span class="order-number">${displayPosition}.</span><span class="item-text">${parseAndRenderMedia(item.text)}</span></div>`;

if(explanation) { optionsHTML += `<div class="inline-explanation ${feedbackClass}">${parseAndRenderMedia(explanation)}</div>`; }

optionsHTML += `</div>`;

});

optionsHTML += `</div>`;

}

else if (q.type === 'sentence-formation') {

const userWords = userResponse.answer || [];

if (!skipped) {

const responseAreaClass = isCorrect ? 'feedback-correct' : 'feedback-incorrect';

optionsHTML += `<div class="sentence-response-area evaluated ${responseAreaClass}">`;

if (userWords.length > 0) {

userWords.forEach(w => { optionsHTML += `<button type="button" class="sentence-word-button" disabled>${escapeHtml(w)}</button>`; });

} else {

optionsHTML += `<span style="font-style: normal; opacity: 0.7;">No sentence was formed.</span>`;

}

optionsHTML += `</div>`;

}

if (!isCorrect || skipped) {

const correctSentence = q.correctAnswers.join(' ');

optionsHTML += `<p style="font-size:0.9rem; margin-top:1.25rem;">Correct sentence:</p><div class="sentence-response-area evaluated" style="margin-top:0.5rem; display: block; text-align: left; padding: 1rem;">${escapeHtml(correctSentence)}</div>`;

}

}

else if (q.type === 'single-choice' || q.type === 'multiple-choice') {

const userAnswer = Array.isArray(userResponse.answer) ? userResponse.answer : (userResponse.answer ? [userResponse.answer] : []);

const correctAnswersSet = new Set(q.correctAnswers);

let allOptionsToRender = q.allOptions;

const shuffledOrder = sessionStorage.getItem('ankiQuizShuffledOptions');

if (shuffledOrder) { try { const order = JSON.parse(shuffledOrder); allOptionsToRender.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)); } catch(e) {} }

allOptionsToRender.forEach(option => {

const isCorrectOpt = correctAnswersSet.has(option.id);

const isSelectedByUser = userAnswer.includes(option.id);

let explanation = q.explanations.get(option.id);

let labelClasses = 'option-label evaluated';

if (skipped) { labelClasses += ' feedback-idk'; }

else {

if (isCorrectOpt) { labelClasses += ' feedback-correct'; }

if (isSelectedByUser) {

labelClasses += ' user-selected';

if (!isCorrectOpt) { labelClasses += ' feedback-incorrect'; }

}

}

  

let inputType = q.type === 'single-choice' ? 'radio' : 'checkbox';

optionsHTML += `<div class="option-container"><label class="${labelClasses}"><input type="${inputType}" name="q-option-back" class="styled-input" disabled ${isSelectedByUser ? 'checked' : ''}><div class="option-text">${parseAndRenderMedia(option.text)}</div></label>`;

if (explanation) {

let explanationClass = '';

if (skipped) { explanationClass = 'feedback-idk'; }

else if (isSelectedByUser && !isCorrectOpt) { explanationClass = 'feedback-incorrect'; }

else if (isCorrectOpt) { explanationClass = 'feedback-correct'; }

optionsHTML += `<div class="inline-explanation ${explanationClass}">${parseAndRenderMedia(explanation)}</div>`;

}

optionsHTML += `</div>`;

});

}

optionsHTML += '</div>';

let feedbackText = '';

if (evaluation.skipped && evaluation.isCorrect) { feedbackText = ''; }

else if (skipped) { feedbackText = '<strong>Didn\'t Know.</strong> Time to review!'; }

else if (isCorrect) {

if (q.type !== 'basic') {

feedbackText = '<strong>Correct!</strong>';

}

}

else { feedbackText = '<strong>Incorrect.</strong>'; }

const feedbackCard = feedbackText ? `<div class="feedback-per-question ${skipped ? 'idk' : (isCorrect ? 'correct' : 'incorrect')}">${feedbackText}</div>` : '';

let generalExplanationHTML = '';

if (q.generalExplanation) {

generalExplanationHTML = `

<div class="explanation-content visible">

<h4>Explanation</h4>

<div>${parseAndRenderMedia(q.generalExplanation)}</div>

</div>

`;

}

  

let hintsHTML = '';

if (q.pistas && q.pistas.length > 0) {

hintsHTML = `<div class="hint-section-main" style="margin-top: 1.5rem;">` + q.pistas.map(pista => { const title = pista.split('<br>')[0]; const content = pista.includes('<br>') ? pista.substring(pista.indexOf('<br>') + 4) : 'This hint has no additional content.'; return `<div class="individual-hint-item"><button type="button" class="toggle-individual-hint-button" aria-expanded="true" style="cursor: default;"><span class="hint-title-display">${parseAndRenderMedia(title)}</span><span class="individual-arrow" style="transform: rotate(180deg);">▼</span></button><div class="hint-content-wrapper" style="max-height: 500px;"><div class="p-3-manual"><div class="display-individual-hint">${parseAndRenderMedia(content)}</div></div></div></div>`; }).join('') + `</div>`;

}

  

html += `${mainContentHTML}${optionsHTML}${feedbackCard}${generalExplanationHTML}${hintsHTML}</div>`;

return html;

}

  

/*

============================================================================

SECTION 3: MAIN EXECUTION FLOW AND ERROR HANDLING

============================================================================

Orchestrates the initialization of all back card components,

including cursor handling, sound playback, and

listener setup.

*/

  

try {

const resultContainer = document.getElementById('quiz-result-container');

if (resultContainer) {

const questionData = parseFields();

const userResponseRaw = sessionStorage.getItem('ankiQuizUserAnswer');

const userResponse = userResponseRaw ? JSON.parse(userResponseRaw) : { answer: null, idk: true };

sessionStorage.removeItem('ankiQuizUserAnswer');

const evaluation = evaluateAnswer(questionData, userResponse);

resultContainer.innerHTML = buildResultHTML(questionData, userResponse, evaluation);

// Initializes the back's media elements.

upgradeStandardMedia('#quiz-result-container');

initializeAllCustomMediaPlayers();

styleAnkiImages('#quiz-result-container');

  

// --- START: Persistent cursor logic (Original from source code) ---

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

cursorIdleTimeout = setTimeout(() => {

if (sessionStorage.getItem(CURSOR_STATE_KEY) === 'true') { hideCursor(); }

}, 100);

} else {

cursorIdleTimeout = setTimeout(hideCursor, 2500);

}

})();

// --- END: Persistent cursor logic (Original from source code) ---

  

// Condition for playing feedback sound.
let shouldPlaySound = !(evaluation.skipped && evaluation.isCorrect);

// Sound ONLY plays for non-'basic' cards.
if(questionData.type !== 'basic' && shouldPlaySound) {
    playSound(evaluation.isCorrect, evaluation.skipped);
}

// The timer starts for ALL card types, and we pass the question type to it.
startBackTimer(evaluation, questionData.type);

// Attaches listeners to the buttons.
attachButtonListeners();

}

} catch (e) {

// Error handling in case of execution failure.

const container = document.getElementById('quiz-result-container');

if(container) container.innerHTML = `<div class='styled-card' style='color:red;'><strong>Back Error:</strong> ${e.message}<br><pre>${e.stack}</pre></div>`;

}

})();
