// Fragment shader per gli sfondi animati (piano fullscreen).
// Ognuno riceve gli uniform: uTime (sec), uMouse (-1..1), uRes (px).
// Il vertex shader e il chunk di noise sono condivisi.

export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// hash / value-noise / fbm condivisi + h1 (hash 1D per fasi pseudo-casuali)
const NOISE = /* glsl */ `
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float h1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }
`;

const HEADER = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uRes;
`;

/* ---------------- Aurora (palette Case Analyst) ---------------- */
export const auroraFrag = HEADER + NOISE + /* glsl */ `
  // distanza da un segmento a-b (per linee della rete e scie)
  float segDist(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec2 p = uv;
    p.x *= aspect;
    p = p * 2.4 + uMouse * 0.25;

    float t = uTime * 0.045;

    vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));
    vec2 r = vec2(
      fbm(p + 3.5 * q + vec2(1.7, 9.2) + t * 0.6),
      fbm(p + 3.5 * q + vec2(8.3, 2.8) - t * 0.5)
    );
    float f = fbm(p + 3.5 * r);

    vec3 bg       = vec3(0.020, 0.027, 0.022);
    vec3 greenDim = vec3(0.055, 0.330, 0.090);
    vec3 green    = vec3(0.200, 1.000, 0.200);
    vec3 amber    = vec3(1.000, 0.690, 0.000);

    vec3 col = bg;
    col = mix(col, greenDim, smoothstep(0.0, 0.9, f));
    col = mix(col, green,    smoothstep(0.50, 1.0, r.x));
    col = mix(col, amber,    smoothstep(0.72, 1.08, f * q.x * 1.9));

    col *= 0.5;

    // ---- rete di nodi (neural net) ----
    vec2 sc = vec2(uv.x * aspect, uv.y);
    vec2 np[8];
    for (int i = 0; i < 8; i++) {
      float fi = float(i);
      vec2 base = vec2(h1(fi * 1.3), h1(fi * 2.7 + 1.0));
      base += 0.07 * vec2(sin(uTime * 0.3 + fi), cos(uTime * 0.27 + fi * 1.7));
      np[i] = vec2(base.x * aspect, base.y);
    }
    float netG = 0.0; // linee/nodi (verde)
    float netA = 0.0; // impulsi/cuore nodi (ambra)
    for (int i = 0; i < 8; i++) {
      for (int j = 0; j < 8; j++) {
        if (j > i) {
          vec2 a = np[i];
          vec2 b = np[j];
          float L = length(b - a);
          if (L < 0.55) {
            float line = smoothstep(0.006, 0.0, segDist(sc, a, b)) * smoothstep(0.55, 0.18, L);
            netG += line * 0.5;
            vec2 ba = b - a;
            float hh = clamp(dot(sc - a, ba) / dot(ba, ba), 0.0, 1.0);
            float pulse = fract(uTime * 0.4 + h1(float(i) * 3.0 + float(j)));
            netA += smoothstep(0.05, 0.0, abs(hh - pulse)) * line;
          }
        }
      }
    }
    for (int i = 0; i < 8; i++) {
      float dnode = length(sc - np[i]);
      netG += smoothstep(0.022, 0.0, dnode) * 0.9;
      netA += smoothstep(0.009, 0.0, dnode);
    }
    col += green * netG * 0.5;
    col += amber * netA * 0.6;

    // ---- scie di dati / meteore ----
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float prog = fract(uTime * (0.12 + 0.05 * h1(fi + 3.0)) + h1(fi * 9.0));
      vec2 dirv = normalize(vec2(1.0, -0.35 + 0.25 * h1(fi)));
      vec2 start = vec2(-0.2 * aspect, h1(fi * 4.0) + 0.3);
      vec2 head = start + dirv * prog * (aspect + 0.7);
      vec2 tail = head - dirv * 0.35;
      float along = clamp(dot(sc - tail, head - tail) / dot(head - tail, head - tail), 0.0, 1.0);
      float streak = smoothstep(0.004, 0.0, segDist(sc, tail, head)) * along;
      float vis = smoothstep(0.0, 0.1, prog) * smoothstep(1.0, 0.7, prog);
      col += mix(green, amber, h1(fi * 5.0)) * streak * vis * 1.2;
    }

    // ---- particelle / scintille fluttuanti ----
    vec3 sparkCol = vec3(0.0);
    for (int s = 0; s < 2; s++) {
      float layer = float(s);
      float scale = 7.0 + layer * 5.0;
      vec2 gp = sc * scale - vec2(0.0, uTime * (0.05 + 0.03 * layer)); // braci che salgono
      vec2 cellp = floor(gp);
      vec2 fp = fract(gp);
      for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
          vec2 off = vec2(float(x), float(y));
          float rnd = h1(dot(cellp + off, vec2(27.1, 13.7)) + layer * 91.0);
          vec2 ppos = off + vec2(h1(rnd * 3.0), h1(rnd * 5.0));
          float d = length(fp - ppos);
          float tw = 0.45 + 0.55 * sin(uTime * (1.0 + 2.0 * rnd) + rnd * 6.28);
          float g = smoothstep(0.16, 0.0, d) * tw * (0.7 - 0.25 * layer);
          sparkCol += mix(green, amber, step(0.5, h1(rnd * 9.0))) * g;
        }
      }
    }
    col += sparkCol * 0.4;

    float vig = smoothstep(1.25, 0.25, length(uv - 0.5));
    col *= mix(0.4, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ---------------- Nuvole (cielo azzurro, nuvole bianche) ---------------- */
export const cloudsFrag = HEADER + NOISE + /* glsl */ `
  // distanza da un segmento (per disegnare le ali)
  float seg(vec2 p, vec2 a, vec2 b, float w) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return smoothstep(w, 0.0, length(pa - ba * h));
  }
  // sagoma di uccello (a "gabbiano") con apertura alare variabile (flap 0..1)
  float birdMask(vec2 q, float flap) {
    float wingY = mix(0.18, 0.62, flap);
    vec2 c = vec2(0.0, 0.0);
    vec2 midL = vec2(-0.5, wingY * 0.45);
    vec2 midR = vec2(0.5, wingY * 0.45);
    vec2 tipL = vec2(-1.0, wingY);
    vec2 tipR = vec2(1.0, wingY);
    float w = 0.16;
    float b = 0.0;
    b = max(b, seg(q, c, midL, w));
    b = max(b, seg(q, midL, tipL, w * 0.8));
    b = max(b, seg(q, c, midR, w));
    b = max(b, seg(q, midR, tipR, w * 0.8));
    return b;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec2 p = uv;
    p.x *= aspect;
    p += uMouse * 0.06;

    float t = uTime * 0.02;

    // gradiente cielo: piu' chiaro verso l'orizzonte (basso)
    vec3 skyTop = vec3(0.16, 0.40, 0.74);
    vec3 skyBot = vec3(0.52, 0.72, 0.92);
    vec3 col = mix(skyBot, skyTop, smoothstep(0.0, 1.0, uv.y));

    // campo di nuvole domain-warped che scorre lentamente
    vec2 q = vec2(fbm(p * 1.4 + vec2(t, 0.0)), fbm(p * 1.4 + vec2(4.0, -t)));
    float clouds = fbm(p * 1.7 + 2.0 * q + vec2(t * 1.6, 0.0));
    clouds = smoothstep(0.42, 0.92, clouds);
    float detail = fbm(p * 4.5 + vec2(-t * 0.9, t * 0.5));
    clouds = clamp(clouds + (detail - 0.5) * 0.22, 0.0, 1.0);

    // ombra alla base, bianco brillante in cima
    vec3 cloudCol = mix(vec3(0.74, 0.80, 0.88), vec3(1.0), clouds);
    col = mix(col, cloudCol, clouds * 0.92);

    // bagliore del sole in alto a destra
    vec2 sun = vec2(aspect * 0.80, 0.88);
    float d = length(p - sun);
    col += vec3(1.0, 0.96, 0.82) * smoothstep(0.95, 0.0, d) * 0.22;

    // stormo di uccelli che attraversa il cielo (parte alta)
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float spd = 0.05 + 0.03 * h1(fi);
      float dir = (mod(fi, 2.0) < 0.5) ? 1.0 : -1.0;
      float fx = fract(uTime * spd + h1(fi * 7.0));
      float cx = (dir > 0.0 ? fx : 1.0 - fx) * (aspect + 0.4) - 0.2;
      float cy = 0.60 + 0.32 * h1(fi * 3.0) + 0.02 * sin(uTime * 0.6 + fi);
      float bscale = 0.026 + 0.014 * h1(fi * 2.0);
      vec2 q = (p - vec2(cx, cy)) / bscale;
      q.x *= dir;
      float flap = sin(uTime * 7.0 + fi * 1.7) * 0.5 + 0.5;
      float m = birdMask(q, flap);
      col = mix(col, vec3(0.16, 0.18, 0.22), m * 0.85);
    }

    // lieve scurimento ai bordi per la leggibilita'
    float vig = smoothstep(1.30, 0.35, length(uv - 0.5));
    col *= mix(0.78, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ---------------- Circuiti (PCB con segnali che viaggiano) ---------------- */
export const circuitsFrag = HEADER + NOISE + /* glsl */ `
  // SDF box (negativo all'interno)
  float box(vec2 q, vec2 b) {
    vec2 d = abs(q) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }
  // sagoma robottino (testa, corpo, antenna, gambe) in coordinate locali
  float robotMask(vec2 q) {
    float m = step(box(q - vec2(0.0, -0.05), vec2(0.45, 0.40)) - 0.08, 0.0); // corpo
    m = max(m, step(box(q - vec2(0.0, 0.55), vec2(0.38, 0.30)) - 0.08, 0.0)); // testa
    m = max(m, step(box(q - vec2(0.0, 1.00), vec2(0.03, 0.16)), 0.0));        // antenna
    m = max(m, step(box(q - vec2(-0.22, -0.60), vec2(0.10, 0.16)), 0.0));     // gamba sx
    m = max(m, step(box(q - vec2(0.22, -0.60), vec2(0.10, 0.16)), 0.0));      // gamba dx
    return m;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec2 p = uv;
    p.x *= aspect;
    p += uMouse * 0.03;

    float t = uTime;

    vec3 board = vec3(0.015, 0.085, 0.060);  // PCB verde scuro
    vec3 trace = vec3(0.050, 0.300, 0.230);  // piste tipo rame/teal
    vec3 sig   = vec3(0.350, 1.000, 0.720);  // segnale luminoso
    vec3 node  = vec3(1.000, 0.760, 0.220);  // piazzole ambra

    vec3 col = board;
    col += (noise(p * 26.0) - 0.5) * 0.025; // microrumore del board

    float scale = 13.0;
    vec2 g = p * scale;
    vec2 cell = floor(g);
    vec2 f = fract(g);

    // non tutte le celle hanno piste: decide un hash → look di routing
    float vOn = step(0.50, h1(cell.x * 1.7 + 3.0));
    float hOn = step(0.55, h1(cell.y * 2.3 + 7.0));

    float lineW = 0.05;
    float vLine = vOn * smoothstep(lineW, 0.0, abs(f.x - 0.5));
    float hLine = hOn * smoothstep(lineW, 0.0, abs(f.y - 0.5));
    float tr = max(vLine, hLine);
    col = mix(col, trace, tr);

    // segnali che viaggiano: impulso lungo le verticali (in y) e le orizzontali (in x)
    float pulseY = fract(t * 0.18 + h1(cell.x * 5.0));
    float sigV = vLine * smoothstep(0.07, 0.0, abs(uv.y - pulseY));
    float pulseX = fract(t * 0.16 + h1(cell.y * 9.0 + 1.0));
    float sigH = hLine * smoothstep(0.07, 0.0, abs(uv.x - pulseX));
    float s = max(sigV, sigH);
    col = mix(col, sig, s);
    col += sig * s * 0.6; // glow additivo

    // piazzole/nodi dove si incrociano le piste
    float pad = vOn * hOn * smoothstep(0.16, 0.0, length(f - 0.5));
    col = mix(col, node, pad * 0.85);
    col += node * pad * 0.4;

    // robottini che camminano sulla scheda
    for (int i = 0; i < 4; i++) {
      float ri = float(i);
      float spd = 0.04 + 0.02 * h1(ri + 0.5);
      float dir = (mod(ri, 2.0) < 0.5) ? 1.0 : -1.0;
      float fxp = fract(t * spd + h1(ri * 3.7));
      float cx = (dir > 0.0 ? fxp : 1.0 - fxp) * (aspect + 0.6) - 0.3;
      float cy = 0.18 + 0.62 * h1(ri * 5.1);
      float bob = 0.012 * sin(t * 5.0 + ri);
      float rscale = 0.06 + 0.02 * h1(ri * 2.0);
      vec2 q = (p - vec2(cx, cy + bob)) / rscale;
      q.x *= dir;
      float m = robotMask(q);
      if (m > 0.5) {
        vec3 metal = mix(vec3(0.55, 0.60, 0.66), vec3(0.28, 0.34, 0.40), smoothstep(-0.6, 1.2, q.y));
        col = mix(col, metal, 0.95);
      }
      // occhi (segnale) e luce d'antenna (ambra), additivi
      float eyeL = 1.0 - smoothstep(0.10, 0.16, length(q - vec2(-0.16, 0.58)));
      float eyeR = 1.0 - smoothstep(0.10, 0.16, length(q - vec2(0.16, 0.58)));
      float ant = 1.0 - smoothstep(0.08, 0.14, length(q - vec2(0.0, 1.20)));
      col += sig * (eyeL + eyeR) * 0.9;
      col += node * ant * (0.6 + 0.4 * sin(t * 4.0 + ri));
    }

    float vig = smoothstep(1.30, 0.30, length(uv - 0.5));
    col *= mix(0.55, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ---------------- Mare (acqua blu, fondale basso, pesci) ---------------- */
export const seaFrag = HEADER + NOISE + /* glsl */ `
  // sagoma pesce cartoon in coordinate locali (dir = +1 verso destra)
  float fishMask(vec2 q, float dir) {
    q.x *= dir;                  // pesce rivolto verso +x
    // corpo arrotondato
    float body = 1.0 - smoothstep(0.92, 1.04, length(vec2(q.x / 1.15, q.y / 0.72)));
    // coda triangolare dietro
    float tail = 0.0;
    float tx = -q.x - 0.7;
    if (tx > 0.0 && tx < 0.7) {
      tail = 1.0 - smoothstep(0.0, 0.5, abs(q.y) - tx * 1.05);
    }
    // pinna dorsale
    float fin = 0.0;
    float fxx = q.x + 0.05;
    if (q.y > 0.5 && abs(fxx) < 0.4) {
      float top = 0.55 + (0.4 - abs(fxx)) * 0.9;
      fin = 1.0 - smoothstep(top - 0.02, top, q.y);
    }
    return clamp(max(body, max(tail, fin)), 0.0, 1.0);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec2 p = uv;
    p.x *= aspect;
    p += uMouse * 0.02;

    float t = uTime;

    // gradiente acqua: chiara in superficie (alto), profonda sul fondo
    vec3 surf = vec3(0.10, 0.55, 0.70);
    vec3 deep = vec3(0.01, 0.09, 0.24);
    vec3 col = mix(deep, surf, smoothstep(-0.15, 1.05, uv.y));

    // caustiche/luce vicino alla superficie
    float cau = fbm(vec2(p.x * 4.0 + sin(t * 0.5) * 0.3, p.y * 4.0 - t * 0.4));
    float caustics = smoothstep(0.58, 0.95, cau) * smoothstep(0.25, 1.0, uv.y);
    col += vec3(0.40, 0.70, 0.80) * caustics * 0.22;

    // raggi di luce dall'alto
    float ray = sin(uv.x * 6.0 + t * 0.2) * 0.5 + 0.5;
    col += vec3(0.30, 0.60, 0.70) * ray * smoothstep(0.45, 1.0, uv.y) * 0.05;

    // fondale basso (vicino al bordo inferiore)
    float bedH = 0.15 + 0.03 * sin(p.x * 3.0 + 0.5) + 0.025 * fbm(p * 3.0);
    float bed = smoothstep(bedH + 0.012, bedH - 0.012, uv.y);
    vec3 sand = vec3(0.42, 0.37, 0.26) * (0.7 + 0.3 * noise(p * 38.0));
    col = mix(col, sand * 0.65, bed);

    // pesci cartoon che nuotano
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float speed = 0.04 + 0.025 * h1(fi);
      float dir = (mod(fi, 2.0) < 0.5) ? 1.0 : -1.0;
      float startY = 0.34 + 0.46 * h1(fi * 3.0);
      float fx = fract(t * speed + h1(fi * 7.0));
      float cx = (dir > 0.0 ? fx : 1.0 - fx) * (aspect + 0.5) - 0.25;
      float cy = startY + 0.025 * sin(t * 1.5 + fi);
      float fscale = 0.05 + 0.03 * h1(fi * 2.0);
      vec2 q = (p - vec2(cx, cy)) / fscale;
      float m = fishMask(q, dir);
      if (m > 0.001) {
        // colori cartoon vivaci (arancio/giallo, alcuni azzurri)
        vec3 fishCol = mix(vec3(1.0, 0.55, 0.15), vec3(1.0, 0.82, 0.20), h1(fi * 4.0));
        fishCol = mix(fishCol, vec3(0.20, 0.80, 0.85), step(0.66, h1(fi * 11.0)));
        // occhio (bianco + pupilla)
        vec2 qd = vec2(q.x * dir, q.y);
        vec2 eyeC = vec2(0.5, 0.14);
        float white = 1.0 - smoothstep(0.13, 0.17, length(qd - eyeC));
        float pupil = 1.0 - smoothstep(0.06, 0.085, length(qd - eyeC - vec2(0.02, 0.0)));
        fishCol = mix(fishCol, vec3(1.0), white);
        fishCol = mix(fishCol, vec3(0.05, 0.06, 0.08), pupil);
        col = mix(col, fishCol, m * 0.96);
      }
    }

    // bolle cartoon che salgono (contorno + riflesso)
    for (int j = 0; j < 9; j++) {
      float bj = float(j);
      float bx = h1(bj * 1.3) * aspect;
      float by = fract(t * (0.06 + 0.04 * h1(bj)) + h1(bj * 2.1));
      float br = 0.02 + 0.022 * h1(bj * 5.0);
      vec2 bc = vec2(bx + 0.02 * sin(t * 1.4 + bj), by);
      float d = length(p - bc);
      float ring = smoothstep(br, br - 0.006, d) - smoothstep(br - 0.012, br - 0.02, d);
      float fill = smoothstep(br, br * 0.55, d) * 0.16;
      float hi = 1.0 - smoothstep(br * 0.16, br * 0.30, length(p - (bc + vec2(-br * 0.32, br * 0.32))));
      col += vec3(0.85, 0.95, 1.0) * (ring * 0.9 + fill + hi * 0.6);
    }

    float vig = smoothstep(1.30, 0.30, length(uv - 0.5));
    col *= mix(0.62, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;
