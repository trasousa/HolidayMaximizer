import { apiRequest } from '@/lib/api/client';
import { Profile, Vacation, UserSettings } from '@/lib/types';

export const fetchProfiles = () => apiRequest<Profile[]>('/profiles');

export interface SaveProfilePayload {
  id?: string;
  name: string;
  avatar: string;
  color: string;
  country: string;
  city: string;
  isoCountryCode?: string;
  isoRegionCode?: string;
  totalAllowance: number;
}

export const createProfile = (payload: SaveProfilePayload) => apiRequest<Profile>('/profiles', {
  method: 'POST',
  json: payload,
});

export const updateProfile = (id: string, payload: SaveProfilePayload) =>
  apiRequest<Profile>(`/profiles/${id}`, {
    method: 'PUT',
    json: payload,
  });

export const deleteProfile = (id: string) =>
  apiRequest<void>(`/profiles/${id}`, {
    method: 'DELETE',
  });

export interface SaveVacationPayload {
  id?: string;
  profileId: string;
  startDate: string;
  endDate: string;
  type: Vacation['type'];
  commuteHours: number;
  note?: string;
}

export const createVacation = (payload: SaveVacationPayload) =>
  apiRequest<Vacation>('/vacations', {
    method: 'POST',
    json: payload,
  });

export const updateVacationRequest = (id: string, payload: Omit<SaveVacationPayload, 'profileId'>) =>
  apiRequest<Vacation>(`/vacations/${id}`, {
    method: 'PUT',
    json: payload,
  });

export const deleteVacationRequest = (id: string) =>
  apiRequest<void>(`/vacations/${id}`, { method: 'DELETE' });

export const fetchSettings = () => apiRequest<UserSettings>('/settings');

export const updateSettingsRequest = (payload: UserSettings) =>
  apiRequest<UserSettings>('/settings', { method: 'PUT', json: payload });
