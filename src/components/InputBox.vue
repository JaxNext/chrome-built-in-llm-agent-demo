<script setup lang="ts">
import { ref, computed } from "vue";
import { addMsg } from "../composables/useMsgList";
import { promptModel, availability, isGenerating } from "../composables/useModel";

const inputVal = ref('')

const disableInput = computed(() => {
    return isGenerating.value || availability.value !== 'available'
})

async function sendMsg() {
    if (!inputVal.value || disableInput.value) return
    const role = 'user'
    addMsg({
        role,
        content: [{
            type: 'text',
            value: inputVal.value,
        }],
        msgId: `${role}-${Date.now()}`
    })
    inputVal.value = ''
    await promptModel()
    
}
</script>

<template>
    <div>
        <input
            type="text"
            v-model.trim="inputVal"
            :disabled="disableInput"
            class="border"
            @keydown.enter="sendMsg">
        <button
            class="ml-2 px-2 border"
            :disabled="disableInput"
            @click="sendMsg">Send</button>
    </div>
</template>

<style lang="css" scoped>

</style>