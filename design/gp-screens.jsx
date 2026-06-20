// gp-screens.jsx — All main screens for GYMNOPRADO

const EXERCISE_DB = {
  "Peito":    ["Supino Plano com Barra","Supino Inclinado Halteres","Supino Declinado","Crucifixo com Halteres","Crucifixo com Cabos","Flexão de Braços","Pull-over"],
  "Costas":   ["Puxada Alta Pegada Larga","Puxada Pegada Fechada","Remada com Barra","Remada Unilateral","Remada Sentado Cabos","Pull-over Polia"],
  "Ombros":   ["Press Militar com Barra","Press com Halteres","Elevação Lateral","Elevação Frontal","Pássaro","Remada Alta"],
  "Bíceps":   ["Curl com Barra","Curl Alternado Halteres","Curl no Banco Scott","Curl com Cabos","Martelo"],
  "Tríceps":  ["Tríceps na Corda","Tríceps Francês","Tríceps no Pulley","Mergulho entre Bancos","Kickback com Halteres"],
  "Pernas":   ["Agachamento Livre","Leg Press 45°","Leg Extension","Leg Curl Deitado","Cadeira Adutora","Cadeira Abdutora","Pantorrinha em Pé","Pantorrinha Sentado"],
  "Glúteos":  ["Hip Thrust","Agachamento Sumô","Kick Back na Polia","Glúteo no Cross"],
  "Abdómen":  ["Prancha","Crunch","Russian Twist","Elevação de Pernas","Abdominal na Polia","Bicicleta"],
};

const GROUP_COLORS = {
  "Peito":"#3B82F6","Costas":"#8B5CF6","Ombros":"#F59E0B","Bíceps":"#EC4899",
  "Tríceps":"#EF4444","Pernas":"#10B981","Glúteos":"#F97316","Abdómen":"#6B7280",
};

const fmtDate = (d) => {
  const dt = new Date(d); const now = new Date();
  const diff = Math.floor((now - dt) / 86400000);
  if (diff === 0) return 'hoje'; if (diff === 1) return 'ontem';
  if (diff < 7) return `há ${diff} dias`;
  return dt.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
};

