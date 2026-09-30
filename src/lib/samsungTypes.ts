export interface SamsungFetchItem {
  sale_number: string | null
  sku_number: string
  number: string | null
  quantity: number | null
  return_code: string | null
}

export interface SamsungFetchOrder {
  order_number: string
  do_no: string
  customer_cd: string
  service_type: string
  items: SamsungFetchItem[]
}

export interface SamsungFetchResponse {
  success?: boolean
  message?: string
  service_orders?: SamsungFetchOrder[]
}

export interface SamsungExportDetail {
  order_number: string
  do_no: string
  customer_cd: string
  first_name: string
  last_name: string
  descBySku: Record<string, string>
}

export interface SamsungOverrides {
  firstName: string
  lastName: string
  rdd: string
  eta: string
}

export interface SamsungRunConfig {
  code: string
  serviceRouteId: string
  timeStamp: string
  apiKey: string
  templateText: string
  carryOrderFields: boolean
  overrides: SamsungOverrides
  useProxy: boolean
}

export type SamsungOrderStatus = 'built' | 'export-failed'

export interface SamsungOrderResult {
  orderNumber: string
  doNo: string
  customerName: string
  itemCount: number
  status: SamsungOrderStatus
  error?: string
  payload: Record<string, unknown>
}

export interface SamsungRunSummary {
  fetchMessage: string
  totalOrders: number
  orders: SamsungOrderResult[]
  startedAt: number
  finishedAt: number
}
