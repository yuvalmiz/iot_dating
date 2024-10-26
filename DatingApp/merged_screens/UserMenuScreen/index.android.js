import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { SharedStateContext } from '../../context';
import { FontAwesome } from '@expo/vector-icons';
import { insertIntoTable } from '../../api';

export default function UserMenuScreen({ navigation }) {
  const { email, firstName, lastName, selectedBar, setSelectedBar, selectedBarName, setSelectedBarName, connectedSeats, setConnectedSeats, setFirstName, setLastName, setEmail, setManagedBars } = useContext(SharedStateContext);
  const [loading, setLoading] = useState(true);
  const [showSeatChangeModal, setShowSeatChangeModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showNotConnectedModal, setShowNotConnectedModal] = useState(false);

  useEffect(() => {
    if (selectedBarName) {
      setLoading(false);
    }
  }, [selectedBarName]);

  const handleDisconnectSeat = async () => {
    const seatToFree = connectedSeats[selectedBar];

    if (seatToFree) {
      // Free the current seat in the bar
      const updatedSeat = {
        PartitionKey: selectedBar,
        RowKey: seatToFree,
        connectedUser: '',
      };
      await insertIntoTable({ tableName: 'BarTable', entity: updatedSeat, action: 'update' });

      // Remove the seat from connectedSeats in the context
      const updatedConnectedSeats = { ...connectedSeats };
      delete updatedConnectedSeats[selectedBar];
      setConnectedSeats(updatedConnectedSeats);

      // Update the connectedSeats in the user's profile in the database
      const connectedSeatsString = Object.entries(updatedConnectedSeats)
        .map(([bar, seat]) => `${bar};${seat}`)
        .join(',');
      const updatedUser = {
        PartitionKey: 'Users',
        RowKey: email,
        connectedSeats: connectedSeatsString,
      };
      await insertIntoTable({ tableName: 'BarTable', entity: updatedUser, action: 'update' });

      setShowDisconnectModal(false);
    }
  };

  const handleProceedChangeSeat = () => {
    handleDisconnectSeat();
    setShowSeatChangeModal(false);
    navigation.navigate('QRCodeScanner');
  };

  const handleCancelChangeSeat = () => {
    setShowSeatChangeModal(false);
  };

  const handleSwitchBar = () => {
    navigation.navigate('UserBarSelection');
  };

  const handleScanQRCode = () => {
    if (connectedSeats[selectedBar]) {
      setShowSeatChangeModal(true);
    } else {
      navigation.navigate('QRCodeScanner');
    }
  };

  const handleCancelDisconnect = () => {
    setShowDisconnectModal(false);
  };

  const openDisconnectModal = () => {
    if (connectedSeats[selectedBar]) {
      setShowDisconnectModal(true);
    } else {
      setShowNotConnectedModal(true);
    }
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Hello, {firstName} {lastName}!</Text>
      <Text style={styles.subtitle}>
        You are at the <Text style={{ fontStyle: 'italic', color: '#4285F4' }}>'{selectedBarName}'</Text> bar
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('ViewMap')}
      >
        <FontAwesome name="map" size={24} color="white" />
        <Text style={styles.buttonText}>View Bar Map</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('ChatHistory')}
      >
        <FontAwesome name="comments" size={24} color="white" />
        <Text style={styles.buttonText}>Chat History</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('SentGiftsScreen')}
      >
        <FontAwesome name="comments" size={24} color="white" />
        <Text style={styles.buttonText}>My Sent Gifts</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleScanQRCode}
      >
        <FontAwesome name="qrcode" size={24} color="white" />
        <Text style={styles.buttonText}>Scan QR Code</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Settings')}
      >
        <FontAwesome name="cog" size={24} color="white" />
        <Text style={styles.buttonText}>Settings</Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      <TouchableOpacity
        style={[styles.disconnectButton, { backgroundColor: '#FF4136' }]}
        onPress={openDisconnectModal}
      >
        <FontAwesome name="sign-out" size={24} color="white" />
        <Text style={styles.disconnectButtonText}>Disconnect from Seat</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchBarButton} onPress={handleSwitchBar}>
        <FontAwesome name="random" size={20} color="white" />
        <Text style={styles.switchBarButtonText}>Switch to a Different Bar</Text>
      </TouchableOpacity>

      {/* Seat Change Modal */}
      <Modal
        visible={showSeatChangeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelChangeSeat}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              You are already seated at {selectedBarName}. Do you want to change your seat?
            </Text>
            <Text style={styles.modalSubText}>
              Proceeding will disconnect you from your current seat.
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={handleProceedChangeSeat}>
                <Text style={styles.modalButtonText}>Proceed</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleCancelChangeSeat}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Disconnect Modal */}
      <Modal
        visible={showDisconnectModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelDisconnect}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Are you sure you want to disconnect from your current seat at {selectedBarName}?
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={handleDisconnectSeat}>
                <Text style={styles.modalButtonText}>Yes, Disconnect</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleCancelDisconnect}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Not Connected Modal */}
      <Modal
        visible={showNotConnectedModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotConnectedModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              You are not connected to any seat yet, so there is nothing to disconnect from.
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowNotConnectedModal(false)}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 20,
    width: '80%',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 20,
    width: '80%',
    justifyContent: 'center',
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  separator: {
    height: 30, 
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
    marginBottom: 20,
  },
  switchBarButtonText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  switchBarIcon: {
    width: 24,
    height: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
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
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 18,
    color: '#333',
  },
  modalSubText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

