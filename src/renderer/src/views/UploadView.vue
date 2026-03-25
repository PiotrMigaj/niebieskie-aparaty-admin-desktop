<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { electronApi } from '../services/electronApi';
import NavBar from '../components/NavBar.vue';
import EventModal from '../components/EventModal.vue';
import type { Event, FileEntry } from '../types';

const eventId = ref('');
const username = ref('');
const batchSize = ref(1);
const files = ref<FileEntry[]>([]);
const message = ref('');
const success = ref(false);
const uploading = ref(false);
const uploadTime = ref<string | null>(null);
const eventModalRef = ref<InstanceType<typeof EventModal> | null>(null);

function formatError(err: unknown): string {
  const msg = String(err);
  if (msg.includes('InvalidClientTokenId') || msg.includes('InvalidAccessKeyId')) {
    return 'Invalid AWS credentials. Check your Access Key ID in the .env file.';
  }
  if (msg.includes('SignatureDoesNotMatch')) {
    return 'AWS Secret Key is incorrect. Check your Secret Access Key in the .env file.';
  }
  if (msg.includes('ExpiredToken')) {
    return 'AWS credentials have expired. Please refresh your credentials.';
  }
  if (msg.includes('ResourceNotFoundException')) {
    return 'DynamoDB table not found. Check your AWS region and table names.';
  }
  if (msg.includes('NoSuchBucket') || msg.includes('NoSuchKey')) {
    return 'S3 bucket not found. Check your bucket name in the .env file.';
  }
  if (msg.includes('NetworkingError') || msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
    return 'Network error. Check your internet connection and AWS region.';
  }
  return msg.replace(/^Error:\s*/, '');
}

const overallProgress = computed(() => {
  if (files.value.length === 0) return 0;
  const total = files.value.reduce((sum, f) => sum + f.progress, 0);
  return total / files.value.length;
});

onMounted(() => {
  electronApi.onUploadProgress(({ filePath, progress }) => {
    const file = files.value.find((f) => f.path === filePath);
    if (file) {
      file.progress = progress;
    }
  });
});

onUnmounted(() => {
  electronApi.removeUploadProgressListener();
});

function selectEvent() {
  eventModalRef.value?.show();
}

function chooseEvent(event: Event) {
  eventId.value = event.event_id;
  username.value = event.username;
  eventModalRef.value?.hide();
}

async function chooseFiles() {
  const paths = await electronApi.selectFiles();
  if (paths && paths.length > 0) {
    files.value = paths.map((p) => ({
      path: p,
      name: p.split('/').pop() || p.split('\\').pop() || p,
      progress: 0,
      status: 'pending' as const,
    }));
  }
}

async function uploadFiles() {
  if (!eventId.value || !username.value || files.value.length === 0) {
    message.value = 'Event ID, Username, and at least one file are required.';
    success.value = false;
    return;
  }

  if (batchSize.value < 1) {
    message.value = 'Batch size must be at least 1.';
    success.value = false;
    return;
  }

  uploading.value = true;
  message.value = '';
  uploadTime.value = null;

  const startTime = performance.now();

  try {
    for (let i = 0; i < files.value.length; i += batchSize.value) {
      const batch = files.value.slice(i, i + batchSize.value);
      await Promise.all(
        batch.map(async (file) => {
          file.status = 'uploading';
          file.progress = 0;
          try {
            await electronApi.uploadFile(file.path, eventId.value, username.value);
            file.progress = 100;
            file.status = 'done';
          } catch (err) {
            file.status = 'error';
            file.error = formatError(err);
            throw err;
          }
        }),
      );
    }

    await electronApi.completeUpload(eventId.value, files.value.length);

    const endTime = performance.now();
    uploadTime.value = ((endTime - startTime) / 1000).toFixed(2);
    message.value = 'All files uploaded successfully.';
    success.value = true;
    files.value = [];
  } catch (err) {
    message.value = formatError(err);
    success.value = false;
  } finally {
    uploading.value = false;
  }
}
</script>

<template>
  <NavBar />

  <div class="container py-4">
    <div class="row g-3 align-items-end">
      <div class="col-md-4">
        <label for="eventId" class="form-label">Event ID</label>
        <input type="text" id="eventId" class="form-control" v-model="eventId" placeholder="Enter Event ID">
      </div>
      <div class="col-md-4">
        <label for="username" class="form-label">Username</label>
        <input type="text" id="username" class="form-control" v-model="username" placeholder="Enter Username">
      </div>
      <div class="col-md-2">
        <label for="batchSize" class="form-label">Batch Size</label>
        <input type="number" id="batchSize" class="form-control" v-model.number="batchSize" min="1">
      </div>
      <div class="col-md-2">
        <label class="form-label d-block invisible">Action</label>
        <button class="btn btn-dark w-100" @click="selectEvent">
          <i class="bi bi-check-circle me-1"></i>Select
        </button>
      </div>
    </div>
  </div>

  <div class="container py-4">
    <div class="row mb-3">
      <div class="col">
        <label class="form-label">Select Images</label>
        <button class="btn btn-outline-secondary w-100" @click="chooseFiles">
          <i class="bi bi-folder2-open me-2"></i>
          {{ files.length > 0 ? `${files.length} file(s) selected` : 'Choose Files...' }}
        </button>
      </div>
    </div>

    <div class="row mb-3" v-if="files.length">
      <div class="col">
        <ul class="list-group">
          <li
            v-for="file in files"
            :key="file.path"
            class="list-group-item d-flex justify-content-between align-items-center"
          >
            <span :class="{ 'text-danger': file.status === 'error', 'text-success': file.status === 'done' }">
              {{ file.name }}
              <small v-if="file.error" class="d-block text-danger">{{ file.error }}</small>
            </span>
            <div class="progress w-50">
              <div
                class="progress-bar"
                :class="{ 'bg-danger': file.status === 'error', 'bg-success': file.status === 'done' }"
                :style="{ width: file.progress + '%' }"
              >
                {{ Math.round(file.progress) }}%
              </div>
            </div>
          </li>
        </ul>
        <div class="mt-3">
          <strong>Overall Progress:</strong>
          <div class="progress">
            <div class="progress-bar bg-success" :style="{ width: overallProgress + '%' }">
              {{ Math.round(overallProgress) }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col text-end">
        <button class="btn btn-primary" :disabled="uploading || files.length === 0" @click="uploadFiles">
          <i class="bi bi-cloud-upload me-1"></i> Upload to Cloud
        </button>
      </div>
    </div>

    <div class="row mt-3" v-if="message">
      <div class="col">
        <div class="alert" :class="success ? 'alert-success' : 'alert-danger'">
          {{ message }}
          <div v-if="success && uploadTime">Upload took {{ uploadTime }} seconds.</div>
        </div>
      </div>
    </div>
  </div>

  <EventModal ref="eventModalRef" @select="chooseEvent" />
</template>
