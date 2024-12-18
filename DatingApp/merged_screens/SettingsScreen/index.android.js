import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { uploadToBlob, readFromTable, insertIntoTable } from '../../api';
import { SharedStateContext } from '../../context';

export default function SettingsScreen({ navigation }) {
  const [profileData, setProfileData] = useState({});
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingUserDetails, setLoadingUserDetails] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { email, setFirstName, setLastName } = useContext(SharedStateContext);
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      const queryFilter = `PartitionKey eq 'Users' and RowKey eq '${email}'`;
      const userData = await readFromTable('BarTable', queryFilter);
      if (userData.length > 0) {
        setProfileData(userData[0]);
        if (userData[0].hasProfilePicture) {
          setImage('https://datingappiotstorage.blob.core.windows.net/maps/' + email + '.png' + '?v=' + new Date().getTime());
        }
        setBirthDate(new Date(userData[0].birthDate));
      }
    };

    setLoadingUserDetails(true);
    fetchProfileData();
    setTimeout(() => setLoadingUserDetails(false), 500);
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
    if (!profileData.firstName || !profileData.lastName || !profileData.gender || !birthDate) {
      Alert.alert('Error', 'Please fill all mandatory fields.');
      return;
    }

    setLoading(true);
    let profilePictureUrl = image;
    if (image && !image.startsWith('http')) {
      profilePictureUrl = await uploadToBlob(image, 'maps', `${email}.png`);
    }

    const updatedProfile = {
      PartitionKey: 'Users',
      RowKey: email,
      ...profileData,
      birthDate: birthDate.toISOString().split('T')[0],
      hasProfilePicture: !!profilePictureUrl,
    };

    await insertIntoTable({ tableName: 'BarTable', entity: updatedProfile, action: 'update' });

    const uniqueUrl = profilePictureUrl + '?v=' + new Date().getTime();
    setImage(uniqueUrl);

    setFirstName(profileData.firstName);
    setLastName(profileData.lastName);
    setLoading(false);
    setShowModal(true);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  if (loadingUserDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading user details...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
      <Text style={styles.subTitle}>You are editing the profile of the user with the email: {email}</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Text style={styles.imagePickerText}>Pick Profile Picture</Text>
        )}
      </TouchableOpacity>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>First Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your first name"
          value={profileData.firstName}
          onChangeText={(text) => setProfileData({ ...profileData, firstName: text })}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Last Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your last name"
          value={profileData.lastName}
          onChangeText={(text) => setProfileData({ ...profileData, lastName: text })}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Biography:</Text>
        <TextInput
          style={styles.input}
          placeholder="Tell us about yourself"
          value={profileData.biography}
          onChangeText={(text) => setProfileData({ ...profileData, biography: text })}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Interests:</Text>
        <TextInput
          style={styles.input}
          placeholder="What are your interests?"
          value={profileData.interests}
          onChangeText={(text) => setProfileData({ ...profileData, interests: text })}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Gender:</Text>
        <Picker
          selectedValue={profileData.gender}
          style={styles.input}
          onValueChange={(itemValue) => setProfileData({ ...profileData, gender: itemValue })}
        >
          <Picker.Item label="Select Gender*" value="" style={styles.pickerItem}/>
          <Picker.Item label="Male" value="Male" style={styles.pickerItem}/>
          <Picker.Item label="Female" value="Female" style={styles.pickerItem}/>
          <Picker.Item label="Other" value="Other" style={styles.pickerItem}/>
        </Picker>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Birthdate:</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
          <Text style={styles.datePickerText}>{birthDate.toDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={birthDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onDateChange}
          />
        )}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.disabledButton]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>Save Profile</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Profile saved successfully!</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowModal(false);
                  navigation.navigate('User Menu');
                }}
              >
                <Text style={styles.modalButtonText}>Go to User Menu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555',
    textAlign: 'center',
  },
  fieldContainer: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: '#fff',
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
    backgroundColor: '#e0e0e0',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  imagePickerText: {
    textAlign: 'center',
    color: '#666',
  },
  datePickerButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 5,
  },
  datePickerText: {
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#aaa',
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickerItem: {
    fontSize: 10,
  },
});
