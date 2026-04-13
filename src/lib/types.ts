/** Solo weekend slot returned by GET ?action=getSoloWeekends */
export interface SoloWeekendSlot {
  rowIndex: number
  label: string
  dateDebut: string
  dateFin: string
}

/** Solo reservation form data sent via POST */
export interface SoloReservationPayload {
  action: 'soloReservation'
  rowIndex: number
  nom: string
  email: string
  message: string
  joursChoisis: string
}

/** Response from the Apps Script POST */
export interface ApiResponse {
  success: boolean
  message: string
}
