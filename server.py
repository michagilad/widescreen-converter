#!/usr/bin/env python3
"""
Local HTTP server with FFmpeg.wasm security headers
This server includes the Cross-Origin headers required for SharedArrayBuffer
"""
import http.server
import socketserver
import os

class FFmpegWasmHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add FFmpeg.wasm required security headers
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')
        super().end_headers()

if __name__ == '__main__':
    PORT = 8000
    
    # Change to the directory containing this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), FFmpegWasmHTTPRequestHandler) as httpd:
        print(f"🚀 FFmpeg.wasm server running on http://localhost:{PORT}")
        print(f"📁 Serving files from: {os.getcwd()}")
        print(f"🔒 Security headers enabled for SharedArrayBuffer support")
        print(f"⏹️  Press Ctrl+C to stop the server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n🛑 Server stopped")
