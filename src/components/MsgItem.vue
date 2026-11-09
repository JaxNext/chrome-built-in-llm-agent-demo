<script setup lang="ts">
import { session, availability } from "../composables/useModel";

const props = defineProps({
    msg: Object
})
</script>

<template>
    <div class="msg-item flex mt-4">
        <div class="role border rounded-full px-2 py-0 mr-2">{{ msg.role }}</div>
        <div class="content">{{ msg.content.map(x => x.text || x.value).join('\n') }}</div>
    </div>
</template>

<style lang="css" scoped>

</style>