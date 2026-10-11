// A web component rendered inside a Shadow DOM. Automation tools must pierce
// the shadow root to interact with the input and read the chips.
export class TagInputElement extends HTMLElement {
  private tags: string[] = [];
  private input!: HTMLInputElement;
  private chips!: HTMLSpanElement;

  static get observedAttributes() {
    return ['value'];
  }

  get value(): string {
    return this.tags.join(',');
  }

  set value(v: string) {
    this.tags = v ? v.split(',').map((t) => t.trim()).filter(Boolean) : [];
    this.render();
  }

  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host { display:block; }
        .box {
          display:flex; flex-wrap:wrap; gap:4px; align-items:center;
          border:1px solid #cbd5e1; border-radius:8px; padding:6px 8px; min-height:38px;
          background:#fff; font-family:inherit;
        }
        .chip {
          display:inline-flex; align-items:center; gap:4px; background:#e0e7ff; color:#3730a3;
          border-radius:999px; padding:2px 8px; font-size:12px;
        }
        .chip button { border:0; background:transparent; color:#3730a3; cursor:pointer; font-size:12px; }
        input { border:0; outline:0; flex:1; min-width:80px; font-size:14px; padding:2px; font-family:inherit; }
      </style>
      <div class="box" part="box">
        <span class="chips"></span>
        <input type="text" placeholder="Add tag and press Enter" aria-label="Add tag" />
      </div>
    `;
    this.input = root.querySelector('input') as HTMLInputElement;
    this.chips = root.querySelector('.chips') as HTMLSpanElement;

    this.input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        this.add(this.input.value);
      } else if (e.key === 'Backspace' && this.input.value === '' && this.tags.length) {
        this.tags.pop();
        this.render();
        this.emit();
      }
    });

    (this.querySelector('[slot="label"]') as HTMLElement | null)?.setAttribute('part', 'label');
    this.render();
  }

  attributeChangedCallback(name: string, _old: string, next: string) {
    if (name === 'value') {
      this.tags = next ? next.split(',').map((t) => t.trim()).filter(Boolean) : [];
      this.render();
    }
  }

  private add(raw: string) {
    const value = raw.trim();
    if (!value) return;
    if (!this.tags.includes(value)) this.tags.push(value);
    this.input.value = '';
    this.render();
    this.emit();
  }

  private emit() {
    this.setAttribute('value', this.tags.join(','));
    this.dispatchEvent(
      new CustomEvent('change', { detail: this.tags.slice(), bubbles: true, composed: true }),
    );
  }

  private render() {
    if (!this.chips) return;
    this.chips.innerHTML = '';
    this.tags.forEach((tag) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.append(tag);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '×';
      btn.setAttribute('aria-label', `Remove ${tag}`);
      btn.addEventListener('click', () => {
        this.tags = this.tags.filter((t) => t !== tag);
        this.render();
        this.emit();
      });
      chip.appendChild(btn);
      this.chips.appendChild(chip);
    });
  }
}

export function defineTagInput() {
  if (!customElements.get('acmedesk-tag-input')) {
    customElements.define('acmedesk-tag-input', TagInputElement);
  }
}
