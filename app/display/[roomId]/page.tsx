'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// 🎨 단어구름 알록달록 무지개 색상 팔레트
const COLOR_PALETTE = [
  '#f87171', '#fb923c', '#fbbf24', '#34d399', 
  '#22d3ee', '#818cf8', '#c084fc', '#f472b6', 
  '#38bdf8', '#a3e635', '#4ade80', '#e879f9'
];

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

  // 📜 Q&A 답변 스크롤 영역 제어를 위한 Ref
  const qnaScrollRef = useRef<HTMLDivElement>(null);

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

  // 💡 질문 슬라이드가 변경되면 스크롤을 맨 위로 강제 이동
  useEffect(() => {
    if (qnaScrollRef.current) {
      qnaScrollRef.current.scrollTop = 0;
    }
  }, [currentIndex]);

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

  const getWordCloudData = () => {
    const counts: { [key: string]: number } = {};
    answers.forEach((ans) => {
      const word = ans.answer_text.trim();
      if (word) counts[word] = (counts[word] || 0) + 1;
    });
    return Object.entries(counts).map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count);
  };

  const wordList = getWordCloudData();

  // 💡 단어별 고유 색상 고정
  const wordColors = useMemo(() => {
    const colorMap: { [key: string]: string } = {};
    wordList.forEach(({ text }) => {
      if (!colorMap[text]) {
        const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        colorMap[text] = COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
      }
    });
    return colorMap;
  }, [wordList.map(w => w.text).join(',')]);

  // 💡 밀집형 나선 좌표 알고리즘
  const getTightPosition = (index: number, text: string) => {
    if (index === 0) return { top: '50%', left: '50%' };
    const angle = index * 2.2; 
    const radius = 5 + Math.sqrt(index) * 8.5; 
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const jitterX = ((hash % 3) - 1);
    const jitterY = (((hash * 3) % 3) - 1);
    const x = 50 + radius * Math.cos(angle) + jitterX;
    const y = 50 + radius * Math.sin(angle) * 0.65 + jitterY; 
    return { top: `${Math.max(18, Math.min(82, y))}%`, left: `${Math.max(15, Math.min(85, x))}%` };
  };

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
