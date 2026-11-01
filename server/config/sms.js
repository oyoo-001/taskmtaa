import AfricasTalking from 'africastalking';

const isProduction = process.env.NODE_ENV === 'production';

// Initialize Africa's Talking (Kenya)
const africastalking = AfricasTalking({
  apiKey: process.env.AT_API_KEY || 'test',
  username: process.env.AT_USERNAME || 'sandbox',
});

const sms = africastalking.SMS;

/**
 * Send SMS OTP
 * @param {string} phoneNumber - Phone number in format +254XXXXXXXXX
 * @param {string} code - 6-digit OTP code
 */
export async function sendOTP(phoneNumber, code) {
  const message = `Your TaskMtaa verification code is: ${code}. Valid for 5 minutes. Do not share this code.`;
  
  if (!isProduction) {
    // Development mode: log to console
    console.log('📱 [SMS - DEV MODE]');
    console.log(`   To: ${phoneNumber}`);
    console.log(`   Code: ${code}`);
    console.log(`   Message: ${message}`);
    return { success: true, messageId: 'dev-mode-' + Date.now() };
  }
  
  try {
    const result = await sms.send({
      to: [phoneNumber],
      message: message,
      from: process.env.AT_SENDER_ID || 'TaskMtaa',
    });
    
    console.log('📱 SMS sent successfully:', result);
    return { 
      success: true, 
      messageId: result.SMSMessageData.Recipients[0].messageId 
    };
  } catch (error) {
    console.error('📱 SMS sending failed:', error);
    throw error;
  }
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
