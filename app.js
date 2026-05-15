// Munsell library loaded dynamically from raw CJS files (ESM CDN transforms
// fail to bundle the 398KB MRD data tables). Each file is wrapped in a blob
// URL and loaded via dynamic import() — handles large files correctly in all
// browsers, unlike new Function() which silently fails on WebKit for ~400KB bodies.
let munsell = null;
let libraryOk = false;

const MUNSELL_BASE = 'https://cdn.jsdelivr.net/npm/munsell@1.1.6/dist/src/';
const MUNSELL_FILES = ['arithmetic', 'MRD', 'y-to-value-table', 'colorspace', 'convert', 'invert', 'index'];

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
        try {
            const test = munsell.rgb255ToMunsell(120, 85, 55, undefined, 1, 1e-6, 200, 'clamp');
            console.info('[munsell] Loaded OK, test [120,85,55]:', test);
        } catch (testErr) {
            console.warn('[munsell] Loaded but test call threw:', testErr.message);
        }
    } catch (e) {
        delete window[CACHE_KEY];
        console.error('[munsell] Failed to load:', e);
        document.getElementById('lib-warning').style.display = 'block';
    }
}

initMunsell();

// ===== DOM refs =====
const canvas = document.getElementById('image-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const sampleCanvas = document.createElement('canvas');
const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
const magnifier = document.getElementById('magnifier');
const fileInput = document.getElementById('fileInput');
const fileInputGallery = document.getElementById('fileInputGallery');
const openFileBtn = document.getElementById('open-file-btn');
const openGalleryBtn = document.getElementById('open-gallery-btn');

const activeColorPreview = document.getElementById('active-color-preview');
const rgbValue = document.getElementById('rgb-val');
const munsellValue = document.getElementById('munsell-val');

const featureType = document.getElementById('feature-type');
const percentValue = document.getElementById('percent-val');
const tableBody = document.getElementById('table-body');

const sampleIdInput = document.getElementById('sample-id');
const siteNameInput = document.getElementById('site-name');
const projectNameInput = document.getElementById('project-name');
const gpsDisplay = document.getElementById('gps-display');
const dateDisplay = document.getElementById('date-display');

const pixelSlider = document.getElementById('pixel-slider');
const pixelLabel = document.getElementById('pixel-label');
const smoothToggle = document.getElementById('smooth-toggle');

// ===== State =====
let samples = [];
let currentRGB = null;
let metadata = { lat: '', lng: '', date: '' };
let baseImage = null;
let crosshair = { x: null, y: null };
let pixelSize = 6;
let smoothingEnabled = false;

const LOUPE_SAMPLE_RADIUS = 0;
const LOUPE_ZOOM = 4;
const STORAGE_KEY = 'munsell_session';

// ===== Persistence =====
function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            samples,
            metadata,
            formFields: {
                sampleId: sampleIdInput.value,
                siteName: siteNameInput.value,
                projectName: projectNameInput.value,
            }
        }));
    } catch (e) {
        console.warn('[storage] Save failed:', e);
    }
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
            sampleIdInput.value = state.formFields.sampleId || '';
            siteNameInput.value = state.formFields.siteName || '';
            projectNameInput.value = state.formFields.projectName || '';
        }
    } catch (e) {
        console.warn('[storage] Load failed:', e);
    }
}

function clearSession() {
    if (!confirm('Clear all saved samples and metadata? This cannot be undone.')) return;
    samples = [];
    metadata = { lat: '', lng: '', date: '' };
    sampleIdInput.value = '';
    siteNameInput.value = '';
    projectNameInput.value = '';
    gpsDisplay.innerText = 'No GPS found in EXIF';
    dateDisplay.innerText = 'N/A';
    currentRGB = null;
    baseImage = null;
    crosshair = { x: null, y: null };
    canvas.width = 0;
    canvas.height = 0;
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
    pixelLabel.textContent = smoothingEnabled ? `${pixelSize}x` : 'Off';
    redrawCanvas();
    if (crosshair.x !== null) {
        const rect = canvas.getBoundingClientRect();
        updateSelectionAt(crosshair.x, crosshair.y, rect.left + crosshair.x, rect.top + crosshair.y);
    }
});

