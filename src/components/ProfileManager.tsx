import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, X, Activity, Trash2, Lock, Baby, Scale, AlertCircle, Calendar } from 'lucide-react';
import { ChildProfile, DietaryPreference } from '../types';
import { freemium } from '../freemium';

interface ProfileManagerProps {
  profiles: ChildProfile[];
  setProfiles: React.Dispatch<React.SetStateAction<ChildProfile[]>>;
  activeProfileId: string | null;
  setActiveProfileId: React.Dispatch<React.SetStateAction<string | null>>;
  onClose: () => void;
  onGenerateReport: (profile: ChildProfile) => void;
  isPremium: boolean;
}

// ── Auto calculate age from DOB ──
function calcAge(dob: string): { years: number; months: number; days: number; display: string } {
  if (!dob) return { years: 0, months: 0, days: 0, display: 'Unknown' };
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  if (days < 0) { months--; const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0); days += prevMonth.getDate(); }
  if (months < 0) { years--; months += 12; }
  let display = '';
  if (years > 0) display += `${years} year${years !== 1 ? 's' : ''} `;
  if (months > 0) display += `${months} month${months !== 1 ? 's' : ''} `;
  if (days > 0 || (!years && !months)) display += `${days} day${days !== 1 ? 's' : ''}`;
  return { years, months, days, display: display.trim() };
}

// ── Max children by plan ──
function getMaxChildren(isPremium: boolean): number {
  const plan = freemium.getPlanType();
  if (!isPremium) return 0;
  if (plan === 'premium') return 10;
  if (plan === 'family') return 3;
  return 1; // starter
}

function getPlanName(): string {
  const plan = freemium.getPlanType();
  if (plan === 'family') return 'Family';
  if (plan === 'premium') return 'Premium';
  return 'Starter';
}

