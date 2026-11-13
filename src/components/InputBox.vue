<script setup lang="ts">
import { ref, computed } from "vue";
import { expectedInputs } from "../composables/useModel";
import { addMsg } from "../composables/useMsgList";
import type { Msg, MsgContentItem } from "../composables/useMsgList";
import {
  promptModel,
  availability,
  isGenerating,
  isIniting,
  controller,
} from "../composables/useModel";
import { getSrc } from "../utils/file";
import { isRecording, startRecording, stopRecording } from "../composables/useAudioRecorder";

const inputVal = ref("");
const inputImgs = ref([]);
const inputAudio = ref("");

const isAllowAudio = computed(() => {
  return expectedInputs.value.some(x => x.type === 'audio')
})
const isAllowImage = computed(() => {
  return expectedInputs.value.some(x => x.type === 'image')
})

const disableInput = computed(() => {
  return isGenerating.value || isIniting.value || availability.value !== "available";
});

const disableAbortBtn = computed(() => {
  return !isGenerating.value;
});

async function sendMsg() {
  if (!inputVal.value && !inputImgs.value.length && !inputAudio.value) return;
  if (disableInput.value) return;
  const role = "user";

  const requestContentList: MsgContentItem[] = [];
  if (inputVal.value) {
    requestContentList.push({
      type: "text",
      value: inputVal.value,
    });
  }
  if (inputAudio.value) {
    const audioContents: MsgContentItem[] = [
      {
        type: "audio",
        value: inputAudio.value,
      },
    ];
    requestContentList.push(...audioContents);
  }
  if (inputImgs.value.length) {
    const imgContents: MsgContentItem[] = inputImgs.value.map((x) => {
      return { type: "image", value: x };
    });
    requestContentList.push(...imgContents);
  }
  addMsg({
    role,
    content: requestContentList,
    msgId: `${role}-${Date.now()}`,
  });
  inputVal.value = "";
  inputImgs.value = [];
  inputAudio.value = null;
  await promptModel();
}

function abortGenerating() {
  controller.value?.abort("User aborted the response");
}

function handleImgInput(e: InputEvent) {
  if (!e?.target?.files) return;
  inputImgs.value = Array.from(e.target.files);
}

function removeImg(index: number) {
  inputImgs.value = inputImgs.value.filter((x, i) => i !== index);
}

async function handleRecording() {
  if (!isRecording.value) {
    startRecording();
  } else {
    inputAudio.value = await stopRecording();
    console.log("InputAudio", inputAudio.value);

    sendMsg();
  }
}
</script>

<template>
  <div v-for="(img, index) in inputImgs" :key="index" class="img-box relative w-10 h-10 m-2">
    <img :src="getSrc(img)" class="w-full h-full object-contain" />
    <span
      class="absolute right-0 top-0 inline-block text-red-700 cursor-pointer"
      @click="removeImg(index)"
      >x</span
    >
  </div>
  <div>
    <button
      v-if="isAllowAudio"
      class="ml-2 px-2 border"
      :disabled="disableInput"
      @click="handleRecording">
      {{ isRecording ? "Recording..." : "Record" }}
    </button>
    <input
      type="text"
      v-model.trim="inputVal"
      :disabled="disableInput"
      class="border"
      @keydown.enter="sendMsg"
    />
    <input
      v-if="isAllowImage"
      type="file"
      accept="image/*"
      multiple class="border"
      @change="handleImgInput" />
    <button class="ml-2 px-2 border" :disabled="disableInput" @click="sendMsg">Send</button>
    <button class="ml-2 px-2 border" :disabled="disableAbortBtn" @click="abortGenerating">
      Abort
    </button>
  </div>
</template>

<style lang="css" scoped></style>
