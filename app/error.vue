<script setup lang="ts">
import { reloadNuxtApp } from "#app";
import { logger } from "~/utils/logger";
import RecoveryHint from "~/components/error/RecoveryHint.vue";
import TechnicalDetails from "~/components/error/TechnicalDetails.vue";

const props = defineProps({
  error: Object as PropType<{
    statusCode?: number;
    statusMessage?: string;
    message?: string;
    stack?: string;
    url?: string;
  }>,
});

const route = useRoute();
const {
  isAdminPage,
  loggedIn,
  getSuggestedPage,
  getErrorMessage,
  buildActions,
} = useErrorPage();

const pageClass = computed(() =>
  isAdminPage.value ? "flex flex-col" : "flex"
);

// Error details
const statusCode = computed(() => props.error?.statusCode || 500);
const statusMessage = computed(() => props.error?.statusMessage || "");
const errorMessage = computed(() =>
  getErrorMessage(statusCode.value, props.error?.message)
);

const errorTitle = computed(() => {
  if (statusCode.value === 404) return "Page not found";
  if (statusCode.value === 403) return "Access Denied";
  if (statusCode.value >= 500) return "Something went wrong";
  return "Unexpected Error";
});

// Stack trace
const showTechnicalDetails = ref(false);
const stackTrace = computed(() => {
  if (!props.error?.stack) return [];
  const lines = props.error.stack.split("\n");
  return lines.slice(0, 8);
});

// Recovery
const suggestedPage = computed(() => {
  if (statusCode.value === 404) {
    return getSuggestedPage(route.path);
  }
  return null;
});

// Email report
const reportEmailSubject = computed(
  () => `Error Report: ${statusCode.value} on ${route.path}`
);

const reportEmailBody = computed(() => {
  const timestamp = new Date().toISOString();
  return `
Hey Rory,

I encountered an error on your site:

Error: ${statusCode.value} - ${errorMessage.value}
Page: ${route.fullPath}
Time: ${timestamp}

[Add any additional details here]

Cheers!
  `.trim();
});

const reportEmail = computed(
  () =>
    `mailto:hello@rorystock.com?subject=${encodeURIComponent(reportEmailSubject.value)}&body=${encodeURIComponent(reportEmailBody.value)}`
);

// Logging
onMounted(() => {
  logger.error("Error page rendered", {
    statusCode: statusCode.value,
    message: errorMessage.value,
    path: route.fullPath,
    isAdmin: isAdminPage.value,
    user: loggedIn.value ? "Admin" : "Guest",
    timestamp: new Date().toISOString(),
  });
});

// Action handlers
function handleGoBack() {
  window.history.back();
}

function handleRetry() {
  reloadNuxtApp({ path: route.fullPath });
}

function handleGoHome() {
  navigateTo("/");
}

function handleGoAdmin() {
  navigateTo("/admin");
}

function handleReportIssue() {
  window.location.href = reportEmail.value;
}

// Build actions
const actions = computed(() =>
  buildActions(statusCode.value, isAdminPage.value && loggedIn.value, {
    goBack: handleGoBack,
    retry: handleRetry,
    goHome: handleGoHome,
    goAdmin: handleGoAdmin,
    reportIssue: handleReportIssue,
  })
);
</script>

<template>
  <div :class="pageClass">
    <!-- Public Error -->
    <div
      v-if="!isAdminPage || !loggedIn"
      class="mt-8 flex min-h-screen flex-col items-start bg-white px-6 selection:bg-black selection:text-white md:px-12 lg:px-24"
    >
      <div class="flex w-full flex-col justify-center">
        <ErrorHeader
          :status-code="statusCode"
          :title="errorTitle"
          :message="errorMessage"
        >
          <RecoveryHint v-if="suggestedPage" :suggested-page="suggestedPage" />
        </ErrorHeader>

        <ErrorActions :actions="actions" />
      </div>
    </div>

    <!-- Admin Error -->
    <NuxtLayout v-else name="admin">
      <div
        class="mt-8 flex min-h-screen flex-col items-start justify-center px-6 py-12 md:px-12"
      >
        <div>
          <ErrorHeader
            :status-code="statusCode"
            :title="errorTitle"
            :message="errorMessage"
            is-dark
          >
            <RecoveryHint
              v-if="suggestedPage"
              :suggested-page="suggestedPage"
              is-dark
            />

            <TechnicalDetails
              v-model="showTechnicalDetails"
              :status-code="statusCode"
              :status-message="statusMessage"
              :full-path="route.fullPath"
              :stack-trace="stackTrace"
              :is-logged-in="!!loggedIn"
            />
          </ErrorHeader>

          <ErrorActions :actions="actions" is-dark />
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>
