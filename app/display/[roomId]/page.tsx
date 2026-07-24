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

  // 단어 빈도수 분석 및 정렬
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
      .sort((a, b) => b.count - a.count);
  };

  const wordList = getWordCloudData();

  // 무작위 위치를 생성하기 위한 간단한 난수 생성기 (단어별로 고정된 위치 부여)
  const getRandomPosition = (index: number, total: number) => {
    // 1등 단어는 무조건 중앙 근처
    if (index === 0) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    
    // 나머지는 화면 전체에 골고루 퍼지도록 배치 (인덱스 기반 해시)
    const seed = index * 97;
    const top = 20 + (seed % 60); // 20% ~ 80% 사이
    const left = 15 + ((seed * 31) % 70); // 15% ~ 85% 사이
    return { top: `${top}%`, left: `${left}%`, transform: 'translate(-50%, -50%)' };
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden">
      {showBigQR && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm" onClick={() => setShowBigQR(false)}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(joinUrl)}`} alt="큰 QR코드" className="w-80 h-80 md:w-96 md:h-96 rounded-3xl bg-white p-4 shadow-2xl" />
          <p className="mt-8 text-2xl font-bold text-white/80 animate-pulse">화면을 터치하면 닫힙니다</p>
        </div>
      )}

      {/* 상단 헤더 */}
      <div className="p-4 md:p-6 flex justify-between items-center border-b border-slate-800 bg-slate-900 shadow-md z-30">
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

      {/* 중앙 메인 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        
        {/* 상단에 작게 고정되는 질문 제목 */}
        <div className="absolute top-6 z-20 max-w-4xl px-4 pointer-events-none">
          <div className="inline-block text-xs font-bold text-violet-300 bg-violet-900/60 border border-violet-700/50 px-4 py-1.5 rounded-full mb-2 shadow-inner">
            ☁️ 단어구름
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-200 drop-shadow-md">{currentQ.title}</h1>
        </div>

        {/* 💡 멘티미터 스타일: 네모 박스 없이 화면 전체에 무작위로 떠다니는 단어 구름 공간 */}
        <div className="absolute inset-0 pt-28 pb-20 px-10 flex items-center justify-center overflow-hidden">
          {answers.length === 0 ? (
            <div className="text-slate-500 text-xl font-medium animate-pulse flex items-center gap-3 z-10">
              <span className="w-3 h-3 rounded-full bg-violet-500"></span>
              참가자들의 단어 입력을 기다리고 있습니다...
              <span className="w-3 h-3 rounded-full bg-violet-500"></span>
            </div>
          ) : (
            <div className="w-full h-full relative">
              {wordList.map((item, idx) => {
                const pos = getRandomPosition(idx, wordList.length);
                
                // 빈도수에 따른 크기 설정 (1등은 초대형, 나머지는 크기 차등 적용)
                let fontSize = "text-xl md:text-2xl opacity-70 text-slate-300";
                let zIndex = "z-0";
                let extraEffect = "";

                if (idx === 0) {
                  // 1등 단어: 중앙에서 가장 크고 화려하게 빛남
                  fontSize = "text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-400 to-pink-400 drop-shadow-[0_0_35px_rgba(217,70,239,0.5)]";
                  zIndex = "z-30";
                  extraEffect = "scale-110 animate-pulse";
                } else if (idx === 1 || idx === 2) {
                  // 2~3등 단어: 큼직하고 선명함
                  fontSize = "text-4xl md:text-5xl font-bold text-violet-200 drop-shadow-md";
                  zIndex = "z-20";
                } else if (item.count > 1) {
                  // 복수 선택된 단어
                  fontSize = "text-2xl md:text-3xl font-semibold text-slate-200 opacity-90";
                  zIndex = "z-10";
                }

                return (
                  <div
                    key={idx}
                    style={{ position: 'absolute', top: pos.top, left: pos.left, transform: pos.transform }}
                    className={`absolute transition-all duration-700 select-none whitespace-nowrap flex items-center gap-2 ${fontSize} ${zIndex} ${extraEffect}`}
                  >
                    <span>{item.text}</span>
                    {item.count > 1 && (
                      <span className="text-xs md:text-sm bg-violet-600/60 text-violet-100 px-2 py-0.5 rounded-full font-mono opacity-80">
                        {item.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 하단 참여 응답 수 안내 */}
        <div className="absolute bottom-6 z-20 text-slate-400 text-sm font-medium bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-800">
          총 참여 응답 수: <span className="text-violet-400 font-bold">{answers.length}</span>개
        </div>
      </div>

      {/* 하단 슬라이드 조종 버튼 */}
      <div className="p-6 flex justify-center gap-6 bg-slate-900 border-t border-slate-800 relative z-30">
        <button onClick={prevSlide} disabled={currentIndex === 0} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-2xl font-bold transition text-lg flex items-center gap-2 border border-slate-700">◀ 이전</button>
        <button onClick={nextSlide} disabled={currentIndex === questions.length - 1} className="px-8 py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 rounded-2xl font-bold transition text-lg flex items-center gap-2">다음 ▶</button>
      </div>
    </div>
  );
}
