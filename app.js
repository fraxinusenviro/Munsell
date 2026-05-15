// Munsell library loaded dynamically from raw CJS files (ESM CDN transforms
// fail to bundle the 398KB MRD data tables). Each file is wrapped in a blob
// URL and loaded via dynamic import() — handles large files correctly in all
// browsers, unlike new Function() which silently fails on WebKit for ~400KB bodies.
let munsell = null;
let libraryOk = false;

const MUNSELL_BASE = 'https://cdn.jsdelivr.net/npm/munsell@1.1.6/dist/src/';
const MUNSELL_FILES = ['arithmetic', 'MRD', 'y-to-value-table', 'colorspace', 'convert', 'invert', 'index'];

// Soil color chips from the Munsell Soil Color Book.
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
                text + '\n' +
                `export default exports;`
            ], { type: 'text/javascript' });

            const blobUrl = URL.createObjectURL(blob);
            try {
                const mod = await import(blobUrl);
                modules[name] = mod.default;
            } finally {
                URL.revokeObjectURL(blobUrl);
            }
        }

        delete window[CACHE_KEY];
        munsell = modules['index'];

        if (typeof munsell.rgb255ToMunsell !== 'function') {
            throw new Error('rgb255ToMunsell missing. Keys: ' + Object.keys(munsell).join(', '));
        }
        libraryOk = true;
        buildChipLabCache();
        console.info(`[munsell] Loaded OK — ${chipLabCache.length} soil chips cached`);
    } catch (e) {
        delete window[CACHE_KEY];
        console.error('[munsell] Failed to load:', e);
        document.getElementById('lib-warning').style.display = 'flex';
    }
}

initMunsell();

// ===== DOM refs =====
const canvas      = document.getElementById('image-canvas');
const ctx         = canvas.getContext('2d', { willReadFrequently: true });

const sampleCanvas = document.createElement('canvas');
const sampleCtx    = sampleCanvas.getContext('2d', { willReadFrequently: true });

const loupeCanvas = document.getElementById('loupe');
const loupeCtx    = loupeCanvas.getContext('2d');

const fileInput         = document.getElementById('fileInput');
const fileInputGallery  = document.getElementById('fileInputGallery');
const openFileBtn       = document.getElementById('open-file-btn');
const openGalleryBtn    = document.getElementById('open-gallery-btn');

const activeColorPreview = document.getElementById('active-color-preview');
const rgbValue           = document.getElementById('rgb-val');
const munsellValue       = document.getElementById('munsell-val');

const featureType   = document.getElementById('feature-type');
const percentValue  = document.getElementById('percent-val');
const tableBody     = document.getElementById('table-body');
const tableEmpty    = document.getElementById('table-empty');

const sampleIdInput   = document.getElementById('sample-id');
const siteNameInput   = document.getElementById('site-name');
const projectNameInput = document.getElementById('project-name');
const gpsDisplay      = document.getElementById('gps-display');
const dateDisplay     = document.getElementById('date-display');

const pixelSlider       = document.getElementById('pixel-slider');
const pixelLabel        = document.getElementById('pixel-label');
const smoothToggle      = document.getElementById('smooth-toggle');
const loupeZoomSlider   = document.getElementById('loupe-zoom-slider');
const loupeZoomLabel    = document.getElementById('loupe-zoom-label');

// ===== State =====
let samples            = [];
let currentRGB         = null;
let currentMunsellResult = null;
let metadata           = { lat: '', lng: '', date: '' };
let baseImage          = null;
let crosshair          = { x: null, y: null };
let blurRadius         = 4;
let smoothingEnabled   = false;
let loupeZoom          = 4;
let lastClientPos      = { x: 0, y: 0 };
let chipLabCache       = [];
let smoothDebounceTimer = null;

const STORAGE_KEY = 'munsell_session';

// ===== Chip Lab cache =====
function buildChipLabCache() {
    chipLabCache = [];
    for (const [code, name] of Object.entries(SOIL_CHIPS)) {
        try {
            const lab = munsell.munsellToLab(code);
            chipLabCache.push({ code, name, lab });
        } catch (e) {
            console.warn(`[chips] Lab failed for ${code}:`, e.message);
        }
    }
}

