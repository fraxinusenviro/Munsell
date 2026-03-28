import * as munsell from 'https://cdn.skypack.dev/munsell@1.1.6';

let libraryOk = false;

(function verifyMunsellLibrary() {
    try {
        if (typeof munsell.rgb255ToMunsell !== 'function') {
            throw new Error('rgb255ToMunsell not found. Exports: ' + Object.keys(munsell).join(', '));
        }
        libraryOk = true;
        console.info('[munsell] Library OK. Exports:', Object.keys(munsell).join(', '));
        try {
            // Diagnostic test only — failure here does NOT mark library as broken
            console.info('[munsell] Test conversion [120,85,55]:', munsell.rgb255ToMunsell([120, 85, 55]));
        } catch (testErr) {
            console.warn('[munsell] Test call threw (may be out of gamut):', testErr.message);
        }
    } catch (e) {
        console.error('[munsell] Library failed to load:', e);
        const banner = document.getElementById('lib-warning');
        if (banner) banner.style.display = 'block';
    }
})();

const canvas = document.getElementById('image-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// Offscreen canvas used exclusively for sampling — never has crosshair or markers painted on it
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

let samples = [];
let currentRGB = null;
let metadata = { lat: '', lng: '', date: '' };
let baseImage = null;
let crosshair = { x: null, y: null };
let pixelSize = 6;
let smoothingEnabled = false;

const LOUPE_SAMPLE_RADIUS = 0;
const LOUPE_ZOOM = 4;

openFileBtn.addEventListener('click', () => fileInput.click());
openGalleryBtn.addEventListener('click', () => fileInputGallery.click());
fileInput.addEventListener('change', onFileChange);
fileInputGallery.addEventListener('change', onFileChange);

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

async function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
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
            updateSelectionAt(crosshair.x, crosshair.y, canvas.getBoundingClientRect().left + crosshair.x, canvas.getBoundingClientRect().top + crosshair.y);
        };
        img.src = event.target.result;
    };

    reader.readAsDataURL(file);
}

function drawPixelated() {
    if (!smoothingEnabled) {
        ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
        sampleCtx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
        return;
    }

    // Downscale to block resolution (bilinear avg), then paint each block as a solid rect
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
    if (!baseImage) {
        return;
    }

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

        // outer dark ring for contrast
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // inner white ring
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // sample number centered in circle
        ctx.shadowBlur = 4;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(s.number), s.x, s.y);

        // Munsell label below circle
        ctx.font = '10px sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText(s.outOfGamut ? '⚠ OOG' : s.munsell, s.x, s.y + r + 4);

        ctx.restore();
    });
}

function handleSampling(e) {
    const rect = canvas.getBoundingClientRect();
    const rawX = (e.clientX || e.pageX) - rect.left;
    const rawY = (e.clientY || e.pageY) - rect.top;

    const x = Math.floor(rawX);
    const y = Math.floor(rawY);

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
    magnifier.style.left = `${clientX - 60}px`;
    magnifier.style.top = `${clientY - 145}px`;
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

    let r = 0;
    let g = 0;
    let b = 0;
    const totalPixels = width * height;

    for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
    }

    return [
        Math.round(r / totalPixels),
        Math.round(g / totalPixels),
        Math.round(b / totalPixels)
    ];
}

function getNearestMunsell(r, g, b) {
    if (!libraryOk) {
        return { value: null, outOfGamut: false, libError: true };
    }
    try {
        // clamp=true returns nearest in-gamut Munsell color instead of throwing
        const value = munsell.rgb255ToMunsell([r, g, b], undefined, true);
        return { value, outOfGamut: false, libError: false };
    } catch (e) {
        console.warn(`[munsell] rgb255ToMunsell([${r},${g},${b}]) threw:`, e?.message ?? e);
        return { value: null, outOfGamut: true, libError: false };
    }
}

function saveSample() {
    if (!currentRGB) {
        alert('Select a color first!');
        return;
    }

    const type = featureType.value;
    const libError = munsellValue.textContent === '⚠ Library not loaded';
    const outOfGamut = !libError && munsellValue.classList.contains('out-of-gamut');
    const munsellName = (outOfGamut || libError) ? null : munsellValue.textContent;
    const percent = percentValue.value || 0;

    const sample = {
        id: Date.now(),
        number: samples.length + 1,
        x: crosshair.x,
        y: crosshair.y,
        type,
        munsell: munsellName,
        outOfGamut,
        percent,
        rgb: `rgb(${currentRGB.join(',')})`
    };

    samples.push(sample);
    updateTable();
    redrawCanvas();
}

function updateTable() {
    tableBody.innerHTML = '';

    samples.forEach((sample) => {
        const munsellCell = sample.outOfGamut
            ? `<span class="out-of-gamut">⚠ Out of gamut</span>`
            : `${sample.munsell}`;
        const row = `<tr>
            <td>${sample.number}</td>
            <td>${sample.type}</td>
            <td><span style="display:inline-block;width:12px;height:12px;background:${sample.rgb};border-radius:2px;margin-right:5px;${sample.outOfGamut ? 'border:1.5px dashed #e65100;' : ''}"></span>${munsellCell}</td>
            <td>${sample.percent}%</td>
            <td><button class="delete-btn" onclick="deleteSample(${sample.id})">✕</button></td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

function deleteSample(id) {
    samples = samples.filter((sample) => sample.id !== id);
    samples = samples.map((s, i) => ({ ...s, number: i + 1 }));
    updateTable();
    redrawCanvas();
}

async function generateReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const sampleId = sampleIdInput.value || 'Unnamed_Sample';

    doc.setFontSize(22);
    doc.text('Soil Color Analysis Report', 20, 20);

    doc.setFontSize(12);
    doc.text(`Project: ${projectNameInput.value}`, 20, 35);
    doc.text(`Site: ${siteNameInput.value}`, 20, 42);
    doc.text(`Sample ID: ${sampleId}`, 20, 49);
    doc.text(`Location: ${metadata.lat}, ${metadata.lng}`, 20, 56);
    doc.text(`Date: ${metadata.date}`, 20, 63);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    tempCtx.fillStyle = 'rgba(0,0,0,0.6)';
    tempCtx.fillRect(10, 10, 250, 80);
    tempCtx.fillStyle = 'white';
    tempCtx.font = '16px Arial';
    tempCtx.fillText(`ID: ${sampleId}`, 20, 30);

    let yOffset = 50;
    samples.forEach((sample) => {
        tempCtx.fillText(`${sample.number}. ${sample.type}: ${sample.munsell} (${sample.percent}%)`, 20, yOffset);
        yOffset += 20;
    });

    const imgData = tempCanvas.toDataURL('image/jpeg', 0.8);
    doc.addImage(imgData, 'JPEG', 20, 75, 170, (canvas.height * 170) / canvas.width);

    doc.save(`${sampleId}_SoilReport.pdf`);
}
