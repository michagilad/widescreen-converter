# Widescreen Converter

Convert images to 16:9 JPG format with customizable background colors and scaling modes.

## Features

- **Multiple Scaling Modes:**
  - **Fit**: Maintains aspect ratio, scales image to fit within dimensions, adds background color
  - **Fill**: Maintains aspect ratio, scales image to fill dimensions, crops excess parts
  - **1x1 Safe Zone**: Ensures image is no wider than 1:1, centered on 16:9 background

- **Background Color Support**: Fill transparent areas with any color
- **High Quality Output**: Optimized JPG conversion with proper color profiles
- **Batch Processing**: Convert multiple files at once
- **Drag & Drop Interface**: Easy file upload

## Scaling Modes Explained

### Fit Mode
- Scales image to fit within target dimensions while maintaining aspect ratio
- Adds background color to fill any remaining space
- Good for preserving entire image content

### Fill Mode
- Scales image to fill target dimensions while maintaining aspect ratio
- Crops excess parts from center
- Good for filling entire frame without background

### 1x1 Safe Zone Mode
- **NEW**: Ensures the image itself is no wider than 1:1 after background is added
- For 1920x1080 output, image is limited to 1080x1080 maximum
- Image is centered on the 16:9 background
- Perfect for presentations, videos, or any content where you want to ensure the image content never exceeds a 1:1 aspect ratio
- Useful for 4:3 images that need to be displayed on widescreen formats

## Usage

1. **Upload Files**: Drag and drop or click to select files
2. **Configure Settings**:
   - Set output dimensions (default: 1920x1080)
   - Choose background color
   - Select scaling mode
3. **Convert**: Click "Convert Files to JPG"
4. **Download**: Download individual files or all as ZIP

## Technical Details

- Uses FFmpeg for high-quality image processing
- Supports PNG transparency with background color filling
- Maintains proper color profiles and quality settings
- Handles various input formats automatically

## Examples

### 1x1 Safe Zone Use Case
- **Input**: 4:3 image (1200x900)
- **Output**: 1920x1080 with image centered at 1080x1080
- **Result**: Image is scaled down to fit within 1080x1080 safe zone, centered on black 16:9 background

This ensures the image content never exceeds a square format, making it safe for widescreen displays while maintaining readability and visual balance. 