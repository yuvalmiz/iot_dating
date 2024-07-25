import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, TouchableOpacity, Image, Picker } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { insertIntoTable, uploadToBlob } from '../api';

export default function CreateProfileScreen({ navigation, route }) {
  const email = route.params.email;
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [gender, setGender] = useState('');
  const [biography, setBiography] = useState('');
  const [interests, setInterests] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    console.log(email);
    if (!fullName || !birthDate || !gender) {
      Alert.alert('Error', 'Please fill all the mandatory fields.');
      return;
    }

    setLoading(true);
    let profilePictureUrl = null;

    if (profilePicture) {
      try {
        profilePictureUrl = await uploadToBlob(profilePicture, 'maps', `${email}.png`);
      } catch (error) {
        Alert.alert('Error', 'Failed to upload profile picture.');
        setLoading(false);
        return;
      }
    }

    const userProfile = {
      PartitionKey: 'Users',
      RowKey: email,
      fullName,
      birthDate: birthDate.toISOString(),
      gender,
      biography,
      interests,
      profilePictureUrl,
    };

    try {
      await insertIntoTable('BarTable', userProfile);
      navigation.navigate('Manager');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Profile</Text>
      <Text style={styles.label}>Full Name <Text style={styles.mandatory}>*</Text></Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your full name"
        value={fullName}
        onChangeText={setFullName}
      />
      <Text style={styles.label}>Birthdate <Text style={styles.mandatory}>*</Text></Text>
      <View style={styles.datePickerContainer}>
        <DatePicker
          selected={birthDate}
          onChange={(date) => setBirthDate(date)}
          className="datePicker"
        />
      </View>
      <Text style={styles.label}>Gender <Text style={styles.mandatory}>*</Text></Text>
      <Picker
        selectedValue={gender}
        style={styles.picker}
        onValueChange={(itemValue) => setGender(itemValue)}
      >
        <Picker.Item label="Select your gender" value="" />
        <Picker.Item label="Male" value="Male" />
        <Picker.Item label="Female" value="Female" />
        <Picker.Item label="Other" value="Other" />
      </Picker>
      <Text style={styles.label}>Biography</Text>
      <TextInput
        style={styles.input}
        placeholder="Tell us about yourself"
        value={biography}
        onChangeText={setBiography}
      />
      <Text style={styles.label}>Interests</Text>
      <TextInput
        style={styles.input}
        placeholder="What are your interests?"
        value={interests}
        onChangeText={setInterests}
      />
      <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
        <Text style={styles.imagePickerButtonText}>Pick Profile Picture 📸</Text>
      </TouchableOpacity>
      {profilePicture && (
        <Image source={{ uri: profilePicture }} style={styles.profileImage} />
      )}
      <TouchableOpacity
        style={[styles.saveButton, (!fullName || !birthDate || !gender || loading) && styles.disabledButton]}
        onPress={handleSaveProfile}
        disabled={!fullName || !birthDate || !gender || loading}
      >
        <Text style={styles.saveButtonText}>Save Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  mandatory: {
    color: 'red',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  datePickerContainer: {
    marginBottom: 12,
    width: '100%',
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 12,
  },
  imagePickerButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePickerButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
});

