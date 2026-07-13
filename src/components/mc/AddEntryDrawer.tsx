'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface AddEntryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'education' | 'experience' | 'achievements';
  onAdd: (data: any) => void;
}

export function AddEntryDrawer({ isOpen, onClose, type, onAdd }: AddEntryDrawerProps) {
  // Education form state
  const [edu, setEdu] = useState({
    degree: '',
    institution: '',
    duration: '',
    description: '',
  });

  // Experience form state
  const [exp, setExp] = useState({
    role: '',
    company: '',
    duration: '',
    description: '',
    tech_stack: '',
    metrics: '',
  });

  // Achievements form state
  const [ach, setAch] = useState({
    title: '',
    date: '',
    description: '',
  });

  // Clear states when closed or type changes
  useEffect(() => {
    if (!isOpen) return;
    setEdu({ degree: '', institution: '', duration: '', description: '' });
    setExp({ role: '', company: '', duration: '', description: '', tech_stack: '', metrics: '' });
    setAch({ title: '', date: '', description: '' });
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'education') {
      if (!edu.degree.trim() || !edu.institution.trim()) return;
      onAdd({
        id: `edu-${Date.now()}`,
        degree: edu.degree,
        institution: edu.institution,
        duration: edu.duration || '2026',
        description: edu.description,
        is_visible: true,
      });
    } else if (type === 'experience') {
      if (!exp.role.trim() || !exp.company.trim()) return;
      onAdd({
        id: `exp-${Date.now()}`,
        role: exp.role,
        company: exp.company,
        duration: exp.duration || '2026',
        description: exp.description,
        tech_stack: exp.tech_stack ? exp.tech_stack.split(',').map(s => s.trim()).filter(Boolean) : [],
        metrics: exp.metrics ? exp.metrics.split('\n').map(s => s.trim()).filter(Boolean) : [],
        is_visible: true,
      });
    } else if (type === 'achievements') {
      if (!ach.title.trim()) return;
      onAdd({
        id: `ach-${Date.now()}`,
        title: ach.title,
        date: ach.date || '2026',
        description: ach.description,
        is_visible: true,
      });
    }
    onClose();
  };

  const getTitle = () => {
    switch (type) {
      case 'education': return 'Add Education';
      case 'experience': return 'Add Experience';
      case 'achievements': return 'Add Achievement';
      default: return 'New Entry';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-zinc-950 border-l border-zinc-850 z-50 shadow-2xl flex flex-col justify-between animate-[slideIn_0.2s_ease-out] font-sans">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-850 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{getTitle()}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Fill in the fields below to create a new database record.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {type === 'education' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Degree / Program</label>
                <input 
                  type="text" 
                  value={edu.degree}
                  onChange={e => setEdu({ ...edu, degree: e.target.value })}
                  placeholder="Master of Science in Computer Science" 
                  required
                  className="w-full cms-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Institution</label>
                <input 
                  type="text" 
                  value={edu.institution}
                  onChange={e => setEdu({ ...edu, institution: e.target.value })}
                  placeholder="BMS Institute of Technology & Management" 
                  required
                  className="w-full cms-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Duration (Timeline)</label>
                <input 
                  type="text" 
                  value={edu.duration}
                  onChange={e => setEdu({ ...edu, duration: e.target.value })}
                  placeholder="2024 - 2026" 
                  className="w-full cms-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Description</label>
                <textarea 
                  value={edu.description}
                  onChange={e => setEdu({ ...edu, description: e.target.value })}
                  placeholder="Briefly describe focus areas, research, or course highlights..." 
                  rows={4}
                  className="w-full cms-input resize-none"
                />
              </div>
            </>
          )}

          {type === 'experience' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Role Title</label>
                <input 
                  type="text" 
                  value={exp.role}
                  onChange={e => setExp({ ...exp, role: e.target.value })}
                  placeholder="Senior Software Architect" 
                  required
                  className="w-full cms-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Company Name</label>
                <input 
                  type="text" 
                  value={exp.company}
                  onChange={e => setExp({ ...exp, company: e.target.value })}
                  placeholder="Stellar Cloud Systems" 
                  required
                  className="w-full cms-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Duration</label>
                <input 
                  type="text" 
                  value={exp.duration}
                  onChange={e => setExp({ ...exp, duration: e.target.value })}
                  placeholder="2023 - Present" 
                  className="w-full cms-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Description</label>
                <textarea 
                  value={exp.description}
                  onChange={e => setExp({ ...exp, description: e.target.value })}
                  placeholder="Core responsibilities and team role..." 
                  rows={3}
                  className="w-full cms-input resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Tech Stack (comma-separated)</label>
                <input 
                  type="text" 
                  value={exp.tech_stack}
                  onChange={e => setExp({ ...exp, tech_stack: e.target.value })}
                  placeholder="Next.js, TypeScript, Docker, WebGL" 
                  className="w-full cms-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Milestones & Metrics (one per line)</label>
                <textarea 
                  value={exp.metrics}
                  onChange={e => setExp({ ...exp, metrics: e.target.value })}
                  placeholder="Reduced latency by 42% using custom WebGL clusters.&#13;Managed 6 engineers." 
                  rows={4}
                  className="w-full cms-input resize-none"
                />
              </div>
            </>
          )}

          {type === 'achievements' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Title</label>
                <input 
                  type="text" 
                  value={ach.title}
                  onChange={e => setAch({ ...ach, title: e.target.value })}
                  placeholder="Supabase Hackathon Winner" 
                  required
                  className="w-full cms-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Date</label>
                <input 
                  type="text" 
                  value={ach.date}
                  onChange={e => setAch({ ...ach, date: e.target.value })}
                  placeholder="2024" 
                  className="w-full cms-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Description</label>
                <textarea 
                  value={ach.description}
                  onChange={e => setAch({ ...ach, description: e.target.value })}
                  placeholder="Brief summary of achievement or award..." 
                  rows={4}
                  className="w-full cms-input resize-none"
                />
              </div>
            </>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-zinc-850 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-white hover:bg-zinc-200 text-zinc-950 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add to list
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
