from PIL import Image, ImageDraw


goblin = Image.open("old/goblin/goblin.png").convert("RGBA")

screentone = Image.open("../screentones/cmkosemen_screentones_040.png").convert("RGBA")

combined = "old/goblin/combined.png"
out = ".output/goblin.png"


width = 2800
height = 270

bg = Image.new("RGBA",(width,height),(0,0,0,0))


bg.paste(screentone)
# Draw a yellow rectangle from (20,20) to (80,80)
draw = ImageDraw.Draw(bg)
draw.rectangle((0, 0, width, height), outline="black",width=20)
#draw.rectangle((50, 50, 3300, 200), fill=(255, 255, 255, 0))


# Composite: place the original image over the yellow square
#combined = Image.alpha_composite(image, screentone.crop((0,0,image.width,image.height)))

# Save the result
#gob = goblin.resize((goblin.width//2,goblin.height//2))

full_height =400

image = Image.new("RGBA",(width,full_height),(0,0,0,0))
image.paste(bg)

image.paste(goblin,[800,0],mask=goblin)

image.save(out)

# Eyes
eye_width = 60
eye_height = 100
eye_sep = 180
eyes = Image.new("RGBA",(eye_width * 2 + eye_sep, full_height // 2),(0,0,0,0))
draw_eyes = ImageDraw.Draw(eyes)
for i in range(2):
    draw_eyes.ellipse((i*eye_sep,0,eye_width +i*eye_sep,eye_height),fill="black")

eyes.save(".output/eyes.png")
