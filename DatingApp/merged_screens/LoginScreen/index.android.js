import React, { useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { readFromTable } from '../../api';
import { SharedStateContext } from '../../context';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const { firstName, setFirstName, lastName, setLastName, email, setEmail, setManagedBars, setConnectedSeats } = useContext(SharedStateContext);
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '431855682494-b42khlciqoc1pcfjt6agsqjkgnflllsj.apps.googleusercontent.com',
    expoClientId: '431855682494-pk6k7d9dsvc9l6ofr8usu2ci43veu72c.apps.googleusercontent.com',
    redirectUri: makeRedirectUri({
      native: 'com.yuvalmizrahi.DatingApp:/oauthredirect', // Use your package name here
      useProxy: false,
    }),
  });

  useEffect(() => {
    setEmail('yuvalmor24@gmail.com');
  }, []);
  useEffect(() => {
    const userProfile = async (email) => {
      const managerQuery = `PartitionKey eq 'Managers' and RowKey eq '${email}'`;
      const managerData = await readFromTable('BarTable', managerQuery);

      if (managerData.length > 0) {
        return {
          exists: true,
          isManager: true,
          firstName: managerData[0].firstName,
          lastName: managerData[0].lastName,
          managedBars: managerData[0].ManagedBars.split(','),
        };
      } else {
        const userQuery = `PartitionKey eq 'Users' and RowKey eq '${email}'`;
        const userData = await readFromTable('BarTable', userQuery);

        if (userData.length > 0) {
          const connectedSeatsString = userData[0].connectedSeats || '';
          const connectedSeatsDict = connectedSeatsString.split(',').reduce((dict, item) => {
            const [barName, seatName] = item.split(';');
            if (barName && seatName) {
              dict[barName] = seatName;
            }
            return dict;
          }, {});
          return {
            exists: true,
            isManager: false,
            firstName: userData[0].firstName,
            lastName: userData[0].lastName,
            connectedSeats: connectedSeatsDict,
          };
        } else {
          return { exists: false };
        }
      }
    };


    if (email) {
      userProfile(email).then(user => {
        if (user.exists) {
          setFirstName(user.firstName);
          setLastName(user.lastName);

          if (user.isManager) {
            setManagedBars(user.managedBars);
          }
          setConnectedSeats(user.connectedSeats || {});
          navigation.navigate('UserBarSelection');
        } else {
          navigation.navigate('CreateProfile');
        }
      });
    }
  }, [email]);

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

    if (response?.type === 'success') {
      const { authentication } = response;
      fetchUserInfo(authentication.accessToken).then(email => {
        if (email) {
          setEmail(email);
        }
      });
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={{ width: 200, height: 200, marginBottom: 30 }}
      />
      <Text style={styles.title}>Welcome to BarMingle</Text>
      <Text style={styles.subtitle}>Please sign in to continue</Text>
      <TouchableOpacity
        style={styles.googleButton}
        disabled={!request}
        onPress={() => promptAsync()}
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
