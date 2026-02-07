import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storage } from '@/lib/storage';
import { Profile, UserSettings, SaveProfilePayload, SaveVacationPayload } from '@/lib/types';

export const PROFILE_KEYS = {
  all: ['profiles'] as const,
  settings: ['settings'] as const,
};

export const useProfilesQuery = () =>
  useQuery<Profile[]>({
    queryKey: PROFILE_KEYS.all,
    queryFn: () => storage.getProfiles(),
  });

export const useSettingsQuery = () =>
  useQuery<UserSettings>({
    queryKey: PROFILE_KEYS.settings,
    queryFn: () => storage.getSettings(),
  });

const invalidateProfiles = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.all });
};

export const useCreateProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveProfilePayload) => storage.createProfile(payload),
    onSuccess: () => invalidateProfiles(queryClient),
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaveProfilePayload }) => storage.updateProfile(id, payload),
    onSuccess: () => invalidateProfiles(queryClient),
  });
};

export const useDeleteProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storage.deleteProfile(id),
    onSuccess: () => invalidateProfiles(queryClient),
  });
};

export const useCreateVacationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveVacationPayload) => storage.createVacation(payload),
    onSuccess: () => invalidateProfiles(queryClient),
  });
};

export const useUpdateVacationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Omit<SaveVacationPayload, 'profileId'> }) =>
      storage.updateVacation(id, payload),
    onSuccess: () => invalidateProfiles(queryClient),
  });
};

export const useDeleteVacationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storage.deleteVacation(id),
    onSuccess: () => invalidateProfiles(queryClient),
  });
};

export const useUpdateSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserSettings) => storage.updateSettings(payload),
    onSuccess: (data) => {
      queryClient.setQueryData<UserSettings>(PROFILE_KEYS.settings, data);
    },
  });
};
