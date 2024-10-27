import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { readFromTable, insertIntoTable, sendMessage } from '../../api';
import { SharedStateContext } from '../../context';
import useSignalR from '../../services/SignalRConnection';

const ManagerGiftsScreen = ({ navigation }) => {
  const { selectedBar } = useContext(SharedStateContext);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  useSignalR({
    onMessageReceived: (sender, message, timestamp) => {
      message = JSON.parse(message);
      setGifts((prevGifts) => [...prevGifts, message]);
    },
    groupName: `${selectedBar};received_gifts`,
  });

  useEffect(() => {
    const fetchGifts = async () => {
      console.log('Selected bar:', selectedBar);
      const queryFilter = `PartitionKey eq '${selectedBar};received_gifts'`;
      try {
        const giftsData = await readFromTable('BarTable', queryFilter);
        console.log('Gifts:', giftsData);
        if (giftsData.length > 0) {
          setGifts(giftsData);
        }
      } catch (error) {
        console.error('Error fetching gifts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGifts();
  }, [selectedBar]);

  const acceptGift = async (gift) => {
    const updatedGift = {
      ...gift,
      status: 'Accepted',
    };
    const updatedGiftUser = {
      PartitionKey: `${gift.sender};sent_gifts`,
      RowKey: gift.RowKey,
      reciverMail: gift.reciverMail,
      reciverSeat: gift.reciverSeat,
      Price: gift.Price,
      Message: gift.Message,
      status: 'Accepted',
      Timestamp: gift.Timestamp,
      StringTimestamp: gift.StringTimestamp,
    };
    console.log('Accepting gift:', updatedGift);
    try {
      // Update the gift in the table
      await insertIntoTable({
        tableName: 'BarTable',
        entity: updatedGift,
        action: 'update',
      });
      await insertIntoTable({
        tableName: 'BarTable',
        entity: updatedGiftUser,
        action: 'update',
      });

      // Optionally, send a notification to the sender via SignalR
      const senderGroupName = `${gift.sender};sent_gifts`;
      const message = JSON.stringify(updatedGift);
      await sendMessage({ groupName: senderGroupName, message });

      Alert.alert('Gift Accepted', 'The gift has been accepted successfully!');

      // Refresh the gifts list
      setGifts((prevGifts) => prevGifts.map((g) => (g.RowKey === gift.RowKey ? updatedGift : g)));
    } catch (error) {
      console.error('Error accepting gift:', error);
    }
  };

  const declineGift = async (gift) => {
    const updatedGift = {
      ...gift,
      status: 'Declined',
    };
    const updatedGiftUser = {
      PartitionKey: `${gift.sender};sent_gifts`,
      RowKey: gift.RowKey,
      reciverMail: gift.reciverMail,
      reciverSeat: gift.reciverSeat,
      Price: gift.Price,
      Message: gift.Message,
      status: 'Declined',
      Timestamp: gift.Timestamp,
      StringTimestamp: gift.StringTimestamp,
    };
    console.log('Declining gift:', updatedGift);
    try {
      // Update the gift in the table
      await insertIntoTable({
        tableName: 'BarTable',
        entity: updatedGift,
        action: 'update',
      });
      await insertIntoTable({
        tableName: 'BarTable',
        entity: updatedGiftUser,
        action: 'update',
      });

      // Optionally, send a notification to the sender via SignalR
      const senderGroupName = `${gift.sender};sent_gifts`;
      const message = JSON.stringify(updatedGift);
      await sendMessage({ groupName: senderGroupName, message });

      Alert.alert('Gift Declined', 'The gift has been declined successfully!');

      // Refresh the gifts list
      setGifts((prevGifts) => prevGifts.map((g) => (g.RowKey === gift.RowKey ? updatedGift : g)));
    } catch (error) {
      console.error('Error declining gift:', error);
    }
  };

  const renderGift = ({ item }) => (
    <View style={styles.giftItem}>
      <Text style={styles.giftText}>From: {item.sender}</Text>
      <Text style={styles.giftText}>Seat: {item.senderSeat}</Text>
      <Text style={styles.giftText}>To: {item.reciverMail}</Text>
      <Text style={styles.giftText}>To Seat Number: {item.reciverSeat}</Text>
      <Text style={styles.giftText}>Items: {JSON.parse(item.Message).cart.map(cartItem => cartItem.name).join(', ')}</Text>
      <Text style={styles.giftText}>Price: {item.Price}₪</Text>
      <Text style={styles.giftText}>Status: {item.status}</Text>

      {item.status === 'pending' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.acceptButton} onPress={() => acceptGift(item)}>
            <Text style={styles.buttonText}>Accept Gift</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineButton} onPress={() => declineGift(item)}>
            <Text style={styles.buttonText}>Decline Gift</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={gifts}
          keyExtractor={(item) => item.RowKey}
          renderItem={renderGift}
          ListEmptyComponent={<Text>No gifts found</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
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
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    flex: 1,
    marginRight: 5,
  },
  declineButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ManagerGiftsScreen;
