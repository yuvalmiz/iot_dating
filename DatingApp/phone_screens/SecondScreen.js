import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SharedStateContext } from './context'; // Update the path based on where you saved it.

const SecondScreen = () => {
  const { selectedBar } = useContext(SharedStateContext);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Selected Bar: {selectedBar}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 24,
    color: '#333',
  },
});

export default SecondScreen;
