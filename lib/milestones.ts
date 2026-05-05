export const MILESTONES = [
  { level: 0, label: 'Starter',  emoji: '🌱', minJobs: 0,  maxJobs: 4,  bonus: 0   },
  { level: 1, label: 'Bronze',   emoji: '🥉', minJobs: 5,  maxJobs: 9,  bonus: 10  },
  { level: 2, label: 'Silver',   emoji: '🥈', minJobs: 10, maxJobs: 24, bonus: 25  },
  { level: 3, label: 'Gold',     emoji: '🥇', minJobs: 25, maxJobs: 49, bonus: 40  },
  { level: 4, label: 'Platinum', emoji: '💎', minJobs: 50, maxJobs: Infinity, bonus: 60 },
]

export function getMilestone(totalShifts: number) {
  return [...MILESTONES].reverse().find(m => totalShifts >= m.minJobs) ?? MILESTONES[0]
}

export function getNextMilestone(totalShifts: number) {
  return MILESTONES.find(m => m.minJobs > totalShifts) ?? null
}

export function getProgress(totalShifts: number) {
  const current = getMilestone(totalShifts)
  const next    = getNextMilestone(totalShifts)
  if (!next) return { pct: 100, remaining: 0, current, next: null }
  const range   = next.minJobs - current.minJobs
  const done    = totalShifts - current.minJobs
  return { pct: Math.round((done / range) * 100), remaining: next.minJobs - totalShifts, current, next }
}
