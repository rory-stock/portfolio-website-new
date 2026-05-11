<script setup lang="ts">
const props = defineProps<{
  folderName: string;
  requiredGates: string[];
  folderId: number;
}>();

const emit = defineEmits<{
  verified: [];
}>();

const route = useRoute();

const email = ref("");
const accessCode = ref("");
const error = ref<string | null>(null);
const verifying = ref(false);

// Check if private_link token is in the URL
const urlToken = computed(() => (route.query.access as string) || "");

// Whether the only gate is private_link, and we have a token — auto-verify
const canAutoVerify = computed(() => {
  return (
    props.requiredGates.length === 1 &&
    props.requiredGates[0] === "private_link" &&
    urlToken.value.length > 0
  );
});

// Whether we need to show a form (any gate besides auto-verifiable private_link)
const needsForm = computed(() => {
  const nonTokenGates = props.requiredGates.filter((g) => g !== "private_link");
  return (
    nonTokenGates.length > 0 || (hasPrivateLinkGate.value && !urlToken.value)
  );
});

const hasPrivateLinkGate = computed(() =>
  props.requiredGates.includes("private_link")
);
const hasAccessCodeGate = computed(() =>
  props.requiredGates.includes("access_code")
);
const hasEmailGate = computed(() => props.requiredGates.includes("email"));

// Missing private link token — show message instead of form
const missingToken = computed(() => {
  return hasPrivateLinkGate.value && !urlToken.value;
});

const canSubmit = computed(() => {
  if (verifying.value) return false;
  if (hasAccessCodeGate.value && !accessCode.value.trim()) return false;
  return !(hasEmailGate.value && !email.value.trim());

});

async function verify() {
  verifying.value = true;
  error.value = null;

  try {
    const body: Record<string, unknown> = {
      folder_id: props.folderId,
    };

    if (urlToken.value) {
      body.token = urlToken.value;
    }

    if (hasAccessCodeGate.value && accessCode.value.trim()) {
      body.access_code = accessCode.value.trim();
    }

    if (hasEmailGate.value && email.value.trim()) {
      body.email = email.value.trim();
    }

    const response = await $fetch<{
      success: boolean;
      remaining_gates?: string[];
    }>("/api/access/verify", {
      method: "POST",
      body,
    });

    if (response.success) {
      emit("verified");
    } else if (response.remaining_gates?.length) {
      error.value = "Please complete all required fields";
    }
  } catch (err: any) {
    error.value = err.data?.message || "Verification failed";
  } finally {
    verifying.value = false;
  }
}

// Auto-verify if only gate is private_link with token in URL
onMounted(() => {
  if (canAutoVerify.value) {
    verify();
  }
});
</script>

<template>
  <div class="w-full max-w-sm px-6">
    <div class="text-center">
      <h1
        class="font-lausanne-500 text-2xl tracking-tight text-black uppercase"
      >
        {{ folderName }}
      </h1>
    </div>

    <!-- Missing private link token -->
    <div
      v-if="missingToken && !hasAccessCodeGate && !hasEmailGate"
      class="mt-6"
    >
      <p class="text-center text-sm text-neutral-500">
        This gallery requires a private access link.
      </p>
    </div>

    <!-- Auto-verifying -->
    <div v-else-if="canAutoVerify && verifying" class="mt-6">
      <p class="text-center text-sm text-neutral-500">Verifying access...</p>
    </div>

    <!-- Gate form -->
    <div v-else-if="needsForm" class="mt-6 space-y-4">
      <!-- Error -->
      <div
        v-if="error"
        class="rounded border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-600"
      >
        {{ error }}
      </div>

      <!-- Missing token warning (when other gates also exist) -->
      <p v-if="missingToken" class="text-center text-xs text-neutral-400">
        This gallery requires a private access link. If you have one, use it to
        access this page.
      </p>

      <!-- Email input -->
      <div v-if="hasEmailGate">
        <label class="mb-1 block text-sm text-neutral-600">Email</label>
        <input
          v-model="email"
          type="email"
          class="w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
          placeholder="your@email.com"
          @keydown.enter="canSubmit && verify()"
        />
      </div>

      <!-- Access code input -->
      <div v-if="hasAccessCodeGate">
        <label class="mb-1 block text-sm text-neutral-600">Access code</label>
        <input
          v-model="accessCode"
          type="text"
          class="w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
          placeholder="Enter access code"
          @keydown.enter="canSubmit && verify()"
        />
      </div>

      <!-- Submit -->
      <button
        type="button"
        class="w-full cursor-pointer rounded bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!canSubmit"
        @click="verify"
      >
        {{ verifying ? "Verifying..." : "Continue" }}
      </button>
    </div>

    <!-- Auto-verify error fallback -->
    <div v-if="canAutoVerify && error" class="mt-4">
      <p class="text-center text-sm text-red-600">{{ error }}</p>
    </div>
  </div>
</template>
