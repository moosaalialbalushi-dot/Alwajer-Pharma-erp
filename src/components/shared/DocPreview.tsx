import React, { useRef, useMemo, useEffect } from 'react';
import { X, Printer, Download } from 'lucide-react';

interface Props {
  title: string;
  html: string;
  filename: string;
  onClose: () => void;
}

export const DocPreview: React.FC<Props> = ({ title, html, filename, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const blobUrl = useMemo(() => {
    const blob = new Blob([html], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [html]);

  useEffect(() => () => URL.revokeObjectURL(blobUrl), [blobUrl]);

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  const handleDownloadWord = () => {
    // Wrap in proper Word-compatible HTML
    const wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>${title}</title>
      <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
      </head><body>${html}</body></html>`;
    const blob = new Blob([wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.doc`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col border border-gray-200" style={{ height: '95vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0 bg-gray-50 rounded-t-2xl">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadWord}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
            >
              <Download size={13}/> Download Word (.doc)
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 rounded-lg text-xs font-bold transition-all"
            >
              <Printer size={13}/> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-gray-200 rounded-lg transition-all">
              <X size={18}/>
            </button>
          </div>
        </div>
        {/* Document preview */}
        <div className="flex-1 overflow-hidden rounded-b-2xl bg-gray-100">
          <iframe
            ref={iframeRef}
            src={blobUrl}
            className="w-full h-full border-0"
            title={title}
          />
        </div>
      </div>
    </div>
  );
};
