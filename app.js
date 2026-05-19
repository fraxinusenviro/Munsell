// Munsell library loaded dynamically from raw CJS files.
let munsell = null;
let libraryOk = false;

const MUNSELL_BASE  = 'https://cdn.jsdelivr.net/npm/munsell@1.1.6/dist/src/';
const MUNSELL_FILES = ['arithmetic', 'MRD', 'y-to-value-table', 'colorspace', 'convert', 'invert', 'index'];

const SOIL_CHIPS = {
  '10R 2.5/1':'Reddish Black','10R 2.5/2':'Very Dusky Red',
  '10R 3/1':'Dark Reddish Gray','10R 3/2':'Dusky Red','10R 3/3':'Dusky Red','10R 3/4':'Dusky Red','10R 3/6':'Dark Red',
  '10R 4/1':'Dark Reddish Gray','10R 4/2':'Weak Red','10R 4/3':'Weak Red','10R 4/4':'Weak Red','10R 4/6':'Red','10R 4/8':'Red',
  '10R 5/1':'Reddish Gray','10R 5/2':'Weak Red','10R 5/3':'Weak Red','10R 5/4':'Weak Red','10R 5/6':'Red','10R 5/8':'Red',
  '10R 6/1':'Reddish Gray','10R 6/2':'Pale Red','10R 6/3':'Pale Red','10R 6/4':'Pale Red','10R 6/6':'Light Red','10R 6/8':'Light Red',
  '10R 7/1':'Light Gray','10R 7/2':'Pale Red','10R 7/3':'Pale Red','10R 7/4':'Pale Red','10R 7/6':'Light Red','10R 7/8':'Light Red',
  '10R 8/1':'White','10R 8/2':'Pinkish White','10R 8/3':'Pink','10R 8/4':'Pink',
  '2.5YR 2.5/1':'Black','2.5YR 2.5/2':'Very Dusky Red','2.5YR 2.5/3':'Dark Reddish Brown','2.5YR 2.5/4':'Dark Reddish Brown',
  '2.5YR 3/1':'Dark Reddish Gray','2.5YR 3/2':'Dusky Red','2.5YR 3/3':'Dark Reddish Brown','2.5YR 3/4':'Dark Reddish Brown','2.5YR 3/6':'Dark Red',
  '2.5YR 4/1':'Dark Reddish Gray','2.5YR 4/2':'Weak Red','2.5YR 4/3':'Reddish Brown','2.5YR 4/4':'Reddish Brown','2.5YR 4/6':'Red','2.5YR 4/8':'Red',
  '2.5YR 5/1':'Reddish Gray','2.5YR 5/2':'Weak Red','2.5YR 5/3':'Reddish Brown','2.5YR 5/4':'Reddish Brown','2.5YR 5/6':'Red','2.5YR 5/8':'Red',
  '2.5YR 6/1':'Reddish Gray','2.5YR 6/2':'Pale Red','2.5YR 6/3':'Light Reddish Brown','2.5YR 6/4':'Light Reddish Brown','2.5YR 6/6':'Light Red','2.5YR 6/8':'Light Red',
  '2.5YR 7/1':'Light Reddish Gray','2.5YR 7/2':'Pale Red','2.5YR 7/3':'Light Reddish Brown','2.5YR 7/4':'Light Reddish Brown','2.5YR 7/6':'Light Red','2.5YR 7/8':'Light Red',
  '2.5YR 8/1':'White','2.5YR 8/2':'Pinkish White','2.5YR 8/3':'Pink','2.5YR 8/4':'Pink',
  '5YR 2.5/1':'Black','5YR 2.5/2':'Dark Reddish Brown',
  '5YR 3/1':'Very Dark Gray','5YR 3/2':'Dark Reddish Brown','5YR 3/3':'Dark Reddish Brown','5YR 3/4':'Dark Reddish Brown',
  '5YR 4/1':'Dark Gray','5YR 4/2':'Dark Reddish Gray','5YR 4/3':'Reddish Brown','5YR 4/4':'Reddish Brown','5YR 4/6':'Yellowish Red',
  '5YR 5/1':'Gray','5YR 5/2':'Reddish Gray','5YR 5/3':'Reddish Brown','5YR 5/4':'Reddish Brown','5YR 5/6':'Yellowish Red','5YR 5/8':'Yellowish Red',
  '5YR 6/1':'Gray','5YR 6/2':'Pinkish Gray','5YR 6/3':'Light Reddish Brown','5YR 6/4':'Light Reddish Brown','5YR 6/6':'Reddish Yellow','5YR 6/8':'Reddish Yellow',
  '5YR 7/1':'Light Gray','5YR 7/2':'Pinkish Gray','5YR 7/3':'Pink','5YR 7/4':'Pink','5YR 7/6':'Reddish Yellow','5YR 7/8':'Reddish Yellow',
  '5YR 8/1':'White','5YR 8/2':'Pinkish White','5YR 8/3':'Pink','5YR 8/4':'Pink',
  '7.5YR 2.5/1':'Black','7.5YR 2.5/2':'Very Dark Brown','7.5YR 2.5/3':'Very Dark Brown',
  '7.5YR 3/1':'Very Dark Gray','7.5YR 3/2':'Dark Brown','7.5YR 3/3':'Dark Brown','7.5YR 3/4':'Dark Brown',
  '7.5YR 4/1':'Dark Gray','7.5YR 4/2':'Brown','7.5YR 4/3':'Brown','7.5YR 4/4':'Brown','7.5YR 4/6':'Strong Brown',
  '7.5YR 5/1':'Gray','7.5YR 5/2':'Brown','7.5YR 5/3':'Brown','7.5YR 5/4':'Brown','7.5YR 5/6':'Strong Brown','7.5YR 5/8':'Strong Brown',
  '7.5YR 6/1':'Gray','7.5YR 6/2':'Pinkish Gray','7.5YR 6/3':'Light Brown','7.5YR 6/4':'Light Brown','7.5YR 6/6':'Reddish Yellow','7.5YR 6/8':'Reddish Yellow',
  '7.5YR 7/1':'Light Gray','7.5YR 7/2':'Pinkish Gray','7.5YR 7/3':'Pink','7.5YR 7/4':'Pink','7.5YR 7/6':'Reddish Yellow','7.5YR 7/8':'Reddish Yellow',
  '7.5YR 8/1':'White','7.5YR 8/2':'Pinkish White','7.5YR 8/3':'Pink','7.5YR 8/4':'Pink','7.5YR 8/6':'Reddish Yellow',
  '10YR 2/1':'Black','10YR 2/2':'Very Dark Brown',
  '10YR 3/1':'Very Dark Gray','10YR 3/2':'Very Dark Grayish Brown','10YR 3/3':'Dark Brown','10YR 3/4':'Dark Yellowish Brown','10YR 3/6':'Dark Yellowish Brown',
  '10YR 4/1':'Dark Gray','10YR 4/2':'Dark Grayish Brown','10YR 4/3':'Brown','10YR 4/4':'Dark Yellowish Brown','10YR 4/6':'Dark Yellowish Brown',
  '10YR 5/1':'Gray','10YR 5/2':'Grayish Brown','10YR 5/3':'Brown','10YR 5/4':'Yellowish Brown','10YR 5/6':'Yellowish Brown','10YR 5/8':'Yellowish Brown',
  '10YR 6/1':'Gray','10YR 6/2':'Light Brownish Gray','10YR 6/3':'Pale Brown','10YR 6/4':'Light Yellowish Brown','10YR 6/6':'Brownish Yellow','10YR 6/8':'Brownish Yellow',
  '10YR 7/1':'Light Gray','10YR 7/2':'Light Gray','10YR 7/3':'Very Pale Brown','10YR 7/4':'Very Pale Brown','10YR 7/6':'Yellow','10YR 7/8':'Yellow',
  '10YR 8/1':'White','10YR 8/2':'Very Pale Brown','10YR 8/3':'Very Pale Brown','10YR 8/4':'Very Pale Brown','10YR 8/6':'Yellow','10YR 8/8':'Yellow',
  '2.5Y 2.5/1':'Black',
  '2.5Y 3/1':'Very Dark Gray','2.5Y 3/2':'Very Dark Grayish Brown','2.5Y 3/3':'Dark Olive Brown',
  '2.5Y 4/1':'Dark Gray','2.5Y 4/2':'Dark Grayish Brown','2.5Y 4/3':'Olive Brown','2.5Y 4/4':'Olive Brown',
  '2.5Y 5/1':'Gray','2.5Y 5/2':'Grayish Brown','2.5Y 5/3':'Light Olive Brown','2.5Y 5/4':'Light Olive Brown','2.5Y 5/6':'Light Olive Brown',
  '2.5Y 6/1':'Gray','2.5Y 6/2':'Light Brownish Gray','2.5Y 6/3':'Light Yellowish Brown','2.5Y 6/4':'Light Yellowish Brown','2.5Y 6/6':'Olive Yellow','2.5Y 6/8':'Olive Yellow',
  '2.5Y 7/1':'Light Gray','2.5Y 7/2':'Light Gray','2.5Y 7/3':'Pale Yellow','2.5Y 7/4':'Pale Yellow','2.5Y 7/6':'Yellow','2.5Y 7/8':'Yellow',
  '2.5Y 8/1':'White','2.5Y 8/2':'Pale Yellow','2.5Y 8/3':'Pale Yellow','2.5Y 8/4':'Pale Yellow','2.5Y 8/6':'Yellow','2.5Y 8/8':'Yellow',
  '5Y 2.5/1':'Black','5Y 2.5/2':'Black',
  '5Y 3/1':'Very Dark Gray','5Y 3/2':'Dark Olive Gray',
  '5Y 4/1':'Dark Gray','5Y 4/2':'Olive Gray','5Y 4/3':'Olive','5Y 4/4':'Olive',
  '5Y 5/1':'Gray','5Y 5/2':'Olive Gray','5Y 5/3':'Olive','5Y 5/4':'Olive','5Y 5/6':'Olive',
  '5Y 6/1':'Gray','5Y 6/2':'Light Olive Gray','5Y 6/3':'Pale Olive','5Y 6/4':'Pale Olive','5Y 6/6':'Olive Yellow','5Y 6/8':'Olive Yellow',
  '5Y 7/1':'Light Gray','5Y 7/2':'Light Gray','5Y 7/3':'Pale Yellow','5Y 7/4':'Pale Yellow','5Y 7/6':'Yellow','5Y 7/8':'Yellow',
  '5Y 8/1':'White','5Y 8/2':'Pale Yellow','5Y 8/3':'Pale Yellow','5Y 8/4':'Pale Yellow','5Y 8/6':'Yellow','5Y 8/8':'Yellow',
  '10Y 2.5/1':'Greenish Black','10Y 3/1':'Very Dark Greenish Gray','10Y 4/1':'Dark Greenish Gray',
  '10Y 5/1':'Greenish Gray','10Y 6/1':'Greenish Gray','10Y 7/1':'Light Greenish Gray','10Y 8/1':'Light Greenish Gray',
  '5GY 2.5/1':'Greenish Black','5GY 3/1':'Very Dark Greenish Gray','5GY 4/1':'Dark Greenish Gray',
  '5GY 5/1':'Greenish Gray','5GY 6/1':'Greenish Gray','5GY 7/1':'Light Greenish Gray','5GY 8/1':'Light Greenish Gray',
  '10GY 2.5/1':'Greenish Black','10GY 3/1':'Very Dark Greenish Gray','10GY 4/1':'Dark Greenish Gray',
  '10GY 5/1':'Greenish Gray','10GY 6/1':'Greenish Gray','10GY 7/1':'Light Greenish Gray','10GY 8/1':'Light Greenish Gray',
  '5G 2.5/1':'Greenish Black','5G 2.5/2':'Very Dark Grayish Green',
  '5G 3/1':'Very Dark Greenish Gray','5G 3/2':'Very Dark Grayish Green',
  '5G 4/1':'Dark Greenish Gray','5G 4/2':'Grayish Green',
  '5G 5/1':'Greenish Gray','5G 5/2':'Grayish Green',
  '5G 6/1':'Greenish Gray','5G 6/2':'Pale Green',
  '5G 7/1':'Light Greenish Gray','5G 7/2':'Pale Green',
  '5G 8/1':'Light Greenish Gray','5G 8/2':'Pale Green',
  '10G 2.5/1':'Greenish Black','10G 3/1':'Very Dark Greenish Gray','10G 4/1':'Dark Greenish Gray',
  '10G 5/1':'Greenish Gray','10G 6/1':'Greenish Gray','10G 7/1':'Light Greenish Gray','10G 8/1':'Light Greenish Gray',
  '5BG 2.5/1':'Greenish Black','5BG 3/1':'Very Dark Greenish Gray','5BG 4/1':'Dark Greenish Gray',
  '5BG 5/1':'Greenish Gray','5BG 6/1':'Greenish Gray','5BG 7/1':'Light Greenish Gray','5BG 8/1':'Light Greenish Gray',
  '10BG 2.5/1':'Greenish Black','10BG 3/1':'Very Dark Greenish Gray','10BG 4/1':'Dark Greenish Gray',
  '10BG 5/1':'Greenish Gray','10BG 6/1':'Greenish Gray','10BG 7/1':'Light Greenish Gray','10BG 8/1':'Light Greenish Gray',
  '5B 2.5/1':'Bluish Black','5B 3/1':'Very Dark Bluish Gray','5B 4/1':'Dark Bluish Gray',
  '5B 5/1':'Bluish Gray','5B 6/1':'Bluish Gray','5B 7/1':'Light Bluish Gray','5B 8/1':'Light Bluish Gray',
  '10B 2.5/1':'Bluish Black','10B 3/1':'Very Dark Bluish Gray','10B 4/1':'Dark Bluish Gray',
  '10B 5/1':'Bluish Gray','10B 6/1':'Bluish Gray','10B 7/1':'Light Bluish Gray','10B 8/1':'Light Bluish Gray',
  '5PB 2.5/1':'Bluish Black','5PB 3/1':'Very Dark Bluish Gray','5PB 4/1':'Dark Bluish Gray',
  '5PB 5/1':'Bluish Gray','5PB 6/1':'Bluish Gray','5PB 7/1':'Light Bluish Gray','5PB 8/1':'Light Bluish Gray',
  'N 2.5/':'Black','N 3/':'Very Dark Gray','N 4/':'Dark Gray',
  'N 5/':'Gray','N 6/':'Gray','N 7/':'Light Gray','N 8/':'White',
};

