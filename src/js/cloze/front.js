
// --- UNIFIED CLOZE AND QUIZ SCRIPT ---

  

// Main function that orchestrates the initialization of the front card.

function runAnkiTemplate() {

// Reference to the main quiz container.

const mainContainer = document.querySelector('.main-quiz-container');

// Prevents double initialization of the card if it has already been processed.

if (mainContainer.hasAttribute('data-quiz-initialized')) {

return;

}

mainContainer.setAttribute('data-quiz-initialized', 'true');

  

try {

// Auxiliary function to get the innerHTML of an element by its ID.

const get = id => document.getElementById(id)?.innerHTML || '';

  

// Parses Anki tags to detect quiz type and thematic tags.

const rawTagsString = get('anki-field-tags') || '';

const allTags = rawTagsString.split(/\s+/).map(t => t.trim()).filter(Boolean);

// Known quiz types mapped to their short tags.

const knownQuizTypes = { 'f': 'sentence-formation', 'r': 'matching', 'o': 'ordering', 'sc': 'single-choice', 'mc': 'multiple-choice', 'ae': 'exact-answer', 'b': 'basic' };

let detectedQuizType = 'basic'; // Default type if no specific tag is found.

for (const tag of allTags) {

const normalizedTag = tag.toLowerCase();

if (knownQuizTypes[normalizedTag]) {

detectedQuizType = knownQuizTypes[normalizedTag];

break; // Once the type is detected, exit the loop.

}

}

  

/*

----------------------------------------------------------------------------

2.1. MEDIA PLAYERS MODULE

----------------------------------------------------------------------------

Defines functions to generate and initialize custom audio

and video players, including their control logic and event handling.

The getCustomPlayerHTML and parseAndRenderMedia functions are usually

minified for performance optimization, so they are kept on a single

line without additional formatting, indicating their content is critical.

*/

  

// Generates the HTML structure for a custom audio player.

function getCustomAudioPlayerHTML(src) {

return `<div class="custom-audio-player"> <audio class="custom-audio-element" src="${src}" preload="metadata"></audio> <button class="play-pause-btn"> <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98c-.67-.43-1.54.05-1.54.84z"></path></svg> <svg class="pause-icon" style="display: none;" viewBox="0 0 24 24" fill="currentColor"><path d="M7 19c0 .55.45 1 1 1h2c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1H8c-.55 0-1 .45-1 1v14zm7-14v14c0 .55.45 1 1 1h2c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1z"></path></svg> </button> <div class="main-controls-wrapper"> <div class="progress-time-container"> <div class="progress-bar-container"> <div class="loop-range-indicator"></div> <div class="mark-indicator mark-a-indicator"></div> <div class="mark-indicator mark-b-indicator"></div> <div class="progress-bar-fill"></div> </div> <div class="time-display"> <span class="current-time">0:00</span> / <span class="duration">0:00</span> </div> </div> <div class="secondary-controls"> <div class="speed-controls"> <button class="control-btn speed-down-btn" title="Decrease speed"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"></path></svg></button> <span class="speed-display">1.0x</span> <button class="control-btn speed-up-btn" title="Increase speed"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"></path></svg></button> </div> <div class="loop-controls"> <button class="control-btn mark-a-btn" title="Mark start point (A)">A</button> <button class="control-btn mark-b-btn" title="Mark end point (B)">B</button> <button class="control-btn loop-btn" title="Activate/deactivate A-B loop" disabled><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"></path></svg></button> </div> <div class="volume-container"> <button class="volume-btn"><svg class="volume-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"></path></svg><svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1z"/></svg></button> <div class="volume-slider-container"><div class="volume-slider-fill"></div></div> </div> </div> </div> </div>`;

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

case 'mp3': case 'wav': case 'ogg': mediaHtml = getCustomAudioPlayerHTML(sanitizedFilename); break;

case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': case 'svg': mediaHtml = `<img class="embedded-media" src="${sanitizedFilename}" alt="Image: ${filename}">`; break;

case 'mp4': case 'webm': mediaHtml = getCustomVideoPlayerHTML(sanitizedFilename); break;

default: return match;

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

  

// References to the internal DOM elements of the player.

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

  

// State variables for loop functionality.

let t = null; // mark A time

let u = null; // mark B time

let v = !1; // is looping active

  

// Available playback speeds and the index of the current speed.

const playbackSpeeds = [0.25, .5, .75, 1, 1.25, 1.5, 1.75, 2];

let currentSpeedIndex = 3; // Default to 1.0x

  

// Flags to control progress bar and volume dragging.

let isDraggingProgressBar = false;

let wasPlayingOnDragStart = false;

let isDraggingVolume = false;

  

// Auxiliary function to format seconds to a time format (MM:SS).

const formatTime = z => {

if (isNaN(z)) return "0:00";

const A = Math.floor(z / 60);

const B = Math.floor(z % 60);

return `${A}:${B < 10 ? "0" : ""}${B}`;

};

  

// Updates the UI for marks A and B and the loop range.

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

  

/* Event Listeners for the audio element */

a.addEventListener('loadedmetadata', () => {

f.textContent = formatTime(a.duration);

updateMarksUI()

});

a.addEventListener('timeupdate', () => {

e.textContent = formatTime(a.currentTime);

if (!isDraggingProgressBar) d.style.width = `${a.currentTime / a.duration * 100}%`;

v && u !== null && t !== null && a.currentTime >= u && (a.currentTime = t)

});

a.addEventListener('play', () => p.classList.add('playing'));

a.addEventListener('pause', () => p.classList.remove('playing'));

a.addEventListener('ended', () => p.classList.remove('playing'));

  

// Listener for the Play/Pause button.

b.addEventListener('click', () => a.paused ? a.play() : a.pause());

  

/* Progress bar dragging logic */

function updateProgressBarTime(e) {

const rect = c.getBoundingClientRect();

let clickX = e.clientX - rect.left;

clickX = Math.max(0, Math.min(clickX, rect.width));

const newTime = (clickX / rect.width) * a.duration;

a.currentTime = newTime;

d.style.width = `${(newTime / a.duration) * 100}%`;

e.textContent = formatTime(newTime);

}

const handleProgressBarDrag = (e) => {

if (isDraggingProgressBar) {

updateProgressBarTime(e);

}

};

const handleProgressBarEnd = () => {

if (isDraggingProgressBar) {

isDraggingProgressBar = false;

document.removeEventListener('mousemove', handleProgressBarDrag);

document.removeEventListener('mouseup', handleProgressBarEnd);

if (wasPlayingOnDragStart) {

a.play();

}

}

};

c.addEventListener('mousedown', (e) => {

isDraggingProgressBar = true;

wasPlayingOnDragStart = !a.paused;

if (wasPlayingOnDragStart) {

a.pause();

}

updateProgressBarTime(e);

document.addEventListener('mousemove', handleProgressBarDrag);

document.addEventListener('mouseup', handleProgressBarEnd);

});

  

/* Speed controls */

h.addEventListener('click', () => {

if (currentSpeedIndex < playbackSpeeds.length - 1) {

currentSpeedIndex++;

a.playbackRate = playbackSpeeds[currentSpeedIndex];

i.textContent = `${playbackSpeeds[currentSpeedIndex].toFixed(2)}x`

}

});

g.addEventListener('click', () => {

if (currentSpeedIndex > 0) {

currentSpeedIndex--;

a.playbackRate = playbackSpeeds[currentSpeedIndex];

i.textContent = `${playbackSpeeds[currentSpeedIndex].toFixed(2)}x`

}

});

  

/* A and B mark controls for loop */

j.addEventListener('click', () => {

t = a.currentTime;

j.classList.add('active');

if (u !== null && t >= u) u = null;

updateMarksUI()

});

k.addEventListener('click', () => {

u = a.currentTime;

k.classList.add('active');

if (t !== null && u <= t) t = null;

updateMarksUI()

});

l.addEventListener('click', () => {

v = !v;

l.classList.toggle('active', v);

v || (t = u = null, l.disabled = !0, j.classList.remove('active'), k.classList.remove('active'), updateMarksUI())

});

  

/* Volume dragging and control logic */

function handleVolumeUpdate(e) {

const rect = n.getBoundingClientRect();

let clickX = e.clientX - rect.left;

clickX = Math.max(0, Math.min(clickX, rect.width));

const newVolume = clickX / rect.width;

a.muted = false;

a.volume = newVolume;

}

const handleVolumeDrag = (e) => {

if (isDraggingVolume) handleVolumeUpdate(e);

};

const handleVolumeEnd = () => {

if (isDraggingVolume) {

isDraggingVolume = false;

document.removeEventListener('mousemove', handleVolumeDrag);

document.removeEventListener('mouseup', handleVolumeEnd);

}

};

n.addEventListener('mousedown', (e) => {

isDraggingVolume = true;

handleVolumeUpdate(e);

document.addEventListener('mousemove', handleVolumeDrag);

document.addEventListener('mouseup', handleVolumeEnd);

});

  

m.addEventListener('click', () => a.muted = !a.muted);

a.addEventListener('volumechange', () => {

o.style.width = a.muted ? "0%" : `${a.volume * 100}%`;

p.querySelector('.volume-icon').style.display = a.muted || a.volume === 0 ? 'none' : 'block';

p.querySelector('.mute-icon').style.display = a.muted || a.volume === 0 ? 'block' : 'none';

});

  

p.classList.add('initialized');

}

  

// Initializes a custom video player, handling its control logic.

function initializeCustomVideoPlayer(playerContainer) {

// References to the internal DOM elements of the player.

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

  

const speedDownBtn = speedControlsGroup.querySelector('.speed-down-btn');

const speedUpBtn = speedControlsGroup.querySelector('.speed-up-btn');

const speedDisplay = speedControlsGroup.querySelector('.speed-display');

const markABtn = loopControlsGroup.querySelector('.mark-a-btn');

const markBBtn = loopControlsGroup.querySelector('.mark-b-btn');

const loopBtn = loopControlsGroup.querySelector('.loop-btn');

const volumeBtn = volumeContainer.querySelector('.volume-btn');

const volumeSliderContainer = volumeContainer.querySelector('.volume-slider-container');

const volumeSliderFill = volumeContainer.querySelector('.volume-slider-fill');

  

const markAIndicator = playerContainer.querySelector('.mark-a-indicator');

const markBIndicator = playerContainer.querySelector('.mark-b-indicator');

const loopRangeIndicator = playerContainer.querySelector('.loop-range-indicator');

  

const moreOptionsBtn = playerContainer.querySelector('.more-options-btn');

const moreOptionsMenu = playerContainer.querySelector('.more-options-menu');

const leftControls = playerContainer.querySelector('.left-controls');

const middleControls = playerContainer.querySelector('.middle-controls');

const rightControls = playerContainer.querySelector('.right-controls');

  

// State variables for functionality.

let controlsTimeout;

const playbackSpeeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

let currentSpeedIndex = 3;

let markA = null;

let markB = null;

let isLooping = false;

let isDraggingProgressBar = false;

let wasPlayingOnDragStart = false;

let isDraggingVolume = false;

  

/* Control visibility logic */

const showControls = () => {

playerContainer.classList.add('controls-visible');

clearTimeout(controlsTimeout);

};

const hideControls = () => {

if (video.paused || moreOptionsMenu.classList.contains('active')) return;

playerContainer.classList.remove('controls-visible');

};

const startHideTimer = () => {

if (video.paused) return;

clearTimeout(controlsTimeout);

controlsTimeout = setTimeout(hideControls, 2500);

};

  

/* Event Listeners for control visibility */

playerContainer.addEventListener('mousemove', () => { showControls(); startHideTimer(); });

playerContainer.addEventListener('mouseleave', hideControls);

  

/* Utility functions */

function formatTime(seconds) {

const minutes = Math.floor(seconds / 60);

const secs = Math.floor(seconds % 60);

return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;

}

  

function updateIcons() {

const isPaused = video.paused;

playerContainer.querySelector('.play-icon').style.display = isPaused ? 'block' : 'none';

playerContainer.querySelector('.pause-icon').style.display = isPaused ? 'none' : 'block';

const isMuted = video.muted || video.volume === 0;

volumeContainer.querySelector('.volume-icon').style.display = isMuted ? 'none' : 'block';

volumeContainer.querySelector('.mute-icon').style.display = isMuted ? 'block' : 'none';

const isFullscreen = !!document.fullscreenElement;

playerContainer.querySelector('.fullscreen-open-icon').style.display = isFullscreen ? 'none' : 'block';

playerContainer.querySelector('.fullscreen-close-icon').style.display = isFullscreen ? 'block' : 'none';

}

  

function togglePlay() { video.paused ? video.play() : video.pause(); }

  

/* Event Listeners for the video element */

video.addEventListener('play', () => {

playerContainer.classList.add('playing');

video.playbackRate = playbackSpeeds[currentSpeedIndex];

startHideTimer();

updateIcons();

});

video.addEventListener('pause', () => {

playerContainer.classList.remove('playing');

showControls();

updateIcons();

});

video.addEventListener('loadedmetadata', () => {

durationEl.textContent = formatTime(video.duration);

updateMarksUI()

});

video.addEventListener('timeupdate', () => {

progressBarFill.style.width = `${(video.currentTime / video.duration) * 100}%`;

currentTimeEl.textContent = formatTime(video.currentTime);

if (isLooping && markA !== null && markB !== null && video.currentTime >= markB) {

video.currentTime = markA;

}

});

video.addEventListener('ended', () => {

if (isLooping && markA !== null) {

video.currentTime = markA;

video.play();

} else {

playerContainer.classList.remove('playing');

video.currentTime = 0;

}

});

video.addEventListener('progress', () => {

if (video.buffered.length > 0) {

const bufferedEnd = video.buffered.end(video.buffered.length - 1);

progressBarBuffered.style.width = `${(bufferedEnd / video.duration) * 100}%`;

}

});

  

/* Playback control with clicks */

overlay.addEventListener('click', togglePlay);

video.addEventListener('click', togglePlay);

playPauseBtnSmall.addEventListener('click', togglePlay);

  

/* Progress bar dragging logic */

function updateProgressBarTime(e) {

const rect = progressBarContainer.getBoundingClientRect();

let clickX = e.clientX - rect.left;

clickX = Math.max(0, Math.min(clickX, rect.width));

const newTime = (clickX / rect.width) * video.duration;

video.currentTime = newTime;

progressBarFill.style.width = `${(newTime / video.duration) * 100}%`;

currentTimeEl.textContent = formatTime(newTime);

}

const handleProgressBarDrag = (e) => {

if (isDraggingProgressBar) {

updateProgressBarTime(e);

}

};

const handleProgressBarEnd = () => {

if (isDraggingProgressBar) {

isDraggingProgressBar = false;

document.removeEventListener('mousemove', handleProgressBarDrag);

document.removeEventListener('mouseup', handleProgressBarEnd);

if (wasPlayingOnDragStart) {

video.play();

}

}

};

progressBarContainer.addEventListener('mousedown', (e) => {

isDraggingProgressBar = true;

wasPlayingOnDragStart = !video.paused;

if (wasPlayingOnDragStart) {

video.pause();

}

updateProgressBarTime(e);

document.addEventListener('mousemove', handleProgressBarDrag);

document.addEventListener('mouseup', handleProgressBarEnd);

});

  

/* Speed controls */

function updateSpeed() {

const newSpeed = playbackSpeeds[currentSpeedIndex];

video.playbackRate = newSpeed;

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

  

/* A and B mark controls for loop */

function updateMarksUI() {

const duration = video.duration;

if (isNaN(duration)) return;

markAIndicator.style.display = markA !== null ? 'block' : 'none';

if (markA !== null) markAIndicator.style.left = `${(markA / duration) * 100}%`;

markBIndicator.style.display = markB !== null ? 'block' : 'none';

if (markB !== null) markBIndicator.style.left = `${(markB / duration) * 100}%`;

if (markA !== null && markB !== null) {

loopRangeIndicator.style.left = `${(markA / duration) * 100}%`;

loopRangeIndicator.style.width = `${((markB - markA) / duration) * 100}%`;

loopRangeIndicator.style.display = 'block';

loopBtn.disabled = false;

} else {

loopRangeIndicator.style.display = 'none';

loopBtn.disabled = true;

if (isLooping) {

isLooping = false;

loopBtn.classList.remove('active');

}

}

}

markABtn.addEventListener('click', () => {

markA = video.currentTime;

if (markB !== null && markA >= markB) markB = null;

updateMarksUI();

});

markBBtn.addEventListener('click', () => {

markB = video.currentTime;

if (markA !== null && markB <= markA) markA = null;

updateMarksUI();

});

loopBtn.addEventListener('click', () => {

isLooping = !isLooping;

loopBtn.classList.toggle('active', isLooping);

});

  

/* Volume dragging and control logic */

function updateVolumeUI() {

volumeSliderFill.style.width = `${video.muted ? 0 : video.volume * 100}%`;

updateIcons();

}

volumeBtn.addEventListener('click', () => {

video.muted = !video.muted;

updateVolumeUI();

});

const handleVolumeUpdate = (e) => {

const rect = volumeSliderContainer.getBoundingClientRect();

let clickX = e.clientX - rect.left;

clickX = Math.max(0, Math.min(clickX, rect.width));

const newVolume = clickX / rect.width;

video.muted = false;

video.volume = newVolume;

updateVolumeUI();

};

const handleVolumeDrag = (e) => {

if (isDraggingVolume) {

handleVolumeUpdate(e);

}

};

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

video.addEventListener('volumechange', updateVolumeUI);

  

/* Fullscreen logic */

function toggleFullscreen() {

if (!document.fullscreenElement) {

playerContainer.requestFullscreen().catch(err => console.error(err));

} else {

document.exitFullscreen();

}

}

fullscreenBtn.addEventListener('click', toggleFullscreen);

video.addEventListener('dblclick', toggleFullscreen);

document.addEventListener('fullscreenchange', updateIcons);

  

/* Responsive layout and "More Options" menu logic */

const handleResponsiveLayout = (width) => {

if (width < 650 && !moreOptionsMenu.contains(speedControlsGroup)) {

moreOptionsMenu.prepend(speedControlsGroup);

} else if (width >= 650 && moreOptionsMenu.contains(speedControlsGroup)) {

rightControls.prepend(speedControlsGroup);

}

if (width < 520 && !moreOptionsMenu.contains(loopControlsGroup)) {

moreOptionsMenu.prepend(loopControlsGroup);

} else if (width >= 520 && moreOptionsMenu.contains(loopControlsGroup)) {

middleControls.appendChild(loopControlsGroup);

}

if (width < 420 && !moreOptionsMenu.contains(volumeContainer)) {

moreOptionsMenu.prepend(volumeContainer);

} else if (width >= 420 && moreOptionsMenu.contains(volumeContainer)) {

leftControls.appendChild(volumeContainer);

}

if (moreOptionsMenu.children.length > 0) {

moreOptionsBtn.style.display = 'flex';

} else {

moreOptionsBtn.style.display = 'none';

moreOptionsMenu.classList.remove('active');

}

};

const resizeObserver = new ResizeObserver(entries => {

for (let entry of entries) {

handleResponsiveLayout(entry.contentRect.width);

}

});

resizeObserver.observe(playerContainer);

moreOptionsBtn.addEventListener('click', (e) => {

e.stopPropagation();

const playerRect = playerContainer.getBoundingClientRect();

const btnRect = moreOptionsBtn.getBoundingClientRect();

const availableSpace = btnRect.top - playerRect.top;

moreOptionsMenu.style.maxHeight = `${availableSpace - 20}px`;

moreOptionsMenu.classList.toggle('active');

if (moreOptionsMenu.classList.contains('active')) {

showControls();

}

});

document.addEventListener('click', (e) => {

if (!moreOptionsMenu.contains(e.target) && e.target !== moreOptionsBtn && !moreOptionsBtn.contains(e.target)) {

moreOptionsMenu.classList.remove('active');

}

});

  

/* Initial controls re-assembly */

leftControls.appendChild(volumeContainer);

middleControls.appendChild(loopControlsGroup);

rightControls.prepend(speedControlsGroup);

  

/* Initialization calls */

handleResponsiveLayout(playerContainer.clientWidth);

updateSpeed();

updateVolumeUI();

updateIcons();

}

  

// Applies specific CSS classes to Anki `<img>` tags for visual consistency with other media.

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

2.2. CLOZE AND QUIZ LOGIC MODULE

----------------------------------------------------------------------------

Manages the processing of cloze fields, the detection of the current card

number and quiz type, and the dynamic construction of the HTML

for the question and its options.

*/

  

// Gets the main question text, options, and answer.

const mainQuestionText = get('anki-field-pregunta');

const optionsSource = get('anki-field-opciones');

const answerSource = get('anki-field-respuesta_correcta');

const hintsSource = get('anki-field-pistas');

  

// Determines the current cloze number (card ordinal) for the card.

const getCardNumber = () => { try { return AnkiDroidJS.getCardOrdinal() + 1; } catch (e) {} const m = document.body.className.match(/(^|\s)card(\d+)(\s|$)/); return m ? parseInt(m[2], 10) : 1; };

const currentClozeNum = getCardNumber();

// Regular expression to identify cloze fields in the format.

const clozeRegex = /\{\{c(\d+)::([\s\S]*?)(::([\s\S]*?))?\}\}/g;

  

// Finds all cloze matches in the answer field to determine the maximum cloze.

const allClozeMatches = Array.from((answerSource || '').matchAll(new RegExp(clozeRegex.source, 'g')));

let maxClozeNum = 0;

allClozeMatches.forEach(m => maxClozeNum = Math.max(maxClozeNum, parseInt(m[1])));

// Identifies the last cloze match, which may be a review cloze for "all" clozes.

const lastClozeMatch = allClozeMatches.length > 0 ? allClozeMatches.find(m => parseInt(m[1]) === maxClozeNum) : null;

  

// Determines if a review cloze (closing all clozes) exists

// and if the current card is the final review card.

const hasReviewCloze = lastClozeMatch && lastClozeMatch[2].trim() === '';

const isReviewAllCard = hasReviewCloze && currentClozeNum === maxClozeNum;

  

let quizTypeForCard = detectedQuizType;

// Adjusts the quiz type for the current card based on the presence

// of the review cloze and the detected quiz type.

if (hasReviewCloze && ['ordering', 'sentence-formation'].includes(detectedQuizType)) {

quizTypeForCard = detectedQuizType; // Maintains the type if it is "ordering" or "sentence-formation".

} else if (hasReviewCloze && ['exact-answer'].includes(detectedQuizType)) {

// If it's "exact-answer" and there's a review cloze, but it's not the final card,

// it remains "exact-answer" so that each cloze is resolved individually.

if (!isReviewAllCard) {

quizTypeForCard = 'exact-answer';

}

}

  

  

// --- THIRD-PARTY CODE ATTRIBUTION ---

// The following function `processFieldForCloze` is an adaptation and refactoring

// of the original work "Simple Cloze Overlapper" by Michal Rus, licensed

// under Apache 2.0. It has been integrated into this broader quiz system.

// Full attribution and original license details can be found in the NOTICE file distributed with this template.Original repository: https://github.com/michalrus/anki-simple-cloze-overlapper

// --- END OF ATTRIBUTION ---

  

  

// Processes the content of a field (question/answer) to display

// cloze placeholders or actual content based on the current cloze number.

function processFieldForCloze(fieldContent, isOverlapper = false) {

if (!fieldContent) return '';

const localRegex = new RegExp(clozeRegex.source, 'g');

return fieldContent.replace(localRegex, (match, clozeNumStr, content, _, placeholder) => {

const clozeNum = parseInt(clozeNumStr);

placeholder = placeholder || "..."; // Default value for the placeholder.

  

if (isReviewAllCard) {

// If it's the final review card, shows previous clozes as active,

// and the final (review) cloze is hidden.

if (clozeNum < maxClozeNum) return `<span class="cloze-placeholder-active">[${placeholder}]</span>`;

return ''; // Hides the current review cloze.

} else {

// If it's a normal cloze card (not final review).

if (clozeNum === currentClozeNum) return `<span class="cloze-placeholder-active">[${placeholder}]</span>`;

  

// --- START OF FIX (Original from source code) ---

// If a final review cloze exists and we are processing THAT cloze (but it's not its turn),

// we hide it by returning an empty string instead of a placeholder.

// This prevents the final review cloze from showing as a placeholder on intermediate cards.

if (hasReviewCloze && clozeNum === maxClozeNum) {

return '';

}

// --- END OF FIX (Original from source code) ---

  

// Displays the cloze content if it's an "overlapper"

// or an inactive placeholder for other clozes.

return isOverlapper ? content : `<span class="cloze-placeholder-inactive">[${placeholder}]</span>`;

}

});

}

  

let userAnswer = null; // Stores the user's answer.

let timerEndListener = null; // Listener for the timer end event.

let timerBarElement = null; // DOM element of the timer bar.

  

/*

----------------------------------------------------------------------------

2.3. CENTRAL UTILITIES

----------------------------------------------------------------------------

General-purpose functions that support the quiz operation,

including timer management, array shuffling, and interaction with Anki.

*/

  

// Shuffles the elements of an array, creating a copy.

const shuffleArray = (a) => { const n=[...a]; for(let i=n.length-1; i>0; i--){ const j=Math.floor(Math.random()*(i+1)); [n[i],n[j]]=[n[j],n[i]]; } return n; };

// Function to show the card answer in Anki.

function ankiShowAnswer() { if(typeof pycmd!=="undefined"){pycmd("ans");}else{try{showAnswer();}catch(e){}} }

  

// Stores the user's answer and flips the card.

function storeAnswerAndFlip(isIdk = false) {

// Stops and clears the timer.

if (timerBarElement && timerEndListener) {

timerBarElement.style.transition = 'none';

timerBarElement.removeEventListener('transitionend', timerEndListener);

timerEndListener = null;

}

// Saves the answer in sessionStorage so the back can access it.

sessionStorage.setItem('ankiQuizUserAnswer', JSON.stringify({ answer: userAnswer, idk: isIdk }));

setTimeout(ankiShowAnswer, 50); // Calls Anki's function to flip the card.

}

  

// Sets up and activates the timer bar.

function setupTimer() {

timerBarElement = document.getElementById('timer-bar');

if (!timerBarElement) return; // Exits if the element does not exist.

if (timerEndListener) timerBarElement.removeEventListener('transitionend', timerEndListener); // Clears previous listener.

  

const timerDuration = 10; // Timer duration in seconds.

// Defines the action at the end of the timer (flip card as "I don't know").

timerEndListener = () => { if (document.getElementById('quiz-container-anki-front')) storeAnswerAndFlip(false); };

timerBarElement.addEventListener('transitionend', timerEndListener);

  

// Resets the bar to 100% width without transition.

timerBarElement.style.transition = 'none';

timerBarElement.style.width = '100%';

// Small delay to ensure visual reset before starting the animation.

setTimeout(() => {

if (!timerBarElement) return;

timerBarElement.style.transition = `width ${timerDuration}s linear`;

timerBarElement.style.width = '0%'; // Starts the reduction animation.

}, 10);

}

  

setupTimer(); // Calls the timer setup function.

  

/*

----------------------------------------------------------------------------

2.4. HTML CONSTRUCTION AND RENDERING

----------------------------------------------------------------------------

Generates the HTML markup of the front quiz dynamically, injecting the

question, options, and input fields according to the cloze quiz type.

*/

  

// Filters thematic tags (not quiz type tags).

const thematicTags = allTags.filter(t => !knownQuizTypes[t.toLowerCase()]);

const q = { type: quizTypeForCard, tags: thematicTags }; // Question data object.

// Generates HTML for visible tags on the card.

const tagsHTML = `<div class="question-tags-container">${q.tags.map(tag => `<span class="tag-badge">${tag.replace(/_/g, ' ')}</span>`).join('')}</div>`;

let html = `<div id="q-card" class="question-card-item styled-card"><div class="question-card-header">${tagsHTML}</div>`;

  

// Auxiliary function to parse option IDs and text.

const parseIdAndText = s => {

const t = s.trim(); if (!t) return null;

const m = t.match(/^([a-zA-Z0-9_.-]+)[.)]\s*(.+)/s);

if (m && m[2]) {

return { id: m[1].trim(), text: m[2].trim() };

}

return { id: t, text: t };

};

  

// Rendering logic based on cloze quiz type.

if (q.type === 'matching') {

// Renders the main question.

html += `<div class="question-text">${parseAndRenderMedia(mainQuestionText)}</div>`;

html += `<div id="options-box">`;

  

// Processes left and right options.

const leftItemsAll = (answerSource || '').split('|').map(parseIdAndText).filter(Boolean);

const rightItemsAll = (optionsSource || '').split('|').map(parseIdAndText).filter(Boolean);

// Filters left elements corresponding to the current cloze.

const leftItemsForThisCard = leftItemsAll.filter(item => new RegExp(`\\{\\{c${currentClozeNum}::`).test(item.text));

  

if (leftItemsForThisCard.length > 0) {

const shuffledRightOptions = shuffleArray(rightItemsAll);

leftItemsForThisCard.forEach(leftItem => {

// Processes the left text to display the current cloze.

const processedLeftText = processFieldForCloze(leftItem.text, true);

html += `<div class="matching-row" data-left-id="${leftItem.id}"><div class="matching-row-content"><div class="matching-row-left">${parseAndRenderMedia(processedLeftText)}</div><div class="matching-row-right"><select class="styled-select"><option value="">-- Select --</option>${shuffledRightOptions.map(r => `<option value="${r.id}">${parseAndRenderMedia(r.text)}</option>`).join('')}</select></div></div></div>`;

});

} else if (detectedQuizType === 'matching') {

// If there are no matching elements for this cloze, display a message and flip the card.

html += `<p>This card has no elements to match.</p>`;

setTimeout(() => ankiShowAnswer(), 1000);

}

} else {

// For other quiz types (sentence-formation, ordering, exact-answer, etc.).

// Renders the main question and the processed answer field with clozes.

html += `<div class="question-text">${mainQuestionText ? `<p>${parseAndRenderMedia(mainQuestionText)}</p>` : ''}${parseAndRenderMedia(processFieldForCloze(answerSource, false))}</div>`;

  

html += `<div id="options-box">`;

if (q.type === 'exact-answer') {

// Logic for exact answer questions, including multiple clozes.

const clozeInstances = Array.from((answerSource || '').matchAll(new RegExp(clozeRegex.source, 'g'))).filter(m => parseInt(m[1]) === currentClozeNum);

const isMultiClozeIndividual = !isReviewAllCard && clozeInstances.length > 1;

  

// If it's the final review card or multiple individual clozes, display multiple inputs.

if (isReviewAllCard || isMultiClozeIndividual) {

html += `<div class="re-review-container">`;

const numInputs = isReviewAllCard ? maxClozeNum - 1 : clozeInstances.length;

for (let i = 0; i < numInputs; i++) {

const label = isReviewAllCard ? `Answer for Cloze ${i + 1}` : `Answer for cloze ${i + 1}`;

html += `<div class="re-review-item"><label for="re-input-${i}" class="re-review-label">${label}:</label><textarea id="re-input-${i}" class="styled-textarea re-review-input" rows="2" data-cloze-index="${i}"></textarea></div>`;

}

html += `</div>`;

} else {

// If it's a single exact answer cloze.

html += `<textarea id="exact-answer-input" class="styled-textarea" rows="3" placeholder="Type the hidden answer..."></textarea>`;

}

} else if (q.type === 'sentence-formation') {

// Logic for sentence formation questions.

const clozeMatches = Array.from(answerSource.matchAll(new RegExp(clozeRegex.source, 'g')));

const distractors = (optionsSource || '').split('|').map(o => o.trim()).filter(Boolean);

let correctWords;

  

// Determines the correct words for the bank based on whether it's final review or individual cloze.

if (isReviewAllCard) {

correctWords = clozeMatches.filter(m => parseInt(m[1]) < maxClozeNum).map(m => m[2].trim());

} else {

correctWords = clozeMatches.filter(m => parseInt(m[1]) === currentClozeNum).map(m => m[2].trim());

}

  

// Shuffles correct words with distractors to form the bank.

const wordBank = shuffleArray([...correctWords, ...distractors]);

  

html += `<div id="sentence-response-area" class="sentence-response-area"></div><div id="sentence-word-bank" class="sentence-word-bank">${wordBank.map(w => `<button type="button" class="sentence-word-button" data-word-text="${w}">${parseAndRenderMedia(w)}</button>`).join('')}</div>`;

  

} else if (q.type === 'ordering') {

// Logic for ordering questions.

const clozeMatches = Array.from(answerSource.matchAll(new RegExp(clozeRegex.source, 'g')));

const optionIdMap = new Map();

(optionsSource || '').split('|').map(parseIdAndText).filter(Boolean).forEach(opt => optionIdMap.set(opt.text.toLowerCase(), opt.id));

  

const getMappedId = (text) => optionIdMap.get(text.toLowerCase()) || text;

  

// Determines items to order based on whether it's final review or individual cloze.

const itemsToOrder = (isReviewAllCard)

? clozeMatches.filter(m => parseInt(m[1]) < maxClozeNum).map(m => ({ id: getMappedId(m[2].trim()), text: m[2].trim() }))

: clozeMatches.filter(m => parseInt(m[1]) === currentClozeNum).map(m => ({ id: getMappedId(m[2].trim()), text: m[2].trim() }));

  

// Shuffles items and renders the draggable list.

const shuffledItems = shuffleArray(itemsToOrder);

html += `<div id="draggable-list" class="draggable-list">${shuffledItems.map((opt, i) => `<div class="draggable-item" draggable="true" data-id="${opt.id}"><div class="draggable-item-content"><span class="order-number">${i + 1}.</span><span class="item-text">${parseAndRenderMedia(opt.text)}</span></div></div>`).join('')}</div>`;

} else if (q.type === 'single-choice' || q.type === 'multiple-choice') {

// Logic for single or multiple choice questions.

const allOptions = (optionsSource || '').split('|').map(parseIdAndText).filter(Boolean);

const shuffledOptions = shuffleArray(allOptions);

sessionStorage.setItem('ankiQuizShuffledOptions', JSON.stringify(shuffledOptions.map(opt => opt.id))); // Saves the shuffled order.

  

const inputType = q.type === 'single-choice' ? 'radio' : 'checkbox';

const inputName = q.type === 'single-choice' ? 'sc-quiz-option' : 'mc-quiz-option';

shuffledOptions.forEach((option, index) => {

const optionId = `${inputName}-${index}`;

html += `<div class="option-container">

<label for="${optionId}" class="option-label">

<input type="${inputType}" name="${inputName}" id="${optionId}" class="styled-input" value="${option.id}">

<div class="option-text">${parseAndRenderMedia(option.text)}</div>

</label>

</div>`;

});

}

}

  

html += `</div>`; // Closes #options-box.

  

// Renders the hints section if they exist.

const rawPistas = (hintsSource || "").split('|').map(s => s.trim()).filter(Boolean);

if (rawPistas.length > 0) {

html += `<div class="hint-section-main">${rawPistas.map((pista, idx) => {

const title = pista.split('<br>')[0];

const content = pista.includes('<br>') ? pista.substring(pista.indexOf('<br>') + 4) : 'This hint has no additional content.';

return `<div class="individual-hint-item"><button type="button" class="toggle-individual-hint-button" aria-expanded="false"><span class="hint-title-display">${parseAndRenderMedia(title)}</span><span class="individual-arrow">▼</span></button><div class="hint-content-wrapper"><div class="p-3-manual"><div class="display-individual-hint">${parseAndRenderMedia(content)}</div></div></div></div>`;

}).join('')}</div>`;

}

  

// Renders action buttons ("Show Answer" or "Evaluate" / "I don't know").

const buttonText = (q.type === 'basic') ? 'Show Answer' : 'Evaluate';

const idkButton = (q.type === 'basic') ? '' : `<button type="button" id="idk-btn" class="btn btn-secondary btn-xs">I don't know</button>`;

html += `<div id="action-buttons" style="display: flex; justify-content: space-between; align-items: center; cloze: 8px; margin-top: 12px;">${idkButton}<button type="button" id="eval-btn" class="btn btn-primary btn-xs">${buttonText}</button></div></div>`;

  

// Injects the constructed HTML into the main quiz container.

document.getElementById('quiz-container-anki-front').innerHTML = html;

  

/*

----------------------------------------------------------------------------

2.5. ATTACHING LISTENERS AND UX FUNCTIONALITIES

----------------------------------------------------------------------------

Binds event handlers to the interactive elements of the quiz,

initializes media players, and sets up keyboard navigation.

*/

  

// Initializes and improves media display.

upgradeStandardMedia('#quiz-container-anki-front');

initializeAllCustomMediaPlayers();

styleAnkiImages('#quiz-container-anki-front');

  

const card = document.getElementById('q-card');

  

// Adds listeners to action buttons.

const evalBtn = document.getElementById('eval-btn');

if (evalBtn) evalBtn.addEventListener('click', () => storeAnswerAndFlip(false));

const idkBtn = document.getElementById('idk-btn');

if (idkBtn) idkBtn.addEventListener('click', () => storeAnswerAndFlip(true));

  

// Attaches listeners for hint toggle buttons.

document.querySelectorAll('.toggle-individual-hint-button').forEach(button => {

button.addEventListener('click', () => {

const contentWrapper = button.nextElementSibling;

const isExpanded = button.getAttribute('aria-expanded') === 'true';

button.setAttribute('aria-expanded', !isExpanded);

contentWrapper.style.maxHeight = isExpanded ? '0' : contentWrapper.scrollHeight + 'px';

button.querySelector('.individual-arrow').style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';

});

});

  

// Specific handlers for user input based on quiz type.

if (q.type === 'matching') {

userAnswer = {};

if(card) card.querySelectorAll('select.styled-select').forEach(select => select.addEventListener('change', () => {

userAnswer = {};

card.querySelectorAll('select.styled-select').forEach(s => {

const leftId = s.closest('.matching-row').dataset.leftId;

if (s.value) userAnswer[leftId] = s.value;

});

}));

}

else if (q.type === 'sentence-formation') {

userAnswer = [];

const responseArea = document.getElementById('sentence-response-area');

const wordBank = document.getElementById('sentence-word-bank');

// Function to render and update the sentence response area.

const render = () => {

responseArea.innerHTML = userAnswer.map((w,i)=>`<button type="button" class="sentence-word-button" data-word-index="${i}" data-word-text="${w}">${parseAndRenderMedia(w)}</button>`).join('');

// Reinitializes media players for added words.

upgradeStandardMedia('#sentence-response-area');

initializeAllCustomMediaPlayers();

styleAnkiImages('#sentence-response-area');

};

  

// Listener to add words from the bank to the response area.

wordBank.addEventListener('click', e => {

if (e.target.classList.contains('sentence-word-button')) {

userAnswer.push(e.target.dataset.wordText);

render();

}

});

  

// Listener to remove words from the response area.

responseArea.addEventListener('click', e => {

if (e.target.classList.contains('sentence-word-button')) {

userAnswer.splice(parseInt(e.target.dataset.wordIndex), 1);

render();

}

});

}

else if (q.type === 'ordering') {

userAnswer = [];

const list = document.getElementById('draggable-list');

// Updates the `userAnswer` array and visual numbering.

const updateOrder = () => {

userAnswer = Array.from(list.children).map(item => item.dataset.id);

list.querySelectorAll('.order-number').forEach((n,i) => n.textContent=`${i+1}.`);

};

updateOrder();

// Event handlers for drag and drop.

list.addEventListener('dragstart', e => e.target.classList.add('dragging'));

  

list.addEventListener('dragend', e => {

e.target.classList.remove('dragging');

updateOrder();

  

// Logic to synchronize keyboard focus after a drag & drop (Original from source code).

if (window.ankiQuizKeyboardState) {

const state = window.ankiQuizKeyboardState;

const previouslyFocusedItem = state.navigableItems[state.currentIndex];

  

// Clears any existing focus to apply the new one.

document.querySelectorAll('.keyboard-focused').forEach(el => el.classList.remove('keyboard-focused'));

state.updateNavigableItems(); // Recalculates navigable items.

  

const newIndexOfFocusedItem = state.navigableItems.findIndex(item => item === previouslyFocusedItem);

const targetIndex = (newIndexOfFocusedItem !== -1) ? newIndexOfFocusedItem : 0;

state.currentIndex = targetIndex; // Maintains the index or resets it.

state.updateFocus(targetIndex, null); // Applies the new focus.

}

});

  

list.addEventListener('dragover', e => {

e.preventDefault();

// Determines where to insert the dragged element.

const after = [...list.querySelectorAll('.draggable-item:not(.dragging)')].reduce((c, el) => { const b=el.getBoundingClientRect(),o=e.clientY-b.top-b.height/2; return (o<0&&o>c.offset)?{offset:o,element:el}:c },{offset:Number.NEGATIVE_INFINITY}).element;

const d=list.querySelector('.dragging');

if(after) list.insertBefore(d,after);

else list.appendChild(d);

});

}

else if (q.type === 'multiple-choice') {

userAnswer = [];

document.querySelectorAll('input[name="mc-quiz-option"]').forEach(check => {

check.addEventListener('change', (e) => {

const { value, checked } = e.target;

if (checked) {

userAnswer.push(value);

} else {

userAnswer = userAnswer.filter(v => v !== value);

}

e.target.closest('label').classList.toggle('user-selected', checked); // Updates selection style.

});

});

}

else if (q.type === 'single-choice') {

userAnswer = null;

document.querySelectorAll('input[name="sc-quiz-option"]').forEach(radio => {

radio.addEventListener('change', (e) => {

userAnswer = e.target.value;

// Visually unmarks previously selected options.

document.querySelectorAll('.option-label.user-selected').forEach(l => l.classList.remove('user-selected'));

e.target.closest('label').classList.add('user-selected'); // Marks the current option.

});

});

}

else if (q.type === 'exact-answer') {

const multiInputs = document.querySelectorAll('.re-review-input');

if (multiInputs.length > 0) {

// If there are multiple inputs (for multiple cloze clozes).

userAnswer = new Array(multiInputs.length).fill('');

multiInputs.forEach(input => {

input.addEventListener('input', () => {

const idx = parseInt(input.dataset.clozeIndex, 10);

userAnswer[idx] = input.value;

});

});

if(multiInputs.length > 0) setTimeout(() => multiInputs[0].focus(), 250); // Focuses the first input.

} else {

// If it's a single exact answer input.

userAnswer = [];

const textarea = document.getElementById('exact-answer-input');

if (textarea) {

setTimeout(() => textarea.focus(), 250);

textarea.addEventListener('input', e => { userAnswer = [e.target.value]; });

}

}

}

  

// Tries to automatically play the first media element on the card.

function triggerAutoplay() {

const firstMediaElement = document.querySelector('#quiz-container-anki-front .custom-audio-element, #quiz-container-anki-front .custom-video-element');

if (firstMediaElement) {

setTimeout(() => {

firstMediaElement.play().catch(e => {

console.log("Autoplay was blocked by the browser. User interaction is required.");

});

}, 100);

}

}

triggerAutoplay(); // Calls the autoplay function.

  

// Initializes the keyboard navigation system.

function initializeKeyboardNavigation(q) {

// Clears any previous keyboard handler to avoid conflicts.

if (window.ankiQuizKeyboardHandler) {

document.removeEventListener('keydown', window.ankiQuizKeyboardHandler);

window.ankiQuizKeyboardHandler = null;

}

  

// Global state object for keyboard navigation.

window.ankiQuizKeyboardState = {

navigableItems: [],

currentIndex: -1,

grabbedItem: null,

updateNavigableItems: () => {},

updateFocus: () => {},

};

const state = window.ankiQuizKeyboardState;

  

const quizType = q.type;

  

let activeZone = 'bank'; // Default active zone for 'sentence-formation'.

let bankItems = [], responseItems = [], mainItems = []; // Lists of elements per zone.

let bankIndex = -1, responseIndex = -1, mainIndex = -1; // Focus indices per zone.

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

mainItems = [...hintButtons, ...actionButtons];

} else {

let coreItems = [];

switch (quizType) {

case 'single-choice': case 'multiple-choice': coreItems = Array.from(quizContainer.querySelectorAll('.option-container')); break;

case 'matching': coreItems = Array.from(quizContainer.querySelectorAll('.matching-row')); break;

case 'ordering': coreItems = Array.from(quizContainer.querySelectorAll('.draggable-item')); break;

}

state.navigableItems = [...coreItems, ...hintButtons, ...actionButtons];

}

}

  

// Gets the "focusable" child element within a container.

function getFocusableChild(container) {

if (!container) return null;

if (container.classList.contains('matching-row')) return container.querySelector('.matching-row-content');

if (container.classList.contains('draggable-item')) return container.querySelector('.draggable-item-content');

if (container.classList.contains('option-container')) return container.querySelector('.option-label');

return container;

}

  

// Updates the visually focused element and its index in the current zone.

state.updateFocus = function(newIndex, zone) {

let items, localIndex, setIndex;

// Determines the list of elements and the local index according to the zone.

if (zone === 'bank') { items = bankItems; localIndex = bankIndex; if (bankIndex > -1 && bankItems[bankIndex]) bankItems[bankIndex].classList.remove('keyboard-focused'); setIndex = (i) => bankIndex = i; }

else if (zone === 'response') { items = responseItems; localIndex = responseIndex; if (responseIndex > -1 && responseItems[responseIndex]) responseItems[responseIndex].classList.remove('keyboard-focused'); setIndex = (i) => responseIndex = i; }

else if (zone === 'main') { items = mainItems; localIndex = mainIndex; if (mainIndex > -1 && mainItems[mainIndex]) getFocusableChild(mainItems[mainIndex]).classList.remove('keyboard-focused'); setIndex = (i) => mainIndex = i; }

else {

items = state.navigableItems;

localIndex = state.currentIndex;

if (state.currentIndex > -1 && state.navigableItems[state.currentIndex]) getFocusableChild(state.navigableItems[state.currentIndex])?.classList.remove('keyboard-focused');

setIndex = (i) => state.currentIndex = i;

}

  

// Adjusts the new index to be cyclic (wraps around).

if (newIndex < 0) newIndex = items.length - 1; else if (newIndex >= items.length) newIndex = 0;

localIndex = items.length > 0 ? newIndex : -1;

// Applies the focus class and scrolls the element into view.

if (localIndex > -1 && items[localIndex]) { const focusableChild = getFocusableChild(items[localIndex]); focusableChild?.classList.add('keyboard-focused'); focusableChild?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

setIndex(localIndex);

};

  

// Changes the active keyboard navigation zone (only for sentence-formation).

function switchZone(newZone) {

// Clears visual focus from the outgoing zone and deactivates zone classes.

if (activeZone === 'bank' && bankIndex > -1 && bankItems[bankIndex]) bankItems[bankIndex].classList.remove('keyboard-focused');

if (activeZone === 'response' && responseIndex > -1 && responseItems[responseIndex]) responseItems[responseIndex].classList.remove('keyboard-focused');

if (activeZone === 'main' && mainIndex > -1 && mainItems[mainIndex]) getFocusableChild(mainItems[mainIndex]).classList.remove('keyboard-focused');

wordBank.classList.remove('keyboard-zone-active'); responseArea.classList.remove('keyboard-zone-active');

  

activeZone = newZone;

// Applies visual focus and sets initial focus in the new zone.

if (activeZone === 'bank') { wordBank.classList.add('keyboard-zone-active'); state.updateFocus(bankIndex > -1 ? bankIndex : 0, 'bank'); }

else if (activeZone === 'response') { responseArea.classList.add('keyboard-zone-active'); state.updateFocus(responseIndex > -1 ? responseIndex : 0, 'response'); }

else if (activeZone === 'main') { state.updateFocus(0, 'main'); }

}

  

// Main keyboard event handler.

window.ankiQuizKeyboardHandler = function(e) {

// If focus is on a text field, allow normal input.

if (document.activeElement.tagName.match(/TEXTAREA|INPUT|SELECT/)) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); storeAnswerAndFlip(false); } return; }

  

