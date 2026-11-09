<script setup lang="ts">
import InputBox from "./components/InputBox.vue";
import MsgBox from "./components/MsgBox.vue";
import StatusBar from "./components/StatusBar.vue";


import { initSession } from "./composables/useModel.ts";

initSession()
</script>

<template>
  <StatusBar />
  <MsgBox />
  <InputBox class="mt-6" />
</template>
