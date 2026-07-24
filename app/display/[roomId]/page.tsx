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
  const [showBigQR, setShowBigQR] = useState(false);
  const [answers, setAnswers] = useState<any[]>([]);

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

  useEffect(() => {
    if (questions.length > 0 && roomId) {
      const activeQuestionId = questions[currentIndex].id;
      supabase.from('rooms').update({ active_question_id: activeQuestionId }).eq('id', roomId).then();
    }
  }, [currentIndex, questions, roomId]);

  const currentQ = questions[currentIndex];

  useEffect(() => {
    if (!currentQ?.id) return;

    const fetchAnswers = async () => {
      const { data } = await supabase.from('answers').select('*').eq('question_id', currentQ.id);
      if (data) setAnswers(data);
    };

    fetchAnswers();
    const interval = setInterval(fetchAnswers, 1000);
    return () => clearInterval(interval);
  }, [currentQ?.id]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-white">로딩중...</div>;
  if (questions.length === 0) return <div className="flex h-screen items-center justify-center bg-slate-950 text-white">이 방에는 아직 등록된 질문이 없습니다.</div>;

  const nextSlide = () => { if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1); };
  const prevSlide = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };

  // 💡 [단어 구름 전용 분석 로직] 똑같은 단어 개수를 세고 많이 나온 순서대로 정렬
  const getWordCloudData = () => {
    const counts: { [key: string]: number } = {};
    answers.forEach((ans) => {
      const word = ans.answer_text.trim();
      if (word) {
        counts[word] = (counts[word] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count); // 많이 나온 단어가 앞으로 오도록 정렬
  };

  const wordList = getWordCloudData();

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden">
      {showBigQR && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm" onClick={() => setShowBigQR(false)}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(joinUrl)}`} alt="큰 QR코드" className="w-80 h-80 md:w-96 md:h-96 rounded-3xl bg-white p-4 shadow-2xl" />
          <p className="mt-8 text-2xl font-bold text-white/80 animate-pulse">화면을 터치하면 닫힙니다</p>
        </div>
      )}

      {/* 상단 헤더 */}
      <div className="p-4 md:p-6 flex justify-between items-center border-b border-slate-800 bg-slate-900 shadow-md z-10">
        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Vibe Meter</div>
        <div className="flex items-center gap-6">
          {joinUrl && (
            <div onClick={() => setShowBigQR(true)} className="flex items-center gap-4 bg-slate-800 border border-slate-700 px-4 py-2 rounded-2xl shadow-lg cursor-pointer hover:bg-slate-700 transition">
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

      {/* 중앙 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-violet-600/15 blur-[140px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 max-w-5xl w-full flex flex-col items-center">
          <div className="inline-block text-sm font-bold text-violet-300 bg-violet-900/50 border border-violet-700/50 px-5 py-2 rounded-full mb-4 shadow-inner">
            {currentQ.type === 'word_cloud' ? '☁️ 단어구름' : currentQ.type === 'multiple_choice' ? '📊 객관식' : '💬 익명 Q&A'}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold mb-8 leading-tight max-w-4xl text-slate-200">{currentQ.title}</h1>

          {/* 💡 단어 구름 전용 시각화 박스 (많이 입력된 단어일수록 중앙에 크게 강조!) */}
          <div className="bg-slate-900/60 border border-slate-800/80 w-full h-[420px] rounded-3xl p-8 flex flex-wrap items-center justify-center gap-4 overflow-hidden shadow-2xl relative backdrop-blur-md">
            
            {answers.length === 0 ? (
              <div className="text-slate-500 text-xl font-medium animate-pulse flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-violet-500"></span>
                참가자들의 단어 입력을 기다리고 있습니다...
                <span className="w-3 h-3 rounded-full bg-violet-500"></span>
              </div>
            ) : (
              wordList.map((item, idx) => {
                // 1등(가장 많이 나온 단어)은 엄청 크게, 나머지는 빈도수에 비례해 크기 조절
                const isTop1 = idx === 0;
                const isTop2or3 = idx === 1 || idx === 2;

                let sizeStyle = "text-xl md:text-2xl px-5 py-2.5 bg-slate-800/80 text-slate-300 border border-slate-700";
                
                if (isTop1) {
                  // 1등 단어: 화면 한가운데서 가장 거대하고 보라빛으로 빛남!
                  sizeStyle = "text-5xl md:text-7xl px-10 py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black shadow-[0_0_40px_rgba(147,51,234,0.6)] border-2 border-violet-400 scale-105 z-20 animate-bounce";
                } else if (isTop2or3) {
                  // 2~3등 단어: 큼직하고 세련된 보라 테두리
                  sizeStyle = "text-3xl md:text-4xl px-7 py-3 bg-violet-950/80 text-violet-200 font-bold border border-violet-500/60 shadow-lg z-10";
                }

                return (
                  <div 
                    key={idx} 
                    className={`rounded-2xl transition-all duration-500 flex items-center gap-3 ${sizeStyle}`}
                  >
                    <span>{item.text}</span>
                    <span className="text-xs md:text-sm opacity-60 bg-black/30 px-2.5 py-1 rounded-full font-mono">
                      {item.count}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="mt-4 text-slate-400 text-sm font-medium">
            총 참여 응답 수: <span className="text-violet-400 font-bold">{answers.length}</span>개
          </div>
        </div>
      </div>

      {/* 하단 슬라이드 조종 버튼 */}
      <div className="p-6 flex justify-center gap-6 bg-slate-900 border-t border-slate-800 relative z-20">
        <button onClick={prevSlide} disabled={currentIndex === 0} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-2xl font-bold transition text-lg flex items-center gap-2 border border-slate-700">◀ 이전</button>
        <button onClick={nextSlide} disabled={currentIndex === questions.length - 1} className="px-8 py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 rounded-2xl font-bold transition text-lg flex items-center gap-2">다음 ▶</button>
      </div>
    </div>
  );
}
