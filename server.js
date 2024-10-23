const express = require('express');
const multer = require('multer');
const axios = require('axios');
const app = express();
require('dotenv').config();

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json({ limit: '50mb' }));
app.use(express.static('public')); // Serve static files from the public directory

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Log API key status
console.log('API Key exists:', !!OPENAI_API_KEY); // Should print true
console.log('API Key length:', OPENAI_API_KEY.length); // Should be reasonable

app.post('/analyze-image', upload.single('image'), async (req, res) => {
    console.log('Received image for analysis'); // Log when an image is received

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const base64Image = req.file.buffer.toString('base64');
        const prompt = `Analyze this image for use as an Amazon product thumbnail. 
        Provide analysis in exactly this format:

        1. CLARITY: [Strong/Weak]
        2. FOCAL_POINT: [Strong/Weak]
        3. BRIGHTNESS: [Good/Poor]
        4. CONTRAST: [Good/Poor]
        5. SATURATION: [Good/Poor]
        6. SHARPNESS: [Good/Poor]
        SCORE: [0-100]
        
        Each of these represent 16.7% of the total score. If any of these are poor, the score will be lower.
        
        For example, if clarity, focal_point, brightness, saturation are all good, but contrast and sharpness are poor, the score will be 67%.
        
        Also provide SUGGESTED_TEXT: [Suggested thumbnail text, must be from these options or very similar: "What I like about this product", "Check this out", "You must see this", "You need to see this", "My first impressions", "What you need to know", "What makes this special", "What you need to know about this", "What makes this unique", "What makes this special", "How well does this work?"]
`;

        const payload = {
            model: "gpt-4-turbo",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { 
                            type: "image_url", 
                            image_url: { 
                                url: `data:${req.file.mimetype};base64,${base64Image}` 
                            }
                        }
                    ]
                }
            ],
            max_tokens: 300
        };

        const response = await axios.post(OPENAI_API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            }
        });

        // Log the OpenAI response for debugging
        console.log('GPT-4V Raw Response:', response.data);

        // Format the analysis in a structured way
        const messageContent = response.data.choices[0].message.content;
        const analysis = {
            quality_score: parseInt(messageContent.match(/SCORE: (\d+)/)?.[1]) || 0,
            photo_clarity: extractValue(messageContent, 'CLARITY'),
            focal_point: extractValue(messageContent, 'FOCAL_POINT'),
            brightness: extractValue(messageContent, 'BRIGHTNESS'),
            contrast: extractValue(messageContent, 'CONTRAST'),
            saturation: extractValue(messageContent, 'SATURATION'),
            sharpness: extractValue(messageContent, 'SHARPNESS'),
            product_location: {
                x: 0.5, // Default values
                y: 0.5,
                size: 0.15
            },
            suggested_text: extractValue(messageContent, 'SUGGESTED_TEXT')
        };

        // Log the formatted analysis
        console.log('Formatted Analysis:', analysis);

        res.json({ analysis });
    } catch (error) {
        console.error('Error analyzing image:', error);
        console.error('Error details:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to analyze image' });
    }
});

// Helper function to extract values from GPT-4V response
function extractValue(content, key) {
    const regex = new RegExp(`${key}:\\s*(.+)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