// ═══════════════════════════════════════════════════════════════
//  LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════
const LoginScreen = () => {
  const { setUser } = useApp();
  const [email, setEmail] = React.useState('joao@email.com');
  const [pass, setPass] = React.useState('••••••••');
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');

  const handleLogin = () => {
    if (!email || !pass) { setErr('Preenche todos os campos.'); return; }
    setLoading(true); setErr('');
    setTimeout(() => {
      setLoading(false);
      setUser({ id:1, name:'João Silva', email, memberSince:'2024-01-15', streak:7, totalWorkouts:47, weight:78.5, height:178 });
    }, 900);
  };

  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:GP.white, padding:'32px 24px', position:'relative', overflow:'hidden' }}>
      {/* Background decoration */}
      <div style={{ position:'absolute', top:-120, right:-120, width:400, height:400, borderRadius:'50%', background:`radial-gradient(circle, ${GP.greenXlt} 0%, transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-80, left:-80, width:300, height:300, borderRadius:'50%', background:`radial-gradient(circle, ${GP.greenXlt} 0%, transparent 70%)`, pointerEvents:'none' }} />

      <div className="slide-up" style={{ width:'100%', maxWidth:400, display:'flex', flexDirection:'column', gap:32, position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
          <GpLogo size="lg" />
          <p style={{ color:GP.t2, fontSize:15, marginTop:4 }}>A tua jornada começa aqui</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <GpInput label="Email" type="email" placeholder="o.teu@email.com" value={email} onChange={setEmail} icon={<GpIcon.Mail s={18} />} onEnter={handleLogin} />
          <GpInput label="Palavra-passe" type="password" placeholder="••••••••" value={pass} onChange={setPass} icon={<GpIcon.Lock s={18} />} onEnter={handleLogin} />
          {err && <p style={{ color:GP.red, fontSize:13, textAlign:'center' }}>{err}</p>}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <GpBtn onClick={handleLogin} fullWidth size="lg" disabled={loading}>
            {loading ? 'A entrar…' : 'Entrar'}
          </GpBtn>
          <button style={{ background:'none', border:'none', color:GP.t2, fontSize:13, cursor:'pointer', textDecoration:'underline', fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
            Esqueci a palavra-passe
          </button>
        </div>

        <p style={{ textAlign:'center', fontSize:12, color:GP.t3 }}>
          Não tens conta? Fala com o teu ginásio.
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD SCREEN
// ═══════════════════════════════════════════════════════════════
const DashboardScreen = () => {
  const { user, workouts, logs, navigate, openWorkout } = useApp();
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 1024);
  React.useEffect(() => { const fn=()=>setIsDesktop(window.innerWidth>=1024); window.addEventListener('resize',fn); return ()=>window.removeEventListener('resize',fn); },[]);

  const today = new Date();
  const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const weekDays = Array.from({length:7},(_,i)=>{
    const d = new Date(today); d.setDate(today.getDate()-today.getDay()+i);
    const ds = d.toISOString().split('T')[0];
    return { label: dayNames[i], date: ds, isToday: ds===today.toISOString().split('T')[0], done: logs.some(l=>l.date===ds) };
  });

  const todayWorkout = workouts[0];
  const recentLogs = logs.slice(0,3);
  const thisWeekLogs = logs.filter(l=>{ const d=new Date(l.date); const wk=new Date(today); wk.setDate(today.getDate()-7); return d>wk; });

  const hour = today.getHours();
  const greeting = hour<12?'Bom dia':'hour'<18?'Boa tarde':'Boa noite';

  return (
    <div style={{ padding: isDesktop?'32px 36px':'20px 20px 12px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        {!isDesktop && <GpLogo size="sm" />}
        {isDesktop && <div><div style={{fontSize:28,fontWeight:900,color:GP.t1,letterSpacing:'-0.03em'}}>{greeting}, {user?.name?.split(' ')[0]}! 👋</div><div style={{color:GP.t2,fontSize:15,marginTop:3}}>Pronto para mais um treino?</div></div>}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:GP.greenXlt, padding:'7px 13px', borderRadius:100 }}>
            <GpIcon.Fire s={18} c={GP.green} />
            <span style={{ fontSize:14, fontWeight:800, color:GP.greenDk }}>{user?.streak || 0} dias</span>
          </div>
          <GpAvatar name={user?.name} size={40} />
        </div>
      </div>

      {!isDesktop && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:22, fontWeight:900, color:GP.t1, letterSpacing:'-0.03em' }}>{greeting}, {user?.name?.split(' ')[0]}! 👋</div>
          <div style={{ color:GP.t2, fontSize:14, marginTop:3 }}>Pronto para mais um treino?</div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap:20 }}>
        {/* Today's Workout Hero Card */}
        <div style={{ gridColumn: isDesktop ? '1 / -1' : undefined }}>
          {todayWorkout ? (
            <div style={{ background: GP.dark, borderRadius:24, padding:'28px 28px 24px', position:'relative', overflow:'hidden', boxShadow: GP.shadowLg }}>
              <div style={{ position:'absolute', top:-30, right:-30, width:200, height:200, borderRadius:'50%', background:`radial-gradient(circle, ${GP.green}22 0%, transparent 70%)` }} />
              <div style={{ position:'absolute', bottom:-50, left:60, width:160, height:160, borderRadius:'50%', background:`radial-gradient(circle, ${GP.greenDk}18 0%, transparent 70%)` }} />
              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
                  <div>
                    <GpBadge color="green" style={{ marginBottom:10 }}>TREINO DE HOJE</GpBadge>
                    <div style={{ fontSize:isDesktop?30:26, fontWeight:900, color:GP.white, letterSpacing:'-0.03em', lineHeight:1.1 }}>{todayWorkout.name}</div>
                  </div>
                  <div style={{ width:52, height:52, borderRadius:16, background:`${GP.green}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <GpIcon.Dumbbell s={26} c={GP.green} />
                  </div>
                </div>
                <div style={{ display:'flex', gap:20, marginBottom:24 }}>
                  {[
                    { label:`${todayWorkout.exercises.length} exercícios`, icon:<GpIcon.Target s={14} c={GP.t3}/> },
                    { label:`${todayWorkout.exercises.reduce((a,e)=>a+e.sets,0)} séries`, icon:<GpIcon.Zap s={14} c={GP.t3}/> },
                    { label:`~${Math.round(todayWorkout.exercises.length * 8)} min`, icon:<GpIcon.Clock s={14} c={GP.t3}/> },
                  ].map((s,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                      {s.icon}
                      <span style={{ fontSize:13, color:GP.t3 }}>{s.label}</span>
                    </div>
                  ))}
                </div>
                <GpBtn onClick={()=>openWorkout(todayWorkout)} size="lg" variant="primary" icon={<GpIcon.Play s={16} c="#fff" />} style={{ gap:10 }}>
                  Começar Treino
                </GpBtn>
              </div>
            </div>
          ) : (
            <GpCard style={{ textAlign:'center', padding:32 }}>
              <GpEmpty icon={<GpIcon.Dumbbell s={28} c={GP.green}/>} title="Nenhum treino para hoje" subtitle="Cria um novo treino ou clona um existente." action="Criar Treino" onAction={()=>navigate('create')} />
            </GpCard>
          )}
        </div>

        {/* Week View */}
        <GpCard>
          <div style={{ fontSize:13, fontWeight:700, color:GP.t2, marginBottom:14, letterSpacing:'0.03em' }}>ESTA SEMANA</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
            {weekDays.map((d,i)=>(
              <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background: d.done ? GP.green : d.isToday ? `${GP.green}44` : GP.border, transition:'background 0.2s' }} />
                <span style={{ fontSize:11, fontWeight: d.isToday?700:500, color: d.isToday?GP.green:GP.t3 }}>{d.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${GP.border}`, display:'flex', gap:20 }}>
            <div><div style={{ fontSize:24, fontWeight:900, color:GP.t1 }}>{thisWeekLogs.length}</div><div style={{ fontSize:12, color:GP.t2 }}>treinos</div></div>
            <div><div style={{ fontSize:24, fontWeight:900, color:GP.t1 }}>{user?.streak}</div><div style={{ fontSize:12, color:GP.t2 }}>streak 🔥</div></div>
            <div><div style={{ fontSize:24, fontWeight:900, color:GP.t1 }}>{logs.length}</div><div style={{ fontSize:12, color:GP.t2 }}>total</div></div>
          </div>
        </GpCard>

        {/* Quick Stats */}
        <GpCard>
          <div style={{ fontSize:13, fontWeight:700, color:GP.t2, marginBottom:14, letterSpacing:'0.03em' }}>PROGRESSO</div>
          <div style={{ display:'flex', justifyContent:'space-around', alignItems:'center' }}>
            <GpProgressRing value={thisWeekLogs.length} max={5} size={80} label={thisWeekLogs.length} sublabel="/ 5 sem" />
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:GP.green }} />
                <span style={{ fontSize:13, color:GP.t2 }}>Meta semanal: <b style={{color:GP.t1}}>5 treinos</b></span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:GP.orange }} />
                <span style={{ fontSize:13, color:GP.t2 }}>Séries esta semana: <b style={{color:GP.t1}}>{thisWeekLogs.reduce((a,l)=>a+(l.totalSets||0),0)}</b></span>
              </div>
            </div>
          </div>
        </GpCard>

        {/* Recent Workouts */}
        <div style={{ gridColumn: isDesktop ? '1 / -1' : undefined }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:15, fontWeight:700, color:GP.t1 }}>Últimos Treinos</div>
            <button onClick={()=>navigate('history')} style={{ background:'none', border:'none', color:GP.green, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Ver tudo →</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {recentLogs.map(log=>(
              <GpCard key={log.id} padded={false} hover>
                <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px' }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:GP.greenXlt, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <GpIcon.Dumbbell s={20} c={GP.green} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:GP.t1 }}>{log.workoutName}</div>
                    <div style={{ fontSize:12, color:GP.t2, marginTop:2 }}>{log.duration} min · {log.totalSets} séries · {fmtDate(log.date)}</div>
                  </div>
                  <GpIcon.ChevRight s={18} c={GP.t3} />
                </div>
              </GpCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  WORKOUTS LIST SCREEN
// ═══════════════════════════════════════════════════════════════
const WorkoutCard = ({ w, locked, programId, isDesktop }) => {
  const { openWorkout, navigate, deleteWorkout, onClone } = useApp();
  return (
    <GpCard padded={false} style={{ overflow:'hidden' }}>
      <div style={{ height:4, background: locked ? `linear-gradient(90deg, ${GP.t3}, ${GP.t2})` : `linear-gradient(90deg, ${GP.green}, ${GP.greenDk})` }} />
      <div style={{ padding:'16px 18px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:12 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
              <span style={{ fontSize:16, fontWeight:800, color:GP.t1 }}>{w.name}</span>
              {locked && <GpIcon.Lock s={13} c={GP.t3} />}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {w.muscleGroups.map(g=>(
                <span key={g} style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:100, background:`${GROUP_COLORS[g] || GP.green}18`, color: GROUP_COLORS[g] || GP.green }}>{g}</span>
              ))}
            </div>
          </div>
          <div style={{ width:44, height:44, borderRadius:13, background: locked?GP.bg:GP.greenXlt, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <GpIcon.Dumbbell s={20} c={locked?GP.t3:GP.green} />
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:14 }}>
          {w.exercises.slice(0,3).map((e,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:GP.t2 }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:GROUP_COLORS[e.group]||GP.green, flexShrink:0 }} />
              <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.name}</span>
              <span style={{ fontWeight:600, color:GP.t3, flexShrink:0 }}>{e.sets}×{e.reps}</span>
            </div>
          ))}
          {w.exercises.length > 3 && <div style={{ fontSize:12, color:GP.t3, paddingLeft:13 }}>+{w.exercises.length-3} mais</div>}
        </div>

        <div style={{ display:'flex', gap:8, paddingTop:12, borderTop:`1px solid ${GP.border}` }}>
          <GpBtn onClick={()=>openWorkout(w)} fullWidth size="sm" icon={<GpIcon.Play s={14} c="#fff"/>}>Iniciar</GpBtn>
          {locked ? (
            <GpBtn onClick={()=>onClone(w)} variant="outline" size="sm" icon={<GpIcon.Copy s={14} c={GP.green}/>}>Clonar</GpBtn>
          ) : (
            <React.Fragment>
              <GpBtn onClick={()=>onClone(w)} variant="ghost" size="sm" icon={<GpIcon.Copy s={14} c={GP.t2}/>}></GpBtn>
              <GpBtn onClick={()=>navigate('edit', {workout:w, programId})} variant="ghost" size="sm" icon={<GpIcon.Edit s={14} c={GP.t2}/>}></GpBtn>
              <GpBtn onClick={()=>deleteWorkout(programId, w.id)} variant="ghost" size="sm" icon={<GpIcon.Trash s={14} c={GP.red}/>}></GpBtn>
            </React.Fragment>
          )}
        </div>
      </div>
    </GpCard>
  );
};

const WorkoutsScreen = () => {
  const { programs, navigate, addProgram, deleteProgram, cloneToMine } = useApp();
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 1024);
  React.useEffect(()=>{ const fn=()=>setIsDesktop(window.innerWidth>=1024); window.addEventListener('resize',fn); return ()=>window.removeEventListener('resize',fn); },[]);

  const [tab, setTab] = React.useState('coach');
  const [collapsed, setCollapsed] = React.useState({});
  const [showNewGroup, setShowNewGroup] = React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState('');
  const [cloneFor, setCloneFor] = React.useState(null); // workout pending clone

  const coachPrograms = programs.filter(p=>p.owner==='coach');
  const myPrograms = programs.filter(p=>p.owner==='me');
  const shown = tab==='coach' ? coachPrograms : myPrograms;
  const toggle = (id) => setCollapsed(c=>({ ...c, [id]: !c[id] }));

  // Inject onClone into context-consuming card via a wrapper provider
  const ctx = useApp();
  const handleClone = (w) => {
    if (myPrograms.length <= 1) { cloneToMine(w, myPrograms[0]?.id); setTab('me'); }
    else setCloneFor(w);
  };

  const createGroup = () => {
    const id = addProgram(newGroupName.trim() || 'Novo Grupo');
    setNewGroupName(''); setShowNewGroup(false); setTab('me');
  };

  return (
    <AppCtx.Provider value={{ ...ctx, onClone: handleClone }}>
    <div style={{ padding: isDesktop?'32px 36px':'20px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18, gap:12 }}>
        <div>
          <div style={{ fontSize:isDesktop?28:22, fontWeight:900, color:GP.t1, letterSpacing:'-0.03em' }}>Treinos</div>
          <div style={{ color:GP.t2, fontSize:13, marginTop:3 }}>Planos do coach e os teus</div>
        </div>
        {tab==='me' && (
          <GpBtn onClick={()=>setShowNewGroup(true)} variant="outline" icon={<GpIcon.Plus s={17} c={GP.green}/>} size="md">
            {isDesktop ? 'Novo Grupo' : ''}
          </GpBtn>
        )}
      </div>

      {/* Coach / Me tabs */}
      <div style={{ marginBottom:22 }}>
        <GpTabBar tabs={[{id:'coach',label:'🏋️ Do Coach'},{id:'me',label:'⭐ Os Meus'}]} active={tab} onChange={setTab} />
      </div>

      {tab==='coach' && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 15px', borderRadius:13, background:GP.bg, color:GP.t2, marginBottom:18 }}>
          <GpIcon.Lock s={16} c={GP.t3} />
          <span style={{ fontSize:12.5 }}>Estes treinos são definidos pelo teu coach e não podem ser editados — mas podes cloná-los para os teus.</span>
        </div>
      )}

      {shown.length === 0 ? (
        <GpCard>
          <GpEmpty
            title={tab==='coach' ? 'Sem treinos do coach' : 'Ainda não tens grupos'}
            subtitle={tab==='coach' ? 'Quando o teu coach atribuir treinos, aparecem aqui.' : 'Cria um grupo (ex: "Treino 1") e adiciona treinos.'}
            action={tab==='me' ? 'Criar Grupo' : undefined}
            onAction={()=>setShowNewGroup(true)}
          />
        </GpCard>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {shown.map(program=>{
            const isOpen = !collapsed[program.id];
            return (
              <div key={program.id}>
                {/* Program (group) header */}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:isOpen?12:0 }}>
                  <button onClick={()=>toggle(program.id)} style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0, background:'none', border:'none', cursor:'pointer', padding:'4px 0', textAlign:'left', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    <span style={{ width:30, height:30, borderRadius:9, background: tab==='coach'?GP.bg:GP.greenLt, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transform: isOpen?'rotate(0deg)':'rotate(-90deg)', transition:'transform 0.2s' }}>
                      <GpIcon.ChevDown s={17} c={tab==='coach'?GP.t2:GP.greenDk} />
                    </span>
                    <span style={{ fontSize:17, fontWeight:800, color:GP.t1 }}>{program.name}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:GP.t3, background:GP.bg, padding:'2px 9px', borderRadius:100 }}>{program.workouts.length}</span>
                    {tab==='coach' && <GpIcon.Lock s={13} c={GP.t3} />}
                  </button>
                  {tab==='me' && (
                    <div style={{ display:'flex', gap:6 }}>
                      <GpBtn onClick={()=>navigate('create',{programId:program.id})} variant="greenLight" size="sm" icon={<GpIcon.Plus s={14} c={GP.greenDk}/>}>{isDesktop?'Treino':''}</GpBtn>
                      {myPrograms.length>1 && <GpBtn onClick={()=>deleteProgram(program.id)} variant="ghost" size="sm" icon={<GpIcon.Trash s={14} c={GP.red}/>}></GpBtn>}
                    </div>
                  )}
                </div>

                {/* Workouts in this group */}
                {isOpen && (
                  program.workouts.length === 0 ? (
                    <div style={{ border:`2px dashed ${GP.border}`, borderRadius:16, padding:'24px', textAlign:'center', color:GP.t3, fontSize:13 }}>
                      {tab==='me' ? 'Grupo vazio — adiciona um treino.' : 'Sem treinos neste grupo.'}
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns: isDesktop ? 'repeat(auto-fill,minmax(320px,1fr))' : '1fr', gap:14 }}>
                      {program.workouts.map(w=>(
                        <WorkoutCard key={w.id} w={w} locked={tab==='coach'} programId={program.id} isDesktop={isDesktop} />
                      ))}
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New group modal */}
      <GpModal open={showNewGroup} onClose={()=>setShowNewGroup(false)} title="Novo Grupo de Treino" maxWidth={420}>
        <div style={{ display:'flex', flexDirection:'column', gap:16, paddingTop:16 }}>
          <GpInput label="Nome do grupo" placeholder='ex: Treino 1, Semana A…' value={newGroupName} onChange={setNewGroupName} onEnter={createGroup} />
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {['Treino 1','Treino 2','Treino 3','Push / Pull / Legs','Full Body'].map(s=>(
              <button key={s} onClick={()=>setNewGroupName(s)} style={{ padding:'5px 12px', borderRadius:100, border:`1px solid ${GP.border}`, background:newGroupName===s?GP.greenLt:'transparent', color:newGroupName===s?GP.greenDk:GP.t2, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{s}</button>
            ))}
          </div>
          <GpBtn fullWidth onClick={createGroup}>Criar Grupo</GpBtn>
        </div>
      </GpModal>

      {/* Clone target picker */}
      <GpModal open={!!cloneFor} onClose={()=>setCloneFor(null)} title="Clonar para que grupo?" maxWidth={420}>
        <div style={{ display:'flex', flexDirection:'column', gap:10, paddingTop:16 }}>
          {myPrograms.map(p=>(
            <button key={p.id} onClick={()=>{ cloneToMine(cloneFor, p.id); setCloneFor(null); setTab('me'); }} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderRadius:13, border:`1px solid ${GP.border}`, background:GP.white, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              <span style={{ display:'flex', alignItems:'center', gap:10 }}><GpIcon.Dumbbell s={18} c={GP.green}/><span style={{ fontSize:14, fontWeight:700, color:GP.t1 }}>{p.name}</span></span>
              <GpIcon.ChevRight s={16} c={GP.t3}/>
            </button>
          ))}
        </div>
      </GpModal>
    </div>
    </AppCtx.Provider>
  );
};

// ═══════════════════════════════════════════════════════════════
//  HISTORY SCREEN
// ═══════════════════════════════════════════════════════════════
const HistoryScreen = () => {
  const { logs, workouts, openWorkout } = useApp();
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 1024);
  React.useEffect(()=>{ const fn=()=>setIsDesktop(window.innerWidth>=1024); window.addEventListener('resize',fn); return ()=>window.removeEventListener('resize',fn); },[]);

  // Group by week
  const grouped = {};
  logs.forEach(log => {
    const d = new Date(log.date);
    const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  });
  const weeks = Object.entries(grouped).sort((a,b)=>b[0].localeCompare(a[0]));

  const totalSets = logs.reduce((a,l)=>a+(l.totalSets||0),0);

  return (
    <div style={{ padding: isDesktop?'32px 36px':'20px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:isDesktop?28:22, fontWeight:900, color:GP.t1, letterSpacing:'-0.03em' }}>Histórico</div>
        <div style={{ color:GP.t2, fontSize:13, marginTop:3 }}>{logs.length} treinos registados</div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total', value:logs.length, unit:'treinos', icon:<GpIcon.Trophy s={18} c={GP.green}/> },
          { label:'Séries', value:totalSets, unit:'séries', icon:<GpIcon.Zap s={18} c={GP.orange}/> },
          { label:'Streak', value:7, unit:'dias 🔥', icon:<GpIcon.Fire s={18} c={GP.green}/> },
        ].map((s,i)=>(
          <GpCard key={i} style={{ textAlign:'center' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:900, color:GP.t1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:GP.t2, marginTop:2 }}>{s.unit}</div>
          </GpCard>
        ))}
      </div>

      {logs.length === 0 ? (
        <GpCard><GpEmpty title="Sem treinos ainda" subtitle="Realiza o teu primeiro treino e aparece aqui." /></GpCard>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {weeks.map(([weekKey, weekLogs])=>{
            const wDate = new Date(weekKey);
            const weekLabel = weekKey === new Date(new Date().setDate(new Date().getDate()-new Date().getDay())).toISOString().split('T')[0] ? 'Esta Semana' : `Semana de ${wDate.toLocaleDateString('pt-PT',{day:'numeric',month:'short'})}`;
            return (
              <div key={weekKey}>
                <div style={{ fontSize:12, fontWeight:700, color:GP.t3, letterSpacing:'0.06em', marginBottom:10, paddingLeft:2 }}>{weekLabel.toUpperCase()}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {weekLogs.map(log=>(
                    <GpCard key={log.id} padded={false} hover>
                      <div style={{ padding:'16px 18px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                          <div style={{ width:46, height:46, borderRadius:14, background:GP.greenXlt, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <GpIcon.Dumbbell s={20} c={GP.green} />
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                              <div style={{ fontSize:15, fontWeight:700, color:GP.t1 }}>{log.workoutName}</div>
                              <div style={{ fontSize:12, color:GP.t3 }}>{fmtDate(log.date)}</div>
                            </div>
                            <div style={{ display:'flex', gap:12, marginTop:5 }}>
                              <span style={{ fontSize:12, color:GP.t2 }}>⏱ {log.duration} min</span>
                              <span style={{ fontSize:12, color:GP.t2 }}>💪 {log.totalSets} séries</span>
                            </div>
                          </div>
                        </div>
                        {/* Repeat workout button */}
                        <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${GP.border}`, display:'flex', gap:8 }}>
                          <GpBtn size="sm" variant="greenLight" onClick={()=>{ const w=workouts.find(x=>x.name===log.workoutName); if(w) openWorkout(w); }} icon={<GpIcon.Copy s={13} c={GP.greenDk}/>}>Repetir Treino</GpBtn>
                        </div>
                      </div>
                    </GpCard>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PROGRESS SCREEN
