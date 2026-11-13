<script setup lang="ts">
import { session, availability, contextUsage, inputTypeCheckResults, outputTypeCheckResults } from "../composables/useModel";
</script>

<template>
    <div class="flex">
        Model status:  <span class="status-value">{{ availability }}</span>
        Context usage: <span class="status-value">{{ contextUsage }}</span>
        Context window: <span class="status-value">{{ session?.contextWindow }}</span>
    </div>
    Capabilities:
    <div class="flex">
        Input:
        <span
            v-for="x in inputTypeCheckResults"
            :key="x.type"
            class="ml-4">{{ x.type }}: {{ x.result === 'available' ? '✅' : '❌' }}</span>
    </div>
    <div class="flex">
        Output:
        <span
            v-for="x in outputTypeCheckResults"
            :key="x.type"
            class="ml-4">{{ x.type }}: {{ x.result === 'available' ? '✅' : '❌' }}</span>
    </div>
</template>

<style lang="css" scoped>
    .status-value {
        margin-right: 24px;
        display: inline-block;
    }
</style>