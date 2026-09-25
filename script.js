// Web Audio API Setup
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

// Harmonium Swar Configuration (Scale Base)
const baseNotes = [
    { name: 'Sa', freq: 261.63, type: 'white' },
    { name: 're', freq: 277.18, type: 'black' },
    { name: 'Re', freq: 293.66, type: 'white' },
    { name: 'ga', freq: 311.13, type: 'black' },
    { name: 'Ga', freq: 329.63, type: 'white' },
    { name: 'Ma', freq: 349.23, type: 'white' },
    { name: 'MA', freq: 369.99, type: 'black' },
    { name: 'Pa', freq: 392.00, type: 'white' },
    { name: 'dha', freq: 415.30, type: 'black' },
    { name: 'Dha', freq: 440.00, type: 'white' },
    { name: 'ni', freq: 466.16, type: 'black' },
    { name: 'Ni', freq: 493.88, type: 'white' },
    { name: 'Sa\'', freq: 523.25, type: 'white' },
    { name: 're\'', freq: 554.37, type: 'black' },
    { name: 'Re\'', freq: 587.33, type: 'white' },
    { name: 'ga\'', freq: 622.25, type: 'black' },
    { name: 'Ga\'', freq: 659.25, type: 'white' }
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
            key.style.left = `${whiteIndex * 46}px`;
            whiteIndex++;
        } else {
            key.style.left = `${(whiteIndex - 1) * 46 + 32}px`;
        }

        // Multi-Touch Screen Handlers
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

        // Mouse Handlers
        key.addEventListener('mousedown', () => { initAudio(); startNote(index); });
        key.addEventListener('mouseup', () => stopNote(index));
        key.addEventListener('mouseleave', () => stopNote(index));

        keyboard.appendChild(key);
    });
}

// REAL HARMONIUM REED VOICE SYNTHESIZER
function startNote(index) {
    if (!audioCtx) return;
    if (activeNotes[index]) return;

    const baseFreq = baseNotes[index].freq * Math.pow(2, currentShift / 12);
    const preset = document.getElementById('reedType').value;

    const masterGain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    // Wood Body Resonance Lowpass Filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, audioCtx.currentTime);

    const oscillators = [];

    // Helper Function to Create Realistic Harmonium Reed Layers
    function createReedLayer(freqMultiplier, detune, waveType, gainVal) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = waveType;
        osc.frequency.setValueAtTime(baseFreq * freqMultiplier, audioCtx.currentTime);
        osc.detune.setValueAtTime(detune, audioCtx.currentTime);

        gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
        
        osc.connect(gain);
        gain.connect(filter);
        osc.start();
        oscillators.push(osc);
    }

    if (preset === 'doubleReed') {
        // Main Reed (Male)
        createReedLayer(1, 0, 'sawtooth', 0.4);
        // Sub-Bass Reed (Bass)
        createReedLayer(0.5, -4, 'sawtooth', 0.3);
        // Air Buzz/Vibration Effect
        createReedLayer(1, 8, 'square', 0.08);
    } else if (preset === 'tripleReed') {
        // High Treble Reed
        createReedLayer(2, 3, 'sawtooth', 0.2);
        // Male Reed
        createReedLayer(1, 0, 'sawtooth', 0.35);
        // Low Bass Reed
        createReedLayer(0.5, -5, 'square', 0.25);
    } else { // Single Female Reed
        createReedLayer(1, 0, 'sawtooth', 0.5);
        createReedLayer(1, 6, 'triangle', 0.2);
    }

    // Bellows Air Attack Envelope (Harmonium Soft Pressure Start)
    masterGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.35, audioCtx.currentTime + 0.04);

    filter.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    activeNotes[index] = { oscillators, masterGain };

    const keyElem = keyboard.querySelector(`[data-index="${index}"]`);
    if (keyElem) keyElem.classList.add('active');
}

function stopNote(index) {
    if (!activeNotes[index]) return;

    const { oscillators, masterGain } = activeNotes[index];

    // Air Release Envelope (Bellows Air Decay)
    masterGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);

    setTimeout(() => {
        oscillators.forEach(osc => {
            try {
                osc.stop();
                osc.disconnect();
            } catch (e) {}
        });
    }, 120);

    delete activeNotes[index];

    const keyElem = keyboard.querySelector(`[data-index="${index}"]`);
    if (keyElem) keyElem.classList.remove('active');
}

// Mobile Auto Landscape Lock Request
window.addEventListener('click', () => {
    initAudio();
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
    }
}, { once: true });

document.getElementById('scaleSelect').addEventListener('change', (e) => {
    currentShift = parseInt(e.target.value);
});

// Paid Modal System
const modal = document.getElementById('paymentModal');
document.getElementById('unlockBtn').onclick = () => modal.style.display = 'flex';
document.getElementById('closeModalBtn').onclick = () => modal.style.display = 'none';

document.getElementById('activateBtn').onclick = () => {
    const key = document.getElementById('licenseKey').value;
    if (key === 'PRO123') {
        document.getElementById('licenseBadge').innerText = 'PRO Unlocked';
        document.getElementById('licenseBadge').classList.add('pro');
        modal.style.display = 'none';
        alert('Real Studio Harmonium Activated!');
    } else {
        alert('Invalid Key! Use PRO123');
    }
};

renderKeyboard();