pixelSlider.addEventListener('input', () => {
    pixelSize = parseInt(pixelSlider.value, 10);
    pixelLabel.textContent = `${pixelSize}x`;
    redrawCanvas();
    if (crosshair.x !== null) {
        const rect = canvas.getBoundingClientRect();
        updateSelectionAt(crosshair.x, crosshair.y, rect.left + crosshair.x, rect.top + crosshair.y);
    }
});

canvas.addEventListener('mousemove', handleSampling);
canvas.addEventListener('mousedown', handleSampling);
canvas.addEventListener('mouseleave', () => {
    magnifier.style.display = 'none';
});
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleSampling(e.touches[0]);
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleSampling(e.touches[0]);
}, { passive: false });

window.saveSample = saveSample;
window.deleteSample = deleteSample;
window.generateReport = generateReport;
window.exportCSV = exportCSV;
window.exportJSON = exportJSON;
window.clearSession = clearSession;

// ===== File handling =====
async function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
    }

    try {
        const tags = await ExifReader.load(file);
        metadata.date = tags.DateTime?.description || new Date().toLocaleString();
        if (tags.GPSLatitude && tags.GPSLongitude) {
            metadata.lat = tags.GPSLatitude.description;
            metadata.lng = tags.GPSLongitude.description;
            gpsDisplay.innerText = `${metadata.lat}, ${metadata.lng}`;
        } else {
            metadata.lat = '';
            metadata.lng = '';
            gpsDisplay.innerText = 'No GPS found in EXIF';
        }
        dateDisplay.innerText = metadata.date;
    } catch (error) {
        console.log('EXIF Error:', error);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(800 / img.width, 1);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            sampleCanvas.width = canvas.width;
            sampleCanvas.height = canvas.height;

            baseImage = img;
            redrawCanvas();

            magnifier.style.backgroundImage = `url(${event.target.result})`;
            crosshair = {
                x: Math.floor(canvas.width / 2),
                y: Math.floor(canvas.height / 2)
            };
            updateSelectionAt(
                crosshair.x, crosshair.y,
                canvas.getBoundingClientRect().left + crosshair.x,
                canvas.getBoundingClientRect().top + crosshair.y
            );
            saveToStorage();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// ===== Canvas drawing =====
function drawPixelated() {
    if (!smoothingEnabled) {
        ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
        sampleCtx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
        return;
    }

    const bw = Math.max(1, Math.floor(canvas.width / pixelSize));
    const bh = Math.max(1, Math.floor(canvas.height / pixelSize));
    const offscreen = document.createElement('canvas');
    offscreen.width = bw;
    offscreen.height = bh;
    const offCtx = offscreen.getContext('2d');
    offCtx.drawImage(baseImage, 0, 0, bw, bh);

    const data = offCtx.getImageData(0, 0, bw, bh).data;
    sampleCtx.clearRect(0, 0, sampleCanvas.width, sampleCanvas.height);
    for (let row = 0; row < bh; row++) {
        for (let col = 0; col < bw; col++) {
            const i = (row * bw + col) * 4;
            const color = `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`;
            ctx.fillStyle = color;
            ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
            sampleCtx.fillStyle = color;
            sampleCtx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
        }
    }
}

function redrawCanvas() {
    if (!baseImage) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPixelated();
    drawSampleMarkers();
    if (crosshair.x !== null && crosshair.y !== null) {
        drawCrosshair(crosshair.x, crosshair.y);
    }
}

function drawCrosshair(x, y) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.lineTo(x + 12, y);
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x, y + 12);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawSampleMarkers() {
    const r = Math.max(12, LOUPE_SAMPLE_RADIUS * 2 + 8);
    samples.forEach((s) => {
        ctx.save();
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 3;

        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 4;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(s.number), s.x, s.y);

        ctx.font = '10px sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText(s.outOfGamut ? '⚠ OOG' : s.munsell, s.x, s.y + r + 4);

        ctx.restore();
    });
}

// ===== Sampling =====
function handleSampling(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX || e.pageX) - rect.left);
    const y = Math.floor((e.clientY || e.pageY) - rect.top);

    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
        magnifier.style.display = 'none';
        return;
    }
    updateSelectionAt(x, y, e.clientX, e.clientY);
}

