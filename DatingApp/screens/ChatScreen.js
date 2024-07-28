import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Keyboard } from 'react-native';
import useSignalR from '../services/SignalRConnection';
import { readFromTable } from '../api';
import { SharedStateContext } from '../context';
import { format } from 'date-fns';

const ChatScreen = ({ route }) => {
  const { otherUserEmail } = route.params;
  const { email } = useContext(SharedStateContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const users = [email, otherUserEmail].sort();

  const { sendMessage, connection, JoinGroup, LeaveGroup } = useSignalR((sender, message, timestamp) => {
    setMessages((prevMessages) => [...prevMessages, { Sender: sender, Message: message, Timestamp: timestamp }]);
  });

  useEffect(() => {
    const fetchMessages = async () => {
      const partitionKey = `${users[0]};${users[1]}`;
      const queryFilter = `PartitionKey eq '${partitionKey}'`;
      const fetchedMessages = await readFromTable('BarTable', queryFilter);

      fetchedMessages.forEach(message => {
        if (!message.Timestamp) {
          message.Timestamp = new Date().toISOString(); // Set a default timestamp if missing
        }
      });

      setMessages(fetchedMessages.sort((a, b) => a.Timestamp.localeCompare(b.Timestamp)));
    };

    fetchMessages();

    if (connection) {
      console.log('Joining group - ${users[0]};${users[1]}', connection);
      connection.invoke('JoinGroup', `${users[0]};${users[1]}`).catch((err) => console.log("-----",err));

      return () => {
        console.log('Leaving group');
        connection.off('ReceiveMessage');
        connection.invoke('LeaveGroup', `${users[0]};${users[1]}`).catch((err) => console.log("------",err));
      };
    }
  }, [email, otherUserEmail, connection]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const timestamp = new Date().toISOString();
      sendMessage(email, otherUserEmail, newMessage, timestamp);
      setNewMessage('');
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e) => {
    if (e.nativeEvent.key === 'Enter') {
      handleSendMessage();
    }
  };

  const renderItem = ({ item }) => (
    <View style={item.Sender === email ? styles.myMessage : styles.otherMessage}>
      <Text>{item.Message}</Text>
      <Text style={styles.timestamp}>{format(new Date(item.Timestamp), 'HH:mm')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.RowKey}
        style={styles.messageList}
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
  messageList: {
    flex: 1,
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
