'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; // 💡 supabase 경로가 다르면 수정해주세요

export default function DisplayPage({ params }: { params: { roomId: string } }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('room_id', params.roomId)
        .order('sort_order', { ascending: true }); // 슬라이드 순서대로 가져오기

      if (data) setQuestions(data);
      setLoading(false);
    };
    fetchQuestions();
  }, [params.roomId]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-900 text-white text-2xl">로딩중...</div>;
  }

  if (questions.length === 0) {
    return <div className="flex h-screen items-center justify-center bg-slate-900 text-white text-2xl">이 방에는 아직 등록된 질문이 없습니다.</div>;
  }

  const currentQ = questions[currentIndex];

  const nextSlide = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const prevSlide = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white font-sans selection:bg-violet-500">
      {/* 상단 헤더 */}
      <div className="p-6 flex justify-between items-center border-b border-slate-800">
        <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
          Vibe Meter
        </div>
        <div className="text-slate-400 font-medium bg-slate-800 px-4 py-1.5 rounded-full">
          Slide {currentIndex + 1} / {questions.length}
        </div>
      </div>

      {/* 중앙 메인 질문 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
        <div className="text-sm font-bold text-violet-300 bg-violet-900/40 px-4 py-2 rounded-full mb-8 shadow-inner">
          {currentQ.type === 'word_cloud' ? '☁️ 단어구름' : currentQ.type === 'multiple_choice' ? '📊 객관식' : '💬 익명 Q&A'}
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-16 leading-tight max-w-5xl break-keep">
          {currentQ.title}
        </h1>
        
        <div className="text-slate-500 text-xl animate-pulse font-medium">
          참가자들의 응답을 기다리고 있습니다...
        </div>
      </div>

      {/* 하단 슬라이드 조종 버튼 */}
      <div className="p-8 flex justify-center gap-6 bg-slate-950/50">
        <button 
          onClick={prevSlide}
          disabled={currentIndex === 0}
          className="px-8 py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl font-bold transition text-lg flex items-center gap-2"
        >
          ◀ 이전
        </button>
        <button 
          onClick={nextSlide}
          disabled={currentIndex === questions.length - 1}
          className="px-8 py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl font-bold transition text-lg flex items-center gap-2 shadow-lg shadow-violet-900/50"
        >
          다음 ▶
        </button>
      </div>
    </div>
  );
}
