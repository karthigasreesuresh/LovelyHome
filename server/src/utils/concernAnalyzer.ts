export type ConcernLevel = 'NORMAL' | 'ATTENTION' | 'URGENT';

export interface AnalysisResult {
  concernLevel: ConcernLevel;
  keywords: string[];
  summaryNotes: string;
}

// Order matters: check URGENT phrases first, then ATTENTION phrases, then NORMAL phrases.
const URGENT_PATTERNS = [
  'severe pain',
  'chest pain',
  'difficulty breathing',
  'shortness of breath',
  'serious injury',
  'bleeding',
  'unconscious',
  'emergency',
  'cannot breathe',
  "can't breathe",
  'fall',
  'stroke',
  'heart attack',
  'fainted',
  'passed out',
];

const ATTENTION_PATTERNS = [
  'tired',
  'weak',
  'headache',
  'dizzy',
  'fatigue',
  'not feeling well',
  'uncomfortable',
  'slight pain',
  'cough',
  'fever',
  'nausea',
  'sore',
  'stiff',
  'poor sleep',
  'did not sleep',
  "didn't sleep well",
];

const NORMAL_PATTERNS = [
  'good',
  'fine',
  'okay',
  'well',
  'comfortable',
  'happy',
  'great',
  'slept well',
  'no pain',
  'feeling good',
  'healthy',
  'peaceful',
  'rested',
];

export const analyzeConcern = (input: string | Record<string, string>): AnalysisResult => {
  let combinedText = '';

  if (typeof input === 'string') {
    combinedText = input;
  } else if (typeof input === 'object' && input !== null) {
    combinedText = Object.values(input).join(' ');
  }

  // Normalize: lower case and clean Punctuation
  const normalized = combinedText.toLowerCase().replace(/[^\w\s']/g, ' ');

  const foundUrgentKeywords: string[] = [];
  const foundAttentionKeywords: string[] = [];
  const foundNormalKeywords: string[] = [];

  // Check Urgent
  for (const pattern of URGENT_PATTERNS) {
    if (normalized.includes(pattern)) {
      foundUrgentKeywords.push(pattern);
    }
  }

  // Check Attention
  for (const pattern of ATTENTION_PATTERNS) {
    if (normalized.includes(pattern)) {
      foundAttentionKeywords.push(pattern);
    }
  }

  // Check Normal
  for (const pattern of NORMAL_PATTERNS) {
    if (normalized.includes(pattern)) {
      foundNormalKeywords.push(pattern);
    }
  }

  if (foundUrgentKeywords.length > 0) {
    return {
      concernLevel: 'URGENT',
      keywords: Array.from(new Set(foundUrgentKeywords)),
      summaryNotes: 'Potentially urgent safety signal reported during check-in. Please contact the elder or appropriate emergency/healthcare service for human confirmation.',
    };
  }

  if (foundAttentionKeywords.length > 0) {
    return {
      concernLevel: 'ATTENTION',
      keywords: Array.from(new Set(foundAttentionKeywords)),
      summaryNotes: 'Mild discomfort or fatigue reported during check-in. Non-diagnostic wellness flag generated for caregiver review.',
    };
  }

  const normalKeywordsToReturn = foundNormalKeywords.length > 0 ? Array.from(new Set(foundNormalKeywords)) : ['satisfactory'];

  return {
    concernLevel: 'NORMAL',
    keywords: normalKeywordsToReturn,
    summaryNotes: 'No concerning wellness terms detected. Elder reports feeling comfortable.',
  };
};
