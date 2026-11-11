<script setup lang="ts">
import { getSrc } from "../utils/file";
import { formatToolCallMsgText } from "../composables/useModel";
import type { MsgContentItem } from "../composables/useMsgList";

const props = defineProps({
  msg: Object,
});

function calcTextContent(content: MsgContentItem): string {
  const { type, value } = content;

  let res = "";
  switch (type) {
    case "tool-call":
      res = formatToolCallMsgText(value);
      break;
    case "tool-response":
      res = "";
      break;
    default:
      res = value;
      break;
  }
  return res;
}
</script>

<template>
  <div class="msg-item flex mt-4">
    <div class="role border rounded-full px-2 py-0 mr-2 h-[26px]">{{ msg.role }}</div>
    <div class="content whitespace-pre-line">
      <div v-for="(content, index) in msg.content" :key="index" class="content-item">
        <div v-if="content.type === 'image'" class="img-box relative w-16 h-16 m-2">
          <img :src="getSrc(content.value)" class="w-full h-full object-contain" />
        </div>
        <audio
          v-else-if="content.type === 'audio'"
          :src="getSrc(content.value)"
          controls
          class="w-60 h-8"
        />
        <div v-else>{{ calcTextContent(content) }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped></style>
