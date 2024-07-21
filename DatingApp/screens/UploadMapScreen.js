import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Alert, Text, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadToBlob } from '../api';

const UploadMapScreen = () => {
  const [image, setImage] = useState(null);
  const [imagePicked, setImagePicked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingMap, setExistingMap] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const barId = 'bar_1'; // Replace with the actual bar ID
  const blobUrl = `https://datingappiotstorage.blob.core.windows.net/maps/${barId}_map.png`;

  useEffect(() => {
    fetchExistingMap();
  }, []);

  const fetchExistingMap = () => {
    const timestamp = new Date().getTime();
    setExistingMap(`${blobUrl}?t=${timestamp}`);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0].uri;
      setImage(selectedImage);
      setImagePicked(true);
    }
  };

  const handleUpload = async () => {
    if (existingMap) {
      setShowModal(true);
    } else {
      uploadImage();
    }
  };

  const uploadImage = async () => {
    try {
      setLoading(true);
      const blobName = `${barId}_map.png`;
      const url = await uploadToBlob(image, 'maps', blobName);

      Alert.alert('Map uploaded successfully', `URL: ${url}`);
      setImage(null);
      setImagePicked(false);
      fetchExistingMap();  // Update the existing map
    } catch (error) {
      console.error('Error uploading map:', error);
      Alert.alert('Error uploading map', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Bar Map</Text>
      <Text style={styles.description}>
        As a bar manager, you can upload a top-view image of your bar layout. This map will be used to create and manage seats and tables for the bar.
      </Text>
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Pick an image from camera roll</Text>
      </TouchableOpacity>
      {existingMap && (
        <View style={styles.existingMapContainer}>
          <Text style={styles.existingMapText}>Current Bar Map:</Text>
          <Image source={{ uri: existingMap }} style={styles.image} />
        </View>
      )}
      {image && (
        <>
          <Image source={{ uri: image }} style={styles.image} />
          {imagePicked && (
            <Text style={styles.confirmationText}>Image selected successfully. Press "Upload Map" to upload.</Text>
          )}
        </>
      )}
      <TouchableOpacity style={[styles.button, (!image || loading) && styles.buttonDisabled]} onPress={handleUpload} disabled={!image || loading}>
        <Text style={styles.buttonText}>Upload Map</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#007bff" style={styles.loading} />}

      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => {
          setShowModal(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>A map already exists for this bar. Do you want to replace it?</Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() => {
                setShowModal(false);
                uploadImage();
              }}
            >
              <Text style={styles.buttonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() => {
                setShowModal(false);
              }}
            >
              <Text style={styles.buttonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  button: {
    width: '80%',
    height: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginVertical: 10,
  },
  buttonDisabled: {
    backgroundColor: '#b0c4de',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  image: {
    width: 300,
    height: 200,
    marginVertical: 16,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  confirmationText: {
    color: 'green',
    fontSize: 16,
    marginBottom: 20,
  },
  loading: {
    marginTop: 20,
  },
  existingMapContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  existingMapText: {
    fontSize: 16,
    marginBottom: 10,
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
  buttonClose: {
    backgroundColor: '#2196F3',
    marginVertical: 5,
  },
});

export default UploadMapScreen;
