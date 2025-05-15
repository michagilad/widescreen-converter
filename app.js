const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

// DOM Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const progressBar = document.querySelector('progress');
const progressDiv = document.getElementById('progress');
const previewContainer = document.getElementById('previewContainer');
const statusDiv = document.getElementById('status');
const bgColor = document.getElementById('bgColor');
const bgColorHex = document.getElementById('bgColorHex');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const downloadAllContainer = document.getElementById('downloadAllContainer');

let files = [];
let processedImages = [];

// Color picker synchronization
bgColor.addEventListener('input', (e) => {
    bgColorHex.value = e.target.value.toUpperCase();
});

bgColorHex.addEventListener('input', (e) => {
    const value = e.target.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        bgColor.value = value;
        bgColorHex.classList.remove('border-red-500');
    } else {
        bgColorHex.classList.add('border-red-500');
    }
});

// Show status message
function showStatus(message, type = 'error') {
    statusDiv.textContent = message;
    statusDiv.className = type === 'error' ? 'error' : 'success';
    statusDiv.classList.remove('hidden');
}

// Hide status message
function hideStatus() {
    statusDiv.classList.add('hidden');
}

// Initialize FFmpeg
(async () => {
    try {
        await ffmpeg.load();
        convertBtn.disabled = false;
        convertBtn.textContent = 'Convert Images';
        showStatus('FFmpeg loaded successfully!', 'success');
        setTimeout(hideStatus, 3000);
    } catch (error) {
        console.error('FFmpeg loading error:', error);
        showStatus('Error loading FFmpeg. Please try refreshing the page.');
        convertBtn.textContent = 'Error Loading FFmpeg';
    }
})();

// Download all images
downloadAllBtn.addEventListener('click', () => {
    if (processedImages.length === 0) return;

    // Create a zip file containing all images
    const zip = new JSZip();
    const promises = processedImages.map(({ url, name }, index) => {
        return fetch(url)
            .then(response => response.blob())
            .then(blob => {
                zip.file(`widescreen_${name}`, blob);
            });
    });

    Promise.all(promises).then(() => {
        zip.generateAsync({ type: 'blob' })
            .then(content => {
                const zipUrl = URL.createObjectURL(content);
                const link = document.createElement('a');
                link.href = zipUrl;
                link.download = 'widescreen_images.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(zipUrl);
            });
    });
});

// Drag and drop handlers
dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (droppedFiles.length === 0) {
        showStatus('Please drop image files only.');
        return;
    }
    handleFiles(droppedFiles);
});

dropzone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length === 0) return;
    handleFiles(Array.from(e.target.files));
});

function handleFiles(newFiles) {
    files = newFiles;
    hideStatus();
    updatePreview();
    downloadAllContainer.classList.add('hidden');
}

function updatePreview() {
    previewContainer.innerHTML = '';
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            const img = document.createElement('img');
            img.src = e.target.result;
            div.appendChild(img);
            previewContainer.appendChild(div);
        };
        reader.onerror = () => {
            showStatus(`Error loading preview for ${file.name}`);
        };
        reader.readAsDataURL(file);
    });
}

convertBtn.addEventListener('click', async () => {
    if (files.length === 0) {
        showStatus('Please select at least one image');
        return;
    }

    const width = document.getElementById('width').value;
    const height = document.getElementById('height').value;
    const bgColorValue = bgColorHex.value;

    if (!width || !height) {
        showStatus('Please enter valid dimensions');
        return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(bgColorValue)) {
        showStatus('Please enter a valid hex color code');
        return;
    }

    hideStatus();
    progressDiv.classList.remove('hidden');
    convertBtn.disabled = true;
    convertBtn.textContent = 'Processing...';
    downloadAllContainer.classList.add('hidden');
    processedImages = [];

    try {
        const results = [];
        for (let i = 0; i < files.length; i++) {
            progressBar.value = (i / files.length) * 100;
            
            try {
                // Write the input file to FFmpeg's virtual filesystem
                const inputFileName = `input${i}.png`;
                ffmpeg.FS('writeFile', inputFileName, await fetchFile(files[i]));

                // Process the image using FFmpeg
                await ffmpeg.run(
                    '-i', inputFileName,
                    '-filter_complex',
                    `color=${bgColorValue}:s=${width}x${height}[bg];` +
                    `[0:v]scale=${height}:${height}[scaled];` +
                    `[bg][scaled]overlay=(W-w)/2:0:format=auto`,
                    '-pix_fmt', 'rgba',
                    `output${i}.png`
                );

                // Read the output file
                const data = ffmpeg.FS('readFile', `output${i}.png`);
                const blob = new Blob([data.buffer], { type: 'image/png' });
                const url = URL.createObjectURL(blob);
                results.push({ url, name: files[i].name });
                processedImages.push({ url, name: files[i].name });

                // Clean up files
                ffmpeg.FS('unlink', inputFileName);
                ffmpeg.FS('unlink', `output${i}.png`);
            } catch (error) {
                console.error(`Error processing ${files[i].name}:`, error);
                showStatus(`Error processing ${files[i].name}`);
            }
        }

        // Update preview with processed images
        previewContainer.innerHTML = '';
        results.forEach(({ url, name }) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            const img = document.createElement('img');
            img.src = url;
            
            // Add download button
            const downloadBtn = document.createElement('a');
            downloadBtn.href = url;
            downloadBtn.download = `widescreen_${name}`;
            downloadBtn.className = 'absolute bottom-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-md text-sm';
            downloadBtn.textContent = 'Download';
            
            div.appendChild(img);
            div.appendChild(downloadBtn);
            previewContainer.appendChild(div);
        });

        if (results.length > 0) {
            showStatus(`Successfully processed ${results.length} images!`, 'success');
            downloadAllContainer.classList.remove('hidden');
        }

    } catch (error) {
        console.error('Error processing images:', error);
        showStatus('Error processing images. Please try again.');
    } finally {
        progressDiv.classList.add('hidden');
        convertBtn.disabled = false;
        convertBtn.textContent = 'Convert Images';
        progressBar.value = 0;
    }
}); 