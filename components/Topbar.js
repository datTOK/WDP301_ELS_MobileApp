// components/TopBar.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header as HeaderRNE } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native'; // Keep this import

const TopBar = () => {
  const navigation = useNavigation(); // <-- CORRECT: Call useNavigation() inside the component

  const handleArrowUpPress = () => {
    navigation.navigate('ProfileStack'); // Call navigate inside a function
  };

  // const handleArrowBackPress = () => {
  //   navigation.goBack(); // Example for arrow-back
  // };

  return (
    <HeaderRNE
      // leftComponent={
      //   <TouchableOpacity onPress={handleArrowBackPress}>
      //     <Ionicons name="menu" color="black" size={20} />
      //   </TouchableOpacity>
      // }
      rightComponent={
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={{ marginLeft: 10 }}
            onPress={handleArrowUpPress}
          >
            <Ionicons name="person" color="black" size={25} />
          </TouchableOpacity>
        </View>
      }
      centerComponent={{ text: 'ELS_App', style: styles.heading }}
      backgroundColor='white'
      containerStyle={styles.headerContainer}
    />
  );
};

export default TopBar;

const styles = StyleSheet.create({
  heading: {
    color: 'black',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 5,
  },
  headerContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 2, 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    paddingHorizontal: 20,
  },
});