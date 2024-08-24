// Currentyl the QR code scanner has 2 issues -
// 1. Pressing the back button on the modal does not stop the scanner
// 2. After closing a modal saying "wrongly scan" or something, the camera resumes and it seems like the scanner is still running,
//    but it does not scan any QR codes - bug.
// This is a version trying to use resume and pause functions of the scanner to fix the issue, but it does not work.


import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native-web';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { useNavigation } from '@react-navigation/native';
import { insertIntoTable, readFromTable } from '../api';
import { SharedStateContext } from '../context';

export default function MyQRCodeScannerScreen() {
  const [scanResult, setScanResult] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [wrongBar, setWrongBar] = useState(false);
  const [occupiedSeat, setOccupiedSeat] = useState(false);
  const [nonExistentSeat, setNonExistentSeat] = useState(false);
  const [updateSeatSuccess, setUpdateSeatSuccess] = useState(false);
  const [scannerStopped, setScannerStopped] = useState(false);
  const navigation = useNavigation();
  const { email, selectedBar, connectedSeats, setConnectedSeats } = useContext(SharedStateContext);

  let scanner;

  useEffect(() => {
    scanner = new Html5Qrcode('reader');
    startCameraScanner();
    return () => {
      if (scanner && scanner.isScanning) {
        scanner.pause();
      }
    };
  }, []);

  const handleScanSuccess = async (scannedData) => {
    if (scannedData && !scannerStopped) {
      setScannerStopped(true); // Prevent further scans
      console.log('Scanned data:', scannedData);

      // Stop the scanner
      if (scanner) {
        scanner.pause();
      }

      // Verify that the scan data is in the format of 'barName;seatName', e.g., 'bar1;seat_1'
      const scanRegex = /^bar\d+;seat_\d+$/;
      if (!scanRegex.test(scannedData)) {
        console.error('Invalid QR code format:', scannedData);
        setModalVisible(true);  // Show the modal if the QR code format is invalid
        return;
      }
      
      const [barName, seatName] = scannedData.split(';');
      if (barName !== selectedBar) {
        console.error('The scanned seat does not belong to the selected bar:', scannedData);
        setWrongBar(true);
        setModalVisible(true);
        return;
      }

      // Check if the seat is already occupied
      const queryFilter = `PartitionKey eq '${barName}' and RowKey eq '${seatName}'`;
      const seatData = await readFromTable('BarTable', queryFilter);
      if (seatData.length === 0) {
        console.error('The scanned seat does not exist:', scannedData);
        setNonExistentSeat(true);
        setModalVisible(true);
        return;
      }
      if (seatData.length > 0 && seatData[0].connectedUser) {
        console.error('The scanned seat is already occupied:', scannedData);
        setOccupiedSeat(true);
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

      // Update the connectedSeats context
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
      setModalVisible(true);
    }
  };

  const startCameraScanner = () => {
    if (scannerStopped) {
      setScannerStopped(false);
      scanner.resume();
      return;
    }
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

  const stopCameraScanner = () => {
    scanner.stop().catch(console.error);
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
              <Text style={styles.modalText}>Invalid QR code format.</Text>
            )}
            {wrongBar && (
              <Text style={styles.modalText}>
                The scanned seat does not belong to the selected bar.
              </Text>
            )}
            {occupiedSeat && (
              <Text style={styles.modalText}>
                The scanned seat is already occupied.
              </Text>
            )}
            {nonExistentSeat && (
              <Text style={styles.modalText}>
                The scanned seat does not exist.
              </Text>
            )}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                if (updateSeatSuccess) {
                  stopCameraScanner();
                  navigation.navigate("User Menu");
                } else {
                  startCameraScanner();
                }
              }}
            >
              {updateSeatSuccess ? (
                <Text style={styles.modalButtonText}>Return to Menu</Text>
              ) : (
                <Text style={styles.modalButtonText}>Close</Text>
              )}
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
    fontSize: 18,
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
