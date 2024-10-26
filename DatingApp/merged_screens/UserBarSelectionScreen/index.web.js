import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Picker, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SharedStateContext } from '../../context';
import { readFromTable } from '../../api';

export default function UserBarSelectionScreen({ navigation }) {
  const { setSelectedBar, setSelectedBarName } = useContext(SharedStateContext);
  const [bars, setBars] = useState([]);
  const [currentBar, setCurrentBar] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBars = async () => {
      try {
        const queryFilter = `PartitionKey eq 'Bars'`;
        const barData = await readFromTable('BarTable', queryFilter);
        setBars(barData);
        setCurrentBar(barData[0]?.RowKey || ''); // Default to the first bar
      } catch (error) {
        console.error('Error fetching bars:', error);
        Alert.alert('Error', 'Failed to load bars.');
      } finally {
        setLoading(false);
      }
    };

    fetchBars();
  }, []);

  const handleSelectBar = () => {
    const selectedBar = bars.find(bar => bar.RowKey === currentBar);
    setSelectedBar(currentBar);
    setSelectedBarName(selectedBar?.BarName || currentBar); // Save bar name to context
    navigation.navigate('User Menu'); // Navigate to the User Menu screen
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading bars...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Bar</Text>
      <Text style={styles.explanation}>
        Please select the bar you are currently at from the list below.
      </Text>
      <Picker
        selectedValue={currentBar}
        style={styles.picker}
        onValueChange={(itemValue) => setCurrentBar(itemValue)}
      >
        {bars.map((bar, index) => (
          <Picker.Item label={bar.BarName} value={bar.RowKey} key={index} />
        ))}
      </Picker>
      <TouchableOpacity style={styles.selectButton} onPress={handleSelectBar}>
        <Text style={styles.selectButtonText}>Select Bar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.selectButton, { marginTop: 20 }]}  // Add a marginTop to create space
        onPress={() => navigation.navigate('ChatHistory')}
      >
        <FontAwesome name="comments" size={24} color="white" />
        <Text style={styles.selectButtonText}>Chat History</Text>
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
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  explanation: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  picker: {
    height: 50,
    width: '80%',
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 5,
    elevation: 3,
  },
  selectButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    elevation: 3,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});
