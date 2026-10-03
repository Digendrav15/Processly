import React from 'react';
import { Workflow, Target, Plus, ArrowRight, DollarSign, CheckCircle } from 'lucide-react';

export function LeadPipelinePage() {
  const stages = [
    {
      name: '1. New Inquiries',
      count: 4,
      color: 'border-blue-500',
      deals: [
        { id: 'LD-991', client: 'Godrej Properties', value: '₹ 15,00,000', rep: 'Priya V.' },
        { id: 'LD-992', client: 'DLF Cybercity', value: '₹ 8,50,000', rep: 'Aarav S.' },
      ]
    },
    {
      name: '2. Qualification & Demo',
      count: 3,
      color: 'border-purple-500',
      deals: [
        { id: 'LD-985', client: 'Sobha Developers', value: '₹ 22,00,000', rep: 'Karan J.' },
      ]
    },
    {
      name: '3. Proposal Sent',
      count: 2,
      color: 'border-amber-500',
      deals: [
        { id: 'LD-974', client: 'Prestige Group', value: '₹ 45,00,000', rep: 'Sneha K.' },
      ]
    },
    {
      name: '4. Converted to Order',
      count: 5,
      color: 'border-emerald-500',
      deals: [
        { id: 'LD-960', client: 'Shapoorji Pallonji', value: '₹ 68,00,000', rep: 'Vikram P.' },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 font-extrabold text-[10px] tracking-wider uppercase border border-violet-200 dark:border-violet-800/80">
            Pipeline
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            Lead Qualification & Order Pipeline
          </h1>
        </div>
        <button
          onClick={() => {}}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Lead to Pipeline</span>
        </button>
      </div>

      {/* Kanban Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {stages.map((stg, i) => (
          <div key={i} className={`bg-white dark:bg-slate-900 rounded-2xl border-t-4 ${stg.color} border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3`}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">{stg.name}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {stg.count}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {stg.deals.map((deal) => (
                <div key={deal.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-violet-500">{deal.id}</span>
                    <span className="text-[10px] text-slate-400">Rep: {deal.rep}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">{deal.client}</h4>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[10px]">Deal Value</span>
                    <span className="font-extrabold text-violet-600 dark:text-violet-400">{deal.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
