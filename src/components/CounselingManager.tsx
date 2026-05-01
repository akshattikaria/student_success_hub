import React, { useState, useEffect } from 'react';

interface CounselingRecord {
  id: string;
  date: string;
  advisorName: string;
  notes: string;
}

export const CounselingManager: React.FC<{ studentId: string }> = ({ studentId }) => {
  const [records, setRecords] = useState<CounselingRecord[]>([]);
  const [date, setDate] = useState("");
  const [advisorName, setAdvisorName] = useState("");
  const [notes, setNotes] = useState("");

  const fetchRecords = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/counseling/${studentId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem("edu_auth_token")}` }
      });
      if (res.ok) setRecords(await res.json());
    } catch (err) {
      console.error("Failed to load records", err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/counseling', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("edu_auth_token")}`
        },
        body: JSON.stringify({ studentId, date, advisorName, notes })
      });
      if (!res.ok) throw new Error("Failed to save record");
      
      setDate(""); setAdvisorName(""); setNotes("");
      fetchRecords(); // Refresh list after saving
      alert("Counseling session recorded successfully.");
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div className="p-4 border rounded-md shadow-sm bg-gray-50 mt-4">
      <h4 className="font-semibold text-lg mb-3">Counseling Records</h4>
      
      <div className="mb-4 max-h-40 overflow-y-auto border-b pb-2">
        {records.length === 0 ? <p className="text-sm text-gray-500">No past records.</p> : 
          records.map(r => (
            <div key={r.id} className="mb-2 p-2 bg-white border rounded text-sm">
              <span className="font-bold">{r.date}</span> - {r.advisorName}
              <p className="mt-1 text-gray-700">{r.notes}</p>
            </div>
          ))
        }
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border p-2 rounded w-1/3" required />
          <input type="text" placeholder="Advisor Name" value={advisorName} onChange={e => setAdvisorName(e.target.value)} className="border p-2 rounded flex-1" required />
        </div>
        <textarea placeholder="Session Notes (Max 500 words)..." value={notes} onChange={e => setNotes(e.target.value)} className="border p-2 rounded h-20" required />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-fit">Save Record</button>
      </form>
    </div>
  );
};