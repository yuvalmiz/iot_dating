import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation } from '@react-navigation/native';
import { insertIntoTable, readFromTable, sendMessage } from '../../api';
import { SharedStateContext } from '../../context';

export default function MyQRCodeScannerScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [wrongBar, setWrongBar] = useState(false);
  const [occupiedSeat, setOccupiedSeat] = useState(false);
  const [nonExistentSeat, setNonExistentSeat] = useState(false);
  const [updateSeatSuccess, setUpdateSeatSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { email, selectedBar, connectedSeats, setConnectedSeats } = useContext(SharedStateContext);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setIsLoading(true);

    console.log('Scanned data:', data);

    const scanRegex = /^bar\d+;seat_\d+$/;
    if (!scanRegex.test(data)) {
      console.error('Invalid QR code format:', data);
      setIsLoading(false);
      setModalVisible(true);
      return;
    }

    const [barName, seatName] = data.split(';');
    if (barName !== selectedBar) {
      console.error('The scanned seat does not belong to the selected bar:', data);
      setWrongBar(true);
      setIsLoading(false);
      setModalVisible(true);
      return;
    }

    const queryFilter = `PartitionKey eq '${barName}' and RowKey eq '${seatName}'`;
    const seatData = await readFromTable('BarTable', queryFilter);
    if (seatData.length === 0) {
      console.error('The scanned seat does not exist:', data);
      setNonExistentSeat(true);
      setIsLoading(false);
      setModalVisible(true);
      return;
    }
    if (seatData.length > 0 && seatData[0].connectedUser) {
      console.error('The scanned seat is already occupied:', data);
      setOccupiedSeat(true);
      setIsLoading(false);
      setModalVisible(true);
      return;
    }

    const updatedSeat = {
      PartitionKey: barName,
      RowKey: seatName,
      connectedUser: email,
    };
    console.log('Updated seat:', updatedSeat);
    await insertIntoTable({ tableName: 'BarTable', entity: updatedSeat, action: 'update' });

    const updatedConnectedSeats = { ...connectedSeats, [barName]: seatName };
    sendMessage({ groupName: `seatsChange`, message: updatedSeat });
    setConnectedSeats(updatedConnectedSeats);
    console.log('Connected seats:', updatedConnectedSeats);

    const updatedUser = {
      PartitionKey: 'Users',
      RowKey: email,
      connectedSeats: Object.entries(updatedConnectedSeats)
        .map(([bar, seat]) => `${bar};${seat}`)
        .join(','),
    };
    await insertIntoTable({ tableName: 'BarTable', entity: updatedUser, action: 'update' });

    setUpdateSeatSuccess(true);
    setIsLoading(false);
    setModalVisible(true);
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera. Please enable camera permissions in your device settings.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Code Scanner</Text>
      <Text style={styles.instructions}>
        Scan a QR code using your camera to connect to a seat.
      </Text>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      ) : (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject, styles.scanner}
        />
      )}
      {scanned && (
        <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
          <Text style={styles.buttonText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            {updateSeatSuccess && (
              <Text style={styles.modalText}>Seat successfully updated!</Text>
            )}
            {!updateSeatSuccess && !wrongBar && !occupiedSeat && !nonExistentSeat && (
              <Text style={styles.modalText}>Invalid QR code format! Please scan a valid seat QR code.</Text>
            )}
            {wrongBar && (
              <Text style={styles.modalText}> The scanned seat does not belong to the selected bar! Please scan a seat from the selected bar.</Text>
            )}
            {occupiedSeat && (
              <Text style={styles.modalText}>The scanned seat is already occupied! Please scan another seat.</Text>
            )}
            {nonExistentSeat && (
              <Text style={styles.modalText}>The scanned seat does not exist! Please scan a valid seat QR code.</Text>
            )}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate("User Menu");
              }}
            >
              <Text style={styles.modalButtonText}>Return to Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
              }}
            >
              <Text style={styles.modalButtonText}>Scan again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  instructions: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 60,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scanner: {
    width: '60%',
    height: '60%',
  }
});
