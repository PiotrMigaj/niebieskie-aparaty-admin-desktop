<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const currentRoute = computed(() => route.name as string);

function navigate(name: string) {
  router.push({ name });
}
</script>

<template>
  <nav class="navbar navbar-custom d-flex justify-content-between align-items-center">
    <div class="d-flex align-items-center gap-4">
      <span class="navbar-brand">NIEBIESKIE APARATY</span>
      <div class="d-flex gap-2" style="-webkit-app-region: no-drag;">
        <button
          class="nav-link-custom"
          :class="{ active: currentRoute === 'upload' }"
          @click="navigate('upload')"
        >
          Upload
        </button>
        <button
          class="nav-link-custom"
          :class="{ active: currentRoute === 'selection' }"
          @click="navigate('selection')"
        >
          Selection
        </button>
      </div>
    </div>
  </nav>
</template>
