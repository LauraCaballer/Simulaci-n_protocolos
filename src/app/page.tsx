"use client";

import { useSimulation, defaultConfig } from "@/lib/simulation/useSimulation";
import { WindowVisualizer } from "@/components/simulation/WindowVisualizer";
import { ChannelView } from "@/components/simulation/ChannelView";
import { TimerDisplay } from "@/components/simulation/TimerDisplay";
import { ControlPanel } from "@/components/simulation/ControlPanel";
import { EventTimeline } from "@/components/simulation/EventTimeline";
import { MetricsPanel } from "@/components/simulation/MetricsPanel";

export default function Page() {
  const { state, controls } = useSimulation(defaultConfig);

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26 }}>Go-Back-N: sliding window en acción</h1>
        <p style={{ color: "var(--text-dim)", marginTop: 6 }}>
          Tick actual: <span className="mono">{state.tick}</span> · Estado:{" "}
          {state.isFinished ? "terminado" : state.isPlaying ? "reproduciendo" : "en pausa"}
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        <ControlPanel
          config={state.config}
          isPlaying={state.isPlaying}
          isFinished={state.isFinished}
          onPlay={controls.play}
          onPause={controls.pause}
          onStep={controls.step}
          onReset={controls.reset}
          onConfigChange={controls.updateConfig}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <ChannelView log={state.log} piggybackingEnabled={state.config.piggybackingEnabled} />
          <WindowVisualizer frames={state.frames} windowBase={state.window.base} windowSize={state.window.size} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <TimerDisplay frames={state.frames} currentTick={state.tick} timeoutTicks={state.config.timeoutTicks} />
            <MetricsPanel frames={state.frames} tick={state.tick} config={state.config} />
          </div>
          <EventTimeline log={state.log} />
        </div>
      </div>
    </main>
  );
}
