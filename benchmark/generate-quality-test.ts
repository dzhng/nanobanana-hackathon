import { readFile, writeFile, copyFile } from 'fs/promises';
import { join } from 'path';

// Load environment variables manually
async function loadEnv() {
  const envPath = join(__dirname, '..', '.env');
  const envContent = await readFile(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

import { generateHairstyleWithRetry } from '../src/app/api/generate-hairstyle/route';

interface TestConfig {
  name: string;
  skipRemoveHair: boolean;
  skipRelight: boolean;
  numGenerations: number;
  skipEvaluation: boolean;
}

const configs: TestConfig[] = [
  // Generation Count Tests (with full preprocessing)
  {
    name: 'numGen_1',
    skipRemoveHair: false,
    skipRelight: false,
    numGenerations: 1,
    skipEvaluation: false,
  },
  {
    name: 'numGen_3',
    skipRemoveHair: false,
    skipRelight: false,
    numGenerations: 3,
    skipEvaluation: false,
  },
  {
    name: 'numGen_5',
    skipRemoveHair: false,
    skipRelight: false,
    numGenerations: 5,
    skipEvaluation: false,
  },
  
  // Preprocessing Tests (with 5 generations)
  {
    name: 'skip_remove_hair',
    skipRemoveHair: true,
    skipRelight: false,
    numGenerations: 5,
    skipEvaluation: false,
  },
  {
    name: 'skip_relight',
    skipRemoveHair: false,
    skipRelight: true,
    numGenerations: 5,
    skipEvaluation: false,
  },
  {
    name: 'skip_both_preprocessing',
    skipRemoveHair: true,
    skipRelight: true,
    numGenerations: 5,
    skipEvaluation: false,
  },
  
  // Fast Mode
  {
    name: 'fast_mode',
    skipRemoveHair: true,
    skipRelight: true,
    numGenerations: 1,
    skipEvaluation: true,
  },
];

async function runQualityTest() {
  console.log('🎨 Starting Quality Comparison Test...\n');
  console.log(`Testing ${configs.length} configurations\n`);
  
  // Load test images
  console.log('📁 Loading test images...');
  const originalImagePath = join(__dirname, '..', 'src/utils/image/relight/reference_woman.jpg');
  const referenceImagePath = join(__dirname, '..', 'src/utils/image/relight/image-to-relight.jpeg');
  
  const originalImageBuffer = await readFile(originalImagePath);
  const referenceImageBuffer = await readFile(referenceImagePath);
  
  // Create Blob objects from buffers (Node.js doesn't have File constructor)
  const originalImage = new Blob([originalImageBuffer], { type: 'image/jpeg' }) as any;
  const referenceImage = new Blob([referenceImageBuffer], { type: 'image/jpeg' }) as any;
  
  console.log('✅ Images loaded\n');
  
  // Copy source images to outputs for easy comparison
  const outputDir = join(__dirname, 'outputs');
  await copyFile(originalImagePath, join(outputDir, 'original.jpg'));
  await copyFile(referenceImagePath, join(outputDir, 'reference.jpeg'));
  console.log('✅ Source images copied to outputs/\n');
  
  // Run each configuration
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    console.log('='.repeat(70));
    console.log(`🧪 Test ${i + 1}/${configs.length}: ${config.name}`);
    console.log('='.repeat(70));
    console.log(`   skipRemoveHair: ${config.skipRemoveHair}`);
    console.log(`   skipRelight: ${config.skipRelight}`);
    console.log(`   numGenerations: ${config.numGenerations}`);
    console.log(`   skipEvaluation: ${config.skipEvaluation}`);
    console.log();
    
    try {
      const startTime = Date.now();
      
      const result = await generateHairstyleWithRetry({
        originalImage,
        referenceImages: [referenceImage],
        widthValue: 400,
        heightValue: 400,
        shouldEvaluateResult: false, // Skip quality check for speed
        skipRemoveHair: config.skipRemoveHair,
        skipRelight: config.skipRelight,
        numGenerations: config.numGenerations,
        skipEvaluation: config.skipEvaluation,
      });
      
      const duration = Date.now() - startTime;
      
      // Save generated image
      const outputPath = join(outputDir, `output_${config.name}.jpg`);
      await writeFile(outputPath, result.generatedImage);
      console.log(`✅ Saved: output_${config.name}.jpg`);
      
      // Save morphing GIF if available
      if (result.morphingGif) {
        const gifPath = join(outputDir, `morph_${config.name}.gif`);
        await writeFile(gifPath, result.morphingGif);
        console.log(`✅ Saved: morph_${config.name}.gif`);
      }
      
      console.log(`⏱️  Time: ${(duration / 1000).toFixed(1)}s\n`);
      
      // Wait a bit between tests to avoid rate limiting
      if (i < configs.length - 1) {
        console.log('⏳ Waiting 3 seconds before next test...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error: any) {
      console.error(`❌ Failed: ${error.message}\n`);
      continue;
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Quality Test Complete!');
  console.log('='.repeat(70));
  console.log('\n📂 Output images saved in: benchmark/outputs/');
  console.log('\nGenerated files:');
  console.log('  - original.jpg (source image)');
  console.log('  - reference.jpeg (style image)');
  configs.forEach(config => {
    console.log(`  - output_${config.name}.jpg`);
  });
  console.log('\n💡 Compare the images to evaluate quality differences between modes\n');
}

async function main() {
  try {
    await loadEnv();
    await runQualityTest();
  } catch (error) {
    console.error('❌ Quality test failed:', error);
    process.exit(1);
  }
}

main();

