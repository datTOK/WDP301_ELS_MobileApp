import { Text, View, StyleSheet, ScrollView } from 'react-native';
import React, { Component } from 'react';
import { Card, Avatar, Button, PricingCard } from 'react-native-elements';

export default class MembershipScreen extends Component {
  render() {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Subscription</Text>
        <PricingCard
          color={'black'}
          title="Free"
          price="$0"
          info={['1 User', 'Basic Support', 'All Core Features']}
          button={{ title: ' GET STARTED', icon: 'book' }}
          containerStyle={{borderWidth: 4, borderColor: 'black', borderRadius: 10}}
        />
        <PricingCard
          color={'black'}
          title="Free"
          price="$100"
          info={['2 User', 'Basic Support and more', 'All Core Features and nofitication']}
          button={{ title: ' GET STARTED', icon: 'book' }}
          containerStyle={{borderWidth: 4, borderColor: 'black', borderRadius: 10}}
        />
        <PricingCard
          color={'black'}
          title="Free"
          price="$1000"
          info={['3 User', 'All Support', 'All Core Features and Bonus Achievements']}
          button={{ title: ' GET STARTED', icon: 'book' }}
          containerStyle={{borderWidth: 4, borderColor: 'black', borderRadius: 10}}
        />
      </ScrollView>
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
  }
});
