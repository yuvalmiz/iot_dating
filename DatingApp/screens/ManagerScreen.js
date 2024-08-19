import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons'; 
import { SharedStateContext } from '../context';
import { readFromTable } from '../api';

const ManagerScreen = () => {
  const { email, selectedBar } = useContext(SharedStateContext);
  const [barName, setBarName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchBarName = async () => {
      try {
        const queryFilter = `PartitionKey eq 'Bars' and RowKey eq '${selectedBar}'`;
        const barData = await readFromTable('BarTable', queryFilter);
        if (barData.length > 0) {
          setBarName(barData[0].BarName);
        } else {
          setBarName(selectedBar); // Fallback to ID if name not found
        }
      } catch (error) {
        console.error('Error fetching bar name:', error);
        Alert.alert('Error', 'Failed to load bar name.');
      } finally {
        setLoading(false);
      }
    };

    fetchBarName();
  }, [selectedBar]);

  const handleSwitchBar = () => {
    navigation.navigate('ManagerBarSelection'); // Navigate back to bar selection
  };

  const handleGenerateQRCode = () => {
    navigation.navigate('QRCodeGenerator');
  };

  const handleUploadMap = () => {
    navigation.navigate('UploadMap');
  };

  const handleCreateNewSeats = () => {
    navigation.navigate('BarMapSeatManager');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading bar details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>You are logged in as {email}</Text>
      <Text style={styles.subtitle}>You are managing the '{barName}' bar</Text>

      <TouchableOpacity style={styles.button} onPress={handleGenerateQRCode}>
        <FontAwesome name="qrcode" size={24} color="white" />
        <Text style={styles.buttonText}>Generate QR Code</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleUploadMap}>
        <FontAwesome name="upload" size={24} color="white" />
        <Text style={styles.buttonText}>Upload New Map</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleCreateNewSeats}>
        <FontAwesome name="plus" size={24} color="white" />
        <Text style={styles.buttonText}>Create New Seats</Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      <TouchableOpacity style={styles.switchBarButton} onPress={handleSwitchBar}>
        <Image
          source={{ uri: 'https://img.icons8.com/ios-filled/50/000000/swap.png' }} // Example image
          style={styles.switchBarIcon}
        />
        <Text style={styles.switchBarButtonText}>Manage a Different Bar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 8,
    width: '80%',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    marginLeft: 10,
  },
  switchBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffcc00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: '80%',
    justifyContent: 'center',
    marginTop: 20, // Adds space above the button
  },
  switchBarButtonText: {
    color: '#333',
    fontSize: 18,
    marginLeft: 10,
    fontWeight: 'normal', // Make the font weight normal
  },
  switchBarIcon: {
    width: 24,
    height: 24,
  },
  separator: {
    height: 30, // Adds vertical space between the main buttons and the "Manage a Different Bar" button
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default ManagerScreen;
