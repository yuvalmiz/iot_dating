import React, { useState } from 'react';
import { View, TextInput, Button, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

export default function QRCodeGeneratorScreen() {
  const [numQrCodes, setNumQrCodes] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCodes, setQrCodes] = useState([]);

  const generateRandomData = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 10;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    result += `-${Date.now()}`;
    return result;
  };

  const generateQrCodes = async () => {
    setLoading(true);
    const qrCodeUrls = [];
    for (let i = 0; i < parseInt(numQrCodes); i++) {
      const data = generateRandomData();
      try {
        const response = await fetch(`http://localhost:7071/api/GenerateQRCode?data=${encodeURIComponent(data)}`, {
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
            setQrCodes(qrCodeUrls);
            setLoading(false);
          }
        };
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }
  };

  const downloadPdf = async () => {
    const doc = new jsPDF();
    let x = 10;
    let y = 10;
    const qrSize = 50; // Size of QR code image
    const margin = 10; // Margin between QR codes

    for (let i = 0; i < qrCodes.length; i++) {
      const imgData = qrCodes[i];
      doc.addImage(imgData, 'JPEG', x, y, qrSize, qrSize);

      x += qrSize + margin;
      if (x + qrSize > doc.internal.pageSize.width) {
        x = 10;
        y += qrSize + margin;
      }
      if (y + qrSize > doc.internal.pageSize.height) {
        doc.addPage();
        x = 10;
        y = 10;
      }
    }

    const pdfBlob = doc.output('blob');
    saveAs(pdfBlob, 'QRCode.pdf');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter number of QR codes (1-20)"
        keyboardType="numeric"
        onChangeText={setNumQrCodes}
        value={numQrCodes}
        editable={!loading}
      />
      <Button title="Generate QR Codes" onPress={generateQrCodes} disabled={loading || numQrCodes < 1 || numQrCodes > 20} />
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      <View style={styles.qrContainer}>
        {qrCodes.map((qrCode, index) => (
          <Image key={index} source={{ uri: qrCode }} style={styles.qrImage} />
        ))}
      </View>
      {qrCodes.length > 0 && (
        <>
          <Button title="Download QR Codes as PDF" onPress={downloadPdf} />
        </>
      )}
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
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    width: '100%',
  },
  qrContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
  },
  qrImage: {
    margin: 10,
    width: 200,
    height: 200,
  },
});
