import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Keyboard } from 'react-native';
import useSignalR from '../services/SignalRConnection';
import { readFromTable, markMessagesAsRead, insertIntoTable } from '../api';
import { SharedStateContext } from '../context';
import { format } from 'date-fns';
// import { useFocusEffect } from '@react-navigation/native';  // <-- Import useFocusEffect


const ChatScreen = ({ route }) => {
  const { otherUserEmail } = route.params;
  const { email } = useContext(SharedStateContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUserName, setOtherUserName] = useState(''); // State to store the other user's full name
  const [loading, setLoading] = useState(true);  // Loading state for fetching names
  const users = [email, otherUserEmail].sort();
  const { sendMessage, connection, joinGroup, leaveGroup } = useSignalR({ onMessageReceived: (sender, message, timestamp) => {
    setMessages((prevMessages) => [...prevMessages, { Sender: sender, Message: message, Timestamp: timestamp }]);
    scrollToEnd(); // Scroll to bottom when a new message arrives
  }, otherEmail: otherUserEmail });

  const flatListRef = useRef(); // Reference for FlatList to handle scrolling

  useEffect(() => {
    const fetchMessages = async () => {
    try {
      const partitionKey = `${users[0]};${users[1]}`;
      const queryFilter = `PartitionKey eq '${partitionKey}'`;
      const fetchedMessages = await readFromTable('BarTable', queryFilter);

      fetchedMessages.forEach(message => {
        if (!message.Timestamp) {
          message.Timestamp = new Date().toISOString(); // Set a default timestamp if missing
        }
      });

      setMessages(fetchedMessages.sort((a, b) => a.Timestamp.localeCompare(b.Timestamp)));

      // Mark unread messages as read (only those from the other user)
      await markMessagesAsRead(email, otherUserEmail);

      window.dispatchEvent(new Event('chatUpdated'));
      // Fetch the other user's first and last name
      const userQuery = `PartitionKey eq 'Users' and RowKey eq '${otherUserEmail}'`;
      const userInfo = await readFromTable('BarTable', userQuery);  // Assuming user data is in the 'BarTable'

      if (userInfo.length > 0) {
        const { firstName, lastName } = userInfo[0];
        setOtherUserName(`${firstName} ${lastName}`);
      } else {
        setOtherUserName(otherUserEmail);  // Fallback to email if name is not found
      }
    } catch (error) {
      console.error('Error fetching chat or user info:', error);
    } finally {
      setLoading(false);  // Stop the loading spinner
    }
    };

    fetchMessages();

    if (connection) {
      const groupName = `${users[0]};${users[1]}`;
      console.log(`Joining group - ${groupName}`, connection);
      joinGroup(groupName).catch((err) => console.log(err));

      return () => {
        // Define an async function to handle leaving and marking as read
        const leaveChat = async () => {
          try {
            console.log('Leaving group');
            
            // Mark messages as read before leaving the group
            await markMessagesAsRead(email, otherUserEmail);
            
            // Dispatch an event to notify that the chat history has been updated
            window.dispatchEvent(new Event('chatUpdated'));
  
            // Leave the chat group
            await leaveGroup(groupName);
          } catch (err) {
            console.error('Error leaving group or marking messages as read:', err);
          }
        };
  
        // Call the async function (but don't await it directly here)
        leaveChat();
      };
    }
  }, [email, otherUserEmail, connection]);

  // const handleSendMessage = () => {
  //   if (newMessage.trim()) {
  //     const timestamp = new Date().toISOString();
  //     sendMessage(email, otherUserEmail, newMessage, timestamp);
  //     setNewMessage('');
  //     Keyboard.dismiss();
  //     scrollToEnd(); // Scroll to the bottom after sending a message
  //   }
  // };

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const timestamp = new Date().toISOString();
      const users = [email, otherUserEmail].sort(); // Sort the emails
      const partitionKey = `${users[0]};${users[1]}`; // Use sorted emails as PartitionKey
  
      // Check if this is the first message between the users
      try {
        const chatCheckQuery = `PartitionKey eq '${partitionKey}'`;
        const chatExists = await readFromTable('BarTable', chatCheckQuery);
        const newChatEntryForEmail = {
          PartitionKey: email,
          RowKey: otherUserEmail,
          Message: newMessage,
          isRead: true,
          Timestamp: timestamp,
          StringTimestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss') // Add a string timestamp for sorting
        };

        const newChatEntryForOtherUser = {
          PartitionKey: otherUserEmail,
          RowKey: email,
          Message: newMessage,
          isRead: false,
          Timestamp: timestamp,
          StringTimestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss') // Add a string timestamp for sorting
        };
  
        if (chatExists.length === 0) {
          // First time chatting with this user, insert both entries
          // Insert both chat entries
          await Promise.all([
            insertIntoTable({ tableName: 'BarTable', entity: newChatEntryForEmail }),
            insertIntoTable({ tableName: 'BarTable', entity: newChatEntryForOtherUser })
          ]);
        }
        else {
          // Insert both chat entries
          await Promise.all([
            insertIntoTable({ tableName: 'BarTable', entity: newChatEntryForEmail, action: 'update' }),
            insertIntoTable({ tableName: 'BarTable', entity: newChatEntryForOtherUser, action: 'update' })
          ]);
        }
  
        // Send the actual message after the first chat entry is made
        sendMessage(email, otherUserEmail, newMessage, timestamp);
        setNewMessage('');
        Keyboard.dismiss();
        scrollToEnd(); // Scroll to the bottom after sending a message
      } catch (error) {
        console.error('Error handling first chat message:', error);
      }
    }
  };
  

  const handleKeyPress = (e) => {
    if (e.nativeEvent.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Function to scroll to the bottom of the FlatList
  const scrollToEnd = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const renderItem = ({ item }) => {
    // Use the Timestamp field from the message to get the time
    const messageTimestamp = new Date(item.RowKey);
  
    // Format the timestamp as a human-readable string (you can adjust the format as needed)
    const formattedTimestamp = messageTimestamp.toLocaleString(); // Default locale string
  
    return (
      <View style={item.Sender === email ? styles.myMessage : styles.otherMessage}>
        <Text>{item.Message}</Text>
        <Text style={styles.timestamp}>{isNaN(new Date(item.RowKey)) ? new Date(item.Timestamp).toLocaleString() : formattedTimestamp}</Text> {/* Display the message's timestamp */}
      </View>
    );
  };
  

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading chat...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with other user's full name */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {otherUserName}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.RowKey}
        //keyExtractor={(item, index) => index.toString()} // Use index as a key since RowKey might not be unique

        style={styles.messageList}
        contentContainerStyle={styles.contentContainer} // Ensure the container style allows scrolling
        showsVerticalScrollIndicator={true} // Show the vertical scrollbar
        scrollEnabled={true} // Ensure scrolling is enabled
        onContentSizeChange={scrollToEnd} // Scroll to the bottom when content size changes
        onLayout={scrollToEnd} // Scroll to the bottom on initial render
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message"
          style={styles.input}
          onKeyPress={handleKeyPress}
        />
        <Button title="Send" onPress={handleSendMessage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  messageList: {
    flex: 1, // Ensure FlatList takes up remaining space
  },
  contentContainer: {
    paddingVertical: 10, // Add some padding to the messages
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  myMessage: {
    padding: 10,
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
    borderRadius: 5,
    margin: 5,
  },
  otherMessage: {
    padding: 10,
    backgroundColor: '#f1f1f1',
    alignSelf: 'flex-start',
    borderRadius: 5,
    margin: 5,
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
  },
});

export default ChatScreen;