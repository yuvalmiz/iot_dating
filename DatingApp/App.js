import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import QRCodeGeneratorScreen from './screens/QRCodeGeneratorScreen';
import QRCodeScannerScreen from './screens/QRCodeScannerScreen';
// import InteractiveImage from './screens/InteractiveImage';
import InteractiveImageWrapper from './screens/InteractiveImageWrapper.js';

// import { insertIntoTable, readFromTable } from './api.js';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="QRCodeGenerator" component={QRCodeGeneratorScreen} />
        <Stack.Screen name="QRCodeScanner" component={QRCodeScannerScreen} />
        <Stack.Screen name="InteractiveImageWrapper" component={InteractiveImageWrapper} />
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
