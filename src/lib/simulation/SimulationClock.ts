// Reloj virtual del que depende TODO el motor.
// Nunca usamos setTimeout/setInterval reales para la lógica de protocolo:
// eso impediría pausar, retroceder o avanzar frame a frame con precisión.
// En su lugar, el reloj avanza en "ticks" discretos y notifica a los
// suscriptores (el ProtocolEngine) en cada tick.

type Listener = (tick: number) => void;

export class SimulationClock {
  private currentTick = 0;
  private listeners: Listener[] = [];
  private playing = false;
  private speedMs = 50; // ms reales entre ticks cuando está en "play"
  private rafHandle: ReturnType<typeof setTimeout> | null = null;

  get tick(): number {
    return this.currentTick;
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  onTick(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  setSpeed(ms: number) {
    this.speedMs = ms;
    if (this.playing) {
      this.pause();
      this.play();
    }
  }

  step() {
    this.currentTick += 1;
    for (const listener of this.listeners) listener(this.currentTick);
  }

  play() {
    if (this.playing) return;
    this.playing = true;
    const loop = () => {
      if (!this.playing) return;
      this.step();
      this.rafHandle = setTimeout(loop, this.speedMs);
    };
    this.rafHandle = setTimeout(loop, this.speedMs);
  }

  pause() {
    this.playing = false;
    if (this.rafHandle) clearTimeout(this.rafHandle);
    this.rafHandle = null;
  }

  reset() {
    this.pause();
    this.currentTick = 0;
  }
}
