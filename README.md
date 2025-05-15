# Online Widescreen Image Converter

A web-based tool for converting images to widescreen format with customizable dimensions and background color. This tool runs entirely in the browser using FFmpeg.wasm.

## Features

- Drag and drop image upload
- Multiple image processing
- Custom output dimensions
- Custom background color with hex code support
- Batch download as ZIP
- No server-side processing required
- Works entirely in the browser

## Technologies Used

- FFmpeg.wasm for image processing
- TailwindCSS for styling
- JSZip for batch downloads
- Pure JavaScript for the frontend

## Development

To run locally:

1. Clone this repository
2. Navigate to the project directory
3. Start a local server (e.g., `python3 -m http.server 8000`)
4. Open `http://localhost:8000` in your browser

## Deployment

This site is deployed using GitHub Pages. To deploy your own version:

1. Fork this repository
2. Enable GitHub Pages in your repository settings
3. Set up Cloudflare (for CORS headers)
4. Your site will be available at `https://[username].github.io/[repository-name]`

## License

MIT License 