// Standard sRGB → CIELab D65
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

// Find nearest soil chip by CIE76 delta-E
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

// ===== Gaussian blur =====
function gaussianKernel(sigma) {
    const radius = Math.min(Math.ceil(2.5 * sigma), 30);
    const size   = radius * 2 + 1;
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

    // Horizontal pass
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let r = 0, g = 0, b = 0;
            for (let k = 0, kLen = kernel.length; k < kLen; k++) {
                const sx = Math.max(0, Math.min(w - 1, x + k - radius));
                const si = (y * w + sx) * 4;
                const wt = kernel[k];
                r += srcPx[si]   * wt;
                g += srcPx[si+1] * wt;
                b += srcPx[si+2] * wt;
            }
            const di = (y * w + x) * 4;
            tmp[di] = r; tmp[di+1] = g; tmp[di+2] = b; tmp[di+3] = 255;
        }
    }

    // Vertical pass
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let r = 0, g = 0, b = 0;
            for (let k = 0, kLen = kernel.length; k < kLen; k++) {
                const sy = Math.max(0, Math.min(h - 1, y + k - radius));
                const si = (sy * w + x) * 4;
                const wt = kernel[k];
                r += tmp[si]   * wt;
                g += tmp[si+1] * wt;
                b += tmp[si+2] * wt;
            }
            const di = (y * w + x) * 4;
            out[di] = r; out[di+1] = g; out[di+2] = b; out[di+3] = 255;
        }
    }

    sampleCtx.putImageData(new ImageData(out, w, h), 0, 0);
}

// Rebuild sampleCanvas — called when image loads or smoothing settings change.
// redrawCanvas() just composites sampleCanvas onto ctx (cheap on every mouse move).
function rebuildSampleCanvas() {
    if (!baseImage) return;
    if (!smoothingEnabled) {
        sampleCtx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    } else {
        applyGaussianBlur();
    }
}

// ===== Persistence =====
function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            samples, metadata,
            formFields: {
                sampleId: sampleIdInput.value,
                siteName: siteNameInput.value,
                projectName: projectNameInput.value,
            }
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
    loupeCanvas.style.display = 'none';
    munsellValue.textContent = 'No colour selected';
    rgbValue.textContent = '—';
    activeColorPreview.style.background = '#d4c5bb';
    updateTable();
    localStorage.removeItem(STORAGE_KEY);
}

loadFromStorage();

// ===== Event listeners =====
openFileBtn.addEventListener('click', () => fileInput.click());
openGalleryBtn.addEventListener('click', () => fileInputGallery.click());
fileInput.addEventListener('change', onFileChange);
fileInputGallery.addEventListener('change', onFileChange);

[sampleIdInput, siteNameInput, projectNameInput].forEach(el => {
    el.addEventListener('input', saveToStorage);
});

smoothToggle.addEventListener('change', () => {
    smoothingEnabled = smoothToggle.checked;
    pixelSlider.disabled = !smoothingEnabled;
    pixelLabel.textContent = smoothingEnabled ? `${blurRadius}px` : 'Off';
    rebuildSampleCanvas();
    redrawCanvas();
    if (crosshair.x !== null) drawLoupe(lastClientPos.x, lastClientPos.y);
});

pixelSlider.addEventListener('input', () => {
    blurRadius = parseInt(pixelSlider.value, 10);
    pixelLabel.textContent = `${blurRadius}px`;
    clearTimeout(smoothDebounceTimer);
    smoothDebounceTimer = setTimeout(() => {
        rebuildSampleCanvas();
        redrawCanvas();
        if (crosshair.x !== null) drawLoupe(lastClientPos.x, lastClientPos.y);
    }, 80);
});

loupeZoomSlider.addEventListener('input', () => {
    loupeZoom = parseInt(loupeZoomSlider.value, 10);
    loupeZoomLabel.textContent = `${loupeZoom}×`;
    if (crosshair.x !== null) drawLoupe(lastClientPos.x, lastClientPos.y);
});