const key = e.key.toLowerCase();

const gameKeys = ['w', 's', 'a', 'd', ' ', 'enter']; // Allowed navigation keys.

if (!gameKeys.includes(key)) return; // Ignores other keys.

  

e.preventDefault(); // Prevents default key behavior.

e.stopPropagation(); // Stops event propagation.

  

if (key === 'enter') { return storeAnswerAndFlip(false); } // Flips the card when Enter is pressed.

  

// Specific logic for 'sentence-formation' quiz type.

if (quizType === 'sentence-formation') {

if (key === 'w') { // Navigates up or changes zone.

if (activeZone === 'main') {

if (mainIndex === 0) { switchZone('bank'); }

else { state.updateFocus(mainIndex - 1, 'main'); }

} else if (activeZone === 'bank') {

if (responseItems.length > 0) { switchZone('response'); }

else if (mainItems.length > 0) { switchZone('main'); setTimeout(() => state.updateFocus(mainItems.length - 1, 'main'), 0); }

} else if (activeZone === 'response') {

if (mainItems.length > 0) { switchZone('main'); setTimeout(() => state.updateFocus(mainItems.length - 1, 'main'), 0); }

}

} else if (key === 's') { // Navigates down or changes zone.

if (activeZone === 'response') { switchZone('bank'); }

else if (activeZone === 'bank' && mainItems.length > 0) { switchZone('main'); }

else if (activeZone === 'main') {

if (mainIndex === mainItems.length - 1) {

if (responseItems.length > 0) { switchZone('response'); }

else { switchZone('bank'); }

} else { state.updateFocus(mainIndex + 1, 'main'); }

}

} else if (key === 'a' || key === 'd') { // Navigates laterally within the zone.

if (activeZone === 'bank') { state.updateFocus(key === 'a' ? bankIndex - 1 : bankIndex + 1, 'bank'); }

else if (activeZone === 'response') { state.updateFocus(key === 'a' ? responseIndex - 1 : responseIndex + 1, 'response'); }

} else if (key === ' ') { // Selects or removes a word.

let itemToClick, localIndex;

if (activeZone === 'bank') { itemToClick = bankItems[bankIndex]; localIndex = bankIndex; }

else if (activeZone === 'response') { itemToClick = responseItems[responseIndex]; localIndex = responseIndex; }

else { itemToClick = mainItems[mainIndex]; }

  

if (itemToClick) {

itemToClick.click();

// Recalculates navigable elements and readjusts focus after interaction.

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

return; // Exits the function, event already handled.

}

  

// General navigation logic for other quiz types.

const currentItem = state.navigableItems[state.currentIndex];

  

if (key === 'w' || key === 's') { // Vertical navigation.

if (quizType === 'ordering' && state.grabbedItem) {

// If an item is "grabbed" in ordering mode, move it.

const list = document.getElementById('draggable-list');

if (key === 'w' && state.grabbedItem.previousElementSibling) { list.insertBefore(state.grabbedItem, state.grabbedItem.previousElementSibling); }

else if (key === 's' && state.grabbedItem.nextElementSibling) { list.insertBefore(state.grabbedItem, state.grabbedItem.nextElementSibling.nextElementSibling); }

// Updates the order and numbering.

const updateOrder = () => { userAnswer = Array.from(list.children).map(item => item.dataset.id); list.querySelectorAll('.order-number').forEach((n,i)=>n.textContent=`${i+1}.`); };

updateOrder();

state.updateNavigableItems(); // Recalculates the navigable list.

state.currentIndex = state.navigableItems.indexOf(state.grabbedItem); // Maintains focus on the moved item.

} else {

// If not in "drag" mode, simply move focus.

state.updateFocus(key === 'w' ? state.currentIndex - 1 : state.currentIndex + 1, null);

}

}

else if (key === ' ') { // Interaction with the focused item.

if (!currentItem) return;

if (currentItem.matches('.option-container')) { currentItem.querySelector('input')?.click(); }

else if (currentItem.matches('.draggable-item')) {

// If it's a draggable item, "grab" or "release" it.

if (state.grabbedItem === null) {

state.grabbedItem = currentItem;

getFocusableChild(state.grabbedItem)?.classList.add('keyboard-grabbed');

} else {

getFocusableChild(state.grabbedItem)?.classList.remove('keyboard-grabbed');

state.grabbedItem = null;

}

} else { currentItem.click(); }

}

// Specific logic for 'matching' type when navigating with 'A' or 'D'.

else if ((key === 'a' || key === 'd') && quizType === 'matching' && currentItem?.matches('.matching-row')) {

const select = currentItem.querySelector('select');

if (select) {

let changed = false;

if (key === 'a' && select.selectedIndex > 0) { select.selectedIndex--; changed = true; }

if (key === 'd' && select.selectedIndex < select.options.length - 1) { select.selectedIndex++; changed = true; }

if (changed) select.dispatchEvent(new Event('change', { bubbles: true })); // Dispatches the 'change' event.

}

}

};

  

state.updateNavigableItems(); // Calls initially to populate the item list.

  

// Sets the initial active zone for 'sentence-formation' type.

if (quizType === 'sentence-formation') {

switchZone('bank');

}

  

document.addEventListener('keydown', window.ankiQuizKeyboardHandler); // Adds the global event listener.

}

  

