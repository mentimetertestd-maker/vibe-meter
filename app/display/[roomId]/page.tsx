'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DisplayPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<any>(null);
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
    const fetchData = async () => {
      const { data: roomData } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      if (roomData) setRoom(roomData);

      const { data: qData } = await supabase.from('questions').select('*').eq('room_id', roomId).order('sort_order', { ascending: true });
      if (qData) setQuestions(qData);
      setLoading(false);
    };
    fetchData();
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

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-white text-xl">로딩중...</div>;
  if (questions.length === 0) return <div className="flex h-screen items-center justify-center bg-slate-950 text-white text-xl">등록된 질문이 없습니다.</div>;

  const nextSlide = () => { if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1); };
  const prevSlide = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };

  const isLight = room?.theme === 'light';

  // 단어 빈도수 분석
  const getWordCloudData = () => {
    const counts: { [key: string]: number } = {};
    answers.forEach((ans) => {
      const word = ans.answer_text.trim();
      if (word) counts[word] = (counts[word] || 0) + 1;
    });
    return Object.entries(counts).map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count);
  };

  const wordList = getWordCloudData();

  const getRandomPosition = (index: number, text: string) => {
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const top = 22 + ((hash * 13 + index * 37) % 58);
    const left = 12 + ((hash * 17 + index * 43) % 76);
    return { top: `${top}%`, left: `${left}%` };
  };

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden transition-colors duration-500 ${isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'}`}>
      {showBigQR && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm" onClick={() => setShowBigQR(false)}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(joinUrl)}`} alt="큰 QR코드" className="w-80 h-80 md:w-96 md:h-96 rounded-3xl bg-white p-4 shadow-2xl" />
          <p className="mt-8 text-2xl font-bold text-white/80 animate-pulse">화면을 터치하면 닫힙니다</p>
        </div>
      )}

      {/* 상단 헤더 */}
      <div className={`p-5 md:p-6 flex justify-between items-center border-b z-30 transition-colors ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
        <div className="flex items-center gap-4">
          <div className="text-2xl md:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600">Isaiah6tyOne</div>
          {room?.title && (
            <div className={`text-sm font-bold px-3.5 py-1.5 rounded-xl border ${isLight ? 'bg-white border-slate-200 text-slate-700 shadow-sm' : 'bg-slate-800 border-slate-700 text-slate-200'}`}>
              {room.title}
            </div>
          )}
        </div>
        <div className="flex items-center gap-6">
          {joinUrl && (
            <div onClick={() => setShowBigQR(true)} className={`flex items-center gap-4 px-4 py-2 rounded-2xl shadow-sm cursor-pointer border transition ${isLight ? 'bg-white border-slate-200 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
              <div className="text-right hidden md:block">
                <div className="text-[11px] text-slate-400 mb-0.5 font-medium">스마트폰으로 참여하기</div>
                <div className="text-xs font-bold text-violet-600">{joinUrl.replace(/^https?:\/\//, '')}</div>
              </div>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(joinUrl)}`} className="w-12 h-12 rounded-lg bg-white p-1" />
            </div>
          )}
          <div className={`font-bold px-5 py-2.5 rounded-full border text-sm ${isLight ? 'bg-white border-slate-200 text-slate-700 shadow-sm' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
            {currentIndex + 1} / {questions.length}
          </div>
        </div>
      </div>

      {/* 중앙 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        
        <div className="absolute top-6 z-20 max-w-4xl px-4 pointer-events-none">
          <div className={`inline-block text-xs font-extrabold px-4 py-1.5 rounded-full mb-3 shadow-sm ${isLight ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-violet-900/60 text-violet-300 border border-violet-700/50'}`}>
            {currentQ.type === 'word_cloud' ? '☁️ 단어구름' : currentQ.type === 'multiple_choice' ? '📊 객관식' : '💬 익명 Q&A'}
          </div>
          <h1 className={`text-3xl md:text-5xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{currentQ.title}</h1>
        </div>

        {/* 1. 단어 구름 타입 */}
        {currentQ.type === 'word_cloud' && (
          <div className="absolute inset-0 pt-28 pb-20 px-10 flex items-center justify-center overflow-hidden">
            {answers.length === 0 ? (
              <div className="text-slate-400 text-xl font-medium animate-pulse flex items-center gap-3 z-10">
                <span className="w-3 h-3 rounded-full bg-violet-600"></span>참가자들의 답변을 기다리고 있습니다...<span className="w-3 h-3 rounded-full bg-violet-600"></span>
              </div>
            ) : (
              <div className="w-full h-full relative">
                {wordList.map((item, idx) => {
                  const pos = getRandomPosition(idx, item.text);
                  let sizeClass = isLight ? "text-xl md:text-2xl text-slate-600 font-semibold" : "text-xl md:text-2xl text-slate-300 opacity-80 font-semibold";
                  let zIndex = "z-10";

                  if (item.count >= 5) {
                    sizeClass = "text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 drop-shadow-xl animate-pulse";
                    zIndex = "z-40";
                  } else if (item.count >= 3) {
                    sizeClass = "text-4xl md:text-6xl font-extrabold text-violet-600";
                    zIndex = "z-30";
                  } else if (item.count === 2) {
                    sizeClass = "text-2xl md:text-4xl font-bold text-violet-500";
                    zIndex = "z-20";
                  }

                  return (
                    <div 
                      key={idx} 
                      style={{ position: 'absolute', top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }} 
                      className={`absolute transition-all duration-700 select-none whitespace-nowrap flex items-center gap-2 ${sizeClass} ${zIndex}`}
                    >
                      <span>{item.text}</span>
                      {item.count > 1 && (
                        <span className={`text-xs md:text-sm px-2 py-0.5 rounded-full font-mono font-bold ${isLight ? 'bg-violet-100 text-violet-700' : 'bg-violet-900 text-violet-200'}`}>
                          {item.count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. 객관식 타입 */}
        {currentQ.type === 'multiple_choice' && (
          <div className="w-full max-w-2xl mt-16 space-y-4 z-10">
            {currentQ.options?.map((opt: string, idx: number) => {
              const count = answers.filter(a => a.answer_text === opt).length;
              const percent = answers.length > 0 ? Math.round((count / answers.length) * 100) : 0;
              return (
                <div key={idx} className={`border p-6 rounded-2xl relative overflow-hidden text-left shadow-sm transition ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                  <div className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${isLight ? 'bg-violet-100' : 'bg-violet-600/30'}`} style={{ width: `${percent}%` }}></div>
                  <div className="relative z-10 flex justify-between font-bold text-xl">
                    <span>{opt}</span>
                    <span className="text-violet-600">{count}명 ({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. Q&A 타입 */}
        {currentQ.type === 'qna' && (
          <div className="w-full max-w-4xl mt-16 max-h-[450px] overflow-y-auto flex flex-wrap gap-4 justify-center z-10 p-2">
            {answers.length === 0 ? (
              <p className="text-slate-400 text-lg">아직 제출된 답변이 없습니다.</p>
            ) : (
              answers.map((ans, idx) => (
                <div key={idx} className={`border px-6 py-4 rounded-2xl text-xl font-semibold shadow-sm ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'}`}>
                  {ans.answer_text}
                </div>
              ))
            )}
          </div>
        )}

        <div className={`absolute bottom-6 z-20 text-xs font-bold px-4 py-2 rounded-full border shadow-sm ${isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
          총 참여 응답: <span className="text-violet-600 font-black">{answers.length}</span>개
        </div>
      </div>

      {/* 하단 슬라이드 조종 */}
      <div className={`p-5 flex justify-center gap-6 border-t z-30 transition-colors ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
        <button onClick={prevSlide} disabled={currentIndex === 0} className={`px-8 py-3.5 rounded-2xl font-bold transition text-base border disabled:opacity-30 ${isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'}`}>◀ 이전</button>
        <button onClick={nextSlide} disabled={currentIndex === questions.length - 1} className="px-8 py-3.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-30 rounded-2xl font-bold transition text-base text-white shadow-md shadow-violet-200">다음 ▶</button>
      </div>
    </div>
  );
}
