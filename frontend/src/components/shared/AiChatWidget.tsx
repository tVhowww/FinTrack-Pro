"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { transactionService } from "@/services/transaction.service";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content:
        "Chào sếp! Tớ là Trợ lý Tài chính AI. Sếp muốn tớ phân tích chi tiêu hay có thắc mắc gì về dòng tiền tháng này không?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await transactionService.chatWithAdvisor(
        userMsg.content,
      );
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: response,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content:
          "Xin lỗi sếp, hệ thống đang bận hoặc đứt cáp rồi. Sếp thử lại sau nhé! 😅",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white border shadow-2xl rounded-2xl w-[350px] md:w-[400px] h-[500px] max-h-[80vh] flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              Cố vấn Tài chính AI
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-sm ${msg.role === "user" ? "bg-slate-200" : "bg-purple-100 text-purple-600"}`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-2xl text-sm whitespace-pre-wrap shadow-sm ${msg.role === "user" ? "bg-purple-600 text-white rounded-tr-none" : "bg-white border rounded-tl-none text-slate-700"}`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Hiệu ứng AI đang gõ */}
            {isLoading && (
              <div className="flex gap-2 max-w-[85%]">
                <div className="shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mt-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-white border rounded-tl-none text-slate-700 flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t flex gap-2">
            <Input
              placeholder="Sếp hỏi gì đi..."
              className="focus-visible:ring-purple-500 rounded-full bg-slate-100 border-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="bg-purple-600 hover:bg-purple-700 rounded-full shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 ml-0.5" />
              )}
            </Button>
          </div>
        </div>
      )}

      {!isOpen && (
        <Button
          size="icon"
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-xl shadow-purple-200 transition-transform hover:scale-105"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </Button>
      )}
    </div>
  );
}
