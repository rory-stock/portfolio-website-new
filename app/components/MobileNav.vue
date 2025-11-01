<script setup lang="ts">
const isOpen = ref(false);
const route = useRoute();

watch(
  () => route.path,
  () => {
    isOpen.value = false;
  }
);

//--------- STOP SCROLLING BODY WHEN MENU IS OPEN ---------//
watch(isOpen, (open) => {
  document.body.style.overflow = open ? "hidden" : "auto";
});
//-------------------------------------------------------//
</script>

<template>
  <div class="md:hidden">
    <div @click="isOpen = !isOpen" class="pr-3">
      <Hamburger :isOpen="isOpen" />
    </div>
    <MobileMenu :isOpen="isOpen" />
  </div>
</template>
