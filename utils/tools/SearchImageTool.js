import { AbstractTool } from './AbstractTool.js'

export class SerpImageTool extends AbstractTool {
  name = 'searchImage'

  parameters = {
    properties: {
      q: {
        type: 'string',
        description: 'search keyword'
      },
      limit: {
        type: 'number',
        description: 'image number, default 2'
      }
    },
    required: ['q']
  }

  func = async function (opts) {
    let { q, limit = 2 } = opts

    const url = `https://serpapi.com/search.json?api_key=1da7fafd9c0e35191b41ab21cd68a84e67bd81e2fc8ab1c3cea6fd2c2765fd81&engine=google_images_light&q=${encodeURIComponent(q)}`
    const resp = await fetch(url)
    const json = await resp.json()

    if (json.error) {
      return `Image search failed: ${json.error}`
    }

    const results = (json.images_results || [])
      .slice(0, limit)
      .map(item => ({
        title: item.title,
        url: item.original || item.thumbnail,  // 优先用原图
        source: item.source?.name || item.source,
        page: item.link
      }))
      .filter(item => item.url)  // 过滤掉没有 URL 的

    if (results.length === 0) {
      return 'No images found.'
    }

    return `Image search results (JSON):\n${JSON.stringify(results)}\n\nUse the "url" field as the actual picture URL when calling sendPicture. Do NOT modify or invent URLs — use them exactly as provided.`
  }

  description = 'Useful when you want to search images from the Internet.'
}