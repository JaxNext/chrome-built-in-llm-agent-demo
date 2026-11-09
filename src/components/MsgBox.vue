<script setup lang="ts">
import { msgList, msgListEl } from "../composables/useMsgList";
import MsgItem from "./MsgItem.vue";

function printMsgList() {
    console.log('Message List: ', msgList.value);
}
</script>

<template>
    <div
        :ref="msgListEl"
        class="msg-list">
        <MsgItem
            v-for="msg in msgList"
            :key="msg.timestamp"
            :msg="msg"
        />
    </div>
    For debug: 
    <button class="border px-2 mt-2" @click="printMsgList">Print</button>
</template>

<style lang="css" scoped>
.msg-list {
    height: 80vh;
    overflow: auto;
    border: 1px solid #ccc;
    margin: 12px 0;
    padding: 6px;
}
</style>