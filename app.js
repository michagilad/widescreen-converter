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
    const scalingModeSelect = document.getElementById('scalingMode');

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

    // Debug DOM elements
    console.log('Setting up file handling event listeners...');
    console.log('Dropzone element:', dropzone);
    console.log('File input element:', fileInput);
    
    if (dropzone) {
        // File handling
        dropzone.addEventListener('click', () => {
            console.log('Dropzone clicked, opening file dialog...');
            fileInput.click();
        });
        
        dropzone.addEventListener('dragover', (e) => {
            console.log('Drag over detected');
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        
        dropzone.addEventListener('dragleave', (e) => {
            console.log('Drag leave detected');
            dropzone.classList.remove('dragover');
        });
        
        dropzone.addEventListener('drop', (e) => {
            console.log('File drop detected:', e.dataTransfer.files);
            e.preventDefault();
            dropzone.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', (e) => {
            console.log('File input change detected:', e.target.files);
            handleFiles(e.target.files);
        });
        
        console.log('File handling event listeners set up successfully');
    } else {
        console.error('Cannot set up file handling - dropzone element not found');
    }

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
            // Convert hex color to FFmpeg format: #RRGGBB -> 0xRRGGBB
            const bgColorValue = bgColor.replace('#', '0x');
            
            // Also try different color formats for better compatibility
            const bgColorFormats = [
                bgColorValue,                    // 0xRRGGBB
                bgColor.replace('#', ''),        // RRGGBB (without 0x)
                bgColor,                         // #RRGGBB (original format)
                bgColor.replace('#', '0x') + 'ff' // 0xRRGGBBff (with alpha)
            ];
            
            const scalingMode = scalingModeSelect.value;
            console.log('Starting conversion with settings:', { width, height, bgColor, bgColorValue, scalingMode });
            console.log('Number of files to process:', files.length);
            
            processedImages = [];
            const results = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                                    console.log(`Processing file ${i + 1}/${files.length}:`, file.name, file.type, file.size);
                    
                    // Check if file might have transparency
                    const hasTransparency = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
                    console.log('File transparency check:', { 
                        type: file.type, 
                        name: file.name, 
                        hasTransparency: hasTransparency 
                    });
                    
                    // Additional debugging for transparency handling
                    if (hasTransparency) {
                        console.log('🔍 PNG file detected - will use enhanced transparency handling');
                        console.log('🎨 Background color:', bgColor, '-> FFmpeg format:', bgColorValue);
                    }
                    
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
                    
                    // Get scaling mode and build appropriate FFmpeg command
                    const scalingMode = scalingModeSelect.value;
                    let enhancedCommand;
                    
                    // Create a more robust command that properly handles transparency
                    if (hasTransparency) {
                        // For PNG files with transparency, use a more explicit approach
                        console.log('Using enhanced transparency handling for PNG file');
                        
                        if (scalingMode === 'fit') {
                            // Fit mode: scale to fit within dimensions, pad with background color
                            // Use a two-input approach: create solid background + overlay image
                            console.log('Using two-input transparency handling method');
                            enhancedCommand = [
                                // Create a solid background color
                                '-f', 'lavfi',
                                '-i', `color=${bgColorFormats[0]}:size=${width}x${height}`,
                                // Input the actual image
                                '-i', inputFileName,
                                '-filter_complex', [
                                    // Scale the image to fit within dimensions
                                    `[1:v]scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos[scaled]`,
                                    // Overlay the scaled image on the background
                                    `[0:v][scaled]overlay=(W-w)/2:(H-h)/2`
                                ].join(';'),
                                // Force output to JPG
                                '-pix_fmt', 'yuv420p',
                                // High quality output
                                '-q:v', '2',
                                // Overwrite output file
                                '-y',
                                `output${i}.jpg`
                            ];
                        } else {
                            // Fill mode: scale to fill dimensions, crop excess parts
                            enhancedCommand = [
                                // Create a solid background color
                                '-f', 'lavfi',
                                '-i', `color=${bgColorFormats[0]}:size=${width}x${height}`,
                                // Input the actual image
                                '-i', inputFileName,
                                '-filter_complex', [
                                    // Scale the image to fill target dimensions
                                    `[1:v]scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos[scaled]`,
                                    // Crop to exact dimensions from center
                                    `[scaled]crop=${width}:${height}[cropped]`,
                                    // Overlay the cropped image on the background
                                    `[0:v][cropped]overlay=(W-w)/2:(H-h)/2`
                                ].join(';'),
                                // Force output to JPG
                                '-pix_fmt', 'yuv420p',
                                // High quality output
                                '-q:v', '2',
                                // Overwrite output file
                                '-y',
                                `output${i}.jpg`
                            ];
                        }
                    } else {
                        // For non-transparent files, use standard approach
                        console.log('Using standard conversion for non-transparent file');
                        
                                            if (scalingMode === 'fit') {
                        // Fit mode: scale to fit within dimensions, pad with background color
                        enhancedCommand = [
                            '-i', inputFileName,
                            '-vf', [
                                // Scale the image to fit within target dimensions while maintaining aspect ratio
                                `scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos`,
                                // Pad to exact dimensions with background color (this fills transparency)
                                `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${bgColorValue}`,
                                // Ensure proper color space conversion
                                'format=yuv420p'
                            ].join(','),
                            // Color profile and quality settings for consistency
                            '-pix_fmt', 'yuv420p',
                            '-colorspace', 'bt709',        // Standard color space
                            '-color_primaries', 'bt709',   // Standard primaries
                            '-color_trc', 'bt709',        // Standard transfer characteristics
                            '-q:v', '2',                  // High quality
                            '-y',
                            `output${i}.jpg`
                        ];
                    } else {
                        // Fill mode: scale to fill dimensions, crop excess parts
                        enhancedCommand = [
                            '-i', inputFileName,
                            '-vf', [
                                // Scale the image to fill target dimensions while maintaining aspect ratio
                                `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos`,
                                // Crop to exact dimensions from center
                                `crop=${width}:${height}`,
                                // Ensure proper color space conversion
                                'format=yuv420p'
                            ].join(','),
                            // Color profile and quality settings for consistency
                            '-pix_fmt', 'yuv420p',
                            '-colorspace', 'bt709',        // Standard color space
                            '-color_primaries', 'bt709',   // Standard primaries
                            '-color_trc', 'bt709',        // Standard transfer characteristics
                            '-q:v', '2',                  // High quality
                            '-y',
                            `output${i}.jpg`
                        ];
                    }
                    }
                    
                    console.log(`Running FFmpeg command for ${scalingMode} mode with color profile preservation:`, enhancedCommand);
                    console.log('Background color being used:', bgColor, '-> FFmpeg format:', bgColorValue);
                    console.log('🎨 Available color formats:', bgColorFormats);
                    console.log('🔧 Full FFmpeg command:', enhancedCommand.join(' '));
                    console.log('🚀 Using method:', hasTransparency ? 'Two-input transparency handling' : 'Standard conversion');
                    
                    try {
                        await ffmpeg.run(...enhancedCommand);
                        console.log('FFmpeg conversion completed');
                    } catch (ffmpegError) {
                        console.error('FFmpeg command failed:', ffmpegError);
                        console.error('Command that failed:', enhancedCommand);
                        
                        // Try a fallback approach for transparency handling
                        console.log('Trying fallback transparency handling...');
                        
                        // Try different background color formats
                        const fallbackColors = bgColorFormats;
                        
                        let fallbackSuccess = false;
                        for (const fallbackColor of fallbackColors) {
                            try {
                                console.log(`Trying fallback with color format: ${fallbackColor}`);
                                
                                // Try different filter approaches for transparency
                                const fallbackApproaches = [
                                    // Approach 1: Two-input method with solid background (fit mode)
                                    `-f lavfi -i color=${fallbackColor}:size=${width}x${height} -i ${inputFileName} -filter_complex [1:v]scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos[scaled];[0:v][scaled]overlay=(W-w)/2:(H-h)/2`,
                                    // Approach 2: Two-input method with solid background (fill mode)
                                    `-f lavfi -i color=${fallbackColor}:size=${width}x${height} -i ${inputFileName} -filter_complex [1:v]scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos[scaled];[scaled]crop=${width}:${height}[cropped];[0:v][cropped]overlay=(W-w)/2:(H-h)/2`,
                                    // Approach 3: Standard pad with color
                                    `scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${fallbackColor}`,
                                    // Approach 4: Use geq filter to create solid background
                                    `scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos,geq=r=${fallbackColor}:g=${fallbackColor}:b=${fallbackColor}`
                                ];
                                
                                for (let filterIndex = 0; filterIndex < fallbackApproaches.length; filterIndex++) {
                                    const filter = fallbackApproaches[filterIndex];
                                    try {
                                        console.log(`Trying filter approach ${filterIndex + 1}: ${filter}`);
                                        
                                        let fallbackCommand;
                                        if (filterIndex === 0 || filterIndex === 1) {
                                            // Two-input methods need special handling
                                            const filterComplex = filterIndex === 0 
                                                ? `[1:v]scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos[scaled];[0:v][scaled]overlay=(W-w)/2:(H-h)/2`
                                                : `[1:v]scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos[scaled];[scaled]crop=${width}:${height}[cropped];[0:v][cropped]overlay=(W-w)/2:(H-h)/2`;
                                            
                                            fallbackCommand = [
                                                '-f', 'lavfi',
                                                '-i', `color=${fallbackColor}:size=${width}x${height}`,
                                                '-i', inputFileName,
                                                '-filter_complex', filterComplex,
                                                '-pix_fmt', 'yuv420p',
                                                '-q:v', '2',
                                                '-y',
                                                `output${i}.jpg`
                                            ];
                                        } else {
                                            // Standard single-input method
                                            fallbackCommand = [
                                                '-i', inputFileName,
                                                '-vf', filter,
                                                '-pix_fmt', 'yuv420p',
                                                '-q:v', '2',
                                                '-y',
                                                `output${i}.jpg`
                                            ];
                                        }
                                        
                                        console.log('Fallback command:', fallbackCommand);
                                        await ffmpeg.run(...fallbackCommand);
                                        console.log('Fallback conversion completed with color:', fallbackColor, 'and approach:', filterIndex + 1);
                                        fallbackSuccess = true;
                                        break;
                                    } catch (filterError) {
                                        console.log(`Filter approach ${filterIndex + 1} failed:`, filterError.message);
                                        continue;
                                    }
                                }
                                
                                if (fallbackSuccess) break;
                                
                            } catch (fallbackError) {
                                console.log(`Fallback with color ${fallbackColor} failed:`, fallbackError.message);
                                continue;
                            }
                        }
                        
                        if (!fallbackSuccess) {
                            throw new Error('All fallback transparency handling methods failed');
                        }
                    }
                    
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