import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Chip,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import theme from '../theme';

const CreateGigScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    delivery_time: '',
    category: '',
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const categories = [
    'Writing',
    'Design',
    'Programming',
    'Marketing',
    'Video',
    'Music',
    'Translation',
    'Other',
  ];

  const deliveryTimes = [
    { label: '1 Day', value: '1' },
    { label: '3 Days', value: '3' },
    { label: '5 Days', value: '5' },
    { label: '7 Days', value: '7' },
    { label: '14 Days', value: '14' },
    { label: '30 Days', value: '30' },
  ];

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera roll permissions are needed to select images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [16, 9],
      });

      if (!result.canceled) {
        const newImages = result.assets || [result];
        setImages([...images, ...newImages.slice(0, 5 - images.length)]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permissions are needed to take photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        aspect: [16, 9],
      });

      if (!result.canceled) {
        const newImage = result.assets ? result.assets[0] : result;
        setImages([...images, newImage]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a gig title');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a gig description');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }
    if (!formData.delivery_time) {
      Alert.alert('Error', 'Please select a delivery time');
      return false;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const gigData = new FormData();
      gigData.append('title', formData.title);
      gigData.append('description', formData.description);
      gigData.append('price', parseFloat(formData.price));
      gigData.append('delivery_time', parseInt(formData.delivery_time));
      gigData.append('category', formData.category);

      // Upload images
      images.forEach((image, index) => {
        gigData.append('images', {
          uri: image.uri,
          type: 'image/jpeg',
          name: `gig_image_${index}.jpg`,
        });
      });

      const response = await api.post('/gigs', gigData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert(
        'Success',
        'Gig created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('GigDetail', { gigId: response.data.id });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating gig:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create gig. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Gig Details</Text>

          <TextInput
            label="Gig Title *"
            value={formData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., I will design a professional logo"
            maxLength={100}
          />

          <TextInput
            label="Description *"
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            mode="outlined"
            multiline
            numberOfLines={6}
            style={styles.input}
            placeholder="Describe what you'll deliver, your expertise, etc."
            maxLength={2000}
          />

          <TextInput
            label="Price (KSh) *"
            value={formData.price}
            onChangeText={(text) => handleInputChange('price', text)}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            placeholder="e.g., 5000"
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Delivery Time *</Text>
          <View style={styles.deliveryContainer}>
            {deliveryTimes.map((time) => (
              <Chip
                key={time.value}
                mode={formData.delivery_time === time.value ? 'flat' : 'outlined'}
                selected={formData.delivery_time === time.value}
                onPress={() => handleInputChange('delivery_time', time.value)}
                style={styles.deliveryChip}
                textStyle={
                  formData.delivery_time === time.value
                    ? styles.chipTextSelected
                    : styles.chipText
                }
              >
                {time.label}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Category *</Text>
          <View style={styles.categoryContainer}>
            {categories.map((category) => (
              <Chip
                key={category}
                mode={formData.category === category ? 'flat' : 'outlined'}
                selected={formData.category === category}
                onPress={() => handleInputChange('category', category)}
                style={styles.categoryChip}
                textStyle={
                  formData.category === category
                    ? styles.chipTextSelected
                    : styles.chipText
                }
              >
                {category}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Images * (At least 1 required)</Text>
          <Text style={styles.imageHint}>Add up to 5 images showcasing your work</Text>

          <View style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: image.uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
                {index === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverText}>Cover</Text>
                  </View>
                )}
              </View>
            ))}

            {images.length < 5 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={showImageOptions}
              >
                <Text style={styles.addImageText}>+</Text>
              </TouchableOpacity>
            )}
          </View>

          {images.length === 0 && (
            <Text style={styles.warningText}>
              ⚠️ At least one image is required to create a gig
            </Text>
          )}
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          Create Gig
        </Button>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  deliveryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deliveryChip: {
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginBottom: 8,
  },
  chipText: {
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: '#fff',
  },
  imageHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coverText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  addImageText: {
    fontSize: 40,
    color: theme.colors.primary,
  },
  warningText: {
    fontSize: 12,
    color: theme.colors.warning,
    marginTop: 8,
  },
  buttonContainer: {
    padding: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  footer: {
    height: 20,
  },
});

export default CreateGigScreen;
