class NanoBananaWeb {
    constructor() {
        this.apiKey = '';
        this.userImage = null;
        this.outfitImage = null;
        this.initializeEventListeners();
        this.setupDragAndDrop();
    }

    initializeEventListeners() {
        // API Key input
        document.getElementById('apiKey').addEventListener('input', (e) => {
            this.apiKey = e.target.value.trim();
            this.validateForm();
        });

        // File inputs
        document.getElementById('userImage').addEventListener('change', (e) => {
            this.handleImageUpload(e, 'user');
        });

        document.getElementById('outfitImage').addEventListener('change', (e) => {
            this.handleImageUpload(e, 'outfit');
        });

        // Process button
        document.getElementById('processButton').addEventListener('click', () => {
            this.processImages();
        });

        // Download all button
        document.getElementById('downloadAll').addEventListener('click', () => {
            this.downloadAllResults();
        });
    }

    setupDragAndDrop() {
        const dropZones = [
            { element: document.getElementById('userPreview'), type: 'user' },
            { element: document.getElementById('outfitPreview'), type: 'outfit' }
        ];

        dropZones.forEach(({ element, type }) => {
            // Prevent default drag behaviors
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                element.addEventListener(eventName, this.preventDefaults, false);
                document.body.addEventListener(eventName, this.preventDefaults, false);
            });

            // Highlight drop area when item is dragged over it
            ['dragenter', 'dragover'].forEach(eventName => {
                element.addEventListener(eventName, () => this.highlight(element), false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                element.addEventListener(eventName, () => this.unhighlight(element), false);
            });

            // Handle dropped files
            element.addEventListener('drop', (e) => this.handleDrop(e, type), false);
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(element) {
        element.classList.add('drag-over');
    }

    unhighlight(element) {
        element.classList.remove('drag-over');
    }

    handleDrop(e, type) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                this.handleImageFile(file, type);
            } else {
                this.showError('Por favor sube solo archivos de imagen');
            }
        }
    }

    handleImageUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;
        this.handleImageFile(file, type);
    }

    handleImageFile(file, type) {
        if (!file.type.startsWith('image/')) {
            this.showError('Por favor selecciona un archivo de imagen válido');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const previewId = type === 'user' ? 'userPreview' : 'outfitPreview';
            const preview = document.getElementById(previewId);
            
            preview.innerHTML = `<img src="${e.target.result}" alt="${type} image" />`;
            preview.classList.add('has-image');

            if (type === 'user') {
                this.userImage = file;
            } else {
                this.outfitImage = file;
            }

            this.validateForm();
            this.hideError(); // Hide any previous errors
        };
        
        reader.onerror = () => {
            this.showError('Error al leer el archivo de imagen');
        };
        
        reader.readAsDataURL(file);
    }

    validateForm() {
        const processButton = document.getElementById('processButton');
        const isValid = this.apiKey && this.userImage && this.outfitImage;
        processButton.disabled = !isValid;
    }

    async processImages() {
        const processButton = document.getElementById('processButton');
        const resultsSection = document.getElementById('resultsSection');
        const errorSection = document.getElementById('errorSection');

        // Hide previous results/errors
        resultsSection.style.display = 'none';
        errorSection.style.display = 'none';

        // Show loading state
        processButton.classList.add('loading');
        processButton.disabled = true;

        try {
            // Convert images to base64
            const userImageBase64 = await this.fileToBase64(this.userImage);
            const outfitImageBase64 = await this.fileToBase64(this.outfitImage);

            // Prepare the request
            const requestData = {
                apiKey: this.apiKey,
                userImage: {
                    data: userImageBase64,
                    mimeType: this.userImage.type
                },
                outfitImage: {
                    data: outfitImageBase64,
                    mimeType: this.outfitImage.type
                }
            };

            // Send request to backend
            const response = await fetch('/api/transfer-outfit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                this.displayResults(result.images);
            } else {
                throw new Error(result.error || 'Error desconocido');
            }

        } catch (error) {
            console.error('Error processing images:', error);
            this.showError(error.message);
        } finally {
            // Hide loading state
            processButton.classList.remove('loading');
            processButton.disabled = false;
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    displayResults(images) {
        const resultsSection = document.getElementById('resultsSection');
        const resultsGrid = document.getElementById('resultsGrid');

        resultsGrid.innerHTML = '';

        images.forEach((imageData, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            resultItem.innerHTML = `
                <img src="data:image/png;base64,${imageData}" alt="Resultado ${index + 1}" />
                <button onclick="nanoBanana.downloadImage('${imageData}', 'resultado_${index + 1}.png')">
                    📥 Descargar
                </button>
            `;
            
            resultsGrid.appendChild(resultItem);
        });

        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        // Store images for batch download
        this.resultImages = images;
    }

    downloadImage(imageData, filename) {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${imageData}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    downloadAllResults() {
        if (!this.resultImages) return;

        this.resultImages.forEach((imageData, index) => {
            setTimeout(() => {
                this.downloadImage(imageData, `nano_banana_resultado_${index + 1}.png`);
            }, index * 500); // Stagger downloads
        });
    }

    showError(message) {
        const errorSection = document.getElementById('errorSection');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        errorSection.style.display = 'block';
        errorSection.scrollIntoView({ behavior: 'smooth' });
    }

    hideError() {
        const errorSection = document.getElementById('errorSection');
        errorSection.style.display = 'none';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.nanoBanana = new NanoBananaWeb();
});