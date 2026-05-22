import React, { useState, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Trash2, Package, ShoppingBag,
  Archive, Scale, Lightbulb, Leaf, AlertTriangle, Zap
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

export function CatatPilah({ onAddLog, onBack }) {
  const [step, setStep] = useState(1);
  const [kategori, setKategori] = useState('');
  const [metode, setMetode] = useState('volume'); // 'volume' | 'manual'
  const [beratGram, setBeratGram] = useState(0);
  const [selectedVolume, setSelectedVolume] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

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
    setStep(3);
    setError('');
  };

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const calc = getLogCalculations(kategori, beratGram);
      const logEntry = await onAddLog(kategori, beratGram, metode);
      setResult({ ...calc, logEntry });
      setStep(4); // Sukses
    } catch (e) {
      setError(e.message || 'Gagal menyimpan log.');
    } finally {
      setSaving(false);
    }
  }, [kategori, beratGram, metode, saving, onAddLog]);

  const handleReset = () => {
    setStep(1);
    setKategori('');
    setBeratGram(0);
    setSelectedVolume('');
    setManualInput('');
    setResult(null);
    setError('');
  };

  const currentKat = KATEGORI_COLORS[kategori];
  const volumes = VOLUME_ESTIMATES[kategori] || [];
  const preview = beratGram > 0 ? getLogCalculations(kategori || 'residu', beratGram) : null;

  return (
    <div className="px-5 pt-6 pb-36 md:pt-12 md:pb-16 max-w-lg md:max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {step < 4 && (
          <button
            onClick={step === 1 ? onBack : () => setStep(step - 1)}
            className="w-10 h-10 bg-brand-light rounded-2xl flex items-center justify-center hover:bg-brand-light/80 transition-all active:scale-95"
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
          <div className="flex items-center gap-3 mb-2">
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
            <Card variant="flat" padding="sm" className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-brand-yellow shrink-0" />
              <div className="text-xs text-brand-textSecondary leading-relaxed">
                {preview.kwh > 0 && (
                  <span>Potensi listrik: <strong className="text-brand-dark">{preview.kwh.toFixed(3)} kWh</strong> · </span>
                )}
                {preview.co2e > 0 && (
                  <span>CO₂e dicegah: <strong className="text-brand-dark">{preview.co2e.toFixed(3)} kg</strong> · </span>
                )}
                {preview.analogi && (
                  <span className="text-brand-primary font-semibold">{preview.analogi}</span>
                )}
                {preview.kwh <= 0 && preview.co2e <= 0 && (
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
              <Trash2 className="w-7 h-7" style={{ color: currentKat?.bg }} />
            </div>
            <h2 className="text-lg font-bold text-brand-dark mb-1">{currentKat?.label}</h2>
            <p className="text-3xl font-extrabold text-brand-dark font-display mb-2">
              {beratGram >= 1000 ? `${(beratGram / 1000).toFixed(1)} kg` : `${beratGram} gram`}
            </p>
            {preview && (
              <div className="space-y-1 text-sm text-brand-textSecondary">
                {preview.kwh > 0 && (
                  <p>Potensi Listrik: <strong className="text-brand-yellow">{preview.kwh.toFixed(3)} kWh</strong></p>
                )}
                {preview.co2e > 0 && (
                  <p>CO₂e Dicegah: <strong className="text-brand-primary">{preview.co2e.toFixed(3)} kg</strong></p>
                )}
                {preview.analogi && (
                  <p className="text-xs text-brand-primary font-semibold mt-2">{preview.analogi}</p>
                )}
              </div>
            )}
          </Card>

          <Button onClick={handleSave} fullWidth size="lg" loading={saving}>
            <Lightbulb className="w-5 h-5 mr-2" />
            Simpan & Nyalakan Bohlam
          </Button>
        </div>
      )}

      {/* Step 4: Sukses + Edison Bulb */}
      {step === 4 && result && (
        <div className="space-y-6 flex flex-col items-center">
          <EdisonBulb
            active={result.kwh > 0}
            hours={result.kwh > 0 ? result.kwh / 0.008 : 0}
          />

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
