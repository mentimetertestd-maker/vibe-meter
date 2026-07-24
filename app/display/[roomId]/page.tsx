'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function JoinPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [activeQuestion, setActiveQuestion] = useState<any>(null);

  useEffect(() => {
    if (!roomId) return;
    
    // 💡 1.5초마다 발표자가 무슨 슬라이드를 보고 있는지 확인해서 내 화면을 바꿈!
    const checkActiveQuestion = async () => {
      const { data: room } = await supabase.from('rooms').select('active_question_id').eq('id', roomId).single();
      
      if (room?.active_question_id) {
        const { data: question } = await supabase.from('questions').select('*').eq('id', room.active_question_id).single();
        if (question) setActiveQuestion(question);
      }
    };

    checkActiveQuestion(); // 처음 접속 시 바로 확인
    const interval = setInterval(checkActiveQuestion, 1500); // 1.5초마다 자동 새로고침
    return () => clearInterval(interval);
  }, [roomId]);

  if (!activeQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">질문 대기 중</h2>
        <p className="text-slate-500">발표자가 질문을 시작하면 이 화면이 자동으로 업데이트됩니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 mt-10 border border-slate-100">
        <div className="text-sm font-bold text-violet-600 mb-4 bg-violet-50 w-fit px-3 py-1 rounded-full">
          {activeQuestion.type === 'word_cloud' ? '☁️ 단어구름' : activeQuestion.type === 'multiple_choice' ? '📊 객관식' : '💬 익명 Q&A'}
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-8 leading-snug">{activeQuestion.title}</h1>
        
        {/* 질문 타입에 따른 입력폼 자리 */}
        <div className="space-y-4">
          {activeQuestion.type === 'multiple_choice' ? (
            activeQuestion.options?.map((opt: string, idx: number) => (
              <button key={idx} className="w-full p-4 text-left border-2 border-slate-200 rounded-xl hover:border-violet-500 hover:bg-violet-50 transition font-medium text-slate-700">
                {opt}
              </button>
            ))
          ) : (
            <div>
              <input type="text" className="w-full border-2 border-slate-200 p-4 rounded-xl mb-4 focus:outline-none focus:border-violet-500" placeholder="답변을 입력하세요..." />
              <button className="w-full bg-violet-600 text-white font-bold py-4 rounded-xl hover:bg-violet-700 transition">제출하기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
