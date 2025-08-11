# Online File to JPG Converter

A web-based tool that converts any file type to JPG format with customizable dimensions and background colors. Built with FFmpeg.wasm for powerful file processing capabilities.

## Features

- **Universal File Support**: Upload any file type (images, videos, documents, etc.)
- **JPG Conversion**: Convert all files to high-quality JPG format
- **Custom Dimensions**: Set custom width and height for output images
- **Background Color**: Choose any background color for the converted images
- **Transparency Handling**: Automatically fills transparent areas in PNG files with your selected background color
- **Batch Processing**: Convert multiple files simultaneously
- **ZIP Download**: Download all converted files as a single ZIP archive
- **Modern UI**: Clean, responsive interface built with TailwindCSS
- **Real-time Status**: Clear visual feedback with progress bars and status indicators

## How It Works

This converter uses FFmpeg.wasm, a WebAssembly port of FFmpeg that runs entirely in your browser. It can process virtually any file format and convert it to JPG with the specified dimensions and background color.

**Key Technical Details:**
- Uses `FileReader` instead of network requests for local file processing
- Enhanced FFmpeg commands for proper transparency handling
- Optimized for PNG files with alpha channels
- Maintains aspect ratio while resizing to target dimensions

## Use Cases

- **Image Resizing**: Resize images to specific dimensions for social media, websites, or printing
- **Format Conversion**: Convert various file formats to JPG for compatibility
- **Transparency Removal**: Convert PNG logos/icons with transparent backgrounds to solid JPG images
- **Batch Processing**: Process multiple files at once for efficiency
- **Background Replacement**: Add custom backgrounds to images or documents
- **Web Development**: Prepare images for web use with consistent dimensions

## Requirements

- **Modern Browser**: Chrome 67+, Firefox 79+, Edge 79+ (Safari not recommended)
- **Local Server**: Must be run from a local HTTP server (not `file://` protocol)
- **Internet Connection**: Required for initial FFmpeg.wasm download
- **Security Headers**: Requires specific CORS headers for SharedArrayBuffer support

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd widescreen-converter
```

### 2. Start the Local Server
**Important**: Use the provided `server.py` script for proper security headers:

```bash
python3 server.py
```

**Why `server.py`?** FFmpeg.wasm requires specific security headers (`Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`) to enable `SharedArrayBuffer` support. The `server.py` script provides these headers automatically.

**Don't use `python3 -m http.server`** - it lacks the necessary security headers and will cause SharedArrayBuffer errors.

### 3. Open in Browser
Navigate to `http://localhost:8000` in your browser.

### 4. Convert Files
1. Drag and drop files or click to select
2. Set desired dimensions and background color
3. Click "Convert Files to JPG"
4. Download individual files or all as ZIP

## File Processing Details

### Supported Input Formats
- **Images**: PNG, JPG, GIF, BMP, TIFF, WebP, etc.
- **Videos**: MP4, AVI, MOV, MKV, etc.
- **Documents**: PDF, DOC, etc.
- **Any file type** that FFmpeg can process

### Output Format
- **Format**: JPG (JPEG)
- **Quality**: High quality (Q=2)
- **Transparency**: All transparent areas filled with selected background color
- **Dimensions**: Exact size specified (with aspect ratio preservation)

### Transparency Handling
- PNG files with transparent backgrounds are automatically processed
- Transparent areas are filled with your selected background color
- Semi-transparent areas are blended with the background
- Output JPGs have no transparency (as JPG doesn't support it)

## Alternative Servers

If you prefer not to use Python, you can use other servers that support custom headers:

### Node.js
```bash
npx http-server --cors -p 8000
```

### PHP
```bash
php -S localhost:8000
```

**Note**: You'll need to configure these servers to include the required security headers for FFmpeg.wasm to work properly.

## Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 67+ | ✅ Full Support | Best performance |
| Firefox 79+ | ✅ Full Support | Good performance |
| Edge 79+ | ✅ Full Support | Good performance |
| Safari | ❌ Limited | WebAssembly limitations |

## Troubleshooting

### SharedArrayBuffer Error
If you see "SharedArrayBuffer is not defined":
- **Use the provided `server.py` script** - it includes the required security headers
- **Don't use `python3 -m http.server`** - it lacks the necessary headers
- **Ensure you're using a modern browser** (Chrome, Firefox, or Edge)

### FFmpeg Loading Issues
- Refresh the page if FFmpeg fails to load initially
- Check your internet connection (FFmpeg.wasm needs to download core files)
- Try a different browser if issues persist

### Conversion Errors
- Check browser console for detailed error messages
- Ensure files aren't corrupted or extremely large
- Try with smaller/simpler files first

## Development History

This project evolved from a debugging session to solve FFmpeg.wasm compatibility issues:

1. **Initial Problem**: SharedArrayBuffer not defined due to missing security headers
2. **Solution**: Created `server.py` with proper CORS headers
3. **File Processing**: Replaced `fetchFile` with `FileReader` for local file handling
4. **Transparency**: Enhanced FFmpeg commands for better PNG transparency handling
5. **UI Improvements**: Added clear status indicators and progress feedback

## Project Structure

```
widescreen-converter/
├── index.html          # Main interface
├── app.js             # Core functionality and FFmpeg integration
├── server.py          # Local server with proper security headers
├── README.md          # This documentation
└── .gitignore         # Git ignore file
```

## Deployment

For production deployment:
1. Ensure your server includes the required security headers:
   - `Cross-Origin-Opener-Policy: same-origin`
   - `Cross-Origin-Embedder-Policy: require-corp`
2. Consider using a CDN for FFmpeg.wasm files
3. Test thoroughly in your target browsers
4. Ensure SharedArrayBuffer support is enabled

## License

MIT License 