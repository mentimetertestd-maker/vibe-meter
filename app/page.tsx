'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 

export default function AdminPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [roomTheme, setRoomTheme] = useState<'dark' | 'light'>('dark');
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [questionType, setQuestionType] = useState('word_cloud');
  const [options, setOptions] = useState(['', '']);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultsData, setResultsData] = useState<any[]>([]);

  useEffect(() => { fetchRooms(); }, []);
  useEffect(() => { if (selectedRoomId) fetchQuestions(selectedRoomId); }, [selectedRoomId]);

  const fetchRooms = async () => {
    const { data } = await supabase.from('rooms').select('*').order('created_at', { ascending: false });
    if (data) setRooms(data);
  };

  const fetchQuestions = async (roomId: string) => {
    const { data } = await supabase.from('questions').select('*').eq('room_id', roomId).order('sort_order', { ascending: true });
    if (data) setQuestions(data);
  };

  const handleCreateRoom = async () => {
    if (!newRoomTitle.trim()) return alert('방 이름을 입력해주세요!');
    await supabase.from('rooms').insert([{ title: newRoomTitle, theme: roomTheme }]);
    setNewRoomTitle(''); fetchRooms();
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('방을 삭제하시겠습니까?')) return;
    await supabase.from('rooms').delete().eq('id', roomId);
    if (selectedRoomId === roomId) setSelectedRoomId(null);
    fetchRooms();
  };

  const handleSaveQuestion = async () => {
    if (!selectedRoomId) return alert('방을 먼저 선택해주세요!');
    if (!newQuestionTitle.trim()) return alert('질문을 입력해주세요!');

    const filteredOptions = questionType === 'multiple_choice' ? options.filter(opt => opt.trim() !== '') : [];
    
    if (editingId) {
      await supabase.from('questions').update({ title: newQuestionTitle, type: questionType, options: filteredOptions }).eq('id', editingId);
      alert('수정되었습니다!');
    } else {
      const nextOrder = questions.length + 1;
      await supabase.from('questions').insert([{ room_id: selectedRoomId, title: newQuestionTitle, sort_order: nextOrder, type: questionType, options: filteredOptions }]);
    }

    setNewQuestionTitle(''); setOptions(['', '']); setEditingId(null); setQuestionType('word_cloud');
    fetchQuestions(selectedRoomId);
  };

  const handleEditClick = (q: any) => {
    setEditingId(q.id);
    setNewQuestionTitle(q.title);
    setQuestionType(q.type);
    setOptions(q.options?.length > 0 ? q.options : ['', '']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]; newOptions[index] = value; setOptions(newOptions);
  };

  const handleOpenDisplay = () => {
    if (!selectedRoomId) return alert('방을 먼저 선택해주세요!');
    window.open(`/display/${selectedRoomId}`, '_blank');
  };

  const handleOpenResults = async () => {
    if (!selectedRoomId) return alert('방을 선택해주세요!');
    
    const { data: qData } = await supabase.from('questions').select('*').eq('room_id', selectedRoomId).order('sort_order', { ascending: true });
    if (!qData || qData.length === 0) return alert('등록된 질문이 없습니다.');

    const qIds = qData.map(q => q.id);
    const { data: aData } = await supabase.from('answers').select('*').in('question_id', qIds);

    const grouped = qData.map(q => {
      const answersForQ = aData?.filter(a => a.question_id === q.id) || [];
      return { ...q, answers: answersForQ };
    });

    setResultsData(grouped);
    setIsResultModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans print:bg-white print:text-black">
      
      {isResultModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex justify-center items-center p-6 print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl print:max-h-none print:shadow-none print:w-full">
            
            <div className="p-6 border-b flex justify-between items-center print:hidden">
              <h2 className="text-2xl font-bold">📊 결과 요약 보고서</h2>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition shadow-sm">
                  📄 PDF로 저장 / 인쇄
                </button>
                <button onClick={() => setIsResultModalOpen(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition">
                  닫기
                </button>
              </div>
            </div>

            <div className="p-6 md:p-10 overflow-y-auto print:overflow-visible flex-1">
              <div className="hidden print:block mb-8 pb-4 border-b-2 border-black">
                <h1 className="text-3xl font-black">Isaiah6tyOne - 행사 결과 보고서</h1>
                <p className="text-gray-500 mt-2">출력일시: {new Date().toLocaleString()}</p>
              </div>

              {resultsData.map((q, idx) => (
                <div key={q.id} className="mb-10 page-break-inside-avoid">
                  <h3 className="text-xl font-bold mb-4 bg-slate-100 print:bg-gray-100 p-3 rounded-lg flex items-center gap-2">
                    <span className="text-violet-600 print:text-black">Q{idx + 1}.</span> 
                    {/* 💡 표에서도 줄바꿈이 적용되도록 변경 */}
                    <span className="whitespace-pre-wrap break-keep">{q.title}</span>
                    <span className="text-sm font-normal text-slate-500 ml-auto">
                      ({q.type === 'multiple_choice' ? '객관식' : q.type === 'word_cloud' ? '단어구름' : 'Q&A'})
                    </span>
                  </h3>
                  
                  {q.type === 'multiple_choice' ? (
                    <table className="w-full border-collapse border border-slate-300 text-left rounded-lg overflow-hidden">
                      <thead className="bg-slate-50 print:bg-gray-50">
                        <tr>
                          <th className="border border-slate-300 p-3.5 font-bold">선택지</th>
                          <th className="border border-slate-300 p-3.5 font-bold w-32 text-center">응답 수</th>
                          <th className="border border-slate-300 p-3.5 font-bold w-32 text-center">비율</th>
                        </tr>
                      </thead>
                      <tbody>
                        {q.options?.map((opt: string) => {
                          const count = q.answers.filter((a: any) => a.answer_text === opt).length;
                          const total = q.answers.length;
                          const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                          return (
                            <tr key={opt}>
                              <td className="border border-slate-300 p-3.5">{opt}</td>
                              <td className="border border-slate-300 p-3.5 text-center font-semibold">{count}명</td>
                              <td className="border border-slate-300 p-3.5 text-center text-slate-500">{percent}%</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-wrap gap-2.5 p-4 border border-slate-200 rounded-xl bg-slate-50/50 print:border-none print:bg-transparent print:p-0">
                      {q.answers.length === 0 ? (
                        <span className="text-slate-400">제출된 응답이 없습니다.</span>
                      ) : (
                        q.answers.map((a: any, i: number) => (
                          <span key={i} className="bg-white border border-slate-300 shadow-sm px-3.5 py-1.5 rounded-lg text-sm font-medium print:border-gray-400 print:shadow-none">
                            {a.answer_text}
                          </span>
                        ))
                      )}
                    </div>
                  )}
                  <div className="mt-3 text-right text-sm font-bold text-slate-400">
                    총 {q.answers.length}명 참여
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="w-96 bg-white border-r border-slate-200 p-6 flex flex-col print:hidden">
        <div className="text-2xl font-black text-violet-600 mb-6 tracking-tight">Isaiah6tyOne</div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">방 관리</h2>
        
        <div className="space-y-3 mb-6">
          <input 
            className="w-full border border-slate-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm bg-slate-50" 
            placeholder="새 방 이름..." 
            value={newRoomTitle} 
            onChange={(e) => setNewRoomTitle(e.target.value)} 
          />
          <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-xl">
            <span className="text-xs font-bold text-slate-500 pl-2">테마 모드</span>
            <div className="flex gap-1">
              <button onClick={() => setRoomTheme('dark')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${roomTheme === 'dark' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500'}`}>다크</button>
              <button onClick={() => setRoomTheme('light')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${roomTheme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>화이트</button>
            </div>
          </div>
          <button onClick={handleCreateRoom} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-bold text-sm transition shadow-sm">
            + 새 방 만들기
          </button>
        </div>

        <ul className="space-y-2 flex-1 overflow-y-auto">
          {rooms.map(room => (
            <li key={room.id} className={`flex justify-between items-center p-3.5 rounded-xl cursor-pointer ${selectedRoomId === room.id ? 'bg-violet-50 border-violet-500 font-semibold text-violet-900' : 'bg-white hover:bg-slate-50 border-slate-200'} border transition`} onClick={() => setSelectedRoomId(room.id)}>
              <div className="truncate pr-2">
                <div>{room.title}</div>
                <div className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">{room.theme || 'dark'} theme</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }} className="text-slate-400 hover:text-red-500 text-xs">삭제</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 p-10 bg-slate-50 overflow-y-auto print:hidden">
        {!selectedRoomId ? (
          <div className="flex items-center justify-center h-full text-slate-400 font-medium">👈 왼쪽에서 방을 선택해주세요.</div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">질문 및 슬라이드 관리</h2>
              <div className="flex gap-3">
                <button onClick={handleOpenResults} className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-bold shadow-sm transition flex items-center gap-2">
                  📊 결과 요약 표 보기
                </button>
                <button onClick={handleOpenDisplay} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-violet-200 transition flex items-center gap-2">
                  전광판 열기 🚀
                </button>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border shadow-sm mb-8 transition ${editingId ? 'bg-violet-50 border-violet-300' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold ${editingId ? 'text-violet-700' : 'text-slate-700'}`}>{editingId ? '✏️ 질문 수정 모드' : '새 슬라이드 추가'}</h3>
                {editingId && <button onClick={() => { setEditingId(null); setNewQuestionTitle(''); setOptions(['', '']); }} className="text-sm text-slate-500 hover:underline">수정 취소</button>}
              </div>
              
              <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
                {[{ id: 'multiple_choice', label: '📊 객관식' }, { id: 'word_cloud', label: '☁️ 단어구름' }, { id: 'qna', label: '💬 익명 Q&A' }].map((type) => (
                  <button key={type.id} onClick={() => setQuestionType(type.id)} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${questionType === type.id ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'}`}>{type.label}</button>
                ))}
              </div>

              {/* 💡 한 줄짜리 input을 여러 줄 쓸 수 있는 textarea로 변경 */}
              <textarea 
                className="w-full border border-slate-300 p-3.5 rounded-xl mb-4 bg-slate-50 focus:bg-white transition resize-none whitespace-pre-wrap" 
                rows={3}
                placeholder="질문을 입력하세요... (엔터키를 눌러 줄바꿈 가능)" 
                value={newQuestionTitle} 
                onChange={(e) => setNewQuestionTitle(e.target.value)} 
              />

              {questionType === 'multiple_choice' && (
                <div className="mb-4 space-y-2 pl-2">
                  {options.map((opt, idx) => (
                    <input key={idx} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-slate-50" placeholder={`선택지 ${idx + 1}`} value={opt} onChange={(e) => updateOption(idx, e.target.value)} />
                  ))}
                  <button onClick={() => setOptions([...options, ''])} className="text-violet-600 text-sm font-semibold mt-1">+ 선택지 추가</button>
                </div>
              )}

              <button onClick={handleSaveQuestion} className={`w-full text-white font-bold py-3.5 rounded-xl transition ${editingId ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
                {editingId ? '✓ 수정 완료하기' : '+ 질문 저장하기'}
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className={`p-5 bg-white border rounded-2xl flex items-start gap-4 shadow-sm transition ${editingId === q.id ? 'border-violet-500 ring-2 ring-violet-200' : 'border-slate-200'}`}>
                  <div className="bg-violet-100 text-violet-700 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">Slide {q.sort_order}</div>
                  <div className="flex-1">
                    {/* 💡 질문 목록에서도 줄바꿈이 예쁘게 적용되도록 클래스 추가 */}
                    <div className="font-semibold text-slate-800 text-lg mb-1 whitespace-pre-wrap break-keep">{q.title}</div>
                    <div className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md w-fit">
                      {q.type === 'word_cloud' ? '☁️ 단어구름' : q.type === 'multiple_choice' ? '📊 객관식' : '💬 익명 Q&A'}
                    </div>
                  </div>
                  <button onClick={() => handleEditClick(q)} className="text-violet-600 bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-xl text-sm font-bold transition">
                    수정
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
