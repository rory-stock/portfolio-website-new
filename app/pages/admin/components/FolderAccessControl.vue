<script setup lang="ts">
import { formatDateShort } from "~/utils/format";

interface AccessEmail {
  id: number;
  email: string;
  accessed_at: Date;
  created_at: Date;
}

const props = defineProps<{
  folderId: number;
  isPrivateLink: boolean;
  privateLinkToken: string | null;
  accessCode: string | null;
  requireEmail: boolean;
}>();

const emit = defineEmits<{
  updated: [];
}>();

const { success, error: showError } = useToast();

const saving = ref(false);
const showAccessCode = ref(false);
const localAccessCode = ref(props.accessCode || "");
const emails = ref<AccessEmail[]>([]);
const emailCount = ref<number | null>(null);
const loadingEmails = ref(false);
const showEmails = ref(false);

// Sync local access code when prop changes
watch(
  () => props.accessCode,
  (val) => {
    localAccessCode.value = val || "";
  }
);

// Fetch email count on mount if email gate is enabled
onMounted(async () => {
  if (props.requireEmail) {
    await fetchEmails();
  }
});

async function fetchEmails() {
  loadingEmails.value = true;
  try {
    const data = await $fetch<{ emails: AccessEmail[]; total: number }>(
      `/api/folders/${props.folderId}/access-emails`
    );
    emails.value = data.emails;
    emailCount.value = data.total;
  } catch {
    emails.value = [];
    emailCount.value = null;
  } finally {
    loadingEmails.value = false;
  }
}

async function updateAccess(body: Record<string, unknown>) {
  saving.value = true;
  try {
    await $fetch(`/api/folders/${props.folderId}/access`, {
      method: "PATCH",
      body,
    });
    emit("updated");
    success("Access settings updated");
  } catch (err: any) {
    showError(err.data?.message || "Failed to update access settings");
  } finally {
    saving.value = false;
  }
}

async function togglePrivateLink() {
  await updateAccess({ is_private_link: !props.isPrivateLink });
}

async function regenerateToken() {
  const confirmed = window.confirm(
    "Regenerate the private link token? Any existing shared links will stop working."
  );
  if (!confirmed) return;

  await updateAccess({ regenerate_token: true });
}

async function saveAccessCode() {
  const code = localAccessCode.value.trim() || null;
  await updateAccess({ access_code: code });
}

async function clearAccessCode() {
  localAccessCode.value = "";
  await updateAccess({ access_code: null });
}

async function toggleEmailGate() {
  await updateAccess({ require_email: !props.requireEmail });
  if (!props.requireEmail) {
    await fetchEmails();
  }
}

function copyToken() {
  if (!props.privateLinkToken) return;
  navigator.clipboard.writeText(props.privateLinkToken);
  success("Token copied to clipboard");
}

function toggleEmailList() {
  showEmails.value = !showEmails.value;
}
</script>

<template>
  <div class="space-y-5 overflow-y-scroll max-h-125">
    <h3 class="text-sm font-medium text-neutral-300">Access Control</h3>

    <!-- Private Link -->
    <div
      class="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-neutral-200">Private link</p>
          <p class="text-xs text-neutral-500">
            Only accessible via URL with access token
          </p>
        </div>
        <button
          type="button"
          class="relative h-5 w-9 cursor-pointer rounded-full transition-colors"
          :class="isPrivateLink ? 'bg-blue-500' : 'bg-neutral-700'"
          :disabled="saving"
          @click="togglePrivateLink"
        >
          <span
            class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
            :class="{ 'translate-x-4': isPrivateLink }"
          />
        </button>
      </div>

      <!-- Token display (when enabled) -->
      <div v-if="isPrivateLink && privateLinkToken" class="space-y-2">
        <div
          class="flex items-center gap-2 rounded border border-neutral-700 bg-neutral-950 px-3 py-2"
        >
          <code class="flex-1 text-xs text-neutral-300 select-all">
            {{ privateLinkToken }}
          </code>
          <AppButton
            variant="secondary-simple"
            text-size="sm"
            @click="copyToken"
          >
            Copy
          </AppButton>
        </div>
        <AppButton
          variant="danger-simple"
          text-size="sm"
          :disabled="saving"
          @click="regenerateToken"
        >
          Regenerate token
        </AppButton>
      </div>
    </div>

    <!-- Access Code -->
    <div
      class="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
    >
      <div>
        <p class="text-sm text-neutral-200">Access code</p>
        <p class="text-xs text-neutral-500">
          Visitor must enter this code to view content
        </p>
      </div>

      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <input
            v-model="localAccessCode"
            :type="showAccessCode ? 'text' : 'password'"
            class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 pr-16 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
            placeholder="Enter access code"
          />
          <button
            type="button"
            class="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-xs text-neutral-500 hover:text-neutral-300"
            @click="showAccessCode = !showAccessCode"
          >
            {{ showAccessCode ? "Hide" : "Show" }}
          </button>
        </div>
      </div>

      <div class="flex gap-2">
        <AppButton
          variant="primary"
          text-size="sm"
          class="py-1"
          :disabled="saving || localAccessCode.trim() === (accessCode || '')"
          @click="saveAccessCode"
        >
          Save code
        </AppButton>
        <AppButton
          v-if="accessCode"
          variant="danger-simple"
          text-size="sm"
          class="py-1"
          :disabled="saving"
          @click="clearAccessCode"
        >
          Clear
        </AppButton>
      </div>
    </div>

    <!-- Email Gate -->
    <div
      class="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-neutral-200">Email gate</p>
          <p class="text-xs text-neutral-500">
            Visitor must enter their email before viewing
          </p>
        </div>
        <button
          type="button"
          class="relative h-5 w-9 cursor-pointer rounded-full transition-colors"
          :class="requireEmail ? 'bg-blue-500' : 'bg-neutral-700'"
          :disabled="saving"
          @click="toggleEmailGate"
        >
          <span
            class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
            :class="{ 'translate-x-4': requireEmail }"
          />
        </button>
      </div>

      <!-- Email list (when enabled) -->
      <div v-if="requireEmail">
        <button
          type="button"
          class="flex w-full cursor-pointer items-center justify-between text-xs text-neutral-500 hover:text-neutral-300"
          @click="toggleEmailList"
        >
          <span v-if="loadingEmails">Loading...</span>
          <span v-else-if="emailCount !== null">
            {{ emailCount }} email{{ emailCount !== 1 ? "s" : "" }} collected
          </span>
          <Icon
            name="chevron"
            :size="16"
            class="transition-transform duration-200"
            :class="{ 'rotate-180': showEmails }"
          />
        </button>

        <Transition name="dropdown">
          <div
            v-if="showEmails && emails.length > 0"
            class="mt-3 max-h-44 lg:max-h-48 space-y-1 overflow-y-scroll rounded border border-neutral-800 bg-neutral-950 p-2"
          >
            <div
              v-for="entry in emails"
              :key="entry.id"
              class="flex items-center justify-between px-2 py-1.5 text-xs"
            >
              <span class="truncate text-neutral-200">{{ entry.email }}</span>
              <span class="shrink-0 pl-3 text-neutral-600">
                {{ formatDateShort(entry.accessed_at) }}
              </span>
            </div>
          </div>
        </Transition>

        <p
          v-if="showEmails && !loadingEmails && emails.length === 0"
          class="mt-2 text-xs text-neutral-600"
        >
          No emails collected yet.
        </p>
      </div>
    </div>
  </div>
</template>