// ═══════════════════════════════════════════════════════════════
const ProgressScreen = () => {
  const { logs, workouts, user } = useApp();
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 1024);
  React.useEffect(()=>{ const fn=()=>setIsDesktop(window.innerWidth>=1024); window.addEventListener('resize',fn); return ()=>window.removeEventListener('resize',fn); },[]);

  const weekKey = (d) => { const x=new Date(d); x.setDate(x.getDate()-x.getDay()); return x.toISOString().split('T')[0]; };

  // Weekly volume (last 8 weeks)
  const weeksMap = {};
  logs.forEach(l=>{ const k=weekKey(l.date); if(!weeksMap[k]) weeksMap[k]={vol:0,count:0,sets:0}; weeksMap[k].vol+=l.totalWeight||0; weeksMap[k].count++; weeksMap[k].sets+=l.totalSets||0; });
  const today = new Date();
  const weeks = [];
  for(let i=7;i>=0;i--){ const d=new Date(today); d.setDate(today.getDate()-i*7); const k=weekKey(d); weeks.push({ key:k, label:new Date(k).toLocaleDateString('pt-PT',{day:'numeric',month:'short'}), vol:(weeksMap[k]?.vol)||0, count:(weeksMap[k]?.count)||0 }); }
  const maxVol = Math.max(...weeks.map(w=>w.vol), 1);

  // Totals
  const totalSets = logs.reduce((a,l)=>a+(l.totalSets||0),0);
  const totalMin = logs.reduce((a,l)=>a+(l.duration||0),0);
  const thisWeekCount = weeks[weeks.length-1].count;
  const maxCount = Math.max(...weeks.map(w=>w.count), 1);
  const avgPerWeek = (logs.length / Math.max(1, weeks.filter(w=>w.count>0).length)).toFixed(1);

  // Personal records — heaviest prescribed weight per exercise
  const prsMap = {};
  workouts.forEach(w=>w.exercises.forEach(e=>{ if(e.weight>0){ if(!prsMap[e.name] || e.weight>prsMap[e.name].weight) prsMap[e.name]={ weight:e.weight, group:e.group, reps:e.reps }; } }));
  const prList = Object.entries(prsMap).map(([name,v])=>({name,...v})).sort((a,b)=>b.weight-a.weight).slice(0,6);

  // Muscle group distribution from workouts
  const groupCount = {};
  workouts.forEach(w=>w.exercises.forEach(e=>{ groupCount[e.group]=(groupCount[e.group]||0)+1; }));
  const groupDist = Object.entries(groupCount).map(([g,c])=>({g,c})).sort((a,b)=>b.c-a.c);
  const totalGroupEx = groupDist.reduce((a,d)=>a+d.c,0) || 1;

  return (
    <div style={{ padding: isDesktop?'32px 36px':'20px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:isDesktop?28:22, fontWeight:900, color:GP.t1, letterSpacing:'-0.03em' }}>Progresso de Treino</div>
        <div style={{ color:GP.t2, fontSize:13, marginTop:3 }}>A tua evolução, treino a treino</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap:16 }}>
        {/* Overview stats */}
        <div style={{ gridColumn: isDesktop ? '1 / -1' : undefined, display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
          {[
            { icon:<GpIcon.Dumbbell s={18} c={GP.green}/>, value:logs.length, label:'Treinos totais' },
            { icon:<GpIcon.Fire s={18} c={GP.orange}/>, value:`${user?.streak||0}🔥`, label:'Dias de streak' },
            { icon:<GpIcon.Zap s={18} c={GP.green}/>, value:totalSets, label:'Séries feitas' },
            { icon:<GpIcon.Target s={18} c={GP.green}/>, value:avgPerWeek, label:'Treinos / semana' },
          ].map((s,i)=>(
            <GpCard key={i} style={{ padding:'16px 18px' }}>
              <div style={{ marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontSize:24, fontWeight:900, color:GP.t1 }}>{s.value}</div>
              <div style={{ fontSize:12, color:GP.t2, marginTop:1 }}>{s.label}</div>
            </GpCard>
          ))}
        </div>

        {/* Weekly frequency bar chart */}
        <GpCard style={{ gridColumn: isDesktop ? '1 / -1' : undefined }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <div style={{ fontWeight:700, color:GP.t1, fontSize:15 }}>Treinos por Semana</div>
            <GpBadge color="green">{thisWeekCount} esta semana</GpBadge>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:isDesktop?12:6, height:150 }}>
            {weeks.map((w,i)=>{
              const h = w.count>0 ? Math.max(10, (w.count/maxCount)*120) : 4;
              const isLast = i===weeks.length-1;
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:7, minWidth:0 }}>
                  <span style={{ fontSize:12, fontWeight:800, color: w.count>0?GP.t1:GP.t3, whiteSpace:'nowrap' }}>{w.count>0?w.count:'—'}</span>
                  <div style={{ width:'100%', maxWidth:34, height:h, borderRadius:8, background: w.count===0 ? GP.border : isLast ? `linear-gradient(180deg,${GP.green},${GP.greenDk})` : GP.greenLt, transition:'height 0.4s' }} />
                  <span style={{ fontSize:9.5, color:GP.t3, whiteSpace:'nowrap' }}>{w.label}</span>
                </div>
              );
            })}
          </div>
        </GpCard>

        {/* Personal Records */}
        <GpCard>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <GpIcon.Trophy s={18} c="#F59E0B"/>
            <div style={{ fontWeight:700, color:GP.t1, fontSize:15 }}>Recordes Pessoais</div>
          </div>
          {prList.length===0 ? (
            <div style={{ fontSize:13, color:GP.t2, padding:'12px 0' }}>Adiciona pesos aos teus exercícios para veres os recordes.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              {prList.map((pr,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom: i<prList.length-1?`1px solid ${GP.border}`:'none' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:GROUP_COLORS[pr.group]||GP.green, flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13.5, fontWeight:600, color:GP.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pr.name}</div>
                    <div style={{ fontSize:11, color:GP.t3 }}>{pr.group}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <span style={{ fontSize:17, fontWeight:900, color:GP.t1 }}>{pr.weight}</span>
                    <span style={{ fontSize:11, fontWeight:600, color:GP.t2 }}> kg</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GpCard>

        {/* Muscle group distribution */}
        <GpCard>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <GpIcon.Target s={18} c={GP.green}/>
            <div style={{ fontWeight:700, color:GP.t1, fontSize:15 }}>Foco Muscular</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {groupDist.map((d,i)=>(
              <div key={i}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:12.5, fontWeight:600, color:GP.t1 }}>{d.g}</span>
                  <span style={{ fontSize:11, color:GP.t3 }}>{Math.round(d.c/totalGroupEx*100)}%</span>
                </div>
                <div style={{ height:8, borderRadius:100, background:GP.bg, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${d.c/totalGroupEx*100}%`, borderRadius:100, background:GROUP_COLORS[d.g]||GP.green, transition:'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        </GpCard>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  CREATE / EDIT WORKOUT SCREEN
// ═══════════════════════════════════════════════════════════════
const CreateWorkoutScreen = ({ editWorkout, targetProgramId }) => {
  const { programs, saveWorkout, addProgram, navigate } = useApp();
  const myPrograms = programs.filter(p=>p.owner==='me');
  const [name, setName] = React.useState(editWorkout?.name || '');
  const [exercises, setExercises] = React.useState(editWorkout?.exercises || []);
  const [selectedProgram, setSelectedProgram] = React.useState(targetProgramId || myPrograms[0]?.id || null);
  const [showPicker, setShowPicker] = React.useState(false);
  const [pickerGroup, setPickerGroup] = React.useState('Peito');
  const [saved, setSaved] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 1024);
  React.useEffect(()=>{ const fn=()=>setIsDesktop(window.innerWidth>=1024); window.addEventListener('resize',fn); return ()=>window.removeEventListener('resize',fn); },[]);

  const addExercise = (exName) => {
    setExercises(prev=>[...prev, { id:Date.now(), name:exName, sets:3, reps:10, weight:20, rest:60, group:pickerGroup }]);
    setShowPicker(false);
  };

  const updateEx = (id, field, val) => setExercises(prev=>prev.map(e=>e.id===id?{...e,[field]:val}:e));
  const removeEx = (id) => setExercises(prev=>prev.filter(e=>e.id!==id));
  const moveEx = (id, dir) => {
    setExercises(prev=>{
      const idx = prev.findIndex(e=>e.id===id);
      if((dir===-1&&idx===0)||(dir===1&&idx===prev.length-1)) return prev;
      const next=[...prev]; [next[idx],next[idx+dir]]=[next[idx+dir],next[idx]]; return next;
    });
  };

  const save = () => {
    if (!name.trim() || exercises.length === 0) return;
    let pid = selectedProgram || myPrograms[0]?.id;
    if (!pid) pid = addProgram('Os Meus Treinos');
    const groups = [...new Set(exercises.map(e=>e.group))];
    const cleanEx = exercises.map(({id,name,sets,reps,weight,rest,group})=>({id,name,sets,reps,weight,rest,group}));
    const workout = { id: editWorkout?.id||Date.now(), name:name.trim(), muscleGroups:groups, exercises:cleanEx, createdAt:editWorkout?.createdAt||new Date().toISOString().split('T')[0], lastDone:editWorkout?.lastDone||null };
    saveWorkout(pid, workout);
    setSaved(true);
    setTimeout(()=>navigate('workouts'), 800);
  };

  return (
    <div style={{ padding: isDesktop?'32px 36px':'20px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={()=>navigate('workouts')} style={{ width:40, height:40, borderRadius:12, border:'none', background:GP.white, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:GP.shadow }}><GpIcon.Back s={20} c={GP.t1}/></button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:isDesktop?24:20, fontWeight:900, color:GP.t1 }}>{editWorkout?'Editar Treino':'Novo Treino'}</div>
          <div style={{ fontSize:13, color:GP.t2 }}>Cria o teu plano personalizado</div>
        </div>
        <GpBtn onClick={save} disabled={!name.trim()||exercises.length===0} size="md">
          {saved ? '✓ Guardado!' : 'Guardar'}
        </GpBtn>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <GpCard>
          <GpInput label="Nome do Treino" placeholder="ex: Peito & Tríceps" value={name} onChange={setName} />
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:12 }}>
            {['Peito & Tríceps','Costas & Bíceps','Pernas','Ombros','Full Body','Push','Pull','Legs'].map(s=>(
              <button key={s} onClick={()=>setName(s)} style={{ padding:'5px 12px', borderRadius:100, border:`1px solid ${GP.border}`, background:name===s?GP.greenLt:'transparent', color:name===s?GP.greenDk:GP.t2, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{s}</button>
            ))}
          </div>
          {/* Group selector */}
          <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${GP.border}` }}>
            <label style={{ fontSize:13, fontWeight:600, color:GP.t2, display:'block', marginBottom:8 }}>Grupo de treino</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {myPrograms.map(p=>(
                <button key={p.id} onClick={()=>setSelectedProgram(p.id)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:100, border:`1px solid ${selectedProgram===p.id?GP.green:GP.border}`, background:selectedProgram===p.id?GP.greenLt:'transparent', color:selectedProgram===p.id?GP.greenDk:GP.t2, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {selectedProgram===p.id && <GpIcon.Check s={13} c={GP.greenDk}/>}{p.name}
                </button>
              ))}
              <button onClick={()=>{ const id=addProgram('Novo Grupo'); setSelectedProgram(id); }} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:100, border:`1px dashed ${GP.border}`, background:'transparent', color:GP.t2, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                <GpIcon.Plus s={13} c={GP.t2}/> Novo grupo
              </button>
            </div>
          </div>
        </GpCard>

        {/* Exercises */}
        {exercises.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {exercises.map((ex,i)=>(
              <GpCard key={ex.id} padded={false} style={{ overflow:'visible' }}>
                <div style={{ padding:'14px 16px', display:'flex', gap:12 }}>
                  <ExerciseMedia ex={ex} size={64} radius={12} />
                  <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:GROUP_COLORS[ex.group]||GP.green, flexShrink:0 }} />
                    <div style={{ flex:1, fontSize:14, fontWeight:700, color:GP.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ex.name}</div>
                    <span style={{ fontSize:11, color:GP.t3 }}>{ex.group}</span>
                    <div style={{ display:'flex', gap:2 }}>
                      <button onClick={()=>moveEx(ex.id,-1)} style={{ border:'none', background:'none', cursor:'pointer', padding:4, color:GP.t3 }}><GpIcon.ArrowUp s={14}/></button>
                      <button onClick={()=>moveEx(ex.id,1)} style={{ border:'none', background:'none', cursor:'pointer', padding:4, color:GP.t3 }}><GpIcon.ArrowDown s={14}/></button>
                      <button onClick={()=>removeEx(ex.id)} style={{ border:'none', background:'none', cursor:'pointer', padding:4, color:GP.red }}><GpIcon.X s={14}/></button>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                    {[
                      { label:'Séries', field:'sets', unit:'' },
                      { label:'Reps', field:'reps', unit:'' },
                      { label:'Peso', field:'weight', unit:'kg' },
                      { label:'Descanso', field:'rest', unit:'s' },
                    ].map(f=>(
                      <div key={f.field} style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'center' }}>
                        <span style={{ fontSize:10, fontWeight:600, color:GP.t3 }}>{f.label}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <button onClick={()=>updateEx(ex.id,f.field,Math.max(0,(ex[f.field]||0)-(f.field==='rest'?15:1)))} style={{ width:24, height:24, borderRadius:7, border:`1px solid ${GP.border}`, background:GP.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><GpIcon.Minus s={12} c={GP.t2}/></button>
                          <span style={{ fontSize:14, fontWeight:700, color:GP.t1, minWidth:28, textAlign:'center' }}>{ex[f.field]}{f.unit}</span>
                          <button onClick={()=>updateEx(ex.id,f.field,(ex[f.field]||0)+(f.field==='rest'?15:1))} style={{ width:24, height:24, borderRadius:7, border:`1px solid ${GP.border}`, background:GP.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><GpIcon.Plus s={12} c={GP.t1}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                </div>
              </GpCard>
            ))}
          </div>
        )}

        {exercises.length === 0 && (
          <div style={{ border:`2px dashed ${GP.border}`, borderRadius:20, padding:'32px 24px', textAlign:'center', color:GP.t3, fontSize:14 }}>
            Adiciona exercícios ao treino
          </div>
        )}

        <GpBtn fullWidth variant="outline" size="lg" onClick={()=>setShowPicker(true)} icon={<GpIcon.Plus s={18} c={GP.green}/>}>
          Adicionar Exercício
        </GpBtn>
      </div>

      {/* Exercise picker */}
      <GpModal open={showPicker} onClose={()=>setShowPicker(false)} title="Escolher Exercício">
        <div style={{ paddingTop:16 }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
            {Object.keys(EXERCISE_DB).map(g=>(
              <button key={g} onClick={()=>setPickerGroup(g)} style={{ padding:'6px 12px', borderRadius:100, border:'none', background:pickerGroup===g?GP.green:GP.bg, color:pickerGroup===g?GP.white:GP.t2, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{g}</button>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {EXERCISE_DB[pickerGroup]?.map(ex=>(
              <button key={ex} onClick={()=>addExercise(ex)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 4px', border:'none', background:'none', borderBottom:`1px solid ${GP.border}`, cursor:'pointer', textAlign:'left', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:GROUP_COLORS[pickerGroup]||GP.green }} />
                  <span style={{ fontSize:14, color:GP.t1, fontWeight:500 }}>{ex}</span>
                </div>
                <GpIcon.Plus s={16} c={GP.green}/>
              </button>
            ))}
          </div>
        </div>
      </GpModal>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PROFILE SCREEN
// ═══════════════════════════════════════════════════════════════
const ProfileScreen = () => {
  const { user, setUser, logs, workouts } = useApp();
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 1024);
  React.useEffect(()=>{ const fn=()=>setIsDesktop(window.innerWidth>=1024); window.addEventListener('resize',fn); return ()=>window.removeEventListener('resize',fn); },[]);

  const memberSince = user?.memberSince ? new Date(user.memberSince).toLocaleDateString('pt-PT',{month:'long',year:'numeric'}) : '';
  const monthDiff = user?.memberSince ? Math.round((new Date()-new Date(user.memberSince))/(1000*60*60*24*30)) : 0;

  const statCards = [
    { icon:<GpIcon.Dumbbell s={20} c={GP.green}/>, value:logs.length, label:'Treinos', sub:'realizados' },
    { icon:<GpIcon.Fire s={20} c={GP.orange}/>, value:`${user?.streak||0}🔥`, label:'Streak', sub:'dias seguidos' },
    { icon:<GpIcon.Trophy s={20} c="#F59E0B"/>, value:workouts.length, label:'Planos', sub:'de treino' },
    { icon:<GpIcon.Clock s={20} c={GP.t2}/>, value:monthDiff, label:'Meses', sub:'de membro' },
  ];

  const settings = [
    { label:'Notificações', sub:'Lembretes de treino', icon:<GpIcon.Zap s={18} c={GP.green}/> },
    { label:'Unidades', sub:'Quilogramas (kg)', icon:<GpIcon.Scale s={18} c={GP.t2}/> },
    { label:'Conta', sub:user?.email, icon:<GpIcon.User s={18} c={GP.t2}/> },
    { label:'Privacidade', sub:'Gerir dados', icon:<GpIcon.Lock s={18} c={GP.t2}/> },
    { label:'Suporte', sub:'Ajuda e contacto', icon:<GpIcon.Settings s={18} c={GP.t2}/> },
  ];

  return (
    <div style={{ padding: isDesktop?'32px 36px':'20px' }}>
      {/* Hero */}
      <GpCard style={{ marginBottom:20, padding:'28px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
          <GpAvatar name={user?.name} size={72} />
          <div>
            <div style={{ fontSize:22, fontWeight:900, color:GP.t1, letterSpacing:'-0.02em' }}>{user?.name}</div>
            <div style={{ fontSize:13, color:GP.t2, marginTop:3 }}>Membro desde {memberSince}</div>
            <GpBadge color="green" style={{ marginTop:8 }}>Membro Ativo</GpBadge>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
          <div style={{ background:GP.bg, borderRadius:12, padding:'12px 14px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:GP.t3 }}>TEMPO TREINADO</div>
            <div style={{ fontSize:20, fontWeight:900, color:GP.t1 }}>{Math.round(logs.reduce((a,l)=>a+(l.duration||0),0)/60)}<span style={{fontSize:13,fontWeight:500,color:GP.t2}}>h</span></div>
          </div>
          <div style={{ background:GP.bg, borderRadius:12, padding:'12px 14px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:GP.t3 }}>SÉRIES FEITAS</div>
            <div style={{ fontSize:20, fontWeight:900, color:GP.t1 }}>{logs.reduce((a,l)=>a+(l.totalSets||0),0)}<span style={{fontSize:13,fontWeight:500,color:GP.t2}}> séries</span></div>
          </div>
        </div>
      </GpCard>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:20 }}>
        {statCards.map((s,i)=>(
          <GpCard key={i} style={{ padding:'16px 18px' }}>
            <div style={{ marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:26, fontWeight:900, color:GP.t1 }}>{s.value}</div>
            <div style={{ fontSize:13, fontWeight:700, color:GP.t1 }}>{s.label}</div>
            <div style={{ fontSize:11, color:GP.t2 }}>{s.sub}</div>
          </GpCard>
        ))}
      </div>

      {/* Theme toggle */}
      <GpCard style={{ marginBottom:20, padding:'14px 16px' }}>
        <GpThemeToggle />
      </GpCard>

      {/* Settings */}
      <GpCard padded={false}>
        {settings.map((s,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'15px 20px', borderBottom:i<settings.length-1?`1px solid ${GP.border}`:'none', cursor:'pointer' }}>
            <div style={{ width:38, height:38, borderRadius:12, background:GP.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>{s.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:GP.t1 }}>{s.label}</div>
              <div style={{ fontSize:12, color:GP.t2 }}>{s.sub}</div>
            </div>
            <GpIcon.ChevRight s={16} c={GP.t3}/>
          </div>
        ))}
      </GpCard>

      <div style={{ marginTop:20 }}>
        <GpBtn fullWidth variant="outline" onClick={()=>setUser(null)} style={{ color:GP.red, borderColor:GP.red }}>
          Terminar Sessão
        </GpBtn>
      </div>
    </div>
  );
};

Object.assign(window, { EXERCISE_DB, GROUP_COLORS, fmtDate, LoginScreen, DashboardScreen, WorkoutsScreen, HistoryScreen, ProgressScreen, CreateWorkoutScreen, ProfileScreen });
