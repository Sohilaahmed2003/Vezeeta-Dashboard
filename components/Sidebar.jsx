"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MAIN_ITEMS = [
  {
    href: "/",
    label: "Overview",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
    ),
  },
];

const PRODUCT_ITEMS = [
  {
    href: "/mp",
    label: "MP Bookings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v5a3 3 0 003 3h0a3 3 0 003-3V4" /><path d="M9 12v3a5 5 0 005 5h0a5 5 0 005-5v-1" /><circle cx="19" cy="9" r="2" /></svg>
    ),
  },
  {
    href: "/shamel",
    label: "Shamel",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11l8-7 8 7" /><path d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9" /><path d="M10 20v-6h4v6" /></svg>
    ),
  },
  {
    href: "/pharmacy",
    label: "Pharmacy",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="9.5" width="17" height="7" rx="3.5" transform="rotate(-45 12 12)" /><line x1="12" y1="8.6" x2="12" y2="15.4" transform="rotate(-45 12 12)" /></svg>
    ),
  },
  {
    href: "/revenue",
    label: "Revenue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9.5 15c0 1.1 1.1 2 2.5 2s2.5-.7 2.5-1.8c0-2.2-5-1-5-3.2 0-1.1 1.1-1.8 2.5-1.8s2.5.9 2.5 2" /><path d="M12 7v1M12 16v1" /></svg>
    ),
  },
  {
    href: "/labs",
    label: "Labs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6" /><path d="M10 3v6l-5.5 9a1.5 1.5 0 001.3 2.2h12.4a1.5 1.5 0 001.3-2.2L14 9V3" /><path d="M8 15h8" /></svg>
    ),
  },
  {
    href: "/Scans",
    label: "Scans",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8V6a2 2 0 012-2h2" /><path d="M16 4h2a2 2 0 012 2v2" /><path d="M20 16v2a2 2 0 01-2 2h-2" /><path d="M8 20H6a2 2 0 01-2-2v-2" /></svg>
    ),
  },
];

function NavLink({ href, label, icon, active, className, dot }) {
  return (
    <Link href={href} className={`nav-item ${active ? "active" : ""} ${className || ""}`}>
      {icon}
      <span>{label}</span>
      {dot && <span className="dot" />}
    </Link>
  );
}

const SETTINGS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2" /><path d="M12 3v2.4M12 18.6V21M21 12h-2.4M5.4 12H3M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3L5.6 5.6" /></svg>
);
const SUPPORT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2 1.8-2.3 3.2" /><line x1="12" y1="17" x2="12" y2="17.01" /></svg>
);
const UPLOAD_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" /><path d="M12 3v11" /><path d="M8 7l4-4 4 4" /></svg>
);

// `hasData` decides whether the "Upload Data" item gets the pulse/dot
// treatment that nudges a first-time visitor there — mirrors the original's
// uploadDot logic, just driven by the server-persisted dataset instead of a
// client-only variable.
export default function Sidebar({ hasData }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <text x="12" y="17" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="15" fill="white">V</text>
            <path d="M5 18.5 Q12 23 19 17.5" stroke="#EB3B3B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <div className="brand-text">
          <strong>Vezeeta</strong>
          <span>Analytics dashboard</span>
        </div>
      </div>

      <p className="nav-label">Main</p>
      {MAIN_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} active={pathname === item.href} />
      ))}

      <p className="nav-label">Products</p>
      {PRODUCT_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} active={pathname === item.href} />
      ))}

      <div className="nav-spacer" />

      <div className="nav-bottom">
      </div>
    </aside>
  );
}
