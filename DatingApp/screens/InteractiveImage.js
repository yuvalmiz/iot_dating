import React, { useState, useEffect, useContext } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableWithoutFeedback, Button } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { readFromTable } from '../api';
import { SharedStateContext } from '../context';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const InteractiveImage = ({ imageUrl, activated }) => {
  const barName = 'bar_1';
  const [imageLayout, setImageLayout] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const { seats, setSeats } = useContext(SharedStateContext);


  useEffect(() => {
    const handleDimensionChange = () => {
      setImageLayout(null);
    };
    Dimensions.addEventListener('change', handleDimensionChange);

    return () => {
      Dimensions.removeEventListener('change', handleDimensionChange);
    };
  }, []);

  const handleImageClick = (event) => {
    console.log('Image clicked event:' , event);
    if (!imageLayout) {
      console.error('Image layout not available');
      return;
    }
    const { offsetX, offsetY } = event.nativeEvent;
    const locationX = offsetX;
    const locationY = offsetY;
    let locationRelativeX, locationRelativeY;
    if (imageLayout.maxWidth > imageLayout.displayWidth) {
      const paddingX = (imageLayout.maxWidth - imageLayout.displayWidth) / 2;
      if (locationX < paddingX || locationX > paddingX + imageLayout.displayWidth) {
        console.error('Click is outside of the image bounds');
        return;
      }
      locationRelativeX = (locationX - paddingX) / imageLayout.displayWidth;
      locationRelativeY = (locationY) / imageLayout.displayHeight;
    }
    else {
      const paddingY = (imageLayout.maxHeight - imageLayout.displayHeight) / 2;
      if (locationY < paddingY || locationY > paddingY + imageLayout.displayHeight) {
        console.error('Click is outside of the image bounds');
        return;
      }
      locationRelativeX = (locationX) / imageLayout.displayWidth;
      locationRelativeY = (locationY - paddingY) / imageLayout.displayHeight
    }

    console.log('Image clicked at:', { locationX, locationY });
    console.log('Relative position:', { locationRelativeX, locationRelativeY });

    const newSeat = {
      PartitionKey: barName,
      RowKey: `seat_${seats.length + 1}`,
      x_position: locationRelativeX,
      y_position: locationRelativeY,
    };

    setSeats([...seats, newSeat]);
  };

  const onImageLayout = (event) => {
    const { x, y, width: maxWidth, height: maxHeight } = event.nativeEvent.layout;
    console.log('event.nativeEvent.layout:', event.nativeEvent.layout);
    Image.getSize(imageUrl, (naturalWidth, naturalHeight) => {
      const aspectRatio = naturalWidth / naturalHeight;

      console.log('Image natural size:', { naturalWidth, naturalHeight });
      console.log('Image aspect ratio:', aspectRatio);
      console.log('Image max size:', { maxWidth, maxHeight });
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
      console.log('Image layout set:', { displayWidth, displayHeight });
    });
  };

  const calculateSeatPosition = (seat) => {
    const paddingX = (imageLayout.maxWidth - imageLayout.displayWidth) / 2;
    const paddingY = (imageLayout.maxHeight - imageLayout.displayHeight) / 2;
    const cx = paddingX + seat.x_position * imageLayout.displayWidth;
    const cy = paddingY + seat.y_position * imageLayout.displayHeight;
    console.log('Calculated seat position:', { cx, cy });
    return { cx, cy };
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={activated ? handleImageClick : null}>
        <View style={styles.imageWrapper}>
          <Image
            class="image"
            source={{ uri: imageUrl }}
            style={styles.image}
            onLayout={onImageLayout}
          />
          {imageLayout && (
            <Svg style={[styles.svg, { width: imageLayout.maxWidth, height: imageLayout.maxHeight }]}>
              {seats && seats.map((seat, index) => {
                const { cx, cy } = calculateSeatPosition(seat);
                if (isNaN(cx) || isNaN(cy)) {
                  console.error('Calculated seat position is NaN', { seat, imageLayout });
                  return null;
                }
                return (
                  <React.Fragment key={index}>
                    <Circle
                      style={{ cursor: 'pointer', zIndex: 10 }}
                      cx={cx}
                      cy={cy}
                      r={15}
                      fill="blue"
                    />
                    <SvgText
                      x={cx}
                      y={cy}
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      dy=".3em"
                    >
                      {index + 1}
                    </SvgText>
                  </React.Fragment>
                //   <Circle
                //   style={{ cursor: 'pointer', zIndex: 10 }}
                //   key={index}
                //   cx={cx}
                //   cy={cy}
                //   r={15}
                //   fill="blue"
                // />
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
  undoContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
});

export default InteractiveImage;