initializeKeyboardNavigation(q); // Calls keyboard navigation initialization.

  

// ===== FRONT TEMPLATE & BACK TEMPLATE =====

// --- START: Improved persistent cursor logic (V5) (Original from source code) ---

// This code block is responsible for cursor state persistence

// (hidden/visible) between the front and back of the card, and its hiding

// due to inactivity. It is a duplicated implementation and is kept as is.

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

  

// Activity handler: shows the cursor and restarts the timer.

const cursorActivityHandler = () => {

showCursor();

clearTimeout(cursorIdleTimeout);

cursorIdleTimeout = setTimeout(hideCursor, 2500);

};

  

// Clearing previous listeners to avoid duplicates.

if (window.ankiCursorHandler) {

document.removeEventListener('mousemove', window.ankiCursorHandler);

}

  

// Register new global handler for mouse movement.

window.ankiCursorHandler = cursorActivityHandler;

document.addEventListener('mousemove', window.ankiCursorHandler);

  

// Immediate initialization based on previous state.

if (sessionStorage.getItem(CURSOR_STATE_KEY) === 'true') {

// Hide immediately WITHOUT waiting for everything to load.

document.documentElement.classList.add('cursor-idle');

// Set timeout for possible re-activation.

cursorIdleTimeout = setTimeout(() => {

// Only keep hidden if there was no activity.

if (sessionStorage.getItem(CURSOR_STATE_KEY) === 'true') {

hideCursor();

}

}, 100);

} else {

// Start timer if it was active.

cursorIdleTimeout = setTimeout(hideCursor, 2500);

}

})();

