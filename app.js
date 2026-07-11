/* ── Murnitin App.js ── */

// ═══════════════════════════════════════════════
// CUSTOM CURSOR
// ═══════════════════════════════════════════════
const cursorDot  = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');

let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorDot.style.left  = mouseX + 'px';
  cursorDot.style.top   = mouseY + 'px';
});

(function animateRing() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';
  requestAnimationFrame(animateRing);
})();

document.querySelectorAll('a, button, [data-sample], .drop-zone, .hl-sent').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-active'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-active'));
});

// ═══════════════════════════════════════════════
// SCROLL PROGRESS BAR
// ═══════════════════════════════════════════════
const progressBar = document.getElementById('progress-bar');
window.addEventListener('scroll', () => {
  const scrollTop    = window.scrollY;
  const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPct    = (scrollTop / docHeight) * 100;
  progressBar.style.width = scrollPct + '%';
});

// ═══════════════════════════════════════════════
// NAV VISIBILITY
// ═══════════════════════════════════════════════
const nav = document.getElementById('nav');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  if (scrollY > 80) {
    nav.classList.add('visible');
    if (scrollY > lastScrollY + 5) {
      nav.classList.add('hide');
    } else if (lastScrollY > scrollY + 5) {
      nav.classList.remove('hide');
    }
  } else {
    nav.classList.remove('visible');
  }
  lastScrollY = scrollY;

  // Active nav link
  const sections = ['hero', 'inspect', 'how', 'report'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const link = document.querySelector(`.nav-pill a[href="#${id}"]`);
    if (link) {
      if (rect.top <= 100 && rect.bottom >= 100) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    }
  });
}, { passive: true });

// ═══════════════════════════════════════════════
// SCROLL REVEAL
// ═══════════════════════════════════════════════
const revealEls = document.querySelectorAll('.how-card, .card, .sum-card, .compliance-item, .report-block');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

