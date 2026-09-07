import { FrameStatus, FrameSnapshot } from "./types";

// Representa una trama individual. Es un objeto de datos con comportamiento
// mínimo (transiciones de estado válidas) — la lógica de protocolo (cuándo
// reenviar, cuándo deslizar la ventana) vive en el ProtocolEngine, no aquí.
export class Frame {
  readonly seq: number;
  status: FrameStatus = "queued";
  isRetransmission = false;
  sentAtTick: number | null = null;
  timeoutAtTick: number | null = null;
  piggybackedAck?: number;

  constructor(seq: number) {
    this.seq = seq;
  }

  markSent(tick: number, timeoutTicks: number) {
    this.status = "in-transit";
    this.sentAtTick = tick;
    this.timeoutAtTick = tick + timeoutTicks;
  }

  markDelivered() {
    this.status = "delivered";
  }

  markLost() {
    this.status = "lost";
  }

  markCorrupted() {
    this.status = "corrupted";
  }

  markDiscarded() {
    this.status = "discarded";
  }

  markAcked() {
    this.status = "acked";
  }

  markTimedOut() {
    this.status = "timed-out";
  }

  prepareRetransmission() {
    this.isRetransmission = true;
    this.status = "in-window";
    this.sentAtTick = null;
    this.timeoutAtTick = null;
  }

  toSnapshot(): FrameSnapshot {
    return {
      seq: this.seq,
      status: this.status,
      isRetransmission: this.isRetransmission,
      piggybackedAck: this.piggybackedAck,
      sentAtTick: this.sentAtTick,
      timeoutAtTick: this.timeoutAtTick,
    };
  }
}
