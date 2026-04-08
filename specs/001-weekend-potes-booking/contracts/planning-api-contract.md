# Planning API Contract

## Operations
- getPlanning(fromDate,toDate)
- reserveWeekend(weekendLabel,guestName,guestEmail,message)
- upsertWeekSession(sessionId,date,startTime,endTime,guestName,notes)

## Errors
- INVALID_RANGE
- SHEET_UNAVAILABLE
- CONFLICT_UNAVAILABLE
- CONFLICT_SCHEDULE
- VALIDATION_ERROR

## Requirements
- Dates strictes
- Enums valides
- Erreurs avec code + message
