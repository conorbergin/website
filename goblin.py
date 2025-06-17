from PIL import Image, ImageDraw
import vtracer
import re

goblin = Image.open("old/goblin/goblin.png").convert("RGBA")

screentone = Image.open("../screentones/cmkosemen_screentones_040.png").convert("RGBA")

container_width = 700

width = 2800
height = 270


bg = Image.new("RGBA",(width,height),(0,0,0,0))

bg.paste(screentone)
draw = ImageDraw.Draw(bg)
draw.rectangle((0, 0, width, height), outline="black",width=20)

full_height =350

image = Image.new("RGBA",(width,full_height),(0,0,0,0))
image.paste(bg)

image.paste(goblin,[800,0],mask=goblin)

eye_width = 60
eye_height = 100
eye_sep = 180


svg = vtracer.convert_pixels_to_svg(list(image.getdata()),image.size)
svg = re.sub(r'^.*?<svg[^>]*>|</svg>.*$', '', svg, flags=re.DOTALL)

container_height = container_width / width * full_height 
print(f'<svg id="eye-root"  height="{container_height}" width="100%" viewBox="0 0 {width} {full_height}" preserveAspectRatio="xMidYMid slice" >')
print(svg)

for i in [width/2 - eye_sep/2, width/2 + eye_sep/2]:
    print(f'<circle class="eyes" cx="{ i - 100 }" cy="175" r="40" fill="#000000" />')

print("</svg>")
