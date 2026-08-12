'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [roomTheme, setRoomTheme] = useState<'dark' | 'light'>('dark');
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [questionType, setQuestionType] = useState('word_cloud');
  const [options, setOptions] = useState(['', '']);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { if (isLoggedIn) fetchRooms(); }, [isLoggedIn]);
  useEffect(() => { if (selectedRoomId) fetchQuestions(selectedRoomId); }, [selectedRoomId]);

  const handleLogin = () => {
    if (password === '1234') {
      setIsLoggedIn(true);
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

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
    const { error } = await supabase.from('rooms').insert([{ title: newRoomTitle.trim(), theme: roomTheme }]);
    if (error) alert('방 생성 실패: ' + error.message);
    else { setNewRoomTitle(''); fetchRooms(); }
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

  if (!isLoggedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md text-center border border-slate-200">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Isaiah6tyOne</h1>
          <p className="text-slate-500 mb-8 text-sm">관리자 비밀번호를 입력하세요</p>
          <input type="password" placeholder="비밀번호 입력 (기본: 1234)" className="w-full border-2 border-slate-200 p-4 rounded-xl mb-4 text-center focus:border-slate-900 focus:outline-none" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
          <button onClick={handleLogin} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-black transition">관리자 로그인</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="w-96 bg-white border-r border-slate-200 p-6 flex flex-col">
        <div className="text-2xl font-black text-slate-900 tracking-tight mb-6">Isaiah6tyOne</div>
        
        <div className="space-y-3 mb-6">
          <input className="w-full border border-slate-300 p-3 rounded-xl text-sm" placeholder="새 방 이름..." value={newRoomTitle} onChange={(e) => setNewRoomTitle(e.target.value)} />
          <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-xl">
            <span className="text-xs font-bold text-slate-500 pl-2">테마 모드</span>
            <div className="flex gap-1">
              <button onClick={() => setRoomTheme('dark')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${roomTheme === 'dark' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500'}`}>블랙</button>
              <button onClick={() => setRoomTheme('light')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${roomTheme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>화이트</button>
            </div>
          </div>
          <button onClick={handleCreateRoom} className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-bold text-sm transition shadow-sm">+ 새 방 만들기</button>
        </div>

        <ul className="space-y-2 flex-1 overflow-y-auto">
          {rooms.map(room => (
            <li key={room.id} className={`flex justify-between items-center p-3.5 rounded-xl cursor-pointer ${selectedRoomId === room.id ? 'bg-slate-100 border-slate-900 font-bold text-slate-900' : 'bg-white border-slate-200'} border transition`} onClick={() => setSelectedRoomId(room.id)}>
              <div className="truncate pr-2"><div>{room.title}</div><div className="text-[10px] text-slate-400 uppercase mt-0.5">{room.theme || 'dark'} theme</div></div>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }} className="text-slate-400 hover:text-red-500 text-xs">삭제</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 p-10 bg-slate-50 overflow-y-auto">
        {!selectedRoomId ? (
          <div className="flex items-center justify-center h-full text-slate-400 font-medium">👈 왼쪽에서 방을 선택하거나 새 방을 생성해주세요.</div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">질문 및 슬라이드 관리</h2>
              <button onClick={handleOpenDisplay} className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg transition">전광판 열기 🚀</button>
            </div>

            <div className={`p-6 rounded-2xl border shadow-sm mb-8 bg-white border-slate-200`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700">{editingId ? '✏️ 질문 수정 모드' : '새 슬라이드 추가'}</h3>
                {editingId && <button onClick={() => { setEditingId(null); setNewQuestionTitle(''); setOptions(['', '']); }} className="text-sm text-slate-500 hover:underline">수정 취소</button>}
              </div>
              
              <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
                {[{ id: 'multiple_choice', label: '📊 객관식' }, { id: 'word_cloud', label: '☁️ 단어구름' }, { id: 'qna', label: '💬 익명 Q&A' }].map((type) => (
                  <button key={type.id} onClick={() => setQuestionType(type.id)} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${questionType === type.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{type.label}</button>
                ))}
              </div>

              <textarea className="w-full border border-slate-300 p-3.5 rounded-xl mb-4 bg-slate-50 focus:bg-white transition resize-none" rows={3} placeholder="질문을 입력하세요..." value={newQuestionTitle} onChange={(e) => setNewQuestionTitle(e.target.value)} />

              {questionType === 'multiple_choice' && (
                <div className="mb-4 space-y-2 pl-2">
                  {options.map((opt, idx) => (
                    <input key={idx} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-slate-50" placeholder={`선택지 ${idx + 1}`} value={opt} onChange={(e) => updateOption(idx, e.target.value)} />
                  ))}
                  <button onClick={() => setOptions([...options, ''])} className="text-slate-600 text-sm font-semibold mt-1">+ 선택지 추가</button>
                </div>
              )}

              <button onClick={handleSaveQuestion} className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition">{editingId ? '✓ 수정 완료하기' : '+ 질문 저장하기'}</button>
            </div>

            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="p-5 bg-white border border-slate-200 rounded-2xl flex items-start gap-4 shadow-sm">
                  <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">Slide {q.sort_order}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 text-lg mb-2">{q.title}</div>
                    <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md w-fit">{q.type}</div>
                  </div>
                  <button onClick={() => handleEditClick(q)} className="text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl text-sm font-bold transition">수정</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
