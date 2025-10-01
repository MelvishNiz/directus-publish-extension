<template>
	<Message :title="title" :subtitle="message" icon="error" type="danger" />
</template>

<script setup lang="ts">
import Message from './message.vue';

defineProps<{
	title: string;
	message: string;
}>();
</script>
