'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.lang = 'he-IL';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interim += transcript;
          }
        }
        if (finalTranscript) {
          setInterimText('');
          setText(prev => {
            const trimmed = prev.trim();
            return (trimmed ? trimmed + ' ' : '') + finalTranscript;
          });
        } else {
          setInterimText(interim);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
    }

    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const handleSend = () => {
    const cleanText = text.trim();
    if (!cleanText || disabled) return;
    onSend(cleanText);
    setText('');
    setInterimText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimText('');
    } else {
      setInterimText('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech recognition start error:', err);
      }
    }
  }, [isListening]);

  // Combine confirmed text with interim preview
  const displayValue = text + (interimText ? (text ? ' ' : '') + interimText : '');

  return (
    <div className="border-t border-gray-100 bg-white p-3">
      <div className="flex items-end gap-2">
        {speechSupported && (
          <button
            onClick={toggleListening}
            disabled={disabled}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors shrink-0 ${
              isListening
                ? 'bg-red-50 text-red-500 hover:bg-red-100 animate-pulse'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={isListening ? '\u05DC\u05D7\u05E5 \u05DC\u05E2\u05E6\u05D5\u05E8' : '\u05D3\u05D1\u05E8 \u05D1\u05DE\u05E7\u05D5\u05DD \u05DC\u05D4\u05E7\u05DC\u05D9\u05D3'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}
        <textarea
          ref={inputRef}
          value={displayValue}
          onChange={(e) => {
            setText(e.target.value);
            setInterimText('');
          }}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? '\u05DE\u05D0\u05D6\u05D9\u05DF...' : '\u05E9\u05D0\u05DC \u05E9\u05D0\u05DC\u05D4 \u05E2\u05DC \u05D4\u05DE\u05E2\u05E8\u05DB\u05EA...'}
          disabled={disabled}
          rows={1}
          className={`flex-1 resize-none rounded-xl border bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors disabled:opacity-50 ${
            isListening
              ? 'border-red-200 focus:border-red-300 focus:ring-red-100'
              : 'border-gray-200 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary-200)]'
          }`}
          style={{ maxHeight: '120px', minHeight: '40px' }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Send className="w-4 h-4 rotate-180" />
        </button>
      </div>
      <p className="text-[10px] text-gray-300 mt-1 text-center">
        {isListening && (
          <span className="text-red-400 ml-2">{'\u25CF'} {'\u05DE\u05E7\u05DC\u05D9\u05D8'}</span>
        )}
        {' '}{text.trim().length}/2000
      </p>
    </div>
  );
}
