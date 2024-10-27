import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Keyboard } from 'react-native';
import useSignalR from '../../services/SignalRConnection';
import { readFromTable, insertIntoTable, sendMessage } from '../../api';
import { SharedStateContext } from '../../context';
import { format } from 'date-fns';


const ChatScreen = ({ route }) => {
  const { otherUserEmail, otherUserName } = route.params;
  const { email, firstName, lastName, } = useContext(SharedStateContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);  // Loading state for fetching names
  const users = [email, otherUserEmail].sort();
  const userName = `${firstName} ${lastName}`;
  const { connection } = useSignalR({ onMessageReceived: async (sender, message, timestamp) => {
    setMessages((prevMessages) => [...prevMessages, { Sender: message.Sender, Message: message.Message, Timestamp: message.Timestamp }]);
    const newChatEntryForEmail = {
      PartitionKey: `${email};chat`,
      RowKey: otherUserEmail,
      otherUserName: otherUserName,
      Message: message.Message,
      isRead: true,
      Timestamp: message.Timestamp,
      StringTimestamp: message.StringTimestamp // Add a string timestamp for sorting
    };
    
    await insertIntoTable({ tableName: 'BarTable', entity: newChatEntryForEmail, action: 'update' });
    await sendMessage({groupName: `${email};chat`, message: newChatEntryForEmail});
    scrollToEnd(); // Scroll to bottom when a new message arrives
  }, groupName: `${users[0]};${users[1]}` });

  const flatListRef = useRef(); // Reference for FlatList to handle scrolling

  useEffect(() => {
    const fetchMessages = async () => {
    try {
      const partitionKey = `${users[0]};${users[1]}`;
      console.log('Fetching messages for:', partitionKey);
      const queryFilter = `PartitionKey eq '${partitionKey}'`;
      const queryLastMessage = `PartitionKey eq '${email};chat' and RowKey eq '${otherUserEmail}'`;
      const fetchedMessages = await readFromTable('BarTable', queryFilter);
      const lastMessage = await readFromTable('BarTable', queryLastMessage);
      fetchedMessages.forEach(message => {
        if (!message.Timestamp) {
          message.Timestamp = new Date().toISOString(); // Set a default timestamp if missing
        }
      });
      if (lastMessage.length > 0 && lastMessage[0].isRead === false) {
        const updatedMessage = {
          ...lastMessage[0],
          isRead: true
        };
        await insertIntoTable({ tableName: 'BarTable', entity: updatedMessage, action: 'update' });
        await sendMessage({groupName: `${email};chat`, message: updatedMessage});
      }
      setMessages(fetchedMessages.sort((a, b) => a.Timestamp.localeCompare(b.Timestamp)));
    } catch (error) {
      console.error('Error fetching chat or user info:', error);
    } finally {
      setLoading(false);  // Stop the loading spinner
    }
    };

    fetchMessages();
    return () => {
      if (connection) {
        connection.stop();
      }
    };
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
      const StringTimestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
      const users = [email, otherUserEmail].sort(); // Sort the emails
      const partitionKey = `${users[0]};${users[1]}`; // Use sorted emails as PartitionKey
  
      // Check if this is the first message between the users
      try {
        const chatCheckQuery = `PartitionKey eq '${partitionKey}'`;
        const chatExists = await readFromTable('BarTable', chatCheckQuery);
        const newChatEntryForEmail = {
          PartitionKey: `${email};chat`,
          RowKey: otherUserEmail,
          otherUserName: otherUserName,
          Message: newMessage,
          isRead: true,
          Timestamp: timestamp,
          StringTimestamp: StringTimestamp // Add a string timestamp for sorting
        };

        const newChatEntryForOtherUser = {
          PartitionKey: `${otherUserEmail};chat`,
          RowKey: email,
          otherUserName: userName,
          Message: newMessage,
          isRead: false,
          Timestamp: timestamp,
          StringTimestamp: StringTimestamp // Add a string timestamp for sorting
        };

        const chatEntry = {
          PartitionKey: partitionKey,
          RowKey: timestamp,
          Sender: email,
          SenderName: userName,
          reciverName: otherUserName,
          Message: newMessage,
          Timestamp: timestamp,
          StringTimestamp: StringTimestamp
        };
        var action = 'update'
        if (chatExists.length === 0) {
          action = 'create';
        }
        await Promise.all([
          insertIntoTable({ tableName: 'BarTable', entity: newChatEntryForEmail, action: action }),
          insertIntoTable({ tableName: 'BarTable', entity: newChatEntryForOtherUser, action: action })
        ]);
        await insertIntoTable({ tableName: 'BarTable', entity: chatEntry });
        // Send the actual message after the first chat entry is made
        await sendMessage({user: email, otherUser: otherUserEmail, message: chatEntry});
        await sendMessage({groupName: `${otherUserEmail};chat`, message:newChatEntryForOtherUser});

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
        <Text style={styles.timestamp}>{isNaN(new Date(item.RowKey)) ? new Date(item.Timestamp).toLocaleString() : formattedTimestamp}</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {otherUserName}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.RowKey ? item.RowKey : item.Timestamp}
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
    backgroundColor: '#ffffff',
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