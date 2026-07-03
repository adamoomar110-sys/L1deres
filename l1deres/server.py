#!/usr/bin/env python3
"""Servidor local sin cache para desarrollo del lavadero."""
import http.server
import socketserver

PORT = 8080

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):
        print(f"[{self.address_string()}] {format % args}")

with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
    print(f"[OK] Servidor sin cache corriendo en http://localhost:{PORT}")
    print("   Presioná Ctrl+C para detenerlo.\n")
    httpd.serve_forever()
