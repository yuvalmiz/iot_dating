import React, { useState, useEffect, useContext } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import Svg, { G, Circle, Text as SvgText } from 'react-native-svg';
import { readFromTable } from '../api';
import { SharedStateContext } from '../context';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const ViewMapScreen = ({ navigation }) => {
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
        fetchedSeats.sort((a, b) => parseInt(a.RowKey.split('_')[1]) - parseInt(b.RowKey.split('_')[1]));
        setSeats(fetchedSeats);
      } catch (error) {
        console.error('Error fetching seats:', error);
      }
    };
    fetchSeats();
  }, []);

  const fetchMap = async () => {
    try {
      const rowKeyPrefix = "map";
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

  useEffect(() => {
    const handleDimensionChange = () => {
      setImageLayout(null);
    };
    Dimensions.addEventListener('change', handleDimensionChange);

    return () => {
      Dimensions.removeEventListener('change', handleDimensionChange);
    };
  }, []);

  const onImageLayout = (event) => {
    const { x, y, width: maxWidth, height: maxHeight } = event.nativeEvent.layout;
    Image.getSize(imageUrl, (naturalWidth, naturalHeight) => {
      const aspectRatio = naturalWidth / naturalHeight;
      let displayWidth, displayHeight;
      if (maxWidth / maxHeight > aspectRatio) {
        displayHeight = maxHeight;
        displayWidth = maxHeight * aspectRatio;
      } else {
        displayWidth = maxWidth;
        displayHeight = maxWidth / aspectRatio;
      }
      setImageLayout({ maxWidth, maxHeight, displayWidth, displayHeight });
      setImageDimensions({ width: naturalWidth, height: naturalHeight });
    });
  };

  const calculateSeatPosition = (seat) => {
    const paddingX = (imageLayout.maxWidth - imageLayout.displayWidth) / 2;
    const paddingY = (imageLayout.maxHeight - imageLayout.displayHeight) / 2;
    const cx = paddingX + seat.x_position * imageLayout.displayWidth;
    const cy = paddingY + seat.y_position * imageLayout.displayHeight;
    return { cx, cy };
  };

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
              <Svg style={[styles.svg, { width: imageLayout.maxWidth, height: imageLayout.maxHeight }]}>
                {seats.map((seat, index) => {
                  const { cx, cy } = calculateSeatPosition(seat);
                  return (
                    <G
                      key={index}
                      onPress={() => seat.connectedUser && navigation.navigate('Chat', { otherUserEmail: seat.connectedUser })}
                    >
                      <Circle
                        cx={cx}
                        cy={cy}
                        r={10 * imageLayout.displayWidth / imageDimensions.width}
                        fill={seat.connectedUser ? 'green' : 'red'}
                      />
                      <SvgText
                        x={cx}
                        y={cy}
                        fill="white"
                        fontSize={12 * imageLayout.displayWidth / imageDimensions.width}
                        fontWeight="bold"
                        textAnchor="middle"
                        dy=".3em"
                      >
                        {index + 1}
                      </SvgText>
                    </G>
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
