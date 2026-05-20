let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export function playAlertSound(tone = "info") {
  try {
    const ac = getCtx();
    const t = ac.currentTime;

    if (tone === "danger") {
      // Two sharp descending beeps — critical alert
      [0, 0.18].forEach((offset) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = "square";
        osc.frequency.setValueAtTime(1040, t + offset);
        osc.frequency.exponentialRampToValueAtTime(600, t + offset + 0.12);
        gain.gain.setValueAtTime(0.001, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.22, t + offset + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.14);
        osc.start(t + offset);
        osc.stop(t + offset + 0.15);
      });
    } else if (tone === "warning") {
      // Classic Windows-style warning ding — two tone rise
      const freqs = [523, 784];
      freqs.forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + i * 0.13);
        gain.gain.setValueAtTime(0.001, t + i * 0.13);
        gain.gain.exponentialRampToValueAtTime(0.2, t + i * 0.13 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.13 + 0.18);
        osc.start(t + i * 0.13);
        osc.stop(t + i * 0.13 + 0.2);
      });
    } else {
      // Soft info pop
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(620, t);
      osc.frequency.exponentialRampToValueAtTime(480, t + 0.15);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  } catch {
    // silently fail if audio not available
  }
}
