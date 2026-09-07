"use client";

import { useMemo } from "react";
import { FrameSnapshot, ScenarioConfig } from "@/lib/simulation/types";
import "./MetricsPanel.css";

interface Props {
  frames: FrameSnapshot[];
  tick: number;
  config: ScenarioConfig;
}

// Eficiencia teórica de un protocolo de ventana: U = min(1, W / (1 + 2a)),
// con a = tiempo de propagación / tiempo de transmisión de un frame.
// Aquí asumimos que transmitir un frame toma 1 tick, así que a = propagationDelayTicks.
// Esta es la fórmula que justifica por qué agrandar la ventana ayuda solo
// hasta cierto punto, y por qué canales con mucho retardo (a grande)
// necesitan ventanas más grandes para no desperdiciar el canal.
export function MetricsPanel({ frames, tick, config }: Props) {
  const metrics = useMemo(() => {
    const delivered = frames.filter((f) => f.status === "delivered" || f.status === "acked").length;
    const a = config.propagationDelayTicks;
    const theoretical = Math.min(1, config.windowSize / (1 + 2 * a));
    const real = tick > 0 ? delivered / tick : 0;
    return { delivered, theoretical, real, total: frames.length };
  }, [frames, tick, config]);

  return (
    <div className="panel metrics-panel">
      <h3>Métricas</h3>
      <div className="metrics-panel__grid">
        <div className="metrics-panel__stat">
          <span className="metrics-panel__value mono">
            {metrics.delivered}/{metrics.total}
          </span>
          <span className="metrics-panel__label">frames entregados</span>
        </div>
        <div className="metrics-panel__stat">
          <span className="metrics-panel__value mono">{(metrics.theoretical * 100).toFixed(0)}%</span>
          <span className="metrics-panel__label">eficiencia teórica (sin pérdidas)</span>
        </div>
        <div className="metrics-panel__stat">
          <span className="metrics-panel__value mono">{(metrics.real * 100).toFixed(0)}%</span>
          <span className="metrics-panel__label">utilización real del canal</span>
        </div>
      </div>
      <p className="metrics-panel__note">
        La eficiencia teórica usa U = min(1, W / (1 + 2a)); la real cuenta frames entregados sobre ticks
        transcurridos, así que baja cuando hay pérdidas y retransmisiones.
      </p>
    </div>
  );
}
