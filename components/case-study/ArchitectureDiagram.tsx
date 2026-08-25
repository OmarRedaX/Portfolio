// Blueprint-style system diagram, built from the facts in this page's own
// narrative (Architecture section) — not a stock icon set. Pure SVG with a
// viewBox so it scales cleanly at any width, including mobile. Layout uses
// generous gaps between elements so mono labels never collide with box text.
export function ArchitectureDiagram() {
  return (
    <figure className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 780 380"
          role="img"
          aria-labelledby="architecture-diagram-title"
          style={{ width: "100%", minWidth: "560px" }}
        >
        <title id="architecture-diagram-title">
          Quick Bite system architecture: three services, three databases, one event backbone
        </title>

        <defs>
          <marker
            id="arrow-accent"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--accent)" />
          </marker>
          <marker
            id="arrow-muted"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--foreground-muted)" />
          </marker>
        </defs>

        {/* Core <-> Order: synchronous internal HTTP */}
        <line
          x1="190"
          y1="62"
          x2="305"
          y2="62"
          stroke="var(--foreground-muted)"
          strokeWidth="1.5"
          markerEnd="url(#arrow-muted)"
          markerStart="url(#arrow-muted)"
        />
        <text
          x="247"
          y="50"
          textAnchor="middle"
          className="font-mono"
          fontSize="11"
          fill="var(--foreground-muted)"
        >
          internal HTTP
        </text>

        {/* Service -> own DB: ownership */}
        {[105, 390, 675].map((cx) => (
          <line
            key={cx}
            x1={cx}
            y1="95"
            x2={cx}
            y2="125"
            stroke="var(--foreground-muted)"
            strokeWidth="1.5"
            markerEnd="url(#arrow-muted)"
          />
        ))}

        {/* Order DB -> RabbitMQ: async publish */}
        <line
          x1="390"
          y1="180"
          x2="390"
          y2="228"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          markerEnd="url(#arrow-accent)"
        />
        <text x="405" y="208" className="font-mono" fontSize="11" fill="var(--accent)">
          publish
        </text>

        {/* RabbitMQ -> Analytics DB: async consume */}
        <path
          d="M 475 260 L 675 260 L 675 182"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          markerEnd="url(#arrow-accent)"
        />
        <text x="530" y="250" className="font-mono" fontSize="11" fill="var(--accent)">
          consume
        </text>

        {/* Service boxes */}
        {[
          { x: 20, label: "Core" },
          { x: 305, label: "Order" },
          { x: 590, label: "Analytics (Go)" },
        ].map((s) => (
          <g key={s.label}>
            <rect
              x={s.x}
              y="30"
              width="170"
              height="65"
              rx="8"
              fill="var(--surface)"
              stroke="var(--border)"
            />
            <text
              x={s.x + 85}
              y="68"
              textAnchor="middle"
              className="font-display"
              fontSize="17"
              fill="var(--foreground)"
            >
              {s.label}
            </text>
          </g>
        ))}

        {/* DB boxes */}
        {[
          { x: 20, lines: ["Core DB"] },
          { x: 305, lines: ["PostgreSQL", "(sharded)"] },
          { x: 590, lines: ["Analytics", "Store"] },
        ].map((d) => (
          <g key={d.x}>
            <rect
              x={d.x}
              y="125"
              width="170"
              height="55"
              rx="6"
              fill="none"
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            {d.lines.map((line, i) => (
              <text
                key={line}
                x={d.x + 85}
                y={d.lines.length === 1 ? 158 : 150 + i * 16}
                textAnchor="middle"
                className="font-mono"
                fontSize="12"
                fill="var(--foreground-muted)"
              >
                {line}
              </text>
            ))}
          </g>
        ))}

        {/* RabbitMQ event backbone */}
        <rect
          x="305"
          y="228"
          width="170"
          height="60"
          rx="8"
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeWidth="1.5"
        />
        <text
          x="390"
          y="256"
          textAnchor="middle"
          className="font-display"
          fontSize="16"
          fill="var(--foreground)"
        >
          RabbitMQ
        </text>
        <text
          x="390"
          y="274"
          textAnchor="middle"
          className="font-mono"
          fontSize="11"
          fill="var(--foreground-muted)"
        >
          event backbone
        </text>
        </svg>
      </div>
      <figcaption className="text-small text-foreground-muted">
        Core and Order communicate synchronously over internal HTTP. Order publishes and
        Analytics consumes asynchronously through RabbitMQ — each service keeps its own
        database.
      </figcaption>
    </figure>
  );
}
