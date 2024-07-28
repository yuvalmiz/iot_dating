import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { readFromTable } from '../api';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const ViewMapScreen = ({ navigation }) => {
  const handleMessageReceived = (user, message) => {
    console.log('New message received:', user, message);
  };
  const [seats, setSeats] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageLayout, setImageLayout] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const queryFilter = `PartitionKey eq 'bar_1' and RowKey ge 'seat_' and RowKey lt 'seat_~'`;
        const fetchedSeats = await readFromTable('BarTable', queryFilter);
        setSeats(fetchedSeats);
      } catch (error) {
        console.error('Error fetching seats:', error);
      }
    };
    fetchSeats();
  }, []);

  const fetchMap = async () => {
    try {
      const rowKeyPrefix = "map_";
      const queryFilter = `PartitionKey eq 'bar_1' and RowKey ge '${rowKeyPrefix}' and RowKey lt '${rowKeyPrefix}~'`;
      const fetchedMap = await readFromTable('BarTable', queryFilter);
      setImageUrl(fetchedMap[0].url);
      Image.getSize(fetchedMap[0].url, (width, height) => {
        setImageDimensions({ width, height });
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

  const onImageLayout = (event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    const aspectRatio = imageDimensions.width / imageDimensions.height;
    let displayWidth, displayHeight;

    if (width / height > aspectRatio) {
      displayHeight = height;
      displayWidth = height * aspectRatio;
    } else {
      displayWidth = width;
      displayHeight = width / aspectRatio;
    }

    setImageLayout({ x, y, width, height, displayWidth, displayHeight });
  };

  const calculateSeatPosition = (seat, layout) => ({
    cx: seat.x * layout.displayWidth,
    cy: seat.y * layout.displayHeight,
  });

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <TouchableWithoutFeedback>
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
                      key={index}
                      cx={cx}
                      cy={cy}
                      r={0.01 * Math.min(screenWidth, screenHeight)}
                      fill={seat.connectedUser ? 'green' : 'red'}
                      onPress={() => seat.connectedUser && navigation.navigate('Chat', { otherUserEmail: seat.connectedUser })}
                    />
                  );
                })}
              </Svg>
            )}
          </View>
        </TouchableWithoutFeedback>
      )}
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
    position: 'relative',
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

export default ViewMapScreen;
