import { Text, View, StyleSheet } from 'react-native';
import React, { Component } from 'react';
import { Card, Avatar, Button } from 'react-native-elements';

export default class MembershipScreen extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Subscription</Text>
        <Card containerStyle={styles.card}>
          <Card.Title style={styles.h1}>Recommended</Card.Title>
          <Card.Divider />
          <p style={{color: '#ffffff'}}>Access only today</p>
          <Button title="Buy now" containerStyle={{ marginTop: 10 }} buttonStyle={{backgroundColor: '#000000', borderRadius: 4, borderColor: '#FFFFFF', borderWidth: 1}}/>
        </Card>
        <Card containerStyle={styles.card}>
          <Card.Title style={styles.h1}>Recommended</Card.Title>
          <Card.Divider />
          <p style={{color: '#ffffff'}}>Access only today</p>
          <Button title="Buy now" containerStyle={{ marginTop: 10 }} buttonStyle={{backgroundColor: '#000000', borderRadius: 4, borderColor: '#FFFFFF', borderWidth: 1}}/>
        </Card>
        <Card containerStyle={styles.card}>
          <Card.Title style={styles.h1}>Recommended</Card.Title>
          <Card.Divider />
          <p style={{color: '#ffffff'}}>Access only today</p>
          <Button title="Buy now" containerStyle={{ marginTop: 10 }} buttonStyle={{backgroundColor: '#000000', borderRadius: 4, borderColor: '#FFFFFF', borderWidth: 1}}/>
        </Card>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingBottom: 10,
  },

  card: {
    backgroundColor: '#000000',
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
  },

  h1: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'left',
  },
});
