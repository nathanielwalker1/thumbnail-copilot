document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const loadingOverlay = document.getElementById('loadingOverlay');
    const autoEnhanceBtn = document.querySelector('.auto-enhance-btn');
    const resetBtn = document.querySelector('.reset-btn');
    const customTextInput = document.getElementById('customTextInput');
    const fontSelect = document.getElementById('fontSelect');
    const colorPicker = document.getElementById('colorPicker');
    const textSizeSlider = document.getElementById('textSize');
    const addTextBtn = document.querySelector('.add-text-btn');

    // Initialize state
    let originalImage = null; // Store the original image
    let adjustments = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sharpness: 0
    };
    let textOverlay = null; // Store a single text overlay
    let isDraggingText = false; // Track dragging state
    let dragOffsetX = 0; // Offset for dragging
    let dragOffsetY = 0; // Offset for dragging

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
            drawTextOverlay(); // Draw any existing text overlay
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
                adjustments.brightness += 10;
            }
        }
        if (analysis.contrast) {
            if (analysis.contrast.toLowerCase().includes('poor')) {
                adjustments.contrast += 10;
            }
        }
        if (analysis.saturation) {
            if (analysis.saturation.toLowerCase().includes('poor')) {
                adjustments.saturation += 10;
            }
        }
        if (analysis.sharpness) {
            if (analysis.sharpness.toLowerCase().includes('poor') || 
                analysis.sharpness.toLowerCase().includes('blurry')) {
                adjustments.sharpness += 10;
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

            // Draw text overlay
            drawTextOverlay(); // Ensure this function is called correctly
        });
    }

    // Draw text overlay
    function drawTextOverlay() {
        if (textOverlay) {
            ctx.font = `${textOverlay.size}px ${textOverlay.font}`;
            ctx.fillStyle = textOverlay.color;
            ctx.textAlign = 'center'; // Center text horizontally
            ctx.textBaseline = 'middle'; // Center text vertically

            // Draw the text
            ctx.fillText(textOverlay.text, textOverlay.x, textOverlay.y);
        }
    }

    // Add text overlay functionality
    addTextBtn.addEventListener('click', () => {
        const text = customTextInput.value;
        const font = fontSelect.value;
        const color = colorPicker.value;
        const size = parseInt(textSizeSlider.value);

        if (text) {
            // Replace existing text overlay
            textOverlay = { // Store the new text overlay
                text: text,
                font: font,
                color: color,
                size: size,
                x: canvas.width / 2, // Centered by default
                y: canvas.height / 2  // Centered by default
            };
            applyAdjustments(); // Use this instead of drawTextOverlay()
            console.log('Added text overlay:', textOverlay);
        }
    });

    // Initialize text controls with real-time updates
    function initializeTextControls() {
        // Font selection - real-time update
        fontSelect.addEventListener('change', () => {
            if (textOverlay) {
                textOverlay.font = fontSelect.value;
                applyAdjustments(); // This will redraw everything including text
                console.log('Font updated:', textOverlay.font);
            }
        });

        // Color picker - real-time update
        colorPicker.addEventListener('input', () => {
            if (textOverlay) {
                textOverlay.color = colorPicker.value;
                applyAdjustments();
                console.log('Color updated:', textOverlay.color);
            }
        });

        // Size slider - real-time update
        textSizeSlider.addEventListener('input', () => {
            if (textOverlay) {
                textOverlay.size = parseInt(textSizeSlider.value);
                applyAdjustments();
                console.log('Size updated:', textOverlay.size);
            }
        });
    }

    // Add mouse event listeners for text dragging
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (textOverlay) {
            // Check if mouse is over text
            ctx.font = `${textOverlay.size}px ${textOverlay.font}`;
            const textWidth = ctx.measureText(textOverlay.text).width;
            const textHeight = parseInt(textOverlay.size); // Approximate height

            // Define text bounds
            const textBounds = {
                left: textOverlay.x - textWidth / 2,
                right: textOverlay.x + textWidth / 2,
                top: textOverlay.y - textHeight / 2,
                bottom: textOverlay.y + textHeight / 2
            };

            // Check if mouse is over text
            if (x >= textBounds.left && x <= textBounds.right && 
                y >= textBounds.top && y <= textBounds.bottom) {
                canvas.style.cursor = 'move';
                
                if (isDraggingText) {
                    requestAnimationFrame(() => {
                        textOverlay.x = x; // Corrected
                        textOverlay.y = y; // Corrected
                        applyAdjustments(); // Redraw everything
                    });
                }
            } else {
                canvas.style.cursor = 'default';
            }
        }
    });

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (textOverlay) {
            // Check if click is on text
            ctx.font = `${textOverlay.size}px ${textOverlay.font}`;
            const textWidth = ctx.measureText(textOverlay.text).width;
            const textHeight = parseInt(textOverlay.size);

            // Define text bounds
            const textBounds = {
                left: textOverlay.x - textWidth / 2,
                right: textOverlay.x + textWidth / 2,
                top: textOverlay.y - textHeight / 2,
                bottom: textOverlay.y + textHeight / 2
            };

            if (x >= textBounds.left && x <= textBounds.right && 
                y >= textBounds.top && y <= textBounds.bottom) {
                isDraggingText = true;
                dragOffsetX = textOverlay.x - x;
                dragOffsetY = textOverlay.y - y;
            }
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDraggingText = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isDraggingText = false;
        canvas.style.cursor = 'default';
    });

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

        // Reset text overlay
        textOverlay = null;
        console.log('Reset text overlay');
    });

    // Initialize text controls
    initializeTextControls();

    // Add this function to handle downloading the image
    function downloadImage() {
        if (!originalImage) return; // Ensure there is an image to download

        // Create a link element
        const link = document.createElement('a');
        link.download = 'thumbnail.png'; // Set the default file name

        // Convert the canvas to a data URL
        link.href = canvas.toDataURL('image/png');

        // Programmatically click the link to trigger the download
        link.click();
    }

    // Add event listener for the download button
    const downloadBtn = document.querySelector('.download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadImage);
    }
});
