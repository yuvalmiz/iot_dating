import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Image, Modal, Text } from 'react-native';
import React, { useContext, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SharedStateProvider, SharedStateContext } from './context'; // Import the provider
import LoginScreen from './screens/LoginScreen';
import QRCodeGeneratorScreen from './screens/QRCodeGeneratorScreen';
import QRCodeScannerScreen from './screens/QRCodeScannerScreen';
import InteractiveImageWrapper from './screens/InteractiveImageWrapper';
import ManagerScreen from './screens/ManagerScreen';
import UploadMapScreen from './screens/UploadMapScreen';
import ChatScreen from './screens/ChatScreen';
import ManagerMapScreen from './screens/ManagerMapScreen';
import CreateProfileScreen from './screens/CreateProfileScreen';
import UserMenuScreen from './screens/UserMenuScreen';
import SettingsScreen from './screens/SettingsScreen';
import ViewMapScreen from './screens/ViewMapScreen';

const Stack = createStackNavigator();

function LogoutButton({ navigation }) {
  const { setEmail } = useContext(SharedStateContext);
  const { setFirstName } = useContext(SharedStateContext);
  const { setLastName } = useContext(SharedStateContext);
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    setShowModal(true);
  };

  const confirmLogout = () => {
    setShowModal(false);
    setEmail('');
    setFirstName('');
    setLastName('');
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
          initialRouteName="Login"
          screenOptions={({ navigation }) => ({
            headerRight: () => (
              navigation.canGoBack() && navigation.getState().routes[navigation.getState().index].name !== 'Login' && <LogoutButton navigation={navigation} />
            ),
            headerRightContainerStyle: {
              paddingRight: 20,
            },
          })}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerRight: null }} />
          <Stack.Screen name="Manager" component={ManagerScreen} />
          <Stack.Screen name="UploadMap" component={UploadMapScreen} />
          <Stack.Screen name="QRCodeGenerator" component={QRCodeGeneratorScreen} />
          <Stack.Screen name="QRCodeScanner" component={QRCodeScannerScreen} />
          <Stack.Screen name="InteractiveImageWrapper" component={InteractiveImageWrapper} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="ManagerMap" component={ManagerMapScreen} />
          <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
          <Stack.Screen name="User Menu" component={UserMenuScreen} options={{ headerLeft: null }} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ViewMap" component={ViewMapScreen} />
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
  },
  logoutButton: {
    marginRight: 10,
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
