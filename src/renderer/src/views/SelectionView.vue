<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { electronApi } from '../services/electronApi';
import NavBar from '../components/NavBar.vue';
import type { Selection } from '../types';

const selections = ref<Selection[]>([]);
const selectedSelectionId = ref('');
const directoryPath = ref('');
const message = ref('');
const success = ref(false);
const isSubmitting = ref(false);

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

async function fetchSelections() {
  try {
    selections.value = await electronApi.getSelections();
  } catch (err) {
    message.value = formatError(err);
    success.value = false;
  }
}

function selectSelection(selectionId: string) {
  selectedSelectionId.value = selectionId;
  message.value = '';
}

function getSelectedSelection() {
  return selections.value.find((s) => s.selection_id === selectedSelectionId.value);
}

function extractDirectoryName(path: string): string {
  if (!path) return '';
  const cleanPath = path.trim().replace(/\\/g, '/');
  const parts = cleanPath.split('/').filter((part) => part.length > 0);
  return parts[parts.length - 1] || '';
}

async function browseDirectory() {
  const selected = await electronApi.selectDirectory();
  if (selected) {
    directoryPath.value = selected;
  }
}

async function submitSelection() {
  if (!selectedSelectionId.value) {
    message.value = 'Please select a selection.';
    success.value = false;
    return;
  }

  if (!directoryPath.value.trim()) {
    message.value = 'Please choose a directory.';
    success.value = false;
    return;
  }

  isSubmitting.value = true;
  message.value = '';

  try {
    const result = await electronApi.processSelection(selectedSelectionId.value, directoryPath.value.trim());

    if (result.movedFiles && result.movedFiles.length > 0) {
      const filesList = result.movedFiles.join(', ');
      message.value = `${result.message}. Moved ${result.count} files: ${filesList}`;
    } else {
      message.value = result.message || 'Selection processed successfully!';
    }
    success.value = true;

    selectedSelectionId.value = '';
    directoryPath.value = '';
  } catch (err) {
    message.value = formatError(err);
    success.value = false;
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(fetchSelections);
</script>

<template>
  <NavBar />

  <div class="container py-4">
    <div class="row mb-4">
      <div class="col">
        <h2 class="h4 mb-2">Blocked Selections</h2>
        <p class="text-muted">Select a blocked selection and choose a directory to process.</p>
      </div>
    </div>

    <div class="row mb-4">
      <div class="col">
        <div class="card selection-table">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th scope="col" class="text-center" style="width: 80px;">Select</th>
                    <th scope="col">Selection ID</th>
                    <th scope="col">Event Title</th>
                    <th scope="col">Event ID</th>
                    <th scope="col">Username</th>
                    <th scope="col" class="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="selections.length === 0">
                    <td colspan="6" class="text-center text-muted py-4">
                      <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                      No blocked selections found
                    </td>
                  </tr>
                  <tr
                    v-for="selection in selections"
                    :key="selection.selection_id"
                    :class="{ 'table-active': selectedSelectionId === selection.selection_id }"
                    @click="selectSelection(selection.selection_id)"
                    style="cursor: pointer;"
                  >
                    <td class="text-center">
                      <input
                        class="form-check-input"
                        type="radio"
                        name="selection-radio"
                        :value="selection.selection_id"
                        v-model="selectedSelectionId"
                        @change="selectSelection(selection.selection_id)"
                      >
                    </td>
                    <td class="fw-medium">{{ selection.selection_id }}</td>
                    <td>{{ selection.event_title || 'N/A' }}</td>
                    <td><code>{{ selection.event_id }}</code></td>
                    <td>{{ selection.username }}</td>
                    <td class="text-center">
                      <span class="selection-status status-blocked">
                        <i class="bi bi-lock-fill me-1"></i>Blocked
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row mb-4">
      <div class="col">
        <h5 class="mb-3">Directory Path</h5>
        <div
          class="directory-picker"
          :class="{ active: directoryPath }"
          @click="browseDirectory"
        >
          <i class="bi bi-folder2-open fs-1 d-block mb-2"></i>
          <span v-if="directoryPath">
            <strong>{{ extractDirectoryName(directoryPath) }}</strong><br>
            <small class="text-muted">{{ directoryPath }}</small>
          </span>
          <span v-else class="text-muted">Click to choose a directory</span>
        </div>
      </div>
    </div>

    <div class="row mb-4">
      <div class="col text-end">
        <button
          class="btn btn-dark submit-btn"
          :disabled="!selectedSelectionId || !directoryPath.trim() || isSubmitting"
          @click="submitSelection"
        >
          <span v-if="isSubmitting">
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            Processing...
          </span>
          <span v-else>
            <i class="bi bi-check-circle me-2"></i>
            Process Selection
          </span>
        </button>
      </div>
    </div>

    <div class="row" v-if="message">
      <div class="col">
        <div class="alert" :class="success ? 'alert-success' : 'alert-danger'" role="alert">
          <i :class="success ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-triangle-fill'" class="me-2"></i>
          {{ message }}
        </div>
      </div>
    </div>

    <div class="row" v-if="selectedSelectionId">
      <div class="col">
        <div class="card bg-light">
          <div class="card-body">
            <h6 class="card-title">
              <i class="bi bi-info-circle me-2"></i>
              Selection Summary
            </h6>
            <div class="row">
              <div class="col-md-6">
                <strong>Selected:</strong> {{ getSelectedSelection()?.selection_id }}
              </div>
              <div class="col-md-6">
                <strong>Directory:</strong> {{ extractDirectoryName(directoryPath) || 'Not chosen' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
