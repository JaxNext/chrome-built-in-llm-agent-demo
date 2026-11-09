<script setup lang="ts">
import { ref } from "vue";
import { addMsg } from "../composables/useMsgList";
import { promptModel } from "../composables/useModel";

const inputVal = ref('')

async function sendMsg() {
    if (!inputVal.value) return
    addMsg({
        role: 'user',
        content: [{
            type: 'text',
            value: inputVal.value,
        }],
        timestamp: Date.now()
    })
    inputVal.value = ''
    //await promptModel()
    
}
</script>

<template>
    <div>
        <input
            type="text"
            v-model.trim="inputVal"
            class="border"
            @keydown.enter="sendMsg">
        <button
            class="ml-2 px-2 border"
            @click="sendMsg">Send</button>
    </div>
</template>

<style lang="css" scoped>

</style>