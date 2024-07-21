import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { insertIntoTable, readFromTable } from '../api';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const InteractiveImage = ({ imageUrl, onSeatClick, barName, activated }) => {
  const [seats, setSeats] = useState([]);
  const [imageLayout, setImageLayout] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

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

  useEffect(() => {
    const handleDimensionChange = () => {
      setImageLayout(null); // Reset image layout to trigger recalculation
    };
    Dimensions.addEventListener('change', handleDimensionChange);

    return () => {
      Dimensions.removeEventListener('change', handleDimensionChange);
    };
  }, []);

  const handleImageClick = async (event) => {
    if (!imageLayout) {
      console.error('Image layout not available');
      return;
    }
    console.log('Image clicked:', event.nativeEvent);
    const { offsetX, offsetY } = event.nativeEvent;
    console.log('Image layout:', imageLayout);
    const locationX = offsetX;
    const locationY = offsetY;

    console.log('Clicked at:', { locationX, locationY });

    if (locationX < 0 || locationY < 0 || locationX > imageLayout.displayWidth || locationY > imageLayout.displayHeight) {
      console.error('Click is outside of the image bounds');
      return;
    }

    const newSeat = {
      PartitionKey: barName,
      RowKey: `seat_${seats.length + 1}`,
      table_id: 'default_table',
      user_id: 'default_user',
      x_position: locationX / imageLayout.displayWidth,
      y_position: locationY / imageLayout.displayHeight,
    };

    try {
      await insertIntoTable('BarTable', newSeat);
      setSeats([...seats, newSeat]); // Automatically refresh the dots
    } catch (error) {
      console.error('Error saving seat data:', error);
    }
  };

  const onImageLayout = (event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    console.log('Image layout:', { x, y, width, height, event: event.nativeEvent });

    Image.getSize(imageUrl, (naturalWidth, naturalHeight) => {
      const aspectRatio = naturalWidth / naturalHeight;
      let displayWidth, displayHeight;

      if (width / height > aspectRatio) {
        // Image is scaled to fit height
        displayHeight = height;
        displayWidth = height * aspectRatio;
      } else {
        // Image is scaled to fit width
        displayWidth = width;
        displayHeight = width / aspectRatio;
      }

      setImageLayout({ x, y, width, height, displayWidth, displayHeight });
      setImageDimensions({ width: naturalWidth, height: naturalHeight });
    });
  };

  const calculateSeatPosition = (seat, layout) => {
    return {
      cx: seat.x_position * layout.displayWidth,
      cy: seat.y_position * layout.displayHeight,
    };
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={activated ? handleImageClick : null}>
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            onLayout={onImageLayout}
          />
          {imageLayout && (
            <Svg style={[styles.svg, { width: imageLayout.width, height: imageLayout.height }]}>
              {seats.map((seat, index) => {
                const { cx, cy } = calculateSeatPosition(seat, imageLayout);
                return (
                  <Circle
                    style={{ cursor: 'pointer', zIndex: 10 }}
                    key={index}
                    cx={cx}
                    cy={cy}
                    r={0.01 * Math.min(screenWidth, screenHeight)}
                    fill="blue"
                    onPress={() => activated && onSeatClick(index)}
                  />
                );
              })}
            </Svg>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', // Ensure this container can hold absolutely positioned elements
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default InteractiveImage;
