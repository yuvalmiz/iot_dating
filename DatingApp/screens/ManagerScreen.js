import React, {useContext} from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons'; 
import { SharedStateContext } from '../context';

const ManagerScreen = () => {
  const { firstName, setFirstName } = useContext(SharedStateContext);
  const { lastName, setLastName } = useContext(SharedStateContext);
  const navigation = useNavigation();

  const handleGenerateQRCode = () => {
    navigation.navigate('QRCodeGenerator');
  };

  const handleUploadMap = () => {
    navigation.navigate('UploadMap');
  };

  const handleCreateNewSeats = () => {
    navigation.navigate('InteractiveImageWrapper');
  };

  const handleViewMap = () => {
    navigation.navigate('ManagerMap', { barName: '', partitionKey: 'YourPartitionKey' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Hello, {firstName} {lastName}!</Text>
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
      {/* <TouchableOpacity style={styles.button} onPress={handleViewMap }>
        <FontAwesome name="sign-out" size={24} color="white" />
        <Text style={styles.buttonText}>ViewMap</Text>
      </TouchableOpacity> */}
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
    marginBottom: 30,
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
});

export default ManagerScreen;
