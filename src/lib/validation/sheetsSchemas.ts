import { z } from 'zod'

export const reservationStatusSchema = z.enum(['available', 'reserved', 'blocked'])

export const weekendReservationSchema = z.object({
  id: z.string().min(1),
  weekendLabel: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  status: reservationStatusSchema,
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  message: z.string().optional(),
  reservedAt: z.string().optional(),
  sourceRowRef: z.string().optional(),
})

export const weekSessionSchema = z
  .object({
    id: z.string().min(1),
    date: z.string().min(1),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    guestName: z.string().min(1),
    notes: z.string().optional(),
    status: z.enum(['planned', 'confirmed', 'cancelled']),
    createdAt: z.string().optional(),
  })
  .refine((v) => v.startTime < v.endTime, {
    message: 'startTime must be before endTime',
    path: ['startTime'],
  })

export const availabilityBlockSchema = z.object({
  id: z.string().min(1),
  category: z.enum(['libre', 'alex', 'jenna', 'invites', 'vacances', 'pont']),
  person: z.enum(['alex', 'jenna', 'tous']),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  note: z.string().optional(),
})
