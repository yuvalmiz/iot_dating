import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Image, Modal, Text, Platform, LogBox } from 'react-native';
import React, { useContext, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SharedStateProvider, SharedStateContext } from './context';
import LoginScreen from './merged_screens/LoginScreen';
import MyQRCodeScannerScreen from './merged_screens/QRCodeScannerScreen';
import ChatScreen from './merged_screens/ChatScreen';
import UserMenuScreen from './merged_screens/UserMenuScreen';
import SettingsScreen from './merged_screens/SettingsScreen';
import ViewMapScreen from './merged_screens/ViewMapScreen';
import UserBarSelectionScreen from './merged_screens/UserBarSelectionScreen';
import ChatHistoryScreen from './merged_screens/ChatHistoryScreen';
import MenuSelectionScreen from './merged_screens/MenuSelectionScreen';
import SentGiftsScreen from './merged_screens/SentGiftsScreen';
import EmergencyButton from './buttons/EmergencyButton';
import QRCodeGeneratorScreen from './merged_screens/QRCodeGeneratorScreen';
import ManagerScreen from './merged_screens/ManagerScreen';
import UploadMapScreen from './merged_screens/UploadMapScreen';
import CreateProfileScreen from './merged_screens/CreateProfileScreen';
import BarMapSeatManagerScreen from './merged_screens/BarMapSeatManagerScreen';
import ManagerBarSelectionScreen from './merged_screens/ManagerBarSelectionScreen';
import UploadMenuScreen from './merged_screens/UploadMenuScreen';
import ManagerGiftsScreen from './merged_screens/ManagerGiftsScreen';

let createStackNavigator;

LogBox.ignoreLogs([
  'Warning: No client method with the name'
]);

if (Platform.OS === 'web') {
  createStackNavigator = require('@react-navigation/stack').createStackNavigator;
}

else {
  createStackNavigator =  require('@react-navigation/native-stack').createNativeStackNavigator;
  require('react-native-url-polyfill/auto');
}


const Stack = createStackNavigator();

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
    navigation.navigate('Login');
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
            initialRouteName={'Login'}
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
          <Stack.Screen name="QRCodeScanner" component={MyQRCodeScannerScreen} options={{ title: "Scan QR Code" }} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="UserBarSelection" component={UserBarSelectionScreen} options={{ title: "Select a Bar", headerLeft: null }} />
          <Stack.Screen name="User Menu" component={UserMenuScreen} options={{ headerLeft: null }} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ViewMap" component={ViewMapScreen} options={{ title: "View Bar Map" }} />
          <Stack.Screen name="ChatHistory" component={ChatHistoryScreen} options={{ title: "Chat History" }} />
          <Stack.Screen name="MenuSelectionScreen" component={MenuSelectionScreen} options={{ title: "Select Gift" }} />
          <Stack.Screen name="SentGiftsScreen" component={SentGiftsScreen} options={{ title: "Sent Gifts" }} />
          <Stack.Screen name="CreateProfile" component={CreateProfileScreen} options={{ title: "Create Profile" }} />
          {
            Platform.OS === 'web' && (
              <>
                <Stack.Screen name="ManagerGiftsScreen" component={ManagerGiftsScreen} options={{ title: "Gifts" }} />
                <Stack.Screen name="QRCodeGenerator" component={QRCodeGeneratorScreen} options={{ title: "Generate QR Codes"}} />
                <Stack.Screen name="Manager" component={ManagerScreen} />
                <Stack.Screen name="ManagerBarSelection" component={ManagerBarSelectionScreen} options={{ title: "Bar Selection", headerLeft: null }} />
                <Stack.Screen name="UploadMap" component={UploadMapScreen} options={{ title: "Upload Map" }} />
                <Stack.Screen name="UploadMenu" component={UploadMenuScreen} options={{ title: "Upload Menu" }} />
                <Stack.Screen name="BarMapSeatManager" component={BarMapSeatManagerScreen} options={{ title: "Manage Seats" }} />
              </>
            )
          }
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
