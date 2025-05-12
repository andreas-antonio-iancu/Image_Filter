document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
    const fileInput = document.getElementById('file-input');
    const nextButton = document.getElementById('next-button');
    const resetButton = document.getElementById('reset-button');
    const downloadButton = document.getElementById('download-button');
    const uploadSection = document.getElementById('upload-section');
    const editingSection = document.getElementById('editing-section');
    // Inputs for overlay controls
    const overlayXInput = document.getElementById('position-x');
    const overlayYInput = document.getElementById('position-y');
    const overlayScaleInput = document.getElementById('scaling');
    const overlayRotationInput = document.getElementById('rotation');
    // Canvas setup
    const canvas = document.getElementById('image-canvas');
    const ctx = canvas.getContext('2d');
    let baseImage = null; // Stores the uploaded image

    // Initialization Functions
    const Initialization = {
        initializeControls() {
            const controls = [
                { id: 'position-x' },
                { id: 'position-y' },
                { id: 'scaling' },
                { id: 'rotation' }
            ];

            const unitMeasures = {
                'position-x': '%',
                'position-y': '%',
                'scaling': '%',
                'rotation': '°'
            };

            function updateControlValue(controlId, value) {
                const output = document.getElementById('value-' + controlId);
                output.textContent = value + (unitMeasures[controlId] || '');
            }

            for (let i = 0; i < controls.length; i++) {
                const control = controls[i];
                const input = document.getElementById(control.id);
                updateControlValue(control.id, input.value);
                input.addEventListener('input', () => {
                    updateControlValue(control.id, input.value);
                    Overlay.handleOverlay();
                });
            }
        },
        // Attach event listeners to buttons for their respective actions
        initializeButtons() {
            nextButton.addEventListener('click', ButtonHandlers.handleNextButtonClick);
            const infoButton = document.getElementById('info-button');
            infoButton.addEventListener('click', ButtonHandlers.handleInfoButtonClick);
            resetButton.addEventListener('click', ButtonHandlers.handleResetButtonClick);
            fileInput.addEventListener('change', ButtonHandlers.handleFileInputChange);
            downloadButton.addEventListener('click', ButtonHandlers.handleDownloadButtonClick);
        },

        initializePage() {
            // Initialize controls and buttons when the page loads
            this.initializeControls();
            this.initializeButtons();
        }
    };

    // Button Handlers
    const ButtonHandlers = {
        handleNextButtonClick() {
            // Hide the "Next" button and show the "Info" button
            nextButton.classList.add('hidden');
            const infoButton = document.getElementById('info-button');
            infoButton.classList.remove('hidden');
            ImageLoader.loadImage();
        },
        // Display usage instructions in an alert
        handleInfoButtonClick() { alert(`How to Use the App:\nAdjust the overlay controls to position, scale, and rotate the overlay.\nClick 'Download' to save your edited image.`); },
        
        // Reset all overlay controls to their default values when clicked on Reset
        handleResetButtonClick() {
            overlayXInput.value = 0;
            overlayYInput.value = 0;
            overlayScaleInput.value = 0;
            overlayRotationInput.value = 0;
            Overlay.handleOverlay(); // Reapply overlay with default values

            // Update displayed values to reflect the reset
            const spans = editingSection.querySelectorAll('span');
            for (let i = 0; i < spans.length-1; i++) 
                spans[i].textContent = '0%';
            spans[spans.length-1].textContent = '0°';
        },
        
        // Show the "Next" button and change the file input label's background color
        handleFileInputChange() {
            nextButton.classList.remove('hidden');
            const fileInputLabel = document.querySelector('label[for="file-input"]');
            fileInputLabel.style.backgroundColor = 'rgb(190, 242, 100)';
        },

        // Create a downloadable link for the edited image
        handleDownloadButtonClick() {
            const link = document.createElement('a');
            link.download = 'smiley_image.png';
            link.href = canvas.toDataURL('image/png');
            link.click();

            // Clear the page and display a success message & a reload button
            document.body.innerHTML = '';
            
            const successMessage = document.createElement('h1');
            successMessage.textContent = 'Done!';
            successMessage.className = 'text-2xl font-bold text-neutral-700 text-center mt-8';
            document.body.appendChild(successMessage);

            const editButton = document.createElement('button');
            editButton.textContent = 'Edit Another Photo';
            editButton.className = 'bg-yellow-400 text-white font-extrabold py-2 px-4 rounded-3xl hover:bg-yellow-300 mt-4';
            editButton.addEventListener('click', () => {
                location.reload();
            });
            document.body.appendChild(editButton);
        }
    };

    // Overlay and Canvas Functions
    const Overlay = {

        // Add a watermark to the bottom-right corner of the canvas
        handleWatermark() {
            const watermark = new Image();
            watermark.src = 'assets/watermark.png';
            watermark.onload = () => {
                ctx.drawImage(watermark, canvas.width - watermark.width - 5, canvas.height - watermark.height - 5);
            };
        },

        handleOverlay() {
            // Clear the canvas and redraw the base image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
            this.handleWatermark();
            
            // Load and apply the overlay image
            const overlay = new Image();
            overlay.src = 'assets/overlay.png';
            overlay.onload = () => {
                const scale = parseFloat(overlayScaleInput.value) / 100 || 0;
                if (scale === 0) return; // Skip if scale is zero

                const xOffset = parseFloat(overlayXInput.value) || 0; // Horizontal offset
                const yOffset = parseFloat(overlayYInput.value) || 0; // Vertical offset
                const x = canvas.width / 2 - (overlay.width * scale) / 2 + xOffset; // X position
                const y = canvas.height / 2 - (overlay.height * scale) / 2 + yOffset; // Y position
                const rotation = parseFloat(overlayRotationInput.value) || 0; // Rotation angle

                // Calculate the center of the overlay for rotation
                const centerX = x + (overlay.width * scale) / 2;
                const centerY = y + (overlay.height * scale) / 2;
                
                // Apply transformations and draw the overlay
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.scale(scale, scale);
                ctx.drawImage(overlay, -overlay.width / 2, -overlay.height / 2);
                ctx.restore();
            };
        }
    };

    // Image Loader
    const ImageLoader = {
        loadImage() {
            // Check if a file is selected
            if (fileInput.files.length > 0) {
                uploadSection.style.display = 'none'; // Hide the upload section
                editingSection.style.display = 'block'; // Show the editing section

                const file = fileInput.files[0];
                const reader = new FileReader();

                // Load the image file and draw it on the canvas
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const scale = 300 / img.width; // Scale the image to 300px width
                        const height = img.height * scale; // Maintain aspect ratio

                        canvas.width = 300;
                        canvas.height = height;

                        baseImage = img; // Store the loaded image

                        Overlay.handleOverlay(); // Apply the overlay
                    };
                    img.src = event.target.result;
                };

                reader.readAsDataURL(file); 
            }
        }
    };

    // Initialize the page
    Initialization.initializePage();
});
