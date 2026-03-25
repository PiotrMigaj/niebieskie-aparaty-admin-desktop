import { ref, computed } from 'vue';
import { electronApi } from '../services/electronApi';

const loggedInUser = ref<string | null>(null);

export function useAuth() {
  const isLoggedIn = computed(() => loggedInUser.value !== null);

  async function login(email: string, password: string): Promise<void> {
    loggedInUser.value = await electronApi.login(email, password);
  }

  async function logout(): Promise<void> {
    await electronApi.logout();
    loggedInUser.value = null;
  }

  return { loggedInUser, isLoggedIn, login, logout };
}
