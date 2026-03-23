export type MeasurementUnit = 'inches' | 'cm'

export const DEFAULT_MEASUREMENT_UNIT: MeasurementUnit = 'inches'

export const MEASUREMENT_UNITS: Array<{ value: MeasurementUnit; label: string }> = [
  { value: 'inches', label: 'Inches (in)' },
  { value: 'cm', label: 'Centimeters (cm)' },
]

export function normalizeMeasurementUnit(value: string | null | undefined): MeasurementUnit {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'cm' || normalized === 'centimeter' || normalized === 'centimeters') {
    return 'cm'
  }
  if (normalized === 'inch' || normalized === 'inches' || normalized === 'in') {
    return 'inches'
  }
  return DEFAULT_MEASUREMENT_UNIT
}

export function measurementUnitLabel(unit: MeasurementUnit): string {
  return unit === 'cm' ? 'centimeters' : 'inches'
}

export function measurementUnitSuffix(unit: MeasurementUnit): string {
  return unit === 'cm' ? 'cm' : 'in'
}
