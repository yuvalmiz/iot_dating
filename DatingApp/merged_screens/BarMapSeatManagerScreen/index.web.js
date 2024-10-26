import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Text, Button, Image, Dimensions, TouchableWithoutFeedback, Modal, TouchableOpacity } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { SharedStateContext } from '../../context';
import { insertIntoTable, readFromTable, deleteFromTable } from '../../api';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const BarMapSeatManager = ({ navigation }) => {
  const [mapImageUrl, setMapImageUrl] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [isSeatCreationActive, setIsSeatCreationActive] = useState(false);
  const [seatCreationToggleText, setSeatCreationToggleText] = useState('Activate Seat Creation');
  const [showModal, setShowModal] = useState(false);
  const { seats, setSeats, selectedBar } = useContext(SharedStateContext);
  const [prevSeat, setPrevSeat] = useState([]);
  const [imageLayout, setImageLayout] = useState(null);

  const blobUrl = `https://datingappiotstorage.blob.core.windows.net/maps/${selectedBar}_map.png`;

  useEffect(() => {
    fetchMap();
  }, []);

  const fetchMap = async () => {
    try {
      const response = await fetch(blobUrl);
      if (response.ok) {
        setMapImageUrl(`${blobUrl}?t=${new Date().getTime()}`);
        setLoaded(true);
        fetchSeats(); // Fetch existing seats after loading the map
      } else if (response.status === 404) {
        setLoaded(false);
      } else {
        console.error('Unexpected response status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching map:', error);
      setLoaded(false);
    }
  };

  const fetchSeats = async () => {
    try {
      const queryFilter = `PartitionKey eq '${selectedBar}' and RowKey ge 'seat_' and RowKey lt 'seat_~'`;
      const fetchedSeats = await readFromTable('BarTable', queryFilter);
      setPrevSeat(fetchedSeats);
      setSeats(fetchedSeats);
    } catch (error) {
      console.error('Error fetching seats:', error);
    }
  };

  const handleClearAllSeats = () => {
    setShowModal(true);
  };

  const confirmClearAllSeats = async () => {
    setShowModal(false);
    try {
      for (let seat of seats) {
        await deleteFromTable({
          tableName: 'BarTable',
          partitionKey: selectedBar,
          rowKey: seat.RowKey,
        });
        if (seat.connectedUser && seat.connectedUser !== '') {
          const userQuery = `PartitionKey eq 'Users' and RowKey eq '${seat.connectedUser}'`;
          const userData = await readFromTable('BarTable', userQuery);
          updatedConnectedSeats = userData[0].connectedSeats.split(',').filter(item => item !== `${selectedBar};${seat.RowKey}`).join(',');
          updatedUser = {
            PartitionKey: 'Users',
            RowKey: seat.connectedUser,
            connectedSeats: updatedConnectedSeats,
          }
          await insertIntoTable({ tableName: 'BarTable', entity: updatedUser, action: 'update' });
        }
      }
      setSeats([]);
      setPrevSeat([]);
    } catch (error) {
      console.error('Error clearing seats:', error);
    }
  };

  const cancelClearAllSeats = () => {
    setShowModal(false);
  };

  const toggleSeatCreation = () => {
    setIsSeatCreationActive(!isSeatCreationActive);
    setSeatCreationToggleText(isSeatCreationActive ? 'Activate Seat Creation' : 'Deactivate Seat Creation');
  };

  const handleMapLayout = (event) => {
    const { x, y, width: maxWidth, height: maxHeight } = event.nativeEvent.layout;
    Image.getSize(mapImageUrl, (naturalWidth, naturalHeight) => {
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
    });
  };

  const handleMapClick = (event) => {
    if (!imageLayout || !isSeatCreationActive) return;

    const { offsetX, offsetY } = event.nativeEvent;
    let locationRelativeX, locationRelativeY;
    if (imageLayout.maxWidth > imageLayout.displayWidth) {
      const paddingX = (imageLayout.maxWidth - imageLayout.displayWidth) / 2;
      if (offsetX < paddingX || offsetX > paddingX + imageLayout.displayWidth) return;
      locationRelativeX = (offsetX - paddingX) / imageLayout.displayWidth;
      locationRelativeY = offsetY / imageLayout.displayHeight;
    } else {
      const paddingY = (imageLayout.maxHeight - imageLayout.displayHeight) / 2;
      if (offsetY < paddingY || offsetY > paddingY + imageLayout.displayHeight) return;
      locationRelativeX = offsetX / imageLayout.displayWidth;
      locationRelativeY = (offsetY - paddingY) / imageLayout.displayHeight;
    }

    const newSeat = {
      PartitionKey: selectedBar,
      RowKey: `seat_${seats.length + 1}`,
      x_position: locationRelativeX,
      y_position: locationRelativeY,
    };
    setSeats([...seats, newSeat]);
  };

  const handleConfirm = async () => {
    for (let seat of seats) {
      if (!prevSeat.some(prev => prev.RowKey === seat.RowKey)) {
        try {
          await insertIntoTable({
            tableName: 'BarTable',
            entity: {
              PartitionKey: selectedBar,
              RowKey: seat.RowKey,
              x_position: seat.x_position,
              y_position: seat.y_position,
            },
          });
        } catch (error) {
          console.error('Error saving seat:', seat, error);
        }
      }
    }
    setPrevSeat(seats);
    setIsSeatCreationActive(false);
    setSeatCreationToggleText('Activate Seat Creation');
  };

  const handleUndo = () => {
    if (seats.length === prevSeat.length) return;
    const newSeats = seats.slice(0, seats.length - 1);
    setSeats(newSeats);
  };

  const handleCancel = () => {
    setSeats(prevSeat);
    setIsSeatCreationActive(false);
    setSeatCreationToggleText('Activate Seat Creation');
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
      {loaded ? (
        <View style={styles.mapContainer}>
          <TouchableWithoutFeedback onPress={handleMapClick}>
            <View style={styles.mapWrapper}>
              <Image
                source={{ uri: mapImageUrl }}
                style={styles.map}
                onLayout={handleMapLayout}
              />
              {imageLayout && (
                <Svg style={[styles.svg, { width: imageLayout.maxWidth, height: imageLayout.maxHeight }]}>
                  {seats && seats.map((seat, index) => {
                    const { cx, cy } = calculateSeatPosition(seat);
                    return (
                      <React.Fragment key={index}>
                        <Circle cx={cx} cy={cy} r={15} fill="blue" />
                        <SvgText x={cx} y={cy} fill="white" fontSize="12" fontWeight="bold" textAnchor="middle" dy=".3em">
                          {index + 1}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                </Svg>
              )}
            </View>
          </TouchableWithoutFeedback>
          <View style={styles.buttonRow}>
            <Button
              title={seatCreationToggleText}
              onPress={toggleSeatCreation}
              color={isSeatCreationActive ? "#5cb85c" : "#007bff"}
            />
            <Button
              title="Clear All Seats"
              onPress={handleClearAllSeats}
              color="#d9534f"
              disabled={seats.length === 0}
            />
          </View>
          {isSeatCreationActive && (
            <View style={styles.buttonContainer}>
              <Button title="Confirm" onPress={handleConfirm} color="#5cb85c" />
              <Button title="Undo" onPress={handleUndo} color="#f0ad4e" />
              <Button title="Cancel" onPress={handleCancel} color="#d9534f" />
            </View>
          )}
          <Modal
            animationType="slide"
            transparent={true}
            visible={showModal}
            onRequestClose={cancelClearAllSeats}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Are you sure you want to clear all seats? This action cannot be undone.</Text>
                <TouchableOpacity
                  style={[styles.modalButton, styles.buttonYes]}
                  onPress={confirmClearAllSeats}
                >
                  <Text style={styles.buttonText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.buttonNo]}
                  onPress={cancelClearAllSeats}
                >
                  <Text style={styles.buttonText}>No</Text>
                </TouchableOpacity>
                </View>
                </View>
            </Modal>
            </View>
        ) : (
            <View style={styles.noMapContainer}>
            <Text style={styles.noMapText}>No map currently exists for this bar.</Text>
            <Button title="Upload Map" onPress={() => navigation.navigate('UploadMap')} color="#007bff" />
            </View>
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
    mapContainer: {
        flex: 1,
        width: '100%',
    },
    mapWrapper: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    map: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    svg: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 10,
        marginTop: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 10,
        marginTop: 10,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
        width: 0,
        height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 18,
    },
    modalButton: {
        backgroundColor: '#007bff',
        borderRadius: 5,
        padding: 10,
        alignItems: 'center',
        marginVertical: 5,
        width: '80%',
    },
    buttonYes: {
        backgroundColor: '#d9534f',
    },
    buttonNo: {
        backgroundColor: '#5cb85c',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    noMapContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noMapText: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
});

export default BarMapSeatManager;