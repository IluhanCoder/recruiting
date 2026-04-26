export interface ManagerDashboard {
  candidates: {
    total: number
    available: number
    leased: number
  }
  bookings: {
    total: number
    new: number
    approved: number
    completed: number
    rejected: number
    client_rejected: number
    cancelled: number
  }
  companies: {
    total: number
  }
  positions: {
    total: number
    open: number
    archived: number
  }
}

export interface ClientDashboard {
  companies: {
    total: number
  }
  positions: {
    total: number
    open: number
    archived: number
  }
  bookings: {
    total: number
    new: number
    approved: number
    completed: number
  }
}
