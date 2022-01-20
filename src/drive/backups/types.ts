export interface Device {
  id: number
  name: string
  mac: string
  userId: number
  createdAt: string
  updatedAt: string
  size: number
  platform: string | null
}