document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const loadingOverlay = document.getElementById('loadingOverlay');

    const imageData = sessionStorage.getItem('uploadedImage');
    const analysisData = sessionStorage.getItem('imageAnalysis');

    // Initialize adjustments
    let adjustments = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sharpness: 0
    };

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
        const thoughtsSummary = document.getElementById('thoughts-summary'); // New element for thoughts

        // Check if elements exist
        console.log('Score Element:', scoreElement);
        console.log('Score Bar:', scoreBar);
        console.log('Composition List:', compositionList);
        console.log('Thoughts Summary Element:', thoughtsSummary);

        // Update score
        if (scoreElement && scoreBar) {
            const score = analysis.quality_score || 0; // Default to 0 if null
            scoreElement.textContent = `${score}/100`;
            scoreBar.style.width = `${score}%`;
        }

        // Prepare composition analysis items
        const items = [
            { label: 'Photo clarity', value: analysis.photo_clarity },
            { label: 'Focal Point', value: analysis.focal_point },
            { label: 'Brightness', value: analysis.brightness },
            { label: 'Contrast', value: analysis.contrast },
            { label: 'Saturation', value: analysis.saturation },
            { label: 'Sharpness', value: analysis.sharpness }
        ];

        // Sort items: Good first, then Bad
        const sortedItems = items.sort((a, b) => {
            const aStatus = getStatus(a.value);
            const bStatus = getStatus(b.value);
            return aStatus === 'good' ? -1 : bStatus === 'good' ? 1 : 0;
        });

        // Update composition analysis list
        if (compositionList) {
            compositionList.innerHTML = sortedItems.map(item => {
                const statusClass = getStatusClass(item.value);
                return `<li class="${statusClass}">${item.label}: ${item.value || 'Not analyzed'}</li>`;
            }).join('');
        }

        // Update Alex's thoughts
        if (thoughtsSummary) {
            thoughtsSummary.textContent = analysis.alex_thoughts || 'No thoughts available.';
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

    function getStatus(value) {
        if (!value) return 'unknown';
        const lowercase = value.toLowerCase();
        if (lowercase.includes('good') || lowercase.includes('strong')) return 'good';
        if (lowercase.includes('weak') || lowercase.includes('poor')) return 'bad';
        return 'unknown';
    }

    function getStatusClass(value) {
        if (!value) return 'warning';
        const status = getStatus(value);
        return status === 'good' ? 'good' : 'warning';
    }

    // Slider event listeners
    const sliders = {
        brightness: document.getElementById('brightness'),
        contrast: document.getElementById('contrast'),
        saturation: document.getElementById('saturation'),
        sharpness: document.getElementById('sharpness')
    };

    Object.keys(sliders).forEach(key => {
        const slider = sliders[key];
        slider.addEventListener('input', (e) => {
            adjustments[key] = parseInt(e.target.value);
            applyAdjustments(); // Apply adjustments in real-time
        });
    });

    function applyAdjustments() {
        if (!imageData) return; // Ensure image data is available

        const img = new Image();
        img.src = imageData; // Use the base64 data
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw the original image

            // Apply filters based on adjustments
            ctx.filter = `brightness(${100 + adjustments.brightness}%) ` +
                         `contrast(${100 + adjustments.contrast}%) ` +
                         `saturate(${100 + adjustments.saturation}%)`;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Redraw the image with adjustments
        };
    }
});
