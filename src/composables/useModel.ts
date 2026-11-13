import { ref, computed } from "vue";

import type { Msg, MsgContentItem } from "./useMsgList";
import { msgList, addMsg, scrollList, clearMsgList, compactedHistory } from "./useMsgList";

type PromptParams = {
  initialContent?: string;
  compactMsg?: Msg | null;
};

type ToolCall = {
  name: string;
  callId?: string;
  callID?: string;
  arguments: unknown;
};

type StreamChunk = string | MsgContentItem;

export type MsgType = LanguageModelMessageType | "tool-call" | "tool-response";

interface ExpectedIO extends Omit<LanguageModelExpected, "type"> {
  type: MsgType;
}

type SessionConfig = Omit<LanguageModelCreateOptions, "expectedInputs" | "expectedOutputs"> & {
  expectedInputs: ExpectedIO[];
  expectedOutputs: ExpectedIO[];
};

const CONTEXT_WINDOW_THRESHOLD = 0.8;
const COMPACT_RATIO = 0.15;

let isCompacting = false;

const toolList: LanguageModelTool[] = [
  {
    name: "get_age_by_name",
    description: "Return the age of a person if asked by a name",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of a person",
        },
      },
      required: ["name"],
    },
    async execute({ name }) {
      if (name === "Jax") {
        return "34";
      }
      return "18";
    },
  },
  {
    name: "get_hobby_by_age",
    description: "Return the hobby of a person if asked by a age",
    inputSchema: {
      type: "object",
      properties: {
        age: {
          type: "number",
          description: "The age of a person",
        },
      },
      required: ["age"],
    },
    async execute({ age }) {
      if (age >= 30) {
        return "Reading";
      }
      return "Playing";
    },
  },
  {
    name: "get_gift_by_hobby",
    description: "Return a gift depend on hobby",
    inputSchema: {
      type: "object",
      properties: {
        hobby: {
          type: "string",
          description: "A hobby",
        },
      },
      required: ["hobby"],
    },
    async execute({ hobby }) {
      const giftMap = {
        Playing: "Baseball",
        Reading: "Book",
        default: "Cake",
      };
      return giftMap[hobby as keyof typeof giftMap] ?? giftMap.default;
    },
  },
];
const fullExpectedInputs: ExpectedIO[] = [
    { type: "text" },
    { type: "audio" },
    { type: "image" },
    { type: "tool-call" },
    { type: "tool-response" },
]
const fullExpectedOutputs: ExpectedIO[] =  [
    { type: "text" },
    { type: "audio" },
    { type: "image" },
  { type: "tool-call" },
]
const inputTypeCheckResults = ref([])
const outputTypeCheckResults = ref([])
const expectedInputs = computed(() => {
  return inputTypeCheckResults.value.filter(x => x.result === 'available').map(x => {
    return { type: x.type }
  })
})
const expectedOutputs = computed(() => {
  return outputTypeCheckResults.value.filter(x => x.result === 'available').map(x => {
      return { type: x.type }
  })
})
const tools = computed(() => {
  if (expectedOutputs.value.some(x => x.type === 'tool-call')) {
    return toolList
  }
  return []
})

const availability = ref("");
const isGenerating = ref(false);
const isIniting = ref(false);
const contextUsage = ref(0);
const controller = ref<AbortController>();

const sessionConfig = computed(() => {
  return {
    // initialPrompts: [
    //     {
    //         role: 'system',
    //         content: 'Use tools and chain of thoughts to help user'
    //     }
    // ],
    expectedInputs: expectedInputs.value,
    expectedOutputs: expectedOutputs.value,
    tools: tools.value,
  }
});

const originSession = ref<LanguageModel>();
const session = ref<LanguageModel>();

async function checkStatus(): Promise<void> {
  availability.value = await LanguageModel?.availability?.();
  if (availability.value !== "available") return;

  inputTypeCheckResults.value = await Promise.all(fullExpectedInputs.map(async x => {
    const result = await LanguageModel.availability({
      expectedInputs: [x]
    })
    return { ...x, result }
  }))
  outputTypeCheckResults.value = await Promise.all(fullExpectedOutputs.map(async x => {
    const result = await LanguageModel.availability({
      expectedOutputs: [x]
    })
    return { ...x, result }
  }))

  console.log('CHECK', sessionConfig.value);
  
}

async function initSession(): Promise<void> {
  if (isIniting.value) return;
  isIniting.value = true;
  await checkStatus();
  originSession.value = await LanguageModel.create(sessionConfig.value as LanguageModelCreateOptions);
  session.value = await originSession.value.clone();
  contextUsage.value = session.value.contextUsage;
  isIniting.value = false;
}

