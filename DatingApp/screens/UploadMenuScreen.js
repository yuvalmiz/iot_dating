// UploadMenuScreen.js
import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { SharedStateContext } from '../context';
import { insertIntoTable, readFromTable } from '../api';

const UploadMenuScreen = ({ navigation }) => {
  const { selectedBar, setSelectedBar } = useContext(SharedStateContext);
  const [menuCategories, setMenuCategories] = useState([]);
  const [firstLoad, setFirstLoad] = useState(true);

  const handleCategoryChange = (index, value) => {
    const updatedCategories = [...menuCategories];
    updatedCategories[index].categoryName = value;
    setMenuCategories(updatedCategories);
  };

  const handleMealChange = (categoryIndex, mealIndex, field, value) => {
    const updatedCategories = [...menuCategories];
    updatedCategories[categoryIndex].meals[mealIndex][field] = value;
    setMenuCategories(updatedCategories);
  };

  const addCategory = () => {
    setMenuCategories([...menuCategories, { categoryName: '', meals: [{ name: '', price: '' }] }]);
  };

  const addMeal = (categoryIndex) => {
    const updatedCategories = [...menuCategories];
    updatedCategories[categoryIndex].meals.push({ name: '', price: '' });
    setMenuCategories(updatedCategories);
  };

  const deleteCategory = (index) => {
    const updatedCategories = menuCategories.filter((_, catIndex) => catIndex !== index);
    setMenuCategories(updatedCategories);
  };

  const deleteMeal = (categoryIndex, mealIndex) => {
    const updatedCategories = [...menuCategories];
    updatedCategories[categoryIndex].meals = updatedCategories[categoryIndex].meals.filter((_, mIndex) => mIndex !== mealIndex);
    setMenuCategories(updatedCategories);
  };

  const handleSaveMenu = async () => {
    const categoryNames = menuCategories.map(cat => cat.categoryName.trim().toLowerCase());
    const hasDuplicates = new Set(categoryNames).size !== categoryNames.length;

    if (hasDuplicates) {
      console.error('Duplicate category names are not allowed');
      return;
    }

    if (!selectedBar) {
      console.error('No bar selected');
      return;
    }

    const entity = {
      PartitionKey: 'Menu',
      RowKey: selectedBar,
      Categories: JSON.stringify(menuCategories)
    };

    try {
      var action = 'create';
      if (!firstLoad) {
        action = 'update';
      }
      await insertIntoTable({ tableName: 'BarTable', entity, action });
      navigation.goBack();
    } catch (error) {
    }
  };

  const handleFetchMenu = async () => {
    const queryFilter = `PartitionKey eq 'Menu' and RowKey eq '${selectedBar}'`;
    try {
      const menuData = await readFromTable('BarTable', queryFilter);
      if (menuData.length > 0) {
        setFirstLoad(false);
        const fetchedMenu = JSON.parse(menuData[0].Categories);
        setMenuCategories(fetchedMenu);
      }
    } catch (error) {
        console.error('Error fetching menu:', error);
    }
  };

  useEffect(() => {
    if (selectedBar) {
        handleFetchMenu();
    }
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Upload Menu</Text>

      {menuCategories.map((category, categoryIndex) => (
        <View key={categoryIndex} style={styles.categoryContainer}>
          <TextInput
            style={styles.categoryInput}
            placeholder="Category Name"
            value={category.categoryName}
            onChangeText={(text) => handleCategoryChange(categoryIndex, text)}
          />
          {category.meals.map((meal, mealIndex) => (
            <View key={mealIndex} style={styles.mealContainer}>
              <TextInput
                style={styles.mealInput}
                placeholder="Meal Name"
                value={meal.name}
                onChangeText={(text) => handleMealChange(categoryIndex, mealIndex, 'name', text)}
              />
              <TextInput
                style={styles.priceInput}
                placeholder="Price"
                value={meal.price}
                onChangeText={(text) => handleMealChange(categoryIndex, mealIndex, 'price', text)}
                keyboardType="numeric"
              />
              <TouchableOpacity onPress={() => deleteMeal(categoryIndex, mealIndex)}>
                <Text style={styles.deleteText}>Delete Meal</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addMeal(categoryIndex)}
          >
            <Text style={styles.addButtonText}>+ Add Meal</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteCategory(categoryIndex)} style={styles.deleteCategoryButton}>
            <Text style={styles.deleteCategoryButtonText}>Delete Category</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addCategoryButton} onPress={addCategory}>
        <Text style={styles.addCategoryButtonText}>+ Add Category</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveMenu}>
        <Text style={styles.saveButtonText}>Save Menu</Text>
      </TouchableOpacity>

      {/* <TouchableOpacity style={styles.fetchButton} onPress={handleFetchMenu}>
        <Text style={styles.fetchButtonText}>Fetch Existing Menu</Text>
      </TouchableOpacity> */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  categoryContainer: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  mealContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealInput: {
    flex: 0.6,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  priceInput: {
    flex: 0.3,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  deleteText: {
    flex: 0.1,
    color: '#d9534f',
    fontWeight: 'bold',
  },
  addButton: {
    marginTop: 10,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  deleteCategoryButton: {
    marginTop: 10,
    backgroundColor: '#d9534f',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  deleteCategoryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  addCategoryButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  addCategoryButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  fetchButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  fetchButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default UploadMenuScreen;
