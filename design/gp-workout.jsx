// gp-workout.jsx — Workout execution with swipeable cards + rest timer

// ═══════════════════════════════════════════════════════════════
//  REST TIMER (floating)
// ═══════════════════════════════════════════════════════════════
const RestTimer = ({ seconds, onClose, onDone }) => {
  const [remaining, setRemaining] = React.useState(seconds);
  const [paused, setPaused] = React.useState(false);
  React.useEffect(()=>{
    if (paused) return;
    if (remaining <= 0) { onDone && onDone(); return; }
    const t = setTimeout(()=>setRemaining(r=>r-1), 1000);
    return ()=>clearTimeout(t);
  }, [remaining, paused]);

  const pct = remaining / seconds;
  const r = 52, circ = 2*Math.PI*r;
  const mins = Math.floor(remaining/60), secs = remaining%60;

  return (
    <div className="fade-in" style={{ position:'fixed', inset:0, background:'rgba(26,26,30,0.6)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(8px)' }}>
      <div className="pop-in" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}>
        <div style={{ color:'rgba(255,255,255,0.7)', fontSize:14, fontWeight:600, letterSpacing:'0.1em' }}>DESCANSO</div>
        <div style={{ position:'relative', width:160, height:160 }}>
          <svg width="160" height="160" style={{ transform:'rotate(-90deg)' }}>
            <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8"/>
            <circle cx="80" cy="80" r={r} fill="none" stroke={GP.green} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round" style={{ transition:'stroke-dashoffset 1s linear' }}/>
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:42, fontWeight:900, color:'#fff', fontVariantNumeric:'tabular-nums' }}>
            {mins>0?`${mins}:${String(secs).padStart(2,'0')}`:secs}
          </div>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={()=>setRemaining(r=>r+15)} style={{ padding:'10px 18px', borderRadius:12, border:'1px solid rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.1)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>+15s</button>
          <button onClick={()=>setPaused(p=>!p)} style={{ width:48, height:48, borderRadius:14, border:'none', background:GP.green, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            {paused ? <GpIcon.Play s={20} c="#fff"/> : <GpIcon.Pause s={20} c="#fff"/>}
          </button>
          <button onClick={onClose} style={{ padding:'10px 18px', borderRadius:12, border:'1px solid rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.1)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Saltar</button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  WORKOUT EXECUTION SCREEN
// ═══════════════════════════════════════════════════════════════
const WorkoutExecScreen = ({ workout }) => {
  const { navigate, addLog } = useApp();
  const [current, setCurrent] = React.useState(0);
  const [setData, setSetData] = React.useState(()=>
    workout.exercises.map(ex=>Array.from({length:ex.sets},()=>({done:false, weight:ex.weight, reps:ex.reps})))
  );
  const [showTimer, setShowTimer] = React.useState(false);
  const [timerSecs, setTimerSecs] = React.useState(60);
  const [elapsed, setElapsed] = React.useState(0);
  const [showFinish, setShowFinish] = React.useState(false);
  const [dragX, setDragX] = React.useState(0);
  const dragStart = React.useRef(null);
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 1024);
  React.useEffect(()=>{ const fn=()=>setIsDesktop(window.innerWidth>=1024); window.addEventListener('resize',fn); return ()=>window.removeEventListener('resize',fn); },[]);

  // Elapsed timer
  React.useEffect(()=>{ const t=setInterval(()=>setElapsed(e=>e+1),1000); return ()=>clearInterval(t); },[]);

  const ex = workout.exercises[current];
  const totalEx = workout.exercises.length;

  const toggleSet = (exIdx, setIdx) => {
    setSetData(prev=>{
      const next = prev.map(arr=>arr.map(s=>({...s})));
      const wasDone = next[exIdx][setIdx].done;
      next[exIdx][setIdx].done = !wasDone;
      if (!wasDone) { setTimerSecs(workout.exercises[exIdx].rest); setShowTimer(true); }
      return next;
    });
  };

  const updateSetField = (exIdx, setIdx, field, val) => {
    setSetData(prev=>{
      const next = prev.map(arr=>arr.map(s=>({...s})));
      next[exIdx][setIdx][field] = Math.max(0, val);
      return next;
    });
  };

  const completedSets = setData.flat().filter(s=>s.done).length;
  const totalSets = setData.flat().length;
  const exDone = setData[current].every(s=>s.done);

  const goNext = () => { if(current<totalEx-1){ setCurrent(c=>c+1); setDragX(0); } else setShowFinish(true); };
  const goPrev = () => { if(current>0){ setCurrent(c=>c-1); setDragX(0); } };

  // Swipe handlers
  const onStart = (x) => { dragStart.current = x; };
  const onMove = (x) => { if(dragStart.current!==null) setDragX(x-dragStart.current); };
  const onEnd = () => {
    if (Math.abs(dragX) > 80) { dragX < 0 ? goNext() : goPrev(); }
    else setDragX(0);
    dragStart.current = null;
  };

  const finishWorkout = () => {
    const totalWeight = setData.flat().filter(s=>s.done).reduce((a,s)=>a+(s.weight*s.reps),0);
    addLog({ id:Date.now(), workoutName:workout.name, date:new Date().toISOString().split('T')[0], duration:Math.max(1,Math.round(elapsed/60)), totalSets:completedSets, totalWeight, exercises:workout.exercises.length });
    navigate('dashboard');
  };

  const mm = Math.floor(elapsed/60), ss = elapsed%60;

  return (
    <div style={{ minHeight:'100dvh', background:GP.bg, display:'flex', flexDirection:'column' }}>
      {/* Top bar */}
      <div style={{ background:GP.white, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${GP.border}`, position:'sticky', top:0, zIndex:50 }}>
        <button onClick={()=>navigate('dashboard')} style={{ width:40, height:40, borderRadius:12, border:'none', background:GP.bg, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><GpIcon.X s={18} c={GP.t1}/></button>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:15, fontWeight:800, color:GP.t1 }}>{workout.name}</div>
          <div style={{ fontSize:12, color:GP.t2, fontVariantNumeric:'tabular-nums' }}>⏱ {mm}:{String(ss).padStart(2,'0')} · {completedSets}/{totalSets} séries</div>
        </div>
        <button onClick={()=>setShowFinish(true)} style={{ padding:'9px 16px', borderRadius:12, border:'none', background:GP.greenLt, color:GP.greenDk, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Terminar</button>
      </div>

      {/* Progress bar */}
      <div style={{ height:4, background:GP.border }}>
        <div style={{ height:'100%', width:`${(completedSets/totalSets)*100}%`, background:`linear-gradient(90deg,${GP.green},${GP.greenDk})`, transition:'width 0.4s' }} />
      </div>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding: isDesktop?'32px 24px':'20px 16px', maxWidth:560, margin:'0 auto', width:'100%' }}>
        {/* Exercise dots */}
        <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap', justifyContent:'center' }}>
          {workout.exercises.map((e,i)=>{
            const eDone = setData[i].every(s=>s.done);
            return (
              <button key={i} onClick={()=>{setCurrent(i);setDragX(0);}} style={{ width: i===current?28:9, height:9, borderRadius:100, border:'none', background: i===current?GP.green:(eDone?GP.greenDk:GP.border), cursor:'pointer', transition:'all 0.25s', padding:0 }} />
            );
          })}
        </div>

        {/* Swipeable card */}
        <div style={{ width:'100%', position:'relative', touchAction:'pan-y' }}
          onTouchStart={e=>onStart(e.touches[0].clientX)}
          onTouchMove={e=>onMove(e.touches[0].clientX)}
          onTouchEnd={onEnd}
          onMouseDown={e=>onStart(e.clientX)}
          onMouseMove={e=>dragStart.current!==null&&onMove(e.clientX)}
          onMouseUp={onEnd}
          onMouseLeave={()=>dragStart.current!==null&&onEnd()}
        >
          <div key={current} className="card-enter" style={{ transform:`translateX(${dragX}px) rotate(${dragX*0.02}deg)`, transition: dragStart.current!==null?'none':'transform 0.3s cubic-bezier(.2,.8,.2,1)', cursor: dragStart.current!==null?'grabbing':'grab' }}>
            <GpCard style={{ padding:0, overflow:'hidden' }}>
              {/* Header w/ exercise media (drop image/gif to illustrate) */}
              <div style={{ height:170, background:`linear-gradient(135deg, ${GROUP_COLORS[ex.group]||GP.green}, ${GROUP_COLORS[ex.group]||GP.greenDk})`, position:'relative', display:'flex', alignItems:'flex-end', padding:20, overflow:'hidden' }}>
                <image-slot
                  id={`gp-ex-${ex.id}`}
                  fit="cover"
                  placeholder="Arrasta vídeo / imagem"
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%', color:'rgba(255,255,255,0.85)', fontSize:'12px' }}
                ></image-slot>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.55), transparent 55%)', pointerEvents:'none' }} />
                <div style={{ position:'relative', zIndex:1, pointerEvents:'none' }}>
                  <div style={{ display:'inline-flex', background:'rgba(0,0,0,0.35)', color:'#fff', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:100, marginBottom:8, backdropFilter:'blur(4px)' }}>
                    {ex.group} · Exercício {current+1}/{totalEx}
                  </div>
                  <div style={{ fontSize:24, fontWeight:900, color:'#fff', letterSpacing:'-0.02em', lineHeight:1.1, textShadow:'0 1px 8px rgba(0,0,0,0.35)' }}>{ex.name}</div>
                </div>
              </div>

              {/* Target info */}
              <div style={{ display:'flex', justifyContent:'space-around', padding:'16px 20px', borderBottom:`1px solid ${GP.border}` }}>
                {[
                  { label:'Séries', value:ex.sets },
                  { label:'Reps Alvo', value:ex.reps },
                  { label:'Peso', value:`${ex.weight}kg` },
                  { label:'Descanso', value:`${ex.rest}s` },
                ].map((s,i)=>(
                  <div key={i} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:20, fontWeight:900, color:GP.t1 }}>{s.value}</div>
                    <div style={{ fontSize:11, color:GP.t2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Set tracker */}
              <div style={{ padding:'16px 20px 20px' }}>
                <div style={{ fontSize:12, fontWeight:700, color:GP.t3, letterSpacing:'0.05em', marginBottom:12 }}>REGISTAR SÉRIES</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {/* header row */}
                  <div style={{ display:'grid', gridTemplateColumns:'40px 1fr 1fr 44px', gap:8, alignItems:'center', padding:'0 4px' }}>
                    <span style={{ fontSize:11, color:GP.t3, fontWeight:600 }}>SÉRIE</span>
                    <span style={{ fontSize:11, color:GP.t3, fontWeight:600, textAlign:'center' }}>PESO (KG)</span>
                    <span style={{ fontSize:11, color:GP.t3, fontWeight:600, textAlign:'center' }}>REPS</span>
                    <span/>
                  </div>
                  {setData[current].map((s,si)=>(
                    <div key={si} style={{ display:'grid', gridTemplateColumns:'40px 1fr 1fr 44px', gap:8, alignItems:'center', background: s.done?GP.greenXlt:GP.bg, borderRadius:12, padding:'8px 8px', transition:'background 0.2s' }}>
                      <span style={{ fontSize:15, fontWeight:800, color: s.done?GP.greenDk:GP.t2, textAlign:'center' }}>{si+1}</span>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}>
                        <button onClick={()=>updateSetField(current,si,'weight',s.weight-2.5)} style={{ width:22, height:22, borderRadius:6, border:'none', background:GP.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><GpIcon.Minus s={11} c={GP.t2}/></button>
                        <span style={{ fontSize:15, fontWeight:700, color:GP.t1, minWidth:36, textAlign:'center', fontVariantNumeric:'tabular-nums' }}>{s.weight}</span>
                        <button onClick={()=>updateSetField(current,si,'weight',s.weight+2.5)} style={{ width:22, height:22, borderRadius:6, border:'none', background:GP.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><GpIcon.Plus s={11} c={GP.t1}/></button>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}>
                        <button onClick={()=>updateSetField(current,si,'reps',s.reps-1)} style={{ width:22, height:22, borderRadius:6, border:'none', background:GP.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><GpIcon.Minus s={11} c={GP.t2}/></button>
                        <span style={{ fontSize:15, fontWeight:700, color:GP.t1, minWidth:28, textAlign:'center', fontVariantNumeric:'tabular-nums' }}>{s.reps}</span>
                        <button onClick={()=>updateSetField(current,si,'reps',s.reps+1)} style={{ width:22, height:22, borderRadius:6, border:'none', background:GP.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><GpIcon.Plus s={11} c={GP.t1}/></button>
                      </div>
                      <button onClick={()=>toggleSet(current,si)} style={{ width:36, height:36, borderRadius:10, border:'none', background: s.done?GP.green:GP.white, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', justifySelf:'center', transition:'background 0.2s', boxShadow: s.done?'none':`inset 0 0 0 2px ${GP.border}` }}>
                        <GpIcon.Check s={18} c={s.done?'#fff':GP.t3}/>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Manual rest timer trigger */}
                <button onClick={()=>{setTimerSecs(ex.rest);setShowTimer(true);}} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', marginTop:12, padding:'11px', borderRadius:12, border:`1px solid ${GP.border}`, background:GP.white, color:GP.t2, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  <GpIcon.Timer s={16} c={GP.green}/> Iniciar descanso ({ex.rest}s)
                </button>
              </div>
            </GpCard>
          </div>
        </div>

        {/* Nav buttons */}
        <div style={{ display:'flex', gap:12, marginTop:20, width:'100%' }}>
          <GpBtn variant="outline" size="lg" onClick={goPrev} disabled={current===0} icon={<GpIcon.Back s={18} c={GP.green}/>} style={{ flex:1 }}>Anterior</GpBtn>
          <GpBtn size="lg" onClick={goNext} style={{ flex:2 }} icon={exDone?<GpIcon.Check s={18} c="#fff"/>:null}>
            {current===totalEx-1 ? 'Terminar Treino' : 'Próximo Exercício'}
          </GpBtn>
        </div>
        <div style={{ fontSize:12, color:GP.t3, marginTop:12, display: isDesktop?'none':'block' }}>← Desliza para navegar →</div>
      </div>

      {showTimer && <RestTimer seconds={timerSecs} onClose={()=>setShowTimer(false)} onDone={()=>setShowTimer(false)} />}

      {/* Finish modal */}
      <GpModal open={showFinish} onClose={()=>setShowFinish(false)} title="Terminar Treino" maxWidth={420}>
        <div style={{ paddingTop:8, textAlign:'center' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:GP.greenXlt, display:'flex', alignItems:'center', justifyContent:'center', margin:'12px auto 20px' }}>
            <GpIcon.Trophy s={36} c={GP.green}/>
          </div>
          <div style={{ fontSize:20, fontWeight:900, color:GP.t1, marginBottom:6 }}>Bom trabalho! 💪</div>
          <div style={{ fontSize:14, color:GP.t2, marginBottom:20 }}>Concluíste {completedSets} de {totalSets} séries em {mm} minutos.</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
            {[
              { v:`${mm}min`, l:'Duração' },
              { v:completedSets, l:'Séries' },
              { v:`${(setData.flat().filter(s=>s.done).reduce((a,s)=>a+s.weight*s.reps,0)/1000).toFixed(1)}t`, l:'Volume' },
            ].map((s,i)=>(
              <div key={i} style={{ background:GP.bg, borderRadius:12, padding:'12px 8px' }}>
                <div style={{ fontSize:18, fontWeight:900, color:GP.t1 }}>{s.v}</div>
                <div style={{ fontSize:11, color:GP.t2 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <GpBtn fullWidth size="lg" onClick={finishWorkout}>Guardar Treino</GpBtn>
            <GpBtn fullWidth variant="ghost" onClick={()=>setShowFinish(false)}>Continuar a treinar</GpBtn>
          </div>
        </div>
      </GpModal>
    </div>
  );
};

Object.assign(window, { RestTimer, WorkoutExecScreen });
