const PptxGenJS = require('pptxgenjs');
const path = require('path');

const BRAND = {
  navy: '1A1A8C',
  yellow: 'FFD700',
  red: 'CC0000',
  white: 'FFFFFF',
  lightBg: 'F4F6FB',
  darkText: '1A1A8C',
  bodyText: '333333',
};

const FOOTER_TEXT = 'Eko Electricity Distribution PLC | Confidential';

function addFooter(slide, pageNumber) {
  slide.addText(FOOTER_TEXT, {
    x: 0,
    y: 7.1,
    w: 13.33,
    h: 0.3,
    align: 'center',
    fontSize: 9,
    color: BRAND.navy,
  });
  if (pageNumber) {
    slide.addText(String(pageNumber), {
      x: 12.6,
      y: 7.1,
      w: 0.6,
      h: 0.3,
      align: 'right',
      fontSize: 9,
      color: BRAND.navy,
    });
  }
}

function buildTitleSlide(pptx, s, presenter) {
  const slide = pptx.addSlide({ sectionTitle: 'Title' });
  slide.background = { color: BRAND.navy };

  slide.addShape(pptx.ShapeType.rect, {
    x: 6.57,
    y: 2.3,
    w: 0.28,
    h: 0.06,
    fill: { color: BRAND.yellow },
  });

  slide.addText(s.title || 'EKEDC Presentation', {
    x: 0.5,
    y: 2.5,
    w: 12.33,
    h: 1,
    align: 'center',
    fontSize: 40,
    bold: true,
    color: BRAND.white,
  });

  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: 0.5,
      y: 3.6,
      w: 12.33,
      h: 0.6,
      align: 'center',
      fontSize: 18,
      color: BRAND.white,
    });
  }

  slide.addText(presenter || '', {
    x: 0.4,
    y: 6.9,
    w: 4,
    h: 0.4,
    align: 'left',
    fontSize: 12,
    color: BRAND.white,
  });

  const dateStr = new Date().toLocaleDateString('en-NG', {
    month: 'long',
    year: 'numeric',
  });
  slide.addText(dateStr, {
    x: 8.93,
    y: 6.9,
    w: 4,
    h: 0.4,
    align: 'right',
    fontSize: 12,
    color: BRAND.white,
  });

  slide.addText('Eko Electricity Distribution PLC', {
    x: 0,
    y: 7.15,
    w: 13.33,
    h: 0.3,
    align: 'center',
    fontSize: 10,
    color: BRAND.yellow,
  });

  if (s.speakerNotes) slide.addNotes(s.speakerNotes);
}

function buildContentSlide(pptx, s, pageNumber) {
  const slide = pptx.addSlide();
  slide.background = { color: BRAND.white };

  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.1,
    h: 7.5,
    fill: { color: BRAND.navy },
  });

  slide.addText(s.title || '', {
    x: 0.5,
    y: 0.4,
    w: 12.3,
    h: 0.8,
    fontSize: 28,
    bold: true,
    color: BRAND.navy,
  });

  if (Array.isArray(s.bullets) && s.bullets.length) {
    slide.addText(
      s.bullets.map((b) => ({
        text: b,
        options: {
          bullet: { code: '25CF', color: BRAND.yellow },
          color: BRAND.bodyText,
          fontSize: 14,
          breakLine: true,
          paraSpaceAfter: 12,
        },
      })),
      { x: 0.7, y: 1.5, w: 11.9, h: 5 }
    );
  }

  addFooter(slide, pageNumber);
  if (s.speakerNotes) slide.addNotes(s.speakerNotes);
}

function buildTwoColumnSlide(pptx, s, pageNumber) {
  const slide = pptx.addSlide();
  slide.background = { color: BRAND.white };

  slide.addText(s.title || '', {
    x: 0.5,
    y: 0.35,
    w: 12.3,
    h: 0.7,
    fontSize: 24,
    bold: true,
    color: BRAND.navy,
  });

  slide.addShape(pptx.ShapeType.line, {
    x: 6.665,
    y: 1.3,
    w: 0,
    h: 5.4,
    line: { color: BRAND.yellow, width: 1.5 },
  });

  const left = s.leftColumn || {};
  const right = s.rightColumn || {};

  slide.addText(left.heading || '', {
    x: 0.6,
    y: 1.3,
    w: 5.7,
    h: 0.5,
    fontSize: 14,
    bold: true,
    color: BRAND.navy,
  });
  if (Array.isArray(left.bullets) && left.bullets.length) {
    slide.addText(
      left.bullets.map((b) => ({
        text: b,
        options: { bullet: { code: '25CF', color: BRAND.yellow }, color: BRAND.bodyText, fontSize: 13, breakLine: true, paraSpaceAfter: 10 },
      })),
      { x: 0.6, y: 1.9, w: 5.7, h: 4.7 }
    );
  }

  slide.addText(right.heading || '', {
    x: 7.0,
    y: 1.3,
    w: 5.7,
    h: 0.5,
    fontSize: 14,
    bold: true,
    color: BRAND.navy,
  });
  if (Array.isArray(right.bullets) && right.bullets.length) {
    slide.addText(
      right.bullets.map((b) => ({
        text: b,
        options: { bullet: { code: '25CF', color: BRAND.yellow }, color: BRAND.bodyText, fontSize: 13, breakLine: true, paraSpaceAfter: 10 },
      })),
      { x: 7.0, y: 1.9, w: 5.7, h: 4.7 }
    );
  }

  addFooter(slide, pageNumber);
  if (s.speakerNotes) slide.addNotes(s.speakerNotes);
}

