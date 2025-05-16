// Wait for FFmpeg to be available
document.addEventListener('DOMContentLoaded', async () => {
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({
        log: true,
        logger: ({ message }) => console.log('FFmpeg Log:', message),
        progress: (p) => console.log('FFmpeg Progress:', p)
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

    // Show status message with progress
    function showStatus(message, type = 'error', progress = null) {
        statusDiv.textContent = message + (progress !== null ? ` (${Math.round(progress)}%)` : '');
        statusDiv.className = type === 'error' ? 'error' : 'success';
        statusDiv.classList.remove('hidden');
    }

    // Hide status message
    function hideStatus() {
        statusDiv.classList.add('hidden');
    }

    // Initialize FFmpeg
    try {
        console.log('Starting FFmpeg load...');
        await ffmpeg.load();
        console.log('FFmpeg loaded successfully!');
        convertBtn.disabled = false;
        convertBtn.textContent = 'Convert Images';
        showStatus('Ready to convert images', 'success');
    } catch (error) {
        console.error('FFmpeg loading error:', error);
        showStatus('Error loading FFmpeg. Please try using Chrome or Firefox.');
        convertBtn.textContent = 'Error Loading FFmpeg';
        return;
    }

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
        previewContainer.innerHTML = '';

        try {
            const results = [];
            for (let i = 0; i < files.length; i++) {
                const progress = ((i / files.length) * 100);
                progressBar.value = progress;
                showStatus(`Processing image ${i + 1} of ${files.length}`, 'success', progress);
                
                // Process in chunks to keep UI responsive
                await new Promise(resolve => setTimeout(resolve, 100));  // Small delay between files

                try {
                    // Process the image using FFmpeg
                    console.log('Starting FFmpeg processing...');
                    try {
                        // Write the input file to FFmpeg's virtual filesystem
                        const inputFileName = `input${i}.png`;
                        console.log('Loading file into FFmpeg...');
                        await ffmpeg.FS('writeFile', inputFileName, await fetchFile(files[i]));
                        console.log('File loaded successfully');

                        // Simple one-step processing with maximum quality
                        console.log('Processing image...');
                        await ffmpeg.run(
                            '-i', inputFileName,
                            '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${bgColorValue}`,
                            '-sws_flags', 'lanczos+accurate_rnd+full_chroma_int+full_chroma_inp',
                            '-pix_fmt', 'rgba',
                            '-compression_level', '0',
                            '-quality', '100',
                            '-lossless', '1',
                            '-pred', 'mixed',
                            '-y',
                            `output${i}.png`
                        );
                        console.log('FFmpeg processing completed');

                        // Read the output file
                        console.log('Reading processed file...');
                        const data = ffmpeg.FS('readFile', `output${i}.png`);
                        console.log('File read successfully');
                        
                        // Create blob with explicit PNG type and maximum quality
                        const blob = new Blob([data.buffer], { 
                            type: 'image/png'
                        });
                        const url = URL.createObjectURL(blob);
                        results.push({ url, name: files[i].name.replace(/\.[^/.]+$/, '') + '_widescreen.png' });
                        processedImages.push({ url, name: files[i].name.replace(/\.[^/.]+$/, '') + '_widescreen.png' });
                        
                        // Clean up
                        console.log('Cleaning up...');
                        ffmpeg.FS('unlink', inputFileName);
                        ffmpeg.FS('unlink', `output${i}.png`);
                        console.log('Cleanup completed');
                        
                        // Update progress
                        const progress = ((i + 1) / files.length) * 100;
                        progressBar.value = progress;
                        showStatus(`Processed ${i + 1} of ${files.length} images`, 'success', progress);
                        
                        // Add small delay between files
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                    } catch (error) {
                        console.error(`Detailed error for ${files[i].name}:`, error);
                        showStatus(`Error processing ${files[i].name}: ${error.message || 'Unknown error'}`);
                        continue;
                    }
                } catch (error) {
                    console.error(`Error details for ${files[i].name}:`, error);
                    showStatus(`Error processing ${files[i].name}: ${error.message || 'Unknown error'}`);
                    continue;
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
}); 