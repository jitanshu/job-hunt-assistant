import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sendChatMessage } from '@/api/chat';
import { useJobContext } from '@/context/job-context';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
  sourceCount?: number;
};

const initialMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Ask anything about your resume or the analyzed job.',
};

export default function ChatScreen() {
  const router = useRouter();
  const { jobDescription } = useJobContext();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, isSending]);

  async function sendMessage(message = input) {
    const cleanedMessage = message.trim();

    if (isSending) {
      return;
    }

    if (cleanedMessage.length < 2 || cleanedMessage.length > 1_000) {
      setError('The message must contain between 2 and 1,000 characters.');
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: cleanedMessage,
    };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      const result = await sendChatMessage({
        message: cleanedMessage,
        conversationId,
        jobDescription:
          jobDescription.trim().length >= 50 ? jobDescription.trim() : undefined,
      });
      setConversationId(result.conversation_id);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.answer,
          toolsUsed: result.tools_used,
          sourceCount: result.sources.length,
        },
      ]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Chat request failed.');
    } finally {
      setIsSending(false);
    }
  }

  function draftEmail() {
    if (jobDescription.trim().length < 50) {
      setError('Analyze a job description before drafting an email.');
      return;
    }

    void sendMessage('Draft a concise application email for the analyzed job.');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()}>
            <Text style={styles.backText}>‹ Analysis</Text>
          </Pressable>
          <View>
            <Text style={styles.step}>STEP 3 OF 3</Text>
            <Text style={styles.title}>AI Chat</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={isSending}
            onPress={draftEmail}
            style={({ pressed }) => [styles.draftButton, pressed && styles.pressed]}
          >
            <Text style={styles.draftButtonText}>Draft email</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          ref={scrollRef}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.bubble,
                message.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                style={message.role === 'user' ? styles.userMessage : styles.assistantMessage}
              >
                {message.content}
              </Text>
              {message.toolsUsed && message.toolsUsed.length > 0 && (
                <Text style={styles.meta}>Tool: {message.toolsUsed.join(', ')}</Text>
              )}
              {!!message.sourceCount && (
                <Text style={styles.meta}>{message.sourceCount} resume sources used</Text>
              )}
            </View>
          ))}
          {isSending && (
            <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
              <ActivityIndicator color="#4F46E5" size="small" />
              <Text style={styles.loadingText}>Thinking…</Text>
            </View>
          )}
        </ScrollView>

        {error && (
          <View accessibilityRole="alert" style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Chat message"
            editable={!isSending}
            maxLength={1_000}
            multiline
            onChangeText={(value) => {
              setInput(value);
              setError(null);
            }}
            placeholder="Ask about your resume…"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={input}
          />
          <Pressable
            accessibilityRole="button"
            disabled={isSending || input.trim().length < 2}
            onPress={() => void sendMessage()}
            style={({ pressed }) => [
              styles.sendButton,
              (isSending || input.trim().length < 2) && styles.sendButtonDisabled,
              pressed && !isSending && styles.pressed,
            ]}
          >
            <Text style={styles.sendButtonText}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '700',
  },
  step: {
    color: '#6B7280',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  title: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  draftButton: {
    backgroundColor: '#E0E7FF',
    borderRadius: 10,
    marginRight: 34,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  draftButtonText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '800',
  },
  messages: {
    flexGrow: 1,
    gap: 12,
    padding: 18,
  },
  bubble: {
    borderRadius: 16,
    maxWidth: '86%',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  userMessage: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
  },
  assistantMessage: {
    color: '#1F2937',
    fontSize: 15,
    lineHeight: 21,
  },
  meta: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 8,
  },
  loadingBubble: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 13,
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    marginHorizontal: 18,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  composer: {
    alignItems: 'flex-end',
    borderTopColor: '#E5E7EB',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderRadius: 18,
    borderWidth: 1,
    color: '#111827',
    flex: 1,
    fontSize: 15,
    maxHeight: 110,
    minHeight: 46,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 23,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  sendButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.75,
  },
});
