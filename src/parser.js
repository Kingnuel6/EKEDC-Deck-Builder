const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function parsePDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

async function parseDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function extractText(filePath, mimetype) {
  if (mimetype === 'application/pdf') {
    return parsePDF(filePath);
  }
  if (
    mimetype ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return parseDOCX(filePath);
  }
  throw new Error('Only .pdf and .docx files are supported');
}

module.exports = { parsePDF, parseDOCX, extractText };
