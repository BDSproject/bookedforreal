import { useMutation } from "@tanstack/react-query";

import { apiFetch, clearAccessToken, setAccessToken } from "@/lib/api";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
  salonName: string;
}

/** Logs in and stores the access token in SecureStore. */
export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiFetch<{ accessToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async (data) => {
      await setAccessToken(data.accessToken);
    },
  });
}

/** Registers a salon owner account. */
export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

/** Clears the stored access token. */
export function useLogout() {
  return async () => {
    await clearAccessToken();
  };
}
