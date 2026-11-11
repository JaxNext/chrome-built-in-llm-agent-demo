import { ref, nextTick } from 'vue'
import type { MsgType } from "./useModel";

export interface MsgContentItem extends Omit<LanguageModelMessageContent, 'type'> {
    isInitial?: boolean
    type: MsgType
}

export interface Msg extends Omit<LanguageModelMessage, 'content'> {
    msgId: string
    noRender?: boolean
    content: MsgContentItem[]
}

const compactedHistory = ref<Msg[]>([])
const msgList = ref<Msg[]>([])
const msgListEl = ref<HTMLElement>()

function setListEl(el: HTMLElement) {
    msgListEl.value = el
}

function scrollList() {
    nextTick(() => {
        // debugger
        const el = msgListEl.value
        if (!el) return
        el.scrollTop = el.scrollHeight
    })
}

function addMsg(msg: Msg): void {
    msgList.value.push(msg)
    scrollList()
}

function clearMsgList() {
    msgList.value.length = 0
}


export {
    msgList,
    msgListEl,
    compactedHistory,

    addMsg,
    scrollList,
    setListEl,
    clearMsgList
}