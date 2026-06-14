"use client";

import { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import { fetchPendingReviews, submitReview } from '@/lib/api';

export default function TADashboard() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [overrideScore, setOverrideScore] = useState("");

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await fetchPendingReviews();
      setQueue(data || []);
    } catch (error) {
      console.error("Failed to fetch queue", error);
    }
    setLoading(false);
  };

  const handleAction = async (action) => {
    if (queue.length === 0) return;
    
    setSubmitting(true);
    const currentRecord = queue[0];
    
    try {
      const finalScore = action === 'override' ? parseFloat(overrideScore) : currentRecord.ai_score;
      await submitReview(currentRecord.id, finalScore, action === 'override' ? 'overridden' : 'approved');

      // Move to next item in the queue
      setQueue(prev => prev.slice(1));
      setOverrideScore("");
    } catch (error) {
      console.error(`Failed to ${action} review`, error);
      alert("Failed to update status. Please try again.");
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-gray-950 text-white">
      <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
    </div>
  );

  if (queue.length === 0) return (
    <div className="flex flex-col h-screen items-center justify-center bg-gray-950 text-white">
      <Check className="w-16 h-16 text-emerald-500 mb-4" />
      <h1 className="text-2xl font-bold">Inbox Zero</h1>
      <p className="text-gray-400">All AI grades have been reviewed. Great job.</p>
    </div>
  );

  const current = queue[0];
  const getImageUrl = (url) => {
    if (!url) return "https://placehold.co/600x400/111/444?text=Student+Handwriting+Crop";
    if (url.startsWith('http')) return url;
    
    const filename = url.split(/[\\/]/).pop(); 
    
    return `http://localhost:8000/crops/${filename}`;
  };

  const imageUrl = getImageUrl(current.file_url || current.submission?.file_url);

  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-100 font-sans overflow-hidden">
      
      {/* Left Pane: Student's Answer Sheet Image */}
      <div className="w-1/2 h-screen overflow-hidden border-r border-gray-800 flex flex-col">
        <div className="shrink-0 p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">Student Submission</h2>
          <span className="px-2 py-1 bg-blue-900/50 text-blue-400 text-xs rounded">Queue: {queue.length} remaining</span>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-gray-950 flex items-center justify-center">
          <img src={imageUrl} alt="Student Answer" className="max-h-full max-w-full rounded-lg border border-gray-800 shadow-2xl" />
        </div>
      </div>

      {/* Right Pane: AI Analysis */}
      <div className="w-1/2 h-screen overflow-hidden flex flex-col bg-gray-900/30">
        <div className="shrink-0 p-4 bg-gray-900 border-b border-gray-800">
          <h2 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">GradeOps AI Analysis</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {current.plagiarism_flag && (
            <div className="flex items-center gap-3 p-4 bg-red-950/40 border border-red-900 rounded-lg text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-bold text-sm">Plagiarism Flag Triggered</p>
                <p className="text-xs opacity-80">This logic structure matches another submission.</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-end border-b border-gray-800 pb-4">
            <div>
              <p className="text-gray-500 text-sm">Proposed Final Score</p>
              <h1 className="text-5xl font-black text-white">{current.ai_score} <span className="text-xl text-gray-600">pts</span></h1>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400">RUBRIC BREAKDOWN</h3>
            {current.ai_justification?.map((evalItem, idx) => (
              <div key={idx} className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm text-blue-400">Q{evalItem.question_number}</span>
                  <span className="font-bold">{evalItem.points_awarded} / {evalItem.max_points}</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{evalItem.justification}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Bar */}
        <div className="shrink-0 p-6 bg-gray-950 border-t border-gray-800 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg p-1 pr-2">
            <input 
              type="number" 
              placeholder="Override Score..." 
              value={overrideScore}
              onChange={(e) => setOverrideScore(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-white placeholder-gray-600 w-full px-3"
            />
            <button 
              onClick={() => handleAction('override')}
              disabled={submitting || !overrideScore}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded font-medium disabled:opacity-50 transition-colors"
            >
              <X className="w-4 h-4" /> Apply
            </button>
          </div>

          <button 
            onClick={() => handleAction('approve')}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50 transition-all active:scale-95"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            Approve AI Grade
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
        </div>
      </div>
    </div>
  );
}