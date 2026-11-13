<script setup lang="ts">
import { msgList, setListEl, compactedHistory } from "../composables/useMsgList";
import MsgItem from "./MsgItem.vue";

function printMsgList() {
    console.log('Message List: ', msgList.value);
}
</script>

<template>
    <div
        :ref="setListEl"
        class="msg-list">
        <MsgItem
            v-for="msg in [...compactedHistory, ...msgList].filter(x => !x.noRender)"
            :key="msg.msgId"
            :msg="msg"
        />
    </div>
    For debug: 
    <button class="border px-2 mt-2" @click="printMsgList">Print</button>
</template>

<style lang="css" scoped>
.msg-list {
    height: 70vh;
    overflow: auto;
    border: 1px solid #ccc;
    margin: 12px 0;
    padding: 6px;
}
</style>