import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Button } from 'react-native';
import InteractiveImage from './InteractiveImage';
import { readFromTable } from '../api';

const InteractiveImageWrapper = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [activated, setActivated] = useState(false);
  const [toggleText, setToggleText] = useState('Activate seat creation');

  const handleSeatClick = (index) => {
    // Implement logic to show user information for the seat
    console.log(`Seat clicked: ${index}`);
  };

  useEffect(() => {
    const partitionKey = "bar_1";
    const fetchMap = async () => {
      try {
        const rowKeyPrefix = "map_";
        const queryFilter = `PartitionKey eq '${partitionKey}' and RowKey ge '${rowKeyPrefix}' and RowKey lt '${rowKeyPrefix}~'`;
        const fetchedMap = await readFromTable('BarTable', queryFilter);
        setImageUrl(fetchedMap[0].url);
        setLoaded(true);
      } catch (error) {
        console.error('Error fetching map:', error);
        setLoaded(false);
      }
    };
    fetchMap();
  }, []);

  const toggleTextAndActivate = () => {
    if (!activated) {
      setActivated(true);
      setToggleText('Deactivate seat creation');
    } else {
      setActivated(false);
      setToggleText('Activate seat creation');
    }
  };

  return (
    <View style={styles.container}>
      <Button title={toggleText} onPress={toggleTextAndActivate} />
      {loaded ? (
        <View style={styles.imageContainer}>
          <InteractiveImage
            imageUrl={imageUrl}
            onSeatClick={handleSeatClick}
            activated={activated}
            barName="bar_1" // Replace with the actual bar name
          />
        </View>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
  },
});

export default InteractiveImageWrapper;
