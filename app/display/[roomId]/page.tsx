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
  const [answers, setAnswers] = useState<any[]>([]); // 💡 실시간 답변 목록 상태

  useEffect(() => {
    if (typeof window !== 'undefined' && roomId) {
      setJoinUrl(`${window.location.origin}/join/${roomId}`);
    }
  }, [roomId]);

  // 질문 목록 가져오기
  useEffect(() => {
    if (!roomId) return;
    const fetchQuestions = async () => {
      const { data } = await supabase.from('questions').select('*').eq('room_id', roomId).order('sort_order', { ascending: true });
      if (data) setQuestions(data);
      setLoading(false);
    };
    fetchQuestions();
  }, [roomId]);

  // 현재 슬라이드 번호 동기화
  useEffect(() => {
    if (questions.length > 0 && roomId) {
      const activeQuestionId = questions[currentIndex].id;
      supabase.from('rooms').update({ active_question_id: activeQuestionId }).eq('id', roomId).then();
    }
  }, [currentIndex, questions, roomId]);

  const currentQ = questions[currentIndex];

  // 💡 핵심: 현재 질문에 달린 답변들을 실시간(1초마다) 불러오기
  useEffect(() => {
    if (!currentQ?.id) return;

    const fetchAnswers = async () => {
      const { data } = await supabase.from('answers').select('*').eq('question_id', currentQ.id);
      if (data) setAnswers(data);
    };

    fetchAnswers();
    const interval = setInterval(fetchAnswers, 1000); // 1초마다 자동 새로고침
    return () => clearInterval(interval);
  }, [currentQ?.id]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-white">로딩중...</div>;
  if (questions.length === 0) return <div className="flex h-screen items-center justify-center bg-slate-950 text-white">이 방에는 아직 등록된 질문이 없습니다.</div>;

  const nextSlide = () => { if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1); };
  const prevSlide = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans">
      {showBigQR && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm" onClick={() => setShowBigQR(false)}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(joinUrl)}`} alt="큰 QR코드" className="w-80 h-80 md:w-96 md:h-96 rounded-3xl bg-white p-4 shadow-2xl" />
          <p className="mt-8 text-2xl font-bold text-white/80 animate-pulse">화면을 터치하면 닫힙니다</p>
        </div>
      )}

      <div className="p-4 md:p-6 flex justify-between items-center border-b border-slate-800 bg-slate-900 shadow-md">
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

      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl w-full">
          <div className="inline-block text-sm font-bold text-violet-300 bg-violet-900/50 border border-violet-700/50 px-5 py-2 rounded-full mb-6">
            {currentQ.type === 'word_cloud' ? '☁️ 단어구름' : currentQ.type === 'multiple_choice' ? '📊 객관식' : '💬 익명 Q&A'}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-10 leading-tight">{currentQ.title}</h1>

          {/* 💡 실시간으로 수집된 답변들을 전광판 화면에 예쁘게 띄워주기 */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl max-h-96 overflow-y-auto shadow-2xl">
            <div className="text-sm font-bold text-slate-400 mb-4">실시간 응답 수: <span className="text-violet-400 text-lg">{answers.length}</span>개</div>
            
            {currentQ.type === 'multiple_choice' ? (
              <div className="space-y-3">
                {currentQ.options?.map((opt: string, idx: number) => {
                  const count = answers.filter(a => a.answer_text === opt).length;
                  const percent = answers.length > 0 ? Math.round((count / answers.length) * 100) : 0;
                  return (
                    <div key={idx} className="bg-slate-800 p-4 rounded-xl relative overflow-hidden text-left">
                      <div className="absolute left-0 top-0 bottom-0 bg-violet-600/30 transition-all duration-500" style={{ width: `${percent}%` }}></div>
                      <div className="relative z-10 flex justify-between font-bold text-lg">
                        <span>{opt}</span>
                        <span>{count}명 ({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                {answers.length === 0 ? (
                  <p className="text-slate-500 py-6">아직 제출된 답변이 없습니다.</p>
                ) : (
                  answers.map((ans, idx) => (
                    <div key={idx} className="bg-violet-900/40 border border-violet-700/50 px-5 py-3 rounded-2xl text-lg font-medium animate-fade-in shadow-md">
                      {ans.answer_text}
                    </div>
                  ))
                )}
              </div>
            )}
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
