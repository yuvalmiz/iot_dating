import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Button, ScrollView, Modal } from 'react-native';
import { readFromTable, insertIntoTable, sendMessage } from '../../api';
import { SharedStateContext } from '../../context';

const MenuSelectionScreen = ({ navigation, route }) => {
  const { otherUserEmail, otherUserSeat, userSeat } = route.params;
  const { selectedBar, email } = useContext(SharedStateContext);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);  // State to control gift confirmation modal visibility
  const [seatWarningModalVisible, setSeatWarningModalVisible] = useState(false);  // State for seat warning modal

  useEffect(() => {
    if (!userSeat) {
      // If userSeat is null, show the seat warning modal
      setLoading(false);
      setSeatWarningModalVisible(true);
      return;
    }

    const fetchMenu = async () => {
      const queryFilter = `PartitionKey eq 'Menu' and RowKey eq '${selectedBar}'`;
      try {
        const menuData = await readFromTable('BarTable', queryFilter);
        if (menuData.length > 0) {
          const fetchedMenu = JSON.parse(menuData[0].Categories);
          setMenu(fetchedMenu);
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [selectedBar, userSeat]);

  const handleSendGift = async () => {
    const timestamp = new Date().toISOString();
    const senderEmail = email;
    const recipientEmail = otherUserEmail;

    const partitionKeyForRecipient = `${selectedBar};received_gifts`;
    const partitionKeyForSender = `${email};sent_gifts`;

    const giftMessage = JSON.stringify({ cart });

    try {
      const newEntryForRecipient = {
        PartitionKey: partitionKeyForRecipient,
        RowKey: timestamp,
        sender: email,
        senderSeat: userSeat,
        reciverMail: otherUserEmail,
        reciverSeat: otherUserSeat,
        Message: giftMessage,
        Price: getTotalCost(),
        status: 'pending',
        Timestamp: timestamp,
        StringTimestamp: new Date().toLocaleString(),
      };

      const newEntryForSender = {
        PartitionKey: partitionKeyForSender,
        RowKey: timestamp,
        reciverMail: otherUserEmail,
        reciverSeat: otherUserSeat,
        Price: getTotalCost(),
        Message: giftMessage,
        status: 'pending',
        Timestamp: timestamp,
        StringTimestamp: new Date().toLocaleString(),
      };

      await Promise.all([
        insertIntoTable({ tableName: 'BarTable', entity: newEntryForRecipient }),
        insertIntoTable({ tableName: 'BarTable', entity: newEntryForSender }),
      ]);
      await sendMessage({ groupName: partitionKeyForRecipient, message: JSON.stringify(newEntryForRecipient), timestamp });
      
      // Gift sent successfully, now show modal
      setModalVisible(true);
      
    } catch (error) {
      console.error('Error sending gift:', error);
    }
  };

  const closeModalAndNavigate = (destination) => {
    setModalVisible(false);
    if (destination === 'chat') {
      navigation.pop();
      navigation.navigate('Chat', { otherUserEmail: otherUserEmail });
    } else {
      navigation.goBack();  // Go back to menu
    }
  };

  const closeSeatWarningModal = () => {
    setSeatWarningModalVisible(false);
    navigation.navigate('User Menu'); // Navigate back to User Menu
  };

  const toggleCategory = (categoryName) => {
    if (expandedCategory === categoryName) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryName);
    }
  };

  const addToCart = (meal) => {
    setCart((prevCart) => [...prevCart, meal]);
  };

  const removeFromCart = (mealName) => {
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].name === mealName) {
        const newCart = [...cart];
        newCart.splice(i, 1);
        setCart(newCart);
        break;
      }
    }
  };

  const getTotalCost = () => {
    return cart.reduce((total, item) => parseFloat(total) + parseFloat(item.price), 0);
  };

  const renderMeal = (meal) => (
    <View style={styles.mealItem}>
      <Text style={styles.mealText}>{meal.name}</Text>
      <Text style={styles.mealPrice}>{meal.price}₪</Text>

      <TouchableOpacity style={styles.addButton} onPress={() => addToCart(meal)}>
        <Text style={styles.buttonText}>Add to Cart</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(meal.name)}>
        <Text style={styles.buttonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCategory = ({ item: category }) => (
    <View>
      <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCategory(category.categoryName)}>
        <Text style={styles.categoryText}>{category.categoryName}</Text>
      </TouchableOpacity>

      {expandedCategory === category.categoryName && (
        <FlatList data={category.meals} keyExtractor={(meal) => meal.name} renderItem={({ item }) => renderMeal(item)} />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <FlatList
            data={menu}
            keyExtractor={(category) => category.categoryName}
            renderItem={renderCategory}
            ListEmptyComponent={<Text>No menu items available</Text>}
          />

          <View style={styles.cartContainer}>
            <Text style={styles.cartTitle}>Cart</Text>
            <ScrollView>
              {cart.length > 0 ? (
                cart.map((item, index) => (
                  <View key={index} style={styles.cartItem}>
                    <Text style={styles.cartItemText}>{item.name}</Text>
                    <Text style={styles.cartItemPrice}>{item.price}₪</Text>
                  </View>
                ))
              ) : (
                <Text>Your cart is empty</Text>
              )}
            </ScrollView>
            <Text style={styles.totalText}>Total: {getTotalCost()}₪</Text>

            <Button title="Send Gift" onPress={handleSendGift} disabled={cart.length === 0} />
          </View>

          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Gift Sent Successfully!</Text>
                <Text style={styles.modalSubText}>What would you like to do next?</Text>

                <View style={styles.buttonGroup}>
                  <TouchableOpacity style={styles.modalButton} onPress={() => closeModalAndNavigate('chat')}>
                    <Text style={styles.buttonText}>Go to Chat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalButton} onPress={() => closeModalAndNavigate('menu')}>
                    <Text style={styles.buttonText}>Go Back to Menu</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            visible={seatWarningModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => closeSeatWarningModal()}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>You cannot order if you are not seated.</Text>
                <Text style={styles.modalSubText}>Please take a seat before ordering.</Text>

                <TouchableOpacity style={styles.modalButton} onPress={closeSeatWarningModal}>
                  <Text style={styles.buttonText}>Go to User Menu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  categoryHeader: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  categoryText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mealText: {
    fontSize: 16,
  },
  mealPrice: {
    fontSize: 16,
    color: '#888',
  },
  addButton: {
    padding: 10,
    backgroundColor: '#28a745',
    borderRadius: 5,
  },
  removeButton: {
    padding: 10,
    backgroundColor: '#dc3545',
    borderRadius: 5,
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
  },
  cartContainer: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cartItemText: {
    fontSize: 16,
  },
  cartItemPrice: {
    fontSize: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubText: {
    fontSize: 16,
    marginBottom: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    width: '40%',
    alignItems: 'center',
  },
});

export default MenuSelectionScreen;
