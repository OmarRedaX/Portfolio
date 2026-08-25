// Illustrates the transactional-outbox + idempotent-consumer + DLQ pattern
// described in Engineering Decisions and Correctness — the mechanism that
// keeps order-state changes and their RabbitMQ events consistent. Gaps
// between boxes are sized to fit their labels without overlap, at any width.
export function EventFlowDiagram() {
  return (
    <figure className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 920 320"
          role="img"
          aria-labelledby="event-flow-diagram-title"
          style={{ width: "100%", minWidth: "640px" }}
        >
        <title id="event-flow-diagram-title">
          Transactional outbox, RabbitMQ, and idempotent consumer with dead-letter queue
        </title>

        <defs>
          <marker
            id="ef-arrow-accent"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--accent)" />
          </marker>
          <marker
            id="ef-arrow-muted"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--foreground-muted)" />
          </marker>
        </defs>

        {/* Order Transaction -> Outbox Relay */}
        <line
          x1="170"
          y1="137"
          x2="260"
          y2="137"
          stroke="var(--foreground-muted)"
          strokeWidth="1.5"
          markerEnd="url(#ef-arrow-muted)"
        />
        <text x="215" y="127" textAnchor="middle" className="font-mono" fontSize="10" fill="var(--foreground-muted)">
          same tx
        </text>

        {/* Outbox Relay -> RabbitMQ */}
        <line
          x1="390"
          y1="137"
          x2="480"
          y2="137"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          markerEnd="url(#ef-arrow-accent)"
        />
        <text x="435" y="127" textAnchor="middle" className="font-mono" fontSize="10" fill="var(--accent)">
          publish
        </text>

        {/* RabbitMQ -> Consumer */}
        <line
          x1="610"
          y1="137"
          x2="700"
          y2="137"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          markerEnd="url(#ef-arrow-accent)"
        />
        <text x="655" y="127" textAnchor="middle" className="font-mono" fontSize="10" fill="var(--accent)">
          consume
        </text>

        {/* Consumer -> Applied once */}
        <line
          x1="745"
          y1="165"
          x2="672"
          y2="223"
          stroke="var(--foreground-muted)"
          strokeWidth="1.5"
          markerEnd="url(#ef-arrow-muted)"
        />
        <text x="650" y="200" textAnchor="middle" className="font-mono" fontSize="10" fill="var(--foreground-muted)">
          idempotent
        </text>

        {/* Consumer -> DLQ */}
        <line
          x1="790"
          y1="165"
          x2="823"
          y2="223"
          stroke="var(--foreground-muted)"
          strokeWidth="1.5"
          markerEnd="url(#ef-arrow-muted)"
        />
        <text x="845" y="200" textAnchor="middle" className="font-mono" fontSize="10" fill="var(--foreground-muted)">
          redelivered
        </text>

        {/* Order Transaction */}
        <rect x="20" y="110" width="150" height="55" rx="8" fill="var(--surface)" stroke="var(--border)" />
        <text x="95" y="134" textAnchor="middle" className="font-display" fontSize="13" fill="var(--foreground)">
          Order Transaction
        </text>
        <text x="95" y="151" textAnchor="middle" className="font-mono" fontSize="9.5" fill="var(--foreground-muted)">
          order row + outbox row
        </text>

        {/* Outbox Relay */}
        <rect x="260" y="110" width="130" height="55" rx="6" fill="var(--surface)" stroke="var(--border)" />
        <text x="325" y="142" textAnchor="middle" className="font-mono" fontSize="12" fill="var(--foreground)">
          Outbox Relay
        </text>

        {/* RabbitMQ */}
        <rect x="480" y="110" width="130" height="55" rx="6" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />
        <text x="545" y="142" textAnchor="middle" className="font-mono" fontSize="12" fill="var(--foreground)">
          RabbitMQ
        </text>

        {/* Consumer */}
        <rect x="700" y="110" width="130" height="55" rx="6" fill="var(--surface)" stroke="var(--border)" />
        <text x="765" y="142" textAnchor="middle" className="font-mono" fontSize="12" fill="var(--foreground)">
          Consumer
        </text>

        {/* Applied once */}
        <rect x="595" y="223" width="130" height="50" rx="6" fill="none" stroke="var(--border)" />
        <text x="660" y="253" textAnchor="middle" className="font-mono" fontSize="11" fill="var(--foreground-muted)">
          Applied once
        </text>

        {/* DLQ */}
        <rect x="760" y="223" width="130" height="50" rx="6" fill="none" stroke="var(--border)" />
        <text x="825" y="245" textAnchor="middle" className="font-mono" fontSize="11" fill="var(--foreground-muted)">
          Dead-Letter
        </text>
        <text x="825" y="259" textAnchor="middle" className="font-mono" fontSize="11" fill="var(--foreground-muted)">
          Queue
        </text>
        </svg>
      </div>
      <figcaption className="text-small text-foreground-muted">
        Order state and its event are written in one transaction, so a crash between them can&apos;t
        happen. Consumers are idempotent; anything that can&apos;t be applied lands on a
        dead-letter queue instead of being silently dropped or retried forever.
      </figcaption>
    </figure>
  );
}
