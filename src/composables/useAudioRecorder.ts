import { ref } from "vue";

const recorder = ref<MediaRecorder>();
const chunks = ref([]);
const audioBlob = ref();
const stream = ref();
const isRecording = ref(false);

let resolveStop: ((blob: Blob) => void) | null = null;

async function initRecorder() {
  stream.value = await navigator.mediaDevices.getUserMedia({ audio: true });
  recorder.value = new MediaRecorder(stream.value);

  recorder.value.addEventListener("dataavailable", (e) => {
    if (e.data.size) {
      chunks.value.push(e.data);
    }
  });
  recorder.value.addEventListener("stop", () => {
    audioBlob.value = new Blob(chunks.value, { type: "audio/webm" });

    isRecording.value = false;
    stream.value?.getTracks().forEach((x) => x.stop());
    stream.value = null;
    recorder.value = null;

    resolveStop?.(audioBlob.value);
    resolveStop = null;
  });
}

async function startRecording() {
  if (isRecording.value) return;
  if (!recorder.value || !stream.value) {
    await initRecorder();
  }
  chunks.value = [];
  audioBlob.value = null;

  recorder.value?.start();
  isRecording.value = true;
}

async function stopRecording() {
  if (!recorder.value || recorder.value.state === "inactive") {
    return audioBlob.value;
  }

  const stopped = new Promise<Blob>((resolve) => {
    resolveStop = resolve;
  });

  recorder.value.stop();

  return stopped;
}

export { recorder, isRecording, startRecording, stopRecording };
