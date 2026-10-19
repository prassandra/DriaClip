import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Mail, 
  Send, 
  CheckCircle2, 
  Info, 
  Server, 
  Cpu, 
  Lock, 
  FileText,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Language } from '../i18n/translations';

export type PageView = 'about' | 'contact' | 'privacy' | 'disclaimer' | 'none';

interface LegalAndInfoPagesProps {
  currentPage: PageView;
  onClose: () => void;
  lang: Language;
}

export const LegalAndInfoPages: React.FC<LegalAndInfoPagesProps> = ({
  currentPage,
  onClose,
  lang,
}) => {
  if (currentPage === 'none') return null;

  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      // Keep state clear after response
    }, 4000);
  };

  const isId = lang === 'id';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200 max-w-full overflow-hidden">
      <div className="relative flex flex-col max-h-[92vh] w-full max-w-4xl rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 bg-neutral-50 dark:bg-neutral-900/40">
          <div className="flex items-center gap-2.5">
            {currentPage === 'about' && <Info className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
            {currentPage === 'contact' && <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
            {currentPage === 'privacy' && <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            {currentPage === 'disclaimer' && <AlertTriangle className="h-5 w-5 text-amber-500" />}

            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white capitalize">
                {currentPage === 'about' && (isId ? 'Tentang Kami – DriaClip by Driacom' : 'About Us – DriaClip by Driacom')}
                {currentPage === 'contact' && (isId ? 'Hubungi Kami – Dukungan Driacom' : 'Contact Us – Driacom Support')}
                {currentPage === 'privacy' && (isId ? 'Kebijakan Privasi & Pemrosesan Video' : 'Privacy Policy & Video Data Protection')}
                {currentPage === 'disclaimer' && (isId ? 'Penyangkalan & Pedoman Hak Cipta' : 'Disclaimer & Copyright Guidelines')}
              </h2>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                {isId ? 'Dokumentasi Resmi Platform' : 'Official Platform Documentation'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          {/* ABOUT US */}
          {currentPage === 'about' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-violet-200 dark:border-violet-500/20 bg-violet-50/50 dark:bg-violet-950/20 p-5 space-y-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-violet-700 dark:text-violet-400 font-mono">
                  {isId ? 'Visi Rekayasa & Produk' : 'Engineering & Product Vision'}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {isId 
                    ? 'Memberdayakan Kreator Konten Melalui Infrastruktur Pemotongan Video Otomatis' 
                    : 'Empowering Modern Creators Through Automated Video Clipping Infrastructure'}
                </h3>
                <p className="text-xs text-neutral-300">
                  {isId 
                    ? 'DriaClip dikembangkan oleh Driacom sebagai respons atas tingginya kebutuhan konversi video berdurasi panjang (podcast, webinar, rekaman konferensi, streaming) menjadi video pendek vertikal berformat 9:16 untuk konsumsi TikTok, YouTube Shorts, dan Instagram Reels.'
                    : 'DriaClip was engineered by Driacom to solve the friction of turning hours of raw long-form footage (podcasts, webinars, keynote presentations, and live streams) into high-retention 9:16 vertical shorts for TikTok, YouTube Shorts, and Instagram Reels.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-violet-400 font-semibold text-xs uppercase tracking-wider">
                    <Cpu className="h-4 w-4" />
                    <span>{isId ? 'Algoritma Deteksi Sorotan' : 'Highlight Detection Heuristics'}</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {isId
                      ? 'DriaClip menggabungkan deteksi transisi adegan visual dengan analisis lonjakan energi vokal dan pemodelan konteks AI untuk memastikan setiap klip dimulai dengan hook penarik perhatian yang kuat dalam 3 detik pertama.'
                      : 'DriaClip combines visual scene cut detection with vocal energy amplitude analysis and AI semantic modeling to ensure every generated clip opens with a compelling 3-second retention hook.'}
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                    <Server className="h-4 w-4" />
                    <span>{isId ? 'Komitmen Driacom' : 'The Driacom Standard'}</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {isId
                      ? 'Driacom berkomitmen menghadirkan perangkat lunak web berkualitas industri tinggi tanpa kompromi, tanpa iklan intrusif, dengan kinerja sub-detik dan kepatuhan penuh terhadap privasi data pengguna.'
                      : 'Driacom is dedicated to building industrial-grade web software without compromise—zero intrusive telemetry, zero dark patterns, sub-second latency, and complete compliance with user data privacy standards.'}
                  </p>
                </div>
              </div>

              <div className="border-t border-neutral-800 pt-4 text-xs text-neutral-400 space-y-2">
                <p>
                  <strong>{isId ? 'Informasi Pengembang:' : 'Developer & Brand Information:'}</strong> Driacom Technologies
                </p>
                <p>
                  <strong>{isId ? 'Situs Resmi:' : 'Official Website:'}</strong>{' '}
                  <a href="https://driacom.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                    https://driacom.com
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* CONTACT US */}
          {currentPage === 'contact' && (
            <div className="space-y-6">
              <div>
                <p className="text-xs text-neutral-400">
                  {isId 
                    ? 'Punya pertanyaan teknis, saran fitur, atau laporan masalah? Tim rekayasa Driacom siap membantu Anda.'
                    : 'Have a technical inquiry, feature suggestion, or bug report? The Driacom engineering team is here to assist.'}
                </p>
              </div>

              {contactSubmitted ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                  <h4 className="text-base font-bold text-white">
                    {isId ? 'Pesan Berhasil Dikirim!' : 'Message Sent Successfully!'}
                  </h4>
                  <p className="text-xs text-neutral-300 max-w-md mx-auto">
                    {isId 
                      ? 'Terima kasih telah menghubungi DriaClip by Driacom. Tim kami akan meninjau pesan Anda dan merespons dalam 1x24 jam.'
                      : 'Thank you for reaching out to DriaClip by Driacom. Our technical team will review your message and reply within 24 hours.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                        {isId ? 'Nama Lengkap' : 'Your Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={isId ? 'Contoh: Alex Pratama' : 'e.g., Alex Reed'}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                        {isId ? 'Alamat Email' : 'Email Address'}
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={isId ? 'email@domain.com' : 'you@company.com'}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      {isId ? 'Subjek Pesan' : 'Subject'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder={isId ? 'Permintaan fitur / Laporan bug / Kerja sama' : 'Feature Request / Technical Question'}
                      className="w-full rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      {isId ? 'Detail Pesan' : 'Message Details'}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={isId ? 'Tuliskan rincian pesan atau pertanyaan Anda di sini...' : 'Provide details regarding your video clipping requirements or bug reproduction steps...'}
                      className="w-full rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-violet-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {isId ? 'Dukungan Resmi:' : 'Official Support:'}{' '}
                      <span className="font-mono text-violet-600 dark:text-violet-300 font-semibold">support@driacom.com</span>
                    </div>

                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-md transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{isId ? 'Kirim Pesan' : 'Send Message'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* PRIVACY POLICY */}
          {currentPage === 'privacy' && (
            <div className="space-y-5 text-xs text-neutral-300 leading-relaxed">
              <div className="rounded-lg bg-neutral-900/60 border border-neutral-800 p-3 text-[11px] font-mono text-neutral-400">
                {isId ? 'Terakhir Diperbarui: 28 September 2026' : 'Last Updated: September 28, 2026'} &middot; DriaClip by Driacom Privacy Standard
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  {isId ? '1. Komitmen Privasi dan Pemrosesan Video' : '1. Privacy Commitment & Video Data Processing'}
                </h4>
                <p>
                  {isId
                    ? 'Driacom menghormati hak privasi dan kerahasiaan materi intelektual Anda. DriaClip dirancang dengan arsitektur privacy-first, di mana pemrosesan video berkas upload lokal dilakukan langsung di dalam sandbox memori browser klien menggunakan WebCodecs dan HTML5 Canvas API bila memungkinkan, tanpa mengalirkan file mentah ke server eksternal tanpa izin.'
                    : 'Driacom respects your privacy and intellectual property. DriaClip is designed with a privacy-first architecture: local file processing is executed directly inside client-side browser memory sandboxes via WebCodecs and HTML5 Canvas APIs whenever possible, eliminating unnecessary data exposure.'}
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  {isId ? '2. Kebijakan Penghapusan File Otomatis' : '2. Automated Data Purge Policy'}
                </h4>
                <p>
                  {isId
                    ? 'Untuk pemrosesan yang memerlukan alur kerja server: Semua file master dan artefak klip sementara yang disimpan di buffer penyimpanan SSD sementara akan dihapus secara permanen dan otomatis dalam waktu maksimal 24 hingga 48 jam.'
                    : 'For workflows requiring server-side staging: Master files and ephemeral clip chunks stored in worker SSD buffers are strictly subject to an automated lifecycle purge within 24 to 48 hours.'}
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  {isId ? '3. Tidak Ada Penjualan Data atau Pelacakan Pihak Ketiga' : '3. Zero Data Sale & Zero Third-Party Advertising'}
                </h4>
                <p>
                  {isId
                    ? 'DriaClip tidak menjual, menyewakan, atau membagikan rekaman video, audio, teks transkrip, atau data pribadi pengguna kepada pihak ketiga atau jaringan periklanan mana pun.'
                    : 'DriaClip does not monetize, sell, lease, or distribute user video media, audio waveforms, transcript text, or personal credentials to third-party ad brokers or data aggregators.'}
                </p>
              </section>
            </div>
          )}

          {/* DISCLAIMER */}
          {currentPage === 'disclaimer' && (
            <div className="space-y-5 text-xs text-neutral-300 leading-relaxed">
              <div className="rounded-lg bg-amber-950/20 border border-amber-800/40 p-3 text-[11px] font-mono text-amber-300">
                {isId ? 'Pemberitahuan Hukum Penting Mengenai Konten Video' : 'Important Legal Notice Regarding Video Content'}
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  {isId ? '1. Pedoman Hak Cipta & Konten Video' : '1. Copyright & Video Content Guidelines'}
                </h4>
                <p>
                  {isId
                    ? 'DriaClip by Driacom ditujukan semata-mata untuk memproses berkas video milik pengguna sendiri, materi domain publik, atau konten yang berada di bawah lisensi Creative Commons dan doktrin Penggunaan Wajar (Fair Use) untuk tujuan edukasi, kritik, analisis, atau kutipan.'
                    : 'DriaClip by Driacom is designed strictly for personal creator footage, public domain content, and media governed under Creative Commons or standard Fair Use doctrine (commentary, criticism, analysis, and educational transformational works).'}
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  {isId ? '2. Tanggung Jawab Hak Cipta & Ganti Rugi' : '2. Copyright Compliance & User Indemnification'}
                </h4>
                <p>
                  {isId
                    ? 'Pengguna memikul tanggung jawab penuh untuk memastikan bahwa mereka memiliki izin atau lisensi yang sah dari pemilik hak cipta sebelum memproses, memotong, atau mendistribusikan ulang klip video apa pun. Driacom dibebaskan dari segala bentuk tuntutan hukum atau kerugian yang timbul akibat penyalahgunaan hak cipta oleh pengguna pihak ketiga.'
                    : 'Users bear sole legal responsibility for ensuring they possess necessary rights, licenses, or fair use permissions prior to clipping and redistributing media. Driacom disclaims any and all liability for copyright infringements executed by end users.'}
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  {isId ? '3. Kepatuhan Ketentuan Layanan Platform' : '3. Terms of Service Adherence'}
                </h4>
                <p>
                  {isId
                    ? 'Layanan ini tidak berafiliasi dengan, disponsori oleh, atau didukung secara resmi oleh Google LLC, YouTube, ByteDance/TikTok, atau Meta/Instagram. Semua merek dagang adalah milik sah dari masing-masing pemegangnya.'
                    : 'This utility is not affiliated with, sponsored by, or endorsed by Google LLC, YouTube, ByteDance/TikTok, or Meta Platforms Inc. All respective trademarks belong to their authorized owners.'}
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
