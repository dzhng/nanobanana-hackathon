import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  'appnWTqohZv1Ivyez',
);

export type HairColor = 'black' | 'brown' | 'blonde';
export type Ethnicity = 'asian' | 'black' | 'white' | 'brown';
export type Sex = 'male' | 'female';
export type Length = 'short' | 'medium' | 'long';

export type ReferenceStyle = {
  imageUrl: string;
  name: string;
  haircolor: HairColor;
  ethnicity: Ethnicity;
  sex: Sex;
  length: Length;
  externalLink?: string;
};

export type GetReferenceStylesParams = {
  haircolor?: HairColor;
  ethnicity?: Ethnicity;
  sex?: Sex;
  length?: Length;
  maxRecords?: number;
};

function buildFilterFormula(params: GetReferenceStylesParams): string {
  const conditions: string[] = [`NOT({Photo} = BLANK())`, `NOT({Name} = '')`];

  if (params.sex) {
    conditions.push(`LOWER({Sex})='${params.sex}'`);
  }
  if (params.ethnicity) {
    conditions.push(`LOWER({Ethnicity})='${params.ethnicity}'`);
  }
  if (params.haircolor) {
    conditions.push(`LOWER({Hair Color})='${params.haircolor}'`);
  }
  if (params.length) {
    conditions.push(`LOWER({Length})='${params.length}'`);
  }

  return `AND(${conditions.join(',')})`;
}

export async function getReferenceStyles({
  maxRecords = 20,
  ...params
}: GetReferenceStylesParams): Promise<ReferenceStyle[]> {
  const filterByFormula = buildFilterFormula(params);

  const records = await base('Main')
    .select({
      maxRecords,
      view: 'Grid view',
      filterByFormula,
      fields: [
        'Name',
        'Photo',
        'Length',
        'Sex',
        'Ethnicity',
        'Hair Color',
        'External Link',
      ],
    })
    .all();

  return records
    .map(record => {
      const name = (record.get('Name') as string) || '';
      const attachments =
        (record.get('Photo') as { url: string }[] | undefined) || [];
      const imageUrl = attachments[0]?.url || '';
      const length = String(record.get('Length') || '').toLowerCase() as Length;
      const sex = String(record.get('Sex') || '').toLowerCase() as Sex;
      const ethnicity = String(
        record.get('Ethnicity') || '',
      ).toLowerCase() as Ethnicity;
      const haircolor = String(
        record.get('Hair Color') || '',
      ).toLowerCase() as HairColor;
      const externalLink =
        (record.get('External Link') as string | undefined) || undefined;

      if (!imageUrl || !name) {
        return null;
      }

      return {
        imageUrl,
        name,
        haircolor,
        ethnicity,
        sex,
        length,
        externalLink,
      } as ReferenceStyle;
    })
    .filter((v): v is ReferenceStyle => v !== null);
}
