import React, { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle, X, FileText, Image as ImageIcon } from 'lucide-react';
import { processFileUpload, transformToErpData, type FileAnalysisResult } from '@/services/universalFileLoader';

interface UniversalFileLoaderProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (data: any[], type: string) => void;
  claudeKey?: string;
  geminiKey?: string;
}

export const UniversalFileLoader: React.FC<UniversalFileLoaderProps> = ({
  isOpen,
  onClose,
  onDataLoaded,
  claudeKey,
  geminiKey
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FileAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await processFileUpload(file, { claudeKey, geminiKey });
      setResult(analysis);

      if (analysis.confidence > 50 && analysis.data.length > 0) {
        const transformed = transformToErpData(analysis);
        onDataLoaded(transformed, analysis.type);
        onClose(); // Close modal after successful data loading
      } else {
        setError('Could not extract structured data from file. Please try another file.');
      }
    } catch (err) {
      setError(`Error processing file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-slate-900">Universal File Loader</h2>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {!result && !isLoading && (
                <>
                  <p className="text-sm text-slate-600">
                    Upload any document or spreadsheet and AI will automatically extract and fill your ERP data.
                  </p>

                  {/* File input area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#D4AF37] transition-colors"
                  >
                    <Upload size={32} className="mx-auto text-[#D4AF37] mb-2" />
                    <p className="font-bold text-slate-900">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Supported: PDF, Excel, CSV, Word, Images (JPG, PNG, GIF)
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.xlsx,.xls,.csv,.docx,.jpg,.png,.gif,.webp"
                    className="hidden"
                  />

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-700">
                    <p className="font-bold mb-1">💡 How it works:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Upload purchase orders → Auto-fills Sales</li>
                      <li>Upload inventory sheets → Auto-fills Inventory</li>
                      <li>Upload production reports → Auto-fills Manufacturing</li>
                      <li>Upload receipt images → Claude reads and fills data</li>
                    </ul>
                  </div>
                </>
              )}

              {isLoading && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 size={32} className="animate-spin text-[#D4AF37] mb-2" />
                  <p className="text-slate-600">Analyzing file with AI...</p>
                </div>
              )}

              {result && !isLoading && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-green-900">Successfully extracted data</p>
                      <p className="text-sm text-green-700">
                        Type: <strong>{result.type}</strong> | {result.data.length} records | {result.confidence}% confidence
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <p className="text-xs font-bold text-slate-600 mb-2">Extracted Data Preview:</p>
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
                      {JSON.stringify(result.data.slice(0, 2), null, 2)}
                    </pre>
                  </div>

                  <button
                    onClick={() => {
                      setResult(null);
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2 bg-[#D4AF37] text-slate-900 rounded-lg font-bold hover:shadow-lg transition-all"
                  >
                    ✓ Data Loaded Successfully
                  </button>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-900">Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
