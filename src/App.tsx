import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Music, Music2, X, Play, RefreshCcw, Shuffle, Plus, Trophy, Shield, Download, Upload, FileText, CheckCircle2, Search, ChevronLeft, ChevronRight, Trash2, Edit2, Save } from 'lucide-react';

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

const generateDefaultQuestions = () => {
  const questions = [];
  // Chặng 1: 1-7, 10đ
  for (let i = 1; i <= 7; i++) {
    questions.push({
      id: i,
      question: `Câu hỏi số ${i}: Nội dung câu hỏi Chặng 1...`,
      options: [
        { text: 'Đáp án A', isCorrect: true },
        { text: 'Đáp án B', isCorrect: false },
        { text: 'Đáp án C', isCorrect: false },
        { text: 'Đáp án D', isCorrect: false },
      ],
      isUsed: false,
      points: 10,
      section: 'CHẶNG 1: VƯỢT CHƯỚNG NGẠI VẬT'
    });
  }
  // Chặng 2: 8-12, 20đ
  for (let i = 8; i <= 12; i++) {
    questions.push({
      id: i,
      question: `Câu hỏi số ${i}: Nội dung câu hỏi Chặng 2...`,
      options: [
        { text: 'Đáp án A', isCorrect: true },
        { text: 'Đáp án B', isCorrect: false },
        { text: 'Đáp án C', isCorrect: false },
        { text: 'Đáp án D', isCorrect: false },
      ],
      isUsed: false,
      points: 20,
      section: 'CHẶNG 2: TĂNG TỐC'
    });
  }
  // Chặng 3: 13-15, 30đ
  for (let i = 13; i <= 15; i++) {
    questions.push({
      id: i,
      question: `Câu hỏi số ${i}: Nội dung câu hỏi Chặng 3...`,
      options: [
        { text: 'Đáp án A', isCorrect: true },
        { text: 'Đáp án B', isCorrect: false },
        { text: 'Đáp án C', isCorrect: false },
        { text: 'Đáp án D', isCorrect: false },
      ],
      isUsed: false,
      points: 30,
      section: 'CHẶNG 3: VỀ ĐÍCH'
    });
  }
  return questions;
};

