import { computed, reactive, ref } from "vue";
import { formatFileSize } from "~/utils/formatFileSize";
import { formatMimeType, getValidImageFormats } from "~/utils/formatMimeType";
import { FILE_CONSTRAINTS, VALID_IMAGE_TYPES } from "~/utils/constants";

const FILENAME_REGEX = /^[a-zA-Z0-9\-\.]+$/;

// Custom Error Class
export class UploadError extends Error {
  constructor(
    message: string,
    public code: "VALIDATION" | "NETWORK" | "SERVER" | "CANCELLED",
    public file?: File
  ) {
    super(message);
    this.name = "UploadError";
  }
}

// Types
export type FileStatus =
  | "pending"
  | "uploading"
  | "success"
  | "error"
  | "cancelled";

export interface UploadFile {
  id: string;
  file: File | null;
  fileName: string; // Store separately for display after file is cleared
  fileSize: number; // Store separately for display after file is cleared
  status: FileStatus;
  progress: number;
  error?: string;
  isLargeFile: boolean;
  retryCount: number;
}

export interface InvalidFile {
  file: File;
  reasons: string[];
}

interface FileUploadState {
  files: UploadFile[];
  invalidFiles: InvalidFile[];
  isUploading: boolean;
  isCancelling: boolean;
  progress: {
    completed: number;
    total: number;
    bytes: {
      uploaded: number;
      total: number;
    };
  };
  summary: {
    succeeded: number;
    failed: number;
    cancelled: number;
  } | null;
}

interface UseFileUploadOptions {
  context: string;
  onComplete?: (imageIds: number[]) => void;
  maxConcurrent?: number;
  maxRetries?: number;
}

