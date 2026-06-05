"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchSubmissionById, submitReview } from "@/lib/api"; // Your API Glue
import { Loader2 } from "lucide-react";

export default function ReviewScreen() {
  const params = useParams(); // Gets the [id] from the URL (e.g., /review/123)
  const router = useRouter();
  
  // State for data from FastAPI
  const [submission, setSubmission] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. THE FETCH GLUE: Load data when the page opens
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchSubmissionById(params.id);
        setSubmission(data);
        setEvaluations(data.evaluations || []); 
      } catch (err) {
        console.error("Failed to load submission", err);
        alert("Could not load submission data.");
      } finally {
        setLoading(false);
      }
    };
    
    if (params.id) {
      loadData();
    }
  }, [params.id]);

  // Calculate the total score dynamically based on TA edits
  const currentTotal = evaluations.reduce((sum, ev) => sum + Number(ev.points_awarded), 0);

  const handleScoreChange = (index, newScore) => {
    const updated = [...evaluations];
    updated[index].points_awarded = newScore;
    setEvaluations(updated);
  };

  const handleNoteChange = (index, newText) => {
    const updated = [...evaluations];
    updated[index].justification = newText;
    setEvaluations(updated);
  };

  // 2. THE SUBMIT GLUE: Send the final grade back to FastAPI
  const handleSave = async () => {
    setSaving(true);
    try {
      await submitReview(params.id, currentTotal, "approved");
      alert(`Saved! Final Score: ${currentTotal}. Routing back to dashboard...`);
      router.push("/dashboard"); // Go back to the TA Inbox
    } catch (error) {
      alert("Failed to save grade to database.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Show a loading spinner while waiting for FastAPI
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Fallback if data fails to load
  if (!submission) {
    return <div className="flex h-screen items-center justify-center">Submission not found.</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* LEFT PANEL: The Evidence (PDF/Image Viewer) */}
      <div className="w-1/2 h-full border-r border-gray-200 bg-gray-900 flex flex-col">
        <div className="p-4 bg-gray-800 text-white flex justify-between items-center shadow-md z-10">
          <h2 className="text-lg font-semibold">Student Submission</h2>
          <span className="text-sm text-gray-300">{submission.student_id || "Unknown Student"}</span>
        </div>
        
        <div className="flex-1 p-8 overflow-y-auto flex items-start justify-center">
          {/* Display the actual cropped image if your backend sends it! */}
          {submission.crop_path ? (
             <img src={submission.crop_path} alt="Student answer" className="max-w-full shadow-2xl rounded-lg" />
          ) : (
            <div className="w-full max-w-2xl aspect-[8.5/11] bg-white rounded shadow-2xl p-10 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
               No Image URL provided by backend
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: The Editor (AI Data & TA Overrides) */}
      <div className="w-1/2 h-full flex flex-col bg-white">
        
        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Grade Review</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">AI Graded</span>
              <span className="text-sm text-gray-500">Review and approve scores below</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-indigo-600">
              {currentTotal} <span className="text-lg text-gray-400 font-medium">/ {submission.max_score || "N/A"}</span>
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Score</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {evaluations.map((ev, index) => (
            <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-md font-bold text-gray-800">Question {ev.question_number}</h3>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={ev.points_awarded}
                    onChange={(e) => handleScoreChange(index, e.target.value)}
                    className="w-16 text-center font-bold text-lg border border-gray-300 rounded p-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    max={ev.max_points}
                    min={0}
                  />
                  <span className="text-gray-500 font-medium">/ {ev.max_points} pts</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  AI Justification & TA Notes
                </label>
                <textarea
                  value={ev.justification}
                  onChange={(e) => handleNoteChange(index, e.target.value)}
                  className="w-full text-sm text-gray-700 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                  rows="3"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button className="px-4 py-2 font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            Flag for Review
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 flex items-center gap-2 font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Approve & Save Grade"}
          </button>
        </div>

      </div>
    </div>
  );
}