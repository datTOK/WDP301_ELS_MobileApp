import { Text, View, StyleSheet, Alert, Dimensions, Image, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect } from 'react';
import TopBar from '../components/Topbar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '.././context/AuthContext';
import Swiper from 'react-native-swiper';
import { Divider } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; 

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme(); 

  const imageUrls = [
    'https://images.pexels.com/photos/5652121/pexels-photo-5652121.jpeg',
    'https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg',
    'https://images.pexels.com/photos/6005081/pexels-photo-6005081.jpeg',
  ];

  useEffect(() => {
    console.log('HomeScreen mounted. Navigation prop:', navigation);
  }, [navigation]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TopBar />
      <View style={styles.swiperContainer}>
        <Swiper
          autoplay
          autoplayTimeout={6}
          showsPagination={true}
          loop
          dotStyle={styles.paginationDot}
          activeDotStyle={[styles.activePaginationDot, { backgroundColor: theme.colors.text }]} 
        >
          {imageUrls.map((url, index) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={styles.swiperImage}
              resizeMode="cover"
            />
          ))}
        </Swiper>
      </View>

      <Divider style={[styles.sectionDivider, { backgroundColor: theme.colors.borderColor }]} />

      <View style={styles.whyChooseSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Why Choose ELS?</Text>
        <View style={[styles.featureCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.borderColor }]}>
          <Ionicons name="bulb-outline" size={30} color={theme.colors.primary} style={styles.featureIcon} />
          <Text style={[styles.featureText, { color: theme.colors.text }]}>
            ELS is one of the most chosen English learning apps in Vietnam and continues to grow largely.
            We provide engaging lessons, interactive exercises, and a supportive community.
          </Text>
        </View>
        <View style={[styles.featureCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.borderColor }]}>
          <Ionicons name="medal" size={30} color={'yellow'} style={styles.featureIcon} />
          <Text style={[styles.featureText, { color: theme.colors.text }]}>
            Achieve fluency faster with our proven methodology and personalized learning paths.
            Join thousands of successful learners today!
          </Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.callToActionCard, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.navigate('Courses')}>
        <Text style={styles.callToActionText}>Explore Our Courses!</Text>
        <Ionicons name="arrow-forward-outline" size={24} color={'white'} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  swiperContainer: {
    height: 200,
    marginTop: 15,
    marginHorizontal: 10,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    overflow: 'hidden',
  },
  swiperImage: {
    width: width - 20,
    height: 200,
    borderRadius: 10,
  },
  paginationDot: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
    marginTop: 3,
    marginBottom: -5,
  },
  activePaginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 3,
    marginRight: 3,
    marginTop: 3,
    marginBottom: -5,
  },
  sectionDivider: {
    height: 1,
    marginTop: 30,
    width: '90%',
    alignSelf: 'center',
    marginBottom: 20,
  },
  whyChooseSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  featureCard: {
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1, 
  },
  featureIcon: {
    marginRight: 10,
  },
  featureText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  callToActionCard: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: 'blue', 
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 7,
    flexDirection: 'row',
  },
  callToActionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 5,
  },
  themeToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginVertical: 10,
    borderRadius: 8,
    backgroundColor: '#eee', 
    marginHorizontal: 20,
  },
  themeToggleButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
});