'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 

export default function AdminPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  
  // 입력 상태 관리
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [questionType, setQuestionType] = useState('word_cloud'); // 기본값: 단어구름
  const [options, setOptions] = useState(['', '']); // 객관식 선택지

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoomId) fetchQuestions(selectedRoomId);
  }, [selectedRoomId]);

  const fetchRooms = async () => {
    const { data } = await supabase.from('rooms').select('*').order('created_at', { ascending: false });
    if (data) setRooms(data);
  };

  const fetchQuestions = async (roomId: string) => {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('room_id', roomId)
      .order('sort_order', { ascending: true });
    if (data) setQuestions(data);
  };

  const handleCreateRoom = async () => {
    if (!newRoomTitle.trim()) return alert('방 이름을 입력해주세요!');
    await supabase.from('rooms').insert([{ title: newRoomTitle }]);
    setNewRoomTitle('');
    fetchRooms();
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('방을 삭제하시겠습니까?')) return;
    await supabase.from('rooms').delete().eq('id', roomId);
    if (selectedRoomId === roomId) setSelectedRoomId(null);
    fetchRooms();
  };

  const handleAddQuestion = async () => {
    if (!selectedRoomId) return alert('방을 먼저 선택해주세요!');
    if (!newQuestionTitle.trim()) return alert('질문을 입력해주세요!');

    // 객관식일 경우 빈 선택지 제거
    const filteredOptions = questionType === 'multiple_choice' ? options.filter(opt => opt.trim() !== '') : [];
    if (questionType === 'multiple_choice' && filteredOptions.length < 2) {
      return alert('객관식은 최소 2개의 선택지가 필요합니다.');
    }

    const nextOrder = questions.length + 1;

    const { error } = await supabase.from('questions').insert([
      { 
        room_id: selectedRoomId, 
        title: newQuestionTitle, 
        sort_order: nextOrder,
        type: questionType,
        options: filteredOptions
      }
    ]);

    if (error) return alert('오류 발생: ' + error.message);
    setNewQuestionTitle('');
    setOptions(['', '']);
    fetchQuestions(selectedRoomId);
  };

  // 객관식 옵션 핸들러
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };
  const addOptionField = () => setOptions([...options, '']);

  const handleOpenDisplay = () => {
    if (!selectedRoomId) return alert('방을 먼저 선택해주세요!');
    window.open(`/display/${selectedRoomId}`, '_blank');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* ⬅️ 왼쪽: 방 관리 사이드바 */}
      <div className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6 text-slate-800">워사커 방 관리</h2>
        <div className="flex gap-2 mb-6">
          <input
            className="border border-slate-300 p-2 flex-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="새 방 이름..."
            value={newRoomTitle}
            onChange={(e) => setNewRoomTitle(e.target.value)}
          />
          <button onClick={handleCreateRoom} className="bg-violet-600 hover:bg-violet-700 text-white px-4 rounded-lg font-medium transition">
            생성
          </button>
        </div>

        <ul className="space-y-2 flex-1 overflow-y-auto">
          {rooms.map(room => (
            <li 
              key={room.id} 
              className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition ${
                selectedRoomId === room.id 
                ? 'bg-violet-100 border border-violet-400 text-violet-900 font-medium' 
                : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
              }`}
              onClick={() => setSelectedRoomId(room.id)}
            >
              <span className="truncate pr-2">{room.title}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                className="text-slate-400 hover:text-red-500 text-sm px-2 py-1 rounded"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ➡️ 오른쪽: 질문(슬라이드) 관리 */}
      <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
        {!selectedRoomId ? (
          <div className="flex items-center justify-center h-full text-slate-400 font-medium text-lg">
            👈 왼쪽에서 관리할 방을 선택해주세요.
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">질문 목록</h2>
              <button 
                onClick={handleOpenDisplay}
                className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-violet-200 transition flex items-center gap-2"
              >
                전광판 열기 🚀
              </button>
            </div>

            {/* 질문 추가 박스 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
              <h3 className="font-semibold text-slate-700 mb-4">새 슬라이드 추가</h3>
              
              {/* 3가지 타입 선택 버튼 */}
              <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
                {[
                  { id: 'multiple_choice', label: '📊 객관식' },
                  { id: 'word_cloud', label: '☁️ 단어구름' },
                  { id: 'qna', label: '💬 익명 Q&A' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setQuestionType(type.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                      questionType === type.id 
                      ? 'bg-white text-violet-700 shadow-sm border border-slate-200' 
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* 질문 제목 입력 */}
              <input
                className="w-full border border-slate-300 p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-slate-50"
                placeholder="질문을 입력하세요..."
                value={newQuestionTitle}
                onChange={(e) => setNewQuestionTitle(e.target.value)}
              />

              {/* 객관식일 경우 선택지 입력 칸 표시 */}
              {questionType === 'multiple_choice' && (
                <div className="mb-4 space-y-2 pl-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        className="flex-1 border border-slate-200 p-2 rounded-lg text-sm"
                        placeholder={`선택지 ${idx + 1}`}
                        value={opt}
                        onChange={(e) => updateOption(idx, e.target.value)}
                      />
                    </div>
                  ))}
                  <button onClick={addOptionField} className="text-violet-600 text-sm font-medium hover:underline mt-1">
                    + 선택지 추가
                  </button>
                </div>
              )}

              <button 
                onClick={handleAddQuestion} 
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-xl transition"
              >
                + 질문 저장하기
              </button>
            </div>

            {/* 만들어진 질문 목록 */}
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 border-dashed text-slate-400">
                  아직 등록된 질문이 없습니다. 첫 슬라이드를 만들어보세요!
                </div>
              ) : null}
              
              {questions.map((q) => (
                <div key={q.id} className="p-5 bg-white border border-slate-200 rounded-2xl flex items-start gap-4 shadow-sm hover:border-violet-300 transition">
                  <div className="bg-violet-100 text-violet-700 px-3 py-1 rounded-lg text-sm font-bold shrink-0 mt-0.5">
                    Slide {q.sort_order}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 text-lg mb-1">{q.title}</div>
                    <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">
                      {q.type === 'word_cloud' ? '☁️ 단어구름' : q.type === 'multiple_choice' ? '📊 객관식' : '💬 익명 Q&A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
