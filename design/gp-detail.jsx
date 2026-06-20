// gp-detail.jsx — Workout overview/preview screen (before starting)

const ExerciseMedia = ({ ex, size = 88, radius = 16 }) => (
  <div style={{ width: size, height: size, flexShrink: 0, position: 'relative' }}>
    <image-slot
      id={`gp-ex-${ex.id}`}
      shape="rounded"
      radius={String(radius)}
      placeholder="＋ vídeo / imagem"
      style={{ width: size, height: size, color: GP.t3, fontSize: '10px' }}
    ></image-slot>
  </div>
);

const SetPills = ({ ex }) => {
  const pills = Array.from({ length: ex.sets }, (_, i) => i);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {pills.map(i => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: GP.bg, border: `1px solid ${GP.border}`, borderRadius: 9, padding: '4px 9px', fontSize: 12, fontWeight: 600, color: GP.t2 }}>
          <span style={{ color: GP.t3, fontWeight: 700, fontSize: 10 }}>{i + 1}</span>
          <span style={{ color: GP.t1 }}>{ex.reps}</span>
          <span style={{ color: GP.t3 }}>reps</span>
          {ex.weight > 0 && <span style={{ color: GP.greenDk, fontWeight: 700 }}>{ex.weight}kg</span>}
        </span>
      ))}
    </div>
  );
};

const WorkoutDetailScreen = ({ workout }) => {
  const { navigate, startWorkout } = useApp();
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 1024);
  React.useEffect(() => { const fn = () => setIsDesktop(window.innerWidth >= 1024); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);

  if (!workout) { navigate('workouts'); return null; }

  const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);
  const totalVolume = workout.exercises.reduce((a, e) => a + e.sets * e.reps * e.weight, 0);
  const estMin = Math.round(workout.exercises.reduce((a, e) => a + e.sets * (e.rest + 35) / 60, 0));

  return (
    <div style={{ paddingBottom: isDesktop ? 100 : 172 }}>
      {/* Hero header */}
      <div style={{ background: GP.dark, padding: isDesktop ? '28px 36px 32px' : '20px 20px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${GP.green}22 0%, transparent 70%)` }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto' }}>
          <button onClick={() => navigate('workouts')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12, padding: '8px 14px 8px 10px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 20, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <GpIcon.Back s={16} c="#fff" /> Voltar
          </button>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {workout.muscleGroups.map(g => (
              <span key={g} style={{ fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 100, background: `${GROUP_COLORS[g] || GP.green}33`, color: '#fff' }}>{g}</span>
            ))}
          </div>
          <div style={{ fontSize: isDesktop ? 36 : 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 18 }}>{workout.name}</div>
          <div style={{ display: 'flex', gap: isDesktop ? 28 : 18, flexWrap: 'wrap' }}>
            {[
              { v: workout.exercises.length, l: 'exercícios', icon: <GpIcon.List s={15} c={GP.green} /> },
              { v: totalSets, l: 'séries', icon: <GpIcon.Zap s={15} c={GP.green} /> },
              { v: `~${estMin}'`, l: 'duração', icon: <GpIcon.Clock s={15} c={GP.green} /> },
              { v: `${(totalVolume / 1000).toFixed(1)}t`, l: 'volume', icon: <GpIcon.Target s={15} c={GP.green} /> },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{s.icon}<span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{s.v}</span></div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div style={{ padding: isDesktop ? '24px 36px' : '18px 16px', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: GP.t1 }}>Plano de Exercícios</div>
          {workout.owner !== 'coach' && (
            <button onClick={() => navigate('edit', { workout, programId: workout.programId })} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: GP.green, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <GpIcon.Edit s={15} c={GP.green} /> Editar
            </button>
          )}
          {workout.owner === 'coach' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: GP.t3, fontWeight: 600, fontSize: 13 }}>
              <GpIcon.Lock s={14} c={GP.t3} /> Plano do coach
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {workout.exercises.map((ex, i) => (
            <GpCard key={ex.id} padded={false}>
              <div style={{ padding: 14, display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <ExerciseMedia ex={ex} size={isDesktop ? 92 : 78} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: GP.t3 }}>#{i + 1}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: GP.t1 }}>{ex.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: `${GROUP_COLORS[ex.group] || GP.green}18`, color: GROUP_COLORS[ex.group] || GP.green }}>{ex.group}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 12.5, color: GP.t2 }}>
                    <span><b style={{ color: GP.t1 }}>{ex.sets}</b> séries</span>
                    <span><b style={{ color: GP.t1 }}>{ex.reps}</b> reps</span>
                    {ex.weight > 0 && <span><b style={{ color: GP.t1 }}>{ex.weight}</b> kg</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><GpIcon.Timer s={13} c={GP.t3} />{ex.rest}s</span>
                  </div>
                  <SetPills ex={ex} />
                </div>
              </div>
            </GpCard>
          ))}
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 14, background: GP.greenXlt, color: GP.greenDk }}>
          <GpIcon.Info s={18} c={GP.greenDk} />
          <span style={{ fontSize: 12.5, fontWeight: 500 }}>Arrasta uma imagem ou GIF para cada exercício para o ilustrares. Vê o plano completo antes de começares.</span>
        </div>
      </div>

      {/* Sticky start bar */}
      <div style={{ position: 'fixed', bottom: isDesktop ? 0 : 80, left: isDesktop ? 248 : 0, right: 0, padding: '14px 16px calc(14px + env(safe-area-inset-bottom, 0px))', background: GP.mode === 'dark' ? 'rgba(26,29,33,0.92)' : 'rgba(255,255,255,0.96)', borderTop: `1px solid ${GP.border}`, backdropFilter: 'blur(20px)', zIndex: 90 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', gap: 12 }}>
          <GpBtn variant="dark" size="lg" onClick={() => startWorkout(workout)} fullWidth icon={<GpIcon.Play s={17} c="#fff" />} style={{ flex: 2 }}>
            Começar Treino
          </GpBtn>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { WorkoutDetailScreen, ExerciseMedia, SetPills });
