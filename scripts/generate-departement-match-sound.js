const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUTPUT = path.join(__dirname, '../assets/sounds/departement_match.wav');

function synthesizeNote(frequency, startSec, durationSec, volume = 0.35) {
  const start = Math.floor(startSec * SAMPLE_RATE);
  const length = Math.floor(durationSec * SAMPLE_RATE);
  const samples = new Float32Array(length);

  for (let index = 0; index < length; index += 1) {
    const time = index / SAMPLE_RATE;
    const attack = Math.min(1, index / (SAMPLE_RATE * 0.008));
    const decay = Math.exp(-4.5 * (time / durationSec));
    const envelope = attack * decay;
    const tone =
      Math.sin(2 * Math.PI * frequency * time) * 0.65 +
      Math.sin(2 * Math.PI * frequency * 2 * time) * 0.25 +
      Math.sin(2 * Math.PI * frequency * 3 * time) * 0.1;

    samples[index] = tone * volume * envelope;
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

  const pcm = new Int16Array(totalLength);
  for (let index = 0; index < totalLength; index += 1) {
    const clamped = Math.max(-1, Math.min(1, mix[index]));
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

const notes = [
  synthesizeNote(523.25, 0, 0.11, 0.32),
  synthesizeNote(659.25, 0.09, 0.11, 0.34),
  synthesizeNote(783.99, 0.18, 0.28, 0.42),
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

console.log(`Generated ${OUTPUT}`);
