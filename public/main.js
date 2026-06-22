// Shared utilities + form-mode logic

function showError(message) {
  const banner = document.getElementById('error-banner');
  const msg = document.getElementById('error-message');
  msg.textContent = message;
  banner.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error-banner').classList.add('hidden');
}

function showSuccess(blobUrl, filename) {
  const banner = document.getElementById('success-banner');
  banner.classList.remove('hidden');
  const downloadBtn = document.getElementById('download-btn');
  downloadBtn.onclick = () => {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'EKEDC_Presentation.pptx';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
}

function hideSuccess() {
  document.getElementById('success-banner').classList.add('hidden');
}

function startFakeProgress(barEl, wrapEl, etaEl) {
  wrapEl.classList.remove('hidden');
  etaEl.classList.remove('hidden');
  barEl.style.width = '0%';
  let pct = 0;
  const duration = 30000;
  const stepTime = 300;
  const steps = duration / stepTime;
  const increment = 85 / steps;
  const interval = setInterval(() => {
    pct = Math.min(pct + increment, 85);
    barEl.style.width = pct + '%';
  }, stepTime);
  return () => {
    clearInterval(interval);
    barEl.style.width = '100%';
    setTimeout(() => {
      wrapEl.classList.add('hidden');
      etaEl.classList.add('hidden');
    }, 400);
  };
}

function extractFilenameFromDisposition(header) {
  if (!header) return null;
  const match = header.match(/filename="?([^"]+)"?/);
  return match ? match[1] : null;
}

// Tab / sidebar nav switching
function setActivePanel(mode) {
  const panelManual = document.getElementById('panel-manual');
  const panelUpload = document.getElementById('panel-upload');
  const tabManual = document.getElementById('tab-manual');
  const tabUpload = document.getElementById('tab-upload');
  const navManual = document.getElementById('nav-manual');
  const navUpload = document.getElementById('nav-upload');

  const activeClasses = ['bg-[#1A1A8C]', 'text-white'];
  const inactiveTabClasses = ['bg-gray-200', 'text-gray-700'];
  const inactiveNavClasses = ['text-gray-700', 'hover:bg-gray-100'];

  if (mode === 'manual') {
    panelManual.classList.remove('hidden');
    panelUpload.classList.add('hidden');
    tabManual.className = 'px-4 py-2 rounded-lg font-medium bg-[#1A1A8C] text-white';
    tabUpload.className = 'px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700';
    navManual.className = 'w-full text-left px-3 py-2 rounded-lg font-medium bg-[#1A1A8C] text-white';
    navUpload.className = 'w-full text-left px-3 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100';
  } else {
    panelManual.classList.add('hidden');
    panelUpload.classList.remove('hidden');
    tabUpload.className = 'px-4 py-2 rounded-lg font-medium bg-[#1A1A8C] text-white';
    tabManual.className = 'px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700';
    navUpload.className = 'w-full text-left px-3 py-2 rounded-lg font-medium bg-[#1A1A8C] text-white';
    navManual.className = 'w-full text-left px-3 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100';
  }
  hideError();
  hideSuccess();
}

document.getElementById('tab-manual').addEventListener('click', () => setActivePanel('manual'));
document.getElementById('tab-upload').addEventListener('click', () => setActivePanel('upload'));
document.getElementById('nav-manual').addEventListener('click', () => setActivePanel('manual'));
document.getElementById('nav-upload').addEventListener('click', () => setActivePanel('upload'));
document.getElementById('error-dismiss').addEventListener('click', hideError);
document.getElementById('reset-btn').addEventListener('click', () => {
  hideSuccess();
});

// Slide count pills
const slideCountPills = document.querySelectorAll('#slide-count-pills .pill');
const customCountInput = document.getElementById('custom-count');
const slideCountHidden = document.getElementById('slideCount');

slideCountPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    slideCountPills.forEach((p) => (p.className = 'pill px-3 py-1.5 rounded-full border border-gray-300 text-sm'));
    pill.className = 'pill px-3 py-1.5 rounded-full border border-gray-300 text-sm bg-[#1A1A8C] text-white';
    const count = pill.dataset.count;
    if (count === 'custom') {
      customCountInput.classList.remove('hidden');
      customCountInput.focus();
      slideCountHidden.value = customCountInput.value || 8;
    } else {
      customCountInput.classList.add('hidden');
      slideCountHidden.value = count;
    }
  });
});

customCountInput.addEventListener('input', () => {
  slideCountHidden.value = customCountInput.value || 8;
});

// Style card selection
document.querySelectorAll('.style-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.style-card').forEach((c) => (c.className = 'style-card border-2 border-gray-200 rounded-lg p-3 cursor-pointer'));
    card.className = 'style-card border-2 border-[#1A1A8C] rounded-lg p-3 cursor-pointer';
  });
});

// Manual form submit -> generate
const manualForm = document.getElementById('manual-form');
const generateManualBtn = document.getElementById('generate-manual-btn');
const manualSpinner = document.getElementById('manual-spinner');
const manualBtnText = document.getElementById('manual-btn-text');
const manualProgressBar = document.getElementById('manual-progress-bar');
const manualProgressWrap = document.getElementById('manual-progress-wrap');
const manualEta = document.getElementById('manual-eta');

function getManualFormData() {
  const formData = new FormData(manualForm);
  return {
    title: formData.get('title'),
    type: formData.get('type'),
    audience: formData.get('audience'),
    presenter: formData.get('presenter'),
    keyMessage: formData.get('keyMessage'),
    slideCount: Number(slideCountHidden.value) || 8,
    slideNotes: formData.get('slideNotes'),
    style: formData.get('style'),
  };
}

manualForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  hideSuccess();

  generateManualBtn.disabled = true;
  manualSpinner.classList.remove('hidden');
  manualBtnText.textContent = 'Generating your deck...';
  const stopProgress = startFakeProgress(manualProgressBar, manualProgressWrap, manualEta);

  try {
    const payload = getManualFormData();
    const response = await fetch('/api/generate/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
    generateManualBtn.disabled = false;
    manualSpinner.classList.add('hidden');
    manualBtnText.textContent = 'Generate presentation';
  }
});

// Preview outline first
document.getElementById('preview-outline-btn').addEventListener('click', async () => {
  hideError();
  try {
    const payload = getManualFormData();
    const response = await fetch('/api/generate/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    // Fallback: if no dedicated preview endpoint for manual mode, attempt a lightweight
    // client-side outline preview is not possible without server support, so we just
    // surface validation errors via the same endpoint contract.
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to preview outline');
    }
    // If generate succeeded, treat as outline available; show success banner instead.
    const filename = extractFilenameFromDisposition(response.headers.get('Content-Disposition')) || 'EKEDC_Presentation.pptx';
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    showSuccess(blobUrl, filename);
  } catch (err) {
    showError(err.message);
  }
});

// Outline modal close
document.getElementById('close-outline-modal').addEventListener('click', () => {
  document.getElementById('outline-modal').classList.add('hidden');
});

function renderOutlineModal(slides) {
  const content = document.getElementById('outline-modal-content');
  content.innerHTML = '';
  slides.forEach((s) => {
    const div = document.createElement('div');
    div.className = 'border border-gray-200 rounded-lg p-3';
    const bullets = Array.isArray(s.bullets) ? s.bullets.join(', ') : '';
    div.innerHTML = `
      <div class="flex items-center gap-2 mb-1">
        <span class="bg-[#1A1A8C] text-white text-xs px-2 py-0.5 rounded-full">${s.slideNumber || ''}</span>
        <span class="font-medium">${s.title || ''}</span>
      </div>
      <p class="text-sm text-gray-500">${bullets}</p>
    `;
    content.appendChild(div);
  });
  document.getElementById('outline-modal').classList.remove('hidden');
}

// Default panel
setActivePanel('manual');
