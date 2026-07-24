'use client';

import { useState, useEffect } from 'react';
// 💡 만약 lib 폴더 안의 파일명이 다르면 아래 경로를 그 파일 이름에 맞게 살짝 수정해 줘!
import { supabase } from '@/lib/supabase'; 

export default function AdminPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newQuestionTitle, setNewQuestionTitle] = useState('');

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
    const { error } = await supabase.from('rooms').insert([{ title: newRoomTitle }]);
    if (error) return alert('오류 발생: ' + error.message);
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

    const nextOrder = questions.length + 1;

    const { error } = await supabase.from('questions').insert([
      { room_id: selectedRoomId, title: newQuestionTitle, sort_order: nextOrder }
    ]);

    if (error) return alert('오류 발생: ' + error.message);
    setNewQuestionTitle('');
    fetchQuestions(selectedRoomId);
  };

  const handleOpenDisplay = () => {
    if (!selectedRoomId) return alert('방을 먼저 선택해주세요!');
    window.open(`/display/${selectedRoomId}`, '_blank');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 p-8 text-black">
      <div className="w-1/3 pr-8 border-r">
        <h2 className="text-2xl font-bold mb-4">방 관리</h2>
        <div className="flex gap-2 mb-4">
          <input
            className="border p-2 flex-1 rounded"
            placeholder="새 방 이름"
            value={newRoomTitle}
            onChange={(e) => setNewRoomTitle(e.target.value)}
          />
          <button onClick={handleCreateRoom} className="bg-blue-600 text-white px-4 rounded">생성</button>
        </div>

        <ul className="space-y-2">
          {rooms.map(room => (
            <li 
              key={room.id} 
              className={`flex justify-between items-center p-3 rounded cursor-pointer ${selectedRoomId === room.id ? 'bg-blue-100 border-blue-500 border' : 'bg-white border'}`}
              onClick={() => setSelectedRoomId(room.id)}
            >
              <span>{room.title}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                className="text-red-500 text-sm hover:underline"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="w-2/3 pl-8">
        {!selectedRoomId ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            왼쪽에서 방을 선택해주세요.
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">질문 목록 (슬라이드)</h2>
              <button 
                onClick={handleOpenDisplay}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold"
              >
                전광판 열기 🚀
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              <input
                className="border p-2 flex-1 rounded"
                placeholder="새로운 질문 입력..."
                value={newQuestionTitle}
                onChange={(e) => setNewQuestionTitle(e.target.value)}
              />
              <button onClick={handleAddQuestion} className="bg-green-600 text-white px-4 py-2 rounded">
                + 질문 추가
              </button>
            </div>

            <div className="space-y-3">
              {questions.length === 0 ? <p className="text-gray-500">등록된 질문이 없습니다.</p> : null}
              {questions.map((q) => (
                <div key={q.id} className="p-4 bg-white border rounded flex gap-4 items-center shadow-sm">
                  <div className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
                    Slide {q.sort_order}
                  </div>
                  <div className="font-medium text-lg">{q.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
