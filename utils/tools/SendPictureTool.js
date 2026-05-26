import { AbstractTool } from './AbstractTool.js'
import { getMasterQQ } from '../common.js'
import { Config } from '../config.js'

export class SendPictureTool extends AbstractTool {
  name = 'sendPicture'

  /**
   * Schema 设计原则：
   * 1. 只保留 model 真正需要决策的字段（图片 URL）
   * 2. 不允许 model 指定发送目标 —— 默认发到当前会话，避免幻觉跨群发送
   * 3. 如有特殊跨群/跨用户发送需求，由调用方在 prompt 中显式确认后再启用
   */
  parameters = {
    properties: {
      urlOfPicture: {
        type: 'string',
        description: 'The URL(s) of the picture(s) to send. Must be valid http(s) URL(s) obtained from a previous tool call (e.g. searchImage / draw). Split multiple URLs with spaces. The picture is always sent to the CURRENT conversation — you cannot and need not specify any target group or user.'
      }
    },
    required: ['urlOfPicture']
  }

  func = async function (opt, e) {
    let { urlOfPicture, targetGroupIdOrQQNumber, sender } = opt

    // 防御性日志：记录 model 是否仍尝试指定 target（被 schema 减项后理论上不会出现）
    if (targetGroupIdOrQQNumber) {
      logger.warn(`[sendPicture] model attempted to specify a target (${targetGroupIdOrQQNumber}), ignored. Always sending to current conversation.`)
    }

    // 数组/对象统一成字符串
    if (Array.isArray(urlOfPicture)) {
      urlOfPicture = urlOfPicture.join(' ')
    } else if (typeof urlOfPicture === 'object' && urlOfPicture !== null) {
      urlOfPicture = String(urlOfPicture)
    }

    // 强制使用当前会话作为目标，杜绝跨群幻觉
    const isGroup = !!e.isGroup
    const target = isGroup ? e.group_id : e.sender.user_id

    // 处理错误 url 和 picture 留空的情况
    const urlRegex = /(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:((?:(?:[a-z0-9\u00a1-\u4dff\u9fd0-\uffff][a-z0-9\u00a1-\u4dff\u9fd0-\uffff_-]{0,62})?[a-z0-9\u00a1-\u4dff\u9fd0-\uffff]\.)+(?:[a-z\u00a1-\u4dff\u9fd0-\uffff]{2,}\.?))(?::\d{2,5})?)(?:\/[\w\u00a1-\u4dff\u9fd0-\uffff$-_.+!*'(),%]+)*(?:\?(?:[\w\u00a1-\u4dff\u9fd0-\uffff$-_.+!*(),%:@&=]|(?:[\[\]])|(?:[\u00a1-\u4dff\u9fd0-\uffff]))*)?(?:#(?:[\w\u00a1-\u4dff\u9fd0-\uffff$-_.+!*'(),;:@&=]|(?:[\[\]]))*)?\/?/i
    if (/https:\/\/example\.com/.test(urlOfPicture) || !urlOfPicture || !urlRegex.test(urlOfPicture)) {
      urlOfPicture = ''
    }
    if (!urlOfPicture) {
      return 'Because there is no correct URL for the picture, tell user the reason and ask user if he wants to use SearchImageTool'
    }

    let pictures = urlOfPicture.trim().split(/\s+/).filter(Boolean)
    logger.mark('pictures to send: ', pictures)
    pictures = pictures.map(img => segment.image(img))

    const errs = []
    try {
      if (isGroup) {
        // 群消息：直接发到当前群
        const group = await e.bot.pickGroup(target)
        for (const pic of pictures) {
          try {
            await group.sendMsg(pic)
          } catch (err) {
            errs.push(pic.url || pic)
          }
        }
        return `picture has been sent to current group (${target})` + (errs.length > 0 ? `, but some pictures failed to send (${errs.join('、')})` : '')
      } else {
        // 私聊：发给当前发送者
        // 保留权限校验逻辑，避免被滥用做骚扰
        const masters = await getMasterQQ()
        if (!Config.enableToolPrivateSend && !masters.includes(sender + '')) {
          return 'you are not allowed to send pictures in private chat'
        }
        const user = e.bot.pickUser(target)
        for (const pic of pictures) {
          try {
            await user.sendMsg(pic)
          } catch (err) {
            errs.push(pic.url || pic)
          }
        }
        return `picture has been sent to current user (${target})` + (errs.length > 0 ? `, but some pictures failed to send (${errs.join('、')})` : '')
      }
    } catch (err) {
      return `failed to send pictures, error: ${err.message || JSON.stringify(err)}`
    }
  }

  description = 'Send one or more pictures to the CURRENT conversation (group or private chat). The destination is determined automatically from context — you cannot specify a target group or user. Only call this after obtaining valid image URL(s) from another tool (e.g. searchImage, draw). If no extra description is needed, just reply <EMPTY> at the next turn.'
}
