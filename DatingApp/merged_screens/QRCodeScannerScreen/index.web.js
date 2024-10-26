import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native-web';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigation } from '@react-navigation/native';
import { insertIntoTable, readFromTable } from '../../api';
import { SharedStateContext } from '../../context';

export default function MyQRCodeScannerScreen() {
  const [scanResult, setScanResult] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [wrongBar, setWrongBar] = useState(false);
  const [occupiedSeat, setOccupiedSeat] = useState(false);
  const [nonExistentSeat, setNonExistentSeat] = useState(false);
  const [updateSeatSuccess, setUpdateSeatSuccess] = useState(false);
  const [scannerStopped, setScannerStopped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { email, selectedBar, connectedSeats, setConnectedSeats } = useContext(SharedStateContext);

  let scanner;

  useEffect(() => {
    startCameraScanner();
    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(console.error);
      }
    };
  }, []);

  const handleScanSuccess = async (scannedData) => {
    if (scannedData && !scannerStopped) {
      setScannerStopped(true);
      setIsLoading(true);

      console.log('Scanned data:', scannedData);

      if (scanner) {
        scanner.stop().catch(console.error);
      }

      const scanRegex = /^bar\d+;seat_\d+$/;
      if (!scanRegex.test(scannedData)) {
        console.error('Invalid QR code format:', scannedData);
        setIsLoading(false);
        setModalVisible(true);
        return;
      }
      
      const [barName, seatName] = scannedData.split(';');
      if (barName !== selectedBar) {
        console.error('The scanned seat does not belong to the selected bar:', scannedData);
        setWrongBar(true);
        setIsLoading(false);
        setModalVisible(true);
        return;
      }

      const queryFilter = `PartitionKey eq '${barName}' and RowKey eq '${seatName}'`;
      const seatData = await readFromTable('BarTable', queryFilter);
      if (seatData.length === 0) {
        console.error('The scanned seat does not exist:', scannedData);
        setNonExistentSeat(true);
        setIsLoading(false);
        setModalVisible(true);
        return;
      }
      if (seatData.length > 0 && seatData[0].connectedUser) {
        console.error('The scanned seat is already occupied:', scannedData);
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
    }
  };

  const startCameraScanner = () => {
    scanner = new Html5Qrcode('reader');
    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      handleScanSuccess,
      (errorMessage) => {
        if (!scannerStopped && errorMessage !== "QR code parse error, error = NotFoundException: No MultiFormat Readers were able to detect the code.") {
          console.error('Error scanning:', errorMessage);
        }
      }
    ).catch(console.error);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    const html5QrCode = new Html5Qrcode("reader");
    html5QrCode.scanFile(file, true)
      .then(decodedText => {
        setScanResult(decodedText);
        handleScanSuccess(decodedText);
      })
      .catch(err => {
        console.error('Scan error from file:', err);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Code Scanner</Text>
      <Text style={styles.instructions}>
        Scan a QR code using your camera or upload an image of a QR code, in order to connect to a seat.
      </Text>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      ) : (
        <>
          <View style={styles.cameraContainer}>
            <div id="reader" style={styles.qrCodeScanner}>
              <div style={styles.innerScanner}>
                <div style={styles.innerCornerTopLeft}></div>
                <div style={styles.innerCornerTopRight}></div>
                <div style={styles.innerCornerBottomLeft}></div>
                <div style={styles.innerCornerBottomRight}></div>
              </div>
            </div>
          </View>
          <TouchableOpacity style={styles.uploadButton}>
            <label htmlFor="upload" style={styles.uploadLabel}>
              Upload QR Code Image
            </label>
            <input
              id="upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={styles.uploadInput}
            />
          </TouchableOpacity>
        </>
      )}
      {scanResult && (
        <Text style={styles.resultText}>Scanned Result: {scanResult}</Text>
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
            {!updateSeatSuccess && !wrongBar && !occupiedSeat && (
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
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  cameraContainer: {
    width: '100%',
    maxWidth: 400,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  qrCodeScanner: {
    width: 500,
    height: 500,
    position: 'relative',
  },
  innerScanner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 150,
    height: 150,
    marginLeft: -75,
    marginTop: -75,
    borderColor: 'white',
    borderWidth: 2,
    zIndex: 1,
    boxShadow: '0px 0px 0px 9999px rgba(0, 0, 0, 0.5)',
  },
  innerCornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 25,
    height: 25,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: 'white',
    zIndex: 2,
  },
  innerCornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 25,
    height: 25,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: 'white',
    zIndex: 2,
  },
  innerCornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 25,
    height: 25,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: 'white',
    zIndex: 2,
  },
  innerCornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 25,
    height: 25,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: 'white',
    zIndex: 2,
  },
  uploadButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
    maxWidth: 250,
    marginTop: 40,
  },
  uploadLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'Arial',
  },
  uploadInput: {
    display: 'none',
  },
  resultText: {
    marginTop: 20,
    fontSize: 16,
    color: '#28a745',
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
});
