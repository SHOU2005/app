import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=5a5aec&color=fff&bold=true&format=svg`
}

export const ROLES = {
  helper: 'Helper',
  shopAssistant: 'Shop Assistant',
  driver: 'Driver',
  deliveryBoy: 'Delivery Boy',
  security: 'Security Guard',
  warehouseWorker: 'Warehouse Worker',
  kitchen: 'Kitchen Staff',
  cleaning: 'Cleaning Staff',
} as const

export type RoleKey = keyof typeof ROLES

export const DURATIONS = [4, 8, 12] as const

export function calculateShiftCost(hours: number, workers: number, isUrgent: boolean) {
  const base = hours * workers * 200
  const urgentFee = isUrgent ? 99 : 0
  return { base, urgentFee, total: base + urgentFee }
}

export function getBookingStatusColor(status: string) {
  switch (status) {
    case 'PENDING':    return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'CONFIRMED':  return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'IN_PROGRESS': return 'bg-green-100 text-green-700 border-green-200'
    case 'COMPLETED':  return 'bg-indigo-100 text-indigo-700 border-indigo-200'
    case 'CANCELLED':  return 'bg-red-100 text-red-700 border-red-200'
    case 'NO_SHOW':    return 'bg-gray-100 text-gray-600 border-gray-200'
    default:           return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}
