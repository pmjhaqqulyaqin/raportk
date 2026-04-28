import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

// Configure LocalForage to use IndexedDB
localforage.config({
  name: 'CetakRaportTK',
  storeName: 'raport_data'
});

// Custom storage wrapper for Zustand to work with LocalForage (async)
const storage = {
  getItem: async (name) => {
    const value = await localforage.getItem(name);
    return value ?? null;
  },
  setItem: async (name, value) => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name) => {
    await localforage.removeItem(name);
  },
};

const initialStudents = [
  { id: 1, name: 'Adi Putra', height: 95, weight: 13, phase: 'Fondasi', group: 'A', gender: 'L' },
  { id: 2, name: 'Budi Santoso', height: 98, weight: 15, phase: 'Fondasi', group: 'A', gender: 'L' },
  { id: 3, name: 'Citra Kirana', height: 92, weight: 12, phase: 'Fondasi', group: 'A', gender: 'P' },
];

const initialSchoolInfo = {
  schoolName: 'TK Mutiara Bangsa',
  principal: 'Hj. Ratna Sari, M.Pd',
  principalNip: '19750910 199903 2 001',
  teacher: 'Dra. Siti Aminah',
  teacherNip: '19820512 201001 2 005',
  academicYear: '2025/2026',
  semester: 'Gasal',
  date: '20 Juni 2025',
  location: 'Jakarta'
};

const defaultTemplates = {
  'Agama': [
    { id: 1, name: 'Sangat Baik', text: '[nama] menunjukkan perkembangan yang sangat baik dalam mengenal nilai-nilai agamanya. Ia sudah mampu membedakan perilaku baik dan buruk secara sederhana. Dalam kegiatan berdoa bersama, [nama] tampak khidmat dan mampu mengikuti gerakan salat dengan mandiri.' },
    { id: 2, name: 'Mulai Berkembang', text: '[nama] mulai menunjukkan ketertarikan dalam kegiatan keagamaan. Dengan bimbingan guru, ia bersedia ikut berdoa sebelum dan sesudah kegiatan.' }
  ],
  'Jati Diri': [
    { id: 3, name: 'Mandiri & Percaya Diri', text: '[nama] memiliki rasa percaya diri yang tinggi saat tampil di depan kelas. Ia mampu mengekspresikan emosi dengan cara yang positif dan menunjukkan sikap kemandirian.' },
    { id: 4, name: 'Mulai Beradaptasi', text: '[nama] perlahan mulai menunjukkan kemandiriannya di lingkungan sekolah. Ia mulai berani bermain bersama teman sebayanya.' }
  ],
  'Literasi': [
    { id: 5, name: 'Sangat Tertarik', text: 'Kemampuan literasi [nama] berkembang pesat. Ia sangat tertarik mendengarkan cerita dan mampu menceritakan kembali isi buku bergambar dengan bahasanya sendiri.' }
  ],
  'P5': [
    { id: 6, name: 'Aktif & Gotong Royong', text: 'Dalam aktivitas P5, [nama] menunjukkan partisipasi aktif dan mampu bekerjasama dengan baik bersama teman-teman kelompoknya.' }
  ]
};

const useStore = create(
  persist(
    (set, get) => ({
      students: initialStudents,
      schoolInfo: initialSchoolInfo,
      templates: defaultTemplates,
      reports: {}, // Keyed by studentId

      // STUDENT ACTIONS
      addStudent: (student) => set((state) => ({
        students: [...state.students, { ...student, id: Date.now() }]
      })),
      
      updateStudent: (id, updatedData) => set((state) => ({
        students: state.students.map(s => s.id === parseInt(id) ? { ...s, ...updatedData } : s)
      })),

      deleteStudent: (id) => set((state) => {
        const newReports = { ...state.reports };
        delete newReports[id];
        return {
          students: state.students.filter(s => s.id !== parseInt(id)),
          reports: newReports
        };
      }),

      // SCHOOL INFO ACTIONS
      updateSchoolInfo: (info) => set((state) => ({
        schoolInfo: { ...state.schoolInfo, ...info }
      })),

      // REPORT ACTIONS
      updateReport: (studentId, section, data) => set((state) => {
        const id = parseInt(studentId);
        const studentReport = state.reports[id] || {
          Agama: '',
          'Jati Diri': '',
          Literasi: '',
          P5: '',
          attendance: { sick: 0, permission: 0, unexcused: 0 },
          parentReflection: ''
        };

        return {
          reports: {
            ...state.reports,
            [id]: {
              ...studentReport,
              [section]: typeof data === 'object' ? { ...studentReport[section], ...data } : data
            }
          }
        };
      }),
      
      getReport: (studentId) => {
        const state = get();
        return state.reports[parseInt(studentId)] || {
          Agama: '',
          'Jati Diri': '',
          Literasi: '',
          P5: '',
          attendance: { sick: 0, permission: 0, unexcused: 0 },
          parentReflection: ''
        };
      }
    }),
    {
      name: 'raport-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);

export default useStore;
