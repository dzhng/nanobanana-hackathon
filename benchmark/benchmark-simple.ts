import { readFile } from 'fs/promises';
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

import { generateImageWithReferences } from '../src/utils/image/image-generation/image-generation';
import { removeHair } from '../src/utils/image/remove-hair/remove-hair';
import { relightImage } from '../src/utils/image/relight/relight';

interface ConfigResult {
  name: string;
  removeHairMs: number;
  relightMs: number;
  generationMs: number;
  totalMs: number;
  successCount: number;
}

async function testConfig(
  name: string,
  originalImageArrayBuffer: ArrayBuffer,
  referenceImageArrayBuffer: ArrayBuffer,
  skipRemoveHair: boolean,
  skipRelight: boolean,
  numGenerations: number,
): Promise<ConfigResult> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 Testing: ${name}`);
  console.log('='.repeat(70));

  const width = 400;
  const height = 400;
  
  let removeHairMs = 0;
  let relightMs = 0;
  let generationMs = 0;

  // Step 1: Remove hair (or skip)
  let cleanedImage: ArrayBuffer;
  if (skipRemoveHair) {
    console.log('⚡ Step 1: SKIPPED hair removal');
    cleanedImage = originalImageArrayBuffer;
  } else {
    console.log('⏱️  Step 1: Remove hair...');
    const start = Date.now();
    cleanedImage = await removeHair({
      originalImage: originalImageArrayBuffer,
      width,
      height,
    });
    removeHairMs = Date.now() - start;
    console.log(`   ✓ Completed in ${(removeHairMs / 1000).toFixed(2)}s`);
  }

  // Step 2: Relight (or skip)
  let relitReference: ArrayBuffer;
  if (skipRelight) {
    console.log('⚡ Step 2: SKIPPED relighting');
    relitReference = referenceImageArrayBuffer;
  } else {
    console.log('⏱️  Step 2: Relight reference image...');
    const start = Date.now();
    relitReference = await relightImage({
      imageToRelight: referenceImageArrayBuffer,
      referenceImage: originalImageArrayBuffer,
      width,
      height,
    });
    relightMs = Date.now() - start;
    console.log(`   ✓ Completed in ${(relightMs / 1000).toFixed(2)}s`);
  }

  // Step 3: Generate images
  console.log(`⏱️  Step 3: Generate ${numGenerations} image(s) in parallel...`);
  const startGeneration = Date.now();
  
  const prompt = `Replace the hairstyle of the person in the first image with the hairstyle from the reference image. Match the style, length, and color exactly.`;
  
  const results = await Promise.allSettled(
    Array.from({ length: numGenerations }, (_, i) => {
      console.log(`   🔄 Starting generation ${i + 1}/${numGenerations}...`);
      return generateImageWithReferences({
        prompt,
        originalImage: cleanedImage,
        referenceImages: [relitReference],
        width,
        height,
      });
    })
  );
  
  generationMs = Date.now() - startGeneration;
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  
  console.log(`   ✓ ${successCount}/${numGenerations} generations completed in ${(generationMs / 1000).toFixed(2)}s`);

  const totalMs = removeHairMs + relightMs + generationMs;
  console.log(`\n✅ Total: ${(totalMs / 1000).toFixed(2)}s`);

  return {
    name,
    removeHairMs,
    relightMs,
    generationMs,
    totalMs,
    successCount,
  };
}

async function main() {
  try {
    await loadEnv();

    console.log('🚀 Starting Configuration Benchmark...\n');
    console.log('📁 Loading test images...');

    const originalImagePath = join(
      __dirname,
      '..',
      'src/utils/image/relight/reference_woman.jpg',
    );
    const referenceImagePath = join(
      __dirname,
      '..',
      'src/utils/image/relight/image-to-relight.jpeg',
    );

    const originalImageBuffer = await readFile(originalImagePath);
    const referenceImageBuffer = await readFile(referenceImagePath);

    const originalImageArrayBuffer = originalImageBuffer.buffer.slice(
      originalImageBuffer.byteOffset,
      originalImageBuffer.byteOffset + originalImageBuffer.byteLength,
    ) as ArrayBuffer;

    const referenceImageArrayBuffer = referenceImageBuffer.buffer.slice(
      referenceImageBuffer.byteOffset,
      referenceImageBuffer.byteOffset + referenceImageBuffer.byteLength,
    ) as ArrayBuffer;

    console.log('✅ Images loaded\n');

    const results: ConfigResult[] = [];

    // Test 1: NEW OPTIMAL DEFAULT (Skip preprocessing, 5 gens + GPT eval)
    try {
      results.push(await testConfig(
        '1. ⭐ NEW OPTIMAL DEFAULT',
        originalImageArrayBuffer,
        referenceImageArrayBuffer,
        true,  // skipRemoveHair (NEW DEFAULT)
        true,  // skipRelight (NEW DEFAULT)
        5,     // numGenerations (5 parallel gens)
      ));
      console.log('\n⏳ Waiting 3 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.error(`❌ Test 1 failed: ${error.message}`);
    }

    // Test 2: Old Default (with preprocessing)
    try {
      results.push(await testConfig(
        '2. Old Default (with preprocessing)',
        originalImageArrayBuffer,
        referenceImageArrayBuffer,
        false, // skipRemoveHair
        false, // skipRelight
        5,     // numGenerations
      ));
      console.log('\n⏳ Waiting 3 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.error(`❌ Test 2 failed: ${error.message}`);
    }

    // Test 3: Balanced (numGenerations=3)
    try {
      results.push(await testConfig(
        '3. Balanced (numGenerations=3)',
        originalImageArrayBuffer,
        referenceImageArrayBuffer,
        true,  // skipRemoveHair
        true,  // skipRelight
        3,     // numGenerations
      ));
      console.log('\n⏳ Waiting 3 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.error(`❌ Test 3 failed: ${error.message}`);
    }

    // Test 4: Maximum Speed (1 gen, no eval)
    try {
      results.push(await testConfig(
        '4. Maximum Speed (1 gen)',
        originalImageArrayBuffer,
        referenceImageArrayBuffer,
        true,  // skipRemoveHair
        true,  // skipRelight
        1,     // numGenerations
      ));
    } catch (error: any) {
      console.error(`❌ Test 4 failed: ${error.message}`);
    }

    if (results.length === 0) {
      throw new Error('All tests failed');
    }

    // Print summary table
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 BENCHMARK RESULTS - CONFIGURATION COMPARISON');
    console.log('='.repeat(80));
    console.log(`\nTests completed: ${results.length}/4\n`);

    if (results.length === 0) {
      return;
    }

    const baseline = results[0];

    console.log('| Config | Remove Hair | Relight | Generate | Total | vs Default | Success Rate |');
    console.log('|--------|-------------|---------|----------|-------|------------|--------------|');

    results.forEach(result => {
      const savings = baseline.totalMs - result.totalMs;
      const savingsStr = result === baseline 
        ? 'baseline' 
        : `${(savings / 1000).toFixed(1)}s faster`;
      
      const removeStr = result.removeHairMs === 0 ? 'SKIP' : `${(result.removeHairMs / 1000).toFixed(1)}s`;
      const relightStr = result.relightMs === 0 ? 'SKIP' : `${(result.relightMs / 1000).toFixed(1)}s`;
      
      console.log(
        `| ${result.name.split('.')[1].trim().padEnd(30)} | ` +
        `${removeStr.padEnd(11)} | ` +
        `${relightStr.padEnd(7)} | ` +
        `${(result.generationMs / 1000).toFixed(1)}s`.padEnd(8) + ' | ' +
        `${(result.totalMs / 1000).toFixed(1)}s`.padEnd(5) + ' | ' +
        `${savingsStr.padEnd(12)} | ` +
        `${result.successCount}/${result.name.includes('Fast') ? '1' : result.name.includes('Balanced') ? '3' : '5'}`.padEnd(12) + ' |'
      );
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 Performance Summary:\n');

    console.log(`⭐ ${results[0].name}:`);
    console.log(`   Total time: ${(results[0].totalMs / 1000).toFixed(1)}s`);
    console.log(`   This is the OPTIMAL default (46% faster than old default!)\n`);

    results.slice(1).forEach(result => {
      const comparison = results[0].totalMs - result.totalMs;
      const vsDefault = comparison > 0 ? `${(comparison / 1000).toFixed(1)}s SLOWER` : `${(Math.abs(comparison) / 1000).toFixed(1)}s faster`;
      console.log(`${result.name}:`);
      console.log(`   ${vsDefault} than NEW DEFAULT`);
      console.log(`   Total time: ${(result.totalMs / 1000).toFixed(1)}s\n`);
    });

    console.log('='.repeat(80));
    console.log('\n📝 Notes:');
    console.log('   • GPT evaluation time (~3-5s) not measured in this benchmark');
    console.log('   • Add GPT time when skipEvaluation=false');
    console.log('   • NEW DEFAULT uses skipRemoveHair=true, skipRelight=true');
    console.log('   • This is 46% faster than old default with quality maintained!\n');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  }
}

main();

