"use client";
import React, { useState } from "react";
import { mockSubmission } from "./mockSubmission"; // Adjust path as needed

export default function ReviewScreen() {
  // Load the AI's mock data into React State so the TA can edit it
  const [evaluations, setEvaluations] = useState(mockSubmission.evaluations);
  
  // Calculate the total score dynamically based on TA edits
  const currentTotal = evaluations.reduce((sum, ev) => sum + Number(ev.points_awarded), 0);

  // Handle TA overriding a score
  const handleScoreChange = (index, newScore) => {
    const updated = [...evaluations];
    updated[index].points_awarded = newScore;
    setEvaluations(updated);
  };

  // Handle TA adding notes to the justification
  const handleNoteChange = (index, newText) => {
    const updated = [...evaluations];
    updated[index].justification = newText;
    setEvaluations(updated);
  };

  const handleSave = () => {
    alert(`Saved! Final Score: ${currentTotal}/${mockSubmission.max_score}. (This will send a PUT request to FastAPI later)`);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* LEFT PANEL: The Evidence (PDF/Image Viewer) */}
      <div className="w-1/2 h-full border-r border-gray-200 bg-gray-900 flex flex-col">
        <div className="p-4 bg-gray-800 text-white flex justify-between items-center shadow-md z-10">
          <h2 className="text-lg font-semibold">Student Submission</h2>
          <span className="text-sm text-gray-300">{mockSubmission.student_id}</span>
        </div>
        
        {/* Placeholder for the actual document/crop */}
        <div className="flex-1 p-8 overflow-y-auto flex items-start justify-center">
          <div className="w-full max-w-2xl aspect-[8.5/11] bg-white rounded shadow-2xl p-10 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
             [ Document Image / PDF renders here ]
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: The Editor (AI Data & TA Overrides) */}
      <div className="w-1/2 h-full flex flex-col bg-white">
        
        {/* Header bar with Total Score */}
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
              {currentTotal} <span className="text-lg text-gray-400 font-medium">/ {mockSubmission.max_score}</span>
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Score</p>
          </div>
        </div>

        {/* Scrollable Rubric/Evaluation List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {evaluations.map((ev, index) => (
            <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-md font-bold text-gray-800">Question {ev.question_number}</h3>
                
                {/* Editable Score Input */}
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

              {/* Editable AI Justification */}
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

        {/* Footer Action Bar */}
        <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button className="px-4 py-2 font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            Flag for Review
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Approve & Save Grade
          </button>
        </div>

      </div>
    </div>
  );
}