function formatToolCallMsgText(toolCall: ToolCall): string {
  const { name, arguments: toolCallArguments } = toolCall;
  return `Calling tool ${name} with arguments ${JSON.stringify(toolCallArguments)}`;
}

async function compactHistory(): Promise<void> {
  if (isCompacting || !session.value || !originSession.value) return;
  isCompacting = true;
  console.log("Start compacting", JSON.parse(JSON.stringify(msgList.value)));

  const role = "user";
  const msgId = `${role}-${Date.now()}`;
  const compactMsg: Msg = {
    role: "user",
    msgId,
    content: [
      {
        type: "text",
        value: `Summarize history messages above into one paragraph less than ${session.value.contextWindow * COMPACT_RATIO} tokens `,
      },
    ],
    noRender: true,
  };
  await promptModel({
    initialContent: "Compacting...",
    compactMsg,
  });
  const history = JSON.parse(JSON.stringify(msgList.value));
  const newList = history.splice(-2, 2);
  compactedHistory.value.push(...history);
  clearMsgList();
  newList.map(addMsg);
  console.log("Compacted", JSON.parse(JSON.stringify(msgList.value)));

  session.value = await originSession.value.clone();
  await updateContextUsage();
  isCompacting = false;
}

async function updateContextUsage() {
  if (!session.value) return;
  contextUsage.value = session.value.contextUsage;
  if (contextUsage.value / session.value.contextWindow >= CONTEXT_WINDOW_THRESHOLD) {
    await compactHistory();
  }
}

async function executeToolCall(toolCall: ToolCall): Promise<LanguageModelToolSuccess> {
  const { name, callId = "", callID = "", arguments: toolCallArguments } = toolCall;
  const toolCallId = callID || callId;
  const target = tools.find((x) => x.name === name);
  if (!target || !target.execute) {
    return Promise.reject();
  }
  const result = await target.execute(toolCallArguments);

  return new LanguageModelToolSuccess({
    name,
    callId: toolCallId,
    callID: toolCallId,
    result: [
      {
        type: "object",
        value: result,
      },
    ],
  });
}

async function promptModel({
  initialContent = "Loading...",
  compactMsg = null,
}: PromptParams = {}): Promise<Msg> {
  if (!session.value) return Promise.reject("LanguageModel session is not inited yet.");

  const timestamp = Date.now();
  const role = "assistant";
  const msgId = `${role}-${timestamp}`;
  const msg: Msg = {
    role,
    content: [
      {
        type: "text",
        value: initialContent,
        isInitial: true,
      },
    ],
    msgId,
  };

  !!compactMsg && addMsg(compactMsg);
  const chatHistory = [...msgList.value];

  addMsg(msg);

  isGenerating.value = true;
  controller.value = new AbortController();
  controller.value.signal.onabort = (e) => {
    console.log("User aborted the response");
    isGenerating.value = false;
  };
  const stream = await session.value.promptStreaming(chatHistory as LanguageModelPrompt, {
    signal: controller.value.signal,
  });

  const currentMsg = msgList.value.find((x) => x.msgId === msgId) as Msg;
  const msgContent = currentMsg.content;
  const toolCallList = [];
  for await (const chunk of stream as unknown as AsyncIterable<StreamChunk>) {
    let lastContent = msgContent[msgContent.length - 1];

    if (typeof chunk === "string") {
      if (lastContent.isInitial) {
        lastContent.isInitial = false;
        lastContent.value = "";
      }
      lastContent.value += chunk;
    } else {
      console.log("Streaming", chunk);
      if (lastContent.isInitial) {
        lastContent.isInitial = false;
        lastContent.type = chunk.type;
        lastContent.value = chunk.value;
      } else {
        msgContent.push(chunk);
      }
      if (chunk.type === "tool-call") {
        // await executeToolCall(chunk.value as unknown as ToolCall)
        toolCallList.push(chunk.value);
      }
    }
  }

  if (toolCallList.length) {
    const toolResContent = (await Promise.all(toolCallList.map(executeToolCall))).map((x) => {
      return {
        type: "tool-response",
        value: x as LanguageModelMessageValue,
      };
    });

    const role = "user";
    const msgId = `${role}-${Date.now()}`;
    const msg: Msg = {
      role,
      content: toolResContent as LanguageModelMessageContent[],
      msgId,
      noRender: true,
    };
    addMsg(msg);
    await promptModel();
  }

  scrollList(); // todo: 待优化：回答内容较长时，全部答完才会滚动，而不是每行触底了就滚动
  isGenerating.value = false;
  await updateContextUsage();
  return currentMsg;
}

export {
  session,
  availability,
  isGenerating,
  isIniting,
  contextUsage,
  controller,
  inputTypeCheckResults,
  outputTypeCheckResults,
  expectedInputs,
  initSession,
  promptModel,
  formatToolCallMsgText,
  updateContextUsage,
};
