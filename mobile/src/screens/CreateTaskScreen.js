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
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import theme from '../theme';

const CreateTaskScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    location: '',
    deadline: '',
    category: '',
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const categories = [
    'Cleaning',
    'Delivery',
    'Handyman',
    'Moving',
    'Gardening',
    'Tech Support',
    'Tutoring',
    'Other',
  ];

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const hasPermission = await requestLocationPermission();
      
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to get your current location.'
        );
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const locationString = [
          address.street,
          address.city,
          address.region,
        ]
          .filter(Boolean)
          .join(', ');
        
        handleInputChange('location', locationString || 'Current Location');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please enter it manually.');
    } finally {
      setLocationLoading(false);
    }
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
        aspect: [4, 3],
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
        aspect: [4, 3],
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
      Alert.alert('Error', 'Please enter a task title');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a task description');
      return false;
    }
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      Alert.alert('Error', 'Please enter a valid budget');
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return false;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const taskData = new FormData();
      taskData.append('title', formData.title);
      taskData.append('description', formData.description);
      taskData.append('budget', parseFloat(formData.budget));
      taskData.append('location', formData.location);
      taskData.append('category', formData.category);
      
      if (formData.deadline) {
        taskData.append('deadline', formData.deadline);
      }

      // Upload images
      images.forEach((image, index) => {
        taskData.append('images', {
          uri: image.uri,
          type: 'image/jpeg',
          name: `task_image_${index}.jpg`,
        });
      });

      const response = await api.post('/tasks', taskData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert(
        'Success',
        'Task created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('TaskDetail', { taskId: response.data.id });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create task. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Task Details</Text>

          <TextInput
            label="Task Title *"
            value={formData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Help move furniture"
            maxLength={100}
          />

          <TextInput
            label="Description *"
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            mode="outlined"
            multiline
            numberOfLines={5}
            style={styles.input}
            placeholder="Describe the task in detail..."
            maxLength={1000}
          />

          <TextInput
            label="Budget (KSh) *"
            value={formData.budget}
            onChangeText={(text) => handleInputChange('budget', text)}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            placeholder="e.g., 1000"
          />

          <View style={styles.locationContainer}>
            <TextInput
              label="Location *"
              value={formData.location}
              onChangeText={(text) => handleInputChange('location', text)}
              mode="outlined"
              style={styles.locationInput}
              placeholder="Enter location"
            />
            <Button
              mode="outlined"
              onPress={getCurrentLocation}
              style={styles.locationButton}
              loading={locationLoading}
              disabled={locationLoading}
              icon="map-marker"
            >
              GPS
            </Button>
          </View>

          <TextInput
            label="Deadline (Optional)"
            value={formData.deadline}
            onChangeText={(text) => handleInputChange('deadline', text)}
            mode="outlined"
            style={styles.input}
            placeholder="YYYY-MM-DD"
          />
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
                    ? styles.categoryTextSelected
                    : styles.categoryText
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
          <Text style={styles.sectionTitle}>Images (Optional)</Text>
          <Text style={styles.imageHint}>Add up to 5 images</Text>

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
          Create Task
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
  locationContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  locationInput: {
    flex: 1,
  },
  locationButton: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginBottom: 8,
  },
  categoryText: {
    color: theme.colors.text,
  },
  categoryTextSelected: {
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
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
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

export default CreateTaskScreen;
