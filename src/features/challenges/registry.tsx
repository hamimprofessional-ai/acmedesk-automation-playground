import type { ComponentType } from 'react';
import type { Tier } from './ChallengeShell';
import { ShadowDomChallenge } from './items/ShadowDomChallenge';
import { NestedIframesChallenge } from './items/NestedIframesChallenge';
import { UnstableIdsChallenge } from './items/UnstableIdsChallenge';
import { MovingTargetChallenge } from './items/MovingTargetChallenge';
import { HoverRevealChallenge } from './items/HoverRevealChallenge';
import { ObscuredChallenge } from './items/ObscuredChallenge';
import { DetachedChallenge } from './items/DetachedChallenge';
import { DelayedAsyncChallenge } from './items/DelayedAsyncChallenge';
import { FlakyNetworkChallenge } from './items/FlakyNetworkChallenge';
import { NativePromptsChallenge } from './items/NativePromptsChallenge';
import { LogicGateChallenge } from './items/LogicGateChallenge';
import { DragDropChallenge } from './items/DragDropChallenge';
import { InfiniteScrollChallenge } from './items/InfiniteScrollChallenge';

export interface Challenge {
  slug: string;
  title: string;
  blurb: string;
  tier: Tier;
  tags: string[];
  Component: ComponentType;
}

export const CHALLENGES: Challenge[] = [
  {
    slug: 'shadow-dom',
    title: 'Shadow DOM',
    blurb: 'Open & closed shadow roots; selectors must pierce (or fail to pierce) them.',
    tier: 'hard',
    tags: ['shadow-dom', 'web-components', 'selectors'],
    Component: ShadowDomChallenge,
  },
  {
    slug: 'nested-iframes',
    title: 'Nested & dynamic iframes',
    blurb: 'Two-level iframes, delayed spawn, resizing and hidden frames.',
    tier: 'hard',
    tags: ['iframes', 'frames', 'waits'],
    Component: NestedIframesChallenge,
  },
  {
    slug: 'unstable-ids',
    title: 'Unstable IDs & attributes',
    blurb: 'IDs, names and test ids regenerate on a timer — brittle selectors break.',
    tier: 'hard',
    tags: ['selectors', 'flakiness'],
    Component: UnstableIdsChallenge,
  },
  {
    slug: 'moving-targets',
    title: 'Moving targets & layout shift',
    blurb: 'Floating buttons, dodge-on-hover and late banners that shift content.',
    tier: 'hard',
    tags: ['animations', 'occlusion', 'waits'],
    Component: MovingTargetChallenge,
  },
  {
    slug: 'hover-only',
    title: 'Hover-only controls',
    blurb: 'Actions revealed only on hover, plus tooltips overlapping buttons.',
    tier: 'medium',
    tags: ['hover', 'interactions'],
    Component: HoverRevealChallenge,
  },
  {
    slug: 'obscured',
    title: 'Overlays & occlusion',
    blurb: 'Interstitial ads, sticky cookie bars and pointer-interception failures.',
    tier: 'medium',
    tags: ['overlays', 'occlusion'],
    Component: ObscuredChallenge,
  },
  {
    slug: 'detached-dom',
    title: 'Detached & self-resetting DOM',
    blurb: 'Lists that rebuild their DOM, fields that reset, elements that vanish.',
    tier: 'hard',
    tags: ['stale-element', 'timing'],
    Component: DetachedChallenge,
  },
  {
    slug: 'delayed-async',
    title: 'Delayed async rendering',
    blurb: 'Skeletons then content after a random delay; a token appears unprompted.',
    tier: 'medium',
    tags: ['waits', 'skeletons'],
    Component: DelayedAsyncChallenge,
  },
  {
    slug: 'flaky-network',
    title: 'Flaky network & retries',
    blurb: 'Random 500s, 429 rate limits, timeouts and intermittent elements.',
    tier: 'hard',
    tags: ['network', 'retries', 'errors'],
    Component: FlakyNetworkChallenge,
  },
  {
    slug: 'native-prompts',
    title: 'Native dialogs',
    blurb: 'window.alert / confirm / prompt and beforeunload guards.',
    tier: 'medium',
    tags: ['dialogs', 'native'],
    Component: NativePromptsChallenge,
  },
  {
    slug: 'logic-gate',
    title: 'Logic & reasoning gate',
    blurb: 'Compute, pick by index, hit a slider target and type a word — no selector helps.',
    tier: 'hard',
    tags: ['reasoning', 'ai'],
    Component: LogicGateChallenge,
  },
  {
    slug: 'drag-and-drop',
    title: 'Drag & drop',
    blurb: 'Native HTML5 drag events for reordering and cross-column moves.',
    tier: 'hard',
    tags: ['drag-drop', 'interactions'],
    Component: DragDropChallenge,
  },
  {
    slug: 'infinite-scroll',
    title: 'Infinite scroll & lazy loading',
    blurb: 'An inner container streams paged rows as you scroll; no Load-more button.',
    tier: 'medium',
    tags: ['infinite-scroll', 'lazy-load', 'scrolling'],
    Component: InfiniteScrollChallenge,
  },
];

export function getChallenge(slug?: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.slug === slug);
}
