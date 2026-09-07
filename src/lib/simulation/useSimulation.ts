"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { SimulationClock } from "./SimulationClock";
import { GoBackNEngine } from "./GoBackNEngine";
import { ScenarioConfig, FrameSnapshot, SimEvent } from "./types";

export const defaultConfig: ScenarioConfig = {
  protocol: "go-back-n",
  channelMode: "full-duplex",
  windowSize: 4,
  sequenceBits: 3,
  propagationDelayTicks: 3,
  timeoutTicks: 7,
  lossProbability: 0.15,
  ackLossProbability: 0.05,
  totalFramesToSend: 10,
  piggybackingEnabled: true,
};

export interface SimulationState {
  tick: number;
  isPlaying: boolean;
  isFinished: boolean;
  window: { base: number; size: number; nextSeq: number };
  frames: FrameSnapshot[];
  log: SimEvent[];
  config: ScenarioConfig;
}

// React nunca toca SimulationClock ni GoBackNEngine directamente: solo lee
// snapshots inmutables que este hook copia a useState en cada tick. Esto
// evita el bug clásico de mezclar mutación imperativa con el ciclo de
// renderizado declarativo de React.
export function useSimulation(initialConfig: ScenarioConfig = defaultConfig) {
  const [config, setConfig] = useState(initialConfig);
  const clockRef = useRef(new SimulationClock());
  const engineRef = useRef(new GoBackNEngine(config));

  const buildState = useCallback((): SimulationState => {
    const engine = engineRef.current;
    return {
      tick: clockRef.current.tick,
      isPlaying: clockRef.current.isPlaying,
      isFinished: engine.isFinished,
      window: engine.windowSnapshot,
      frames: engine.frameSnapshots,
      log: engine.log,
      config,
    };
  }, [config]);

  const [state, setState] = useState<SimulationState>(buildState);

  const rebuild = useCallback(
    (nextConfig: ScenarioConfig) => {
      clockRef.current.pause();
      clockRef.current = new SimulationClock();
      engineRef.current = new GoBackNEngine(nextConfig);
      clockRef.current.onTick(() => {
        engineRef.current.onTick(clockRef.current.tick);
        setState(buildState());
      });
      setConfig(nextConfig);
      setState(buildState());
    },
    [buildState]
  );

  // Suscripción inicial (solo una vez).
  const subscribed = useRef(false);
  if (!subscribed.current) {
    subscribed.current = true;
    clockRef.current.onTick(() => {
      engineRef.current.onTick(clockRef.current.tick);
      setState(buildState());
    });
  }

  const controls = useMemo(
    () => ({
      play: () => {
        clockRef.current.play();
        setState(buildState());
      },
      pause: () => {
        clockRef.current.pause();
        setState(buildState());
      },
      step: () => {
        clockRef.current.step();
        engineRef.current.onTick(clockRef.current.tick);
        setState(buildState());
      },
      reset: () => rebuild(config),
      setSpeed: (ms: number) => clockRef.current.setSpeed(ms),
      updateConfig: (patch: Partial<ScenarioConfig>) => rebuild({ ...config, ...patch }),
    }),
    [buildState, config, rebuild]
  );

  return { state, controls };
}
