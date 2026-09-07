import { ChannelMode, SimEvent } from "./types";

export interface ChannelTransmission {
  seq: number;
  isAck: boolean;
  piggybackedAck?: number;
  departTick: number;
  arriveTick: number;
  outcome: "delivered" | "lost" | "corrupted";
}

// El "medio físico". No sabe nada de ventanas ni timeouts: solo modela
// cuánto tarda algo en cruzar (propagationDelayTicks) y si sobrevive
// el viaje (lossProbability / corrupción). simplex/dúplex controla si
// el receptor puede mandar ACKs al mismo tiempo que el emisor manda datos.
export class Channel {
  constructor(
    private mode: ChannelMode,
    private propagationDelayTicks: number,
    private lossProbability: number,
    private ackLossProbability: number,
    private rng: () => number = Math.random
  ) {}

  get canReceiverTransmitConcurrently(): boolean {
    // En simplex el receptor nunca transmite. En half-duplex puede,
    // pero no "al mismo tiempo" en términos de la simulación visual.
    // En full-duplex, sí, de forma simultánea (esto es lo que habilita
    // piggybacking real sin esperar turno).
    return this.mode === "full-duplex";
  }

  send(seq: number, departTick: number, isAck: boolean, piggybackedAck?: number): ChannelTransmission {
    const lossChance = isAck ? this.ackLossProbability : this.lossProbability;
    const roll = this.rng();
    const outcome: ChannelTransmission["outcome"] = roll < lossChance ? "lost" : "delivered";

    return {
      seq,
      isAck,
      piggybackedAck,
      departTick,
      arriveTick: departTick + this.propagationDelayTicks,
      outcome,
    };
  }

  describeEvent(t: ChannelTransmission, id: string): SimEvent {
    const label = t.isAck ? `ACK ${t.seq}` : `Frame ${t.seq}`;
    if (t.outcome === "lost") {
      return { id, tick: t.departTick, type: "loss", seq: t.seq, detail: `${label} se pierde en el canal` };
    }
    return { id, tick: t.departTick, type: t.isAck ? "ack-send" : "send", seq: t.seq, detail: `${label} enviado` };
  }
}
