import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { ArrowLeft, Mic, MicOff, Volume2, CheckCircle2, AlertTriangle, AlertOctagon, Send, MessageSquare } from 'lucide-react';

const QUESTIONS = [
  "Good morning! How are you feeling today?",
  "Did you sleep well last night?",
  "Are you experiencing any pain, dizziness, weakness, or unusual discomfort?"
];

export const ElderCheckIn: React.FC = () => {
  const [elderId, setElderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Conversation state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentInput, setCurrentInput] = useState('');

  // Voice & Speech State
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<'Not listening' | 'Listening...' | 'Processing...'>('Not listening');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Completion State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionResult, setCompletionResult] = useState<any>(null);

  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchElder = async () => {
      try {
        const res = await api.get('/dashboard/elder');
        setElderId(res.data.elder.id);
      } catch (err: any) {
        setError('Failed to initialize elder check-in.');
      } finally {
        setLoading(false);
      }
    };
    fetchElder();

    // Check Web Speech Recognition support
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechAvailable(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechStatus('Listening...');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCurrentInput(transcript);
        setSpeechStatus('Processing...');
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setSpeechStatus('Not listening');
      };

      recognition.onend = () => {
        setIsListening(false);
        setSpeechStatus('Not listening');
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechAvailable(false);
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // Speak AI question using SpeechSynthesis
  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower, clear voice for elderly
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speak question whenever question index changes
  useEffect(() => {
    if (!loading && !completionResult) {
      speakQuestion(QUESTIONS[currentQuestionIndex]);
    }
  }, [currentQuestionIndex, loading, completionResult]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setError(null);
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
  };

  const handleNextQuestion = async () => {
    if (!currentInput.trim()) {
      setError('Please provide an answer by speaking or typing.');
      return;
    }

    setError(null);
    stopListening();

    const updatedAnswers = { ...answers, [currentQuestionIndex]: currentInput.trim() };
    setAnswers(updatedAnswers);
    setCurrentInput('');

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Final Question Completed -> Submit Check-in
      submitCheckIn(updatedAnswers);
    }
  };

  const submitCheckIn = async (finalAnswers: Record<number, string>) => {
    if (!elderId || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const formattedAnswersObj: Record<string, string> = {
        [QUESTIONS[0]]: finalAnswers[0] || 'Good',
        [QUESTIONS[1]]: finalAnswers[1] || 'Slept well',
        [QUESTIONS[2]]: finalAnswers[2] || 'No pain',
      };

      const response = await api.post('/checkins', {
        elderId,
        answers: formattedAnswersObj,
        mood: finalAnswers[0]?.toLowerCase().includes('good') ? 'Cheerful' : 'Okay',
      });

      setCompletionResult(response.data);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const doneUtterance = new SpeechSynthesisUtterance("Thank you! Your daily check-in is complete.");
        window.speechSynthesis.speak(doneUtterance);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Loading label="Initializing Conversational Check-in..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 sm:p-6 bg-slate-100 min-h-screen">
      <div className="flex items-center justify-between">
        <Link
          to="/elder"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-300 rounded-2xl text-lg font-bold text-slate-700 hover:bg-slate-200"
        >
          <ArrowLeft className="h-6 w-6" /> Back to Home
        </Link>
        <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
          Question {currentQuestionIndex + 1} of 3
        </span>
      </div>

      {!completionResult ? (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-4 border-slate-300 shadow-xl space-y-6">
          {/* Question Display Card */}
          <div className="bg-sky-50 border-4 border-sky-400 p-6 rounded-3xl text-center space-y-3">
            <div className="inline-flex bg-sky-600 text-white p-3 rounded-full">
              <Volume2 className={`h-8 w-8 ${isSpeaking ? 'animate-bounce' : ''}`} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
              "{QUESTIONS[currentQuestionIndex]}"
            </h1>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-400 text-red-800 rounded-2xl text-base font-bold text-center">
              {error}
            </div>
          )}

          {/* Voice Input Section */}
          <div className="space-y-4 text-center bg-slate-50 p-6 rounded-3xl border-2 border-slate-200">
            <div className="flex items-center justify-center gap-3">
              <span className={`h-4 w-4 rounded-full ${
                isListening ? 'bg-red-500 animate-ping' : 'bg-slate-400'
              }`} />
              <span className="text-lg font-extrabold text-slate-700 uppercase tracking-wider">
                Microphone: <strong className={isListening ? 'text-red-600' : 'text-slate-500'}>{speechStatus}</strong>
              </span>
            </div>

            {speechAvailable ? (
              <div className="flex justify-center">
                {!isListening ? (
                  <button
                    type="button"
                    onClick={startListening}
                    className="py-5 px-8 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-2xl rounded-2xl shadow-lg flex items-center gap-3 transition-transform active:scale-95 border-4 border-sky-800"
                  >
                    <Mic className="h-8 w-8" /> 🎙️ Tap to Speak Answer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopListening}
                    className="py-5 px-8 bg-red-600 hover:bg-red-700 text-white font-extrabold text-2xl rounded-2xl shadow-lg flex items-center gap-3 transition-transform active:scale-95 border-4 border-red-800 animate-pulse"
                  >
                    <MicOff className="h-8 w-8" /> Stop Microphone
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm font-semibold text-slate-500">
                ℹ️ Speech recognition is unavailable in this browser. Please use the text input below.
              </p>
            )}

            {/* Answer Display & Fallback Input */}
            <div className="pt-4 border-t border-slate-200 text-left">
              <label className="block text-base font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-sky-600" />
                Your Answer (Speak or Type):
              </label>
              <textarea
                rows={3}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Type your response here or speak into the microphone..."
                className="w-full p-4 border-4 border-slate-300 rounded-2xl text-xl font-semibold text-slate-900 focus:border-sky-500 focus:ring-4 focus:ring-sky-200"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleNextQuestion}
              className="w-full py-5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-2xl rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-98 disabled:opacity-50 border-4 border-emerald-800"
            >
              {isSubmitting ? 'Analyzing & Submitting...' : currentQuestionIndex < QUESTIONS.length - 1 ? 'Next Question 👉' : 'Complete Daily Check-in ✅'}
            </button>
          </div>
        </div>
      ) : (
        /* Completion Results Screen */
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-4 border-emerald-500 shadow-2xl text-center space-y-6">
          <CheckCircle2 className="h-20 w-20 text-emerald-600 mx-auto" />

          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
              Daily Check-in Complete!
            </h1>
            <p className="text-lg text-slate-600 font-semibold mt-2">
              We have recorded your wellness check-in responses.
            </p>
          </div>

          {/* Result Badge */}
          <div className="p-6 rounded-3xl border-4 shadow-sm inline-block w-full">
            {completionResult.concernLevel === 'NORMAL' && (
              <div className="bg-emerald-50 border-emerald-400 p-6 rounded-2xl text-center space-y-2">
                <span className="text-3xl font-black text-emerald-900 block">🟢 NORMAL</span>
                <p className="text-base text-emerald-800 font-bold">
                  {completionResult.summaryNotes || "You're feeling good today! Have a wonderful day."}
                </p>
              </div>
            )}

            {completionResult.concernLevel === 'ATTENTION' && (
              <div className="bg-amber-50 border-amber-400 p-6 rounded-2xl text-center space-y-2">
                <span className="text-3xl font-black text-amber-900 block">🟡 ATTENTION NEEDED</span>
                <p className="text-base text-amber-800 font-bold">
                  {completionResult.summaryNotes}
                </p>
                <p className="text-sm font-semibold text-amber-900 mt-2">
                  Your caregiver has been notified to check in with you.
                </p>
              </div>
            )}

            {completionResult.concernLevel === 'URGENT' && (
              <div className="bg-red-50 border-red-500 p-6 rounded-2xl text-center space-y-2">
                <span className="text-3xl font-black text-red-900 block">🔴 URGENT SAFETY CONCERN</span>
                <p className="text-base text-red-800 font-bold">
                  Please contact your caregiver or appropriate emergency/healthcare service immediately if you need help.
                </p>
              </div>
            )}

            {completionResult.keywords && completionResult.keywords.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-500">
                Reported Terms: <span className="font-bold text-slate-800">{completionResult.keywords.join(', ')}</span>
              </div>
            )}
          </div>

          <Link
            to="/elder"
            className="inline-block w-full py-5 px-6 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-2xl rounded-2xl shadow-xl transition-transform active:scale-98"
          >
            Return to Home Screen
          </Link>
        </div>
      )}

      {/* Non-Diagnostic Safety Disclaimer Notice */}
      <div className="p-4 bg-slate-200 rounded-2xl text-center text-xs text-slate-600 font-semibold border border-slate-300">
        💡 LovelyHome is a wellness and safety support tool. It does not diagnose medical conditions or replace professional medical care.
      </div>
    </div>
  );
};
