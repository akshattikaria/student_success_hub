import React, { useState } from 'react';

interface InterventionProps {
  studentId: string;
}

export const InterventionManager: React.FC<InterventionProps> = ({ studentId }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [testInterventionId, setTestInterventionId] = useState(""); // Just for testing the status update

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/interventions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("edu_auth_token")}`
        },
        body: JSON.stringify({ studentId, name, description }),
      });
      if (!res.ok) throw new Error("Failed to create intervention");
      const data = await res.json();
      alert(`Created! ID: ${data.id} (Status: ${data.status})`);
      setTestInterventionId(data.id);
      setName(""); setDescription("");
    } catch (error) {
      alert(error);
    }
  };

  const handleComplete = async () => {
    if (!testInterventionId) return alert("Create an intervention first to get an ID.");
    try {
      const res = await fetch(`http://localhost:5000/api/interventions/${testInterventionId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("edu_auth_token")}`
        },
        body: JSON.stringify({ status: 'Completed' }),
      });
      
      if (!res.ok) {
        if (res.status === 422) alert("422 Error: Cannot change a Completed intervention!");
        else alert("Failed to update status");
        return;
      }
      alert("Successfully marked as Completed!");
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div className="p-4 border rounded-md shadow-sm bg-white mt-4">
      <h4 className="font-semibold text-lg mb-3 text-blue-800">Intervention Manager (Test Panel)</h4>
      
      <form onSubmit={handleCreate} className="flex flex-col gap-3 mb-4">
        <input 
          type="text" placeholder="Intervention Name (e.g., Academic Tutoring)" 
          value={name} onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded" required
        />
        <textarea 
          placeholder="Description / Notes" 
          value={description} onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-fit">
          Create 'Active' Intervention
        </button>
      </form>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-2">Test State Machine (Exp 10 Requirement):</p>
        <button 
          onClick={handleComplete} 
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
        >
          Mark Current as 'Completed'
        </button>
        <p className="text-xs text-gray-500 mt-2">
          *Clicking this twice should trigger the 422 HTTP error to pass the White-Box test.
        </p>
      </div>
    </div>
  );
};