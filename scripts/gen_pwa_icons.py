"""
빌라톡 PWA 아이콘 생성 — #3766EE 배경 + 흰색 '빌라톡' 텍스트
- icon-192.png : 192x192 (Android holo round 등)
- icon-512.png : 512x512 (Android adaptive, splash 등)
- icon-512-maskable.png : 512x512 with safe zone (80% center) for adaptive icons
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

BRAND = (55, 102, 238)  # #3766EE
WHITE = (255, 255, 255)
OUT_DIR = "apps/web/public/icons"

os.makedirs(OUT_DIR, exist_ok=True)


def find_korean_font(size: int):
    candidates = [
        r"C:\Windows\Fonts\malgunbd.ttf",
        r"C:\Windows\Fonts\malgun.ttf",
        r"C:\Windows\Fonts\NanumGothicBold.ttf",
        r"C:\Windows\Fonts\NanumGothic.ttf",
        r"C:\Windows\Fonts\NotoSansKR-Bold.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_text_centered(img: Image.Image, text: str, font, fill, y_offset: int = 0):
    draw = ImageDraw.Draw(img)
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (img.width - text_w) // 2 - bbox[0]
    y = (img.height - text_h) // 2 - bbox[1] + y_offset
    draw.text((x, y), text, font=font, fill=fill)


def make_icon(size: int, *, maskable: bool = False, out_name: str):
    img = Image.new("RGBA", (size, size), BRAND)
    # safe zone: 80% center for maskable
    text_size = int(size * (0.22 if maskable else 0.26))
    font = find_korean_font(text_size)
    draw_text_centered(img, "빌라톡", font, WHITE, y_offset=-int(size * 0.02))
    path = os.path.join(OUT_DIR, out_name)
    img.save(path, "PNG")
    print(f"  {out_name} ({size}x{size}) → {path}")


def main():
    print(f"Generating PWA icons in {OUT_DIR} (brand {BRAND})")
    make_icon(192, out_name="icon-192.png")
    make_icon(512, out_name="icon-512.png")
    make_icon(512, maskable=True, out_name="icon-512-maskable.png")
    # 추가: apple-touch + favicon
    make_icon(180, out_name="apple-touch-icon.png")
    make_icon(32, out_name="favicon-32.png")
    print("done")


if __name__ == "__main__":
    main()
