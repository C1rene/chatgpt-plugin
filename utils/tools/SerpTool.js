import { AbstractTool } from './AbstractTool.js'
import { Config } from '../config.js'

export class SerpTool extends AbstractTool {
  name = 'serp'

  parameters = {
    properties: {
      q: {
        type: 'string',
        description: 'search keyword'
      }
    },
    required: ['q']
  }

  func = async function (opts) {
    let { q } = opts
    //let key = Config.azSerpKey
    let key = "1da7fafd9c0e35191b41ab21cd68a84e67bd81e2fc8ab1c3cea6fd2c2765fd81"

    let serpRes = await fetch(`https://serpapi.com/search.json?api_key=${key}&engine=baidu&ct=2&q=${encodeURIComponent(q)}`)
    serpRes = await serpRes.json()

    // SerpApi 出错时返回 { error: '...' }
    if (serpRes.error) {
      return `search failed: ${serpRes.error}`
    }

    logger.info('SerpTool raw response', serpRes)

    // baidu 引擎的自然结果在 organic_results 里
    let res = (serpRes.organic_results || []).map(p => ({
      title: p.title,
      link: p.link,
      snippet: p.snippet
    }))

    logger.info('SerpTool search results', res)

    if (res.length === 0) {
      return 'no results found.'
    }

    return `the search results are here in json format:\n${JSON.stringify(res)}`
  }

  description = 'Useful when you want to search something from the internet. If you don\'t know much about the user\'s question, just search about it! If you want to know details of a result, you can use website tool! use it as much as you can!'
}
