const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for SPA-like behavior (optional but good practice)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Frontend server is running on http://localhost:${PORT}`);
    console.log(`Press Ctrl+C to quit.`);
});
