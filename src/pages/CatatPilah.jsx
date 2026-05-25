import React, { useState, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Trash2, Package, ShoppingBag,
  Archive, Scale, Lightbulb, Leaf, AlertTriangle, Zap, X, Sparkles, BookOpen
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EdisonBulb } from '../components/features/EdisonBulb';
import { KATEGORI_COLORS, VOLUME_ESTIMATES } from '../lib/constants';
import { getLogCalculations } from '../lib/calculator';

const VOLUME_ICONS = {
  'bucket': Package,
  'bucket-large': Archive,
  'bag': ShoppingBag,
  'bag-large': ShoppingBag,
  'box': Package,
};

const SUB_CATEGORIES = {
  organik: [
    { id: 'daging', label: 'Sisa Makanan / Daging' },
    { id: 'sayur', label: 'Sisa Sayur / Buah' },
    { id: 'upakara', label: 'Sampah Upakara (Bunga/Janur/Canang)' },
    { id: 'lain', label: 'Daun & Organik Lain' }
  ],
  anorganik: [
    { id: 'plastik', label: 'Plastik (Botol/Gelas)' },
    { id: 'kertas', label: 'Kertas & Karton' },
    { id: 'kaca', label: 'Kaca / Beling' },
    { id: 'logam', label: 'Kaleng & Logam' },
    { id: 'lain', label: 'Anorganik Lain' }
  ],
  residu: [
    { id: 'popok', label: 'Popok Bayi/Pembalut' },
    { id: 'tissue', label: 'Tissue Basah / Masker' },
    { id: 'lain', label: 'Residu Lain' }
  ]
};

