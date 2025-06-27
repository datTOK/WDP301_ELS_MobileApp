// components/TopBar.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header as HeaderRNE } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native'; // Keep this import

const TopBar = () => {
  const navigation = useNavigation(); // <-- CORRECT: Call useNavigation() inside the component

  const handleArrowUpPress = () => {
    navigation.navigate('Profile'); // Call navigate inside a function
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
    />
  );
};

export default TopBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  center: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  headerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#397af8',
    marginBottom: 20,
    width: '100%',
    paddingVertical: 15,
  },
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
  subheaderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});