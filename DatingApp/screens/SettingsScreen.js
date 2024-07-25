import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadToBlob, readFromTable, insertIntoTable } from '../api';
import { SharedStateContext } from '../context';

export default function SettingsScreen({ navigation }) {
  const [profileData, setProfileData] = useState({});
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { email } = useContext(SharedStateContext);

  useEffect(() => {
    const fetchProfileData = async () => {
      const queryFilter = `PartitionKey eq 'Users' and RowKey eq '${email}'`;
      const userData = await readFromTable('BarTable', queryFilter);
      if (userData.length > 0) {
        setProfileData(userData[0]);
        setImage(userData[0].profilePictureUrl);
      }
    };

    fetchProfileData();
  }, [email]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0].uri;
      setImage(selectedImage);
    }
  };

  const handleSave = async () => {
    if (!profileData.fullName || !profileData.gender || !profileData.birthdate) {
      Alert.alert('Error', 'Please fill all mandatory fields.');
      return;
    }

    setLoading(true);
    let profilePictureUrl = image;
    if (image && !image.startsWith('http')) {
      profilePictureUrl = await uploadToBlob(image, 'profile-pictures', `${email}.png`);
    }

    const updatedProfile = {
      PartitionKey: 'Users',
      RowKey: email,
      ...profileData,
      profilePictureUrl,
    };

    await insertIntoTable('BarTable', updatedProfile);
    Alert.alert('Success', 'Profile updated successfully.');
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Text>Pick a profile picture</Text>
        )}
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Full Name*"
        value={profileData.fullName}
        onChangeText={(text) => setProfileData({ ...profileData, fullName: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Biography"
        value={profileData.biography}
        onChangeText={(text) => setProfileData({ ...profileData, biography: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Interests"
        value={profileData.interests}
        onChangeText={(text) => setProfileData({ ...profileData, interests: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Gender*"
        value={profileData.gender}
        onChangeText={(text) => setProfileData({ ...profileData, gender: text })}
      />
      <TouchableOpacity style={styles.datePicker} onPress={() => setShowDatePicker(true)}>
        <Text>{profileData.birthdate ? profileData.birthdate : 'Pick your birthdate*'}</Text>
      </TouchableOpacity>
      <Button title="Save Profile" onPress={handleSave} disabled={loading} />
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  imagePicker: {
    width: 100,
    height: 100,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  datePicker: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 12,
    paddingHorizontal: 8,
    width: '100%',
    backgroundColor: '#fff',
  },
});
