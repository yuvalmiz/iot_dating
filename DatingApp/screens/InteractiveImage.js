import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { insertIntoTable, readFromTable } from '../api';

const InteractiveImage = ({ imageUrl, onSeatClick }) => {
  const [seats, setSeats] = useState([]);
  const [image_url, setImageUrl] = useState('');
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    const partitionKey = "bar_1";
    const fetchSeats = async () => {
      try {
        // const fetchedSeats = await readFromTable('BarTable', partitionKey);
        // setSeats(fetchedSeats);
      } catch (error) {
        console.error('Error fetching seats:', error);
      }
    };
    fetchSeats();
  }, []);

  const handleImageClick = async (event) => {
    const { locationX, locationY } = event.nativeEvent;
    const newSeat = {
      PartitionKey: 'bar_1',
      RowKey: `seat_${seats.length + 1}`,
      table_id: 'default_table',
      user_id: 'default_user',
      x_position: locationX, // Ensure x_position is a number
      y_position: locationY, // Ensure y_position is a number
    };

    try {
      await insertIntoTable('BarTable', newSeat);
      setSeats([...seats, newSeat]);
    } catch (error) {
      console.error('Error saving seat data:', error);
    }
  };


  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handleImageClick}>
        <View>
          <Image source={{ uri: image_url }} style={[styles.image, { width: screenWidth, height: screenWidth * 0.75 }]} />
          <Svg style={StyleSheet.absoluteFill}>
            {seats.map((seat, index) => (
              <Circle
                key={index}
                cx={seat.x_position} // Use the double value directly
                cy={seat.y_position} // Use the double value directly
                r="10"
                fill="blue"
                onPress={() => onSeatClick(index)}
              />
            ))}
          </Svg>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'contain',
  },
});

export default InteractiveImage;