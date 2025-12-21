from PIL import Image, ImageOps
import math

res = 20

# s_hex = Image.open('single_hex.png').convert('RGBA')

wmap = Image.open('Tassie_with_fixed_hexgrid.png').convert('RGBA')

map_pixels = wmap.load()

hc_width = 20
hc_height = 25

w = round(wmap.width / hc_width)
h = round(wmap.height / (hc_height + 0.5))

cursor_x = round(w / 2)
cursor_y = round(h / 2)

from queue import Queue
to_visit = Queue()
dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]]

for ptx in range(hc_width):
    for pty in range(hc_height):
        mask = Image.new('RGBA', wmap.size, (255, 255, 255, 255))
        mask_pixels = mask.load()
        to_visit.put((cursor_x, cursor_y))

        visited = []
        lm = 999999
        rm = 0
        um = 999999
        dm = 0

        while to_visit.empty() != True:
            pt = to_visit.get()
            if pt in visited:
                continue
            visited.append(pt)
            x = pt[0]
            y = pt[1]
            lm = min(x, lm)
            rm = max(x, rm)
            um = min(y, um)
            dm = max(y, dm)
            mask_pixels[x, y] = (0,0,0,255)
            for d in dirs:
                nx = d[0] + x 
                ny = d[1] + y
                if ((nx > 0 and nx < wmap.width and ny > 0 and ny < wmap.height) and
                    (map_pixels[nx, ny][0] > res or map_pixels[nx, ny][1] > res or map_pixels[nx, ny][2] > res) and
                    mask_pixels[nx, ny] != (0,0,0,255)):
                    to_visit.put((nx, ny))

        mask = mask.point(lambda x: x < 100 and 255).convert('L')

        tmap = wmap

        tmap.putalpha(mask)

        tmap = tmap.crop((lm, um, rm, dm))

        tmap.save('result' + str(ptx) + '_' + str(pty) + '.png')
        cursor_y = (cursor_y + h) % wmap.height

    cursor_x = (cursor_x + w) % wmap.width
    if (ptx % 2 == 0):
        cursor_y = h
    else:
        cursor_y = round(h / 2)











# img = Image.open('Tassie_with_fixed_hexgrid.png').convert('RGBA')

# print(img.size)

# no_hex_width = 20
# no_hex_length = 25

# w = round(img.size[0] / 15)
# l = round(img.size[1] / (no_hex_length + 0.5))
# print(w)
# print(l)


# # j = 0
# cursor_x = 2
# cursor_y = 2



# for i in range(0, no_hex_length + 1):
#     back = Image.new('RGBA', img.size, (255, 255, 255, 255))
#     mask = Image.open('newmask.png').resize((w, l))

#     print(cursor_y)
#     back.paste(mask, (cursor_x, cursor_y), mask.convert('RGBA'))
#     cursor_y = (cursor_y + l - 1) % img.size[1]

#     # back.save('test.png')
#     mask = back.point(lambda x: x < 100 and 255).convert('L')

#     # back.save('test.png')

#     img.putalpha(mask) # Modifies the original image without return

#     # img = img.crop((w, l, 2 * w, 2 * l))

#     img.save('result' + str(i) + '.png')
#     # cursor_x = round(cursor_x + (w * 0.75)) % img.size[0]
#     # for j in range(0, no_hex_width):
        
#         # 
#         # print(cursor_y)


