<template>
	<Message :title="title" :subtitle="message" icon="error" type="danger" />
</template>

<script setup lang="ts">
import Message from "./Message.vue";

defineProps<{
	title: string;
	message: string;
}>();
</script>
