// components/TopBar.js
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const TopBar = () => {
  return (
    <View style={styles.container}>
      <TouchableOpacity>
        <Image
          source={require('../assets/ELS_logo.png')}
          style={styles.avatar}
        />
      </TouchableOpacity>

      <View style={styles.center}>
        <Icon name="fire" size={22} color="#FF6B00" />
        <Text style={styles.streakText}>7</Text>
      </View>

      <TouchableOpacity style={styles.right}>
        <Icon name="diamond-stone" size={22} color="#3B82F6" />
        <Text style={styles.pointsText}>210</Text>
      </TouchableOpacity>
    </View>
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
});
