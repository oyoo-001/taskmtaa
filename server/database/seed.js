import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

/**
 * Seed database with sample data for development
 */
async function seed() {
  try {
    console.log('Starting database seeding...');
    
    // Create sample users
    console.log('→ Creating sample users...');
    const password = await bcrypt.hash('password123', 10);
    
    const userIds = [];
    
    // Sample user 1 - Task Poster
    const user1 = await query(`
      INSERT INTO users (full_name, email, phone_number, password_hash, is_verified, rating)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, ['John Doe', 'john@example.com', '+254712345678', password, true, 4.8]);
    
    if (user1.rows.length > 0) userIds.push(user1.rows[0].id);
    
    // Sample user 2 - Tasker
    const user2 = await query(`
      INSERT INTO users (full_name, email, phone_number, password_hash, is_verified, rating)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, ['Jane Smith', 'jane@example.com', '+254723456789', password, true, 4.9]);
    
    if (user2.rows.length > 0) userIds.push(user2.rows[0].id);
    
    // Sample user 3
    const user3 = await query(`
      INSERT INTO users (full_name, email, phone_number, password_hash, is_verified, rating)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, ['Michael Johnson', 'michael@example.com', '+254734567890', password, true, 5.0]);
    
    if (user3.rows.length > 0) userIds.push(user3.rows[0].id);
    
    console.log(`✓ Created ${userIds.length} sample users`);
    
    if (userIds.length > 0) {
      // Create sample tasks (using Nairobi coordinates)
      console.log('→ Creating sample tasks...');
      
      const taskData = [
        {
          title: 'Compound Cleaning Needed',
          description: 'Need someone to clean my compound thoroughly. Includes sweeping, mopping, and disposing of trash.',
          category: 'Housekeeping',
          budget: 1500.00,
          lat: -1.2921,
          lng: 36.8219,
          location_name: 'Nairobi CBD, Kenya'
        },
        {
          title: 'Bush Clearing on 1 Acre Land',
          description: 'Clear bushes and overgrown vegetation on my 1-acre plot. Must bring own tools.',
          category: 'Bush & Yard Clearing',
          budget: 5000.00,
          lat: -1.3028,
          lng: 36.7073,
          location_name: 'Karen, Nairobi'
        },
        {
          title: 'Math Tutoring for High School Student',
          description: 'Looking for an experienced math tutor for my son preparing for KCSE. 3 sessions per week.',
          category: 'Tutoring & Training',
          budget: 3000.00,
          lat: -1.2641,
          lng: 36.8067,
          location_name: 'Westlands, Nairobi'
        },
        {
          title: 'Laundry Service Required',
          description: 'Need someone to wash, iron, and fold clothes. About 3 loads of laundry.',
          category: 'Housekeeping',
          budget: 800.00,
          lat: -1.3197,
          lng: 36.9314,
          location_name: 'Embakasi, Nairobi'
        },
        {
          title: 'Grocery Shopping and Delivery',
          description: 'Buy groceries from Carrefour and deliver to my house. Shopping list will be provided.',
          category: 'Errands & Delivery',
          budget: 500.00,
          lat: -1.2864,
          lng: 36.8172,
          location_name: 'Kilimani, Nairobi'
        }
      ];
      
      for (const task of taskData) {
        await query(`
          INSERT INTO tasks (poster_id, title, description, category, budget, location, location_name, status)
          VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography, $8, 'open')
        `, [
          userIds[0],
          task.title,
          task.description,
          task.category,
          task.budget,
          task.lng,
          task.lat,
          task.location_name
        ]);
      }
      
      console.log(`✓ Created ${taskData.length} sample tasks`);
    }
    
    console.log('✓ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run seeding
seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
