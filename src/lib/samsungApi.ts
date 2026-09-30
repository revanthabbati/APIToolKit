import { mapWithConcurrency } from './concurrency'
import { describeFetchError, fetchThrough } from './fetchThrough'
import { buildSamsungPayload } from './samsungPayload'
import type { ImportTemplate } from './samsungPayload'
import { findMatchingDetail, parseExportXml } from './samsungXml'
import type { SamsungExportDetail, SamsungFetchResponse, SamsungOrderResult, SamsungRunConfig, SamsungRunSummary } from './samsungTypes'

const FETCH_URL = 'https://pulsesea.dispatchtrack.com/fetch-samsung-orders'
const EXPORT_URL = 'https://pulsesea.dispatchtrack.com/orders/api/export.xml'
const EXPORT_CONCURRENCY = 4

function buildFetchUrl(code: string, routeId: string, timeStamp: string): string {
  const params = new URLSearchParams({ code, service_route_id: routeId, time_stamp: timeStamp })
  return `${FETCH_URL}?${params.toString()}`
}

function buildExportUrl(code: string, apiKey: string, orderNumber: string): string {
  const params = new URLSearchParams({ code, api_key: apiKey, service_order_id: orderNumber })
  return `${EXPORT_URL}?${params.toString()}`
}

function parseTemplate(templateText: string): ImportTemplate {
  let template: ImportTemplate
  try {
    template = JSON.parse(templateText) as ImportTemplate
  } catch {
    throw new Error('Import template is not valid JSON.')
  }
  if (!template?.deliveryOrderRequest?.doList?.[0]) {
    throw new Error('Import template must have a deliveryOrderRequest.doList[0] entry.')
  }
  return template
}

export interface SamsungRunCallbacks {
  onOrderSettled?: (result: SamsungOrderResult, completed: number, total: number) => void
}

export async function runSamsungImport(
  config: SamsungRunConfig,
  proxyUrl: string | undefined,
  signal: AbortSignal,
  callbacks: SamsungRunCallbacks = {},
): Promise<SamsungRunSummary> {
  const startedAt = Date.now()
  const template = parseTemplate(config.templateText)
  const effectiveProxy = config.useProxy ? proxyUrl : undefined

  const fetchUrl = buildFetchUrl(config.code, config.serviceRouteId, config.timeStamp)
  const fetchRaw = await fetchThrough(fetchUrl, 'GET', new Headers(), undefined, signal, effectiveProxy)
  if (fetchRaw.status < 200 || fetchRaw.status >= 300) {
    throw new Error(`Fetch API returned ${fetchRaw.status} ${fetchRaw.statusText}`)
  }

  let fetchJson: SamsungFetchResponse
  try {
    fetchJson = JSON.parse(fetchRaw.bodyText) as SamsungFetchResponse
  } catch {
    throw new Error('Fetch API response was not valid JSON.')
  }
  if (!fetchJson.service_orders) {
    throw new Error(fetchJson.message || 'Fetch API response is missing service_orders.')
  }

  const orders = fetchJson.service_orders
  const total = orders.length
  let completed = 0

  const results = await mapWithConcurrency(orders, EXPORT_CONCURRENCY, async (order) => {
    let details: SamsungExportDetail | undefined
    let error: string | undefined
    try {
      const exportUrl = buildExportUrl(config.code, config.apiKey, order.order_number)
      const exportRaw = await fetchThrough(exportUrl, 'GET', new Headers(), undefined, signal, effectiveProxy)
      if (exportRaw.status < 200 || exportRaw.status >= 300) {
        throw new Error(`Export API returned ${exportRaw.status} ${exportRaw.statusText}`)
      }
      const parsed = parseExportXml(exportRaw.bodyText)
      details = findMatchingDetail(parsed, order.order_number, order.do_no)
    } catch (err) {
      error = describeFetchError(err)
    }

    const built = buildSamsungPayload(template, order, details, config.overrides, config.carryOrderFields)
    const result: SamsungOrderResult = {
      orderNumber: order.order_number,
      doNo: built.doNo,
      customerName: built.customerName,
      itemCount: order.items?.length ?? 0,
      status: error ? 'export-failed' : 'built',
      error,
      payload: built.payload,
    }
    completed += 1
    callbacks.onOrderSettled?.(result, completed, total)
    return result
  })

  return {
    fetchMessage: fetchJson.message ?? '',
    totalOrders: total,
    orders: results,
    startedAt,
    finishedAt: Date.now(),
  }
}
