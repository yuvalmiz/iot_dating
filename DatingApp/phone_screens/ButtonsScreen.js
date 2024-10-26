import React, { useContext } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SharedStateContext } from './context'; // Update the path based on where you saved it.

const ButtonsScreen = () => {
  const navigation = useNavigation();
  const { setSelectedBar } = useContext(SharedStateContext);

  const handleButtonPress = (barId) => {
    setSelectedBar(barId);
    navigation.navigate('SecondScreen');
  };

  return (
    <View style={styles.container}>
      <Button
        title="Button 1"
        onPress={() => handleButtonPress('Bar 1')}
      />
      <Button
        title="Button 2"
        onPress={() => handleButtonPress('Bar 2')}
      />
      <Button
        title="Button 3"
        onPress={() => handleButtonPress('Bar 3')}
      />
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
});

export default ButtonsScreen;
