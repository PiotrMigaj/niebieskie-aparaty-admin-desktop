<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Modal } from 'bootstrap';
import type { Event } from '../types';
import { electronApi } from '../services/electronApi';

const emit = defineEmits<{
  select: [event: Event];
}>();

const modalEl = ref<HTMLElement | null>(null);
let modalInstance: Modal | null = null;

const events = ref<Event[]>([]);
const loading = ref(false);
const error = ref('');

function show() {
  fetchEvents();
  modalInstance?.show();
}

function hide() {
  modalInstance?.hide();
}

defineExpose({ show, hide });

async function fetchEvents() {
  loading.value = true;
  error.value = '';
  try {
    events.value = await electronApi.getEvents();
  } catch (err) {
    error.value = formatError(err);
  } finally {
    loading.value = false;
  }
}

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
  if (msg.includes('NetworkingError') || msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
    return 'Network error. Check your internet connection and AWS region.';
  }
  return msg.replace(/^Error:\s*/, '');
}

function chooseEvent(event: Event) {
  emit('select', event);
}

onMounted(() => {
  if (modalEl.value) {
    modalInstance = new Modal(modalEl.value);
  }
});
</script>

<template>
  <div class="modal fade" ref="modalEl" tabindex="-1" aria-labelledby="eventModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="eventModalLabel">Select Event</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="hide"></button>
        </div>
        <div class="modal-body">
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <div v-else-if="error" class="alert alert-danger d-flex align-items-start gap-2">
            <i class="bi bi-exclamation-triangle-fill flex-shrink-0 mt-1"></i>
            <div>
              <strong>Failed to load events</strong><br>
              {{ error }}
              <div class="mt-2">
                <button class="btn btn-sm btn-outline-danger" @click="fetchEvents">
                  <i class="bi bi-arrow-clockwise me-1"></i>Retry
                </button>
              </div>
            </div>
          </div>
          <div v-else-if="events.length === 0" class="text-center text-muted py-4">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            No events found
          </div>
          <ul v-else class="list-group">
            <li
              v-for="event in events"
              :key="event.event_id"
              class="list-group-item"
              style="cursor: pointer;"
              @click="chooseEvent(event)"
            >
              <strong>{{ event.title }}</strong><br>
              <small>ID: {{ event.event_id }}</small><br>
              <small>User: {{ event.username }}</small><br>
              <small>Date: {{ event.date }}</small>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
