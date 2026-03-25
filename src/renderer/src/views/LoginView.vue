<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { login } = useAuth();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await login(email.value, password.value);
    router.push({ name: 'upload' });
  } catch {
    error.value = 'Invalid username or password';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 2rem;">
    <div class="login-container">
      <h1 class="brand-text">IMAGE UPLOADER</h1>
      <h2 class="login-title">Admin Login</h2>
      <p class="login-subtitle">Please sign in to access your dashboard</p>

      <div v-if="error" class="alert alert-danger text-center" role="alert">
        <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="mb-3">
          <input
            type="text"
            class="form-control"
            v-model="email"
            placeholder="Username"
            required
            style="border: none; border-bottom: 1px solid #ddd; border-radius: 0; padding: 15px 0; font-weight: 300;"
          >
        </div>
        <div class="mb-3">
          <input
            type="password"
            class="form-control"
            v-model="password"
            placeholder="Password"
            required
            style="border: none; border-bottom: 1px solid #ddd; border-radius: 0; padding: 15px 0; font-weight: 300;"
          >
        </div>
        <button
          type="submit"
          class="btn btn-dark w-100 mt-3"
          :disabled="loading"
          style="letter-spacing: 2px; padding: 12px 25px; text-transform: uppercase; font-size: 0.8rem;"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
          <i v-else class="bi bi-box-arrow-in-right me-2"></i>
          Login
        </button>
      </form>
      <div class="login-footer">
        &copy; 2025 IMAGE UPLOADER. All Rights Reserved.
      </div>
    </div>
  </div>
</template>
