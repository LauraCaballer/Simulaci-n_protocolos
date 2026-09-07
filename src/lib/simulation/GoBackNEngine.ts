import { ProtocolEngine } from "./ProtocolEngine";

// Go-Back-N: el receptor SOLO acepta el frame que espera en orden estricto
// (receiverExpectedSeq). Cualquier otra cosa se descarta, aunque haya
// llegado bien — esto es justo lo que hace que un solo frame perdido
// tumbe todo el rendimiento del pipeline. Y en el emisor, un timeout
// reenvía TODA la ventana desde el frame vencido, no solo ese frame.
export class GoBackNEngine extends ProtocolEngine {
  onTick(tick: number): void {
    // 1) Enviar todo lo que quepa en la ventana.
    while (this.canSendMore()) {
      const frame = this.frames[this.nextSeqToSend];
      frame.markSent(tick, this.config.timeoutTicks);
      this.pushEvent({ tick, type: "send", seq: frame.seq, detail: `Frame ${frame.seq} enviado` });
      this.nextSeqToSend += 1;
    }

    // 2) Revisar si algún frame en vuelo debía llegar/perderse este tick.
    for (const frame of this.frames) {
      if (frame.status === "in-transit" && frame.sentAtTick !== null) {
        const arrival = frame.sentAtTick + this.config.propagationDelayTicks;
        if (arrival === tick) {
          const transmission = this.channel.send(frame.seq, frame.sentAtTick, false);
          if (transmission.outcome === "lost") {
            frame.markLost();
            this.pushEvent({ tick, type: "loss", seq: frame.seq, detail: `Frame ${frame.seq} se perdió en el canal` });
          } else {
            this.handleFrameArrival(frame.seq, tick);
          }
        }
      }
      // 3) Revisar timeouts vencidos (frame perdido o su ACK perdido).
      if (
        (frame.status === "in-transit" || frame.status === "lost") &&
        frame.timeoutAtTick !== null &&
        tick >= frame.timeoutAtTick
      ) {
        this.handleTimeout(frame.seq, tick);
      }
    }
  }

  protected handleFrameArrival(seq: number, tick: number): void {
    const frame = this.frames[seq];
    if (seq === this.receiverExpectedSeq) {
      frame.markDelivered();
      this.receiverExpectedSeq += 1;
      this.pushEvent({ tick, type: "receive", seq, detail: `Frame ${seq} entregado en orden` });
      // ACK acumulativo: confirma todo hasta este seq.
      this.acknowledgeUpTo(seq, tick);
    } else {
      frame.markDiscarded();
      this.pushEvent({
        tick,
        type: "discard",
        seq,
        detail: `Frame ${seq} descartado (se esperaba ${this.receiverExpectedSeq})`,
      });
    }
  }

  protected handleTimeout(seq: number, tick: number): void {
    // Idea central de Go-Back-N: reenviar TODO desde sendBase, no solo `seq`.
    this.pushEvent({ tick, type: "timeout", seq: this.sendBase, detail: `Timeout: se reenvía desde el frame ${this.sendBase}` });
    for (let s = this.sendBase; s < this.nextSeqToSend; s++) {
      this.frames[s].prepareRetransmission();
    }
    this.nextSeqToSend = this.sendBase;
  }

  private acknowledgeUpTo(seq: number, tick: number) {
    for (let s = this.sendBase; s <= seq; s++) {
      this.frames[s].markAcked();
    }
    this.sendBase = seq + 1;
    this.pushEvent({ tick, type: "window-slide", seq, detail: `Ventana se desliza, nueva base = ${this.sendBase}` });
  }
}
