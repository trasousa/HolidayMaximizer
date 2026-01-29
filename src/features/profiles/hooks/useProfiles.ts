import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProfile,
  createVacation,
  deleteProfile,
  deleteVacationRequest,
  fetchProfiles,
  fetchSettings,
  SaveProfilePayload,
  SaveVacationPayload,
  updateProfile,
  updateVacationRequest,
  updateSettingsRequest,
} from '@/features/profiles/api/profileApi';
import { Profile, UserSettings } from '@/lib/types';

export const PROFILE_KEYS = {
  all: ['profiles'] as const,
  settings: ['settings'] as const,
};

export const useProfilesQuery = () =>
  useQuery<Profile[]>({
    queryKey: PROFILE_KEYS.all,
    queryFn: fetchProfiles,
  });

export const useSettingsQuery = () =>
  useQuery<UserSettings>({
    queryKey: PROFILE_KEYS.settings,
    queryFn: fetchSettings,
  });

const invalidateProfiles = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.all });
};

export const useCreateProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveProfilePayload) => createProfile(payload),
    onSuccess: () => invalidateProfiles(queryClient),
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaveProfilePayload }) => updateProfile(id, payload),
    onSuccess: () => invalidateProfiles(queryClient),
  });
};

export const useDeleteProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProfile(id),
    onSuccess: () => invalidateProfiles(queryClient),
  });
};

export const useCreateVacationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveVacationPayload) => createVacation(payload),
    onSuccess: () => invalidateProfiles(queryClient),
  });
};

export const useUpdateVacationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Omit<SaveVacationPayload, 'profileId'> }) =>
      updateVacationRequest(id, payload),
    onSuccess: () => invalidateProfiles(queryClient),
  });
};

export const useDeleteVacationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVacationRequest(id),
    onSuccess: () => invalidateProfiles(queryClient),
  });
};

export const useUpdateSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserSettings) => updateSettingsRequest(payload),
    onSuccess: (data) => {
      queryClient.setQueryData<UserSettings>(PROFILE_KEYS.settings, data);
    },
  });
};
