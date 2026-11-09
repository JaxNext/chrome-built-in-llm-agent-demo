import { ref } from 'vue'
import { msgList, addMsg, scrollList, clearMsgList, compactedHistory } from './useMsgList'

const CONTEXT_WINDOW_THRESHOLD = 0.8
const COMPACT_RATIO = 0.15

let isCompacting = false

const tools = [
    {
        name: 'get_age_by_name',
        description: 'Return the age of a person if asked by a name',
        inputSchema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'The name of a person'
                }
            },
            required: ['name']
        },
        async execute ({ name }) {
            if (name === 'Jax') {
                return 34
            }
            return 18
        }
    },
    {
        name: 'get_hobby_by_age',
        description: 'Return the hobby of a person if asked by a age',
        inputSchema: {
            type: 'object',
            properties: {
                age: {
                    type: 'number',
                    description: 'The age of a person'
                }
            },
            required: ['age']
        },
        async execute ({ age }) {
            if (age >= 30) {
                return 'Reading'
            }
            return 'Playing'
        }
    },
    {
        name: 'get_gift_by_hobby',
        description: 'Return a gift depend on hobby',
        inputSchema: {
            type: 'object',
            properties: {
                hobby: {
                    type: 'string',
                    description: 'A hobby'
                }
            },
            required: ['hobby']
        },
        async execute ({ hobby }) {
            const giftMap = {
                'Playing': 'Baseball',
                'Reading': 'Book'
            }
            return giftMap[hobby] || 'Cake'
        }
    }
]
const sessionConfig = {
    // initialPrompts: [
    //     {
    //         role: 'system',
    //         content: 'Use tools and chain of thoughts to help user'
    //     }
    // ],
    expectedInputs: [
        { type: 'tool-response' }
    ],
    expectedOutputs: [
        { type: 'tool-call' }
    ],
    tools
}

const availability = ref('')
const isGenerating = ref(false)
const contextUsage = ref(0)

const originSession = ref(null)
const session = ref(null)

async function checkStatus() {
    availability.value = await LanguageModel?.availability?.()
    if (availability.value !== 'available') return
}

async function initSession() {
    await checkStatus()
    originSession.value = await LanguageModel.create(sessionConfig)
    session.value = await originSession.value.clone()
    contextUsage.value = session.value.contextUsage
}

function formatToolCallMsgText(toolCall) {
    const {
        name,
        arguments: toolCallArguments
    } = toolCall
    return `Calling tool ${name} with arguments ${JSON.stringify(toolCallArguments)}`
}

async function compactHistory() {
    if (isCompacting) return
    isCompacting = true
    console.log('Start compacting', JSON.parse(JSON.stringify(msgList.value)));
    
    const role = 'user'
    const msgId = `${role}-${Date.now()}`
    const compactMsg = {
        role: 'user',
        msgId,
        content: [{
            type: 'text',
            value: `Summarize history messages above into one paragraph less than ${session.value.contextWindow * COMPACT_RATIO} tokens `
        }],
        noRender: true
    }
    await promptModel({
        initialContent: 'Compacting...',
        compactMsg,
    })
    const history = JSON.parse(JSON.stringify(msgList.value))
    const newList = history.splice(-2, 2)
    compactedHistory.value.push(...history)
    clearMsgList()
    newList.map(addMsg)
    console.log('Compacted', JSON.parse(JSON.stringify(msgList.value)));
    
    session.value = await originSession.value.clone()
    await updateContextUsage()
    isCompacting = false
}

async function updateContextUsage() {
    contextUsage.value = session.value.contextUsage
    if (contextUsage.value / session.value.contextWindow >= CONTEXT_WINDOW_THRESHOLD) {
        await compactHistory()
    }
}
        
async function executeToolCall(toolCall) {
    const {
        name,
        callId = '',
        callID = '',
        arguments: toolCallArguments
    } = toolCall
    const toolCallId = callID || callId
    const target = tools.find(x => x.name === name)
    if (!target || !target.execute) {
        return null
    }
    const result = await target.execute(toolCallArguments)
    const role = 'user'
    const msgId = `${role}-${Date.now()}`
    addMsg({
        role,
        content: [
            {
                type: 'tool-response',
                value: new LanguageModelToolSuccess({
                    name,
                    callId: toolCallId,
                    callID: toolCallId,
                    result: [{
                        type: 'object',
                        value: result,
                    }]
                }),
            }
        ],
        msgId,
        noRender: true,
    })
    await promptModel()
}

async function promptModel ({
    initialContent = 'Loading...',
    compactMsg = null,
} = {}) {
    const timestamp = Date.now()
    const role = 'assistant'
    const msgId = `${role}-${timestamp}`
    const msg = {
        role,
        content: [{
            type: 'text',
            value: initialContent,
            isInitial: true
        }],
        msgId,
    }

    !!compactMsg && addMsg(compactMsg)
    const chatHistory = [...msgList.value]
    
    addMsg(msg)
    
    isGenerating.value = true
    const stream = await session.value.promptStreaming(chatHistory)

    const currentMsg = msgList.value.find(x => x.msgId === msgId)
    const msgContent = currentMsg.content
    for await (const chunk of stream) {
        let lastContent = msgContent[msgContent.length - 1]

        if (typeof chunk === 'string') {
            if (lastContent.isInitial) {
                lastContent.isInitial = false
                lastContent.value = ''
            }
            lastContent.value += chunk
        } else {
            console.log('Streaming', chunk)
            if (lastContent.isInitial) {
                lastContent.isInitial = false
                lastContent.type = chunk.type
                lastContent.value = chunk.value
            } else {
                msgContent.push(chunk)
            }
            if (chunk.type === 'tool-call') {
                await executeToolCall(chunk.value)
            }
        }
    }
    
    // !compactMsg && updateContextWindow() // todo
    scrollList() // todo: 待优化：回答内容较长时，全部答完才会滚动，而不是每行触底了就滚动
    isGenerating.value = false
    await updateContextUsage()
    return currentMsg
}

export {
    session,
    availability,
    isGenerating,
    contextUsage,

    initSession,
    promptModel,
    formatToolCallMsgText,
    updateContextUsage,
}