/**
 * Web Speech API Integration for Tamil (ta-IN)
 */

let recognition = null;

export function isSpeechRecognitionSupported() {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export function isSpeechSynthesisSupported() {
  return 'speechSynthesis' in window;
}

/**
 * Speak text in Tamil using SpeechSynthesis API
 */
export function speakTamil(text, rate = 1.0, enabled = true, onEnd = null) {
  if (!enabled || !isSpeechSynthesisSupported() || !text) {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ta-IN';
  utterance.rate = rate;

  // Attempt to find a Tamil voice if available
  const voices = window.speechSynthesis.getVoices();
  const taVoice = voices.find(v => v.lang.includes('ta') || v.lang.includes('TA'));
  if (taVoice) {
    utterance.voice = taVoice;
  }

  if (onEnd) {
    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd();
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Stop ongoing speech synthesis
 */
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Start Tamil Speech Recognition
 */
export function startTamilListening({ onResult, onError, onEnd, lang = 'ta-IN' }) {
  if (!isSpeechRecognitionSupported()) {
    if (onError) onError('பேச்சு அங்கீகாரம் இந்த உலாவியில் ஆதரிக்கப்படவில்லை.');
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (recognition) {
    try { recognition.abort(); } catch (e) {}
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = lang;

  let finalTranscript = '';

  recognition.onresult = (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    const currentText = finalTranscript || interimTranscript;
    if (onResult) onResult(currentText, Boolean(finalTranscript));
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  try {
    recognition.start();
  } catch (err) {
    console.error('Failed to start recognition:', err);
    if (onError) onError(err.message);
  }

  return recognition;
}

/**
 * Stop current speech recognition
 */
export function stopTamilListening() {
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {}
    recognition = null;
  }
}
