"""Render paper-ground chronotype plates for the light email concepts."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "static" / "images" / "email"
WIDTH, HEIGHT = 640, 887
PAPER = (243, 235, 221)
NAVY = (16, 37, 57)
INK = (28, 24, 18)
TEAL = (155, 184, 181)
TEAL_DEEP = (111, 148, 146)
WHITE = (252, 249, 243)
DAY = 24 * 60

CHRONOTYPES = {
    "horizon": {
        "name": "Horizon",
        "kicker": "You work best in the morning.",
        "first": ("7:30 AM", "10:00 AM"),
        "second": ("2:00 PM", "4:00 PM"),
    },
    "apex": {
        "name": "Apex",
        "kicker": "You are aligned with the sun.",
        "first": ("9:00 AM", "11:30 AM"),
        "second": ("3:30 PM", "5:30 PM"),
    },
    "aurora": {
        "name": "Aurora",
        "kicker": "You work best in the afternoon.",
        "first": ("10:30 AM", "1:00 PM"),
        "second": ("6:00 PM", "8:00 PM"),
    },
}


def font(size: int, serif: bool = True) -> ImageFont.FreeTypeFont:
    path = (
        "/System/Library/Fonts/Supplemental/Georgia.ttf"
        if serif
        else "/System/Library/Fonts/Supplemental/Courier New.ttf"
    )
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


def parse_minutes(value: str) -> int:
    time, meridian = value.split()
    hour_s, minute_s = time.split(":")
    hour = int(hour_s) % 12
    if meridian.upper() == "PM":
        hour += 12
    return hour * 60 + int(minute_s)


def pil_angle(minutes: int) -> float:
    from_six = (minutes - 6 * 60 + DAY) % DAY
    return (270.0 + from_six / DAY * 360.0) % 360.0


def split_window(start: int, end: int) -> list[tuple[int, int]]:
    if start == end:
        return []
    if end > start:
        return [(start, end)]
    return [(start, DAY), (0, end)]


def draw_arc_band(draw: ImageDraw.ImageDraw, bbox: tuple[int, int, int, int], start: int, end: int) -> None:
    for left, right in split_window(start, end):
        a0 = pil_angle(left)
        a1 = pil_angle(right)
        # PIL arcs go clockwise from 3 o'clock. Our angles already match that.
        if a1 <= a0:
            a1 += 360
        draw.arc(bbox, start=a0, end=a1, fill=TEAL, width=28)


def render_one(key: str, spec: dict) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), PAPER)
    draw = ImageDraw.Draw(image)
    title = font(40)
    kicker = font(20)
    mono = font(13, serif=False)
    time_font = font(22)

    draw.text((48, 48), f"{spec['name']} Schedule", font=title, fill=NAVY)
    draw.text((48, 108), spec["kicker"], font=kicker, fill=INK)

    cx, cy, radius = WIDTH // 2, 430, 196
    outer = (cx - radius, cy - radius, cx + radius, cy + radius)
    inner_r = radius - 34
    well = (cx - inner_r + 18, cy - inner_r + 18, cx + inner_r - 18, cy + inner_r - 18)
    draw.ellipse((cx - radius - 8, cy - radius - 8, cx + radius + 8, cy + radius + 8), outline=NAVY, width=1)
    draw.ellipse(outer, outline=(214, 204, 186), width=34)
    draw_arc_band(draw, outer, parse_minutes(spec["first"][0]), parse_minutes(spec["first"][1]))
    draw_arc_band(draw, outer, parse_minutes(spec["second"][0]), parse_minutes(spec["second"][1]))
    draw.ellipse(well, fill=WHITE, outline=NAVY, width=1)

    for minutes, label in (
        (6 * 60, "6 am"),
        (9 * 60, "9 am"),
        (12 * 60, "12 pm"),
        (15 * 60, "3 pm"),
        (18 * 60, "6 pm"),
        (21 * 60, "9 pm"),
        (0, "12 am"),
        (3 * 60, "3 am"),
    ):
        angle = math.radians(pil_angle(minutes))
        # PIL 0deg is 3 o'clock, clockwise. Convert to canvas x/y.
        lx = cx + int(math.cos(math.radians(pil_angle(minutes))) * (radius + 36))
        ly = cy + int(math.sin(math.radians(pil_angle(minutes))) * (radius + 36))
        box = draw.textbbox((0, 0), label, font=mono)
        draw.text((lx - (box[2] - box[0]) / 2, ly - (box[3] - box[1]) / 2), label, font=mono, fill=NAVY)

    ranges = [
        f"{spec['first'][0].replace('AM', 'am').replace('PM', 'pm')} - {spec['first'][1].replace('AM', 'am').replace('PM', 'pm')}",
        f"{spec['second'][0].replace('AM', 'am').replace('PM', 'pm')} - {spec['second'][1].replace('AM', 'am').replace('PM', 'pm')}",
    ]
    top = 720
    draw.rectangle((48, top + 8, 92, top + 28), fill=TEAL_DEEP)
    draw.text((104, top + 8), "Peak", font=kicker, fill=NAVY)
    for index, label in enumerate(ranges):
        y = top + 52 + index * 52
        draw.rectangle((280, y, 592, y + 44), outline=NAVY, width=1, fill=WHITE)
        box = draw.textbbox((0, 0), label, font=time_font)
        draw.text((436 - (box[2] - box[0]) / 2, y + 8), label, font=time_font, fill=NAVY)

    dest = OUT / f"{key}-schedule-light.jpg"
    image.save(dest, "JPEG", quality=92)
    print(dest)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for key, spec in CHRONOTYPES.items():
        render_one(key, spec)


if __name__ == "__main__":
    main()
