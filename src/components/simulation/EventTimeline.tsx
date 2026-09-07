"use client";

import { SimEvent } from "@/lib/simulation/types";
import "./EventTimeline.css";

interface Props {
  log: SimEvent[];
}

const TYPE_META: Record<SimEvent["type"], { label: string; className: string }> = {
  send: { label: "envío", className: "evt--send" },
  receive: { label: "recepción", className: "evt--receive" },
  "ack-send": { label: "ack", className: "evt--ack" },
  "ack-receive": { label: "ack recibido", className: "evt--ack" },
  timeout: { label: "timeout", className: "evt--timeout" },
  discard: { label: "descarte", className: "evt--discard" },
  loss: { label: "pérdida", className: "evt--loss" },
  corruption: { label: "corrupción", className: "evt--loss" },
  "window-slide": { label: "ventana", className: "evt--slide" },
};

// El log completo es el "historial" que le permite al estudiante volver
// atrás y entender por qué pasó algo, no solo verlo pasar una vez.
export function EventTimeline({ log }: Props) {
  const reversed = [...log].reverse().slice(0, 40);

  return (
    <div className="panel event-timeline">
      <h3>Línea de tiempo</h3>
      <div className="event-timeline__list">
        {reversed.length === 0 && <p className="event-timeline__empty">Aún no hay eventos. Dale a reproducir.</p>}
        {reversed.map((evt) => {
          const meta = TYPE_META[evt.type];
          return (
            <div key={evt.id} className="event-timeline__row">
              <span className="mono event-timeline__tick">t={evt.tick}</span>
              <span className={`event-timeline__badge ${meta.className}`}>{meta.label}</span>
              <span className="event-timeline__detail">{evt.detail}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
