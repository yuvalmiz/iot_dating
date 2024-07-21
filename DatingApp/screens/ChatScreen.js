// ChatScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { startChat, sendMessage, getMessages } from '../api';

const ChatScreen = ({ route }) => {
  const { user1Id, user2Id } = route.params;
  const [chatId, setChatId] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const initiateChat = async () => {
      const id = await startChat(user1Id, user2Id);
      setChatId(id);
    };
    initiateChat();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (chatId) {
        const msgs = await getMessages(chatId);
        setMessages(msgs);
      }
    };
    fetchMessages();
  }, [chatId]);

  const handleSend = async () => {
    if (message.trim()) {
      await sendMessage(chatId, user1Id, message);
      setMessage('');
      const updatedMessages = await getMessages(chatId);
      setMessages(updatedMessages);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={styles.message}>{item.sender_id === user1Id ? 'Me' : 'Them'}: {item.message}</Text>
        )}
      />
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Type a message"
      />
      <Button title="Send" onPress={handleSend} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  message: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    backgroundColor: '#e1e1e1',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginVertical: 10,
  },
});

export default ChatScreen;
