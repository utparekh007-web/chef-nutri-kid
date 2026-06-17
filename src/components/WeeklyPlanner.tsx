import React, { useState } from 'react';
import { Calendar, ShoppingCart, Info, Sparkles, ChevronDown, CheckCircle2, ShieldAlert, Download } from 'lucide-react';
import { WeeklyChart, AgeGroup } from '../types';
import { downloadAsPDF } from '../utils';

interface WeeklyPlannerProps {
  language: string;
  diet: string;
  childProfile?: any;
}

const AGE_GROUPS: AgeGroup[] = ['1-3 years (Toddler)', '4-5 years (Preschooler)', '6-12 years (School Age)'];

export default function WeeklyPlanner({ language, diet, childProfile }: WeeklyPlannerProps) {
  const [ageGroup, setAgeGroup] = useState<string>(AGE_GROUPS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [weeklyChart, setWeeklyChart] = useState<WeeklyChart | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setWeeklyChart(null);
    try {
      const response = await fetch('/api/weekly-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ageGroup, language, diet, childProfile })
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error('API server not found! Please ensure your backend functions are deployed and GEMINI_API_KEY is configured in your hosting environment.');
        let errMessage = 'Failed to generate weekly chart.';
        try { const errData = await response.json(); if(errData.error) errMessage = errData.error; } catch(e) {}
        throw new Error(errMessage);
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setWeeklyChart(data);
    } catch (err: any) {
      setError(err.message || 'Error creating professional chart.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="print:hidden bg-white rounded-3xl p-6 md:p-8 shadow-sm border-2 border-indigo-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
             <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
               <Calendar className="w-6 h-6 text-indigo-500" /> Professional Weekly Meal Planner
             </h2>
             <p className="text-sm text-slate-500 mt-2 max-w-xl font-medium">
               Generate a dietitian-approved, full 7-day meal chart with breakfast, lunch, dinner, and snacks specially formulated for your child's developmental age.
             </p>
          </div>
          
          <div className="flex flex-col gap-3 w-full md:w-auto">
            {childProfile ? (
              <div className="bg-indigo-50 border-2 border-indigo-100 text-indigo-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center">
                <span className="truncate">Active Profile: {childProfile.name}</span>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full md:w-64 appearance-none bg-indigo-50 border-2 border-indigo-100 text-indigo-900 font-bold py-3 pl-4 pr-10 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                >
                  {AGE_GROUPS.map(ag => (
                    <option key={ag} value={ag}>{ag}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none w-5 h-5" />
              </div>
            )}
            
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? <Sparkles className="animate-spin w-5 h-5"/> : <Calendar className="w-5 h-5"/>}
              {isLoading ? 'Consulting Dietitian...' : 'Create Weekly Chart'}
            </button>
          </div>
        </div>

        {error && (
            <div className="mt-4 p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5"/>
                <span className="font-semibold text-sm">{error}</span>
            </div>
        )}
      </div>

      {weeklyChart && (
        <div id="weekly-plan-pdf-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-4 sm:p-6 rounded-3xl">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-slate-100">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                 <h3 className="text-xl font-black text-slate-800 uppercase">
                   {childProfile 
                     ? `${childProfile.name} (${childProfile.age} Year Old) Meal Report` 
                     : weeklyChart.title}
                 </h3>
                 <button 
                   onClick={() => downloadAsPDF('weekly-plan-pdf-container', 'weekly-meal-plan.pdf')} 
                   className="print:hidden text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors"
                 >
                   <Download className="w-4 h-4" /> Download PDF
                 </button>
               </div>
               
               <div className="space-y-6 print:space-y-2">
                 {weeklyChart.days.map((day, idx) => (
                   <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                     <div className="bg-indigo-100/50 px-4 py-2 border-b border-indigo-100">
                       <h4 className="font-black text-indigo-900 uppercase tracking-widest text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 block"></span> {day.day}
                       </h4>
                     </div>
                     <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                         <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Breakfast</span>
                         <p className="text-sm font-semibold text-slate-700 mt-0.5">{day.breakfast}</p>
                       </div>
                       <div>
                         <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lunch</span>
                         <p className="text-sm font-semibold text-slate-700 mt-0.5">{day.lunch}</p>
                       </div>
                       <div>
                         <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dinner</span>
                         <p className="text-sm font-semibold text-slate-700 mt-0.5">{day.dinner}</p>
                       </div>
                       <div>
                         <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Snacks</span>
                         <p className="text-sm font-semibold text-slate-700 mt-0.5">{day.snacks}</p>
                       </div>
                       <div className="sm:col-span-2 bg-emerald-50 rounded-xl p-3 mt-2 border border-emerald-100">
                         <span className="text-[10px] uppercase font-bold text-emerald-600 block mb-1 tracking-wider">Nutrition Fact</span>
                         <p className="text-xs font-medium text-emerald-800">{day.powerFact}</p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
          
          <div className="lg:col-span-4 space-y-6">
             {/* Master Tips */}
             <div className="bg-amber-50 rounded-3xl p-6 border-2 border-amber-200 shadow-sm">
               <h4 className="font-black text-amber-900 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Info className="w-5 h-5 text-amber-500"/> Dietitian Tips
               </h4>
               <ul className="space-y-3">
                 {weeklyChart.tips.map((tip, i) => (
                   <li key={i} className="flex gap-2 items-start text-sm font-medium text-amber-800">
                     <CheckCircle2 className="w-5 h-5 mt-0.5 text-amber-500 shrink-0"/> {tip}
                   </li>
                 ))}
               </ul>
             </div>

             {/* Shopping List */}
             <div className="bg-white rounded-3xl p-6 border-2 border-emerald-100 shadow-sm">
               <h4 className="font-black text-emerald-800 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                 <ShoppingCart className="w-5 h-5 text-emerald-500"/> Groceries
               </h4>
               <ul className="space-y-2">
                 {weeklyChart.shoppingList.map((item, i) => (
                   <li key={i} className="text-sm font-semibold text-slate-600 flex items-center gap-2 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                     <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span> {item}
                   </li>
                 ))}
               </ul>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