revealEls.forEach(el => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

// ═══════════════════════════════════════════════
// PARTICLE CANVAS
// ═══════════════════════════════════════════════
const canvas = document.getElementById('particle-canvas');
const ctx    = canvas.getContext('2d');

let particles = [];
let W, H;

function resizeCanvas() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function randomBetween(a, b) { return a + Math.random() * (b - a); }

for (let i = 0; i < 60; i++) {
  particles.push({
    x:     randomBetween(0, window.innerWidth),
    y:     randomBetween(0, window.innerHeight),
    r:     randomBetween(0.5, 1.8),
    vx:    randomBetween(-0.15, 0.15),
    vy:    randomBetween(-0.15, 0.15),
    alpha: randomBetween(0.2, 0.7),
  });
}

(function drawParticles() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = W;
    if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H;
    if (p.y > H) p.y = 0;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(99,102,241,${p.alpha})`;
    ctx.fill();
  });
  requestAnimationFrame(drawParticles);
})();

// ═══════════════════════════════════════════════
// SAMPLE TEXTS
// ═══════════════════════════════════════════════
const SAMPLES = {
  human: `The rise of modern cities represents a monumental shift in human ecology. Historically, people clustered near agricultural centers, but the industrial age broke those ancient cycles. Today, architectural canyons of steel and glass form our primary habitat. Walking down a packed metropolitan sidewalk, you witness a chaotic orchestra of sights and sounds. It feels messy, vibrant, and thoroughly unpredictable. Yet, this complexity is exactly what makes urban life resilient. Despite the constant congestion, communities find unique ways to adapt and carve out their own distinct subcultures.`,

  ai: `The expansion of modern urban centers represents a significant transformation in human organization. Historically, populations were concentrated near agricultural centers; however, the industrial revolution altered these distribution patterns. Today, structural developments of steel and glass constitute the primary human habitat. Consequently, navigating a dense metropolitan corridor reveals a structured arrangement of activities. Furthermore, this environment is characterized by efficiency, organization, and predictable behaviors. Ultimately, this systematic design is what renders urban systems functional. In addition to high population density, municipal administrations implement comprehensive policies to manage resources effectively.`,

  evasion: `The utilize of d\u0456g\u0456tal technologies has altered the landscape of educat\u0456on in the modern era. It provides st\u200budents with access to a wide array of educational resources. Furthermore, online learning systems off\u0435r flex\u0456b\u0456l\u0456ty and conv\u0435ni\u0435nce to students across the world. In conclusion, the implement\u0430tion of techn\u043Elogy in teaching has shown sign\u0456f\u0456cant benefits for modern academic structures.`,

  hybrid: `I remember when I first started learning coding, it felt like learning a magical language where a single typo could collapse the universe. It was incredibly frustrating but rewarding. The process of writing computer programs is a highly structured activity. It requires the developer to define clear logical instructions that the computer executes in sequence. Furthermore, software systems must be designed with modularity to ensure ease of maintenance over time. In conclusion, the integration of structured engineering practices is essential for developing scalable software solutions. Honestly, once you cross that initial learning cliff, the logic makes a weird kind of sense and you start enjoying the problem-solving loop.`
};

// ═══════════════════════════════════════════════
// STATISTICAL ENGINE (Expanded Vocabulary)
// ═══════════════════════════════════════════════
const BASE_FREQS = {
  "the":0.060,"of":0.035,"and":0.028,"a":0.022,"in":0.020,"to":0.019,
  "is":0.018,"that":0.015,"for":0.012,"it":0.011,"with":0.010,"as":0.010,
  "are":0.009,"on":0.009,"at":0.008,"by":0.008,"an":0.008,"be":0.007,
  "this":0.007,"from":0.007,"or":0.006,"which":0.006,"not":0.006,
  "was":0.005,"have":0.005,"were":0.005,"they":0.004,"we":0.004,
  "been":0.004,"has":0.004,"can":0.004,"than":0.004,"these":0.003,
  "their":0.003,"more":0.003,"also":0.003,"into":0.003,"its":0.003,
  "both":0.003,"may":0.003,"such":0.003,"between":0.003,"each":0.002,
  "while":0.002,"through":0.002,"when":0.002,"one":0.002,"two":0.002,
  "all":0.002,"if":0.002,"but":0.002,"other":0.002,"our":0.002,
  "used":0.002,"using":0.002,"about":0.002,"after":0.002,"only":0.002,
  "then":0.002,"up":0.002,"over":0.002,"new":0.001,"well":0.001,
  "based":0.002,"thus":0.002,"however":0.002,"where":0.002,"will":0.002,
  "within":0.002,"across":0.001,"without":0.001,"under":0.001,
  "during":0.001,"different":0.001,"most":0.001,"some":0.001,"any":0.001,
  "how":0.001,"could":0.001,"given":0.001,"since":0.001,"no":0.001,
  "model":0.0035,"models":0.003,"data":0.003,"learning":0.003,
  "results":0.003,"method":0.002,"methods":0.002,"approach":0.002,
  "analysis":0.002,"study":0.002,"paper":0.002,"research":0.002,
  "proposed":0.002,"show":0.002,"shows":0.002,"performance":0.002,
  "training":0.002,"prediction":0.002,"features":0.002,"set":0.002,
  "network":0.002,"deep":0.002,"machine":0.002,"neural":0.002,
  "accuracy":0.002,"dataset":0.002,"framework":0.002,"system":0.002,
  "algorithm":0.002,"feature":0.002,"use":0.003,"information":0.002,
  "customer":0.001,"lifetime":0.001,"clv":0.001,"ltv":0.0008,
  "revenue":0.001,"purchase":0.001,"churn":0.001,"retention":0.001,
  "transaction":0.001,"market":0.001,"digital":0.001,"commerce":0.001,
  "forecast":0.001,"forecasting":0.001,"sparsity":0.0008,"sparse":0.001,
  "zero":0.001,"inflated":0.0008,"lognormal":0.0008,"explainable":0.001,
  "xai":0.0008,"interpretable":0.001,"interpretability":0.0008,
  "precision":0.001,"recall":0.001,"f1":0.0008,"auc":0.0008
};

const AI_BOILERPLATE = new Set([
  "furthermore","moreover","consequently","ultimately","additionally",
  "nevertheless","notwithstanding","henceforth","aforementioned",
  "multifaceted","showcases","underscores","encompasses","facilitates",
  "leverages","streamlines","revolutionizes","transformative",
  "groundbreaking","unprecedented","holistic","synergistic","robust",
  "seamlessly","comprehensively","systematically","meticulously",
  "efficiently","effectively","significantly","substantially",
  "remarkably","notably","considerably","predominantly","consistently",
  "delve","tapestry","testament","behest","pivotal","catalyst",
  "nuanced","sophisticated","crucial","utmost","paramount",
  "imperative","commendable","exemplary","multitude","myriad",
  "plethora","realm","landscape","paradigm","cornerstone",
  "embark","foster","leverage","harness","propel","ascertain",
  "delineate","elucidate","underscore","encapsulate","epitomize",
  "elucidating","delineating","encapsulating","underpinning",
  "posits","stipulates","mandates","necessitates","obviates",
  "potentiates","ameliorates","exacerbates","precipitates"
]);

const HUMAN_MARKERS = new Set([
  "honestly","frankly","surprisingly","unexpectedly","weirdly",
  "oddly","interestingly","frustratingly","thankfully","luckily",
  "unfortunately","awkwardly","admittedly","confusingly","puzzlingly",
  "disappointingly","excitingly","unsurprisingly","hilariously",
  "worryingly","annoyingly","reassuringly","understandably","arguably",
  "presumably","supposedly","apparently","seemingly","evidently",
  "strangely","notably","curiously","typically","usually","often",
  "sometimes","rarely","seldom","occasionally","frequently",
  "yesterday","wandered","bookshop","canal","smells","decaying","overwhelmed",
  "pleasant","randomly","grabbed","dusty","canyons","sidewalk","chaos",
  "orchestra","messy","vibrant","escape","crazy","regular","magic",
  "coding","typo","magical","weird","enjoying"
]);

const AI_PROB     = 0.055;
const HUMAN_PROB  = 0.00002;
const OOV_PROB    = 0.00015;

function getWordProb(word) {
  const w = word.toLowerCase().replace(/[^a-z'-]/g, '');
  if (!w) return OOV_PROB;
  if (AI_BOILERPLATE.has(w)) return AI_PROB;
  if (HUMAN_MARKERS.has(w)) return HUMAN_PROB;
  return BASE_FREQS[w] || OOV_PROB;
}

function sentencePerplexity(sentence) {
  const words = sentence.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 0;
  const sumLog = words.reduce((s, w) => s + Math.log2(getWordProb(w)), 0);
  const entropy = -sumLog / words.length;
  return Math.min(Math.pow(2, entropy), 500);
}

function cleanPDFText(text) {
  // Rejoin soft-hyphenated words: "predic-\ntion" -> "prediction"
  let cleaned = text.replace(/-\s*\n\s*/g, '');
  // Join line breaks that are mid-sentence
  cleaned = cleaned.replace(/(?<![.!?])\n(?!\n)/g, ' ');
  // Collapse spaces
  cleaned = cleaned.replace(/\n{2,}/g, '\n').replace(/ {2,}/g, ' ');
  // Remove citation brackets [1] and other academic noise
  cleaned = cleaned.replace(/\[\d+\]/g, '');
  cleaned = cleaned.replace(/\(\d{4}\)/g, '');
  cleaned = cleaned.replace(/Fig\.\s*\d+/gi, '');
  cleaned = cleaned.replace(/Table\s+\d+/gi, '');
  return cleaned.strip ? cleaned.strip() : cleaned.trim();
}

// Global scope receipt cache to support PDF downloading
let activeSubmissionId = "";
let activeSubmissionTitle = "";

function detectHidden(text) {
  const hidden = {'\u200b':'Zero-Width Space','\u200c':'ZWNJ','\u200d':'ZWJ','\ufeff':'BOM','\u00ad':'Soft Hyphen'};
  const found = [];
  for (const [ch, name] of Object.entries(hidden)) {
    const count = text.split(ch).length - 1;
    if (count > 0) found.push({ name, count });
  }
  return found;
}

function detectHomoglyphs(text) {
  const words = text.split(/\s+/);
  const found = [];
  for (const word of words) {
    let latin = 0, cyrillic = 0;
    for (let i = 0; i < word.length; i++) {
      const c = word.charCodeAt(i);
      if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) latin++;
      else if (c >= 1024 && c <= 1279) cyrillic++;
    }
    if (latin > 0 && cyrillic > 0) found.push(word.replace(/[^\w]/g, ''));
  }
  return found;
}

function analyzeText(rawText) {
  const hiddenChars  = detectHidden(rawText);
  const homoglyphs   = detectHomoglyphs(rawText);
  const hasEvasion   = hiddenChars.length > 0 || homoglyphs.length > 0;

  let clean = rawText;
  ['\u200b','\u200c','\u200d','\ufeff','\u00ad'].forEach(c => { clean = clean.split(c).join(''); });
  clean = cleanPDFText(clean);

  const rawSents = clean.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 2);
  const sentences = [];
  let sentIdx = 0;

  rawSents.forEach(text => {
    const wordCount = text.split(/\s+/).filter(x=>x.length>0).length;
    if (wordCount < 4) return;
    const p = sentencePerplexity(text);
    let cls = 'human';
    if (p < 16)       cls = 'ai_direct';
    else if (p < 30)  cls = 'ai_polished';
    
    sentences.push({ idx: sentIdx++, text, perplexity: p, classification: cls });
  });

  if (sentences.length === 0) return null;

  const perps   = sentences.map(s => s.perplexity);
  const avg     = perps.reduce((a, b) => a + b, 0) / perps.length;
  const variance = perps.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / perps.length;
  const burstiness = Math.sqrt(variance);

  const aiDirectCount = sentences.filter(s => s.classification === 'ai_direct').length;
  const aiPolishedCount = sentences.filter(s => s.classification === 'ai_polished').length;
  const aiFlaggedPct = (100 * (aiDirectCount + aiPolishedCount) / sentences.length).toFixed(1);

  // Score
  let score = 0;
  if (avg < 20 && burstiness < 14) {
    score = 95 - avg * 1.8 - burstiness * 1.2;
  } else if (avg < 36 && burstiness < 26) {
    score = 65 - avg * 0.8 - burstiness * 0.5;
  } else {
    score = Math.max(2, 18 - avg * 0.07 - burstiness * 0.04);
  }
  if (hasEvasion) score = Math.max(score, 85);
  score = Math.round(Math.max(0, Math.min(100, score)));

  // Verdict
  let verdict = '', verdictClass = '';
  if (score < 25)     { verdict = 'Likely Human';         verdictClass = 'green'; }
  else if (score < 55) { verdict = 'Inconclusive / Mixed';  verdictClass = 'yellow'; }
  else if (score < 80) { verdict = 'Likely AI-Assisted';  verdictClass = 'yellow'; }
  else                 { verdict = 'Likely AI-Generated';  verdictClass = 'red'; }

  if (hasEvasion) { verdict = 'Evasion Detected'; verdictClass = 'red'; }

  return {
    score, avg, burstiness, sentences, aiSentences: aiDirectCount + aiPolishedCount, 
    aiDirectCount, aiPolishedCount, aiFlaggedPct, hasEvasion,
    hiddenChars, homoglyphs, verdict, verdictClass
  };
}

// ═══════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════
let activeTab = 'pdf';

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeTab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-body').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + activeTab).classList.add('active');
  });
});

// ═══════════════════════════════════════════════
// TEXT EDITOR — Samples & Counter
// ═══════════════════════════════════════════════
const textInput = document.getElementById('text-input');
const charCount = document.getElementById('char-count');
const wordCount = document.getElementById('word-count');

textInput.value = SAMPLES.human;
updateCounts();

function updateCounts() {
  const t = textInput.value;
  charCount.textContent = t.length + ' chars';
  const w = t.trim().split(/\s+/).filter(x => x.length > 0);
  wordCount.textContent = w.length + ' words';
}

textInput.addEventListener('input', updateCounts);

document.querySelectorAll('.btn-sample').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-sample').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    textInput.value = SAMPLES[btn.dataset.sample];
    updateCounts();
  });
});

// ═══════════════════════════════════════════════
// PDF UPLOAD
// ═══════════════════════════════════════════════
const dropZone   = document.getElementById('drop-zone');
const pdfInput   = document.getElementById('pdf-input');
const fileInfo   = document.getElementById('file-info');
const fileName   = document.getElementById('file-name');
const fileSizeEl = document.getElementById('file-size');
const clearBtn   = document.getElementById('btn-clear-file');
const extractStatus = document.getElementById('pdf-extract-status');
const extractMsg    = document.getElementById('extract-msg');

let extractedPDFText = '';
let currentFileName = '';
let currentFileSize = '';

dropZone.addEventListener('click', () => pdfInput.click());

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('dragging');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragging');
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') handlePDFFile(file);
});

pdfInput.addEventListener('change', () => {
  if (pdfInput.files[0]) handlePDFFile(pdfInput.files[0]);
});

clearBtn.addEventListener('click', () => {
  extractedPDFText = '';
  currentFileName = '';
  currentFileSize = '';
  pdfInput.value = '';
  fileInfo.classList.add('hidden');
  dropZone.classList.remove('hidden');
  extractStatus.classList.add('hidden');
});

async function handlePDFFile(file) {
  currentFileName = file.name;
  currentFileSize = (file.size / 1024).toFixed(1) + ' KB';
  fileName.textContent  = currentFileName;
  fileSizeEl.textContent = currentFileSize;
  dropZone.classList.add('hidden');
  fileInfo.classList.remove('hidden');
  extractStatus.classList.remove('hidden');
  extractMsg.textContent = 'Extracting text from PDF…';

  try {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js not loaded');
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      extractMsg.textContent = `Extracting page ${i} of ${pdf.numPages}…`;
      const page    = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      fullText += pageText + ' ';
    }

    extractedPDFText = fullText.trim();
    extractMsg.textContent = `✓ Extracted ${extractedPDFText.split(/\s+/).length} words from ${pdf.numPages} page(s). Ready to inspect.`;
  } catch (err) {
    extractMsg.textContent = '⚠ Could not extract text from PDF. Try copy-pasting into the text tab instead.';
    console.error(err);
  }
}

// ═══════════════════════════════════════════════
// RUN INSPECTION & RECEIPT MODAL
// ═══════════════════════════════════════════════
const btnInspect   = document.getElementById('btn-inspect');
const receiptModal = document.getElementById('receipt-modal');
const modalClose   = document.getElementById('btn-modal-close');

let currentAnalysisResult = null;
let currentAnalysisText   = "";

btnInspect.addEventListener('click', () => {
  let text = '';
  let origin = 'Text Editor';

  if (activeTab === 'pdf') {
    if (!extractedPDFText) {
      extractMsg.textContent = '⚠ Please upload a PDF first.';
      extractStatus.classList.remove('hidden');
      return;
    }
    text = extractedPDFText;
    origin = currentFileName;
  } else {
    text = textInput.value.trim();
  }

  if (!text || text.split(/\s+/).length < 10) {
    alert('Please provide at least 10 words for analysis.');
    return;
  }

  btnInspect.disabled = true;
  btnInspect.textContent = 'Analyzing…';

  setTimeout(() => {
    const result = analyzeText(text);
    if (result) {
      currentAnalysisResult = result;
      currentAnalysisText   = text;
      
      // Digital Receipt Parameters
      activeSubmissionId   = 'MN-' + Math.floor(1000000 + Math.random() * 9000000);
      const submissionDate = new Date().toLocaleString();
      const wordCountVal   = text.split(/\s+/).filter(x => x.length > 0).length;
      const charCountVal   = text.length;
      activeSubmissionTitle = activeTab === 'pdf' ? currentFileName.replace(/\.[^/.]+$/, "") : text.slice(0, 30) + '...';

      // Update Modal
      document.getElementById('receipt-id').textContent = activeSubmissionId;
      document.getElementById('receipt-title').textContent = activeSubmissionTitle;
      document.getElementById('receipt-date').textContent = submissionDate;
      document.getElementById('receipt-words').textContent = wordCountVal;
      document.getElementById('receipt-chars').textContent = charCountVal;
      document.getElementById('receipt-origin').textContent = origin;

      // Update Print-only cover page inputs
      document.querySelectorAll('.print-val-id').forEach(el => el.textContent = activeSubmissionId);
      document.querySelectorAll('.print-val-title').forEach(el => el.textContent = activeSubmissionTitle);
      document.querySelectorAll('.print-val-date').forEach(el => el.textContent = submissionDate);
      document.querySelectorAll('.print-val-words').forEach(el => el.textContent = wordCountVal);
      document.querySelectorAll('.print-val-chars').forEach(el => el.textContent = charCountVal);
      document.querySelectorAll('.print-val-hash').forEach(el => {
        el.textContent = 'mn256_' + Math.random().toString(16).substr(2, 16);
      });
      
      // Print cover page overall results
      document.querySelector('.pr-gauge-pct').textContent = result.score + '%';
      document.querySelector('.pr-verdict-val').textContent = result.verdict;
      
      let prVerdictDesc = 'Linguistic Perplexity Profile conforms to organic writing patterns.';
      if (result.score >= 80) {
        prVerdictDesc = 'High volume of uniform, low-entropy sentences indicates structural AI generation.';
      } else if (result.score >= 25) {
        prVerdictDesc = 'Mixed semantic markers indicate collaborative human-AI structuring or intense revision.';
      }
      if (result.hasEvasion) {
        prVerdictDesc = 'Evasion markers detected. Homoglyphs or invisible dividers are present in text.';
      }
      document.querySelector('.pr-verdict-desc').textContent = prVerdictDesc;

      // Trigger Modal
      receiptModal.classList.remove('hidden');
    }
    btnInspect.disabled = false;
    btnInspect.textContent = 'Run Integrity Inspection';
  }, 800);
});

modalClose.addEventListener('click', () => {
  receiptModal.classList.add('hidden');
  if (currentAnalysisResult) {
    renderSidebar(currentAnalysisResult);
    renderReport(currentAnalysisResult, currentAnalysisText);
  }
  document.getElementById('report').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ═══════════════════════════════════════════════
// RENDER SIDEBAR
// ═══════════════════════════════════════════════
function renderSidebar(r) {
  document.getElementById('sidebar-empty').classList.add('hidden');
  document.getElementById('sidebar-active').classList.remove('hidden');

  // Gauge
  const gFill = document.getElementById('g-fill');
  const circumference = 314.16;
  const offset = circumference - (circumference * r.score / 100);
  gFill.style.strokeDashoffset = offset;
  if (r.score < 25)      gFill.style.stroke = '#22c55e';
  else if (r.score < 65) gFill.style.stroke = '#eab308';
  else                   gFill.style.stroke = '#ef4444';

  document.getElementById('score-pct').textContent      = r.score + '%';
  document.getElementById('m-perplexity').textContent   = r.avg.toFixed(1);
  document.getElementById('m-burstiness').textContent   = r.burstiness.toFixed(1);
  document.getElementById('m-sentences').textContent    = r.sentences.length;
  document.getElementById('m-ai-sents').textContent     = r.aiSentences;
  document.getElementById('m-evasion').textContent      = r.hasEvasion ? '⚠ YES' : '✓ None';
  document.getElementById('m-evasion').style.color      = r.hasEvasion ? 'var(--red)' : 'var(--green)';

  const verdictEl = document.getElementById('m-verdict');
  verdictEl.textContent  = r.verdict;
  verdictEl.style.color  = `var(--${r.verdictClass})`;
}

// ═══════════════════════════════════════════════
// RENDER REPORT
// ═══════════════════════════════════════════════
function renderReport(r, rawText) {
  document.getElementById('report-empty').classList.add('hidden');
  document.getElementById('report-body').classList.remove('hidden');

  // Timestamp
  document.getElementById('report-timestamp').textContent = new Date().toLocaleString();

  // Update print headers
  document.querySelectorAll('.ph-score').forEach(el => el.textContent = r.score + '%');

  // Summary Cards
  const cards = [
    { label: 'AI Likelihood',  value: r.score + '%',                    cls: r.score < 25 ? 'green' : r.score < 65 ? 'yellow' : 'red' },
    { label: 'Avg Perplexity', value: r.avg.toFixed(1),                 cls: '' },
    { label: 'Burstiness',     value: r.burstiness.toFixed(1),          cls: '' },
    { label: 'Verdict',        value: r.verdict,                        cls: r.verdictClass },
  ];

  document.getElementById('summary-cards').innerHTML = cards.map(c => `
    <div class="sum-card">
      <span class="sum-label">${c.label}</span>
      <span class="sum-value ${c.cls}">${c.value}</span>
    </div>
  `).join('');

  // Evasion Section
  const evasionSection = document.getElementById('evasion-section');
  if (r.hasEvasion) {
    evasionSection.classList.remove('hidden');
    let html = '';
    r.hiddenChars.forEach(h => {
      html += `<div class="evasion-item">${h.count}× <strong>${h.name}</strong> found — invisible character inserted to break word recognition in standard detectors.</div>`;
    });
    if (r.homoglyphs.length > 0) {
      html += `<div class="evasion-item">Mixed-script homoglyphs detected in ${r.homoglyphs.length} word(s): <strong>${r.homoglyphs.slice(0,5).join(', ')}</strong> — Cyrillic characters substituted for visually identical Latin letters.</div>`;
    }
    document.getElementById('evasion-details').innerHTML = html;
  } else {
    evasionSection.classList.add('hidden');
  }

  // Highlight Map
  const mapEl = document.getElementById('highlight-map');
  mapEl.innerHTML = '';
  r.sentences.forEach(s => {
    const span = document.createElement('span');
    span.className = 'hl-sent ' + s.classification;
    span.textContent = s.text + ' ';
    span.title = `Perplexity: ${s.perplexity.toFixed(1)} | Class: ${s.classification}`;
    span.addEventListener('click', () => {
      const cls = { human: '🟢 Human', ai_direct: '🔴 AI-Direct', ai_polished: '🟡 AI-Polished' }[s.classification] || s.classification;
      alert(`Sentence ${s.idx + 1}\n\nClassification: ${cls}\nPseudo-Perplexity: ${s.perplexity.toFixed(2)}\n\n"${s.text}"`);
    });
    mapEl.appendChild(span);
  });

  // Perplexity Chart
  drawChart(r.sentences);

  // Sentence Table
  const tbody = document.getElementById('sentence-tbody');
  tbody.innerHTML = r.sentences.map(s => {
    const clsMap = { human: 'class-human', ai_direct: 'class-ai', ai_polished: 'class-polished' };
    const labelMap = { human: 'HUMAN', ai_direct: 'AI-DIRECT', ai_polished: 'AI-POLISHED' };
    return `
      <tr>
        <td class="mono" style="color:var(--text-3); font-size:11px;">${String(s.idx + 1).padStart(2,'0')}</td>
        <td style="font-size:13px; color:var(--text-2); max-width:440px;">${truncate(s.text, 120)}</td>
        <td class="mono" style="font-size:12px;">${s.perplexity.toFixed(1)}</td>
        <td class="${clsMap[s.classification] || ''}">${labelMap[s.classification] || s.classification}</td>
      </tr>
    `;
  }).join('');
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

// ═══════════════════════════════════════════════
// PERPLEXITY CHART (Vanilla Canvas)
// ═══════════════════════════════════════════════
function drawChart(sentences) {
  const canvas = document.getElementById('perplexity-chart');
  const ctx    = canvas.getContext('2d');
  const W      = canvas.offsetWidth || 800;
  const H      = 120;

  canvas.width  = W;
  canvas.height = H;

  const perps  = sentences.map(s => s.perplexity);
  const maxP   = Math.max(...perps, 50);
  const step   = W / (perps.length - 1 || 1);
  const pad    = 10;

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth   = 1;
  [0.25, 0.5, 0.75].forEach(t => {
    const y = pad + (1 - t) * (H - 2 * pad);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  });

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(99,102,241,0.3)');
  grad.addColorStop(1, 'rgba(99,102,241,0)');

  ctx.beginPath();
  perps.forEach((p, i) => {
    const x = i * step;
    const y = pad + (1 - p / maxP) * (H - 2 * pad);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo((perps.length - 1) * step, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(99,102,241,0.8)';
  ctx.lineWidth   = 2;
  ctx.lineJoin    = 'round';
  perps.forEach((p, i) => {
    const x = i * step;
    const y = pad + (1 - p / maxP) * (H - 2 * pad);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots
  perps.forEach((p, i) => {
    const x   = i * step;
    const y   = pad + (1 - p / maxP) * (H - 2 * pad);
    const cls = sentences[i].classification;
    const color = cls === 'ai_direct' ? '#ef4444' : cls === 'ai_polished' ? '#eab308' : '#22c55e';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

// ═══════════════════════════════════════════════
// PRINT / DOWNLOAD PDF REPORT
// ═══════════════════════════════════════════════
document.getElementById('btn-print').addEventListener('click', () => {
  window.print();
});

document.getElementById('btn-download-pdf').addEventListener('click', () => {
  const element = document.getElementById('report-body');
  
  // Clone element to apply dedicated PDF styling parameters cleanly
  const clone = element.cloneNode(true);
  
  // Remove interactive web-only action rows from PDF
  const actionRow = clone.querySelector('.report-header-bar');
  if (actionRow) actionRow.remove();

  // Configure html2pdf options
  const opt = {
    margin:       [12, 14, 12, 14], // top, left, bottom, right in mm
    filename:     `Murnitin_Integrity_Report_${activeSubmissionId || 'MN-Report'}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { 
      scale: 2, 
      useCORS: true, 
      letterRendering: true,
      backgroundColor: '#ffffff' // Force white background inside the PDF
    },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Temporarily style the clone body for PDF rendering
  clone.style.background = '#ffffff';
  clone.style.color = '#000000';
  clone.classList.add('pdf-theme-export');

  // Trigger high fidelity PDF generation
  html2pdf().set(opt).from(clone).save();
});
