document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');

    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // Here you would typically handle the file upload
            // For now, we'll just log the file name
            console.log('File selected:', file.name);
            // TODO: Implement file upload and processing logic
        }
    });
});

