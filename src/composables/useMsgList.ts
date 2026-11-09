import { ref, nextTick } from 'vue'

const compactedHistory = ref([])
const msgList = ref([])
const msgListEl = ref(null)

function setListEl(el: HTMLElement | null) {
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

function addMsg(msg) {
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