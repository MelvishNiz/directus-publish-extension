<template>
	<v-dialog v-model="showModel" persistent>
		<v-card>
			<v-card-title>{{ title }}</v-card-title>
			<v-card-text v-html="message"></v-card-text>
			<v-card-actions>
				<v-button outlined v-if="close" @click="$emit('close')">
					{{ close }}
				</v-button>
				<v-button v-if="action" @click="$emit('action')">
					{{ action }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
	show: boolean;
	title?: string;
	message?: string;
	close?: string;
	action?: string;
}>();

const emit = defineEmits<{
	(e: "close"): void;
	(e: "action"): void;
}>();

// buat v-model internal supaya reactive
const showModel = ref(props.show);

watch(
	() => props.show,
	(val) => (showModel.value = val)
);

watch(showModel, (val) => {
	if (!val) emit("close");
});
</script>