export function CatatPilah({ onAddLog, onBack }) {
  const [step, setStep] = useState(1);
  const [kategori, setKategori] = useState('');
  const [metode, setMetode] = useState('volume'); // 'volume' | 'manual'
  const [beratGram, setBeratGram] = useState(0);
  const [selectedVolume, setSelectedVolume] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCancel = () => {
    const confirmCancel = window.confirm("Apakah Anda yakin ingin membatalkan pemilahan sampah?");
    if (confirmCancel) {
      onBack();
    }
  };

  const handleToggleSub = (subId) => {
    setSelectedSubs(prev => 
      prev.includes(subId)
        ? prev.filter(id => id !== subId)
        : [...prev, subId]
    );
  };

  const getOrganicSimulationFeedback = () => {
    if (kategori !== 'organik' || selectedSubs.length === 0) return null;

    // Jika nyampur (memilih lebih dari 1 checkbox)
    if (selectedSubs.length > 1) {
      const co2Saved = (beratGram * 0.0019).toFixed(3); // 1.9g CO2e per gram organic
      return {
        title: "Campuran Sampah Organik",
        desc: `Pembuangan campuran organik ini berhasil mencegah terbentuknya ${co2Saved} kg gas metana beracun di landfill!`,
        advice: "Saran: Memilah sayur segar terpisah dari sisa makanan berminyak akan menghasilkan pupuk organik dengan kualitas jauh lebih baik dan bebas bau.",
        potensi: `Campuran ini berpotensi menjadi sekitar ${(beratGram * 0.4 / 1000).toFixed(2)} kg pupuk kompos rumah tangga.`
      };
    }

    // Jika hanya satu subkategori terpilih
    const sub = selectedSubs[0];
    if (sub === 'daging') {
      const bsfMaggot = (beratGram * 2).toFixed(0); // 1g daging = 2 maggot feed
      return {
        title: "Sisa Makanan & Daging",
        desc: "Sisa makanan tinggi lemak/protein ini merupakan nutrisi premium bagi larva BSF (Black Soldier Fly).",
        advice: "Saran: Masukkan ke wadah Ember Tumpuk tertutup agar maggot BSF alami dapat mereduksi limbah tanpa menimbulkan bau menyengat.",
        potensi: `Berpotensi menghidupi sekitar ${bsfMaggot} larva maggot sehat dan memanen POC kaya nitrogen.`
      };
    }
    
    if (sub === 'sayur') {
      const ecoEnzyme = (beratGram * 0.001).toFixed(2); // 1g sayur = 1ml eco-enzyme yield
      return {
        title: "Sisa Buah & Sayuran",
        desc: "Sisa sayuran dan kulit buah segar ini adalah bahan paling murni untuk proses fermentasi enzim.",
        advice: "Saran: Sangat cocok dicampur gula merah & air dengan rasio 1:3:10 untuk difermentasi menjadi cairan karun Eco-Enzyme serbaguna.",
        potensi: `Wadah ini berpotensi difermentasi menghasilkan sekitar ${ecoEnzyme} Liter cairan pembersih alami.`
      };
    }

    if (sub === 'upakara') {
      const bungaKg = (beratGram / 1000).toFixed(2);
      return {
        title: "Sampah Upakara / Canang",
        desc: "Bunga, janur, dan daun kelapa kering canang bekas ini murni dan bebas dari lemak hewani.",
        advice: "Saran: Sempurna untuk dimasukkan ke bak Semen Karang di sudut pekarangan. Cukup siram cucian air beras agar cepat hancur menjadi humus.",
        potensi: `Berpotensi menghasilkan ${bungaKg} kg tanah humus hitam subur menyuburkan tanaman hias pekarangan.`
      };
    }

    if (sub === 'lain') {
      return {
        title: "Dedaunan Kering / Ranting",
        desc: "Daun kering kaya akan kandungan Karbon (C) yang bertindak sebagai struktur penyerap lembap.",
        advice: "Saran: Tebarkan langsung di sekeliling pangkal batang pohon kebun sebagai mulsa alami pelindung penguapan air tanah pekarangan.",
        potensi: "Sangat baik dicampur sebagai penutup tumpukan sampah dapur basah agar komposter tidak bau busuk."
      };
    }

    return null;
  };

  const categories = [
    { key: 'organik', ...KATEGORI_COLORS.organik, icon: Leaf },
    { key: 'anorganik', ...KATEGORI_COLORS.anorganik, icon: Lightbulb },
    { key: 'residu', ...KATEGORI_COLORS.residu, icon: AlertTriangle },
  ];

  const handlePickCategory = (key) => {
    setKategori(key);
    setSelectedVolume('');
    setManualInput('');
    setBeratGram(0);
    setSelectedSubs([]);
    setError('');
  };

  const handlePickVolume = (vol) => {
    setSelectedVolume(vol.id);
    setBeratGram(vol.value);
    setMetode('volume');
    setError('');
  };

  const handleManualChange = (val) => {
    setManualInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setBeratGram(parsed);
      setMetode('manual');
      setSelectedVolume('');
      setError('');
    }
  };

  const goToStep2 = () => {
    if (!kategori) {
      setError('Pilih jenis sampah terlebih dahulu.');
      return;
    }
    setStep(2);
    setError('');
  };

  const goToStep3 = () => {
    if (beratGram <= 0) {
      setError('Masukkan estimasi berat sampah.');
      return;
    }
    if (selectedSubs.length === 0) {
      setError('Pilih minimal satu jenis sampah spesifik.');
      return;
    }
    setStep(3);
    setError('');
  };

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const calc = getLogCalculations(kategori, beratGram);
      const logEntry = await onAddLog(kategori, beratGram, metode, selectedSubs);
      setResult({ ...calc, logEntry });
      setStep(4); // Sukses
    } catch (e) {
      setError(e.message || 'Gagal menyimpan log.');
    } finally {
      setSaving(false);
    }
  }, [kategori, beratGram, metode, selectedSubs, saving, onAddLog]);

  const handleReset = () => {
    setStep(1);
    setKategori('');
    setBeratGram(0);
    setSelectedVolume('');
    setManualInput('');
    setSelectedSubs([]);
    setResult(null);
    setError('');
  };

  const currentKat = KATEGORI_COLORS[kategori];
  const volumes = VOLUME_ESTIMATES[kategori] || [];
  const preview = beratGram > 0 ? getLogCalculations(kategori || 'residu', beratGram) : null;

  return (
    <div className="px-5 pt-12 pb-36 md:pt-20 md:pb-16 max-w-lg md:max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {step < 4 && (
          <button
            onClick={step === 1 ? onBack : () => setStep(step - 1)}
            className="w-10 h-10 bg-brand-light rounded-2xl flex items-center justify-center hover:bg-brand-light/80 transition-all active:scale-95 animate-fade-slide cursor-pointer border-0"
          >
            <ArrowLeft className="w-5 h-5 text-brand-primary stroke-[2.5px]" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-brand-dark font-display">
            {step === 4 ? 'Berhasil!' : 'Catat Pilahan'}
          </h1>
          {step < 4 && (
            <p className="text-xs text-brand-textSecondary mt-0.5">Langkah {step} dari 3</p>
          )}
        </div>
        {step < 4 && (
          <button
            onClick={handleCancel}
            className="w-10 h-10 bg-brand-light hover:bg-brand-primary/10 text-brand-dark rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer border-0"
            title="Batalkan pemilahan"
          >
            <X className="w-5 h-5 text-brand-primary stroke-[2.5px]" />
          </button>
        )}
      </div>

      {/* Step Progress Bar */}
      {step < 4 && (
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? 'bg-brand-primary' : 'bg-brand-light'
              }`}
            />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-brand-orange/10 border border-brand-orange/20 rounded-2xl px-4 py-3 mb-4">
          <p className="text-xs text-brand-orange font-semibold">{error}</p>
        </div>
      )}

      {/* Step 1: Pilih Kategori */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-brand-textSecondary font-semibold mb-2">
            Pilih jenis sampah yang akan dicatat:
          </p>
          {categories.map(cat => {
            const CatIcon = cat.icon;
            const isSelected = kategori === cat.key;
            return (
              <Card
                key={cat.key}
                hoverable
                onClick={() => handlePickCategory(cat.key)}
                className={`flex items-center gap-4 cursor-pointer transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-offset-2' : ''
                }`}
                padding="sm"
                style={{
                  borderColor: isSelected ? cat.bg : undefined,
                  ringColor: isSelected ? cat.bg : undefined,
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: cat.light }}
                >
                  <CatIcon className="w-6 h-6" style={{ color: cat.bg }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold" style={{ color: cat.text }}>
                    {cat.label}
                  </h3>
                  <p className="text-xs text-brand-textSecondary mt-0.5 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                {isSelected && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: cat.bg }}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </Card>
            );
          })}

          <Button onClick={goToStep2} fullWidth size="lg" className="mt-4">
            Lanjutkan <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 2: Input Berat / Volume */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-2 animate-fade-slide">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: currentKat?.light }}
            >
              <Trash2 className="w-5 h-5" style={{ color: currentKat?.bg }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-dark">{currentKat?.label}</h2>
              <p className="text-xs text-brand-textSecondary">Estimasi berat sampah</p>
            </div>
          </div>

          {/* Checkbox Jenis Sampah Spesifik */}
          <div className="bg-[#F9FBF9] p-4 border border-brand-light rounded-3xl space-y-3 animate-fade-slide">
            <p className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brand-primary stroke-[2.5px]" />
              Komposisi Sampah Terpilah
            </p>
            <p className="text-[11px] text-brand-textSecondary">
              Pilih semua jenis sampah spesifik yang ada dalam wadah ini untuk akurasi data:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUB_CATEGORIES[kategori]?.map(sub => {
                const isChecked = selectedSubs.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleToggleSub(sub.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border flex items-center gap-1.5 border-0 ${
                      isChecked
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'bg-white text-brand-textSecondary border border-brand-light/80 hover:bg-brand-light/30'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                      isChecked ? 'border-white bg-white text-brand-primary' : 'border-brand-textSecondary/40 bg-transparent'
                    }`}>
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                    </div>
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estimasi Volume */}
          <div>
            <p className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-brand-primary stroke-[2.5px]" />
              Pilih Estimasi Wadah
            </p>
            <div className="space-y-2">
              {volumes.map(vol => {
                const VolIcon = VOLUME_ICONS[vol.type] || Package;
                const isSelected = selectedVolume === vol.id;
                return (
                  <Card
                    key={vol.id}
                    hoverable
                    onClick={() => handlePickVolume(vol)}
                    padding="sm"
                    className={`flex items-center gap-3 cursor-pointer ${
                      isSelected ? 'border-brand-primary bg-brand-light' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-brand-primary text-white' : 'bg-brand-light text-brand-primary'
                    }`}>
                      <VolIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-bold text-brand-dark">{vol.label}</span>
                      <p className="text-xs text-brand-textSecondary">{vol.sublabel}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-brand-primary" />
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-brand-light" />
            <span className="text-[10px] text-brand-textMuted font-bold uppercase tracking-widest">Atau</span>
            <div className="flex-1 h-px bg-brand-light" />
          </div>

          {/* Manual Input */}
          <div>
            <p className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-brand-primary stroke-[2.5px]" />
              Input Manual (gram)
            </p>
            <input
              type="number"
              inputMode="numeric"
              value={manualInput}
              onChange={(e) => handleManualChange(e.target.value)}
              placeholder="Contoh: 500"
              className="w-full h-14 px-5 bg-[#F9FBF9] border border-brand-light rounded-2xl text-base font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20 placeholder:text-brand-textMuted placeholder:font-normal"
            />
          </div>

          {/* Live Preview */}
          {preview && beratGram > 0 && (
            <Card variant="flat" padding="sm" className="flex items-center gap-3 animate-fade-slide">
              {kategori === 'organik' ? (
                <Leaf className="w-5 h-5 text-sampah-organik shrink-0 stroke-[2.5px] animate-bounce-slow" />
              ) : kategori === 'anorganik' ? (
                <Zap className="w-5 h-5 text-brand-yellow shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-brand-orange shrink-0" />
              )}
              <div className="text-xs text-brand-textSecondary leading-relaxed">
                {kategori === 'organik' ? (
                  /* Custom Organic subcategories live preview */
                  (() => {
                    const organicInfo = getOrganicSimulationFeedback();
                    return (
                      <span>
                        Sampah <strong>{organicInfo?.title || 'organik'}</strong> terpilah ini berpotensi besar untuk diolah secara mandiri di rumah dan mencegah terbentuknya gas metana!
                      </span>
                    );
                  })()
                ) : (
                  <>
                    {preview.kwh > 0 && (
                      <span>Proyeksi Listrik (2027): <strong className="text-brand-dark">{preview.kwh.toFixed(3)} kWh</strong> · </span>
                    )}
                    {preview.co2e > 0 && (
                      <span>CO₂e dicegah: <strong className="text-brand-dark">{preview.co2e.toFixed(3)} kg</strong> · </span>
                    )}
                  </>
                )}
                {preview.analogi && (
                  <span className="text-brand-primary font-semibold block mt-0.5">{preview.analogi}</span>
                )}
                {preview.kwh <= 0 && preview.co2e <= 0 && kategori !== 'organik' && (
                  <span>Sampah residu tidak menghasilkan energi, tapi tetap harus dipilah.</span>
                )}
              </div>
            </Card>
          )}

          <Button onClick={goToStep3} fullWidth size="lg">
            Konfirmasi <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 3: Konfirmasi & Simpan */}
      {step === 3 && (
        <div className="space-y-6">
          <Card className="text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: currentKat?.light }}
            >
              {kategori === 'organik' ? (
                <Leaf className="w-7 h-7" style={{ color: currentKat?.bg }} />
              ) : (
                <Trash2 className="w-7 h-7" style={{ color: currentKat?.bg }} />
              )}
            </div>
            <h2 className="text-lg font-bold text-brand-dark mb-1">{currentKat?.label}</h2>
            <p className="text-3xl font-extrabold text-brand-dark font-display mb-2">
              {beratGram >= 1000 ? `${(beratGram / 1000).toFixed(1)} kg` : `${beratGram} gram`}
            </p>
            {kategori === 'organik' ? (
              /* Custom Composting Preview */
              (() => {
                const organicInfo = getOrganicSimulationFeedback();
                if (!organicInfo) return null;
                return (
                  <div className="mt-3 p-3 bg-brand-light/50 border border-brand-primary/5 rounded-2xl text-left space-y-2 animate-fade-slide">
                    <p className="text-xs font-bold text-brand-primary uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-yellow animate-spin-slow" />
                      Proyeksi Pengolahan: {organicInfo.title}
                    </p>
                    <p className="text-xs text-brand-dark leading-relaxed font-semibold">
                      {organicInfo.desc}
                    </p>
                    <p className="text-[11px] text-brand-textSecondary leading-normal">
                      {organicInfo.potensi}
                    </p>
                    <p className="text-[11px] text-brand-primary leading-normal italic font-semibold">
                      {organicInfo.advice}
                    </p>
                  </div>
                );
              })()
            ) : (
              preview && (
                <div className="space-y-1 text-sm text-brand-textSecondary">
                  {preview.kwh > 0 && (
                    <p>Proyeksi Listrik (2027): <strong className="text-brand-yellow">{preview.kwh.toFixed(3)} kWh</strong></p>
                  )}
                  {preview.co2e > 0 && (
                    <p>CO₂e Dicegah: <strong className="text-brand-primary">{preview.co2e.toFixed(3)} kg</strong></p>
                  )}
                  {preview.analogi && (
                    <p className="text-xs text-brand-primary font-semibold mt-2">{preview.analogi}</p>
                  )}
                </div>
              )
            )}
          </Card>

          <Button onClick={handleSave} fullWidth size="lg" loading={saving}>
            {kategori === 'organik' ? (
              <>
                <Leaf className="w-5 h-5 mr-2" />
                Simpan & Olah Organik
              </>
            ) : (
              <>
                <Lightbulb className="w-5 h-5 mr-2" />
                Simpan & Nyalakan Bohlam
              </>
            )}
          </Button>
        </div>
      )}

      {/* Step 4: Sukses + Edison Bulb */}
      {step === 4 && result && (
        <div className="space-y-6 flex flex-col items-center">
          {kategori === 'organik' ? (
            /* Kompos / Eco-Enzyme Celebration */
            <div className="w-32 h-32 bg-sampah-organikLight rounded-full flex items-center justify-center relative animate-pulse-slow shadow-premium">
              <Leaf className="w-16 h-16 text-sampah-organik stroke-[2.2px] animate-bounce-slow" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-brand-yellow rounded-full flex items-center justify-center animate-spin-slow">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          ) : (
            <EdisonBulb
              active={result.kwh > 0}
              hours={result.kwh > 0 ? result.kwh / 0.008 : 0}
            />
          )}

          {result.co2e > 0 && (
            <Card variant="green" className="text-center w-full">
              <Leaf className="w-6 h-6 text-brand-primary mx-auto mb-2" />
              <p className="text-sm text-brand-dark font-bold">
                Sampah organikmu telah mencegah
              </p>
              <p className="text-2xl font-extrabold text-brand-primary font-display mt-1">
                {result.co2e.toFixed(3)} kg CO₂e
              </p>
              <p className="text-xs text-brand-textSecondary mt-2">
                dari terbuang sia-sia di landfill
              </p>
              <div className="mt-4 pt-3 border-t border-brand-primary/10 text-xs font-bold text-brand-primary flex items-center justify-center gap-1.5">
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Pelajari cara mengolahnya di Beranda!</span>
              </div>
            </Card>
          )}

          {result.kwh <= 0 && result.co2e <= 0 && (
            <Card className="text-center w-full">
              <AlertTriangle className="w-6 h-6 text-brand-orange mx-auto mb-2" />
              <p className="text-sm text-brand-dark font-bold">
                Residu tercatat!
              </p>
              <p className="text-xs text-brand-textSecondary mt-1 leading-relaxed">
                Residu tidak menghasilkan energi atau kompos, namun pemilahan tetap penting
                agar residu dapat diproses secara benar di TPA.
              </p>
            </Card>
          )}

          <div className="flex gap-3 w-full">
            <Button onClick={handleReset} variant="secondary" fullWidth>
              Catat Lagi
            </Button>
            <Button onClick={onBack} fullWidth>
              Kembali
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
