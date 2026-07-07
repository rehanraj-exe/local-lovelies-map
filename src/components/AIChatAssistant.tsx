import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const quickPrompts = [
  { icon: '🍰', text: 'Show me bakeries nearby' },
  { icon: '✨', text: "What's trending around me?" },
  { icon: '💼', text: 'Find jobs near me' },
  { icon: '🎁', text: "Who's offering discounts now?" },
  { icon: '✂️', text: 'Top-rated salons this week' },
];

export const AIChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi there! 👋 Need help finding a shop, deal, or job nearby?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Check if user is authenticated (edge function requires auth)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '🔒 Please sign in to use the AI assistant. You can sign in using the button in the top navigation bar!',
          },
        ]);
        toast({
          title: 'Sign in required',
          description: 'Please sign in to chat with the Re:Local Assistant.',
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { message: messageText },
      });

      if (error) {
        console.error('AI chat error:', error);
        // Check if it's an auth error
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          throw new Error('auth');
        }
        throw error;
      }

      if (data?.error) {
        console.error('AI chat server error:', data.error);
        if (data.error.includes('LOVABLE_API_KEY')) {
          throw new Error('api_key');
        }
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again later. 😔';
      
      if (error.message === 'auth') {
        errorMessage = '🔒 Your session has expired. Please sign in again to continue chatting.';
      } else if (error.message === 'api_key') {
        errorMessage = '⚙️ The AI service is not configured yet. Please ensure the LOVABLE_API_KEY is set in your Supabase Edge Function secrets.';
      } else if (error.message?.includes('FunctionsHttpError') || error.message?.includes('500')) {
        errorMessage = '🔧 The AI service is temporarily unavailable. Please try again in a moment.';
      }

      toast({
        title: 'Error',
        description: 'Failed to get a response from the assistant.',
        variant: 'destructive',
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-lg transition-all hover:scale-110 animate-pulse-soft"
          aria-label="Open chat assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 w-96 h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold">Re:Local Assistant</h3>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="hover:bg-primary-foreground/20 text-primary-foreground"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Prompts */}
          {messages.length === 1 && (
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(prompt.text)}
                    className="text-xs bg-muted hover:bg-muted/80 px-3 py-2 rounded-full transition-colors"
                  >
                    {prompt.icon} {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