canvas.addEventListener('mousemove', handleSampling);
canvas.addEventListener('mousedown', handleSampling);
canvas.addEventListener('mouseleave', () => {
    loupeCanvas.style.display = 'none';
});
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleSampling(e.touches[0]);
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleSampling(e.touches[0]);
}, { passive: false });
canvas.addEventListener('touchend', () => {
    loupeCanvas.style.display = 'none';
});

window.saveSample    = saveSample;
window.deleteSample  = deleteSample;
window.generateReport = generateReport;
window.exportCSV     = exportCSV;
window.exportJSON    = exportJSON;
window.clearSession  = clearSession;

// ===== File handling =====
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
    } catch (err) { console.log('EXIF Error:', err); }

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(800 / img.width, 1);
            canvas.width  = Math.round(img.width  * scale);
            canvas.height = Math.round(img.height * scale);
            sampleCanvas.width  = canvas.width;
            sampleCanvas.height = canvas.height;

            baseImage = img;
            rebuildSampleCanvas();
            redrawCanvas();

            crosshair = { x: Math.floor(canvas.width / 2), y: Math.floor(canvas.height / 2) };
            const rect = canvas.getBoundingClientRect();
            updateSelectionAt(
                crosshair.x, crosshair.y,
                rect.left + crosshair.x,
                rect.top  + crosshair.y
            );
            saveToStorage();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// ===== Canvas drawing =====
function redrawCanvas() {
    if (!baseImage) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sampleCanvas, 0, 0);
    drawSampleMarkers();
    if (crosshair.x !== null && crosshair.y !== null) drawCrosshair(crosshair.x, crosshair.y);
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
    const R = 20;
    samples.forEach((s) => {
        ctx.save();

        // Outer glow
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur  = 14;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth   = 5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, R, 0, Math.PI * 2);
        ctx.stroke();

        // Coloured ring (actual soil colour)
        ctx.shadowBlur  = 0;
        ctx.strokeStyle = s.rgb;
        ctx.lineWidth   = 4;
        ctx.beginPath();
        ctx.arc(s.x, s.y, R, 0, Math.PI * 2);
        ctx.stroke();

        // White halo ring
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, R + 4, 0, Math.PI * 2);
        ctx.stroke();

        // Dark semi-transparent fill
        ctx.fillStyle = 'rgba(0,0,0,0.42)';
        ctx.beginPath();
        ctx.arc(s.x, s.y, R - 1, 0, Math.PI * 2);
        ctx.fill();

        // Sample number
        ctx.fillStyle  = 'white';
        ctx.font       = 'bold 13px system-ui, sans-serif';
        ctx.textAlign  = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor  = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur   = 4;
        ctx.fillText(String(s.number), s.x, s.y);

        // Munsell code label below
        ctx.font         = '10px system-ui, sans-serif';
        ctx.textBaseline = 'top';
        ctx.shadowBlur   = 3;
        ctx.fillText(s.munsell || '?', s.x, s.y + R + 6);

        ctx.restore();
    });
}

// ===== Loupe (canvas magnifying glass with handle) =====
// Geometry: 240×290 canvas. Glass circle centre (110,115) radius 105.
// Handle extends from glass edge at ~135° to canvas bottom-right (~handle tip).
// Positioned so bottom-right corner tracks the cursor → glass is above cursor.
const L_W = 240, L_H = 290;
const CX = 110, CY = 115, CR = 105; // glass centre / radius

