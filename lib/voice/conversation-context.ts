/**
 * Conversation Context System
 * Maintains full multi-turn conversation history and context
 * to enable natural, ChatGPT-like interactions
 */

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  intent?: string
  actionType?: string
}

export interface WorkingObject {
  type: 'customer' | 'order' | 'measurement' | 'none'
  id?: string
  name?: string
  data?: Record<string, any>
}

export interface ConversationMetadata {
  currentCustomerId?: string
  currentOrderId?: string
  lastAction?: string
  lastActionTime?: number
  flowInProgress?: string
}

/**
 * ConversationContext maintains full conversation history and context
 * for intelligent multi-turn interactions
 */
export class ConversationContext {
  private messages: ConversationMessage[] = []
  private workingObject: WorkingObject = { type: 'none' }
  private metadata: ConversationMetadata = {}
  private maxMessages = 50

  constructor(initialData?: {
    messages?: ConversationMessage[]
    workingObject?: WorkingObject
    metadata?: ConversationMetadata
  }) {
    if (initialData?.messages) {
      this.messages = initialData.messages.slice(-this.maxMessages)
    }
    if (initialData?.workingObject) {
      this.workingObject = initialData.workingObject
    }
    if (initialData?.metadata) {
      this.metadata = initialData.metadata
    }
  }

  /**
   * Add a user message to conversation history
   */
  addUserMessage(content: string, intent?: string): ConversationMessage {
    const message: ConversationMessage = {
      role: 'user',
      content,
      timestamp: Date.now(),
      intent,
    }
    this.messages.push(message)
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages)
    }
    return message
  }

  /**
   * Add an assistant message to conversation history
   */
  addAssistantMessage(content: string, actionType?: string): ConversationMessage {
    const message: ConversationMessage = {
      role: 'assistant',
      content,
      timestamp: Date.now(),
      actionType,
    }
    this.messages.push(message)
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages)
    }
    return message
  }

  /**
   * Set the object currently being worked on (customer, order, measurement)
   */
  setWorkingObject(type: WorkingObject['type'], data?: { id?: string; name?: string; data?: Record<string, any> }) {
    this.workingObject = {
      type,
      ...data,
    }
  }

  /**
   * Get current working object
   */
  getWorkingObject(): WorkingObject {
    return this.workingObject
  }

  /**
   * Clear the working object
   */
  clearWorkingObject() {
    this.workingObject = { type: 'none' }
  }

  /**
   * Get formatted context for LLM prompt
   * Includes recent conversation history and current state
   */
  getContext(): string {
    const recentMessages = this.messages.slice(-10)
    const messageHistory = recentMessages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n')

    const workingObjectInfo =
      this.workingObject.type !== 'none'
        ? `\nCurrently working on: ${this.workingObject.type} (${this.workingObject.name || 'unnamed'})`
        : ''

    const lastActionInfo = this.metadata.lastAction
      ? `Last action: ${this.metadata.lastAction} (${Math.round((Date.now() - (this.metadata.lastActionTime || 0)) / 1000)}s ago)`
      : ''

    return `## Conversation History
${messageHistory}${workingObjectInfo}${lastActionInfo}`
  }

  /**
   * Get full conversation history
   */
  getMessages(): ConversationMessage[] {
    return [...this.messages]
  }

  /**
   * Get last message from user
   */
  getLastUserMessage(): ConversationMessage | null {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].role === 'user') {
        return this.messages[i]
      }
    }
    return null
  }

  /**
   * Get last message from assistant
   */
  getLastAssistantMessage(): ConversationMessage | null {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].role === 'assistant') {
        return this.messages[i]
      }
    }
    return null
  }

  /**
   * Check if message contains correction intent
   */
  hasExplicitCorrectionIntent(message: string): boolean {
    const correctionPatterns = [
      /\b(no|wrong|incorrect|that's wrong|thats wrong|not correct|error)\b/i,
      /\b(correct|fix|change|edit|update)\s+that\b/i,
      /\b(change|set|make)\s+it\s+to\b/i,
      /\b(actually|wait|hold on|hold on)\b/i,
    ]
    return correctionPatterns.some((pattern) => pattern.test(message))
  }

  /**
   * Update metadata
   */
  setMetadata(updates: Partial<ConversationMetadata>) {
    this.metadata = { ...this.metadata, ...updates }
  }

  /**
   * Get metadata
   */
  getMetadata(): ConversationMetadata {
    return { ...this.metadata }
  }

  /**
   * Clear entire conversation
   */
  clear() {
    this.messages = []
    this.workingObject = { type: 'none' }
    this.metadata = {}
  }

  /**
   * Serialize context for storage
   */
  serialize() {
    return {
      messages: this.messages,
      workingObject: this.workingObject,
      metadata: this.metadata,
    }
  }

  /**
   * Deserialize context from storage
   */
  static deserialize(data: any): ConversationContext {
    return new ConversationContext(data)
  }
}
