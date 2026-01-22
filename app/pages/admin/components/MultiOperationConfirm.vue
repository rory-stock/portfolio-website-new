<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="emit('cancel')"
      >
        <div
          class="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between border-b border-neutral-800 p-6"
          >
            <h3 class="text-xl font-bold text-neutral-100">
              {{ confirmation.title }}
            </h3>
            <button
              @click="emit('cancel')"
              class="cursor-pointer text-2xl text-neutral-400 transition-colors duration-200 hover:text-neutral-200 focus:outline-0"
              aria-label="Close modal"
            >
              <Icon name="cross" :size="20" />
            </button>
          </div>

          <!-- Content -->
          <div class="space-y-4 p-6">
            <!-- Warnings -->
            <div
              v-if="warnings.length > 0"
              class="rounded-lg border border-amber-500/50 bg-amber-950/30 p-4"
            >
              <div class="flex items-start gap-3">
                <Icon name="info" :size="20" class="shrink-0 text-amber-400" />
                <ul class="space-y-1 text-sm text-amber-200">
                  <li v-for="(warning, idx) in warnings" :key="idx">
                    {{ warning }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- Message -->
            <p class="text-neutral-300">{{ confirmation.message }}</p>

            <!-- Preview (thumbnails) - max 12 images -->
            <div
              v-if="selectedImages.length > 0"
              class="grid grid-cols-4 gap-2 md:grid-cols-6"
            >
              <NuxtPicture
                v-for="img in previewImages"
                :key="img.id"
                :src="img.r2_path"
                :alt="img.alt || 'Preview'"
                class="aspect-square overflow-hidden rounded"
                :img-attrs="{ class: 'h-full w-full object-cover' }"
              />
              <div
                v-if="selectedImages.length > 12"
                class="flex aspect-square items-center justify-center rounded bg-neutral-800 text-sm text-neutral-400"
              >
                +{{ selectedImages.length - 12 }}
              </div>
            </div>

            <!-- Actions -->
            <div
              class="flex flex-col gap-2 border-t border-neutral-800 pt-4 md:flex-row md:justify-end"
            >
              <AppButton
                variant="secondary"
                @click="emit('cancel')"
                :disabled="isExecuting"
              >
                Cancel
              </AppButton>
              <AppButton
                :variant="action.variant"
                @click="emit('confirm')"
                :loading="isExecuting"
                :disabled="isExecuting"
              >
                <template #loading>Processing...</template>
                {{ confirmation.confirmLabel }}
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { MultiAction } from "~~/types/multiActions";
import type { DisplayImage } from "~~/types/imageTypes";

const props = defineProps<{
  open: boolean;
  action: MultiAction;
  selectedImages: DisplayImage[];
  warnings: string[];
  confirmation: {
    title: string;
    message: string;
    confirmLabel: string;
  };
  isExecuting: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

// Show max 12 preview images
const previewImages = computed(() => props.selectedImages.slice(0, 12));
</script>
