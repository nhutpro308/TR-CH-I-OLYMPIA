import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Music, Music2, X, Play, RefreshCcw, Shuffle, Plus, Trophy, Shield, Download, Upload, FileText, CheckCircle2, Search, ChevronLeft, ChevronRight, Trash2, Edit2, Save, Loader2, Sun, Moon } from 'lucide-react';
import { supabase } from './lib/supabase';

// --- CẤU HÌNH ÂM THANH ---
const SOUNDS = {
  hover: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  correct: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3',
  applause: 'https://assets.mixkit.co/active_storage/sfx/165/165-preview.mp3',
  bgm: 'https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3'
};

const DEFAULT_CLASSES = ['3A1', '3A2', '3A3', '3B', '4A1', '4A2', '4A3', '4B', '5A1', '5A2', '5A3', '5B'];

const POKEMON_SPRITES: Record<number, string> = {
  1: '25',   // Pikachu
  2: '1',    // Bulbasaur
  3: '4',    // Charmander
  4: '7',    // Squirtle
  5: '133',  // Eevee
  6: '39',   // Jigglypuff
  7: '151',  // Mew
  8: '175',  // Togepi
  9: '393',  // Piplup
  10: '417', // Pachirisu
  11: '700', // Sylveon
  12: '216', // Teddiursa
  13: '300', // Skitty
  14: '492', // Shaymin
  15: '251', // Celebi
};

