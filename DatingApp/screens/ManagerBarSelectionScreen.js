import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Picker, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SharedStateContext } from '../context';
import { readFromTable } from '../api';

export default function ManagerBarSelectionScreen({ navigation }) {
  const { managedBars, setSelectedBar } = useContext(SharedStateContext);
  const [currentBar, setCurrentBar] = useState('');
  const [barNames, setBarNames] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarNames = async () => {
      try {
        const barNameMap = {};
        for (const barId of managedBars) {
          const queryFilter = `PartitionKey eq 'Bars' and RowKey eq '${barId}'`;
          const barData = await readFromTable('BarTable', queryFilter);
          if (barData.length > 0) {
            barNameMap[barId] = barData[0].BarName;
          } else {
            barNameMap[barId] = barId; // Fallback to ID if name not found
          }
        }
        setBarNames(barNameMap);
        setCurrentBar(managedBars[0]); // Default to the first bar
      } catch (error) {
        console.error('Error fetching bar names:', error);
        Alert.alert('Error', 'Failed to load bar names.');
      } finally {
        setLoading(false);
      }
    };

    fetchBarNames();
  }, [managedBars]);

  const handleManageBar = () => {
    setSelectedBar(currentBar); // Save the selected bar in the context
    navigation.navigate('Manager'); // Navigate to the Manager screen
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
      <Text style={styles.title}>Select a Bar to Manage</Text>
      <Text style={styles.explanation}>
        As a manager, please select the bar you want to manage from the list below. 
        You can always return to this screen to choose a different bar if needed.
      </Text>
      <Picker
        selectedValue={currentBar}
        style={styles.picker}
        onValueChange={(itemValue, itemIndex) => setCurrentBar(itemValue)}
      >
        {managedBars.map((barId, index) => (
          <Picker.Item label={barNames[barId]} value={barId} key={index} />
        ))}
      </Picker>
      <TouchableOpacity style={styles.manageButton} onPress={handleManageBar}>
        <Text style={styles.manageButtonText}>Manage Bar</Text>
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
  manageButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    elevation: 3,
    alignItems: 'center',
  },
  manageButtonText: {
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
