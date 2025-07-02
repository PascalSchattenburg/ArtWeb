// ----- script.js -----
const video      = document.getElementById('video');
const canvas     = document.getElementById('editor-canvas');
const ctx        = canvas.getContext('2d');
const btnCapture = document.getElementById('capture-button');
const btnSave    = document.getElementById('save-button');
const recButton  = document.getElementById('rec-button');
const playback   = document.getElementById('playback');
const gallery    = document.getElementById('gallery');

const filters = {
    brightness: 100,
    contrast:   100,
    saturation: 100,
    grayscale:   0,
    sepia:       0,
    invert:      0
};

let originalImage = null;
let recorder, chunks = [];

// 1) Kamera starten
navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => video.srcObject = stream)
    .catch(err => alert('Kamera-Fehler: ' + err.message));

// 2) Bild aufnehmen
btnCapture.addEventListener('click', () => {
    // Rohbild ohne Filter ins Canvas malen
    ctx.filter = 'none';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Als Image laden
    const dataUrl = canvas.toDataURL();
    originalImage = new Image();
    originalImage.onload = applyFilters;
    originalImage.src = dataUrl;
});

// 3) Regler abonnieren
document.querySelectorAll('#controls input[type=range]').forEach(slider => {
    slider.addEventListener('input', () => {
        filters[slider.id] = slider.value;
        applyFilters();
    });
});

// 4) Filter anwenden und Canvas neu zeichnen
function applyFilters() {
    if (!originalImage) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.filter = `
    brightness(${filters.brightness}%)
    contrast(${filters.contrast}%)
    saturate(${filters.saturation}%)
    grayscale(${filters.grayscale}%)
    sepia(${filters.sepia}%)
    invert(${filters.invert}%)
  `;
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
}

// 5) Gefiltertes Bild speichern
btnSave.addEventListener('click', () => {
    if (!originalImage) {
        alert('Bitte zuerst ein Bild aufnehmen!');
        return;
    }
    applyFilters();  // sicherstellen, dass Canvas aktuell ist

    const dataURL = canvas.toDataURL();
    const images = JSON.parse(localStorage.getItem('galleryImages') || '[]');
    images.push(dataURL);
    localStorage.setItem('galleryImages', JSON.stringify(images));
    loadGallery();
});

// 6) Galerie laden
function loadGallery() {
    gallery.innerHTML = '';
    const images = JSON.parse(localStorage.getItem('galleryImages') || '[]');
    images.forEach((src, idx) => {
        const div = document.createElement('div');
        div.style.textAlign = 'center';
        div.style.margin = '5px';

        const img = document.createElement('img');
        img.src = src;
        img.width = 100;

        const dl = document.createElement('a');
        dl.href = src;
        dl.download = `webart-${idx}.png`;
        dl.textContent = '⬇️';
        dl.style.display = 'block';
        dl.style.marginTop = '4px';

        const del = document.createElement('button');
        del.textContent = '🗑️';
        del.style.fontSize = '12px';
        del.style.padding = '4px 8px';
        del.onclick = () => {
            const imgs = JSON.parse(localStorage.getItem('galleryImages') || '[]');
            imgs.splice(idx, 1);
            localStorage.setItem('galleryImages', JSON.stringify(imgs));
            loadGallery();
        };

        div.append(img, dl, del);
        gallery.appendChild(div);
    });
}
loadGallery();

// 7) Video aufnehmen & Download-Link erstellen
recButton.addEventListener('click', () => {
    if (recButton.textContent === '⏺️ Record Video') {
        chunks = [];
        const stream = canvas.captureStream(30);
        recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url  = URL.createObjectURL(blob);
            playback.src = url;

            // Download-Link
            let dl = document.getElementById('download-video');
            if (dl) dl.remove();
            dl = document.createElement('a');
            dl.id = 'download-video';
            dl.href = url;
            dl.download = 'recording.webm';
            dl.textContent = '⬇️ Download Video';
            dl.style.display = 'block';
            dl.style.textAlign = 'center';
            dl.style.margin = '10px auto';
            playback.insertAdjacentElement('afterend', dl);
        };
        recorder.start();
        recButton.textContent = '⏹️ Stop Recording';
    } else {
        recorder.stop();
        recButton.textContent = '⏺️ Record Video';
    }
});