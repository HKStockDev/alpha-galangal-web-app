from pathlib import Path

# --- sidebar ---
sp = Path("src/components/dashboard/sidebar.ts")
sp = Path("src/components/dashboard/sidebar.tsx")
text = sp.read_text(encoding="utf-8")
old_nav = """const NAV_SEGMENTS = [
  { sgement: "/screener", label: "Screener" },
  { segment: "/clients", label: "Clients" },
  { segment: "/funds", label: "Funds" },
"""

# do precise replace
old_nav = """const NAV_SEGMENTS = [
  { segment: "/screener", label: "Screener" },
  { segment: "/clients", label: "Clients" },
  { segment: "/funds", label: "Funds" },"""

new_nav = """const NAV_SEGMENTS = [
  { segment: "/screener", label: "Screener" },
  { segment: "/clients", label: "Clients" },
  {
    segment: "/fundamental-constriction",
    label: "Fundamental constriction",
  },
  { segment: "/funds", label: "Funds" },"""

if old_nav not in text:
    raise SystemExit("NAV_SEGMENTS block not found")
text = text.replace(old_nav, new_nav)

needle = """] as const;

export function Sidebar"""
if needle not in text:
    raise SystemExit("as const export not found")
text = text.replace(
    "] as const;\n\nexport function Sidebar",
    "] as const;\n\nconst ORG_HOME_NAV_SEGMENTS = [\"/clients\", \"/fundamental-constriction\"] as const;\n\nexport function Sidebar",
)

text = text.replace(
    """    isOrgDashboardRoot || isOrgClientsPage
      ? NAV_SEGMENTS.filter((item) => item.segment === "/clients")
      : basePath === ORG_DASHBOARD""",
    """    isOrgDashboardRoot || isOrgClientsPage
      ? NAV_SEGMENTS.filter((item) =>
          (ORG_HOME_NAV_SEGMENTS as readonly string[]).includes(item.segment),
        )
      : basePath === ORG_DASHBOARD""",
)

text = text.replace(
    """          const isActive = pathname === href;""",
    """          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);""",
)

sp.write_text(text, encoding="utf-8")
print("sidebar ok")
