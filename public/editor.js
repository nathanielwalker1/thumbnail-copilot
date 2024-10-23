document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); // Optimize for read operations
    const loadingOverlay = document.getElementById('loadingOverlay');
    const autoEnhanceBtn = document.querySelector('.auto-enhance-btn');
    const resetBtn = document.querySelector('.reset-btn');

    // Initialize state
    let originalImage = null; // Store the original image
    let adjustments = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sharpness: 0
    };

    // Load stored data
    const imageData = sessionStorage.getItem('uploadedImage');
    const analysisData = sessionStorage.getItem('imageAnalysis');

    console.log('Canvas Element:', canvas);
    console.log('Loading Overlay:', loadingOverlay);

    // Initialize UI
    if (imageData) {
        loadImage(imageData);
    } else {
        console.error('No image data found in sessionStorage.');
        showError('No image uploaded. Please go back and upload an image.');
    }

    if (analysisData) {
        const analysis = JSON.parse(analysisData);
        updateUIWithAnalysis(analysis);
        // Enable auto-enhance button
        if (autoEnhanceBtn) {
            autoEnhanceBtn.disabled = false;
            autoEnhanceBtn.addEventListener('click', () => applyAutoEnhancements(analysis));
        }
    }

    // Utility Functions
    function showLoading() {
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }

    function showError(message) {
        console.error(message);
        // You can add UI error display here
    }

    // Helper Functions for Status Classes
    function getStatus(value) {
        if (!value) return 'unknown';
        const lowercase = value.toLowerCase();
        if (lowercase.includes('good') || lowercase.includes('strong')) return 'good';
        if (lowercase.includes('weak') || 
            lowercase.includes('poor') || 
            lowercase.includes('slightly')) return 'warning';
        return 'unknown';
    }

    function getStatusClass(value) {
        const status = getStatus(value);
        switch (status) {
            case 'good':
                return 'good';
            case 'warning':
                return 'warning';
            default:
                return 'warning';
        }
    }

    // Image Loading and Drawing
    function loadImage(data) {
        showLoading();
        originalImage = new Image();
        originalImage.onload = () => {
            hideLoading();
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
            ctx.drawImage(originalImage, 0, 0);
            console.log('Image loaded successfully');
            initializeSliders(); // Initialize slider listeners after image loads
        };
        originalImage.onerror = () => {
            hideLoading();
            showError('Failed to load the image. Please try uploading again.');
        };
        originalImage.src = data; // Use the base64 data
    }

    // Slider Controls
    function initializeSliders() {
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

        // Add event listeners to sliders
        Object.keys(sliders).forEach(key => {
            const slider = sliders[key];
            const valueDisplay = sliderValues[key];
            
            if (slider && valueDisplay) {
                slider.addEventListener('input', (e) => {
                    adjustments[key] = parseInt(e.target.value);
                    valueDisplay.textContent = adjustments[key];
                    applyAdjustments(); // Apply adjustments in real-time
                });
            }
        });
    }

    // Update UI with analysis data
    function updateUIWithAnalysis(analysis) {
        console.log('Updating UI with analysis:', analysis);

        // Get UI elements
        const scoreElement = document.querySelector('.score-text');
        const scoreBar = document.querySelector('.score-progress');
        const compositionList = document.querySelector('.composition-analysis ul');
        const thoughtsSummary = document.getElementById('thoughts-summary'); // New element for thoughts

        // Update score
        if (scoreElement && scoreBar) {
            const score = analysis.quality_score || 0;
            scoreElement.textContent = `${score}/100`;
            scoreBar.style.width = `${score}%`;
        }

        // Prepare composition analysis items
        const items = [
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

        // Store analysis data for later use
        sessionStorage.setItem('imageAnalysis', JSON.stringify(analysis));
    }

    // Auto-Enhancement
    function applyAutoEnhancements(analysis) {
        console.log('Applying auto-enhancements based on:', analysis);

        // Reset adjustments
        adjustments = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            sharpness: 0
        };

        // Parse analysis and set adjustments
        if (analysis.brightness) {
            if (analysis.brightness.toLowerCase().includes('poor')) {
                adjustments.brightness += 30;
            }
        }
        if (analysis.contrast) {
            if (analysis.contrast.toLowerCase().includes('poor')) {
                adjustments.contrast += 30;
            }
        }
        if (analysis.saturation) {
            if (analysis.saturation.toLowerCase().includes('poor')) {
                adjustments.saturation += 30;
            }
        }
        if (analysis.sharpness) {
            if (analysis.sharpness.toLowerCase().includes('poor') || 
                analysis.sharpness.toLowerCase().includes('blurry')) {
                adjustments.sharpness += 30;
            }
        }

        // Update slider positions
        Object.keys(adjustments).forEach(key => {
            const slider = document.getElementById(key);
            const valueDisplay = document.getElementById(`${key}Value`);
            if (slider && valueDisplay) {
                slider.value = adjustments[key];
                valueDisplay.textContent = adjustments[key];
            }
        });

        // Apply the adjustments
        applyAdjustments();
    }

    function applyAdjustments() {
        if (!originalImage) return; // Ensure image data is available

        requestAnimationFrame(() => {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Set filters
            ctx.filter = `brightness(${100 + adjustments.brightness}%) 
                         contrast(${100 + adjustments.contrast}%) 
                         saturate(${100 + adjustments.saturation}%)`;

            // Draw image with filters
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

            // Apply sharpness if needed
            if (adjustments.sharpness !== 0) {
                applySharpness();
            }
        });
    }

    function applySharpness() {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const factor = adjustments.sharpness / 100;

        // Simple sharpening algorithm
        for (let i = 0; i < data.length; i += 4) {
            if (i % (canvas.width * 4) === 0) continue; // Skip first pixel of each row
            if (i < canvas.width * 4) continue; // Skip first row
            
            for (let j = 0; j < 3; j++) {
                const current = data[i + j];
                const above = data[i - canvas.width * 4 + j];
                const left = data[i - 4 + j];
                
                data[i + j] = current + (2 * current - above - left) * factor;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    // Reset functionality
    resetBtn.addEventListener('click', () => {
        // Reset adjustments
        adjustments = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            sharpness: 0
        };

        // Reset sliders
        Object.keys(adjustments).forEach(key => {
            const slider = document.getElementById(key);
            const valueDisplay = document.getElementById(`${key}Value`);
            if (slider && valueDisplay) {
                slider.value = 0;
                valueDisplay.textContent = '0';
            }
        });

        // Reset image
        if (originalImage) {
            ctx.filter = 'none';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(originalImage, 0, 0);
        }
    });
});
