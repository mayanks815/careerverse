// Web Audio API Synthesizer for Careerverse
// Programmatic audio generation ensures 100% reliable, zero-latency, asset-free space sounds.

let audioCtx: AudioContext | null = null;
let ambientOsc1: OscillatorNode | null = null;
let ambientOsc2: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Fallback for older browsers
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. High-tech micro hover beep
export function playSynthHover(muted: boolean) {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.015, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.09);
}

// 2. Select Click
export function playSynthClick(muted: boolean) {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.setValueAtTime(300, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.13);
}

// 3. Cinematic Warp swoosh
export function playSynthWarp(muted: boolean) {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  // Create an accelerating frequency sweep
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.2);

  filter.type = 'lowpass';
  filter.Q.setValueAtTime(8, ctx.currentTime);
  filter.frequency.setValueAtTime(150, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 1.0);

  // Volume envelope
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 1.4);
}

// 4. Retro spaceship landing hum
export function playSynthLanding(muted: boolean) {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(500, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(85, ctx.currentTime + 0.9);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.95);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 1.0);
}

// 5. Continuous low space drone (ambient)
export function startAmbientSpaceDrone(muted: boolean) {
  if (muted) {
    stopAmbientSpaceDrone();
    return;
  }
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ambientOsc1) return; // already playing

  try {
    ambientOsc1 = ctx.createOscillator();
    ambientOsc2 = ctx.createOscillator();
    ambientGain = ctx.createGain();
    
    const filter = ctx.createBiquadFilter();

    // Two detuned low frequency oscillators
    ambientOsc1.type = 'sawtooth';
    ambientOsc1.frequency.setValueAtTime(55, ctx.currentTime); // A1 note
    
    ambientOsc2.type = 'triangle';
    ambientOsc2.frequency.setValueAtTime(55.5, ctx.currentTime); // slightly detuned

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, ctx.currentTime);
    
    // Slow LFO filter sweep
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08; // slow sweep
    lfoGain.gain.value = 35; // sweep depth
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // Low volume for ambient pad
    ambientGain.gain.setValueAtTime(0.02, ctx.currentTime);

    ambientOsc1.connect(filter);
    ambientOsc2.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(ctx.destination);

    ambientOsc1.start();
    ambientOsc2.start();
  } catch (err) {
    console.error("Failed to start space drone synthesizer:", err);
  }
}

export function stopAmbientSpaceDrone() {
  try {
    if (ambientOsc1) {
      ambientOsc1.stop();
      ambientOsc1.disconnect();
      ambientOsc1 = null;
    }
    if (ambientOsc2) {
      ambientOsc2.stop();
      ambientOsc2.disconnect();
      ambientOsc2 = null;
    }
    if (ambientGain) {
      ambientGain.disconnect();
      ambientGain = null;
    }
  } catch (err) {
    // silent catch
  }
}
