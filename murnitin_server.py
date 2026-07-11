import http.server
import socketserver
import json
import re
import math
import sys
import os

# Port configuration
PORT = 8000

# ─────────────────────────────────────────────────────────────────────────────
# LAZY-LOAD HUGGING FACE MODEL
# ─────────────────────────────────────────────────────────────────────────────
DETECTOR = None
try:
    print("Loading Hugging Face AI Detector model ('Hello-SimpleAI/chatgpt-detector-roberta')...")
    from transformers import pipeline
    # This will load the model from cache if already downloaded, otherwise fetch it.
    DETECTOR = pipeline("text-classification", model="Hello-SimpleAI/chatgpt-detector-roberta")
    print("✓ AI Detector Model loaded successfully!")
except Exception as e:
    print("⚠ Could not load transformers pipeline. Falling back to statistical heuristics.")
    print("Error details:", e)

# ─────────────────────────────────────────────────────────────────────────────
# BASE STATISTICAL ENGINE & VOCABULARY (Fallback / Perplexity Chart)
# ─────────────────────────────────────────────────────────────────────────────
BASE_FREQS = {
    "the":0.060,"of":0.035,"and":0.028,"a":0.022,"in":0.020,"to":0.019,
    "is":0.018,"that":0.015,"for":0.012,"it":0.011,"with":0.010,"as":0.010,
    "are":0.009,"on":0.009,"at":0.008,"by":0.008,"an":0.008,"be":0.007,
    "this":0.007,"from":0.007,"or":0.006,"which":0.006,"not":0.006,
    "model":0.0035,"models":0.003,"data":0.003,"learning":0.003,
    "results":0.003,"method":0.002,"approach":0.002,"analysis":0.002,
    "proposed":0.002,"framework":0.002,"system":0.002,"algorithm":0.002,
}
AI_BOILERPLATE = {"furthermore","moreover","consequently","ultimately","additionally","delve","tapestry","testament"}
HUMAN_MARKERS = {"honestly","frankly","surprisingly","unexpectedly","weirdly","honestly","coding"}
OOV_PROB = 0.00015
AI_PROB = 0.055
HUMAN_PROB = 0.00002

def get_word_probability(word):
    w = re.sub(r"[^a-z'-]", '', word.lower())
    if not w: return OOV_PROB
    if w in AI_BOILERPLATE: return AI_PROB
    if w in HUMAN_MARKERS: return HUMAN_PROB
    return BASE_FREQS.get(w, OOV_PROB)

def sentence_perplexity(sentence):
    words = [w for w in sentence.split() if w.strip()]
    if not words: return 0.0
    log_sum = sum(math.log2(get_word_probability(w)) for w in words)
    return min(math.pow(2, -log_sum/len(words)), 500.0)

# Evasion Scanning
INVISIBLE = {'\u200b':'Zero-Width Space','\u200c':'ZWNJ','\u200d':'ZWJ','\ufeff':'BOM','\u00ad':'Soft Hyphen'}

def detect_evasions(text):
    hidden = [{'character': name, 'occurrences': text.count(char)}
              for char, name in INVISIBLE.items() if text.count(char) > 0]
    
    homo = []
    for word in re.findall(r'\b\w+\b', text):
        latin = sum(1 for c in word if 65 <= ord(c) <= 90 or 97 <= ord(c) <= 122)
        cyril = sum(1 for c in word if 1024 <= ord(c) <= 1279)
        greek = sum(1 for c in word if 913 <= ord(c) <= 987)
        if latin > 0 and (cyril > 0 or greek > 0):
            homo.append({'word': word, 'Latin': latin, 'Cyrillic': cyril, 'Greek': greek})
    return hidden, homo

def clean_pdf_text(text):
    text = re.sub(r'-\s*\n\s*', '', text)
    text = re.sub(r'(?<![.!?])\n(?!\n)', ' ', text)
    text = re.sub(r'\n{2,}', '\n', text)
    text = re.sub(r' {2,}', ' ', text)
    text = re.sub(r'\[\d+\]', '', text)
    return text.strip()

