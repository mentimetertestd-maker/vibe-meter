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
      // 💡 Q&A 답변이 입력된 순서대로 정렬되도록 .order('id') 추가
      const { data } = await supabase.from('answers').select('*').eq('question_id', currentQ.id).order('id', { ascending: true });
      if (data) setAnswers(data);
    };
    fetchAnswers();
    const interval = setInterval(fetchAnswers, 1000);
    return () => clearInterval(interval);
  }, [currentQ?.id]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white text-xl">로딩중...</div>;
  if (questions.length === 0) return <div className="flex h-screen items-center justify-center bg-black text-white text-xl">등록된 질문이 없습니다.</div>;

  const nextSlide = () => { if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1); };
  const prevSlide = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };

  const isLight = room?.theme === 'light';
  // 💡 무조건 블랙 or 화이트 (컬러 제거)
  const textColor = isLight ? 'text-slate-900' : 'text-white';
  const subTextColor = isLight ? 'text-slate-500' : 'text-neutral-400';
  const bgColor = isLight ? 'bg-white' : 'bg-black';
  const borderColor = isLight ? 'border-slate-200' : 'border-neutral-800';
  const cardBg = isLight ? 'bg-white' : 'bg-neutral-900/50';

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
      { top: 22, left: 20 }, { top: 25, left: 75 },
      { top: 75, left: 25 }, { top: 72, left: 80 },
      { top: 48, left: 15 }, { top: 52, left: 85 },
      { top: 20, left: 48 }, { top: 78, left: 52 }
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

      <div className={`p-5 md:p-6 flex justify-between items-center border-b z-30 transition-colors ${borderColor}`}>
        <div className="flex items-center gap-4">
          <div className="text-2xl md:text-3xl font-black tracking-tight">Isaiah6tyOne</div>
          {room?.title && (
            <div className={`text-sm font-bold px-3.5 py-1.5 rounded-xl border ${borderColor} ${subTextColor}`}>
              {room.title}
            </div>
          )}
        </div>
        <div className="flex items-center gap-6">
          {joinUrl && (
            <div onClick={() => setShowBigQR(true)} className={`flex items-center gap-4 px-4 py-2 rounded-2xl shadow-sm cursor-pointer border transition ${borderColor} hover:opacity-70`}>
              <div className="text-right hidden md:block">
                <div className={`text-[11px] font-medium ${subTextColor} mb-0.5`}>스마트폰으로 참여하기</div>
                <div className="text-xs font-bold">{joinUrl.replace(/^https?:\/\//, '')}</div>
              </div>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(joinUrl)}`} className="w-12 h-12 rounded-lg bg-white p-1" />
            </div>
          )}
          <div className={`font-bold px-5 py-2.5 rounded-full border text-sm ${borderColor} ${subTextColor}`}>
            {currentIndex + 1} / {questions.length}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        
        <div className="absolute top-10 z-20 w-full max-w-6xl px-4 pointer-events-none flex flex-col items-center">
          <div className={`inline-block text-xs font-bold px-4 py-1.5 rounded-full mb-3 border ${borderColor} ${subTextColor}`}>
            {currentQ.type === 'word_cloud' ? '☁️ 단어구름' : currentQ.type === 'multiple_choice' ? '📊 객관식' : '💬 익명 Q&A'}
          </div>
          {/* 💡 소제목 출력 부분 */}
          {currentQ.subtitle && (
            <h2 className={`text-xl md:text-2xl font-bold mb-3 ${subTextColor} tracking-wide`}>
              {currentQ.subtitle}
            </h2>
          )}
          <h1 className={`text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-snug whitespace-pre-wrap break-keep ${textColor}`}>
            {currentQ.title}
          </h1>
        </div>

        {currentQ.type === 'word_cloud' && (
          <div className="absolute inset-0 pt-48 pb-20 px-10 flex items-center justify-center overflow-hidden">
            {answers.length === 0 ? (
              <div className={`text-xl font-medium flex items-center gap-3 z-10 ${subTextColor}`}>
                참가자들의 답변을 기다리고 있습니다...
              </div>
            ) : (
              <div className="w-full h-full relative">
                {wordList.map((item, idx) => {
                  const pos = getPosition(idx, item.text);
                  // 💡 애니메이션 제거, 겹침 횟수 텍스트 제거, 크기 비례만 적용
                  let sizeClass = "text-2xl md:text-3xl font-semibold opacity-80";
                  let zIndex = "z-10";

                  if (idx === 0) {
                    sizeClass = "text-7xl md:text-9xl font-black drop-shadow-xl scale-110 opacity-100";
                    zIndex = "z-50";
                  } else if (item.count >= 3) {
                    sizeClass = "text-5xl md:text-7xl font-extrabold opacity-95";
                    zIndex = "z-30";
                  } else if (item.count === 2) {
                    sizeClass = "text-3xl md:text-4xl font-bold opacity-90";
                    zIndex = "z-20";
                  }

                  return (
                    <div key={idx} style={{ position: 'absolute', top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }} className={`absolute select-none whitespace-nowrap ${sizeClass} ${textColor} ${zIndex}`}>
                      <span>{item.text}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentQ.type === 'multiple_choice' && (
          <div className="w-full max-w-2xl mt-40 space-y-4 z-10">
            {currentQ.options?.map((opt: string, idx: number) => {
              const count = answers.filter(a => a.answer_text === opt).length;
              const percent = answers.length > 0 ? Math.round((count / answers.length) * 100) : 0;
              return (
                <div key={idx} className={`border p-6 rounded-2xl relative overflow-hidden text-left shadow-sm ${cardBg} ${borderColor}`}>
                  <div className={`absolute left-0 top-0 bottom-0 ${isLight ? 'bg-slate-200' : 'bg-neutral-800'}`} style={{ width: `${percent}%` }}></div>
                  <div className="relative z-10 flex justify-between font-bold text-xl">
                    <span>{opt}</span>
                    <span className={subTextColor}>{count}명 ({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentQ.type === 'qna' && (
          <div className="w-full max-w-5xl mt-40 max-h-[500px] overflow-y-auto flex flex-col items-center gap-5 z-10 p-4">
            {answers.length === 0 ? (
              <p className={`text-lg ${subTextColor}`}>아직 제출된 답변이 없습니다.</p>
            ) : (
              answers.map((ans, idx) => (
                <div key={idx} className={`w-full max-w-4xl border px-8 py-6 rounded-3xl text-xl font-medium text-left shadow-sm whitespace-pre-wrap break-keep leading-relaxed tracking-wide ${cardBg} ${borderColor}`}>
                  {ans.answer_text}
                </div>
              ))
            )}
          </div>
        )}

        <div className={`absolute bottom-6 z-20 text-xs font-bold px-5 py-2.5 rounded-full border shadow-sm ${cardBg} ${borderColor} ${subTextColor}`}>
          총 참여 응답: <span className={`font-black ${textColor}`}>{answers.length}</span>개
        </div>
      </div>

      <div className={`p-5 flex justify-center gap-6 border-t z-30 transition-colors ${borderColor}`}>
        <button onClick={prevSlide} disabled={currentIndex === 0} className={`px-8 py-3.5 rounded-2xl font-bold transition text-base border disabled:opacity-30 ${isLight ? 'bg-white border-slate-300 hover:bg-slate-100' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}>◀ 이전</button>
        <button onClick={nextSlide} disabled={currentIndex === questions.length - 1} className={`px-8 py-3.5 rounded-2xl font-bold transition text-base disabled:opacity-30 ${isLight ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>다음 ▶</button>
      </div>
    </div>
  );
}
