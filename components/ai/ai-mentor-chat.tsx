'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { callApiWithRetry } from '@/lib/utils';
import { sendMessage } from '@/lib/firestore';
import { Project, ChatMessage, Task, ProjectMember, LiveActivity, SubscriptionTier } from '@/lib/types';
import { UsageTracker, SubscriptionService } from '@/lib/subscription-service';
import { useToast } from '@/components/ui/use-toast';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Clock, 
  MessageCircle, 
  Code, 
  Lightbulb, 
  Target,
  User
} from 'lucide-react';

interface AIMentorChatProps {
  project: Project;
  tasks: Task[];
  members: ProjectMember[];
  activities: LiveActivity[];
  messages: ChatMessage[];
  onMessageSent?: (msg: ChatMessage) => void;
}

type Persona = 'general' | 'technical' | 'product' | 'pitch';

export function AIMentorChat({ 
  project, 
  tasks, 
  members, 
  activities, 
  messages, 
  onMessageSent 
}: AIMentorChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState<Persona>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim() || !user || isLoading) return;

    // Check AI credits
    const usage = UsageTracker.getUsage(user.uid);
    if (!SubscriptionService.canUseAI(usage.aiCreditsUsed, user.subscriptionTier as SubscriptionTier)) {
      toast({
        title: "AI Credit Limit Reached",
        description: "Please upgrade your plan to continue using AI features.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const userMessageContent = input;
    setInput('');

    // Optimistic User Message
    const tempUserMsg: ChatMessage = {
      message_id: `temp-${Date.now()}`,
      project_id: project.id,
      sender: user.uid,
      sender_type: "user",
      content: userMessageContent,
      timestamp: new Date(),
    };
    onMessageSent?.(tempUserMsg);

    try {
      // 1. Save User Message to DB
      await sendMessage({
        project_id: project.id,
        sender: user.uid,
        sender_type: "user",
        content: userMessageContent,
      });

      // 2. Prepare Context
      const context = {
        project: {
          name: project.name,
          description: project.description,
          idea: project.idea,
          techStack: project.techStack,
          status: project.status
        },
        tasksSummary: {
          total: tasks.length,
          completed: tasks.filter(t => t.status === 'Done').length,
          highPriority: tasks.filter(t => t.priority === 'High' || t.priority === 'Critical').length
        },
        teamSize: members.length,
        recentActivity: activities.slice(0, 5).map(a => a.description)
      };

      // 3. Call AI API
      const data = await callApiWithRetry<{ result: string }>("chat", () =>
        fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "mentor_chat",
            data: {
              question: userMessageContent,
              context: JSON.stringify(context, null, 2),
              persona: persona
            },
          }),
        })
      );

      const aiResponse = data.result;

      // 4. Save AI Message to DB
      const aiMsgId = await sendMessage({
        project_id: project.id,
        sender: "ai",
        sender_type: "ai",
        content: aiResponse,
      });

      // Optimistic AI Update
      const tempAiMsg: ChatMessage = {
        message_id: aiMsgId,
        project_id: project.id,
        sender: "ai",
        sender_type: "ai",
        content: aiResponse,
        timestamp: new Date(),
      };
      onMessageSent?.(tempAiMsg);

      // 5. Track Usage
      UsageTracker.incrementAICredits(user.uid, 5);

    } catch (error: any) {
      console.error("Mentor chat error:", error);
      toast({
        title: "Failed to get AI response",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const personas = [
    { id: 'general', label: 'Guide', icon: <User className="h-4 w-4" /> },
    { id: 'technical', label: 'CTO', icon: <Code className="h-4 w-4" /> },
    { id: 'product', label: 'PM', icon: <Target className="h-4 w-4" /> },
    { id: 'pitch', label: 'VC', icon: <Lightbulb className="h-4 w-4" /> },
  ];

  return (
    <Card className="h-[600px] flex flex-col shadow-sm border-2">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Mentor Chat
          </CardTitle>
          <Badge variant="secondary" className="font-normal">
            {5} credits / msg
          </Badge>
        </div>
        <CardDescription>
          Choose a mentor persona and get expert advice
        </CardDescription>

        <Tabs 
          value={persona} 
          onValueChange={(v) => setPersona(v as Persona)}
          className="w-full mt-2"
        >
          <TabsList className="grid grid-cols-4 w-full h-9">
            {personas.map(p => (
              <TabsTrigger key={p.id} value={p.id} className="text-xs flex items-center gap-1.5 md:gap-2">
                {p.icon}
                <span className="hidden md:inline">{p.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden pt-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-10 px-6">
                <div className="bg-primary/5 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                   <MessageCircle className="h-8 w-8 text-primary/60" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Start a conversation</h3>
                <p className="text-sm">
                  Select a persona above and ask for specific advice about your project.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-6">
                  <Button variant="outline" size="sm" onClick={() => setInput("Review our tech stack choice")}>
                    Review tech stack
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setInput("How to prioritize features?")}>
                    Prioritize features
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setInput("Critique our pitch idea")}>
                     Critique pitch
                  </Button>
                </div>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.message_id}
                className={`flex w-full ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex flex-col max-w-[85%] ${
                    msg.sender_type === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2.5 pb-3 shadow-sm ${
                      msg.sender_type === "user" 
                        ? "bg-primary text-primary-foreground rounded-br-none" 
                        : "bg-muted rounded-bl-none border"
                    }`}
                  >
                   <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                   </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {msg.sender_type === 'ai' ? 'AI Mentor' : 'You'} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start w-full">
                 <div className="bg-muted rounded-2xl rounded-bl-none px-4 py-3 border flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 mt-auto">
          <Input
            placeholder={`Ask the ${personas.find(p => p.id === persona)?.label} mentor...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
