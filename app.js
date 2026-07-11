// Murnitin Dashboard Application Logic

// Mock Text Samples for Demonstration
const MOCK_SAMPLES = {
    human: `The rise of modern cities represents a monumental shift in human ecology. Historically, people clustered near agricultural centers, but the industrial age broke those ancient cycles. Today, architectural canyons of steel and glass form our primary habitat. Walking down a packed metropolitan sidewalk, you witness a chaotic orchestra of sights and sounds. It feels messy, vibrant, and thoroughly unpredictable. Yet, this complexity is exactly what makes urban life resilient. Despite the constant congestion, communities find unique ways to adapt and carve out their own distinct subcultures.`,
    
    ai: `The expansion of modern urban centers represents a significant transformation in human organization. Historically, populations were concentrated near agricultural centers; however, the industrial revolution altered these distribution patterns. Today, structural developments of steel and glass constitute the primary human habitat. Consequently, navigating a dense metropolitan corridor reveals a structured arrangement of activities. This environment is characterized by efficiency, organization, and predictable behaviors. Ultimately, this systematic design is what renders urban systems functional. In addition to high population density, municipal administrations implement comprehensive policies to manage resources effectively.`,
    
    evasion: `The utilize of dіgіtal technologies has altered the landscape of educatіon in the modern era. It provides st\u200budents with access to a wide array of educational resources. Furthermore, online learning systems offеr flexibіlity and conveniеnce to students across the world. In conclusion, the implementаtion of technоlogy in teaching has shown signіfіcant benefits for modern academic structures.`,
    
    hybrid: `I remember when I first started learning coding, it felt like learning a magical language where a single typo could collapse the universe. It was incredibly frustrating but rewarding. The process of writing computer programs is a highly structured activity. It requires the developer to define clear logical instructions that the computer executes in sequence. Furthermore, software systems must be designed with modularity to ensure ease of maintenance over time. In conclusion, the integration of structured engineering practices is essential for developing scalable software solutions. Honestly, once you cross that initial learning cliff, the logic makes a weird kind of sense and you start enjoying the problem-solving loop.`
};

// Document Elements
const textarea = document.getElementById('document-textarea');
const charCount = document.getElementById('char-count');
const wordCount = document.getElementById('word-count');
const btnInspect = document.getElementById('btn-inspect');
const resultsEmpty = document.getElementById('results-empty');
const resultsActive = document.getElementById('results-active');

// Metric Elements
const scorePercentage = document.getElementById('score-percentage');
const gaugeFill = document.getElementById('gauge-fill');
const statPerplexity = document.getElementById('stat-perplexity');
const statBurstiness = document.getElementById('stat-burstiness');

// Evasion Alerts
const evasionBox = document.getElementById('evasion-box');
const evasionText = document.getElementById('evasion-text');

// Highlight & Timeline elements
const highlightContainer = document.getElementById('sentence-highlights');
const timelineSlider = document.getElementById('timeline-slider');
const timelineTimestamp = document.getElementById('timeline-timestamp');
const timelineStatus = document.getElementById('timeline-status');
const btnPlayTimeline = document.getElementById('btn-play-timeline');

// Compliance elements
const compFerpa = document.getElementById('compliance-ferpa');
const compGdpr = document.getElementById('compliance-gdpr');
const compZk = document.getElementById('compliance-zero-knowledge');
const compReport = document.getElementById('compliance-report');

// State Variables
let isPlayingTimeline = false;
let timelineInterval = null;

// Initialize app text with the 'human' sample
textarea.value = MOCK_SAMPLES.human;
updateCounts();

// Event Listeners for Sample Selection
document.querySelectorAll('.btn-sample').forEach(button => {
    button.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-sample').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        
        const sampleType = button.getAttribute('data-sample');
        textarea.value = MOCK_SAMPLES[sampleType];
        updateCounts();
        
        // Auto reset results view on changing samples to allow fresh scan
        resultsActive.classList.add('hidden');
        resultsEmpty.classList.remove('hidden');
        resetTimeline();
    });
});

// Real-time Text Area character and word counter
textarea.addEventListener('input', updateCounts);

function updateCounts() {
    const text = textarea.value;
    charCount.textContent = `${text.length} characters`;
    
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    wordCount.textContent = `${words.length} words`;
}

// Perform Inspection
btnInspect.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (!text) return;
    
    // Simulate API Processing delay for premium feel
    btnInspect.disabled = true;
    btnInspect.querySelector('span').textContent = 'Analyzing...';
    
    setTimeout(() => {
        runLinguisticAnalysis(text);
        btnInspect.disabled = false;
        btnInspect.querySelector('span').textContent = 'Inspect Document';
    }, 800);
});

