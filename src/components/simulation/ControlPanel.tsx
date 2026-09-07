"use client";

import { ScenarioConfig } from "@/lib/simulation/types";
import "./ControlPanel.css";

interface Props {
  config: ScenarioConfig;
  isPlaying: boolean;
  isFinished: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onConfigChange: (patch: Partial<ScenarioConfig>) => void;
}

export function ControlPanel({
  config,
  isPlaying,
  isFinished,
  onPlay,
  onPause,
  onStep,
  onReset,
  onConfigChange,
}: Props) {
  return (
    <div className="panel control-panel">
      <h3>Controles</h3>
      <div className="control-panel__transport">
        <button onClick={isPlaying ? onPause : onPlay} disabled={isFinished && !isPlaying}>
          {isPlaying ? "Pausar" : "Reproducir"}
        </button>
        <button onClick={onStep} disabled={isPlaying || isFinished}>
          Paso a paso
        </button>
        <button onClick={onReset} className="control-panel__reset">
          Reiniciar
        </button>
      </div>

      <div className="control-panel__field">
        <label>
          Tamaño de ventana: <span className="mono">{config.windowSize}</span>
        </label>
        <input
          type="range"
          min={1}
          max={7}
          value={config.windowSize}
          onChange={(e) => onConfigChange({ windowSize: Number(e.target.value) })}
        />
      </div>

      <div className="control-panel__field">
        <label>
          Retardo de propagación: <span className="mono">{config.propagationDelayTicks} ticks</span>
        </label>
        <input
          type="range"
          min={1}
          max={8}
          value={config.propagationDelayTicks}
          onChange={(e) => onConfigChange({ propagationDelayTicks: Number(e.target.value) })}
        />
      </div>

      <div className="control-panel__field">
        <label>
          Timeout: <span className="mono">{config.timeoutTicks} ticks</span>
        </label>
        <input
          type="range"
          min={2}
          max={15}
          value={config.timeoutTicks}
          onChange={(e) => onConfigChange({ timeoutTicks: Number(e.target.value) })}
        />
      </div>

      <div className="control-panel__field">
        <label>
          Probabilidad de pérdida: <span className="mono">{Math.round(config.lossProbability * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={0.6}
          step={0.05}
          value={config.lossProbability}
          onChange={(e) => onConfigChange({ lossProbability: Number(e.target.value) })}
        />
      </div>

      <div className="control-panel__field control-panel__field--row">
        <label>Modo del canal</label>
        <select
          value={config.channelMode}
          onChange={(e) => onConfigChange({ channelMode: e.target.value as ScenarioConfig["channelMode"] })}
        >
          <option value="simplex">Simplex</option>
          <option value="half-duplex">Semi-dúplex</option>
          <option value="full-duplex">Dúplex completo</option>
        </select>
      </div>

      <div className="control-panel__field control-panel__field--row">
        <label>Piggybacking</label>
        <input
          type="checkbox"
          checked={config.piggybackingEnabled}
          disabled={config.channelMode !== "full-duplex"}
          onChange={(e) => onConfigChange({ piggybackingEnabled: e.target.checked })}
        />
      </div>
    </div>
  );
}
