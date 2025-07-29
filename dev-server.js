/**
 * Simple development server for handling email confirmations
 * Run with: node dev-server.js
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Handle the root path with hash parameters
  if (parsedUrl.pathname === '/') {
    // Redirect to the Chrome extension with the hash parameters
    const extensionId = 'YOUR_EXTENSION_ID'; // Replace with your actual extension ID
    const redirectUrl = `chrome-extension://${extensionId}/src/ui/confirm.html${parsedUrl.hash || ''}`;
    
    res.writeHead(302, { 'Location': redirectUrl });
    res.end();
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Development server running at http://localhost:${PORT}`);
  console.log('This server will redirect Supabase confirmations to your Chrome extension');
  console.log('Make sure to replace YOUR_EXTENSION_ID with your actual extension ID');
});