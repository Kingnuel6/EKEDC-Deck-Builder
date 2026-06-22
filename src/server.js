require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { extractText } = require('./parser');
const { generateSlides } = require('./ai');
const { buildPresentation } = require('./pptxBuilder');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const isServerless = !!process.env.VERCEL;
const uploadsDir = isServerless ? path.join('/tmp', 'uploads') : path.join(__dirname, '..', 'uploads');
const outputDir = isServerless ? path.join('/tmp', 'output') : path.join(__dirname, '..', 'output');
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      return cb(new Error('Only .pdf and .docx files are supported'));
    }
    cb(null, true);
  },
});

function scheduleCleanup(filePath) {
  setTimeout(() => {
    fs.unlink(filePath, () => {});
  }, 60000);
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.post('/api/generate/manual', async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    const { title, type, audience, presenter, keyMessage, slideCount, slideNotes, style } = req.body;

    const slides = await generateSlides({
      mode: 'manual',
      data: { title, type, audience, presenter, keyMessage, slideCount, slideNotes },
    });

    const filePath = await buildPresentation(slides, style, presenter);

    res.download(filePath, path.basename(filePath), () => {
      scheduleCleanup(filePath);
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post('/api/generate/upload', upload.single('file'), async (req, res) => {
  let uploadedFilePath;
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Only .pdf and .docx files are supported' });
    }
    uploadedFilePath = req.file.path;
    const { style, presenter } = req.body;

    const text = await extractText(uploadedFilePath, req.file.mimetype);
    const slides = await generateSlides({ mode: 'upload', text, style, presenter });
    const filePath = await buildPresentation(slides, style, presenter);

    res.download(filePath, path.basename(filePath), () => {
      scheduleCleanup(filePath);
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  } finally {
    if (uploadedFilePath) {
      fs.unlink(uploadedFilePath, () => {});
    }
  }
});

app.post('/api/parse-preview', upload.single('file'), async (req, res) => {
  let uploadedFilePath;
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Only .pdf and .docx files are supported' });
    }
    uploadedFilePath = req.file.path;
    const { style, presenter } = req.body;

    const text = await extractText(uploadedFilePath, req.file.mimetype);
    const slides = await generateSlides({ mode: 'upload', text, style, presenter });

    res.json({ slides });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  } finally {
    if (uploadedFilePath) {
      fs.unlink(uploadedFilePath, () => {});
    }
  }
});

app.get('/download/:filename', (req, res) => {
  const filePath = path.join(outputDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.download(filePath);
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 10MB' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`EKEDC Deck Builder running on http://localhost:${PORT}`);
  });
}

module.exports = app;