function drawLoupe(clientX, clientY) {
    if (!baseImage) return;

    // Position loupe: handle tip (bottom-right of canvas) ≈ cursor
    let left = clientX - L_W + 8;
    let top  = clientY - L_H + 8;
    // Viewport clamp
    left = Math.max(5, Math.min(window.innerWidth  - L_W - 5, left));
    top  = Math.max(5, Math.min(window.innerHeight - L_H - 5, top));

    loupeCanvas.style.left    = `${left}px`;
    loupeCanvas.style.top     = `${top}px`;
    loupeCanvas.style.display = 'block';

    const lc = loupeCtx;
    lc.clearRect(0, 0, L_W, L_H);

    // --- Handle ---
    lc.save();
    const hGrad = lc.createLinearGradient(180, 190, 232, 282);
    hGrad.addColorStop(0,   '#607d8b');
    hGrad.addColorStop(0.5, '#37474f');
    hGrad.addColorStop(1,   '#263238');
    lc.strokeStyle = hGrad;
    lc.lineWidth   = 24;
    lc.lineCap     = 'round';
    lc.beginPath();
    lc.moveTo(183, 192);
    lc.lineTo(230, 280);
    lc.stroke();

    // Handle highlight
    const hHi = lc.createLinearGradient(180, 190, 232, 282);
    hHi.addColorStop(0, 'rgba(255,255,255,0.2)');
    hHi.addColorStop(1, 'rgba(255,255,255,0.04)');
    lc.strokeStyle = hHi;
    lc.lineWidth   = 8;
    lc.beginPath();
    lc.moveTo(177, 190);
    lc.lineTo(223, 277);
    lc.stroke();

    // Grip dots
    [[198, 210], [209, 228], [220, 248]].forEach(([dx, dy]) => {
        lc.beginPath();
        lc.arc(dx, dy, 3.5, 0, Math.PI * 2);
        lc.fillStyle = 'rgba(255,255,255,0.45)';
        lc.fill();
    });
    lc.restore();

    // --- Clip to glass circle ---
    lc.save();
    lc.beginPath();
    lc.arc(CX, CY, CR, 0, Math.PI * 2);
    lc.clip();

    // Magnified content from sampleCanvas
    const srcW = Math.max(1, Math.round(CR * 2 / loupeZoom));
    const srcH = Math.max(1, Math.round(CR * 2 / loupeZoom));
    const rawSrcX = crosshair.x - Math.floor(srcW / 2);
    const rawSrcY = crosshair.y - Math.floor(srcH / 2);
    const srcX = Math.max(0, Math.min(sampleCanvas.width  - srcW, rawSrcX));
    const srcY = Math.max(0, Math.min(sampleCanvas.height - srcH, rawSrcY));

    lc.imageSmoothingEnabled = false;
    lc.drawImage(sampleCanvas, srcX, srcY, srcW, srcH,
        CX - CR, CY - CR, CR * 2, CR * 2);

    // Munsell badge at top of glass
    if (currentRGB && currentMunsellResult && !currentMunsellResult.libError) {
        const bx = CX - 78, by = CY - CR + 10, bw = 156, bh = 26;
        lc.beginPath();
        lc.roundRect(bx, by, bw, bh, 7);
        lc.fillStyle = 'rgba(0,0,0,0.68)';
        lc.fill();

        // Colour swatch
        lc.beginPath();
        lc.roundRect(bx + 5, by + 5, 16, 16, 3);
        lc.fillStyle = `rgb(${currentRGB[0]},${currentRGB[1]},${currentRGB[2]})`;
        lc.fill();
        lc.strokeStyle = 'rgba(255,255,255,0.35)';
        lc.lineWidth   = 0.8;
        lc.stroke();

        // Munsell code
        lc.fillStyle    = 'white';
        lc.font         = 'bold 10.5px system-ui, sans-serif';
        lc.textAlign    = 'left';
        lc.textBaseline = 'middle';
        lc.fillText(currentMunsellResult.code, bx + 26, by + 13);

        // Soil name (dimmer, smaller)
        const codeWidth = lc.measureText(currentMunsellResult.code).width;
        lc.fillStyle = 'rgba(255,255,255,0.65)';
        lc.font      = '8.5px system-ui, sans-serif';
        const nameX  = bx + 26 + codeWidth + 6;
        const availW = bw - (nameX - bx) - 5;
        if (availW > 20) lc.fillText(currentMunsellResult.name, nameX, by + 13);
    }

    // Crosshairs in glass centre
    lc.strokeStyle = 'rgba(255,255,255,0.88)';
    lc.lineWidth   = 1.5;
    lc.beginPath();
    lc.moveTo(CX - 16, CY); lc.lineTo(CX - 5,  CY);
    lc.moveTo(CX + 5,  CY); lc.lineTo(CX + 16, CY);
    lc.moveTo(CX, CY - 16); lc.lineTo(CX, CY - 5);
    lc.moveTo(CX, CY + 5);  lc.lineTo(CX, CY + 16);
    lc.stroke();

    // Centre dot
    lc.beginPath();
    lc.arc(CX, CY, 2.5, 0, Math.PI * 2);
    lc.fillStyle = 'rgba(255,255,255,0.9)';
    lc.fill();

    lc.restore(); // end clip

    // --- Bezel rim ---
    lc.save();
    lc.shadowColor   = 'rgba(0,0,0,0.5)';
    lc.shadowBlur    = 14;
    lc.shadowOffsetY = 3;

    const bezelGrad = lc.createLinearGradient(CX - CR, CY - CR, CX + CR, CY + CR);
    bezelGrad.addColorStop(0,    '#f0f0f0');
    bezelGrad.addColorStop(0.25, '#d0d0d0');
    bezelGrad.addColorStop(0.6,  '#a0a0a0');
    bezelGrad.addColorStop(1,    '#e0e0e0');

    lc.beginPath();
    lc.arc(CX, CY, CR + 2, 0, Math.PI * 2);
    lc.strokeStyle = bezelGrad;
    lc.lineWidth   = 7;
    lc.stroke();
    lc.restore();

    // Inner shadow ring
    lc.beginPath();
    lc.arc(CX, CY, CR - 1, 0, Math.PI * 2);
    lc.strokeStyle = 'rgba(0,0,0,0.3)';
    lc.lineWidth   = 3;
    lc.stroke();
}

