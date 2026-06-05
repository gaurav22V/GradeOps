"use client";

import { useState } from "react";
import { Plus, Trash2, Upload, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { createExam, uploadSubmission } from "@/lib/api";

export default function InstructorPanel() {
  const [title, setTitle] = useState("");
  const [rubric, setRubric] = useState([
    { question_number: "1", max_points: 10, description: "", keywords: "" }
  ]);
  const [examId, setExamId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const addCriterion = () => {
    setRubric([...rubric, { 
      question_number: (rubric.length + 1).toString(), 
      max_points: 10, 
      description: "", 
      keywords: "" 
    }]);
  };

  const removeCriterion = (index) => {
    setRubric(rubric.filter((_, i) => i !== index));
  };

  const updateCriterion = (index, key, value) => {
    const updated = [...rubric];
    updated[index] = { ...updated[index], [key]: value };
    setRubric(updated);
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      // Uses the clean function from api.js
      const data = await createExam(title, rubric);
      setExamId(data.id);
      setMessage("Rubric deployed successfully! Ready for student submissions.");
    } catch (error) {
      console.error("Failed to create exam", error);
      setMessage("Error deploying rubric configurations. Check backend connection.");
    }
  };

  const handleFileUpload = async (e) => {
    if (!e.target.files || !examId) return;
    setUploading(true);
    setMessage("Uploading files to server processing queue...");

    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        // Uses the clean function from api.js
        await uploadSubmission(examId, formData);
      } catch (error) {
        console.error(`Failed uploading document: ${file.name}`, error);
      }
    }

    setUploading(false);
    setMessage(`Successfully queued ${files.length} submissions for background AI grading.`);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-950 p-8 min-h-screen">
      <div className="mx-auto max-w-4xl space-y-8">
        
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Instructor Config Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Configure evaluation matrices and execute batch evaluation jobs.</p>
        </div>

        {message && (
          <div className="flex items-center gap-3 rounded-lg border border-blue-900 bg-blue-950/40 p-4 text-sm text-blue-400 animate-fadeIn">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <p className="font-medium">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-900 text-xs text-blue-400 font-mono">1</span>
              Configure Target Rubric Evaluation Schema
            </h2>

            <form onSubmit={handleCreateExam} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Exam Identification Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g., CS101 - Midterm Examination (Spring 2026)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-white placeholder-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Rubric Criteria Grading Loops</label>
                
                {rubric.map((criterion, idx) => (
                  <div key={idx} className="flex gap-4 items-start bg-gray-950 p-4 rounded-lg border border-gray-800/60 relative group">
                    <div className="w-16">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Q#</label>
                      <input 
                        type="text"
                        value={criterion.question_number}
                        onChange={(e) => updateCriterion(idx, "question_number", e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-blue-500 text-white"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Grading Standard / Evaluation Criteria</label>
                      <input 
                        type="text"
                        required
                        placeholder="Award full credit if the student outlines the execution stack lifecycle properly..."
                        value={criterion.description}
                        onChange={(e) => updateCriterion(idx, "description", e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-500 text-white"
                      />
                    </div>

                    <div className="w-32">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Keywords</label>
                      <input 
                        type="text"
                        placeholder="stack, lifo"
                        value={criterion.keywords}
                        onChange={(e) => updateCriterion(idx, "keywords", e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-500 text-white"
                      />
                    </div>

                    <div className="w-20">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Max Pts</label>
                      <input 
                        type="number"
                        value={criterion.max_points}
                        onChange={(e) => updateCriterion(idx, "max_points", parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-blue-500 text-white"
                      />
                    </div>

                    {rubric.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeCriterion(idx)}
                        className="mt-6 text-gray-600 hover:text-red-400 p-1 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addCriterion}
                  className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors pt-2"
                >
                  <Plus className="h-4 w-4" /> Add Evaluation Node
                </button>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all active:scale-[0.99]"
              >
                Deploy Grading Schema to Engine
              </button>
            </form>
          </div>

          <div className={`rounded-xl border p-6 transition-all shadow-xl ${examId ? "border-gray-800 bg-gray-900/50" : "border-gray-900 bg-gray-950 opacity-40 pointer-events-none"}`}>
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs text-gray-400 font-mono">2</span>
              Ingest Answer Manifest Documents
            </h2>
            <p className="text-gray-400 text-xs mb-6">Upload scanned scripts or execution answers in bulk. The system processes pages concurrently.</p>

            <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-800 bg-gray-950 p-12 text-center transition-colors hover:border-gray-700">
              <input 
                type="file" 
                multiple
                accept="application/pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 cursor-pointer opacity-0 z-10"
              />
              {uploading ? (
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
              ) : (
                <FileText className="h-10 w-10 text-gray-600 mb-4" />
              )}
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-white">Click or drag student execution files here</p>
                <p className="text-xs text-gray-500">Supports multi-selection PDF formats up to 50MB/file</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}