// Basic statistical dictionary for client-side representation
const DICT_FREQS = {
    "the": 0.06, "be": 0.04, "to": 0.03, "of": 0.03, "and": 0.025, "a": 0.022, "in": 0.02,
    "that": 0.015, "have": 0.012, "i": 0.01, "it": 0.01, "for": 0.009, "not": 0.008,
    "on": 0.007, "with": 0.007, "he": 0.006, "as": 0.006, "you": 0.006, "do": 0.005,
    "at": 0.005, "this": 0.004, "but": 0.004, "his": 0.004, "by": 0.004, "from": 0.004
};
const OOV_P = 0.00001;

function runLinguisticAnalysis(text) {
    // 1. TYPOGRAPHICAL EVASION CHECK
    // Check zero-width characters
    const zeroWidths = ['\u200b', '\u200c', '\u200d', '\ufeff', '\u00ad'];
    let zeroWidthCount = 0;
    zeroWidths.forEach(c => {
        zeroWidthCount += (text.split(c).length - 1);
    });

    // Check Cyrillic Homoglyphs (mixed script)
    const words = text.split(/\s+/);
    let homoglyphCount = 0;
    const homoglyphWords = [];
    
    words.forEach(word => {
        let hasLatin = false;
        let hasCyrillic = false;
        for (let i = 0; i < word.length; i++) {
            const code = word.charCodeAt(i);
            if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
                hasLatin = true;
            } else if (code >= 1024 && code <= 1279) {
                hasCyrillic = true;
            }
        }
        if (hasLatin && hasCyrillic) {
            homoglyphCount++;
            homoglyphWords.push(word.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, ''));
        }
    });

    // Clean text for statistical scanning
    let cleanText = text;
    zeroWidths.forEach(c => {
        cleanText = cleanText.split(c).join('');
    });

    // Split sentences
    const sentences = cleanText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const sentenceMetrics = [];
    
    sentences.forEach((sentence, idx) => {
        const sentenceWords = sentence.split(/\s+/).filter(w => w.length > 0);
        if (sentenceWords.length === 0) return;
        
        // Calculate pseudo-perplexity
        let sumLogProb = 0;
        sentenceWords.forEach(w => {
            const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
            const prob = DICT_FREQS[cleanWord] || OOV_P;
            sumLogProb += Math.log2(prob);
        });
        
        const entropy = -sumLogProb / sentenceWords.length;
        let perplexity = Math.pow(2, entropy);
        if (perplexity > 500) perplexity = 500;
        
        // Classify
        let classification = 'human';
        if (sentenceWords.length > 4) {
            if (perplexity < 15.0) {
                classification = 'ai_direct';
            } else if (perplexity < 28.0) {
                classification = 'ai_polished';
            }
        }
        
        sentenceMetrics.push({
            text: sentence,
            perplexity: perplexity,
            classification: classification
        });
    });

    if (sentenceMetrics.length === 0) return;

    // Calculate document-level averages
    const avgPerplexity = sentenceMetrics.reduce((sum, s) => sum + s.perplexity, 0) / sentenceMetrics.length;
    const variance = sentenceMetrics.reduce((sum, s) => sum + Math.pow(s.perplexity - avgPerplexity, 2), 0) / sentenceMetrics.length;
    const burstiness = Math.sqrt(variance);

    // Compute Overall Score based on metrics
    let score = 0;
    if (avgPerplexity < 22 && burstiness < 15) {
        score = 92 - (avgPerplexity * 1.6) - (burstiness * 1.1);
    } else if (avgPerplexity < 36 && burstiness < 24) {
        score = 64 - (avgPerplexity * 0.7) - (burstiness * 0.4);
    } else {
        score = Math.max(2, 18 - (avgPerplexity * 0.08) - (burstiness * 0.04));
    }
    
    // Boost score if typographical bypasses are detected (highly malicious/evasive)
    const hasEvasion = (zeroWidthCount > 0 || homoglyphCount > 0);
    if (hasEvasion) {
        score = Math.max(score, 85);
    }
    
    score = Math.max(0, Math.min(100, Math.round(score)));

    // 2. RENDER THE INTERFACE RESULTS
    resultsEmpty.classList.add('hidden');
    resultsActive.classList.remove('hidden');

    // Render Gauge
    scorePercentage.textContent = `${score}%`;
    const offset = 251.2 - (251.2 * score) / 100;
    gaugeFill.style.strokeDashoffset = offset;
    
    // Change Gauge color based on severity
    if (score < 30) {
        gaugeFill.style.stroke = '#10b981'; // Green
    } else if (score < 70) {
        gaugeFill.style.stroke = '#f59e0b'; // Amber
    } else {
        gaugeFill.style.stroke = '#ef4444'; // Red
    }

    // Render Stats
    statPerplexity.textContent = avgPerplexity.toFixed(1);
    statBurstiness.textContent = burstiness.toFixed(1);

    // Render Evasion Banner
    if (hasEvasion) {
        evasionBox.classList.remove('hidden');
        let details = [];
        if (zeroWidthCount > 0) details.push(`${zeroWidthCount} hidden zero-width character(s)`);
        if (homoglyphCount > 0) details.push(`${homoglyphCount} mixed-script word(s) (${homoglyphWords.slice(0, 3).join(', ')})`);
        evasionText.textContent = `Alert: ${details.join(' and ')} detected in the text, indicating attempts to defeat plagiarism checks.`;
    } else {
        evasionBox.classList.add('hidden');
    }

    // Render Highlights
    highlightContainer.innerHTML = '';
    sentenceMetrics.forEach(s => {
        const span = document.createElement('span');
        span.className = `hl-sentence ${s.classification}`;
        span.textContent = s.text + ' ';
        
        // Highlight specific words containing evasion characters if applicable
        if (hasEvasion) {
            let processedText = s.text;
            homoglyphWords.forEach(hw => {
                const regex = new RegExp(`\\b${hw}\\b`, 'gi');
                processedText = processedText.replace(regex, `<span class="bypass-word" style="border-bottom: 2px dashed #ef4444; color:#ef4444;">${hw}</span>`);
            });
            span.innerHTML = processedText + ' ';
        }

        // Add interactive tooltip behavior
        span.addEventListener('click', () => {
            alert(`Sentence diagnostics:\n- Pseudo-Perplexity: ${s.perplexity.toFixed(2)}\n- Linguistic Classification: ${s.classification.toUpperCase()}`);
        });
        highlightContainer.appendChild(span);
    });

    // Reset writing process timeline simulation
    resetTimeline();
}

