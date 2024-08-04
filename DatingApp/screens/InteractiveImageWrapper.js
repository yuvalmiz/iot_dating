import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Text, Button } from 'react-native';
import InteractiveImage from './InteractiveImage';
import { insertIntoTable, readFromTable } from '../api';
import { SharedStateContext } from '../context';


const InteractiveImageWrapper = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [activated, setActivated] = useState(false);
  const [toggleText, setToggleText] = useState('Activate seat creation');
  const {seats, setSeats} = useContext(SharedStateContext);
  const [prevSeat, setPrevSeat] = useState(null);

  useEffect(() => {
    const partitionKey = "bar_1";
    const fetchMap = async () => {
      try {
        const rowKeyPrefix = "map";
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

  useEffect(() => {
    const barName = 'bar_1';
    const fetchSeats = async () => {
      try {
        const queryFilter = `PartitionKey eq '${barName}' and RowKey ge 'seat_' and RowKey lt 'seat_~'`;
        const fetchedSeats = await readFromTable('BarTable', queryFilter);
        setPrevSeat(fetchedSeats);
        setSeats(fetchedSeats);
      } catch (error) {
        console.error('Error fetching seats:', error);
      }
    };
    fetchSeats();
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

  const handleUndo = () => {
    if (seats.length == prevSeat.length) {
      return;
    }
    const new_seats = seats.slice(0, seats.length - 1);
    setSeats(new_seats);
  };


  const handleConfirm = () => {
    console.log('Seats to be saved:', seats);
    seats.forEach(seat => {
      if (prevSeat.includes(seat)) {
        return;
      }
      insertIntoTable({tableName: 'BarTable', entity: seat});
    });
    setPrevSeat(seats);
    setActivated(false);
    // Implement the logic to save seats to Azure
  };

  const handleCancel = () => {
    setSeats(prevSeat);
    setActivated(false);
    setToggleText('Activate seat creation');
  };

  return (
    <View style={styles.container}>
      <Button title={toggleText} onPress={toggleTextAndActivate} />
      {loaded ? (
        <View style={styles.imageContainer}>
          <InteractiveImage
            imageUrl={imageUrl}
            activated={activated}
            barName="bar_1"
            seats={seats}
          />
        </View>
      ) : (
        <Text>Loading...</Text>
      )}
      {activated && (
        <View style={styles.buttonContainer}>
          <Button title="Confirm" onPress={handleConfirm} />
          <Button title="Undo" onPress={handleUndo} />
          <Button title="Cancel" onPress={handleCancel} />
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
  imageContainer: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: 10,
  },
});

export default InteractiveImageWrapper;
