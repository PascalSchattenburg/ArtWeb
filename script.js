const captureButton = document.getElementById('capture-button');
const imageContainer = document.getElementById('image-container');
const editorCanvas = document.getElementById('editor-canvas');
const saveButton = document.getElementById('save-button');

// Set up event listeners for buttons
captureButton.addEventListener('click', takePicture);
saveButton.addEventListener('click', saveChanges);

let image;
let editing = false;

function takePicture() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();

            // Get the first frame of the video
            const img = document.createElement('img');
            img.width = 200;
            img.height = 150;
            img.src = video.currentTime * (10 / 30) + 's';
            img.onload = function() {
                image = this;
                imageContainer.innerHTML = '';
                imageContainer.appendChild(img);
            };

        })
        .catch(error => console.error('Error taking picture:', error));
}

function saveChanges() {
    if (!image) return;

    // Create a new canvas element
    const newCanvas = document.createElement('canvas');
    newCanvas.width = image.width;
    newCanvas.height = image.height;
    const ctx = newCanvas.getContext('2d');

    // Draw the original image
    ctx.drawImage(image, 0, 0);

    // Add event listeners for editing
    editorCanvas.addEventListener('mousedown', startEditing);
    editorCanvas.addEventListener('mousemove', editImage);
    editorCanvas.addEventListener('mouseup', stopEditing);

    // Set up variables to track editing state
    let drawing = false;
    let lastX, lastY;

    function startEditing(event) {
        if (!drawing) {
            drawing = true;
            lastX = event.clientX - editorCanvas.offsetLeft;
            lastY = event.clientY - editorCanvas.offsetTop;
        }
    }

    function editImage(event) {
        if (drawing) {
            const x = event.clientX - editorCanvas.offsetLeft;
            const y = event.clientY - editorCanvas.offsetTop;

            // Draw a line from the previous position to the current position
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Update the last position
            lastX = x;
            lastY = y;
        }
    }

    function stopEditing() {
        drawing = false;

        // Draw a line from the previous position to the new position (to "save" changes)
        if (lastX !== undefined && lastY !== undefined) {
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(editorCanvas.offsetLeft + editorCanvas.width / 2,
                editorCanvas.offsetTop + editorCanvas.height / 2);
            ctx.stroke();
        }
    }

    // Draw the new canvas on top of the original image
    const overlay = document.createElement('canvas');
    overlay.width = newCanvas.width;
    overlay.height = newCanvas.height;
    overlay.style.position = 'absolute';
    overlay.style.top = '0px';
    overlay.style.left = '0px';
    overlay.style.zIndex = '1';

    const ctxOverlay = overlay.getContext('2d');

    // Clone the original image and add the edited version
    ctxOverlay.drawImage(newCanvas, 0, 0);
    ctxOverlay.drawImage(image, 0, 0);

    overlay.appendChild(ctxOverlay);

    // Update the canvas with the new overlay
    imageContainer.innerHTML = '';
    imageContainer.appendChild(overlay);
}