export interface Instrument {
    displayName: string;
}

export interface SolarFlareEvent {
    flrID: string;
    beginTime: string;
    peakTime?: string;
    endTime?: string;
    classType: string;
    sourceLocation: string;
    activeRegionNum?: number;
    instruments?: Instrument[];
}
export interface SolarHeliographicCoordinates {
    lat: number;
    lon: number;
}

export interface MonthlyFlareCache {
  flareDates: string[];
  data: SolarFlareEvent[];
  savedAt: number;
}