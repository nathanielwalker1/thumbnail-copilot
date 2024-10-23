const express = require('express');
const app = express();
require('dotenv').config();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('=================================');
    console.log(`🚀 Server is running!`);
    console.log(`📁 http://localhost:${PORT}`);
    console.log('=================================');
});