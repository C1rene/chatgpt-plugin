import { AbstractTool } from './AbstractTool.js'

export class DateTimeTool extends AbstractTool {
  name = 'getDateTime'

  parameters = {
    properties: {
      timezone: {
        type: 'string',
        description: 'IANA timezone name, e.g. "Asia/Shanghai", "Asia/Tokyo", "America/New_York". Optional, defaults to "Asia/Shanghai" (UTC+8).'
      }
    },
    required: []
  }

  func = async function (opts) {
    let { timezone } = opts || {}
    const tz = timezone || 'Asia/Shanghai'

    const now = new Date()

    let info
    try {
      // 用 Intl 按指定时区格式化，避免依赖服务器本地时区
      const fmt = new Intl.DateTimeFormat('zh-CN', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        weekday: 'long'
      })
      const parts = fmt.formatToParts(now)
      const get = (t) => parts.find(p => p.type === t)?.value || ''

      const dateStr = `${get('year')}-${get('month')}-${get('day')}`
      const timeStr = `${get('hour')}:${get('minute')}:${get('second')}`
      const weekday = get('weekday')

      info = {
        timezone: tz,
        datetime: `${dateStr} ${timeStr}`,
        date: dateStr,
        time: timeStr,
        weekday,
        unix_timestamp: Math.floor(now.getTime() / 1000),
        iso: now.toISOString()
      }
    } catch (err) {
      // 时区名非法等情况，退回 UTC+8
      return `getDateTime failed for timezone "${tz}": ${err.message}. Please use a valid IANA timezone name like "Asia/Shanghai".`
    }

    return `Current date and time information (for your reference, the user cannot see this directly):\n${JSON.stringify(info)}`
  }

  description = 'Get the current real-world date and time. Use this whenever you need to know the current time, today\'s date, the day of the week, or to answer any time-related question. Do NOT guess or rely on memory for the current time — always call this tool to get the accurate current time.'
}
