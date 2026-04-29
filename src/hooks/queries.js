import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

// --- STUDENTS ---
export const useStudents = () => {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data } = await apiClient.get('/students');
      return data;
    },
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newStudent) => {
      const { data } = await apiClient.post('/students', newStudent);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updateData }) => {
      const { data } = await apiClient.put(`/students/${id}`, updateData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await apiClient.delete(`/students/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useImportExcel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post('/students/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

// --- SCHOOL INFO ---
export const useSchoolInfo = () => {
  return useQuery({
    queryKey: ['schoolInfo'],
    queryFn: async () => {
      const { data } = await apiClient.get('/school-info');
      return data;
    },
  });
};

export const useUpdateSchoolInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updateData) => {
      const { data } = await apiClient.put('/school-info', updateData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schoolInfo'] });
    },
  });
};

// --- REPORTS ---
export const useAllReports = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports');
      return data;
    },
  });
};

export const useReport = (studentId) => {
  return useQuery({
    queryKey: ['report', studentId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/reports/${studentId}`);
      return data;
    },
    enabled: !!studentId, // Only run query if studentId exists
  });
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, updateData }) => {
      const { data } = await apiClient.put(`/reports/${studentId}`, updateData);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report', variables.studentId] });
    },
  });
};

// --- TEMPLATES ---
export const useTemplates = () => {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await apiClient.get('/templates');
      return data;
    },
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newTemplate) => {
      const { data } = await apiClient.post('/templates', newTemplate);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updateData }) => {
      const { data } = await apiClient.put(`/templates/${id}`, updateData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await apiClient.delete(`/templates/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

export const useSeedTemplates = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/templates/seed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

export const useExportTemplates = () => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.get('/templates/export');
      return data;
    },
  });
};

export const useImportTemplates = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ templates, mode }) => {
      const { data } = await apiClient.post('/templates/import', { templates, mode });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

export const useGenerateNarasi = () => {
  return useMutation({
    mutationFn: async ({ category, keywords, studentName, tone }) => {
      const { data } = await apiClient.post('/ai/generate', { category, keywords, studentName, tone });
      return data;
    },
  });
};

export const useGenerateVariations = () => {
  return useMutation({
    mutationFn: async ({ text, category }) => {
      const { data } = await apiClient.post('/ai/variations', { text, category });
      return data;
    },
  });
};

// --- SCHOOL COLLABORATION ---
export const useMySchool = () => {
  return useQuery({
    queryKey: ['mySchool'],
    queryFn: async () => {
      const { data } = await apiClient.get('/schools/my');
      return data;
    },
  });
};

export const useJoinSchool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ npsn, schoolName }) => {
      const { data } = await apiClient.post('/schools/join', { npsn, schoolName });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySchool'] });
      queryClient.invalidateQueries({ queryKey: ['schoolInfo'] });
    },
  });
};

export const useLeaveSchool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete('/schools/leave');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySchool'] });
    },
  });
};

export const useSchoolMembers = (npsn) => {
  return useQuery({
    queryKey: ['schoolMembers', npsn],
    queryFn: async () => {
      const { data } = await apiClient.get(`/schools/${npsn}/members`);
      return data;
    },
    enabled: !!npsn,
  });
};

export const useSchoolProgress = (npsn) => {
  return useQuery({
    queryKey: ['schoolProgress', npsn],
    queryFn: async () => {
      const { data } = await apiClient.get(`/schools/${npsn}/progress`);
      return data;
    },
    enabled: !!npsn,
  });
};
