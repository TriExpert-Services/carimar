import { supabase } from '../lib/supabase';
import { LocationType } from '../types';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(new Error(`Error getting location: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

export const recordBookingLocation = async (
  bookingId: string,
  locationType: LocationType
): Promise<{ success: boolean; error?: string }> => {
  try {
    const location = await getCurrentLocation();

    const { error } = await supabase.from('booking_locations').insert([
      {
        booking_id: bookingId,
        location_type: locationType,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        recorded_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Error recording location:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error getting location:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getBookingLocations = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('booking_locations')
    .select('*')
    .eq('booking_id', bookingId)
    .order('recorded_at', { ascending: true });

  if (error) {
    console.error('Error fetching booking locations:', error);
    return [];
  }

  return data || [];
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

export const getDistanceFromAddress = async (
  location: LocationData,
  address: string
): Promise<number | null> => {
  try {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json&limit=1`;

    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data && data.length > 0) {
      const addressLat = parseFloat(data[0].lat);
      const addressLon = parseFloat(data[0].lon);
      return calculateDistance(
        location.latitude,
        location.longitude,
        addressLat,
        addressLon
      );
    }

    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};
