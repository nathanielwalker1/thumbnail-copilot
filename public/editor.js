document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const loadingOverlay = document.getElementById('loadingOverlay');

    const imageData = sessionStorage.getItem('uploadedImage');
    const analysisData = sessionStorage.getItem('imageAnalysis');

    // Debug logs to check if elements exist
    console.log('Canvas Element:', canvas);
    console.log('Loading Overlay:', loadingOverlay);

    if (imageData) {
        loadImage(imageData);
    } else {
        console.error('No image data found in sessionStorage.');
        showError('No image uploaded. Please go back and upload an image.');
    }

    if (analysisData) {
        updateUIWithAnalysis(JSON.parse(analysisData));
    } else {
        console.warn('No analysis data found in sessionStorage.');
        showError('No analysis data available. Please try uploading again.');
    }

    function loadImage(data) {
        showLoading();
        const img = new Image();
        img.onload = () => {
            hideLoading();
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            console.log('Image loaded successfully');
        };
        img.onerror = () => {
            hideLoading();
            console.error('Failed to load the image.');
            showError('Failed to load the image. Please try uploading again.');
        };
        img.src = data; // Use the base64 data
    }

    function showLoading() {
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }

    function showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
    }

    function updateUIWithAnalysis(analysis) {
        console.log('Analysis data received:', analysis);

        const scoreElement = document.querySelector('.score-text');
        const scoreBar = document.querySelector('.score-progress');
        const compositionList = document.querySelector('.composition-analysis ul');

        // Check if elements exist
        console.log('Score Element:', scoreElement);
        console.log('Score Bar:', scoreBar);
        console.log('Composition List:', compositionList);

        // Update score
        if (scoreElement && scoreBar) {
            const score = analysis.quality_score || 0; // Default to 0 if null
            scoreElement.textContent = `${score}/100`;
            scoreBar.style.width = `${score}%`;
        }

        // Update composition analysis
        if (compositionList) {
            compositionList.innerHTML = `
                <li class="${getStatusClass(analysis.photo_clarity)}">Photo clarity: ${analysis.photo_clarity || 'Not analyzed'}</li>
                <li class="${getStatusClass(analysis.focal_point)}">Focal Point: ${analysis.focal_point || 'Not analyzed'}</li>
                <li class="${getStatusClass(analysis.brightness)}">Brightness: ${analysis.brightness || 'Not analyzed'}</li>
                <li class="${getStatusClass(analysis.contrast)}">Contrast: ${analysis.contrast || 'Not analyzed'}</li>
                <li class="${getStatusClass(analysis.saturation)}">Saturation: ${analysis.saturation || 'Not analyzed'}</li>
                <li class="${getStatusClass(analysis.sharpness)}">Sharpness: ${analysis.sharpness || 'Not analyzed'}</li>
            `;
        }

        // Enable auto-enhance and auto-circle buttons
        const autoEnhanceBtn = document.querySelector('.auto-enhance-btn');
        const circleProductBtn = document.querySelector('.circle-product-btn');
        if (autoEnhanceBtn) autoEnhanceBtn.disabled = false;
        if (circleProductBtn) circleProductBtn.disabled = false;

        // Update suggested text
        const suggestedTextBtn = document.querySelector('.suggested-text-btn');
        if (suggestedTextBtn) {
            suggestedTextBtn.textContent = analysis.suggested_text || 'No suggestion available';
        }
    }

    function getStatusClass(value) {
        if (!value) return 'warning';
        const lowercase = value.toLowerCase();
        if (lowercase.includes('good') || lowercase.includes('strong')) return 'good';
        if (lowercase.includes('slightly')) return 'warning';
        return 'warning';
    }
});
