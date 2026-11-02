import { query } from '../config/database.js';
import { BadRequestException } from '../middleware/errorHandler.js';

/**
 * Submit contact form
 */
export const submitContactForm = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    throw new BadRequestException('All fields are required');
  }

  // Store contact submission in database
  await query(
    `INSERT INTO contact_submissions (name, email, subject, message, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [name, email, subject, message]
  );

  // In production, you might want to send an email notification to admin
  console.log('📧 Contact Form Submission:');
  console.log(`   From: ${name} (${email})`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Message: ${message}`);

  res.json({
    success: true,
    message: 'Thank you for contacting us! We will get back to you soon.'
  });
};
