'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const PART_LIST = ['워리커', '워밴커', '본질', '리바이브'];
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginPart, setLoginPart] = useState('워리커');
  const [password, setPassword] = useState('');

  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [roomTheme, setRoomTheme] = useState<'dark' | 'light'>('dark');
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [questionType, setQuestionType] = useState('word_cloud');
  const [options, setOptions] = useState(['', '']);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultsData, setResultsData] = useState<any[]>([]);

  useEffect(() => { if (isLoggedIn) fetchRooms(); }, [isLoggedIn, loginPart]);
  useEffect(() => { if (selectedRoomId) fetchQuestions(selectedRoomId); }, [selectedRoomId]);

  const handleLogin = () => {
    const passwords: { [key: string]: string } = {
      '워리커': '1111', 
      '워밴커': '2222',
      '본질': '3333',
      '리바이브': '4444',
    };

    if (password === passwords[loginPart]) {
      setIsLoggedIn(true);
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPassword('');
    setSelectedRoomId(null);
    setRooms([]);
    setQuestions([]);
  };

  const fetchRooms = async () => {
    const { data } = await supabase.from('rooms').select('*').order('created_at', { ascending: false });
    if (data) {
      // 💡 현재 로그인한 파트와 동일한 방만 필터링해서 보여줌
      const filtered = data.filter((r: any) => (r.room_part || '워리커') === loginPart);
      setRooms(filtered);
    }
  };

  const fetchQuestions = async (roomId: string) => {
    const { data } = await supabase.from('questions').select('*').eq('room_id', roomId).order('sort_order', { ascending: true });
    if (data) setQuestions(data);
  };

  // 💡 방 생성 로직 수정: 1번 팀으로 넘어가는 안전장치 제거 및 정확한 에러 출력
  const handleCreateRoom = async () => {
    if (!newRoomTitle.trim()) return alert('방 이름을 입력해주세요!');
    
    const { error } = await supabase.from('rooms').insert([{ 
      title: newRoomTitle.trim(), 
      theme: roomTheme, 
      room_part: loginPart 
    }]);

    if (error) {
      alert(`방 생성 실패! 데이터베이스에 room_part 설정이 완료되지 않았습니다.\n에러내용: ${error.message}`);
      return;
    }
    
    setNewRoomTitle(''); 
    fetchRooms();
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
      let { error } = await supabase.from('questions').update({ 
        title: newQuestionTitle, 
        subtitle: newSubtitle || '', 
        type: questionType, 
        options: filteredOptions 
      }).eq('id', editingId);

      if (error) {
        const fallback = await supabase.from('questions').update({ 
          title: newQuestionTitle, 
          type: questionType, 
          options: filteredOptions 
        }).eq('id', editingId);
        if (fallback.error) return alert('질문 수정 실패: ' + fallback.error.message);
      }
      alert('수정되었습니다!');
    } else {
      const nextOrder = questions.length + 1;
      let { error } = await supabase.from('questions').insert([{ 
        room_id: selectedRoomId, 
        title: newQuestionTitle, 
        subtitle: newSubtitle || '', 
        sort_order: nextOrder, 
        type: questionType, 
        options: filteredOptions 
      }]);

      if (error) {
        const fallback = await supabase.from('questions').insert([{ 
          room_id: selectedRoomId, 
          title: newQuestionTitle, 
          sort_order: nextOrder, 
          type: questionType, 
          options: filteredOptions 
        }]);
        if (fallback.error) return alert('질문 저장 실패: ' + fallback.error.message);
      }
    }

    setNewQuestionTitle(''); setNewSubtitle(''); setOptions(['', '']); setEditingId(null); setQuestionType('word_cloud');
    fetchQuestions(selectedRoomId);
  };

  const handleEditClick = (q: any) => {
    setEditingId(q.id);
    setNewQuestionTitle(q.title);
    setNewSubtitle(q.subtitle || '');
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
    const { data: aData } = await supabase.from('answers').select('*').in('question_id', qIds).order('created_at', { ascending: true });

    const grouped = qData.map(q => {
      const answersForQ = aData?.filter(a => a.question_id === q.id) || [];
      return { ...q, answers: answersForQ };
    });

    setResultsData(grouped);
    setIsResultModalOpen(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md text-center border border-slate-200">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Isaiah6tyOne</h1>
          <p className="text-slate-500 mb-8 text-sm">운영할 파트를 선택하고 로그인하세요</p>
          
          <div className="grid grid-cols-2 gap-2 mb-6">
            {PART_LIST.map(part => (
              <button 
                key={part} 
                onClick={() => setLoginPart(part)} 
                className={`py-3 rounded-xl font-bold text-sm transition ${loginPart === part ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {part}
              </button>
            ))}
          </div>

          <input 
            type="password" 
            placeholder="비밀번호 입력" 
            className="w-full border-2 border-slate-200 p-4 rounded-xl mb-4 text-center focus:border-slate-900 focus:outline-none" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()} 
          />
          <button onClick={handleLogin} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-black transition shadow-lg">
            {loginPart} 파트 로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans print:bg-white print:text-black">
      {isResultModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex justify-center items-center p-6 print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl print:max-h-none print:shadow-none print:w-full">
            <div className="p-6 border-b flex justify-between items-center print:hidden">
              <h2 className="text-2xl font-bold">📊 결과 요약 보고서</h2>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition shadow-sm">📄 PDF로 저장 / 인쇄</button>
                <button onClick={() => setIsResultModalOpen(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition">닫기</button>
              </div>
            </div>

            <div className="p-6 md:p-10 overflow-y-auto print:overflow-visible flex-1">
              <div className="hidden print:block mb-8 pb-4 border-b-2 border-black">
                <h1 className="text-3xl font-black">Isaiah6tyOne - {loginPart} 파트 결과 보고서</h1>
                <p className="text-gray-500 mt-2">출력일시: {new Date().toLocaleString()}</p>
              </div>

              {resultsData.map((q, idx) => (
                <div key={q.id} className="mb-10 page-break-inside-avoid">
                  <h3 className="text-xl font-bold mb-4 bg-slate-100 print:bg-gray-100 p-3 rounded-lg flex items-center gap-2">
                    <span className="text-violet-600 print:text-black">Q{idx + 1}.</span> 
                    <span className="whitespace-pre-wrap break-keep">{q.title}</span>
                    <span className="text-sm font-normal text-slate-500 ml-auto">({q.type})</span>
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
                    <div className="flex flex-col gap-2 p-4 border border-slate-200 rounded-xl bg-slate-50/50 print:border-none print:bg-transparent print:p-0">
                      {q.answers.length === 0 ? <span className="text-slate-400">제출된 응답이 없습니다.</span> : q.answers.map((a: any, i: number) => (
                        <div key={i} className="bg-white border border-slate-300 shadow-sm p-3.5 rounded-lg text-sm font-medium whitespace-pre-wrap leading-relaxed print:border-gray-400 print:shadow-none">
                          {a.answer_text}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 text-right text-sm font-bold text-slate-400">총 {q.answers.length}명 참여</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="w-96 bg-white border-r border-slate-200 p-6 flex flex-col print:hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">Isaiah6tyOne</div>
            <div className="text-xs font-bold text-violet-600 mt-0.5">{loginPart} 파트 관리 중</div>
          </div>
          <button onClick={handleLogout} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition">로그아웃</button>
        </div>
        
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

      <div className="flex-1 p-10 bg-slate-50 overflow-y-auto print:hidden">
        {!selectedRoomId ? (
          <div className="flex items-center justify-center h-full text-slate-400 font-medium">👈 왼쪽에서 방을 선택하거나 새 방을 생성해주세요.</div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">질문 및 슬라이드 관리</h2>
              <div className="flex gap-3">
                <button onClick={handleOpenResults} className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-bold shadow-sm transition flex items-center gap-2">📊 결과 요약 표 보기</button>
                <button onClick={handleOpenDisplay} className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg transition">전광판 열기 🚀</button>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border shadow-sm mb-8 bg-white border-slate-200`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700">{editingId ? '✏️ 질문 수정 모드' : '새 슬라이드 추가'}</h3>
                {editingId && <button onClick={() => { setEditingId(null); setNewQuestionTitle(''); setNewSubtitle(''); setOptions(['', '']); }} className="text-sm text-slate-500 hover:underline">수정 취소</button>}
              </div>
              
              <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
                {[{ id: 'multiple_choice', label: '📊 객관식' }, { id: 'word_cloud', label: '☁️ 단어구름' }, { id: 'qna', label: '💬 익명 Q&A' }].map((type) => (
                  <button key={type.id} onClick={() => setQuestionType(type.id)} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${questionType === type.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{type.label}</button>
                ))}
              </div>

              <input className="w-full border border-slate-300 p-3.5 rounded-xl mb-3 bg-slate-50 focus:bg-white transition" placeholder="소제목을 입력하세요 (예: Session 1. 아이스브레이킹)" value={newSubtitle} onChange={(e) => setNewSubtitle(e.target.value)} />

              <textarea 
                className="w-full border border-slate-300 p-3.5 rounded-xl mb-4 bg-slate-50 focus:bg-white transition resize-none whitespace-pre-wrap leading-relaxed" 
                rows={3} placeholder="메인 질문을 입력하세요... (엔터키로 줄바꿈 가능)" value={newQuestionTitle} onChange={(e) => setNewQuestionTitle(e.target.value)} 
              />

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
                    {q.subtitle && <div className="text-sm font-bold text-slate-400 mb-1">{q.subtitle}</div>}
                    <div className="font-semibold text-slate-800 text-lg mb-2 whitespace-pre-wrap break-keep leading-relaxed">{q.title}</div>
                    <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md w-fit">{q.type === 'word_cloud' ? '단어구름' : q.type === 'multiple_choice' ? '객관식' : 'Q&A'}</div>
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