function buildStatCalloutSlide(pptx, s, pageNumber) {
  const slide = pptx.addSlide();
  slide.background = { color: BRAND.white };

  slide.addText(s.title || '', {
    x: 0.5,
    y: 0.4,
    w: 12.3,
    h: 0.7,
    fontSize: 24,
    bold: true,
    color: BRAND.navy,
  });

  const stats = (s.stats || []).slice(0, 3);
  const count = stats.length || 1;
  const boxW = 3.6;
  const gap = 0.4;
  const totalW = count * boxW + (count - 1) * gap;
  const startX = (13.33 - totalW) / 2;

  stats.forEach((stat, i) => {
    const x = startX + i * (boxW + gap);
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y: 2.3,
      w: boxW,
      h: 2.6,
      fill: { color: BRAND.navy },
    });
    slide.addText(stat.value || '', {
      x,
      y: 2.7,
      w: boxW,
      h: 1.2,
      align: 'center',
      fontSize: 36,
      bold: true,
      color: BRAND.yellow,
    });
    slide.addText(stat.label || '', {
      x,
      y: 3.9,
      w: boxW,
      h: 0.8,
      align: 'center',
      fontSize: 12,
      color: BRAND.white,
    });
  });

  addFooter(slide, pageNumber);
  if (s.speakerNotes) slide.addNotes(s.speakerNotes);
}

function buildSectionDividerSlide(pptx, s) {
  const slide = pptx.addSlide();
  slide.background = { color: BRAND.navy };

  slide.addShape(pptx.ShapeType.rect, {
    x: 3.665,
    y: 3.3,
    w: 6,
    h: 0.05,
    fill: { color: BRAND.yellow },
  });

  slide.addText(s.title || '', {
    x: 0.5,
    y: 3.45,
    w: 12.33,
    h: 1,
    align: 'center',
    fontSize: 36,
    bold: true,
    color: BRAND.white,
  });

  if (s.speakerNotes) slide.addNotes(s.speakerNotes);
}

function buildClosingSlide(pptx, s) {
  const slide = pptx.addSlide();
  slide.background = { color: BRAND.navy };

  slide.addText(s.title || 'Thank You', {
    x: 0.5,
    y: 2.4,
    w: 12.33,
    h: 1,
    align: 'center',
    fontSize: 40,
    bold: true,
    color: BRAND.white,
  });

  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: 0.5,
      y: 3.5,
      w: 12.33,
      h: 0.6,
      align: 'center',
      fontSize: 18,
      color: BRAND.white,
    });
  }

  slide.addShape(pptx.ShapeType.rect, {
    x: 6.57,
    y: 4.3,
    w: 0.28,
    h: 0.06,
    fill: { color: BRAND.yellow },
  });

  slide.addText('Eko Electricity Distribution PLC', {
    x: 0.5,
    y: 4.5,
    w: 12.33,
    h: 0.5,
    align: 'center',
    fontSize: 14,
    color: BRAND.yellow,
  });

  slide.addText('www.ekedp.com', {
    x: 0.5,
    y: 5.0,
    w: 12.33,
    h: 0.4,
    align: 'center',
    fontSize: 11,
    color: BRAND.white,
  });

  if (s.speakerNotes) slide.addNotes(s.speakerNotes);
}

async function buildPresentation(slides, style, presenter) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 });
  pptx.layout = 'WIDE';

  let pageNumber = 0;
  for (const s of slides) {
    switch (s.layout) {
      case 'title':
        buildTitleSlide(pptx, s, presenter);
        break;
      case 'two-column':
        pageNumber++;
        buildTwoColumnSlide(pptx, s, pageNumber);
        break;
      case 'stat-callout':
        pageNumber++;
        buildStatCalloutSlide(pptx, s, pageNumber);
        break;
      case 'section-divider':
        buildSectionDividerSlide(pptx, s);
        break;
      case 'closing':
        buildClosingSlide(pptx, s);
        break;
      case 'content':
      default:
        pageNumber++;
        buildContentSlide(pptx, s, pageNumber);
        break;
    }
  }

  const outputDir = process.env.VERCEL ? path.join('/tmp', 'output') : path.join(__dirname, '..', 'output');
  require('fs').mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `EKEDC_Presentation_${Date.now()}.pptx`);
  await pptx.writeFile({ fileName: filePath });
  return filePath;
}

module.exports = { buildPresentation, BRAND };
