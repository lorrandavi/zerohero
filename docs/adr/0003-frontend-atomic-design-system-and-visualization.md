# Frontend Atomic Design System and Payoff Visualization

We decided to build the ZeroHero frontend (`apps/web`) using an Atomic Design System with a Single Source of Truth (SST) in `apps/web/src/design-system/`, pairing TypeScript constants (`tokens.ts`) with CSS Custom Properties (`tokens.css`) and zero external UI/runtime dependencies. Graphical elements and SVG icons are self-contained locally within `src/design-system/icons/` without external CDN requests.

For visualization, the multi-month payoff curve timeline and monthly burn rate charts are rendered via custom, responsive SVG components rather than third-party charting libraries, eliminating React 19 peer-dependency risks, minimizing bundle size, and ensuring pixel-level visual harmony with the financial command center dark theme.

The application adheres to a high-density, high-clarity command center aesthetic: deep slate surfaces (`#090a0f`, `#12141d`), emerald/cyan glowing accents (`#10b981`, `#06b6d4`) signaling debt elimination, tabular numerals to prevent layout jitter during timeline scrubs, and focused operational views balancing visual personality without minimalist sterility or cluttered overcrowding.
