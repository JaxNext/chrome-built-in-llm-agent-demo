import { ref } from 'vue'

const CONTEXT_WINDOW_THRESHOLD = 0.8
const COMPACT_RATIO = 0.15

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
}

async function promptModel ({
    initialContent = 'Loading...',
    compactMsg = null,
    toolCallResultContent = null,
    chatHistory = [],
} = {}) {
    let textChunks = ''
    const timestamp = Date.now()
    const msg = {
        role: 'assistant',
        content: [{
            type: 'text',
            value: initialContent,
            // text: initialContent,
            isInitial: true
        }],
        timestamp,
    }
    // let ele = generateMsgEle(msg)
    // msgListBox.appendChild(ele)
    // ipt.disabled = true
    const stream = await session.value.promptStreaming([...chatHistory, compactMsg].filter(x => !!x))

    let isStringStream = true
    for await (const chunk of stream) {
        let lastContent = msg.content[msg.content.length - 1]

        if (lastContent.isInitial) {
            lastContent = {
                type: 'text',
                value: '',
                text: '',
            }
            msg.content[msg.content.length - 1] = lastContent
        }

        if (typeof chunk === 'string') {
            textChunks += chunk
            lastContent.value = textChunks
            lastContent.text = textChunks
            
            msg.content[msg.content.length - 1] = lastContent
            ele.innerText = `assistant: ${msg.content.filter(x => x.text).map(x => x.text).join('\n')}`
        } else {
            textChunks = ''
            console.log('Streaming', chunk)
            // handle chunk according to it's type
            isStringStream = false
            if (chunk.type === 'tool-call') {
                const newContent = {
                    ...chunk,
                    text: formatToolCallMsgText(chunk.value)
                }
                msg.content.push(newContent)
                ele.innerText = `assistant: ${msg.content.filter(x => x.text).map(x => x.text).join('\n')}`
                msgList.push(msg)
                await executeToolCall(chunk.value)
            }
        }
        
        
        // scrollToBottom()
    }
    
    // isStringStream && msgList.push(msg) // todo may useless if render 'text' but not 'value'
    // !compactMsg && updateContextWindow()

    // ipt.disabled = false
    return msg
}

export {
    session,
    availability,

    initSession,
    promptModel,
}