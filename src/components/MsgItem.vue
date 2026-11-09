<script setup lang="ts">
import { computed } from "vue";
import { formatToolCallMsgText } from "../composables/useModel";

const props = defineProps({
    msg: Object
})

const contentText = computed(() => {
    return props.msg.content.map(x => {
        const { type, value } = x

        switch (type) {
            case 'tool-call':
                return formatToolCallMsgText(value)
            case 'tool-response':
                return ''
            default:
                return value
                break;
        }
    }).filter(x => !!x).join('\n')

})
</script>

<template>
    <div class="msg-item flex mt-4">
        <div class="role border rounded-full px-2 py-0 mr-2 h-[26px]">{{ msg.role }}</div>
        <div class="content whitespace-pre-line">{{ contentText }}</div>
    </div>
</template>

<style lang="css" scoped>

</style>