// Keystroke timeline animation simulation
btnPlayTimeline.addEventListener('click', () => {
    if (isPlayingTimeline) {
        pauseTimeline();
    } else {
        startTimeline();
    }
});

timelineSlider.addEventListener('input', () => {
    updateTimelineUI(timelineSlider.value);
});

function startTimeline() {
    isPlayingTimeline = true;
    btnPlayTimeline.textContent = '⏸ Pause Replay';
    
    let val = parseInt(timelineSlider.value);
    if (val >= 100) val = 0;
    
    timelineInterval = setInterval(() => {
        val += 2;
        timelineSlider.value = val;
        updateTimelineUI(val);
        
        if (val >= 100) {
            pauseTimeline();
        }
    }, 150);
}

function pauseTimeline() {
    isPlayingTimeline = false;
    btnPlayTimeline.textContent = '▶ Play Draft History';
    clearInterval(timelineInterval);
}

function resetTimeline() {
    pauseTimeline();
    timelineSlider.value = 0;
    updateTimelineUI(0);
}

function updateTimelineUI(value) {
    const elapsedMinutes = Math.floor((value * 135) / 100); // map slider to 135 minutes total
    const hours = Math.floor(elapsedMinutes / 60);
    const mins = elapsedMinutes % 60;
    timelineTimestamp.textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00 elapsed`;
    
    let status = '';
    if (value === 0) {
        status = 'Status: **Awaiting timeline playback...**';
    } else if (value < 40) {
        status = '🟢 Status: Active keyboard input. Steady typing pace (avg 55 WPM).';
    } else if (value >= 40 && value < 50) {
        status = '🔴 Status: **SUSPICIOUS**. 154 words inserted in exactly 0.5 seconds at index 45% (matches copy-paste profile).';
    } else if (value >= 50 && value < 75) {
        status = '🟡 Status: Editing block. Re-evaluating sentences, manual deletions and substitutions observed.';
    } else {
        status = '🟢 Status: Active typing resumed. Minor revision of thesis statements.';
    }
    
    // simple markdown parser for bolding
    timelineStatus.innerHTML = status.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

// Compliance toggle event handlers
[compFerpa, compGdpr, compZk].forEach(toggle => {
    toggle.addEventListener('change', updateComplianceReport);
});

function updateComplianceReport() {
    const ferpa = compFerpa.checked;
    const gdpr = compGdpr.checked;
    const zk = compZk.checked;
    
    let list = [];
    if (!ferpa) list.push('❌ **FERPA Risk**: Storing academic data without school official designation.');
    if (!gdpr) list.push('❌ **GDPR Risk**: Student objections and erasure queries not addressed.');
    if (!zk) list.push('⚠️ **Privacy Warning**: Storing raw text compared to Turnitin style (GDPR/Copyright friction elevated).');
    
    if (list.length === 0) {
        compReport.className = 'compliance-status-box';
        compReport.innerHTML = '🟢 All active integrations meet global student privacy codes (FERPA, GDPR compliance locked).';
    } else {
        compReport.className = 'compliance-status-box';
        compReport.style.background = 'rgba(239, 68, 68, 0.08)';
        compReport.style.borderColor = 'rgba(239, 68, 68, 0.2)';
        compReport.style.color = '#ef4444';
        compReport.innerHTML = list.map(item => item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')).join('<br>');
    }
}
updateComplianceReport();
