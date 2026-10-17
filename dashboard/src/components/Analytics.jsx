import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";

const NODE_COLORS = {
  EdgeA: "#00D4FF",
  EdgeB: "#3FB950",
  EdgeC: "#E3B341",
  CLOUD: "#8B949E",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#161B22",
      border: "1px solid #30363D",
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 13,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: "#E6EDF3" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value} {p.name.includes("ms") || p.name.includes("Wait") || p.name.includes("Run") ? "ms" : ""}
        </div>
      ))}
    </div>
  );
};

export default function Analytics({ analytics }) {
  if (!analytics.length) {
    return (
      <div style={{
        background: "#161B22", border: "1px solid #30363D",
        borderRadius: 14, padding: 32, textAlign: "center", color: "#8B949E"
      }}>
        No analytics yet — submit some tasks first!
      </div>
    );
  }

  return (
    <div className="analytics-grid">
      {/* Chart 1: Tasks per node */}
      <div className="chart-card">
        <div className="chart-title">Tasks Handled per Node</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={analytics} margin={{ top: 4, right: 10, left: -10, bottom: 4 }}>
            <XAxis dataKey="node" tick={{ fill: "#8B949E", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="tasks" name="Tasks" radius={[6, 6, 0, 0]}>
              {analytics.map((entry) => (
                <Cell key={entry.node} fill={NODE_COLORS[entry.node] || "#58A6FF"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 11, color: "#8B949E", marginTop: 8, textAlign: "center" }}>
          Which node the smart router chose most often
        </div>
      </div>

      {/* Chart 2: Avg wait vs run time */}
      <div className="chart-card">
        <div className="chart-title">Avg Wait vs Run Time (ms)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={analytics} margin={{ top: 4, right: 10, left: -10, bottom: 4 }}>
            <XAxis dataKey="node" tick={{ fill: "#8B949E", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#8B949E", paddingTop: 6 }}
              iconType="circle" iconSize={8}
            />
            <Bar dataKey="avgWaitMs" name="Avg Wait" fill="#E3B341" radius={[4, 4, 0, 0]} />
            <Bar dataKey="avgRunMs"  name="Avg Run"  fill="#00D4FF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 11, color: "#8B949E", marginTop: 8, textAlign: "center" }}>
          Wait = time in queue • Run = actual CPU compute time
        </div>
      </div>
    </div>
  );
}
