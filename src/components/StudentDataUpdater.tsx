import React, { useState } from 'react';
import { updateStudentAttendance, addStudentAssessment } from '@/lib/dataStore';

interface UpdaterProps {
  studentId: string;
  onUpdateSuccess: () => void; // A function to trigger a data refresh after saving
}

export const StudentDataUpdater: React.FC<UpdaterProps> = ({ studentId, onUpdateSuccess }) => {
  const [attendance, setAttendance] = useState("");
  const [subject, setSubject] = useState("");
  const [marks, setMarks] = useState("");
  const [grade, setGrade] = useState("");

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStudentAttendance(studentId, Number(attendance));
      setAttendance("");
      onUpdateSuccess(); 
    } catch (error) {
      console.error(error);
      alert("Error updating attendance.");
    }
  };

  const handleAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addStudentAssessment(studentId, subject, Number(marks), grade);
      setSubject(""); setMarks(""); setGrade("");
      onUpdateSuccess(); 
    } catch (error) {
      console.error(error);
      alert("Error adding assessment.");
    }
  };

  return (
    <div className="p-4 border rounded-md shadow-sm bg-gray-50 mt-4">
      <h4 className="font-semibold text-lg mb-3">Update Records</h4>
      
      {/* Attendance Form */}
      <form onSubmit={handleAttendanceSubmit} className="flex gap-3 mb-4 items-center">
        <input 
          type="number" 
          placeholder="New Attendance %" 
          value={attendance} 
          onChange={(e) => setAttendance(e.target.value)}
          className="border p-2 rounded w-40"
          required
          min="0"
          max="100"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
          Update Attendance
        </button>
      </form>

      {/* Assessment Form */}
      <form onSubmit={handleAssessmentSubmit} className="flex gap-3 items-center">
        <input 
          type="text" 
          placeholder="Subject" 
          value={subject} 
          onChange={(e) => setSubject(e.target.value)}
          className="border p-2 rounded flex-1"
          required
        />
        <input 
          type="number" 
          placeholder="Marks" 
          value={marks} 
          onChange={(e) => setMarks(e.target.value)}
          className="border p-2 rounded w-24"
          required
        />
        <input 
          type="text" 
          placeholder="Grade (e.g. A)" 
          value={grade} 
          onChange={(e) => setGrade(e.target.value)}
          className="border p-2 rounded w-32"
          required
        />
        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors">
          Add Assessment
        </button>
      </form>
    </div>
  );
};