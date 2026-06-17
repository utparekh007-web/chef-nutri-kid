import React, { useState } from 'react';
import { Recipe } from '../types';
import { ShieldCheck, Zap, Heart, Droplet } from 'lucide-react';

interface HarvardPlateProps {
  recipe: Recipe;
}

type PlateSection = 'fruitsVeggies' | 'wholeGrains' | 'strongProtein' | 'fatsHydrates';

export default function HarvardPlate({ recipe }: HarvardPlateProps) {
  const [activeSection, setActiveSection] = useState<PlateSection>('fruitsVeggies');

  const sections = {
    fruitsVeggies: {
      id: 'fruitsVeggies' as PlateSection,
      name: 'Fruits & Veggies',
      ratio: '50% of Plate 🥬🍎',
      color: 'bg-emerald-500 hover:bg-emerald-600',
      strokeColor: '#10b981',
      strokeHover: '#059669',
      fillColor: 'rgba(16, 185, 129, 0.1)',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      text: recipe.plateBreakdown.fruitsVeggies,
      slogan: 'Loads of Immunity Shields & Eye Power!'
    },
    wholeGrains: {
      id: 'wholeGrains' as PlateSection,
      name: 'Whole Grains',
      ratio: '25% of Plate 🌾🍞',
      color: 'bg-amber-500 hover:bg-amber-600',
      strokeColor: '#f59e0b',
      strokeHover: '#d97706',
      fillColor: 'rgba(245, 158, 11, 0.1)',
      icon: <Zap className="w-5 h-5 text-amber-600" />,
      text: recipe.plateBreakdown.wholeGrains,
      slogan: 'Steady-Energy Rocket Engine Fuel!'
    },
    strongProtein: {
      id: 'strongProtein' as PlateSection,
      name: 'Strong Protein',
      ratio: '25% of Plate 🍗🫘',
      color: 'bg-rose-500 hover:bg-rose-600',
      strokeColor: '#f43f5e',
      strokeHover: '#e11d48',
      fillColor: 'rgba(244, 63, 94, 0.1)',
      icon: <Heart className="w-5 h-5 text-rose-600" />,
      text: recipe.plateBreakdown.strongProtein,
      slogan: 'Muscle Builder Construction Blocks!'
    },
    fatsHydrates: {
      id: 'fatsHydrates' as PlateSection,
      name: 'Fats & Hydration',
      ratio: 'Engine smoothers & healthy sips 💧🥑',
      color: 'bg-sky-500 hover:bg-sky-600',
      strokeColor: '#0ea5e9',
      strokeHover: '#0284c7',
      fillColor: 'rgba(14, 165, 233, 0.1)',
      icon: <Droplet className="w-5 h-5 text-sky-600" />,
      text: recipe.plateBreakdown.fatsHydrates,
      slogan: 'Sparkling water & pure plant oils!'
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-amber-50/20 rounded-3xl p-6 border-4 border-emerald-100 shadow-lg">
      <div className="text-center mb-6">
        <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Harvard Balanced Plate Model
        </span>
        <h3 className="text-xl font-bold text-slate-800 mt-2">
          Interactive Meal Plate Breakdown 🍽️
        </h3>
        <p className="text-slate-500 text-xs sm:text-sm">
          Tap each section of the kids' plate below to discover how Chef Nutri-Kid maps this meal!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Interactive SVG Plate */}
        <div className="md:col-span-6 flex justify-center relative">
          <div className="relative w-64 h-64 md:w-72 md:h-72">
            {/* SVG Canvas for the Plate */}
            <svg 
              viewBox="0 0 200 200" 
              className="w-full h-full drop-shadow-lg filter transform hover:scale-101 transition-transform"
            >
              {/* Outer rim of the plate */}
              <circle cx="100" cy="100" r="95" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="5" />
              <circle cx="100" cy="100" r="80" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />

              {/* 50% Plate: Fruits & Vegetables (Left Half) */}
              <path
                id="plate-veg"
                onClick={() => setActiveSection('fruitsVeggies')}
                className="cursor-pointer transition-all duration-200"
                d="M 100 20 A 80 80 0 0 0 100 180 Z"
                fill={activeSection === 'fruitsVeggies' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.1)'}
                stroke={sections.fruitsVeggies.strokeColor}
                strokeWidth={activeSection === 'fruitsVeggies' ? '4' : '2'}
              />

              {/* 25% Plate: Whole Grains (Top Right Quarter) */}
              <path
                id="plate-grains"
                onClick={() => setActiveSection('wholeGrains')}
                className="cursor-pointer transition-all duration-200"
                d="M 100 20 A 80 80 0 0 1 180 100 L 100 100 Z"
                fill={activeSection === 'wholeGrains' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.1)'}
                stroke={sections.wholeGrains.strokeColor}
                strokeWidth={activeSection === 'wholeGrains' ? '4' : '2'}
              />

              {/* 25% Plate: Proteins (Bottom Right Quarter) */}
              <path
                id="plate-protein"
                onClick={() => setActiveSection('strongProtein')}
                className="cursor-pointer transition-all duration-200"
                d="M 100 100 L 180 100 A 80 80 0 0 1 100 180 Z"
                fill={activeSection === 'strongProtein' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(244, 63, 94, 0.1)'}
                stroke={sections.strongProtein.strokeColor}
                strokeWidth={activeSection === 'strongProtein' ? '4' : '2'}
              />

              {/* Little Water Cup (Extra Glass - Top Right Outer) */}
              <circle
                id="plate-cup"
                onClick={() => setActiveSection('fatsHydrates')}
                cx="165"
                cy="35"
                r="18"
                className="cursor-pointer transition-all duration-200"
                fill={activeSection === 'fatsHydrates' ? 'rgba(14, 165, 233, 0.3)' : 'rgba(14, 165, 233, 0.1)'}
                stroke={sections.fatsHydrates.strokeColor}
                strokeWidth={activeSection === 'fatsHydrates' ? '3' : '1.5'}
              />

              {/* Text markings on the SVG */}
              <text x="50" y="105" fill="#047857" fontSize="9" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                Veggies & Fruits
              </text>
              <text x="50" y="118" fill="#047857" fontSize="7" textAnchor="middle" pointerEvents="none">
                (Half Plate)
              </text>

              <text x="138" y="70" fill="#b45309" fontSize="8" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                Grains
              </text>
              <text x="138" y="80" fill="#b45309" fontSize="6.5" textAnchor="middle" pointerEvents="none">
                (Quarter)
              </text>

              <text x="138" y="135" fill="#be123c" fontSize="8" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                Protein
              </text>
              <text x="138" y="145" fill="#be123c" fontSize="6.5" textAnchor="middle" pointerEvents="none">
                (Quarter)
              </text>

              <text x="165" y="38" fill="#0369a1" fontSize="7" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                SIP
              </text>
            </svg>

            {/* Tap pointers */}
            <div className="absolute top-1/2 left-32 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs flex flex-col items-center">
              <span className="p-1 px-1.5 rounded-sm bg-slate-900/10 backdrop-blur-xs font-bold text-[9px] text-slate-800">TAP ME!</span>
            </div>
          </div>
        </div>

        {/* Detailed Coaching callout */}
        <div className="md:col-span-6 space-y-4">
          {/* Tabs for sections */}
          <div className="flex flex-wrap gap-1 bg-slate-100 rounded-xl p-1">
            {(Object.keys(sections) as Array<keyof typeof sections>).map((key) => {
              const sec = sections[key];
              const isSelected = activeSection === key;
              return (
                <button
                  key={key}
                  id={`tab-plate-${key}`}
                  onClick={() => setActiveSection(key as PlateSection)}
                  type="button"
                  className={`flex-1 min-w-[90px] text-center text-xs py-2 px-1.5 rounded-lg font-bold transition-all ${
                    isSelected
                      ? 'bg-white text-slate-850 shadow-xs'
                      : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  {sec.name}
                </button>
              );
            })}
          </div>

          {/* Active section Detail Card */}
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm transition-all duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl text-white ${sections[activeSection].color}`}>
                {sections[activeSection].icon}
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">
                  {sections[activeSection].ratio}
                </span>
                <h4 className="text-lg font-bold text-slate-800 leading-tight">
                  {sections[activeSection].name}
                </h4>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-emerald-600 italic mb-3">
              "{sections[activeSection].slogan}"
            </p>

            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line p-3 bg-slate-50 rounded-xl border border-slate-100">
              {sections[activeSection].text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
