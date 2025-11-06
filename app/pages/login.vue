<script setup lang="ts">
definePageMeta({
  layout: "login",
});

useHead({
  title: "Login",
});

const { loggedIn, user, fetch: refreshSession, clear } = useUserSession();
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

    // Refresh the session on client-side and redirect to the home page
    await refreshSession();
    await navigateTo("/");
    console.log("Logged in :)");
  } catch {
    alert("Bad credentials");
  }
}

async function logout() {
  try {
    await $fetch("/api/logout", { method: "POST" });
    await clear();
    await navigateTo("/");
    console.log("Logged out");
  } catch {
    alert("Error logging out");
  }
}
</script>

<template>
  <div class="px-auto flex justify-center py-32 align-middle">
    <div class="flex flex-col gap-4">
      <form
        @submit.prevent="login"
        class="flex flex-col gap-2 rounded-lg border border-neutral-800 p-8 font-sans"
      >
        <h1 class="mb-3 text-2xl font-semibold text-white select-none">
          Login
        </h1>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label for="form-email" class="text-base text-white select-none"
              >Username</label
            >
            <input
              id="form-email"
              v-model="credentials.email"
              type="email"
              placeholder="email"
              class="w-fit rounded border border-neutral-700 bg-neutral-900 py-1 pl-1 text-sm font-light text-neutral-300 focus:border-neutral-600 focus:outline-none"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label for="form-password" class="text-base text-white select-none"
              >Password</label
            >
            <input
              id="form-password"
              v-model="credentials.password"
              type="password"
              placeholder="password"
              class="w-fit rounded border border-neutral-700 bg-neutral-900 py-1 pl-1 text-sm font-light text-neutral-300 focus:border-neutral-600 focus:outline-none"
            />
          </div>

          <div class="mt-2 flex gap-4">
            <button
              type="submit"
              class="w-full cursor-pointer rounded-lg bg-white px-4 py-1.5 text-[0.95rem] text-black transition-opacity duration-200 hover:opacity-85"
            >
              Login
            </button>
          </div>
        </div>
      </form>
      <div class="flex gap-4">
      <button
        v-if="loggedIn"
        @click="logout"
        class="h-fit w-full cursor-pointer rounded-lg bg-white px-4 py-1.5 text-[0.95rem] text-black transition-opacity duration-200 hover:opacity-85"
      >
        Logout
      </button>
        <button
          @click="navigateTo('/')"
          class="h-fit w-full cursor-pointer rounded-lg bg-white px-4 py-1.5 text-[0.95rem] text-black transition-opacity duration-200 hover:opacity-85"
          >
          Home
        </button>
      </div>
    </div>
  </div>
</template>
