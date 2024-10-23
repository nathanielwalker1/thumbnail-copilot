document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const errorMessage = document.getElementById('errorMessage');
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="spinner"></div>';
    loadingOverlay.style.display = 'none'; // Hide by default
    document.body.appendChild(loadingOverlay);

    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas && canvas.getContext('2d');
    let currentImage = null;
    let originalImage = null;
    let currentAspectRatio = '16:9';

    const sliders = {
        brightness: document.getElementById('brightness'),
        contrast: document.getElementById('contrast'),
        saturation: document.getElementById('saturation'),
        sharpness: document.getElementById('sharpness')
    };

    const sliderValues = {
        brightness: document.getElementById('brightnessValue'),
        contrast: document.getElementById('contrastValue'),
        saturation: document.getElementById('saturationValue'),
        sharpness: document.getElementById('sharpnessValue')
    };

    let adjustments = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sharpness: 0
    };

    let isAdjusting = false;
    let adjustmentTimeout = null;

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                if (validateFile(file)) {
                    uploadImage(file);
                } else {
                    showError('Invalid file type. Please upload a PNG, JPG, or JPEG image.');
                }
            }
        });
    }

    if (canvas) {
        const resizeButtons = document.querySelectorAll('.resize-btn');
        resizeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const ratio = button.textContent.includes('16:9') ? '16:9' : '4:3';
                setAspectRatio(ratio);
            });
        });

        // Load the image if we're on the editor page
        const storedImageData = sessionStorage.getItem('uploadedImage');
        if (storedImageData) {
            const arrayBuffer = new Uint8Array(storedImageData.split(',').map(Number)).buffer;
            const blob = new Blob([arrayBuffer]);
            const url = URL.createObjectURL(blob);
            loadImage(url);
        } else {
            hideLoading();
        }

        Object.keys(sliders).forEach(key => {
            const slider = sliders[key];
            const valueDisplay = sliderValues[key];

            slider.addEventListener('input', (e) => {
                adjustments[key] = parseInt(e.target.value);
                valueDisplay.textContent = adjustments[key];
                isAdjusting = true;
                clearTimeout(adjustmentTimeout);
                adjustmentTimeout = setTimeout(() => {
                    isAdjusting = false;
                    applyAdjustments();
                }, 100);
            });

            slider.addEventListener('change', () => {
                isAdjusting = false;
                applyAdjustments();
            });
        });
    }

    function validateFile(file) {
        const acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        return acceptedTypes.includes(file.type);
    }

    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        } else {
            console.error(message);
        }
    }

    function uploadImage(file) {
        showLoading();

        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            const uint8Array = new Uint8Array(arrayBuffer);
            sessionStorage.setItem('uploadedImage', uint8Array.toString());
            hideLoading();
            window.location.href = 'editor.html';
        };
        reader.onerror = function() {
            hideLoading();
            showError('Failed to read the file. Please try again.');
        };
        reader.readAsArrayBuffer(file);
    }

    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    function loadImage(url) {
        showLoading();
        currentImage = new Image();
        currentImage.onload = () => {
            hideLoading();
            originalImage = currentImage;
            setAspectRatio(currentAspectRatio);
        };
        currentImage.onerror = () => {
            hideLoading();
            showError('Failed to load the image. Please try uploading again.');
        };
        currentImage.src = url;
    }

    function setAspectRatio(ratio) {
        currentAspectRatio = ratio;
        if (originalImage && canvas) {
            const [width, height] = calculateDimensions(originalImage, ratio);
            canvas.width = width;
            canvas.height = height;
            applyAdjustments();
        }
    }

    function applyAdjustments() {
        if (!originalImage || !canvas || isAdjusting) return;

        requestAnimationFrame(() => {
            const [width, height] = calculateDimensions(originalImage, currentAspectRatio);
            canvas.width = width;
            canvas.height = height;

            ctx.filter = `brightness(${100 + adjustments.brightness}%) ` +
                         `contrast(${100 + adjustments.contrast}%) ` +
                         `saturate(${100 + adjustments.saturation}%)`;

            ctx.drawImage(originalImage, 0, 0, width, height);

            // Apply sharpness (unsharp masking)
            if (adjustments.sharpness !== 0) {
                const imageData = ctx.getImageData(0, 0, width, height);
                const sharpenedData = applySharpen(imageData, adjustments.sharpness);
                ctx.putImageData(sharpenedData, 0, 0);
            }
        });
    }

    function applySharpen(imageData, amount) {
        const w = imageData.width;
        const h = imageData.height;
        const data = imageData.data;
        const buffer = new Uint8ClampedArray(data);
        const kernel = [
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0]
        ];
        const factor = 1 + (amount / 100);

        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const idx = (y * w + x) * 4;
                for (let c = 0; c < 3; c++) {
                    let val = 0;
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const kdx = ((y + ky) * w + (x + kx)) * 4 + c;
                            val += data[kdx] * kernel[ky + 1][kx + 1];
                        }
                    }
                    buffer[idx + c] = Math.min(255, Math.max(0, data[idx + c] + (val - data[idx + c]) * factor));
                }
            }
        }

        return new ImageData(buffer, w, h);
    }

    function calculateDimensions(image, ratio) {
        const [targetWidth, targetHeight] = ratio.split(':').map(Number);
        const scale = Math.min(800 / image.width, 600 / image.height);
        let width = image.width * scale;
        let height = image.height * scale;

        if (width / height > targetWidth / targetHeight) {
            width = height * (targetWidth / targetHeight);
        } else {
            height = width / (targetWidth / targetHeight);
        }

        return [width, height];
    }
});
