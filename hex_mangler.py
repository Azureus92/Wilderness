from PIL import Image, ImageOps
import math
import os
import glob
import random

def mangle(i, hc_width, hc_height, conn, cur):
    cur.execute("DELETE FROM hexes")
    conn.commit()
    files = glob.glob('./static/images/hexes/*')
    for f in files:
        os.remove(f)

    res = 20

    wmap = Image.open(i).convert('RGBA')

    map_pixels = wmap.load()

    ids = random.sample(range(hc_width * hc_height), hc_width * hc_height)

    w = round(wmap.width / hc_width)
    h = round(wmap.height / (hc_height + 0.5))

    cursor_x = round(w / 2)
    cursor_y = round(h / 2)

    from queue import Queue
    to_visit = Queue()
    dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]]

    i = 0
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
            cur.execute("INSERT INTO hexes (id, x, y) VALUES (?, ?, ?)", (ids[i], ptx, pty))
            conn.commit()

            tmap.save('static/images/hexes/' + str(ids[i]) + '.png')
            i+=1
            cursor_y = (cursor_y + h) % wmap.height

        cursor_x = (cursor_x + w) % wmap.width
        if (ptx % 2 == 0):
            cursor_y = h
        else:
            cursor_y = round(h / 2)
