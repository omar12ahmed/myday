// Small architectural line drawings; semantic stage names select the drawing, never arbitrary SVG from data.
export function FlowSymbol({ kind }: { kind?: string }) {
  return <svg viewBox="0 0 180 145" className="ex-flow-symbol" aria-hidden="true">
    <path className="ex-symbol-ground" d="M14 109 L91 72 L167 110 L91 145 Z M14 109 L91 145 L167 110" />
    {kind === 'stock' ? <g><path d="M36 104 V58 L93 31 L148 58 V104 M36 58 L93 88 L148 58 M93 88 V127 M36 104 L93 133 L148 104 M46 62 V48 L94 24 L140 47 V62 M56 80 V113 M73 88 V122" /><path d="M105 107 V93 L134 78 V108 Z" /></g>
      : kind === 'payment' ? <g><path d="M37 98 V45 L138 28 V100 L37 117 Z M47 60 L127 47 M49 75 L72 71 M49 89 L93 82" /><ellipse cx="112" cy="105" rx="27" ry="16" /><path d="M85 105 V115 A27 16 0 0 0 139 115 V105 M85 110 A27 16 0 0 0 139 110" /></g>
      : kind === 'fulfilment' ? <g><path d="M23 96 V50 L91 27 L122 44 V99 L59 123 Z M23 50 L58 67 L122 44 M58 67 V123 M122 63 L143 54 L161 80 V106 L133 118 L122 109 M135 61 V85 L156 77 M61 85 L119 64" /><ellipse cx="45" cy="108" rx="9" ry="14" /><ellipse cx="138" cy="112" rx="9" ry="14" /></g>
      : kind === 'delivery' ? <g><path d="M33 106 V57 L90 24 L147 56 V106 L90 136 Z M33 57 L90 87 L147 56 M90 87 V136 M100 126 V98 L126 84 V111" /><path d="M58 83 L70 77 L81 89 L108 61" /></g>
      : <g><ellipse cx="91" cy="37" rx="17" ry="20" /><path d="M56 107 V83 C56 51 126 51 126 83 V107 M76 84 V122 M107 84 V122 M56 101 L91 122 L126 101" /><path d="M122 48 L148 38 V73 L122 84 Z M127 55 L141 50 M127 65 L141 60" /></g>}
  </svg>;
}
