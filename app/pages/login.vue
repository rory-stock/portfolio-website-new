<script setup lang="ts">
import { reloadNuxtApp } from "#app";

definePageMeta({
  layout: "login",
});

useHead({
  title: "Login",
});

const { loggedIn, clear } = useUserSession();
const credentials = reactive({
  email: "",
  password: "",
});

async function login() {
  try {
    await $fetch("/api/login", {
      method: "POST",
      body: credentials,
    });

    reloadNuxtApp({ path: "/admin" });
  } catch {
    alert("Login failed");
  }
}

async function logout() {
  try {
    await $fetch("/api/logout", { method: "POST" });
    await clear();
    await navigateTo("/");
  } catch {
    alert("Logout failed");
  }
}
</script>

<template>
  <div>
    <!-- Centered login page container -->
    <div class="flex justify-center py-32">
      <div class="flex flex-col gap-3">
        <!-- Login form - prevents default submit and calls login method -->
        <form
          v-if="!loggedIn"
          @submit.prevent="login"
          class="flex flex-col gap-4 rounded-lg border border-neutral-700 bg-neutral-900 p-8"
        >
          <h1 class="text-lg text-neutral-100 select-none">
            Login to your account
          </h1>

          <!-- Email input field -->
          <div class="flex flex-col gap-1">
            <label
              for="form-email"
              class="text-base text-neutral-100 select-none"
              >Username</label
            >
            <input
              id="form-email"
              v-model="credentials.email"
              type="email"
              placeholder="user@example.com"
              class="w-fit rounded border border-neutral-700 bg-neutral-800 py-1 pl-1 text-sm font-light text-neutral-300 focus:border-neutral-600 focus:outline-none"
            />
          </div>

          <!-- Password input field -->
          <div class="flex flex-col gap-1">
            <label
              for="form-password"
              class="text-base text-neutral-100 select-none"
              >Password</label
            >
            <input
              id="form-password"
              v-model="credentials.password"
              type="password"
              class="w-fit rounded border border-neutral-700 bg-neutral-800 py-1 pl-1 text-sm font-light text-neutral-300 focus:border-neutral-600 focus:outline-none"
            />
          </div>

          <!-- Submit button -->
          <AppButton type="submit" class="w-full rounded-lg py-1.5">
            Login
          </AppButton>
        </form>

        <div
          v-else
          class="flex flex-col gap-4 rounded-lg border border-neutral-800 p-8"
        >
          <h1 class="text-2xl font-semibold text-neutral-100 select-none">
            Already Logged In
          </h1>
        </div>

        <!-- Action buttons below form -->
        <div class="flex gap-4">
          <!-- Logout button - only shown when user is logged in -->
          <AppButton
            v-if="loggedIn"
            @click="logout"
            class="w-full rounded-lg py-1.5"
          >
            Logout
          </AppButton>
          <!-- Home navigation button -->
          <AppButton @click="navigateTo('/')" class="w-full rounded-lg py-1.5">
            Home
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
