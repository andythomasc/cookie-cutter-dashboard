// /frontend/src/scenes/global/Sidebar.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  BarChart3,
  ChevronLeft, 
} from "lucide-react";

const LOGO_SRC  = "/zen6.png";  
const LOGO_SIZE = 28;           

export default function Sidebar({
  collapsedKey = "sidebar:collapsed",
  items,
  brand = "Dashboard",
}) {
  const location = useLocation();

  const navItems = useMemo(
    () =>
      items || [
        { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
        { to: "/anomalies", label: "Anomalies", icon: AlertTriangle },
        { to: "/summary", label: "Summary", icon: BarChart3 },
      ],
    [items]
  );

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(collapsedKey) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(collapsedKey, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed, collapsedKey]);

  // Ctrl/Cmd + B toggles collapse
  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <aside
      className={`sticky top-0 h-screen bg-neutral-900/95 backdrop-blur border-r border-neutral-800 transition-all duration-300 shrink-0
        ${collapsed ? "w-20" : "w-64"}`}
      aria-label="Primary navigation"
    >
      {/* ---------- Header / Brand ---------- */}
      <div className="px-3 py-3 border-b border-neutral-800">
        {collapsed ? (
          // Collapsed: center the logo
          <div className="flex items-center justify-center">
            <button
              onClick={() => setCollapsed(false)}
              className="rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              aria-label="Expand sidebar"
              title="Expand (Ctrl/Cmd+B)"
            >
              <img
                src={LOGO_SRC}
                alt="Logo"
                style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
                className="block shrink-0 object-contain"
              />
            </button>
          </div>
        ) : (
          // Expanded: show brand + collapse arrow
          // Arrow disappears
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={LOGO_SRC}
                alt="Logo"
                style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
                className="block shrink-0 object-contain"
              />
              <span className="text-sm font-semibold text-white truncate">{brand}</span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="ml-2 shrink-0 p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300"
              aria-label="Collapse sidebar"
              title="Collapse (Ctrl/Cmd+B)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* ---------- Nav ---------- */}
      <nav className="mt-3 px-2 space-y-1" role="navigation">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <div key={to} className="group relative">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors",
                  isActive
                    ? "bg-indigo-600/20 text-indigo-200 border-indigo-600/30"
                    : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800 hover:text-white",
                ].join(" ")
              }
              aria-current={location.pathname === to ? "page" : undefined}
              {...(collapsed ? { title: label } : {})}
            >
              <Icon className={`w-5 h-5 ${label === "Anomalies" ? "text-amber-400" : ""}`} />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>

            {/* Tooltip when collapsed */}
            {collapsed && (
              <span
                className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2
                           opacity-0 group-hover:opacity-100 transition-opacity
                           whitespace-nowrap rounded-md bg-neutral-800 px-2 py-1 text-xs
                           text-neutral-100 shadow-lg border border-neutral-700"
                role="tooltip"
              >
                {label}
              </span>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
