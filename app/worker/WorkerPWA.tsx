'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useLanguage } from './LanguageContext'
import { registerFCMToken, setupForegroundMessages } from '@/lib/fcm-client'

interface UrgentJob {
  shiftId: string
  title: string
  location: string
  pay: string
}

export default function WorkerPWA() {
  const { t } = useLanguage()
  const [prompt,      setPrompt]      = useState<any>(null)
  const [show,        setShow]        = useState(false)
  const [installed,   setInstalled]   = useState(false)
  const [urgentJob,   setUrgentJob]   = useState<UrgentJob | null>(null)
  const [countdown,   setCountdown]   = useState(30)
  const [accepting,   setAccepting]   = useState(false)
  const [accepted,    setAccepted]    = useState(false)
  const [raceError,   setRaceError]   = useState(false)

  const soundRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const countRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const ctxRef      = useRef<AudioContext | null>(null)

  const stopUrgentSound = useCallback(() => {
    if (soundRef.current) { clearInterval(soundRef.current); soundRef.current = null }
    if (ctxRef.current)   { ctxRef.current.close().catch(() => {}); ctxRef.current = null }
    if (countRef.current) { clearInterval(countRef.current); countRef.current = null }
  }, [])

  const dismissUrgent = useCallback(() => {
    stopUrgentSound()
    setUrgentJob(null)
    setCountdown(30)
    setAccepted(false)
    setRaceError(false)
    setAccepting(false)
  }, [stopUrgentSound])

  function playUrgentChime() {
    try {
      if (!ctxRef.current || ctxRef.current.state === 'closed') {
        ctxRef.current = new AudioContext()
      }
      const ctx  = ctxRef.current
      const play = (freq: number, start: number, dur: number) => {
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
        gain.gain.setValueAtTime(0, ctx.currentTime + start)
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
        osc.start(ctx.currentTime + start)
        osc.stop(ctx.currentTime + start + dur)
      }
      play(880, 0,    0.18)
      play(1100, 0.2, 0.18)
      play(1320, 0.4, 0.25)
    } catch { /* AudioContext not available */ }
  }

  function startUrgentAlert(job: UrgentJob) {
    setUrgentJob(job)
    setCountdown(30)
    setAccepted(false)
    setRaceError(false)
    setAccepting(false)

    // Play immediately then every 4s
    playUrgentChime()
    soundRef.current = setInterval(playUrgentChime, 4000)

    // Countdown
    countRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          dismissUrgent()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function acceptUrgentJob() {
    if (!urgentJob || accepting) return
    setAccepting(true)
    stopUrgentSound()
    try {
      const res = await fetch(`/api/shifts/${urgentJob.shiftId}/accept`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type: 'URGENT' }),
      })
      if (res.status === 409) {
        setRaceError(true)
        setTimeout(dismissUrgent, 2500)
        return
      }
      if (!res.ok) throw new Error()
      setAccepted(true)
      setTimeout(dismissUrgent, 2500)
    } catch {
      setAccepting(false)
    }
  }

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/worker-sw.js', { scope: '/' }).catch(() => {})
    }

    registerFCMToken().catch(() => {})

    setupForegroundMessages((payload: any) => {
      const data = payload?.data || {}
      if (data.type === 'URGENT_JOB') {
        const job: UrgentJob = {
          shiftId:  data.shiftId  || '',
          title:    data.title    || payload?.notification?.title || 'Urgent Job',
          location: data.location || '',
          pay:      data.pay      || '',
        }
        startUrgentAlert(job)
      }
    }).catch(() => {})

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    if (sessionStorage.getItem('worker_pwa_dismissed')) return

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler as any)
    window.addEventListener('appinstalled', () => { setInstalled(true); setShow(false) })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as any)
      stopUrgentSound()
    }
  }, [])

  async function install() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setShow(false)
    sessionStorage.setItem('worker_pwa_dismissed', '1')
  }

  function dismiss() {
    setShow(false)
    sessionStorage.setItem('worker_pwa_dismissed', '1')
  }

  return (
    <>
      {/* ── Urgent Job Overlay ── */}
      {urgentJob && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 20000,
          background: 'rgba(0,0,0,0.96)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: '"DM Sans", system-ui, sans-serif',
          padding: '32px 24px',
          paddingTop:    'calc(32px + env(safe-area-inset-top))',
          paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
        }}>
          <style>{`
            @keyframes urgentPulse {
              0%,100% { box-shadow: 0 0 0 0 rgba(255,59,48,0.6); }
              50%      { box-shadow: 0 0 0 24px rgba(255,59,48,0); }
            }
            @keyframes urgentIn {
              from { opacity: 0; transform: scale(0.88) translateY(20px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes urgentPing {
              0%   { transform: scale(1); opacity: 0.8; }
              100% { transform: scale(2.2); opacity: 0; }
            }
          `}</style>

          <div style={{
            animation: 'urgentIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            width: '100%', maxWidth: 360,
          }}>

            {/* Pulsing icon */}
            <div style={{ position: 'relative', marginBottom: 28 }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(255,59,48,0.3)',
                animation: 'urgentPing 1.2s ease-out infinite',
              }} />
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF3B30 0%, #FF6B35 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 40,
                animation: 'urgentPulse 1.5s ease-in-out infinite',
                position: 'relative', zIndex: 1,
              }}>⚡</div>
            </div>

            <p style={{
              fontSize: 13, fontWeight: 700, color: '#FF3B30',
              letterSpacing: 2, textTransform: 'uppercase',
              margin: '0 0 8px',
            }}>
              URGENT JOB — FIRST TO ACCEPT
            </p>

            <p style={{
              fontSize: 26, fontWeight: 900, color: '#FFFFFF',
              margin: '0 0 6px', textAlign: 'center', letterSpacing: -0.5,
            }}>
              {urgentJob.title}
            </p>

            {urgentJob.location && (
              <p style={{
                fontSize: 15, color: 'rgba(255,255,255,0.55)',
                margin: '0 0 6px', textAlign: 'center',
              }}>
                📍 {urgentJob.location}
              </p>
            )}

            {urgentJob.pay && (
              <p style={{
                fontSize: 22, fontWeight: 800, color: '#4CD964',
                margin: '0 0 28px',
              }}>
                {urgentJob.pay}
              </p>
            )}

            {/* Countdown ring */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              border: `4px solid ${countdown <= 10 ? '#FF3B30' : 'rgba(255,255,255,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 28,
              transition: 'border-color 0.3s',
            }}>
              <span style={{
                fontSize: 20, fontWeight: 900,
                color: countdown <= 10 ? '#FF3B30' : 'rgba(255,255,255,0.6)',
                transition: 'color 0.3s',
              }}>{countdown}</span>
            </div>

            {/* States */}
            {accepted && (
              <div style={{
                background: 'rgba(76,217,100,0.15)',
                border: '1px solid rgba(76,217,100,0.4)',
                borderRadius: 16, padding: '16px 24px',
                textAlign: 'center', width: '100%', marginBottom: 14,
              }}>
                <p style={{ fontSize: 20, margin: 0, fontWeight: 800, color: '#4CD964' }}>
                  Job Accepted!
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
                  Redirecting to your dashboard...
                </p>
              </div>
            )}

            {raceError && (
              <div style={{
                background: 'rgba(255,59,48,0.12)',
                border: '1px solid rgba(255,59,48,0.35)',
                borderRadius: 16, padding: '16px 24px',
                textAlign: 'center', width: '100%', marginBottom: 14,
              }}>
                <p style={{ fontSize: 18, margin: 0, fontWeight: 800, color: '#FF3B30' }}>
                  Someone else got it!
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
                  Keep swiping for more jobs
                </p>
              </div>
            )}

            {!accepted && !raceError && (
              <>
                <button
                  onClick={acceptUrgentJob}
                  disabled={accepting}
                  style={{
                    width: '100%', height: 62, borderRadius: 20,
                    border: 'none',
                    background: accepting
                      ? 'rgba(76,217,100,0.3)'
                      : 'linear-gradient(135deg, #4CD964 0%, #34C759 100%)',
                    color: '#FFFFFF', fontSize: 19, fontWeight: 900,
                    cursor: accepting ? 'wait' : 'pointer',
                    marginBottom: 12,
                    letterSpacing: -0.3,
                    boxShadow: accepting ? 'none' : '0 8px 24px rgba(76,217,100,0.35)',
                    transition: 'all 0.2s',
                  }}
                >
                  {accepting ? '⏳ Claiming...' : '⚡ Accept Now'}
                </button>

                <button
                  onClick={dismissUrgent}
                  style={{
                    width: '100%', height: 46, borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Skip
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── PWA Install Prompt ── */}
      {show && !installed && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: '#111111',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: '"DM Sans", system-ui, sans-serif',
          padding: '32px 24px',
          paddingTop:    'calc(32px + env(safe-area-inset-top))',
          paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
          animation: 'wpwaFadeIn 0.4s ease',
        }}>
          <style>{`
            @keyframes wpwaFadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes wpwaUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
            .wpwa-install:hover { background: #F0F0F0 !important; }
            .wpwa-later:hover   { background: rgba(255,255,255,0.08) !important; }
          `}</style>

          <div style={{
            position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
            width: 280, height: 280, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ animation: 'wpwaUp 0.5s ease forwards', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 340 }}>

            <div style={{
              width: 100, height: 100, borderRadius: 28,
              background: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 28,
              boxShadow: '0 0 60px rgba(255,255,255,0.1), 0 0 120px rgba(255,255,255,0.04)',
            }}>
              <span style={{ fontSize: 58, fontWeight: 900, color: '#111111', lineHeight: 1, letterSpacing: -3, fontFamily: '"DM Sans", sans-serif' }}>S</span>
            </div>

            <p style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', margin: '0 0 8px', letterSpacing: -1, textAlign: 'center' }}>
              {t('appName')}
            </p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: '0 0 32px', textAlign: 'center' }}>
              {t('appTagline')}
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['⚡ Instant access', '📴 Works offline', '🔔 Notifications'].map(f => (
                <div key={f} style={{
                  padding: '6px 14px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
                  whiteSpace: 'nowrap' as const,
                }}>{f}</div>
              ))}
            </div>

            <button
              className="wpwa-install"
              onClick={install}
              style={{
                width: '100%', height: 58, borderRadius: 18,
                border: 'none', background: '#FFFFFF',
                color: '#111111', fontSize: 17, fontWeight: 800,
                cursor: 'pointer', marginBottom: 14,
                transition: 'background 0.15s',
                letterSpacing: -0.3,
              }}
            >
              {t('installBtn')}
            </button>

            <button
              className="wpwa-later"
              onClick={dismiss}
              style={{
                width: '100%', height: 48, borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {t('installLater')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
