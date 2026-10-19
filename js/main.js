document.addEventListener('DOMContentLoaded', () => {
    const config = {
        correctPassword: "261025",
        maxDigits: 6,
        msgStart: "Autenticación Requerida",
        msgError: "Código Incorrecto",
        msgSuccess: "Acceso Concedido"
    };

    let currentInput = "";

    // Audios de efectos
    const keySound = new Audio('song/key_press.mp3');
    const accessSound = new Audio('song/access.mp3');
    const errorSound = new Audio('song/error.mp3');
    const deleteSound = new Audio('song/delete.mp3');
    
    // Audio de música de fondo (Title)
    const bgMusic = new Audio('song/title.mp3');
    bgMusic.loop = true;
    let isMusicPlaying = false;
    let inJourney = false; // true después de pasar la contraseña

    // Audio de Shrek/Accidentally in Love para la carta
    const shrekAudio = new Audio('song/shrek.mp3');
    shrekAudio.loop = true;
    let shrekReady = false;
    fetch('song/shrek.mp3', { method: 'HEAD' })
        .then(r => {
            if (r.ok) { shrekReady = true; return; }
            shrekAudio.src = 'song/accidentally.mp3';
            return fetch('song/accidentally.mp3', { method: 'HEAD' }).then(r2 => { shrekReady = r2.ok; });
        })
        .catch(() => {
            shrekAudio.src = 'song/accidentally.mp3';
            return fetch('song/accidentally.mp3', { method: 'HEAD' }).then(r2 => { shrekReady = r2.ok; }).catch(() => { shrekReady = false; });
        });

    // Audio de la secuencia de la Etapa 3 (song/aniversario.mp3 si existe, si no title.mp3)
    const stage3Audio = new Audio();
    stage3Audio.loop = true;
    let stage3TrackReady = false;
    let lyricsData = [];
    let fxCounter = 0;

    // ---- Ornamentos SVG complejos (al estilo de la flor) para cada número ----
    const f1 = n => n.toFixed(1);
    const polar = (a, r) => {
        const rad = (a - 90) * Math.PI / 180;
        return [200 + r * Math.cos(rad), 200 + r * Math.sin(rad)];
    };
    const P = (a, r) => { const [x, y] = polar(a, r); return `${f1(x)},${f1(y)}`; };
    const miniHeart = (x, y, s) =>
        `M${f1(x)},${f1(y + 8 * s)} C${f1(x - 10 * s)},${f1(y + 2 * s)} ${f1(x - 9 * s)},${f1(y - 7 * s)} ${f1(x - 4 * s)},${f1(y - 7 * s)} ` +
        `C${f1(x - 1 * s)},${f1(y - 7 * s)} ${f1(x)},${f1(y - 4 * s)} ${f1(x)},${f1(y - 2 * s)} ` +
        `C${f1(x)},${f1(y - 4 * s)} ${f1(x + 1 * s)},${f1(y - 7 * s)} ${f1(x + 4 * s)},${f1(y - 7 * s)} ` +
        `C${f1(x + 9 * s)},${f1(y - 7 * s)} ${f1(x + 10 * s)},${f1(y + 2 * s)} ${f1(x)},${f1(y + 8 * s)} Z`;
    const sparklePath = (x, y) =>
        `M${f1(x)},${f1(y - 11)} Q${f1(x + 2)},${f1(y - 2)} ${f1(x + 11)},${f1(y)} Q${f1(x + 2)},${f1(y + 2)} ${f1(x)},${f1(y + 11)} ` +
        `Q${f1(x - 2)},${f1(y + 2)} ${f1(x - 11)},${f1(y)} Q${f1(x - 2)},${f1(y - 2)} ${f1(x)},${f1(y - 11)} Z`;
    const svgOrn = inner => `<svg class="orn" viewBox="0 0 400 400">${inner}</svg>`;

    const ORNAMENTS = [];
    const I = n => Math.min(n, 20);

    // FX 1: Mandala celestial (rayos, doble anillo de puntos girando y pétalos)
    {
        let s = '<circle class="glow" cx="200" cy="200" r="150" fill="rgba(255,213,79,0.09)"/>';
        s += '<g class="turn">';
        for (let k = 0; k < 16; k++) s += `<path class="dr" pathLength="1" style="--i:${I(k)}" d="M${P(k * 22.5, 66)} L${P(k * 22.5, 158)}"/>`;
        s += `<circle class="dr" cx="200" cy="200" r="150" pathLength="1" style="--i:8"/>`;
        s += `<circle class="dr" cx="200" cy="200" r="60" pathLength="1" style="--i:12"/>`;
        s += '</g>';
        let ringA = '';
        for (let k = 0; k < 16; k++) {
            const [x, y] = polar(k * 22.5, 124);
            ringA += `<circle class="pop" cx="${f1(x)}" cy="${f1(y)}" r="4.5" style="--i:${I(k)}"/>`;
        }
        s += `<g class="spin">${ringA}</g>`;
        let ringB = '';
        for (let k = 0; k < 24; k++) {
            const [x, y] = polar(k * 15 + 7.5, 98);
            ringB += `<circle class="pop" cx="${f1(x)}" cy="${f1(y)}" r="2.6" style="--i:${I(k / 2)}"/>`;
        }
        s += `<g class="spin-rev">${ringB}</g>`;
        for (let k = 0; k < 12; k++) s += `<path class="dr petal" pathLength="1" transform="rotate(${k * 30} 200 200)" style="--i:${I(4 + k)}" d="M200,200 Q214,158 200,120 Q186,158 200,200 Z"/>`;
        [[40, 60], [360, 60], [40, 340], [360, 340], [200, 34], [200, 366]].forEach(([x, y], k) => {
            s += `<path class="pop" style="--i:${I(14 + k)}" d="${sparklePath(x, y)}"/>`;
        });
        ORNAMENTS.push(svgOrn(s));
    }

    // FX 2: Corazón vivo (tres corazones, corona de puntos girando y mini corazones)
    {
        const HEART = 'M200,336 C120,278 64,220 64,154 C64,104 104,72 148,72 C176,72 194,88 200,104 C206,88 224,72 252,72 C296,72 336,104 336,154 C336,220 280,278 200,336 Z';
        let s = '<circle class="glow" cx="200" cy="200" r="160" fill="rgba(255,107,157,0.10)"/>';
        let halo = '';
        for (let k = 0; k < 24; k++) {
            const [x, y] = polar(k * 15, 168);
            halo += `<circle class="pop" cx="${f1(x)}" cy="${f1(y)}" r="3" style="--i:${I(k * 0.7)}"/>`;
        }
        s += `<g class="spin">${halo}</g>`;
        s += `<path class="dr beat" pathLength="1" style="--i:0" d="${HEART}"/>`;
        s += `<path class="dr" pathLength="1" transform="translate(200 206) scale(.62) translate(-200 -206)" style="--i:5" d="${HEART}"/>`;
        s += `<path class="dr" pathLength="1" transform="translate(200 206) scale(.3) translate(-200 -206)" style="--i:9" d="${HEART}"/>`;
        s += '<path class="dr" pathLength="1" style="--i:6" d="M92,320 Q200,368 308,320"/>';
        s += '<path class="dr" pathLength="1" style="--i:8" d="M120,346 Q200,386 280,346"/>';
        for (let k = 0; k < 10; k++) {
            const [x, y] = polar(k * 36 + 18, 176);
            s += `<path class="pop" style="--i:${I(8 + k)}" d="${miniHeart(x, y, 1.5)}"/>`;
        }
        [[44, 44], [356, 44], [44, 356], [356, 356]].forEach(([x, y], k) => {
            s += `<path class="pop" style="--i:${I(12 + k)}" d="${sparklePath(x, y)}"/>`;
        });
        ORNAMENTS.push(svgOrn(s));
    }

    // FX 3: Loto en el estanque (pétalos dobles, estambres, polen y ondas)
    {
        let s = '<circle class="glow" cx="200" cy="200" r="150" fill="rgba(255,143,171,0.10)"/>';
        s += '<g class="sway">';
        for (let k = 0; k < 8; k++) s += `<path class="dr petal" pathLength="1" transform="rotate(${k * 45} 200 200)" style="--i:${I(k)}" d="M200,200 Q236,140 200,54 Q164,140 200,200 Z"/>`;
        for (let k = 0; k < 8; k++) s += `<path class="dr" pathLength="1" transform="rotate(${k * 45 + 22.5} 200 200)" style="--i:${I(4 + k)}" d="M200,200 Q222,158 200,112 Q178,158 200,200 Z"/>`;
        s += '</g>';
        for (let k = 0; k < 16; k++) s += `<path class="dr" pathLength="1" style="--i:${I(8 + k / 2)}" d="M${P(k * 22.5 + 11, 34)} L${P(k * 22.5 + 11, 58)}"/>`;
        for (let k = 0; k < 16; k++) {
            const [x, y] = polar(k * 22.5 + 11, 62);
            s += `<circle class="pop" cx="${f1(x)}" cy="${f1(y)}" r="4.5" style="--i:${I(10 + k / 2)}"/>`;
        }
        for (let k = 0; k < 3; k++) s += `<circle class="dr echo" cx="200" cy="200" r="${150 - k * 22}" pathLength="1" style="--i:${k * 2}"/>`;
        [[60, 60], [340, 60], [60, 340], [340, 340], [200, 28], [200, 372]].forEach(([x, y], k) => {
            s += `<path class="pop" style="--i:${I(14 + k)}" d="${sparklePath(x, y)}"/>`;
        });
        ORNAMENTS.push(svgOrn(s));
    }

    // FX 4: Estrella constelada (estrella de 8 puntas, órbitas con satélites y constelación)
    {
        const STAR8 = 'M200,52 L238,132 L318,90 L276,170 L356,200 L276,230 L318,310 L238,268 L200,348 L162,268 L82,310 L124,230 L44,200 L124,170 L82,90 L162,132 Z';
        let s = '<circle class="glow" cx="200" cy="200" r="155" fill="rgba(206,147,216,0.10)"/>';
        s += `<path class="dr" pathLength="1" style="--i:0" d="${STAR8}"/>`;
        s += `<path class="dr" pathLength="1" transform="translate(200 200) scale(.66) translate(-200 -200) rotate(22.5 200 200)" style="--i:3" d="${STAR8}"/>`;
        let orbA = `<ellipse class="dr" cx="200" cy="200" rx="156" ry="64" pathLength="1" style="--i:4"/>`;
        for (let k = 0; k < 4; k++) {
            const a = (k * 90 + 45) * Math.PI / 180;
            orbA += `<circle class="pop" cx="${f1(200 + 156 * Math.cos(a))}" cy="${f1(200 + 64 * Math.sin(a))}" r="4.5" style="--i:${I(6 + k)}"/>`;
        }
        s += `<g class="orbit">${orbA}</g>`;
        let orbB = `<ellipse class="dr" cx="200" cy="200" rx="64" ry="156" pathLength="1" style="--i:5"/>`;
        for (let k = 0; k < 4; k++) {
            const a = k * 90 * Math.PI / 180;
            orbB += `<circle class="pop" cx="${f1(200 + 64 * Math.cos(a))}" cy="${f1(200 + 156 * Math.sin(a))}" r="4.5" style="--i:${I(8 + k)}"/>`;
        }
        s += `<g class="orbit-rev">${orbB}</g>`;
        const constel = [[92, 92], [132, 76], [170, 104], [246, 92], [292, 112], [318, 158], [282, 292], [236, 314], [150, 300], [112, 264], [78, 210], [58, 152]];
        for (let k = 0; k < constel.length - 1; k++) {
            const [x1, y1] = constel[k], [x2, y2] = constel[k + 1];
            s += `<path class="dr" pathLength="1" style="--i:${I(8 + k)}" d="M${x1},${y1} L${x2},${y2}"/>`;
        }
        constel.forEach(([x, y], k) => { s += `<path class="pop" style="--i:${I(10 + k * 0.6)}" d="${sparklePath(x, y)}"/>`; });
        for (let k = 0; k < 3; k++) s += `<circle class="dr echo" cx="200" cy="200" r="${88 + k * 20}" pathLength="1" style="--i:${k * 2}"/>`;
        ORNAMENTS.push(svgOrn(s));
    }

    // FX 5: Espiral de pétalos y luciérnagas
    {
        let s = '<circle class="glow" cx="200" cy="200" r="150" fill="rgba(85,239,196,0.09)"/>';
        s += '<path class="dr" pathLength="1" style="--i:0" d="M200,200 C232,196 240,172 224,154 C204,132 168,142 158,176 C146,216 178,254 222,256 C274,258 312,214 304,158 C296,100 240,58 180,66 C114,75 64,132 64,200 C64,274 132,330 210,332"/>';
        [[224, 154, -30], [158, 176, -80], [222, 256, 40], [304, 158, 100], [180, 66, -140], [64, 200, 180], [210, 332, 120], [200, 200, 0]]
            .forEach(([x, y, a], k) => { s += `<path class="dr petal" pathLength="1" transform="translate(${x} ${y}) rotate(${a})" style="--i:${I(3 + k)}" d="M0,0 C10,-14 8,-30 0,-36 C-8,-30 -10,-14 0,0 Z"/>`; });
        for (let k = 0; k < 14; k++) {
            const [x, y] = polar(k * 25.7, Math.min(60 + k * 6.5, 150));
            s += `<circle class="pop" cx="${f1(x)}" cy="${f1(y)}" r="${(3 + (k % 3) * 1.4).toFixed(1)}" style="--i:${I(4 + k * 0.8)}"/>`;
        }
        for (let k = 0; k < 3; k++) s += `<circle class="dr echo" cx="200" cy="200" r="${70 + k * 34}" pathLength="1" style="--i:${k}"/>`;
        [[70, 70], [330, 70], [70, 330], [330, 330], [200, 26], [200, 374]].forEach(([x, y], k) => {
            s += `<path class="pop" style="--i:${I(12 + k * 1.2)}" d="${sparklePath(x, y)}"/>`;
        });
        ORNAMENTS.push(svgOrn(s));
    }

    // FX 6: Danza de mariposas de luz con estela
    {
        const wingUL = 'M0,0 C-16,-16 -36,-18 -40,-4 C-42,8 -26,16 -4,8 Z';
        const wingUR = 'M0,0 C16,-16 36,-18 40,-4 C42,8 26,16 4,8 Z';
        const wingDL = 'M0,4 C-14,10 -30,8 -34,18 C-36,30 -18,34 -2,20 Z';
        const wingDR = 'M0,4 C14,10 30,8 34,18 C36,30 18,34 2,20 Z';
        const butterfly = (x, y, sc, base) =>
            `<g transform="translate(${x} ${y}) scale(${sc})"><g class="sway">` +
            `<path class="dr" pathLength="1" style="--i:${I(base)}" d="${wingUL}"/>` +
            `<path class="dr" pathLength="1" style="--i:${I(base + 1)}" d="${wingUR}"/>` +
            `<path class="dr" pathLength="1" style="--i:${I(base + 2)}" d="${wingDL}"/>` +
            `<path class="dr" pathLength="1" style="--i:${I(base + 3)}" d="${wingDR}"/>` +
            `<path class="dr" pathLength="1" style="--i:${I(base + 1)}" d="M0,-8 Q0,10 0,22"/>` +
            `<path class="dr" pathLength="1" style="--i:${I(base)}" d="M0,-8 Q-6,-16 -12,-20"/>` +
            `<path class="dr" pathLength="1" style="--i:${I(base + 2)}" d="M0,-8 Q6,-16 12,-20"/>` +
            `</g></g>`;
        let s = '<circle class="glow" cx="200" cy="200" r="150" fill="rgba(255,183,77,0.09)"/>';
        const trail = [[64, 300], [96, 268], [134, 248], [178, 244], [222, 252], [262, 268], [296, 292], [318, 322]];
        for (let k = 0; k < trail.length - 1; k++) {
            const [x1, y1] = trail[k], [x2, y2] = trail[k + 1];
            s += `<path class="dr" pathLength="1" style="--i:${I(k)}" d="M${x1},${y1} L${x2},${y2}"/>`;
        }
        trail.forEach(([x, y], k) => { s += `<circle class="pop" cx="${x}" cy="${y}" r="3.2" style="--i:${I(4 + k)}"/>`; });
        s += butterfly(136, 156, 1.05, 6);
        s += butterfly(272, 130, 0.8, 10);
        s += butterfly(210, 210, 0.62, 14);
        [[50, 46], [350, 46], [50, 354], [350, 354]].forEach(([x, y], k) => {
            s += `<path class="pop" style="--i:${I(10 + k)}" d="${sparklePath(x, y)}"/>`;
        });
        for (let k = 0; k < 2; k++) s += `<circle class="dr echo" cx="200" cy="200" r="${110 + k * 40}" pathLength="1" style="--i:${k * 2}"/>`;
        ORNAMENTS.push(svgOrn(s));
    }

    // FX 7: Rosa de luz (tres anillos de pétalos, espiral central, hojas y rocío)
    {
        let s = '<circle class="glow" cx="200" cy="200" r="150" fill="rgba(212,175,55,0.10)"/>';
        for (let k = 0; k < 6; k++) s += `<path class="dr" pathLength="1" transform="rotate(${k * 60} 200 200)" style="--i:${I(k)}" d="M200,200 C236,176 244,128 200,84 C156,128 164,176 200,200 Z"/>`;
        for (let k = 0; k < 6; k++) s += `<path class="dr" pathLength="1" transform="rotate(${k * 60 + 30} 200 200)" style="--i:${I(4 + k)}" d="M200,200 C226,182 232,146 200,116 C168,146 174,182 200,200 Z"/>`;
        for (let k = 0; k < 5; k++) s += `<path class="dr petal" pathLength="1" transform="rotate(${k * 72 + 12} 200 200)" style="--i:${I(8 + k)}" d="M200,200 C216,188 220,166 200,148 C180,166 184,188 200,200 Z"/>`;
        s += '<path class="dr" pathLength="1" style="--i:12" d="M200,200 C212,196 214,184 202,180 C190,178 184,190 194,196 C202,200 208,194 204,188"/>';
        s += '<g class="sway"><path class="dr" pathLength="1" style="--i:14" d="M40,330 C70,290 120,282 158,300 C120,318 84,336 40,330 Z"/></g>';
        s += '<g class="sway"><path class="dr" pathLength="1" style="--i:15" d="M360,330 C330,290 280,282 242,300 C280,318 316,336 360,330 Z"/></g>';
        for (let k = 0; k < 10; k++) {
            const [x, y] = polar(k * 36 + 18, 164);
            s += `<circle class="pop" cx="${f1(x)}" cy="${f1(y)}" r="3.4" style="--i:${I(10 + k)}"/>`;
        }
        for (let k = 0; k < 2; k++) s += `<circle class="dr echo" cx="200" cy="200" r="${128 + k * 26}" pathLength="1" style="--i:${k * 2}"/>`;
        [[200, 40], [70, 118], [330, 118]].forEach(([x, y], k) => { s += `<path class="pop" style="--i:${I(14 + k * 1.5)}" d="${sparklePath(x, y)}"/>`; });
        ORNAMENTS.push(svgOrn(s));
    }

    // FX 8: Sol radiante (rayos ondulados, corona doble y chispas girando)
    {
        let s = '<circle class="glow" cx="200" cy="200" r="155" fill="rgba(255,245,157,0.10)"/>';
        for (let k = 0; k < 16; k++) s += `<path class="dr" pathLength="1" style="--i:${I(k)}" d="M${P(k * 22.5, 88)} Q${P(k * 22.5 + 6, 118)} ${P(k * 22.5, 152)}"/>`;
        for (let k = 0; k < 16; k++) s += `<path class="dr" pathLength="1" style="--i:${I(k)}" d="M${P(k * 22.5 + 11.25, 96)} L${P(k * 22.5 + 11.25, 124)}"/>`;
        s += `<circle class="dr" cx="200" cy="200" r="84" pathLength="1" style="--i:6"/>`;
        s += `<circle class="dr" cx="200" cy="200" r="70" pathLength="1" style="--i:8"/>`;
        s += `<circle class="dr" cx="200" cy="200" r="34" pathLength="1" style="--i:10"/>`;
        let sparks = '';
        for (let k = 0; k < 12; k++) {
            const [x, y] = polar(k * 30, 112);
            sparks += `<path class="pop" style="--i:${I(8 + k)}" d="${sparklePath(x, y)}"/>`;
        }
        s += `<g class="spin">${sparks}</g>`;
        for (let k = 0; k < 8; k++) {
            const [x, y] = polar(k * 45 + 22.5, 52);
            s += `<circle class="pop" cx="${f1(x)}" cy="${f1(y)}" r="4" style="--i:${I(12 + k)}"/>`;
        }
        for (let k = 0; k < 2; k++) s += `<circle class="dr echo" cx="200" cy="200" r="${130 + k * 24}" pathLength="1" style="--i:${k * 2}"/>`;
        ORNAMENTS.push(svgOrn(s));
    }
    let requestAnimFrameId = null;
    let stage3StartTime = null;
    let sequenceDuration = 0;
    let stage3Ended = false;

    fetch('song/aniversario.mp3', { method: 'HEAD' })
        .then(response => {
            stage3TrackReady = response.ok;
        })
        .catch(() => {
            stage3TrackReady = false;
        });

    // Elementos del DOM - Etapa 1
    const dialogText = document.getElementById('dialog-text');
    const pwdDisplay = document.getElementById('password-display');
    const keys = document.querySelectorAll('.glass-btn[data-num]');
    const btnClear = document.getElementById('btn-clear');
    const btnEnter = document.getElementById('btn-enter');
    const btnMusic = document.getElementById('btn-music');
    const btnVolumeToggle = document.getElementById('btn-volume-toggle');
    const sliderWrapper = document.getElementById('slider-wrapper');
    const iconMusicOn = document.getElementById('icon-music-on');
    const iconMusicOff = document.getElementById('icon-music-off');
    const volumeSlider = document.getElementById('volume-slider');
    const btnHelp = document.getElementById('btn-help');
    const hintPopup = document.getElementById('hint-popup');

    // Elementos de las pantallas
    const stage1 = document.getElementById('stage-1');
    const stage2 = document.getElementById('stage-2');
    const stage3 = document.getElementById('stage-3');
    const stage4 = document.getElementById('stage-4');
    const btnReveal = document.getElementById('btn-reveal');
    const lyricsContainer = document.getElementById('lyrics-container');
    const btnYes = document.getElementById('btn-yes');
    const footerQuestion = document.getElementById('footer-question');
    const yesResponse = document.getElementById('yes-response');
    const heartsBurst = document.getElementById('hearts-burst');
    const invitePhoto = document.getElementById('invite-photo');

    // Foto de la invitación: img/yoshi.jpg → img/cena.jpg → img/cena.png → img/yoshi.svg
    const tryNextPhoto = () => {
        if (!invitePhoto.dataset.fallback) {
            invitePhoto.dataset.fallback = 'cena';
            invitePhoto.src = 'img/cena.jpg';
        } else if (invitePhoto.dataset.fallback === 'cena') {
            invitePhoto.dataset.fallback = 'cena-png';
            invitePhoto.src = 'img/cena.png';
        } else if (invitePhoto.dataset.fallback === 'cena-png') {
            invitePhoto.dataset.fallback = 'yoshi';
            invitePhoto.src = 'img/yoshi.svg';
        }
    };
    invitePhoto.addEventListener('error', tryNextPhoto);
    if (invitePhoto.complete && invitePhoto.naturalWidth === 0) {
        tryNextPhoto();
    }

    // --- CARGAR EL JSON DE LAS LETRAS (sin caché) ---
    fetch('script.json', { cache: 'no-store' })
        .then(response => response.json())
        .then(data => {
            lyricsData = data;

            sequenceDuration = lyricsData.reduce((max, item) => {
                return Math.max(max, item.start + item.duration);
            }, 0);
            
            lyricsData.forEach((item, index) => {
                const el = document.createElement('div');
                el.className = `lyric-line ${item.type}`;
                el.id = `lyric-${index}`;
                
                // Si el tipo es 'flower', inyectamos la flor + ambiente de brisa
                if (item.type === 'flower') {
                    el.innerHTML = `
                        <!-- Brillo palpitante de tensión (Latido) -->
                        <div class="flower-glow"></div>
                        
                        <!-- Ambiente: Viento y pétalos -->
                        <div class="duel-atmosphere">
                            <div class="spark spark-1"></div>
                            <div class="spark spark-2"></div>
                            <div class="spark spark-3"></div>
                            <div class="spark spark-4"></div>
                            <div class="spark spark-5"></div>
                            <div class="spark spark-6"></div>
                            <div class="wind-line w1"></div>
                            <div class="wind-line w2"></div>
                            <div class="wind-line w3"></div>
                        </div>

                        <svg class="animated-flower" viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
                            <!-- Tallo -->
                            <path class="flower-path stem" d="M200,500 C220,400 170,300 200,220" />
                            
                            <!-- Hojas Base -->
                            <path class="flower-path leaf" d="M190,380 C100,400 40,320 60,250 C100,280 150,340 195,360" />
                            <path class="flower-path leaf" d="M210,320 C280,340 350,280 340,200 C300,240 250,290 205,300" />
                            
                            <!-- Pétalos Traseros -->
                            <path class="flower-path petal-back" d="M200,220 C140,160 100,80 150,40 C170,80 180,150 200,220" />
                            <path class="flower-path petal-back" d="M200,220 C260,160 300,80 250,40 C230,80 220,150 200,220" />
                            
                            <!-- Pétalos Laterales Exteriores -->
                            <path class="flower-path petal" d="M200,220 C120,200 40,140 30,70 C90,100 150,160 200,220" />
                            <path class="flower-path petal" d="M200,220 C280,200 360,140 370,70 C310,100 250,160 200,220" />
                            
                            <!-- Pétalos Laterales Interiores -->
                            <path class="flower-path petal" d="M200,220 C100,240 20,220 10,150 C70,180 140,210 200,220" />
                            <path class="flower-path petal" d="M200,220 C300,240 380,220 390,150 C330,180 260,210 200,220" />
                            
                            <!-- Pétalo Central Principal -->
                            <path class="flower-path petal-center" d="M200,220 C160,120 170,20 200,5 C230,20 240,120 200,220" />
                            
                            <!-- Detalles internos -->
                            <path class="flower-path detail" d="M200,220 Q185,150 175,90" />
                            <path class="flower-path detail" d="M200,220 Q215,150 225,90" />
                            <path class="flower-path detail" d="M200,220 Q195,130 190,70" />
                            <path class="flower-path detail" d="M200,220 Q205,130 210,70" />

                            <!-- Pétalos desprendiéndose por el viento -->
                            <path class="flying-petal fp1" d="M220,150 Q230,130 250,120" fill="none" stroke="#fff" stroke-width="2"/>
                            <path class="flying-petal fp2" d="M180,120 Q160,90 130,100" fill="none" stroke="#fff" stroke-width="1.5"/>
                            <path class="flying-petal fp3" d="M260,100 Q280,70 310,60" fill="none" stroke="#fff" stroke-width="2"/>
                            
                            <!-- Polen / Puntos de luz -->
                            <circle cx="175" cy="85" r="4" class="pollen" />
                            <circle cx="225" cy="85" r="4" class="pollen" />
                            <circle cx="190" cy="65" r="4" class="pollen" />
                            <circle cx="210" cy="65" r="4" class="pollen" />
                            <circle cx="200" cy="50" r="5" class="pollen" />
                        </svg>
                    `;
                } else if (item.type === 'number') {
                    const span = document.createElement('span');
                    span.innerHTML = item.text;
                    if (item.plain) {
                        // Sin ornamento ni pop: solo aparece el texto (ej. la flor es la última animación)
                        el.classList.add('plain');
                    } else {
                        // Ornamento SVG complejo que se dibuja antes/con cada número
                        const fx = document.createElement('div');
                        fx.className = 'num-fx';
                        const variant = (fxCounter++ % 8) + 1;
                        el.classList.add('fx-' + variant);
                        fx.innerHTML = ORNAMENTS[variant - 1];
                        el.appendChild(fx);
                    }
                    el.appendChild(span);
                } else {
                    el.innerHTML = item.text;
                }

                lyricsContainer.appendChild(el);
                item.element = el; 
            });
        })
        .catch(error => console.error("Asegúrate de estar corriendo esto en un servidor local (Live Server).", error));

    bgMusic.volume = volumeSlider.value / 100;
    stage3Audio.volume = volumeSlider.value / 100;
    shrekAudio.volume = volumeSlider.value / 100;

    // Buffer desde el inicio para que suene en cuanto haya gesto
    bgMusic.preload = 'auto';

    const initMusic = () => {
        if (!isMusicPlaying && bgMusic.volume > 0) {
            bgMusic.play().then(() => {
                isMusicPlaying = true;
                iconMusicOn.style.display = 'block';
                iconMusicOff.style.display = 'none';
                gestureEvents.forEach(ev => document.body.removeEventListener(ev, initMusic));
            }).catch(e => console.log("Esperando interacción."));
        } else if (isMusicPlaying) {
            gestureEvents.forEach(ev => document.body.removeEventListener(ev, initMusic));
        }
    };
    // El sonido empieza ya al cargar (si el navegador lo permite) y,
    // si no, con el primer gesto: pointer, touch, tecla o click
    const gestureEvents = ['pointerdown', 'touchstart', 'keydown', 'click'];
    gestureEvents.forEach(ev => document.body.addEventListener(ev, initMusic, { passive: true }));
    initMusic();

    btnVolumeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sliderWrapper.classList.toggle('open');
        btnVolumeToggle.classList.toggle('open');
    });

    volumeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        bgMusic.volume = val / 100;
        stage3Audio.volume = val / 100;
        shrekAudio.volume = val / 100;
        
        if (val == 0) {
            iconMusicOn.style.display = 'none';
            iconMusicOff.style.display = 'block';
        } else if (isMusicPlaying) {
            iconMusicOn.style.display = 'block';
            iconMusicOff.style.display = 'none';
        }
    });

    btnMusic.addEventListener('click', (e) => {
        e.stopPropagation();
        // Durante el recorrido (post-contraseña) el control es de la canción de Shrek
        const track = inJourney ? shrekAudio : bgMusic;
        if (track.paused) {
            track.play();
            if (inJourney) { shrekReady = true; isMusicPlaying = true; }
            else isMusicPlaying = true;
            if (volumeSlider.value == 0) {
                volumeSlider.value = 40;
                bgMusic.volume = 0.4;
                stage3Audio.volume = 0.4;
                shrekAudio.volume = 0.4;
            }
            iconMusicOn.style.display = 'block';
            iconMusicOff.style.display = 'none';
        } else {
            track.pause();
            isMusicPlaying = false;
            iconMusicOn.style.display = 'none';
            iconMusicOff.style.display = 'block';
        }
    });

    btnHelp.addEventListener('click', (e) => {
        e.stopPropagation();
        hintPopup.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!btnHelp.contains(e.target) && !hintPopup.contains(e.target)) {
            hintPopup.classList.remove('show');
        }
    });

    const updateDisplay = () => {
        pwdDisplay.innerHTML = "";
        for (let i = 0; i < config.maxDigits; i++) {
            const span = document.createElement('span');
            span.className = 'pwd-digit';
            if (i < currentInput.length) {
                span.textContent = currentInput[i];
                // Se alumbran de verde solo si es correcta en esa posición
                if (currentInput[i] === config.correctPassword[i]) {
                    span.classList.add('correct');
                } else {
                    span.classList.add('wrong');
                }
            } else {
                span.textContent = "_";
            }
            pwdDisplay.appendChild(span);
            if (i % 2 === 1 && i !== config.maxDigits - 1) {
                const space = document.createElement('span');
                space.innerHTML = '&nbsp;&nbsp;&nbsp;';
                pwdDisplay.appendChild(space);
            } else if (i !== config.maxDigits - 1) {
                const space = document.createElement('span');
                space.innerHTML = '&nbsp;';
                pwdDisplay.appendChild(space);
            }
        }
    };

    keys.forEach(key => {
        key.addEventListener('click', (e) => {
            keySound.currentTime = 0;
            keySound.play().catch(e => console.log(e));

            if (currentInput.length < config.maxDigits) {
                currentInput += e.target.getAttribute('data-num');
                dialogText.textContent = config.msgStart;
                dialogText.style.color = "rgba(255, 255, 255, 0.8)";
                updateDisplay();
            }
        });
    });

    btnClear.addEventListener('click', () => {
        deleteSound.currentTime = 0;
        deleteSound.play().catch(e => console.log(e));

        currentInput = "";
        dialogText.textContent = config.msgStart;
        dialogText.style.color = "rgba(255, 255, 255, 0.8)";
        updateDisplay();
    });

    btnEnter.addEventListener('click', () => {
        if (currentInput === config.correctPassword) {
            accessSound.currentTime = 0;
            accessSound.play().catch(e => console.log(e));

            dialogText.textContent = config.msgSuccess;
            dialogText.style.color = "#55efc4"; 
            dialogText.style.textShadow = "0 0 10px rgba(85, 239, 196, 0.5)";
            
            bgMusic.pause();
            isMusicPlaying = false;
            gestureEvents.forEach(ev => document.body.removeEventListener(ev, initMusic));
            
            setTimeout(() => {
                stage1.classList.remove('active');
                stage1.classList.add('hidden');
                
                stage2.classList.remove('hidden');
                stage2.classList.add('active');

                // La canción de Shrek suena desde aquí y se mantiene en todo el recorrido
                inJourney = true;
                if (shrekReady) {
                    shrekAudio.currentTime = 0;
                    shrekAudio.play().then(() => {
                        isMusicPlaying = true;
                        iconMusicOn.style.display = 'block';
                        iconMusicOff.style.display = 'none';
                    }).catch(e => console.log(e));
                }
            }, 1500);
        } else {
            errorSound.currentTime = 0;
            errorSound.play().catch(e => console.log(e));

            dialogText.textContent = config.msgError;
            dialogText.style.color = "#ff7675"; 
            dialogText.style.textShadow = "0 0 10px rgba(255, 118, 117, 0.5)";
            currentInput = ""; 
            updateDisplay();
        }
    });

    // --- LÓGICA DE SINCRONIZACIÓN DE LETRAS (POR TIEMPO) ---
    function syncLyrics() {
        if (stage3StartTime === null || stage3Ended) return;

        if (!lyricsData.length) {
            requestAnimFrameId = requestAnimationFrame(syncLyrics);
            return;
        }

        const now = (performance.now() - stage3StartTime) / 1000;
        
        lyricsData.forEach(item => {
            if (!item.element) return; 
            
            if (now >= item.start && now <= (item.start + item.duration)) {
                if (!item.element.classList.contains('visible')) {
                    item.element.classList.add('visible');
                }
            } else {
                if (item.element.classList.contains('visible')) {
                    item.element.classList.remove('visible');
                }
            }
        });

        if (now >= sequenceDuration + 1.5) {
            endStage3();
            return;
        }
        
        requestAnimFrameId = requestAnimationFrame(syncLyrics);
    }

    const startStage3Track = () => {
        stage3Audio.src = stage3TrackReady ? 'song/aniversario.mp3' : 'song/title.mp3';
        stage3Audio.currentTime = 0;
        stage3Audio.play().catch(e => console.log(e));
    };

    stage3Audio.addEventListener('error', () => {
        if (!stage3Audio.src.endsWith('song/title.mp3')) {
            stage3Audio.src = 'song/title.mp3';
            stage3Audio.play().catch(e => console.log(e));
        }
    });

    const endStage3 = () => {
        if (stage3Ended) return;
        stage3Ended = true;

        cancelAnimationFrame(requestAnimFrameId);
        // Shrek sigue sonando en la tarjeta final
        
        stage3.classList.remove('active');
        stage3.classList.add('hidden');
        
        stage4.classList.remove('hidden');
        stage4.classList.add('active');
    };

    btnReveal.addEventListener('click', () => {
        stage2.classList.remove('active');
        stage2.classList.add('hidden');

        stage3.classList.remove('hidden');
        stage3.classList.add('active');

        stage3Ended = false;
        stage3StartTime = performance.now();
        requestAnimFrameId = requestAnimationFrame(syncLyrics);
    });

    // --- RESPUESTA "¡SÍ!" Y CORAZONES ---
    const spawnHeart = (container, x, y, size, duration, delay, color) => {
        const heart = document.createElement('span');
        heart.className = 'burst-heart';
        heart.textContent = '♥';
        heart.style.left = `${x}%`;
        heart.style.top = `${y}%`;
        heart.style.fontSize = `${size}px`;
        heart.style.color = color;
        heart.style.animationDuration = `${duration}s`;
        heart.style.animationDelay = `${delay}s`;
        container.appendChild(heart);
        heart.addEventListener('animationend', () => heart.remove());
    };

    btnYes.addEventListener('click', (e) => {
        e.stopPropagation();

        accessSound.currentTime = 0;
        accessSound.play().catch(err => console.log(err));

        footerQuestion.classList.add('hidden');
        btnYes.classList.add('hidden');
        yesResponse.classList.remove('hidden');

        const colors = ['#ff6b81', '#ffd166', '#ef476f', '#d4af37', '#ff8fab'];
        for (let i = 0; i < 24; i++) {
            spawnHeart(
                heartsBurst,
                Math.random() * 100,
                60 + Math.random() * 35,
                14 + Math.random() * 26,
                3 + Math.random() * 3,
                Math.random() * 1.2,
                colors[Math.floor(Math.random() * colors.length)]
            );
        }

        const waMsg = encodeURIComponent("¡Sí! Acepto tu invitación a nuestra cena de aniversario ❤️");
        setTimeout(() => {
            window.open(`https://wa.me/593986092411?text=${waMsg}`, '_blank');
        }, 900);
    });

    updateDisplay();

});
