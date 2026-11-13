<script setup lang="ts">
import InputBox from "./components/InputBox.vue";
import MsgBox from "./components/MsgBox.vue";
import StatusBar from "./components/StatusBar.vue";
import Loading from "./components/Loading.vue";
import { isIniting } from "./composables/useModel.ts";


import { initSession } from "./composables/useModel.ts";

initSession()
</script>

<template>
  <StatusBar />
  <MsgBox />
  <InputBox class="mt-6" />
  <Loading v-if="isIniting" />
</template>
