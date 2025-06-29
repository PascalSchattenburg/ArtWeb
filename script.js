const video = document.getElementById('video');
const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const saveButton = document.getElementById('save-button');
const captureButton = document.getElementById('capture-button');
const gallery = document.getElementById('gallery');

const filters = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    invert: 0,
};

// Kamera starten
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => video.srcObject = stream)
    .catch(err => alert('Kamera-Zugriff verweigert'));

// Foto aufnehmen
captureButton.addEventListener('click', () => {
    applyFiltersToContext(ctx); // Filter auf Canvas anwenden
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
});

// Filter ändern
document.querySelectorAll('#controls input[type=range]').forEach(slider => {
    slider.addEventListener('input', () => {
        filters[slider.id] = slider.value;
        applyCSSFilters(); // Vorschau anpassen
    });
});

// CSS Vorschau (visuell)
function applyCSSFilters() {
    canvas.style.filter = `
    brightness(${filters.brightness}%)
    contrast(${filters.contrast}%)
    saturate(${filters.saturation}%)
    grayscale(${filters.grayscale}%)
    sepia(${filters.sepia}%)
    invert(${filters.invert}%)
  `;
}
applyCSSFilters(); // Init

// Canvas-Kontext-Filter anwenden (für Speicherung)
function applyFiltersToContext(context) {
    context.filter = `
    brightness(${filters.brightness}%)
    contrast(${filters.contrast}%)
    saturate(${filters.saturation}%)
    grayscale(${filters.grayscale}%)
    sepia(${filters.sepia}%)
    invert(${filters.invert}%)
  `;
}

// Bild speichern in LocalStorage und anzeigen
saveButton.addEventListener('click', () => {
    // Neuen Canvas mit echten Filtern rendern
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const finalCtx = finalCanvas.getContext('2d');
    applyFiltersToContext(finalCtx);
    finalCtx.drawImage(canvas, 0, 0);

    const imageData = finalCanvas.toDataURL(); // PNG mit Filtern

    // In Galerie speichern
    let images = JSON.parse(localStorage.getItem('galleryImages') || '[]');
    images.push(imageData);
    localStorage.setItem('galleryImages', JSON.stringify(images));

    // Galerie neu laden
    loadGallery();
});

// Galerie laden
function loadGallery() {
    gallery.innerHTML = ''; // leeren
    const images = JSON.parse(localStorage.getItem('galleryImages') || '[]');
    images.forEach((dataUrl, index) => {
        const img = document.createElement('img');
        img.src = dataUrl;
        img.width = 100;

        const downloadBtn = document.createElement('a');
        downloadBtn.href = dataUrl;
        downloadBtn.download = `webart-${index}.png`;
        downloadBtn.textContent = '⬇️';

        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑️';
        delBtn.onclick = () => {
            images.splice(index, 1);
            localStorage.setItem('galleryImages', JSON.stringify(images));
            loadGallery();
        };

        const container = document.createElement('div');
        container.appendChild(img);
        container.appendChild(downloadBtn);
        container.appendChild(delBtn);
        gallery.appendChild(container);
    });
}

loadGallery(); // beim Start laden