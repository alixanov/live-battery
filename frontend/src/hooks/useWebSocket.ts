import { useEffect, useRef, useCallback } from 'react'

type WSMessage = { type: string; data?: unknown }

export function useVehicleWebSocket(vehicleId: string, onMessage: (msg: WSMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const onMsgRef = useRef(onMessage)
  onMsgRef.current = onMessage

  const connect = useCallback(() => {
    if (!vehicleId) return
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${window.location.host}/ws/live/${vehicleId}`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WSMessage
        if (msg.type !== 'ping') onMsgRef.current(msg)
      } catch {}
    }

    ws.onclose = () => setTimeout(connect, 3000)
    ws.onerror = () => ws.close()
  }, [vehicleId])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
    }
  }, [connect])
}