function updateSelectionAt(x, y, clientX, clientY) {
    crosshair = { x, y };
    redrawCanvas();

    const avgPixel = getAveragePixel(x, y, LOUPE_SAMPLE_RADIUS);
    currentRGB = avgPixel;

    const rgbText = `rgb(${avgPixel[0]}, ${avgPixel[1]}, ${avgPixel[2]})`;
    activeColorPreview.style.background = rgbText;
    rgbValue.innerText = `${rgbText} · 1px`;

    const result = getNearestMunsell(avgPixel[0], avgPixel[1], avgPixel[2]);
    if (result.libError) {
        munsellValue.textContent = '⚠ Library not loaded';
        munsellValue.classList.add('out-of-gamut');
        activeColorPreview.classList.remove('out-of-gamut');
    } else if (result.outOfGamut) {
        munsellValue.textContent = '⚠ Out of gamut';
        munsellValue.classList.add('out-of-gamut');
        activeColorPreview.classList.add('out-of-gamut');
    } else {
        munsellValue.textContent = result.value;
        munsellValue.classList.remove('out-of-gamut');
        activeColorPreview.classList.remove('out-of-gamut');
    }

    magnifier.style.display = 'block';
    // Clamp magnifier to viewport so it never goes off-screen
    const mw = 120, mh = 120, pad = 5;
    magnifier.style.left = `${Math.min(window.innerWidth - mw - pad, Math.max(pad, clientX - 60))}px`;
    magnifier.style.top = `${Math.min(window.innerHeight - mh - pad, Math.max(pad, clientY - 145))}px`;
    magnifier.style.backgroundSize = `${canvas.width * LOUPE_ZOOM}px ${canvas.height * LOUPE_ZOOM}px`;
    magnifier.style.backgroundPosition = `-${x * LOUPE_ZOOM - 60}px -${y * LOUPE_ZOOM - 60}px`;
}

function getAveragePixel(centerX, centerY, radius) {
    const x0 = Math.max(0, centerX - radius);
    const y0 = Math.max(0, centerY - radius);
    const x1 = Math.min(canvas.width - 1, centerX + radius);
    const y1 = Math.min(canvas.height - 1, centerY + radius);

    const width = x1 - x0 + 1;
    const height = y1 - y0 + 1;
    const data = sampleCtx.getImageData(x0, y0, width, height).data;

    let r = 0, g = 0, b = 0;
    const total = width * height;
    for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
    }
    return [Math.round(r / total), Math.round(g / total), Math.round(b / total)];
}

function getNearestMunsell(r, g, b) {
    if (!libraryOk) return { value: null, outOfGamut: false, libError: true };
    try {
        // Signature: rgb255ToMunsell(r, g, b, rgbSpace, digits, threshold, maxIter, ifReachMax, factor)
        // ifReachMax='clamp' returns nearest in-gamut color instead of throwing
        const value = munsell.rgb255ToMunsell(r, g, b, undefined, 1, 1e-6, 200, 'clamp');
        return { value, outOfGamut: false, libError: false };
    } catch (e) {
        console.warn(`[munsell] rgb255ToMunsell([${r},${g},${b}]) threw:`, e?.message ?? e);
        return { value: null, outOfGamut: true, libError: false };
    }
}

// ===== Sample management =====
function saveSample() {
    if (!currentRGB) {
        alert('Load an image and select a color by clicking on it first.');
        return;
    }

    const rawPercent = parseFloat(percentValue.value);
    const percent = isNaN(rawPercent) ? 0 : Math.min(100, Math.max(0, Math.round(rawPercent)));
    percentValue.value = percent;

    const type = featureType.value;
    const libError = munsellValue.textContent === '⚠ Library not loaded';
    const outOfGamut = !libError && munsellValue.classList.contains('out-of-gamut');
    const munsellName = (outOfGamut || libError) ? null : munsellValue.textContent;

    samples.push({
        id: Date.now(),
        number: samples.length + 1,
        x: crosshair.x,
        y: crosshair.y,
        type,
        munsell: munsellName,
        outOfGamut,
        percent,
        rgb: `rgb(${currentRGB.join(',')})`
    });

    updateTable();
    redrawCanvas();
    saveToStorage();
}

