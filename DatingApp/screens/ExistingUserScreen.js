import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SharedStateContext } from '../context';

export default function ExistingUserScreen({ navigation }) {
  const { email } = useContext(SharedStateContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Hello, {email}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Settings', { email })}
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
});
