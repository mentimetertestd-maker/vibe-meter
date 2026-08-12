'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function JoinPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    
    const checkActiveQuestion = async () => {
      const { data: room } = await supabase.from('rooms').select('active_question_id').eq('id', roomId).single();
      
      if (room?.active_question_id) {
        const { data: question } = await supabase.from('questions').select('*').eq('id', room.active_question_id).single();
        if (question) {
          if (activeQuestion?.id !== question.id) {
            setSubmitted(false);
            setTextAnswer('');
            setSelectedOption('');
          }
          setActiveQuestion(question);
        }
      }
    };

    checkActiveQuestion();
    const interval = setInterval(checkActiveQuestion, 1500);
    return () => clearInterval(interval);
  }, [roomId, activeQuestion?.id]);

  const handleSubmit = async (answerValue: string) => {
    if (!answerValue.trim()) return alert('답변을 입력하거나 선택해주세요!');

    const { error } = await supabase.from('answers').insert([
      { question_id: activeQuestion.id, answer_text: answerValue }
    ]);

    if (error) {
      alert('오류 발생: ' + error.message);
    } else {
      setSubmitted(true);
    }
  };

  if (!activeQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
        <div className="text-xl font-black text-slate-900 mb-8 tracking-tight">Isaiah6tyOne</div>
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">질문 대기 중</h2>
        <p className="text-slate-500 text-sm">발표자가 슬라이드를 시작하면 화면이 자동 업데이트됩니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center font-sans">
      <div className="text-xl font-black text-slate-900 mb-6 tracking-tight mt-2">Isaiah6tyOne</div>
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="text-xs font-extrabold text-slate-500 mb-3 bg-slate-100 w-fit px-3 py-1.5 rounded-full uppercase tracking-wider">
          {activeQuestion.type === 'word_cloud' ? '☁️ 단어구름' : activeQuestion.type === 'multiple_choice' ? '📊 객관식' : '💬 익명 Q&A'}
        </div>
        
        {/* 💡 참가자 폰 화면에서도 소제목 보임 */}
        {activeQuestion.subtitle && (
          <h3 className="text-sm font-bold text-slate-500 mb-2">{activeQuestion.subtitle}</h3>
        )}
        <h1 className="text-2xl font-black text-slate-900 mb-8 leading-snug whitespace-pre-wrap break-keep">{activeQuestion.title}</h1>
        
        {submitted ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">답변이 제출되었습니다!</h3>
            <p className="text-slate-500 text-sm">다음 질문을 기다려주세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeQuestion.type === 'multiple_choice' ? (
              <div className="space-y-3">
                {activeQuestion.options?.map((opt: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full p-4 text-left border-2 rounded-2xl font-semibold transition text-base ${
                      selectedOption === opt 
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
                <button 
                  onClick={() => handleSubmit(selectedOption)}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition mt-4 shadow-lg shadow-slate-200 text-base"
                >
                  선택 완료 제출하기
                </button>
              </div>
            ) : (
              <div>
                {/* 💡 한 줄 input을 여러 줄을 쓸 수 있는 textarea로 교체, 엔터 줄바꿈 가능 */}
                <textarea 
                  className="w-full border-2 border-slate-200 p-4 rounded-2xl mb-4 focus:outline-none focus:border-slate-900 text-slate-900 text-base bg-slate-50 focus:bg-white transition resize-none leading-relaxed" 
                  rows={4}
                  placeholder="답변을 입력하세요... (엔터키로 줄바꿈 가능)" 
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                />
                <button 
                  onClick={() => handleSubmit(textAnswer)} 
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition shadow-lg shadow-slate-200 text-base"
                >
                  제출하기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
