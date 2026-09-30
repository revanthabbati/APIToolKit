import type { SamsungRunConfig } from './samsungTypes'

export const EXAMPLE_TEMPLATE_TEXT = `{
    "deliveryOrderRequest": {
        "logisticsCode": "PUL",
        "doList": [
            {
                "doNo": "3207009020",
                "soNo": "1256954157",
                "poNo": "SA038408203",
                "doType": "DELIVERY",
                "refDoNo": "",
                "replaceFlag": "",
                "xdock": "PFM-FUL",
                "customerCd": "2291676",
                "bizType": "Consumer",
                "remark": null,
                "conFirstName": "Rev",
                "conLastName": "",
                "conAddr1": "427 US-377, Argyle",
                "conAddr2": "",
                "conCity": "Argyle",
                "conState": "TX",
                "conZip": "76226",
                "conTele1": "",
                "conTele2": null,
                "conEmail": "",
                "rdd": "20260930",
                "eta": "20260930",
                "piFlag": "PU",
                "tplJobId": "",
                "doItemList": []
            }
        ]
    }
}`

export function createDefaultSamsungConfig(): SamsungRunConfig {
  return {
    code: 'pulsesea',
    serviceRouteId: '',
    timeStamp: '',
    apiKey: '',
    templateText: EXAMPLE_TEMPLATE_TEXT,
    carryOrderFields: false,
    overrides: { firstName: '', lastName: '', rdd: '', eta: '' },
    useProxy: false,
  }
}

// Matches the format DispatchTrack expects, e.g. "2026-09-02T19:36-0400" —
// no seconds, timezone offset without a colon.
export function formatDispatchTrackTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const offsetMin = -date.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}${sign}${pad(Math.floor(abs / 60))}${pad(abs % 60)}`
  )
}
