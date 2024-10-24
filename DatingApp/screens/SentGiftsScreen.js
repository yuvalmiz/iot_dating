import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { readFromTable } from '../api';
import { SharedStateContext } from '../context';
import useSignalR from '../services/SignalRConnection';

const SentGiftsScreen = () => {
  const { email } = useContext(SharedStateContext);  // Assuming email is stored in SharedStateContext
  const [sentGifts, setSentGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  useSignalR({onMessageReceived: (sender, message, timestamp) => {
    message = JSON.parse(message);
    setSentGifts((prevGifts) => prevGifts.map((g) => (g.RowKey === message.RowKey ? {...g, status: message.status } : g)));
  },groupName: `${email};sent_gifts`});


  useEffect(() => {
    const fetchSentGifts = async () => {
      const partitionKey = `${email};sent_gifts`;
      const queryFilter = `PartitionKey eq '${partitionKey}'`;
      
      try {
        const sentGiftsData = await readFromTable('BarTable', queryFilter);
        setSentGifts(sentGiftsData);
      } catch (error) {
        console.error('Error fetching sent gifts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSentGifts();
  }, [email]);

  const renderGift = ({ item }) => (
    <View style={styles.giftItem}>
      <Text style={styles.giftText}>Receiver: {item.reciverMail}</Text>
      <Text style={styles.giftText}>Seat: {item.reciverSeat}</Text>
      <Text style={styles.giftText}>Items: {JSON.parse(item.Message).cart.map(cartItem => cartItem.name).join(', ')}</Text>
      <Text style={styles.giftText}>Price: ${item.Price}</Text>
      <Text style={styles.giftText}>Accepted: {item.status}</Text>
      <Text style={styles.giftText}>Date: {item.StringTimestamp}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : sentGifts.length > 0 ? (
        <FlatList
          data={sentGifts}
          keyExtractor={(item) => item.RowKey}
          renderItem={renderGift}
          contentContainerStyle={styles.listContent}
          style={styles.flatList}
        />
      ) : (
        <Text style={styles.noGiftsText}>No gifts sent yet.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,  // Ensures the container takes up the full height of the screen
    padding: 16,
    backgroundColor: '#fff',
  },
  flatList: {
    flex: 1,  // Allows FlatList to expand and enable scrolling
    overflow: 'scroll',  // Allows content to overflow the container
  },
  listContent: {
    paddingBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
  giftItem: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  giftText: {
    fontSize: 16,
    marginBottom: 5,
  },
  noGiftsText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});

export default SentGiftsScreen;
