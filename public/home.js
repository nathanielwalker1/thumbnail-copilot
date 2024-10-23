document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const errorMessage = document.getElementById('errorMessage');
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="spinner"></div>';
    loadingOverlay.style.display = 'none';
    document.body.appendChild(loadingOverlay);

    // Event Listeners
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                if (validateFile(file)) {
                    uploadAndAnalyzeImage(file);
                } else {
                    showError('Invalid file type or size. Please upload a PNG, JPG, or JPEG image under 5MB.');
                }
            }
        });
    }

    function validateFile(file) {
        const acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        const maxSizeMB = 5;  // Maximum size limit, e.g., 5MB
        const isValidType = acceptedTypes.includes(file.type);
        const isValidSize = file.size <= maxSizeMB * 1024 * 1024;
        return isValidType && isValidSize;
    }

    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        } else {
            console.error(message);
        }
    }

    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    function uploadAndAnalyzeImage(file) {
        showLoading();
        const formData = new FormData();
        formData.append('image', file);

        console.log('Sending image to /analyze-image endpoint...');

        fetch('/analyze-image', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Analysis data received:', data);
            
            // Store analysis data
            sessionStorage.setItem('imageAnalysis', JSON.stringify(data.analysis));
            
            // Convert image file to base64
            const reader = new FileReader();
            reader.onload = function(e) {
                // Store base64 image data
                sessionStorage.setItem('uploadedImage', e.target.result);
                // Navigate to editor
                window.location.href = 'editor.html';
            };
            reader.readAsDataURL(file); // Convert to base64
        })
        .catch(error => {
            hideLoading();
            showError('Failed to analyze image. Please try again.');
            console.error('Error:', error);
        });
    }
});
