"""Generate the README illustrations (SVG sources + PNGs in docs/images/).

    python3 design/readme/make_images.py        # needs `rsvg-convert` (brew install librsvg)

One visual world, shared with the brand icon: navy tiles, an indigo body, blue / teal /
purple accents. Avenir Next for type, Menlo for the raw-device-name "before" list. Every
image carries its own dark rounded background, so it reads the same on GitHub's light and
dark themes.
"""
from __future__ import annotations

import os
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "docs", "images")

NAVY, CARD, LINE = "#0d1628", "#141f38", "#26324f"
INDIGO, INK, MUTED = "#2c3368", "#e8ecf6", "#8a93b0"
BLUE, TEAL, PURPLE, AMBER, ROSE = "#4a86ff", "#1fc6c4", "#8f7ef7", "#e0a441", "#e0707f"
SANS, MONO = "Avenir Next", "Menlo"


class Svg:
    def __init__(self, w: int, h: int, rx: int = 40):
        self.w, self.h = w, h
        self.o = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
            f'<rect width="{w}" height="{h}" rx="{rx}" fill="{NAVY}"/>',
        ]

    def raw(self, s: str) -> None:
        self.o.append(s)

    def text(self, x, y, s, size, fill=INK, weight=500, family=SANS, anchor="start", spacing=0):
        s = s.replace("&", "&amp;")
        ls = f' letter-spacing="{spacing}"' if spacing else ""
        self.o.append(
            f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"{ls}>{s}</text>'
        )

    def rect(self, x, y, w, h, rx, fill, extra=""):
        self.o.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" {extra}/>')

    def pill(self, x, y, label, color, size=17):
        w = len(label) * size * 0.65 + 26
        self.rect(x, y - 21, w, 30, 15, color, f'fill-opacity=".16" stroke="{color}" stroke-opacity=".5"')
        self.text(x + w / 2, y - 1, label, size, color, 700, anchor="middle")
        return w

    def save(self, name: str, width: int) -> None:
        self.o.append("</svg>")
        src = os.path.join(HERE, f"{name}.svg")
        with open(src, "w") as fh:
            fh.write("\n".join(self.o))
        os.makedirs(OUT, exist_ok=True)
        subprocess.run(["rsvg-convert", "-w", str(width), src, "-o", os.path.join(OUT, f"{name}.png")], check=True)


def brand_mark(svg: Svg, x: float, y: float, size: float) -> None:
    """The app icon's house (without its tile), drawn inline at any size."""
    k = size / 512
    svg.raw(f'<g transform="translate({x},{y}) scale({k})">')
    svg.raw(f'<rect width="512" height="512" rx="104" fill="#101b31" stroke="{LINE}" stroke-width="4"/>')
    svg.raw(f'<path d="M256 92 L420 222 L420 408 L92 408 L92 222 Z" fill="{INDIGO}" stroke="{INDIGO}" stroke-width="36" stroke-linejoin="round"/>')
    for rx, ry, c in ((128, 238, BLUE), (266, 238, TEAL), (128, 328, PURPLE), (266, 328, BLUE)):
        svg.rect(rx, ry, 118, 70, 18, c)
    for bx, by, bh, c in ((219, 168, 44, BLUE), (247, 152, 60, TEAL), (275, 176, 36, PURPLE)):
        svg.rect(bx, by, 18, bh, 9, c)
    svg.raw("</g>")


# ── Banner ──────────────────────────────────────────────────────────────────────
def banner() -> None:
    s = Svg(1600, 460)
    brand_mark(s, 96, 90, 280)
    s.text(440, 205, "Alexa Organizer", 100, INK, 800)
    s.text(444, 280, "Your house, in Alexa.", 48, TEAL, 600)
    s.text(446, 346, "Review the plan. Tap Sync. Alexa matches Home Assistant.", 29, MUTED, 500)
    s.save("banner", 1600)


