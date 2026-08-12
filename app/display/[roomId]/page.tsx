                const animDelay = (idx * 0.2) % 2;

                return (
                  <div 
                    key={item.text} 
                    style={{ 
                      position: 'absolute', 
                      top: pos.top, 
                      left: pos.left, 
                      color: color,
                      animationDelay: `0s, ${animDelay}s`
                    }} 
                    className={`cloud-item select-none whitespace-nowrap transition-all duration-500 ${sizeClass} ${zIndex}`}
                  >
                    <span>{item.text}</span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 📊 객관식 */}
        {currentQ.type === 'multiple_choice' && (
          <div className="w-full max-w-2xl space-y-3.5 z-10 overflow-y-auto max-h-full py-2">
            {currentQ.options?.map((opt: string, idx: number) => {
              const count = answers.filter(a => a.answer_text === opt).length;
              const percent = answers.length > 0 ? Math.round((count / answers.length) * 100) : 0;
              return (
                <div key={idx} className={`border p-5 rounded-2xl relative overflow-hidden text-left shadow-sm ${cardBg} ${borderColor}`}>
                  <div className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${isLight ? 'bg-slate-200' : 'bg-neutral-800'}`} style={{ width: `${percent}%` }}></div>
                  <div className="relative z-10 flex justify-between font-bold text-lg md:text-xl">
                    <span>{opt}</span>
                    <span className={subTextColor}>{count}명 ({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 💬 익명 Q&A (자동 스크롤 탑 기능 적용) */}
        {currentQ.type === 'qna' && (
          <div ref={qnaScrollRef} className="w-full max-w-4xl h-full overflow-y-auto flex flex-col items-center gap-4 z-10 p-2 scroll-smooth">
            {answers.length === 0 ? (
              <div className={`h-full flex items-center justify-center text-lg ${subTextColor}`}>아직 제출된 답변이 없습니다.</div>
            ) : (
              answers.map((ans, idx) => (
                <div key={idx} className={`w-full border px-6 py-5 rounded-2xl text-lg md:text-xl font-medium text-left shadow-sm whitespace-pre-wrap break-keep leading-relaxed tracking-wide ${cardBg} ${borderColor} transition-all duration-300`}>
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

      {/* 하단 버튼 */}
      <div className={`p-4 flex justify-center gap-6 border-t z-30 flex-shrink-0 ${borderColor}`}>
        <button onClick={prevSlide} disabled={currentIndex === 0} className={`px-7 py-3 rounded-2xl font-bold transition text-sm border disabled:opacity-30 ${isLight ? 'bg-white border-slate-300 hover:bg-slate-100' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}>◀ 이전</button>
        <button onClick={nextSlide} disabled={currentIndex === questions.length - 1} className={`px-7 py-3 rounded-2xl font-bold transition text-sm disabled:opacity-30 ${isLight ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>다음 ▶</button>
      </div>
    </div>
  );
}
