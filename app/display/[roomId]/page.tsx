'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DisplayPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joinUrl, setJoinUrl] = useState('');
  const [showBigQR, setShowBigQR] = useState(false); // 💡 큰 QR코드 팝업 상태

  useEffect(() => {
    if (typeof window !== 'undefined' && roomId) {
      setJoinUrl(`${window.location.origin}/join/${roomId}`);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const fetchQuestions = async () => {
      const { data } = await supabase.from('questions').select('*').eq('room_id', roomId).order('sort_order', { ascending: true });
      if (data) setQuestions(data);
      setLoading(false);
    };
    fetchQuestions();
  }, [roomId]);

  // 💡 핵심: 발표자가 슬라이드를 넘길 때마다 현재 질문 ID를 DB에 업데이트해서 참가자 폰과 동기화!
  useEffect(() => {
    if (questions.length > 0 && roomId) {
      const activeQuestionId = questions[currentIndex].id;
      supabase.from('rooms').update({ active_question_id: activeQuestionId }).eq('id', roomId).then();
    }
  }, [currentIndex, questions, roomId]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-white">로딩중...</div>;
  if (questions.length === 0) return <div className="flex h-screen items-center justify-center bg-slate-950 text-white">질문이 없습니다.</div>;

  const currentQ = questions[currentIndex];
  const nextSlide = () => { if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1); };
  const prevSlide = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans">
      {/* 큰 QR코드 팝업 */}
      {showBigQR && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm"
          onClick={() => setShowBigQR(false)}
        >
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(joinUrl)}`} 
            alt="큰 QR코드" 
            className="w-80 h-80 md:w-96 md:h-96 rounded-3xl bg-white p-4 shadow-2xl"
          />
          <p className="mt-8 text-2xl font-bold text-white/80 animate-pulse">화면을 터치하면 닫힙니다</p>
        </div>
      )}

      <div className="p-4 md:p-6 flex justify-between items-center border-b border-slate-800 bg-slate-900 shadow-md">
        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Vibe Meter</div>
        <div className="flex items-center gap-6">
          {joinUrl && (
            <div 
              onClick={() => setShowBigQR(true)} // 💡 클릭하면 큰 QR 띄우기
              className="flex items-center gap-4 bg-slate-800 border border-slate-700 px-4 py-2 rounded-2xl shadow-lg cursor-pointer hover:bg-slate-700 transition"
            >
              <div className="text-right hidden md:block">
                <div className="text-xs text-slate-400 mb-1">스마트폰 카메라로 참여하기 (클릭시 확대)</div>
                <div className="text-sm font-bold text-violet-300">{joinUrl.replace(/^https?:\/\//, '')}</div>
              </div>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(joinUrl)}`} className="w-14 h-14 rounded-lg bg-white p-1" />
            </div>
          )}
          <div className="text-slate-400 font-bold bg-slate-800 px-5 py-2.5 rounded-full">{currentIndex + 1} / {questions.length}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <div className="inline-block text-sm font-bold text-violet-300 bg-violet-900/50 border border-violet-700/50 px-5 py-2 rounded-full mb-8">
            {currentQ.type === 'word_cloud' ? '☁️ 단어구름' : currentQ.type === 'multiple_choice' ? '📊 객관식' : '💬 익명 Q&A'}
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-16 leading-tight max-w-5xl">{currentQ.title}</h1>
          <div className="text-slate-500 text-xl font-medium animate-pulse flex items-center justify-center gap-3">
            <span className="w-3 h-3 rounded-full bg-violet-500"></span>참가자들의 응답을 기다리고 있습니다...<span className="w-3 h-3 rounded-full bg-violet-500"></span>
          </div>
        </div>
      </div>

      <div className="p-6 flex justify-center gap-6 bg-slate-900 border-t border-slate-800 relative z-20">
        <button onClick={prevSlide} disabled={currentIndex === 0} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-2xl font-bold transition text-lg flex items-center gap-2 border border-slate-700">◀ 이전</button>
        <button onClick={nextSlide} disabled={currentIndex === questions.length - 1} className="px-8 py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 rounded-2xl font-bold transition text-lg flex items-center gap-2">다음 ▶</button>
      </div>
    </div>
  );
}
