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
          // 질문이 바뀌면 제출 상태 초기화
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

  // 답변 제출 함수
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">질문 대기 중</h2>
        <p className="text-slate-500">발표자가 질문을 시작하면 이 화면이 자동으로 업데이트됩니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 mt-10 border border-slate-100">
        <div className="text-sm font-bold text-violet-600 mb-4 bg-violet-50 w-fit px-3 py-1 rounded-full">
          {activeQuestion.type === 'word_cloud' ? '☁️ 단어구름' : activeQuestion.type === 'multiple_choice' ? '📊 객관식' : '💬 익명 Q&A'}
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-8 leading-snug">{activeQuestion.title}</h1>
        
        {submitted ? (
          <div className="text-center py-10 bg-violet-50 rounded-2xl border border-violet-100">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-violet-900 mb-1">답변이 제출되었습니다!</h3>
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
                    className={`w-full p-4 text-left border-2 rounded-xl font-medium transition ${
                      selectedOption === opt 
                      ? 'border-violet-600 bg-violet-50 text-violet-900' 
                      : 'border-slate-200 hover:border-violet-300 text-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
                <button 
                  onClick={() => handleSubmit(selectedOption)}
                  className="w-full bg-violet-600 text-white font-bold py-4 rounded-xl hover:bg-violet-700 transition mt-4 shadow-lg shadow-violet-200"
                >
                  선택 완료 제출하기
                </button>
              </div>
            ) : (
              <div>
                <input 
                  type="text" 
                  className="w-full border-2 border-slate-200 p-4 rounded-xl mb-4 focus:outline-none focus:border-violet-500 text-slate-800" 
                  placeholder="답변을 입력하세요..." 
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(textAnswer)}
                />
                <button 
                  onClick={() => handleSubmit(textAnswer)} 
                  className="w-full bg-violet-600 text-white font-bold py-4 rounded-xl hover:bg-violet-700 transition shadow-lg shadow-violet-200"
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
