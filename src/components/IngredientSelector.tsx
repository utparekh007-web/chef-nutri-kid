import React, { useState, useRef, useEffect } from 'react';
import { PRESET_INGREDIENTS, FoodItem, COMMON_INGREDIENTS_DB } from '../types';
import { Plus, Trash2, ShoppingBasket, Search, Sparkles, RefreshCw, Globe, Camera } from 'lucide-react';

interface IngredientSelectorProps {
  selectedItems: string[];
  onChangeSelected: (items: string[]) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export default function IngredientSelector({
  selectedItems,
  onChangeSelected,
  onGenerate,
  isLoading,
  diet
}: IngredientSelectorProps & { diet: string }) {
  const [customInput, setCustomInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const getExcludedItems = (currentDiet: string) => {
    const nonVeg = ["Chicken Breast", "Salmon", "Beef", "Pork", "Tuna", "Turkey"];
    const eggs = ["Eggs"];
    const dairyAndHoney = ["Greek Yogurt", "ymlk", "Cheese", "Milk", "Honey"];
    const roots = ["Carrots", "Garlic", "Ginger", "Onion", "Potatoes", "Sweet Potato"];

    let excluded: string[] = [];
    if (currentDiet === 'Vegetarian') {
      excluded = [...nonVeg, ...eggs];
    } else if (currentDiet === 'Vegan') {
      excluded = [...nonVeg, ...eggs, ...dairyAndHoney];
    } else if (currentDiet === 'Eggetarian') {
      excluded = [...nonVeg];
    } else if (currentDiet === 'Jain') {
      excluded = [...nonVeg, ...eggs, ...roots];
    }
    return excluded;
  };

  useEffect(() => {
    const excluded = getExcludedItems(diet);
    const hasExcluded = selectedItems.some(item => excluded.includes(item));
    if (hasExcluded) {
      onChangeSelected(selectedItems.filter(item => !excluded.includes(item)));
    }
  }, [diet, selectedItems, onChangeSelected]);

  const excludedList = getExcludedItems(diet);

  // Group presets
  const categories = {
    fruitsVeggies: {
      title: 'Vegetables & Fruits 🥬🍎',
      desc: 'Fill half your plate! Built for strong immunity shield & bright vision power!',
      items: PRESET_INGREDIENTS.filter(i => i.category === 'fruitsVeggies' && !excludedList.includes(i.name)),
      badgeColor: 'bg-emerald-500 text-white'
    },
    wholeGrains: {
      title: 'Whole Grains 🌾🍞',
      desc: 'Quarter of your plate! Steady-energy engine chargers for non-stop play!',
      items: PRESET_INGREDIENTS.filter(i => i.category === 'wholeGrains' && !excludedList.includes(i.name)),
      badgeColor: 'bg-amber-500 text-white'
    },
    strongProtein: {
      title: 'Healthy Protein 🍗🫘',
      desc: 'Quarter of your plate! Essential muscle builders to make you strong and active!',
      items: PRESET_INGREDIENTS.filter(i => i.category === 'strongProtein' && !excludedList.includes(i.name)),
      badgeColor: 'bg-rose-500 text-white'
    },
    fatsHydrates: {
      title: 'Fats & Hydration 🥑💧',
      desc: 'Super engine smoothers & pure sparkling water for brain lubrication!',
      items: PRESET_INGREDIENTS.filter(i => i.category === 'fatsHydrates' && !excludedList.includes(i.name)),
      badgeColor: 'bg-sky-500 text-white'
    }
  };

  const LANGUAGES = ["English", "Español", "Français", "Deutsch", "Italiano", "Português", "Hindi"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSuggestions = COMMON_INGREDIENTS_DB.filter(
    item => item.toLowerCase().includes(customInput.toLowerCase()) && !selectedItems.includes(item) && !excludedList.includes(item)
  )
  .sort((a, b) => {
    // Exact match or starts with gets higher priority
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    const inputLower = customInput.toLowerCase();
    const aStarts = aLower.startsWith(inputLower);
    const bStarts = bLower.startsWith(inputLower);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.localeCompare(b);
  })
  .slice(0, 10);

  const handleToggleItem = (name: string) => {
    if (selectedItems.includes(name)) {
      onChangeSelected(selectedItems.filter(item => item !== name));
    } else {
      onChangeSelected([...selectedItems, name]);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInput.trim();
    if (!clean) return;

    if (!selectedItems.includes(clean) && !excludedList.includes(clean)) {
      onChangeSelected([...selectedItems, clean]);
    }
    setCustomInput('');
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (item: string) => {
    if (!selectedItems.includes(item) && !excludedList.includes(item)) {
      onChangeSelected([...selectedItems, item]);
    }
    setCustomInput('');
    setShowSuggestions(false);
  };

  const handleEmptyFridge = () => {
    const staples = ['Broccoli', 'Carrots', 'Brown Rice', 'Chicken Breast', 'Eggs', 'Olive Oil', 'Fresh Water'];
    const filteredStaples = staples.filter(item => !excludedList.includes(item));
    onChangeSelected(filteredStaples);
  };

  const handleClearAll = () => {
    onChangeSelected([]);
    setCustomInput('');
  };

  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScanImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) fileInputRef.current.value = '';

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64StringWithScheme = event.target?.result as string;
      const match = base64StringWithScheme.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (!match) {
        alert("Invalid image format.");
        return;
      }
      const mimeType = match[1];
      const imageBase64 = match[2];

      setIsScanning(true);
      try {
        const response = await fetch('/api/scan-ingredients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, mimeType })
        });
        
        if (!response.ok) {
           let errMessage = 'Failed to scan image.';
           try { const errData = await response.json(); if(errData.error) errMessage = errData.error; } catch(e) {}
           throw new Error(errMessage);
        }

        const data = await response.json();
        if (data.ingredients && Array.isArray(data.ingredients)) {
           const newItems = data.ingredients.filter((item: string) => !selectedItems.includes(item) && !excludedList.includes(item));
           if (newItems.length > 0) {
              onChangeSelected([...selectedItems, ...newItems]);
           } else {
              alert("No new or allowed ingredients found from the picture!");
           }
        }
      } catch (err: any) {
        alert(err.message || 'Failed to scan image.');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border-4 border-yellow-200 transition-all">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        onChange={handleScanImage} 
        className="hidden" 
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 id="pantry-title" className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span role="img" aria-label="fridge">🧺</span> Nutri-Kid's Magic Fridge & Pantry
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Tap some yummy foods below to toggle them in your basket, or text search!
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            disabled={isScanning}
            className="px-4 py-2 text-sm font-semibold rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Scan items with camera"
          >
            <Camera className="w-4 h-4" /> {isScanning ? 'Scanning...' : 'Scan'}
          </button>
          <button
            id="btn-empty-fridge"
            onClick={handleEmptyFridge}
            type="button"
            className="px-4 py-2 text-sm font-semibold rounded-2xl bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200 flex items-center gap-1.5 transition-all"
            title="Load the fridge with common, healthy staple foods immediately!"
          >
            <RefreshCw className="w-4 h-4" /> Staples
          </button>
          
          {selectedItems.length > 0 && (
            <button
              id="btn-clear-pantry"
              onClick={handleClearAll}
              type="button"
              className="px-4 py-2 text-sm font-semibold rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Active Basket Preview */}
      <div className="mb-8 p-5 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border-2 border-dashed border-yellow-300">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-yellow-400 rounded-lg text-slate-900">
            <ShoppingBasket className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-800 text-lg">My Active Kitchen Basket ({selectedItems.length})</span>
        </div>

        {selectedItems.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-amber-700/70 text-sm font-medium">Your kitchen basket is empty! 🫙</p>
            <p className="text-xs text-slate-400 mt-1">Tap foods below, search or click "Staples" to fill it up!</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((item) => {
              const preset = PRESET_INGREDIENTS.find(p => p.name === item);
              return (
                <div
                  key={item}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border shadow-xs animate-fade-in ${
                    preset ? preset.color : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                >
                  <span>{preset ? preset.emoji : '🥣'}</span>
                  <span>{item}</span>
                  <button
                    onClick={() => handleToggleItem(item)}
                    type="button"
                    className="hover:bg-black/10 rounded-full p-0.5 ml-1 text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Item Adder with Autocomplete */}
      <div className="mb-8 relative" ref={wrapperRef}>
        <form onSubmit={handleAddCustom} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input
              id="input-custom-ingredient"
              type="text"
              placeholder="Search or type ingredients (e.g. apple, oats...)"
              value={customInput}
              onChange={(e) => {
                setCustomInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-slate-700 font-medium placeholder-slate-400 focus:outline-hidden focus:border-yellow-400 focus:bg-white transition-all text-sm sm:text-base"
            />
          </div>
          <button
            id="btn-add-ingredient"
            type="submit"
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-1 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" /> <span className="hidden sm:inline">Add</span>
          </button>
        </form>
        {showSuggestions && customInput && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-xl overflow-y-auto max-h-60">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="w-full text-left px-4 py-3 text-slate-700 font-medium hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Predefined Food Categories */}
      <div className="space-y-6">
        {(Object.keys(categories) as Array<keyof typeof categories>).map((catName) => {
          const cat = categories[catName];
          return (
            <div key={catName} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] tracking-wider uppercase font-extrabold px-1.5 py-0.5 rounded-sm ${cat.badgeColor}`}>
                  {catName === 'fruitsVeggies' ? '50% Plate' : catName === 'fatsHydrates' ? 'Smooth & Hydrate' : '25% Plate'}
                </span>
                <h3 className="font-bold text-slate-700 text-md">{cat.title}</h3>
              </div>
              <p className="text-slate-400 italic text-xs mb-3">{cat.desc}</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {cat.items.map((item) => {
                  const isSelected = selectedItems.includes(item.name);
                  return (
                    <button
                      key={item.id}
                      id={`btn-toggle-${item.id}`}
                      type="button"
                      onClick={() => handleToggleItem(item.name)}
                      className={`flex items-center justify-between p-3 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-slate-800 bg-slate-900 text-white shadow-md scale-102 ring-2 ring-yellow-300'
                          : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.emoji}</span>
                        <span className="font-bold text-xs sm:text-sm">{item.name}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'bg-yellow-400 border-yellow-500' : 'border-slate-300'
                      }`}>
                        {isSelected && <span className="text-[10px] text-slate-950 font-extrabold">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      <div className="mt-8 text-center">
        <button
          id="btn-generate-recipe"
          onClick={onGenerate}
          disabled={isLoading || selectedItems.length === 0}
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-extrabold text-white text-lg rounded-3xl shadow-xl hover:shadow-2xl disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none disabled:cursor-not-allowed transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2 mx-auto"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
          {isLoading ? 'Mixing Chef Magic...' : 'Create Chef Nutri-Kid\'s Magic Recipe! 🪄'}
        </button>
        {selectedItems.length === 0 && (
          <p className="text-rose-500 text-xs mt-2 font-medium">Add at least one food or staple to start cooking! 🥦</p>
        )}
      </div>
    </div>
  );
}
