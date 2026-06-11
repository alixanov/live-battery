import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'

// ── Vehicles ──────────────────────────────────────────────
export const useVehicles = () =>
  useQuery({ queryKey: ['vehicles'], queryFn: () => api.get('/vehicles').then(r => r.data) })

export const useVehicle = (id: string) =>
  useQuery({ queryKey: ['vehicle', id], queryFn: () => api.get(`/vehicles/${id}`).then(r => r.data), enabled: !!id })

// ── Predictions ───────────────────────────────────────────
export const useLatestPrediction = (vehicleId: string) =>
  useQuery({
    queryKey: ['prediction-latest', vehicleId],
    queryFn: () => api.get(`/predictions/${vehicleId}/latest`).then(r => r.data),
    enabled: !!vehicleId,
    refetchInterval: 5_000,
  })

export const usePredictionHistory = (vehicleId: string, limit = 50) =>
  useQuery({
    queryKey: ['prediction-history', vehicleId, limit],
    queryFn: () => api.get(`/predictions/${vehicleId}/history?limit=${limit}`).then(r => r.data),
    enabled: !!vehicleId,
    refetchInterval: 15_000,
  })

// ── Alerts ────────────────────────────────────────────────
export const useAlerts = (activeOnly = true) =>
  useQuery({
    queryKey: ['alerts', activeOnly],
    queryFn: () => api.get(`/alerts?active_only=${activeOnly}`).then(r => r.data),
    refetchInterval: 8_000,
  })

export const useVehicleAlerts = (vehicleId: string, activeOnly = true) =>
  useQuery({
    queryKey: ['alerts', vehicleId, activeOnly],
    queryFn: () => api.get(`/alerts/${vehicleId}?active_only=${activeOnly}`).then(r => r.data),
    enabled: !!vehicleId,
    refetchInterval: 8_000,
  })

export const useAlertStats = () =>
  useQuery({ queryKey: ['alert-stats'], queryFn: () => api.get('/alerts/stats/summary').then(r => r.data), refetchInterval: 10_000 })

export const useResolveAlert = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (alertId: string) => api.patch(`/alerts/${alertId}/resolve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })
}

// ── Telemetry ─────────────────────────────────────────────
export const useTelemetry = (vehicleId: string, limit = 100) =>
  useQuery({
    queryKey: ['telemetry', vehicleId, limit],
    queryFn: () => api.get(`/telemetry/${vehicleId}?limit=${limit}`).then(r => r.data),
    enabled: !!vehicleId,
    refetchInterval: 10_000,
  })

// ── Auth ──────────────────────────────────────────────────
export const useLogin = () =>
  useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post('/auth/login', data).then(r => r.data),
  })

export const useRegister = () =>
  useMutation({
    mutationFn: (data: { email: string; password: string; name: string }) =>
      api.post('/auth/register', data).then(r => r.data),
  })
