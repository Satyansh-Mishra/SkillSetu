/**
 * DATABASE SEED - SKILLS
 * 
 * Run this to populate your database with sample skills
 * 
 * Command: npx ts-node prisma/seed-skills.ts
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const databaseUrl = process.env.NODE_ENV === "development" as string ? process.env.DATABASE_URL_DEVELOPMENT : process.env.DATABASE_URL_PRODUCTION

const adapter = new PrismaPg({
  connectionString: databaseUrl,
})

const prisma = new PrismaClient({
  adapter
})

/**
 * Sample skills data organized by category
 */
const skillsData = [
  // Programming & Development
  {
    category: 'Programming',
    skills: [
      { name: 'Python', description: 'Learn Python programming from basics to advanced' },
      { name: 'JavaScript', description: 'Master JavaScript for web development' },
      { name: 'Java', description: 'Object-oriented programming with Java' },
      { name: 'C++', description: 'Systems programming and competitive coding' },
      { name: 'TypeScript', description: 'Typed superset of JavaScript' },
      { name: 'Go', description: 'Modern programming language by Google' },
      { name: 'Rust', description: 'Safe systems programming language' },
      { name: 'PHP', description: 'Server-side web development' },
      { name: 'Ruby', description: 'Dynamic programming language' },
      { name: 'Swift', description: 'iOS app development language' },
      { name: 'Kotlin', description: 'Modern language for Android development' },
    ],
  },
  
  // Web Development
  {
    category: 'Web Development',
    skills: [
      { name: 'React', description: 'Build interactive user interfaces' },
      { name: 'Angular', description: 'TypeScript-based web framework' },
      { name: 'Vue.js', description: 'Progressive JavaScript framework' },
      { name: 'Next.js', description: 'React framework for production' },
      { name: 'Node.js', description: 'JavaScript runtime for backend' },
      { name: 'Django', description: 'Python web framework' },
      { name: 'Flask', description: 'Lightweight Python web framework' },
      { name: 'Spring Boot', description: 'Java framework for microservices' },
      { name: 'Express.js', description: 'Minimalist Node.js framework' },
      { name: 'HTML/CSS', description: 'Web fundamentals and styling' },
      { name: 'Tailwind CSS', description: 'Utility-first CSS framework' },
    ],
  },
  
  // Mobile Development
  {
    category: 'Mobile Development',
    skills: [
      { name: 'React Native', description: 'Build native apps with React' },
      { name: 'Flutter', description: 'Cross-platform mobile development' },
      { name: 'iOS Development', description: 'Native iOS app development' },
      { name: 'Android Development', description: 'Native Android app development' },
      { name: 'SwiftUI', description: 'Modern iOS UI framework' },
      { name: 'Jetpack Compose', description: 'Modern Android UI toolkit' },
    ],
  },
  
  // Data Science & AI
  {
    category: 'Data Science',
    skills: [
      { name: 'Machine Learning', description: 'Build intelligent systems' },
      { name: 'Deep Learning', description: 'Neural networks and AI' },
      { name: 'Data Analysis', description: 'Extract insights from data' },
      { name: 'Data Visualization', description: 'Present data effectively' },
      { name: 'TensorFlow', description: 'Machine learning framework' },
      { name: 'PyTorch', description: 'Deep learning framework' },
      { name: 'Pandas', description: 'Data manipulation in Python' },
      { name: 'SQL', description: 'Database querying language' },
      { name: 'R Programming', description: 'Statistical computing language' },
    ],
  },
  
  // Design
  {
    category: 'Design',
    skills: [
      { name: 'UI/UX Design', description: 'Create user-friendly interfaces' },
      { name: 'Graphic Design', description: 'Visual communication design' },
      { name: 'Figma', description: 'Collaborative design tool' },
      { name: 'Adobe Photoshop', description: 'Image editing and manipulation' },
      { name: 'Adobe Illustrator', description: 'Vector graphics design' },
      { name: 'Adobe XD', description: 'UI/UX design and prototyping' },
      { name: 'Sketch', description: 'Digital design toolkit' },
      { name: 'Web Design', description: 'Design beautiful websites' },
      { name: 'Logo Design', description: 'Brand identity creation' },
      { name: 'Motion Graphics', description: 'Animated visual content' },
    ],
  },
  
  // Business & Marketing
  {
    category: 'Business',
    skills: [
      { name: 'Digital Marketing', description: 'Market products online' },
      { name: 'SEO', description: 'Search engine optimization' },
      { name: 'Content Marketing', description: 'Create valuable content' },
      { name: 'Social Media Marketing', description: 'Grow on social platforms' },
      { name: 'Email Marketing', description: 'Email campaign strategies' },
      { name: 'Copywriting', description: 'Persuasive writing skills' },
      { name: 'Business Strategy', description: 'Strategic planning skills' },
      { name: 'Project Management', description: 'Lead successful projects' },
      { name: 'Entrepreneurship', description: 'Start and grow a business' },
      { name: 'Sales', description: 'Selling techniques and strategies' },
    ],
  },
  
  // Languages
  {
    category: 'Languages',
    skills: [
      { name: 'Spanish', description: 'Learn Spanish language' },
      { name: 'French', description: 'Learn French language' },
      { name: 'German', description: 'Learn German language' },
      { name: 'Japanese', description: 'Learn Japanese language' },
      { name: 'Chinese (Mandarin)', description: 'Learn Mandarin Chinese' },
      { name: 'Italian', description: 'Learn Italian language' },
      { name: 'Portuguese', description: 'Learn Portuguese language' },
      { name: 'Korean', description: 'Learn Korean language' },
      { name: 'English', description: 'Learn English language' },
      { name: 'Hindi', description: 'Learn Hindi language' },
    ],
  },
  
  // Music
  {
    category: 'Music',
    skills: [
      { name: 'Guitar', description: 'Learn acoustic or electric guitar' },
      { name: 'Piano', description: 'Master the piano' },
      { name: 'Singing', description: 'Vocal training and techniques' },
      { name: 'Music Theory', description: 'Understand music fundamentals' },
      { name: 'Drums', description: 'Learn percussion instruments' },
      { name: 'Violin', description: 'Classical string instrument' },
      { name: 'Music Production', description: 'Create and produce music' },
      { name: 'DJing', description: 'Mix and master tracks' },
      { name: 'Songwriting', description: 'Write original songs' },
      { name: 'Audio Engineering', description: 'Record and mix audio' },
    ],
  },
  
  // Arts & Crafts
  {
    category: 'Arts & Crafts',
    skills: [
      { name: 'Drawing', description: 'Learn to draw and sketch' },
      { name: 'Painting', description: 'Watercolor, oil, and acrylic' },
      { name: 'Photography', description: 'Capture stunning photos' },
      { name: 'Video Editing', description: 'Edit professional videos' },
      { name: 'Animation', description: 'Create animated content' },
      { name: 'Digital Art', description: 'Create art digitally' },
      { name: 'Pottery', description: 'Ceramic art and pottery' },
      { name: 'Knitting', description: 'Knitting and crochet' },
      { name: 'Origami', description: 'Japanese paper folding art' },
    ],
  },
  
  // Fitness & Wellness
  {
    category: 'Fitness & Wellness',
    skills: [
      { name: 'Yoga', description: 'Practice yoga for mind and body' },
      { name: 'Meditation', description: 'Mindfulness and meditation' },
      { name: 'Personal Training', description: 'Fitness and exercise coaching' },
      { name: 'Nutrition', description: 'Healthy eating and diet planning' },
      { name: 'Pilates', description: 'Low-impact exercise method' },
      { name: 'Weight Training', description: 'Strength and muscle building' },
      { name: 'Running', description: 'Running techniques and training' },
      { name: 'Dance', description: 'Various dance styles' },
      { name: 'Martial Arts', description: 'Self-defense and discipline' },
    ],
  },
  
  // Cooking
  {
    category: 'Cooking',
    skills: [
      { name: 'Baking', description: 'Breads, cakes, and pastries' },
      { name: 'Indian Cooking', description: 'Traditional Indian cuisine' },
      { name: 'Italian Cooking', description: 'Authentic Italian dishes' },
      { name: 'Chinese Cooking', description: 'Chinese culinary arts' },
      { name: 'Vegan Cooking', description: 'Plant-based recipes' },
      { name: 'Pastry Making', description: 'Professional pastry skills' },
      { name: 'BBQ & Grilling', description: 'Outdoor cooking techniques' },
      { name: 'Meal Prep', description: 'Efficient meal planning' },
    ],
  },
]

async function main() {
  console.log('🌱 Starting skill seed...')
  
  let totalCreated = 0
  let totalSkipped = 0
  
  for (const categoryData of skillsData) {
    console.log(`\n📚 Category: ${categoryData.category}`)
    
    for (const skillData of categoryData.skills) {
      try {
        // Check if skill already exists
        const existing = await prisma.skill.findFirst({
          where: {
            name: skillData.name,
            category: categoryData.category,
          },
        })
        
        if (existing) {
          console.log(`   ⏭️  Skipped: ${skillData.name} (already exists)`)
          totalSkipped++
          continue
        }
        
        // Create skill
        await prisma.skill.create({
          data: {
            name: skillData.name,
            category: categoryData.category,
            description: skillData.description,
          },
        })
        
        console.log(`   ✅ Created: ${skillData.name}`)
        totalCreated++
        
      } catch (error) {
        console.error(`   ❌ Error creating ${skillData.name}:`, error)
      }
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log(`✨ Seed completed!`)
  console.log(`   Created: ${totalCreated} skills`)
  console.log(`   Skipped: ${totalSkipped} skills`)
  console.log('='.repeat(50))
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })