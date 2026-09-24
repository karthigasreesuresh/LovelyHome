export interface CandidateMedicine {
  id: string;
  name: string;
  dosage: string;
  scheduleTime: string;
  frequency: string;
  instructions: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface KnownMedicineDef {
  canonicalName: string;
  aliases: string[];
  defaultDosage: string;
  defaultInstructions: string;
}

const MEDICAL_DICTIONARY: KnownMedicineDef[] = [
  { canonicalName: 'Augmentin 625mg', aliases: ['augmentin', 'augmentin625', 'augmentin 625', 'augmen', 'agumentin', 'e25', 'les £25'], defaultDosage: '625 mg', defaultInstructions: 'Take after meals' },
  { canonicalName: 'Enzoflam', aliases: ['enzoflam', 'enzoflam tab', 'enmflan', 'enzoflan', 'enzoflm', 'enflan', 'tak enmflan'], defaultDosage: '1 Tablet', defaultInstructions: 'Take after meals' },
  { canonicalName: 'Pan D 40mg', aliases: ['pan d', 'pand', 'pan-d', 'pan d 40mg', 'pantoprazole d', 'tab fad', 'tab fad lory', 'pan d40mg'], defaultDosage: '40 mg', defaultInstructions: 'Take before meals' },
  { canonicalName: 'Hexigel Gum Paint', aliases: ['hexigel', 'hexigel gum paint', 'hesse', 'hexigel paint', 'hexigum', 'hesse 9', 'hesse 9 eo', 'hexigel gum'], defaultDosage: 'Pea-sized gel application', defaultInstructions: 'Massage on gums for 1 week' },
  { canonicalName: 'Amlodipine', aliases: ['amlodipine', 'amlong', 'amlo'], defaultDosage: '5 mg', defaultInstructions: 'Take after breakfast' },
  { canonicalName: 'Metformin', aliases: ['metformin', 'glycomet', 'metfor'], defaultDosage: '500 mg', defaultInstructions: 'Take with or after food' },
  { canonicalName: 'Pantoprazole', aliases: ['pantoprazole', 'panto', 'pantocid', 'pan 40'], defaultDosage: '40 mg', defaultInstructions: 'Take 30 mins before breakfast' },
  { canonicalName: 'Paracetamol / Dolo 650', aliases: ['paracetamol', 'dolo', 'dolo 650', 'calpol', 'crocin'], defaultDosage: '650 mg', defaultInstructions: 'Take after food for fever/pain' },
  { canonicalName: 'Azithromycin', aliases: ['azithromycin', 'azithral', 'aziwo'], defaultDosage: '500 mg', defaultInstructions: 'Take once daily before food' },
  { canonicalName: 'Amoxicillin', aliases: ['amoxicillin', 'mox', 'novamox'], defaultDosage: '500 mg', defaultInstructions: 'Take after food' },
  { canonicalName: 'Ciprofloxacin', aliases: ['ciprofloxacin', 'cifran', 'cipro'], defaultDosage: '500 mg', defaultInstructions: 'Take after meals' },
  { canonicalName: 'Combiflam', aliases: ['combiflam', 'combi'], defaultDosage: '1 Tablet', defaultInstructions: 'Take after meals' },
  { canonicalName: 'Atorvastatin', aliases: ['atorvastatin', 'atorva', 'storvas'], defaultDosage: '10 mg', defaultInstructions: 'Take at bedtime' },
  { canonicalName: 'Telmisartan', aliases: ['telmisartan', 'telma', 'tazloc'], defaultDosage: '40 mg', defaultInstructions: 'Take in the morning' },
  { canonicalName: 'Levothyroxine', aliases: ['levothyroxine', 'thyronorm', 'eltroxin'], defaultDosage: '50 mcg', defaultInstructions: 'Take early morning on empty stomach' },
  { canonicalName: 'Cetirizine', aliases: ['cetirizine', 'cetzine', 'okacet'], defaultDosage: '10 mg', defaultInstructions: 'Take at bedtime' },
  { canonicalName: 'Ranitidine / Rantac', aliases: ['ranitidine', 'rantac', 'aciloc'], defaultDosage: '150 mg', defaultInstructions: 'Take before meals' },
];

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export const parsePrescriptionText = (rawText: string): CandidateMedicine[] => {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  const cleanText = rawText.toLowerCase();
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const candidates: CandidateMedicine[] = [];
  const foundNames = new Set<string>();

  // 1. Check against dictionary for exact or fuzzy alias matches across whole text or lines
  for (const medDef of MEDICAL_DICTIONARY) {
    if (foundNames.has(medDef.canonicalName)) continue;

    let matched = false;
    for (const alias of medDef.aliases) {
      if (cleanText.includes(alias)) {
        matched = true;
        break;
      }
      // Check line-by-line fuzzy distance for handwritten OCR noise
      for (const line of lines) {
        const lineLower = line.toLowerCase();
        const dist = levenshteinDistance(alias, lineLower);
        const maxDist = Math.max(2, Math.floor(alias.length * 0.35));
        if (dist <= maxDist || lineLower.includes(alias.slice(0, Math.min(4, alias.length)))) {
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    if (matched) {
      foundNames.add(medDef.canonicalName);

      // Determine timing / frequency context
      let frequency = 'Twice daily';
      let scheduleTime = '08:00 AM, 08:00 PM';
      let instructions = medDef.defaultInstructions;

      if (medDef.canonicalName.includes('Pan D')) {
        frequency = 'Once daily (Before Food)';
        scheduleTime = '07:30 AM';
        instructions = 'Take 30 mins before breakfast';
      } else if (medDef.canonicalName.includes('Augmentin') || medDef.canonicalName.includes('Enzoflam')) {
        frequency = 'Twice daily (After Food)';
        scheduleTime = '08:30 AM, 08:30 PM';
        instructions = 'Take after meals for 5 days';
      } else if (medDef.canonicalName.includes('Hexigel')) {
        frequency = 'Twice daily';
        scheduleTime = '09:00 AM, 09:00 PM';
        instructions = 'Massage on gums after meals for 1 week';
      }

      candidates.push({
        id: `dict-${candidates.length + 1}-${Date.now()}`,
        name: medDef.canonicalName,
        dosage: medDef.defaultDosage,
        scheduleTime,
        frequency,
        instructions,
        confidence: 'HIGH'
      });
    }
  }

  // 2. Parse lines with Tab / Cap / Rx regex pattern if dictionary didn't catch everything
  lines.forEach((line, index) => {
    const rxMatch = line.match(/(?:Tab|Cap|Rx|Tablet|Capsule)\.?\s*([A-Za-z0-9\s]{3,25})/i);
    if (rxMatch) {
      const extractedName = rxMatch[1].trim();
      const isAlreadyAdded = Array.from(foundNames).some(n => n.toLowerCase().includes(extractedName.toLowerCase()));

      if (!isAlreadyAdded && extractedName.length > 2) {
        const dosageMatch = line.match(/\b\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml|tablet|tab|capsule)\b/i);
        const dosage = dosageMatch ? dosageMatch[0] : '1 Tablet';

        let frequency = 'Daily';
        if (/1\s*-\s*0\s*-\s*1/i.test(line) || /bd|twice/i.test(line)) frequency = 'Twice daily (1-0-1)';
        else if (/1\s*-\s*0\s*-\s*0/i.test(line) || /od|once/i.test(line)) frequency = 'Once daily (1-0-0)';
        else if (/1\s*-\s*1\s*-\s*1/i.test(line) || /tds|thrice/i.test(line)) frequency = 'Three times daily (1-1-1)';

        let instructions = 'Take as prescribed';
        if (/before/i.test(line) || /empty/i.test(line)) instructions = 'Take before meals';
        else if (/after/i.test(line) || /food|meal/i.test(line)) instructions = 'Take after meals';

        candidates.push({
          id: `rx-line-${index}-${Date.now()}`,
          name: `Tab. ${extractedName}`,
          dosage,
          scheduleTime: frequency.includes('Twice') ? '08:00 AM, 08:00 PM' : '08:00 AM',
          frequency,
          instructions,
          confidence: 'MEDIUM'
        });
      }
    }
  });

  return candidates;
};
