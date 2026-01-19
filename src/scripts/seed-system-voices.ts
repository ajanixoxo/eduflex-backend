/**
 * Seed script to add Edge TTS system voices to the database
 * Run with: npx ts-node src/scripts/seed-system-voices.ts
 * Or: bun run src/scripts/seed-system-voices.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error('MONGO_URI, MONGODB_URI or DATABASE_URL environment variable is required');
  process.exit(1);
}

// AIVoice schema definition (matching the actual schema)
const AIVoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  media: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
    required: false,
  },
  owner: {
    type: String,
    enum: ['system', 'user'],
    required: true,
    default: 'user',
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  accent: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  voice_id: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  voice_type: {
    type: String,
    enum: ['system', 'cloned'],
    required: true,
    default: 'cloned',
  },
  clone_status: {
    type: String,
    enum: ['pending', 'processing', 'ready', 'failed'],
    default: 'ready',
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  collection: 'aivoices',
});

const AIVoice = mongoose.model('AIVoice', AIVoiceSchema);

// Edge TTS System Voices
const systemVoices = [
  {
    name: 'Professor Alex',
    voice_id: 'guy',
    description: 'Deep, professional US male voice',
    accent: 'American',
    owner: 'system',
    voice_type: 'system',
    clone_status: 'ready',
  },
  {
    name: 'Dr. Ryan',
    voice_id: 'ryan',
    description: 'British professional male voice',
    accent: 'British',
    owner: 'system',
    voice_type: 'system',
    clone_status: 'ready',
  },
  {
    name: 'Mr. Thomas',
    voice_id: 'thomas',
    description: 'British warm male voice',
    accent: 'British',
    owner: 'system',
    voice_type: 'system',
    clone_status: 'ready',
  },
];

async function seedSystemVoices() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const voice of systemVoices) {
      const existing = await AIVoice.findOne({ voice_id: voice.voice_id });

      if (existing) {
        console.log(`Voice "${voice.name}" (${voice.voice_id}) already exists, updating...`);
        await AIVoice.updateOne({ voice_id: voice.voice_id }, voice);
      } else {
        console.log(`Creating voice "${voice.name}" (${voice.voice_id})...`);
        await AIVoice.create(voice);
      }
    }

    console.log('\nSystem voices seeded successfully!');
    console.log('Voices in database:');

    const allVoices = await AIVoice.find({ owner: 'system' });
    allVoices.forEach(v => {
      console.log(`  - ${v.name} (${v.voice_id}): ${v.description}`);
    });

  } catch (error) {
    console.error('Error seeding system voices:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

seedSystemVoices();
