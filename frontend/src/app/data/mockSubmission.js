export const mockSubmission = {
  id: "sub_12345",
  student_id: "John Doe (ID: 9876)",
  status: "graded",
  total_score: 18,
  max_score: 20,
  crop_path: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", // Placeholder for actual crop
  evaluations: [
    {
      question_number: "1",
      max_points: 10,
      points_awarded: 10,
      justification: "Student correctly identified the primary formula and showed all work leading to the correct answer."
    },
    {
      question_number: "2",
      max_points: 10,
      points_awarded: 8,
      justification: "Correct final answer, but missed one intermediate step in the derivation. Deducted 2 points."
    }
  ]
};