import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import theme from '../theme';

const PlaceBidScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { taskId } = route.params;

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bidData, setBidData] = useState({
    amount: '',
    message: '',
    estimated_time: '',
  });

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      setTask(response.data);
      // Pre-fill with task budget as suggestion
      setBidData({ ...bidData, amount: response.data.budget?.toString() || '' });
    } catch (error) {
      console.error('Error fetching task:', error);
      Alert.alert('Error', 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setBidData({ ...bidData, [field]: value });
  };

  const validateForm = () => {
    if (!bidData.amount || parseFloat(bidData.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid bid amount');
      return false;
    }
    if (!bidData.message.trim()) {
      Alert.alert('Error', 'Please explain why you\'re the best fit for this task');
      return false;
    }
    if (!bidData.estimated_time || parseInt(bidData.estimated_time) <= 0) {
      Alert.alert('Error', 'Please enter estimated completion time in days');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      await api.post('/bids', {
        task_id: taskId,
        amount: parseFloat(bidData.amount),
        message: bidData.message,
        estimated_time: parseInt(bidData.estimated_time),
      });

      Alert.alert(
        'Success',
        'Your bid has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting bid:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit bid. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.centerContainer}>
        <Text>Task not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskBudget}>
            Budget: KSh {task.budget?.toLocaleString()}
          </Text>
          <Text style={styles.taskLocation}>📍 {task.location}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Your Bid</Text>

          <TextInput
            label="Bid Amount (KSh) *"
            value={bidData.amount}
            onChangeText={(text) => handleInputChange('amount', text)}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            placeholder={`Suggested: ${task.budget}`}
            left={<TextInput.Affix text="KSh " />}
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Tip: The task budget is KSh {task.budget?.toLocaleString()}. 
              You can bid the same amount or adjust based on your assessment.
            </Text>
          </View>

          <TextInput
            label="Estimated Completion Time (days) *"
            value={bidData.estimated_time}
            onChangeText={(text) => handleInputChange('estimated_time', text)}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            placeholder="e.g., 2"
            left={<TextInput.Icon icon="calendar" />}
          />

          <TextInput
            label="Why You're Perfect for This Task *"
            value={bidData.message}
            onChangeText={(text) => handleInputChange('message', text)}
            mode="outlined"
            multiline
            numberOfLines={6}
            style={styles.input}
            placeholder="Explain your experience, approach, and why you should be chosen..."
            maxLength={500}
          />

          <Text style={styles.charCount}>
            {bidData.message.length}/500 characters
          </Text>

          <Divider style={styles.divider} />

          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Bid Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Your Bid:</Text>
              <Text style={styles.summaryValue}>
                KSh {bidData.amount ? parseFloat(bidData.amount).toLocaleString() : '0'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Time:</Text>
              <Text style={styles.summaryValue}>
                {bidData.estimated_time || '0'} {parseInt(bidData.estimated_time) === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ Once submitted, you cannot edit or delete your bid. 
              Make sure all details are correct before submitting.
            </Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          style={styles.submitButton}
        >
          Submit Bid
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  taskBudget: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  taskLocation: {
    fontSize: 14,
    color: theme.colors.textSecondary,
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
  infoBox: {
    backgroundColor: theme.colors.infoLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.text,
    lineHeight: 18,
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  summaryContainer: {
    backgroundColor: theme.colors.primaryLight,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  warningBox: {
    backgroundColor: theme.colors.warningLight,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  warningText: {
    fontSize: 12,
    color: theme.colors.text,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  footer: {
    height: 20,
  },
});

export default PlaceBidScreen;