function updateTable() {
    tableBody.innerHTML = '';
    samples.forEach((sample) => {
        const tr = document.createElement('tr');

        const numTd = document.createElement('td');
        numTd.textContent = sample.number;

        const typeTd = document.createElement('td');
        typeTd.textContent = sample.type;

        const munsellTd = document.createElement('td');
        const swatch = document.createElement('span');
        swatch.style.cssText = `display:inline-block;width:12px;height:12px;background:${sample.rgb};border-radius:2px;margin-right:5px;`;
        if (sample.outOfGamut) swatch.style.border = '1.5px dashed #e65100';
        munsellTd.appendChild(swatch);
        if (sample.outOfGamut) {
            const warn = document.createElement('span');
            warn.className = 'out-of-gamut';
            warn.textContent = '⚠ Out of gamut';
            munsellTd.appendChild(warn);
        } else {
            munsellTd.appendChild(document.createTextNode(sample.munsell || ''));
        }

        const percentTd = document.createElement('td');
        percentTd.textContent = `${sample.percent}%`;

        const actionTd = document.createElement('td');
        const btn = document.createElement('button');
        btn.className = 'delete-btn';
        btn.textContent = '✕';
        btn.addEventListener('click', () => deleteSample(sample.id));
        actionTd.appendChild(btn);

        tr.append(numTd, typeTd, munsellTd, percentTd, actionTd);
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
    if (samples.length === 0) {
        alert('No samples recorded. Save at least one sample before generating a report.');
        return;
    }
    if (!window.jspdf) {
        alert('PDF library (jsPDF) failed to load. Check your internet connection and reload the page.');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const sampleId = sampleIdInput.value.trim() || 'Unnamed_Sample';
        const pageH = doc.internal.pageSize.getHeight();

        doc.setFontSize(22);
        doc.text('Soil Color Analysis Report', 20, 20);

        doc.setFontSize(12);
        doc.text(`Project: ${projectNameInput.value || 'N/A'}`, 20, 35);
        doc.text(`Site: ${siteNameInput.value || 'N/A'}`, 20, 42);
        doc.text(`Sample ID: ${sampleId}`, 20, 49);
        doc.text(`Location: ${metadata.lat || 'N/A'}, ${metadata.lng || 'N/A'}`, 20, 56);
        doc.text(`Date: ${metadata.date || 'N/A'}`, 20, 63);

        let nextY = 70;
        if (baseImage) {
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            const imgH = Math.min((canvas.height * 170) / canvas.width, pageH - 90);
            doc.addImage(imgData, 'JPEG', 20, 70, 170, imgH);
            nextY = 70 + imgH + 10;
        }

        if (nextY + 20 > pageH - 15) {
            doc.addPage();
            nextY = 20;
        }

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Samples:', 20, nextY);
        doc.setFont(undefined, 'normal');
        nextY += 8;

        const lineH = 7;
        for (const sample of samples) {
            if (nextY + lineH > pageH - 15) {
                doc.addPage();
                nextY = 20;
            }
            const munsellStr = sample.outOfGamut ? 'Out of gamut' : (sample.munsell || 'N/A');
            doc.text(`${sample.number}. ${sample.type}: ${munsellStr} (${sample.percent}%)`, 20, nextY);
            nextY += lineH;
        }

        doc.save(`${sampleId}_SoilReport.pdf`);
    } catch (e) {
        console.error('[pdf] Generation failed:', e);
        alert(`PDF generation failed: ${e.message}`);
    }
}

function exportCSV() {
    if (samples.length === 0) { alert('No samples to export.'); return; }
    const escape = v => `"${String(v).replace(/"/g, '""')}"`;
    const header = ['#', 'Type', 'Munsell', 'Percent', 'RGB', 'Out of Gamut'];
    const rows = samples.map(s => [s.number, s.type, s.munsell || '', s.percent, s.rgb, s.outOfGamut]);
    const csv = [header, ...rows].map(r => r.map(escape).join(',')).join('\n');
    downloadFile(csv, 'text/csv', `${sampleIdInput.value.trim() || 'samples'}.csv`);
}

function exportJSON() {
    if (samples.length === 0) { alert('No samples to export.'); return; }
    const data = {
        sampleId: sampleIdInput.value,
        site: siteNameInput.value,
        project: projectNameInput.value,
        location: metadata,
        samples: samples.map(({ id, number, type, munsell, percent, rgb, outOfGamut }) =>
            ({ id, number, type, munsell, percent, rgb, outOfGamut }))
    };
    downloadFile(JSON.stringify(data, null, 2), 'application/json', `${sampleIdInput.value.trim() || 'samples'}.json`);
}

function downloadFile(content, mimeType, filename) {
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
