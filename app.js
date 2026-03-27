import * as munsell from 'https://cdn.jsdelivr.net/npm/munsell/+esm';

const canvas = document.getElementById('image-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const magnifier = document.getElementById('magnifier');
const fileInput = document.getElementById('fileInput');
const openFileBtn = document.getElementById('open-file-btn');

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

let samples = [];
let currentRGB = null;
let metadata = { lat: '', lng: '', date: '' };
let baseImage = null;
let crosshair = { x: null, y: null };

const LOUPE_SAMPLE_RADIUS = 3;
const LOUPE_ZOOM = 4;

openFileBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', onFileChange);

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

function redrawCanvas() {
    if (!baseImage) {
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

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
    rgbValue.innerText = `${rgbText} · avg ${(LOUPE_SAMPLE_RADIUS * 2 + 1)}x${(LOUPE_SAMPLE_RADIUS * 2 + 1)}`;
    munsellValue.innerText = getNearestMunsell(avgPixel[0], avgPixel[1], avgPixel[2]);

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
    const data = ctx.getImageData(x0, y0, width, height).data;

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
    try {
        return munsell.rgb255ToMunsell([r, g, b]);
    } catch {
        return 'Unknown (Manual lookup required)';
    }
}

function saveSample() {
    if (!currentRGB) {
        alert('Select a color first!');
        return;
    }

    const type = featureType.value;
    const munsellName = munsellValue.innerText;
    const percent = percentValue.value || 0;

    const sample = {
        id: Date.now(),
        type,
        munsell: munsellName,
        percent,
        rgb: `rgb(${currentRGB.join(',')})`
    };

    samples.push(sample);
    updateTable();
}

function updateTable() {
    tableBody.innerHTML = '';

    samples.forEach((sample) => {
        const row = `<tr>
            <td>${sample.type}</td>
            <td><span style="display:inline-block;width:12px;height:12px;background:${sample.rgb};margin-right:5px"></span>${sample.munsell}</td>
            <td>${sample.percent}%</td>
            <td><button class="delete-btn" onclick="deleteSample(${sample.id})">✕</button></td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

function deleteSample(id) {
    samples = samples.filter((sample) => sample.id !== id);
    updateTable();
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
        tempCtx.fillText(`${sample.type}: ${sample.munsell} (${sample.percent}%)`, 20, yOffset);
        yOffset += 20;
    });

    const imgData = tempCanvas.toDataURL('image/jpeg', 0.8);
    doc.addImage(imgData, 'JPEG', 20, 75, 170, (canvas.height * 170) / canvas.width);

    doc.save(`${sampleId}_SoilReport.pdf`);
}
