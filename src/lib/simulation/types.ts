// Tipos base compartidos por todo el motor de simulación.
// No dependen de React: el motor es puro TypeScript, testeable sin UI.

export type ChannelMode = "simplex" | "half-duplex" | "full-duplex";

export type ProtocolKind = "stop-and-wait" | "sliding-window" | "go-back-n" | "selective-repeat";

// Estado visual/lógico de un frame a lo largo de su ciclo de vida.
export type FrameStatus =
  | "queued"       // esperando entrar a la ventana
  | "in-window"    // dentro de la ventana, aún no enviado
  | "in-transit"   // viajando por el canal hacia el receptor
  | "delivered"    // llegó bien al receptor
  | "lost"         // se perdió en el canal (simulado)
  | "corrupted"    // llegó pero con error (simulado)
  | "discarded"    // el receptor lo descartó (fuera de orden / duplicado)
  | "acked"        // confirmado, ya puede salir de la ventana
  | "timed-out";   // su temporizador expiró, listo para retransmitir

export interface FrameSnapshot {
  seq: number;
  status: FrameStatus;
  isRetransmission: boolean;
  piggybackedAck?: number; // si este frame también confirma un ACK del otro lado
  sentAtTick: number | null;
  timeoutAtTick: number | null;
}

// Un evento discreto que ocurrió en algún tick del reloj virtual.
// El log de eventos es lo que alimenta la línea de tiempo/scrubber en la UI.
export type SimEventType =
  | "send"
  | "receive"
  | "ack-send"
  | "ack-receive"
  | "timeout"
  | "discard"
  | "loss"
  | "corruption"
  | "window-slide";

export interface SimEvent {
  id: string;
  tick: number;
  type: SimEventType;
  seq?: number;
  detail: string;
}

// Configuración con la que arranca cada corrida de la simulación.
export interface ScenarioConfig {
  protocol: ProtocolKind;
  channelMode: ChannelMode;
  windowSize: number;
  sequenceBits: number; // define el rango de números de secuencia (2^bits)
  propagationDelayTicks: number; // "distancia" del canal, define el RTT
  timeoutTicks: number;
  lossProbability: number; // 0..1, aplica a frames
  ackLossProbability: number; // 0..1, aplica a ACKs (independiente)
  totalFramesToSend: number;
  piggybackingEnabled: boolean;
}
