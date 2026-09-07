"use client";

import { FrameSnapshot } from "@/lib/simulation/types";
import "./TimerDisplay.css";

interface Props {
  frames: FrameSnapshot[];
  currentTick: number;
  timeoutTicks: number;
}

// El temporizador es la pieza que más cuesta "sentir" solo leyendo teoría:
// aquí se ve literalmente la barra vaciándose y, si llega a cero sin ACK,
// el frame se marca en rojo — ese es el momento exacto que dispara un
// timeout en la simulación.
export function TimerDisplay({ frames, currentTick, timeoutTicks }: Props) {
  const active = frames.filter(
    (f) => f.status === "in-transit" && f.sentAtTick !== null && f.timeoutAtTick !== null
  );

  if (active.length === 0) {
    return (
      <div className="panel timer-display">
        <h3>Temporizadores</h3>
        <p className="timer-display__empty">Ningún frame esperando confirmación ahora mismo.</p>
      </div>
    );
  }

  return (
    <div className="panel timer-display">
      <h3>Temporizadores</h3>
      <div className="timer-display__list">
        {active.map((f) => {
          const elapsed = currentTick - (f.sentAtTick ?? currentTick);
          const remaining = Math.max(0, timeoutTicks - elapsed);
          const pct = Math.min(100, (elapsed / timeoutTicks) * 100);
          const critical = remaining <= Math.ceil(timeoutTicks * 0.2);
          return (
            <div key={f.seq} className="timer-display__row">
              <span className="mono timer-display__seq">#{f.seq}</span>
              <div className="timer-display__bar">
                <div
                  className={`timer-display__fill ${critical ? "timer-display__fill--critical" : ""}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="mono timer-display__remaining">{remaining} ticks</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