// --- END: Improved cursor logic (Original from source code) ---

  

} catch (e) {

// Error handling: displays a message on the interface if an exception occurs.

document.getElementById('quiz-container-anki-front').innerHTML = `<div class='styled-card' style='color:red;'><strong>Front Error:</strong> ${e.message}<br><pre>${e.stack}</pre></div>`;

}

}

  

  

// ============================================================================

// START: BOOTSTRAP AND RESTART SYSTEM

// ============================================================================

// This block is CRITICAL for Anki's operation, as it ensures that

// the card script restarts correctly when a new card is loaded

// or navigated between, even if the DOM does not fully reload.

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

// We are only interested in the class change in the `body`, which is the most

// reliable signal from Anki to indicate the loading of a new card.

for (const mutation of mutations) {

if (mutation.attributeName === 'class') {

// Disconnect the observer immediately to prevent

// infinite loops or unwanted re-executions once the

// card change has been detected and processed.

observer.disconnect();

  

// We look for the script block of the NEW card by its ID.

const newCardScript = document.getElementById('anki-card-script');

if (newCardScript) {

// We use `eval()` to re-execute the content of the

// new card's script. This ensures a complete re-initialization

// from scratch of all JavaScript logic.

eval(newCardScript.textContent);

}

// Exit the loop once the relevant mutation has been processed.

break;

}

}

});

  

// 3. We save the reference to the observer in the `window` object.

// This allows the next card (when loaded) to find it

// and disconnect it at the beginning of its own execution (step 1 of this block).

window.ankiTemplateObserver = observer;

  

// 4. We start observing the `body` of the document to detect

// any changes in its attributes, specifically the class.

// This is the main mechanism for detecting card changes in Anki.

observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  

// 5. We execute the main logic (`runAnkiTemplate`) for the CURRENT card, but with a

// minimal delay to allow Anki to finish updating the DOM.

// This `setTimeout` is vital for the correct functioning of the script in Anki.

setTimeout(runAnkiTemplate, 0);

})();

// ============================================================================

// END: BOOTSTRAP AND RESTART SYSTEM

// ============================================================================
