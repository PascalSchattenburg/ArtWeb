// ----- script.js -----
let isRecording = false;
let useFrontCamera = true;
let currentStream = null;
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

// 1) Kamera starten mit Umschalt-Möglichkeit
function startCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
  const constraints = {
    video: { facingMode: useFrontCamera ? 'user' : 'environment' },
    audio: false
  };
  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      currentStream = stream;
      video.srcObject = stream;
    })
    .catch(err => alert('Kamera-Fehler: ' + err.message));
}
// Initiale Kamera
startCamera();

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
  const items = JSON.parse(localStorage.getItem('galleryItems') || '[]');
  items.push({ type: 'image', src: dataURL });
  localStorage.setItem('galleryItems', JSON.stringify(items));
  loadGallery();
});

// Kamera umschalten
const btnToggle = document.getElementById('toggle-camera');
if (btnToggle) {
  btnToggle.addEventListener('click', () => {
    useFrontCamera = !useFrontCamera;
    startCamera();
  });
}

// 6) Galerie laden
function loadGallery() {
    gallery.innerHTML = '';
    const items = JSON.parse(localStorage.getItem('galleryItems') || '[]');
    items.forEach((item, idx) => {
        const div = document.createElement('div');
        div.style.textAlign = 'center';
        div.style.margin = '5px';

        let thumb;
        if (item.type === 'image') {
            thumb = document.createElement('img');
            thumb.src = item.src;
            thumb.width = 100;
        } else {
            thumb = document.createElement('video');
            thumb.src = item.src;
            thumb.width = 100;
            thumb.muted = true;
            thumb.loop = true;
            thumb.play();
        }
        thumb.style.cursor = 'pointer';
        thumb.onclick = () => openLightbox(idx);
        div.appendChild(thumb);
        gallery.appendChild(div);
    });
}
loadGallery();

// 7) Video aufnehmen & Download-Link erstellen
recButton.addEventListener('click', () => {
  applyFilters(); // stell sicher, dass das Canvas up-to-date ist

  if (!isRecording) {
    if (typeof MediaRecorder === 'undefined') {
      return alert('Videoaufnahme nicht unterstützt');
    }
    chunks = [];

    // verfügbares Format wählen
    const supported = [
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    const mimeType = supported.find(t => MediaRecorder.isTypeSupported(t));
    if (!mimeType) {
      return alert('Kein unterstütztes Videoformat gefunden');
    }

    // benutze den Live-Video-Stream, nicht canvas.captureStream()
    const stream = video.srcObject;
    recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url  = URL.createObjectURL(blob);
      playback.src = url;

      const items = JSON.parse(localStorage.getItem('galleryItems') || '[]');
      items.push({ type: 'video', src: url });
      localStorage.setItem('galleryItems', JSON.stringify(items));
      loadGallery();

      // Download-Link updaten
      let dl = document.getElementById('download-video');
      if (dl) dl.remove();
      dl = document.createElement('a');
      dl.id       = 'download-video';
      dl.href     = url;
      dl.download = mimeType.startsWith('video/mp4') ? 'recording.mp4' : 'recording.webm';
      dl.textContent = '⬇️ Download Video';
      dl.style.display = 'block';
      dl.style.textAlign = 'center';
      dl.style.margin = '10px auto';
      playback.insertAdjacentElement('afterend', dl);
    };

    recorder.start();
    isRecording = true;
    recButton.textContent = '⏹️ Stop Recording';
  } else {
    recorder.stop();
    isRecording = false;
    recButton.textContent = '⏺️ Record Video';
  }
});

let currentIndex = 0;

function openLightbox(idx) {
    const lightbox = document.getElementById('lightbox');
    currentIndex = idx;
    showItem(idx);
    lightbox.style.display = 'block';
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
    document.getElementById('lightbox-content').innerHTML = '';
}

function showItem(idx) {
    const items = JSON.parse(localStorage.getItem('galleryItems') || '[]');
    const item = items[idx];
    const container = document.getElementById('lightbox-content');
    container.innerHTML = '';
    if (item.type === 'image') {
        const img = document.createElement('img');
        img.src = item.src;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        container.appendChild(img);
    } else {
        const vid = document.createElement('video');
        vid.src = item.src;
        vid.controls = true;
        vid.style.maxWidth = '100%';
        vid.style.maxHeight = '100%';
        container.appendChild(vid);
    }
}

document.getElementById('lightbox-close').onclick = closeLightbox;
document.getElementById('lightbox-prev').onclick = () => {
    const items = JSON.parse(localStorage.getItem('galleryItems') || '[]');
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    showItem(currentIndex);
};
document.getElementById('lightbox-next').onclick = () => {
    const items = JSON.parse(localStorage.getItem('galleryItems') || '[]');
    currentIndex = (currentIndex + 1) % items.length;
    showItem(currentIndex);
};

// Swipe support for mobile
let startX = null;
const lbContent = document.getElementById('lightbox-content');
lbContent.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
lbContent.addEventListener('touchend', e => {
    if (startX === null) return;
    const delta = e.changedTouches[0].clientX - startX;
    if (delta > 50) document.getElementById('lightbox-prev').onclick();
    else if (delta < -50) document.getElementById('lightbox-next').onclick();
    startX = null;
});