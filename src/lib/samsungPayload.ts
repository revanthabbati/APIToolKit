import type { SamsungExportDetail, SamsungFetchItem, SamsungFetchOrder, SamsungOverrides } from './samsungTypes'

const SERVICE_SKU_PREFIX = /^(l|p)-/i

function isServiceSku(sku: string): boolean {
  return SERVICE_SKU_PREFIX.test(sku)
}

function mapItem(item: SamsungFetchItem, descBySku: Record<string, string>): Record<string, unknown> {
  const sku = String(item.sku_number ?? '')
  const out: Record<string, unknown> = {
    doItemNo: String(item.sale_number ?? ''),
    qty: item.quantity !== null && item.quantity !== undefined ? String(item.quantity) : '',
    modelCd: sku,
    modelDesc: descBySku[sku] ?? '',
    productCate: '',
    grossWeight: '',
    weightUnit: '',
    volume: '',
    volumeUnit: '',
    dimension: '',
    serialList: [{ serialNo: String(item.number ?? '') }],
  }
  if (isServiceSku(sku)) out.serviceList = []
  return out
}

interface DoList {
  doNo?: unknown
  customerCd?: unknown
  conFirstName?: unknown
  conLastName?: unknown
  rdd?: unknown
  eta?: unknown
  doItemList?: unknown
  [key: string]: unknown
}

export interface ImportTemplate {
  deliveryOrderRequest: {
    doList: DoList[]
    [key: string]: unknown
  }
}

export interface BuiltSamsungPayload {
  payload: Record<string, unknown>
  doNo: string
  customerName: string
}

export function buildSamsungPayload(
  template: ImportTemplate,
  order: SamsungFetchOrder,
  details: SamsungExportDetail | undefined,
  overrides: SamsungOverrides,
  carryOrderFields: boolean,
): BuiltSamsungPayload {
  const payload = JSON.parse(JSON.stringify(template)) as ImportTemplate
  const doList = payload.deliveryOrderRequest.doList[0]

  if (details) {
    doList.conFirstName = details.first_name
    doList.conLastName = details.last_name
    if (details.customer_cd) doList.customerCd = details.customer_cd
  }

  if (carryOrderFields) {
    if (order.do_no) doList.doNo = String(order.do_no)
    if (order.customer_cd && !details?.customer_cd) doList.customerCd = String(order.customer_cd)
  }

  // User overrides win last. Treated as "not provided" when blank, rather than
  // the Python reference's None-vs-"" distinction — simpler for a form field.
  if (overrides.firstName) doList.conFirstName = overrides.firstName
  if (overrides.lastName) doList.conLastName = overrides.lastName
  if (overrides.rdd) doList.rdd = overrides.rdd
  if (overrides.eta) doList.eta = overrides.eta

  doList.doItemList = (order.items ?? []).map((item) =>
    mapItem(item, details?.descBySku ?? {}),
  )

  return {
    payload: payload as unknown as Record<string, unknown>,
    doNo: String(doList.doNo ?? ''),
    customerName: `${doList.conFirstName ?? ''} ${doList.conLastName ?? ''}`.trim(),
  }
}
