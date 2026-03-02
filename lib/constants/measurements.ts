export type MeasurementDefinition = {
  key: string
  label: string
  category: string
}

export const STANDARD_MEASUREMENTS: MeasurementDefinition[] = [
  { key: 'chest', label: 'Chest / Bust', category: 'Upper Body' },
  { key: 'under_bust', label: 'Under Bust', category: 'Upper Body' },
  { key: 'waist', label: 'Waist', category: 'Upper Body' },
  { key: 'hip', label: 'Hip', category: 'Lower Body' },
  { key: 'neck', label: 'Neck', category: 'Upper Body' },
  { key: 'shoulder_width', label: 'Shoulder Width', category: 'Upper Body' },
  { key: 'across_back', label: 'Across Back', category: 'Upper Body' },
  { key: 'across_chest', label: 'Across Chest', category: 'Upper Body' },
  { key: 'back_length', label: 'Back Length', category: 'Upper Body' },
  { key: 'front_length', label: 'Front Length', category: 'Upper Body' },
  { key: 'sleeve_length', label: 'Sleeve Length', category: 'Arms' },
  { key: 'upper_arm', label: 'Upper Arm / Bicep', category: 'Arms' },
  { key: 'elbow', label: 'Elbow', category: 'Arms' },
  { key: 'wrist', label: 'Wrist', category: 'Arms' },
  { key: 'armhole_depth', label: 'Armhole Depth', category: 'Arms' },
  { key: 'inseam', label: 'Inseam', category: 'Lower Body' },
  { key: 'outseam', label: 'Outseam', category: 'Lower Body' },
  { key: 'thigh', label: 'Thigh', category: 'Lower Body' },
  { key: 'knee', label: 'Knee', category: 'Lower Body' },
  { key: 'calf', label: 'Calf', category: 'Lower Body' },
  { key: 'ankle', label: 'Ankle', category: 'Lower Body' },
  { key: 'rise', label: 'Rise (Crotch Depth)', category: 'Lower Body' },
  { key: 'trouser_length', label: 'Trouser Length', category: 'Lower Body' },
  { key: 'skirt_length', label: 'Skirt Length', category: 'Lower Body' },
  { key: 'dress_length', label: 'Dress Length', category: 'Lower Body' },
  { key: 'height', label: 'Height', category: 'Full Body' },
  { key: 'full_length', label: 'Full Length', category: 'Full Body' },
  { key: 'waist_to_floor', label: 'Waist to Floor', category: 'Full Body' },
  { key: 'waist_to_knee', label: 'Waist to Knee', category: 'Full Body' },
  { key: 'nape_to_waist', label: 'Nape to Waist', category: 'Full Body' },
  { key: 'shoulder_to_waist', label: 'Shoulder to Waist', category: 'Full Body' },
]

export const STANDARD_MEASUREMENT_LABELS = new Map(
  STANDARD_MEASUREMENTS.map((measurement) => [measurement.key, measurement.label]),
)