export default function App() {
  // --- KHỞI TẠO STATE TỪ LOCALSTORAGE ---
  const [customClasses, setCustomClasses] = useState(() => JSON.parse(localStorage.getItem('olympia_customClasses') || '[]'));
  const [activeClass, setActiveClass] = useState(() => localStorage.getItem('olympia_activeClass') || DEFAULT_CLASSES[0]);
  const [students, setStudents] = useState(() => JSON.parse(localStorage.getItem('olympia_students') || '[]'));
  const [questions, setQuestions] = useState(() => JSON.parse(localStorage.getItem('olympia_questions') || JSON.stringify(generateDefaultQuestions())));
  const [ballsOrder, setBallsOrder] = useState(() => JSON.parse(localStorage.getItem('olympia_ballsOrder') || JSON.stringify(Array.from({ length: 15 }, (_, i) => i + 1))));
  const [globalTime, setGlobalTime] = useState(() => parseInt(localStorage.getItem('olympia_globalTime') || '10'));
  
  // States UI
  const [studentNameInput, setStudentNameInput] = useState('');
  const [timeInput, setTimeInput] = useState(globalTime.toString());
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

  // --- LƯU DỮ LIỆU TỰ ĐỘNG ---
  useEffect(() => {
    localStorage.setItem('olympia_customClasses', JSON.stringify(customClasses));
    localStorage.setItem('olympia_activeClass', activeClass);
    localStorage.setItem('olympia_students', JSON.stringify(students));
    localStorage.setItem('olympia_questions', JSON.stringify(questions));
    localStorage.setItem('olympia_ballsOrder', JSON.stringify(ballsOrder));
    localStorage.setItem('olympia_globalTime', globalTime.toString());
  }, [customClasses, activeClass, students, questions, ballsOrder, globalTime]);

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

  const addStudent = () => {
    if (!studentNameInput.trim()) return;
    const newStudent = { id: Date.now().toString(), name: studentNameInput.trim(), className: activeClass, score: 0 };
    setStudents((prev: any) => [...prev, newStudent]);
    setStudentNameInput('');
    setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const deleteStudent = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      message: `Xóa học sinh "${name}" khỏi danh sách?`,
      onConfirm: () => {
        setStudents((prev: any) => prev.filter((s: any) => s.id !== id));
        setConfirmModal({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  const startEditing = (student: any) => {
    setEditingStudentId(student.id);
    setEditNameValue(student.name);
  };

  const saveEdit = (id: string) => {
    setStudents((prev: any) => prev.map((s: any) => s.id === id ? { ...s, name: editNameValue } : s));
    setEditingStudentId(null);
  };

  // --- ĐIỀU KHIỂN GAME ---
  const openQuestion = (id: number) => {
    const q = questions.find((q: any) => q.id === id);
    if (q.isUsed) return;
    setActiveQuestionId(id);
    setTimeLeft(globalTime);
    // Tự động chọn học sinh đầu tiên trong lớp nếu chưa có ai được chọn
    if (currentClassStudents.length > 0) setSelectedStudentId(currentClassStudents[0].id);
  };

  const handleAnswer = (isCorrect: boolean) => {
    const q = questions.find((q: any) => q.id === activeQuestionId);
    if (isCorrect) {
      playSound('correct');
      if (selectedStudentId && q) {
        setStudents((prev: any) => prev.map((s: any) => s.id === selectedStudentId ? { ...s, score: s.score + q.points } : s));
      }
    } else {
      playSound('wrong');
    }
    setQuestions((prev: any) => prev.map((q: any) => q.id === activeQuestionId ? { ...q, isUsed: true } : q));
    setActiveQuestionId(null);
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

  const handleBulkAdd = () => {
    const names = bulkStudentText.split('\n').filter(n => n.trim());
    const newStudents = names.map((name, i) => ({
      id: `bulk-${Date.now()}-${i}`,
      name: name.trim(),
      className: activeClass,
      score: 0
    }));
    setStudents((prev: any) => [...prev, ...newStudents]);
    setBulkStudentText('');
    setShowBulkImportModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 lg:p-8 font-sans flex flex-col lg:flex-row gap-6 text-gray-100">
      <audio ref={bgmRef} src={SOUNDS.bgm} loop />

      {/* CỘT TRÁI: QUẢN LÝ LỚP */}
      <div className="w-full lg:w-80 flex-shrink-0 bg-[#1e293b] rounded-3xl p-5 shadow-xl border-t-8 border-blue-500 flex flex-col">
        <div className="mb-4">
          <label className="block text-xs font-black text-blue-400 uppercase mb-1">Lớp Đang Dạy</label>
          <div className="flex gap-2">
            <select 
              value={activeClass} 
              onChange={(e) => setActiveClass(e.target.value)}
              className="flex-1 bg-[#334155] border-2 border-blue-900/50 rounded-xl px-3 py-2 font-bold text-white focus:outline-none"
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
            <button onClick={() => {
              const name = prompt("Nhập tên lớp mới:");
              if (name) setCustomClasses((prev: any) => [...prev, name.toUpperCase()]);
            }} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><Plus size={20}/></button>
          </div>
        </div>

        <div className="relative mb-3">
          <input 
            type="text" 
            placeholder="Tìm học sinh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#334155] rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 ring-blue-400 outline-none"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4 custom-scrollbar min-h-[300px]">
          {paginatedStudents.map((student: any) => (
            <div key={student.id} className="group flex justify-between items-center bg-[#334155] p-2 rounded-xl border border-blue-900/30 hover:border-blue-400 transition-all">
              {editingStudentId === student.id ? (
                <input 
                  autoFocus
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onBlur={() => saveEdit(student.id)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(student.id)}
                  className="flex-1 bg-[#1e293b] border border-blue-500 rounded px-2 py-0.5 text-sm text-white"
                />
              ) : (
                <div className="flex flex-col">
                   <span className="font-bold text-sm truncate w-32">{student.name}</span>
                   <span className="text-[10px] text-blue-400 font-bold">{student.score} điểm</span>
                </div>
              )}
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEditing(student)} className="p-1 text-blue-400 hover:bg-blue-900/50 rounded"><Edit2 size={14}/></button>
                <button onClick={() => deleteStudent(student.id, student.name)} className="p-1 text-red-400 hover:bg-red-900/50 rounded"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
          <div ref={listEndRef} />
        </div>

        <div className="space-y-2 pt-4 border-t border-blue-900/30">
          <div className="flex gap-2">
            <input 
              value={studentNameInput}
              onChange={(e) => setStudentNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStudent()}
              placeholder="Tên học sinh mới..."
              className="flex-1 bg-[#334155] border border-blue-900/30 rounded-xl px-3 py-2 text-sm text-white"
            />
            <button onClick={addStudent} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm">Thêm</button>
          </div>
          <button onClick={() => setShowBulkImportModal(true)} className="w-full py-2 text-blue-400 text-xs font-bold hover:underline flex items-center justify-center gap-1">
            <FileText size={14}/> Nhập nhanh từ Excel/Word
          </button>
        </div>
      </div>

      {/* CỘT GIỮA: SÂN CHƠI CHÍNH */}
      <div className="flex-1 flex flex-col">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-black text-white tracking-tighter">OLYMPIA <span className="text-blue-500">MOUNTAIN</span></h1>
          
          <div className="flex gap-2 bg-[#1e293b] p-2 rounded-2xl shadow-sm border border-blue-900/30">
            <button onClick={toggleMusic} className={`p-2 rounded-xl transition-colors ${isMusicPlaying ? 'bg-blue-900/50 text-blue-400' : 'bg-[#334155] text-gray-400'}`}>
              {isMusicPlaying ? <Music size={20}/> : <Music2 size={20}/>}
            </button>
            <button onClick={() => {
               setConfirmModal({
                 isOpen: true,
                 message: "Trộn ngẫu nhiên vị trí các câu hỏi?",
                 onConfirm: () => {
                   setBallsOrder((prev: any) => [...prev].sort(() => Math.random() - 0.5));
                   setConfirmModal({ isOpen: false, message: '', onConfirm: null });
                 }
               });
            }} className="p-2 bg-[#334155] text-purple-400 rounded-xl hover:bg-purple-900/50"><Shuffle size={20}/></button>
            <button onClick={() => setShowSettings(true)} className="p-2 bg-[#334155] text-teal-400 rounded-xl hover:bg-teal-900/50"><Settings size={20}/></button>
            <button onClick={exportAllData} className="p-2 bg-[#334155] text-blue-400 rounded-xl hover:bg-blue-900/50"><Download size={20}/></button>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-[2.5rem] p-8 shadow-2xl border-b-[12px] border-blue-900/50 flex-1 flex flex-col items-center justify-start overflow-y-auto custom-scrollbar">
          {/* CHẶNG 1 */}
          <div className="w-full mb-12">
            <h2 className="text-center text-xl font-black text-gray-400 mb-6 tracking-widest uppercase">Chặng 1: Vượt chướng ngại vật</h2>
            <div className="flex flex-wrap justify-center gap-6">
              {ballsOrder.filter(id => id >= 1 && id <= 7).map((id: number) => {
                const q = questions.find((item: any) => item.id === id);
                return (
                  <div key={id} className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => openQuestion(id)}
                      disabled={q.isUsed}
                      className={`
                        w-20 h-20 md:w-24 md:h-24 rounded-2xl font-black text-2xl transition-all transform hover:scale-110 flex items-center justify-center relative overflow-hidden group
                        ${q.isUsed 
                          ? 'bg-gray-800/50 grayscale opacity-40 cursor-not-allowed border-2 border-gray-700' 
                          : 'bg-[#334155] hover:bg-[#475569] shadow-lg shadow-blue-500/10 hover:shadow-blue-500/30 border-2 border-blue-400/20'}
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
                    <span className="text-xs font-bold text-blue-400">{q.points} đ</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHẶNG 2 */}
          <div className="w-full mb-12">
            <h2 className="text-center text-xl font-black text-gray-400 mb-6 tracking-widest uppercase">Chặng 2: Tăng tốc</h2>
            <div className="flex flex-wrap justify-center gap-6">
              {ballsOrder.filter(id => id >= 8 && id <= 12).map((id: number) => {
                const q = questions.find((item: any) => item.id === id);
                return (
                  <div key={id} className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => openQuestion(id)}
                      disabled={q.isUsed}
                      className={`
                        w-20 h-20 md:w-24 md:h-24 rounded-2xl font-black text-2xl transition-all transform hover:scale-110 flex items-center justify-center relative overflow-hidden group
                        ${q.isUsed 
                          ? 'bg-gray-800/50 grayscale opacity-40 cursor-not-allowed border-2 border-gray-700' 
                          : 'bg-[#334155] hover:bg-[#475569] shadow-lg shadow-blue-500/10 hover:shadow-blue-500/30 border-2 border-blue-400/20'}
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
                    <span className="text-xs font-bold text-blue-400">{q.points} đ</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHẶNG 3 */}
          <div className="w-full">
            <h2 className="text-center text-xl font-black text-gray-400 mb-6 tracking-widest uppercase">Chặng 3: Về đích</h2>
            <div className="flex flex-wrap justify-center gap-6">
              {ballsOrder.filter(id => id >= 13 && id <= 15).map((id: number) => {
                const q = questions.find((item: any) => item.id === id);
                return (
                  <div key={id} className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => openQuestion(id)}
                      disabled={q.isUsed}
                      className={`
                        w-20 h-20 md:w-24 md:h-24 rounded-2xl font-black text-2xl transition-all transform hover:scale-110 flex items-center justify-center relative overflow-hidden group
                        ${q.isUsed 
                          ? 'bg-gray-800/50 grayscale opacity-40 cursor-not-allowed border-2 border-gray-700' 
                          : 'bg-[#334155] hover:bg-[#475569] shadow-lg shadow-blue-500/10 hover:shadow-blue-500/30 border-2 border-blue-400/20'}
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
                    <span className="text-xs font-bold text-blue-400">{q.points} đ</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: BẢNG VÀNG */}
      <div className="w-full lg:w-64 flex flex-col gap-6">
        <div className="bg-[#1e293b] rounded-3xl p-5 shadow-xl text-white border border-blue-900/30">
          <div className="flex items-center gap-2 mb-4 text-blue-400 font-black">
            <Trophy size={20}/> <span>BẢNG VÀNG {activeClass}</span>
          </div>
          <div className="space-y-3">
            {[...currentClassStudents].sort((a,b) => b.score - a.score).slice(0, 5).map((s, i) => (
              <div key={s.id} className="flex justify-between items-center text-sm border-b border-blue-900/30 pb-2">
                <span className="truncate w-32 font-medium opacity-90">{i+1}. {s.name}</span>
                <span className="font-bold text-blue-400">{s.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-3xl p-5 shadow-md border border-blue-900/30">
           <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Thông tin tiết dạy</p>
           <div className="text-sm font-bold text-gray-300">Thời gian: {globalTime} giây</div>
           <div className="text-sm font-bold text-gray-300">Đã dùng: {questions.filter((q: any) => q.isUsed).length}/15 câu</div>
           <button 
             onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  message: "Làm mới toàn bộ câu hỏi (Vẫn giữ lại điểm học sinh)?",
                  onConfirm: () => {
                    setQuestions((prev: any) => prev.map((q: any) => ({ ...q, isUsed: false })));
                    setConfirmModal({ isOpen: false, message: '', onConfirm: null });
                  }
                });
             }}
             className="mt-4 w-full py-2 bg-red-900/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-900/40 transition border border-red-900/30"
           >
             Reset Trận Đấu
           </button>
        </div>
      </div>

      {/* MODAL CÂU HỎI */}
      {activeQuestionId && (
        <div className="fixed inset-0 bg-indigo-900/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <span className="bg-indigo-100 text-indigo-700 px-6 py-2 rounded-full font-black text-xl">CÂU {activeQuestionId}</span>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black border-4 transition-colors ${timeLeft < 4 ? 'border-red-500 text-red-500 animate-pulse' : 'border-indigo-500 text-indigo-500'}`}>
                  {timeLeft}
                </div>
              </div>

              <div className="mb-8">
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 text-center">Đang trả lời</label>
                <select 
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3 font-bold text-center text-xl focus:outline-none focus:ring-2 ring-indigo-400"
                >
                  <option value="">-- Chọn học sinh ghi điểm --</option>
                  {currentClassStudents.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.score}đ)</option>)}
                </select>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-center text-indigo-900 mb-10 leading-relaxed">
                {questions.find((q: any) => q.id === activeQuestionId).question}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions.find((q: any) => q.id === activeQuestionId).options.map((opt: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt.isCorrect)}
                    className="p-5 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-2xl text-left font-bold text-lg transition-all flex items-center gap-4 group"
                  >
                    <span className="w-10 h-10 rounded-xl bg-white group-hover:bg-indigo-500 flex items-center justify-center shadow-sm text-indigo-600 group-hover:text-white">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => setActiveQuestionId(null)}
              className="w-full py-4 bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition"
            >
              Đóng câu hỏi (Bỏ qua)
            </button>
          </div>
        </div>
      )}

      {/* MODAL CÀI ĐẶT CÂU HỎI */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black">QUẢN TRỊ CÂU HỎI</h2>
              <button onClick={() => setShowSettings(false)}><X/></button>
            </div>
            
            <div className="p-4 bg-indigo-50 border-b flex flex-wrap gap-4 items-center justify-between">
               <div className="flex items-center gap-2">
                 <span className="text-sm font-bold">Thời gian (giây):</span>
                 <input 
                  type="number" 
                  value={timeInput} 
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="w-20 px-3 py-1 rounded-lg border focus:ring-2 ring-indigo-400 outline-none"
                 />
                 <button onClick={() => setGlobalTime(parseInt(timeInput))} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm">Lưu</button>
               </div>
               
               <div className="flex gap-2">
                  <button onClick={() => questionFileInputRef.current?.click()} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-amber-600 transition flex items-center gap-2">
                    <Upload size={16}/> Nhập file JSON
                  </button>
                  <input type="file" ref={questionFileInputRef} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if(!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const data = JSON.parse(event.target?.result as string);
                        if(Array.isArray(data)) setQuestions(data);
                        else if(data.questions) setQuestions(data.questions);
                        alert("Đã cập nhật câu hỏi!");
                      } catch(e) { alert("Lỗi file!"); }
                    };
                    reader.readAsText(file);
                  }} className="hidden" accept=".json"/>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
               {questions.map((q: any, qIdx: number) => (
                 <div key={q.id} className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100">
                    <div className="flex gap-4 mb-4">
                      <span className="font-black text-indigo-600">#{q.id}</span>
                      <input 
                        value={q.question} 
                        onChange={(e) => {
                          const newQs = [...questions];
                          newQs[qIdx].question = e.target.value;
                          setQuestions(newQs);
                        }}
                        className="flex-1 bg-white border rounded-xl px-4 py-2 font-bold focus:ring-2 ring-indigo-400 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                       {q.options.map((opt: any, oIdx: number) => (
                         <div key={oIdx} className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              name={`correct-${q.id}`} 
                              checked={opt.isCorrect}
                              onChange={() => {
                                const newQs = [...questions];
                                newQs[qIdx].options.forEach((o: any, idx: number) => o.isCorrect = (idx === oIdx));
                                setQuestions(newQs);
                              }}
                            />
                            <input 
                              value={opt.text}
                              onChange={(e) => {
                                const newQs = [...questions];
                                newQs[qIdx].options[oIdx].text = e.target.value;
                                setQuestions(newQs);
                              }}
                              className={`flex-1 px-3 py-1.5 rounded-lg border text-sm ${opt.isCorrect ? 'bg-green-50 border-green-300' : 'bg-white'}`}
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
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border-4 border-indigo-500">
            <div className="bg-indigo-600 text-white p-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><FileText /> NHẬP NHANH HỌC SINH</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-sm mb-4">Copy danh sách tên từ Excel/Word, mỗi tên nằm trên 1 dòng rồi dán vào đây.</p>
              <textarea
                className="w-full h-64 p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 outline-none font-medium resize-none shadow-inner"
                placeholder="Nguyễn Văn A&#10;Trần Thị B..."
                value={bulkStudentText}
                onChange={(e) => setBulkStudentText(e.target.value)}
              />
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowBulkImportModal(false)} className="px-6 py-2 font-bold text-gray-500">Hủy</button>
                <button onClick={handleBulkAdd} className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-black shadow-lg">LƯU DANH SÁCH</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-indigo-900/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-b-8 border-amber-500">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <Shield size={32}/>
            </div>
            <h3 className="text-xl font-black text-indigo-900 mb-2">XÁC NHẬN</h3>
            <p className="text-gray-600 mb-8 font-medium">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({isOpen: false, message: '', onConfirm: null})} className="flex-1 py-3 font-bold text-gray-400 hover:bg-gray-50 rounded-2xl">Hủy</button>
              <button onClick={confirmModal.onConfirm || (() => {})} className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-lg">Đồng ý</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  );
}
