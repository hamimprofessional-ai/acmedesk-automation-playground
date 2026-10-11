import { ChallengeShell } from '../ChallengeShell';

class OpenShadowCard extends HTMLElement {
  private built = false;

  connectedCallback() {
    if (this.built) return;
    this.built = true;
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host { display:block; }
        .card { border:1px solid #cbd5e1; border-radius:10px; padding:14px; display:grid; gap:10px; font-family:inherit; }
        label { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:#64748b; }
        input { border:1px solid #cbd5e1; border-radius:8px; padding:8px 10px; font:inherit; }
        button { background:#4f46e5; color:#fff; border:0; border-radius:8px; padding:8px 14px; font:inherit; cursor:pointer; }
        .status { font-size:13px; color:#059669; min-height:18px; }
      </style>
      <div class="card" part="card">
        <label for="cardholder">Cardholder name</label>
        <input id="cardholder" part="input" aria-label="Cardholder name" />
        <button part="button" type="button">Save card</button>
        <span class="status" data-testid="shadow-open-status" role="status"></span>
      </div>`;
    const input = root.querySelector('input') as HTMLInputElement;
    const status = root.querySelector('.status') as HTMLElement;
    (root.querySelector('button') as HTMLButtonElement).addEventListener('click', () => {
      status.textContent = input.value.trim() ? `Saved: ${input.value.trim()}` : 'No name entered';
    });
  }
}

class ClosedShadowCard extends HTMLElement {
  private built = false;

  connectedCallback() {
    if (this.built) return;
    this.built = true;
    const root = this.attachShadow({ mode: 'closed' });
    root.innerHTML = `
      <style>
        :host { display:block; }
        .card { border:1px solid #f59e0b; border-radius:10px; padding:14px; display:grid; gap:10px; font-family:inherit; background:#fffbeb; }
        strong { color:#92400e; }
        .hint { font-size:12px; color:#b45309; }
        button { background:#d97706; color:#fff; border:0; border-radius:8px; padding:8px 14px; font:inherit; cursor:pointer; }
        code { font-size:15px; letter-spacing:.08em; }
      </style>
      <div class="card" part="card">
        <strong>Closed shadow root</strong>
        <span class="hint">Reveal the code, then capture it from the host.</span>
        <button type="button">Reveal code</button>
        <code id="code">····</code>
      </div>`;
    const btn = root.querySelector('button') as HTMLButtonElement;
    const code = root.querySelector('#code') as HTMLElement;
    btn.addEventListener('click', () => {
      code.textContent = `CH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    });
  }
}

let defined = false;
function defineShadowElements() {
  if (defined) return;
  defined = true;
  if (!customElements.get('acmedesk-shadow-open')) customElements.define('acmedesk-shadow-open', OpenShadowCard);
  if (!customElements.get('acmedesk-shadow-closed')) customElements.define('acmedesk-shadow-closed', ClosedShadowCard);
}

export function ShadowDomChallenge() {
  defineShadowElements();
  return (
    <ChallengeShell
      title="Shadow DOM"
      tier="hard"
      blurb="Two form cards live inside shadow roots — one open, one closed. Standard DOM queries can't see the internal elements."
      goal={[
        'Enter "Alex Vance" in the open shadow card and click "Save card" — read the confirmation status.',
        'Click "Reveal code" in the closed shadow card and capture the generated code.',
        'Prove your selectors reach into the open shadow root but not the closed one.',
      ]}
      selector='acmedesk-shadow-open >> [aria-label="Cardholder name"]'
    >
      <div className="space-y-4" data-testid="shadow-stage">
        {/* @ts-expect-error custom element */}
        <acmedesk-shadow-open data-testid="shadow-open" />
        {/* @ts-expect-error custom element */}
        <acmedesk-shadow-closed data-testid="shadow-closed" />
        <p className="text-xs text-slate-400">
          Tip: Playwright pierces <em>open</em> shadow roots automatically. A closed root is unreachable from JS —
          you must interact positionally or via the host's accessible tree.
        </p>
      </div>
    </ChallengeShell>
  );
}