export function useFileUpload(options: UseFileUploadOptions) {
  const { context, onComplete, maxConcurrent = 3, maxRetries = 2 } = options;

  // State
  const state = reactive<FileUploadState>({
    files: [],
    invalidFiles: [],
    isUploading: false,
    isCancelling: false,
    progress: {
      completed: 0,
      total: 0,
      bytes: {
        uploaded: 0,
        total: 0,
      },
    },
    summary: null,
  });

  const abortController = ref<AbortController | null>(null);
  const uploadStartTime = ref<number>(0);

  // Computed
  const hasInvalidFiles = computed(() => state.invalidFiles.length > 0);
  const hasValidFiles = computed(() => state.files.length > 0);
  const canUpload = computed(() => hasValidFiles.value && !state.isUploading);

  const overallProgress = computed(() => {
    if (state.progress.total === 0) return 0;
    return Math.round((state.progress.completed / state.progress.total) * 100);
  });

  const bytesProgress = computed(() => {
    if (state.progress.bytes.total === 0) return 0;
    return Math.round(
      (state.progress.bytes.uploaded / state.progress.bytes.total) * 100
    );
  });

  const uploadSpeed = computed(() => {
    if (!state.isUploading || uploadStartTime.value === 0) return 0;
    const elapsedSeconds = (Date.now() - uploadStartTime.value) / 1000;
    if (elapsedSeconds === 0) return 0;
    return state.progress.bytes.uploaded / elapsedSeconds; // bytes per second
  });

  const estimatedTimeRemaining = computed(() => {
    if (uploadSpeed.value === 0) return 0;
    const remainingBytes =
      state.progress.bytes.total - state.progress.bytes.uploaded;
    return Math.ceil(remainingBytes / uploadSpeed.value); // seconds
  });

  const hasLargeFiles = computed(() => state.files.some((f) => f.isLargeFile));

  /**
   * Validate a single file
   */
  function validateFile(file: File): string[] {
    const reasons: string[] = [];

    // Check file size
    if (file.size > FILE_CONSTRAINTS.MAX_FILE_SIZE) {
      reasons.push(
        `File too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(FILE_CONSTRAINTS.MAX_FILE_SIZE)}`
      );
    }

    // Check file type
    if (!VALID_IMAGE_TYPES.includes(file.type as any)) {
      reasons.push(
        `Invalid file type (${formatMimeType(file.type)}). Only ${getValidImageFormats()} allowed`
      );
    }

    // Check filename
    if (!FILENAME_REGEX.test(file.name)) {
      reasons.push(
        "Invalid filename. Only letters, numbers, hyphens, and dots allowed"
      );
    }

    return reasons;
  }

  /**
   * Process and validate selected files
   */
  function selectFiles(files: File[]) {
    // Reset state
    state.files = [];
    state.invalidFiles = [];
    state.summary = null;
    state.progress.bytes = { uploaded: 0, total: 0 };

    const validFiles: UploadFile[] = [];
    const invalidFiles: InvalidFile[] = [];

    files.forEach((file) => {
      const reasons = validateFile(file);

      if (reasons.length > 0) {
        invalidFiles.push({ file, reasons });
      } else {
        validFiles.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          fileName: file.name,
          fileSize: file.size,
          status: "pending",
          progress: 0,
          isLargeFile: file.size > FILE_CONSTRAINTS.LARGE_FILE_THRESHOLD,
          retryCount: 0,
        });
      }
    });

    state.files = validFiles;
    state.invalidFiles = invalidFiles;

    // Calculate total bytes
    state.progress.bytes.total = validFiles.reduce(
      (sum, f) => sum + f.fileSize,
      0
    );
  }

  /**
   * Clear invalid files alert
   */
  function clearInvalidFiles() {
    state.invalidFiles = [];
  }

  /**
   * Skip invalid files and start the upload with valid files only
   */
  async function skipInvalidAndUpload() {
    state.invalidFiles = [];
    if (state.files.length > 0) {
      await startUpload();
    }
  }

  /**
   * Upload a single file through the 3-step process with retry logic
   */
  async function uploadSingleFile(uploadFile: UploadFile): Promise<number[]> {
    uploadFile.status = "uploading";
    uploadFile.progress = 0;

    try {
      // Step 1: Get presigned URL
      const urlResponse = await $fetch("/api/images/upload-url", {
        method: "POST",
        body: {
          filename: uploadFile.fileName,
          context,
          fileSize: uploadFile.fileSize,
        },
        signal: abortController.value?.signal,
      });

      const { uploadUrl, r2_path } = urlResponse as {
        uploadUrl: string;
        r2_path: string;
      };

      // Step 2: Upload to R2 with progress tracking
      let previousLoaded = 0;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            uploadFile.progress = Math.round((e.loaded / e.total) * 100);

            // Update total bytes uploaded
            const byteDiff = e.loaded - previousLoaded;
            state.progress.bytes.uploaded += byteDiff;
            previousLoaded = e.loaded;
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(
              new UploadError(
                `Upload failed with status ${xhr.status}`,
                "SERVER",
                uploadFile.file || undefined
              )
            );
          }
        });

        xhr.addEventListener("error", () => {
          reject(
            new UploadError(
              "Network error during upload",
              "NETWORK",
              uploadFile.file || undefined
            )
          );
        });

        xhr.addEventListener("abort", () => {
          reject(
            new UploadError(
              "Upload aborted",
              "CANCELLED",
              uploadFile.file || undefined
            )
          );
        });

        if (!uploadFile.file) {
          reject(new UploadError("File object is null", "VALIDATION"));
          return;
        }

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", uploadFile.file.type);
        xhr.send(uploadFile.file);

        // Store xhr for potential cancellation
        if (abortController.value?.signal) {
          abortController.value.signal.addEventListener("abort", () => {
            xhr.abort();
          });
        }
      });

      // Step 3: Confirm upload
      const confirmResponse = await $fetch("/api/images/confirm", {
        method: "POST",
        body: {
          r2_path,
          context,
          alt: "",
        },
        signal: abortController.value?.signal,
      });

      const { images } = confirmResponse as { images: Array<{ id: number }> };
      uploadFile.status = "success";
      uploadFile.progress = 100;

      return images.map((img) => img.id);
    } catch (error: any) {
      // Check if it was a cancellation
      if (error.name === "AbortError" || error.code === "CANCELLED") {
        uploadFile.status = "cancelled";
        throw error;
      }

      // Retry logic for network/server errors
      if (
        uploadFile.retryCount < maxRetries &&
        (error.code === "NETWORK" || error.code === "SERVER")
      ) {
        uploadFile.retryCount++;

        // Exponential backoff: 1s, 2s, 4s...
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, uploadFile.retryCount - 1))
        );

        // Reset progress for retry
        uploadFile.progress = 0;

        return uploadSingleFile(uploadFile);
      }

      uploadFile.status = "error";
      uploadFile.error =
        error.data?.message || error.message || "Upload failed";
      throw error;
    }
  }

  /**
   * Start the upload process with parallel uploads
   */
  async function startUpload() {
    if (state.files.length === 0) return;

    state.isUploading = true;
    state.isCancelling = false;
    state.progress.completed = 0;
    state.progress.total = state.files.length;
    state.progress.bytes.uploaded = 0;
    state.summary = null;
    uploadStartTime.value = Date.now();

    abortController.value = new AbortController();

    const allImageIds: number[] = [];
    let succeeded = 0;
    let failed = 0;
    let cancelled = 0;

    // Parallel upload with concurrency limit
    const queue = [...state.files];
    const executing: Promise<void>[] = [];

    while (queue.length > 0 || executing.length > 0) {
      if (state.isCancelling) {
        // Mark all remaining files as cancelled
        queue.forEach((file) => {
          file.status = "cancelled";
          cancelled++;
          state.progress.completed++;
        });
        break;
      }

      // Start new uploads up to the concurrency limit
      while (
        queue.length > 0 &&
        executing.length < maxConcurrent &&
        !state.isCancelling
      ) {
        const file = queue.shift()!;

        const uploadPromise = uploadSingleFile(file)
          .then((imageIds) => {
            allImageIds.push(...imageIds);
            succeeded++;
          })
          .catch((error) => {
            if (file.status === "cancelled") {
              cancelled++;
            } else {
              failed++;
              logger.debug("File upload failed", {
                fileName: file.fileName,
                error,
              });
            }
          })
          .finally(() => {
            state.progress.completed++;

            // Clear file reference immediately after the upload completes
            file.file = null;

            const index = executing.indexOf(uploadPromise);
            if (index > -1) executing.splice(index, 1);
          });

        executing.push(uploadPromise);
      }

      // Wait for at least one to complete
      if (executing.length > 0) {
        await Promise.race(executing);
      }
    }

    state.isUploading = false;
    state.summary = { succeeded, failed, cancelled };
    uploadStartTime.value = 0;

    // Call onComplete callback if any files succeeded
    if (succeeded > 0 && onComplete) {
      onComplete(allImageIds);
    }
  }

  /**
   * Cancel the upload (abort current uploads, cancel rest)
   */
  function cancelUpload() {
    if (!state.isUploading) return;

    state.isCancelling = true;
    // Abort all current uploads immediately
    abortController.value?.abort();
  }

  /**
   * Clear completed uploads (success, error, cancelled) from the list
   */
  function clearCompleted() {
    const completedFiles = state.files.filter(
      (f) =>
        f.status === "success" ||
        f.status === "error" ||
        f.status === "cancelled"
    );

    // Release memory
    completedFiles.forEach((f) => {
      f.file = null;
    });

    // Remove from state
    state.files = state.files.filter(
      (f) => f.status === "pending" || f.status === "uploading"
    );

    // Reset summary if all cleared
    if (state.files.length === 0) {
      state.summary = null;
    }
  }

  /**
   * Reset to the initial state
   */
  function reset() {
    // Clear file references before clearing arrays
    state.files.forEach((f) => {
      f.file = null;
    });
    state.invalidFiles.forEach((f) => {
      f.file = null as any;
    });

    state.files = [];
    state.invalidFiles = [];
    state.isUploading = false;
    state.isCancelling = false;
    state.progress = {
      completed: 0,
      total: 0,
      bytes: { uploaded: 0, total: 0 },
    };
    state.summary = null;
    abortController.value = null;
    uploadStartTime.value = 0;
  }

  return {
    // State
    state,

    // Computed
    hasInvalidFiles,
    hasValidFiles,
    canUpload,
    overallProgress,
    bytesProgress,
    uploadSpeed,
    estimatedTimeRemaining,
    hasLargeFiles,

    // Methods
    selectFiles,
    startUpload,
    cancelUpload,
    clearInvalidFiles,
    skipInvalidAndUpload,
    clearCompleted,
    reset,
  };
}
