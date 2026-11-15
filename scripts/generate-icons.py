"""Генерация ассетов иконок из assets/icon.png.

Исходная картинка — 160x160: скруглённый квадрат, внутри три полосы со
скруглёнными концами. Геометрия снята с файла, поэтому иконки рисуются заново
в большом разрешении (без апскейла) — так они остаются чёткими на всех плотностях.

Что создаётся:
  assets/images/android-icon-foreground.png   — передний слой адаптивной иконки
  assets/images/android-icon-monochrome.png   — ч/б слой для тематических иконок Android 13+
  assets/images/notification-icon.png         — маленькая иконка уведомления (статус-бар)

Запуск (нужен Python + Pillow):  python scripts/generate-icons.py
Менять цвет/полосы — здесь же.
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'images'

# Полосы в координатах 160x160: x0, y0, x1, y1 (включительно), цвет
BARS = [
    ((33, 35, 106, 59), (79, 70, 229)),  # верхняя
    ((53, 68, 126, 91), (22, 163, 74)),  # средняя, сдвинута вправо
    ((33, 100, 86, 124), (79, 70, 229)),  # нижняя, короче
]
SOURCE_SIZE = 160
GLYPH_CENTER = 80.0
WHITE = (255, 255, 255, 255)
SUPERSAMPLE = 4


def render(size: int, glyph_scale: float = 1.0, monochrome: bool = False) -> Image.Image:
    """Глиф на прозрачном фоне; glyph_scale — увеличение вокруг центра."""
    canvas = size * SUPERSAMPLE
    img = Image.new('RGBA', (canvas, canvas), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    scale = canvas / SOURCE_SIZE

    for (x0, y0, x1, y1), (r, g, b) in BARS:
        fill = WHITE if monochrome else (r, g, b, 255)

        def move(v: float) -> float:
            return GLYPH_CENTER + (v - GLYPH_CENTER) * glyph_scale

        left, top = move(x0), move(y0)
        right, bottom = move(x1 + 1), move(y1 + 1)
        draw.rounded_rectangle(
            [left * scale, top * scale, right * scale, bottom * scale],
            radius=(bottom - top) * scale / 2,
            fill=fill,
        )

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    # Передний слой адаптивной иконки не тонируется — полосы в своих цветах
    render(1024).save(OUT / 'android-icon-foreground.png')
    # Monochrome-слой система красит сама: белый силуэт на прозрачном
    render(1024, monochrome=True).save(OUT / 'android-icon-monochrome.png')
    # В статус-баре иконка мелкая и тоже тонируется — белый глиф крупнее
    render(512, glyph_scale=1.55, monochrome=True).save(OUT / 'notification-icon.png')
    print('done')


if __name__ == '__main__':
    main()
