import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { readFromTable } from '../api';
import { useUser } from '../context/UserContext'; // Import useUser

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const { setUser } = useUser();
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '555320982861-7a3l35eq8pdgh8k6q7glk3ukdc6cmckj.apps.googleusercontent.com',
    webClientId: '555320982861-7a3l35eq8pdgh8k6q7glk3ukdc6cmckj.apps.googleusercontent.com',
    redirectUri: makeRedirectUri({
      useProxy: true,
    }),
  });

  useEffect(() => {
    const fetchUserInfo = async (accessToken) => {
      try {
        const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const user = await response.json();
        return user.email;
      } catch (error) {
        console.error('Error fetching user info:', error);
        Alert.alert('Error', 'Failed to fetch user info.');
        return null;
      }
    };

    const checkUserExists = async (email) => {
      const queryFilter = `PartitionKey eq 'Users' and RowKey eq '${email}'`;
      const user = await readFromTable('BarTable', queryFilter);
      return user.length > 0;
    };

    if (response?.type === 'success') {
      const { authentication } = response;
      fetchUserInfo(authentication.accessToken).then((email) => {
        if (email) {
          console.log('User email:', email);
          setUser((prevUser) => ({ ...prevUser, email }));

          checkUserExists(email).then((exists) => {
            if (exists) {
              navigation.navigate('Manager');
            } else {
              navigation.navigate('CreateProfile');
            }
          });
        }
      });
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to BarMingle</Text>
      <Text style={styles.subtitle}>Please sign in to continue</Text>
      <TouchableOpacity
        style={styles.googleButton}
        disabled={!request}
        onPress={() => {
          promptAsync();
        }}
      >
        <Image
          source={{ uri: 'https://img.icons8.com/color/48/000000/google-logo.png' }}
          style={styles.googleIcon}
        />
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    elevation: 3,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});