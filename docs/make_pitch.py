#!/usr/bin/env python3
"""Genererar public/pitch.svg: fotbollsplan i 3D-perspektiv sedd från det högra nedre hörnet.
Riktig kameramodell (hålkamera) + regelrätt planritning 105 x 68 m. Kör: python3 docs/make_pitch.py > public/pitch.svg"""
import math, sys

W, H = 600, 1200
L, B = 105.0, 68.0                      # planens längd (Y) och bredd (X) i meter. Origo = nedre vänstra hörnet i ovanvy
add = lambda a, b: tuple(x + y for x, y in zip(a, b)); sub = lambda a, b: tuple(x - y for x, y in zip(a, b))
dot = lambda a, b: sum(x * y for x, y in zip(a, b))
cross = lambda a, b: (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
norm = lambda a: tuple(x / math.sqrt(dot(a, a)) for x in a)

def camera(C, T, f):
    fwd = norm(sub(T, C)); right = norm(cross(fwd, (0, 0, 1))); up = cross(right, fwd)
    return lambda P: (dot(sub(P, C), right), dot(sub(P, C), up), dot(sub(P, C), fwd))

NEAR = 0.5
def clip_line(a, b):
    if a[2] < NEAR and b[2] < NEAR: return None
    if a[2] < NEAR: a = tuple(a[i] + (b[i]-a[i]) * (NEAR-a[2]) / (b[2]-a[2]) for i in range(3))
    if b[2] < NEAR: b = tuple(b[i] + (a[i]-b[i]) * (NEAR-b[2]) / (a[2]-b[2]) for i in range(3))
    return a, b
def clip_poly(pts):
    out = []
    for i in range(len(pts)):
        a, b = pts[i], pts[(i+1) % len(pts)]; ain, bin_ = a[2] >= NEAR, b[2] >= NEAR
        if ain: out.append(a)
        if ain != bin_: out.append(tuple(a[j] + (b[j]-a[j]) * (NEAR-a[2]) / (b[2]-a[2]) for j in range(3)))
    return out

def build(C, T, f, cy_frac=0.5, line_m=0.45, opacity=0.55, blur=1.3, fade=0.55):
    cam = camera(C, T, f); cx, cy = W/2, H*cy_frac
    P = lambda c: (cx + f*c[0]/c[2], cy - f*c[1]/c[2])
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">',
           f'<defs><filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="{blur}"/></filter>',
           f'<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4f1dc" stop-opacity="0.92"/><stop offset="{fade}" stop-color="#e4f1dc" stop-opacity="0"/></linearGradient></defs>',
           f'<rect width="{W}" height="{H}" fill="#d9ecd0"/>']
    # gräsrandor (klippmönster) längs planens längd, ca 7,5 m breda
    n = 14; band = L / n
    for k in range(-3, n + 3):
        if k % 2: continue
        y0, y1 = k*band, (k+1)*band
        poly = clip_poly([cam(p) for p in [(-30, y0, 0), (B+30, y0, 0), (B+30, y1, 0), (-30, y1, 0)]])
        if len(poly) >= 3: out.append('<polygon fill="#d0e6c6" points="%s"/>' % ' '.join('%.1f,%.1f' % P(c) for c in poly))
    segs = []   # (3D-start, 3D-slut)
    def poly3(pts, close=False):
        pts = list(pts) + ([pts[0]] if close else [])
        for a, b in zip(pts, pts[1:]): segs.append((a, b))
    def circ(cx_, cy_, r, a0=0, a1=360, n_=72, keep=lambda x, y: True):
        pts = [(cx_ + r*math.cos(math.radians(a0 + (a1-a0)*i/n_)), cy_ + r*math.sin(math.radians(a0 + (a1-a0)*i/n_)), 0) for i in range(n_+1)]
        run = []
        for p in pts:
            if keep(p[0], p[1]): run.append(p)
            elif run: poly3(run); run = []
        if run: poly3(run)
    poly3([(0, 0, 0), (B, 0, 0), (B, L, 0), (0, L, 0)], True)           # yttre linjer
    poly3([(0, L/2, 0), (B, L/2, 0)])                                    # mittlinje
    circ(B/2, L/2, 9.15, n_=96); circ(B/2, L/2, 0.35, n_=10)            # mittcirkel + punkt
    for gy, s in ((0, 1), (L, -1)):                                      # båda ändar (s = riktning in mot planen)
        poly3([(13.84, gy, 0), (13.84, gy+s*16.5, 0), (54.16, gy+s*16.5, 0), (54.16, gy, 0)])   # straffområde
        poly3([(24.84, gy, 0), (24.84, gy+s*5.5, 0), (43.16, gy+s*5.5, 0), (43.16, gy, 0)])     # målområde
        circ(B/2, gy+s*11, 0.35, n_=10)                                                          # straffpunkt
        circ(B/2, gy+s*11, 9.15, n_=96, keep=lambda x, y, gy=gy, s=s: s*(y-gy) > 16.5)           # straffbåge
        # mål i 3D: stolpar, ribba, nät-ram (2 m djup)
        x1, x2, h, d = 30.34, 37.66, 2.44, 2.0; yb = gy - s*d
        poly3([(x1, gy, 0), (x1, gy, h), (x2, gy, h), (x2, gy, 0)])
        poly3([(x1, yb, 0), (x1, yb, h*0.8), (x2, yb, h*0.8), (x2, yb, 0)])
        poly3([(x1, gy, h), (x1, yb, h*0.8)]); poly3([(x2, gy, h), (x2, yb, h*0.8)])
        poly3([(x1, gy, 0), (x1, yb, 0)]); poly3([(x2, gy, 0), (x2, yb, 0)])
    for (px, py, a0) in ((0, 0, 0), (B, 0, 90), (B, L, 180), (0, L, 270)):  # hörnbågar
        circ(px, py, 1.0, a0, a0+90, 8)
    out.append(f'<g fill="none" stroke="#fff" stroke-linecap="round" opacity="{opacity}" filter="url(#soft)">')
    for a, b in segs:
        r = clip_line(cam(a), cam(b))
        if not r: continue
        (p, q) = r; z = (p[2] + q[2]) / 2
        w = max(1.0, min(14.0, line_m * f / z))                        # linjebredd följer perspektivet
        x1_, y1_ = P(p); x2_, y2_ = P(q)
        out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke-width="%.1f"/>' % (x1_, y1_, x2_, y2_, w))
    out.append('</g>')
    out.append(f'<rect width="{W}" height="{H}" fill="url(#haze)"/></svg>')   # tona ut det som är längst bort
    return '\n'.join(out)

if __name__ == '__main__':
    # Kamera strax utanför planens högra nedre hörn (X=68, Y=0), upphöjd, blickar diagonalt mot motsatt hörn.
    svg = build(C=(74, -8, 40), T=(34, 52, 0), f=600, cy_frac=0.38)
    sys.stdout.write(svg)
