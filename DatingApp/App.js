import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import QRCodeGeneratorScreen from './screens/QRCodeGeneratorScreen';
import QRCodeScannerScreen from './screens/QRCodeScannerScreen';
import InteractiveImageWrapper from './screens/InteractiveImageWrapper';
import ManagerScreen from './screens/ManagerScreen';
import UploadMapScreen from './screens/UploadMapScreen';
import ChatScreen from './screens/ChatScreen';
import ManagerMapScreen from './screens/ManagerMapScreen';
import CreateProfileScreen from './screens/CreateProfileScreen';
import ExistingUserScreen from './screens/ExistingUserScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Manager" component={ManagerScreen} />
        <Stack.Screen name="UploadMap" component={UploadMapScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="QRCodeGenerator" component={QRCodeGeneratorScreen} />
        <Stack.Screen name="QRCodeScanner" component={QRCodeScannerScreen} />
        <Stack.Screen name="InteractiveImageWrapper" component={InteractiveImageWrapper} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="ManagerMap" component={ManagerMapScreen} />
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
        <Stack.Screen name="ExistingUser" component={ExistingUserScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
