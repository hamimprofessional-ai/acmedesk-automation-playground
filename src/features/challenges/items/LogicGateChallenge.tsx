import { useMemo, useState } from 'react';
import { ChallengeShell } from '../ChallengeShell';

const WORDS = ['kernel', 'buffer', 'socket', 'daemon', 'quorum'];

export function LogicGateChallenge() {
  const a = useMemo(() => 6 + Math.floor(Math.random() * 9), []);
  const b = useMemo(() => 4 + Math.floor(Math.random() * 9), []);
  const target = useMemo(() => 55 + Math.floor(Math.random() * 40), []);
  const word = useMemo(() => WORDS[Math.floor(Math.random() * WORDS.length)], []);
  const items = useMemo(
    () => Array.from({ length: 6 }, (_, i) => `Node-${String.fromCharCode(65 + i)}`),
    [],
  );

  const [answer, setAnswer] = useState('');
  const [picked, setPicked] = useState<number | null>(null);
  const [slider, setSlider] = useState(0);
  const [typed, setTyped] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const record = (msg: string) => setResults((r) => [msg, ...r]);

  const third = 2;

  return (
    <ChallengeShell
      title="Logic & reasoning gate"
      tier="hard"
      blurb="No selector solves these — the bot must reason: compute a product, pick the correct index, hit a numeric target, and echo a case-sensitive word."
      goal={[
        `Solve the multiplication and submit the numeric answer.`,
        'Click the third node in the list (index 2).',
        `Drag the slider to exactly ${target} (±1) and confirm.`,
        'Type the displayed verification word exactly, then submit.',
      ]}
      selector='text-based assertions instead of fixed ids'
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <section className="gate space-y-2 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-sm font-medium">1 · Compute</h2>
          <p className="text-sm">
            What is <strong className="num">{a}</strong> × <strong className="num">{b}</strong>?
          </p>
          <input
            className="input"
            inputMode="numeric"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => record(Number(answer) === a * b ? 'math ✓ correct' : `math ✗ (expected ${a * b})`)}
          >
            Submit answer
          </button>
        </section>

        <section className="gate space-y-2 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-sm font-medium">2 · Pick the third node</h2>
          <div className="flex flex-wrap gap-2">
            {items.map((label, i) => (
              <button
                key={label}
                type="button"
                className={`btn-secondary ${picked === i ? 'ring-2 ring-brand-500' : ''}`}
                onClick={() => {
                  setPicked(i);
                  record(i === third ? 'picked Node-C ✓' : `picked ${label} ✗`);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400">Current pick: {picked === null ? 'none' : items[picked]}</p>
        </section>

        <section className="gate space-y-2 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-sm font-medium">2 · Reach the target</h2>
          <p className="text-sm">Target: {target}</p>
          <input
            type="range"
            min={0}
            max={100}
            value={slider}
            onChange={(e) => setSlider(Number(e.target.value))}
            className="w-full"
            aria-label="Target slider"
          />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>value: {slider}</span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => record(Math.abs(slider - target) <= 1 ? 'slider ✓' : `slider ✗ (${slider})`)}
            >
              Confirm
            </button>
          </div>
        </section>

        <section className="gate space-y-2 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-sm font-medium">4 · Type the word</h2>
          <p className="word font-mono text-lg tracking-widest text-slate-700 dark:text-slate-200">
            {word}
          </p>
          <input
            className="input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type it exactly"
            aria-label="Verification word"
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => record(typed === word ? 'word ✓' : 'word ✗')}
          >
            Submit word
          </button>
        </section>

        <section className="result log rounded-lg bg-slate-50 p-3 text-sm sm:col-span-2 dark:bg-slate-800/50">
          {results.length === 0 ? (
            <span className="text-slate-400">Results appear here as you solve each gate…</span>
          ) : (
            results.map((r, i) => <div key={i}>{r}</div>)
          )}
        </section>
      </div>
    </ChallengeShell>
  );
}
