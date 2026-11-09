import { ref, nextTick } from 'vue'

const msgList = ref([])
const msgListEl = ref(null)

function scrollList() {
    nextTick(() => {
        debugger
        const el = msgListEl.value
        if (!el) return
        el.scrollTop = el.scrollHeight
    })
}

function addMsg(msg) {
    msgList.value.push(msg)
    scrollList()
}


export {
    msgList,
    msgListEl,

    addMsg,
    scrollList,
}