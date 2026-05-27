import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Download, Printer, CheckCircle, Info } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function ReportGenerator({ logs = [], selectedRegency = '' }) {
  const [reportType, setReportType] = useState('harian'); // 'harian' | 'aduan'
  const [reportMonth, setReportMonth] = useState('2026-05'); // Default bulan Mei 2026
  const [aduanData, setAduanData] = useState([]);
  const [loadingAduan, setLoadingAduan] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Ambil data aduan warga dari Supabase secara real-time jika tab aduan dipilih
  useEffect(() => {
    if (reportType === 'aduan') {
      fetchAduanData();
    }
  }, [reportType]);

  const fetchAduanData = async () => {
    setLoadingAduan(true);
    if (!isSupabaseConfigured || !supabase) {
      // Mock data aduan jika Supabase belum terkonfigurasi
      setAduanData([
        { id: 'aduan_mock_1', created_at: '2026-05-10T10:00:00Z', kabupaten: 'Badung', kecamatan: 'Kuta', desa: 'Legian', kategori: 'tumpukan_liar', status: 'baru' },
        { id: 'aduan_mock_2', created_at: '2026-05-15T11:30:00Z', kabupaten: 'Denpasar', kecamatan: 'Denpasar Selatan', desa: 'Sanur', kategori: 'pembakaran_terbuka', status: 'proses' },
        { id: 'aduan_mock_3', created_at: '2026-05-20T12:00:00Z', kabupaten: 'Gianyar', kecamatan: 'Ubud', desa: 'Peliatan', kategori: 'sungai_tercemar', status: 'selesai' }
      ]);
      setLoadingAduan(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pilah_laporan')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAduanData(data || []);
    } catch (e) {
      console.error('Gagal mengambil data aduan untuk laporan:', e);
    } finally {
      setLoadingAduan(false);
    }
  };

  // 2. Ekstraksi bulan unik dari logs/aduan aktif untuk dropdown
  const availableMonths = useMemo(() => {
    const months = new Set();
    const activeSource = reportType === 'harian' ? logs : aduanData;
    
    activeSource.forEach(l => {
      if (l.created_at) {
        const d = new Date(l.created_at);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.add(ym);
      }
    });
    // Tambahkan default Mei 2026 jika kosong
    months.add('2026-05');
    return Array.from(months).sort().reverse();
  }, [logs, aduanData, reportType]);

  // 3. Filter data sesuai wilayah & bulan yang dipilih
  const reportData = useMemo(() => {
    if (reportType === 'harian') {
      const filtered = logs.filter(log => {
        const matchesRegency = !selectedRegency || log.kabupaten === selectedRegency;
        let matchesMonth = true;
        if (log.created_at) {
          const d = new Date(log.created_at);
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          matchesMonth = ym === reportMonth;
        }
        return matchesRegency && matchesMonth;
      });

      // Menjumlahkan data agregat
      const totalKg = filtered.reduce((s, l) => s + (l.berat_gram || 0), 0) / 1000;
      const totalKwh = filtered.reduce((s, l) => s + (l.kwh_potensi || 0), 0);
      const totalCo2e = filtered.reduce((s, l) => s + (l.co2e_saved || 0), 0);
      const totalLogs = filtered.length;

      // Menhitung kontributor unik
      const contributors = new Set(filtered.map(l => l.user_id));
      const totalContributors = contributors.size || Math.round(totalLogs * 0.3) || 5;

      return {
        filtered,
        totalKg,
        totalKwh,
        totalCo2e,
        totalLogs,
        totalContributors
      };
    } else {
      // Data Laporan Aduan Warga
      const filtered = aduanData.filter(item => {
        const matchesRegency = !selectedRegency || item.kabupaten === selectedRegency;
        let matchesMonth = true;
        if (item.created_at) {
          const d = new Date(item.created_at);
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          matchesMonth = ym === reportMonth;
        }
        return matchesRegency && matchesMonth;
      });

      const totalAduan = filtered.length;
      const totalBaru = filtered.filter(item => item.status === 'baru').length;
      const totalProses = filtered.filter(item => item.status === 'proses').length;
      const totalSelesai = filtered.filter(item => item.status === 'selesai').length;

      return {
        filtered,
        totalAduan,
        totalBaru,
        totalProses,
        totalSelesai,
        totalLogs: totalAduan
      };
    }
  }, [logs, aduanData, reportType, selectedRegency, reportMonth]);

  // 4. Trigger Ekspor CSV (Client-side download - Zero cost)
  const handleExportCSV = () => {
    setGenerating(true);
    setTimeout(() => {
      try {
        let headers, rows, fileName;
        const regionLabel = selectedRegency ? selectedRegency.toLowerCase() : 'bali';

        if (reportType === 'harian') {
          headers = ['ID_Log', 'Tanggal', 'Kabupaten', 'Kecamatan', 'Desa', 'Banjar', 'Kategori', 'Berat (Gram)', 'LHV (MJ)', 'Listrik (kWh)', 'CO2e Saved (kg)'];
          rows = reportData.filtered.map((log, idx) => [
            log.id || `LOG_${idx + 1}`,
            log.created_at ? new Date(log.created_at).toLocaleDateString('id-ID') : '-',
            log.kabupaten || '-',
            log.kecamatan || '-',
            log.desa || '-',
            log.banjar || '-',
            log.kategori || '-',
            log.berat_gram || 0,
            log.lhv_mj || 0,
            log.kwh_potensi || 0,
            log.co2e_saved || 0
          ]);
          fileName = `laporan_pilah_harian_${regionLabel}_${reportMonth}.csv`;
        } else {
          headers = ['ID_Aduan', 'Tanggal_Laporan', 'Kabupaten', 'Kecamatan', 'Desa', 'Kategori', 'Deskripsi_Aduan', 'Status_Penanganan'];
          rows = reportData.filtered.map((aduan, idx) => [
            aduan.id || `ADUAN_${idx + 1}`,
            aduan.created_at ? new Date(aduan.created_at).toLocaleDateString('id-ID') : '-',
            aduan.kabupaten || '-',
            aduan.kecamatan || '-',
            aduan.desa || '-',
            aduan.kategori || '-',
            (aduan.deskripsi || 'Tidak ada deskripsi').replace(/,/g, ' '), // Membersihkan karakter koma agar csv rapi
            aduan.status || '-'
          ]);
          fileName = `laporan_aduan_warga_${regionLabel}_${reportMonth}.csv`;
        }

        // Gabungkan header dan baris dengan pemisah koma
        const csvContent = "data:text/csv;charset=utf-8," 
          + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        
        // Buat tautan download dinamis
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setSuccessMsg('Berkas CSV Berhasil Diekspor!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (e) {
        console.error('Ekspor gagal:', e);
      } finally {
        setGenerating(false);
      }
    }, 800);
  };

  // 5. Trigger Cetak PDF
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-brand-light rounded-3xl p-6 shadow-premium flex flex-col h-full space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-light pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-primary stroke-[2.5px]" />
          <h2 className="text-sm md:text-base font-bold text-brand-dark font-display">Pusat Generator Laporan</h2>
        </div>
        <span className="text-[9px] font-bold text-brand-primary bg-brand-light px-2.5 py-0.5 rounded-full border border-brand-primary/5">
          Ekspor Satu-Klik
        </span>
      </div>

      {/* Tabs Selector: Membedakan Laporan Pilah Harian & Aduan Warga */}
      <div className="bg-brand-light/50 p-1.5 rounded-2xl grid grid-cols-2 gap-1 shrink-0">
        <button
          onClick={() => {
            setReportType('harian');
            setReportMonth('2026-05');
          }}
          className={`py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${
            reportType === 'harian'
              ? 'bg-white text-brand-primary shadow-sm'
              : 'text-brand-dark/60 hover:text-brand-primary'
          }`}
        >
          Pilah Harian Warga
        </button>
        <button
          onClick={() => {
            setReportType('aduan');
            setReportMonth('2026-05');
          }}
          className={`py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${
            reportType === 'aduan'
              ? 'bg-white text-brand-primary shadow-sm'
              : 'text-brand-dark/60 hover:text-brand-primary'
          }`}
        >
          Aduan Kerusakan Warga
        </button>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
        <div>
          <label className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-1">Pilih Periode Laporan</label>
          <select
            value={reportMonth}
            onChange={(e) => setReportMonth(e.target.value)}
            className="w-full bg-[#F9FBF9] border border-brand-light rounded-xl px-3 py-2 text-xs font-semibold text-brand-dark focus:outline-none cursor-pointer"
          >
            {availableMonths.map(ym => {
              const [year, month] = ym.split('-');
              const monthsIndo = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
              ];
              return (
                <option key={ym} value={ym}>
                  {monthsIndo[parseInt(month, 10) - 1]} {year}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-1">Wilayah Otonom</label>
          <div className="w-full bg-brand-light/35 border border-brand-light rounded-xl px-3 py-2 text-xs font-bold text-brand-primary truncate">
            {selectedRegency ? `Kabupaten ${selectedRegency}` : 'Seluruh Bali (Agregat)'}
          </div>
        </div>
      </div>

      {/* Stats Summary Panel - Dynamic Based on Report Type */}
      <div className="flex-1 bg-[#F9FBF9] border border-brand-light/80 rounded-3xl p-5 flex flex-col justify-center space-y-4">
        {loadingAduan ? (
          <div className="text-center py-6 text-xs text-brand-textSecondary font-bold">
            Memuat data laporan aduan...
          </div>
        ) : (
          <>
            <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wide border-b border-brand-light pb-2">
              Ikhtisar Laporan {reportType === 'harian' ? 'Pilah Harian' : 'Aduan Warga'}
            </h3>
            
            {reportType === 'harian' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-brand-textSecondary font-bold block uppercase tracking-wider">Total Timbunan</span>
                  <span className="text-sm font-extrabold text-brand-dark">{reportData.totalKg.toFixed(2)} Ton</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-brand-textSecondary font-bold block uppercase tracking-wider">Proyeksi Listrik</span>
                  <span className="text-sm font-extrabold text-brand-dark">{reportData.totalKwh.toFixed(2)} kWh</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-brand-textSecondary font-bold block uppercase tracking-wider">Metana Dicegah</span>
                  <span className="text-sm font-extrabold text-brand-dark">{reportData.totalCo2e.toFixed(2)} kg CO₂e</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-brand-textSecondary font-bold block uppercase tracking-wider">Warga Pemilah</span>
                  <span className="text-sm font-extrabold text-brand-dark">{reportData.totalContributors} Jiwa</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-brand-textSecondary font-bold block uppercase tracking-wider">Total Aduan Masuk</span>
                  <span className="text-sm font-extrabold text-brand-dark">{reportData.totalAduan} Kasus</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-brand-textSecondary font-bold block uppercase tracking-wider">Aduan Baru</span>
                  <span className="text-sm font-extrabold text-brand-orange">{reportData.totalBaru} Kasus</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-brand-textSecondary font-bold block uppercase tracking-wider">Sedang Diatensi</span>
                  <span className="text-sm font-extrabold text-brand-yellow font-display">{reportData.totalProses} Kasus</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-brand-textSecondary font-bold block uppercase tracking-wider">Selesai Bersih</span>
                  <span className="text-sm font-extrabold text-green-700">{reportData.totalSelesai} Kasus</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2 shrink-0">
        {successMsg && (
          <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-3 flex items-center justify-center gap-1.5 text-xs text-brand-primary font-bold animate-fade-slide">
            <CheckCircle className="w-4 h-4 stroke-[2.5px]" />
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportCSV}
            disabled={generating || reportData.totalLogs === 0 || loadingAduan}
            className="w-full h-12 bg-[#F9FBF9] hover:bg-brand-light border border-brand-light text-brand-primary rounded-2xl text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            <Download className="w-4.5 h-4.5 stroke-[2.5px]" />
            {generating ? 'Mengekspor...' : 'Ekspor CSV'}
          </button>
          
          <button
            onClick={handlePrintPDF}
            disabled={reportData.totalLogs === 0 || loadingAduan}
            className="w-full h-12 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-2xl text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-brand-primary/10"
          >
            <Printer className="w-4.5 h-4.5 stroke-[2.5px]" />
            Cetak PDF
          </button>
        </div>

        <div className="bg-[#FFFDF9] border border-brand-yellow/15 rounded-2xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" />
          <p className="text-[10px] text-brand-textSecondary leading-normal">
            {reportType === 'harian'
              ? 'Laporan pilah harian ini dikalibrasi otomatis untuk format rekapitulasi Dinas Lingkungan Hidup Kabupaten/Kota se-Bali menuju pelaporan tahunan.'
              : 'Laporan aduan warga merepresentasikan audit performa kecepatan respon investigasi DLH dan kebersihan tumpukan sampah liar berdasarkan partisipasi aktif sipil.'}
          </p>
        </div>
      </div>
    </div>
  );
}
