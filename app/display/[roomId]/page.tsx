'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement 
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
);

export default function AdminRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [roomData, setRoomData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roomId) {
      fetchRoomAndQuestions();
    }
  }, [roomId]);

  const fetchRoomAndQuestions = async () => {
    setLoading(true);
    // 1. 방 정보 가져오기
    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    if (room) {
      setRoomData(room);
      // 2. 질문 목록 가져오기
      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      if (qs) setQuestions(qs);
    }
    setLoading(false);
  };

  const handleAddQuestion = async () => {
    const title = prompt('새로운 질문 내용을 입력하세요:');
    if (!title) return;

    const { data, error } = await supabase
      .from('questions')
      .insert([{ 
        room_id: roomId, 
        title, 
        type: 'multiple_choice',
        options: ['매우 그렇다', '그렇다', '보통이다', '아니다']
      }])
      .select()
      .single();
    
    if (data) setQuestions([...questions, data]);
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('질문을 삭제하시겠습니까?')) return;
    await supabase.from('questions').delete().eq('id', id);
    setQuestions(questions.filter(q => q.id !== id));
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">데이터를 불러오는 중...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900">
      {/* Navigation */}
      <nav className="h-16 bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-900">←</button>
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">VM</div>
          <h1 className="font-bold text-slate-800">관리자 패널 <span className="text-slate-300 mx-2">|</span> <span className="text-violet-600">{roomData?.title}</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.open(`/display/${roomId}`, '_blank')}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition"
          >
            🖥️ 전광판 모드
          </button>
          <button 
            onClick={() => window.open(`/join/${roomId}`, '_blank')}
            className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition"
          >
            참여 페이지 열기
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">{roomData?.title}</h2>
            <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
              ID: <code className="bg-slate-100 px-2 py-0.5 rounded text-violet-600 font-mono">{roomId}</code>
            </p>
          </div>
          <button 
            onClick={handleAddQuestion}
            className="px-6 py-3 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 transition shadow-lg shadow-violet-100"
          >
            + 새 질문 추가
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Question List */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Questions List</h3>
            {questions.length === 0 ? (
              <div className="py-20 bg-white border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-300">
                <p className="text-sm font-medium">아직 등록된 질문이 없습니다.</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={q.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-5 group hover:border-violet-200 transition-colors">
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center font-black text-sm group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">{q.type}</span>
                    </div>
                    <p className="font-bold text-slate-800 text-lg leading-tight">{q.title}</p>
                    <div className="mt-4 flex gap-2">
                      <button className="px-4 py-1.5 bg-slate-50 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-100 transition">데이터 초기화</button>
                      <button 
                        onClick={() => deleteQuestion(q.id)}
                        className="px-4 py-1.5 bg-slate-50 text-red-400 text-xs font-bold rounded-lg hover:bg-red-50 hover:text-red-500 transition"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar Stats */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-8 flex items-center justify-between">
                  참여 현황
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                </h3>
                <div className="h-64">
                  <Doughnut 
                    data={{
                      labels: ['응답 완료', '미응답'],
                      datasets: [{
                        data: [75, 25],
                        backgroundColor: ['#7c3aed', '#f1f5f9'],
                        borderWidth: 0,
                        hoverOffset: 4
                      }]
                    }}
                    options={{ 
                      maintainAspectRatio: false,
                      plugins: { 
                        legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 12, weight: '600' } } } 
                      },
                      cutout: '70%'
                    }}
                  />
                </div>
              </section>

              <div className="bg-gradient-to-br from-violet-600 to-violet-800 p-8 rounded-[2.5rem] text-white shadow-xl shadow-violet-100">
                <h4 className="font-bold mb-3 flex items-center gap-2">💡 사용 가이드</h4>
                <p className="text-sm text-violet-100 leading-relaxed opacity-90">
                  이 페이지는 특정 이벤트 방의 관리 화면입니다. 질문을 추가하거나 삭제하면 참여자 화면에 즉시 반영됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
