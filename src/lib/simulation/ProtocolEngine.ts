import { Frame } from "./Frame";
import { Channel } from "./Channel";
import { ScenarioConfig, SimEvent, FrameSnapshot } from "./types";

// Contrato común a Go-Back-N, Selective Repeat, y a un Sliding Window
// genérico usado solo para enseñar el mecanismo de ventana (sin política
// de reenvío específica). Cada subclase decide QUÉ pasa en un timeout y
// QUÉ hace el receptor con un frame fuera de orden — todo lo demás
// (avance del reloj, manejo de la ventana, log de eventos) vive aquí.
export abstract class ProtocolEngine {
  protected frames: Frame[] = [];
  protected sendBase = 0; // primer seq no confirmado (borde inferior de la ventana)
  protected nextSeqToSend = 0; // siguiente seq disponible para enviar
  protected receiverExpectedSeq = 0;
  protected events: SimEvent[] = [];
  protected eventCounter = 0;

  protected channel: Channel;

  constructor(protected config: ScenarioConfig) {
    this.channel = new Channel(
      config.channelMode,
      config.propagationDelayTicks,
      config.lossProbability,
      config.ackLossProbability
    );
    for (let seq = 0; seq < config.totalFramesToSend; seq++) {
      this.frames.push(new Frame(seq));
    }
  }

  // Llamado por el SimulationClock en cada tick. Orquesta el ciclo:
  // 1) intentar enviar frames nuevos si hay espacio en la ventana
  // 2) revisar temporizadores vencidos
  // 3) delegar la política de timeout/recepción a la subclase
  abstract onTick(tick: number): void;

  // Qué hace el receptor cuando le llega un frame (en orden, duplicado,
  // o fuera de orden). Go-Back-N descarta todo lo que no sea el esperado;
  // Selective Repeat lo guardaría en buffer — de ahí la necesidad de
  // que cada protocolo lo implemente distinto.
  protected abstract handleFrameArrival(seq: number, tick: number): void;

  // Qué hace el emisor cuando expira un timeout. Go-Back-N reenvía toda
  // la ventana desde el frame vencido; Selective Repeat reenviaría solo ese frame.
  protected abstract handleTimeout(seq: number, tick: number): void;

  get windowSnapshot(): { base: number; size: number; nextSeq: number } {
    return { base: this.sendBase, size: this.config.windowSize, nextSeq: this.nextSeqToSend };
  }

  get frameSnapshots(): FrameSnapshot[] {
    return this.frames.map((f) => f.toSnapshot());
  }

  get log(): SimEvent[] {
    return this.events;
  }

  get isFinished(): boolean {
    return this.sendBase >= this.frames.length;
  }

  protected pushEvent(evt: Omit<SimEvent, "id">) {
    this.eventCounter += 1;
    this.events.push({ ...evt, id: `e${this.eventCounter}` });
  }

  protected canSendMore(): boolean {
    return this.nextSeqToSend < this.sendBase + this.config.windowSize && this.nextSeqToSend < this.frames.length;
  }
}
