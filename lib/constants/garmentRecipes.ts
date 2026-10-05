export interface GarmentRecipeStep {
  title: string
  stageName: 'Cutting' | 'Sewing' | 'Fitting' | 'Finishing' | 'Quality check'
  estimatedMinutes: number
  suggestedRole?: string
  notes?: string
}

export interface GarmentRecipe {
  id: string
  name: string
  category: 'Traditional / Native' | "Women's Fashion" | 'Casual / Alterations'
  description: string
  badge: string
  iconEmoji: string
  estimatedTotalMinutes: number
  steps: GarmentRecipeStep[]
}

export const GARMENT_RECIPES: GarmentRecipe[] = [
  // Traditional / Native
  {
    id: 'agbada_3pc',
    name: 'Agbada (3-Piece)',
    category: 'Traditional / Native',
    description: 'Grand Agbada with matching inner Kaftan top and tailored trousers',
    badge: 'Luxury Native',
    iconEmoji: '👑',
    estimatedTotalMinutes: 270, // 4.5h
    steps: [
      {
        title: 'Draft & cut Agbada body, inner Kaftan & trouser panels',
        stageName: 'Cutting',
        estimatedMinutes: 60,
        suggestedRole: 'Master Cutter',
        notes: 'Check client sleeve span and floor drop height',
      },
      {
        title: 'Stitch inner Kaftan bodice, neck facing & side slits',
        stageName: 'Sewing',
        estimatedMinutes: 60,
        suggestedRole: 'Tailor',
        notes: 'Reinforce armhole joints',
      },
      {
        title: 'Assemble trousers: side pockets, fly zipper & waistband',
        stageName: 'Sewing',
        estimatedMinutes: 45,
        suggestedRole: 'Tailor',
        notes: 'Include waist adjusters / elastic channel if requested',
      },
      {
        title: 'Agbada neckline motif & grand chest embroidery stitching',
        stageName: 'Sewing',
        estimatedMinutes: 60,
        suggestedRole: 'Embroiderer',
        notes: 'Ensure backing tearaway is fully clean',
      },
      {
        title: 'Client fitting session: sleeve drape & trouser length check',
        stageName: 'Fitting',
        estimatedMinutes: 20,
        suggestedRole: 'Master Tailor',
        notes: 'Verify Agbada balance on client shoulders',
      },
      {
        title: 'Hand hemming, thread trimming & heavy steam press',
        stageName: 'Finishing',
        estimatedMinutes: 25,
        suggestedRole: 'Finisher',
        notes: 'Package in luxury garment suit carrier',
      },
    ],
  },
  {
    id: 'senator_suit',
    name: 'Senator Suit',
    category: 'Traditional / Native',
    description: 'Contemporary Nigerian Senator top with custom placket and tailored trousers',
    badge: 'Popular Native',
    iconEmoji: '👔',
    estimatedTotalMinutes: 165, // 2.75h
    steps: [
      {
        title: 'Cut Senator shirt panels, mandarin collar & trouser legs',
        stageName: 'Cutting',
        estimatedMinutes: 40,
        suggestedRole: 'Master Cutter',
      },
      {
        title: 'Construct chest placket, pocket piping & contrast detail',
        stageName: 'Sewing',
        estimatedMinutes: 45,
        suggestedRole: 'Tailor',
      },
      {
        title: 'Assemble trousers & join shirt shoulders, sleeves and hem',
        stageName: 'Sewing',
        estimatedMinutes: 50,
        suggestedRole: 'Tailor',
      },
      {
        title: 'Client fitting: collar comfort & trouser break over shoes',
        stageName: 'Fitting',
        estimatedMinutes: 15,
        suggestedRole: 'Fitter',
      },
      {
        title: 'Button holes, press cuffs & crisp crease line',
        stageName: 'Finishing',
        estimatedMinutes: 15,
        suggestedRole: 'Finisher',
      },
    ],
  },
  {
    id: 'kaftan',
    name: 'Classic Kaftan',
    category: 'Traditional / Native',
    description: 'Traditional bespoke Kaftan with clean neckline and side vents',
    badge: 'Essential',
    iconEmoji: '✨',
    estimatedTotalMinutes: 120, // 2h
    steps: [
      {
        title: 'Cut front/back Kaftan body, sleeves & pocket facing',
        stageName: 'Cutting',
        estimatedMinutes: 30,
        suggestedRole: 'Master Cutter',
      },
      {
        title: 'Stitch neckline detailing, front placket & set sleeves',
        stageName: 'Sewing',
        estimatedMinutes: 45,
        suggestedRole: 'Tailor',
      },
      {
        title: 'Stitch side slits, trouser assembly & cuff finish',
        stageName: 'Sewing',
        estimatedMinutes: 30,
        suggestedRole: 'Tailor',
      },
      {
        title: 'Fitting check & final workshop steam press',
        stageName: 'Fitting',
        estimatedMinutes: 15,
        suggestedRole: 'Finisher',
      },
    ],
  },

  // Women's Fashion
  {
    id: 'corset_dress',
    name: 'Corset Dress / Aso-Ebi',
    category: "Women's Fashion",
    description: 'Veekee James-style structured corset with bone channels, bra cups & draped luxury skirt',
    badge: 'High Fashion',
    iconEmoji: '👗',
    estimatedTotalMinutes: 360, // 6h
    steps: [
      {
        title: 'Pattern drafting, muslin toile & luxury fabric cutting',
        stageName: 'Cutting',
        estimatedMinutes: 60,
        suggestedRole: 'Master Cutter',
        notes: 'Double check underbust, waist and high hip reduction',
      },
      {
        title: 'Corset construction: plastic/spiral boning, cup molds & internal fusing',
        stageName: 'Sewing',
        estimatedMinutes: 90,
        suggestedRole: 'Senior Seamstress',
        notes: 'Reinforce waist tape for maximum cinch support',
      },
      {
        title: 'Drape skirt, insert invisible zipper & attach bodice',
        stageName: 'Sewing',
        estimatedMinutes: 90,
        suggestedRole: 'Senior Seamstress',
      },
      {
        title: 'First client fitting: verify corset cinch, bust cups & skirt silhouette',
        stageName: 'Fitting',
        estimatedMinutes: 30,
        suggestedRole: 'Creative Director',
      },
      {
        title: 'Hand beading, lace appliqué placement & invisible hem finish',
        stageName: 'Finishing',
        estimatedMinutes: 60,
        suggestedRole: 'Finisher / Beader',
      },
      {
        title: 'Final fitting check, lint removal & delicate garment press',
        stageName: 'Quality check',
        estimatedMinutes: 30,
        suggestedRole: 'Creative Director',
      },
    ],
  },
  {
    id: 'bridal_gown',
    name: 'Bridal Gown',
    category: "Women's Fashion",
    description: 'High-couture wedding gown with cathedral train, structured bodice and hand appliqué',
    badge: 'Couture',
    iconEmoji: '👰',
    estimatedTotalMinutes: 600, // 10h
    steps: [
      {
        title: 'Bridal drafting, pattern grading & muslin mock-up fitting',
        stageName: 'Cutting',
        estimatedMinutes: 90,
        suggestedRole: 'Master Cutter',
      },
      {
        title: 'Cut silk satin, tulle layers & crinoline understructure',
        stageName: 'Cutting',
        estimatedMinutes: 90,
        suggestedRole: 'Master Cutter',
      },
      {
        title: 'Couture bodice assembly with double boning & cup framing',
        stageName: 'Sewing',
        estimatedMinutes: 120,
        suggestedRole: 'Senior Seamstress',
      },
      {
        title: 'Assemble skirt, petticoats, bustle & cathedral train',
        stageName: 'Sewing',
        estimatedMinutes: 120,
        suggestedRole: 'Senior Seamstress',
      },
      {
        title: 'Bridal fitting 1: structure, hem height with wedding heels',
        stageName: 'Fitting',
        estimatedMinutes: 45,
        suggestedRole: 'Creative Director',
      },
      {
        title: 'Couture crystal hand beading, 3D floral lace & pearl buttons',
        stageName: 'Finishing',
        estimatedMinutes: 105,
        suggestedRole: 'Embroiderer',
      },
      {
        title: 'Final bridal reveal fitting & bridal garment bag boxing',
        stageName: 'Quality check',
        estimatedMinutes: 30,
        suggestedRole: 'Creative Director',
      },
    ],
  },
  {
    id: 'blouse_wrapper',
    name: 'Blouse & Double Wrapper',
    category: "Women's Fashion",
    description: 'Traditional George or corded lace blouse with statement sleeves & tailored twin wrappers',
    badge: 'Traditional Ceremony',
    iconEmoji: '💃',
    estimatedTotalMinutes: 180, // 3h
    steps: [
      {
        title: 'Cut blouse pattern, scalloped lace border & soft cotton lining',
        stageName: 'Cutting',
        estimatedMinutes: 45,
        suggestedRole: 'Master Cutter',
      },
      {
        title: 'Stitch blouse lining, bust darts & side seam zipper',
        stageName: 'Sewing',
        estimatedMinutes: 60,
        suggestedRole: 'Tailor',
      },
      {
        title: 'Construct statement sleeves (flute or puff) & neck embellishment',
        stageName: 'Sewing',
        estimatedMinutes: 45,
        suggestedRole: 'Tailor',
      },
      {
        title: 'Client fitting & wrapper edge fringe / bead finishing',
        stageName: 'Fitting',
        estimatedMinutes: 15,
        suggestedRole: 'Fitter',
      },
      {
        title: 'Final steam press & ceremonial wrapper packaging',
        stageName: 'Finishing',
        estimatedMinutes: 15,
        suggestedRole: 'Finisher',
      },
    ],
  },
  {
    id: 'jumpsuit',
    name: 'Tailored Jumpsuit',
    category: "Women's Fashion",
    description: 'Bespoke one-piece jumpsuit with tailored collar, waist sash & wide-leg palazzo trousers',
    badge: 'Chic Atelier',
    iconEmoji: '👖',
    estimatedTotalMinutes: 210, // 3.5h
    steps: [
      {
        title: 'Draft & cut bodice, waist contour band and palazzo legs',
        stageName: 'Cutting',
        estimatedMinutes: 45,
        suggestedRole: 'Master Cutter',
      },
      {
        title: 'Construct bodice with facing, shoulder pads & slant pockets',
        stageName: 'Sewing',
        estimatedMinutes: 60,
        suggestedRole: 'Tailor',
      },
      {
        title: 'Join bodice to trousers & insert long back invisible zipper',
        stageName: 'Sewing',
        estimatedMinutes: 60,
        suggestedRole: 'Tailor',
      },
      {
        title: 'Client fitting: crotch depth, waist fit & shoe heel height',
        stageName: 'Fitting',
        estimatedMinutes: 25,
        suggestedRole: 'Fitter',
      },
      {
        title: 'Hem trouser legs, press sharp lapels & final inspection',
        stageName: 'Finishing',
        estimatedMinutes: 20,
        suggestedRole: 'Finisher',
      },
    ],
  },

  // Casual / Alterations
  {
    id: 'trouser_hemming',
    name: 'Trouser Hemming & Tapering',
    category: 'Casual / Alterations',
    description: 'Quick alterations: adjust length, taper leg width, blind stitch',
    badge: 'Fast Turnaround',
    iconEmoji: '✂️',
    estimatedTotalMinutes: 35,
    steps: [
      {
        title: 'Pin client length at shoe break & chalk cutting guide',
        stageName: 'Cutting',
        estimatedMinutes: 10,
        suggestedRole: 'Tailor',
      },
      {
        title: 'Trim excess fabric, press fold & machine blind hem',
        stageName: 'Sewing',
        estimatedMinutes: 15,
        suggestedRole: 'Tailor',
      },
      {
        title: 'Press leg creases with heavy iron & package',
        stageName: 'Finishing',
        estimatedMinutes: 10,
        suggestedRole: 'Finisher',
      },
    ],
  },
  {
    id: 'jacket_alteration',
    name: 'Jacket / Dress Fitting Adjustment',
    category: 'Casual / Alterations',
    description: 'Take in waist seams, adjust shoulders, shorten sleeve length',
    badge: 'Alteration',
    iconEmoji: '🪡',
    estimatedTotalMinutes: 50,
    steps: [
      {
        title: 'Pin client adjustments & unpick inner lining seams',
        stageName: 'Fitting',
        estimatedMinutes: 15,
        suggestedRole: 'Master Tailor',
      },
      {
        title: 'Take in side seams, re-shape & machine stitch lining closed',
        stageName: 'Sewing',
        estimatedMinutes: 25,
        suggestedRole: 'Tailor',
      },
      {
        title: 'Steam chest roll, press seams flat & quality check',
        stageName: 'Finishing',
        estimatedMinutes: 10,
        suggestedRole: 'Finisher',
      },
    ],
  },
]
