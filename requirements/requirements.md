// Project Overview

We're creating a thumbnail editing tool that allows users to create ane edit engaging thumbnails for their Amazon product reviews.

// Feature requirements 

1. Image Upload & Display:
- File input for image upload
- Canvas display with basic image rendering
- Support for popular image formats (JPEG, PNG, etc.)

2. GPT-4V Integration:
- Use GPT-4V to analyze the image and provide feedback on the image quality and suitability for a thumbnail
- Detect main product location
- Assess photo clarity (goood or bad), focal point (strong or weak), brightness (slightly bright or slightly dark), contrast (slightly high or slightly low), saturation (slightly high or slightly low), sharpness (slightly sharp or slightly blurry)
- Evaluate overall thumbnail effectiveness and give it a score out of 100
- Generate specific numerical recommendations for improvements
- Generate potential thumbnail text to display

3. Auto-enhancement features:
a. "Auto-Enhance" Button:
- Automatically adjusts:
  * Brightness (-100 to +100)
  * Contrast (-100 to +100)
  * Saturation (-100 to +100)
  * Sharpness (-100 to +100)
- Animates slider transitions smoothly
- Provides before/after comparison
- Includes undo/reset capability

b. "Auto-Circle Product" Button:
- Automatically identifies product location using GPT-4V coordinates
- Places and animates red circle appearance
- Optimizes circle size based on product dimensions
- Allows manual adjustment after placement
- Supports dragging/repositioning

#### 4. Manual Adjustments
- Real-time adjustment sliders (as backup to auto-enhance)
- Immediate preview updates
- Reset to original capability
- Aspect ratio selection (16:9 or 4:3)

#### 5. Overlay Elements
- Draggable red circles (manual option)
- Text overlay with standardized font, size, color, and drag-and-drop positioning


// Tech stack
- Vanilla JS
- HTML Canvas
- OpenAI API
- Express.js 

// Technical Implementation

### GPT-4V Integration
<!-- ```javascript
// Example GPT-4V Response Format
{
  "analysis": {
    "quality_score": 85,
    "recommendations": "...",
    "adjustments": {
      "brightness": 20,
      "contrast": 15,
      "saturation": -5
    },
    "product_location": {
      "x": 0.7,    // 70% from left
      "y": 0.5,    // 50% from top
      "size": 0.15 // 15% of image width
    }
  }
} -->

// Docs
- https://platform.openai.com/docs/guides/vision
- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement

// File structure
THUMBNAIL-COPILOT
├── node_modules/
├── public/
│   ├── index.html
│   ├── editor.html
│   ├── editor.js
│   ├── home.js
│   └── style.css
│   └── components/
├── requirements/
├── server/
├── .env
├── .gitignore
├── package-lock.json
└── package.json