const getPokemonUrl = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${POKEMON_SPRITES[id] || '25'}.png`;

export default function App() {
  // --- KHỞI TẠO STATE ---
  const [customClasses, setCustomClasses] = useState<string[]>([]);
  const [activeClass, setActiveClass] = useState(DEFAULT_CLASSES[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [ballsOrder, setBallsOrder] = useState<number[]>(Array.from({ length: 15 }, (_, i) => i + 1));
  const [globalTime, setGlobalTime] = useState(10);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // States UI
  const [studentNameInput, setStudentNameInput] = useState('');
  const [timeInput, setTimeInput] = useState('10');
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, onConfirm: (() => void) | null, isAlert?: boolean}>({ isOpen: false, message: '', onConfirm: null, isAlert: false });
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkStudentText, setBulkStudentText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  
  const ITEMS_PER_PAGE = 10;
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  const bgmRef = useRef<HTMLAudioElement>(null);
  const questionFileInputRef = useRef<HTMLInputElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  // --- FETCH DỮ LIỆU TỪ SUPABASE ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch classes
        const { data: classesData } = await supabase.from('classes').select('name');
        if (classesData) {
          const names = classesData.map(c => c.name);
          setCustomClasses(names.filter(n => !DEFAULT_CLASSES.includes(n)));
        }

        // Fetch students
        const { data: studentsData } = await supabase.from('students').select('*');
        if (studentsData) {
          const mappedStudents = studentsData.map(s => ({
            id: s.id,
            name: s.name,
            className: s.class_name,
            score: s.score
          }));
          setStudents(mappedStudents);
        }

        // Fetch questions
        const { data: questionsData } = await supabase.from('questions').select('*').order('id');
        if (questionsData && questionsData.length > 0) {
          setQuestions(questionsData);
        }

        // Fetch settings
        const { data: settingsData } = await supabase.from('app_settings').select('*');
        if (settingsData) {
          const timeSetting = settingsData.find(s => s.key === 'global_time');
          if (timeSetting) {
            setGlobalTime(timeSetting.value);
            setTimeInput(timeSetting.value.toString());
          }
          const classSetting = settingsData.find(s => s.key === 'active_class');
          if (classSetting) setActiveClass(classSetting.value);

          const ballsSetting = settingsData.find(s => s.key === 'balls_order');
          if (ballsSetting) setBallsOrder(ballsSetting.value);

          const themeSetting = settingsData.find(s => s.key === 'theme');
          if (themeSetting) setIsDarkMode(themeSetting.value === 'dark');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- ÂM THANH ---
  const playSound = useCallback((type: keyof typeof SOUNDS) => {
    const audio = new Audio(SOUNDS[type]);
    audio.volume = type === 'hover' ? 0.1 : 0.5;
    audio.play().catch(() => {});
  }, []);

  const toggleMusic = () => {
    if (!bgmRef.current) return;
    if (isMusicPlaying) {
      bgmRef.current.pause();
    } else {
      bgmRef.current.volume = 0.2;
      bgmRef.current.play().catch(() => alert("Thầy hãy click vào màn hình một lần trước khi bật nhạc nhé!"));
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  // --- QUẢN LÝ HỌC SINH ---
  const currentClassStudents = students.filter((s: any) => s.className === activeClass);
  const filteredStudents = currentClassStudents.filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const addStudent = async () => {
    if (!studentNameInput.trim()) return;
    const newStudent = { name: studentNameInput.trim(), class_name: activeClass, score: 0 };
    
    const { data, error } = await supabase.from('students').insert([newStudent]).select();
    if (error) {
      console.error('Error adding student:', error);
      return;
    }

    if (data) {
      const added = { id: data[0].id, name: data[0].name, className: data[0].class_name, score: data[0].score };
      setStudents((prev: any) => [...prev, added]);
      setStudentNameInput('');
      setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const deleteStudent = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      message: `Xóa học sinh "${name}" khỏi danh sách?`,
      onConfirm: async () => {
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) {
          console.error('Error deleting student:', error);
        } else {
          setStudents((prev: any) => prev.filter((s: any) => s.id !== id));
        }
        setConfirmModal({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  const startEditing = (student: any) => {
    setEditingStudentId(student.id);
    setEditNameValue(student.name);
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from('students').update({ name: editNameValue }).eq('id', id);
    if (error) {
      console.error('Error updating student:', error);
    } else {
      setStudents((prev: any) => prev.map((s: any) => s.id === id ? { ...s, name: editNameValue } : s));
    }
    setEditingStudentId(null);
  };

  // --- ĐIỀU KHIỂN GAME ---
  const openQuestion = (id: number) => {
    const q = questions.find((q: any) => q.id === id);
    if (!q || q.is_used) return;
    setActiveQuestionId(id);
    setTimeLeft(globalTime);
    if (currentClassStudents.length > 0) setSelectedStudentId(currentClassStudents[0].id);
  };

  const handleAnswer = async (isCorrect: boolean) => {
    const q = questions.find((q: any) => q.id === activeQuestionId);
    if (!q) return;

    if (isCorrect) {
      playSound('correct');
      if (selectedStudentId) {
        const student = students.find(s => s.id === selectedStudentId);
        const newScore = (student?.score || 0) + q.points;
        const { error } = await supabase.from('students').update({ score: newScore }).eq('id', selectedStudentId);
        if (!error) {
          setStudents((prev: any) => prev.map((s: any) => s.id === selectedStudentId ? { ...s, score: newScore } : s));
        }
      }
    } else {
      playSound('wrong');
    }

    const { error: qError } = await supabase.from('questions').update({ is_used: true }).eq('id', activeQuestionId);
    if (!qError) {
      setQuestions((prev: any) => prev.map((item: any) => item.id === activeQuestionId ? { ...item, is_used: true } : item));
    }
    setActiveQuestionId(null);
  };

  const updateGlobalTime = async () => {
    const newTime = parseInt(timeInput);
    const { error } = await supabase.from('app_settings').upsert({ key: 'global_time', value: newTime });
    if (!error) {
      setGlobalTime(newTime);
      alert('Đã lưu thời gian!');
    }
  };

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await supabase.from('app_settings').upsert({ key: 'theme', value: newMode ? 'dark' : 'light' });
  };

  const resetGame = () => {
    setConfirmModal({
      isOpen: true,
      message: "Làm mới toàn bộ câu hỏi (Vẫn giữ lại điểm học sinh)?",
      onConfirm: async () => {
        const { error } = await supabase.from('questions').update({ is_used: false }).neq('id', 0);
        if (!error) {
          setQuestions((prev: any) => prev.map((q: any) => ({ ...q, is_used: false })));
        }
        setConfirmModal({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  // Phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeQuestionId === null) return;
      const q = questions.find((q: any) => q.id === activeQuestionId);
      if (!q) return;
      if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        if (q.options[index]) handleAnswer(q.options[index].isCorrect);
      }
      if (e.key === 'Escape') setActiveQuestionId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeQuestionId, questions, selectedStudentId, handleAnswer]);

  // Timer logic
  useEffect(() => {
    if (activeQuestionId !== null && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, activeQuestionId]);

  // --- IMPORT / EXPORT ---
  const exportAllData = () => {
    const data = { customClasses, students, questions, globalTime };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Olympia_Data_${activeClass}.json`;
    link.click();
  };

  const handleBulkAdd = async () => {
    const names = bulkStudentText.split('\n').filter(n => n.trim());
    const newStudents = names.map((name) => ({
      name: name.trim(),
      class_name: activeClass,
      score: 0
    }));

    const { data, error } = await supabase.from('students').insert(newStudents).select();
    if (error) {
      console.error('Error bulk adding students:', error);
      return;
    }

    if (data) {
      const added = data.map(s => ({ id: s.id, name: s.name, className: s.class_name, score: s.score }));
      setStudents((prev: any) => [...prev, ...added]);
      setBulkStudentText('');
      setShowBulkImportModal(false);
    }
  };
  return (
    <div className={`min-h-screen p-4 lg:p-8 font-sans flex flex-col lg:flex-row gap-6 transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a] text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      <audio ref={bgmRef} src={SOUNDS.bgm} loop />

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
          <div className={`${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} p-8 rounded-3xl flex flex-col items-center gap-4 shadow-2xl border border-blue-500/30`}>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Đang tải dữ liệu từ Supabase...</p>
          </div>
        </div>
      )}

      {/* CỘT TRÁI: QUẢN LÝ LỚP */}
      <div className={`w-full lg:w-80 flex-shrink-0 rounded-3xl p-5 shadow-xl border-t-8 border-blue-500 flex flex-col ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
        <div className="mb-4">
          <label className={`block text-xs font-black uppercase mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Lớp Đang Dạy</label>
          <div className="flex gap-2">
            <select 
              value={activeClass} 
              onChange={async (e) => {
                const newClass = e.target.value;
                setActiveClass(newClass);
                await supabase.from('app_settings').upsert({ key: 'active_class', value: newClass });
              }}
              className={`flex-1 border-2 rounded-xl px-3 py-2 font-bold focus:outline-none ${isDarkMode ? 'bg-[#334155] border-blue-900/50 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
            >
              <optgroup label="Mặc định">
                {DEFAULT_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              {customClasses.length > 0 && (
                <optgroup label="Tự tạo">
                  {customClasses.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </optgroup>
              )}
            </select>
            <button onClick={async () => {
              const name = prompt("Nhập tên lớp mới:");
              if (name) {
                const { error } = await supabase.from('classes').insert([{ name: name.toUpperCase() }]);
                if (!error) {
                  setCustomClasses((prev: any) => [...prev, name.toUpperCase()]);
                }
              }
            }} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><Plus size={20}/></button>
          </div>
        </div>

        <div className="relative mb-3">
          <input 
            type="text" 
            placeholder="Tìm học sinh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 ring-blue-400 outline-none ${isDarkMode ? 'bg-[#334155] text-white' : 'bg-gray-100 text-gray-800'}`}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4 custom-scrollbar min-h-[300px]">
          {paginatedStudents.map((student: any) => (
            <div key={student.id} className={`group flex justify-between items-center p-2 rounded-xl border transition-all ${isDarkMode ? 'bg-[#334155] border-blue-900/30 hover:border-blue-400' : 'bg-gray-50 border-gray-100 hover:border-blue-300'}`}>
              {editingStudentId === student.id ? (
                <input 
                  autoFocus
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onBlur={() => saveEdit(student.id)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(student.id)}
                  className={`flex-1 border rounded px-2 py-0.5 text-sm ${isDarkMode ? 'bg-[#1e293b] border-blue-500 text-white' : 'bg-white border-blue-300 text-gray-800'}`}
                />
              ) : (
                <div className="flex flex-col">
                   <span className="font-bold text-sm truncate w-32">{student.name}</span>
                   <span className={`text-[10px] font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{student.score} điểm</span>
                </div>
              )}
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEditing(student)} className={`p-1 rounded ${isDarkMode ? 'text-blue-400 hover:bg-blue-900/50' : 'text-blue-600 hover:bg-blue-50'}`}><Edit2 size={14}/></button>
                <button onClick={() => deleteStudent(student.id, student.name)} className={`p-1 rounded ${isDarkMode ? 'text-red-400 hover:bg-red-900/50' : 'text-red-600 hover:bg-red-50'}`}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
          <div ref={listEndRef} />
        </div>

        <div className={`space-y-2 pt-4 border-t ${isDarkMode ? 'border-blue-900/30' : 'border-gray-100'}`}>
          <div className="flex gap-2">
            <input 
              value={studentNameInput}
              onChange={(e) => setStudentNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStudent()}
              placeholder="Tên học sinh mới..."
              className={`flex-1 border rounded-xl px-3 py-2 text-sm ${isDarkMode ? 'bg-[#334155] border-blue-900/30 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
            />
            <button onClick={addStudent} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm">Thêm</button>
          </div>
          <button onClick={() => setShowBulkImportModal(true)} className={`w-full py-2 text-xs font-bold hover:underline flex items-center justify-center gap-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            <FileText size={14}/> Nhập nhanh từ Excel/Word
          </button>
        </div>
      </div>

      {/* CỘT GIỮA: SÂN CHƠI CHÍNH */}
      <div className="flex-1 flex flex-col">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h1 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>ĐƯỜNG LÊN ĐỈNH <span className="text-blue-500">OLYMPIA</span></h1>
          
          <div className={`flex gap-2 p-2 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-[#1e293b] border-blue-900/30' : 'bg-white border-gray-200'}`}>
            <button onClick={toggleTheme} className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-[#334155] text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
            <button onClick={toggleMusic} className={`p-2 rounded-xl transition-colors ${isMusicPlaying ? (isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-blue-600') : (isDarkMode ? 'bg-[#334155] text-gray-400' : 'bg-gray-100 text-gray-400')}`}>
              {isMusicPlaying ? <Music size={20}/> : <Music2 size={20}/>}
            </button>
            <button onClick={() => {
               setConfirmModal({
                 isOpen: true,
                 message: "Trộn ngẫu nhiên vị trí các câu hỏi?",
                 onConfirm: async () => {
                   const newOrder = [...ballsOrder].sort(() => Math.random() - 0.5);
                   setBallsOrder(newOrder);
                   await supabase.from('app_settings').upsert({ key: 'balls_order', value: newOrder });
                   setConfirmModal({ isOpen: false, message: '', onConfirm: null });
                 }
               });
            }} className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-[#334155] text-purple-400 hover:bg-purple-900/50' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}><Shuffle size={20}/></button>
            <button onClick={() => setShowSettings(true)} className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-[#334155] text-teal-400 hover:bg-teal-900/50' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'}`}><Settings size={20}/></button>
            <button onClick={exportAllData} className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-[#334155] text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}><Download size={20}/></button>
          </div>
        </div>

        <div className={`rounded-[2.5rem] p-8 shadow-2xl border-b-[12px] flex-1 flex flex-col items-center justify-start overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-[#1e293b] border-blue-900/50' : 'bg-white border-gray-200'}`}>
          {/* CHẶNG 1 */}
          <div className="w-full mb-12">
            <h2 className={`text-center text-xl font-black mb-6 tracking-widest uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chặng 1: Vượt chướng ngại vật</h2>
            <div className="flex flex-wrap justify-center gap-6">
              {ballsOrder.filter(id => id >= 1 && id <= 7).map((id: number) => {
                const q = questions.find((item: any) => item.id === id);
                return (
                  <div key={id} className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => openQuestion(id)}
                      disabled={q?.is_used}
                      className={`
                        w-20 h-20 md:w-24 md:h-24 rounded-2xl font-black text-2xl transition-all transform hover:scale-110 flex items-center justify-center relative overflow-hidden group
                        ${q?.is_used 
                          ? (isDarkMode ? 'bg-gray-800/50 grayscale opacity-40 border-gray-700' : 'bg-gray-200 grayscale opacity-40 border-gray-300') 
                          : (isDarkMode ? 'bg-[#334155] hover:bg-[#475569] border-blue-400/20' : 'bg-blue-50 hover:bg-blue-100 border-blue-200')}
                        border-2
                      `}
                    >
                      <img 
                        src={getPokemonUrl(id)} 
                        alt="Pokemon" 
                        className="w-full h-full object-contain p-2"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                        {id}
                      </div>
                    </button>
                    <span className={`text-xs font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{q?.points} đ</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHẶNG 2 */}
          <div className="w-full mb-12">
            <h2 className={`text-center text-xl font-black mb-6 tracking-widest uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chặng 2: Tăng tốc</h2>
            <div className="flex flex-wrap justify-center gap-6">
              {ballsOrder.filter(id => id >= 8 && id <= 12).map((id: number) => {
                const q = questions.find((item: any) => item.id === id);
                return (
                  <div key={id} className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => openQuestion(id)}
                      disabled={q?.is_used}
                      className={`
                        w-20 h-20 md:w-24 md:h-24 rounded-2xl font-black text-2xl transition-all transform hover:scale-110 flex items-center justify-center relative overflow-hidden group
                        ${q?.is_used 
                          ? (isDarkMode ? 'bg-gray-800/50 grayscale opacity-40 border-gray-700' : 'bg-gray-200 grayscale opacity-40 border-gray-300') 
                          : (isDarkMode ? 'bg-[#334155] hover:bg-[#475569] border-blue-400/20' : 'bg-blue-50 hover:bg-blue-100 border-blue-200')}
                        border-2
                      `}
                    >
                      <img 
                        src={getPokemonUrl(id)} 
                        alt="Pokemon" 
                        className="w-full h-full object-contain p-2"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                        {id}
                      </div>
                    </button>
                    <span className={`text-xs font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{q?.points} đ</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHẶNG 3 */}
          <div className="w-full">
            <h2 className={`text-center text-xl font-black mb-6 tracking-widest uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chặng 3: Về đích</h2>
            <div className="flex flex-wrap justify-center gap-6">
              {ballsOrder.filter(id => id >= 13 && id <= 15).map((id: number) => {
                const q = questions.find((item: any) => item.id === id);
                return (
                  <div key={id} className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => openQuestion(id)}
                      disabled={q?.is_used}
                      className={`
                        w-20 h-20 md:w-24 md:h-24 rounded-2xl font-black text-2xl transition-all transform hover:scale-110 flex items-center justify-center relative overflow-hidden group
                        ${q?.is_used 
                          ? (isDarkMode ? 'bg-gray-800/50 grayscale opacity-40 border-gray-700' : 'bg-gray-200 grayscale opacity-40 border-gray-300') 
                          : (isDarkMode ? 'bg-[#334155] hover:bg-[#475569] border-blue-400/20' : 'bg-blue-50 hover:bg-blue-100 border-blue-200')}
                        border-2
                      `}
                    >
                      <img 
                        src={getPokemonUrl(id)} 
                        alt="Pokemon" 
                        className="w-full h-full object-contain p-2"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                        {id}
                      </div>
                    </button>
                    <span className={`text-xs font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{q?.points} đ</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: BẢNG VÀNG */}
      <div className="w-full lg:w-64 flex flex-col gap-6">
        <div className={`rounded-3xl p-5 shadow-xl border ${isDarkMode ? 'bg-[#1e293b] border-blue-900/30 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
          <div className={`flex items-center gap-2 mb-4 font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            <Trophy size={20}/> <span>BẢNG VÀNG {activeClass}</span>
          </div>
          <div className="space-y-3">
            {[...currentClassStudents].sort((a,b) => b.score - a.score).slice(0, 5).map((s, i) => (
              <div key={s.id} className={`flex justify-between items-center text-sm border-b pb-2 ${isDarkMode ? 'border-blue-900/30' : 'border-gray-100'}`}>
                <span className="truncate w-32 font-medium opacity-90">{i+1}. {s.name}</span>
                <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{s.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-3xl p-5 shadow-md border ${isDarkMode ? 'bg-[#1e293b] border-blue-900/30' : 'bg-white border-gray-200'}`}>
           <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Thông tin tiết dạy</p>
           <div className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Thời gian: {globalTime} giây</div>
           <div className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Đã dùng: {questions.filter((q: any) => q.is_used).length}/15 câu</div>
           <button 
             onClick={resetGame}
             className="mt-4 w-full py-2 bg-red-900/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-900/40 transition border border-red-900/30"
           >
             Reset Trận Đấu
           </button>
        </div>
      </div>

      {/* MODAL CÂU HỎI */}
      {activeQuestionId && (
        <div className="fixed inset-0 bg-indigo-900/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={`rounded-[3rem] w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300 ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <span className={`px-6 py-2 rounded-full font-black text-xl ${isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-indigo-100 text-indigo-700'}`}>CÂU {activeQuestionId}</span>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black border-4 transition-colors ${timeLeft < 4 ? 'border-red-500 text-red-500 animate-pulse' : (isDarkMode ? 'border-blue-500 text-blue-500' : 'border-indigo-500 text-indigo-500')}`}>
                  {timeLeft}
                </div>
              </div>

              <div className="mb-8">
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 text-center">Đang trả lời</label>
                <select 
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className={`w-full border-2 rounded-2xl px-4 py-3 font-bold text-center text-xl focus:outline-none focus:ring-2 ring-indigo-400 ${isDarkMode ? 'bg-[#334155] border-blue-900/30 text-white' : 'bg-gray-50 border-gray-100 text-gray-800'}`}
                >
                  <option value="">-- Chọn học sinh ghi điểm --</option>
                  {currentClassStudents.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.score}đ)</option>)}
                </select>
              </div>

              <h2 className={`text-2xl md:text-3xl font-bold text-center mb-10 leading-relaxed ${isDarkMode ? 'text-white' : 'text-indigo-900'}`}>
                {questions.find((q: any) => q.id === activeQuestionId).question}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions.find((q: any) => q.id === activeQuestionId).options.map((opt: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt.isCorrect)}
                    className={`p-5 rounded-2xl text-left font-bold text-lg transition-all flex items-center gap-4 group ${isDarkMode ? 'bg-[#334155] hover:bg-blue-600 text-gray-200' : 'bg-indigo-50 hover:bg-indigo-600 hover:text-white text-gray-800'}`}
                  >
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] group-hover:bg-blue-500 text-blue-400 group-hover:text-white' : 'bg-white group-hover:bg-indigo-500 text-indigo-600 group-hover:text-white'}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => setActiveQuestionId(null)}
              className={`w-full py-4 font-bold transition ${isDarkMode ? 'bg-[#334155] text-gray-400 hover:bg-[#475569]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Đóng câu hỏi (Bỏ qua)
            </button>
          </div>
        </div>
      )}

      {/* MODAL CÀI ĐẶT CÂU HỎI */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className={`rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
            <div className={`p-6 text-white flex justify-between items-center ${isDarkMode ? 'bg-blue-900/80' : 'bg-indigo-600'}`}>
              <h2 className="text-2xl font-black">QUẢN TRỊ CÂU HỎI</h2>
              <button onClick={() => setShowSettings(false)}><X/></button>
            </div>
            
            <div className={`p-4 border-b flex flex-wrap gap-4 items-center justify-between ${isDarkMode ? 'bg-[#334155] border-blue-900/30' : 'bg-indigo-50 border-gray-100'}`}>
               <div className="flex items-center gap-2">
                 <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Thời gian (giây):</span>
                 <input 
                  type="number" 
                  value={timeInput} 
                  onChange={(e) => setTimeInput(e.target.value)}
                  className={`w-20 px-3 py-1 rounded-lg border outline-none ${isDarkMode ? 'bg-[#1e293b] border-blue-900/30 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
                 />
                 <button onClick={updateGlobalTime} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">Lưu</button>
               </div>
               
               <div className="flex gap-2">
                  <button onClick={() => questionFileInputRef.current?.click()} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-amber-600 transition flex items-center gap-2">
                    <Upload size={16}/> Nhập file JSON
                  </button>
                  <input type="file" ref={questionFileInputRef} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if(!file) return;
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      try {
                        const data = JSON.parse(event.target?.result as string);
                        let qs = Array.isArray(data) ? data : data.questions;
                        if(qs) {
                          for (const q of qs) {
                            await supabase.from('questions').upsert(q);
                          }
                          setQuestions(qs);
                          alert("Đã cập nhật câu hỏi lên Supabase!");
                        }
                      } catch(e) { alert("Lỗi file!"); }
                    };
                    reader.readAsText(file);
                  }} className="hidden" accept=".json"/>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
               {questions.map((q: any, qIdx: number) => (
                 <div key={q.id} className={`p-6 rounded-2xl border-2 ${isDarkMode ? 'bg-[#334155] border-blue-900/20' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex gap-4 mb-4">
                      <span className={`font-black ${isDarkMode ? 'text-blue-400' : 'text-indigo-600'}`}>#{q.id}</span>
                      <input 
                        value={q.question} 
                        onChange={(e) => {
                          const newQs = [...questions];
                          newQs[qIdx].question = e.target.value;
                          setQuestions(newQs);
                        }}
                        onBlur={async () => {
                          await supabase.from('questions').update({ question: q.question }).eq('id', q.id);
                        }}
                        className={`flex-1 border rounded-xl px-4 py-2 font-bold outline-none ${isDarkMode ? 'bg-[#1e293b] border-blue-900/30 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                       {q.options.map((opt: any, oIdx: number) => (
                         <div key={oIdx} className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              name={`correct-${q.id}`} 
                              checked={opt.isCorrect}
                              onChange={async () => {
                                const newQs = [...questions];
                                newQs[qIdx].options.forEach((o: any, idx: number) => o.isCorrect = (idx === oIdx));
                                setQuestions(newQs);
                                await supabase.from('questions').update({ options: newQs[qIdx].options }).eq('id', q.id);
                              }}
                            />
                            <input 
                              value={opt.text}
                              onChange={(e) => {
                                const newQs = [...questions];
                                newQs[qIdx].options[oIdx].text = e.target.value;
                                setQuestions(newQs);
                              }}
                              onBlur={async () => {
                                await supabase.from('questions').update({ options: q.options }).eq('id', q.id);
                              }}
                              className={`flex-1 px-3 py-1.5 rounded-lg border text-sm ${isDarkMode ? (opt.isCorrect ? 'bg-green-900/20 border-green-500 text-white' : 'bg-[#1e293b] border-blue-900/30 text-white') : (opt.isCorrect ? 'bg-green-50 border-green-300 text-gray-800' : 'bg-white text-gray-800')}`}
                            />
                         </div>
                       ))}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DÁN DANH SÁCH */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
          <div className={`rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border-4 ${isDarkMode ? 'bg-[#1e293b] border-blue-500' : 'bg-white border-indigo-500'}`}>
            <div className={`p-6 text-white ${isDarkMode ? 'bg-blue-900/80' : 'bg-indigo-600'}`}>
              <h3 className="text-xl font-bold flex items-center gap-2"><FileText /> NHẬP NHANH HỌC SINH</h3>
            </div>
            <div className="p-6">
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Copy danh sách tên từ Excel/Word, mỗi tên nằm trên 1 dòng rồi dán vào đây.</p>
              <textarea
                className={`w-full h-64 p-4 border-2 rounded-2xl outline-none font-medium resize-none shadow-inner ${isDarkMode ? 'bg-[#334155] border-blue-900/30 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-indigo-500'}`}
                placeholder="Nguyễn Văn A&#10;Trần Thị B..."
                value={bulkStudentText}
                onChange={(e) => setBulkStudentText(e.target.value)}
              />
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowBulkImportModal(false)} className={`px-6 py-2 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Hủy</button>
                <button onClick={handleBulkAdd} className={`px-8 py-2 rounded-xl font-black shadow-lg ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'}`}>LƯU DANH SÁCH</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className={`rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-b-8 ${isDarkMode ? 'bg-[#1e293b] border-blue-500' : 'bg-white border-amber-500'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-amber-100 text-amber-600'}`}>
               <Shield size={32}/>
            </div>
            <h3 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-indigo-900'}`}>XÁC NHẬN</h3>
            <p className={`mb-8 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{confirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({isOpen: false, message: '', onConfirm: null})} className={`flex-1 py-3 font-bold rounded-2xl transition ${isDarkMode ? 'text-gray-400 hover:bg-[#334155]' : 'text-gray-400 hover:bg-gray-50'}`}>Hủy</button>
              <button onClick={confirmModal.onConfirm || (() => {})} className={`flex-1 py-3 font-black rounded-2xl shadow-lg ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'}`}>Đồng ý</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? '#334155' : '#e2e8f0'}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDarkMode ? '#475569' : '#cbd5e1'}; }
      `}} />
    </div>
  );
}
