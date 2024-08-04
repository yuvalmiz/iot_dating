import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { QrReader } from 'react-qr-reader';
import { useNavigation } from '@react-navigation/native';
import { insertIntoTable } from '../api';
import { SharedStateContext} from '../context';


export default function MyQRCodeScannerScreen() {
  const [data, setData] = useState('No result');
  const navigation = useNavigation();
  const { email } = useContext(SharedStateContext);

  const handleScan = async (data) => {
    if (data) {
      console.log('Scanned data:', data);
      const barName = data.split(';')[0];
      console.log('Bar ID:', barName);
      const seatName = data.split(';')[1];
      console.log('Seat ID:', seatName);
      const updatedSeat = {
        PartitionKey: barName,
        RowKey: seatName,
        connectedUser: email
      };
      await insertIntoTable({tableName: 'BarTable', entity:updatedSeat, action: 'update'}); 
      navigation.navigate('ViewMap');
    }
  };

  const handleError = (err) => {
    console.error(err);
    Alert.alert('Error', 'Failed to scan QR code.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instructions}>
        Align the QR code within the frame to scan.
      </Text>
      <View style={styles.qrReaderContainer}>
        <QrReader
          onResult={(result, error) => {
            if (!!result) {
              setData(result?.text);
              handleScan(result?.text);
            }
          }}
          style={styles.qrReader}
        />
      </View>
      {data && <Text>Scanned Data: {data}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  instructions: {
    fontSize: 18,
    textAlign: 'center',
  },
  qrReaderContainer: {
    width: '100%',
    height: '70%',
  },
  qrReader: {

  },
});