export default function ProfileManager({ profiles, setProfiles, activeProfileId, setActiveProfileId, onClose, onGenerateReport, isPremium }: ProfileManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [newDiet, setNewDiet] = useState<DietaryPreference>('Any / No Restriction');
  const [newAllergies, setNewAllergies] = useState('');
  const [allergyList, setAllergyList] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [liveAges, setLiveAges] = useState<Record<string, ReturnType<typeof calcAge>>>({});

  const maxChildren = getMaxChildren(isPremium);
  const planName = getPlanName();

  // Recalculate ages every day
  useEffect(() => {
    const calc = () => {
      const ages: Record<string, ReturnType<typeof calcAge>> = {};
      profiles.forEach(p => { if (p.dob) ages[p.id] = calcAge(p.dob); });
      setLiveAges(ages);
    };
    calc();
    const timer = setInterval(calc, 86400000); // daily
    return () => clearInterval(timer);
  }, [profiles]);

  const resetForm = () => {
    setNewName(''); setNewDob(''); setNewWeight(''); setNewDiet('Any / No Restriction');
    setNewAllergies(''); setAllergyList([]); setEditId(null); setError('');
  };

  const openAdd = () => {
    if (profiles.length >= maxChildren) {
      setError(`Your ${planName} plan allows only ${maxChildren} child profile${maxChildren > 1 ? 's' : ''}. ${planName === 'Starter' ? 'Upgrade to Family plan for up to 3 children!' : ''}`);
      return;
    }
    resetForm(); setIsAdding(true);
  };

  const openEdit = (p: ChildProfile) => {
    // Only allow editing weight, diet, allergies — NOT name or DOB
    setEditId(p.id);
    setNewName(p.name); // display only
    setNewDob(p.dob);   // display only
    setNewWeight(String(p.weight));
    setNewDiet(p.foodCategories);
    setAllergyList(p.allergies || []);
    setIsAdding(true);
  };

  const handleSave = () => {
    setError('');
    if (!editId) {
      // New profile
      if (!newName.trim()) { setError('Please enter child name.'); return; }
      if (!newDob) { setError('Please enter date of birth.'); return; }
      const today = new Date(); const birth = new Date(newDob);
      if (birth > today) { setError('Date of birth cannot be in the future!'); return; }
      if (profiles.length >= maxChildren) { setError(`Only ${maxChildren} child allowed on ${planName} plan.`); return; }
      const ageData = calcAge(newDob);
      const profile: ChildProfile = {
        id: Date.now().toString(),
        name: newName.trim(),
        dob: newDob,
        age: ageData.years,
        ageMonths: ageData.months,
        ageDays: ageData.days,
        ageDisplay: ageData.display,
        weight: parseFloat(newWeight) || 0,
        foodCategories: newDiet,
        allergies: allergyList,
        createdAt: new Date().toISOString(),
        isLocked: true, // lock name and DOB after creation
      };
      setProfiles([...profiles, profile]);
      setActiveProfileId(profile.id);
    } else {
      // Edit — only weight, diet, allergies
      setProfiles(profiles.map(p => p.id === editId ? {
        ...p,
        weight: parseFloat(newWeight) || p.weight,
        foodCategories: newDiet,
        allergies: allergyList,
      } : p));
    }
    setIsAdding(false); resetForm();
  };

  const removeProfile = (id: string) => {
    setProfiles(profiles.filter(p => p.id !== id));
    if (activeProfileId === id) setActiveProfileId(null);
  };

  const addAllergy = () => {
    if (newAllergies.trim() && !allergyList.includes(newAllergies.trim())) {
      setAllergyList([...allergyList, newAllergies.trim()]);
      setNewAllergies('');
    }
  };

  // Max date = today for DOB
  const maxDate = new Date().toISOString().split('T')[0];
  // Min date = 12 years ago
  const minDate = new Date(new Date().setFullYear(new Date().getFullYear() - 12)).toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-start justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm pt-8">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-amber-200 w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-2xl flex items-center justify-center text-xl">👶</div>
            <div>
              <h2 className="text-lg font-black text-slate-800">NutriPeds Profiles</h2>
              <p className="text-xs text-slate-400 font-semibold">{planName} Plan · {profiles.length}/{maxChildren} child{maxChildren !== 1 ? 'ren' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-400"/></button>
        </div>

        <div className="p-5">

          {/* Plan limit banner */}
          {planName === 'Starter' && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
              <span className="text-xl">🌱</span>
              <div>
                <p className="text-xs font-black text-amber-800">Starter Plan — 1 Child Only</p>
                <p className="text-xs text-amber-600">Upgrade to Family plan for up to 3 children 👨‍👩‍👧</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0"/>
              <p className="text-xs font-bold text-red-600">{error}</p>
            </div>
          )}

          {/* Profiles list */}
          {!isAdding && (
            <>
              {profiles.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">👶</div>
                  <p className="text-slate-500 font-semibold text-sm">No child profiles yet</p>
                  <p className="text-slate-400 text-xs mt-1">Add your child to get personalized meal plans!</p>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {profiles.map(p => {
                    const ageInfo = liveAges[p.id] || calcAge(p.dob);
                    return (
                      <div
                        key={p.id}
                        onClick={() => { setActiveProfileId(p.id); }}
                        className={`rounded-2xl p-4 border-2 cursor-pointer transition-all ${activeProfileId === p.id ? 'border-teal-400 bg-teal-50' : 'border-slate-100 hover:border-teal-200'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full flex items-center justify-center text-lg font-black text-white">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-slate-800 text-sm">{p.name}</p>
                                {p.isLocked && <Lock className="w-3 h-3 text-slate-400"/>}
                              </div>
                              {/* Live auto-calculated age */}
                              <p className="text-xs font-bold text-[#FF6B6B]">
                                📅 {ageInfo.display}
                              </p>
                              <p className="text-xs text-slate-400">
                                DOB: {p.dob ? new Date(p.dob).toLocaleDateString('en-IN') : 'N/A'} · {p.weight}kg · {p.foodCategories}
                              </p>
                              {p.allergies?.length > 0 && (
                                <p className="text-xs text-red-400 mt-0.5">⚠️ {p.allergies.join(', ')}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 items-end">
                            {activeProfileId === p.id && isPremium && (
                              <button onClick={e => { e.stopPropagation(); onGenerateReport(p); }}
                                className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors border border-indigo-200">
                                <Activity className="w-3 h-3"/> Report
                              </button>
                            )}
                            <button onClick={e => { e.stopPropagation(); openEdit(p); }}
                              className="bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-200">
                              ✏️ Edit
                            </button>
                            <button onClick={e => { e.stopPropagation(); removeProfile(p.id); }}
                              className="bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-xl text-xs font-bold border border-red-100">
                              🗑️
                            </button>
                          </div>
                        </div>
                        {activeProfileId === p.id && (
                          <div className="mt-2 pt-2 border-t border-teal-100">
                            <span className="text-xs font-black text-teal-600 bg-teal-100 px-2 py-1 rounded-full">✅ Active Profile</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add button */}
              {profiles.length < maxChildren ? (
                <button onClick={openAdd}
                  className="w-full py-3 border-2 border-dashed border-teal-300 rounded-2xl text-teal-600 font-black text-sm hover:bg-teal-50 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4"/> Add Child Profile
                </button>
              ) : (
                <div className="text-center py-3 bg-slate-50 rounded-2xl">
                  <p className="text-xs text-slate-500 font-semibold">
                    {planName === 'Starter' ? '🌱 Upgrade to Family plan to add more children' :
                     planName === 'Family' ? '👨‍👩‍👧 Family plan allows up to 3 children' :
                     '⭐ Maximum children added'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Add/Edit Form */}
          {isAdding && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-black text-slate-800 text-base">
                  {editId ? '✏️ Edit Child Details' : '➕ Add New Child'}
                </h3>
              </div>

              {/* Name — locked after creation */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                  Child's Name {editId && <span className="text-amber-500">🔒 Cannot change</span>}
                </label>
                <div className={`flex items-center gap-2 p-3 rounded-xl border-2 ${editId ? 'bg-slate-50 border-slate-200' : 'border-slate-200 bg-white'}`}>
                  <Baby className="w-4 h-4 text-slate-400"/>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => !editId && setNewName(e.target.value)}
                    readOnly={!!editId}
                    placeholder="e.g. Arjun"
                    className={`flex-1 text-sm font-bold outline-none bg-transparent ${editId ? 'text-slate-400 cursor-not-allowed' : 'text-slate-800'}`}
                  />
                  {editId && <Lock className="w-3.5 h-3.5 text-slate-300"/>}
                </div>
                {editId && <p className="text-xs text-amber-600 mt-1 font-semibold">🔒 Child name is locked after creation for data integrity.</p>}
              </div>

              {/* DOB — locked after creation */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                  Date of Birth {editId && <span className="text-amber-500">🔒 Cannot change</span>}
                </label>
                <div className={`flex items-center gap-2 p-3 rounded-xl border-2 ${editId ? 'bg-slate-50 border-slate-200' : 'border-slate-200 bg-white'}`}>
                  <Calendar className="w-4 h-4 text-slate-400"/>
                  <input
                    type="date"
                    value={newDob}
                    onChange={e => !editId && setNewDob(e.target.value)}
                    readOnly={!!editId}
                    min={minDate}
                    max={maxDate}
                    className={`flex-1 text-sm font-bold outline-none bg-transparent ${editId ? 'text-slate-400 cursor-not-allowed' : 'text-slate-800'}`}
                  />
                  {editId && <Lock className="w-3.5 h-3.5 text-slate-300"/>}
                </div>
                {newDob && !editId && (
                  <p className="text-xs text-teal-600 mt-1 font-bold">
                    📅 Age: {calcAge(newDob).display}
                  </p>
                )}
                {editId && newDob && (
                  <p className="text-xs text-teal-600 mt-1 font-bold">
                    📅 Current Age: {calcAge(newDob).display}
                  </p>
                )}
              </div>

              {/* Weight */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">Weight (kg)</label>
                <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-slate-200 bg-white">
                  <Scale className="w-4 h-4 text-slate-400"/>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={e => setNewWeight(e.target.value)}
                    placeholder="e.g. 15"
                    min="1" max="80" step="0.1"
                    className="flex-1 text-sm font-bold outline-none bg-transparent text-slate-800"
                  />
                  <span className="text-xs text-slate-400 font-semibold">kg</span>
                </div>
              </div>

              {/* Diet */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">Dietary Preference</label>
                <select
                  value={newDiet}
                  onChange={e => setNewDiet(e.target.value as DietaryPreference)}
                  className="w-full p-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 outline-none bg-white"
                >
                  {['Any / No Restriction','Vegetarian','Non-Vegetarian','Vegan','Eggetarian','Jain'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Allergies */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">Food Allergies / Restrictions</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newAllergies}
                    onChange={e => setNewAllergies(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addAllergy()}
                    placeholder="e.g. Peanuts, Dairy..."
                    className="flex-1 p-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold outline-none"
                  />
                  <button onClick={addAllergy} className="px-3 py-2.5 bg-red-100 text-red-600 rounded-xl font-black text-sm hover:bg-red-200">
                    + Add
                  </button>
                </div>
                {allergyList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {allergyList.map(a => (
                      <span key={a} className="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        ⚠️ {a}
                        <button onClick={() => setAllergyList(allergyList.filter(x => x !== a))} className="hover:text-red-800">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="text-xs text-red-500 font-bold bg-red-50 p-2.5 rounded-xl">{error}</p>}

              <div className="flex gap-2 pt-2">
                <button onClick={handleSave}
                  className="flex-1 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#ff5252] text-white rounded-2xl font-black text-sm hover:opacity-90 transition-opacity">
                  {editId ? '💾 Save Changes' : '✅ Add Child Profile'}
                </button>
                <button onClick={() => { setIsAdding(false); resetForm(); }}
                  className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200">
                  Cancel
                </button>
              </div>

              {!editId && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl font-semibold">
                  ⚠️ Note: Child name and date of birth cannot be changed after saving. Please enter correctly.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
