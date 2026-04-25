import { useState } from 'react'
import { Arrow, Circle, Layer, Rect, Stage, Text } from 'react-konva'
import { Plus, Trash2 } from 'lucide-react'

type Mode = 'move' | 'arrow'
type Token = { id: string; x: number; y: number; label: string; team: 'home' | 'away' }
type ArrowDef = { id: string; from: { x: number; y: number }; to: { x: number; y: number } }

const FIELD_W = 800
const FIELD_H = 520

const INITIAL_TOKENS: Token[] = [
  // 4-3-3 Heim
  { id: 'h1', x: 60, y: 260, label: '1', team: 'home' },
  { id: 'h2', x: 160, y: 110, label: '2', team: 'home' },
  { id: 'h3', x: 160, y: 210, label: '4', team: 'home' },
  { id: 'h4', x: 160, y: 310, label: '5', team: 'home' },
  { id: 'h5', x: 160, y: 410, label: '3', team: 'home' },
  { id: 'h6', x: 320, y: 180, label: '8', team: 'home' },
  { id: 'h7', x: 320, y: 260, label: '6', team: 'home' },
  { id: 'h8', x: 320, y: 340, label: '10', team: 'home' },
  { id: 'h9', x: 480, y: 130, label: '7', team: 'home' },
  { id: 'h10', x: 480, y: 260, label: '9', team: 'home' },
  { id: 'h11', x: 480, y: 390, label: '11', team: 'home' },
]

export default function TacticsPage() {
  const [mode, setMode] = useState<Mode>('move')
  const [tokens, setTokens] = useState<Token[]>(INITIAL_TOKENS)
  const [arrows, setArrows] = useState<ArrowDef[]>([])
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null)

  function handleStageClick(e: { evt: MouseEvent; target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } | null } }) {
    if (mode !== 'arrow') return
    const stage = e.target.getStage()
    const pos = stage?.getPointerPosition()
    if (!pos) return
    if (!arrowStart) {
      setArrowStart(pos)
    } else {
      setArrows((a) => [...a, { id: crypto.randomUUID(), from: arrowStart, to: pos }])
      setArrowStart(null)
    }
  }

  function moveToken(id: string, x: number, y: number) {
    setTokens((ts) => ts.map((t) => (t.id === id ? { ...t, x, y } : t)))
  }

  function clearArrows() {
    setArrows([])
    setArrowStart(null)
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Taktik-Board</h1>
          <p className="text-sm text-slate-600">
            Spieler ziehen zum Positionieren. Pfeil-Modus: zwei Klicks für Laufweg/Pass.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className={mode === 'move' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setMode('move')}
          >
            Verschieben
          </button>
          <button
            className={mode === 'arrow' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => {
              setMode('arrow')
              setArrowStart(null)
            }}
          >
            <Plus className="h-4 w-4" /> Pfeil
          </button>
          <button className="btn-ghost text-rose-600" onClick={clearArrows}>
            <Trash2 className="h-4 w-4" /> Pfeile leeren
          </button>
        </div>
      </header>

      <div className="rounded-xl border border-slate-200 bg-emerald-700/10 p-2">
        <Stage width={FIELD_W} height={FIELD_H} onClick={handleStageClick}>
          <Layer>
            {/* Spielfeld */}
            <Rect x={0} y={0} width={FIELD_W} height={FIELD_H} fill="#16a34a" />
            <Rect x={2} y={2} width={FIELD_W - 4} height={FIELD_H - 4} stroke="white" strokeWidth={2} />
            <Rect x={FIELD_W / 2 - 1} y={2} width={2} height={FIELD_H - 4} fill="white" />
            <Circle x={FIELD_W / 2} y={FIELD_H / 2} radius={50} stroke="white" strokeWidth={2} />
            {/* Strafraum links */}
            <Rect x={2} y={FIELD_H / 2 - 100} width={120} height={200} stroke="white" strokeWidth={2} />
            {/* Strafraum rechts */}
            <Rect x={FIELD_W - 122} y={FIELD_H / 2 - 100} width={120} height={200} stroke="white" strokeWidth={2} />

            {/* Spieler */}
            {tokens.map((t) => (
              <PlayerToken key={t.id} token={t} draggable={mode === 'move'} onMove={moveToken} />
            ))}

            {/* Pfeile */}
            {arrows.map((a) => (
              <Arrow
                key={a.id}
                points={[a.from.x, a.from.y, a.to.x, a.to.y]}
                pointerLength={10}
                pointerWidth={10}
                fill="#facc15"
                stroke="#facc15"
                strokeWidth={3}
              />
            ))}
            {arrowStart && (
              <Circle x={arrowStart.x} y={arrowStart.y} radius={6} fill="#facc15" />
            )}
          </Layer>
        </Stage>
      </div>

      <div className="text-sm text-slate-500">
        Hinweis: Speichern und KI-gestützte Übungsableitung folgen in der nächsten Iteration.
      </div>
    </div>
  )
}

function PlayerToken({
  token, draggable, onMove,
}: { token: Token; draggable: boolean; onMove: (id: string, x: number, y: number) => void }) {
  return (
    <>
      <Circle
        x={token.x}
        y={token.y}
        radius={18}
        fill={token.team === 'home' ? '#1e3a8a' : '#dc2626'}
        stroke="white"
        strokeWidth={2}
        draggable={draggable}
        onDragEnd={(e) => onMove(token.id, e.target.x(), e.target.y())}
      />
      <Text
        x={token.x - 10}
        y={token.y - 6}
        text={token.label}
        fontSize={12}
        fontStyle="bold"
        fill="white"
        listening={false}
      />
    </>
  )
}
