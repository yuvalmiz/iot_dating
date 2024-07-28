import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import useSignalR from '../services/SignalRConnection';
import { readFromTable } from '../api';
import { SharedStateContext } from '../context';

const ChatScreen = ({ route }) => {
  const { otherUserEmail } = route.params;
  const { email } = useContext(SharedStateContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { sendMessage, connection } = useSignalR((sender, message) => {
    setMessages((prevMessages) => [...prevMessages, { Sender: sender, Message: message }]);
  });

  useEffect(() => {
    const fetchMessages = async () => {
      const users = [email, otherUserEmail].sort();
      const partitionKey = `${users[0]};${users[1]}`;
      const queryFilter = `PartitionKey eq '${partitionKey}'`;
      const fetchedMessages = await readFromTable('BarTable', queryFilter);
      setMessages(fetchedMessages.sort((a, b) => a.Timestamp.localeCompare(b.Timestamp)));
    };

    fetchMessages();

    if (connection) {
      connection.on('ReceiveMessage', (sender, message) => {
        setMessages((prevMessages) => [...prevMessages, { Sender: sender, Message: message }]);
      });

      return () => {
        connection.off('ReceiveMessage');
      };
    }
  }, [email, otherUserEmail, connection]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(email, otherUserEmail, newMessage);
      setNewMessage('');
    }
  };

  const renderItem = ({ item }) => (
    <View style={item.Sender === email ? styles.myMessage : styles.otherMessage}>
      <Text>{item.Message}</Text>
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
});

export default ChatScreen;
