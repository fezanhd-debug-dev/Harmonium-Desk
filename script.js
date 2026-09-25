// Web Audio API Setup with Mobile Audio Context Unlock
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

const activeNotes = {};

const baseNotes = [
    { name: 'Sa', freq: 261.63, type: 'white', keyBind: 'a' },
    { name: 're', freq: 277.18, type: 'black', keyBind: 'w' },
    { name: 'Re', freq: 293.66, type: 'white', keyBind: 's' },
    { name: 'ga', freq: 311.13, type: 'black', keyBind: 'e' },
    { name: 'Ga', freq: 329.63, type: 'white', keyBind: 'd' },
    { name: 'Ma', freq: 349.23, type: 'white', keyBind: 'f' },
    { name: 'MA', freq: 369.99, type: 'black', keyBind: 't' },
    { name: 'Pa', freq: 392.00, type: 'white', keyBind: 'g' },
    { name: 'dha', freq: 415.30, type: 'black', keyBind: 'y' },
    { name: 'Dha', freq: 440.00, type: 'white', keyBind: 'h' },
    { name: 'ni', freq: 466.16, type: 'black', keyBind: 'u' },
    { name: 'Ni', freq: 493.88, type: 'white', keyBind: 'j' },
    { name: 'Sa\'', freq: 523.25, type: 'white', keyBind: 'k' },
    { name: 'Re\'', freq: 587.33, type: 'white', keyBind: 'l' }
];

let currentShift = 0;
const keyboard = document.getElementById('keyboard');

function renderKeyboard() {
    keyboard.innerHTML = '';
    let whiteIndex = 0;

    baseNotes.forEach((note, index) => {
        const key = document.createElement('div');
        key.classList.add('key', note.type);
        key.dataset.index = index;
        key.innerText = note.name;

        if (note.type === 'white') {
            key.style.left = `${whiteIndex * 50}px`;
            whiteIndex++;
        } else {
            key.style.left = `${(whiteIndex - 1) * 50 + 34}px`;
        }

        // Multi-Touch Optimized Event Listeners
        key.addEventListener('touchstart', (e) => {
            e.preventDefault();
            initAudio();
            startNote(index);
        }, { passive: false });

        key.addEventListener('touchend', (e) => {
            e.preventDefault();
            stopNote(index);
        }, { passive: false });

        key.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            stopNote(index);
        }, { passive: false });

        // Mouse Support for PC
        key.addEventListener('mousedown', () => { initAudio(); startNote(index); });
        key.addEventListener('mouseup', () => stopNote(index));
        key.addEventListener('mouseleave', () => stopNote(index));

        keyboard.appendChild(key);
    });
}

function startNote(index) {
    if (!audioCtx) return;
    if (activeNotes[index]) return;

    const baseFreq = baseNotes[index].freq * Math.pow(2, currentShift / 12);
    
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    const reedType = document.getElementById('reedType').value;
    
    if (reedType === 'female') {
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
    } else if (reedType === 'male') {
        osc1.type = 'sawtooth';
        osc2.type = 'square';
    } else {
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
    }

    osc1.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
    osc2.frequency.setValueAtTime(baseFreq * 1.002, audioCtx.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.05);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start();
    osc2.start();

    activeNotes[index] = { osc1, osc2, gainNode };

    const keyElem = keyboard.querySelector(`[data-index="${index}"]`);
    if (keyElem) keyElem.classList.add('active');
}

function stopNote(index) {
    if (!activeNotes[index]) return;

    const { osc1, osc2, gainNode } = activeNotes[index];
    
    gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    
    setTimeout(() => {
        try {
            osc1.stop();
            osc2.stop();
            osc1.disconnect();
            osc2.disconnect();
        } catch(e){}
    }, 80);

    delete activeNotes[index];

    const keyElem = keyboard.querySelector(`[data-index="${index}"]`);
    if (keyElem) keyElem.classList.remove('active');
}

// Mobile Keyboard Unlock on First Touch Anywhere
window.addEventListener('touchstart', initAudio, { once: true });
window.addEventListener('click', initAudio, { once: true });

// Scale Change
document.getElementById('scaleSelect').addEventListener('change', (e) => {
    currentShift = parseInt(e.target.value);
});

// Paid System Modal
const modal = document.getElementById('paymentModal');
document.getElementById('unlockBtn').onclick = () => modal.style.display = 'flex';
document.getElementById('closeModalBtn').onclick = () => modal.style.display = 'none';

document.getElementById('activateBtn').onclick = () => {
    const key = document.getElementById('licenseKey').value;
    if (key === 'PRO123') {
        document.getElementById('licenseBadge').innerText = 'PRO Unlocked';
        document.getElementById('licenseBadge').classList.add('pro');
        modal.style.display = 'none';
        alert('Pro Version Activated!');
    } else {
        alert('Invalid Key! Use PRO123');
    }
};

renderKeyboard();
