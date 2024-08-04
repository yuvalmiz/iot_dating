import React, { useState, useEffect, useRef } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { readFromTable, insertIntoTable } from '../api';

const ManagerMapScreen = ({ route }) => {
  const barName = 'bar_1'; // Replace with the actual bar name
  const [imageUrl, setImageUrl] = useState('');
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageAspectRatio, setImageAspectRatio] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const queryFilter = `PartitionKey eq '${barName}' and RowKey ge 'seat_' and RowKey lt 'seat_~'`;
        const fetchedSeats = await readFromTable('BarTable', queryFilter);
        setSeats(fetchedSeats);
      } catch (error) {
        console.error('Error fetching seats:', error);
      }
    };
    fetchSeats();
  }, [barName]);

  const fetchMap = async () => {
    try {
      const rowKeyPrefix = "map";
      const queryFilter = `PartitionKey eq '${barName}' and RowKey ge '${rowKeyPrefix}' and RowKey lt '${rowKeyPrefix}~'`;
      const fetchedMap = await readFromTable('BarTable', queryFilter);
      setImageUrl(fetchedMap[0].url);
      Image.getSize(fetchedMap[0].url, (width, height) => {
        setImageAspectRatio(width / height);
        setLoading(false);
      }, () => setLoading(false));
    } catch (error) {
      console.error('Error fetching map:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMap();
  }, []);

  const handleAddSeat = async (event) => {
    const { locationX, locationY } = event.nativeEvent;
    const relativeX = locationX / containerWidth;
    const relativeY = locationY / containerHeight;
    const seat = {
      PartitionKey: barName,
      RowKey: `seat_${Date.now()}`,
      x: relativeX,
      y: relativeY,
    };

    try {
      await insertIntoTable({tableName :'BarTable',entity: seat});
      setSeats([...seats, seat]);
    } catch (error) {
      console.error('Error adding seat:', error);
    }
  };

  const handleContainerLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerWidth(width);
    setContainerHeight(height);
  };

  const getSeatStyle = (seat) => ({
    position: 'absolute',
    top: seat.y * containerHeight,
    left: seat.x * containerWidth,
    width: 20,
    height: 20,
    backgroundColor: 'red',
    borderRadius: 10,
  });

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View style={[styles.mapContainer, { aspectRatio: imageAspectRatio }]}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.map}
            resizeMode="contain"
          />
          <View style={styles.overlay} onStartShouldSetResponder={() => true} onResponderRelease={handleAddSeat}>
            {seats.map((seat) => (
              <View
                key={seat.RowKey}
                style={getSeatStyle(seat)}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  mapContainer: {
    width: '100%',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default ManagerMapScreen;
