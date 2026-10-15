import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ChallengeShell } from '../ChallengeShell';

const BOARD_W = 480;
const BOARD_H = 220;
const SIG_W = 480;
const SIG_H = 160;
const DOT_RADIUS = 12;
const HIT_RADIUS = 18;
const TARGET_SCORE = 3;
const DOT_INTERVAL = 900;

interface Point {
  x: number;
  y: number;
}

function posFromEvent(
  e: ReactPointerEvent<HTMLCanvasElement>,
  w: number,
  h: number,
): Point {
  const rect = e.currentTarget.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (w / rect.width),
    y: (e.clientY - rect.top) * (h / rect.height),
  };
}

function drawSignatureBase(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, SIG_W, SIG_H);
  ctx.strokeStyle = '#e2e8f0';
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(16, SIG_H - 40);
  ctx.lineTo(SIG_W - 16, SIG_H - 40);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Sign above the line', 16, SIG_H - 52);
}

export function CanvasChallenge() {
  const [dot, setDot] = useState<Point>({ x: BOARD_W / 2, y: BOARD_H / 2 });
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const won = score >= TARGET_SCORE;
  const boardRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (won) return;
    const timer = window.setInterval(() => {
      setDot({
        x: 40 + Math.random() * (BOARD_W - 80),
        y: 40 + Math.random() * (BOARD_H - 80),
      });
    }, DOT_INTERVAL);
    return () => window.clearInterval(timer);
  }, [won]);

  useEffect(() => {
    const canvas = boardRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, BOARD_W, BOARD_H);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= BOARD_W; x += 40) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, BOARD_H);
    }
    for (let y = 0; y <= BOARD_H; y += 40) {
      ctx.moveTo(0, y);
      ctx.lineTo(BOARD_W, y);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = won ? '#10b981' : '#4f46e5';
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillText(`Score ${score}/${TARGET_SCORE} · Misses ${misses}`, 12, 22);
  }, [dot, score, misses, won]);

  function handleBoardPointer(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (won) return;
    const p = posFromEvent(e, BOARD_W, BOARD_H);
    if (Math.hypot(p.x - dot.x, p.y - dot.y) <= HIT_RADIUS) {
      setScore((s) => s + 1);
    } else {
      setMisses((m) => m + 1);
    }
  }

  const sigRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    const ctx = sigRef.current?.getContext('2d');
    if (ctx) drawSignatureBase(ctx);
  }, []);

  function sigStart(e: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = sigRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    drawing.current = true;
    setSigned(false);
    const p = posFromEvent(e, SIG_W, SIG_H);
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    canvas.setPointerCapture(e.pointerId);
  }

  function sigMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = sigRef.current?.getContext('2d');
    if (!ctx) return;
    const p = posFromEvent(e, SIG_W, SIG_H);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasDrawn(true);
  }

  function sigEnd() {
    drawing.current = false;
  }

  function clearSignature() {
    const ctx = sigRef.current?.getContext('2d');
    if (ctx) drawSignatureBase(ctx);
    setHasDrawn(false);
    setSigned(false);
  }

  return (
    <ChallengeShell
      title="Canvas & coordinate targeting"
      tier="hard"
      blurb="Both widgets are painted on <canvas>, so their contents are invisible to the DOM — no selector can find the dot or the strokes. Automation has to act by pixel coordinates."
      goal={[
        'Click the moving target until the score reads 3/3 (it relocates every 0.9s).',
        'The live score/miss counter is drawn on the canvas only — read it visually.',
        'Drag on the signature pad to draw, then click Confirm signature.',
      ]}
      selector='canvas[data-testid="canvas-board"] · mouse.click(x, y)'
    >
      <div className="space-y-6">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Target practice</h2>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setScore(0);
                setMisses(0);
              }}
            >
              Reset
            </button>
          </div>
          <canvas
            ref={boardRef}
            data-testid="canvas-board"
            width={BOARD_W}
            height={BOARD_H}
            onPointerDown={handleBoardPointer}
            className="w-full cursor-crosshair rounded-lg border border-slate-200 dark:border-slate-700"
          />
          {won && (
            <p className="result text-sm text-emerald-600 dark:text-emerald-400">
              Target cleared — 3/3 hits.
            </p>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Signature pad</h2>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={clearSignature}>
                Clear
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!hasDrawn || signed}
                onClick={() => setSigned(true)}
              >
                Confirm signature
              </button>
            </div>
          </div>
          <canvas
            ref={sigRef}
            data-testid="canvas-signature"
            width={SIG_W}
            height={SIG_H}
            onPointerDown={sigStart}
            onPointerMove={sigMove}
            onPointerUp={sigEnd}
            onPointerLeave={sigEnd}
            className="w-full touch-none rounded-lg border border-slate-200 dark:border-slate-700"
          />
          {signed && (
            <p className="result text-sm text-emerald-600 dark:text-emerald-400">
              Signature captured.
            </p>
          )}
        </section>
      </div>
    </ChallengeShell>
  );
}
