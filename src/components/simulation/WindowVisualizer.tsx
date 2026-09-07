"use client";

import { FrameSnapshot } from "@/lib/simulation/types";
import "./WindowVisualizer.css";

interface Props {
  frames: FrameSnapshot[];
  windowBase: number;
  windowSize: number;
}

const STATUS_LABEL: Record<string, string> = {
  queued: "en cola",
  "in-window": "en ventana",
  "in-transit": "en tránsito",
  delivered: "entregado",
  lost: "perdido",
  corrupted: "corrompido",
  discarded: "descartado",
  acked: "confirmado",
  "timed-out": "venció",
};

export function WindowVisualizer({ frames, windowBase, windowSize }: Props) {
  const windowEnd = windowBase + windowSize - 1;

  return (
    <div className="panel window-viz">
      <h3>Ventana deslizante</h3>
      <div className="window-viz__track">
        {frames.map((frame) => {
          const inWindow = frame.seq >= windowBase && frame.seq <= windowEnd;
          return (
            <div
              key={frame.seq}
              className={`window-viz__cell window-viz__cell--${frame.status} ${
                inWindow ? "window-viz__cell--active" : ""
              }`}
              title={STATUS_LABEL[frame.status]}
            >
              <span className="mono window-viz__seq">{frame.seq}</span>
              {frame.isRetransmission && <span className="window-viz__retx">↻</span>}
            </div>
          );
        })}
      </div>
      <div className="window-viz__legend">
        <span><i className="window-viz__dot window-viz__dot--active" /> dentro de la ventana</span>
        <span><i className="window-viz__dot window-viz__dot--acked" /> confirmado</span>
        <span><i className="window-viz__dot window-viz__dot--lost" /> perdido / descartado</span>
      </div>
    </div>
  );
}
