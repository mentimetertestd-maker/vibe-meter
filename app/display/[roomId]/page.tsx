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
      const { data } = await supabase.from('answers').select('*').eq('question_id', currentQ.id).order('created_at', { ascending: true });
      if (data) setAnswers(data);
    };
    fetchAnswers();
    const interval = setInterval(fetchAnswers, 1000);
    return () => clearInterval(interval);
  }, [currentQ?.id]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white text-xl font-bold">로딩중...</div>;
  if (questions.length === 0) return <div className="flex h-screen items-center justify-center bg-black text-white text-xl font-bold">등록된 질문이 없습니다.</div>;

  const nextSlide = () => { if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1); };
  const prevSlide = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };

  const isLight = room?.theme === 'light';
  const textColor = isLight ? 'text-slate-900' : 'text-white';
  const subTextColor = isLight ? 'text-slate-500' : 'text-neutral-400';
  const bgColor = isLight ? 'bg-white' : 'bg-black';
  const borderColor = isLight ? 'border-slate-200' : 'border-neutral-800';
  const cardBg = isLight ? 'bg-white' : 'bg-neutral-900/60';

  const getWordCloudData = () => {
    const counts: { [key: string]: number } = {};
    answers.forEach((ans) => {
      const word = ans.answer_text.trim();
      if (word) counts[word] = (counts[word] || 0) + 1;
    });
    return Object.entries(counts).map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count);
  };

  const wordList = getWordCloudData();

  const getPosition = (index: number, text: string) => {
    if (index === 0) return { top: '50%', left: '50%' };
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const sectors = [
      { top: 25, left: 20 }, { top: 25, left: 75 },
      { top: 75, left: 25 }, { top: 75, left: 75 },
      { top: 50, left: 15 }, { top: 50, left: 85 },
      { top: 20, left: 50 }, { top: 80, left: 50 }
    ];
    const sector = sectors[index % sectors.length];
    const jitterTop = sector.top + ((hash % 7) - 3);
    const jitterLeft = sector.left + (((hash * 3) % 7) - 3);
    return { top: `${jitterTop}%`, left: `${jitterLeft}%` };
  };

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden transition-colors duration-500 ${bgColor} ${textColor}`}>
      {showBigQR && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm" onClick={() => setShowBigQR(false)}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(joinUrl)}`} alt="큰 QR코드" className="w-80 h-80 md:w-96 md:h-96 rounded-3xl bg-white p-4 shadow-2xl" />
          <p className="mt-8 text-2xl font-bold text-white/80">화면을 터치하면 닫힙니다</p>
        </div>
      )}

      {/* 상단 헤더 */}
      <div className={`p-4 md:p-6 flex justify-between items-center border-b z-30 flex-shrink-0 ${borderColor}`}>
        <div className="flex items-center gap-4">
          <div className="text-xl md:text-2xl font-black tracking-tight">Isaiah6tyOne</div>
          {room?.title && <div className={`text-xs md:text-sm font-bold px-3 py-1 rounded-xl border ${borderColor} ${subTextColor}`}>{room.title}</div>}
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          {joinUrl && (
            <div onClick={() => setShowBigQR(true)} className={`flex items-center gap-3 px-3.5 py-1.5 rounded-2xl shadow-sm cursor-pointer border transition ${borderColor} hover:opacity-70`}>
              <div className="text-right hidden md:block">
                <div className={`text-[10px] font-medium ${subTextColor}`}>스마트폰으로 참여하기</div>
                <div className="text-xs font-bold">{joinUrl.replace(/^https?:\/\//, '')}</div>
              </div>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(joinUrl)}`} className="w-10 h-10 rounded-lg bg-white p-1" />
            </div>
          )}
          <div className={`font-bold px-4 py-2 rounded-full border text-xs md:text-sm ${borderColor} ${subTextColor}`}>{currentIndex + 1} / {questions.length}</div>
        </div>
      </div>

      {/* 질문 제목 */}
      <div className="py-8 px-6 text-center flex-shrink-0 w-full max-w-5xl mx-auto z-20">
        <div className={`inline-block text-xs font-bold px-3.5 py-1 rounded-full mb-3 border ${borderColor} ${subTextColor}`}>
          {currentQ.type === 'word_cloud' ? '☁️ 단어구름' : currentQ.type === 'multiple_choice' ? '📊 객관식' : '💬 익명 Q&A'}
        </div>
        <h1 className={`text-3xl md:text-5xl font-black tracking-tight leading-tight ${textColor}`}>{currentQ.title}</h1>
      </div>

      {/* 콘텐츠 표시 (단어구름 / 객관식 / Q&A) */}
      <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center px-6 pb-16">
        {currentQ.type === 'word_cloud' && (
          <div className="w-full h-full relative">
            {answers.length === 0 ? (
              <div className={`h-full flex items-center justify-center text-lg md:text-xl font-medium ${subTextColor}`}>참가자들의 답변을 기다리고 있습니다...</div>
            ) : (
              wordList.map((item, idx) => {
                const pos = getPosition(idx, item.text);
                let sizeClass = "text-xl md:text-2xl font-semibold opacity-80";
                let zIndex = "z-10";

                if (idx === 0) { sizeClass = "text-6xl md:text-8xl font-black opacity-100 drop-shadow-lg"; zIndex = "z-50"; }
                else if (item.count >= 3) { sizeClass = "text-4xl md:text-6xl font-extrabold opacity-95"; zIndex = "z-30"; }
                else if (item.count === 2) { sizeClass = "text-2xl md:text-4xl font-bold opacity-90"; zIndex = "z-20"; }

                return (
                  <div key={idx} style={{ position: 'absolute', top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }} className={`absolute select-none whitespace-nowrap ${sizeClass} ${textColor} ${zIndex}`}>
                    <span>{item.text}</span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {currentQ.type === 'multiple_choice' && (
          <div className="w-full max-w-2xl space-y-3.5 z-10 overflow-y-auto max-h-full py-2">
            {currentQ.options?.map((opt: string, idx: number) => {
              const count = answers.filter(a => a.answer_text === opt).length;
              const percent = answers.length > 0 ? Math.round((count / answers.length) * 100) : 0;
              return (
                <div key={idx} className={`border p-5 rounded-2xl relative overflow-hidden text-left shadow-sm ${cardBg} ${borderColor}`}>
                  <div className={`absolute left-0 top-0 bottom-0 ${isLight ? 'bg-slate-200' : 'bg-neutral-800'}`} style={{ width: `${percent}%` }}></div>
                  <div className="relative z-10 flex justify-between font-bold text-lg md:text-xl">
                    <span>{opt}</span>
                    <span className={subTextColor}>{count}명 ({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentQ.type === 'qna' && (
          <div className="w-full max-w-4xl h-full overflow-y-auto flex flex-col items-center gap-4 z-10 p-2">
            {answers.length === 0 ? (
              <div className={`h-full flex items-center justify-center text-lg ${subTextColor}`}>아직 제출된 답변이 없습니다.</div>
            ) : (
              answers.map((ans, idx) => (
                <div key={idx} className={`w-full border px-6 py-5 rounded-2xl text-lg md:text-xl font-medium text-left shadow-sm ${cardBg} ${borderColor}`}>
                  {ans.answer_text}
                </div>
              ))
            )}
          </div>
        )}

        <div className={`absolute bottom-3 z-20 text-xs font-bold px-4 py-2 rounded-full border shadow-sm ${cardBg} ${borderColor} ${subTextColor}`}>
          총 참여 응답: <span className={`font-black ${textColor}`}>{answers.length}</span>개
        </div>
      </div>

      {/* 하단 슬라이드 넘김 버튼 */}
      <div className={`p-4 flex justify-center gap-6 border-t z-30 flex-shrink-0 ${borderColor}`}>
        <button onClick={prevSlide} disabled={currentIndex === 0} className={`px-7 py-3 rounded-2xl font-bold transition text-sm border disabled:opacity-30 ${isLight ? 'bg-white border-slate-300 hover:bg-slate-100' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}>◀ 이전</button>
        <button onClick={nextSlide} disabled={currentIndex === questions.length - 1} className={`px-7 py-3 rounded-2xl font-bold transition text-sm disabled:opacity-30 ${isLight ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>다음 ▶</button>
      </div>
    </div>
  );
}
