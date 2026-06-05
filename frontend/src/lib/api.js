import axios from 'axios';

// This baseURL automatically switches between localhost and your Render URL 
// based on the environment variable set in Vercel.
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
});

// Helper to get token (Standardized to 'gradeops_token')
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('gradeops_token') : null;
  if (!token) throw new Error("No token found. Please log in.");
  return { 'Authorization': `Bearer ${token}` };
};

// 1. LOGIN GLUE
export const loginUser = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  // Using api (Axios) instead of fetch for consistency
  const response = await api.post('/api/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  if (typeof window !== "undefined") {
    localStorage.setItem("gradeops_token", response.data.access_token);
  }
  
  return response.data;
};

// 2. SIGNUP GLUE
export const signupUser = async (email, password, role) => {
  const response = await api.post('/api/auth/signup', { email, password, role });
  return response.data;
};

// 3. FETCH PENDING REVIEWS
export const fetchPendingReviews = async () => {
  const response = await api.get('/api/dashboard/pending', { 
    headers: getAuthHeaders() 
  });
  return response.data;
};

// 4. FETCH SINGLE SUBMISSION
export const fetchSubmissionById = async (id) => {
  const response = await api.get(`/api/submissions/${id}`, { 
    headers: getAuthHeaders() 
  });
  return response.data;
};

// 5. SUBMIT REVIEW
export const submitReview = async (recordId, finalScore, status) => {
  const response = await api.put(`/api/reviews/${recordId}`, {
    final_score: finalScore,
    status: status
  }, { 
    headers: getAuthHeaders() 
  });
  return response.data;
};

// 6. CREATE EXAM
export const createExam = async (title, rubric) => {
  const response = await api.post('/api/exams/', { title, rubric }, { 
    headers: getAuthHeaders() 
  });
  return response.data;
};

// 7. UPLOAD SUBMISSIONS
export const uploadSubmission = async (examId, formData) => {
  const response = await api.post(`/api/exams/${examId}/submissions/`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};