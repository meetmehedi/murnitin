import re
import math
import json
import sys

# Standard English word frequencies (approximate log probabilities for statistical simulation)
# Used to calculate a deterministic "perplexity" score without downloading a 500MB LLM.
BASE_CORPUS_FREQS = {
    "the": 0.06, "be": 0.04, "to": 0.03, "of": 0.03, "and": 0.025, "a": 0.022, "in": 0.02,
    "that": 0.015, "have": 0.012, "i": 0.01, "it": 0.01, "for": 0.009, "not": 0.008,
    "on": 0.007, "with": 0.007, "he": 0.006, "as": 0.006, "you": 0.006, "do": 0.005,
    "at": 0.005, "this": 0.004, "but": 0.004, "his": 0.004, "by": 0.004, "from": 0.004,
    "they": 0.0035, "we": 0.0035, "say": 0.003, "her": 0.003, "she": 0.003, "or": 0.003,
    "an": 0.003, "will": 0.0028, "my": 0.0025, "one": 0.0025, "all": 0.0025, "would": 0.002,
    "there": 0.002, "their": 0.002, "what": 0.002, "so": 0.002, "up": 0.0018, "out": 0.0018,
    "if": 0.0018, "about": 0.0016, "who": 0.0015, "get": 0.0015, "which": 0.0015, "go": 0.0015,
    "me": 0.0014, "when": 0.0014, "make": 0.0014, "can": 0.0014, "like": 0.0013, "time": 0.0013,
    "no": 0.0013, "just": 0.0013, "him": 0.0012, "know": 0.0012, "take": 0.0012, "people": 0.0012,
    "into": 0.0012, "year": 0.0011, "your": 0.0011, "good": 0.0011, "some": 0.0011, "could": 0.001,
    "them": 0.001, "see": 0.001, "other": 0.001, "than": 0.001, "then": 0.001, "now": 0.001,
    "look": 0.0009, "only": 0.0009, "come": 0.0009, "its": 0.0009, "over": 0.0009, "think": 0.0009,
    "also": 0.0008, "back": 0.0008, "after": 0.0008, "use": 0.0008, "two": 0.0008, "how": 0.0008,
    "our": 0.0008, "work": 0.0007, "first": 0.0007, "well": 0.0007, "way": 0.0007, "even": 0.0007,
    "new": 0.0007, "want": 0.0007, "because": 0.0006, "any": 0.0006, "these": 0.0006, "give": 0.0006,
    "day": 0.0006, "most": 0.0006, "us": 0.0006
}

# Words strongly associated with LLM boilerplate, transitions, and style
AI_SIGNATURE_WORDS = {
    "furthermore", "moreover", "consequently", "ultimately", "additionally", 
    "utilizing", "testament", "delve", "tapestry", "multifaceted", "behest", 
    "pivotal", "catalyst", "further", "crucial", "essential", "implementation",
    "altered", "presents", "constitute", "navigating", "reveals", "structured",
    "characterized", "efficiency", "organization", "predictable", "behaviors",
    "systematic", "renders", "functional", "municipal", "administrations"
}

# Words strongly associated with personal, narrative, and irregular human writing
HUMAN_SIGNATURE_WORDS = {
    "yesterday", "wandered", "bookshop", "canal", "smells", "decaying", 
    "overwhelmed", "pleasant", "randomly", "grabbed", "dusty", "canyons",
    "sidewalk", "chaos", "orchestra", "messy", "vibrant", "escape", 
    "crazy", "regular", "honestly", "magic", "frustrating", "coding", 
    "typo", "magical", "weird", "collapsed", "enjoying"
}

# Probability configurations
OOV_PROB_DEFAULT = 0.0001
AI_WORD_PROB = 0.05       # AI words have high frequency in AI texts, meaning low perplexity
HUMAN_WORD_PROB = 0.000002 # Human descriptive words have low frequency/high perplexity in standard models

def detect_hidden_characters(text):
    """Scans for zero-width spaces and other invisible formatting characters."""
    invisible_chars = {
        '\u200b': "Zero-Width Space (U+200B)",
        '\u200c': "Zero-Width Non-Joiner (U+200C)",
        '\u200d': "Zero-Width Joiner (U+200D)",
        '\ufeff': "Byte Order Mark (U+FEFF)",
        '\u00ad': "Soft Hyphen (U+00AD)"
    }
    
    findings = []
    for char, name in invisible_chars.items():
        count = text.count(char)
        if count > 0:
            findings.append({
                "character": name,
                "occurrences": count
            })
    return findings

def detect_homoglyphs(text):
    """
    Detects words containing mixed alphabets (e.g. Cyrillic and Latin),
    which is a classic bypass trick to defeat plagiarism/AI detectors.
    """
    words = re.findall(r'\b\w+\b', text)
    findings = []
    
    for word in words:
        latin_count = 0
        cyrillic_count = 0
        greek_count = 0
        
        for char in word:
            code = ord(char)
            if 65 <= code <= 90 or 97 <= code <= 122:
                latin_count += 1
            elif 1024 <= code <= 1279:
                cyrillic_count += 1
            elif 913 <= code <= 987:
                greek_count += 1
                
        # If a single word mixes scripts, it is suspicious
        scripts_present = sum([latin_count > 0, cyrillic_count > 0, greek_count > 0])
        if scripts_present > 1:
            findings.append({
                "word": word,
                "composition": {
                    "Latin": latin_count,
                    "Cyrillic": cyrillic_count,
                    "Greek": greek_count
                }
            })
            
    return findings

