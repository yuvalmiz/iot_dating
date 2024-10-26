import React, { useContext, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Image, Modal, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserMenuScreen from './phone_screens/UserMenuScreen'; // Update this path based on your project structure.
import ViewMapScreen from './phone_screens/ViewMapScreen';
import UserBarSelectionScreen from './phone_screens/UserBarSelectionScreen';
import ChatScreen from './phone_screens/ChatScreen';
import ChatHistoryScreen from './phone_screens/ChatHistoryScreen';
import LoginScreen from './phone_screens/LoginScreen';
import SentGiftsScreen from './phone_screens/SentGiftsScreen';
import SettingsScreen from './phone_screens/SettingsScreen';
import MenuSelectionScreen from './phone_screens/MenuSelectionScreen';
import MyQRCodeScannerScreen from './phone_screens/QRCodeScannerScreen';
import { SharedStateProvider, SharedStateContext } from './phone_screens/context'; // Update the path based on where you saved it.
import EmergencyButton from './phone_screens/EmergencyButton';
import 'react-native-url-polyfill/auto';


const Stack = createNativeStackNavigator();


function LogoutButton({ navigation }) {
  const { setEmail, setFirstName, setLastName, setSelectedBar, setManagedBars, setSelectedBarName, setConnectedSeats, setSeats } = useContext(SharedStateContext);
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    setShowModal(true);
  };

  const confirmLogout = () => {
    setShowModal(false);
    setEmail('');
    setFirstName('');
    setLastName('');
    setSelectedBar('');
    setManagedBars([]);
    setSelectedBarName('');
    setConnectedSeats({});
    setSeats([]);
    // navigation.navigate('Login');
  };

  const cancelLogout = () => {
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Image
          source={{ uri: 'https://img.icons8.com/ios-filled/50/000000/logout-rounded.png' }}
          style={styles.logoutIcon}
        />
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Are you sure you want to log out?</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.buttonYes]}
              onPress={confirmLogout}
            >
              <Text style={styles.buttonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.buttonNo]}
              onPress={cancelLogout}
            >
              <Text style={styles.buttonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function App() {
  return (
    <SharedStateProvider>
      <NavigationContainer>
      <Stack.Navigator
            initialRouteName="UserBarSelection"
            // screenOptions={({ navigation }) => ({
            screenOptions={({ navigation, route }) => ({
              headerRight: () => (
                <View style={styles.buttonRow}>
                  { route.name !== 'Manager' &&
                    route.name !== 'ManagerBarSelection' &&
                    route.name !== 'BarMapSeatManager' &&
                    route.name !== 'UploadMap'  && 
                    route.name !== 'UploadMenu' &&
                    route.name !== 'UserBarSelection' &&
                    <EmergencyButton />}
                  {navigation.canGoBack() && navigation.getState().routes[navigation.getState().index].name !== 'Login' && <LogoutButton navigation={navigation} />}
                </View>
              ),
              headerRightContainerStyle: {
                paddingRight: 20,
              },
              cardStyle: { height: '100%' },
            })}
          >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerRight: null }} />
          <Stack.Screen name="User Menu" component={UserMenuScreen} options={{ headerLeft: null }} />
          <Stack.Screen name="ViewMap" component={ViewMapScreen} options={{ title: "View Bar Map" }} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="UserBarSelection" component={UserBarSelectionScreen} options={{ title: "Select a Bar", headerLeft: null }} />
          <Stack.Screen name="ChatHistory" component={ChatHistoryScreen} options={{ title: "Chat History" }} />
          <Stack.Screen name="SentGiftsScreen" component={SentGiftsScreen} options={{ title: "Sent Gifts" }} />
          <Stack.Screen name="MenuSelectionScreen" component={MenuSelectionScreen} options={{ title: "Select Gift" }} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="QRCodeScanner" component={MyQRCodeScannerScreen} options={{ title: "Scan QR Code" }} />


        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SharedStateProvider>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyButton: {
    marginRight: 10,
    backgroundColor: 'red',
    borderRadius: 5,
    padding: 10,
  },
  emergencyText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutButton: {
    marginLeft: 10,
  },
  logoutIcon: {
    width: 24,
    height: 24,
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
