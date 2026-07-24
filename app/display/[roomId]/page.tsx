'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 

export default function AdminPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [questionType, setQuestionType] = useState('word_cloud');
  const [options, setOptions] = useState(['', '']);
  
  const [editingId, setEditingId] = useState<string | null>(null); // 💡 수정 모드 상태 추가

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
    if (!newRoomTitle.trim()) return;
    await supabase.from('rooms').insert([{ title: newRoomTitle }]);
    setNewRoomTitle(''); fetchRooms();
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('방을 삭제하시겠습니까?')) return;
    await supabase.from('rooms').delete().eq('id', roomId);
    if (selectedRoomId === roomId) setSelectedRoomId(null);
    fetchRooms();
  };

  // 💡 저장 버튼 (새로 추가 OR 기존 질문 수정)
  const handleSaveQuestion = async () => {
    if (!selectedRoomId) return alert('방을 먼저 선택해주세요!');
    if (!newQuestionTitle.trim()) return alert('질문을 입력해주세요!');

    const filteredOptions = questionType === 'multiple_choice' ? options.filter(opt => opt.trim() !== '') : [];
    
    if (editingId) {
      // 질문 수정 로직
      await supabase.from('questions').update({ title: newQuestionTitle, type: questionType, options: filteredOptions }).eq('id', editingId);
      alert('수정되었습니다!');
    } else {
      // 새 질문 추가 로직
      const nextOrder = questions.length + 1;
      await supabase.from('questions').insert([{ room_id: selectedRoomId, title: newQuestionTitle, sort_order: nextOrder, type: questionType, options: filteredOptions }]);
    }

    setNewQuestionTitle(''); setOptions(['', '']); setEditingId(null); setQuestionType('word_cloud');
    fetchQuestions(selectedRoomId);
  };

  // 💡 수정 버튼 클릭 시 입력창에 정보 불러오기
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
    if (!selectedRoomId) return;
    window.open(`/display/${selectedRoomId}`, '_blank');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 왼쪽 사이드바 (이전과 동일) */}
      <div className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6 text-slate-800">워사커 방 관리</h2>
        <div className="flex gap-2 mb-6">
          <input className="border border-slate-300 p-2 flex-1 rounded-lg focus:ring-2 focus:ring-violet-500" placeholder="새 방 이름..." value={newRoomTitle} onChange={(e) => setNewRoomTitle(e.target.value)} />
          <button onClick={handleCreateRoom} className="bg-violet-600 text-white px-4 rounded-lg font-medium">생성</button>
        </div>
        <ul className="space-y-2 flex-1 overflow-y-auto">
          {rooms.map(room => (
            <li key={room.id} className={`flex justify-between items-center p-3 rounded-xl cursor-pointer ${selectedRoomId === room.id ? 'bg-violet-100 border-violet-400 font-medium' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'} border`} onClick={() => setSelectedRoomId(room.id)}>
              <span className="truncate pr-2">{room.title}</span>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }} className="text-slate-400 hover:text-red-500 text-sm">삭제</button>
            </li>
          ))}
        </ul>
      </div>

      {/* 오른쪽 질문 관리 */}
      <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
        {!selectedRoomId ? (
          <div className="flex items-center justify-center h-full text-slate-400 font-medium">👈 왼쪽에서 방을 선택해주세요.</div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">질문 목록</h2>
              <button onClick={handleOpenDisplay} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md flex items-center gap-2">전광판 열기 🚀</button>
            </div>

            {/* 질문 추가/수정 박스 */}
            <div className={`p-6 rounded-2xl border shadow-sm mb-8 transition ${editingId ? 'bg-violet-50 border-violet-300' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold ${editingId ? 'text-violet-700' : 'text-slate-700'}`}>{editingId ? '✏️ 질문 수정 모드' : '새 슬라이드 추가'}</h3>
                {editingId && <button onClick={() => { setEditingId(null); setNewQuestionTitle(''); setOptions(['', '']); }} className="text-sm text-slate-500 hover:underline">수정 취소</button>}
              </div>
              
              <div className="flex gap-2 mb-6 bg-slate-100/50 p-1 rounded-lg w-fit">
                {[{ id: 'multiple_choice', label: '📊 객관식' }, { id: 'word_cloud', label: '☁️ 단어구름' }, { id: 'qna', label: '💬 익명 Q&A' }].map((type) => (
                  <button key={type.id} onClick={() => setQuestionType(type.id)} className={`px-4 py-2 rounded-md text-sm font-medium ${questionType === type.id ? 'bg-white text-violet-700 shadow-sm border border-slate-200' : 'text-slate-500'}`}>{type.label}</button>
                ))}
              </div>

              <input className="w-full border border-slate-300 p-3 rounded-xl mb-4 bg-white" placeholder="질문을 입력하세요..." value={newQuestionTitle} onChange={(e) => setNewQuestionTitle(e.target.value)} />

              {questionType === 'multiple_choice' && (
                <div className="mb-4 space-y-2 pl-2">
                  {options.map((opt, idx) => (
                    <input key={idx} className="w-full border border-slate-200 p-2 rounded-lg text-sm" placeholder={`선택지 ${idx + 1}`} value={opt} onChange={(e) => updateOption(idx, e.target.value)} />
                  ))}
                  <button onClick={() => setOptions([...options, ''])} className="text-violet-600 text-sm font-medium mt-1">+ 선택지 추가</button>
                </div>
              )}

              <button onClick={handleSaveQuestion} className={`w-full text-white font-medium py-3 rounded-xl transition ${editingId ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-800 hover:bg-slate-900'}`}>
                {editingId ? '✓ 수정 완료하기' : '+ 질문 저장하기'}
              </button>
            </div>

            {/* 질문 목록 리스트 */}
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className={`p-5 bg-white border rounded-2xl flex items-start gap-4 shadow-sm transition ${editingId === q.id ? 'border-violet-500 ring-2 ring-violet-200' : 'border-slate-200'}`}>
                  <div className="bg-violet-100 text-violet-700 px-3 py-1 rounded-lg text-sm font-bold shrink-0">Slide {q.sort_order}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 text-lg mb-1">{q.title}</div>
                    <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">
                      {q.type === 'word_cloud' ? '☁️ 단어구름' : q.type === 'multiple_choice' ? '📊 객관식' : '💬 익명 Q&A'}
                    </div>
                  </div>
                  {/* 💡 수정 버튼 추가됨 */}
                  <button onClick={() => handleEditClick(q)} className="text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg text-sm font-medium transition">
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