# ── Before → After ─────────────────────────────────────────────────────────────
def before_after() -> None:
    s = Svg(1600, 940)
    bx, by, bw, bh = 56, 110, 600, 774
    s.text(bx, 78, "ALEXA, TODAY", 22, MUTED, 700, spacing=3)
    s.rect(bx, by, bw, bh, 26, CARD)
    rows = [
        ("Living Room 2", "duplicate", ROSE), ("Living Room 3", "duplicate", ROSE),
        ("light.hallway_lamp_2", "raw id", AMBER), ("Pixel 7 Alexa App", "junk", ROSE),
        ("Kitchen Echo Dot", "no room", AMBER), ("Office Echo", "wrong room", AMBER),
        ("Living Room", "copy", ROSE), ("Garage Light", "no room", AMBER),
        ("Porch Motion Switch", "junk", ROSE), ("Den Sonos", "won't play", AMBER),
    ]
    y = by + 70
    for name, tag, col in rows:
        s.text(bx + 36, y, name, 26, INK, 400, MONO)
        w = len(tag) * 17 * 0.65 + 26
        s.pill(bx + bw - 36 - w, y, tag, col)
        s.raw(f'<line x1="{bx+36}" y1="{y+24}" x2="{bx+bw-36}" y2="{y+24}" stroke="{LINE}"/>')
        y += 66
    s.text(bx + 36, y + 4, "+ 214 more…", 24, MUTED, 500, MONO)

    # the one action in between
    ax, ay = bx + bw + 26, by + bh / 2
    s.raw(f'<path d="M{ax} {ay} H{ax+220}" stroke="{TEAL}" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 12"/>')
    s.raw(f'<path d="M{ax+206} {ay-14} L{ax+226} {ay} L{ax+206} {ay+14}" fill="none" stroke="{TEAL}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>')
    s.rect(ax + 22, ay - 78, 176, 44, 22, TEAL)
    s.text(ax + 110, ay - 49, "Review & Sync", 20, NAVY, 700, anchor="middle")
    s.text(ax + 110, ay + 46, "one tap", 20, MUTED, 500, anchor="middle")

    rx0 = ax + 250
    rw = 1600 - 56 - rx0
    s.text(rx0, 78, "AFTER ONE SYNC", 22, TEAL, 700, spacing=3)

    def room(x, y, w, name, groups):
        gh, ih = 48, 58
        h = 64 + sum(gh + len(items) * ih for _, _, items in groups) + 8
        s.rect(x, y, w, h, 26, CARD)
        s.text(x + 30, y + 50, name, 31, INK, 700)
        yy = y + 98
        for label, col, items in groups:
            s.text(x + 30, yy, label.upper(), 16, col, 700, spacing=2)
            s.raw(f'<line x1="{x+30}" y1="{yy+11}" x2="{x+w-30}" y2="{yy+11}" stroke="{col}" stroke-opacity=".45" stroke-width="2"/>')
            yy += gh
            for item, chip, badge in items:
                s.text(x + 30, yy, item, 23, INK, 500)
                if chip:
                    s.text(x + 30 + len(item) * 12.2 + 14, yy, chip, 17, MUTED, 500)
                if badge:
                    s.text(x + w - 30, yy, badge, 18, BLUE, 700, anchor="end")
                yy += ih
        return h

    h1 = room(rx0, by, rw, "Living Room", [
        ("Lighting", AMBER, [("Floor Lamp", "", ""), ("Ceiling Lights", "", "")]),
        ("Speakers", BLUE, [("Living Room", "Sonos", "♪ plays here")]),
    ])
    cw = (rw - 24) / 2
    y2 = by + h1 + 24
    h2 = room(rx0, y2, cw, "Kitchen", [("Speakers", BLUE, [("Kitchen Echo Dot", "", "♪")]),
                                        ("Lighting", AMBER, [("Pendants", "", "")])])
    room(rx0 + cw + 24, y2, cw, "Office", [("Speakers", BLUE, [("Office Echo", "", "♪")]),
                                            ("Climate", TEAL, [("Thermostat", "", "")])])
    # the payoff — the same status line the app shows when you're done
    sy = y2 + h2 + 24
    sh = by + bh - sy
    s.rect(rx0, sy, rw, sh, 26, TEAL, f'fill-opacity=".12" stroke="{TEAL}" stroke-opacity=".55" stroke-width="2"')
    s.text(rx0 + 34, sy + sh / 2 + 11, "✓  Alexa matches your house", 30, TEAL, 700)
    s.text(rx0 + rw - 34, sy + sh / 2 + 9, "0 changes", 22, MUTED, 600, anchor="end")
    s.save("before-after", 1600)


