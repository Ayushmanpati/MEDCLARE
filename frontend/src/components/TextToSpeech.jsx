import React, { useState, useEffect, useCallback } from 'react';

/**
 * Clean markdown symbols from text for better TTS experience.
 * @param {string} text 
 * @returns {string}
 */
const cleanMarkdown = (text) => {
    if (!text) return '';
    return text
        .replace(/[#*`_~\[\]()<>]/g, '') // Remove symbols like #, *, `, _, ~, [, ], (, ), <, >
        .replace(/\n+/g, ' ')            // Replace newlines with spaces
        .replace(/\s+/g, ' ')            // Collapse multiple spaces
        .trim();
};

/**
 * TextToSpeech Component
 * Provides a simple interface to speak text using the Web Speech API.
 */
const TextToSpeech = ({ text, language = 'en-US' }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [supported, setSupported] = useState(true);

    useEffect(() => {
        if (!window.speechSynthesis) {
            setSupported(false);
        }
        
        return () => {
            window.speechSynthesis?.cancel();
        };
    }, []);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    const speak = useCallback(() => {
        if (!supported || !text) return;

        // Cancel previous speech if any
        window.speechSynthesis.cancel();

        const cleanedText = cleanMarkdown(text);
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        
        // Map common i18n codes to BCP 47 if needed (though props usually pass BCP 47)
        utterance.lang = language;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
            console.error('SpeechSynthesis Error:', event);
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    }, [text, language, supported]);

    if (!supported) return null;

    return (
        <div className="tts-container" style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            {!isSpeaking ? (
                <button 
                    onClick={speak} 
                    className="btn btn-ghost" 
                    style={{ fontSize: 'var(--fs-xs)', padding: '0.4rem 0.8rem' }}
                    disabled={!text}
                >
                    🔊 Listen to Analysis
                </button>
            ) : (
                <button 
                    onClick={stop} 
                    className="btn btn-danger" 
                    style={{ fontSize: 'var(--fs-xs)', padding: '0.4rem 0.8rem' }}
                >
                    ⏹ Stop
                </button>
            )}
        </div>
    );
};

export default TextToSpeech;
