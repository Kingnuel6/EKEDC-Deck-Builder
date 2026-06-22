# EKEDC Deck Builder

A standalone web tool for Eko Electricity Distribution PLC (EKEDC) managers to generate branded PowerPoint presentations. Build a deck by filling a manual entry form, or upload a labelled PDF/DOCX document and let the AI structure it into slides.

## Prerequisites

- Node.js 18+
- An OpenRouter API key (see below)

## Setup

```bash
npm install
cp .env.example .env
# add your OpenRouter API key to .env
npm run dev
```

The app runs at `http://localhost:3000` by default.

## How to use

### Manual entry mode

Fill in the presentation title, type, audience, presenter, key message, slide count, and optional slide-by-slide notes. Pick a slide style (Executive dark, Clean light, or Bold accent) and click "Generate presentation" to download a branded `.pptx`. Use "Preview outline first" to see the AI-structured outline before generating.

### Upload document mode

Drag and drop a `.pdf` or `.docx` file. The app automatically parses it and shows a "Detected slide structure" preview. To get the best results, label your sections in the document like this:

```
Slide 1: Introduction
Welcome and overview of the quarter...

Slide 2: Key performance indicators
Customer complaints down 12%...
```

Slides with sparse content are flagged with a yellow dot and will be intelligently expanded by AI. Choose a style and presenter name, then click "Generate from document" to download the `.pptx`.

## Getting an OpenRouter API key

Sign up and create a key at [https://openrouter.ai/keys](https://openrouter.ai/keys).

Recommended model: `anthropic/claude-3.5-sonnet`.
