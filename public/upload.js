// Upload-mode logic

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const previewList = document.getElementById('preview-list');
const previewItems = document.getElementById('preview-items');
const generateUploadBtn = document.getElementById('generate-upload-btn');
const uploadSpinner = document.getElementById('upload-spinner');
const uploadBtnText = document.getElementById('upload-btn-text');
const uploadProgressBar = document.getElementById('upload-progress-bar');
const uploadProgressWrap = document.getElementById('upload-progress-wrap');
const uploadEta = document.getElementById('upload-eta');
const uploadStyleSelect = document.getElementById('upload-style');
const uploadPresenterInput = document.getElementById('upload-presenter');

let selectedFile = null;
let detectedSlides = null;

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('border-[#1A1A8C]');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('border-[#1A1A8C]');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('border-[#1A1A8C]');
  if (e.dataTransfer.files.length) {
    handleFileSelected(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) {
    handleFileSelected(fileInput.files[0]);
  }
});

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function handleFileSelected(file) {
  const validTypes = ['.pdf', '.docx'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!validTypes.includes(ext)) {
    showError('Only .pdf and .docx files are supported');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showError('File too large. Maximum size is 10MB');
    return;
  }

  selectedFile = file;
  fileInfo.textContent = `${file.name} (${formatBytes(file.size)})`;
  fileInfo.classList.remove('hidden');
  hideError();

  await fetchPreview();
}

async function fetchPreview() {
  if (!selectedFile) return;
  try {
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('style', uploadStyleSelect.value);
    formData.append('presenter', uploadPresenterInput.value);

    const response = await fetch('/api/parse-preview', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to parse document');
    }

    const data = await response.json();
    detectedSlides = data.slides || [];
    renderPreview(detectedSlides);
    generateUploadBtn.disabled = false;
  } catch (err) {
    showError(err.message);
    generateUploadBtn.disabled = true;
  }
}

function renderPreview(slides) {
  previewItems.innerHTML = '';
  slides.forEach((s) => {
    const bulletCount = Array.isArray(s.bullets) ? s.bullets.length : 0;
    const isSparse = bulletCount < 2 && !s.subtitle && !(s.stats && s.stats.length);
    const dotColor = isSparse ? 'bg-yellow-400' : 'bg-green-500';
    const bulletPreview = Array.isArray(s.bullets) ? s.bullets.slice(0, 2).join(' · ') : '';

    const item = document.createElement('div');
    item.className = 'flex items-start gap-3 border border-gray-200 rounded-lg p-3';
    item.innerHTML = `
      <span class="bg-[#1A1A8C] text-white text-xs font-semibold px-2 py-1 rounded-full">${s.slideNumber || ''}</span>
      <div class="flex-1">
        <p class="font-medium">${s.title || 'Untitled slide'}</p>
        <p class="text-sm text-gray-500">${bulletPreview}</p>
      </div>
      <span class="w-2.5 h-2.5 rounded-full mt-1.5 ${dotColor}"></span>
    `;
    previewItems.appendChild(item);
  });
  previewList.classList.remove('hidden');
}

document.getElementById('edit-structure-btn').addEventListener('click', () => {
  if (detectedSlides) {
    renderOutlineModal(detectedSlides);
  }
});

generateUploadBtn.addEventListener('click', async () => {
  if (!selectedFile) return;
  hideError();
  hideSuccess();

  generateUploadBtn.disabled = true;
  uploadSpinner.classList.remove('hidden');
  uploadBtnText.textContent = 'Generating your deck...';
  const stopProgress = startFakeProgress(uploadProgressBar, uploadProgressWrap, uploadEta);

  try {
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('style', uploadStyleSelect.value);
    formData.append('presenter', uploadPresenterInput.value);

    const response = await fetch('/api/generate/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to generate presentation');
    }

    const filename = extractFilenameFromDisposition(response.headers.get('Content-Disposition')) || 'EKEDC_Presentation.pptx';
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    showSuccess(blobUrl, filename);
  } catch (err) {
    showError(err.message);
  } finally {
    stopProgress();
    generateUploadBtn.disabled = false;
    uploadSpinner.classList.add('hidden');
    uploadBtnText.textContent = 'Generate from document';
  }
});
