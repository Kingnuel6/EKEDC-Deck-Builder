const SYSTEM_PROMPT = `You are a presentation architect for Eko Electricity Distribution PLC (EKEDC), a Nigerian electricity distribution company serving Lagos and Ogun States.

Your job is to return a valid JSON array of slide objects. No markdown, no explanation, no code fences — ONLY the JSON array.

Each slide object must follow this exact schema:
{
  "slideNumber": 1,
  "layout": "title" | "content" | "two-column" | "stat-callout" | "section-divider" | "closing",
  "title": "string",
  "subtitle": "string (optional, for title/section-divider slides)",
  "bullets": ["string", "string"] (optional, for content/two-column slides),
  "leftColumn": { "heading": "string", "bullets": ["string"] } (optional, for two-column),
  "rightColumn": { "heading": "string", "bullets": ["string"] } (optional, for two-column),
  "stats": [{ "value": "string", "label": "string" }] (optional, for stat-callout — max 3 stats),
  "speakerNotes": "string (2-3 sentences the presenter can say for this slide)"
}

Rules:
- Always start with a layout: "title" slide
- Always end with a layout: "closing" slide
- Use "stat-callout" for any slide with key numbers or KPIs
- Use "section-divider" to break up long decks into chapters
- Keep bullet text under 12 words per bullet
- Speaker notes should be natural, professional Nigerian business English
- If slide content is sparse or missing, infer sensible EKEDC-appropriate content from context
- Return ONLY the JSON array. Nothing else.`;

function buildManualUserMessage(data) {
  const { title, type, audience, presenter, keyMessage, slideCount, slideNotes } = data;
  return `Create a ${slideCount}-slide presentation for EKEDC with the following details:

Title: ${title}
Type: ${type}
Audience: ${audience}
Presenter: ${presenter}
Key message: ${keyMessage}
Slide notes: ${slideNotes || 'None provided — use your best judgment.'}

Return the JSON array of slides.`;
}

function buildUploadUserMessage(text, presenter) {
  return `The following is the text content extracted from a document uploaded by an EKEDC manager.
They have outlined their slide content. Parse it into a structured slide array.
If slides are labelled ("Slide 1:", "Slide 2:", etc.), respect that structure exactly.
If content is sparse for any slide, expand it intelligently using context from the rest of the document.

DOCUMENT TEXT:
${text}

Presenter: ${presenter || 'EKEDC Management'}

Return the JSON array of slides.`;
}

function stripCodeFences(str) {
  return str
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

async function callOpenRouter(userMessage, strict) {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('OpenRouter API key not configured');
    err.status = 500;
    throw err;
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ];

  if (strict) {
    messages.push({
      role: 'user',
      content:
        'Your previous response was not valid JSON. Return ONLY a valid JSON array of slide objects, with no markdown, no code fences, and no explanation.',
    });
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'EKEDC Deck Builder',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`OpenRouter request failed: ${response.status} ${text}`);
    err.status = 502;
    throw err;
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content || '';
  return content;
}

async function generateSlides(input) {
  const userMessage =
    input.mode === 'manual'
      ? buildManualUserMessage(input.data)
      : buildUploadUserMessage(input.text, input.presenter);

  let raw = await callOpenRouter(userMessage, false);
  let cleaned = stripCodeFences(raw);

  try {
    return JSON.parse(cleaned);
  } catch {
    raw = await callOpenRouter(userMessage, true);
    cleaned = stripCodeFences(raw);
    try {
      return JSON.parse(cleaned);
    } catch {
      const err = new Error('AI failed to generate valid slide structure.');
      err.status = 500;
      throw err;
    }
  }
}

module.exports = { generateSlides };
