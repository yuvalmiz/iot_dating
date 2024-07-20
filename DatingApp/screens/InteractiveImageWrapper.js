import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import InteractiveImage from './InteractiveImage';
import { readFromTable } from '../api';


const InteractiveImageWrapper = () => {
  const handleSeatClick = (index) => {
    // Implement logic to show user information for the seat
    console.log(`Seat clicked: ${index}`);
  };
  const [image_url, setImageUrl] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
    const partitionKey = "bar_1";
    const fetchMap = async () => {
      try {
        const rowKeyPrefix = "map_";
        const queryFilter = `PartitionKey eq '${partitionKey}' and RowKey ge '${rowKeyPrefix}'`;
        const fetchedMap = await readFromTable('BarTable', queryFilter);
        setImageUrl(fetchedMap[0].url);
      } catch (error) {
        console.error('Error fetching map:', error);
      }
    };
    fetchMap();
    setLoaded(false);
  }, []);

  return (
    <View style={styles.container}>
      <InteractiveImage
        disabled={!loaded}
        imageUrl={image_url}
        onSeatClick={handleSeatClick}
        barName="bar_1" // Replace with the actual bar name
      />
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
});

export default InteractiveImageWrapper;