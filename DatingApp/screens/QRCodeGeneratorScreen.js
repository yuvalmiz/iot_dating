import React, { useState, useContext } from 'react';
import { View, TextInput, Button, StyleSheet, ActivityIndicator, ScrollView, Text, Modal, TouchableOpacity } from 'react-native';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { sendPdfViaEmail } from '../api';
import variables from '../services/staticVariables'; 
import { SharedStateContext } from '../context';

export default function QRCodeGeneratorScreen() {
  const [numQrCodes, setNumQrCodes] = useState('');
  const [qrSize, setQrSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const { local } = variables().local;
  const { email } = useContext(SharedStateContext);
  // const generateRandomData = () => {
  //   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  //   let result = '';
  //   const length = 10;
  //   for (let i = 0; i < length; i++) {
  //     result += characters.charAt(Math.floor(Math.random() * characters.length));
  //   }
  //   result += `-${Date.now()}`;
  //   return result;
  // };

  const generateDataForQRCode = (seatNumber) => {
    const barId = "bar_1"
    const result = barId + ";seat_" + seatNumber;
    return result;
  }

  const validateInputs = () => {
    const numQrCodesInt = parseInt(numQrCodes);
    const qrSizeFloat = parseFloat(qrSize);

    if (isNaN(numQrCodesInt) || numQrCodesInt < 1 || numQrCodesInt > 100) {
      setModalMessage('Invalid input: Number of QR codes must be a number between 1 and 100.');
      setShowModal(true);
      return false;
    }

    if (isNaN(qrSizeFloat) || qrSizeFloat <= 0) {
      setModalMessage('Invalid input: QR code size must be a positive number.');
      setShowModal(true);
      return false;
    }

    return true;
  };

  const generateQrCodes = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    const qrCodeUrls = [];
    for (let i = 0; i < parseInt(numQrCodes); i++) {
      // const data = generateRandomData();
      const data = generateDataForQRCode(i + 1);
      try {
        url = local ? 'http://localhost:7071/api/GenerateQRCode' : 'https://functionappdatingiot.azurewebsites.net/api/GenerateQRCode';
        const response = await fetch(`${url}?data=${encodeURIComponent(data)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          qrCodeUrls.push(reader.result);
          if (qrCodeUrls.length === parseInt(numQrCodes)) {
            createPdf(qrCodeUrls);
            setLoading(false);
          }
        };
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }
  };

  const createPdf = async (qrCodeUrls) => {
    const doc = new jsPDF();
    let x = 10;
    let y = 10;
    const qrSizeCm = parseFloat(qrSize); // Convert size to cm
    const qrSizePx = qrSizeCm * 10; // Convert cm to mm for jsPDF
    const margin = 10; // Margin between QR codes
  
    for (let i = 0; i < qrCodeUrls.length; i++) {
      const imgData = qrCodeUrls[i];
  
      // Add seat title above the QR code
      doc.text(`Seat ${i + 1}`, x + qrSizePx / 2, y - 3, { align: 'center' });
  
      // Add the QR code
      doc.addImage(imgData, 'JPEG', x, y, qrSizePx, qrSizePx);
  
      x += qrSizePx + margin;
      if (x + qrSizePx > doc.internal.pageSize.width) {
        x = 10;
        y += qrSizePx + margin + 10; // Adjust to account for the title height
      }
      if (y + qrSizePx > doc.internal.pageSize.height) {
        doc.addPage();
        x = 10;
        y = 10;
      }
    }
  
    const pdfBlob = new Blob([doc.output('blob')], { type: 'application/pdf' });
    saveAs(pdfBlob, 'QRCode.pdf');
    setPdfBlob(pdfBlob);
  };
  

  const sendPdfViaEmailHandler = async () => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1];

        const response = await sendPdfViaEmail(base64data, email);
        setModalMessage('PDF sent via email successfully to ' + email);
        setShowModal(true);
      };
    } catch (error) {
      console.error('Error sending PDF via email:', error);
      setModalMessage('Error: Failed to send PDF via email.');
      setShowModal(true);
    }
  };

  const handleNumQrCodesChange = (text) => {
    if (/^\d*$/.test(text)) {
      setNumQrCodes(text);
    }
  };

  const handleQrSizeChange = (text) => {
    if (/^\d*\.?\d*$/.test(text)) {
      setQrSize(text);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>QR Code Generator</Text>
      <Text style={styles.description}>
        Enter the number of QR codes you want to generate (up to 100). Choose the size of the QR codes in cm.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Enter number of QR codes (1-100)"
        keyboardType="numeric"
        onChangeText={handleNumQrCodesChange}
        value={numQrCodes}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter QR code size in cm"
        keyboardType="numeric"
        onChangeText={handleQrSizeChange}
        value={qrSize}
        editable={!loading}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, (loading || !numQrCodes || !qrSize || isNaN(numQrCodes) || isNaN(qrSize) || numQrCodes < 1 || numQrCodes > 100 || qrSize <= 0) && styles.buttonDisabled]}
          onPress={generateQrCodes}
          disabled={loading || !numQrCodes || !qrSize || isNaN(numQrCodes) || isNaN(qrSize) || numQrCodes < 1 || numQrCodes > 100 || qrSize <= 0}
        >
          <Text style={styles.buttonText}>Create PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, (loading || !pdfBlob) && styles.buttonDisabled]}
          onPress={sendPdfViaEmailHandler}
          disabled={loading || !pdfBlob}
        >
          <Text style={styles.buttonText}>Send PDF via Email</Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />}

      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.buttonClose]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  button: {
    width: '45%',
    height: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonDisabled: {
    backgroundColor: '#b0c4de',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loading: {
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
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
  },
  modalButton: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
    marginVertical: 5,
  },
});
