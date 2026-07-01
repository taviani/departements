const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUTPUT = path.join(__dirname, '../assets/sounds/departement_match.wav');

const SLOW_STEP = 0.28;
const FAST_STEP = 0.13;
const RISE_DURATION = 0.18;
const FINISH_DURATION = 0.15;
const FINISH_HOLD = 0.78;

const MAJOR_THIRD = 2 ** (4 / 12);
const PERFECT_FIFTH = 2 ** (7 / 12);

/** Major triad + sub/octave doubles for a fuller chord stab. */
const CHORD_VOICES = [
  { ratio: 0.5, amp: 0.58 },
  { ratio: 1, amp: 1 },
  { ratio: MAJOR_THIRD, amp: 0.94 },
  { ratio: PERFECT_FIFTH, amp: 0.9 },
  { ratio: 2, amp: 0.52 },
];

/** Homogeneous dark synth for the slow octave rise. */
const SYNTH_RISE_HARMONICS = [
  { ratio: 0.5, amp: 0.35 },
  { ratio: 1, amp: 1 },
  { ratio: 2, amp: 0.05 },
  { ratio: 3, amp: 0.72 },
  { ratio: 4, amp: 0.04 },
  { ratio: 5, amp: 0.45 },
  { ratio: 7, amp: 0.22 },
];

/** Brighter synth for the faster closing pair. */
const SYNTH_FINISH_HARMONICS = [
  { ratio: 1, amp: 1 },
  { ratio: 2, amp: 0.78 },
  { ratio: 3, amp: 0.62 },
  { ratio: 4, amp: 0.46 },
  { ratio: 5, amp: 0.34 },
  { ratio: 6, amp: 0.26 },
  { ratio: 8, amp: 0.16 },
];

function synthEnvelope(time, duration, attackSec, { sustain = false } = {}) {
  const attack = Math.min(1, time / attackSec);
  const decay = Math.exp(-(sustain ? 1.6 : 2.8) * (time / duration));
  const releaseStart = duration * (sustain ? 0.78 : 0.45);
  const release =
    time > releaseStart
      ? Math.exp(
          -(sustain ? 4 : 7) *
            ((time - releaseStart) / (duration - releaseStart + 0.001))
        )
      : 1;

  return attack * decay * release;
}

function renderOscillator(frequency, time, harmonics, detuneRatio) {
  const pitch = frequency * detuneRatio;
  let tone = 0;
  let norm = 0;

  for (const { ratio, amp } of harmonics) {
    tone += amp * Math.sin(2 * Math.PI * pitch * ratio * time);
    norm += amp;
  }

  return tone / norm;
}

function renderChord(rootFrequency, time, harmonics, detuneRatio) {
  const voiceSum = CHORD_VOICES.reduce((sum, voice) => sum + voice.amp, 0);
  let tone = 0;

  for (const voice of CHORD_VOICES) {
    tone +=
      renderOscillator(rootFrequency * voice.ratio, time, harmonics, detuneRatio) *
      voice.amp;
  }

  return tone / voiceSum;
}

function synthesizeSynthChord(
  rootFrequency,
  startSec,
  durationSec,
  volume = 0.5,
  { bright = false, attackSec = 0.035, tremolo = false, sustain = false } = {}
) {
  const start = Math.floor(startSec * SAMPLE_RATE);
  const length = Math.floor(durationSec * SAMPLE_RATE);
  const samples = new Float32Array(length);
  const harmonics = bright ? SYNTH_FINISH_HARMONICS : SYNTH_RISE_HARMONICS;
  const detuneA = bright ? 1.006 : 1.003;
  const detuneB = bright ? 0.994 : 0.997;
  const drive = bright ? 3.2 : 3.8;

  for (let index = 0; index < length; index += 1) {
    const time = index / SAMPLE_RATE;
    const envelope = synthEnvelope(time, durationSec, attackSec, { sustain });
    const tone =
      renderChord(rootFrequency, time, harmonics, detuneA) * 0.55 +
      renderChord(rootFrequency, time, harmonics, detuneB) * 0.45;
    const shaped = Math.tanh(tone * drive);
    const leslie =
      tremolo && time > 0.04
        ? 0.78 + 0.22 * Math.sin(2 * Math.PI * 5.8 * time)
        : 1;

    samples[index] = shaped * volume * envelope * leslie;
  }

  return { start, samples };
}

function writeWav(filePath, notes) {
  const totalLength = Math.max(
    ...notes.map((note) => note.start + note.samples.length)
  );
  const mix = new Float32Array(totalLength);

  for (const note of notes) {
    for (let index = 0; index < note.samples.length; index += 1) {
      mix[note.start + index] += note.samples[index];
    }
  }

  let peak = 0;
  for (let index = 0; index < totalLength; index += 1) {
    peak = Math.max(peak, Math.abs(mix[index]));
  }
  const gain = peak > 0 ? 0.95 / peak : 1;

  const pcm = new Int16Array(totalLength);
  for (let index = 0; index < totalLength; index += 1) {
    const clamped = Math.max(-1, Math.min(1, mix[index] * gain));
    pcm[index] = Math.floor(clamped * 32767);
  }

  const dataSize = pcm.length * 2;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.concat([header, Buffer.from(pcm.buffer)]));
}

const riseStart = (index) => SLOW_STEP * index;
const finishStart = SLOW_STEP * 3 + FAST_STEP;

// Montée lente homogène (1 octave) : accords Do → Mi → Sol → Do
// Fermeture synth plus rapide : accords Mi → Sol
const notes = [
  synthesizeSynthChord(261.63, riseStart(0), RISE_DURATION, 0.62, {
    attackSec: 0.06,
  }),
  synthesizeSynthChord(329.63, riseStart(1), RISE_DURATION, 0.62, {
    attackSec: 0.06,
  }),
  synthesizeSynthChord(392, riseStart(2), RISE_DURATION, 0.62, {
    attackSec: 0.06,
  }),
  synthesizeSynthChord(523.25, riseStart(3), RISE_DURATION, 0.62, {
    attackSec: 0.06,
  }),
  synthesizeSynthChord(659.25, finishStart, FINISH_DURATION, 0.72, {
    bright: true,
    attackSec: 0.018,
  }),
  synthesizeSynthChord(783.99, finishStart + FAST_STEP, FINISH_HOLD, 0.78, {
    bright: true,
    attackSec: 0.015,
    tremolo: true,
    sustain: true,
  }),
];

writeWav(OUTPUT, notes);

const targets = [
  path.join(__dirname, '../ios/Departements/departement_match.wav'),
  path.join(__dirname, '../android/app/src/main/res/raw/departement_match.wav'),
];

for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(OUTPUT, target);
}

const iosCaf = path.join(__dirname, '../ios/Departements/departement_match.caf');
try {
  const { execSync } = require('child_process');
  execSync(`afconvert -f caff -d LEI16 "${OUTPUT}" "${iosCaf}"`, { stdio: 'pipe' });
  console.log(`Generated ${iosCaf}`);
} catch (error) {
  console.warn('Could not generate departement_match.caf (afconvert missing):', error.message);
}

console.log(`Generated ${OUTPUT}`);
