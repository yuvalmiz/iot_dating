import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SharedStateContext } from '../context';
import { readFromTable } from '../api';
import useSignalR from '../services/SignalRConnection';


export default function ChatHistoryScreen({ navigation }) {
  const { email } = useContext(SharedStateContext);  // Get the current user's email
  const [chatList, setChatList] = useState([]);  // This will hold the chat list with names
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);  // To handle pull-to-refresh
  useSignalR({ onMessageReceived: (sender, message, timestamp) => {
    setChatList((prevChats) => { // Update the chat list when a new message is received
      var newChat = [...prevChats];
      var was_modified = false;
      for (let i = 0; i < prevChats.length; i++) {
        if (newChat[i].email === message.RowKey) {
          newChat[i].lastMessage = message.Message;
          newChat[i].timestamp = message.StringTimestamp;
          newChat[i].isUnread = message.isRead === false;
          was_modified = true;
          break;
        }
      }
      if (!was_modified) {
        newChat.push({
          email: message.RowKey,
          name: message.otherUserName,
          lastMessage: message.Message,
          timestamp: message.StringTimestamp,
          isUnread: message.isRead === false,
        });
      }
      return newChat;
    });
    }, groupName: `${email};chat` });

  useEffect(() => {
    const fetchChats = async () => {
      try {
        // Step 1: Query for all rows where the user is the PartitionKey and RowKey is 'chat'
        const queryFilter = `PartitionKey eq '${email};chat'`;
        const allChats = await readFromTable('BarTable', queryFilter);

        // Step 2: Process the chat rows, extracting relevant fields
        const chatList = await Promise.all(allChats.map(async (chat) => {
          const { RowKey, StringTimestamp, Message, Timestamp, isRead, otherUserName } = chat;
          
          return { 
            email: RowKey, 
            name: otherUserName, 
            lastMessage: Message, 
            timestamp: StringTimestamp, 
            isUnread: isRead === false 
          };
        }));

        // Step 3: Sort conversations by the last message timestamp (Timestamp field)
        const sortedChatList = chatList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setChatList(sortedChatList);  // Update the chatList state
      } catch (error) {
        console.error('Error fetching chat list:', error);
      } finally {
        setLoading(false);  // Stop the loading spinner
      }
    };

    fetchChats();
  }, [email]);

  const renderChatItem = ({ item }) => {
    const formattedTimestamp = new Date(item.timestamp).toLocaleString();
    console.log('Chat item:', item);
    return (
      <TouchableOpacity
        style={[styles.chatItem, item.isUnread ? styles.unreadChatItem : null]}  // Highlight unread chats
        onPress={() => navigation.navigate('Chat', { otherUserEmail: item.email })}
      >
        <Text style={styles.chatText}>{item.name}</Text>  {/* Display the user's name */}
        <Text style={styles.messageText}>{item.lastMessage}</Text>  {/* Display the last message */}
        <Text style={styles.timestampText}>{isNaN(new Date(item.timestamp)) ? 'Invalid Date' : formattedTimestamp}</Text>  {/* Display the timestamp */}
      </TouchableOpacity>
    );
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    // Fetch new data (add your refreshing logic here)
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chatList}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.email}
        ListEmptyComponent={<Text>No chat history available</Text>}
        onEndReached={() => console.log('End reached')} // Handle scrolling to bottom
        onEndReachedThreshold={0.5}  // Trigger onEndReached when scrolled 50% from the bottom
        refreshing={isRefreshing}  // Handle pull-to-refresh
        onRefresh={onRefresh}  // Refresh callback
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  chatItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  unreadChatItem: {
    backgroundColor: '#e0f7fa',  // Light blue background for unread chats
  },
  chatText: {
    fontSize: 16,
  },
  messageText: {
    fontSize: 14,
    color: '#555',
  },
  timestampText: {
    fontSize: 12,
    color: '#888',
  },
});
