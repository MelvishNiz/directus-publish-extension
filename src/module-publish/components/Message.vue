<template>
	<div class="container">
		<v-info :icon="icon" :title="title" :type="type">
			{{ subtitle }}
		</v-info>

		<br />

		<v-notice v-if="$slots.default" type="info">
			<slot />
		</v-notice>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	title: string;
	subtitle?: string;
	icon?: string;
	type?: string;
}>();
</script>

<style scoped>
.container {
	max-width: 500px;
	margin: 25px auto;
	text-align: center;
}
</style>
