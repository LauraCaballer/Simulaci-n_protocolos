# Simulador de Sliding Window / Go-Back-N

## Cómo está organizado

```
src/
  lib/simulation/       <- motor puro en TypeScript, SIN React, testeable aparte
    types.ts             Tipos y enums compartidos (FrameStatus, ScenarioConfig, SimEvent...)
    SimulationClock.ts    Reloj virtual: play/pausa/paso a paso/velocidad
    Frame.ts              Una trama: estado, timers, transiciones
    Channel.ts             El "medio físico": retardo, pérdida, simplex/dúplex
    ProtocolEngine.ts      Clase ABSTRACTA: contrato común de cualquier protocolo de ventana
    GoBackNEngine.ts       Implementación concreta de Go-Back-N (ya incluida)
    SlidingWindowEngine.ts  <- pendiente, ver abajo
    SelectiveRepeatEngine.ts <- opcional, extensión natural para "ir más allá"

  components/simulation/  <- UI en React, consume el motor a través de un hook
    useSimulation.ts        Hook que conecta SimulationClock + ProtocolEngine con React state
    WindowVisualizer.tsx     Casillas de la ventana (enviado/disponible/confirmado)
    ChannelView.tsx          Animación de frames/ACKs cruzando el canal
    TimerDisplay.tsx         Barra de progreso de cada temporizador activo
    ControlPanel.tsx         Sliders de ventana, RTT, pérdida + botones play/pausa/paso
    EventTimeline.tsx        Scrubber con el log de eventos (para retroceder y ver qué pasó)
    MetricsPanel.tsx         Eficiencia real vs teórica, utilización del canal

  app/
    page.tsx                Layout general de la página
```

## Por qué está separado así

El motor (`lib/simulation`) no importa nada de React. Esto es intencional:
puedes escribir tests unitarios del protocolo sin montar un solo componente,
y si más adelante quieres una versión en otro framework (o incluso una CLI
para generar los diagramas de la exposición), el motor se reutiliza tal cual.

`ProtocolEngine` es abstracta a propósito: define QUÉ pasos ocurren en cada
tick (enviar si hay espacio, revisar llegadas, revisar timeouts) pero deja
que cada protocolo decida DOS cosas que los diferencian:

1. `handleFrameArrival` — qué hace el receptor con un frame fuera de orden
   (Go-Back-N lo descarta; Selective Repeat lo guardaría en buffer).
2. `handleTimeout` — qué se reenvía cuando expira un timer
   (Go-Back-N reenvía toda la ventana; Selective Repeat reenviaría solo ese frame).

Así, agregar Selective Repeat más adelante (si quieres ir más allá del
alcance del trabajo) es solo otra subclase, no reescribir todo.

## SlidingWindowEngine — cómo plantearlo

Si quieres un modo "Sliding Window genérico" (para enseñar el mecanismo de
ventana en sí, separado de la política de reenvío), la forma más limpia es
que sea la MISMA base que Go-Back-N pero con `windowSize = 1` comparado
contra `windowSize = N`, en modo comparación lado a lado — así el estudiante
ve con sus propios ojos por qué el pipelining mejora la utilización del canal.
No necesitas una clase distinta para eso: es `GoBackNEngine` con distinta
`ScenarioConfig`. Resérvalo como una clase aparte solo si vas a implementar
una política de reenvío distinta (ahí sí se gana claridad separándolo).

## Piggybacking

Se activa en `ScenarioConfig.piggybackingEnabled` y solo tiene sentido si
`channelMode === "full-duplex"` (revisa `Channel.canReceiverTransmitConcurrently`).
Cuando está activo, en vez de que el receptor mande un ACK "vacío", lo agrega
al campo `piggybackedAck` del próximo frame de datos que él mismo envía en la
dirección contraria — así conviene mostrarlo en `ChannelView.tsx` con un ícono
compuesto (frame + ack en un solo bloque) para que se note visualmente.

## useSimulation.ts — el puente con React

```ts
// Idea general: el hook crea un SimulationClock + un ProtocolEngine,
// se suscribe a onTick, y en cada tick copia los snapshots (frameSnapshots,
// windowSnapshot, log) a useState. React nunca toca el motor directamente,
// solo lee snapshots inmutables — así evitas bugs de sincronización.
```

## Estado actual

Todo lo listado arriba ya está implementado y conectado en `src/app/page.tsx`:
`useSimulation.ts`, `WindowVisualizer`, `ChannelView`, `TimerDisplay`,
`ControlPanel`, `EventTimeline` y `MetricsPanel`.

Simplificación consciente en esta primera versión: los ACKs se aplican de
forma instantánea dentro de `GoBackNEngine.acknowledgeUpTo` (no viajan por
`Channel` con su propio retardo/pérdida), aunque `ackLossProbability` ya
existe en `ScenarioConfig`. Si quieres llevarlo más lejos: haz que el ACK
también sea un evento con `arriveTick` calculado por `Channel.send(..., true)`,
igual que ya se hace con los frames de datos.

## Cómo probarlo en tu navegador

Necesitas Node.js instalado (18 o superior). Desde la carpeta del proyecto:

```bash
npm install
npm run dev
```

Esto levanta un servidor local. Abre `http://localhost:3000` en el navegador
y ya deberías ver el panel de control a la izquierda y la simulación a la
derecha. Dale a "Reproducir" para verla correr sola, o "Paso a paso" para
avanzar tick por tick y explicar cada evento en vivo durante la exposición.

Si `npm install` falla por versión de Node, revisa con `node -v` — necesitas
18.17 o superior para Next.js 14.

Para ver errores de TypeScript sin levantar el servidor:

```bash
npx tsc --noEmit
```

## Despliegue en Vercel

Sin backend, sin variables de entorno, sin configuración especial:

```bash
npm install
npm run build
vercel deploy
```

O, más simple todavía: sube el proyecto a un repo de GitHub y conéctalo desde
[vercel.com/new](https://vercel.com/new) — Vercel detecta que es Next.js
automáticamente y no necesitas tocar ninguna configuración.
