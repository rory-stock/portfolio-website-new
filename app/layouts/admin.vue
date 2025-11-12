<template>
  <main class="flex h-screen gap-4 bg-neutral-900">
    <AdminSidebar />
    <div
      class="my-2 mr-2 w-full rounded-2xl overflow-scroll border-neutral-900 bg-neutral-980 p-4"
    >
      <slot />
    </div>
  </main>
</template>