// ===== Sampling =====
function handleSampling(e) {
    const rect = canvas.getBoundingClientRect();
    const x    = Math.floor((e.clientX || e.pageX) - rect.left);
    const y    = Math.floor((e.clientY || e.pageY) - rect.top);
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
        loupeCanvas.style.display = 'none';
        return;
    }
    updateSelectionAt(x, y, e.clientX, e.clientY);
}

function updateSelectionAt(x, y, clientX, clientY) {
    crosshair = { x, y };
    lastClientPos = { x: clientX, y: clientY };
    redrawCanvas();

    const [r, g, b] = getAveragePixel(x, y, 0);
    currentRGB = [r, g, b];

    activeColorPreview.style.background = `rgb(${r},${g},${b})`;
    rgbValue.textContent = `rgb(${r}, ${g}, ${b})`;

    currentMunsellResult = getNearestChip(r, g, b);
    if (currentMunsellResult.libError) {
        munsellValue.textContent = '⚠ Library not loaded';
        munsellValue.classList.add('out-of-gamut');
    } else {
        munsellValue.textContent = `${currentMunsellResult.code} — ${currentMunsellResult.name}`;
        munsellValue.classList.remove('out-of-gamut');
    }

    drawLoupe(clientX, clientY);
}

function getAveragePixel(cx, cy, radius) {
    const x0 = Math.max(0, cx - radius), y0 = Math.max(0, cy - radius);
    const x1 = Math.min(canvas.width - 1, cx + radius);
    const y1 = Math.min(canvas.height - 1, cy + radius);
    const w  = x1 - x0 + 1, h = y1 - y0 + 1;
    const px = sampleCtx.getImageData(x0, y0, w, h).data;
    let r = 0, g = 0, b = 0;
    const total = w * h;
    for (let i = 0; i < px.length; i += 4) { r += px[i]; g += px[i+1]; b += px[i+2]; }
    return [Math.round(r / total), Math.round(g / total), Math.round(b / total)];
}

// ===== Sample management =====
function saveSample() {
    if (!currentRGB) { alert('Load an image and select a colour by clicking on it first.'); return; }

    const rawPct = parseFloat(percentValue.value);
    const percent = isNaN(rawPct) ? 0 : Math.min(100, Math.max(0, Math.round(rawPct)));
    percentValue.value = percent;

    samples.push({
        id: Date.now(),
        number: samples.length + 1,
        x: crosshair.x, y: crosshair.y,
        type: featureType.value,
        munsell:  currentMunsellResult?.code  ?? null,
        soilName: currentMunsellResult?.name  ?? null,
        outOfGamut: !currentMunsellResult?.code,
        percent,
        rgb: `rgb(${currentRGB.join(',')})`
    });

    updateTable();
    redrawCanvas();
    saveToStorage();
}

