import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  Trash2, 
  ExternalLink, 
  Info,
  Cookie,
  KeyRound,
  FileText,
  Copy
} from 'lucide-react';
import { Language } from '../i18n/translations';

interface YouTubeCookieModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onCookieStatusChange?: (hasCookies: boolean) => void;
}

interface CookieStatus {
  active: boolean;
  sizeBytes: number;
  updatedAt: string | null;
  cookieCount: number;
}

export const YouTubeCookieModal: React.FC<YouTubeCookieModalProps> = ({
  isOpen,
  onClose,
  lang,
  onCookieStatusChange,
}) => {
  const isId = lang === 'id';
  const [cookieText, setCookieText] = useState('');
  const [status, setStatus] = useState<CookieStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch current status on open
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    fetchStatus();
  }, [isOpen]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/youtube-cookies');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        onCookieStatusChange?.(data.active);
      }
    } catch {
      // Safe fallback
    }
  };

  const handleSaveCookie = async () => {
    if (!cookieText.trim()) {
      setErrorMsg(isId ? 'Teks cookie tidak boleh kosong.' : 'Cookie text cannot be empty.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/youtube-cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies: cookieText }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan cookie');
      }

      setSuccessMsg(isId 
        ? `Cookie YouTube berhasil disimpan! (${data.cookieCount || 0} entri terdeteksi). Unduhan link YouTube sekarang aktif.` 
        : `YouTube cookies saved successfully! (${data.cookieCount || 0} entries). YouTube downloads are now enabled.`);
      setCookieText('');
      await fetchStatus();
    } catch (err: any) {
      setErrorMsg(err?.message || (isId ? 'Terjadi kesalahan saat menyimpan cookie.' : 'Failed to save cookies.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCookie = async () => {
    if (!confirm(isId ? 'Apakah Anda yakin ingin menghapus cookie YouTube?' : 'Are you sure you want to remove YouTube cookies?')) {
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/youtube-cookies', { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg(isId ? 'Cookie YouTube telah dihapus.' : 'YouTube cookies removed.');
        await fetchStatus();
      }
    } catch {
      setErrorMsg(isId ? 'Gagal menghapus cookie.' : 'Failed to delete cookies.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCookieText(content);
        setErrorMsg(null);
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <Cookie className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{isId ? 'Pengaturan Cookie YouTube (Bypass Proteksi Bot)' : 'YouTube Cookie Authentication'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isId 
                  ? 'Buka blokir unduhan klip YouTube pada server cloud' 
                  : 'Bypass cloud server bot challenges on YouTube links'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-5 text-xs sm:text-sm">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
            status?.active 
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300'
          }`}>
            <div className="flex items-start gap-2.5">
              {status?.active ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold block text-sm">
                  {status?.active 
                    ? (isId ? 'Status: Cookie YouTube Aktif' : 'Status: YouTube Cookies Active') 
                    : (isId ? 'Status: Cookie Belum Terpasang' : 'Status: No Cookies Configured')}
                </span>
                <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                  {status?.active ? (
                    isId 
                      ? `Server menggunakan autentikasi sesi Anda (${status.cookieCount} baris cookie). Unduhan YouTube langsung aktif.`
                      : `Server is using your session cookies (${status.cookieCount} entries). Direct YouTube downloads enabled.`
                  ) : (
                    isId 
                      ? 'YouTube memblokir IP server cloud jika tanpa cookie. Pasang cookie di bawah agar link YouTube dapat diunduh langsung.'
                      : 'YouTube blocks cloud server IPs without cookies. Add your cookies below to enable seamless clip downloads.'
                  )}
                </p>
                {status?.updatedAt && (
                  <span className="text-[10px] opacity-75 font-mono block mt-1">
                    {isId ? 'Terakhir diperbarui: ' : 'Last updated: '} {new Date(status.updatedAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {status?.active && (
              <button
                type="button"
                onClick={handleDeleteCookie}
                disabled={loading}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 text-xs font-semibold cursor-pointer shrink-0 transition-colors"
                title={isId ? 'Hapus Cookie' : 'Delete Cookies'}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isId ? 'Hapus' : 'Delete'}</span>
              </button>
            )}
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Step-by-Step Guide */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-violet-500" />
              <span>{isId ? 'Cara Mendapatkan Cookie YouTube (Hanya 1 Menit)' : 'How to Export YouTube Cookies (1 Minute)'}</span>
            </span>

            {/* Critical Note for Users */}
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="block text-[11px] uppercase tracking-wide text-amber-800 dark:text-amber-300">
                  {isId ? 'Catatan Penting Agar Tidak Salah:' : 'Important Note:'}
                </strong>
                {isId 
                  ? 'Jangan buka ekstensi saat berada di tab Chrome Web Store! Klik tab video YouTube Anda terlebih dahulu, baru buka ekstensi dan klik tombol [Copy].'
                  : 'Do not open the extension on the Chrome Web Store page! Switch to your YouTube video tab first, then open the extension and click [Copy].'}
              </div>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-200">
                  {isId ? '1. Pasang ekstensi:' : '1. Install extension:'}
                </span>{' '}
                {isId ? 'Pasang ' : 'Install '}
                <a 
                  href="https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-bold text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>Get cookies.txt LOCALLY</span>
                  <ExternalLink className="h-3 w-3" />
                </a>{' '}
                {isId ? '(sudah terpasang di browser Anda).' : '(free browser extension).'}
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-200">
                  {isId ? '2. Buka Tab YouTube Anda:' : '2. Open your YouTube Tab:'}
                </span>{' '}
                {isId 
                  ? 'Klik tab browser yang sedang memutar video YouTube (misalnya video yang ingin Anda potong).'
                  : 'Click the browser tab currently playing the YouTube video.'}
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-200">
                  {isId ? '3. Klik Ikon Ekstensi 🍪 & Klik Tombol [Copy]:' : '3. Click Extension 🍪 & Click [Copy]:'}
                </span>{' '}
                {isId 
                  ? 'Di tab YouTube tersebut, klik ikon kue 🍪 di pojok kanan atas browser, lalu klik tombol biru '
                  : 'On that YouTube tab, click the cookie icon 🍪 and click the blue '}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold font-mono text-[11px]">
                  <Copy className="h-3 w-3" /> Copy
                </span>{' '}
                {isId ? '(sebelah kanan tombol Export As).' : '(next to Export As).'}
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-200">
                  {isId ? '4. Tempel di DriaClip:' : '4. Paste in DriaClip:'}
                </span>{' '}
                {isId 
                  ? 'Kembali ke tab DriaClip ini, klik di kotak bawah, tekan Ctrl + V (Paste), lalu klik "Simpan & Aktifkan Cookie".'
                  : 'Return to this DriaClip tab, click in the box below, press Ctrl + V (Paste), then click "Save & Enable Cookies".'}
              </li>
            </ol>
          </div>

          {/* Cookie Input Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isId ? 'Tempel Teks Cookie (Format Netscape / cookies.txt):' : 'Paste Cookie Text (Netscape format):'}
              </label>

              {/* Upload file button */}
              <label className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-semibold cursor-pointer hover:underline">
                <Upload className="h-3.5 w-3.5" />
                <span>{isId ? 'Unggah file cookies.txt' : 'Upload cookies.txt file'}</span>
                <input 
                  type="file" 
                  accept=".txt" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
            </div>

            <textarea
              rows={6}
              value={cookieText}
              onChange={(e) => setCookieText(e.target.value)}
              placeholder={`# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t1799999999\tLOGIN_INFO\t...\n.youtube.com\tTRUE\t/\tTRUE\t1799999999\tSID\t...`}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 p-3 font-mono text-[11px] leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-violet-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500 transition-colors"
            />
          </div>

          {/* Quick Alternative Card */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/40 p-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">
                {isId 
                  ? 'Privasi aman: Cookie disimpan lokal di server aplikasi Anda dan hanya digunakan untuk memanggil yt-dlp.'
                  : 'Privacy safe: Cookies are stored locally on your app instance and only used for yt-dlp calls.'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isId ? 'Tutup' : 'Close'}
          </button>

          <button
            type="button"
            onClick={handleSaveCookie}
            disabled={loading || !cookieText.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{isId ? 'Menyimpan...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <KeyRound className="h-3.5 w-3.5" />
                <span>{isId ? 'Simpan & Aktifkan Cookie' : 'Save & Enable Cookies'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
