import { getReferenceStyles, type Sex } from './reference-base';

// Simple test function
async function testGetReferenceStyles() {
  console.log('🚀 Testing getReferenceStyles function\n');

  try {
    // Test with basic parameters
    const params = {
      sex: 'female' as Sex,
      maxRecords: 5,
    };

    console.log('Querying with parameters:', params);
    const results = await getReferenceStyles(params);

    console.log(`\n✅ Found ${results.length} records`);

    if (results.length === 0) {
      console.log('❌ No records found - test failed');
      return;
    }

    console.log('\n📋 Sample record:');
    console.log(JSON.stringify(results[0], null, 2));

    if (results.length > 1) {
      console.log('\n📋 Second record:');
      console.log(JSON.stringify(results[1], null, 2));
    }

    console.log(
      '\n🎉 Test passed! Successfully retrieved hairstyle reference data.',
    );
  } catch (error) {
    console.log(
      `❌ Test failed with error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// Run the test
testGetReferenceStyles();
