const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// login function
export const loginUser = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });

  if (!response.ok) throw new Error("Invalid credentials");
  
  const data = await response.json();
  
  const base64Url = data.access_token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const payload = JSON.parse(window.atob(base64));

  return { token: data.access_token, role: payload.role, email: payload.sub };
};

export const fetchPendingReviews = async () => {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/pending`, {
    headers: getHeaders(),
  });
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return response.json();
};

// Signup function
export const signupUser = async (email, password, role) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, role }), 
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to create account");
  }

  return data;
};

export const fetchSubmissionById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/submissions/${id}`, { 
    headers: getHeaders() 
  });
  if (!response.ok) throw new Error("Failed to fetch submission");
  return response.json();
};

export const submitReview = async (recordId, finalScore, status) => {
  const response = await fetch(`${API_BASE_URL}/api/reviews/${recordId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({
      final_score: parseFloat(finalScore),
      status: status.toLowerCase()
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Backend validation error:", errorData);
    throw new Error("Failed to submit review");
  }
  
  return response.json();
};

export const createExam = async (title, rubric) => {
  const response = await fetch(`${API_BASE_URL}/api/exams/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, rubric }),
  });
  return response.json();
};

export const uploadSubmission = async (examId, formData) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/api/exams/${examId}/submissions/`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: formData,
  });
  
  return response.json();
};