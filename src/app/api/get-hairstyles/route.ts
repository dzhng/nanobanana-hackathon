import { NextRequest, NextResponse } from 'next/server';

import {
  getReferenceStyles,
  type Ethnicity,
  type GetReferenceStylesParams,
  type HairColor,
  type Length,
  type Sex,
} from '@/utils/airtable/reference-base';
import { asEnum } from '@/utils/as-enum';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const haircolor = asEnum<HairColor>(searchParams.get('haircolor'), [
      'black',
      'brown',
      'blonde',
    ]);
    const ethnicity = asEnum<Ethnicity>(searchParams.get('ethnicity'), [
      'asian',
      'black',
      'white',
      'brown',
    ]);
    const sex = asEnum<Sex>(searchParams.get('sex'), ['male', 'female']);
    const length = asEnum<Length>(searchParams.get('length'), [
      'short',
      'medium',
      'long',
    ]);
    // Parse optional parameters - invalid values are simply ignored
    const maxRecordsParam = searchParams.get('maxRecords');
    const maxRecords =
      maxRecordsParam && !isNaN(Number(maxRecordsParam))
        ? Math.min(100, Math.max(1, Number(maxRecordsParam)))
        : undefined;

    const params: GetReferenceStylesParams = {};
    if (maxRecords !== undefined) params.maxRecords = maxRecords;
    if (haircolor !== null) params.haircolor = haircolor;
    if (ethnicity !== null) params.ethnicity = ethnicity;
    if (sex !== null) params.sex = sex;
    if (length !== null) params.length = length;

    const data = await getReferenceStyles(params);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('get-hairstyles route error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
