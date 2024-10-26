import React, { useState, useEffect, useContext } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableWithoutFeedback, ActivityIndicator, Modal, Text, Button, TouchableOpacity } from 'react-native';
import Svg, { G, Image as SvgImage } from 'react-native-svg';
import { readFromTable } from '../../api';
import { SharedStateContext } from '../../context';

const placeholderImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Icon-round-Question_mark.svg';

const ViewMapScreen = ({ navigation }) => {
  const { selectedBar, selectedBarName, email } = useContext(SharedStateContext);
  const [seats, setSeats] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageLayout, setImageLayout] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [seatImages, setSeatImages] = useState({});
  const [seatsLoaded, setSeatsLoaded] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [userSeat, setUserSeat] = useState(null);

  useEffect(() => {
    // Set the title of the screen to the selected bar name
    navigation.setOptions({ title: `Viewing '${selectedBarName}' Map` });
    const fetchSeats = async () => {
      try {
        const queryFilter = `PartitionKey eq '${selectedBar}' and RowKey ge 'seat_' and RowKey lt 'seat_~'`;
        const fetchedSeats = await readFromTable('BarTable', queryFilter);
        fetchedSeats.sort((a, b) => parseInt(a.RowKey.split('_')[1]) - parseInt(b.RowKey.split('_')[1]));
        setSeats(fetchedSeats);
        setSeatsLoaded(true);
      } catch (error) {
        console.error('Error fetching seats:', error);
      }
    };
    fetchSeats();
  }, [selectedBar]);

  const fetchMap = async () => {
    try {
      const mapUrl = `https://datingappiotstorage.blob.core.windows.net/maps/${selectedBar}_map.png`;
      setImageUrl(mapUrl + '?cache=' + new Date().getTime());
      Image.getSize(mapUrl, (width, height) => {
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
  }, [selectedBar]);

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
    const { width: maxWidth, height: maxHeight } = event.nativeEvent.layout;
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

  const loadSeatImages = async () => {
    const newSeatImages = {};
    for (const seat of seats) {
      if (seat.connectedUser) {
        try {
          const userQuery = `PartitionKey eq 'Users' and RowKey eq '${seat.connectedUser}'`;
          const userData = await readFromTable('BarTable', userQuery);
          if (userData.length > 0) {
            const user = userData[0];
            if (user.hasProfilePicture) {
              newSeatImages[seat.RowKey] = `https://datingappiotstorage.blob.core.windows.net/maps/${user.RowKey}.png` + '?cache=' + new Date().getTime();
            } else {
              const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
              const initialsImageUri = `https://ui-avatars.com/api/?name=${initials}&background=007bff&color=ffffff&size=128&format=svg&rounded=true` + '?cache=' + new Date().getTime();
              newSeatImages[seat.RowKey] = initialsImageUri;
            }
            if (user.RowKey == email) { // If the seat is occupied by the current user
              newSeatImages[seat.RowKey] = "https://thumbs.dreamstime.com/b/want-you-pointing-finger-icon-illustration-human-hand-index-poiting-hiring-warning-message-103309691.jpg";
              setUserSeat(seat.RowKey.split('_')[1]);
            }
          } else {
            newSeatImages[seat.RowKey] = placeholderImageUrl;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          newSeatImages[seat.RowKey] = placeholderImageUrl;
        }
      } else {
        newSeatImages[seat.RowKey] = placeholderImageUrl;
      }
    }

    setSeatImages(newSeatImages);
    setImagesLoaded(true);
  };

  useEffect(() => {
    if (seatsLoaded) {
      loadSeatImages();
    }
  }, [seatsLoaded]);

  const renderSeats = () => {
    return seats.map((seat, index) => {
      const { cx, cy } = calculateSeatPosition(seat);
      const imageUrl = seatImages[seat.RowKey] || placeholderImageUrl;

      return (
        <G
          key={index}
          onPress={() => seat.connectedUser && showUserProfile(seat.connectedUser, index)}
        >
          <SvgImage
            href={imageUrl}
            x={cx - 15}
            y={cy - 15}
            width={30}
            height={30}
            preserveAspectRatio="xMidYMid slice"
            clipPath="circle()"
          />
        </G>
      );
    });
  };

  const showUserProfile = (connectedUser, index) => {
    const userQuery = `PartitionKey eq 'Users' and RowKey eq '${connectedUser}'`;
    readFromTable('BarTable', userQuery).then(userData => {
      if (userData.length > 0) {
        setSelectedUser(userData[0]);
        setSelectedSeat(index);
        setShowModal(true);
      }
    }).catch(error => {
      console.error('Error fetching user profile:', error);
    });
  };

  const renderUserProfileImage = () => {
    if (selectedUser.hasProfilePicture) {
      return (
        <Image
          source={{ uri: `https://datingappiotstorage.blob.core.windows.net/maps/${selectedUser.RowKey}.png` + '?cache=' + new Date().getTime() }}
          style={styles.profileImage}
        />
      );
    } else {
      const initials = `${selectedUser.firstName[0]}${selectedUser.lastName[0]}`.toUpperCase();
      const initialsImageUri = `https://ui-avatars.com/api/?name=${initials}&background=007bff&color=ffffff&size=128&format=svg&rounded=true` + '?cache=' + new Date().getTime();
      return (
        <Image
          source={{ uri: initialsImageUri }}
          style={styles.profileImage}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      {loading || !seatsLoaded || !imagesLoaded ? (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading bar map...</Text>
        </View>
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
                {renderSeats()}
              </Svg>
            )}
          </View>
        </TouchableWithoutFeedback>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            {selectedUser && (
              <>
                {renderUserProfileImage()}
                <Text style={styles.modalName}>{selectedUser.firstName} {selectedUser.lastName}</Text>
                <Text style={styles.modalText}>Born on {new Date(selectedUser.birthDate).toDateString()}</Text>
                <Text style={styles.modalText}>Gender: {selectedUser.gender}</Text>
                <Text style={styles.modalText}>Bio: {selectedUser.biography}</Text>
                <Text style={styles.modalText}>Interests: {selectedUser.interests}</Text>
                <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={selectedUser.RowKey == email ? { display: 'none' } : styles.modalButton}
                  onPress={() => {
                    setShowModal(false);
                    navigation.navigate('Chat', { otherUserEmail: selectedUser.RowKey, otherUserName: `${selectedUser.firstName} ${selectedUser.lastName}` });
                  }}
                >
                  <Text style={styles.modalButtonText}>Start Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={selectedUser.RowKey == email ? { display: 'none' } : styles.modalButton}
                  onPress={() => { setShowModal(false);
                  navigation.navigate('MenuSelectionScreen', { otherUserEmail: selectedUser.RowKey, otherUserSeat: selectedSeat, userSeat: userSeat });
                }}
                >
                  <Text style={styles.modalButtonText}>Send Gift</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
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
  modalName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  modalButtonText: {
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

export default ViewMapScreen;