function updateTable() {
    const hasRows = samples.length > 0;
    tableEmpty.style.display = hasRows ? 'none' : '';

    // Remove old data rows (not the empty row)
    Array.from(tableBody.querySelectorAll('tr:not(#table-empty)')).forEach(r => r.remove());

    samples.forEach((s) => {
        const tr = document.createElement('tr');

        const numTd = document.createElement('td');
        numTd.textContent = s.number;

        const typeTd = document.createElement('td');
        typeTd.textContent = s.type;

        const codeTd = document.createElement('td');
        const swatch = document.createElement('span');
        swatch.className   = 'swatch';
        swatch.style.background = s.rgb;
        codeTd.appendChild(swatch);
        const codeSpan = document.createElement('span');
        codeSpan.className   = 'munsell-code';
        codeSpan.textContent = s.munsell || '—';
        codeTd.appendChild(codeSpan);

        const nameTd = document.createElement('td');
        nameTd.className   = 'soil-name';
        nameTd.textContent = s.soilName || '—';

        const pctTd = document.createElement('td');
        pctTd.textContent = `${s.percent}%`;

        const actTd = document.createElement('td');
        const btn = document.createElement('button');
        btn.className = 'delete-btn';
        btn.textContent = '✕';
        btn.title = 'Delete sample';
        btn.addEventListener('click', () => deleteSample(s.id));
        actTd.appendChild(btn);

        tr.append(numTd, typeTd, codeTd, nameTd, pctTd, actTd);
        tableBody.appendChild(tr);
    });
}

function deleteSample(id) {
    samples = samples.filter((s) => s.id !== id).map((s, i) => ({ ...s, number: i + 1 }));
    updateTable();
    redrawCanvas();
    saveToStorage();
}

// ===== Export =====
async function generateReport() {
    if (samples.length === 0) { alert('No samples recorded. Save at least one sample first.'); return; }
    if (!window.jspdf) { alert('PDF library (jsPDF) failed to load. Check your internet connection.'); return; }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const sampleId = sampleIdInput.value.trim() || 'Unnamed_Sample';
        const pageH = doc.internal.pageSize.getHeight();

        doc.setFontSize(22);
        doc.text('Soil Colour Analysis Report', 20, 20);
        doc.setFontSize(12);
        doc.text(`Project: ${projectNameInput.value || 'N/A'}`, 20, 35);
        doc.text(`Site: ${siteNameInput.value || 'N/A'}`,        20, 42);
        doc.text(`Sample ID: ${sampleId}`,                        20, 49);
        doc.text(`Location: ${metadata.lat || 'N/A'}, ${metadata.lng || 'N/A'}`, 20, 56);
        doc.text(`Date: ${metadata.date || 'N/A'}`,               20, 63);

        let nextY = 70;
        if (baseImage) {
            // 150 DPI: 170mm / 25.4 × 150 ≈ 1004 px target
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

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Samples:', 20, nextY);
        doc.setFont(undefined, 'normal');
        nextY += 8;

        for (const s of samples) {
            if (nextY + 7 > pageH - 15) { doc.addPage(); nextY = 20; }
            const label = s.munsell ? `${s.munsell} ${s.soilName || ''}`.trim() : 'N/A';
            doc.text(`${s.number}. ${s.type}: ${label} (${s.percent}%)`, 20, nextY);
            nextY += 7;
        }

        doc.save(`${sampleId}_SoilReport.pdf`);
    } catch (e) {
        console.error('[pdf] Generation failed:', e);
        alert(`PDF generation failed: ${e.message}`);
    }
}

function exportCSV() {
    if (samples.length === 0) { alert('No samples to export.'); return; }
    const esc = v => `"${String(v).replace(/"/g, '""')}"`;
    const header = ['#', 'Type', 'Munsell Code', 'Soil Colour Name', 'Percent', 'RGB'];
    const rows   = samples.map(s => [s.number, s.type, s.munsell || '', s.soilName || '', s.percent, s.rgb]);
    const csv    = [header, ...rows].map(r => r.map(esc).join(',')).join('\n');
    downloadFile(csv, 'text/csv', `${sampleIdInput.value.trim() || 'samples'}.csv`);
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
