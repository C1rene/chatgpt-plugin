import { AbstractTool } from './AbstractTool.js'

export class SerpIkechan8370Tool extends AbstractTool {
  name = 'search'

  parameters = {
    properties: {
      q: {
        type: 'string',
        description: 'search keyword'
      },
      source: {
        type: 'string',
        enum: ['bing', 'google', 'baidu', 'duckduckgo'],
        description: 'search source, default value is bing'
      },
      num: {
        type: 'number',
        description: 'search results limit number, default is 5'
      }
    },
    required: ['q', 'source']
  }

  func = async function (opts) {
    let { q, source, num = 5 } = opts
    if (!source || !['google', 'bing', 'baidu', 'duckduckgo'].includes(source)) {
      source = 'bing'
    }

    // 把 source 映射成 SerpApi 的 engine 名
    const engineMap = {
      google: 'google',
      bing: 'bing',
      baidu: 'baidu',
      duckduckgo: 'duckduckgo'
    }
    const engine = engineMap[source] || 'baidu'

    // TODO: 换成你自己的 SerpApi key（serpapi.com 注册后在 dashboard 获取）
    const apiKey = '1da7fafd9c0e35191b41ab21cd68a84e67bd81e2fc8ab1c3cea6fd2c2765fd81'

    let serpRes = await fetch(`https://serpapi.com/search.json?api_key=${apiKey}&engine=${engine}&q=${encodeURIComponent(q)}&num=${num}`)
    serpRes = await serpRes.json()

    // key 失效 / 额度用尽 / 参数错误时 SerpApi 返回 { error }
    if (serpRes.error) {
      return `search failed: ${serpRes.error}`
    }

    // 自然搜索结果在 organic_results 里
    let res = (serpRes.organic_results || [])
      .map(r => ({
        title: r.title || r.text || '',
        link: r.link || '',
        snippet: r.snippet || ''
      }))
      // 过滤掉既没标题又没摘要的噪音项（如百度热搜）
      .filter(r => r.title && (r.snippet || r.link))
      .slice(0, num)

    if (res.length === 0) {
      return 'no results found.'
    }

    return `the search results are here in json format:\n${JSON.stringify(res)} \n(Notice that these information are only available for you, the user cannot see them, you next answer should consider about the information)`
  }

  description = 'Useful when you want to search something from the Internet. If you don\'t know much about the user\'s question, prefer to search about it! If you want to know further details of a result, you can use website tool'
}
