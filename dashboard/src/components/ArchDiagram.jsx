import React from "react";

const NODE_COLORS = {
  online:   { stroke: "#3FB950", fill: "rgba(63,185,80,0.1)" },
  busy:     { stroke: "#E3B341", fill: "rgba(227,179,65,0.1)" },
  offline:  { stroke: "#F85149", fill: "rgba(248,81,73,0.1)" },
  disabled: { stroke: "#E3B341", fill: "rgba(227,179,65,0.08)" },
  cloud:    { stroke: "#8B949E", fill: "rgba(139,148,158,0.08)" },
};

function getStatus(n) {
  if (!n) return "offline";
  if (n.down) return "offline";
  if (n.disabled) return "disabled";
  if (n.load > 60) return "busy";
  return "online";
}

export default function ArchDiagram({ nodes, activeNode }) {
  // SVG layout constants
  const W = 800, H = 280;
  const centerX = W / 2, serverY = 80;
  const nodeY = 210;
  const cloudX = W - 90, cloudY = 80;
  const nodePositions = [130, 300, 470, 640].slice(0, Math.max(3, nodes.length));

  const mainColor = { stroke: "#00D4FF", fill: "rgba(0,212,255,0.1)" };

  return (
    <div className="arch-diagram">
      <div className="arch-title">🗺️ System Architecture — Live View</div>
      <svg className="arch-svg" viewBox={`0 0 ${W} ${H}`} style={{ maxHeight: 300 }}>
        <defs>
          <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#00D4FF" />
          </marker>
          <marker id="arr-gray" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#30363D" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ---- Main Server box ---- */}
        <rect x={centerX - 80} y={serverY - 30} width={160} height={56}
          rx={12} fill={mainColor.fill} stroke={mainColor.stroke} strokeWidth={1.5} />
        <text x={centerX} y={serverY - 4} textAnchor="middle" fill="#00D4FF" fontSize={13} fontWeight="bold">
          🧭 Main Server
        </text>
        <text x={centerX} y={serverY + 14} textAnchor="middle" fill="#8B949E" fontSize={10}>
          Smart Router — picks best node
        </text>

        {/* ---- Connecting lines from server to nodes ---- */}
        {nodes.map((n, i) => {
          const nx = nodePositions[i] || centerX;
          const isActive = activeNode === n.name;
          return (
            <g key={n.name}>
              <line
                x1={centerX} y1={serverY + 26}
                x2={nx}      y2={nodeY - 28}
                stroke={isActive ? "#00D4FF" : "#30363D"}
                strokeWidth={isActive ? 2.5 : 1}
                strokeDasharray={isActive ? "0" : "4 4"}
                markerEnd={isActive ? "url(#arr)" : "url(#arr-gray)"}
                style={{ transition: "stroke 0.4s, stroke-width 0.4s" }}
              />
              {isActive && (
                <circle r={5} fill="#00D4FF" filter="url(#glow)">
                  <animateMotion dur="0.5s" repeatCount="1"
                    path={`M${centerX},${serverY + 26} L${nx},${nodeY - 28}`} />
                </circle>
              )}
            </g>
          );
        })}

        {/* ---- Edge Node boxes ---- */}
        {nodes.map((n, i) => {
          const nx = nodePositions[i] || centerX;
          const st = getStatus(n);
          const c = NODE_COLORS[st];
          const isActive = activeNode === n.name;
          return (
            <g key={n.name}>
              <rect
                x={nx - 54} y={nodeY - 28} width={108} height={56}
                rx={10}
                fill={c.fill}
                stroke={isActive ? "#00D4FF" : c.stroke}
                strokeWidth={isActive ? 2 : 1.2}
                filter={isActive ? "url(#glow)" : undefined}
                style={{ transition: "stroke 0.4s" }}
              />
              <text x={nx} y={nodeY - 6} textAnchor="middle"
                fill={isActive ? "#00D4FF" : "#E6EDF3"} fontSize={13} fontWeight="bold">
                {n.name}
              </text>
              <text x={nx} y={nodeY + 10} textAnchor="middle" fill="#8B949E" fontSize={10}>
                {n.down ? "Offline" : n.disabled ? "Killed (Demo)" : `Load: ${n.load}%`}
              </text>
              {n.score && (
                <text x={nx} y={nodeY + 22} textAnchor="middle" fill="#00D4FF" fontSize={9}>
                  score: {Math.round(n.score)}
                </text>
              )}
            </g>
          );
        })}

        {/* ---- Cloud fallback ---- */}
        <line x1={centerX + 80} y1={serverY} x2={cloudX - 54} y2={cloudY}
          stroke="#30363D" strokeWidth={1} strokeDasharray="4 4" />
        <rect x={cloudX - 54} y={cloudY - 28} width={108} height={56}
          rx={10} fill={NODE_COLORS.cloud.fill} stroke={NODE_COLORS.cloud.stroke} strokeWidth={1} />
        <text x={cloudX} y={cloudY - 6} textAnchor="middle" fill="#8B949E" fontSize={13} fontWeight="bold">
          ☁️ Cloud
        </text>
        <text x={cloudX} y={cloudY + 10} textAnchor="middle" fill="#8B949E" fontSize={10}>
          Fallback only
        </text>

        {/* ---- You / Client box ---- */}
        <rect x={centerX - 50} y={4} width={100} height={34}
          rx={8} fill="rgba(139,148,158,0.08)" stroke="#30363D" strokeWidth={1} />
        <text x={centerX} y={26} textAnchor="middle" fill="#8B949E" fontSize={12}>
          💻 You
        </text>
        <line x1={centerX} y1={38} x2={centerX} y2={serverY - 30}
          stroke="#30363D" strokeWidth={1} strokeDasharray="3 3"
          markerEnd="url(#arr-gray)" />
      </svg>
    </div>
  );
}
