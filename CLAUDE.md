# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nano Banana** is a modern web application for AI outfit transfer using Google's GenAI Imagen model. It allows users to transfer clothing from a reference image to their personal photo while preserving facial features, pose, and body characteristics. The application features both a web interface and CLI tool.

## Common Development Commands

```bash
# Install dependencies
npm install

# Start web server (main application)
npm start

# Development mode with auto-reload
npm run dev

# CLI usage (legacy command-line interface)
npm run cli <user_photo> <outfit_reference> [output_name]
```

## High-Level Architecture

### Web Application Stack

**Frontend Architecture** (`public/`)
- **Vanilla JavaScript SPA**: No framework dependencies, modern ES6+ patterns
- **Drag & Drop Interface**: Native HTML5 drag-and-drop with visual feedback
- **Glassmorphism UI**: Modern design with backdrop-filter effects and smooth animations
- **Client-side API Key Management**: Users provide their own Google AI Studio keys

**Backend Architecture** (`server.js`)
- **Express.js REST API**: Lightweight server handling image processing requests
- **Stateless Design**: No session management, each request is independent
- **Memory-efficient**: Large image payloads handled via base64 encoding with 50MB limit
- **Error Handling**: Comprehensive error mapping for Google AI API responses

### Core Data Flow

1. **Client Upload**: User drags/selects two images (user photo + outfit reference)
2. **Base64 Conversion**: Frontend converts images to base64 for API transmission
3. **API Request**: POST to `/api/transfer-outfit` with user's API key and image data
4. **AI Processing**: Server initializes Google GenAI client with user's key
5. **Prompt Engineering**: Detailed Spanish prompts for identity-preserving outfit transfer
6. **Image Generation**: Imagen 3 model generates 2 high-resolution variations
7. **Response Delivery**: Base64 encoded results returned to frontend for download

### Key Technical Patterns

**Multi-Image Context Processing**
- Simultaneous processing of user photo and outfit reference
- Dual image input to Google's Imagen 3 model for context-aware generation
- Structured prompt engineering maintains person identity while transferring clothing

**Frontend State Management**
- Class-based architecture (`NanoBananaWeb`) for organized state handling
- Real-time form validation and UI feedback
- Progressive enhancement from basic file uploads to drag & drop

**Security & Privacy**
- Client-side API key management (no server-side storage)
- File validation on both frontend and backend
- No permanent storage of user images or generated content

## User Interface Components

**Advanced Upload System**
- Drag & drop zones with visual hover states and animations
- Traditional file picker fallback for accessibility
- Real-time image preview with error handling
- Support for JPG, PNG, WebP formats

**Processing & Results**
- Animated loading states with progress indicators
- Grid-based results display with individual download buttons
- Batch download functionality for multiple generated images
- Responsive design for mobile and desktop usage

## Google GenAI Integration

**Model Configuration**
- Model: `imagen-3.0-generate-002` for superior quality
- Output: 2K resolution, 1:1 aspect ratio images
- Generation: 2 variations per request for better results
- Context: Dual image input with detailed Spanish prompts

**API Key Management**
- User-provided keys through frontend interface
- No environment variables required for deployment
- Direct client-to-server-to-Google API flow

## Project Structure

```
nano-mango/
├── public/              # Frontend web application
│   ├── index.html      # Main HTML with drag-drop interface
│   ├── style.css       # Modern CSS with glassmorphism design
│   └── script.js       # Vanilla JS with drag-drop functionality
├── server.js           # Express server with /api/transfer-outfit endpoint
├── index.js            # CLI application (legacy, standalone)
├── package.json        # Dependencies: @google/genai, express
└── README.md           # User documentation
```

## Development Notes

**Frontend Development**
- Modern CSS features: backdrop-filter, CSS Grid, custom properties
- Vanilla JavaScript with ES6+ features and async/await patterns
- No build process required - direct file serving via Express static middleware

**Backend Development**
- Express middleware handles CORS, JSON parsing (50MB limit), and static file serving
- Comprehensive error mapping for Google AI API responses
- Request validation for required fields and image formats

**Testing Workflow**
- Manual testing via web interface at `http://localhost:3000`
- CLI testing via `npm run cli` for batch processing workflows
- Error scenarios: invalid API keys, quota limits, malformed images