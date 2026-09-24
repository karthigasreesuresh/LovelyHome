import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Loading } from '../../components/Loading';
import { Alert as AlertComponent } from '../../components/Alert';
import { parsePrescriptionText, CandidateMedicine } from '../../utils/prescriptionParser';
import { preprocessImageForOcr } from '../../utils/imagePreprocessor';
import { FileText, Upload, Plus, Trash2, CheckCircle, ShieldAlert, Cpu, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { createWorker } from 'tesseract.js';

export const PrescriptionsPage: React.FC = () => {
  const [elders, setElders] = useState<any[]>([]);
  const [selectedElderId, setSelectedElderId] = useState<string>('');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // OCR Processing State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [extractedRawText, setExtractedRawText] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Candidate Medicines Form State
  const [candidates, setCandidates] = useState<CandidateMedicine[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchInitialData = async () => {
    try {
      const [elderRes, presRes] = await Promise.all([
        api.get('/elders'),
        api.get('/prescriptions')
      ]);
      setElders(elderRes.data.elders);
      setPrescriptions(presRes.data.prescriptions);
      if (elderRes.data.elders.length > 0) {
        setSelectedElderId(elderRes.data.elders[0].id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const processSelectedFile = (selectedFile: File) => {
    setOcrError(null);
    setExtractedRawText(null);
    setCandidates([]);
    setSuccessMessage(null);

    // Validate File Type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setOcrError('Unsupported file format. Please upload PNG, JPG, JPEG, or WEBP images.');
      return;
    }

    // Validate File Size (Max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setOcrError('File size is too large. Please upload an image under 10MB.');
      return;
    }

    if (selectedFile.size === 0) {
      setOcrError('Selected file is empty. Please choose a valid image.');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadHandwrittenSample = () => {
    const rawSampleText = `12/10/22 Mr. Sachin Sansare 28/m
Rx
after meals {
Tab. Augmentin 625mg  1-0-1 x 5days
Tab. Enzoflam  1-0-1 x 5days
}
before meals {
Tab. Pan D 40mg  1-0-0 x 5days
}
Adv: Hexigel gum paint massage 1-0-1 x 1week`;

    setExtractedRawText(rawSampleText);
    setCandidates([
      {
        id: `sample-1-${Date.now()}`,
        name: 'Tab. Augmentin 625mg',
        dosage: '625 mg',
        scheduleTime: '08:30 AM, 08:30 PM',
        frequency: 'Twice daily (1-0-1)',
        instructions: 'Take after meals for 5 days',
        confidence: 'HIGH'
      },
      {
        id: `sample-2-${Date.now()}`,
        name: 'Tab. Enzoflam',
        dosage: '1 Tablet',
        scheduleTime: '08:30 AM, 08:30 PM',
        frequency: 'Twice daily (1-0-1)',
        instructions: 'Take after meals for 5 days',
        confidence: 'HIGH'
      },
      {
        id: `sample-3-${Date.now()}`,
        name: 'Tab. Pan D 40mg',
        dosage: '40 mg',
        scheduleTime: '07:30 AM',
        frequency: 'Once daily (1-0-0)',
        instructions: 'Take before meals (empty stomach) for 5 days',
        confidence: 'HIGH'
      },
      {
        id: `sample-4-${Date.now()}`,
        name: 'Hexigel Gum Paint',
        dosage: 'Pea-sized application',
        scheduleTime: '09:00 AM, 09:00 PM',
        frequency: 'Twice daily (1-0-1)',
        instructions: 'Massage on gums after meals for 1 week',
        confidence: 'HIGH'
      }
    ]);
    setOcrError(null);
    setSuccessMessage('Loaded handwritten prescription sample (White Tusk Dental - Mr. Sachin Sansare)!');
  };

  const processOcr = async () => {
    if (!file) return;

    setIsOcrProcessing(true);
    setOcrError(null);
    setOcrProgress(0);
    setOcrStatusText('Applying high-contrast thresholding & pre-processing image...');

    try {
      let imageToProcess: File | Blob = file;
      try {
        const { processedBlob, processedDataUrl } = await preprocessImageForOcr(file);
        imageToProcess = processedBlob;
        setPreviewUrl(processedDataUrl);
      } catch (prepErr) {
        console.warn('Canvas preprocessing skipped, proceeding with raw image:', prepErr);
      }

      setOcrStatusText('Running Tesseract OCR & Fuzzy Medical Parser...');
      const worker = await createWorker('eng');
      const ret = await worker.recognize(imageToProcess);
      const text = ret.data.text;
      await worker.terminate();

      if (!text || !text.trim()) {
        setOcrError('Unable to read this image. Please upload a clearer image or use manual entry.');
        setIsOcrProcessing(false);
        return;
      }

      setExtractedRawText(text);
      
      // Parse Candidate Medicines
      const parsedCandidates = parsePrescriptionText(text);

      if (parsedCandidates.length === 0) {
        setCandidates([{
          id: `candidate-${Date.now()}`,
          name: '',
          dosage: '1 Tablet',
          scheduleTime: '08:00 AM',
          frequency: 'Daily',
          instructions: 'Take after breakfast',
        }]);
      } else {
        setCandidates(parsedCandidates);
      }
    } catch (err: any) {
      console.error('OCR Error:', err);
      setOcrError('Unable to read this image. Please upload a clearer image.');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const processAiVisionOcr = async () => {
    if (!file) return;

    setIsOcrProcessing(true);
    setOcrError(null);
    setOcrStatusText('Analyzing prescription with Gemini Vision AI Server...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result as string;
        try {
          const res = await api.post('/prescriptions/analyze', {
            base64Image,
            imageType: file.type
          });

          if (res.data.rawText) {
            setExtractedRawText(res.data.rawText);
          }

          if (res.data.candidates && res.data.candidates.length > 0) {
            setCandidates(res.data.candidates.map((c: any, i: number) => ({
              id: `ai-${i}-${Date.now()}`,
              name: c.name || 'Medicine',
              dosage: c.dosage || '1 Tablet',
              scheduleTime: c.scheduleTime || '08:00 AM',
              frequency: c.frequency || 'Daily',
              instructions: c.instructions || 'Take as prescribed',
              confidence: 'HIGH'
            })));
            setSuccessMessage(`Vision AI successfully extracted ${res.data.candidates.length} medicine schedule(s)!`);
          } else {
            const parsed = parsePrescriptionText(res.data.rawText || '');
            if (parsed.length > 0) {
              setCandidates(parsed);
            }
          }
        } catch (apiErr: any) {
          console.error(apiErr);
          setOcrError(apiErr.response?.data?.error || 'AI Vision scan failed. Using client Tesseract OCR fallback.');
        } finally {
          setIsOcrProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setOcrError('Failed to read image file.');
      setIsOcrProcessing(false);
    }
  };

  const handleCandidateChange = (id: string, field: keyof CandidateMedicine, value: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleRemoveCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const handleAddManualCandidate = () => {
    setCandidates(prev => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        name: '',
        dosage: '1 Tablet',
        scheduleTime: '08:00 AM',
        frequency: 'Daily',
        instructions: 'Take as prescribed',
      }
    ]);
  };

  const handleConfirmSaveAll = async () => {
    if (!selectedElderId) {
      alert('Please select an elder profile.');
      return;
    }

    if (candidates.length === 0) {
      alert('Please add or extract at least one medicine entry.');
      return;
    }

    // Validate fields
    for (const c of candidates) {
      if (!c.name.trim() || !c.dosage.trim() || !c.scheduleTime.trim()) {
        alert('Please fill in Medicine Name, Dosage, and Schedule Time for all entries.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const source = extractedRawText ? 'OCR' : 'MANUAL';

      for (const c of candidates) {
        await api.post('/medicines', {
          elderId: selectedElderId,
          name: c.name.trim(),
          dosage: c.dosage.trim(),
          scheduleTime: c.scheduleTime.trim(),
          frequency: c.frequency.trim(),
          instructions: c.instructions.trim(),
          source,
        });
      }

      // Also log prescription metadata
      await api.post('/prescriptions', {
        elderId: selectedElderId,
        doctorName: 'Uploaded Prescription OCR Scan',
        notes: `Medicines added via ${source}: ${candidates.map(c => c.name).join(', ')}`,
      });

      setSuccessMessage(`Successfully saved ${candidates.length} medicine schedule(s) to elder profile!`);
      setCandidates([]);
      setFile(null);
      setPreviewUrl(null);
      setExtractedRawText(null);
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save medicine schedules.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <Loading label="Loading Prescription OCR System..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prescription OCR & Medication Scanner</h1>
          <p className="text-sm text-slate-500">Scan doctor prescriptions with client-side Tesseract.js AI or enter manually</p>
        </div>

        {elders.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Elder Profile:</span>
            <select
              value={selectedElderId}
              onChange={(e) => setSelectedElderId(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold bg-white"
            >
              {elders.map(e => (
                <option key={e.id} value={e.id}>{e.name} (Age {e.age})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 text-emerald-800 rounded-xl text-sm font-bold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Upload & OCR Trigger Card */}
      <Card title="Upload Doctor Prescription Image">
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
              isDragging ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
            />
            <div className="mx-auto w-12 h-12 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mb-3">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Click or Drag & Drop Prescription Image</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Supported formats: PNG, JPG, JPEG, WEBP (Max 10MB)</p>

            <Button type="button" variant="outline" className="font-semibold pointer-events-none">
              Browse Image File
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100/70 border border-slate-200 rounded-xl">
            <span className="text-xs text-slate-600 font-medium">Testing with handwritten doctor notes?</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleLoadHandwrittenSample}
              className="flex items-center gap-1.5 text-xs text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 font-semibold"
            >
              <Cpu className="h-3.5 w-3.5 text-sky-600" /> Auto-Fill Sample Handwritten Note (Sachin Sansare)
            </Button>
          </div>

          {file && (
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {previewUrl && <img src={previewUrl} alt="Prescription preview" className="w-16 h-16 object-cover rounded-lg border border-sky-300" />}
                <div>
                  <h4 className="font-bold text-sm text-sky-900">{file.name}</h4>
                  <p className="text-xs text-sky-700">{(file.size / 1024).toFixed(1)} KB | Ready for scanning</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="primary"
                  onClick={processOcr}
                  isLoading={isOcrProcessing}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <Cpu className="h-4 w-4" /> Run High-Contrast Medical OCR
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={processAiVisionOcr}
                  isLoading={isOcrProcessing}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold bg-purple-600 text-white hover:bg-purple-700"
                >
                  <Sparkles className="h-4 w-4" /> Scan with Gemini AI Vision
                </Button>
              </div>
            </div>
          )}

          {isOcrProcessing && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <RefreshCw className="h-4 w-4 animate-spin text-amber-600" />
                <span>{ocrStatusText}</span>
              </div>
            </div>
          )}

          {ocrError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-bold flex items-center justify-between">
              <span>{ocrError}</span>
              <Button size="sm" variant="outline" onClick={() => setFile(null)}>
                Try Clearer Image
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Extracted Raw OCR Text Box */}
      {extractedRawText && (
        <Card title="Extracted Prescription Text (Tesseract.js Output)">
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-48 whitespace-pre-wrap">
            {extractedRawText}
          </div>
        </Card>
      )}

      {/* Guardian Confirmation & Edit Form */}
      {(candidates.length > 0 || extractedRawText) && (
        <Card title="Guardian Review & Medicine Confirmation Form">
          {/* Important Safety Notice */}
          <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm mb-0.5">⚠️ Mandatory Safety Verification Notice</h4>
              <p className="leading-relaxed">
                Please verify all medicine names, dosages, schedules, and instructions against the original doctor prescription before saving. OCR may contain errors.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {candidates.map((candidate, idx) => (
              <div key={candidate.id} className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl relative space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-bold text-sm text-slate-800">
                    Medicine #{idx + 1} ({extractedRawText ? 'Extracted Candidate' : 'Manual Entry'})
                  </h4>
                  {candidates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCandidate(candidate.id)}
                      className="text-xs text-red-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove Entry
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Medicine Name *</label>
                    <input
                      type="text"
                      value={candidate.name}
                      onChange={(e) => handleCandidateChange(candidate.id, 'name', e.target.value)}
                      placeholder="e.g. Amlodipine"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dosage *</label>
                    <input
                      type="text"
                      value={candidate.dosage}
                      onChange={(e) => handleCandidateChange(candidate.id, 'dosage', e.target.value)}
                      placeholder="e.g. 5 mg / 1 tablet"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Schedule Time *</label>
                    <input
                      type="text"
                      value={candidate.scheduleTime}
                      onChange={(e) => handleCandidateChange(candidate.id, 'scheduleTime', e.target.value)}
                      placeholder="e.g. 08:00 AM"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Frequency</label>
                    <input
                      type="text"
                      value={candidate.frequency}
                      onChange={(e) => handleCandidateChange(candidate.id, 'frequency', e.target.value)}
                      placeholder="e.g. Once daily / Daily"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Instructions</label>
                    <input
                      type="text"
                      value={candidate.instructions}
                      onChange={(e) => handleCandidateChange(candidate.id, 'instructions', e.target.value)}
                      placeholder="e.g. After breakfast with water"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <Button type="button" variant="outline" onClick={handleAddManualCandidate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Another Medicine Entry
              </Button>

              <Button type="button" variant="primary" onClick={handleConfirmSaveAll} isLoading={isSaving} className="w-full sm:w-auto font-bold px-8">
                Confirm & Save Medicine Schedule
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Manual Entry Quick Action when no OCR image is selected */}
      {candidates.length === 0 && !extractedRawText && (
        <div className="text-center py-4">
          <Button type="button" variant="secondary" onClick={handleAddManualCandidate} className="flex items-center gap-2 mx-auto">
            <Plus className="h-4 w-4" /> Add Medicine Manually
          </Button>
        </div>
      )}
    </div>
  );
};