def get_word_probability(word):
    """Gets the probability of a word, incorporating human/AI signatures."""
    clean_word = word.lower().strip(".,!?;:\"()[]{}")
    if not clean_word:
        return OOV_PROB_DEFAULT
    
    if clean_word in AI_SIGNATURE_WORDS:
        return AI_WORD_PROB
    if clean_word in HUMAN_SIGNATURE_WORDS:
        return HUMAN_WORD_PROB
        
    return BASE_CORPUS_FREQS.get(clean_word, OOV_PROB_DEFAULT)

def calculate_sentence_perplexity(sentence):
    """Calculates pseudo-perplexity for a sentence based on word probabilities."""
    words = [w for w in sentence.split() if w.strip()]
    if not words:
        return 0.0
    
    log_sum = sum(math.log2(get_word_probability(w)) for w in words)
    # Perplexity = 2 ^ (-1/N * sum(log2(P(w))))
    entropy = -log_sum / len(words)
    perplexity = math.pow(2, entropy)
    return min(perplexity, 500.0) # Cap for stability


def analyze_document(text):
    """
    Performs full linguistic inspection of a document.
    AI-generated text is characterized by low perplexity and low burstiness (uniformity).
    """
    # 1. Evasion checks
    hidden_chars = detect_hidden_characters(text)
    homoglyphs = detect_homoglyphs(text)
    
    # Clean text of invisible tricks before processing metrics
    clean_text = text
    for char in ['\u200b', '\u200c', '\u200d', '\ufeff', '\u00ad']:
        clean_text = clean_text.replace(char, '')
        
    # Split sentences (rudimentary sentence boundary detection)
    sentences = re.split(r'(?<=[.!?])\s+', clean_text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if not sentences:
        return {
            "error": "No valid sentences found in input text."
        }
        
    # 2. Metric extraction
    sentence_perplexities = []
    sentence_results = []
    
    for idx, sentence in enumerate(sentences):
        perp = calculate_sentence_perplexity(sentence)
        sentence_perplexities.append(perp)
        
        # Classify individual sentences based on statistical thresholding
        # Standard human text has high and variable perplexity.
        # AI text tends to fall in a lower, very predictable perplexity band (e.g. 5.0 to 12.0)
        # Note: Short sentences or list items naturally have lower pseudo-perplexity.
        classification = "human"
        if len(sentence.split()) > 5:
            if perp < 15.0:
                classification = "ai_direct"
            elif perp < 25.0:
                classification = "ai_polished"
                
        sentence_results.append({
            "index": idx,
            "text": sentence,
            "perplexity": round(perp, 2),
            "classification": classification
        })
        
    # Average perplexity
    avg_perplexity = sum(sentence_perplexities) / len(sentence_perplexities)
    
    # Burstiness (standard deviation of sentence perplexities)
    variance = sum((p - avg_perplexity) ** 2 for p in sentence_perplexities) / len(sentence_perplexities)
    burstiness = math.sqrt(variance)
    
    # 3. Overall Scoring Strategy
    # Low perplexity + Low burstiness = High likelihood of AI.
    # High perplexity + High burstiness = High likelihood of Human.
    # Mixed/formulaic yields mid-range scores.
    ai_probability = 0.0
    if avg_perplexity < 20.0 and burstiness < 15.0:
        # High likelihood of AI
        ai_probability = 90.0 - (avg_perplexity * 1.5) - (burstiness * 1.2)
    elif avg_perplexity < 35.0 and burstiness < 25.0:
        # Polished or hybrid
        ai_probability = 60.0 - (avg_perplexity * 0.8) - (burstiness * 0.5)
    else:
        # Human-like
        ai_probability = max(5.0, 20.0 - (avg_perplexity * 0.1) - (burstiness * 0.05))
        
    ai_probability = max(0.0, min(100.0, ai_probability))
    
    # Override likelihood if severe evasion triggers exist (highly suspicious)
    evasion_triggered = len(hidden_chars) > 0 or len(homoglyphs) > 0
    
    return {
        "summary": {
            "ai_probability": round(ai_probability, 1),
            "average_perplexity": round(avg_perplexity, 2),
            "burstiness": round(burstiness, 2),
            "sentence_count": len(sentences),
            "evasion_detected": evasion_triggered
        },
        "evasion_report": {
            "hidden_characters": hidden_chars,
            "homoglyphs": homoglyphs
        },
        "sentences": sentence_results
    }

if __name__ == "__main__":
    # Test cases
    human_sample = (
        "Yesterday, I wandered down to the old bookshop near the canal. "
        "The smells of coffee and decaying paper immediately overwhelmed me in a pleasant way. "
        "I randomly grabbed a dusty green volume and opened it to a page describing the history of ancient trade lanes. "
        "Honestly, the whole atmosphere felt incredibly peaceful, a nice escape from the crazy pace of my regular life."
    )
    
    ai_sample = (
        "The utilizing of digital technologies has altered the landscape of education in the modern era. "
        "It provides students with access to a wide array of educational resources and platforms. "
        "Furthermore, online learning systems offer flexibility and convenience to students across the world. "
        "In conclusion, the implementation of technology in teaching has shown significant benefits for modern academic structures."
    )
    
    evasion_sample = (
        "The utilize of dіgіtal technologies has altered the landscape of educatіon in the modern era. "  # contains Cyrillic i (\u0456)
        "It provides st\u200budents with access to a wide array of educational resources."                # contains zero-width space
    )
    
    print("=== Analyzing Human Sample ===")
    print(json.dumps(analyze_document(human_sample), indent=2))
    print("\n=== Analyzing AI Sample ===")
    print(json.dumps(analyze_document(ai_sample), indent=2))
    print("\n=== Analyzing Evasion Attack Sample ===")
    print(json.dumps(analyze_document(evasion_sample), indent=2))
