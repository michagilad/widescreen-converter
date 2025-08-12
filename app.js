document.addEventListener('DOMContentLoaded', async () => {
    // DOM elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const convertBtn = document.getElementById('convertBtn');
    const status = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    const progressBar = document.getElementById('progressBar');
    const previewSection = document.getElementById('previewSection');
    const previewContainer = document.getElementById('previewContainer');
    const resultsSection = document.getElementById('resultsSection');
    const resultsContainer = document.getElementById('resultsContainer');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const bgColorInput = document.getElementById('bgColor');
    const hexInput = document.getElementById('hexInput');

    let files = [];
    let processedImages = [];

    // Initialize color picker functionality
    function initializeColorPicker() {
        // Update hex input when picker changes
        bgColorInput.addEventListener('input', (e) => {
            const hex = e.target.value;
            hexInput.value = hex;
        });

        // Allow direct hex input
        hexInput.addEventListener('input', (e) => {
            const hex = e.target.value;
            if (/^#[0-9A-Fa-f]{3,6}$/.test(hex)) {
                // Convert 3-digit hex to 6-digit for the color picker, but leave input unchanged
                if (hex.length === 4) { // #fff -> convert color picker to #ffffff
                    const fullHex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
                    bgColorInput.value = fullHex;
                } else if (hex.length === 7) { // #fefefe - full 6-digit hex
                    bgColorInput.value = hex;
                }
            }
        });

        // Initialize hex input with current color
        hexInput.value = bgColorInput.value;
    }



    // Initialize FFmpeg
    let ffmpeg;
    try {
        const { createFFmpeg } = FFmpeg;
        ffmpeg = createFFmpeg({
            log: true,
            logger: ({ message }) => console.log('FFmpeg Log:', message),
            progress: (p) => console.log('FFmpeg Progress:', p)
        });
        
        await ffmpeg.load();
        console.log('FFmpeg loaded successfully');
        
        // Test FFmpeg functionality
        try {
            console.log('Testing FFmpeg with -version command...');
            await ffmpeg.run('-version');
            console.log('FFmpeg test successful - ready to use');
        } catch (testError) {
            console.warn('FFmpeg test failed, but continuing:', testError);
        }
        
        convertBtn.disabled = false;
        convertBtn.textContent = 'Convert Files to JPG';
    } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        statusText.textContent = 'Failed to load FFmpeg. Please refresh the page.';
        status.classList.remove('hidden');
        status.classList.add('bg-red-50', 'border-red-200');
    }

    // Initialize color picker
    initializeColorPicker();

    // File handling
    dropzone.addEventListener('click', () => fileInput.click());
    
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
        handleFiles(e.dataTransfer.files);
    });
    
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(fileList) {
        files = Array.from(fileList);
        updatePreview();
        previewSection.classList.remove('hidden');
    }

    function updatePreview() {
        previewContainer.innerHTML = '';
        files.forEach((file, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'text-center';
            
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.className = 'preview-image mx-auto mb-2';
                img.alt = file.name;
                previewItem.appendChild(img);
            } else {
                const icon = document.createElement('div');
                icon.className = 'w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center';
                icon.innerHTML = '<svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';
                previewItem.appendChild(icon);
            }
            
            const fileName = document.createElement('p');
            fileName.className = 'text-sm text-gray-600 truncate';
            fileName.textContent = file.name;
            previewItem.appendChild(fileName);
            
            previewContainer.appendChild(previewItem);
        });
    }

    // Conversion
    convertBtn.addEventListener('click', async () => {
        if (!ffmpeg || files.length === 0) return;
        
        convertBtn.disabled = true;
        status.classList.remove('hidden');
        statusText.textContent = 'Converting files...';
        progressBar.style.width = '0%';
        
        try {
            const width = parseInt(widthInput.value);
            const height = parseInt(heightInput.value);
            const bgColor = bgColorInput.value;
            const bgColorValue = bgColor.replace('#', '0x') + 'ff';
            
            console.log('Starting conversion with settings:', { width, height, bgColor, bgColorValue });
            console.log('Number of files to process:', files.length);
            
            processedImages = [];
            const results = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                console.log(`Processing file ${i + 1}/${files.length}:`, file.name, file.type, file.size);
                
                statusText.textContent = `Converting ${file.name}...`;
                progressBar.style.width = `${((i + 1) / files.length) * 100}%`;
                
                try {
                    // Write file to FFmpeg
                    const inputFileName = `input${i}.${file.name.split('.').pop()}`;
                    console.log('Writing file to FFmpeg:', inputFileName);
                    
                    // Read file data using FileReader instead of fetchFile
                    const fileData = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(new Uint8Array(reader.result));
                        reader.onerror = reject;
                        reader.readAsArrayBuffer(file);
                    });
                    
                    console.log('File data read, size:', fileData.byteLength);
                    
                    ffmpeg.FS('writeFile', inputFileName, fileData);
                    console.log('File written to FFmpeg filesystem');
                    
                    // Convert to JPG with specified dimensions
                    const ffmpegCommand = [
                        '-i', inputFileName,
                        '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${bgColorValue}`,
                        '-sws_flags', 'lanczos+accurate_rnd+full_chroma_int+full_chroma_inp',
                        '-pix_fmt', 'yuv420p',
                        '-q:v', '2',
                        '-y',
                        `output${i}.jpg`
                    ];
                    
                    // Enhanced command for better transparency handling
                    const enhancedCommand = [
                        '-i', inputFileName,
                        '-vf', [
                            // Scale the image to fit within target dimensions while maintaining aspect ratio
                            `scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos`,
                            // Pad to exact dimensions with background color (this fills transparency)
                            `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${bgColorValue}`,
                            // Ensure any remaining alpha/transparency is filled
                            `format=yuv420p`
                        ].join(','),
                        // Force output to JPG (which doesn't support transparency)
                        '-pix_fmt', 'yuv420p',
                        // High quality output
                        '-q:v', '2',
                        // Overwrite output file
                        '-y',
                        `output${i}.jpg`
                    ];
                    
                    console.log('Running enhanced FFmpeg command for transparency handling:', enhancedCommand);
                    await ffmpeg.run(...enhancedCommand);
                    console.log('FFmpeg conversion completed');
                    
                    // Read the output file
                    console.log('Reading output file...');
                    const data = ffmpeg.FS('readFile', `output${i}.jpg`);
                    console.log('Output file read, size:', data.byteLength);
                    
                    const blob = new Blob([data.buffer], { type: 'image/jpeg' });
                    const url = URL.createObjectURL(blob);
                    
                    const resultName = files[i].name.replace(/\.[^/.]+$/, '') + '_converted.jpg';
                    results.push({ url, name: resultName });
                    processedImages.push({ url, name: resultName });
                    
                    console.log('File processed successfully:', resultName);
                    
                    // Clean up
                    ffmpeg.FS('unlink', inputFileName);
                    ffmpeg.FS('unlink', `output${i}.jpg`);
                    console.log('FFmpeg filesystem cleaned up');
                    
                } catch (fileError) {
                    console.error(`Error processing file ${file.name}:`, fileError);
                    statusText.textContent = `Error processing ${file.name}: ${fileError.message}`;
                    status.classList.add('bg-red-50', 'border-red-200');
                    throw fileError; // Re-throw to stop processing
                }
            }
            
            displayResults(results);
            statusText.textContent = 'Conversion completed!';
            status.classList.remove('bg-blue-50', 'border-blue-200');
            status.classList.add('bg-green-50', 'border-green-200');
            
            // Update the spinner to a checkmark
            const spinner = status.querySelector('.animate-spin');
            if (spinner) {
                spinner.classList.remove('animate-spin', 'rounded-full', 'h-5', 'w-5', 'border-b-2', 'border-blue-600');
                spinner.classList.add('bg-green-500', 'rounded-full', 'h-5', 'w-5', 'flex', 'items-center', 'justify-center');
                spinner.innerHTML = '✓';
            }
            
            console.log('All files processed successfully');
            
        } catch (error) {
            console.error('Conversion error:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            statusText.textContent = 'Conversion failed: ' + error.message;
            status.classList.remove('bg-blue-50', 'border-blue-200');
            status.classList.add('bg-red-50', 'border-red-200');
            
            // Update the spinner to an X for error
            const spinner = status.querySelector('.animate-spin');
            if (spinner) {
                spinner.classList.remove('animate-spin', 'rounded-full', 'h-5', 'w-5', 'border-b-2', 'border-blue-600');
                spinner.classList.add('bg-red-500', 'rounded-full', 'h-5', 'w-5', 'flex', 'items-center', 'justify-center');
                spinner.innerHTML = '✗';
            }
            
            // Show more helpful error messages
            if (error.message.includes('fetch')) {
                statusText.textContent = 'Network error: Please check your internet connection';
            } else if (error.message.includes('FS')) {
                statusText.textContent = 'File system error: Please try with a different file';
            } else if (error.message.includes('run')) {
                statusText.textContent = 'FFmpeg processing error: Please check file format';
            }
        } finally {
            convertBtn.disabled = false;
        }
    });

    function displayResults(results) {
        resultsContainer.innerHTML = '';
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'text-center';
            
            const img = document.createElement('img');
            img.src = result.url;
            img.className = 'preview-image mx-auto mb-2';
            img.alt = result.name;
            resultItem.appendChild(img);
            
            const fileName = document.createElement('p');
            fileName.className = 'text-sm text-gray-600 truncate';
            fileName.textContent = result.name;
            resultItem.appendChild(fileName);
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded mt-2';
            downloadBtn.textContent = 'Download';
            downloadBtn.onclick = () => downloadFile(result.url, result.name);
            resultItem.appendChild(downloadBtn);
            
            resultsContainer.appendChild(resultItem);
        });
        
        resultsSection.classList.remove('hidden');
    }

    function downloadFile(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Download all as ZIP
    downloadAllBtn.addEventListener('click', async () => {
        if (processedImages.length === 0) return;
        
        const zip = new JSZip();
        
        for (const image of processedImages) {
            const response = await fetch(image.url);
            const blob = await response.blob();
            zip.file(image.name, blob);
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted_images.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    });
}); 