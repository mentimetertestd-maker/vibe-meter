'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // 💡 주소에서 방 번호를 정확히 가져오기 위한 도구
import { supabase } from '@/lib/supabase';

export default function DisplayPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joinUrl, setJoinUrl] = useState('');

  // 1. 현재 사이트 주소를 기반으로 참여(Join) 링크 생성
  useEffect(() => {
    if (typeof window !== 'undefined' && roomId) {
      // 나중에 만들 참여자용 페이지 주소 (예: https://내사이트.com/join/방번호)
      setJoinUrl(`${window.location.origin}/join/${roomId}`);
    }
  }, [roomId]);

  // 2. 방 번호(roomId)에 맞는 질문 목록 가져오기
  useEffect(() => {
    if (!roomId) return;

    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('room_id', roomId)
        .order('sort_order', { ascending: true });

      if (data) setQuestions(data);
      setLoading(false);
    };
    fetchQuestions();
  }, [roomId]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-950 text-white text-2xl">로딩중...</div>;
  }

  if (questions.length === 0) {
    return <div className="flex h-screen items-center justify-center bg-slate-950 text-white text-2xl">이 방에는 아직 등록된 질문이 없습니다.</div>;
  }

  const currentQ = questions[currentIndex];

  const nextSlide = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const prevSlide = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans selection:bg-violet-500">
      {/* 🚀 상단 헤더 (여기에 QR코드와 참여 주소가 들어갑니다!) */}
      <div className="p-4 md:p-6 flex justify-between items-center border-b border-slate-800 bg-slate-900 shadow-md">
        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
          Vibe Meter
        </div>
        
        <div className="flex items-center gap-6">
          {/* QR 코드 및 접속 안내 영역 */}
          {joinUrl && (
            <div className="flex items-center gap-4 bg-slate-800 border border-slate-700 px-4 py-2 rounded-2xl shadow-lg">
              <div className="text-right hidden md:block">
                <div className="text-xs text-slate-400 mb-1">스마트폰 카메라로 참여하기</div>
                <div className="text-sm font-bold text-violet-300 tracking-wide">{joinUrl.replace(/^https?:\/\//, '')}</div>
              </div>
              {/* 무료 QR 생성 API 사용 (설치 불필요) */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(joinUrl)}`} 
                alt="참여용 QR코드" 
                className="w-14 h-14 rounded-lg bg-white p-1"
              />
            </div>
          )}
          
          <div className="text-slate-400 font-bold bg-slate-800 px-5 py-2.5 rounded-full border border-slate-700">
            {currentIndex + 1} / {questions.length}
          </div>
        </div>
      </div>

      {/* 중앙 메인 질문 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        {/* 배경 장식 효과 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="inline-block text-sm font-bold text-violet-300 bg-violet-900/50 border border-violet-700/50 px-5 py-2 rounded-full mb-8 shadow-inner">
            {currentQ.type === 'word_cloud' ? '☁️ 단어구름' : currentQ.type === 'multiple_choice' ? '📊 객관식' : '💬 익명 Q&A'}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-16 leading-tight max-w-5xl break-keep">
            {currentQ.title}
          </h1>
          
          {/* 나중에 투표 결과 차트가 들어갈 자리 */}
          <div className="text-slate-500 text-xl font-medium animate-pulse flex items-center justify-center gap-3">
            <span className="w-3 h-3 rounded-full bg-violet-500"></span>
            참가자들의 응답을 기다리고 있습니다...
            <span className="w-3 h-3 rounded-full bg-violet-500"></span>
          </div>
        </div>
      </div>

      {/* 하단 슬라이드 조종 버튼 */}
      <div className="p-6 md:p-8 flex justify-center gap-6 bg-slate-900 border-t border-slate-800 relative z-20">
        <button 
          onClick={prevSlide}
          disabled={currentIndex === 0}
          className="px-8 py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl font-bold transition text-lg flex items-center gap-2 border border-slate-700"
        >
          ◀ 이전
        </button>
        <button 
          onClick={nextSlide}
          disabled={currentIndex === questions.length - 1}
          className="px-8 py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl font-bold transition text-lg flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
        >
          다음 ▶
        </button>
      </div>
    </div>
  );
}