# ─────────────────────────────────────────────────────────────────────────────
# HTTP HANDLER
# ─────────────────────────────────────────────────────────────────────────────
class MurnitinHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/analyze':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                raw_text = data.get('text', '')
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Invalid JSON payload")
                return

            if not raw_text:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Empty text field")
                return

            # Evasion Diagnostics
            hidden, homo = detect_evasions(raw_text)
            has_evasion = len(hidden) > 0 or len(homo) > 0

            # Clean text
            clean_text = raw_text
            for ch in INVISIBLE:
                clean_text = clean_text.replace(ch, '')
            clean_text = clean_pdf_text(clean_text)

            # Split sentences
            raw_sents = re.split(r'(?<=[.!?])\s+', clean_text)
            sentences = [s.strip() for s in raw_sents if len(s.strip().split()) >= 4]

            if not sentences:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No scorable sentences found.'}).encode('utf-8'))
                return

            # Classify sentences
            sent_results = []
            ai_direct_count = 0
            ai_polished_count = 0

            # Run model if available
            if DETECTOR:
                try:
                    # Run batch classification on sentences
                    predictions = DETECTOR(sentences)
                    
                    for i, (s, pred) in enumerate(zip(sentences, predictions)):
                        # Model output: Label (ChatGPT/Human), Score (0.0 - 1.0)
                        label = pred['label']
                        score = pred['score']
                        p_score = sentence_perplexity(s) # Maintain perplexity mapping for chart
                        
                        cls = 'human'
                        if label == 'ChatGPT':
                            if score > 0.70:
                                cls = 'ai_direct'
                                ai_direct_count += 1
                            else:
                                cls = 'ai_polished'
                                ai_polished_count += 1
                        else: # label == 'Human'
                            if score < 0.75: # Low confidence human prediction = polished
                                cls = 'ai_polished'
                                ai_polished_count += 1
                                
                        sent_results.append({
                            'idx': i,
                            'text': s,
                            'perplexity': round(p_score, 2),
                            'classification': cls
                        })
                except Exception as e:
                    print("⚠ Model inference failed. Falling back to statistical scoring:", e)
                    # Fallback to local statistical engine
                    for i, s in enumerate(sentences):
                        p = sentence_perplexity(s)
                        cls = 'human'
                        if p < 16:
                            cls = 'ai_direct'
                            ai_direct_count += 1
                        elif p < 30:
                            cls = 'ai_polished'
                            ai_polished_count += 1
                        sent_results.append({'idx': i, 'text': s, 'perplexity': round(p, 2), 'classification': cls})
            else:
                # Local statistical engine only
                for i, s in enumerate(sentences):
                    p = sentence_perplexity(s)
                    cls = 'human'
                    if p < 16:
                        cls = 'ai_direct'
                        ai_direct_count += 1
                    elif p < 30:
                        cls = 'ai_polished'
                        ai_polished_count += 1
                    sent_results.append({'idx': i, 'text': s, 'perplexity': round(p, 2), 'classification': cls})

            # Calculate metrics
            perps = [r['perplexity'] for r in sent_results]
            avg_perplexity = sum(perps) / len(perps)
            variance = sum((p - avg_perplexity) ** 2 for p in perps) / len(perps)
            burstiness = math.sqrt(variance)

            # Compute AI Likelihood
            ai_flagged_count = ai_direct_count + ai_polished_count
            ai_flagged_pct = (100 * ai_flagged_count) / len(sentences)
            
            # Map model-flagged percentage to final score
            score = ai_flagged_pct
            if has_evasion:
                score = max(score, 85.0)
            
            score = round(max(0.0, min(100.0, score)))

            # Verdict mapping
            if score < 25:       verdict = 'Likely Human'
            elif score < 55:     verdict = 'Inconclusive / Mixed'
            elif score < 80:     verdict = 'Likely AI-Assisted'
            else:                verdict = 'Likely AI-Generated'
            if has_evasion:      verdict = 'Evasion Detected'

            response_data = {
                'score': score,
                'avg': avg_perplexity,
                'burstiness': burstiness,
                'sentences': sent_results,
                'aiSentences': ai_flagged_count,
                'aiDirectCount': ai_direct_count,
                'aiPolishedCount': ai_polished_count,
                'aiFlaggedPct': round(ai_flagged_pct, 1),
                'hasEvasion': has_evasion,
                'hiddenChars': hidden,
                'homoglyphs': [h['word'] for h in homo],
                'verdict': verdict,
                'verdictClass': 'green' if score < 25 else 'yellow' if score < 80 else 'red'
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def end_headers(self):
        # Support CORS for local API queries
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

# Start Server
if __name__ == '__main__':
    # Change working directory to directory of the script to serve static files correctly
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    handler = MurnitinHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Murnitin Server running at http://localhost:{PORT}/")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            sys.exit(0)
