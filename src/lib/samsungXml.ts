import type { SamsungExportDetail } from './samsungTypes'

// DispatchTrack's export XML contains raw "&" (e.g. "Daily & SAT"), which breaks
// strict XML parsing. Escape any "&" that isn't already part of a valid entity.
const UNESCAPED_AMPERSAND = /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g

export function cleanExportXml(text: string): string {
  return text.replace(UNESCAPED_AMPERSAND, '&amp;')
}

function textAt(el: Element, path: string): string {
  return (el.querySelector(path)?.textContent ?? '').trim()
}

export function parseExportXml(xmlText: string): SamsungExportDetail[] {
  const doc = new DOMParser().parseFromString(cleanExportXml(xmlText), 'application/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('Could not parse export XML response')
  }

  const details: SamsungExportDetail[] = []
  doc.querySelectorAll('service_order').forEach((serviceOrder) => {
    const descBySku: Record<string, string> = {}
    serviceOrder.querySelectorAll('items > item').forEach((item) => {
      const sku = textAt(item, 'serial_number')
      const desc = textAt(item, 'description')
      if (sku && desc && !(sku in descBySku)) descBySku[sku] = desc
    })
    details.push({
      order_number: serviceOrder.getAttribute('order_number') ?? serviceOrder.getAttribute('id') ?? '',
      do_no: textAt(serviceOrder, 'extra > do_no'),
      customer_cd: textAt(serviceOrder, 'extra > customer_cd'),
      first_name: textAt(serviceOrder, 'customer > first_name'),
      last_name: textAt(serviceOrder, 'customer > last_name'),
      descBySku,
    })
  })
  return details
}

export function findMatchingDetail(
  details: SamsungExportDetail[],
  orderNumber: string,
  doNo: string,
): SamsungExportDetail | undefined {
  return details.find((d) => d.order_number === orderNumber || d.do_no === String(doNo))
}
