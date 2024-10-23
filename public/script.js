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
    let currentAspectRatio = '16:9';

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
        if (currentImage && canvas) {
            const [width, height] = calculateDimensions(currentImage, ratio);
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(currentImage, 0, 0, width, height);
        }
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
