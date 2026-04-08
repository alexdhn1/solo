# Data Model

## WeekendReservation
Fields: id, weekendLabel, startDate, endDate, status, guestName, guestEmail, message, reservedAt

## WeekSession
Fields: id, date, startTime, endTime, guestName, notes, status, createdAt

## AvailabilityBlock
Fields: id, category, person, startDate, endDate, note

## PlanningViewItem
Fields: id, itemType, title, startDateTime, endDateTime, availability, conflictFlag

## SheetMappingRule
Fields: sourceSheet, sourceColumn, targetField, parser, required, fallbackBehavior
