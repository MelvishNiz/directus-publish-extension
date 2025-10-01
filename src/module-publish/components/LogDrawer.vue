<template>
	<v-drawer
		v-model="show"
		persistent
		:title="siteName"
		subtitle="Viewing Build Log"
		icon="text_snippet"
		@cancel="$emit('close')"
	>
		<div class="drawer-content">
			<p><strong>Status:</strong> {{ status }}</p>
			<p><strong>Last Updated:</strong> {{ timestamp }}</p>
			<br />
			<p><strong>Log:</strong></p>
			<div v-if="log" class="log">
				<pre><code>{{ log }}</code></pre>
			</div>
			<v-progress-linear v-else indeterminate />
		</div>
	</v-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount, inject } from "vue";
import config from "../../config";
import { getSiteStatus } from "../settings";

interface Site {
	[key: string]: any;
}

const props = defineProps<{
	show: boolean;
	site: Site;
}>();

const emit = defineEmits<{
	(e: "close"): void;
}>();

// Inject API from Directus
const api = inject("api") as any;

const status = ref("...");
const timestamp = ref("...");
const log = ref<string | undefined>();
let interval: ReturnType<typeof setInterval> | undefined;

const siteName = computed(() => props.site?.[config.keys.name] ?? "");

watch(
	() => props.site,
	(site) => {
		// Reset state
		status.value = "...";
		timestamp.value = "...";
		log.value = undefined;

		if (site) {
			if (interval) clearInterval(interval);

			interval = setInterval(async () => {
				getSiteStatus(api, site[config.keys.id], (resp: any) => {
					status.value = resp?.status ?? "Unknown";
					timestamp.value = resp?.timestamp
						? new Date(parseInt(resp.timestamp)).toLocaleString()
						: "Unknown";
					log.value = resp?.log ?? "Unknown";
				});
			}, 1000);
		} else {
			if (interval) clearInterval(interval);
		}
	},
	{ immediate: true, deep: true }
);

onBeforeUnmount(() => {
	if (interval) clearInterval(interval);
});
</script>

<style scoped>
.drawer-content {
	padding: 10px 32px;
}
.log {
	overflow-y: scroll;
	max-height: 400px;
	font-family: monospace;
	background-color: var(--background-inverted);
	color: var(--foreground-inverted);
	padding: 5px 15px;
}
</style>
