import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { SharedStateContext } from '../context';
import useSignalR from '../services/SignalRConnection';

const ManagerScreen = () => {
  const { email, selectedBarName } = useContext(SharedStateContext);
  const navigation = useNavigation();
  const [alertMessage, setAlertMessage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Initialize SignalR with groupName as "Managers"
  const { connection, joinGroup, leaveGroup } = useSignalR({
    groupName: 'Managers', // Group for managers to listen to emergency alerts
    onMessageReceived: (sender, message) => {
      // Handle the received message here
      if (message.includes('Emergency') && message.includes(selectedBarName) ) {
        setAlertMessage(message);
        setIsModalVisible(true);
      } else {
        console.log('Non-emergency message received:', message);
      }
    },
  });

  // UseEffect to join the group when the manager screen mounts and leave when it unmounts
  useEffect(() => {
    if (connection) {
      joinGroup('Managers').catch((err) =>
        console.error('Error joining Managers group:', err)
      );

      // Cleanup when the component is unmounted
      return () => {
        leaveGroup('Managers').catch((err) =>
          console.error('Error leaving Managers group:', err)
        );
        connection.stop();
      };
    }
  }, [connection]);

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setAlertMessage(null);
  };

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

  const handleManagerGifts = () => {
    navigation.navigate('ManagerGiftsScreen');
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

      <TouchableOpacity style={styles.userButton} onPress={handleManagerGifts}>
        <FontAwesome name="gift" size={20} color="white" />
        <Text style={styles.buttonText}>View Gifts</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.userButton} onPress={handleUserView}>
        <FontAwesome name="users" size={20} color="white" />
        <Text style={styles.buttonText}>Switch to User View</Text>
      </TouchableOpacity>

      {/* Emergency Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image
              source={{ uri: 'https://img.icons8.com/ios-filled/100/fa314a/alarm.png' }}
              style={styles.emergencyIcon}
            />
            <Text style={styles.modalTitle}>Emergency Alert</Text>
            <Text style={styles.modalMessage}>{alertMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleCloseModal}
            >
              <Text style={styles.confirmButtonText}>Acknowledge</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emergencyIcon: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d9534f',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalButton: {
    width: '80%',
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginVertical: 10,
  },
  confirmButton: {
    backgroundColor: '#d9534f',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ManagerScreen;
