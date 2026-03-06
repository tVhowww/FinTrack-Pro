package com.fintrack.transaction_service.utils;

import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.Message;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class SimpleChatMemory implements ChatMemory {

    // Nơi chứa ký ức: Key là UserId, Value là danh sách tin nhắn
    private final Map<String, List<Message>> memory = new ConcurrentHashMap<>();

    @Override
    public void add(String conversationId, List<Message> messages) {
        memory.putIfAbsent(conversationId, new ArrayList<>());
        memory.get(conversationId).addAll(messages);
    }

    @Override
    public List<Message> get(String conversationId) {
        // Trả về toàn bộ lịch sử, thằng Advisor sẽ tự biết cắt lấy 10 câu gần nhất
        return memory.getOrDefault(conversationId, new ArrayList<>());
    }

    @Override
    public void clear(String conversationId) {
        memory.remove(conversationId);
    }
}