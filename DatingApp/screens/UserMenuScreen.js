import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, BackHandler } from 'react-native';
import { SharedStateContext } from '../context';
import { useFocusEffect } from '@react-navigation/native';

export default function UserMenuScreen({ navigation }) {
  const { email, setEmail } = useContext(SharedStateContext);
  const [showBackModal, setShowBackModal] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        setShowBackModal(true);
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  const handleLogout = () => {
    setEmail('');
    setShowBackModal(false);
    navigation.navigate('Login');
  };

  const handleCancel = () => {
    setShowBackModal(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Hello, {email}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('ViewMap', { email })}
      >
        <Image
          source={{ uri: 'https://img.icons8.com/ios-filled/50/000000/settings.png' }}
          style={styles.icon}
        />
        <Text style={styles.buttonText}>Go to Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('QRCodeScanner', { email })}
      >
        <Image
          source={{ uri: 'https://img.icons8.com/ios-filled/50/000000/qr-code.png' }}
          style={styles.icon}
        />
        <Text style={styles.buttonText}>Scan QR Code</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('ManagerMap', { email })}
      >
        <Image
          source={{ uri: 'https://img.icons8.com/ios-filled/50/000000/map.png' }}
          style={styles.icon}
        />
        <Text style={styles.buttonText}>View Bar Map</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showBackModal}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Are you sure you want to log out?</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.buttonYes]}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.buttonNo]}
              onPress={handleCancel}
            >
              <Text style={styles.buttonText}>No</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
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
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 20,
    width: '80%',
    justifyContent: 'center',
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  logoutButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#d9534f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    width: '80%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginVertical: 10,
  },
  buttonYes: {
    backgroundColor: '#007bff',
  },
  buttonNo: {
    backgroundColor: '#d9534f',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
