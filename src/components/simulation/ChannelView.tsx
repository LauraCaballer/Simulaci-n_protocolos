"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { SimEvent } from "@/lib/simulation/types";
import "./ChannelView.css";

interface Props {
  log: SimEvent[];
  piggybackingEnabled: boolean;
}

// Solo animamos los eventos más recientes del log (una "ventana" de tiempo
// real, no de ticks) para no acumular pulsos viejos en pantalla. Cada tipo
// de evento tiene un color y una dirección de viaje fijos, así el color
// siempre significa lo mismo: ámbar = dato yendo al receptor, cian = ACK
// volviendo al emisor, rojo = algo que no llegó.
const TRAVEL_MS = 1100;

function directionFor(type: SimEvent["type"]): "forward" | "backward" | null {
  if (type === "send" || type === "loss") return "forward";
  if (type === "window-slide" || type === "ack-send") return "backward";
  return null;
}

export function ChannelView({ log, piggybackingEnabled }: Props) {
  const recent = useMemo(() => log.slice(-6), [log]);

  return (
    <div className="panel channel-view">
      <h3>Canal {piggybackingEnabled ? "(dúplex, con piggybacking)" : ""}</h3>
      <div className="channel-view__stage">
        <div className="channel-view__endpoint">Emisor</div>
        <div className="channel-view__track">
          <div className="channel-view__rail channel-view__rail--forward" />
          <div className="channel-view__rail channel-view__rail--backward" />
          <AnimatePresence>
            {recent.map((evt) => {
              const dir = directionFor(evt.type);
              if (!dir) return null;
              const isLoss = evt.type === "loss";
              return (
                <motion.div
                  key={evt.id}
                  className={`channel-view__pulse channel-view__pulse--${dir} ${
                    isLoss ? "channel-view__pulse--loss" : ""
                  }`}
                  initial={{ left: dir === "forward" ? "0%" : "100%", opacity: 0 }}
                  animate={
                    isLoss
                      ? { left: "50%", opacity: [0, 1, 0] }
                      : { left: dir === "forward" ? "100%" : "0%", opacity: [0, 1, 1, 0] }
                  }
                  exit={{ opacity: 0 }}
                  transition={{ duration: TRAVEL_MS / 1000, ease: "linear" }}
                >
                  <span className="mono">{evt.type === "loss" ? "✕" : evt.seq}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        <div className="channel-view__endpoint">Receptor</div>
      </div>
      <p className="channel-view__caption">
        Ámbar = dato hacia el receptor · Cian = confirmación de vuelta · Rojo = se perdió en el canal
      </p>
    </div>
  );
}