async function initMunsell() {
    const modules = {};
    const CACHE_KEY = '__munsellModuleCache';
    window[CACHE_KEY] = modules;
    try {
        for (const name of MUNSELL_FILES) {
            const text = await fetch(MUNSELL_BASE + name + '.js').then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status} fetching munsell/${name}.js`);
                return r.text();
            });
            const blob = new Blob([
                `const exports={};\n` +
                `const require=d=>window.${CACHE_KEY}[d.replace('./','')];\n` +
                text + '\nexport default exports;'
            ], { type: 'text/javascript' });
            const url = URL.createObjectURL(blob);
            try { const mod = await import(url); modules[name] = mod.default; }
            finally { URL.revokeObjectURL(url); }
        }
        delete window[CACHE_KEY];
        munsell = modules['index'];
        if (typeof munsell.rgb255ToMunsell !== 'function')
            throw new Error('rgb255ToMunsell missing');
        libraryOk = true;
        buildChipLabCache();
        console.info(`[munsell] OK — ${chipLabCache.length} chips cached`);
    } catch (e) {
        delete window[CACHE_KEY];
        console.error('[munsell] Failed:', e);
        document.getElementById('lib-warning').style.display = 'flex';
    }
}
initMunsell();

// ── DOM refs ──
const canvas          = document.getElementById('image-canvas');
const ctx             = canvas.getContext('2d', { willReadFrequently: true });
const sampleCanvas    = document.createElement('canvas');
const sampleCtx       = sampleCanvas.getContext('2d', { willReadFrequently: true });
const magnifierCanvas = document.getElementById('magnifier-canvas');
const magnifierCtx    = magnifierCanvas.getContext('2d');
const canvasWrap      = document.getElementById('canvas-wrap');
const canvasPlaceholder = document.getElementById('canvas-placeholder');

const fileInput        = document.getElementById('fileInput');
const fileInputGallery = document.getElementById('fileInputGallery');
const openFileBtn      = document.getElementById('open-file-btn');
const openGalleryBtn   = document.getElementById('open-gallery-btn');
const addImageBtn      = document.getElementById('add-image-btn');
const addImageMenu     = document.getElementById('add-image-menu');
const addImageWrap     = document.getElementById('add-image-wrap');
const hamburgerBtn     = document.getElementById('hamburger-btn');
const hamburgerPanel   = document.getElementById('hamburger-panel');
const panelOverlay     = document.getElementById('panel-overlay');
const closePanelBtn    = document.getElementById('close-panel-btn');
const eyedropperBtn    = document.getElementById('eyedropper-btn');
const zoomResetBtn     = document.getElementById('zoom-reset-btn');
const magPositionBtn   = document.getElementById('mag-position-btn');
const magPosIconDown   = document.getElementById('mag-pos-icon-down');
const magPosIconUp     = document.getElementById('mag-pos-icon-up');
const appBody          = document.getElementById('app-body');
const magnifierSection = document.getElementById('magnifier-section');

const magColorSwatch  = document.getElementById('mag-color-swatch');
const magMunsell      = document.getElementById('mag-munsell');
const magRgb          = document.getElementById('mag-rgb');
const loupeZoomSlider = document.getElementById('loupe-zoom-slider');
const loupeZoomLabel  = document.getElementById('loupe-zoom-label');
const magLinkedToggle = document.getElementById('mag-linked-toggle');

const featureType     = document.getElementById('feature-type');
const percentValue    = document.getElementById('percent-val');
const tableBody       = document.getElementById('table-body');
const tableEmpty      = document.getElementById('table-empty');

const sampleIdInput    = document.getElementById('sample-id');
const siteNameInput    = document.getElementById('site-name');
const projectNameInput = document.getElementById('project-name');
const gpsDisplay       = document.getElementById('gps-display');
const dateDisplay      = document.getElementById('date-display');

const pixelSlider    = document.getElementById('pixel-slider');
const pixelLabel     = document.getElementById('pixel-label');
const smoothToggle   = document.getElementById('smooth-toggle');

const sampleModal    = document.getElementById('sample-modal');
const modalSaveBtn   = document.getElementById('modal-save-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalCloseBtn  = document.getElementById('modal-close-btn');
const modalSwatch    = document.getElementById('modal-color-swatch');
const modalMunsell   = document.getElementById('modal-munsell');
const modalRgb       = document.getElementById('modal-rgb');
const percentInfo    = document.getElementById('percent-info');

// ── State ──
let samples             = [];
let currentRGB          = null;
let currentMunsellResult = null;
let metadata            = { lat: '', lng: '', date: '' };
let baseImage           = null;
let crosshair           = { x: null, y: null };   // in sampleCanvas pixel coords
let blurRadius          = 4;
let smoothingEnabled    = false;
let magnifierZoom       = 4;
let magnifierLinked     = true;
let magnifierBelow      = false;
let chipLabCache        = [];
let smoothDebounceTimer = null;

// Zoom / pan state (for main image)
let viewZoom   = 1;
let viewPanX   = 0;     // top-left of viewport in sampleCanvas px
let viewPanY   = 0;
let isPanning  = false;
let panLastX   = 0;
let panLastY   = 0;
let mouseDownPos = null;
let mouseDragged = false;
let lastPinchDist    = null;
let lastPinchCenterX = 0;
let lastPinchCenterY = 0;

const STORAGE_KEY = 'munsell_session';

// ── Chip Lab cache ──
function buildChipLabCache() {
    chipLabCache = [];
    for (const [code, name] of Object.entries(SOIL_CHIPS)) {
        try {
            const lab = munsell.munsellToLab(code);
            chipLabCache.push({ code, name, lab });
        } catch { /* skip bad chips */ }
    }
}

function rgbToLab(r, g, b) {
    const lin = c => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; };
    const lr = lin(r), lg = lin(g), lb = lin(b);
    const X = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375;
    const Y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750;
    const Z = lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041;
    const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    const fy = f(Y);
    return [116 * fy - 16, 500 * (f(X / 0.95047) - fy), 200 * (fy - f(Z / 1.08883))];
}

function getNearestChip(r, g, b) {
    if (!libraryOk || chipLabCache.length === 0) return { code: null, name: null, libError: true };
    const lab = rgbToLab(r, g, b);
    let nearest = null, minDist = Infinity;
    for (const chip of chipLabCache) {
        const dL = lab[0] - chip.lab[0], da = lab[1] - chip.lab[1], db = lab[2] - chip.lab[2];
        const dist = dL * dL + da * da + db * db;
        if (dist < minDist) { minDist = dist; nearest = chip; }
    }
    return nearest ? { code: nearest.code, name: nearest.name, libError: false }
                   : { code: null, name: null, libError: true };
}

// ── Gaussian blur ──
function gaussianKernel(sigma) {
    const radius = Math.min(Math.ceil(2.5 * sigma), 30);
    const size = radius * 2 + 1;
    const kernel = new Float32Array(size);
    let sum = 0;
    for (let i = 0; i < size; i++) {
        const x = i - radius;
        kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
        sum += kernel[i];
    }
    for (let i = 0; i < size; i++) kernel[i] /= sum;
    return { kernel, radius };
}

function applyGaussianBlur() {
    const w = canvas.width, h = canvas.height;
    const src = document.createElement('canvas');
    src.width = w; src.height = h;
    src.getContext('2d').drawImage(baseImage, 0, 0, w, h);
    const srcPx = src.getContext('2d').getImageData(0, 0, w, h).data;
    const sigma = Math.max(0.5, blurRadius * 0.6);
    const { kernel, radius } = gaussianKernel(sigma);
    const tmp = new Float32Array(w * h * 4);
    const out = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let r = 0, g = 0, b = 0;
            for (let k = 0; k < kernel.length; k++) {
                const sx = Math.max(0, Math.min(w - 1, x + k - radius));
                const si = (y * w + sx) * 4;
                r += srcPx[si] * kernel[k]; g += srcPx[si+1] * kernel[k]; b += srcPx[si+2] * kernel[k];
            }
            const di = (y * w + x) * 4;
            tmp[di] = r; tmp[di+1] = g; tmp[di+2] = b; tmp[di+3] = 255;
        }
    }
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let r = 0, g = 0, b = 0;
            for (let k = 0; k < kernel.length; k++) {
                const sy = Math.max(0, Math.min(h - 1, y + k - radius));
                const si = (sy * w + x) * 4;
                r += tmp[si] * kernel[k]; g += tmp[si+1] * kernel[k]; b += tmp[si+2] * kernel[k];
            }
            const di = (y * w + x) * 4;
            out[di] = r; out[di+1] = g; out[di+2] = b; out[di+3] = 255;
        }
    }
    sampleCtx.putImageData(new ImageData(out, w, h), 0, 0);
}

function rebuildSampleCanvas() {
    if (!baseImage) return;
    if (!smoothingEnabled) {
        sampleCtx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    } else {
        applyGaussianBlur();
    }
}

// ── Viewport / zoom helpers ──
function getViewport() {
    const w = sampleCanvas.width, h = sampleCanvas.height;
    const srcW = w / viewZoom;
    const srcH = h / viewZoom;
    const srcX = Math.max(0, Math.min(w - srcW, viewPanX));
    const srcY = Math.max(0, Math.min(h - srcH, viewPanY));
    return { srcX, srcY, srcW, srcH };
}

function clampPan() {
    const w = sampleCanvas.width, h = sampleCanvas.height;
    const srcW = w / viewZoom, srcH = h / viewZoom;
    viewPanX = Math.max(0, Math.min(w - srcW, viewPanX));
    viewPanY = Math.max(0, Math.min(h - srcH, viewPanY));
}

// Convert a point in canvas display coords → sampleCanvas pixel coords
function displayToImage(dx, dy) {
    const rect = canvas.getBoundingClientRect();
    // Display coords → canvas intrinsic coords (accounts for CSS scaling)
    const px = dx / rect.width  * canvas.width;
    const py = dy / rect.height * canvas.height;
    // Canvas intrinsic → sampleCanvas (same resolution, then apply viewport)
    const { srcX, srcY, srcW, srcH } = getViewport();
    return {
        x: Math.floor(srcX + px / canvas.width  * srcW),
        y: Math.floor(srcY + py / canvas.height * srcH),
    };
}

// Convert sampleCanvas pixel coords → canvas display coords (relative to canvas element)
function imageToDisplayPx(ix, iy) {
    const { srcX, srcY, srcW, srcH } = getViewport();
    return {
        x: (ix - srcX) / srcW * canvas.width,
        y: (iy - srcY) / srcH * canvas.height,
    };
}

function applyZoom(factor, clientX, clientY) {
    if (!baseImage) return;
    const newZoom = Math.max(1, Math.min(10, viewZoom * factor));
    if (newZoom === viewZoom) return;

    const rect    = canvas.getBoundingClientRect();
    const normX   = (clientX - rect.left) / rect.width;
    const normY   = (clientY - rect.top)  / rect.height;
    const { srcX, srcY, srcW, srcH } = getViewport();
    const fixedX  = srcX + normX * srcW;
    const fixedY  = srcY + normY * srcH;

    viewZoom = newZoom;
    const newSrcW = sampleCanvas.width  / viewZoom;
    const newSrcH = sampleCanvas.height / viewZoom;
    viewPanX = fixedX - normX * newSrcW;
    viewPanY = fixedY - normY * newSrcH;
    clampPan();

    zoomResetBtn.hidden = viewZoom <= 1.01;
    redrawCanvas();
    drawMagnifier();
}

function resetZoom() {
    viewZoom = 1; viewPanX = 0; viewPanY = 0;
    zoomResetBtn.hidden = true;
    redrawCanvas();
    drawMagnifier();
}

// ── Persistence ──
function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            samples, metadata,
            formFields: {
                sampleId:    sampleIdInput.value,
                siteName:    siteNameInput.value,
                projectName: projectNameInput.value,
            },
            magnifierBelow,
        }));
    } catch (e) { console.warn('[storage] Save failed:', e); }
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const state = JSON.parse(raw);
        if (Array.isArray(state.samples) && state.samples.length > 0) {
            samples = state.samples;
            updateTable();
        }
        if (state.metadata) {
            metadata = state.metadata;
            if (metadata.lat && metadata.lng) gpsDisplay.innerText = `${metadata.lat}, ${metadata.lng}`;
            if (metadata.date) dateDisplay.innerText = metadata.date;
        }
        if (state.formFields) {
            sampleIdInput.value    = state.formFields.sampleId    || '';
            siteNameInput.value    = state.formFields.siteName    || '';
            projectNameInput.value = state.formFields.projectName || '';
        }
        if (state.magnifierBelow) setMagnifierBelow(true);
    } catch (e) { console.warn('[storage] Load failed:', e); }
}

function clearSession() {
    if (!confirm('Clear all saved samples and metadata? This cannot be undone.')) return;
    samples = [];
    metadata = { lat: '', lng: '', date: '' };
    sampleIdInput.value = siteNameInput.value = projectNameInput.value = '';
    gpsDisplay.innerText = 'No GPS in EXIF';
    dateDisplay.innerText = 'N/A';
    currentRGB = currentMunsellResult = baseImage = null;
    crosshair = { x: null, y: null };
    canvas.width = canvas.height = 0;
    canvasPlaceholder.style.display = '';
    eyedropperBtn.hidden = true;
    resetZoom();
    magColorSwatch.style.background = '#d4c5bb';
    magMunsell.textContent = 'No colour selected';
    magRgb.textContent = '—';
    updateTable();
    localStorage.removeItem(STORAGE_KEY);
    closeHamburger();
    drawMagnifierPlaceholder();
}

loadFromStorage();

// ── UI: hamburger panel ──
function openHamburger() {
    hamburgerPanel.hidden = false;
    panelOverlay.hidden   = false;
    requestAnimationFrame(() => hamburgerPanel.removeAttribute('hidden'));
}

function closeHamburger() {
    hamburgerPanel.hidden = true;
    panelOverlay.hidden   = true;
}

hamburgerBtn.addEventListener('click', openHamburger);
closePanelBtn.addEventListener('click', closeHamburger);
panelOverlay.addEventListener('click', closeHamburger);

// ── UI: (+) add image menu ──
function openAddMenu() {
    addImageMenu.hidden = false;
    setTimeout(() => document.addEventListener('click', closeAddMenuOutside), 0);
}

function closeAddMenu() {
    addImageMenu.hidden = true;
    document.removeEventListener('click', closeAddMenuOutside);
}

function closeAddMenuOutside(e) {
    if (!addImageWrap.contains(e.target)) closeAddMenu();
}

addImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    addImageMenu.hidden ? openAddMenu() : closeAddMenu();
});

openFileBtn.addEventListener('click', ()    => { closeAddMenu(); fileInput.click(); });
openGalleryBtn.addEventListener('click', () => { closeAddMenu(); fileInputGallery.click(); });
fileInput.addEventListener('change', onFileChange);
fileInputGallery.addEventListener('change', onFileChange);

// ── UI: magnifier position toggle ──
function setMagnifierBelow(below) {
    magnifierBelow = below;
    if (below) {
        appBody.classList.add('mag-below');
        magPosIconDown.style.display = 'none';
        magPosIconUp.style.display   = '';
        magPositionBtn.title         = 'Move magnifier above image';
    } else {
        appBody.classList.remove('mag-below');
        magPosIconDown.style.display = '';
        magPosIconUp.style.display   = 'none';
        magPositionBtn.title         = 'Move magnifier below image';
    }
}

magPositionBtn.addEventListener('click', () => {
    setMagnifierBelow(!magnifierBelow);
    saveToStorage();
});

// ── UI: form fields ──
[sampleIdInput, siteNameInput, projectNameInput].forEach(el => {
    el.addEventListener('input', saveToStorage);
});

// ── UI: blur controls ──
smoothToggle.addEventListener('change', () => {
    smoothingEnabled = smoothToggle.checked;
    pixelSlider.disabled = !smoothingEnabled;
    pixelLabel.textContent = smoothingEnabled ? `${blurRadius}px` : 'Off';
    rebuildSampleCanvas();
    redrawCanvas();
    drawMagnifier();
});

pixelSlider.addEventListener('input', () => {
    blurRadius = parseInt(pixelSlider.value, 10);
    pixelLabel.textContent = `${blurRadius}px`;
    clearTimeout(smoothDebounceTimer);
    smoothDebounceTimer = setTimeout(() => {
        rebuildSampleCanvas();
        redrawCanvas();
        drawMagnifier();
    }, 80);
});

// ── UI: magnifier zoom & linked ──
loupeZoomSlider.addEventListener('input', () => {
    magnifierZoom = parseInt(loupeZoomSlider.value, 10);
    loupeZoomLabel.textContent = `${magnifierZoom}×`;
    drawMagnifier();
});

magLinkedToggle.addEventListener('change', () => {
    magnifierLinked = magLinkedToggle.checked;
    drawMagnifier();
});

// ── File handling ──
async function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }

    try {
        const tags = await ExifReader.load(file);
        metadata.date = tags.DateTime?.description || new Date().toLocaleString();
        if (tags.GPSLatitude && tags.GPSLongitude) {
            metadata.lat = tags.GPSLatitude.description;
            metadata.lng = tags.GPSLongitude.description;
            gpsDisplay.innerText = `${metadata.lat}, ${metadata.lng}`;
        } else {
            metadata.lat = metadata.lng = '';
            gpsDisplay.innerText = 'No GPS in EXIF';
        }
        dateDisplay.innerText = metadata.date;
    } catch { /* EXIF optional */ }

    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            // Cap at 1200px width to keep performance reasonable
            const scale = Math.min(1200 / img.width, 1);
            canvas.width  = Math.round(img.width  * scale);
            canvas.height = Math.round(img.height * scale);
            sampleCanvas.width  = canvas.width;
            sampleCanvas.height = canvas.height;

            baseImage = img;
            resetZoom();
            rebuildSampleCanvas();

            // Centre crosshair
            crosshair = { x: Math.floor(canvas.width / 2), y: Math.floor(canvas.height / 2) };
            samplePixelAt(crosshair.x, crosshair.y);

            canvasPlaceholder.style.display = 'none';
            eyedropperBtn.hidden = false;

            // Resize magnifier canvas to match display width after layout
            requestAnimationFrame(() => {
                resizeMagnifierCanvas();
                redrawCanvas();
                drawMagnifier();
            });

            saveToStorage();
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';  // allow re-selecting same file
}

// ── Canvas drawing ──
function redrawCanvas() {
    if (!baseImage) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const { srcX, srcY, srcW, srcH } = getViewport();
    ctx.drawImage(sampleCanvas, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
    drawSampleMarkers();
    if (crosshair.x !== null) {
        const dp = imageToDisplayPx(crosshair.x, crosshair.y);
        if (dp.x >= 0 && dp.x <= canvas.width && dp.y >= 0 && dp.y <= canvas.height) {
            drawCrosshair(dp.x, dp.y);
        }
    }
}

function drawCrosshair(x, y) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 14, y); ctx.lineTo(x - 4, y);
    ctx.moveTo(x + 4,  y); ctx.lineTo(x + 14, y);
    ctx.moveTo(x, y - 14); ctx.lineTo(x, y - 4);
    ctx.moveTo(x, y + 4);  ctx.lineTo(x, y + 14);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawSampleMarkers() {
    const R = 18;
    samples.forEach((s) => {
        const dp = imageToDisplayPx(s.x, s.y);
        if (dp.x < -R || dp.x > canvas.width + R || dp.y < -R || dp.y > canvas.height + R) return;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 12;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(dp.x, dp.y, R, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = s.rgb; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(dp.x, dp.y, R, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(dp.x, dp.y, R + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.42)';
        ctx.beginPath(); ctx.arc(dp.x, dp.y, R - 1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'white'; ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 4;
        ctx.fillText(String(s.number), dp.x, dp.y);
        ctx.font = '9px system-ui, sans-serif'; ctx.textBaseline = 'top'; ctx.shadowBlur = 3;
        ctx.fillText(s.munsell || '?', dp.x, dp.y + R + 4);
        ctx.restore();
    });
}

// ── Magnifier pane ──
function resizeMagnifierCanvas() {
    const wrap = magnifierCanvas.parentElement;
    const w = Math.max(100, wrap.clientWidth || canvasWrap.clientWidth || 300);
    magnifierCanvas.width  = w;
    magnifierCanvas.height = 130;
    drawMagnifier();
}

function drawMagnifierPlaceholder() {
    const mw = magnifierCanvas.width  || 300;
    const mh = magnifierCanvas.height || 130;
    const mc = magnifierCtx;
    mc.clearRect(0, 0, mw, mh);
    mc.fillStyle = '#1a0e0a';
    mc.fillRect(0, 0, mw, mh);
    mc.fillStyle = 'rgba(255,255,255,0.2)';
    mc.font = '13px system-ui, sans-serif';
    mc.textAlign = 'center';
    mc.textBaseline = 'middle';
    mc.fillText('Touch the image to sample a colour', mw / 2, mh / 2);
}

function drawMagnifier() {
    const mw = magnifierCanvas.width;
    const mh = magnifierCanvas.height;
    if (!mw || !mh) return;
    const mc = magnifierCtx;

    if (!baseImage || crosshair.x === null) {
        drawMagnifierPlaceholder();
        return;
    }

    const effectiveZoom = magnifierLinked ? magnifierZoom * viewZoom : magnifierZoom;
    const srcW = Math.max(1, mw / effectiveZoom);
    const srcH = Math.max(1, mh / effectiveZoom);
    const srcX = Math.max(0, Math.min(sampleCanvas.width  - srcW, crosshair.x - srcW / 2));
    const srcY = Math.max(0, Math.min(sampleCanvas.height - srcH, crosshair.y - srcH / 2));

    mc.imageSmoothingEnabled = false;
    mc.drawImage(sampleCanvas, srcX, srcY, srcW, srcH, 0, 0, mw, mh);

    // Crosshairs
    const cx = mw / 2, cy = mh / 2;
    mc.strokeStyle = 'rgba(255,255,255,0.85)'; mc.lineWidth = 1.5;
    mc.beginPath();
    mc.moveTo(cx - 22, cy); mc.lineTo(cx - 6, cy);
    mc.moveTo(cx + 6,  cy); mc.lineTo(cx + 22, cy);
    mc.moveTo(cx, cy - 22); mc.lineTo(cx, cy - 6);
    mc.moveTo(cx, cy + 6);  mc.lineTo(cx, cy + 22);
    mc.stroke();
    mc.strokeStyle = 'rgba(0,0,0,0.5)'; mc.lineWidth = 1;
    mc.beginPath(); mc.arc(cx, cy, 7, 0, Math.PI * 2); mc.stroke();
    mc.beginPath(); mc.arc(cx, cy, 2, 0, Math.PI * 2);
    mc.fillStyle = 'rgba(255,255,255,0.9)'; mc.fill();

    // Munsell badge at bottom
    if (currentRGB && currentMunsellResult && !currentMunsellResult.libError) {
        const [r, g, b] = currentRGB;
        const badgeH = 26, by = mh - badgeH;
        mc.fillStyle = 'rgba(0,0,0,0.7)';
        mc.fillRect(0, by, mw, badgeH);
        mc.fillStyle = `rgb(${r},${g},${b})`;
        mc.fillRect(8, by + 5, 16, 16);
        mc.strokeStyle = 'rgba(255,255,255,0.3)'; mc.lineWidth = 1;
        mc.strokeRect(8, by + 5, 16, 16);
        mc.fillStyle = 'white'; mc.font = 'bold 10.5px system-ui, sans-serif';
        mc.textAlign = 'left'; mc.textBaseline = 'middle';
        mc.fillText(currentMunsellResult.code, 30, by + 13);
        const cw = mc.measureText(currentMunsellResult.code).width;
        mc.fillStyle = 'rgba(255,255,255,0.65)'; mc.font = '9px system-ui, sans-serif';
        const nx = 30 + cw + 5;
        if (mw - nx > 30) mc.fillText(' — ' + currentMunsellResult.name, nx, by + 13);
    }
}

// ── Sampling core ──
function getAveragePixel(cx, cy, radius) {
    const x0 = Math.max(0, cx - radius), y0 = Math.max(0, cy - radius);
    const x1 = Math.min(sampleCanvas.width  - 1, cx + radius);
    const y1 = Math.min(sampleCanvas.height - 1, cy + radius);
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const px = sampleCtx.getImageData(x0, y0, w, h).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < px.length; i += 4) { r += px[i]; g += px[i+1]; b += px[i+2]; }
    const total = w * h;
    return [Math.round(r / total), Math.round(g / total), Math.round(b / total)];
}

function samplePixelAt(imgX, imgY) {
    const [r, g, b] = getAveragePixel(imgX, imgY, 0);
    currentRGB = [r, g, b];
    currentMunsellResult = getNearestChip(r, g, b);

    magColorSwatch.style.background = `rgb(${r},${g},${b})`;
    magRgb.textContent = `rgb(${r}, ${g}, ${b})`;
    if (currentMunsellResult.libError) {
        magMunsell.textContent = '⚠ Library not loaded';
    } else {
        magMunsell.textContent = `${currentMunsellResult.code} — ${currentMunsellResult.name}`;
    }
}

// ── Canvas pointer handling ──
function getCanvasOffset(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.pageX;
    const clientY = e.clientY ?? e.pageY;
    return { dx: clientX - rect.left, dy: clientY - rect.top };
}

function handleSamplingAt(dx, dy) {
    // dx, dy in canvas display element coords (not CSS-scaled)
    const rect = canvas.getBoundingClientRect();
    if (dx < 0 || dy < 0 || dx > rect.width || dy > rect.height) return;
    const ip = displayToImage(dx, dy);
    if (ip.x < 0 || ip.x >= sampleCanvas.width || ip.y < 0 || ip.y >= sampleCanvas.height) return;
    crosshair = { x: ip.x, y: ip.y };
    samplePixelAt(ip.x, ip.y);
    redrawCanvas();
    drawMagnifier();
}

// Mouse events
canvas.addEventListener('mousedown', (e) => {
    if (!baseImage) return;
    mouseDownPos = { x: e.clientX, y: e.clientY };
    mouseDragged = false;
    panLastX = e.clientX;
    panLastY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (!baseImage) return;
    if (mouseDownPos) {
        const d = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
        if (d > 4) mouseDragged = true;
    }
    if (mouseDragged && viewZoom > 1.01 && mouseDownPos) {
        // Pan
        const dx = e.clientX - panLastX;
        const dy = e.clientY - panLastY;
        const rect = canvas.getBoundingClientRect();
        const { srcW, srcH } = getViewport();
        viewPanX -= dx / rect.width  * srcW;
        viewPanY -= dy / rect.height * srcH;
        clampPan();
        panLastX = e.clientX;
        panLastY = e.clientY;
        redrawCanvas();
        drawMagnifier();
    } else if (!mouseDownPos) {
        // Hover: update crosshair continuously
        const { dx, dy } = getCanvasOffset(e);
        handleSamplingAt(dx, dy);
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (!baseImage) return;
    if (!mouseDragged) {
        const { dx, dy } = getCanvasOffset(e);
        handleSamplingAt(dx, dy);
    }
    mouseDownPos = null;
    mouseDragged = false;
});

canvas.addEventListener('mouseleave', () => {
    mouseDownPos = null;
    mouseDragged = false;
});

// Scroll-to-zoom
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    applyZoom(factor, e.clientX, e.clientY);
}, { passive: false });

// Touch events
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        lastPinchDist = null;
        const t = e.touches[0];
        const { dx, dy } = getCanvasOffset(t);
        handleSamplingAt(dx, dy);
    } else if (e.touches.length === 2) {
        const t1 = e.touches[0], t2 = e.touches[1];
        lastPinchDist    = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        lastPinchCenterX = (t1.clientX + t2.clientX) / 2;
        lastPinchCenterY = (t1.clientY + t2.clientY) / 2;
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && lastPinchDist === null) {
        const t = e.touches[0];
        const { dx, dy } = getCanvasOffset(t);
        handleSamplingAt(dx, dy);
    } else if (e.touches.length === 2) {
        const t1 = e.touches[0], t2 = e.touches[1];
        const dist    = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const centerX = (t1.clientX + t2.clientX) / 2;
        const centerY = (t1.clientY + t2.clientY) / 2;
        if (lastPinchDist !== null) {
            const scaleFactor = dist / lastPinchDist;
            // Two-finger pan
            const rect  = canvas.getBoundingClientRect();
            const { srcW, srcH } = getViewport();
            const dx = centerX - lastPinchCenterX;
            const dy = centerY - lastPinchCenterY;
            viewPanX -= dx / rect.width  * srcW;
            viewPanY -= dy / rect.height * srcH;
            clampPan();
            applyZoom(scaleFactor, centerX, centerY);
        }
        lastPinchDist    = dist;
        lastPinchCenterX = centerX;
        lastPinchCenterY = centerY;
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) lastPinchDist = null;
}, { passive: false });

zoomResetBtn.addEventListener('click', resetZoom);

// ── Sample modal ──
function getTotalPercent() {
    return samples.reduce((sum, s) => sum + (s.percent || 0), 0);
}

function getRemainingPercent() {
    return Math.max(0, 100 - getTotalPercent());
}

function openSampleModal() {
    if (!currentRGB) { alert('Load an image and touch it to select a colour first.'); return; }

    // Populate modal preview
    const [r, g, b] = currentRGB;
    modalSwatch.style.background = `rgb(${r},${g},${b})`;
    if (currentMunsellResult && !currentMunsellResult.libError) {
        modalMunsell.textContent = `${currentMunsellResult.code} — ${currentMunsellResult.name}`;
    } else {
        modalMunsell.textContent = currentMunsellResult?.libError ? '⚠ Library not loaded' : '—';
    }
    modalRgb.textContent = `rgb(${r}, ${g}, ${b})`;

    // Smart default %
    const remaining = getRemainingPercent();
    percentValue.value = remaining;
    updatePercentInfo();

    sampleModal.hidden = false;
    percentValue.focus();
    percentValue.select();
}

function closeSampleModal() {
    sampleModal.hidden = true;
}

function updatePercentInfo() {
    const remaining = getRemainingPercent();
    const entered   = parseFloat(percentValue.value);
    if (remaining <= 0) {
        percentInfo.textContent = 'Total coverage is already at 100%.';
        percentInfo.className   = 'percent-info warn';
    } else if (!isNaN(entered) && entered > remaining) {
        percentInfo.textContent = `Exceeds remaining ${remaining}% — reduce entry.`;
        percentInfo.className   = 'percent-info warn';
    } else {
        percentInfo.textContent = `${remaining}% remaining across all samples.`;
        percentInfo.className   = 'percent-info';
    }
}

percentValue.addEventListener('input', updatePercentInfo);

function confirmSaveSample() {
    if (!currentRGB) return;

    const rawPct  = parseFloat(percentValue.value);
    const percent = isNaN(rawPct) ? 0 : Math.min(100, Math.max(0, Math.round(rawPct)));
    const remaining = getRemainingPercent();

    if (percent > remaining) {
        percentInfo.textContent = `Cannot exceed remaining ${remaining}%. Adjust the value.`;
        percentInfo.className   = 'percent-info warn';
        percentValue.focus();
        return;
    }

    samples.push({
        id:       Date.now(),
        number:   samples.length + 1,
        x:        crosshair.x,
        y:        crosshair.y,
        type:     featureType.value,
        munsell:  currentMunsellResult?.code  ?? null,
        soilName: currentMunsellResult?.name  ?? null,
        outOfGamut: !currentMunsellResult?.code,
        percent,
        rgb:      `rgb(${currentRGB.join(',')})`,
    });

    updateTable();
    redrawCanvas();
    saveToStorage();
    closeSampleModal();
}

eyedropperBtn.addEventListener('click', openSampleModal);
modalSaveBtn.addEventListener('click', confirmSaveSample);
modalCancelBtn.addEventListener('click', closeSampleModal);
modalCloseBtn.addEventListener('click', closeSampleModal);

// Close modal on overlay click
sampleModal.addEventListener('click', (e) => {
    if (e.target === sampleModal) closeSampleModal();
});

// ── Samples table ──
function updateTable() {
    const hasRows = samples.length > 0;
    tableEmpty.style.display = hasRows ? 'none' : '';
    Array.from(tableBody.querySelectorAll('tr:not(#table-empty)')).forEach(r => r.remove());

    samples.forEach((s) => {
        const tr = document.createElement('tr');

        const numTd = document.createElement('td');
        numTd.textContent = s.number;

        const typeTd = document.createElement('td');
        typeTd.textContent = s.type;

        const codeTd = document.createElement('td');
        const sw = document.createElement('span');
        sw.className = 'swatch'; sw.style.background = s.rgb;
        codeTd.appendChild(sw);
        const cs = document.createElement('span');
        cs.className = 'munsell-code'; cs.textContent = s.munsell || '—';
        codeTd.appendChild(cs);

        const nameTd = document.createElement('td');
        nameTd.className = 'soil-name'; nameTd.textContent = s.soilName || '—';

        const pctTd = document.createElement('td');
        pctTd.textContent = `${s.percent}%`;

        const actTd = document.createElement('td');
        const del = document.createElement('button');
        del.className = 'delete-btn'; del.textContent = '✕'; del.title = 'Delete sample';
        del.addEventListener('click', () => deleteSample(s.id));
        actTd.appendChild(del);

        tr.append(numTd, typeTd, codeTd, nameTd, pctTd, actTd);
        tableBody.appendChild(tr);
    });
}

function deleteSample(id) {
    samples = samples.filter(s => s.id !== id).map((s, i) => ({ ...s, number: i + 1 }));
    updateTable();
    redrawCanvas();
    saveToStorage();
}

// ── Export ──
async function generateReport() {
    if (samples.length === 0) { alert('No samples recorded. Save at least one sample first.'); return; }
    if (!window.jspdf) { alert('PDF library (jsPDF) failed to load. Check your connection.'); return; }
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const sampleId = sampleIdInput.value.trim() || 'Unnamed_Sample';
        const pageH = doc.internal.pageSize.getHeight();

        doc.setFontSize(22); doc.text('Soil Colour Analysis Report', 20, 20);
        doc.setFontSize(12);
        doc.text(`Project: ${projectNameInput.value || 'N/A'}`, 20, 35);
        doc.text(`Site: ${siteNameInput.value || 'N/A'}`, 20, 42);
        doc.text(`Sample ID: ${sampleId}`, 20, 49);
        doc.text(`Location: ${metadata.lat || 'N/A'}, ${metadata.lng || 'N/A'}`, 20, 56);
        doc.text(`Date: ${metadata.date || 'N/A'}`, 20, 63);

        let nextY = 70;
        if (baseImage) {
            const TARGET_PX = 1004;
            const scale = TARGET_PX / canvas.width;
            const tmp = document.createElement('canvas');
            tmp.width  = Math.round(canvas.width  * scale);
            tmp.height = Math.round(canvas.height * scale);
            tmp.getContext('2d').drawImage(canvas, 0, 0, tmp.width, tmp.height);
            const imgData = tmp.toDataURL('image/jpeg', 0.75);
            const imgH = Math.min((tmp.height * 170) / tmp.width, pageH - 90);
            doc.addImage(imgData, 'JPEG', 20, 70, 170, imgH);
            nextY = 70 + imgH + 10;
        }

        if (nextY + 20 > pageH - 15) { doc.addPage(); nextY = 20; }
        doc.setFont(undefined, 'bold'); doc.text('Samples:', 20, nextY);
        doc.setFont(undefined, 'normal'); nextY += 8;

        for (const s of samples) {
            if (nextY + 7 > pageH - 15) { doc.addPage(); nextY = 20; }
            const label = s.munsell ? `${s.munsell} ${s.soilName || ''}`.trim() : 'N/A';
            doc.text(`${s.number}. ${s.type}: ${label} (${s.percent}%)`, 20, nextY);
            nextY += 7;
        }
        doc.save(`${sampleId}_SoilReport.pdf`);
    } catch (e) {
        console.error('[pdf]', e);
        alert(`PDF generation failed: ${e.message}`);
    }
}

function exportCSV() {
    if (samples.length === 0) { alert('No samples to export.'); return; }
    const esc = v => `"${String(v).replace(/"/g, '""')}"`;
    const header = ['#', 'Type', 'Munsell Code', 'Soil Colour Name', 'Percent', 'RGB'];
    const rows   = samples.map(s => [s.number, s.type, s.munsell || '', s.soilName || '', s.percent, s.rgb]);
    downloadFile([header, ...rows].map(r => r.map(esc).join(',')).join('\n'), 'text/csv',
        `${sampleIdInput.value.trim() || 'samples'}.csv`);
}

function exportJSON() {
    if (samples.length === 0) { alert('No samples to export.'); return; }
    const data = {
        sampleId: sampleIdInput.value, site: siteNameInput.value,
        project: projectNameInput.value, location: metadata,
        samples: samples.map(({ id, number, type, munsell, soilName, percent, rgb }) =>
            ({ id, number, type, munsell, soilName, percent, rgb }))
    };
    downloadFile(JSON.stringify(data, null, 2), 'application/json',
        `${sampleIdInput.value.trim() || 'samples'}.json`);
}

function downloadFile(content, mimeType, filename) {
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

// ── Resize: keep magnifier canvas width in sync ──
const resizeObserver = new ResizeObserver(() => {
    if (baseImage) resizeMagnifierCanvas();
});
resizeObserver.observe(canvasWrap);

// ── Expose globals for inline HTML event handlers ──
window.generateReport  = generateReport;
window.exportCSV       = exportCSV;
window.exportJSON      = exportJSON;
window.clearSession    = clearSession;

// Initial magnifier sizing — run after first layout paint
requestAnimationFrame(() => {
    resizeMagnifierCanvas();
    drawMagnifierPlaceholder();
});
