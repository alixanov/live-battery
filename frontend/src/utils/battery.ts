export function socColor(soc: number): string {
  if (soc >= 60) return '#22c55e'
  if (soc >= 30) return '#f59e0b'
  return '#ef4444'
}

export function sohColor(soh: number): string {
  if (soh >= 80) return '#22c55e'
  if (soh >= 60) return '#f59e0b'
  return '#ef4444'
}

export function sohLabel(soh: number): string {
  if (soh >= 80) return 'Норма'
  if (soh >= 60) return 'Внимание'
  return 'Критично'
}

export function priorityClass(priority: string): string {
  return `badge-${priority.toLowerCase()}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
