<script setup lang="ts">
const props = defineProps<{
  statusCode: number;
  statusMessage: string;
  fullPath: string;
  stackTrace: string[];
  isLoggedIn: boolean;
}>();

const showDetails = defineModel<boolean>({ required: true });

function toggleDetails() {
  showDetails.value = !showDetails.value;
}
</script>

<template>
  <div
    v-if="isLoggedIn"
    class="technical-details cursor-pointer space-y-3 rounded-lg border border-neutral-700 p-6 font-ibm-plex-sans transition-all duration-300 hover:bg-neutral-900"
    @click="toggleDetails"
  >
    <div
      class="flex w-full cursor-pointer items-center justify-between text-sm font-medium text-neutral-200 hover:text-neutral-100"
    >
      <div class="flex items-center gap-2">
        <Icon name="settings" :size="16" />
        Technical Details
      </div>
      <Icon
        name="chevron"
        :size="20"
        class="transition-transform duration-200"
        :class="{ 'rotate-180': showDetails }"
      />
    </div>

    <Transition name="dropdown">
      <div v-if="showDetails" class="space-y-2 pt-2">
        <div class="text-xs text-neutral-400">
          <p>
            <span class="font-medium">Status:</span>
            {{ statusCode }}
            {{ statusMessage ? `- ${statusMessage}` : "" }}
          </p>
          <p>
            <span class="font-medium">Path:</span>
            {{ fullPath }}
          </p>
          <p>
            <span class="font-medium">Time:</span>
            {{ new Date().toLocaleString() }}
          </p>
          <p>
            <span class="font-medium">User:</span>
            {{ isLoggedIn ? "Admin" : "Guest" }}
          </p>
        </div>

        <!-- Stack Trace -->
        <div v-if="stackTrace.length > 0" class="pt-2">
          <p class="mb-1 text-xs font-medium text-neutral-300">Stack Trace:</p>
          <pre
            class="overflow-x-auto rounded bg-neutral-900 p-2 text-xs text-neutral-400"
          ><code>{{ stackTrace.join('\n') }}</code></pre>
        </div>
      </div>
    </Transition>
  </div>
</template>
