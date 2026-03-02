/**
 * Sound effects using real iOS iMessage audio files.
 */

// Pre-load audio elements for instant playback
const sendAudio = new Audio('/sounds/send.mp3');
const receiveAudio = new Audio('/sounds/receive.mp3');

// Set volumes
sendAudio.volume = 0.5;
receiveAudio.volume = 0.5;

// Pre-load
sendAudio.load();
receiveAudio.load();

/** iOS iMessage sent sound */
export function playSendSound() {
    try {
        sendAudio.currentTime = 0;
        sendAudio.play().catch(() => { });
    } catch {
        // Audio not available
    }
}

/** iOS iMessage received sound */
export function playReceiveSound() {
    try {
        receiveAudio.currentTime = 0;
        receiveAudio.play().catch(() => { });
    } catch {
        // Audio not available
    }
}

/** Soft tap — reuse a quick blip of the send sound */
export function playTapSound() {
    try {
        const tap = sendAudio.cloneNode() as HTMLAudioElement;
        tap.volume = 0.15;
        tap.currentTime = 0;
        tap.play().catch(() => { });
        // Stop early for a tap feel
        setTimeout(() => { tap.pause(); }, 60);
    } catch {
        // Audio not available
    }
}

/** Opening animation sound — the receive tone works well for this */
export function playOpenSound() {
    try {
        const open = receiveAudio.cloneNode() as HTMLAudioElement;
        open.volume = 0.3;
        open.currentTime = 0;
        open.play().catch(() => { });
    } catch {
        // Audio not available
    }
}

/** Error sound — low quick blip */
export function playErrorSound() {
    try {
        const err = receiveAudio.cloneNode() as HTMLAudioElement;
        err.volume = 0.2;
        err.playbackRate = 0.6;
        err.currentTime = 0;
        err.play().catch(() => { });
        setTimeout(() => { err.pause(); }, 120);
    } catch {
        // Audio not available
    }
}
