import React, { useContext, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Modal, View } from 'react-native';
import { sendMessage } from '../../api'; // API method for SignalR
import { SharedStateContext } from '../../context';

const EmergencyButton = () => {
  const { email, firstName, lastName, selectedBarName, connectedSeats } = useContext(SharedStateContext);
  const [showModal, setShowModal] = useState(false);

  const handleEmergencyPress = () => {
    setShowModal(true); // Show the confirmation modal
  };

  const handleConfirmEmergency = async () => {
    setShowModal(false); // Hide the modal
    const emergencyMessage = `Emergency! User ${firstName} ${lastName} at ${selectedBarName} bar pressed the emergency button!`;
    await sendMessage({
      groupName: `Manager_${selectedBarName}`,
      message: emergencyMessage,
    });
    Alert.alert('Success', 'Emergency message sent to the manager.');
  };

  const handleCancel = () => {
    setShowModal(false); // Hide the modal if the user cancels
  };

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={handleEmergencyPress}>
        <Text style={styles.buttonText}>🚨 Emergency</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Are you sure you want to send an emergency alert?</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.buttonYes]}
              onPress={handleConfirmEmergency}
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
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
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
});

export default EmergencyButton;