# ── Three steps ────────────────────────────────────────────────────────────────
def steps() -> None:
    s = Svg(1600, 300)
    cols = [
        ("1", "Look", ["See your house the way", "Alexa will see it."], BLUE),
        ("2", "Tweak", ["Move, remove, rename,", "pick each room's speaker."], TEAL),
        ("3", "Sync", ["Review the plan, tap Sync.", "Alexa matches your house."], PURPLE),
    ]
    cw = (1600 - 120) / 3
    cy = 96
    s.raw(f'<line x1="{60+cw/2+60}" y1="{cy}" x2="{60+cw*2.5-60}" y2="{cy}" stroke="{LINE}" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>')
    for i, (n, title, lines, col) in enumerate(cols):
        cx = 60 + cw * i + cw / 2
        s.raw(f'<circle cx="{cx}" cy="{cy}" r="38" fill="{NAVY}" stroke="{col}" stroke-width="4"/>')
        s.text(cx, cy + 13, n, 36, col, 800, anchor="middle")
        s.text(cx, cy + 96, title, 36, INK, 700, anchor="middle")
        for j, line in enumerate(lines):
            s.text(cx, cy + 142 + j * 34, line, 25, MUTED, 500, anchor="middle")
    s.save("steps", 1600)


# ── Feature icons ──────────────────────────────────────────────────────────────
def icon(name: str, body: str) -> None:
    s = Svg(200, 200, rx=46)
    s.raw(body)
    s.save(f"icon-{name}", 200)


def feature_icons() -> None:
    # Rooms: a small house of tiles
    icon("rooms", f'''
      <path d="M100 38 L160 86 L160 158 L40 158 L40 86 Z" fill="{INDIGO}" stroke="{INDIGO}" stroke-width="16" stroke-linejoin="round"/>
      <rect x="56" y="96" width="40" height="24" rx="7" fill="{BLUE}"/><rect x="104" y="96" width="40" height="24" rx="7" fill="{TEAL}"/>
      <rect x="56" y="128" width="40" height="24" rx="7" fill="{PURPLE}"/><rect x="104" y="128" width="40" height="24" rx="7" fill="{BLUE}"/>''')
    # Speakers: a speaker with sound waves
    icon("speakers", f'''
      <rect x="44" y="52" width="64" height="96" rx="16" fill="{INDIGO}"/>
      <circle cx="76" cy="112" r="20" fill="{BLUE}"/><circle cx="76" cy="74" r="8" fill="{TEAL}"/>
      <path d="M126 80 Q140 100 126 120" fill="none" stroke="{TEAL}" stroke-width="9" stroke-linecap="round"/>
      <path d="M144 64 Q168 100 144 136" fill="none" stroke="{PURPLE}" stroke-width="9" stroke-linecap="round"/>''')
    # One device: two copies becoming one
    icon("one-device", f'''
      <rect x="40" y="58" width="76" height="76" rx="20" fill="{BLUE}" fill-opacity=".85"/>
      <rect x="84" y="66" width="76" height="76" rx="20" fill="{PURPLE}" fill-opacity=".85"/>
      <path d="M84 78 H96 Q116 78 116 98 V122 Q116 134 104 134 H84 Z" fill="{TEAL}"/>''')
    # Cleanup: a tidied list
    icon("cleanup", f'''
      <rect x="42" y="52" width="116" height="18" rx="9" fill="{INDIGO}"/>
      <rect x="42" y="91" width="116" height="18" rx="9" fill="{INDIGO}" fill-opacity=".45"/>
      <line x1="36" y1="100" x2="164" y2="100" stroke="{ROSE}" stroke-width="7" stroke-linecap="round"/>
      <rect x="42" y="130" width="76" height="18" rx="9" fill="{INDIGO}"/>
      <path d="M128 140 L140 152 L164 124" fill="none" stroke="{TEAL}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>''')


if __name__ == "__main__":
    banner()
    before_after()
    steps()
    feature_icons()
    print("wrote", sorted(os.listdir(OUT)))
