import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { SharedStateContext } from '../context';

const ManagerScreen = () => {
  const { email, selectedBarName } = useContext(SharedStateContext);
  const navigation = useNavigation();

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

  const handleUploadMenu = () => {
    navigation.navigate('UploadMenu');
  };

  const handleUserView = () => {
    navigation.navigate('User Menu');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>You are logged in as {email}</Text>
      <Text style={styles.subtitle}>You are managing the '{selectedBarName}' bar</Text>

      <TouchableOpacity style={styles.button} onPress={handleGenerateQRCode}>
        <FontAwesome name="qrcode" size={24} color="white" />
        <Text style={styles.buttonText}>Generate QR Code</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleUploadMap}>
        <FontAwesome name="upload" size={24} color="white" />
        <Text style={styles.buttonText}>Upload New Map</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleCreateNewSeats}>
        <FontAwesome name="pencil" size={24} color="white" />
        <Text style={styles.buttonText}>Modify and Create Seats</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleUploadMenu}>
        <FontAwesome name="cutlery" size={24} color="white" />
        <Text style={styles.buttonText}>Upload Menu</Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      <TouchableOpacity style={styles.switchBarButton} onPress={handleSwitchBar}>
        <FontAwesome name="random" size={20} color="white" />
        <Text style={styles.switchBarButtonText}>Manage a Different Bar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.userButton} onPress={handleUserView}>
        <FontAwesome name="users" size={20} color="white" />
        <Text style={styles.buttonText}>Switch to User View</Text>
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
    fontWeight: 'bold',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  switchBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFBA55',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: '80%',
    justifyContent: 'center',
    marginTop: 20,
  },
  switchBarButtonText: {
    color: 'white',
    fontSize: 18,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  switchBarIcon: {
    width: 24,
    height: 24,
  },
  separator: {
    height: 30,
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: '80%',
    justifyContent: 'center',
    marginTop: 20,
  },
});

export default ManagerScreen;
